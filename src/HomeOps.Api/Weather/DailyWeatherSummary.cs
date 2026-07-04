namespace HomeOps.Api.Weather;

public sealed record DailyWeatherSummary(
    DateOnly Date,
    decimal LowTemperatureCelsius,
    decimal HighTemperatureCelsius,
    WeatherConditionCategory Condition,
    string Summary,
    decimal? PrecipitationChancePercent = null,
    decimal? WindSpeedKph = null,
    decimal? MaxUvIndex = null);
