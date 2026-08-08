using System.Text.Json.Serialization;

namespace HomeOps.Api.WeeklyReset;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum WeeklyResetStatus
{
    Open,
    Completed,
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum WeeklyResetOutcome
{
    Reviewed,
    Skipped,
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum WeeklyResetCandidateType
{
    Task,
    FamilyGoal,
    IndividualGoal,
    ShoppingList,
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum WeeklyResetDecision
{
    CarryForward,
    Later,
    Archive,
    Acknowledge,
}
