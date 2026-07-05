namespace HomeOps.Api.CalendarEvents.Synchronization;

public interface ICalendarSourceRefreshDispatcher
{
    Task<CalendarSourceRefreshDispatchResult> RefreshAsync(EventSource source, CancellationToken cancellationToken = default);
}
