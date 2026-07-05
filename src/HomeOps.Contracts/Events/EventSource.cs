namespace HomeOps.Contracts.Events;

/// <summary>
/// Describes a source that can own normalized events.
/// </summary>
/// <param name="Id">Stable HomeOps source identifier.</param>
/// <param name="Name">Human-readable source name.</param>
/// <param name="Type">Source origin family.</param>
/// <param name="Enabled">Whether the source participates in future event views.</param>
/// <param name="Capability">Whether the source is read-only or writable.</param>
/// <param name="Visibility">Presentation visibility metadata for future clients.</param>
/// <param name="Color">Presentation color metadata for future clients.</param>
/// <param name="ProviderSourceId">Optional identifier assigned by an provider.</param>
public sealed record EventSource(
    string Id,
    string Name,
    EventSourceType Type,
    bool Enabled,
    EventSourceCapability Capability,
    EventSourceVisibility Visibility,
    EventSourceColor Color,
    string? ProviderSourceId = null)
{
    public bool IsReadOnly => Capability == EventSourceCapability.ReadOnly;

    public bool IsWritable => Capability == EventSourceCapability.Writable;
}
