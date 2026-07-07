using HomeOps.Contracts.Events;
using HomeOps.Api.EventSources;

namespace HomeOps.Api.EventSources.GoogleCalendar;

public sealed class GoogleCalendarAdapter : IEventSourceAdapter
{
    private readonly GoogleCalendarSourceConfiguration configuration;
    private readonly IGoogleCalendarEventProvider provider;

    public GoogleCalendarAdapter(GoogleCalendarSourceConfiguration configuration, IGoogleCalendarEventProvider provider)
    {
        this.configuration = configuration;
        this.provider = provider;
    }

    public EventSource GetEventSource()
    {
        var metadata = provider.GetMetadata();

        return new EventSource(
            Id: configuration.SourceId,
            Name: configuration.DisplayName,
            Type: EventSourceType.GoogleCalendar,
            Enabled: configuration.Enabled,
            Capability: EventSourceCapability.ReadOnly,
            Visibility: new EventSourceVisibility(VisibleByDefault: true, GroupName: "Google Calendar"),
            Color: new EventSourceColor(configuration.ColorHex),
            ProviderSourceId: metadata.CalendarId);
    }

    public GoogleCalendarSourceMetadata GetMetadata() => provider.GetMetadata();

    public IReadOnlyList<NormalizedEvent> GetEvents() => provider.GetEvents().Select(MapEvent).ToArray();

    private NormalizedEvent MapEvent(GoogleCalendarEventPayload payload)
    {
        var allDay = payload.Start.IsAllDay;

        return new NormalizedEvent(
            Id: $"{configuration.SourceId}:{payload.Id}",
            EventSeriesId: $"{configuration.SourceId}:{payload.Id}",
            SourceId: configuration.SourceId,
            Title: payload.Summary,
            StartsAt: MapStart(payload.Start),
            EndsAt: MapEnd(payload.End),
            AllDay: allDay,
            Editable: false,
            ProviderEventId: payload.Id,
            Description: payload.Description,
            Location: payload.Location);
    }

    private static DateTimeOffset MapStart(GoogleCalendarDateTimePayload payload)
    {
        if (payload.Date is not null)
        {
            return new DateTimeOffset(DateOnly.Parse(payload.Date).ToDateTime(TimeOnly.MinValue), TimeSpan.Zero);
        }

        return payload.DateTime ?? throw new InvalidOperationException("Google Calendar event start must include date or dateTime.");
    }

    private static DateTimeOffset? MapEnd(GoogleCalendarDateTimePayload payload)
    {
        if (payload.Date is not null)
        {
            return new DateTimeOffset(DateOnly.Parse(payload.Date).ToDateTime(TimeOnly.MinValue), TimeSpan.Zero);
        }

        return payload.DateTime;
    }
}
