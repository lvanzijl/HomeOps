using System.Net.Http.Json;
using HomeOps.Api.Weather;
using HomeOps.Api.Weather.Projections;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace HomeOps.Api.Tests.Weather;

public sealed class WeatherApiTests
{
    [Fact]
    public async Task GetHomeWeather_ReturnsHomeProjectionFromExistingWeatherPipeline()
    {
        using var factory = new WeatherApiWebApplicationFactory();
        using var client = factory.CreateClient();

        var projection = await client.GetFromJsonAsync<HomeWeatherProjection>("/api/weather/home");

        Assert.NotNull(projection);
        Assert.Equal(WeatherConditionCategory.Rain, projection.Condition);
        Assert.Equal("weather-rain", projection.IconKey);
        Assert.Equal(18, projection.TemperatureCelsius);
        Assert.Equal(WeatherProviderStatus.Available, projection.Status);
        Assert.Equal(DepartureAdviceConfidence.High, projection.Confidence);
        Assert.Contains(DepartureAdviceCategory.RainProtection, projection.DepartureAdvice.Categories);
        Assert.True(projection.DepartureAdvice.BringRainProtection);
    }

    [Fact]
    public async Task GetWeatherDetail_ReturnsDetailProjectionWithAdviceAndForecasts()
    {
        using var factory = new WeatherApiWebApplicationFactory();
        using var client = factory.CreateClient();

        var projection = await client.GetFromJsonAsync<WeatherDetailProjection>("/api/weather/detail");

        Assert.NotNull(projection);
        Assert.Equal("Regenachtig", projection.Summary);
        Assert.Equal(18, projection.Current.TemperatureCelsius);
        Assert.Equal(2, projection.Hourly.Count);
        Assert.Single(projection.Daily);
        Assert.Equal(74, projection.Details.RelativeHumidityPercent);
        Assert.Contains(DepartureAdviceCategory.RainProtection, projection.DepartureAdvice.Categories);
    }

    [Fact]
    public async Task GetAgendaWeather_ReturnsObjectiveWeatherSlotsWithoutAdvice()
    {
        using var factory = new WeatherApiWebApplicationFactory();
        using var client = factory.CreateClient();

        var projection = await client.GetFromJsonAsync<AgendaWeatherProjection>("/api/weather/agenda");

        Assert.NotNull(projection);
        Assert.Equal(2, projection.Slots.Count);
        Assert.Equal(WeatherConditionCategory.Rain, projection.Slots[0].Condition);
        Assert.Equal(18, projection.Slots[0].TemperatureCelsius);

        var agendaPropertyNames = typeof(AgendaWeatherProjection).GetProperties()
            .Concat(typeof(AgendaWeatherSlotProjection).GetProperties())
            .Select(property => property.Name)
            .ToArray();

        Assert.DoesNotContain(agendaPropertyNames, name => name.Contains("Advice", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(agendaPropertyNames, name => name.Contains("RainProtection", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(agendaPropertyNames, name => name.Contains("Indoor", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(agendaPropertyNames, name => name.Contains("Outdoor", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task WeatherEndpoints_ShareCacheAcrossProjectionRequests()
    {
        var source = new StubWeatherSnapshotSource();
        using var factory = new WeatherApiWebApplicationFactory(source);
        using var client = factory.CreateClient();

        _ = await client.GetFromJsonAsync<HomeWeatherProjection>("/api/weather/home");
        _ = await client.GetFromJsonAsync<WeatherDetailProjection>("/api/weather/detail");
        _ = await client.GetFromJsonAsync<AgendaWeatherProjection>("/api/weather/agenda");

        Assert.Equal(1, source.CallCount);
    }

    private sealed class WeatherApiWebApplicationFactory : WebApplicationFactory<Program>
    {
        private readonly StubWeatherSnapshotSource source;

        public WeatherApiWebApplicationFactory()
            : this(new StubWeatherSnapshotSource())
        {
        }

        public WeatherApiWebApplicationFactory(StubWeatherSnapshotSource source)
        {
            this.source = source;
        }

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing");
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<IWeatherSnapshotSource>();
                services.AddSingleton<IWeatherSnapshotSource>(source);
                services.RemoveAll<WeatherSnapshotCache>();
                services.AddSingleton<WeatherSnapshotCache>();
            });
        }
    }

    private sealed class StubWeatherSnapshotSource : IWeatherSnapshotSource
    {
        public int CallCount { get; private set; }

        public Task<FamilyBoardWeatherSnapshot> GetSnapshotAsync(Guid householdId, CancellationToken cancellationToken = default)
        {
            CallCount++;
            var now = DateTimeOffset.UtcNow;
            return Task.FromResult(new FamilyBoardWeatherSnapshot(
                householdId,
                new CurrentWeather(
                    18,
                    16,
                    WeatherConditionCategory.Rain,
                    "Regenachtig",
                    RelativeHumidityPercent: 74,
                    WindSpeedKph: 22,
                    PrecipitationChancePercent: 80,
                    UvIndex: 2),
                new[]
                {
                    new HourlyWeatherSlot(now, now.AddHours(1), 18, WeatherConditionCategory.Rain, "Regen", 80, 24, 2),
                    new HourlyWeatherSlot(now.AddHours(1), now.AddHours(2), 19, WeatherConditionCategory.Cloudy, "Bewolkt", 25, 18, 3)
                },
                new[]
                {
                    new DailyWeatherSummary(DateOnly.FromDateTime(now.DateTime), 14, 24, WeatherConditionCategory.Rain, "Buien", 80, 28, 4)
                },
                new WeatherFreshness(now, now, now.AddMinutes(30)),
                WeatherProviderStatus.Available));
        }
    }
}
