namespace HomeOps.Contracts.Events;

/// <summary>
/// Fixed background synchronization cadence choices exposed by Calendar Sources.
/// </summary>
public enum EventSourcePollInterval
{
    EveryHour = 0,
    Every8Hours = 1,
    EveryDay = 2
}
