namespace HomeOps.Api.Households;

public sealed class Household
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string TimeZoneId { get; set; } = HouseholdTimeZone.DefaultTimeZoneId;
    public bool OnboardingCompleted { get; set; }
    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset UpdatedUtc { get; set; }
}
