using HomeOps.Api.Weather;

namespace HomeOps.Api.Households;

public sealed class Household
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string TimeZoneId { get; set; } = HouseholdTimeZone.DefaultTimeZoneId;
    public string? WeatherLocationDisplayName { get; set; }
    public decimal? WeatherLatitude { get; set; }
    public decimal? WeatherLongitude { get; set; }
    public WeatherUnitSystem WeatherUnitSystem { get; set; } = WeatherUnitSystem.Metric;
    public bool OnboardingCompleted { get; set; }
    public DateTimeOffset? SetupChecklistDismissedUtc { get; set; }
    public bool LegacyDemoDataReviewRequired { get; set; }
    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset UpdatedUtc { get; set; }
}
