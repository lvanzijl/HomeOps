using HomeOps.Api.Households;
using HomeOps.Api.Lists;

namespace HomeOps.Api.Tasks;

public sealed class HouseholdTask
{
    public Guid Id { get; set; }
    public Guid HouseholdId { get; set; }
    public Household? Household { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateOnly? DueDate { get; set; }
    public TaskOwnershipKind OwnershipKind { get; set; } = TaskOwnershipKind.Unassigned;
    public string? FamilyMemberId { get; set; }
    public Guid? RecurringTaskSeriesId { get; set; }
    public RecurringTaskSeries? RecurringTaskSeries { get; set; }
    public TaskRecurrenceFrequency RecurrenceFrequency { get; set; } = TaskRecurrenceFrequency.None;
    public DecorativeAvatarReferenceType? DecorativeAvatarReferenceType { get; set; }
    public string? DecorativeAvatarReferenceId { get; set; }
    public bool IsCompleted { get; set; }
    public bool IsExpired { get; set; }
    public NoDateTaskReviewState NoDateReviewState { get; set; } = NoDateTaskReviewState.Active;
    public DateTimeOffset? NoDateLastReviewedUtc { get; set; }
    public DateTimeOffset? ArchivedUtc { get; set; }
    public DateTimeOffset? CompletedUtc { get; set; }
    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset UpdatedUtc { get; set; }
}
