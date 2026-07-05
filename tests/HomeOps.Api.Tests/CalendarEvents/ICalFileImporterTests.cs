using HomeOps.Api.CalendarEvents;
using HomeOps.Api.CalendarEvents.ICalendar;
using HomeOps.Api.Data;
using HomeOps.Api.Households;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.Tests.CalendarEvents;

public sealed class ICalFileImporterTests
{
    [Fact]
    public async Task ValidConfigurationLoadsContentAndReturnsNormalizedSnapshot()
    {
        await using var context = CreateContext();
        var source = await AddFileSourceAsync(context);
        var store = new StubFileContentStore(_ => ICalFileContentLoadResult.Success(ValidCalendar("file-event"), contentLength: 180, lastModifiedUtc: new DateTimeOffset(2026, 7, 5, 12, 0, 0, TimeSpan.Zero)));
        var importer = new ICalFileImporter(context, store);

        var result = await importer.ImportAsync(source);

        Assert.True(result.Succeeded);
        Assert.Null(result.Failure);
        var normalizedEvent = Assert.Single(result.Events);
        Assert.Equal("file-event", normalizedEvent.ProviderEventId);
        Assert.Equal("File Event", normalizedEvent.Title);
        Assert.Equal(source.Id, result.ProviderMetadata?.EventSourceId);
        Assert.Equal(EventSourceTypes.ICalFile, result.ProviderMetadata?.SourceType);
        Assert.Equal("calendar-files/file.ics", result.FileMetadata?.FileReference);
        Assert.Equal("file.ics", result.FileMetadata?.OriginalFilename);
        Assert.Equal("hash-123", result.FileMetadata?.ContentHash);
        Assert.Equal(180, result.FileMetadata?.ContentLength);
        Assert.Equal(new DateTimeOffset(2026, 7, 5, 12, 0, 0, TimeSpan.Zero), result.FileMetadata?.LastModifiedUtc);
    }

    [Fact]
    public async Task MissingConfigurationReturnsStructuredFailure()
    {
        await using var context = CreateContext();
        var source = CreateSource();
        context.EventSources.Add(source);
        await context.SaveChangesAsync();
        var importer = new ICalFileImporter(context, new StubFileContentStore(_ => throw new InvalidOperationException("Storage should not be called.")));

        var result = await importer.ImportAsync(source);

        Assert.False(result.Succeeded);
        Assert.Equal(ICalFileImportFailureCategory.MissingConfiguration, result.Failure?.Category);
        Assert.Contains(result.Diagnostics, diagnostic => diagnostic.Code == "MissingConfiguration");
    }

    [Fact]
    public async Task MissingFileReferenceReturnsStructuredFailure()
    {
        await using var context = CreateContext();
        var source = await AddFileSourceAsync(context, fileReference: " ");
        var importer = new ICalFileImporter(context, new StubFileContentStore(_ => throw new InvalidOperationException("Storage should not be called.")));

        var result = await importer.ImportAsync(source);

        Assert.False(result.Succeeded);
        Assert.Equal(ICalFileImportFailureCategory.MissingConfiguration, result.Failure?.Category);
        Assert.Contains(result.Diagnostics, diagnostic => diagnostic.Code == "MissingFileReference");
    }

    [Fact]
    public async Task InvalidFileReferenceReturnsStructuredFailure()
    {
        await using var context = CreateContext();
        var source = await AddFileSourceAsync(context, fileReference: "../secrets/file.ics");
        var importer = new ICalFileImporter(context, new StubFileContentStore(_ => throw new InvalidOperationException("Storage should not be called.")));

        var result = await importer.ImportAsync(source);

        Assert.False(result.Succeeded);
        Assert.Equal(ICalFileImportFailureCategory.InvalidReference, result.Failure?.Category);
        Assert.Contains(result.Diagnostics, diagnostic => diagnostic.Code == "InvalidReference");
    }

    [Fact]
    public async Task MissingFilenameReturnsStructuredFailure()
    {
        await using var context = CreateContext();
        var source = await AddFileSourceAsync(context, originalFilename: " ");
        var importer = new ICalFileImporter(context, new StubFileContentStore(_ => throw new InvalidOperationException("Storage should not be called.")));

        var result = await importer.ImportAsync(source);

        Assert.False(result.Succeeded);
        Assert.Equal(ICalFileImportFailureCategory.MissingConfiguration, result.Failure?.Category);
        Assert.Contains(result.Diagnostics, diagnostic => diagnostic.Code == "MissingFilename");
    }

    [Fact]
    public async Task InvalidContentHashReturnsStructuredFailure()
    {
        await using var context = CreateContext();
        var source = await AddFileSourceAsync(context, contentHash: "hash with spaces");
        var importer = new ICalFileImporter(context, new StubFileContentStore(_ => throw new InvalidOperationException("Storage should not be called.")));

        var result = await importer.ImportAsync(source);

        Assert.False(result.Succeeded);
        Assert.Equal(ICalFileImportFailureCategory.MissingConfiguration, result.Failure?.Category);
        Assert.Contains(result.Diagnostics, diagnostic => diagnostic.Code == "InvalidContentHash");
    }

    [Theory]
    [InlineData(ICalFileContentLoadFailureCategory.MissingFile, ICalFileImportFailureCategory.MissingFile)]
    [InlineData(ICalFileContentLoadFailureCategory.StorageFailure, ICalFileImportFailureCategory.StorageFailure)]
    [InlineData(ICalFileContentLoadFailureCategory.AccessDenied, ICalFileImportFailureCategory.AccessDenied)]
    [InlineData(ICalFileContentLoadFailureCategory.InvalidReference, ICalFileImportFailureCategory.InvalidReference)]
    public async Task StorageFailuresReturnStructuredFailures(ICalFileContentLoadFailureCategory storageFailure, ICalFileImportFailureCategory expectedFailure)
    {
        await using var context = CreateContext();
        var source = await AddFileSourceAsync(context);
        var importer = new ICalFileImporter(context, new StubFileContentStore(_ => ICalFileContentLoadResult.Failed(storageFailure, $"storage {storageFailure}")));

        var result = await importer.ImportAsync(source);

        Assert.False(result.Succeeded);
        Assert.Equal(expectedFailure, result.Failure?.Category);
        Assert.Contains(result.Diagnostics, diagnostic => diagnostic.Code == expectedFailure.ToString());
        Assert.Equal("calendar-files/file.ics", result.FileMetadata?.FileReference);
    }

    [Fact]
    public async Task EmptyContentReturnsInvalidContentFailure()
    {
        await using var context = CreateContext();
        var source = await AddFileSourceAsync(context);
        var importer = new ICalFileImporter(context, new StubFileContentStore(_ => ICalFileContentLoadResult.Success("   ", contentLength: 3)));

        var result = await importer.ImportAsync(source);

        Assert.False(result.Succeeded);
        Assert.Equal(ICalFileImportFailureCategory.InvalidContent, result.Failure?.Category);
        Assert.Contains(result.Diagnostics, diagnostic => diagnostic.Code == "InvalidContent");
        Assert.Equal(3, result.FileMetadata?.ContentLength);
    }

    [Fact]
    public async Task MalformedIcsReturnsParseFailureWithParserDiagnostics()
    {
        await using var context = CreateContext();
        var source = await AddFileSourceAsync(context);
        var importer = new ICalFileImporter(context, new StubFileContentStore(_ => ICalFileContentLoadResult.Success("not a calendar")));

        var result = await importer.ImportAsync(source);

        Assert.False(result.Succeeded);
        Assert.Equal(ICalFileImportFailureCategory.ParseFailure, result.Failure?.Category);
        Assert.Contains(result.Diagnostics, diagnostic => diagnostic.Code == "MalformedCalendar");
    }

    [Fact]
    public async Task ParserDiagnosticsArePreservedOnSuccessfulImport()
    {
        await using var context = CreateContext();
        var source = await AddFileSourceAsync(context);
        var importer = new ICalFileImporter(context, new StubFileContentStore(_ => ICalFileContentLoadResult.Success(CalendarWith("""
BEGIN:VEVENT
UID:complex-recurrence
SUMMARY:Complex
DTSTART:20260706T090000
DTEND:20260706T100000
RRULE:FREQ=WEEKLY;BYDAY=MO,WE
END:VEVENT
"""))));

        var result = await importer.ImportAsync(source);

        Assert.True(result.Succeeded);
        Assert.Single(result.Events);
        Assert.Contains(result.Diagnostics, diagnostic => diagnostic.Code == "UnsupportedRecurrence" && diagnostic.ProviderEventId == "complex-recurrence");
    }

    [Fact]
    public async Task UnexpectedStorageExceptionReturnsUnknownFailure()
    {
        await using var context = CreateContext();
        var source = await AddFileSourceAsync(context);
        var importer = new ICalFileImporter(context, new StubFileContentStore(_ => throw new InvalidOperationException("boom")));

        var result = await importer.ImportAsync(source);

        Assert.False(result.Succeeded);
        Assert.Equal(ICalFileImportFailureCategory.Unknown, result.Failure?.Category);
        Assert.Contains(result.Diagnostics, diagnostic => diagnostic.Code == "Unknown");
    }

    private static HomeOpsDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<HomeOpsDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new HomeOpsDbContext(options);
    }

    private static async Task<EventSource> AddFileSourceAsync(
        HomeOpsDbContext context,
        string fileReference = "calendar-files/file.ics",
        string originalFilename = "file.ics",
        string contentHash = "hash-123")
    {
        var source = CreateSource();
        var now = DateTimeOffset.UtcNow;
        context.EventSources.Add(source);
        context.ICalFileSourceConfigurations.Add(new ICalFileSourceConfiguration
        {
            EventSourceId = source.Id,
            FileReference = fileReference,
            OriginalFilename = originalFilename,
            ContentHash = contentHash,
            UploadedUtc = now,
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
        Name = "File",
        SourceType = EventSourceTypes.ICalFile,
        IsWritable = false,
        IsEnabled = true,
        HealthStatus = EventSourceHealthStatus.NeverSynced,
        PollInterval = EventSourcePollInterval.Every8Hours,
        CreatedUtc = DateTimeOffset.UtcNow,
        UpdatedUtc = DateTimeOffset.UtcNow,
    };

    private static string ValidCalendar(string uid) => CalendarWith($$"""
BEGIN:VEVENT
UID:{{uid}}
SUMMARY:File Event
DTSTART:20260706T090000
DTEND:20260706T100000
END:VEVENT
""");

    private static string CalendarWith(string events) => $$"""
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//HomeOps Tests//iCal File Importer//EN
{{events}}
END:VCALENDAR
""";

    private sealed class StubFileContentStore(Func<string, ICalFileContentLoadResult> load) : ICalFileContentStore
    {
        public List<string> RequestedReferences { get; } = [];

        public Task<ICalFileContentLoadResult> LoadAsync(string fileReference, CancellationToken cancellationToken = default)
        {
            RequestedReferences.Add(fileReference);
            return Task.FromResult(load(fileReference));
        }
    }
}
