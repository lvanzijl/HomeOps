using HomeOps.Api.Households;

namespace HomeOps.Api.FloorPlans;

public enum FloorPlanReplacementReviewStatus { Draft, InReview, ReadyToActivate, Activated, Cancelled, Invalid }
public enum RoomReplacementDisposition { PendingReview, ApprovedReuse, RedrawRequired, NotConfiguredYet, IntentionallyNotDrawn, BlockedFallback }

public sealed class FloorPlanReplacementReview
{
    public Guid Id { get; set; }
    public Guid HouseholdId { get; set; }
    public Household? Household { get; set; }
    public Guid FloorId { get; set; }
    public Floor? Floor { get; set; }
    public Guid CurrentAssetId { get; set; }
    public FloorPlanAsset? CurrentAsset { get; set; }
    public Guid ReplacementAssetId { get; set; }
    public FloorPlanAsset? ReplacementAsset { get; set; }
    public FloorPlanReplacementReviewStatus Status { get; set; } = FloorPlanReplacementReviewStatus.Draft;
    public bool SameCoordinateBasisDimensions { get; set; }
    public bool SameAspectRatio { get; set; }
    public bool SameDerivativeBasis { get; set; }
    public bool ReuseCandidatesAvailable { get; set; }
    public Guid? ActivatedAssetId { get; set; }
    public Guid? RollbackAssetId { get; set; }
    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset UpdatedUtc { get; set; }
    public DateTimeOffset? CompletedUtc { get; set; }
    public DateTimeOffset? ActivatedUtc { get; set; }
    public DateTimeOffset? CancelledUtc { get; set; }
    public List<FloorPlanReplacementReviewItem> Items { get; set; } = [];
}

public sealed class FloorPlanReplacementReviewItem
{
    public Guid Id { get; set; }
    public Guid ReviewId { get; set; }
    public FloorPlanReplacementReview? Review { get; set; }
    public Guid HouseholdId { get; set; }
    public Household? Household { get; set; }
    public Guid FloorId { get; set; }
    public Floor? Floor { get; set; }
    public Guid RoomId { get; set; }
    public Room? Room { get; set; }
    public RoomReplacementDisposition Disposition { get; set; } = RoomReplacementDisposition.PendingReview;
    public Guid? ReuseCandidateOverlayId { get; set; }
    public RoomOverlay? ReuseCandidateOverlay { get; set; }
    public Guid? ReplacementOverlayId { get; set; }
    public RoomOverlay? ReplacementOverlay { get; set; }
    public bool LabelAnchorApproved { get; set; }
    public string? FallbackReason { get; set; }
    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset UpdatedUtc { get; set; }
}
