namespace HomeOps.Api.Lists;

public sealed class ShoppingItemHistory
{
    public Guid Id { get; set; }
    public Guid HouseholdId { get; set; }
    public string NormalizedText { get; set; } = string.Empty;
    public string ItemText { get; set; } = string.Empty;
    public int UseCount { get; set; }
    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset UpdatedUtc { get; set; }
}
