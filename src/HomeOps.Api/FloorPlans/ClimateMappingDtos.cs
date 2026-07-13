namespace HomeOps.Api.FloorPlans;

public sealed record ClimateProviderDto(Guid Id, string DisplayName, ProviderType ProviderType, bool IsEnabled, bool IsArchived, DateTimeOffset? ArchivedUtc, string? ExternalInstanceReference, string? DiagnosticMetadata, DateTimeOffset CreatedUtc, DateTimeOffset UpdatedUtc);
public sealed record CreateClimateProviderRequest(string DisplayName, ProviderType ProviderType = ProviderType.Other, string? ExternalInstanceReference = null, string? DiagnosticMetadata = null);
public sealed record UpdateClimateProviderRequest(string DisplayName, bool? IsEnabled = null, string? ExternalInstanceReference = null, string? DiagnosticMetadata = null);

public sealed record ExternalSourceReferenceDto(string ExternalSourceId, string? ExternalDisplayName = null, string? ExternalSourceKind = null, string? ExternalAreaId = null, string? ExternalAreaName = null, string? ExternalDeviceId = null, string? ExternalDeviceName = null);
public sealed record CreateClimateMappingRequest(Guid ProviderId, ClimateSourceRole SourceRole, ExternalSourceReferenceDto Source, int? Priority = null, bool IsEnabled = true);
public sealed record UpdateClimateMappingRequest(ExternalSourceReferenceDto? Source = null, int? Priority = null, bool? IsEnabled = null, string? DiagnosticSummary = null);
public sealed record ReorderClimateMappingsRequest(IReadOnlyList<Guid> MappingIds);
public sealed record ClimateMappingDto(Guid Id, Guid RoomId, Guid ProviderId, ClimateSourceRole SourceRole, ExternalSourceReferenceDto Source, int Priority, bool IsEnabled, bool IsArchived, DateTimeOffset? ArchivedUtc, MappingHealth Health, DateTimeOffset? LastCheckedUtc, DateTimeOffset? LastSuccessfulUtc, string? DiagnosticSummary, bool IsSharedSource, IReadOnlyCollection<Guid> SharedRoomIds, DateTimeOffset CreatedUtc, DateTimeOffset UpdatedUtc);
public sealed record ClimateCapabilitySummaryDto(Guid RoomId, bool HasClimateConfiguration, bool IsClimateEnabled, IReadOnlyCollection<ClimateCapabilityRoleSummaryDto> Roles);
public sealed record ClimateCapabilityRoleSummaryDto(ClimateSourceRole Role, bool IsRequired, string Status, int ActiveCandidateCount, int TotalCandidateCount, bool HasHealthyMapping, bool HasDegradedMapping, bool HasUnavailableOrMissingMapping, bool HasSharedSource, IReadOnlyCollection<Guid> MappingIds);
