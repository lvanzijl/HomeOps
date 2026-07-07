using System.Net;
using HomeOps.Api.CalendarEvents;
using HomeOps.Api.CalendarEvents.ICalendar;
using HomeOps.Api.Data;
using HomeOps.Api.Households;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.Tests.CalendarEvents;

public sealed class ICalFeedImporterTests
{
    [Fact]
    public async Task SuccessfulHttpDownloadReturnsNormalizedSnapshotAndMetadata()
    {
        await using var context = CreateContext();
        var source = await AddFeedSourceAsync(context, "http://example.test/calendar.ics");
        var handler = new StubHttpMessageHandler(_ => IcsResponse(ValidCalendar("event-1"), "http://example.test/calendar.ics"));
        var importer = new ICalFeedImporter(context, new HttpClient(handler));

        var result = await importer.ImportAsync(source);

        Assert.True(result.Succeeded);
        Assert.Null(result.Failure);
        var normalizedEvent = Assert.Single(result.Events);
        Assert.Equal("event-1", normalizedEvent.ProviderEventId);
        Assert.Equal("Feed Event", normalizedEvent.Title);
        Assert.Equal(source.Id, result.ProviderMetadata?.EventSourceId);
        Assert.Equal(EventSourceTypes.ICalFeed, result.ProviderMetadata?.SourceType);
        Assert.Equal(HttpStatusCode.OK, result.RetrievalMetadata?.HttpStatusCode);
        Assert.Equal("http://example.test/calendar.ics", result.RetrievalMetadata?.FeedUri.ToString());
    }

    [Fact]
    public async Task RedirectIsFollowed()
    {
        await using var context = CreateContext();
        var source = await AddFeedSourceAsync(context, "http://example.test/old.ics");
        var handler = new StubHttpMessageHandler(
            request => RedirectResponse("/new.ics", request.RequestUri!),
            request => IcsResponse(ValidCalendar("redirected"), request.RequestUri!.ToString()));
        var importer = new ICalFeedImporter(context, new HttpClient(handler));

        var result = await importer.ImportAsync(source);

        Assert.True(result.Succeeded);
        Assert.Equal("redirected", Assert.Single(result.Events).ProviderEventId);
        Assert.Equal("http://example.test/new.ics", result.RetrievalMetadata?.FinalUri?.ToString());
        Assert.Collection(handler.Requests,
            first => Assert.Equal("http://example.test/old.ics", first.RequestUri?.ToString()),
            second => Assert.Equal("http://example.test/new.ics", second.RequestUri?.ToString()));
    }

    [Fact]
    public async Task HttpsDownloadIsSupported()
    {
        await using var context = CreateContext();
        var source = await AddFeedSourceAsync(context, "https://example.test/calendar.ics");
        var importer = new ICalFeedImporter(context, new HttpClient(new StubHttpMessageHandler(_ => IcsResponse(ValidCalendar("https-event"), "https://example.test/calendar.ics"))));

        var result = await importer.ImportAsync(source);

        Assert.True(result.Succeeded);
        Assert.Equal("https-event", Assert.Single(result.Events).ProviderEventId);
        Assert.Equal("https", result.ProviderMetadata?.FeedUri.Scheme);
    }

    [Fact]
    public async Task InvalidUrlReturnsStructuredFailure()
    {
        await using var context = CreateContext();
        var source = await AddFeedSourceAsync(context, "not a url");
        var importer = new ICalFeedImporter(context, new HttpClient(new StubHttpMessageHandler(_ => throw new InvalidOperationException("HTTP should not be called."))));

        var result = await importer.ImportAsync(source);

        Assert.False(result.Succeeded);
        Assert.Equal(ICalFeedImportFailureCategory.InvalidUrl, result.Failure?.Category);
        Assert.Contains(result.Diagnostics, diagnostic => diagnostic.Code == "InvalidUrl");
    }

    [Fact]
    public async Task UnsupportedSchemeReturnsStructuredFailure()
    {
        await using var context = CreateContext();
        var source = await AddFeedSourceAsync(context, "ftp://example.test/calendar.ics");
        var importer = new ICalFeedImporter(context, new HttpClient(new StubHttpMessageHandler(_ => throw new InvalidOperationException("HTTP should not be called."))));

        var result = await importer.ImportAsync(source);

        Assert.False(result.Succeeded);
        Assert.Equal(ICalFeedImportFailureCategory.UnsupportedScheme, result.Failure?.Category);
        Assert.Contains(result.Diagnostics, diagnostic => diagnostic.Code == "UnsupportedScheme");
    }

    [Theory]
    [InlineData(HttpStatusCode.Unauthorized, ICalFeedImportFailureCategory.Unauthorized)]
    [InlineData(HttpStatusCode.Forbidden, ICalFeedImportFailureCategory.Forbidden)]
    [InlineData(HttpStatusCode.NotFound, ICalFeedImportFailureCategory.NotFound)]
    [InlineData(HttpStatusCode.InternalServerError, ICalFeedImportFailureCategory.ServerError)]
    public async Task HttpErrorsReturnStructuredFailures(HttpStatusCode statusCode, ICalFeedImportFailureCategory expectedCategory)
    {
        await using var context = CreateContext();
        var source = await AddFeedSourceAsync(context, "https://example.test/calendar.ics");
        var importer = new ICalFeedImporter(context, new HttpClient(new StubHttpMessageHandler(request => new HttpResponseMessage(statusCode)
        {
            RequestMessage = request,
        })));

        var result = await importer.ImportAsync(source);

        Assert.False(result.Succeeded);
        Assert.Equal(expectedCategory, result.Failure?.Category);
        Assert.Equal(statusCode, result.Failure?.HttpStatusCode);
        Assert.Equal(statusCode, result.RetrievalMetadata?.HttpStatusCode);
    }

    [Fact]
    public async Task TimeoutReturnsStructuredFailure()
    {
        await using var context = CreateContext();
        var source = await AddFeedSourceAsync(context, "https://example.test/calendar.ics");
        var importer = new ICalFeedImporter(context, new HttpClient(new StubHttpMessageHandler(_ => throw new TaskCanceledException("timeout"))));

        var result = await importer.ImportAsync(source);

        Assert.False(result.Succeeded);
        Assert.Equal(ICalFeedImportFailureCategory.Timeout, result.Failure?.Category);
        Assert.Contains(result.Diagnostics, diagnostic => diagnostic.Code == "Timeout");
    }

    [Fact]
    public async Task NetworkFailureReturnsStructuredFailure()
    {
        await using var context = CreateContext();
        var source = await AddFeedSourceAsync(context, "https://example.test/calendar.ics");
        var importer = new ICalFeedImporter(context, new HttpClient(new StubHttpMessageHandler(_ => throw new HttpRequestException("network down"))));

        var result = await importer.ImportAsync(source);

        Assert.False(result.Succeeded);
        Assert.Equal(ICalFeedImportFailureCategory.NetworkFailure, result.Failure?.Category);
        Assert.Contains(result.Diagnostics, diagnostic => diagnostic.Code == "NetworkFailure");
    }

    [Fact]
    public async Task MalformedIcsReturnsParseFailureWithParserDiagnostics()
    {
        await using var context = CreateContext();
        var source = await AddFeedSourceAsync(context, "https://example.test/calendar.ics");
        var importer = new ICalFeedImporter(context, new HttpClient(new StubHttpMessageHandler(request => TextResponse("not a calendar", request.RequestUri!.ToString()))));

        var result = await importer.ImportAsync(source);

        Assert.False(result.Succeeded);
        Assert.Equal(ICalFeedImportFailureCategory.ParseFailure, result.Failure?.Category);
        Assert.Contains(result.Diagnostics, diagnostic => diagnostic.Code == "MalformedCalendar");
    }

    [Fact]
    public async Task ParserDiagnosticsArePreservedOnSuccessfulImport()
    {
        await using var context = CreateContext();
        var source = await AddFeedSourceAsync(context, "https://example.test/calendar.ics");
        var importer = new ICalFeedImporter(context, new HttpClient(new StubHttpMessageHandler(request => IcsResponse(CalendarWith("""
BEGIN:VEVENT
UID:complex-recurrence
SUMMARY:Complex
DTSTART:20260706T090000
DTEND:20260706T100000
RRULE:FREQ=WEEKLY;BYDAY=MO,WE;BYSETPOS=1
END:VEVENT
"""), request.RequestUri!.ToString()))));

        var result = await importer.ImportAsync(source);

        Assert.True(result.Succeeded);
        Assert.Single(result.Events);
        Assert.Contains(result.Diagnostics, diagnostic => diagnostic.Code == "UnsupportedRecurrence" && diagnostic.ProviderEventId == "complex-recurrence");
    }

    [Fact]
    public async Task HttpCacheMetadataAndConditionalHeadersAreExposed()
    {
        await using var context = CreateContext();
        var source = await AddFeedSourceAsync(context, "https://example.test/calendar.ics", etag: "\"old-etag\"", lastModified: "Sun, 05 Jul 2026 10:00:00 GMT");
        var handler = new StubHttpMessageHandler(request =>
        {
            var response = IcsResponse(ValidCalendar("metadata-event"), request.RequestUri!.ToString());
            response.Headers.ETag = new System.Net.Http.Headers.EntityTagHeaderValue("\"new-etag\"");
            response.Content.Headers.LastModified = new DateTimeOffset(2026, 7, 5, 12, 30, 0, TimeSpan.Zero);
            response.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("text/calendar");
            return response;
        });
        var importer = new ICalFeedImporter(context, new HttpClient(handler));

        var result = await importer.ImportAsync(source);

        Assert.True(result.Succeeded);
        Assert.Equal("\"old-etag\"", handler.Requests.Single().Headers.GetValues("If-None-Match").Single());
        Assert.Equal("Sun, 05 Jul 2026 10:00:00 GMT", handler.Requests.Single().Headers.GetValues("If-Modified-Since").Single());
        Assert.Equal("\"new-etag\"", result.RetrievalMetadata?.ETag);
        Assert.Equal("Sun, 05 Jul 2026 12:30:00 GMT", result.RetrievalMetadata?.LastModified);
        Assert.Equal("text/calendar", result.RetrievalMetadata?.ContentType);
        Assert.False(result.RetrievalMetadata?.NotModified);
    }

    [Fact]
    public async Task NotModifiedReturnsSuccessfulEmptySnapshotWithRetrievalMetadata()
    {
        await using var context = CreateContext();
        var source = await AddFeedSourceAsync(context, "https://example.test/calendar.ics");
        var importer = new ICalFeedImporter(context, new HttpClient(new StubHttpMessageHandler(request => new HttpResponseMessage(HttpStatusCode.NotModified)
        {
            RequestMessage = request,
        })));

        var result = await importer.ImportAsync(source);

        Assert.True(result.Succeeded);
        Assert.Empty(result.Events);
        Assert.True(result.RetrievalMetadata?.NotModified);
        Assert.Equal(HttpStatusCode.NotModified, result.RetrievalMetadata?.HttpStatusCode);
    }

    [Fact]
    public async Task MissingConfigurationReturnsInvalidConfigurationFailure()
    {
        await using var context = CreateContext();
        var source = CreateSource();
        context.EventSources.Add(source);
        await context.SaveChangesAsync();
        var importer = new ICalFeedImporter(context, new HttpClient(new StubHttpMessageHandler(_ => throw new InvalidOperationException("HTTP should not be called."))));

        var result = await importer.ImportAsync(source);

        Assert.False(result.Succeeded);
        Assert.Equal(ICalFeedImportFailureCategory.InvalidConfiguration, result.Failure?.Category);
    }

    private static HomeOpsDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<HomeOpsDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new HomeOpsDbContext(options);
    }

    private static async Task<EventSource> AddFeedSourceAsync(HomeOpsDbContext context, string feedUrl, string? etag = null, string? lastModified = null)
    {
        var source = CreateSource();
        var now = DateTimeOffset.UtcNow;
        context.EventSources.Add(source);
        context.ICalFeedSourceConfigurations.Add(new ICalFeedSourceConfiguration
        {
            EventSourceId = source.Id,
            FeedUrl = feedUrl,
            ETag = etag,
            LastModified = lastModified,
            CreatedUtc = now,
            UpdatedUtc = now,
        });
        await context.SaveChangesAsync();
        return source;
    }

    private static EventSource CreateSource() => new()
    {
        Id = Guid.NewGuid(),
        HouseholdId = SeedHousehold.Id,
        Name = "Feed",
        SourceType = EventSourceTypes.ICalFeed,
        IsWritable = false,
        IsEnabled = true,
        HealthStatus = EventSourceHealthStatus.NeverSynced,
        PollInterval = EventSourcePollInterval.Every8Hours,
        CreatedUtc = DateTimeOffset.UtcNow,
        UpdatedUtc = DateTimeOffset.UtcNow,
    };

    private static HttpResponseMessage RedirectResponse(string location, Uri requestUri)
    {
        var response = new HttpResponseMessage(HttpStatusCode.Redirect)
        {
            RequestMessage = new HttpRequestMessage(HttpMethod.Get, requestUri),
        };
        response.Headers.Location = new Uri(location, UriKind.RelativeOrAbsolute);
        return response;
    }

    private static HttpResponseMessage IcsResponse(string content, string requestUri) => TextResponse(content, requestUri, "text/calendar");

    private static HttpResponseMessage TextResponse(string content, string requestUri, string mediaType = "text/plain")
    {
        var response = new HttpResponseMessage(HttpStatusCode.OK)
        {
            RequestMessage = new HttpRequestMessage(HttpMethod.Get, requestUri),
            Content = new StringContent(content),
        };
        response.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(mediaType);
        return response;
    }

    private static string ValidCalendar(string uid) => CalendarWith($$"""
BEGIN:VEVENT
UID:{{uid}}
SUMMARY:Feed Event
DTSTART:20260706T090000
DTEND:20260706T100000
END:VEVENT
""");

    private static string CalendarWith(string events) => $$"""
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//HomeOps Tests//iCal Feed Importer//EN
{{events}}
END:VCALENDAR
""";

    private sealed class StubHttpMessageHandler(params Func<HttpRequestMessage, HttpResponseMessage>[] responses) : HttpMessageHandler
    {
        private readonly Queue<Func<HttpRequestMessage, HttpResponseMessage>> responses = new(responses);

        public List<HttpRequestMessage> Requests { get; } = [];

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Requests.Add(CloneRequest(request));
            if (responses.Count == 0)
            {
                throw new InvalidOperationException("No HTTP response configured for request.");
            }

            return Task.FromResult(responses.Dequeue()(request));
        }

        private static HttpRequestMessage CloneRequest(HttpRequestMessage request)
        {
            var clone = new HttpRequestMessage(request.Method, request.RequestUri);
            foreach (var header in request.Headers)
            {
                clone.Headers.TryAddWithoutValidation(header.Key, header.Value);
            }

            return clone;
        }
    }
}
