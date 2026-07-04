namespace HomeOps.Api.Weather;

public sealed record WeatherFreshness(
    DateTimeOffset ObservedAtUtc,
    DateTimeOffset RefreshedAtUtc,
    DateTimeOffset ExpiresAtUtc)
{
    public bool IsFreshAt(DateTimeOffset nowUtc) => nowUtc < ExpiresAtUtc;
}
