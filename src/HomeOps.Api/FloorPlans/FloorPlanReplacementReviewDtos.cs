namespace HomeOps.Api.FloorPlans;

public sealed record FloorPlanReplacementReviewDto(Guid Id, Guid HouseholdId, Guid FloorId, Guid CurrentAssetId, Guid ReplacementAssetId, FloorPlanReplacementReviewStatus Status, FloorPlanReplacementCompatibilityDto Compatibility, bool RollbackAvailable, Guid? ActivatedAssetId, Guid? RollbackAssetId, DateTimeOffset CreatedUtc, DateTimeOffset UpdatedUtc, DateTimeOffset? CompletedUtc, DateTimeOffset? ActivatedUtc, DateTimeOffset? CancelledUtc, IReadOnlyCollection<FloorPlanReplacementReviewItemDto> Items);
public sealed record FloorPlanReplacementCompatibilityDto(bool SameCoordinateBasisDimensions, bool SameAspectRatio, bool SameDerivativeBasis, bool ReuseCandidatesAvailable);
public sealed record FloorPlanReplacementReviewItemDto(Guid Id, Guid ReviewId, Guid RoomId, string RoomName, RoomType RoomType, RoomReplacementDisposition Disposition, bool ReuseCandidateAvailable, Guid? ReuseCandidateOverlayId, Guid? ReplacementOverlayId, bool LabelAnchorApproved, string? FallbackReason, DateTimeOffset CreatedUtc, DateTimeOffset UpdatedUtc);
public sealed record StartFloorPlanReplacementReviewRequest(Guid ReplacementAssetId);
public sealed record UpdateRoomReplacementDispositionRequest(RoomReplacementDisposition Disposition, string? FallbackReason = null);
public sealed record ApproveReuseCandidateRequest(bool PreserveLabelAnchor = true);
public sealed record AttachReplacementOverlayRequest(Guid OverlayId, bool Approve = true, bool PreserveLabelAnchor = true);
public sealed record ReplacementReviewValidationResultDto(Guid ReviewId, bool IsReady, IReadOnlyList<RoomOverlayValidationIssue> Blockers);
public sealed record FloorPlanReplacementRollbackAvailabilityDto(Guid ReviewId, bool IsAvailable, Guid? CurrentAssetId, Guid? PreviousAssetId, IReadOnlyList<RoomOverlayValidationIssue> Blockers);
