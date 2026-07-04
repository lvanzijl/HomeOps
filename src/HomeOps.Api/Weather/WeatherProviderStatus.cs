namespace HomeOps.Api.Weather;

public enum WeatherProviderStatus
{
    Unknown = 0,
    Available,
    Stale,
    Unavailable
}
