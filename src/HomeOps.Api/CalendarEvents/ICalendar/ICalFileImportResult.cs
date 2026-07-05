namespace HomeOps.Api.CalendarEvents.ICalendar;

public sealed record ICalFileImportResult(
    bool Succeeded,
    IReadOnlyList<NormalizedICalendarEvent> Events,
    IReadOnlyList<ICalendarParseDiagnostic> Diagnostics,
    ICalFileProviderMetadata? ProviderMetadata,
    ICalFileMetadata? FileMetadata,
    ICalFileImportFailure? Failure)
{
    public static ICalFileImportResult Success(
        IReadOnlyList<NormalizedICalendarEvent> events,
        IReadOnlyList<ICalendarParseDiagnostic> diagnostics,
        ICalFileProviderMetadata providerMetadata,
        ICalFileMetadata fileMetadata) =>
        new(true, events, diagnostics, providerMetadata, fileMetadata, null);

    public static ICalFileImportResult Failed(
        ICalFileImportFailure failure,
        IReadOnlyList<ICalendarParseDiagnostic> diagnostics,
        ICalFileProviderMetadata? providerMetadata = null,
        ICalFileMetadata? fileMetadata = null) =>
        new(false, [], diagnostics, providerMetadata, fileMetadata, failure);
}

public sealed record ICalFileImportFailure(
    ICalFileImportFailureCategory Category,
    string Message);

public sealed record ICalFileProviderMetadata(
    Guid EventSourceId,
    string SourceType,
    string? ProviderSourceId);

public sealed record ICalFileMetadata(
    string FileReference,
    string OriginalFilename,
    string ContentHash,
    DateTimeOffset UploadedUtc,
    long? ContentLength,
    DateTimeOffset? LastModifiedUtc);
