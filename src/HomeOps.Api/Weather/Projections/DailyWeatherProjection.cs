using HomeOps.Api.Weather;

namespace HomeOps.Api.Weather.Projections;

public sealed record DailyWeatherProjection(
    DateOnly Date,
    decimal LowTemperatureCelsius,
    decimal HighTemperatureCelsius,
    WeatherConditionCategory Condition,
    string Summary,
    decimal? PrecipitationChancePercent,
    decimal? WindSpeedKph,
    decimal? MaxUvIndex);
