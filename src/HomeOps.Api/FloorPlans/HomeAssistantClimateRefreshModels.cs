namespace HomeOps.Api.FloorPlans;

public enum HomeAssistantClimateRefreshOutcome
{
    Healthy,
    AuthenticationFailure,
    ProviderUnavailable,
    InvalidConnectionConfiguration,
    PartialFailure,
    Unverified,
    Skipped,
    Cancelled
}

public sealed record HomeAssistantClimateRefreshIssue(string Scope, Guid? ProviderId, Guid? RoomId, Guid? MappingId, string Code, string Message);

public sealed record HomeAssistantClimateRefreshSummary(
    Guid? ProviderId,
    DateTimeOffset StartedUtc,
    DateTimeOffset CompletedUtc,
    HomeAssistantClimateRefreshOutcome Outcome,
    int RoomsAttempted,
    int RoomsSucceeded,
    int RoomsFailed,
    int MappingsAttempted,
    int MappingsHealthy,
    int MappingsMissing,
    int MappingsUnavailable,
    int MappingsNeedsReview,
    int ObservationsAccepted,
    int ObservationsIgnored,
    int ObservationsFailed,
    bool WasCancelled,
    IReadOnlyCollection<HomeAssistantClimateRefreshIssue> Issues);

public sealed record HomeAssistantClimateRefreshDiagnosticsDto(
    Guid ProviderId,
    string DisplayName,
    bool IsEnabled,
    bool IsArchived,
    string Outcome,
    string? DiagnosticSummary,
    DateTimeOffset? LastCheckedUtc,
    DateTimeOffset? LastSuccessfulUtc,
    IReadOnlyCollection<HomeAssistantClimateMappingDiagnosticDto> Mappings);

public sealed record HomeAssistantClimateMappingDiagnosticDto(Guid MappingId, Guid RoomId, string SourceRole, bool IsEnabled, bool IsArchived, string Health, DateTimeOffset? LastCheckedUtc, DateTimeOffset? LastSuccessfulUtc, string? DiagnosticSummary);
