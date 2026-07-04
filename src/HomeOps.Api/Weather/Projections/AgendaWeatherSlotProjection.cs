using HomeOps.Api.Weather;

namespace HomeOps.Api.Weather.Projections;

public sealed record AgendaWeatherSlotProjection(
    DateTimeOffset StartsAtUtc,
    DateTimeOffset EndsAtUtc,
    decimal TemperatureCelsius,
    WeatherConditionCategory Condition,
    string Summary,
    WeatherFreshnessProjection Freshness);
