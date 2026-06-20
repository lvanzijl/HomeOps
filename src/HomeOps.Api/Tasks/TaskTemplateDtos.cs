namespace HomeOps.Api.Tasks;

public sealed record TaskTemplateDto(Guid Id, string Name, string? Description, bool Active, DateTimeOffset CreatedUtc, DateTimeOffset UpdatedUtc, IReadOnlyCollection<TaskTemplateItemDto> Items);
public sealed record TaskTemplateItemDto(Guid Id, string Title, TaskOwnershipKind OwnershipKind, string? FamilyMemberId, TaskRecurrenceFrequency RecurrenceFrequency, int? DueOffsetDays, int Position);
public sealed record TaskTemplateItemRequest(string Title, TaskOwnershipKind? OwnershipKind, string? FamilyMemberId, TaskRecurrenceFrequency? RecurrenceFrequency, int? DueOffsetDays);
public sealed record CreateTaskTemplateRequest(string Name, string? Description, IReadOnlyCollection<TaskTemplateItemRequest> Items);
public sealed record UpdateTaskTemplateRequest(string Name, string? Description, bool? Active, IReadOnlyCollection<TaskTemplateItemRequest> Items);
public sealed record ApplyTaskTemplateRequest(DateOnly? StartDate);
public sealed record ApplyTaskTemplateResponse(Guid TemplateId, IReadOnlyCollection<HouseholdTaskDto> CreatedTasks);
