using System.Net;
using System.Text;
using HomeOps.Api.Data;
using HomeOps.Api.Households;
using HomeOps.Api.Weather;
using HomeOps.Api.Weather.OpenMeteo;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace HomeOps.Api.Tests.Weather;

public sealed class OpenMeteoWeatherSnapshotSourceTests
{
    [Fact]
    public async Task Source_uses_persisted_household_coordinates_and_unit_system()
    {
        Uri? requestedUri = null;
        var handler = new StubHandler(request =>
        {
            requestedUri = request.RequestUri;
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(
                    """{"current":{"time":"2026-08-08T12:00Z","temperature_2m":20,"apparent_temperature":20,"weather_code":0}}""",
                    Encoding.UTF8,
                    "application/json")
            };
        });
        var provider = new OpenMeteoWeatherProvider(new HttpClient(handler));
        var databaseName = $"weather-source-{Guid.NewGuid()}";
        var services = new ServiceCollection();
        services.AddDbContext<HomeOpsDbContext>(options =>
            options.UseInMemoryDatabase(databaseName));
        await using var serviceProvider = services.BuildServiceProvider();
        await using (var scope = serviceProvider.CreateAsyncScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
            dbContext.Households.Add(new Household
            {
                Id = SeedHousehold.Id,
                Name = "Home",
                TimeZoneId = "Europe/Amsterdam",
                WeatherLocationDisplayName = "New York",
                WeatherLatitude = 40.7128m,
                WeatherLongitude = -74.0060m,
                WeatherUnitSystem = WeatherUnitSystem.Imperial,
                CreatedUtc = DateTimeOffset.UtcNow,
                UpdatedUtc = DateTimeOffset.UtcNow
            });
            await dbContext.SaveChangesAsync();
        }

        var snapshot = await new OpenMeteoWeatherSnapshotSource(
                provider,
                serviceProvider.GetRequiredService<IServiceScopeFactory>())
            .GetSnapshotAsync(SeedHousehold.Id);

        Assert.NotNull(requestedUri);
        Assert.Contains("latitude=40.7128", requestedUri.Query);
        Assert.Contains("longitude=-74.0060", requestedUri.Query);
        Assert.Equal(WeatherUnitSystem.Imperial, snapshot.UnitSystem);
        Assert.Equal(20, snapshot.Current.TemperatureCelsius);
    }

    private sealed class StubHandler(Func<HttpRequestMessage, HttpResponseMessage> responseFactory) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
            Task.FromResult(responseFactory(request));
    }
}
