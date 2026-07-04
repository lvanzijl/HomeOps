using System.Net;
using HomeOps.Api.Weather;
using HomeOps.Api.Weather.OpenMeteo;

namespace HomeOps.Api.Tests.Weather;

public sealed class OpenMeteoWeatherProviderTests
{
    [Fact]
    public void BuildForecastUri_RequestsOnlyProviderOwnedForecastFields()
    {
        var uri = OpenMeteoWeatherProvider.BuildForecastUri(new OpenMeteoLocation(Guid.NewGuid(), 52.37m, 4.90m));

        Assert.Equal("api.open-meteo.com", uri.Host);
        Assert.Contains("latitude=52.37", uri.Query);
        Assert.Contains("longitude=4.90", uri.Query);
        Assert.Contains("timezone=UTC", uri.Query);
        Assert.Contains("current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation_probability", uri.Query);
        Assert.Contains("hourly=temperature_2m,weather_code,precipitation_probability,wind_speed_10m", uri.Query);
        Assert.Contains("daily=weather_code,temperature_2m_min,temperature_2m_max,precipitation_probability_max,wind_speed_10m_max", uri.Query);
    }

    [Fact]
    public async Task GetWeatherSnapshotAsync_MapsOpenMeteoResponseToFamilyBoardWeatherSnapshot()
    {
        var householdId = Guid.NewGuid();
        var provider = new OpenMeteoWeatherProvider(new HttpClient(new StubHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("""
            {
              "current": {
                "time": "2026-07-04T09:15",
                "temperature_2m": 18.4,
                "relative_humidity_2m": 72,
                "apparent_temperature": 17.8,
                "weather_code": 61,
                "wind_speed_10m": 14.2,
                "precipitation_probability": 40
              },
              "hourly": {
                "time": ["2026-07-04T10:00", "2026-07-04T11:00"],
                "temperature_2m": [19.1, 20.0],
                "weather_code": [2, 95],
                "precipitation_probability": [20, 80],
                "wind_speed_10m": [12.0, 18.5]
              },
              "daily": {
                "time": ["2026-07-04", "2026-07-05"],
                "weather_code": [3, 75],
                "temperature_2m_min": [13.2, 12.1],
                "temperature_2m_max": [21.6, 17.4],
                "precipitation_probability_max": [45, 65],
                "wind_speed_10m_max": [19.0, 24.0]
              }
            }
            """)
        })));

        var snapshot = await provider.GetWeatherSnapshotAsync(new OpenMeteoLocation(householdId, 52.37m, 4.90m));

        Assert.Equal(householdId, snapshot.HouseholdId);
        Assert.Equal(WeatherProviderStatus.Available, snapshot.ProviderStatus);
        Assert.Null(snapshot.ProviderStatusMessage);
        Assert.Equal(WeatherConditionCategory.Rain, snapshot.Current.Condition);
        Assert.Equal(18.4m, snapshot.Current.TemperatureCelsius);
        Assert.Equal(17.8m, snapshot.Current.FeelsLikeTemperatureCelsius);
        Assert.Equal(72, snapshot.Current.RelativeHumidityPercent);
        Assert.Equal(14.2m, snapshot.Current.WindSpeedKph);
        Assert.Equal(40m, snapshot.Current.PrecipitationChancePercent);
        Assert.Equal(2, snapshot.HourlySlots.Count);
        Assert.Equal(WeatherConditionCategory.PartlyCloudy, snapshot.HourlySlots[0].Condition);
        Assert.Equal(WeatherConditionCategory.Thunderstorm, snapshot.HourlySlots[1].Condition);
        Assert.Equal(2, snapshot.DailySummaries.Count);
        Assert.Equal(WeatherConditionCategory.Cloudy, snapshot.DailySummaries[0].Condition);
        Assert.Equal(WeatherConditionCategory.Snow, snapshot.DailySummaries[1].Condition);
        Assert.True(snapshot.Freshness.ExpiresAtUtc > snapshot.Freshness.RefreshedAtUtc);
    }

    [Fact]
    public async Task GetWeatherSnapshotAsync_MapsProviderFailuresToUnavailableSnapshot()
    {
        var householdId = Guid.NewGuid();
        var provider = new OpenMeteoWeatherProvider(new HttpClient(new StubHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.ServiceUnavailable))));

        var snapshot = await provider.GetWeatherSnapshotAsync(new OpenMeteoLocation(householdId, 52.37m, 4.90m));

        Assert.Equal(householdId, snapshot.HouseholdId);
        Assert.Equal(WeatherProviderStatus.Unavailable, snapshot.ProviderStatus);
        Assert.Contains("503", snapshot.ProviderStatusMessage);
        Assert.Equal(WeatherConditionCategory.Unknown, snapshot.Current.Condition);
        Assert.Empty(snapshot.HourlySlots);
        Assert.Empty(snapshot.DailySummaries);
    }

    private sealed class StubHttpMessageHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, HttpResponseMessage> send;

        public StubHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> send)
        {
            this.send = send;
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
            Task.FromResult(send(request));
    }
}
