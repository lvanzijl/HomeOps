using System.Net;
using System.Net.Http.Json;
using HomeOps.Api.CalendarEvents;
using HomeOps.Api.CalendarEvents.ICalendar;
using HomeOps.Api.CalendarEvents.Synchronization;
using HomeOps.Api.Data;
using HomeOps.Api.Households;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using HomeOps.Contracts.Events;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace HomeOps.Api.Tests.CalendarEvents;

public sealed class CalendarSourceRefreshApiTests
{
    [Fact]
    public async Task RefreshSourceDispatchesICalFeedImporterAndSynchronizesEvents()
    {
        var feedImporter = new RecordingFeedImporter(_ => ICalFeedImportResult.Success([CalendarEvent("feed-event", "Feed Event")], [], FeedMetadata(), FeedRetrieval()));
        var fileImporter = new RecordingFileImporter(_ => throw new InvalidOperationException("File importer should not be called."));
        await using var factory = CreateFactory(feedImporter, fileImporter);
        var sourceId = await AddSourceAsync(factory, EventSourceTypes.ICalFeed);

        var response = await factory.CreateClient().PostAsync($"/api/event-sources/{sourceId}/refresh", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<SyncSourceResultDto>();
        Assert.NotNull(result);
        Assert.True(result.Succeeded);
        Assert.Equal(1, result.CreatedCount);
        Assert.Equal(1, feedImporter.CallCount);
        Assert.Equal(0, fileImporter.CallCount);
        await AssertStoredSeriesAsync(factory, sourceId, "Feed Event");
    }

    [Fact]
    public async Task RefreshSourceDispatchesICalFileImporterAndSynchronizesEvents()
    {
        var feedImporter = new RecordingFeedImporter(_ => throw new InvalidOperationException("Feed importer should not be called."));
        var fileImporter = new RecordingFileImporter(_ => ICalFileImportResult.Success([CalendarEvent("file-event", "File Event")], [], FileMetadata(), FileData()));
        await using var factory = CreateFactory(feedImporter, fileImporter);
        var sourceId = await AddSourceAsync(factory, EventSourceTypes.ICalFile);

        var result = await factory.CreateClient().PostAsJsonAsync($"/api/event-sources/{sourceId}/refresh", new { });

        Assert.Equal(HttpStatusCode.OK, result.StatusCode);
        var dto = await result.Content.ReadFromJsonAsync<SyncSourceResultDto>();
        Assert.NotNull(dto);
        Assert.True(dto.Succeeded);
        Assert.Equal(1, dto.CreatedCount);
        Assert.Equal(0, feedImporter.CallCount);
        Assert.Equal(1, fileImporter.CallCount);
        await AssertStoredSeriesAsync(factory, sourceId, "File Event");
    }

    [Fact]
    public async Task RefreshSourceRejectsUnsupportedProviderWithoutCallingImporters()
    {
        var feedImporter = new RecordingFeedImporter(_ => throw new InvalidOperationException("Feed importer should not be called."));
        var fileImporter = new RecordingFileImporter(_ => throw new InvalidOperationException("File importer should not be called."));
        await using var factory = CreateFactory(feedImporter, fileImporter);
        var sourceId = await AddSourceAsync(factory, EventSourceTypes.GoogleCalendar);

        var response = await factory.CreateClient().PostAsync($"/api/event-sources/{sourceId}/refresh", null);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<SyncSourceResultDto>();
        Assert.NotNull(result);
        Assert.False(result.Succeeded);
        Assert.Equal("UnsupportedProvider", result.Error?.Code);
        Assert.Equal(0, feedImporter.CallCount);
        Assert.Equal(0, fileImporter.CallCount);
    }

    [Fact]
    public async Task RefreshSourceFailedRetrievalDeletesNothing()
    {
        var feedImporter = new RecordingFeedImporter(_ => ICalFeedImportResult.Failed(new ICalFeedImportFailure(ICalFeedImportFailureCategory.NetworkFailure, "Network down"), [Diagnostic(ICalendarParseDiagnosticSeverity.Error, "NetworkFailure", "Network down")], FeedMetadata(), FeedRetrieval()));
        await using var factory = CreateFactory(feedImporter, new RecordingFileImporter(_ => throw new InvalidOperationException("File importer should not be called.")));
        var sourceId = await AddSourceAsync(factory, EventSourceTypes.ICalFeed);
        await AddImportedSeriesAsync(factory, sourceId, "existing", "Existing");

        var response = await factory.CreateClient().PostAsync($"/api/event-sources/{sourceId}/refresh", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<SyncSourceResultDto>();
        Assert.NotNull(result);
        Assert.False(result.Succeeded);
        Assert.Equal("NetworkFailure", result.Error?.Code);
        await AssertStoredSeriesAsync(factory, sourceId, "Existing");
    }

    [Fact]
    public async Task RefreshSourceParserFailureDeletesNothing()
    {
        var feedImporter = new RecordingFeedImporter(_ => ICalFeedImportResult.Success([CalendarEvent("existing", "Changed")], [Diagnostic(ICalendarParseDiagnosticSeverity.Error, "MalformedCalendar", "Bad calendar")], FeedMetadata(), FeedRetrieval()));
        await using var factory = CreateFactory(feedImporter, new RecordingFileImporter(_ => throw new InvalidOperationException("File importer should not be called.")));
        var sourceId = await AddSourceAsync(factory, EventSourceTypes.ICalFeed);
        await AddImportedSeriesAsync(factory, sourceId, "existing", "Existing");

        var response = await factory.CreateClient().PostAsync($"/api/event-sources/{sourceId}/refresh", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<SyncSourceResultDto>();
        Assert.NotNull(result);
        Assert.False(result.Succeeded);
        Assert.Equal("MalformedCalendar", result.Error?.Code);
        await AssertStoredSeriesAsync(factory, sourceId, "Existing");
    }

    [Fact]
    public async Task RefreshSourceNotModifiedPerformsNoSynchronizationWork()
    {
        var feedImporter = new RecordingFeedImporter(_ => ICalFeedImportResult.Success([], [], FeedMetadata(), FeedRetrieval(notModified: true)));
        await using var factory = CreateFactory(feedImporter, new RecordingFileImporter(_ => throw new InvalidOperationException("File importer should not be called.")));
        var sourceId = await AddSourceAsync(factory, EventSourceTypes.ICalFeed);
        await AddImportedSeriesAsync(factory, sourceId, "existing", "Existing");

        var response = await factory.CreateClient().PostAsync($"/api/event-sources/{sourceId}/refresh", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<SyncSourceResultDto>();
        Assert.NotNull(result);
        Assert.True(result.Succeeded);
        Assert.Equal(0, result.CreatedCount);
        Assert.Equal(0, result.UpdatedCount);
        Assert.Equal(0, result.DeletedCount);
        Assert.Equal(0, result.UnchangedCount);
        await AssertStoredSeriesAsync(factory, sourceId, "Existing");
    }

    [Fact]
    public async Task RefreshAllRunsSupportedEnabledSourcesAndContinuesAfterFailure()
    {
        var feedImporter = new RecordingFeedImporter(source => source.Name == "Feed success"
            ? ICalFeedImportResult.Success([CalendarEvent("feed-success", "Feed Success")], [], FeedMetadata(), FeedRetrieval())
            : ICalFeedImportResult.Failed(new ICalFeedImportFailure(ICalFeedImportFailureCategory.NetworkFailure, "Network down"), [Diagnostic(ICalendarParseDiagnosticSeverity.Error, "NetworkFailure", "Network down")], FeedMetadata(), FeedRetrieval()));
        var fileImporter = new RecordingFileImporter(_ => ICalFileImportResult.Success([CalendarEvent("file-success", "File Success")], [Diagnostic(ICalendarParseDiagnosticSeverity.Warning, "UnsupportedProperty", "Warning")], FileMetadata(), FileData()));
        await using var factory = CreateFactory(feedImporter, fileImporter);
        var feedSuccess = await AddSourceAsync(factory, EventSourceTypes.ICalFeed, "Feed success");
        var feedFailure = await AddSourceAsync(factory, EventSourceTypes.ICalFeed, "Feed failure");
        var fileSuccess = await AddSourceAsync(factory, EventSourceTypes.ICalFile, "File success");
        await AddSourceAsync(factory, EventSourceTypes.ICalFeed, "Disabled feed", enabled: false);
        await AddSourceAsync(factory, EventSourceTypes.Manual, "Manual", writable: true);
        await AddSourceAsync(factory, EventSourceTypes.GoogleCalendar, "Google");

        var response = await factory.CreateClient().PostAsync("/api/event-sources/refresh-all", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<RefreshAllResultDto>();
        Assert.NotNull(result);
        Assert.Equal(3, result.Results.Count);
        Assert.Contains(result.Results, candidate => candidate.SourceId == feedSuccess && candidate.Succeeded && candidate.CreatedCount == 1);
        Assert.Contains(result.Results, candidate => candidate.SourceId == fileSuccess && candidate.Succeeded && candidate.WarningCount == 1);
        Assert.Contains(result.Results, candidate => candidate.SourceId == feedFailure && !candidate.Succeeded && candidate.Error?.Code == "NetworkFailure");
        Assert.Equal(2, feedImporter.CallCount);
        Assert.Equal(1, fileImporter.CallCount);
    }

    private static WebApplicationFactory<Program> CreateFactory(RecordingFeedImporter feedImporter, RecordingFileImporter fileImporter) =>
        new RefreshFactory(feedImporter, fileImporter);

    private static async Task<Guid> AddSourceAsync(WebApplicationFactory<Program> factory, string sourceType, string name = "Source", bool enabled = true, bool writable = false)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        var now = DateTimeOffset.UtcNow;
        var source = new HomeOps.Api.CalendarEvents.EventSource
        {
            Id = Guid.NewGuid(),
            HouseholdId = SeedHousehold.Id,
            Name = name,
            SourceType = sourceType,
            Icon = "📅",
            IsEnabled = enabled,
            IsWritable = writable,
            HealthStatus = writable ? HomeOps.Api.CalendarEvents.EventSourceHealthStatus.Healthy : HomeOps.Api.CalendarEvents.EventSourceHealthStatus.NeverSynced,
            PollInterval = HomeOps.Api.CalendarEvents.EventSourcePollInterval.Every8Hours,
            CreatedUtc = now,
            UpdatedUtc = now,
        };
        db.EventSources.Add(source);
        if (sourceType == EventSourceTypes.ICalFeed)
        {
            db.ICalFeedSourceConfigurations.Add(new ICalFeedSourceConfiguration { EventSourceId = source.Id, FeedUrl = "https://example.test/calendar.ics", CreatedUtc = now, UpdatedUtc = now });
        }
        else if (sourceType == EventSourceTypes.ICalFile)
        {
            db.ICalFileSourceConfigurations.Add(new ICalFileSourceConfiguration { EventSourceId = source.Id, FileReference = "calendar.ics", OriginalFilename = "calendar.ics", ContentHash = "hash", UploadedUtc = now, CreatedUtc = now, UpdatedUtc = now });
        }
        await db.SaveChangesAsync();
        return source.Id;
    }

    private static async Task AddImportedSeriesAsync(WebApplicationFactory<Program> factory, Guid sourceId, string providerEventId, string title)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        var now = DateTimeOffset.UtcNow;
        db.EventSeries.Add(new EventSeries
        {
            Id = Guid.NewGuid(), EventSourceId = sourceId, ProviderEventId = providerEventId, ProviderRevision = $"revision-{providerEventId}", ContentFingerprint = $"fingerprint-{providerEventId}", ImportedAtUtc = now, LastImportedUtc = now, LastSeenSyncAttemptUtc = now, Title = title, StartDate = new DateOnly(2026, 7, 6), StartTime = new TimeOnly(9, 0), EndDate = new DateOnly(2026, 7, 6), EndTime = new TimeOnly(10, 0), IsAllDay = false, CreatedUtc = now, UpdatedUtc = now,
        });
        await db.SaveChangesAsync();
    }

    private static async Task AssertStoredSeriesAsync(WebApplicationFactory<Program> factory, Guid sourceId, string title)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        Assert.True(await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.AnyAsync(db.EventSeries, series => series.EventSourceId == sourceId && series.Title == title));
    }

    private static NormalizedICalendarEvent CalendarEvent(string id, string title) => new(id, $"revision-{id}", $"fingerprint-{id}", title, "Description", null, new DateOnly(2026, 7, 6), new TimeOnly(9, 0), new DateOnly(2026, 7, 6), new TimeOnly(10, 0), false, null, null, 0, null, null, RecurrenceType.None, null);
    private static ICalendarParseDiagnostic Diagnostic(ICalendarParseDiagnosticSeverity severity, string code, string message) => new(severity, code, message);
    private static ICalFeedProviderMetadata FeedMetadata() => new(Guid.NewGuid(), EventSourceTypes.ICalFeed, "feed-provider", new Uri("https://example.test/calendar.ics"));
    private static ICalFeedRetrievalMetadata FeedRetrieval(bool notModified = false) => new(notModified ? HttpStatusCode.NotModified : HttpStatusCode.OK, new Uri("https://example.test/calendar.ics"), new Uri("https://example.test/calendar.ics"), null, null, "text/calendar", 100, notModified);
    private static ICalFileProviderMetadata FileMetadata() => new(Guid.NewGuid(), EventSourceTypes.ICalFile, "file-provider");
    private static ICalFileMetadata FileData() => new("calendar.ics", "calendar.ics", "hash", DateTimeOffset.UtcNow, 100, DateTimeOffset.UtcNow);

    private sealed class RefreshFactory(RecordingFeedImporter feedImporter, RecordingFileImporter fileImporter) : WebApplicationFactory<Program>
    {
        private readonly SqliteConnection connection = new("Data Source=:memory:");

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            connection.Open();
            builder.UseEnvironment("Testing");
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<DbContextOptions<HomeOpsDbContext>>();
                services.AddDbContext<HomeOpsDbContext>(options => options.UseSqlite(connection));
                services.RemoveAll<IICalFeedImporter>();
                services.RemoveAll<IICalFileImporter>();
                services.AddSingleton<IICalFeedImporter>(feedImporter);
                services.AddSingleton<IICalFileImporter>(fileImporter);

                using var serviceProvider = services.BuildServiceProvider();
                using var scope = serviceProvider.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
                dbContext.Database.EnsureDeleted();
                dbContext.Database.EnsureCreated();
            });
        }

        protected override void Dispose(bool disposing)
        {
            base.Dispose(disposing);
            if (disposing)
            {
                connection.Dispose();
            }
        }
    }

    private sealed class RecordingFeedImporter(Func<HomeOps.Api.CalendarEvents.EventSource, ICalFeedImportResult> import) : IICalFeedImporter
    {
        public int CallCount { get; private set; }
        public Task<ICalFeedImportResult> ImportAsync(HomeOps.Api.CalendarEvents.EventSource source, CancellationToken cancellationToken = default)
        {
            CallCount++;
            return Task.FromResult(import(source));
        }
    }

    private sealed class RecordingFileImporter(Func<HomeOps.Api.CalendarEvents.EventSource, ICalFileImportResult> import) : IICalFileImporter
    {
        public int CallCount { get; private set; }
        public Task<ICalFileImportResult> ImportAsync(HomeOps.Api.CalendarEvents.EventSource source, CancellationToken cancellationToken = default)
        {
            CallCount++;
            return Task.FromResult(import(source));
        }
    }
}
