namespace HomeOps.Contracts.Events;

/// <summary>
/// Generic event model normalized across future source types.
/// </summary>
/// <param name="Id">Stable HomeOps event identifier.</param>
/// <param name="SourceId">Owning HomeOps event source identifier.</param>
/// <param name="Title">Display title.</param>
/// <param name="StartsAt">Event start timestamp.</param>
/// <param name="EndsAt">Optional event end timestamp.</param>
/// <param name="AllDay">Whether the event is all-day.</param>
/// <param name="Editable">Whether HomeOps may edit the event in its source.</param>
/// <param name="ExternalEventId">Optional identifier assigned by an external system.</param>
/// <param name="Description">Optional normalized description.</param>
/// <param name="Location">Optional normalized location.</param>
public sealed record NormalizedEvent(
    string Id,
    string SourceId,
    string Title,
    DateTimeOffset StartsAt,
    DateTimeOffset? EndsAt,
    bool AllDay,
    bool Editable,
    string? ExternalEventId = null,
    string? Description = null,
    string? Location = null);
