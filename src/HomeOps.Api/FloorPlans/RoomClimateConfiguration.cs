using HomeOps.Api.Households;

namespace HomeOps.Api.FloorPlans;

public sealed class RoomClimateConfiguration
{
    public Guid RoomId { get; set; }
    public Guid HouseholdId { get; set; }
    public Room? Room { get; set; }
    public Household? Household { get; set; }
    public bool IsClimateEnabled { get; set; }
    public bool IsBedtimeRelevant { get; set; }
    public decimal? MinimumPreferredTemperatureCelsius { get; set; }
    public decimal? MaximumPreferredTemperatureCelsius { get; set; }
    public decimal? MinimumPreferredRelativeHumidity { get; set; }
    public decimal? MaximumPreferredRelativeHumidity { get; set; }
    public HeatingPolicyIntent HeatingPolicyIntent { get; set; } = HeatingPolicyIntent.None;
    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset UpdatedUtc { get; set; }
}

public enum HeatingPolicyIntent
{
    None,
    ReadOnlyStatus,
    BoundedControl
}

public enum ClimateSourceRole
{
    ComfortTemperature,
    Humidity,
    HeatingControlTemperature,
    HeatingStatus,
    HeatingControl
}
