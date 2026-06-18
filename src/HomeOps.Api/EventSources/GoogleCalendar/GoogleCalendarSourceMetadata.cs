namespace HomeOps.Api.EventSources.GoogleCalendar;

public sealed record GoogleCalendarSourceMetadata(
    string CalendarId,
    string TimeZone,
    string? Description,
    string? AccessRole);
