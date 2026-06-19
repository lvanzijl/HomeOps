using HomeOps.Contracts.Events;

namespace HomeOps.Api.CalendarEvents;

public sealed record EventOccurrence(
    Guid Id,
    Guid EventSeriesId,
    Guid EventSourceId,
    string Title,
    string? Description,
    DateTimeOffset StartsAt,
    DateTimeOffset? EndsAt,
    bool AllDay,
    bool Editable)
{
    public NormalizedEvent ToNormalizedEvent() => new(
        Id.ToString(),
        EventSourceId.ToString(),
        Title,
        StartsAt,
        EndsAt,
        AllDay,
        Editable,
        Description: Description);
}
