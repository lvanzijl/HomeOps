using HomeOps.Contracts.Events;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace HomeOps.Api.CalendarEvents;

public sealed record EventSeriesDto(Guid Id, Guid EventSourceId, string Title, string? Description, string? Location, DateTimeOffset StartUtc, DateTimeOffset? EndUtc, bool IsAllDay, DateTimeOffset CreatedUtc, DateTimeOffset UpdatedUtc, RecurrenceRuleDto? RecurrenceRule = null, IReadOnlyCollection<EventExceptionDto>? Exceptions = null, Lists.DecorativeAvatarReferenceDto? DecorativeAvatar = null);

[method: JsonConstructor]
public sealed record CreateEventSeriesRequest(
    [property: Required] string Title,
    string? Description,
    string? Location,
    [property: Required] DateOnly? StartDate,
    TimeOnly? StartTime,
    [property: Required] DateOnly? EndDate,
    TimeOnly? EndTime,
    [property: Required] bool? IsAllDay,
    RecurrenceRuleDto? RecurrenceRule = null,
    Lists.DecorativeAvatarReferenceDto? DecorativeAvatar = null)
{
    public CreateEventSeriesRequest(string Title, string? Description, string? Location, DateTimeOffset StartUtc, DateTimeOffset? EndUtc, bool IsAllDay, RecurrenceRuleDto? RecurrenceRule = null, Lists.DecorativeAvatarReferenceDto? DecorativeAvatar = null)
        : this(Title, Description, Location,
            DateOnly.FromDateTime(StartUtc.UtcDateTime), IsAllDay ? null : TimeOnly.FromDateTime(StartUtc.UtcDateTime),
            DateOnly.FromDateTime((EndUtc ?? StartUtc).UtcDateTime), IsAllDay ? null : TimeOnly.FromDateTime((EndUtc ?? StartUtc).UtcDateTime),
            IsAllDay, RecurrenceRule, DecorativeAvatar) { }
}

[method: JsonConstructor]
public sealed record UpdateEventSeriesRequest(
    [property: Required] string Title,
    string? Description,
    string? Location,
    [property: Required] DateOnly? StartDate,
    TimeOnly? StartTime,
    [property: Required] DateOnly? EndDate,
    TimeOnly? EndTime,
    [property: Required] bool? IsAllDay,
    RecurrenceRuleDto? RecurrenceRule = null,
    Lists.DecorativeAvatarReferenceDto? DecorativeAvatar = null)
{
    public UpdateEventSeriesRequest(string Title, string? Description, string? Location, DateTimeOffset StartUtc, DateTimeOffset? EndUtc, bool IsAllDay, RecurrenceRuleDto? RecurrenceRule = null, Lists.DecorativeAvatarReferenceDto? DecorativeAvatar = null)
        : this(Title, Description, Location,
            DateOnly.FromDateTime(StartUtc.UtcDateTime), IsAllDay ? null : TimeOnly.FromDateTime(StartUtc.UtcDateTime),
            DateOnly.FromDateTime((EndUtc ?? StartUtc).UtcDateTime), IsAllDay ? null : TimeOnly.FromDateTime((EndUtc ?? StartUtc).UtcDateTime),
            IsAllDay, RecurrenceRule, DecorativeAvatar) { }
}

public sealed record CalendarFieldSetRequest(
    [property: Required] DateOnly? StartDate,
    TimeOnly? StartTime,
    [property: Required] DateOnly? EndDate,
    TimeOnly? EndTime,
    [property: Required] bool? IsAllDay)
{
    public bool TryToDomain(out CalendarFieldSet? fields)
    {
        fields = StartDate is not null && EndDate is not null && IsAllDay is not null
            ? new CalendarFieldSet(StartDate.Value, StartTime, EndDate.Value, EndTime, IsAllDay.Value)
            : null;
        return fields is not null;
    }

    public CalendarFieldSet ToDomain() => TryToDomain(out var fields)
        ? fields!
        : throw new InvalidOperationException("A complete calendar timing field set is required.");
}


public sealed record OccurrenceTargetRequest(string OccurrenceKey);

public sealed record ModifyOccurrenceRequest(
    string OccurrenceKey,
    string? Title = null,
    string? Description = null,
    string? Location = null,
    CalendarFieldSetRequest? Timing = null);


public sealed record SplitEventSeriesRequest(
    string OccurrenceKey,
    string? Title = null,
    string? Description = null,
    string? Location = null,
    RecurrenceRuleDto? RecurrenceRule = null,
    CalendarFieldSetRequest? Timing = null);

public sealed record CalendarFieldRepairCandidateDto(
    Guid EventId,
    string Title,
    DateOnly StartDate,
    TimeOnly? StartTime,
    DateOnly EndDate,
    TimeOnly? EndTime,
    bool IsAllDay,
    DateTimeOffset UpdatedUtc);

public sealed record PreviewCalendarFieldRepairRequest([property: Required] CalendarFieldSetRequest? Timing);

public sealed record CalendarFieldRepairPreviewDto(
    Guid EventId,
    CalendarFieldSetRequest CurrentTiming,
    CalendarFieldSetRequest ProposedTiming,
    DateTimeOffset ProposedStartUtc,
    DateTimeOffset ProposedEndUtc);

public sealed record ApplyCalendarFieldRepairRequest(
    [property: Required] CalendarFieldSetRequest? Timing,
    [property: Required] DateTimeOffset ExpectedUpdatedUtc,
    [property: Required] bool Confirmed);
