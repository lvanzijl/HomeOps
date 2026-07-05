namespace HomeOps.Api.CalendarEvents.ICalendar;

public interface IICalFileImporter
{
    Task<ICalFileImportResult> ImportAsync(EventSource source, CancellationToken cancellationToken = default);
}
