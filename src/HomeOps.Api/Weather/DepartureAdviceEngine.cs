namespace HomeOps.Api.Weather;

public sealed class DepartureAdviceEngine
{
    private const decimal ColdFeelsLikeCelsius = 6m;
    private const decimal LightJacketFeelsLikeCelsius = 16m;
    private const decimal WarmDayCelsius = 25m;
    private const decimal RainChancePercent = 50m;
    private const decimal HeavyRainChancePercent = 75m;
    private const decimal WindyKph = 35m;
    private const decimal StrongWindKph = 50m;
    private const decimal SunProtectionUvIndex = 6m;

    public DepartureAdvice CreateAdvice(
        FamilyBoardWeatherSnapshot snapshot,
        DateTimeOffset nowUtc,
        DateTimeOffset? departureTimeUtc = null)
    {
        if (snapshot.ProviderStatus == WeatherProviderStatus.Unavailable)
        {
            return CreateUnavailableAdvice();
        }

        var departureUtc = departureTimeUtc ?? nowUtc;
        var relevantSlots = GetRelevantHourlySlots(snapshot, departureUtc).ToArray();
        var categories = new List<DepartureAdviceCategory>();
        var reasons = new List<string>();

        var confidence = DetermineConfidence(snapshot, nowUtc, relevantSlots);
        var isFresh = snapshot.Freshness.IsFreshAt(nowUtc);
        var feelsLike = snapshot.Current.FeelsLikeTemperatureCelsius;
        var highestRainChance = HighestRainChance(snapshot, relevantSlots);
        var strongestWind = StrongestWind(snapshot, relevantSlots);
        var highestUv = HighestUv(snapshot, relevantSlots);
        var hasRain = HasRain(snapshot.Current.Condition) || relevantSlots.Any(slot => HasRain(slot.Condition)) || highestRainChance >= RainChancePercent;
        var hasHeavyRain = HasHeavyRain(snapshot.Current.Condition) || relevantSlots.Any(slot => HasHeavyRain(slot.Condition)) || highestRainChance >= HeavyRainChancePercent;
        var hasSnowOrIce = snapshot.Current.Condition == WeatherConditionCategory.Snow || relevantSlots.Any(slot => slot.Condition == WeatherConditionCategory.Snow);

        if (hasHeavyRain || snapshot.Current.Condition == WeatherConditionCategory.Thunderstorm || relevantSlots.Any(slot => slot.Condition == WeatherConditionCategory.Thunderstorm))
        {
            AddCategory(categories, DepartureAdviceCategory.RainProtection);
            AddCategory(categories, DepartureAdviceCategory.ExtraTravelTime);
            reasons.Add("neem regenkleding mee");
        }
        else if (hasRain)
        {
            AddCategory(categories, DepartureAdviceCategory.RainProtection);
            reasons.Add("kans op regen");
        }

        if (hasSnowOrIce)
        {
            AddCategory(categories, DepartureAdviceCategory.Slippery);
            AddCategory(categories, DepartureAdviceCategory.ExtraTravelTime);
            reasons.Add("houd rekening met gladheid");
        }

        if (strongestWind >= StrongWindKph)
        {
            AddCategory(categories, DepartureAdviceCategory.Windy);
            AddCategory(categories, DepartureAdviceCategory.ExtraTravelTime);
            reasons.Add("veel wind onderweg");
        }
        else if (strongestWind >= WindyKph)
        {
            AddCategory(categories, DepartureAdviceCategory.Windy);
            reasons.Add("wind merkbaar aanwezig");
        }

        if (feelsLike <= ColdFeelsLikeCelsius)
        {
            AddCategory(categories, DepartureAdviceCategory.WarmJacket);
            reasons.Add("warme jas aan");
        }
        else if (feelsLike <= LightJacketFeelsLikeCelsius || HasLargeTemperatureSwing(snapshot))
        {
            AddCategory(categories, DepartureAdviceCategory.LightJacket);
            reasons.Add("dunne jas aanbevolen");
        }
        else if (!hasRain && strongestWind < WindyKph)
        {
            AddCategory(categories, DepartureAdviceCategory.NoJacketNeeded);
            reasons.Add("geen jas nodig");
        }

        if (highestUv >= SunProtectionUvIndex)
        {
            AddCategory(categories, DepartureAdviceCategory.SunProtection);
            reasons.Add("zonnebrand mee");
        }

        if (snapshot.Current.TemperatureCelsius >= WarmDayCelsius || snapshot.DailySummaries.Any(day => day.HighTemperatureCelsius >= WarmDayCelsius))
        {
            AddCategory(categories, DepartureAdviceCategory.FillDrinkBottle);
            reasons.Add("drinkfles vullen");
        }

        if (categories.Count == 0)
        {
            AddCategory(categories, DepartureAdviceCategory.Neutral);
            reasons.Add("geen bijzonder weeradvies");
        }

        var severity = DetermineSeverity(categories, hasHeavyRain, hasSnowOrIce, strongestWind);
        var summary = BuildSummary(reasons, confidence, isFresh, snapshot.ProviderStatus);

        return new DepartureAdvice(
            summary,
            severity,
            confidence,
            categories,
            categories.Contains(DepartureAdviceCategory.RainProtection),
            categories.Contains(DepartureAdviceCategory.LightJacket) || categories.Contains(DepartureAdviceCategory.WarmJacket),
            categories.Contains(DepartureAdviceCategory.Slippery),
            categories.Contains(DepartureAdviceCategory.ExtraTravelTime));
    }

    private static IEnumerable<HourlyWeatherSlot> GetRelevantHourlySlots(FamilyBoardWeatherSnapshot snapshot, DateTimeOffset departureUtc)
    {
        var horizonEndUtc = departureUtc.AddHours(3);
        return snapshot.HourlySlots
            .Where(slot => slot.EndsAtUtc > departureUtc && slot.StartsAtUtc <= horizonEndUtc)
            .OrderBy(slot => slot.StartsAtUtc);
    }

    private static DepartureAdviceConfidence DetermineConfidence(
        FamilyBoardWeatherSnapshot snapshot,
        DateTimeOffset nowUtc,
        IReadOnlyCollection<HourlyWeatherSlot> relevantSlots)
    {
        if (snapshot.ProviderStatus == WeatherProviderStatus.Unavailable)
        {
            return DepartureAdviceConfidence.Low;
        }

        var score = 0;
        if (snapshot.ProviderStatus == WeatherProviderStatus.Available)
        {
            score += 2;
        }

        if (snapshot.Freshness.IsFreshAt(nowUtc))
        {
            score += 2;
        }

        if (snapshot.Current.Condition != WeatherConditionCategory.Unknown)
        {
            score += 1;
        }

        if (snapshot.Current.PrecipitationChancePercent is not null || relevantSlots.Any(slot => slot.PrecipitationChancePercent is not null))
        {
            score += 1;
        }

        if (snapshot.Current.WindSpeedKph is not null || relevantSlots.Any(slot => slot.WindSpeedKph is not null))
        {
            score += 1;
        }

        if (relevantSlots.Count > 0)
        {
            score += 1;
        }

        return score >= 7
            ? DepartureAdviceConfidence.High
            : score >= 4
                ? DepartureAdviceConfidence.Moderate
                : DepartureAdviceConfidence.Low;
    }

    private static decimal HighestRainChance(FamilyBoardWeatherSnapshot snapshot, IEnumerable<HourlyWeatherSlot> relevantSlots)
    {
        var chances = relevantSlots.Select(slot => slot.PrecipitationChancePercent).Append(snapshot.Current.PrecipitationChancePercent);
        return chances.Where(chance => chance.HasValue).Select(chance => chance!.Value).DefaultIfEmpty(0).Max();
    }

    private static decimal StrongestWind(FamilyBoardWeatherSnapshot snapshot, IEnumerable<HourlyWeatherSlot> relevantSlots)
    {
        var speeds = relevantSlots.Select(slot => slot.WindSpeedKph).Append(snapshot.Current.WindSpeedKph);
        return speeds.Where(speed => speed.HasValue).Select(speed => speed!.Value).DefaultIfEmpty(0).Max();
    }

    private static decimal HighestUv(FamilyBoardWeatherSnapshot snapshot, IEnumerable<HourlyWeatherSlot> relevantSlots)
    {
        var values = relevantSlots.Select(slot => slot.UvIndex)
            .Append(snapshot.Current.UvIndex)
            .Concat(snapshot.DailySummaries.Select(day => day.MaxUvIndex));

        return values.Where(value => value.HasValue).Select(value => value!.Value).DefaultIfEmpty(0).Max();
    }

    private static bool HasLargeTemperatureSwing(FamilyBoardWeatherSnapshot snapshot) =>
        snapshot.DailySummaries.Any(day => day.HighTemperatureCelsius - day.LowTemperatureCelsius >= 10m);

    private static bool HasRain(WeatherConditionCategory condition) =>
        condition is WeatherConditionCategory.Rain or WeatherConditionCategory.HeavyRain or WeatherConditionCategory.Thunderstorm;

    private static bool HasHeavyRain(WeatherConditionCategory condition) =>
        condition is WeatherConditionCategory.HeavyRain or WeatherConditionCategory.Thunderstorm;

    private static WeatherSeverity DetermineSeverity(
        IReadOnlyCollection<DepartureAdviceCategory> categories,
        bool hasHeavyRain,
        bool hasSnowOrIce,
        decimal strongestWind)
    {
        if (hasHeavyRain || hasSnowOrIce || strongestWind >= StrongWindKph)
        {
            return WeatherSeverity.High;
        }

        if (categories.Any(category => category is DepartureAdviceCategory.RainProtection or DepartureAdviceCategory.WarmJacket or DepartureAdviceCategory.Windy or DepartureAdviceCategory.SunProtection or DepartureAdviceCategory.FillDrinkBottle))
        {
            return WeatherSeverity.Moderate;
        }

        return WeatherSeverity.Low;
    }

    private static string BuildSummary(
        IReadOnlyList<string> reasons,
        DepartureAdviceConfidence confidence,
        bool isFresh,
        WeatherProviderStatus providerStatus)
    {
        var summary = string.Join(" · ", reasons.Distinct());

        if (confidence == DepartureAdviceConfidence.Low)
        {
            summary += " · advies met lage zekerheid";
        }
        else if (!isFresh || providerStatus == WeatherProviderStatus.Stale)
        {
            summary += " · weerbeeld is mogelijk verouderd";
        }

        return summary;
    }

    private static DepartureAdvice CreateUnavailableAdvice() =>
        new(
            "Geen actueel weeradvies beschikbaar · kies voorzichtig",
            WeatherSeverity.Low,
            DepartureAdviceConfidence.Low,
            new[] { DepartureAdviceCategory.Neutral },
            false,
            false,
            false,
            false);

    private static void AddCategory(ICollection<DepartureAdviceCategory> categories, DepartureAdviceCategory category)
    {
        if (!categories.Contains(category))
        {
            categories.Add(category);
        }
    }
}
