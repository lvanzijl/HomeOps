using HomeOps.Api.Households;

namespace HomeOps.Api.FloorPlans;

public enum RoomOverlayState { Draft, Valid, NeedsReview, Trusted, Invalid, Archived }

public sealed class RoomOverlay
{
    public Guid Id { get; set; }
    public Guid HouseholdId { get; set; }
    public Household? Household { get; set; }
    public Guid RoomId { get; set; }
    public Room? Room { get; set; }
    public Guid FloorId { get; set; }
    public Floor? Floor { get; set; }
    public Guid FloorPlanAssetId { get; set; }
    public FloorPlanAsset? FloorPlanAsset { get; set; }
    public RoomOverlayState State { get; set; } = RoomOverlayState.Draft;
    public string PolygonJson { get; set; } = "[]";
    public decimal? LabelAnchorX { get; set; }
    public decimal? LabelAnchorY { get; set; }
    public DateTimeOffset? ArchivedUtc { get; set; }
    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset UpdatedUtc { get; set; }
}

public sealed record NormalizedPoint(decimal X, decimal Y);
