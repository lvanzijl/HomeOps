using HomeOps.Api.Weather;
using HomeOps.Api.Weather.Projections;

namespace HomeOps.Api.Tests.Weather.Projections;

public sealed class WeatherProjectionBuilderTests
{
    [Fact]
    public void ToHome_ProjectsCurrentWeatherAdviceConfidenceFreshnessAndStatus()
    {
        var now = new DateTimeOffset(2026, 7, 4, 8, 0, 0, TimeSpan.Zero);
        var snapshot = CreateSnapshot(now);
        var advice = CreateAdvice();

        var projection = new WeatherProjectionBuilder().ToHome(snapshot, advice, now);

        Assert.Equal("weather-rain", projection.IconKey);
        Assert.Equal(WeatherConditionCategory.Rain, projection.Condition);
        Assert.Equal(18, projection.TemperatureCelsius);
        Assert.Equal(DepartureAdviceConfidence.High, projection.Confidence);
        Assert.Equal(WeatherProviderStatus.Available, projection.Status);
        Assert.True(projection.Freshness.IsFresh);
        Assert.Equal(advice.Summary, projection.DepartureAdvice.Summary);
        Assert.Contains(DepartureAdviceCategory.RainProtection, projection.DepartureAdvice.Categories);
        Assert.True(projection.DepartureAdvice.BringRainProtection);
    }

    [Fact]
    public void ToDetail_ProjectsAdviceSummaryCurrentHourlyDailyAndDetailsWithoutRecalculatingAdvice()
    {
        var now = new DateTimeOffset(2026, 7, 4, 8, 0, 0, TimeSpan.Zero);
        var snapshot = CreateSnapshot(now);
        var advice = CreateAdvice("Origineel advies uit engine");

        var projection = new WeatherProjectionBuilder().ToDetail(snapshot, advice, now);

        Assert.Equal("Regenachtig", projection.Summary);
        Assert.Equal("Origineel advies uit engine", projection.DepartureAdvice.Summary);
        Assert.Equal(18, projection.Current.TemperatureCelsius);
        Assert.Equal(16, projection.Current.FeelsLikeTemperatureCelsius);
        Assert.Equal(2, projection.Hourly.Count);
        Assert.Equal(WeatherConditionCategory.Cloudy, projection.Hourly[1].Condition);
        Assert.Single(projection.Daily);
        Assert.Equal(24, projection.Daily[0].HighTemperatureCelsius);
        Assert.Equal(74, projection.Details.RelativeHumidityPercent);
        Assert.Equal(20, projection.Details.PrecipitationChancePercent);
        Assert.True(projection.Freshness.IsFresh);
    }

    [Fact]
    public void ToAgenda_ProjectsOnlyObjectiveSlotsWithoutAdviceFields()
    {
        var now = new DateTimeOffset(2026, 7, 4, 8, 0, 0, TimeSpan.Zero);
        var snapshot = CreateSnapshot(now);

        var projection = new WeatherProjectionBuilder().ToAgenda(snapshot, now);

        Assert.Equal(2, projection.Slots.Count);
        Assert.Equal(18, projection.Slots[0].TemperatureCelsius);
        Assert.Equal(WeatherConditionCategory.Rain, projection.Slots[0].Condition);
        Assert.Equal(now.AddHours(1), projection.Slots[1].StartsAtUtc);
        Assert.True(projection.Slots.All(slot => slot.Freshness.IsFresh));

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
    public void Projections_MarkExpiredFreshnessWithoutChangingSourceSnapshot()
    {
        var now = new DateTimeOffset(2026, 7, 4, 9, 0, 0, TimeSpan.Zero);
        var snapshot = CreateSnapshot(now.AddHours(-2), now.AddHours(-1));
        var advice = CreateAdvice();

        var projection = new WeatherProjectionBuilder().ToHome(snapshot, advice, now);

        Assert.False(projection.Freshness.IsFresh);
        Assert.Equal(WeatherProviderStatus.Available, projection.Status);
        Assert.Equal(now.AddHours(-1), projection.Freshness.ExpiresAtUtc);
    }

    private static FamilyBoardWeatherSnapshot CreateSnapshot(DateTimeOffset now) =>
        CreateSnapshot(now, now.AddMinutes(30));

    private static FamilyBoardWeatherSnapshot CreateSnapshot(DateTimeOffset observedAtUtc, DateTimeOffset expiresAtUtc) =>
        new(
            Guid.NewGuid(),
            new CurrentWeather(
                18,
                16,
                WeatherConditionCategory.Rain,
                "Regenachtig",
                RelativeHumidityPercent: 74,
                WindSpeedKph: 22,
                PrecipitationChancePercent: 20,
                UvIndex: 3),
            new[]
            {
                new HourlyWeatherSlot(observedAtUtc, observedAtUtc.AddHours(1), 18, WeatherConditionCategory.Rain, "Regen", 70, 24, 2),
                new HourlyWeatherSlot(observedAtUtc.AddHours(1), observedAtUtc.AddHours(2), 19, WeatherConditionCategory.Cloudy, "Bewolkt", 25, 18, 3)
            },
            new[]
            {
                new DailyWeatherSummary(DateOnly.FromDateTime(observedAtUtc.DateTime), 14, 24, WeatherConditionCategory.Rain, "Buien", 65, 28, 4)
            },
            new WeatherFreshness(observedAtUtc, observedAtUtc, expiresAtUtc),
            WeatherProviderStatus.Available);

    private static DepartureAdvice CreateAdvice(string summary = "Regenjas mee") =>
        new(
            summary,
            WeatherSeverity.Moderate,
            DepartureAdviceConfidence.High,
            new[] { DepartureAdviceCategory.RainProtection },
            BringRainProtection: true,
            DressWarmly: false,
            ExpectSlipperyConditions: false,
            AllowExtraTravelTime: false);
}
