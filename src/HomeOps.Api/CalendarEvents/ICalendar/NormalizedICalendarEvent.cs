namespace HomeOps.Api.CalendarEvents.ICalendar;

public sealed record NormalizedICalendarEvent(
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
    DateTime? CreatedUtc,
    DateTime? LastModifiedUtc,
    int Sequence,
    string? Status,
    string? Transparency,
    RecurrenceType RecurrenceType,
    string? RawRecurrenceRule);
