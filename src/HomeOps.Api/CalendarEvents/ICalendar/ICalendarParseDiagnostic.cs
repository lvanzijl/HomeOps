namespace HomeOps.Api.CalendarEvents.ICalendar;

public sealed record ICalendarParseDiagnostic(
    ICalendarParseDiagnosticSeverity Severity,
    string Code,
    string Message,
    string? ProviderEventId = null,
    string? PropertyName = null);

public enum ICalendarParseDiagnosticSeverity
{
    Warning = 0,
    Error = 1,
}
