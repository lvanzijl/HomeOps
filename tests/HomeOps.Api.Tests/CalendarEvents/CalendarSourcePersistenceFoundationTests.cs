using HomeOps.Api.CalendarEvents;
using HomeOps.Api.Data;
using HomeOps.Api.Households;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.Tests.CalendarEvents;

public sealed class CalendarSourcePersistenceFoundationTests
{
    [Fact]
    public async Task EventSourcePersistsLifecycleHealthProviderAndSchedulingFields()
    {
        await using var database = await SqliteTestDatabase.CreateAsync();
        var now = DateTimeOffset.UtcNow;
        var source = CreateSource(EventSourceTypes.ICalFeed, "School", false, now);
        source.Icon = "🏫";
        source.IsEnabled = false;
        source.HealthStatus = EventSourceHealthStatus.Failed;
        source.PollInterval = EventSourcePollInterval.EveryDay;
        source.LastSyncAttemptUtc = now.AddMinutes(-3);
        source.LastSuccessfulSyncUtc = now.AddDays(-1);
        source.LastFailedSyncUtc = now.AddMinutes(-2);
        source.NextSyncAfterUtc = now.AddHours(1);
        source.LastErrorCode = "ParseFailed";
        source.LastErrorMessage = "Invalid calendar";
        source.LastErrorDetail = "Line 7";
        source.ProviderSourceId = "school-calendar";

        database.Context.EventSources.Add(source);
        await database.Context.SaveChangesAsync();
        database.Context.ChangeTracker.Clear();

        var persisted = await database.Context.EventSources.SingleAsync(candidate => candidate.Id == source.Id);
        Assert.Equal("🏫", persisted.Icon);
        Assert.False(persisted.IsEnabled);
        Assert.False(persisted.IsWritable);
        Assert.Equal(EventSourceHealthStatus.Failed, persisted.HealthStatus);
        Assert.Equal(EventSourcePollInterval.EveryDay, persisted.PollInterval);
        Assert.Equal("ParseFailed", persisted.LastErrorCode);
        Assert.Equal("Invalid calendar", persisted.LastErrorMessage);
        Assert.Equal("Line 7", persisted.LastErrorDetail);
        Assert.Equal("school-calendar", persisted.ProviderSourceId);
        Assert.NotNull(persisted.LastSyncAttemptUtc);
        Assert.NotNull(persisted.LastSuccessfulSyncUtc);
        Assert.NotNull(persisted.LastFailedSyncUtc);
        Assert.NotNull(persisted.NextSyncAfterUtc);
    }

    [Fact]
    public async Task EventSeriesPersistsImportedEventMetadata()
    {
        await using var database = await SqliteTestDatabase.CreateAsync();
        var now = DateTimeOffset.UtcNow;
        var source = CreateSource(EventSourceTypes.ICalFeed, "Feed", false, now);
        database.Context.EventSources.Add(source);
        var series = CreateSeries(source.Id, "Imported", now);
        series.Location = "Gym";
        series.ProviderEventId = "provider-1";
        series.ProviderInstanceId = "instance-1";
        series.ProviderRevision = "etag-1";
        series.ContentFingerprint = "abc123";
        series.ImportedAtUtc = now.AddMinutes(-4);
        series.LastImportedUtc = now.AddMinutes(-2);
        series.LastSeenSyncAttemptUtc = now.AddMinutes(-1);
        database.Context.EventSeries.Add(series);
        await database.Context.SaveChangesAsync();
        database.Context.ChangeTracker.Clear();

        var persisted = await database.Context.EventSeries.SingleAsync(candidate => candidate.Id == series.Id);
        Assert.Equal("Gym", persisted.Location);
        Assert.Equal("provider-1", persisted.ProviderEventId);
        Assert.Equal("instance-1", persisted.ProviderInstanceId);
        Assert.Equal("etag-1", persisted.ProviderRevision);
        Assert.Equal("abc123", persisted.ContentFingerprint);
        Assert.NotNull(persisted.ImportedAtUtc);
        Assert.NotNull(persisted.LastImportedUtc);
        Assert.NotNull(persisted.LastSeenSyncAttemptUtc);
    }

    [Fact]
    public async Task ProviderConfigurationsPersistAndCascadeWithSource()
    {
        await using var database = await SqliteTestDatabase.CreateAsync();
        var now = DateTimeOffset.UtcNow;
        var feedSource = CreateSource(EventSourceTypes.ICalFeed, "Feed", false, now);
        var fileSource = CreateSource(EventSourceTypes.ICalFile, "File", false, now);
        database.Context.EventSources.AddRange(feedSource, fileSource);
        database.Context.ICalFeedSourceConfigurations.Add(new ICalFeedSourceConfiguration
        {
            EventSourceId = feedSource.Id,
            FeedUrl = "https://example.test/calendar.ics",
            ETag = "etag",
            LastModified = "Sun, 05 Jul 2026 10:00:00 GMT",
            LastContentHash = "hash",
            CreatedUtc = now,
            UpdatedUtc = now,
        });
        database.Context.ICalFileSourceConfigurations.Add(new ICalFileSourceConfiguration
        {
            EventSourceId = fileSource.Id,
            FileReference = "calendar-files/file.ics",
            OriginalFilename = "file.ics",
            ContentHash = "file-hash",
            UploadedUtc = now,
            CreatedUtc = now,
            UpdatedUtc = now,
        });
        await database.Context.SaveChangesAsync();
        database.Context.ChangeTracker.Clear();

        Assert.Equal("https://example.test/calendar.ics", (await database.Context.ICalFeedSourceConfigurations.SingleAsync()).FeedUrl);
        Assert.Equal("file.ics", (await database.Context.ICalFileSourceConfigurations.SingleAsync()).OriginalFilename);

        database.Context.EventSources.Remove(await database.Context.EventSources.SingleAsync(source => source.Id == feedSource.Id));
        await database.Context.SaveChangesAsync();

        Assert.False(await database.Context.ICalFeedSourceConfigurations.AnyAsync());
        Assert.True(await database.Context.ICalFileSourceConfigurations.AnyAsync());
    }

    [Fact]
    public async Task MultipleSourcesWithSameSourceTypeAreAllowed()
    {
        await using var database = await SqliteTestDatabase.CreateAsync();
        var now = DateTimeOffset.UtcNow;
        database.Context.EventSources.AddRange(
            CreateSource(EventSourceTypes.ICalFeed, "Feed A", false, now),
            CreateSource(EventSourceTypes.ICalFeed, "Feed B", false, now));

        await database.Context.SaveChangesAsync();

        Assert.Equal(2, await database.Context.EventSources.CountAsync(source => source.SourceType == EventSourceTypes.ICalFeed));
    }

    [Fact]
    public async Task ProviderEventIdIsUniqueWithinSourceAndReusableAcrossSources()
    {
        await using var database = await SqliteTestDatabase.CreateAsync();
        var now = DateTimeOffset.UtcNow;
        var sourceA = CreateSource(EventSourceTypes.ICalFeed, "Feed A", false, now);
        var sourceB = CreateSource(EventSourceTypes.ICalFeed, "Feed B", false, now);
        database.Context.EventSources.AddRange(sourceA, sourceB);
        var eventA = CreateSeries(sourceA.Id, "Same provider id A", now);
        eventA.ProviderEventId = "provider-event";
        var eventB = CreateSeries(sourceB.Id, "Same provider id B", now);
        eventB.ProviderEventId = "provider-event";
        database.Context.EventSeries.AddRange(eventA, eventB);
        await database.Context.SaveChangesAsync();

        var duplicate = CreateSeries(sourceA.Id, "Duplicate", now);
        duplicate.ProviderEventId = "provider-event";
        database.Context.EventSeries.Add(duplicate);

        await Assert.ThrowsAsync<DbUpdateException>(() => database.Context.SaveChangesAsync());
    }

    [Fact]
    public async Task SourceDeleteCascadesImportedSeries()
    {
        await using var database = await SqliteTestDatabase.CreateAsync();
        var now = DateTimeOffset.UtcNow;
        var source = CreateSource(EventSourceTypes.ICalFeed, "Feed", false, now);
        database.Context.EventSources.Add(source);
        var series = CreateSeries(source.Id, "Imported", now);
        series.ProviderEventId = "provider-event";
        database.Context.EventSeries.Add(series);
        await database.Context.SaveChangesAsync();

        database.Context.EventSources.Remove(source);
        await database.Context.SaveChangesAsync();

        Assert.False(await database.Context.EventSeries.AnyAsync(candidate => candidate.Id == series.Id));
    }

    [Fact]
    public async Task ManualSeedUsesMigrationDefaultsAndManualSeriesHaveNullImportedMetadata()
    {
        await using var database = await SqliteTestDatabase.CreateAsync();

        var manualSource = await database.Context.EventSources.SingleAsync(source => source.Id == SeedCalendarEvents.EventSourceId);
        Assert.Equal(EventSourceTypes.Manual, manualSource.SourceType);
        Assert.Equal("📅", manualSource.Icon);
        Assert.True(manualSource.IsWritable);
        Assert.True(manualSource.IsEnabled);
        Assert.True(manualSource.IsSystem);
        Assert.True(manualSource.IsSystemManualSource);
        Assert.Equal(EventSourceHealthStatus.Healthy, manualSource.HealthStatus);
        Assert.Equal(EventSourcePollInterval.Every8Hours, manualSource.PollInterval);

        var manualSeries = await database.Context.EventSeries.Where(series => series.EventSourceId == manualSource.Id).ToListAsync();
        Assert.NotEmpty(manualSeries);
        Assert.All(manualSeries, series => Assert.Null(series.ProviderEventId));
        Assert.All(manualSeries, series => Assert.Null(series.ImportedAtUtc));
    }

    [Fact]
    public void ModelContainsRequiredPersistenceIndexes()
    {
        using var context = SqliteTestDatabase.CreateUninitializedContext();
        var sourceIndexes = context.Model.FindEntityType(typeof(EventSource))!.GetIndexes().Select(index => string.Join(",", index.Properties.Select(property => property.Name))).ToHashSet();
        var seriesIndexes = context.Model.FindEntityType(typeof(EventSeries))!.GetIndexes().Select(index => string.Join(",", index.Properties.Select(property => property.Name))).ToHashSet();

        Assert.Contains("HouseholdId,IsEnabled,HealthStatus", sourceIndexes);
        Assert.Contains("HouseholdId,SourceType", sourceIndexes);
        Assert.Contains("NextSyncAfterUtc", sourceIndexes);
        Assert.Contains("HouseholdId,IsSystem", sourceIndexes);
        Assert.Contains("EventSourceId,ProviderEventId", seriesIndexes);
        Assert.Contains("EventSourceId,LastSeenSyncAttemptUtc", seriesIndexes);
    }

    private static EventSource CreateSource(string sourceType, string name, bool writable, DateTimeOffset now) => new()
    {
        Id = Guid.NewGuid(),
        HouseholdId = SeedHousehold.Id,
        Name = name,
        SourceType = sourceType,
        IsWritable = writable,
        HealthStatus = writable ? EventSourceHealthStatus.Healthy : EventSourceHealthStatus.NeverSynced,
        CreatedUtc = now,
        UpdatedUtc = now,
    };

    private static EventSeries CreateSeries(Guid sourceId, string title, DateTimeOffset now) => new()
    {
        Id = Guid.NewGuid(),
        EventSourceId = sourceId,
        Title = title,
        IsAllDay = false,
        StartDate = DateOnly.FromDateTime(now.UtcDateTime),
        StartTime = TimeOnly.FromDateTime(now.UtcDateTime),
        EndDate = DateOnly.FromDateTime(now.AddHours(1).UtcDateTime),
        EndTime = TimeOnly.FromDateTime(now.AddHours(1).UtcDateTime),
        CreatedUtc = now,
        UpdatedUtc = now,
    };

    private sealed class SqliteTestDatabase : IAsyncDisposable
    {
        private readonly SqliteConnection connection;

        private SqliteTestDatabase(SqliteConnection connection, HomeOpsDbContext context)
        {
            this.connection = connection;
            Context = context;
        }

        public HomeOpsDbContext Context { get; }

        public static async Task<SqliteTestDatabase> CreateAsync()
        {
            var connection = new SqliteConnection("Data Source=:memory:");
            await connection.OpenAsync();
            var context = CreateContext(connection);
            await context.Database.EnsureCreatedAsync();
            return new SqliteTestDatabase(connection, context);
        }

        public static HomeOpsDbContext CreateUninitializedContext()
        {
            var options = new DbContextOptionsBuilder<HomeOpsDbContext>()
                .UseSqlite("Data Source=:memory:")
                .Options;
            return new HomeOpsDbContext(options);
        }

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
