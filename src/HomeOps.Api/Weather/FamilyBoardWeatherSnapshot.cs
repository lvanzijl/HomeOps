namespace HomeOps.Api.Weather;

public sealed record FamilyBoardWeatherSnapshot(
    Guid HouseholdId,
    CurrentWeather Current,
    IReadOnlyList<HourlyWeatherSlot> HourlySlots,
    IReadOnlyList<DailyWeatherSummary> DailySummaries,
    WeatherFreshness Freshness,
    WeatherProviderStatus ProviderStatus,
    string? ProviderStatusMessage = null);
