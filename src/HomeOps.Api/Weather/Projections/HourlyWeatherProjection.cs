using HomeOps.Api.Weather;

namespace HomeOps.Api.Weather.Projections;

public sealed record HourlyWeatherProjection(
    DateTimeOffset StartsAtUtc,
    DateTimeOffset EndsAtUtc,
    decimal TemperatureCelsius,
    WeatherConditionCategory Condition,
    string Summary,
    decimal? PrecipitationChancePercent,
    decimal? WindSpeedKph,
    decimal? UvIndex);
