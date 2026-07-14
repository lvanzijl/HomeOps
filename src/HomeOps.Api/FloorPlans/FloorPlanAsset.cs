using HomeOps.Api.Households;

namespace HomeOps.Api.FloorPlans;

public enum FloorPlanAssetState { Draft, Validated, Active, Replaced, Archived, Invalid, Missing }
public enum FloorPlanAssetAvailability { Available, Missing, Corrupt }

public sealed class FloorPlanAsset
{
    public Guid Id { get; set; }
    public Guid HouseholdId { get; set; }
    public Household? Household { get; set; }
    public Guid FloorId { get; set; }
    public Floor? Floor { get; set; }
    public string OriginalFilename { get; set; } = string.Empty;
    public string DetectedMediaType { get; set; } = string.Empty;
    public string ContentHash { get; set; } = string.Empty;
    public string SourceContentReference { get; set; } = string.Empty;
    public string DerivativeContentReference { get; set; } = string.Empty;
    public int? SourceWidth { get; set; }
    public int? SourceHeight { get; set; }
    public decimal CoordinateBasisWidth { get; set; }
    public decimal CoordinateBasisHeight { get; set; }
    public decimal AspectRatio { get; set; }
    public FloorPlanAssetState State { get; set; } = FloorPlanAssetState.Draft;
    public Guid? ReplacementOfAssetId { get; set; }
    public FloorPlanAsset? ReplacementOfAsset { get; set; }
    public DateTimeOffset UploadedUtc { get; set; }
    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset UpdatedUtc { get; set; }
    public string? ValidationSummary { get; set; }
    public FloorPlanAssetAvailability SourceAvailability { get; set; } = FloorPlanAssetAvailability.Available;
    public FloorPlanAssetAvailability DerivativeAvailability { get; set; } = FloorPlanAssetAvailability.Available;
}
