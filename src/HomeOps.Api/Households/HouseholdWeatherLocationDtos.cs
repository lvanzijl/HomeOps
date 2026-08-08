using HomeOps.Api.Weather;

namespace HomeOps.Api.Households;

public sealed record HouseholdWeatherLocationDto(
    bool IsConfigured,
    string? DisplayName,
    decimal? Latitude,
    decimal? Longitude,
    WeatherUnitSystem UnitSystem,
    string ProviderName,
    WeatherProviderStatus ProviderStatus,
    DateTimeOffset? LastRefreshedUtc,
    string StatusMessage);

public sealed record UpdateHouseholdWeatherLocationRequest(
    string? DisplayName,
    decimal? Latitude,
    decimal? Longitude,
    WeatherUnitSystem? UnitSystem);
