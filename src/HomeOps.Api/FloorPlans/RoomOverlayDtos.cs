namespace HomeOps.Api.FloorPlans;

public sealed record RoomOverlayDto(Guid Id, Guid RoomId, Guid FloorId, Guid FloorPlanAssetId, RoomOverlayState State, IReadOnlyList<NormalizedPoint> Polygon, NormalizedPoint? LabelAnchor, DateTimeOffset? ArchivedUtc, DateTimeOffset CreatedUtc, DateTimeOffset UpdatedUtc);
public sealed record CreateRoomOverlayRequest(Guid RoomId, Guid FloorPlanAssetId, IReadOnlyList<NormalizedPoint> Polygon, NormalizedPoint? LabelAnchor = null, RoomOverlayState? State = null);
public sealed record UpdateRoomOverlayGeometryRequest(IReadOnlyList<NormalizedPoint> Polygon);
public sealed record UpdateRoomOverlayLabelAnchorRequest(NormalizedPoint? LabelAnchor);
public sealed record RoomOverlayValidationIssue(string Code, string Message, Guid? ConflictingOverlayId = null, Guid? ConflictingRoomId = null);
public sealed record RoomOverlayValidationResultDto(Guid? OverlayId, bool IsValid, IReadOnlyList<RoomOverlayValidationIssue> Blockers, IReadOnlyList<RoomOverlayValidationIssue> Warnings);
