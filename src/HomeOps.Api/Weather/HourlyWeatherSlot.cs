namespace HomeOps.Api.Weather;

public sealed record HourlyWeatherSlot(
    DateTimeOffset StartsAtUtc,
    DateTimeOffset EndsAtUtc,
    decimal TemperatureCelsius,
    WeatherConditionCategory Condition,
    string Summary,
    decimal? PrecipitationChancePercent = null,
    decimal? WindSpeedKph = null,
    decimal? UvIndex = null);
