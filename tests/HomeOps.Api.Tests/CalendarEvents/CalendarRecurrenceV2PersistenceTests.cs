using HomeOps.Api.CalendarEvents;
using HomeOps.Api.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.Tests.CalendarEvents;

public sealed class CalendarRecurrenceV2PersistenceTests
{
    [Fact]
    public async Task DbContextPersistsNonRecurringSeriesWithoutRecurrenceRule()
    {
        await using var database = await SqliteTestDatabase.CreateAsync();
        var series = CreateSeries("One-off");
        database.Context.EventSeries.Add(series);
        await database.Context.SaveChangesAsync();

        var reloaded = await database.Context.EventSeries.AsNoTracking().SingleAsync(candidate => candidate.Id == series.Id);

        Assert.Null(reloaded.RecurrenceRule);
        Assert.Equal(RecurrenceType.None, reloaded.RecurrenceType);
    }

    [Fact]
    public async Task DbContextPersistsRecurringSeriesWithOwnedRuleShapes()
    {
        await using var database = await SqliteTestDatabase.CreateAsync();
        database.Context.EventSeries.AddRange(
            CreateSeries("Daily", rule: new EventRecurrenceRule { Frequency = RecurrenceFrequency.Daily, Interval = 2, EndMode = RecurrenceEndMode.AfterCount, Count = 5 }),
            CreateSeries("Weekly", rule: new EventRecurrenceRule { Frequency = RecurrenceFrequency.Weekly, Interval = 1, EndMode = RecurrenceEndMode.Never, WeeklyDays = "Monday,Wednesday" }),
            CreateSeries("Monthly", rule: new EventRecurrenceRule { Frequency = RecurrenceFrequency.Monthly, Interval = 1, EndMode = RecurrenceEndMode.OnDate, UntilDate = new DateOnly(2026, 12, 31), MonthlyDayOfMonth = 15 }),
            CreateSeries("Yearly", rule: new EventRecurrenceRule { Frequency = RecurrenceFrequency.Yearly, Interval = 3, EndMode = RecurrenceEndMode.Never, YearlyMonth = 7, YearlyDayOfMonth = 6, RawProviderRecurrenceRule = "FREQ=YEARLY;INTERVAL=3" }));
        await database.Context.SaveChangesAsync();

        var rules = await database.Context.EventSeries.AsNoTracking().Where(series => new[] { "Daily", "Monthly", "Weekly", "Yearly" }.Contains(series.Title)).OrderBy(series => series.Title).Select(series => series.RecurrenceRule).ToListAsync();

        Assert.Collection(rules,
            daily => { Assert.Equal(RecurrenceFrequency.Daily, daily!.Frequency); Assert.Equal(2, daily.Interval); Assert.Equal(RecurrenceEndMode.AfterCount, daily.EndMode); Assert.Equal(5, daily.Count); },
            monthly => { Assert.Equal(15, monthly!.MonthlyDayOfMonth); Assert.Equal(new DateOnly(2026, 12, 31), monthly.UntilDate); },
            weekly => Assert.Equal("Monday,Wednesday", weekly!.WeeklyDays),
            yearly => { Assert.Equal(7, yearly!.YearlyMonth); Assert.Equal(6, yearly.YearlyDayOfMonth); Assert.Equal("FREQ=YEARLY;INTERVAL=3", yearly.RawProviderRecurrenceRule); });
    }

    [Fact]
    public async Task DbContextPersistsSkippedAndModifiedExceptionsWithOccurrenceKeysAndProviderMetadata()
    {
        await using var database = await SqliteTestDatabase.CreateAsync();
        var series = CreateSeries("Recurring", rule: new EventRecurrenceRule { Frequency = RecurrenceFrequency.Weekly, Interval = 1, EndMode = RecurrenceEndMode.Never, WeeklyDays = "Monday" });
        series.Exceptions.Add(new EventException
        {
            Id = Guid.NewGuid(),
            OccurrenceDate = new DateOnly(2026, 7, 13),
            OccurrenceKey = OccurrenceKey.FromOriginalStart(new DateOnly(2026, 7, 13), new TimeOnly(9, 0)),
            ExceptionType = EventExceptionType.Skipped,
            IsSkipped = true,
            CreatedUtc = series.CreatedUtc,
            UpdatedUtc = series.UpdatedUtc,
        });
        series.Exceptions.Add(new EventException
        {
            Id = Guid.NewGuid(),
            OccurrenceDate = new DateOnly(2026, 7, 20),
            OccurrenceKey = OccurrenceKey.FromOriginalStart(new DateOnly(2026, 7, 20), new TimeOnly(9, 0)),
            ExceptionType = EventExceptionType.Modified,
            Title = "Moved",
            Description = "Updated",
            Location = "Library",
            IsAllDay = false,
            StartDate = new DateOnly(2026, 7, 21),
            StartTime = new TimeOnly(10, 0),
            EndDate = new DateOnly(2026, 7, 21),
            EndTime = new TimeOnly(11, 0),
            RawProviderRecurrenceId = "RECURRENCE-ID:20260720T090000",
            NormalizedProviderRecurrenceId = "2026-07-20T09:00:00",
            DetachedProviderEventId = "detached-1",
            DetachedProviderRevision = "etag-1",
            DetachedContentFingerprint = "fingerprint",
            RawDetachedRecurrenceMetadata = "raw detached metadata",
            CreatedUtc = series.CreatedUtc,
            UpdatedUtc = series.UpdatedUtc,
        });
        database.Context.EventSeries.Add(series);
        await database.Context.SaveChangesAsync();

        var reloaded = await database.Context.EventExceptions.AsNoTracking().OrderBy(exception => exception.OccurrenceDate).ToListAsync();

        Assert.Equal(EventExceptionType.Skipped, reloaded[0].ExceptionType);
        Assert.Equal(OccurrenceKey.FromOriginalStart(new DateOnly(2026, 7, 13), new TimeOnly(9, 0)), reloaded[0].OccurrenceKey);
        Assert.Equal("Library", reloaded[1].Location);
        Assert.Equal("detached-1", reloaded[1].DetachedProviderEventId);
    }

    [Fact]
    public async Task DbContextEnforcesExceptionOccurrenceKeyUniquenessAndCascadeDelete()
    {
        await using var database = await SqliteTestDatabase.CreateAsync();
        var series = CreateSeries("Recurring", rule: new EventRecurrenceRule { Frequency = RecurrenceFrequency.Daily, Interval = 1, EndMode = RecurrenceEndMode.Never });
        var key = OccurrenceKey.FromOriginalStart(new DateOnly(2026, 7, 6), new TimeOnly(9, 0));
        series.Exceptions.Add(CreateException(key, series.CreatedUtc));
        series.Exceptions.Add(CreateException(key, series.CreatedUtc));
        database.Context.EventSeries.Add(series);

        await Assert.ThrowsAsync<DbUpdateException>(() => database.Context.SaveChangesAsync());

        database.Context.ChangeTracker.Clear();
        series = CreateSeries("Recurring", rule: new EventRecurrenceRule { Frequency = RecurrenceFrequency.Daily, Interval = 1, EndMode = RecurrenceEndMode.Never });
        series.Exceptions.Add(CreateException(key, series.CreatedUtc));
        database.Context.EventSeries.Add(series);
        await database.Context.SaveChangesAsync();
        database.Context.EventSeries.Remove(series);
        await database.Context.SaveChangesAsync();

        Assert.False(await database.Context.EventExceptions.AnyAsync());
    }

    private static EventSeries CreateSeries(string title, EventRecurrenceRule? rule = null)
    {
        var now = DateTimeOffset.UtcNow;
        return new EventSeries
        {
            Id = Guid.NewGuid(),
            EventSourceId = SeedCalendarEvents.EventSourceId,
            Title = title,
            IsAllDay = false,
            StartDate = new DateOnly(2026, 7, 6),
            StartTime = new TimeOnly(9, 0),
            EndDate = new DateOnly(2026, 7, 6),
            EndTime = new TimeOnly(10, 0),
            RecurrenceType = rule is null ? RecurrenceType.None : Enum.Parse<RecurrenceType>(rule.Frequency.ToString()),
            RecurrenceRule = rule,
            CreatedUtc = now,
            UpdatedUtc = now,
        };
    }

    private static EventException CreateException(OccurrenceKey key, DateTimeOffset now) => new()
    {
        Id = Guid.NewGuid(),
        OccurrenceDate = key.Date,
        OccurrenceKey = key,
        ExceptionType = EventExceptionType.Skipped,
        IsSkipped = true,
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
            var connection = new SqliteConnection("DataSource=:memory:");
            await connection.OpenAsync();
            var options = new DbContextOptionsBuilder<HomeOpsDbContext>().UseSqlite(connection).Options;
            var context = new HomeOpsDbContext(options);
            await context.Database.EnsureCreatedAsync();
            return new SqliteTestDatabase(connection, context);
        }

        public async ValueTask DisposeAsync()
        {
            await Context.DisposeAsync();
            await connection.DisposeAsync();
        }
    }
}
