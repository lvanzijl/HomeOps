using System.ComponentModel.DataAnnotations;

namespace HomeOps.Api.FloorPlans;

public sealed class HomeAssistantClimateRefreshOptions
{
    public bool Enabled { get; set; } = true;

    [Range(10, 86400)]
    public int IntervalSeconds { get; set; } = 300;

    [Range(1, 16)]
    public int MaximumProviderConcurrency { get; set; } = 4;

    [Range(1, 120)]
    public int ProviderRequestTimeoutSeconds { get; set; } = 10;

    public TimeSpan Interval => TimeSpan.FromSeconds(IntervalSeconds);
}
