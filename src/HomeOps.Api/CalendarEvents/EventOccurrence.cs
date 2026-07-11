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
    bool Editable,
    string? ProviderEventId = null,
    string? Location = null,
    string? OccurrenceKey = null,
    bool IsRecurring = false,
    bool IsException = false,
    HomeOps.Contracts.Events.DecorativeAvatarReferenceDto? DecorativeAvatar = null)
{
    public NormalizedEvent ToNormalizedEvent() => new(
        Id.ToString(),
        EventSeriesId.ToString(),
        EventSourceId.ToString(),
        Title,
        StartsAt,
        EndsAt,
        AllDay,
        Editable,
        ProviderEventId: ProviderEventId,
        Description: Description,
        Location: Location,
        OccurrenceKey: OccurrenceKey,
        IsRecurring: IsRecurring,
        IsException: IsException,
        Recurrence: IsRecurring ? new RecurrenceSummaryDto(true) : null,
        DecorativeAvatar: DecorativeAvatar);
}
