using HomeOps.Api.Households;

namespace HomeOps.Api.Motivation;

public sealed class MotivationFamilyGoal
{
    public Guid Id { get; set; }
    public Guid HouseholdId { get; set; }
    public Household? Household { get; set; }
    public string Title { get; set; } = string.Empty;
    public int TargetCount { get; set; }
    public int CurrentProgress { get; set; }
    public string UnitLabel { get; set; } = string.Empty;
    public string? RewardLabel { get; set; }
    public bool IsActive { get; set; }
}
