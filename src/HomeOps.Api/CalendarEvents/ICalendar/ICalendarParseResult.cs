namespace HomeOps.Api.CalendarEvents.ICalendar;

public sealed record ICalendarParseResult(
    IReadOnlyList<NormalizedICalendarEvent> Events,
    IReadOnlyList<ICalendarParseDiagnostic> Diagnostics)
{
    public bool HasErrors => Diagnostics.Any(diagnostic => diagnostic.Severity == ICalendarParseDiagnosticSeverity.Error);
}
