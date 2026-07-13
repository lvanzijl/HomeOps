using HomeOps.Api.Households;

namespace HomeOps.Api.FloorPlans;

public sealed class RoomClimateSourceMapping
{
    public Guid Id { get; set; }
    public Guid HouseholdId { get; set; }
    public Household? Household { get; set; }
    public Guid RoomId { get; set; }
    public Room? Room { get; set; }
    public Guid ProviderId { get; set; }
    public ClimateProvider? Provider { get; set; }
    public ClimateSourceRole SourceRole { get; set; }
    public string ExternalSourceId { get; set; } = string.Empty;
    public string? ExternalDisplayName { get; set; }
    public string? ExternalSourceKind { get; set; }
    public string? ExternalAreaId { get; set; }
    public string? ExternalAreaName { get; set; }
    public string? ExternalDeviceId { get; set; }
    public string? ExternalDeviceName { get; set; }
    public int Priority { get; set; }
    public bool IsEnabled { get; set; } = true;
    public bool IsArchived { get; set; }
    public DateTimeOffset? ArchivedUtc { get; set; }
    public MappingHealth Health { get; set; } = MappingHealth.Unverified;
    public DateTimeOffset? LastCheckedUtc { get; set; }
    public DateTimeOffset? LastSuccessfulUtc { get; set; }
    public string? DiagnosticSummary { get; set; }
    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset UpdatedUtc { get; set; }
}

public enum MappingHealth
{
    Unverified,
    Healthy,
    Degraded,
    Unavailable,
    Missing,
    NeedsReview
}
