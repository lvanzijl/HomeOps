using HomeOps.Api.Households;

namespace HomeOps.Api.Tasks;

public sealed class RecurringTaskSeries
{
    public Guid Id { get; set; }
    public Guid HouseholdId { get; set; }
    public Household? Household { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public TaskRecurrenceFrequency Frequency { get; set; } = TaskRecurrenceFrequency.None;
    public TaskOwnershipKind OwnershipKind { get; set; } = TaskOwnershipKind.Unassigned;
    public string? FamilyMemberId { get; set; }
    public bool IsDeleted { get; set; }
    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset UpdatedUtc { get; set; }
    public ICollection<HouseholdTask> Tasks { get; set; } = new List<HouseholdTask>();
}
