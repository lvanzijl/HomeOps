using HomeOps.Api.Weather;

namespace HomeOps.Api.Weather.Projections;

public sealed record AgendaWeatherProjection(
    IReadOnlyList<AgendaWeatherSlotProjection> Slots,
    WeatherFreshnessProjection Freshness,
    WeatherProviderStatus Status,
    string? StatusMessage);
