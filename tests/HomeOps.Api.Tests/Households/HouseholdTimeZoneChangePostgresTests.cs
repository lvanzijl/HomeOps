using HomeOps.Api.CalendarEvents;
using HomeOps.Api.CalendarEvents.ICalendar;
using HomeOps.Api.CalendarEvents.Synchronization;
using HomeOps.Api.Data;
using HomeOps.Api.Households;
using HomeOps.Api.Tests.Infrastructure;
using HomeOps.Contracts.Households;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.Tests.Households;

public sealed class HouseholdTimeZoneChangePostgresTests
{
    [Fact]
    public async Task Zone_change_is_atomic_preserves_manual_fields_and_replaces_imported_projection()
    {
        await using var database = await PostgresTestDatabase.TryCreateAsync();
        if (database is null) return;
        await database.MigrateAsync();
        await using var db = database.CreateContext();
        var source = await AddImportedSourceAsync(db, enabled: true, "Europe/Amsterdam");
        var manual = await AddManualEventAsync(db);
        var originalProjection = EventSeriesNormalizer.ToDto(manual, "Europe/Amsterdam").StartUtc;
        await AddImportedEventAsync(db, source.Id, new DateOnly(2026, 7, 1), "old-fingerprint");
        var importer = new ZoneAwareFeedImporter((_, zone, force) =>
        {
            Assert.Equal("America/New_York", zone);
            Assert.True(force);
            return Success(Event("provider-event", new DateOnly(2026, 6, 30), $"provider-event:{zone}"));
        });
        var service = CreateService(db, importer);

        var result = await service.ChangeAsync(new UpdateHouseholdTimeZoneRequest("America/New_York", "Europe/Amsterdam", true));

        Assert.Equal(HouseholdTimeZoneChangeStatus.Success, result.Status);
        db.ChangeTracker.Clear();
        var household = await db.Households.SingleAsync(item => item.Id == SeedHousehold.Id);
        var storedManual = await db.EventSeries.SingleAsync(item => item.Id == manual.Id);
        var imported = await db.EventSeries.SingleAsync(item => item.EventSourceId == source.Id);
        var storedSource = await db.EventSources.SingleAsync(item => item.Id == source.Id);
        Assert.Equal("America/New_York", household.TimeZoneId);
        Assert.Equal(manual.StartDate, storedManual.StartDate);
        Assert.Equal(manual.StartTime, storedManual.StartTime);
        Assert.NotEqual(originalProjection, EventSeriesNormalizer.ToDto(storedManual, "America/New_York").StartUtc);
        Assert.Equal(new DateOnly(2026, 6, 30), imported.StartDate);
        Assert.Equal("America/New_York", storedSource.NormalizationTimeZoneId);
        Assert.Equal(1, importer.CallCount);
    }

    [Fact]
    public async Task Failed_enabled_source_preflight_rolls_back_zone_and_all_event_changes()
    {
        await using var database = await PostgresTestDatabase.TryCreateAsync();
        if (database is null) return;
        await database.MigrateAsync();
        await using var db = database.CreateContext();
        var source = await AddImportedSourceAsync(db, enabled: true, "Europe/Amsterdam");
        await AddImportedEventAsync(db, source.Id, new DateOnly(2026, 7, 1), "old-fingerprint");
        var importer = new ZoneAwareFeedImporter((_, _, _) => ICalFeedImportResult.Failed(
            new ICalFeedImportFailure(ICalFeedImportFailureCategory.NetworkFailure, "Feed unavailable"),
            [new ICalendarParseDiagnostic(ICalendarParseDiagnosticSeverity.Error, "NetworkFailure", "Feed unavailable")],
            null,
            null));
        var service = CreateService(db, importer);

        var result = await service.ChangeAsync(new UpdateHouseholdTimeZoneRequest("America/New_York", "Europe/Amsterdam", true));

        Assert.Equal(HouseholdTimeZoneChangeStatus.PreflightFailed, result.Status);
        Assert.Single(result.SourceFailures);
        db.ChangeTracker.Clear();
        Assert.Equal("Europe/Amsterdam", (await db.Households.SingleAsync(item => item.Id == SeedHousehold.Id)).TimeZoneId);
        Assert.Equal(new DateOnly(2026, 7, 1), (await db.EventSeries.SingleAsync(item => item.EventSourceId == source.Id)).StartDate);
        Assert.Equal("Europe/Amsterdam", (await db.EventSources.SingleAsync(item => item.Id == source.Id)).NormalizationTimeZoneId);
    }

    [Fact]
    public async Task Disabled_source_is_marked_stale_until_successful_refresh_in_current_zone()
    {
        await using var database = await PostgresTestDatabase.TryCreateAsync();
        if (database is null) return;
        await database.MigrateAsync();
        await using var db = database.CreateContext();
        var source = await AddImportedSourceAsync(db, enabled: false, "Europe/Amsterdam");
        var importer = new ZoneAwareFeedImporter((_, zone, force) => Success(Event("provider-event", new DateOnly(2026, 7, 1), $"provider-event:{zone}:{force}")));
        var engine = new CalendarSourceSynchronizationEngine(db);
        var dispatcher = new CalendarSourceRefreshDispatcher(importer, new UnusedFileImporter(), engine, db);
        var service = new HouseholdTimeZoneChangeService(db, dispatcher, engine);

        var result = await service.ChangeAsync(new UpdateHouseholdTimeZoneRequest("America/New_York", "Europe/Amsterdam", true));
        Assert.Equal(HouseholdTimeZoneChangeStatus.Success, result.Status);
        db.ChangeTracker.Clear();
        var staleSource = await db.EventSources.AsNoTracking().SingleAsync(item => item.Id == source.Id);
        Assert.Null(staleSource.NormalizationTimeZoneId);

        await dispatcher.RefreshAsync(staleSource);

        db.ChangeTracker.Clear();
        Assert.Equal("America/New_York", (await db.EventSources.SingleAsync(item => item.Id == source.Id)).NormalizationTimeZoneId);
    }

    private static HouseholdTimeZoneChangeService CreateService(HomeOpsDbContext db, IICalFeedImporter importer)
    {
        var engine = new CalendarSourceSynchronizationEngine(db);
        var dispatcher = new CalendarSourceRefreshDispatcher(importer, new UnusedFileImporter(), engine, db);
        return new HouseholdTimeZoneChangeService(db, dispatcher, engine);
    }

    private static async Task<EventSource> AddImportedSourceAsync(HomeOpsDbContext db, bool enabled, string normalizationZone)
    {
        var now = DateTimeOffset.UtcNow;
        var source = new EventSource { Id = Guid.NewGuid(), HouseholdId = SeedHousehold.Id, Name = "Gezinsfeed", Icon = "C", SourceType = EventSourceTypes.ICalFeed, IsEnabled = enabled, HealthStatus = EventSourceHealthStatus.Healthy, PollInterval = EventSourcePollInterval.Every8Hours, NormalizationTimeZoneId = normalizationZone, CreatedUtc = now, UpdatedUtc = now };
        db.EventSources.Add(source);
        db.ICalFeedSourceConfigurations.Add(new ICalFeedSourceConfiguration { EventSourceId = source.Id, FeedUrl = "https://example.test/calendar.ics", CreatedUtc = now, UpdatedUtc = now });
        await db.SaveChangesAsync();
        return source;
    }

    private static async Task<EventSeries> AddManualEventAsync(HomeOpsDbContext db)
    {
        var now = DateTimeOffset.UtcNow;
        var item = new EventSeries { Id = Guid.NewGuid(), EventSourceId = SeedCalendarEvents.EventSourceId, Title = "Handmatig", StartDate = new DateOnly(2026, 7, 1), StartTime = new TimeOnly(9, 0), EndDate = new DateOnly(2026, 7, 1), EndTime = new TimeOnly(10, 0), IsAllDay = false, CalendarWriteContractVersion = 2, CreatedUtc = now, UpdatedUtc = now };
        db.EventSeries.Add(item);
        await db.SaveChangesAsync();
        return item;
    }

    private static async Task AddImportedEventAsync(HomeOpsDbContext db, Guid sourceId, DateOnly date, string fingerprint)
    {
        var now = DateTimeOffset.UtcNow;
        db.EventSeries.Add(new EventSeries { Id = Guid.NewGuid(), EventSourceId = sourceId, Title = "Import", ProviderEventId = "provider-event", ContentFingerprint = fingerprint, ImportedAtUtc = now, LastImportedUtc = now, LastSeenSyncAttemptUtc = now, StartDate = date, StartTime = new TimeOnly(9, 0), EndDate = date, EndTime = new TimeOnly(10, 0), IsAllDay = false, CreatedUtc = now, UpdatedUtc = now });
        await db.SaveChangesAsync();
    }

    private static NormalizedICalendarEvent Event(string id, DateOnly date, string fingerprint) => new(id, "revision", fingerprint, "Import", null, null, date, new TimeOnly(9, 0), date, new TimeOnly(10, 0), false, null, null, 0, null, null, RecurrenceType.None, null);
    private static ICalFeedImportResult Success(NormalizedICalendarEvent item) => ICalFeedImportResult.Success([item], [], new ICalFeedProviderMetadata(Guid.NewGuid(), EventSourceTypes.ICalFeed, "provider", new Uri("https://example.test/calendar.ics")), new ICalFeedRetrievalMetadata(System.Net.HttpStatusCode.OK, new Uri("https://example.test/calendar.ics"), new Uri("https://example.test/calendar.ics"), null, null, "text/calendar", 100, false));

    private sealed class ZoneAwareFeedImporter(Func<EventSource, string, bool, ICalFeedImportResult> import) : IICalFeedImporter
    {
        public int CallCount { get; private set; }
        public Task<ICalFeedImportResult> ImportAsync(EventSource source, CancellationToken cancellationToken = default) => ImportForZoneAsync(source, HouseholdTimeZone.DefaultTimeZoneId, false, cancellationToken);
        public Task<ICalFeedImportResult> ImportForZoneAsync(EventSource source, string householdTimeZoneId, bool forceFullLoad, CancellationToken cancellationToken = default) { CallCount++; return Task.FromResult(import(source, householdTimeZoneId, forceFullLoad)); }
    }

    private sealed class UnusedFileImporter : IICalFileImporter
    {
        public Task<ICalFileImportResult> ImportAsync(EventSource source, CancellationToken cancellationToken = default) => throw new InvalidOperationException("File importer should not be called.");
    }
}
