using HomeOps.Api.CalendarEvents.ICalendar;

namespace HomeOps.Api.CalendarEvents.Synchronization;

public sealed record NormalizedProviderEvent(
    string ProviderEventId,
    string? ProviderRevision,
    string ContentFingerprint,
    string Title,
    string? Description,
    string? Location,
    DateOnly StartDate,
    TimeOnly? StartTime,
    DateOnly EndDate,
    TimeOnly? EndTime,
    bool IsAllDay,
    RecurrenceType RecurrenceType,
    EventRecurrenceRule? RecurrenceRule = null,
    IReadOnlyList<NormalizedICalendarEventException>? Exceptions = null)
{
    public static NormalizedProviderEvent FromICalendar(NormalizedICalendarEvent calendarEvent) =>
        new(
            calendarEvent.ProviderEventId,
            calendarEvent.ProviderRevision,
            calendarEvent.ContentFingerprint,
            calendarEvent.Title,
            calendarEvent.Description,
            calendarEvent.Location,
            calendarEvent.StartDate,
            calendarEvent.StartTime,
            calendarEvent.EndDate,
            calendarEvent.EndTime,
            calendarEvent.IsAllDay,
            calendarEvent.RecurrenceType,
            calendarEvent.RecurrenceRule,
            calendarEvent.Exceptions ?? []);
}
