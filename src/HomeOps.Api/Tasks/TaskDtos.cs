namespace HomeOps.Api.Tasks;

public sealed record HouseholdTaskDto(
    Guid Id,
    string Title,
    DateOnly? DueDate,
    TaskOwnershipKind OwnershipKind,
    string? FamilyMemberId,
    bool IsCompleted,
    DateTimeOffset? CompletedUtc,
    DateTimeOffset CreatedUtc,
    DateTimeOffset UpdatedUtc,
    Guid? RecurringTaskSeriesId,
    TaskRecurrenceFrequency RecurrenceFrequency);

public sealed record CreateHouseholdTaskRequest(
    string Title,
    DateOnly? DueDate,
    TaskOwnershipKind? OwnershipKind,
    string? FamilyMemberId,
    TaskRecurrenceFrequency? RecurrenceFrequency = null);

public sealed record UpdateHouseholdTaskRequest(
    string Title,
    DateOnly? DueDate,
    TaskOwnershipKind? OwnershipKind,
    string? FamilyMemberId,
    TaskRecurrenceFrequency? RecurrenceFrequency = null);
