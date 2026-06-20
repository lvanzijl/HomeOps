namespace HomeOps.Api.Motivation;

public sealed record MotivationSnapshotDto(MotivationFamilyGoalDto? FamilyGoal, IReadOnlyCollection<MotivationIndividualGoalDto> IndividualGoals);
public sealed record MotivationFamilyCelebrationDto(string Title, string? Description, FamilyCelebrationStatus Status);
public sealed record MotivationFamilyGoalDto(Guid Id, string Title, int TargetCount, int CurrentProgress, string UnitLabel, MotivationFamilyCelebrationDto? Celebration);
public sealed record MotivationIndividualGoalDto(Guid Id, string FamilyMemberId, string FamilyMemberName, string Title, int TargetCount, int CurrentProgress, string UnitLabel, string VisualKind);

public sealed record UpsertMotivationIndividualGoalRequest(string FamilyMemberId, string Title, int TargetCount, string UnitLabel);

public sealed record UpsertMotivationFamilyGoalRequest(string Title, int TargetCount, string UnitLabel, string? CelebrationTitle, string? CelebrationDescription);
