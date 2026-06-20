using HomeOps.Api.Households;

namespace HomeOps.Api.Tasks;

public sealed class TaskTemplate
{
    public Guid Id { get; set; }
    public Guid HouseholdId { get; set; }
    public Household? Household { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsArchived { get; set; }
    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset UpdatedUtc { get; set; }
    public ICollection<TaskTemplateItem> Items { get; set; } = new List<TaskTemplateItem>();
}
