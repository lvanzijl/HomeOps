using HomeOps.Api.Weather;

namespace HomeOps.Api.Weather.Projections;

public sealed record CurrentWeatherProjection(
    decimal TemperatureCelsius,
    decimal FeelsLikeTemperatureCelsius,
    WeatherConditionCategory Condition,
    string Summary,
    int? RelativeHumidityPercent,
    decimal? WindSpeedKph,
    decimal? PrecipitationChancePercent,
    decimal? UvIndex);
