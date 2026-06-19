using HomeOps.Contracts.Events;

namespace HomeOps.Api.CalendarEvents;

public static class EventSeriesNormalizer
{
    public static HomeOps.Contracts.Events.EventSource ToContract(EventSource source) => new(
        source.Id.ToString(),
        source.Name,
        EventSourceType.Manual,
        true,
        source.IsWritable ? EventSourceCapability.Writable : EventSourceCapability.ReadOnly,
        new EventSourceVisibility(true, "Household"),
        new EventSourceColor("#4f46e5"));

    public static NormalizedEvent ToNormalizedEvent(EventSeries eventSeries) => EventOccurrenceProjector.Project(eventSeries).ToNormalizedEvent();

    public static EventSeriesDto ToDto(EventSeries eventSeries)
    {
        var occurrence = EventOccurrenceProjector.Project(eventSeries);

        return new EventSeriesDto(
            eventSeries.Id,
            eventSeries.EventSourceId,
            eventSeries.Title,
            eventSeries.Description,
            occurrence.StartsAt,
            occurrence.EndsAt,
            eventSeries.IsAllDay,
            eventSeries.CreatedUtc,
            eventSeries.UpdatedUtc);
    }
}
