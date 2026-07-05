namespace HomeOps.Api.CalendarEvents.ICalendar;

public interface ICalFileContentStore
{
    Task<ICalFileContentLoadResult> LoadAsync(string fileReference, CancellationToken cancellationToken = default);
}

public sealed record ICalFileContentLoadResult(
    bool Succeeded,
    string? Content,
    long? ContentLength,
    DateTimeOffset? LastModifiedUtc,
    ICalFileContentLoadFailure? Failure)
{
    public static ICalFileContentLoadResult Success(string content, long? contentLength = null, DateTimeOffset? lastModifiedUtc = null) =>
        new(true, content, contentLength, lastModifiedUtc, null);

    public static ICalFileContentLoadResult Failed(ICalFileContentLoadFailureCategory category, string message) =>
        new(false, null, null, null, new ICalFileContentLoadFailure(category, message));
}

public sealed record ICalFileContentLoadFailure(ICalFileContentLoadFailureCategory Category, string Message);

public enum ICalFileContentLoadFailureCategory
{
    MissingFile = 0,
    InvalidReference = 1,
    StorageFailure = 2,
    AccessDenied = 3,
    Unknown = 4,
}
