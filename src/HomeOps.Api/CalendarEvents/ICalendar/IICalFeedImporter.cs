namespace HomeOps.Api.CalendarEvents.ICalendar;

public interface IICalFeedImporter
{
    Task<ICalFeedImportResult> ImportAsync(EventSource source, CancellationToken cancellationToken = default);

    Task<ICalFeedImportResult> ImportForZoneAsync(EventSource source, string householdTimeZoneId, bool forceFullLoad, CancellationToken cancellationToken = default) =>
        ImportAsync(source, cancellationToken);
    Task<ICalFeedImportResult> ImportUrlForZoneAsync(EventSource source, string feedUrl, string householdTimeZoneId, CancellationToken cancellationToken = default) =>
        ImportForZoneAsync(source, householdTimeZoneId, true, cancellationToken);
}
