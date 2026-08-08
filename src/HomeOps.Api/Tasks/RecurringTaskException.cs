using HomeOps.Api.Lists;

namespace HomeOps.Api.Tasks;

public sealed class RecurringTaskException
{
    public Guid Id { get; set; }
    public Guid RecurringTaskSeriesId { get; set; }
    public RecurringTaskSeries? RecurringTaskSeries { get; set; }
    public DateOnly OriginalDueDate { get; set; }
    public RecurringTaskExceptionType ExceptionType { get; set; }
    public Guid? ReplacementTaskId { get; set; }
    public string? Title { get; set; }
    public DateOnly? DueDate { get; set; }
    public TaskOwnershipKind? OwnershipKind { get; set; }
    public string? FamilyMemberId { get; set; }
    public DecorativeAvatarReferenceType? DecorativeAvatarReferenceType { get; set; }
    public string? DecorativeAvatarReferenceId { get; set; }
    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset UpdatedUtc { get; set; }
}
