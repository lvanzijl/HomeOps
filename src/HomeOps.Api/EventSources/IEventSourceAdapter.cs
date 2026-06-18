using HomeOps.Contracts.Events;

namespace HomeOps.Api.EventSources;

public interface IEventSourceAdapter
{
    EventSource GetEventSource();

    IReadOnlyList<NormalizedEvent> GetEvents();
}
