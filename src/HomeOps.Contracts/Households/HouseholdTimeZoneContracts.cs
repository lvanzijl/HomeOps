namespace HomeOps.Contracts.Households;

public sealed record HouseholdTimeZoneDto(string TimeZoneId, DateTimeOffset UpdatedUtc);

public sealed record SupportedTimeZoneDto(string Id, string DisplayName, string UtcOffset);

public sealed record HouseholdTimeZonePreviewRequest(string TimeZoneId);

public sealed record HouseholdTimeZoneImpactDto(
    int ManualTimedEventCount,
    int ManualAllDayEventCount,
    int EnabledImportedSourceCount,
    int DisabledImportedSourceCount);

public sealed record HouseholdTimeZonePreviewDto(
    string CurrentTimeZoneId,
    string NewTimeZoneId,
    HouseholdTimeZoneImpactDto Impact,
    IReadOnlyCollection<string> Explanations);

public sealed record UpdateHouseholdTimeZoneRequest(
    string TimeZoneId,
    string ExpectedCurrentTimeZoneId,
    bool Confirmed);

public sealed record HouseholdTimeZoneSourceFailureDto(Guid SourceId, string SourceName, string Code, string Message);

public sealed record HouseholdTimeZoneUpdateDto(
    bool Succeeded,
    string TimeZoneId,
    HouseholdTimeZoneImpactDto Impact,
    IReadOnlyCollection<HouseholdTimeZoneSourceFailureDto> SourceFailures);
