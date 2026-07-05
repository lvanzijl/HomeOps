using HomeOps.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.CalendarEvents.ICalendar;

public sealed class ICalFileImporter(HomeOpsDbContext dbContext, ICalFileContentStore contentStore)
{
    public async Task<ICalFileImportResult> ImportAsync(EventSource source, CancellationToken cancellationToken = default)
    {
        if (!string.Equals(source.SourceType, EventSourceTypes.ICalFile, StringComparison.Ordinal))
        {
            return Failure(
                ICalFileImportFailureCategory.MissingConfiguration,
                "Event source is not an iCal File source.",
                Diagnostic("MissingConfiguration", "Event source is not an iCal File source."));
        }

        var configuration = await dbContext.ICalFileSourceConfigurations
            .AsNoTracking()
            .SingleOrDefaultAsync(config => config.EventSourceId == source.Id, cancellationToken);

        if (configuration is null)
        {
            return Failure(
                ICalFileImportFailureCategory.MissingConfiguration,
                "iCal File source configuration is missing.",
                Diagnostic("MissingConfiguration", "iCal File source configuration is missing."));
        }

        var providerMetadata = new ICalFileProviderMetadata(source.Id, source.SourceType, source.ProviderSourceId);
        var configurationMetadata = BuildConfigurationMetadata(configuration, contentLength: null, lastModifiedUtc: null);

        if (string.IsNullOrWhiteSpace(configuration.FileReference))
        {
            return Failure(
                ICalFileImportFailureCategory.MissingConfiguration,
                "iCal File source configuration is missing a file reference.",
                Diagnostic("MissingFileReference", "iCal File source configuration is missing a file reference."),
                providerMetadata,
                configurationMetadata);
        }

        if (!IsValidFileReference(configuration.FileReference))
        {
            return Failure(
                ICalFileImportFailureCategory.InvalidReference,
                "iCal File source configuration contains an invalid file reference.",
                Diagnostic("InvalidReference", "iCal File source configuration contains an invalid file reference."),
                providerMetadata,
                configurationMetadata);
        }

        if (string.IsNullOrWhiteSpace(configuration.OriginalFilename))
        {
            return Failure(
                ICalFileImportFailureCategory.MissingConfiguration,
                "iCal File source configuration is missing the original filename.",
                Diagnostic("MissingFilename", "iCal File source configuration is missing the original filename."),
                providerMetadata,
                configurationMetadata);
        }

        if (!IsValidContentHash(configuration.ContentHash))
        {
            return Failure(
                ICalFileImportFailureCategory.MissingConfiguration,
                "iCal File source configuration contains an invalid content hash.",
                Diagnostic("InvalidContentHash", "iCal File source configuration contains an invalid content hash."),
                providerMetadata,
                configurationMetadata);
        }

        try
        {
            var loadResult = await contentStore.LoadAsync(configuration.FileReference, cancellationToken);
            if (!loadResult.Succeeded)
            {
                var category = MapStorageFailure(loadResult.Failure?.Category);
                return Failure(
                    category,
                    loadResult.Failure?.Message ?? "iCal file content could not be loaded.",
                    Diagnostic(category.ToString(), loadResult.Failure?.Message ?? "iCal file content could not be loaded."),
                    providerMetadata,
                    configurationMetadata);
            }

            var fileMetadata = BuildConfigurationMetadata(configuration, loadResult.ContentLength, loadResult.LastModifiedUtc);
            if (string.IsNullOrWhiteSpace(loadResult.Content))
            {
                return Failure(
                    ICalFileImportFailureCategory.InvalidContent,
                    "iCal file content is empty.",
                    Diagnostic("InvalidContent", "iCal file content is empty."),
                    providerMetadata,
                    fileMetadata);
            }

            var parserResult = ICalendarParser.Parse(loadResult.Content);
            if (parserResult.HasErrors && parserResult.Events.Count == 0)
            {
                return Failure(
                    ICalFileImportFailureCategory.ParseFailure,
                    "iCal file content could not be parsed into normalized events.",
                    parserResult.Diagnostics,
                    providerMetadata,
                    fileMetadata);
            }

            return ICalFileImportResult.Success(parserResult.Events, parserResult.Diagnostics, providerMetadata, fileMetadata);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            return Failure(
                ICalFileImportFailureCategory.Unknown,
                "iCal File import failed unexpectedly.",
                Diagnostic("Unknown", exception.Message),
                providerMetadata,
                configurationMetadata);
        }
    }

    private static ICalFileMetadata BuildConfigurationMetadata(ICalFileSourceConfiguration configuration, long? contentLength, DateTimeOffset? lastModifiedUtc) =>
        new(configuration.FileReference, configuration.OriginalFilename, configuration.ContentHash, configuration.UploadedUtc, contentLength, lastModifiedUtc);

    private static bool IsValidFileReference(string fileReference)
    {
        if (string.IsNullOrWhiteSpace(fileReference) || fileReference.StartsWith("/", StringComparison.Ordinal) || fileReference.StartsWith("\\", StringComparison.Ordinal))
        {
            return false;
        }

        if (fileReference.Contains('\0'))
        {
            return false;
        }

        var segments = fileReference.Split(['/', '\\'], StringSplitOptions.RemoveEmptyEntries);
        return segments.All(segment => segment is not "." and not "..");
    }

    private static bool IsValidContentHash(string contentHash) =>
        !string.IsNullOrWhiteSpace(contentHash) && contentHash.Length <= 128 && !contentHash.Any(char.IsWhiteSpace);

    private static ICalFileImportFailureCategory MapStorageFailure(ICalFileContentLoadFailureCategory? category) => category switch
    {
        ICalFileContentLoadFailureCategory.MissingFile => ICalFileImportFailureCategory.MissingFile,
        ICalFileContentLoadFailureCategory.InvalidReference => ICalFileImportFailureCategory.InvalidReference,
        ICalFileContentLoadFailureCategory.StorageFailure => ICalFileImportFailureCategory.StorageFailure,
        ICalFileContentLoadFailureCategory.AccessDenied => ICalFileImportFailureCategory.AccessDenied,
        _ => ICalFileImportFailureCategory.Unknown,
    };

    private static ICalFileImportResult Failure(
        ICalFileImportFailureCategory category,
        string message,
        ICalendarParseDiagnostic diagnostic,
        ICalFileProviderMetadata? providerMetadata = null,
        ICalFileMetadata? fileMetadata = null) =>
        Failure(category, message, [diagnostic], providerMetadata, fileMetadata);

    private static ICalFileImportResult Failure(
        ICalFileImportFailureCategory category,
        string message,
        IReadOnlyList<ICalendarParseDiagnostic> diagnostics,
        ICalFileProviderMetadata? providerMetadata = null,
        ICalFileMetadata? fileMetadata = null) =>
        ICalFileImportResult.Failed(new ICalFileImportFailure(category, message), diagnostics, providerMetadata, fileMetadata);

    private static ICalendarParseDiagnostic Diagnostic(string code, string message) =>
        new(ICalendarParseDiagnosticSeverity.Error, code, message);
}
