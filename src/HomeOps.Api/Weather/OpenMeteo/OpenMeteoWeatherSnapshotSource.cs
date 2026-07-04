using HomeOps.Api.Weather;

namespace HomeOps.Api.Weather.OpenMeteo;

public sealed class OpenMeteoWeatherSnapshotSource : IWeatherSnapshotSource
{
    private readonly OpenMeteoWeatherProvider provider;
    private readonly WeatherLocationOptions locationOptions;

    public OpenMeteoWeatherSnapshotSource(
        OpenMeteoWeatherProvider provider,
        WeatherLocationOptions locationOptions)
    {
        this.provider = provider;
        this.locationOptions = locationOptions;
    }

    public Task<FamilyBoardWeatherSnapshot> GetSnapshotAsync(Guid householdId, CancellationToken cancellationToken = default) =>
        provider.GetWeatherSnapshotAsync(
            new OpenMeteoLocation(householdId, locationOptions.Latitude, locationOptions.Longitude),
            cancellationToken);
}
