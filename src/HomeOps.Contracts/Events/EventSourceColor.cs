namespace HomeOps.Contracts.Events;

/// <summary>
/// Presentation color metadata for an event source.
/// </summary>
/// <param name="Hex">Optional hex color assigned to the source.</param>
public sealed record EventSourceColor(string? Hex);
