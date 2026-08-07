using HomeOps.Contracts.Events;

namespace HomeOps.Api.CalendarEvents;

public sealed record EventSeriesDto(Guid Id, Guid EventSourceId, string Title, string? Description, string? Location, DateTimeOffset StartUtc, DateTimeOffset? EndUtc, bool IsAllDay, DateTimeOffset CreatedUtc, DateTimeOffset UpdatedUtc, RecurrenceRuleDto? RecurrenceRule = null, IReadOnlyCollection<EventExceptionDto>? Exceptions = null, Lists.DecorativeAvatarReferenceDto? DecorativeAvatar = null);

public sealed record CreateEventSeriesRequest(
    string Title,
    string? Description,
    string? Location,
    DateTimeOffset? StartUtc,
    DateTimeOffset? EndUtc,
    bool IsAllDay,
    RecurrenceRuleDto? RecurrenceRule = null,
    Lists.DecorativeAvatarReferenceDto? DecorativeAvatar = null,
    DateOnly? StartDate = null,
    TimeOnly? StartTime = null,
    DateOnly? EndDate = null,
    TimeOnly? EndTime = null);

public sealed record UpdateEventSeriesRequest(
    string Title,
    string? Description,
    string? Location,
    DateTimeOffset? StartUtc,
    DateTimeOffset? EndUtc,
    bool IsAllDay,
    RecurrenceRuleDto? RecurrenceRule = null,
    Lists.DecorativeAvatarReferenceDto? DecorativeAvatar = null,
    DateOnly? StartDate = null,
    TimeOnly? StartTime = null,
    DateOnly? EndDate = null,
    TimeOnly? EndTime = null);

public sealed record CalendarFieldSetRequest(DateOnly StartDate, TimeOnly? StartTime, DateOnly EndDate, TimeOnly? EndTime, bool IsAllDay)
{
    public CalendarFieldSet ToDomain() => new(StartDate, StartTime, EndDate, EndTime, IsAllDay);
}


public sealed record OccurrenceTargetRequest(string OccurrenceKey);

public sealed record ModifyOccurrenceRequest(
    string OccurrenceKey,
    string? Title = null,
    string? Description = null,
    string? Location = null,
    bool? IsAllDay = null,
    DateTimeOffset? StartUtc = null,
    DateTimeOffset? EndUtc = null,
    CalendarFieldSetRequest? Timing = null);


public sealed record SplitEventSeriesRequest(
    string OccurrenceKey,
    string? Title = null,
    string? Description = null,
    string? Location = null,
    bool? IsAllDay = null,
    DateTimeOffset? StartUtc = null,
    DateTimeOffset? EndUtc = null,
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

public sealed record PreviewCalendarFieldRepairRequest(CalendarFieldSetRequest Timing);

public sealed record CalendarFieldRepairPreviewDto(
    Guid EventId,
    CalendarFieldSetRequest CurrentTiming,
    CalendarFieldSetRequest ProposedTiming,
    DateTimeOffset ProposedStartUtc,
    DateTimeOffset ProposedEndUtc);

public sealed record ApplyCalendarFieldRepairRequest(
    CalendarFieldSetRequest Timing,
    DateTimeOffset ExpectedUpdatedUtc,
    bool Confirmed);
