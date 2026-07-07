using HomeOps.Contracts.Events;

namespace HomeOps.Api.CalendarEvents;

public sealed record EventSeriesDto(Guid Id, Guid EventSourceId, string Title, string? Description, DateTimeOffset StartUtc, DateTimeOffset? EndUtc, bool IsAllDay, DateTimeOffset CreatedUtc, DateTimeOffset UpdatedUtc, RecurrenceRuleDto? RecurrenceRule = null, IReadOnlyCollection<EventExceptionDto>? Exceptions = null);

public sealed record CreateEventSeriesRequest(string Title, string? Description, DateTimeOffset StartUtc, DateTimeOffset? EndUtc, bool IsAllDay, RecurrenceRuleDto? RecurrenceRule = null);

public sealed record UpdateEventSeriesRequest(string Title, string? Description, DateTimeOffset StartUtc, DateTimeOffset? EndUtc, bool IsAllDay, RecurrenceRuleDto? RecurrenceRule = null);


public sealed record OccurrenceTargetRequest(string OccurrenceKey);

public sealed record ModifyOccurrenceRequest(
    string OccurrenceKey,
    string? Title = null,
    string? Description = null,
    string? Location = null,
    bool? IsAllDay = null,
    DateTimeOffset? StartUtc = null,
    DateTimeOffset? EndUtc = null);


public sealed record SplitEventSeriesRequest(
    string OccurrenceKey,
    string? Title = null,
    string? Description = null,
    string? Location = null,
    bool? IsAllDay = null,
    DateTimeOffset? StartUtc = null,
    DateTimeOffset? EndUtc = null,
    RecurrenceRuleDto? RecurrenceRule = null);
