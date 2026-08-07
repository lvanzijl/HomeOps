namespace HomeOps.Api.CalendarEvents.Synchronization;

public interface ICalendarSourceRefreshDispatcher
{
    Task<CalendarSourceRefreshDispatchResult> RefreshAsync(EventSource source, CancellationToken cancellationToken = default);
    Task<CalendarSourcePreparedRefresh> PrepareAsync(EventSource source, string householdTimeZoneId, bool forceFullLoad, CancellationToken cancellationToken = default) =>
        throw new NotSupportedException("This dispatcher does not support preflight preparation.");
}

public sealed record CalendarSourcePreparedRefresh(EventSource Source, string NormalizationTimeZoneId, CalendarProviderSnapshot Snapshot)
{
    public bool Succeeded => Snapshot.Status == CalendarProviderSnapshotStatus.Successful &&
        Snapshot.Diagnostics.All(diagnostic => diagnostic.Severity != ICalendar.ICalendarParseDiagnosticSeverity.Error);
}
