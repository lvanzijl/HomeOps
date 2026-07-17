namespace HomeOps.Api.FloorPlans;

public enum HomeAssistantResumeStrategyType
{
    None,
    Script,
    ClimatePreset
}

public sealed record HomeAssistantResumeStrategyConfigurationDto(
    Guid ProviderId,
    HomeAssistantResumeStrategyType StrategyType,
    string? ScriptEntityReference,
    string? ClimateEntityReference,
    string? PresetValue,
    bool IsValid,
    IReadOnlyCollection<string> Blockers,
    DateTimeOffset? UpdatedUtc,
    bool SupportsResumeSchedule);

public sealed record UpdateHomeAssistantResumeStrategyRequest(
    HomeAssistantResumeStrategyType StrategyType,
    string? ScriptEntityReference = null,
    string? ClimateEntityReference = null,
    string? PresetValue = null);

public static class HomeAssistantResumeStrategyValidation
{
    public const int MaxPresetLength = 80;

    public static (bool Valid, string? Script, string? Climate, string? Preset, IReadOnlyCollection<string> Blockers) Validate(UpdateHomeAssistantResumeStrategyRequest request)
    {
        var blockers = new List<string>();
        var script = Clean(request.ScriptEntityReference);
        var climate = Clean(request.ClimateEntityReference);
        var preset = Clean(request.PresetValue);

        switch (request.StrategyType)
        {
            case HomeAssistantResumeStrategyType.None:
                return (true, null, null, null, []);
            case HomeAssistantResumeStrategyType.Script:
                if (!IsEntity(script, "script")) blockers.Add("Kies een geldige Home Assistant-scriptreferentie, bijvoorbeeld script.schema_hervatten.");
                return (blockers.Count == 0, script, null, null, blockers);
            case HomeAssistantResumeStrategyType.ClimatePreset:
                if (!IsEntity(climate, "climate")) blockers.Add("Kies een geldige Home Assistant-klimaatreferentie, bijvoorbeeld climate.woonkamer.");
                if (string.IsNullOrWhiteSpace(preset)) blockers.Add("Vul een presetwaarde in.");
                else if (preset.Length > MaxPresetLength || preset.Any(char.IsControl)) blockers.Add("De presetwaarde is te lang of bevat ongeldige tekens.");
                return (blockers.Count == 0, null, climate, preset, blockers);
            default:
                return (false, null, null, null, ["Deze hervatmethode wordt niet ondersteund."]);
        }
    }

    public static HomeAssistantResumeStrategyConfigurationDto ToDto(ClimateProvider provider)
    {
        var request = new UpdateHomeAssistantResumeStrategyRequest(provider.HomeAssistantResumeStrategyType, provider.HomeAssistantResumeScriptEntityReference, provider.HomeAssistantResumeClimateEntityReference, provider.HomeAssistantResumePresetValue);
        var validation = Validate(request);
        var valid = provider.HomeAssistantResumeStrategyType == HomeAssistantResumeStrategyType.None || validation.Valid;
        return new(provider.Id, provider.HomeAssistantResumeStrategyType, provider.HomeAssistantResumeScriptEntityReference, provider.HomeAssistantResumeClimateEntityReference, provider.HomeAssistantResumePresetValue, valid, validation.Blockers, provider.HomeAssistantResumeStrategyUpdatedUtc, valid && provider.HomeAssistantResumeStrategyType != HomeAssistantResumeStrategyType.None);
    }

    public static void Apply(ClimateProvider provider, UpdateHomeAssistantResumeStrategyRequest request, DateTimeOffset now)
    {
        var validation = Validate(request);
        if (!validation.Valid) throw new InvalidOperationException(string.Join(" ", validation.Blockers));
        provider.HomeAssistantResumeStrategyType = request.StrategyType;
        provider.HomeAssistantResumeScriptEntityReference = validation.Script;
        provider.HomeAssistantResumeClimateEntityReference = validation.Climate;
        provider.HomeAssistantResumePresetValue = validation.Preset;
        provider.HomeAssistantResumeStrategyUpdatedUtc = now;
        provider.UpdatedUtc = now;
    }

    public static bool TryLegacy(string? metadata, out UpdateHomeAssistantResumeStrategyRequest request)
    {
        request = new(HomeAssistantResumeStrategyType.None);
        if (string.IsNullOrWhiteSpace(metadata) || !metadata.StartsWith("ha-resume:", StringComparison.OrdinalIgnoreCase)) return false;
        var parts = metadata[10..].Split(':', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (parts.Length < 2) return true;
        var service = parts[0] + "." + parts[1];
        if (service.Equals("script.turn_on", StringComparison.OrdinalIgnoreCase) && parts.Length == 3)
        {
            request = new(HomeAssistantResumeStrategyType.Script, ScriptEntityReference: parts[2]); return true;
        }
        if (service.Equals("climate.set_preset_mode", StringComparison.OrdinalIgnoreCase) && parts.Length == 4)
        {
            request = new(HomeAssistantResumeStrategyType.ClimatePreset, ClimateEntityReference: parts[3], PresetValue: parts[2]); return true;
        }
        return true;
    }

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    private static bool IsEntity(string? value, string domain)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Length > 240 || value.Any(char.IsWhiteSpace) || value.Any(char.IsControl)) return false;
        var prefix = domain + ".";
        if (!value.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)) return false;
        return value[prefix.Length..].All(ch => char.IsAsciiLetterOrDigit(ch) || ch == '_');
    }
}
