using HomeOps.Api.Data;
using HomeOps.Api.Weather;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.Weather.OpenMeteo;

public sealed class OpenMeteoWeatherSnapshotSource : IWeatherSnapshotSource
{
    private readonly OpenMeteoWeatherProvider provider;
    private readonly IServiceScopeFactory scopeFactory;

    public OpenMeteoWeatherSnapshotSource(
        OpenMeteoWeatherProvider provider,
        IServiceScopeFactory scopeFactory)
    {
        this.provider = provider;
        this.scopeFactory = scopeFactory;
    }

    public async Task<FamilyBoardWeatherSnapshot> GetSnapshotAsync(Guid householdId, CancellationToken cancellationToken = default)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<HomeOpsDbContext>();
        var household = await dbContext.Households
            .AsNoTracking()
            .SingleOrDefaultAsync(candidate => candidate.Id == householdId, cancellationToken);

        if (household?.WeatherLatitude is not decimal latitude || household.WeatherLongitude is not decimal longitude)
        {
            var nowUtc = DateTimeOffset.UtcNow;
            return new FamilyBoardWeatherSnapshot(
                householdId,
                new CurrentWeather(0, 0, WeatherConditionCategory.Unknown, "Weather unavailable"),
                Array.Empty<HourlyWeatherSlot>(),
                Array.Empty<DailyWeatherSummary>(),
                new WeatherFreshness(nowUtc, nowUtc, nowUtc),
                WeatherProviderStatus.Unavailable,
                "Weather location is not configured.",
                household?.WeatherUnitSystem ?? WeatherUnitSystem.Metric);
        }

        var snapshot = await provider.GetWeatherSnapshotAsync(
            new OpenMeteoLocation(householdId, latitude, longitude),
            cancellationToken);

        return snapshot with { UnitSystem = household.WeatherUnitSystem };
    }
}
