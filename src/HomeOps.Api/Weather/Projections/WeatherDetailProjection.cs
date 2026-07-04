using HomeOps.Api.Weather;

namespace HomeOps.Api.Weather.Projections;

public sealed record WeatherDetailProjection(
    DepartureAdviceProjection DepartureAdvice,
    string Summary,
    CurrentWeatherProjection Current,
    IReadOnlyList<HourlyWeatherProjection> Hourly,
    IReadOnlyList<DailyWeatherProjection> Daily,
    WeatherDetailsProjection Details,
    WeatherFreshnessProjection Freshness,
    WeatherProviderStatus Status,
    string? StatusMessage);
