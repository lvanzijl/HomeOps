using HomeOps.Api.Households;

namespace HomeOps.Api.FloorPlans;

public enum RoomClimateOperatingState { Unknown, Idle, Heating, Cooling, Unavailable }
public enum RoomClimateFreshness { Fresh, Aging, Stale, Unavailable }
public enum RoomClimateSpatialDisplayStatus { TrustedOverlayAvailable, RoomListFallback, IntentionallyNotDrawn, OverlayNeedsReview, NoActiveFloorPlan }
public enum RoomClimateObservationStatus { Accepted, IgnoredOlderObservation }

public sealed class RoomClimateObservation
{
    public Guid Id { get; set; }
    public Guid HouseholdId { get; set; }
    public Household? Household { get; set; }
    public Guid RoomId { get; set; }
    public Room? Room { get; set; }
    public Guid SourceMappingId { get; set; }
    public RoomClimateSourceMapping? SourceMapping { get; set; }
    public Guid ProviderId { get; set; }
    public ClimateProvider? Provider { get; set; }
    public DateTimeOffset ObservedUtc { get; set; }
    public DateTimeOffset ReceivedUtc { get; set; }
    public decimal? TemperatureCelsius { get; set; }
    public decimal? RelativeHumidity { get; set; }
    public decimal? TargetTemperatureCelsius { get; set; }
    public RoomClimateOperatingState OperatingState { get; set; } = RoomClimateOperatingState.Unknown;
    public bool IsProviderAvailable { get; set; } = true;
    public string? SourceReference { get; set; }
    public string? StatusDetail { get; set; }
    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset UpdatedUtc { get; set; }
}
