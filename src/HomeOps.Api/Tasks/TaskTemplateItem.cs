namespace HomeOps.Api.Tasks;

public sealed class TaskTemplateItem
{
    public Guid Id { get; set; }
    public Guid TaskTemplateId { get; set; }
    public TaskTemplate? TaskTemplate { get; set; }
    public string Title { get; set; } = string.Empty;
    public TaskOwnershipKind OwnershipKind { get; set; } = TaskOwnershipKind.Unassigned;
    public string? FamilyMemberId { get; set; }
    public TaskRecurrenceFrequency RecurrenceFrequency { get; set; } = TaskRecurrenceFrequency.None;
    public int? DueOffsetDays { get; set; }
    public int Position { get; set; }
}
