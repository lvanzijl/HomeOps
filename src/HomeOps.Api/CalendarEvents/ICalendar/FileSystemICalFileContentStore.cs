namespace HomeOps.Api.CalendarEvents.ICalendar;

public sealed class FileSystemICalFileContentStore(IConfiguration configuration) : ICalFileContentStore
{
    private readonly string rootPath = configuration["CalendarSources:FileStoragePath"]
        ?? Path.Combine(AppContext.BaseDirectory, "App_Data", "calendar-files");

    public async Task<ICalFileContentLoadResult> LoadAsync(string fileReference, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(fileReference) || fileReference.StartsWith("/", StringComparison.Ordinal) || fileReference.StartsWith("\\", StringComparison.Ordinal) || fileReference.Contains('\0'))
        {
            return ICalFileContentLoadResult.Failed(ICalFileContentLoadFailureCategory.InvalidReference, "iCal file reference is invalid.");
        }

        var fullPath = Path.GetFullPath(Path.Combine(rootPath, fileReference));
        var fullRoot = Path.GetFullPath(rootPath);
        var relativePath = Path.GetRelativePath(fullRoot, fullPath);
        if (relativePath == ".." || relativePath.StartsWith(".." + Path.DirectorySeparatorChar, StringComparison.Ordinal) || Path.IsPathRooted(relativePath))
        {
            return ICalFileContentLoadResult.Failed(ICalFileContentLoadFailureCategory.InvalidReference, "iCal file reference escapes the configured storage root.");
        }

        if (!File.Exists(fullPath))
        {
            return ICalFileContentLoadResult.Failed(ICalFileContentLoadFailureCategory.MissingFile, "iCal file content was not found.");
        }

        try
        {
            var content = await File.ReadAllTextAsync(fullPath, cancellationToken);
            var info = new FileInfo(fullPath);
            return ICalFileContentLoadResult.Success(content, info.Length, info.LastWriteTimeUtc);
        }
        catch (UnauthorizedAccessException)
        {
            return ICalFileContentLoadResult.Failed(ICalFileContentLoadFailureCategory.AccessDenied, "iCal file content could not be accessed.");
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            return ICalFileContentLoadResult.Failed(ICalFileContentLoadFailureCategory.StorageFailure, exception.Message);
        }
    }
}
