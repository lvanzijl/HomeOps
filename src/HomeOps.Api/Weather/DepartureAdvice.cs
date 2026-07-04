namespace HomeOps.Api.Weather;

public sealed record DepartureAdvice(
    string Summary,
    WeatherSeverity Severity,
    DepartureAdviceConfidence Confidence,
    IReadOnlyList<DepartureAdviceCategory> Categories,
    bool BringRainProtection,
    bool DressWarmly,
    bool ExpectSlipperyConditions,
    bool AllowExtraTravelTime);
