using System.Net;

namespace HomeOps.Api.CalendarEvents.ICalendar;

public sealed record ICalFeedImportResult(
    bool Succeeded,
    IReadOnlyList<NormalizedICalendarEvent> Events,
    IReadOnlyList<ICalendarParseDiagnostic> Diagnostics,
    ICalFeedProviderMetadata? ProviderMetadata,
    ICalFeedRetrievalMetadata? RetrievalMetadata,
    ICalFeedImportFailure? Failure)
{
    public static ICalFeedImportResult Success(
        IReadOnlyList<NormalizedICalendarEvent> events,
        IReadOnlyList<ICalendarParseDiagnostic> diagnostics,
        ICalFeedProviderMetadata providerMetadata,
        ICalFeedRetrievalMetadata retrievalMetadata) =>
        new(true, events, diagnostics, providerMetadata, retrievalMetadata, null);

    public static ICalFeedImportResult Failed(
        ICalFeedImportFailure failure,
        IReadOnlyList<ICalendarParseDiagnostic> diagnostics,
        ICalFeedProviderMetadata? providerMetadata = null,
        ICalFeedRetrievalMetadata? retrievalMetadata = null) =>
        new(false, [], diagnostics, providerMetadata, retrievalMetadata, failure);
}

public sealed record ICalFeedImportFailure(
    ICalFeedImportFailureCategory Category,
    string Message,
    HttpStatusCode? HttpStatusCode = null);

public sealed record ICalFeedProviderMetadata(
    Guid EventSourceId,
    string SourceType,
    string? ProviderSourceId,
    Uri FeedUri);

public sealed record ICalFeedRetrievalMetadata(
    HttpStatusCode? HttpStatusCode,
    Uri FeedUri,
    Uri? FinalUri,
    string? ETag,
    string? LastModified,
    string? ContentType,
    long? ContentLength,
    bool NotModified);
