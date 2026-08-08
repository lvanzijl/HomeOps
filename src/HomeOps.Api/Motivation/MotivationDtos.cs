namespace HomeOps.Api.Motivation;

public sealed record MotivationSnapshotDto(MotivationFamilyGoalDto? FamilyGoal, IReadOnlyCollection<MotivationIndividualGoalDto> IndividualGoals, IReadOnlyCollection<MotivationFamilyCelebrationMemoryDto> CelebrationMemories);
public sealed record MotivationFamilyCelebrationDto(string Title, string? Description, FamilyCelebrationStatus Status, DateTimeOffset? CelebratedUtc);
public sealed record MotivationFamilyCelebrationMemoryDto(Guid FamilyGoalId, string Title, string? Description, DateTimeOffset CelebratedUtc);
public sealed record MotivationFamilyGoalDto(Guid Id, string Title, int TargetCount, int CurrentProgress, string UnitLabel, MotivationFamilyCelebrationDto? Celebration);
public sealed record MotivationFamilyGoalHistoryDto(MotivationFamilyGoalDto Goal, DateTimeOffset? ArchivedUtc);
public sealed record MotivationIndividualGoalDto(Guid Id, string FamilyMemberId, string FamilyMemberName, string Title, int TargetCount, int CurrentProgress, string UnitLabel, string VisualKind);

public sealed record UpsertMotivationIndividualGoalRequest(string FamilyMemberId, string Title, int TargetCount, string UnitLabel);

public sealed record UpsertMotivationFamilyGoalRequest(string Title, int TargetCount, string UnitLabel, string? CelebrationTitle, string? CelebrationDescription);

public sealed record MotivationProgressLedgerEntryDto(Guid Id, MotivationProgressSourceType SourceType, string SourceId, int Delta, DateTimeOffset OccurredUtc, string Reason, Guid? CorrectionOfEntryId);
public sealed record MotivationProgressLedgerDto(MotivationGoalType GoalType, Guid GoalId, int CurrentProgress, int TargetCount, string UnitLabel, IReadOnlyCollection<MotivationProgressLedgerEntryDto> Entries);
public sealed record CreateMotivationProgressCorrectionRequest(int Delta, string Reason, Guid? CorrectionOfEntryId);
