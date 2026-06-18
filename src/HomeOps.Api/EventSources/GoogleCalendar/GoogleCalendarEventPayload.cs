namespace HomeOps.Api.EventSources.GoogleCalendar;

public sealed record GoogleCalendarEventPayload(
    string Id,
    string Summary,
    GoogleCalendarDateTimePayload Start,
    GoogleCalendarDateTimePayload End,
    string? Description = null,
    string? Location = null);

public sealed record GoogleCalendarDateTimePayload(
    string? Date = null,
    DateTimeOffset? DateTime = null,
    string? TimeZone = null)
{
    public bool IsAllDay => Date is not null;
}
