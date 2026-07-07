using HomeOps.Api.CalendarEvents;
using HomeOps.Api.CalendarEvents.ICalendar;
using HomeOps.Api.CalendarEvents.Synchronization;
using HomeOps.Api.Data;
using HomeOps.Api.Households;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.Tests.CalendarEvents;

public sealed class CalendarSourceSynchronizationEngineTests
{
    private static readonly DateTimeOffset SyncNow = new(2026, 7, 5, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task NewProviderEventCreatesImportedSeries()
    {
        await using var database = await SqliteSyncTestDatabase.CreateAsync();
        var source = await database.AddSourceAsync(EventSourceTypes.ICalFeed);
        var engine = CreateEngine(database.Context);

        var result = await engine.SynchronizeAsync(source, CalendarProviderSnapshot.Successful([ProviderEvent("provider-1", title: "Created")], providerSourceId: "calendar-1"));

        Assert.True(result.Succeeded);
        Assert.Equal(1, result.CreatedCount);
        var created = await database.Context.EventSeries.SingleAsync(series => series.EventSourceId == source.Id);
        Assert.Equal("provider-1", created.ProviderEventId);
        Assert.Equal("Created", created.Title);
        Assert.Equal("fingerprint-provider-1", created.ContentFingerprint);
        Assert.Equal(SyncNow, created.ImportedAtUtc);
        Assert.Equal(SyncNow, created.LastImportedUtc);
        Assert.Equal(SyncNow, created.LastSeenSyncAttemptUtc);
    }

    [Fact]
    public async Task ExistingProviderEventWithSameFingerprintIsUnchanged()
    {
        await using var database = await SqliteSyncTestDatabase.CreateAsync();
        var source = await database.AddSourceAsync(EventSourceTypes.ICalFeed);
        var existing = await database.AddImportedSeriesAsync(source.Id, "provider-1", "Original", "fingerprint-provider-1", SyncNow.AddDays(-1));
        var engine = CreateEngine(database.Context);

        var result = await engine.SynchronizeAsync(source, CalendarProviderSnapshot.Successful([ProviderEvent("provider-1", title: "Changed Title But Same Fingerprint")]));

        Assert.True(result.Succeeded);
        Assert.Equal(1, result.UnchangedCount);
        database.Context.ChangeTracker.Clear();
        var persisted = await database.Context.EventSeries.SingleAsync(series => series.Id == existing.Id);
        Assert.Equal("Original", persisted.Title);
        Assert.Equal(SyncNow.AddDays(-1), persisted.UpdatedUtc);
        Assert.Equal(SyncNow, persisted.LastSeenSyncAttemptUtc);
    }

    [Fact]
    public async Task ExistingProviderEventWithDifferentFingerprintIsUpdated()
    {
        await using var database = await SqliteSyncTestDatabase.CreateAsync();
        var source = await database.AddSourceAsync(EventSourceTypes.ICalFeed);
        var existing = await database.AddImportedSeriesAsync(source.Id, "provider-1", "Old", "old-fingerprint", SyncNow.AddDays(-1));
        var engine = CreateEngine(database.Context);

        var result = await engine.SynchronizeAsync(source, CalendarProviderSnapshot.Successful([ProviderEvent("provider-1", title: "Updated", fingerprint: "new-fingerprint", location: "Gym")]));

        Assert.True(result.Succeeded);
        Assert.Equal(1, result.UpdatedCount);
        database.Context.ChangeTracker.Clear();
        var persisted = await database.Context.EventSeries.SingleAsync(series => series.Id == existing.Id);
        Assert.Equal("Updated", persisted.Title);
        Assert.Equal("Gym", persisted.Location);
        Assert.Equal("new-fingerprint", persisted.ContentFingerprint);
        Assert.Equal(SyncNow, persisted.UpdatedUtc);
        Assert.Equal(SyncNow, persisted.LastImportedUtc);
    }


    [Fact]
    public async Task SuccessfulSnapshotCreatesRecurrenceRuleAndExceptions()
    {
        await using var database = await SqliteSyncTestDatabase.CreateAsync();
        var source = await database.AddSourceAsync(EventSourceTypes.ICalFeed);
        var engine = CreateEngine(database.Context);
        var recurrenceRule = new EventRecurrenceRule { Frequency = RecurrenceFrequency.Weekly, Interval = 1, EndMode = RecurrenceEndMode.AfterCount, Count = 4, WeeklyDays = WeeklyDays.Serialize([DayOfWeek.Monday]), RawProviderRecurrenceRule = "FREQ=WEEKLY;COUNT=4;BYDAY=MO" };
        var exceptions = new NormalizedICalendarEventException[]
        {
            new(OccurrenceKey.Parse("2026-07-13T09:00:00"), EventExceptionType.Skipped, RawProviderRecurrenceId: "20260713T090000", NormalizedProviderRecurrenceId: "2026-07-13T09:00:00"),
            new(OccurrenceKey.Parse("2026-07-20T09:00:00"), EventExceptionType.Modified, Title: "Moved", Location: "Gym", StartDate: new DateOnly(2026, 7, 21), StartTime: new TimeOnly(11, 0), EndDate: new DateOnly(2026, 7, 21), EndTime: new TimeOnly(12, 0), RawProviderRecurrenceId: "20260720T090000", DetachedProviderEventId: "provider-1")
        };

        var result = await engine.SynchronizeAsync(source, CalendarProviderSnapshot.Successful([ProviderEvent("provider-1", recurrenceType: RecurrenceType.None, recurrenceRule: recurrenceRule, exceptions: exceptions)]));

        Assert.True(result.Succeeded);
        var series = await database.Context.EventSeries.Include(series => series.Exceptions).SingleAsync(series => series.ProviderEventId == "provider-1");
        Assert.Equal(RecurrenceType.None, series.RecurrenceType);
        Assert.NotNull(series.RecurrenceRule);
        Assert.Equal(RecurrenceFrequency.Weekly, series.RecurrenceRule.Frequency);
        Assert.Equal("FREQ=WEEKLY;COUNT=4;BYDAY=MO", series.RecurrenceRule.RawProviderRecurrenceRule);
        Assert.Equal(2, series.Exceptions.Count);
        Assert.Contains(series.Exceptions, exception => exception.ExceptionType == EventExceptionType.Skipped && exception.OccurrenceKey.Serialize() == "2026-07-13T09:00:00");
        Assert.Contains(series.Exceptions, exception => exception.ExceptionType == EventExceptionType.Modified && exception.Title == "Moved" && exception.DetachedProviderEventId == "provider-1");
    }

    [Fact]
    public async Task SuccessfulSnapshotUpdatesRecurrenceRuleAndRemovesMissingExceptions()
    {
        await using var database = await SqliteSyncTestDatabase.CreateAsync();
        var source = await database.AddSourceAsync(EventSourceTypes.ICalFeed);
        var existing = await database.AddImportedSeriesAsync(source.Id, "provider-1", "Old", "old-fingerprint", SyncNow.AddDays(-1));
        existing.RecurrenceRule = new EventRecurrenceRule { Frequency = RecurrenceFrequency.Daily, Interval = 1, EndMode = RecurrenceEndMode.AfterCount, Count = 5, RawProviderRecurrenceRule = "FREQ=DAILY;COUNT=5" };
        database.Context.EventExceptions.Add(new EventException { Id = Guid.NewGuid(), EventSeriesId = existing.Id, OccurrenceDate = new DateOnly(2026, 7, 7), OccurrenceKey = OccurrenceKey.Parse("2026-07-07T09:00:00"), ExceptionType = EventExceptionType.Skipped, IsSkipped = true, CreatedUtc = SyncNow.AddDays(-1), UpdatedUtc = SyncNow.AddDays(-1) });
        await database.Context.SaveChangesAsync();
        var engine = CreateEngine(database.Context);
        var replacementRule = new EventRecurrenceRule { Frequency = RecurrenceFrequency.Monthly, Interval = 1, EndMode = RecurrenceEndMode.Never, MonthlyDayOfMonth = 6, RawProviderRecurrenceRule = "FREQ=MONTHLY;BYMONTHDAY=6" };

        var result = await engine.SynchronizeAsync(source, CalendarProviderSnapshot.Successful([ProviderEvent("provider-1", title: "Updated", fingerprint: "new-fingerprint", recurrenceType: RecurrenceType.None, recurrenceRule: replacementRule, exceptions: [])]));

        Assert.True(result.Succeeded);
        database.Context.ChangeTracker.Clear();
        var series = await database.Context.EventSeries.Include(series => series.Exceptions).SingleAsync(series => series.Id == existing.Id);
        Assert.Equal(RecurrenceFrequency.Monthly, series.RecurrenceRule!.Frequency);
        Assert.Equal(6, series.RecurrenceRule.MonthlyDayOfMonth);
        Assert.Empty(series.Exceptions);
    }

    [Fact]
    public async Task DuplicateProviderEventIdsAreRejectedAndDoNotCreateEvents()
    {
        await using var database = await SqliteSyncTestDatabase.CreateAsync();
        var source = await database.AddSourceAsync(EventSourceTypes.ICalFeed);
        var engine = CreateEngine(database.Context);

        var result = await engine.SynchronizeAsync(source, CalendarProviderSnapshot.Successful([
            ProviderEvent("duplicate"),
            ProviderEvent("duplicate", title: "Duplicate")
        ]));

        Assert.False(result.Succeeded);
        Assert.Equal(EventSourceHealthStatus.Failed, result.SourceHealthStatus);
        Assert.Contains(result.Diagnostics, diagnostic => diagnostic.Code == "DuplicateProviderEventId");
        Assert.False(await database.Context.EventSeries.AnyAsync(series => series.EventSourceId == source.Id));
        database.Context.ChangeTracker.Clear();
        var persistedSource = await database.Context.EventSources.SingleAsync(candidate => candidate.Id == source.Id);
        Assert.Equal(EventSourceHealthStatus.Failed, persistedSource.HealthStatus);
        Assert.Equal("DuplicateProviderEventId", persistedSource.LastErrorCode);
    }

    [Fact]
    public async Task SameProviderEventIdAcrossDifferentSourcesIsAllowedAndOtherSourceIsUntouched()
    {
        await using var database = await SqliteSyncTestDatabase.CreateAsync();
        var sourceA = await database.AddSourceAsync(EventSourceTypes.ICalFeed, "A");
        var sourceB = await database.AddSourceAsync(EventSourceTypes.ICalFile, "B");
        var existingA = await database.AddImportedSeriesAsync(sourceA.Id, "shared-provider-id", "Source A", "a-fingerprint", SyncNow.AddDays(-2));
        var engine = CreateEngine(database.Context);

        var result = await engine.SynchronizeAsync(sourceB, CalendarProviderSnapshot.Successful([ProviderEvent("shared-provider-id", title: "Source B")]));

        Assert.True(result.Succeeded);
        Assert.Equal(1, result.CreatedCount);
        database.Context.ChangeTracker.Clear();
        Assert.Equal("Source A", (await database.Context.EventSeries.SingleAsync(series => series.Id == existingA.Id)).Title);
        Assert.Equal(2, await database.Context.EventSeries.CountAsync(series => series.ProviderEventId == "shared-provider-id"));
    }

    [Fact]
    public async Task RemovedProviderEventIsDeletedAfterSuccessfulSnapshot()
    {
        await using var database = await SqliteSyncTestDatabase.CreateAsync();
        var source = await database.AddSourceAsync(EventSourceTypes.ICalFeed);
        var removed = await database.AddImportedSeriesAsync(source.Id, "removed", "Removed", "removed-fingerprint", SyncNow.AddDays(-1));
        await database.AddImportedSeriesAsync(source.Id, "kept", "Kept", "fingerprint-kept", SyncNow.AddDays(-1));
        var engine = CreateEngine(database.Context);

        var result = await engine.SynchronizeAsync(source, CalendarProviderSnapshot.Successful([ProviderEvent("kept")]));

        Assert.True(result.Succeeded);
        Assert.Equal(1, result.DeletedCount);
        Assert.False(await database.Context.EventSeries.AnyAsync(series => series.Id == removed.Id));
        Assert.True(await database.Context.EventSeries.AnyAsync(series => series.ProviderEventId == "kept"));
    }

    [Fact]
    public async Task FailedSnapshotDeletesNothingAndUpdatesFailureMetadata()
    {
        await using var database = await SqliteSyncTestDatabase.CreateAsync();
        var source = await database.AddSourceAsync(EventSourceTypes.ICalFeed);
        await database.AddImportedSeriesAsync(source.Id, "existing", "Existing", "existing-fingerprint", SyncNow.AddDays(-1));
        var engine = CreateEngine(database.Context);

        var result = await engine.SynchronizeAsync(source, CalendarProviderSnapshot.Failed("NetworkFailure", "Network unavailable", [Warning("stale warning")], "timeout"));

        Assert.False(result.Succeeded);
        Assert.Equal(1, await database.Context.EventSeries.CountAsync(series => series.EventSourceId == source.Id));
        database.Context.ChangeTracker.Clear();
        var persistedSource = await database.Context.EventSources.SingleAsync(candidate => candidate.Id == source.Id);
        Assert.Equal(EventSourceHealthStatus.Failed, persistedSource.HealthStatus);
        Assert.Equal(SyncNow, persistedSource.LastSyncAttemptUtc);
        Assert.Equal(SyncNow, persistedSource.LastFailedSyncUtc);
        Assert.Equal("NetworkFailure", persistedSource.LastErrorCode);
        Assert.Equal("Network unavailable", persistedSource.LastErrorMessage);
        Assert.Equal("timeout", persistedSource.LastErrorDetail);
    }

    [Fact]
    public async Task ParserErrorDeletesNothingAndMarksSourceFailed()
    {
        await using var database = await SqliteSyncTestDatabase.CreateAsync();
        var source = await database.AddSourceAsync(EventSourceTypes.ICalFeed);
        await database.AddImportedSeriesAsync(source.Id, "existing", "Existing", "existing-fingerprint", SyncNow.AddDays(-1));
        var engine = CreateEngine(database.Context);

        var result = await engine.SynchronizeAsync(source, CalendarProviderSnapshot.Successful([ProviderEvent("existing")], [Error("MalformedCalendar", "Bad calendar") ]));

        Assert.False(result.Succeeded);
        Assert.Equal(1, await database.Context.EventSeries.CountAsync(series => series.EventSourceId == source.Id));
        database.Context.ChangeTracker.Clear();
        var persistedSource = await database.Context.EventSources.SingleAsync(candidate => candidate.Id == source.Id);
        Assert.Equal(EventSourceHealthStatus.Failed, persistedSource.HealthStatus);
        Assert.Equal("ParseFailure", persistedSource.LastErrorCode);
    }

    [Fact]
    public async Task NotModifiedSnapshotDeletesNothingAndUpdatesSuccessMetadata()
    {
        await using var database = await SqliteSyncTestDatabase.CreateAsync();
        var source = await database.AddSourceAsync(EventSourceTypes.ICalFeed);
        await database.AddImportedSeriesAsync(source.Id, "existing", "Existing", "existing-fingerprint", SyncNow.AddDays(-1));
        var engine = CreateEngine(database.Context);

        var result = await engine.SynchronizeAsync(source, CalendarProviderSnapshot.NotModified(providerSourceId: "provider-calendar"));

        Assert.True(result.Succeeded);
        Assert.Equal(0, result.DeletedCount);
        Assert.Equal(1, await database.Context.EventSeries.CountAsync(series => series.EventSourceId == source.Id));
        database.Context.ChangeTracker.Clear();
        var persistedSource = await database.Context.EventSources.SingleAsync(candidate => candidate.Id == source.Id);
        Assert.Equal(EventSourceHealthStatus.Healthy, persistedSource.HealthStatus);
        Assert.Equal(SyncNow, persistedSource.LastSuccessfulSyncUtc);
        Assert.Equal("provider-calendar", persistedSource.ProviderSourceId);
    }

    [Fact]
    public async Task EmptySuccessfulSnapshotDeletesExistingImportedEventsButLeavesManualEvents()
    {
        await using var database = await SqliteSyncTestDatabase.CreateAsync();
        var source = await database.AddSourceAsync(EventSourceTypes.ICalFeed);
        var manualSource = await database.AddSourceAsync(EventSourceTypes.Manual, "Manual", writable: true);
        await database.AddImportedSeriesAsync(source.Id, "existing", "Existing", "existing-fingerprint", SyncNow.AddDays(-1));
        var manual = await database.AddManualSeriesAsync(manualSource.Id, "Manual", SyncNow.AddDays(-1));
        var engine = CreateEngine(database.Context);

        var result = await engine.SynchronizeAsync(source, CalendarProviderSnapshot.Successful([]));

        Assert.True(result.Succeeded);
        Assert.Equal(1, result.DeletedCount);
        Assert.False(await database.Context.EventSeries.AnyAsync(series => series.EventSourceId == source.Id));
        Assert.True(await database.Context.EventSeries.AnyAsync(series => series.Id == manual.Id));
    }

    [Fact]
    public async Task SuccessfulSyncClearsPreviousFailureAndUpdatesProviderSourceAndNextSync()
    {
        await using var database = await SqliteSyncTestDatabase.CreateAsync();
        var source = await database.AddSourceAsync(EventSourceTypes.ICalFeed, pollInterval: EventSourcePollInterval.EveryHour);
        source.HealthStatus = EventSourceHealthStatus.Failed;
        source.LastErrorCode = "Old";
        source.LastErrorMessage = "Old message";
        source.LastErrorDetail = "Old detail";
        await database.Context.SaveChangesAsync();
        var engine = CreateEngine(database.Context);

        var result = await engine.SynchronizeAsync(source, CalendarProviderSnapshot.Successful([ProviderEvent("provider-1")], [Warning("UnsupportedRecurrence")], providerSourceId: "provider-source"));

        Assert.True(result.Succeeded);
        Assert.Equal(1, result.WarningCount);
        database.Context.ChangeTracker.Clear();
        var persistedSource = await database.Context.EventSources.SingleAsync(candidate => candidate.Id == source.Id);
        Assert.Equal(EventSourceHealthStatus.Healthy, persistedSource.HealthStatus);
        Assert.Equal(SyncNow, persistedSource.LastSyncAttemptUtc);
        Assert.Equal(SyncNow, persistedSource.LastSuccessfulSyncUtc);
        Assert.Null(persistedSource.LastFailedSyncUtc);
        Assert.Null(persistedSource.LastErrorCode);
        Assert.Null(persistedSource.LastErrorMessage);
        Assert.Null(persistedSource.LastErrorDetail);
        Assert.Equal("provider-source", persistedSource.ProviderSourceId);
        Assert.Equal(SyncNow.AddHours(1), persistedSource.NextSyncAfterUtc);
    }

    [Fact]
    public async Task OtherSourcesAndManualEventsAreUntouchedByDeletion()
    {
        await using var database = await SqliteSyncTestDatabase.CreateAsync();
        var source = await database.AddSourceAsync(EventSourceTypes.ICalFeed, "A");
        var otherSource = await database.AddSourceAsync(EventSourceTypes.ICalFeed, "B");
        var other = await database.AddImportedSeriesAsync(otherSource.Id, "other", "Other", "other-fingerprint", SyncNow.AddDays(-1));
        var manual = await database.AddManualSeriesAsync(source.Id, "Manual on provider source", SyncNow.AddDays(-1));
        await database.AddImportedSeriesAsync(source.Id, "removed", "Removed", "removed-fingerprint", SyncNow.AddDays(-1));
        var engine = CreateEngine(database.Context);

        var result = await engine.SynchronizeAsync(source, CalendarProviderSnapshot.Successful([]));

        Assert.True(result.Succeeded);
        Assert.True(await database.Context.EventSeries.AnyAsync(series => series.Id == other.Id));
        Assert.True(await database.Context.EventSeries.AnyAsync(series => series.Id == manual.Id));
        Assert.Null((await database.Context.EventSeries.SingleAsync(series => series.Id == manual.Id)).ProviderEventId);
    }

    [Fact]
    public async Task PartialFailureRollsBackSynchronizationChanges()
    {
        await using var database = await SqliteSyncTestDatabase.CreateAsync();
        var source = await database.AddSourceAsync(EventSourceTypes.ICalFeed);
        await database.Context.Database.ExecuteSqlRawAsync("""
            CREATE TRIGGER FailEventSeriesInsert
            BEFORE INSERT ON "EventSeries"
            BEGIN
                SELECT RAISE(ROLLBACK, 'simulated event insert failure');
            END;
            """);
        var engine = CreateEngine(database.Context);

        var result = await engine.SynchronizeAsync(source, CalendarProviderSnapshot.Successful([ProviderEvent("provider-1")]));

        Assert.False(result.Succeeded);
        await using var verificationContext = database.CreateContext();
        Assert.False(await verificationContext.EventSeries.AnyAsync(series => series.EventSourceId == source.Id));
        var persistedSource = await verificationContext.EventSources.SingleAsync(candidate => candidate.Id == source.Id);
        Assert.NotEqual(SyncNow, persistedSource.LastSuccessfulSyncUtc);
    }

    [Fact]
    public async Task PersistenceFailureRollsBackEventSeriesChangesAndSourceMetadata()
    {
        await using var database = await SqliteSyncTestDatabase.CreateAsync();
        var source = await database.AddSourceAsync(EventSourceTypes.ICalFeed);
        source.HealthStatus = EventSourceHealthStatus.NeverSynced;
        await database.Context.SaveChangesAsync();
        await database.Context.Database.ExecuteSqlRawAsync("""
            CREATE TRIGGER FailEventSeriesInsertForAtomicity
            BEFORE INSERT ON "EventSeries"
            BEGIN
                SELECT RAISE(ROLLBACK, 'simulated atomicity failure');
            END;
            """);
        var engine = CreateEngine(database.Context);

        var result = await engine.SynchronizeAsync(source, CalendarProviderSnapshot.Successful([ProviderEvent("provider-atomic")]));

        Assert.False(result.Succeeded);
        await using var verificationContext = database.CreateContext();
        Assert.False(await verificationContext.EventSeries.AnyAsync(series => series.EventSourceId == source.Id));
        var persistedSource = await verificationContext.EventSources.SingleAsync(candidate => candidate.Id == source.Id);
        Assert.Equal(EventSourceHealthStatus.NeverSynced, persistedSource.HealthStatus);
        Assert.Null(persistedSource.LastSyncAttemptUtc);
        Assert.Null(persistedSource.LastSuccessfulSyncUtc);
    }

    private static CalendarSourceSynchronizationEngine CreateEngine(HomeOpsDbContext context) =>
        new(context, new FixedTimeProvider(SyncNow));

    private static NormalizedProviderEvent ProviderEvent(
        string providerEventId,
        string? title = null,
        string? fingerprint = null,
        string? location = null,
        RecurrenceType recurrenceType = RecurrenceType.None,
        EventRecurrenceRule? recurrenceRule = null,
        IReadOnlyList<NormalizedICalendarEventException>? exceptions = null) =>
        new(
            providerEventId,
            ProviderRevision: $"revision-{providerEventId}",
            ContentFingerprint: fingerprint ?? $"fingerprint-{providerEventId}",
            Title: title ?? "Provider Event",
            Description: "Description",
            Location: location,
            StartDate: new DateOnly(2026, 7, 6),
            StartTime: new TimeOnly(9, 0),
            EndDate: new DateOnly(2026, 7, 6),
            EndTime: new TimeOnly(10, 0),
            IsAllDay: false,
            RecurrenceType: recurrenceType,
            RecurrenceRule: recurrenceRule,
            Exceptions: exceptions ?? []);

    private static ICalendarParseDiagnostic Warning(string code) =>
        new(ICalendarParseDiagnosticSeverity.Warning, code, code);

    private static ICalendarParseDiagnostic Error(string code, string message) =>
        new(ICalendarParseDiagnosticSeverity.Error, code, message);

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }

    private sealed class SqliteSyncTestDatabase : IAsyncDisposable
    {
        private readonly SqliteConnection connection;

        private SqliteSyncTestDatabase(SqliteConnection connection, HomeOpsDbContext context)
        {
            this.connection = connection;
            Context = context;
        }

        public HomeOpsDbContext Context { get; }

        public static async Task<SqliteSyncTestDatabase> CreateAsync()
        {
            var connection = new SqliteConnection("Data Source=:memory:");
            await connection.OpenAsync();
            var context = CreateContext(connection);
            await context.Database.EnsureCreatedAsync();
            if (!await context.Households.AnyAsync(household => household.Id == SeedHousehold.Id))
            {
                context.Households.Add(new Household
                {
                    Id = SeedHousehold.Id,
                    Name = SeedHousehold.Name,
                    TimeZoneId = SeedHousehold.TimeZoneId,
                    OnboardingCompleted = true,
                    CreatedUtc = SyncNow.AddDays(-10),
                    UpdatedUtc = SyncNow.AddDays(-10),
                });
                await context.SaveChangesAsync();
            }
            return new SqliteSyncTestDatabase(connection, context);
        }

        public HomeOpsDbContext CreateContext() => CreateContext(connection);

        public async Task<EventSource> AddSourceAsync(
            string sourceType,
            string name = "Source",
            bool writable = false,
            EventSourcePollInterval pollInterval = EventSourcePollInterval.Every8Hours)
        {
            var source = new EventSource
            {
                Id = Guid.NewGuid(),
                HouseholdId = SeedHousehold.Id,
                Name = name,
                SourceType = sourceType,
                IsEnabled = true,
                IsWritable = writable,
                HealthStatus = writable ? EventSourceHealthStatus.Healthy : EventSourceHealthStatus.NeverSynced,
                PollInterval = pollInterval,
                CreatedUtc = SyncNow.AddDays(-3),
                UpdatedUtc = SyncNow.AddDays(-3),
            };
            Context.EventSources.Add(source);
            await Context.SaveChangesAsync();
            return source;
        }

        public async Task<EventSeries> AddImportedSeriesAsync(Guid sourceId, string providerEventId, string title, string fingerprint, DateTimeOffset timestamp)
        {
            var series = CreateSeries(sourceId, title, timestamp);
            series.ProviderEventId = providerEventId;
            series.ProviderRevision = $"revision-{providerEventId}";
            series.ContentFingerprint = fingerprint;
            series.ImportedAtUtc = timestamp;
            series.LastImportedUtc = timestamp;
            series.LastSeenSyncAttemptUtc = timestamp;
            Context.EventSeries.Add(series);
            await Context.SaveChangesAsync();
            return series;
        }

        public async Task<EventSeries> AddManualSeriesAsync(Guid sourceId, string title, DateTimeOffset timestamp)
        {
            var series = CreateSeries(sourceId, title, timestamp);
            Context.EventSeries.Add(series);
            await Context.SaveChangesAsync();
            return series;
        }

        private static EventSeries CreateSeries(Guid sourceId, string title, DateTimeOffset timestamp) => new()
        {
            Id = Guid.NewGuid(),
            EventSourceId = sourceId,
            Title = title,
            StartDate = new DateOnly(2026, 7, 6),
            StartTime = new TimeOnly(9, 0),
            EndDate = new DateOnly(2026, 7, 6),
            EndTime = new TimeOnly(10, 0),
            IsAllDay = false,
            RecurrenceType = RecurrenceType.None,
            CreatedUtc = timestamp,
            UpdatedUtc = timestamp,
        };

        private static HomeOpsDbContext CreateContext(SqliteConnection connection)
        {
            var options = new DbContextOptionsBuilder<HomeOpsDbContext>()
                .UseSqlite(connection)
                .Options;
            return new HomeOpsDbContext(options);
        }

        public async ValueTask DisposeAsync()
        {
            await Context.DisposeAsync();
            await connection.DisposeAsync();
        }
    }
}
