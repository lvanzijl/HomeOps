using HomeOps.Api.Households;

namespace HomeOps.Api.CalendarEvents;

public sealed class EventSource
{
    public Guid Id { get; set; }
    public Guid HouseholdId { get; set; }
    public Household? Household { get; set; }
    public string Name { get; set; } = string.Empty;
    public string SourceType { get; set; } = string.Empty;
    public string Icon { get; set; } = "📅";
    public bool IsEnabled { get; set; } = true;
    public bool IsWritable { get; set; }
    public bool IsSystem { get; set; }
    public EventSourceHealthStatus HealthStatus { get; set; } = EventSourceHealthStatus.Healthy;
    public EventSourcePollInterval PollInterval { get; set; } = EventSourcePollInterval.Every8Hours;
    public DateTimeOffset? LastSyncAttemptUtc { get; set; }
    public DateTimeOffset? LastSuccessfulSyncUtc { get; set; }
    public DateTimeOffset? LastFailedSyncUtc { get; set; }
    public DateTimeOffset? NextSyncAfterUtc { get; set; }
    public string? LastErrorCode { get; set; }
    public string? LastErrorMessage { get; set; }
    public string? LastErrorDetail { get; set; }
    public string? ProviderSourceId { get; set; }
    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset UpdatedUtc { get; set; }
    public ICollection<EventSeries> EventSeries { get; set; } = new System.Collections.Generic.List<EventSeries>();
    public EventSourceConfiguration? Configuration { get; set; }

    public bool IsSystemManualSource => IsSystem && string.Equals(SourceType, EventSourceTypes.Manual, StringComparison.Ordinal);
}
