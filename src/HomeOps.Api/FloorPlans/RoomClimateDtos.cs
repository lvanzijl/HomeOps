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
