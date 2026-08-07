namespace HomeOps.Api.CalendarEvents.ICalendar;

using System.Security.Cryptography;

public sealed class FileSystemICalFileContentStore(IConfiguration configuration) : ICalFileContentStore
{
    public const long MaximumUploadBytes = 5 * 1024 * 1024;
    private readonly string rootPath = configuration["CalendarSources:FileStoragePath"]
        ?? Path.Combine(AppContext.BaseDirectory, "App_Data", "calendar-files");

    public async Task<ICalFileContentLoadResult> LoadAsync(string fileReference, CancellationToken cancellationToken = default)
    {
        if (!TryResolveReference(fileReference, out var fullPath))
        {
            return ICalFileContentLoadResult.Failed(ICalFileContentLoadFailureCategory.InvalidReference, "iCal file reference is invalid.");
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

    public async Task<ICalFileContentSaveResult> SaveAsync(Stream content, CancellationToken cancellationToken = default)
    {
        Directory.CreateDirectory(rootPath);
        var fileReference = $"{Guid.NewGuid():N}.ics";
        var finalPath = Path.Combine(rootPath, fileReference);
        var temporaryPath = Path.Combine(rootPath, $".{Guid.NewGuid():N}.upload");
        try
        {
            using var hash = IncrementalHash.CreateHash(HashAlgorithmName.SHA256);
            await using var output = new FileStream(temporaryPath, FileMode.CreateNew, FileAccess.Write, FileShare.None, 81920, FileOptions.Asynchronous);
            var buffer = new byte[81920];
            long size = 0;
            int read;
            while ((read = await content.ReadAsync(buffer, cancellationToken)) > 0)
            {
                size += read;
                if (size > MaximumUploadBytes) return ICalFileContentSaveResult.Failed("iCal uploads may not exceed 5 MiB.");
                hash.AppendData(buffer, 0, read);
                await output.WriteAsync(buffer.AsMemory(0, read), cancellationToken);
            }
            await output.FlushAsync(cancellationToken);
            output.Close();
            File.Move(temporaryPath, finalPath);
            return ICalFileContentSaveResult.Success(fileReference, Convert.ToHexString(hash.GetHashAndReset()).ToLowerInvariant(), size, DateTimeOffset.UtcNow);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            return ICalFileContentSaveResult.Failed(exception.Message);
        }
        finally
        {
            if (File.Exists(temporaryPath)) File.Delete(temporaryPath);
        }
    }

    public Task<ICalFileContentSaveResult> ReplaceAsync(string existingFileReference, Stream content, CancellationToken cancellationToken = default)
    {
        if (!TryResolveReference(existingFileReference, out _)) return Task.FromResult(ICalFileContentSaveResult.Failed("Existing iCal file reference is invalid."));
        return SaveAsync(content, cancellationToken);
    }

    public Task<ICalFileContentDeleteResult> DeleteAsync(string fileReference, CancellationToken cancellationToken = default)
    {
        if (!TryResolveReference(fileReference, out var fullPath)) return Task.FromResult(ICalFileContentDeleteResult.Failed("iCal file reference is invalid."));
        try
        {
            if (!File.Exists(fullPath)) return Task.FromResult(ICalFileContentDeleteResult.Success(wasMissing: true));
            File.Delete(fullPath);
            return Task.FromResult(ICalFileContentDeleteResult.Success());
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            return Task.FromResult(ICalFileContentDeleteResult.Failed(exception.Message));
        }
    }

    private bool TryResolveReference(string fileReference, out string fullPath)
    {
        fullPath = string.Empty;
        if (string.IsNullOrWhiteSpace(fileReference) || fileReference.StartsWith("/", StringComparison.Ordinal) || fileReference.StartsWith("\\", StringComparison.Ordinal) || fileReference.Contains('\0')) return false;
        var candidate = Path.GetFullPath(Path.Combine(rootPath, fileReference));
        var fullRoot = Path.GetFullPath(rootPath);
        var relativePath = Path.GetRelativePath(fullRoot, candidate);
        if (relativePath == ".." || relativePath.StartsWith(".." + Path.DirectorySeparatorChar, StringComparison.Ordinal) || Path.IsPathRooted(relativePath)) return false;
        fullPath = candidate;
        return true;
    }
}
