namespace HomeOps.Api.Weather.Projections;

public sealed record WeatherDetailsProjection(
    int? RelativeHumidityPercent,
    decimal? WindSpeedKph,
    decimal? PrecipitationChancePercent,
    decimal? UvIndex,
    DateTimeOffset ObservedAtUtc,
    DateTimeOffset RefreshedAtUtc);
