using HomeOps.Api.Weather;

namespace HomeOps.Api.Weather.Projections;

public sealed class WeatherProjectionBuilder
{
    public HomeWeatherProjection ToHome(
        FamilyBoardWeatherSnapshot snapshot,
        DepartureAdvice departureAdvice,
        DateTimeOffset nowUtc) =>
        new(
            ToIconKey(snapshot.Current.Condition),
            snapshot.Current.Condition,
            snapshot.Current.TemperatureCelsius,
            ToDepartureAdviceProjection(departureAdvice),
            departureAdvice.Confidence,
            ToFreshnessProjection(snapshot.Freshness, nowUtc),
            snapshot.ProviderStatus,
            snapshot.ProviderStatusMessage);

    public WeatherDetailProjection ToDetail(
        FamilyBoardWeatherSnapshot snapshot,
        DepartureAdvice departureAdvice,
        DateTimeOffset nowUtc) =>
        new(
            ToDepartureAdviceProjection(departureAdvice),
            snapshot.Current.Summary,
            ToCurrentProjection(snapshot.Current),
            snapshot.HourlySlots.Select(ToHourlyProjection).ToArray(),
            snapshot.DailySummaries.Select(ToDailyProjection).ToArray(),
            new WeatherDetailsProjection(
                snapshot.Current.RelativeHumidityPercent,
                snapshot.Current.WindSpeedKph,
                snapshot.Current.PrecipitationChancePercent,
                snapshot.Current.UvIndex,
                snapshot.Freshness.ObservedAtUtc,
                snapshot.Freshness.RefreshedAtUtc),
            ToFreshnessProjection(snapshot.Freshness, nowUtc),
            snapshot.ProviderStatus,
            snapshot.ProviderStatusMessage);

    public AgendaWeatherProjection ToAgenda(FamilyBoardWeatherSnapshot snapshot, DateTimeOffset nowUtc)
    {
        var freshness = ToFreshnessProjection(snapshot.Freshness, nowUtc);
        return new AgendaWeatherProjection(
            snapshot.HourlySlots.Select(slot => new AgendaWeatherSlotProjection(
                slot.StartsAtUtc,
                slot.EndsAtUtc,
                slot.TemperatureCelsius,
                slot.Condition,
                slot.Summary,
                freshness)).ToArray(),
            freshness,
            snapshot.ProviderStatus,
            snapshot.ProviderStatusMessage);
    }

    private static DepartureAdviceProjection ToDepartureAdviceProjection(DepartureAdvice advice) =>
        new(
            advice.Summary,
            advice.Severity,
            advice.Confidence,
            advice.Categories,
            advice.BringRainProtection,
            advice.DressWarmly,
            advice.ExpectSlipperyConditions,
            advice.AllowExtraTravelTime);

    private static CurrentWeatherProjection ToCurrentProjection(CurrentWeather current) =>
        new(
            current.TemperatureCelsius,
            current.FeelsLikeTemperatureCelsius,
            current.Condition,
            current.Summary,
            current.RelativeHumidityPercent,
            current.WindSpeedKph,
            current.PrecipitationChancePercent,
            current.UvIndex);

    private static HourlyWeatherProjection ToHourlyProjection(HourlyWeatherSlot slot) =>
        new(
            slot.StartsAtUtc,
            slot.EndsAtUtc,
            slot.TemperatureCelsius,
            slot.Condition,
            slot.Summary,
            slot.PrecipitationChancePercent,
            slot.WindSpeedKph,
            slot.UvIndex);

    private static DailyWeatherProjection ToDailyProjection(DailyWeatherSummary summary) =>
        new(
            summary.Date,
            summary.LowTemperatureCelsius,
            summary.HighTemperatureCelsius,
            summary.Condition,
            summary.Summary,
            summary.PrecipitationChancePercent,
            summary.WindSpeedKph,
            summary.MaxUvIndex);

    private static WeatherFreshnessProjection ToFreshnessProjection(WeatherFreshness freshness, DateTimeOffset nowUtc) =>
        new(freshness.ObservedAtUtc, freshness.RefreshedAtUtc, freshness.ExpiresAtUtc, freshness.IsFreshAt(nowUtc));

    private static string ToIconKey(WeatherConditionCategory condition) =>
        $"weather-{condition.ToString().ToLowerInvariant()}";
}
