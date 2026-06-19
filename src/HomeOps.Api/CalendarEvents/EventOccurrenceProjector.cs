namespace HomeOps.Api.CalendarEvents;

public static class EventOccurrenceProjector
{
    private static readonly TimeOnly Midnight = new(0, 0, 0);

    public static EventOccurrence Project(EventSeries series) => new(
        series.Id,
        series.Id,
        series.EventSourceId,
        series.Title,
        series.Description,
        ToDateTimeOffset(series.StartDate, series.StartTime ?? Midnight),
        ToOptionalEnd(series),
        series.IsAllDay,
        true);

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

    private static DateTimeOffset? ToOptionalEnd(EventSeries series)
    {
        if (series.EndDate == default)
        {
            return null;
        }

        return ToDateTimeOffset(series.EndDate, series.EndTime ?? Midnight);
    }

    private static DateTimeOffset ToDateTimeOffset(DateOnly date, TimeOnly time) => new(date.ToDateTime(time), TimeSpan.Zero);
}
