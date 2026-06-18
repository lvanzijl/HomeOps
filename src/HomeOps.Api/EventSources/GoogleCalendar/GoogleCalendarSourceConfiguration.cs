namespace HomeOps.Api.EventSources.GoogleCalendar;

public sealed record GoogleCalendarSourceConfiguration(
    string SourceId,
    string CalendarId,
    string DisplayName,
    bool Enabled,
    string? ColorHex = null);
