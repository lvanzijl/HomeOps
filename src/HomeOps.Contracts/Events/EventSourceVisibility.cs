namespace HomeOps.Contracts.Events;

/// <summary>
/// Presentation visibility metadata for an event source.
/// </summary>
/// <param name="VisibleByDefault">Whether events from the source are visible by default.</param>
/// <param name="GroupName">Optional grouping label for future clients.</param>
public sealed record EventSourceVisibility(bool VisibleByDefault, string? GroupName = null);
