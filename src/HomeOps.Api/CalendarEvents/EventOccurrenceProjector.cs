namespace HomeOps.Api.CalendarEvents;

public static class EventOccurrenceProjector
{
    private const string DefaultTimeZoneId = "Europe/Amsterdam";

    public static EventOccurrence Project(EventSeries series) => EventOccurrenceGenerator.Generate(series, DefaultTimeZoneId, series.StartDate, series.StartDate).Single();

    public static EventSeries FromRequest(Guid id, Guid eventSourceId, string title, string? description, DateTimeOffset startUtc, DateTimeOffset? endUtc, bool isAllDay, DateTimeOffset createdUtc, DateTimeOffset updatedUtc) => new()
    {
        Id = id,
        EventSourceId = eventSourceId,
        Title = title,
        Description = description,
        IsAllDay = isAllDay,
        StartDate = DateOnly.FromDateTime(startUtc.UtcDateTime),
        StartTime = isAllDay ? null : TimeOnly.FromDateTime(startUtc.UtcDateTime),
        EndDate = DateOnly.FromDateTime((endUtc ?? startUtc).UtcDateTime),
        EndTime = isAllDay ? null : TimeOnly.FromDateTime((endUtc ?? startUtc).UtcDateTime),
        RecurrenceType = RecurrenceType.None,
        CreatedUtc = createdUtc,
        UpdatedUtc = updatedUtc,
    };

    public static void ApplyRequest(EventSeries series, string title, string? description, DateTimeOffset startUtc, DateTimeOffset? endUtc, bool isAllDay, DateTimeOffset updatedUtc)
    {
        series.Title = title;
        series.Description = description;
        series.IsAllDay = isAllDay;
        series.StartDate = DateOnly.FromDateTime(startUtc.UtcDateTime);
        series.StartTime = isAllDay ? null : TimeOnly.FromDateTime(startUtc.UtcDateTime);
        series.EndDate = DateOnly.FromDateTime((endUtc ?? startUtc).UtcDateTime);
        series.EndTime = isAllDay ? null : TimeOnly.FromDateTime((endUtc ?? startUtc).UtcDateTime);
        series.UpdatedUtc = updatedUtc;
    }

}