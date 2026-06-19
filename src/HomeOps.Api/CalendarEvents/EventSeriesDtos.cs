namespace HomeOps.Api.CalendarEvents;

public sealed record EventSeriesDto(Guid Id, Guid EventSourceId, string Title, string? Description, DateTimeOffset StartUtc, DateTimeOffset? EndUtc, bool IsAllDay, DateTimeOffset CreatedUtc, DateTimeOffset UpdatedUtc);

public sealed record CreateEventSeriesRequest(string Title, string? Description, DateTimeOffset StartUtc, DateTimeOffset? EndUtc, bool IsAllDay);

public sealed record UpdateEventSeriesRequest(string Title, string? Description, DateTimeOffset StartUtc, DateTimeOffset? EndUtc, bool IsAllDay);
