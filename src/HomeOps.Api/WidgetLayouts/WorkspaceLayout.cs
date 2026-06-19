using HomeOps.Api.Households;

namespace HomeOps.Api.WidgetLayouts;

public sealed class WorkspaceLayout
{
    public Guid Id { get; set; }
    public Guid HouseholdId { get; set; }
    public Household? Household { get; set; }
    public string WorkspaceKey { get; set; } = string.Empty;
    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset UpdatedUtc { get; set; }
    public ICollection<WidgetPlacement> Placements { get; set; } = new System.Collections.Generic.List<WidgetPlacement>();
}
