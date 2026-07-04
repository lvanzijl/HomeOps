namespace HomeOps.Api.Weather;

public sealed record CurrentWeather(
    decimal TemperatureCelsius,
    decimal FeelsLikeTemperatureCelsius,
    WeatherConditionCategory Condition,
    string Summary,
    int? RelativeHumidityPercent = null,
    decimal? WindSpeedKph = null,
    decimal? PrecipitationChancePercent = null,
    decimal? UvIndex = null);
