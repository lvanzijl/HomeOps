namespace HomeOps.Contracts.Events;

/// <summary>
/// Provider-safe source error summary. Detailed diagnostics and secrets are not exposed here.
/// </summary>
public sealed record EventSourceLastError(string? Code, string? Message);
