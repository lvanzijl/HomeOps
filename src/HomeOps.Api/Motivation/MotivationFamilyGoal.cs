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
    public string? CelebrationTitle { get; set; }
    public string? CelebrationDescription { get; set; }
    public FamilyCelebrationStatus CelebrationStatus { get; set; } = FamilyCelebrationStatus.Planned;
    public bool IsActive { get; set; }
}
