namespace HomeOps.Api.EventSources.GoogleCalendar;

public sealed class FakeGoogleCalendarEventProvider : IGoogleCalendarEventProvider
{
    public GoogleCalendarSourceMetadata GetMetadata() => new(
        CalendarId: "family@example.com",
        TimeZone: "America/New_York",
        Description: "Representative fake Google Calendar payloads for adapter validation.",
        AccessRole: "reader");

    public IReadOnlyList<GoogleCalendarEventPayload> GetEvents() =>
    [
        new GoogleCalendarEventPayload(
            Id: "google-all-day-1",
            Summary: "School closure",
            Start: new GoogleCalendarDateTimePayload(Date: "2026-06-18"),
            End: new GoogleCalendarDateTimePayload(Date: "2026-06-19"),
            Description: "All-day sample from Google Calendar."),
        new GoogleCalendarEventPayload(
            Id: "google-timed-1",
            Summary: "Dentist appointment",
            Start: new GoogleCalendarDateTimePayload(DateTime: DateTimeOffset.Parse("2026-06-19T14:30:00-04:00"), TimeZone: "America/New_York"),
            End: new GoogleCalendarDateTimePayload(DateTime: DateTimeOffset.Parse("2026-06-19T15:15:00-04:00"), TimeZone: "America/New_York"),
            Location: "Downtown Dental")
    ];
}
