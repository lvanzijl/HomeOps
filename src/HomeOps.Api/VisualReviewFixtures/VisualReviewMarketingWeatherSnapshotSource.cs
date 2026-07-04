using HomeOps.Api.Weather;

namespace HomeOps.Api.VisualReviewFixtures;

public sealed class VisualReviewMarketingWeatherSnapshotSource : IWeatherSnapshotSource
{
    private static readonly DateTimeOffset AnchorUtc = new(2026, 6, 16, 7, 30, 0, TimeSpan.Zero);

    public Task<FamilyBoardWeatherSnapshot> GetSnapshotAsync(Guid householdId, CancellationToken cancellationToken = default)
    {
        var snapshot = new FamilyBoardWeatherSnapshot(
            householdId,
            new CurrentWeather(
                19,
                18,
                WeatherConditionCategory.PartlyCloudy,
                "Zacht met later kans op een bui",
                RelativeHumidityPercent: 68,
                WindSpeedKph: 18,
                PrecipitationChancePercent: 35,
                UvIndex: 5),
            new[]
            {
                Slot(7, 18, WeatherConditionCategory.PartlyCloudy, "Zachte ochtend", 20, 14, 2),
                Slot(8, 19, WeatherConditionCategory.PartlyCloudy, "Droog naar school", 25, 16, 3),
                Slot(9, 20, WeatherConditionCategory.MostlyClear, "Rustig onderweg", 15, 15, 4),
                Slot(15, 22, WeatherConditionCategory.Rain, "Kans op buien", 65, 22, 4),
                Slot(16, 21, WeatherConditionCategory.Rain, "Bui rond zwemles", 70, 24, 3),
                Slot(17, 20, WeatherConditionCategory.Cloudy, "Wolken na school", 35, 20, 2),
                Slot(19, 18, WeatherConditionCategory.MostlyClear, "Rustige avond", 10, 12, 1),
            },
            new[]
            {
                new DailyWeatherSummary(new DateOnly(2026, 6, 16), 14, 23, WeatherConditionCategory.PartlyCloudy, "Zachte dag met later een bui", 55, 24, 5),
                new DailyWeatherSummary(new DateOnly(2026, 6, 17), 13, 21, WeatherConditionCategory.Cloudy, "Rustig en bewolkt", 30, 20, 4),
                new DailyWeatherSummary(new DateOnly(2026, 6, 18), 15, 24, WeatherConditionCategory.MostlyClear, "Zonnige momenten", 20, 18, 6),
            },
            new WeatherFreshness(AnchorUtc, AnchorUtc, AnchorUtc.AddDays(30)),
            WeatherProviderStatus.Available);

        return Task.FromResult(snapshot);
    }

    private static HourlyWeatherSlot Slot(int hour, decimal temperature, WeatherConditionCategory condition, string summary, decimal rainChance, decimal windSpeed, decimal uvIndex)
    {
        var startsAt = new DateTimeOffset(2026, 6, 16, hour, 0, 0, TimeSpan.Zero);
        return new HourlyWeatherSlot(startsAt, startsAt.AddHours(1), temperature, condition, summary, rainChance, windSpeed, uvIndex);
    }
}
