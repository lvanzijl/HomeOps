namespace HomeOps.Api.FloorPlans;

public sealed record FloorPlanAssetDto(Guid Id, Guid FloorId, string OriginalFilename, string DetectedMediaType, string ContentHash, int? SourceWidth, int? SourceHeight, decimal CoordinateBasisWidth, decimal CoordinateBasisHeight, decimal AspectRatio, FloorPlanAssetState State, Guid? ReplacementOfAssetId, DateTimeOffset UploadedUtc, DateTimeOffset CreatedUtc, DateTimeOffset UpdatedUtc, string? ValidationSummary, FloorPlanAssetAvailability SourceAvailability, FloorPlanAssetAvailability DerivativeAvailability, string? DerivativeUrl);
public sealed record FloorPlanAssetUploadResult(FloorPlanAssetDto Asset);
