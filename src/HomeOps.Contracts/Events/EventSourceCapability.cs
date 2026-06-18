namespace HomeOps.Contracts.Events;

/// <summary>
/// Describes whether an event source can be modified by HomeOps.
/// </summary>
public enum EventSourceCapability
{
    ReadOnly = 0,
    Writable = 1
}
