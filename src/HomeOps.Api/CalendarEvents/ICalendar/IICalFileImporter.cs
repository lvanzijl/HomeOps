namespace HomeOps.Api.CalendarEvents.ICalendar;

public interface IICalFileImporter
{
    Task<ICalFileImportResult> ImportAsync(EventSource source, CancellationToken cancellationToken = default);

    Task<ICalFileImportResult> ImportForZoneAsync(EventSource source, string householdTimeZoneId, CancellationToken cancellationToken = default) =>
        ImportAsync(source, cancellationToken);
}
