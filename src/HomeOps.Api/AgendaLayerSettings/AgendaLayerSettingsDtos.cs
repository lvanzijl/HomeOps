namespace HomeOps.Api.AgendaLayerSettings;

public sealed record AgendaLayerSettingsDto(
    IReadOnlyDictionary<string, bool> Week,
    IReadOnlyDictionary<string, bool> Months);

public sealed record SaveAgendaLayerSettingsRequest(
    IReadOnlyDictionary<string, bool> Week,
    IReadOnlyDictionary<string, bool> Months);
