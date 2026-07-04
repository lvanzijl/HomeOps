namespace HomeOps.Api.Weather.Projections;

public sealed record WeatherFreshnessProjection(
    DateTimeOffset ObservedAtUtc,
    DateTimeOffset RefreshedAtUtc,
    DateTimeOffset ExpiresAtUtc,
    bool IsFresh);
