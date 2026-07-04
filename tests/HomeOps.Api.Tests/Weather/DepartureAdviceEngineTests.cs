using HomeOps.Api.Weather;

namespace HomeOps.Api.Tests.Weather;

public sealed class DepartureAdviceEngineTests
{
    [Fact]
    public void CreateAdvice_WhenWarmDryAndReliable_ReturnsNoJacketAdviceWithHighConfidence()
    {
        var now = new DateTimeOffset(2026, 7, 4, 8, 0, 0, TimeSpan.Zero);
        var snapshot = CreateSnapshot(
            now,
            current: new CurrentWeather(22, 21, WeatherConditionCategory.Clear, "Clear", WindSpeedKph: 10, PrecipitationChancePercent: 5),
            hourlySlots: new[]
            {
                CreateSlot(now.AddMinutes(30), 23, WeatherConditionCategory.Clear, rainChance: 5, windSpeed: 10),
                CreateSlot(now.AddHours(1), 24, WeatherConditionCategory.Clear, rainChance: 5, windSpeed: 12)
            });

        var advice = new DepartureAdviceEngine().CreateAdvice(snapshot, now);

        Assert.Equal(DepartureAdviceConfidence.High, advice.Confidence);
        Assert.Equal(WeatherSeverity.Low, advice.Severity);
        Assert.Contains(DepartureAdviceCategory.NoJacketNeeded, advice.Categories);
        Assert.False(advice.BringRainProtection);
        Assert.False(advice.DressWarmly);
        Assert.Contains("geen jas nodig", advice.Summary);
    }

    [Fact]
    public void CreateAdvice_WhenRainIsExpectedSoon_RecommendsRainProtectionAndUsesTiming()
    {
        var now = new DateTimeOffset(2026, 7, 4, 8, 0, 0, TimeSpan.Zero);
        var snapshot = CreateSnapshot(
            now,
            current: new CurrentWeather(17, 15, WeatherConditionCategory.Cloudy, "Cloudy", WindSpeedKph: 12, PrecipitationChancePercent: 20),
            hourlySlots: new[]
            {
                CreateSlot(now.AddMinutes(30), 16, WeatherConditionCategory.Rain, rainChance: 80, windSpeed: 14),
                CreateSlot(now.AddHours(1), 16, WeatherConditionCategory.Rain, rainChance: 85, windSpeed: 16)
            });

        var advice = new DepartureAdviceEngine().CreateAdvice(snapshot, now);

        Assert.Equal(DepartureAdviceConfidence.High, advice.Confidence);
        Assert.Equal(WeatherSeverity.High, advice.Severity);
        Assert.Contains(DepartureAdviceCategory.RainProtection, advice.Categories);
        Assert.Contains(DepartureAdviceCategory.ExtraTravelTime, advice.Categories);
        Assert.True(advice.BringRainProtection);
        Assert.True(advice.AllowExtraTravelTime);
    }

    [Fact]
    public void CreateAdvice_WhenWindIsStrong_RecommendsWindAdviceAndExtraTravelTime()
    {
        var now = new DateTimeOffset(2026, 7, 4, 8, 0, 0, TimeSpan.Zero);
        var snapshot = CreateSnapshot(
            now,
            current: new CurrentWeather(12, 8, WeatherConditionCategory.Wind, "Wind", WindSpeedKph: 54, PrecipitationChancePercent: 10));

        var advice = new DepartureAdviceEngine().CreateAdvice(snapshot, now);

        Assert.Contains(DepartureAdviceCategory.Windy, advice.Categories);
        Assert.Contains(DepartureAdviceCategory.ExtraTravelTime, advice.Categories);
        Assert.True(advice.AllowExtraTravelTime);
        Assert.Equal(WeatherSeverity.High, advice.Severity);
    }

    [Fact]
    public void CreateAdvice_WhenUvAndHeatAreAvailable_RecommendsSunProtectionAndDrinkBottle()
    {
        var now = new DateTimeOffset(2026, 7, 4, 8, 0, 0, TimeSpan.Zero);
        var snapshot = CreateSnapshot(
            now,
            current: new CurrentWeather(26, 27, WeatherConditionCategory.Clear, "Clear", WindSpeedKph: 8, PrecipitationChancePercent: 0, UvIndex: 7),
            dailySummaries: new[]
            {
                new DailyWeatherSummary(DateOnly.FromDateTime(now.DateTime), 18, 29, WeatherConditionCategory.Clear, "Clear", MaxUvIndex: 7)
            });

        var advice = new DepartureAdviceEngine().CreateAdvice(snapshot, now);

        Assert.Contains(DepartureAdviceCategory.SunProtection, advice.Categories);
        Assert.Contains(DepartureAdviceCategory.FillDrinkBottle, advice.Categories);
        Assert.Contains("zonnebrand mee", advice.Summary);
        Assert.Contains("drinkfles vullen", advice.Summary);
    }

    [Fact]
    public void CreateAdvice_WhenSnapshotIsStale_LowersConfidenceAndAvoidsFalseCertainty()
    {
        var now = new DateTimeOffset(2026, 7, 4, 8, 0, 0, TimeSpan.Zero);
        var snapshot = CreateSnapshot(
            now.AddHours(-2),
            now.AddHours(-1),
            WeatherProviderStatus.Stale,
            current: new CurrentWeather(16, 14, WeatherConditionCategory.Unknown, "Unknown"));

        var advice = new DepartureAdviceEngine().CreateAdvice(snapshot, now);

        Assert.Equal(DepartureAdviceConfidence.Low, advice.Confidence);
        Assert.Contains("lage zekerheid", advice.Summary);
    }

    [Fact]
    public void CreateAdvice_WhenProviderUnavailable_ReturnsCautiousNeutralAdvice()
    {
        var now = new DateTimeOffset(2026, 7, 4, 8, 0, 0, TimeSpan.Zero);
        var snapshot = CreateSnapshot(
            now,
            now,
            WeatherProviderStatus.Unavailable,
            current: new CurrentWeather(0, 0, WeatherConditionCategory.Unknown, "Unavailable"));

        var advice = new DepartureAdviceEngine().CreateAdvice(snapshot, now);

        Assert.Equal(DepartureAdviceConfidence.Low, advice.Confidence);
        Assert.Equal(WeatherSeverity.Low, advice.Severity);
        Assert.Contains(DepartureAdviceCategory.Neutral, advice.Categories);
        Assert.False(advice.BringRainProtection);
        Assert.Contains("voorzichtig", advice.Summary);
    }

    private static FamilyBoardWeatherSnapshot CreateSnapshot(
        DateTimeOffset now,
        CurrentWeather current,
        IReadOnlyList<HourlyWeatherSlot>? hourlySlots = null,
        IReadOnlyList<DailyWeatherSummary>? dailySummaries = null) =>
        CreateSnapshot(now, now.AddMinutes(30), WeatherProviderStatus.Available, current, hourlySlots, dailySummaries);

    private static FamilyBoardWeatherSnapshot CreateSnapshot(
        DateTimeOffset observedAtUtc,
        DateTimeOffset expiresAtUtc,
        WeatherProviderStatus providerStatus,
        CurrentWeather current,
        IReadOnlyList<HourlyWeatherSlot>? hourlySlots = null,
        IReadOnlyList<DailyWeatherSummary>? dailySummaries = null) =>
        new(
            Guid.NewGuid(),
            current,
            hourlySlots ?? Array.Empty<HourlyWeatherSlot>(),
            dailySummaries ?? Array.Empty<DailyWeatherSummary>(),
            new WeatherFreshness(observedAtUtc, observedAtUtc, expiresAtUtc),
            providerStatus);

    private static HourlyWeatherSlot CreateSlot(
        DateTimeOffset startsAtUtc,
        decimal temperatureCelsius,
        WeatherConditionCategory condition,
        decimal? rainChance,
        decimal? windSpeed) =>
        new(
            startsAtUtc,
            startsAtUtc.AddHours(1),
            temperatureCelsius,
            condition,
            condition.ToString(),
            rainChance,
            windSpeed);
}
