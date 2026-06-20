namespace HomeOps.Api.Motivation;

public sealed record MotivationSnapshotDto(MotivationFamilyGoalDto? FamilyGoal, IReadOnlyCollection<MotivationIndividualGoalDto> IndividualGoals);
public sealed record MotivationFamilyGoalDto(Guid Id, string Title, int TargetCount, int CurrentProgress, string UnitLabel, string? RewardLabel);
public sealed record MotivationIndividualGoalDto(Guid Id, string FamilyMemberId, string FamilyMemberName, string Title, int TargetCount, int CurrentProgress, string UnitLabel, string VisualKind);
