namespace HomeOps.Api.ManualEvents;

public sealed record ManualEventDto(Guid Id, Guid EventSourceId, string Title, string? Description, DateTimeOffset StartUtc, DateTimeOffset? EndUtc, bool IsAllDay, DateTimeOffset CreatedUtc, DateTimeOffset UpdatedUtc);

public sealed record CreateManualEventRequest(string Title, string? Description, DateTimeOffset StartUtc, DateTimeOffset? EndUtc, bool IsAllDay);

public sealed record UpdateManualEventRequest(string Title, string? Description, DateTimeOffset StartUtc, DateTimeOffset? EndUtc, bool IsAllDay);
