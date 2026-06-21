using HomeOps.Api.Households;

namespace HomeOps.Api.Lists;

public sealed class List
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsArchived { get; set; }
    public DateTimeOffset? ArchivedUtc { get; set; }
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedUtc { get; set; }
    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset UpdatedUtc { get; set; }
    public Guid HouseholdId { get; set; }
    public Household? Household { get; set; }
    public ICollection<ListItem> Items { get; set; } = new System.Collections.Generic.List<ListItem>();
}
