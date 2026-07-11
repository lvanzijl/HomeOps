namespace HomeOps.Contracts.Events;

/// <summary>
/// Generic event model normalized across future source types.
/// </summary>
/// <param name="Id">Stable HomeOps event identifier.</param>
/// <param name="EventSeriesId">Owning HomeOps event series identifier.</param>
/// <param name="SourceId">Owning HomeOps event source identifier.</param>
/// <param name="Title">Display title.</param>
/// <param name="StartsAt">Event start timestamp.</param>
/// <param name="EndsAt">Optional event end timestamp.</param>
/// <param name="AllDay">Whether the event is all-day.</param>
/// <param name="Editable">Whether HomeOps may edit the event in its source.</param>
/// <param name="ProviderEventId">Optional identifier assigned by an provider.</param>
/// <param name="Description">Optional normalized description.</param>
/// <param name="Location">Optional normalized location.</param>
/// <param name="OccurrenceKey">Original generated occurrence key for recurring occurrences.</param>
/// <param name="IsRecurring">Whether this occurrence belongs to a recurring series.</param>
/// <param name="IsException">Whether this occurrence reflects an exception override.</param>
/// <param name="Recurrence">Optional recurrence summary for recurring occurrences.</param>
/// <param name="DecorativeAvatar">Optional local decorative avatar presentation reference.</param>
public sealed record NormalizedEvent(
    string Id,
    string EventSeriesId,
    string SourceId,
    string Title,
    DateTimeOffset StartsAt,
    DateTimeOffset? EndsAt,
    bool AllDay,
    bool Editable,
    string? ProviderEventId = null,
    string? Description = null,
    string? Location = null,
    string? OccurrenceKey = null,
    bool IsRecurring = false,
    bool IsException = false,
    RecurrenceSummaryDto? Recurrence = null,
    DecorativeAvatarReferenceDto? DecorativeAvatar = null);

public enum DecorativeAvatarReferenceType { FamilyMember, KnownPerson }
public sealed record DecorativeAvatarReferenceDto(DecorativeAvatarReferenceType? ReferenceType, string? ReferenceId);
