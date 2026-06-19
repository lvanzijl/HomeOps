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

        var series = EventOccurrenceProjector.FromRequest(id, SeedCalendarEvents.EventSourceId, "Dentist Appointment", "Routine check-up", start, end, false, created, created);

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
        var series = EventOccurrenceProjector.FromRequest(Guid.NewGuid(), SeedCalendarEvents.EventSourceId, "Lunch", "Cafe", start, start.AddHours(1), false, start, start);

        var occurrence = EventOccurrenceProjector.Project(series);

        Assert.Equal(series.Id, occurrence.EventSeriesId);
        Assert.Equal(start, occurrence.StartsAt);
        Assert.Equal(start.AddHours(1), occurrence.EndsAt);
        Assert.False(occurrence.AllDay);
        Assert.True(occurrence.Editable);
    }

    [Fact]
    public void ProjectsAllDayEventSeriesWithDateOnlyShape()
    {
        var start = new DateTimeOffset(2026, 7, 12, 0, 0, 0, TimeSpan.Zero);
        var end = new DateTimeOffset(2026, 7, 13, 0, 0, 0, TimeSpan.Zero);
        var series = EventOccurrenceProjector.FromRequest(Guid.NewGuid(), SeedCalendarEvents.EventSourceId, "Day Off", null, start, end, true, start, start);

        var occurrence = EventOccurrenceProjector.Project(series);

        Assert.True(series.IsAllDay);
        Assert.Null(series.StartTime);
        Assert.Null(series.EndTime);
        Assert.Equal(new DateOnly(2026, 7, 12), series.StartDate);
        Assert.Equal(new DateOnly(2026, 7, 13), series.EndDate);
        Assert.Equal(start, occurrence.StartsAt);
        Assert.Equal(end, occurrence.EndsAt);
    }

    [Fact]
    public void PreservesExclusiveEndDateForMultiDayAllDayEventSeries()
    {
        var start = new DateTimeOffset(2026, 7, 12, 0, 0, 0, TimeSpan.Zero);
        var exclusiveEnd = new DateTimeOffset(2026, 7, 19, 0, 0, 0, TimeSpan.Zero);
        var series = EventOccurrenceProjector.FromRequest(Guid.NewGuid(), SeedCalendarEvents.EventSourceId, "Vacation", "Family trip", start, exclusiveEnd, true, start, start);

        var occurrence = EventOccurrenceProjector.Project(series);

        Assert.True(occurrence.AllDay);
        Assert.Equal(new DateOnly(2026, 7, 12), series.StartDate);
        Assert.Equal(new DateOnly(2026, 7, 19), series.EndDate);
        Assert.Equal(exclusiveEnd, occurrence.EndsAt);
    }
}
