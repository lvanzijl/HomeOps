using HomeOps.Api.CalendarEvents;

namespace HomeOps.Api.Tests.CalendarEvents;

public sealed class EventOccurrenceProjectionTests
{
    [Fact]
    public void MapsLegacyManualEventShapeToNonRecurringEventSeries()
    {
        var id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        var start = new DateTimeOffset(2026, 6, 18, 9, 30, 0, TimeSpan.Zero);
        var end = new DateTimeOffset(2026, 6, 18, 10, 15, 0, TimeSpan.Zero);
        var created = new DateTimeOffset(2026, 6, 19, 0, 0, 0, TimeSpan.Zero);

        var series = EventOccurrenceProjector.FromRequest(id, SeedCalendarEvents.EventSourceId, "Dentist Appointment", "Routine check-up", null, start, end, false, created, created);

        Assert.Equal(id, series.Id);
        Assert.Equal(SeedCalendarEvents.EventSourceId, series.EventSourceId);
        Assert.Equal("Dentist Appointment", series.Title);
        Assert.Equal("Routine check-up", series.Description);
        Assert.False(series.IsAllDay);
        Assert.Equal(new DateOnly(2026, 6, 18), series.StartDate);
        Assert.Equal(new TimeOnly(9, 30), series.StartTime);
        Assert.Equal(new DateOnly(2026, 6, 18), series.EndDate);
        Assert.Equal(new TimeOnly(10, 15), series.EndTime);
    }

    [Fact]
    public void ProjectsTimedEventSeriesToEditableOccurrence()
    {
        var start = new DateTimeOffset(2026, 6, 22, 12, 0, 0, TimeSpan.Zero);
        var series = EventOccurrenceProjector.FromRequest(Guid.NewGuid(), SeedCalendarEvents.EventSourceId, "Lunch", "Cafe", null, start, start.AddHours(1), false, start, start);

        var occurrence = EventOccurrenceProjector.Project(series);

        Assert.Equal(series.Id, occurrence.EventSeriesId);
        Assert.Equal(new DateTimeOffset(2026, 6, 22, 12, 0, 0, TimeSpan.FromHours(2)), occurrence.StartsAt);
        Assert.Equal(new DateTimeOffset(2026, 6, 22, 13, 0, 0, TimeSpan.FromHours(2)), occurrence.EndsAt);
        Assert.False(occurrence.AllDay);
        Assert.True(occurrence.Editable);
    }

    [Fact]
    public void ProjectsAllDayEventSeriesWithDateOnlyShape()
    {
        var start = new DateTimeOffset(2026, 7, 12, 0, 0, 0, TimeSpan.Zero);
        var end = new DateTimeOffset(2026, 7, 13, 0, 0, 0, TimeSpan.Zero);
        var series = EventOccurrenceProjector.FromRequest(Guid.NewGuid(), SeedCalendarEvents.EventSourceId, "Day Off", null, null, start, end, true, start, start);

        var occurrence = EventOccurrenceProjector.Project(series);

        Assert.True(series.IsAllDay);
        Assert.Null(series.StartTime);
        Assert.Null(series.EndTime);
        Assert.Equal(new DateOnly(2026, 7, 12), series.StartDate);
        Assert.Equal(new DateOnly(2026, 7, 13), series.EndDate);
        Assert.Equal(new DateTimeOffset(2026, 7, 12, 0, 0, 0, TimeSpan.FromHours(2)), occurrence.StartsAt);
        Assert.Equal(new DateTimeOffset(2026, 7, 13, 0, 0, 0, TimeSpan.FromHours(2)), occurrence.EndsAt);
    }

    [Fact]
    public void PreservesExclusiveEndDateForMultiDayAllDayEventSeries()
    {
        var start = new DateTimeOffset(2026, 7, 12, 0, 0, 0, TimeSpan.Zero);
        var exclusiveEnd = new DateTimeOffset(2026, 7, 19, 0, 0, 0, TimeSpan.Zero);
        var series = EventOccurrenceProjector.FromRequest(Guid.NewGuid(), SeedCalendarEvents.EventSourceId, "Vacation", "Family trip", null, start, exclusiveEnd, true, start, start);

        var occurrence = EventOccurrenceProjector.Project(series);

        Assert.True(occurrence.AllDay);
        Assert.Equal(new DateOnly(2026, 7, 12), series.StartDate);
        Assert.Equal(new DateOnly(2026, 7, 19), series.EndDate);
        Assert.Equal(new DateTimeOffset(2026, 7, 19, 0, 0, 0, TimeSpan.FromHours(2)), occurrence.EndsAt);
    }

    [Theory]
    [InlineData(RecurrenceType.Daily, 5)]
    [InlineData(RecurrenceType.Weekly, 53)]
    [InlineData(RecurrenceType.Monthly, 13)]
    [InlineData(RecurrenceType.Yearly, 2)]
    public void GeneratesSupportedRecurrences(RecurrenceType recurrenceType, int expectedCount)
    {
        var series = new EventSeries
        {
            Id = Guid.NewGuid(),
            EventSourceId = SeedCalendarEvents.EventSourceId,
            Title = "Recurring",
            StartDate = new DateOnly(2026, 1, 1),
            StartTime = new TimeOnly(9, 0),
            EndDate = new DateOnly(2026, 1, 1),
            EndTime = new TimeOnly(10, 0),
            RecurrenceType = recurrenceType,
        };

        var occurrences = EventOccurrenceGenerator.Generate(series, "Europe/Amsterdam", new DateOnly(2026, 1, 1), recurrenceType == RecurrenceType.Daily ? new DateOnly(2026, 1, 5) : new DateOnly(2027, 1, 1));

        Assert.Equal(expectedCount, occurrences.Count);
    }

    [Fact]
    public void WeeklyRecurrencePreservesLocalWallClockTimeAcrossDst()
    {
        var series = new EventSeries
        {
            Id = Guid.NewGuid(),
            EventSourceId = SeedCalendarEvents.EventSourceId,
            Title = "Training",
            StartDate = new DateOnly(2026, 3, 25),
            StartTime = new TimeOnly(18, 0),
            EndDate = new DateOnly(2026, 3, 25),
            EndTime = new TimeOnly(19, 0),
            RecurrenceType = RecurrenceType.Weekly,
        };

        var occurrences = EventOccurrenceGenerator.Generate(series, "Europe/Amsterdam", new DateOnly(2026, 3, 25), new DateOnly(2026, 4, 1)).ToList();

        Assert.Equal(new DateTimeOffset(2026, 3, 25, 18, 0, 0, TimeSpan.FromHours(1)), occurrences[0].StartsAt);
        Assert.Equal(new DateTimeOffset(2026, 4, 1, 18, 0, 0, TimeSpan.FromHours(2)), occurrences[1].StartsAt);
    }

    [Fact]
    public void AppliesSkippedAndModifiedExceptions()
    {
        var series = new EventSeries
        {
            Id = Guid.NewGuid(),
            EventSourceId = SeedCalendarEvents.EventSourceId,
            Title = "Dinner",
            StartDate = new DateOnly(2026, 1, 1),
            StartTime = new TimeOnly(18, 0),
            EndDate = new DateOnly(2026, 1, 1),
            EndTime = new TimeOnly(19, 0),
            RecurrenceType = RecurrenceType.Daily,
            Exceptions =
            [
                new EventException { Id = Guid.NewGuid(), OccurrenceDate = new DateOnly(2026, 1, 2), IsSkipped = true },
                new EventException { Id = Guid.NewGuid(), OccurrenceDate = new DateOnly(2026, 1, 3), Title = "Late Dinner", StartDate = new DateOnly(2026, 1, 3), StartTime = new TimeOnly(20, 0), EndDate = new DateOnly(2026, 1, 3), EndTime = new TimeOnly(21, 0) },
            ],
        };

        var occurrences = EventOccurrenceGenerator.Generate(series, "Europe/Amsterdam", new DateOnly(2026, 1, 1), new DateOnly(2026, 1, 3)).ToList();

        Assert.Equal(2, occurrences.Count);
        Assert.DoesNotContain(occurrences, occurrence => occurrence.StartsAt.Date == new DateTime(2026, 1, 2));
        Assert.Equal("Late Dinner", occurrences[1].Title);
        Assert.Equal(new TimeSpan(20, 0, 0), occurrences[1].StartsAt.TimeOfDay);
    }

    [Fact]
    public void GeneratesAllDayAndMultiDayRecurringEvents()
    {
        var series = new EventSeries
        {
            Id = Guid.NewGuid(),
            EventSourceId = SeedCalendarEvents.EventSourceId,
            Title = "Trip",
            IsAllDay = true,
            StartDate = new DateOnly(2026, 7, 1),
            EndDate = new DateOnly(2026, 7, 3),
            RecurrenceType = RecurrenceType.Weekly,
        };

        var occurrences = EventOccurrenceGenerator.Generate(series, "Europe/Amsterdam", new DateOnly(2026, 7, 1), new DateOnly(2026, 7, 8)).ToList();

        Assert.All(occurrences, occurrence => Assert.True(occurrence.AllDay));
        Assert.Equal(new DateTimeOffset(2026, 7, 10, 0, 0, 0, TimeSpan.FromHours(2)), occurrences[1].EndsAt);
    }
}
