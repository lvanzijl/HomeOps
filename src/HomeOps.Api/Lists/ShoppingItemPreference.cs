namespace HomeOps.Api.Lists;

public sealed class ShoppingItemPreference
{
    public Guid Id { get; set; }
    public Guid HouseholdId { get; set; }
    public string NormalizedText { get; set; } = string.Empty;
    public string ItemText { get; set; } = string.Empty;
    public string PreferredStore { get; set; } = string.Empty;
    public int StoreObservationCount { get; set; }
    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset UpdatedUtc { get; set; }
}
