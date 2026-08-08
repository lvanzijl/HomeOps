using System.Net;
using System.Net.Http.Json;
using HomeOps.Api.Data;
using HomeOps.Api.Households;
using HomeOps.Api.VisualReviewFixtures;
using HomeOps.Api.Weather;
using HomeOps.Api.Weather.Projections;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace HomeOps.Api.Tests.Households;

public sealed class HouseholdWeatherLocationApiTests
{
    [Fact]
    public async Task Current_location_is_unconfigured_and_invalid_coordinates_are_rejected_by_field()
    {
        await using var factory = new WeatherLocationFactory();
        using var client = factory.CreateClient();

        var current = await client.GetFromJsonAsync<HouseholdWeatherLocationDto>("/api/households/current/weather-location/");
        Assert.NotNull(current);
        Assert.False(current.IsConfigured);
        Assert.Equal(WeatherUnitSystem.Metric, current.UnitSystem);
        Assert.Equal(WeatherProviderStatus.Unknown, current.ProviderStatus);

        var invalid = await client.PutAsJsonAsync(
            "/api/households/current/weather-location/",
            new UpdateHouseholdWeatherLocationRequest("Amsterdam", 91, -181, WeatherUnitSystem.Metric));

        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);
        var problem = await invalid.Content.ReadFromJsonAsync<ValidationProblemDetails>();
        Assert.Contains("latitude", problem!.Errors.Keys);
        Assert.Contains("longitude", problem.Errors.Keys);
    }

    [Fact]
    public async Task Update_persists_complete_location_invalidates_cache_and_completes_onboarding_item()
    {
        var source = new StubWeatherSnapshotSource { UnitSystem = WeatherUnitSystem.Imperial };
        await using var factory = new WeatherLocationFactory(source);
        using var client = factory.CreateClient();

        _ = await client.GetFromJsonAsync<HomeWeatherProjection>("/api/weather/home");
        Assert.Equal(1, source.CallCount);

        var response = await client.PutAsJsonAsync(
            "/api/households/current/weather-location/",
            new UpdateHouseholdWeatherLocationRequest("Amsterdam thuis", 52.3676m, 4.9041m, WeatherUnitSystem.Imperial));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var updated = await response.Content.ReadFromJsonAsync<HouseholdWeatherLocationDto>();
        Assert.NotNull(updated);
        Assert.True(updated.IsConfigured);
        Assert.Equal("Amsterdam thuis", updated.DisplayName);
        Assert.Equal(WeatherUnitSystem.Imperial, updated.UnitSystem);
        Assert.Equal(WeatherProviderStatus.Unknown, updated.ProviderStatus);

        var agenda = await client.GetFromJsonAsync<AgendaWeatherProjection>("/api/weather/agenda");
        Assert.Equal(2, source.CallCount);
        Assert.All(agenda!.Slots, slot => Assert.Equal(WeatherUnitSystem.Imperial, slot.UnitSystem));

        var home = await client.GetFromJsonAsync<HomeWeatherProjection>("/api/weather/home");
        Assert.Equal(2, source.CallCount);
        Assert.Equal(WeatherUnitSystem.Imperial, home!.UnitSystem);

        var onboarding = await client.GetFromJsonAsync<OnboardingStatusDto>("/api/onboarding/status");
        Assert.True(onboarding!.SetupChecklist!.WeatherLocationConfigured);
    }

    [Fact]
    public async Task Refresh_returns_normalized_provider_failure_and_last_attempt_time()
    {
        var source = new StubWeatherSnapshotSource
        {
            Status = WeatherProviderStatus.Unavailable,
            UnsafeStatusMessage = "secret upstream response body"
        };
        await using var factory = new WeatherLocationFactory(source);
        using var client = factory.CreateClient();

        await client.PutAsJsonAsync(
            "/api/households/current/weather-location/",
            new UpdateHouseholdWeatherLocationRequest("Thuis", 52.3676m, 4.9041m, WeatherUnitSystem.Metric));

        var response = await client.PostAsync("/api/households/current/weather-location/refresh", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<HouseholdWeatherLocationDto>();
        Assert.NotNull(result);
        Assert.Equal(WeatherProviderStatus.Unavailable, result.ProviderStatus);
        Assert.NotNull(result.LastRefreshedUtc);
        Assert.Equal("Open-Meteo is nu niet bereikbaar. Probeer opnieuw.", result.StatusMessage);
        Assert.DoesNotContain("secret", result.StatusMessage, StringComparison.OrdinalIgnoreCase);
    }

    private sealed class WeatherLocationFactory : WebApplicationFactory<Program>
    {
        private readonly string databaseName = $"homeops-weather-location-{Guid.NewGuid()}";
        private readonly StubWeatherSnapshotSource source;

        public WeatherLocationFactory(StubWeatherSnapshotSource? source = null)
        {
            this.source = source ?? new StubWeatherSnapshotSource();
        }

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing");
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<DbContextOptions<HomeOpsDbContext>>();
                services.AddDbContext<HomeOpsDbContext>(options => options.UseInMemoryDatabase(databaseName));
                services.RemoveAll<IWeatherSnapshotSource>();
                services.AddSingleton<IWeatherSnapshotSource>(source);
                services.RemoveAll<WeatherSnapshotCache>();
                services.AddSingleton<WeatherSnapshotCache>();

                using var serviceProvider = services.BuildServiceProvider();
                using var scope = serviceProvider.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
                dbContext.Database.EnsureDeleted();
                dbContext.Database.EnsureCreated();
                LegacySeedTestFixture.ApplyAsync(dbContext).GetAwaiter().GetResult();
            });
        }
    }

    private sealed class StubWeatherSnapshotSource : IWeatherSnapshotSource
    {
        public int CallCount { get; private set; }
        public WeatherProviderStatus Status { get; init; } = WeatherProviderStatus.Available;
        public string? UnsafeStatusMessage { get; init; }
        public WeatherUnitSystem UnitSystem { get; init; } = WeatherUnitSystem.Metric;

        public Task<FamilyBoardWeatherSnapshot> GetSnapshotAsync(Guid householdId, CancellationToken cancellationToken = default)
        {
            CallCount++;
            var nowUtc = DateTimeOffset.UtcNow;
            return Task.FromResult(new FamilyBoardWeatherSnapshot(
                householdId,
                new CurrentWeather(18, 18, WeatherConditionCategory.Clear, "Clear"),
                [new HourlyWeatherSlot(nowUtc, nowUtc.AddHours(1), 18, WeatherConditionCategory.Clear, "Clear")],
                Array.Empty<DailyWeatherSummary>(),
                new WeatherFreshness(nowUtc, nowUtc, nowUtc.AddMinutes(30)),
                Status,
                UnsafeStatusMessage,
                UnitSystem));
        }
    }
}
