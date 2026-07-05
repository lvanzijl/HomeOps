namespace HomeOps.Contracts.Events;

/// <summary>
/// Source-scoped synchronization/provider health. Disabled state is represented separately by EventSource.Enabled.
/// </summary>
public enum EventSourceHealthStatus
{
    NeverSynced = 0,
    Healthy = 1,
    Failed = 2
}
