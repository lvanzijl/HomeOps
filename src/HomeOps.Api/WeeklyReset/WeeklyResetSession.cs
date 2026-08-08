using HomeOps.Api.Households;

namespace HomeOps.Api.WeeklyReset;

public sealed class WeeklyResetSession
{
    public Guid Id { get; set; }
    public Guid HouseholdId { get; set; }
    public DateOnly WeekStart { get; set; }
    public WeeklyResetStatus Status { get; set; } = WeeklyResetStatus.Open;
    public WeeklyResetOutcome? Outcome { get; set; }
    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset UpdatedUtc { get; set; }
    public DateTimeOffset? CompletedUtc { get; set; }
    public Household? Household { get; set; }
    public ICollection<WeeklyResetCandidate> Candidates { get; set; } = new List<WeeklyResetCandidate>();
}
