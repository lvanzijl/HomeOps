using HomeOps.Contracts.Events;

namespace HomeOps.Api.CalendarEvents;

public static class EventSeriesNormalizer
{
    public static HomeOps.Contracts.Events.EventSource ToContract(EventSource source) => new(
        source.Id.ToString(),
        source.Name,
        ToContractSourceType(source.SourceType),
        source.IsEnabled,
        source.IsWritable ? EventSourceCapability.Writable : EventSourceCapability.ReadOnly,
        new EventSourceVisibility(source.IsEnabled, "Household"),
        new EventSourceColor("#4f46e5"),
        source.ProviderSourceId);

    public static NormalizedEvent ToNormalizedEvent(EventSeries eventSeries)
    {
        var occurrence = EventOccurrenceProjector.Project(eventSeries);

        return occurrence.ToNormalizedEvent() with
        {
            ProviderEventId = eventSeries.ProviderEventId,
            Location = eventSeries.Location
        };
    }

    private static EventSourceType ToContractSourceType(string sourceType) => sourceType switch
    {
        EventSourceTypes.Manual or "manual" => EventSourceType.Manual,
        EventSourceTypes.ICalFeed => EventSourceType.ICalFeed,
        EventSourceTypes.ICalFile => EventSourceType.ICalFile,
        EventSourceTypes.GoogleCalendar => EventSourceType.GoogleCalendar,
        EventSourceTypes.CalDav => EventSourceType.CalDav,
        EventSourceTypes.Exchange => EventSourceType.Exchange,
        EventSourceTypes.SchoolHolidays => EventSourceType.SchoolHolidays,
        EventSourceTypes.TvSeries => EventSourceType.TvSeries,
        EventSourceTypes.Provider => EventSourceType.Provider,
        _ => EventSourceType.Provider
    };

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
