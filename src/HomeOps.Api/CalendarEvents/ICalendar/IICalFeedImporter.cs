namespace HomeOps.Api.CalendarEvents.ICalendar;

public interface IICalFeedImporter
{
    Task<ICalFeedImportResult> ImportAsync(EventSource source, CancellationToken cancellationToken = default);
}
