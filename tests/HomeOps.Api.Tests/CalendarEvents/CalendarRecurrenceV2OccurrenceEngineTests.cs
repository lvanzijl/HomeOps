using HomeOps.Api.CalendarEvents;

namespace HomeOps.Api.Tests.CalendarEvents;

public sealed class CalendarRecurrenceV2OccurrenceEngineTests
{
    [Fact]
    public void NonRecurringEventGeneratesOneOccurrenceAndRespectsWindow()
    {
        var series = CreateSeries(new DateOnly(2026, 7, 6));

        var inside = EventOccurrenceGenerator.Generate(series, TimeZoneId, new DateOnly(2026, 7, 6), new DateOnly(2026, 7, 6));
        var outside = EventOccurrenceGenerator.Generate(series, TimeZoneId, new DateOnly(2026, 7, 7), new DateOnly(2026, 7, 7));

        Assert.Single(inside);
        Assert.Empty(outside);
    }

    [Fact]
    public void DailyRecurrenceSupportsIntervalCountAndUntil()
    {
        var interval = CreateSeries(new DateOnly(2026, 7, 1), new EventRecurrenceRule { Frequency = RecurrenceFrequency.Daily, Interval = 2, EndMode = RecurrenceEndMode.Never });
        var count = CreateSeries(new DateOnly(2026, 7, 1), new EventRecurrenceRule { Frequency = RecurrenceFrequency.Daily, Interval = 1, EndMode = RecurrenceEndMode.AfterCount, Count = 3 });
        var until = CreateSeries(new DateOnly(2026, 7, 1), new EventRecurrenceRule { Frequency = RecurrenceFrequency.Daily, Interval = 1, EndMode = RecurrenceEndMode.OnDate, UntilDate = new DateOnly(2026, 7, 3) });

        Assert.Equal([1, 3, 5], Days(interval, new DateOnly(2026, 7, 1), new DateOnly(2026, 7, 5)));
        Assert.Equal([1, 2, 3], Days(count, new DateOnly(2026, 7, 1), new DateOnly(2026, 7, 10)));
        Assert.Empty(EventOccurrenceGenerator.Generate(count, TimeZoneId, new DateOnly(2026, 7, 7), new DateOnly(2026, 7, 7)));
        Assert.Equal([1, 2, 3], Days(until, new DateOnly(2026, 7, 1), new DateOnly(2026, 7, 10)));
    }

    [Fact]
    public void WeeklyRecurrenceSupportsMultipleWeekdaysIntervalAndOrdering()
    {
        var series = CreateSeries(new DateOnly(2026, 7, 1), new EventRecurrenceRule
        {
            Frequency = RecurrenceFrequency.Weekly,
            Interval = 2,
            EndMode = RecurrenceEndMode.Never,
            WeeklyDays = "Monday,Wednesday",
        });

        var occurrences = EventOccurrenceGenerator.Generate(series, TimeZoneId, new DateOnly(2026, 7, 1), new DateOnly(2026, 7, 29)).ToList();

        Assert.Equal([
            new DateOnly(2026, 7, 1),
            new DateOnly(2026, 7, 13),
            new DateOnly(2026, 7, 15),
            new DateOnly(2026, 7, 27),
            new DateOnly(2026, 7, 29),
        ], occurrences.Select(occurrence => DateOnly.FromDateTime(occurrence.StartsAt.DateTime)).ToArray());
    }

    [Fact]
    public void MonthlyRecurrenceSkipsInvalidMonthDaysWithoutClamping()
    {
        var series = CreateSeries(new DateOnly(2026, 1, 31), new EventRecurrenceRule { Frequency = RecurrenceFrequency.Monthly, Interval = 1, EndMode = RecurrenceEndMode.Never, MonthlyDayOfMonth = 31 });

        var dates = EventOccurrenceGenerator.Generate(series, TimeZoneId, new DateOnly(2026, 1, 1), new DateOnly(2026, 5, 31)).Select(occurrence => DateOnly.FromDateTime(occurrence.StartsAt.DateTime)).ToArray();

        Assert.Equal([new DateOnly(2026, 1, 31), new DateOnly(2026, 3, 31), new DateOnly(2026, 5, 31)], dates);
    }

    [Fact]
    public void YearlyRecurrenceSupportsLeapDayOnlyInLeapYears()
    {
        var series = CreateSeries(new DateOnly(2024, 2, 29), new EventRecurrenceRule { Frequency = RecurrenceFrequency.Yearly, Interval = 1, EndMode = RecurrenceEndMode.Never, YearlyMonth = 2, YearlyDayOfMonth = 29 });

        var dates = EventOccurrenceGenerator.Generate(series, TimeZoneId, new DateOnly(2024, 1, 1), new DateOnly(2030, 12, 31)).Select(occurrence => DateOnly.FromDateTime(occurrence.StartsAt.DateTime)).ToArray();

        Assert.Equal([new DateOnly(2024, 2, 29), new DateOnly(2028, 2, 29)], dates);
    }

    [Fact]
    public void ExceptionsApplyByOccurrenceKeyAfterCandidateGeneration()
    {
        var series = CreateSeries(new DateOnly(2026, 7, 1), new EventRecurrenceRule { Frequency = RecurrenceFrequency.Daily, Interval = 1, EndMode = RecurrenceEndMode.AfterCount, Count = 4 });
        series.Exceptions.Add(new EventException
        {
            Id = Guid.NewGuid(),
            OccurrenceDate = new DateOnly(2026, 7, 2),
            OccurrenceKey = OccurrenceKey.FromOriginalStart(new DateOnly(2026, 7, 2), new TimeOnly(9, 0)),
            ExceptionType = EventExceptionType.Skipped,
            IsSkipped = true,
        });
        series.Exceptions.Add(new EventException
        {
            Id = Guid.NewGuid(),
            OccurrenceDate = new DateOnly(2026, 7, 3),
            OccurrenceKey = OccurrenceKey.FromOriginalStart(new DateOnly(2026, 7, 3), new TimeOnly(9, 0)),
            ExceptionType = EventExceptionType.Modified,
            Title = "Moved standup",
            Location = "Library",
            StartDate = new DateOnly(2026, 7, 5),
            StartTime = new TimeOnly(11, 0),
            EndDate = new DateOnly(2026, 7, 5),
            EndTime = new TimeOnly(12, 0),
        });

        var occurrences = EventOccurrenceGenerator.Generate(series, TimeZoneId, new DateOnly(2026, 7, 1), new DateOnly(2026, 7, 5)).ToList();

        Assert.Equal(3, occurrences.Count);
        Assert.DoesNotContain(occurrences, occurrence => occurrence.OccurrenceKey == "2026-07-02T09:00:00");
        var moved = Assert.Single(occurrences, occurrence => occurrence.OccurrenceKey == "2026-07-03T09:00:00");
        Assert.Equal("Moved standup", moved.Title);
        Assert.Equal("Library", moved.Location);
        Assert.Equal(new DateTimeOffset(2026, 7, 5, 11, 0, 0, TimeSpan.FromHours(2)), moved.StartsAt);
        Assert.True(moved.IsException);
    }

    [Fact]
    public void OccurrenceIdentityIsDeterministicAndBasedOnOriginalKeyForMovedOccurrences()
    {
        var series = CreateSeries(new DateOnly(2026, 7, 1), new EventRecurrenceRule { Frequency = RecurrenceFrequency.Daily, Interval = 1, EndMode = RecurrenceEndMode.Never });
        series.Exceptions.Add(new EventException
        {
            Id = Guid.NewGuid(),
            OccurrenceDate = new DateOnly(2026, 7, 2),
            OccurrenceKey = OccurrenceKey.FromOriginalStart(new DateOnly(2026, 7, 2), new TimeOnly(9, 0)),
            ExceptionType = EventExceptionType.Modified,
            StartDate = new DateOnly(2026, 7, 4),
            StartTime = new TimeOnly(9, 0),
            EndDate = new DateOnly(2026, 7, 4),
            EndTime = new TimeOnly(10, 0),
        });

        var first = EventOccurrenceGenerator.Generate(series, TimeZoneId, new DateOnly(2026, 7, 1), new DateOnly(2026, 7, 4)).Single(occurrence => occurrence.OccurrenceKey == "2026-07-02T09:00:00");
        var second = EventOccurrenceGenerator.Generate(series, TimeZoneId, new DateOnly(2026, 7, 4), new DateOnly(2026, 7, 4)).Single(occurrence => occurrence.OccurrenceKey == "2026-07-02T09:00:00");

        Assert.Equal(first.Id, second.Id);
        Assert.NotEqual(series.Exceptions.Single().Id, first.Id);
    }

    [Fact]
    public void WindowingHandlesOldSeriesAndMultiDayOverlap()
    {
        var old = CreateSeries(new DateOnly(2000, 1, 1), new EventRecurrenceRule { Frequency = RecurrenceFrequency.Yearly, Interval = 1, EndMode = RecurrenceEndMode.Never, YearlyMonth = 1, YearlyDayOfMonth = 1 });
        var multiDay = CreateSeries(new DateOnly(2026, 7, 1), new EventRecurrenceRule { Frequency = RecurrenceFrequency.Weekly, Interval = 1, EndMode = RecurrenceEndMode.Never, WeeklyDays = "Wednesday" }, isAllDay: true, endDate: new DateOnly(2026, 7, 4));

        var oldOccurrences = EventOccurrenceGenerator.Generate(old, TimeZoneId, new DateOnly(2026, 1, 1), new DateOnly(2026, 1, 1));
        var overlapping = EventOccurrenceGenerator.Generate(multiDay, TimeZoneId, new DateOnly(2026, 7, 3), new DateOnly(2026, 7, 3));

        Assert.Single(oldOccurrences);
        Assert.Single(overlapping);
    }

    [Fact]
    public void RecurrencePreservesLocalWallClockAcrossSpringAndAutumnDstTransitions()
    {
        var spring = CreateSeries(new DateOnly(2026, 3, 22), new EventRecurrenceRule { Frequency = RecurrenceFrequency.Weekly, Interval = 1, EndMode = RecurrenceEndMode.Never, WeeklyDays = "Sunday" });
        var autumn = CreateSeries(new DateOnly(2026, 10, 18), new EventRecurrenceRule { Frequency = RecurrenceFrequency.Weekly, Interval = 1, EndMode = RecurrenceEndMode.Never, WeeklyDays = "Sunday" });

        var springOccurrences = EventOccurrenceGenerator.Generate(spring, TimeZoneId, new DateOnly(2026, 3, 22), new DateOnly(2026, 3, 29)).ToList();
        var autumnOccurrences = EventOccurrenceGenerator.Generate(autumn, TimeZoneId, new DateOnly(2026, 10, 18), new DateOnly(2026, 10, 25)).ToList();

        Assert.All(springOccurrences.Concat(autumnOccurrences), occurrence => Assert.Equal(new TimeSpan(9, 0, 0), occurrence.StartsAt.TimeOfDay));
        Assert.Equal(TimeSpan.FromHours(1), springOccurrences[0].StartsAt.Offset);
        Assert.Equal(TimeSpan.FromHours(2), springOccurrences[1].StartsAt.Offset);
        Assert.Equal(TimeSpan.FromHours(2), autumnOccurrences[0].StartsAt.Offset);
        Assert.Equal(TimeSpan.FromHours(1), autumnOccurrences[1].StartsAt.Offset);
    }

    private static int[] Days(EventSeries series, DateOnly startsOn, DateOnly endsOn) =>
        EventOccurrenceGenerator.Generate(series, TimeZoneId, startsOn, endsOn).Select(occurrence => occurrence.StartsAt.Day).ToArray();

    private static EventSeries CreateSeries(DateOnly startDate, EventRecurrenceRule? rule = null, bool isAllDay = false, DateOnly? endDate = null) => new()
    {
        Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        EventSourceId = SeedCalendarEvents.EventSourceId,
        Title = "Standup",
        Description = "Daily sync",
        Location = "Kitchen",
        IsAllDay = isAllDay,
        StartDate = startDate,
        StartTime = isAllDay ? null : new TimeOnly(9, 0),
        EndDate = endDate ?? startDate,
        EndTime = isAllDay ? null : new TimeOnly(10, 0),
        RecurrenceType = rule is null ? RecurrenceType.None : Enum.Parse<RecurrenceType>(rule.Frequency.ToString()),
        RecurrenceRule = rule,
    };

    private const string TimeZoneId = "Europe/Amsterdam";
}
