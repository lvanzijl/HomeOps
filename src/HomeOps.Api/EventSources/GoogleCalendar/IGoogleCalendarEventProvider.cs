namespace HomeOps.Api.EventSources.GoogleCalendar;

public interface IGoogleCalendarEventProvider
{
    GoogleCalendarSourceMetadata GetMetadata();

    IReadOnlyList<GoogleCalendarEventPayload> GetEvents();
}
