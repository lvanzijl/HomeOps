using HomeOps.Api.Weather;

namespace HomeOps.Api.Weather.Projections;

public sealed record DepartureAdviceProjection(
    string Summary,
    WeatherSeverity Severity,
    DepartureAdviceConfidence Confidence,
    IReadOnlyList<DepartureAdviceCategory> Categories,
    bool BringRainProtection,
    bool DressWarmly,
    bool ExpectSlipperyConditions,
    bool AllowExtraTravelTime);
