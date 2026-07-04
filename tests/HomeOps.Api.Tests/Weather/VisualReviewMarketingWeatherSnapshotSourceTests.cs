using HomeOps.Api.Households;
using HomeOps.Api.VisualReviewFixtures;
using HomeOps.Api.Weather;

namespace HomeOps.Api.Tests.Weather;

public sealed class VisualReviewMarketingWeatherSnapshotSourceTests
{
    [Fact]
    public async Task GetSnapshotAsync_ReturnsDeterministicMarketingWeatherForProductionRecording()
    {
        var source = new VisualReviewMarketingWeatherSnapshotSource();

        var snapshot = await source.GetSnapshotAsync(SeedHousehold.Id);

        Assert.Equal(SeedHousehold.Id, snapshot.HouseholdId);
        Assert.Equal(WeatherProviderStatus.Available, snapshot.ProviderStatus);
        Assert.Equal(19, snapshot.Current.TemperatureCelsius);
        Assert.Equal(WeatherConditionCategory.PartlyCloudy, snapshot.Current.Condition);
        Assert.Contains(snapshot.HourlySlots, slot => slot.StartsAtUtc == new DateTimeOffset(2026, 6, 16, 15, 0, 0, TimeSpan.Zero) && slot.Condition == WeatherConditionCategory.Rain);
        Assert.Contains(snapshot.DailySummaries, day => day.Date == new DateOnly(2026, 6, 16));
        Assert.True(snapshot.Freshness.ExpiresAtUtc > new DateTimeOffset(2026, 6, 16, 7, 30, 0, TimeSpan.Zero));
    }
}
