using HomeOps.Api.Weather;

namespace HomeOps.Api.Weather.Projections;

public sealed record HomeWeatherProjection(
    string IconKey,
    WeatherConditionCategory Condition,
    decimal TemperatureCelsius,
    DepartureAdviceProjection DepartureAdvice,
    DepartureAdviceConfidence Confidence,
    WeatherFreshnessProjection Freshness,
    WeatherProviderStatus Status,
    string? StatusMessage);
