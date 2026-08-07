namespace HomeOps.Api.CalendarEvents.ICalendar;

public interface ICalFileContentStore
{
    Task<ICalFileContentLoadResult> LoadAsync(string fileReference, CancellationToken cancellationToken = default);
    Task<ICalFileContentSaveResult> SaveAsync(Stream content, CancellationToken cancellationToken = default) =>
        throw new NotSupportedException("This content store does not support managed uploads.");
    Task<ICalFileContentSaveResult> ReplaceAsync(string existingFileReference, Stream content, CancellationToken cancellationToken = default) =>
        SaveAsync(content, cancellationToken);
    Task<ICalFileContentDeleteResult> DeleteAsync(string fileReference, CancellationToken cancellationToken = default) =>
        throw new NotSupportedException("This content store does not support managed deletion.");
}

public sealed record ICalFileContentSaveResult(bool Succeeded, string? FileReference, string? Sha256, long Size, DateTimeOffset UploadedUtc, string? Error)
{
    public static ICalFileContentSaveResult Success(string reference, string sha256, long size, DateTimeOffset uploadedUtc) => new(true, reference, sha256, size, uploadedUtc, null);
    public static ICalFileContentSaveResult Failed(string error) => new(false, null, null, 0, default, error);
}

public sealed record ICalFileContentDeleteResult(bool Succeeded, bool WasMissing, string? Error)
{
    public static ICalFileContentDeleteResult Success(bool wasMissing = false) => new(true, wasMissing, null);
    public static ICalFileContentDeleteResult Failed(string error) => new(false, false, error);
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
