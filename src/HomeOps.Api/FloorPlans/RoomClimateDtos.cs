namespace HomeOps.Api.FloorPlans;

public sealed record ClimateRangeDto(decimal Minimum, decimal Maximum);

public sealed record UpsertRoomClimateConfigurationRequest(
    bool IsClimateEnabled,
    bool IsBedtimeRelevant = false,
    ClimateRangeDto? TemperatureRange = null,
    ClimateRangeDto? HumidityRange = null,
    HeatingPolicyIntent HeatingPolicyIntent = HeatingPolicyIntent.None);

public sealed record RoomClimateConfigurationDto(
    Guid RoomId,
    bool IsConfigured,
    bool IsClimateEnabled,
    bool IsBedtimeRelevant,
    ClimateRangeDto? TemperatureRange,
    ClimateRangeDto? HumidityRange,
    HeatingPolicyIntent HeatingPolicyIntent,
    IReadOnlyCollection<ClimateSourceRole> RequiredSourceRoles,
    DateTimeOffset? CreatedUtc,
    DateTimeOffset? UpdatedUtc);

public sealed record SubmitRoomClimateObservationRequest(
    Guid SourceMappingId,
    DateTimeOffset ObservedUtc,
    DateTimeOffset? ReceivedUtc = null,
    decimal? TemperatureCelsius = null,
    decimal? RelativeHumidity = null,
    decimal? TargetTemperatureCelsius = null,
    RoomClimateOperatingState OperatingState = RoomClimateOperatingState.Unknown,
    bool IsProviderAvailable = true,
    string? SourceReference = null,
    string? StatusDetail = null);

public sealed record SubmitRoomClimateObservationResponse(RoomClimateObservationStatus Status, RoomClimateObservationDto? Observation);
public sealed record RoomClimateObservationDto(Guid Id, Guid RoomId, Guid SourceMappingId, Guid ProviderId, DateTimeOffset ObservedUtc, DateTimeOffset ReceivedUtc, decimal? TemperatureCelsius, decimal? RelativeHumidity, decimal? TargetTemperatureCelsius, RoomClimateOperatingState OperatingState, bool IsProviderAvailable, string? SourceReference, string? StatusDetail, DateTimeOffset CreatedUtc, DateTimeOffset UpdatedUtc);
public sealed record RoomClimateConfigurationSummaryDto(bool IsConfigured, bool IsClimateEnabled, ClimateRangeDto? TemperatureRange, ClimateRangeDto? HumidityRange, HeatingPolicyIntent HeatingPolicyIntent, IReadOnlyCollection<ClimateSourceRole> RequiredSourceRoles);
public sealed record RoomClimateStateDto(Guid RoomId, string RoomName, Guid FloorId, string FloorName, RoomType RoomType, RoomClimateConfigurationSummaryDto Configuration, RoomClimateObservationDto? CurrentObservation, RoomClimateOperatingState OperatingState, RoomClimateFreshness Freshness, DateTimeOffset? ObservedUtc, DateTimeOffset? ReceivedUtc, bool IsProviderAvailable, IReadOnlyCollection<string> Issues, RoomClimateSpatialDisplayStatus SpatialDisplayStatus, Guid? ActiveFloorPlanAssetId, Guid? TrustedOverlayId);
public sealed record FloorClimateCountsDto(int FreshRooms, int AgingRooms, int StaleRooms, int UnavailableRooms, int TrustedOverlayRooms, int FallbackRooms);
public sealed record FloorClimateStateDto(Guid FloorId, string FloorName, FloorPlanAssetDto? ActiveAsset, IReadOnlyCollection<RoomClimateStateDto> Rooms, FloorClimateCountsDto Counts, DateTimeOffset? ObservedSummaryUtc, RoomClimateFreshness OverallAvailability);
public sealed record HouseholdClimateSummaryDto(Guid HouseholdId, IReadOnlyCollection<FloorClimateSummaryDto> Floors);
public sealed record FloorClimateSummaryDto(Guid FloorId, string FloorName, FloorClimateCountsDto Counts, DateTimeOffset? ObservedSummaryUtc, RoomClimateFreshness OverallAvailability);

public sealed record RoomHeatingTemporaryCommandRequest(decimal TargetTemperatureCelsius, int DurationMinutes, string? IdempotencyKey = null);
public sealed record RoomHeatingResumeScheduleRequest(string? IdempotencyKey = null);
public sealed record RoomHeatingControlBlockerDto(string Code, string Message);
public sealed record RoomHeatingControlCapabilityDto(Guid RoomId, bool IsControllable, IReadOnlyCollection<RoomHeatingCommandAction> SupportedActions, ClimateRangeDto? TargetRange, IReadOnlyCollection<int> AllowedDurationsMinutes, bool IsProviderAvailable, IReadOnlyCollection<RoomHeatingControlBlockerDto> Blockers, bool IsSharedZone, IReadOnlyCollection<Guid> AffectedRoomIds, RoomHeatingCurrentOverrideDto? CurrentOverride, RoomHeatingCommandSummaryDto? LatestCommand);
public sealed record RoomHeatingCurrentOverrideDto(string State, Guid? CommandId, RoomHeatingCommandAction? Action, decimal? RequestedTargetTemperatureCelsius, decimal? ConfirmedTargetTemperatureCelsius, DateTimeOffset? EffectiveUntilUtc, string? FailureCode, string? FailureMessage);
public sealed record RoomHeatingCommandSummaryDto(Guid CommandId, RoomHeatingCommandAction Action, RoomHeatingCommandStatus Status, DateTimeOffset RequestedUtc, DateTimeOffset UpdatedUtc);
public sealed record RoomHeatingCommandDto(Guid CommandId, Guid RoomId, RoomHeatingCommandAction Action, RoomHeatingCommandStatus Status, decimal? RequestedTargetTemperatureCelsius, int? DurationMinutes, DateTimeOffset? EffectiveUntilUtc, decimal? ConfirmedTargetTemperatureCelsius, bool? ScheduleResumed, string? FailureCode, string? FailureMessage, DateTimeOffset RequestedUtc, DateTimeOffset UpdatedUtc, DateTimeOffset? AcceptedUtc, DateTimeOffset? CompletedUtc, RoomHeatingCurrentOverrideDto? CurrentOverride);
public sealed record RoomHeatingCommandResponse(RoomHeatingCommandDto Command, bool IsProviderAvailable, RoomHeatingCurrentOverrideDto? CurrentOverride);
