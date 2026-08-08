using HomeOps.Api.Households;

namespace HomeOps.Api.Motivation;

public enum MotivationGoalType
{
    Family,
    Individual,
}

public enum MotivationProgressSourceType
{
    MigrationBaseline,
    TaskCompletion,
    TaskReopen,
    Correction,
}

public sealed class MotivationProgressLedgerEntry
{
    private MotivationProgressLedgerEntry()
    {
    }

    public MotivationProgressLedgerEntry(
        Guid id,
        Guid householdId,
        MotivationGoalType goalType,
        Guid goalId,
        MotivationProgressSourceType sourceType,
        string sourceId,
        int delta,
        DateTimeOffset occurredUtc,
        string reason,
        Guid? correctionOfEntryId = null)
    {
        Id = id;
        HouseholdId = householdId;
        GoalType = goalType;
        GoalId = goalId;
        SourceType = sourceType;
        SourceId = sourceId;
        Delta = delta;
        OccurredUtc = occurredUtc;
        Reason = reason;
        CorrectionOfEntryId = correctionOfEntryId;
    }

    public Guid Id { get; private set; }
    public Guid HouseholdId { get; private set; }
    public Household? Household { get; private set; }
    public MotivationGoalType GoalType { get; private set; }
    public Guid GoalId { get; private set; }
    public MotivationProgressSourceType SourceType { get; private set; }
    public string SourceId { get; private set; } = string.Empty;
    public int Delta { get; private set; }
    public DateTimeOffset OccurredUtc { get; private set; }
    public string Reason { get; private set; } = string.Empty;
    public Guid? CorrectionOfEntryId { get; private set; }
}
