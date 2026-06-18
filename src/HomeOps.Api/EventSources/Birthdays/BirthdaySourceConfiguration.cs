namespace HomeOps.Api.EventSources.Birthdays;

public sealed record BirthdaySourceConfiguration(
    string SourceId,
    string DisplayName,
    bool Enabled,
    DateOnly GenerationAnchorDate,
    int HorizonMonths,
    string? ColorHex = null);
