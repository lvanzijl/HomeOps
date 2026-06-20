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
    DateTimeOffset UpdatedUtc);

public sealed record CreateHouseholdTaskRequest(
    string Title,
    DateOnly? DueDate,
    TaskOwnershipKind? OwnershipKind,
    string? FamilyMemberId);
