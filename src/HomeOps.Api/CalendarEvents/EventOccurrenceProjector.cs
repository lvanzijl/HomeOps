namespace HomeOps.Api.CalendarEvents;

public static class EventOccurrenceProjector
{
    private const string DefaultTimeZoneId = "Europe/Amsterdam";

    public static EventOccurrence Project(EventSeries series, string timeZoneId = DefaultTimeZoneId) => EventOccurrenceGenerator.Generate(series, timeZoneId, series.StartDate, series.StartDate).Single();

    public static EventSeries FromRequest(Guid id, Guid eventSourceId, string title, string? description, string? location, DateTimeOffset startUtc, DateTimeOffset? endUtc, bool isAllDay, DateTimeOffset createdUtc, DateTimeOffset updatedUtc) => new()
    {
        Id = id,
        EventSourceId = eventSourceId,
        Title = title,
        Description = description,
        Location = location,
        IsAllDay = isAllDay,
        StartDate = DateOnly.FromDateTime(startUtc.UtcDateTime),
        StartTime = isAllDay ? null : TimeOnly.FromDateTime(startUtc.UtcDateTime),
        EndDate = DateOnly.FromDateTime((endUtc ?? startUtc).UtcDateTime),
        EndTime = isAllDay ? null : TimeOnly.FromDateTime((endUtc ?? startUtc).UtcDateTime),
        RecurrenceType = RecurrenceType.None,
        CreatedUtc = createdUtc,
        UpdatedUtc = updatedUtc,
    };

    public static EventSeries FromCalendarFields(Guid id, Guid eventSourceId, string title, string? description, string? location, CalendarFieldSet fields, DateTimeOffset createdUtc, DateTimeOffset updatedUtc) => new()
    {
        Id = id,
        EventSourceId = eventSourceId,
        Title = title,
        Description = description,
        Location = location,
        IsAllDay = fields.IsAllDay,
        StartDate = fields.StartDate,
        StartTime = fields.StartTime,
        EndDate = fields.EndDate,
        EndTime = fields.EndTime,
        CalendarWriteContractVersion = EventSeries.CurrentCalendarWriteContractVersion,
        RecurrenceType = RecurrenceType.None,
        CreatedUtc = createdUtc,
        UpdatedUtc = updatedUtc,
    };

    public static void ApplyRequest(EventSeries series, string title, string? description, string? location, DateTimeOffset startUtc, DateTimeOffset? endUtc, bool isAllDay, DateTimeOffset updatedUtc)
    {
        series.Title = title;
        series.Description = description;
        series.Location = location;
        series.IsAllDay = isAllDay;
        series.StartDate = DateOnly.FromDateTime(startUtc.UtcDateTime);
        series.StartTime = isAllDay ? null : TimeOnly.FromDateTime(startUtc.UtcDateTime);
        series.EndDate = DateOnly.FromDateTime((endUtc ?? startUtc).UtcDateTime);
        series.EndTime = isAllDay ? null : TimeOnly.FromDateTime((endUtc ?? startUtc).UtcDateTime);
        series.UpdatedUtc = updatedUtc;
    }

    public static void ApplyCalendarFields(EventSeries series, string title, string? description, string? location, CalendarFieldSet fields, DateTimeOffset updatedUtc)
    {
        series.Title = title;
        series.Description = description;
        series.Location = location;
        series.IsAllDay = fields.IsAllDay;
        series.StartDate = fields.StartDate;
        series.StartTime = fields.StartTime;
        series.EndDate = fields.EndDate;
        series.EndTime = fields.EndTime;
        series.CalendarWriteContractVersion = EventSeries.CurrentCalendarWriteContractVersion;
        series.UpdatedUtc = updatedUtc;
    }

}
