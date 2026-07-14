namespace HomeOps.Api.FloorPlans;

public sealed record FloorPlanReplacementReviewDto(Guid Id, Guid FloorId, Guid CurrentAssetId, Guid ReplacementAssetId, FloorPlanReplacementReviewStatus Status, bool SameCoordinateBasisDimensions, bool SameAspectRatio, bool SameDerivativeBasis, bool ReuseCandidatesAvailable, Guid? ActivatedAssetId, Guid? RollbackAssetId, DateTimeOffset CreatedUtc, DateTimeOffset UpdatedUtc, DateTimeOffset? CompletedUtc, DateTimeOffset? ActivatedUtc, DateTimeOffset? CancelledUtc, IReadOnlyCollection<FloorPlanReplacementReviewItemDto> Items);
public sealed record FloorPlanReplacementReviewItemDto(Guid Id, Guid ReviewId, Guid RoomId, RoomReplacementDisposition Disposition, Guid? ReuseCandidateOverlayId, Guid? ReplacementOverlayId, bool LabelAnchorApproved, string? FallbackReason, DateTimeOffset CreatedUtc, DateTimeOffset UpdatedUtc);
public sealed record StartFloorPlanReplacementReviewRequest(Guid ReplacementAssetId);
public sealed record UpdateRoomReplacementDispositionRequest(RoomReplacementDisposition Disposition, string? FallbackReason = null);
public sealed record ApproveReuseCandidateRequest(bool PreserveLabelAnchor = true);
public sealed record AttachReplacementOverlayRequest(Guid OverlayId, bool Approve = true, bool PreserveLabelAnchor = true);
public sealed record ReplacementReviewValidationResultDto(Guid ReviewId, bool IsReady, IReadOnlyList<RoomOverlayValidationIssue> Blockers);
