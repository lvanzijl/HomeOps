using System.Net;
using HomeOps.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.CalendarEvents.ICalendar;

public sealed class ICalFeedImporter(HomeOpsDbContext dbContext, HttpClient httpClient) : IICalFeedImporter
{
    private const int MaxRedirects = 5;

    public async Task<ICalFeedImportResult> ImportAsync(EventSource source, CancellationToken cancellationToken = default)
    {
        if (!string.Equals(source.SourceType, EventSourceTypes.ICalFeed, StringComparison.Ordinal))
        {
            return Failure(
                ICalFeedImportFailureCategory.InvalidConfiguration,
                "Event source is not an iCal Feed source.",
                Diagnostic(ICalendarParseDiagnosticSeverity.Error, "InvalidConfiguration", "Event source is not an iCal Feed source."));
        }

        var configuration = await dbContext.ICalFeedSourceConfigurations
            .AsNoTracking()
            .SingleOrDefaultAsync(config => config.EventSourceId == source.Id, cancellationToken);

        if (configuration is null || string.IsNullOrWhiteSpace(configuration.FeedUrl))
        {
            return Failure(
                ICalFeedImportFailureCategory.InvalidConfiguration,
                "iCal Feed source configuration is missing a feed URL.",
                Diagnostic(ICalendarParseDiagnosticSeverity.Error, "InvalidConfiguration", "iCal Feed source configuration is missing a feed URL."));
        }

        if (!Uri.TryCreate(configuration.FeedUrl, UriKind.Absolute, out var feedUri))
        {
            return Failure(
                ICalFeedImportFailureCategory.InvalidUrl,
                "iCal Feed URL is not a valid absolute URL.",
                Diagnostic(ICalendarParseDiagnosticSeverity.Error, "InvalidUrl", "iCal Feed URL is not a valid absolute URL."));
        }

        var providerMetadata = new ICalFeedProviderMetadata(source.Id, source.SourceType, source.ProviderSourceId, feedUri);

        if (!IsSupportedScheme(feedUri))
        {
            return Failure(
                ICalFeedImportFailureCategory.UnsupportedScheme,
                "iCal Feed URL must use HTTP or HTTPS.",
                Diagnostic(ICalendarParseDiagnosticSeverity.Error, "UnsupportedScheme", "iCal Feed URL must use HTTP or HTTPS."),
                providerMetadata);
        }

        try
        {
            var response = await SendWithRedirectsAsync(feedUri, configuration, cancellationToken);
            using var _ = response;
            var retrievalMetadata = BuildRetrievalMetadata(response, feedUri);

            if (response.StatusCode == HttpStatusCode.NotModified)
            {
                return ICalFeedImportResult.Success([], [], providerMetadata, retrievalMetadata);
            }

            if (!response.IsSuccessStatusCode)
            {
                return Failure(
                    MapStatusCode(response.StatusCode),
                    $"iCal Feed request failed with HTTP status {(int)response.StatusCode}.",
                    Diagnostic(ICalendarParseDiagnosticSeverity.Error, "HttpFailure", $"iCal Feed request failed with HTTP status {(int)response.StatusCode}."),
                    providerMetadata,
                    retrievalMetadata,
                    response.StatusCode);
            }

            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            if (string.IsNullOrWhiteSpace(content))
            {
                return Failure(
                    ICalFeedImportFailureCategory.InvalidContent,
                    "iCal Feed returned empty content.",
                    Diagnostic(ICalendarParseDiagnosticSeverity.Error, "InvalidContent", "iCal Feed returned empty content."),
                    providerMetadata,
                    retrievalMetadata,
                    response.StatusCode);
            }

            var parserResult = ICalendarParser.Parse(content);
            if (parserResult.HasErrors && parserResult.Events.Count == 0)
            {
                return Failure(
                    ICalFeedImportFailureCategory.ParseFailure,
                    "iCal Feed content could not be parsed into normalized events.",
                    parserResult.Diagnostics,
                    providerMetadata,
                    retrievalMetadata,
                    response.StatusCode);
            }

            return ICalFeedImportResult.Success(parserResult.Events, parserResult.Diagnostics, providerMetadata, retrievalMetadata);
        }
        catch (TaskCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return Failure(
                ICalFeedImportFailureCategory.Timeout,
                "iCal Feed request timed out.",
                Diagnostic(ICalendarParseDiagnosticSeverity.Error, "Timeout", "iCal Feed request timed out."),
                providerMetadata);
        }
        catch (HttpRequestException exception)
        {
            return Failure(
                ICalFeedImportFailureCategory.NetworkFailure,
                "iCal Feed request failed due to a network error.",
                Diagnostic(ICalendarParseDiagnosticSeverity.Error, "NetworkFailure", exception.Message),
                providerMetadata,
                httpStatusCode: exception.StatusCode);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            return Failure(
                ICalFeedImportFailureCategory.Unknown,
                "iCal Feed import failed unexpectedly.",
                Diagnostic(ICalendarParseDiagnosticSeverity.Error, "Unknown", exception.Message),
                providerMetadata);
        }
    }

    private async Task<HttpResponseMessage> SendWithRedirectsAsync(Uri feedUri, ICalFeedSourceConfiguration configuration, CancellationToken cancellationToken)
    {
        var currentUri = feedUri;
        for (var redirectCount = 0; redirectCount <= MaxRedirects; redirectCount++)
        {
            var request = new HttpRequestMessage(HttpMethod.Get, currentUri);
            AddConditionalHeaders(request, configuration);

            var response = await httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
            if (!IsRedirect(response.StatusCode))
            {
                return response;
            }

            var location = response.Headers.Location;
            response.Dispose();
            if (location is null)
            {
                return new HttpResponseMessage(HttpStatusCode.BadGateway)
                {
                    RequestMessage = request,
                    ReasonPhrase = "Redirect response did not include a Location header.",
                };
            }

            var nextUri = location.IsAbsoluteUri ? location : new Uri(currentUri, location);
            if (!IsSupportedScheme(nextUri))
            {
                return new HttpResponseMessage(HttpStatusCode.BadGateway)
                {
                    RequestMessage = request,
                    ReasonPhrase = "Redirect target used an unsupported scheme.",
                };
            }

            currentUri = nextUri;
        }

        return new HttpResponseMessage(HttpStatusCode.BadGateway)
        {
            RequestMessage = new HttpRequestMessage(HttpMethod.Get, currentUri),
            ReasonPhrase = "Too many iCal Feed redirects.",
        };
    }

    private static void AddConditionalHeaders(HttpRequestMessage request, ICalFeedSourceConfiguration configuration)
    {
        if (!string.IsNullOrWhiteSpace(configuration.ETag))
        {
            request.Headers.TryAddWithoutValidation("If-None-Match", configuration.ETag);
        }

        if (!string.IsNullOrWhiteSpace(configuration.LastModified))
        {
            request.Headers.TryAddWithoutValidation("If-Modified-Since", configuration.LastModified);
        }
    }

    private static ICalFeedRetrievalMetadata BuildRetrievalMetadata(HttpResponseMessage response, Uri feedUri)
    {
        return new ICalFeedRetrievalMetadata(
            response.StatusCode,
            feedUri,
            response.RequestMessage?.RequestUri,
            response.Headers.ETag?.Tag,
            response.Content.Headers.LastModified?.ToString("R"),
            response.Content.Headers.ContentType?.ToString(),
            response.Content.Headers.ContentLength,
            response.StatusCode == HttpStatusCode.NotModified);
    }

    private static bool IsSupportedScheme(Uri uri) =>
        string.Equals(uri.Scheme, Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase) ||
        string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase);

    private static bool IsRedirect(HttpStatusCode statusCode) =>
        statusCode is HttpStatusCode.Moved or HttpStatusCode.Redirect or HttpStatusCode.RedirectMethod or HttpStatusCode.TemporaryRedirect or HttpStatusCode.PermanentRedirect;

    private static ICalFeedImportFailureCategory MapStatusCode(HttpStatusCode statusCode) => statusCode switch
    {
        HttpStatusCode.Unauthorized => ICalFeedImportFailureCategory.Unauthorized,
        HttpStatusCode.Forbidden => ICalFeedImportFailureCategory.Forbidden,
        HttpStatusCode.NotFound => ICalFeedImportFailureCategory.NotFound,
        >= HttpStatusCode.InternalServerError => ICalFeedImportFailureCategory.ServerError,
        _ => ICalFeedImportFailureCategory.Unknown,
    };

    private static ICalFeedImportResult Failure(
        ICalFeedImportFailureCategory category,
        string message,
        ICalendarParseDiagnostic diagnostic,
        ICalFeedProviderMetadata? providerMetadata = null,
        ICalFeedRetrievalMetadata? retrievalMetadata = null,
        HttpStatusCode? httpStatusCode = null) =>
        Failure(category, message, [diagnostic], providerMetadata, retrievalMetadata, httpStatusCode);

    private static ICalFeedImportResult Failure(
        ICalFeedImportFailureCategory category,
        string message,
        IReadOnlyList<ICalendarParseDiagnostic> diagnostics,
        ICalFeedProviderMetadata? providerMetadata = null,
        ICalFeedRetrievalMetadata? retrievalMetadata = null,
        HttpStatusCode? httpStatusCode = null) =>
        ICalFeedImportResult.Failed(new ICalFeedImportFailure(category, message, httpStatusCode), diagnostics, providerMetadata, retrievalMetadata);

    private static ICalendarParseDiagnostic Diagnostic(ICalendarParseDiagnosticSeverity severity, string code, string message) =>
        new(severity, code, message);
}
