using HomeOps.Contracts.Events;

namespace HomeOps.Api.ManualEvents;

public static class ManualEventNormalizer
{
    public static HomeOps.Contracts.Events.EventSource ToContract(EventSource source) => new(
        source.Id.ToString(),
        source.Name,
        EventSourceType.Manual,
        true,
        source.IsWritable ? EventSourceCapability.Writable : EventSourceCapability.ReadOnly,
        new EventSourceVisibility(true, "Household"),
        new EventSourceColor("#4f46e5"));

    public static NormalizedEvent ToNormalizedEvent(ManualEvent manualEvent) => new(
        manualEvent.Id.ToString(),
        manualEvent.EventSourceId.ToString(),
        manualEvent.Title,
        manualEvent.StartUtc,
        manualEvent.EndUtc,
        manualEvent.IsAllDay,
        true,
        Description: manualEvent.Description);

    public static ManualEventDto ToDto(ManualEvent manualEvent) => new(
        manualEvent.Id,
        manualEvent.EventSourceId,
        manualEvent.Title,
        manualEvent.Description,
        manualEvent.StartUtc,
        manualEvent.EndUtc,
        manualEvent.IsAllDay,
        manualEvent.CreatedUtc,
        manualEvent.UpdatedUtc);
}
