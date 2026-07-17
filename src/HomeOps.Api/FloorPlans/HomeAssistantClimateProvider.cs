using System.Globalization;
using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using HomeOps.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace HomeOps.Api.FloorPlans;

public sealed record HomeAssistantClimateOptions(string? AccessToken, TimeSpan Timeout, bool AllowHttp);

public sealed class HomeAssistantClimateProvider(
    HomeOpsDbContext db,
    IHttpClientFactory httpClientFactory,
    TimeProvider clock) : IRoomHeatingControlProvider
{
    private const int MaxBody = 64 * 1024;

    public async Task<HomeAssistantEntityValidationResult> ValidateMappingAsync(Guid mappingId, CancellationToken ct)
    {
        var mapping = await LoadMapping(mappingId, ct);
        if (mapping is null) return new(false, MappingHealth.Missing, "MappingMissing", "Mapping was not found.");
        if (mapping.Provider?.ProviderType != ProviderType.HomeAssistant) return new(false, MappingHealth.NeedsReview, "WrongProviderType", "Mapping is not assigned to Home Assistant.");
        var state = await GetState(mapping.Provider, mapping.ExternalSourceId, ct);
        if (!state.Success) return ValidationFailure(state);
        var entity = state.Entity!;
        return ValidateRole(mapping.SourceRole, entity);
    }

    public async Task<HomeAssistantRefreshResult> RefreshProviderAsync(Guid providerId, CancellationToken ct)
    {
        var provider = await db.ClimateProviders.FirstOrDefaultAsync(p => p.Id == providerId, ct);
        if (provider is null || provider.ProviderType != ProviderType.HomeAssistant) return new(0, 0, 0);
        var mappings = await db.RoomClimateSourceMappings.Include(m => m.Room).Where(m => m.ProviderId == providerId && m.IsEnabled && !m.IsArchived && m.Room != null && m.Room.IsEnabled && !m.Room.IsArchived).OrderBy(m => m.RoomId).ToListAsync(ct);
        var ok = 0; var failed = 0;
        foreach (var group in mappings.GroupBy(m => m.RoomId))
        {
            try
            {
                var result = await RefreshRoomAsync(group.Key, providerId, ct);
                ok += result.SubmittedCount;
                failed += result.FailedCount;
            }
            catch (OperationCanceledException) { throw; }
            catch { failed++; }
        }
        return new(mappings.Count, ok, failed);
    }

    public async Task<HomeAssistantRefreshResult> RefreshRoomAsync(Guid roomId, Guid providerId, CancellationToken ct)
    {
        var provider = await db.ClimateProviders.FirstOrDefaultAsync(p => p.Id == providerId, ct);
        if (provider is null || provider.ProviderType != ProviderType.HomeAssistant || !provider.IsEnabled || provider.IsArchived) return new(0, 0, 1);
        var mappings = await db.RoomClimateSourceMappings.Include(m => m.Room).Where(m => m.RoomId == roomId && m.ProviderId == providerId && m.IsEnabled && !m.IsArchived).ToListAsync(ct);
        var submitted = 0; var failed = 0;
        foreach (var mapping in mappings)
        {
            var state = await GetState(provider, mapping.ExternalSourceId, ct);
            if (!state.Success)
            {
                await Mark(mapping, StateToHealth(state), state.Code, state.SafeMessage, ct); failed++; continue;
            }
            var validation = ValidateRole(mapping.SourceRole, state.Entity!);
            if (!validation.IsValid)
            {
                await Mark(mapping, validation.Health, validation.Code, validation.Message, ct); failed++; continue;
            }
            var obs = Observation(mapping, state.Entity!, clock.GetUtcNow());
            if (obs is null) { await Mark(mapping, MappingHealth.NeedsReview, "NoObservation", "Entity does not contain a supported climate value.", ct); failed++; continue; }
            var service = new RoomClimateReadModelService(db, clock);
            var result = await service.Submit(mapping.RoomId, obs, ct);
            if (result.ok) { mapping.Health = MappingHealth.Healthy; mapping.LastCheckedUtc = clock.GetUtcNow(); mapping.LastSuccessfulUtc = clock.GetUtcNow(); mapping.DiagnosticSummary = null; submitted++; }
            else { await Mark(mapping, MappingHealth.NeedsReview, "ObservationRejected", result.message ?? "Observation was rejected.", ct); failed++; }
        }
        await db.SaveChangesAsync(ct);
        return new(mappings.Count, submitted, failed);
    }

    public async Task<RoomHeatingControlProviderCapability> GetCapabilityAsync(RoomHeatingProviderContext context, CancellationToken cancellationToken)
    {
        var mapping = await LoadMapping(context.SourceMappingId, cancellationToken);
        if (mapping?.Provider?.ProviderType != ProviderType.HomeAssistant) return new(false, BlockerCode: "ProviderUnavailable", BlockerMessage: "Home Assistant provider is not configured.", SupportsScheduleResume: false);
        var state = await GetState(mapping.Provider, mapping.ExternalSourceId, cancellationToken);
        if (!state.Success) return new(false, BlockerCode: state.Code, BlockerMessage: state.SafeMessage, SupportsScheduleResume: false);
        var entity = state.Entity!;
        var min = AttrDecimal(entity, "min_temp"); var max = AttrDecimal(entity, "max_temp"); var step = AttrDecimal(entity, "target_temp_step") ?? 0.5m;
        var supportsTarget = entity.EntityId.StartsWith("climate.", StringComparison.OrdinalIgnoreCase) && min is not null && max is not null && step > 0;
        var supportsResume = ValidResume(mapping.Provider.DiagnosticMetadata);
        return new(supportsTarget && entity.Available, SupportsTemporaryCooler: supportsTarget && entity.Available, MinimumTargetTemperatureCelsius: min, MaximumTargetTemperatureCelsius: max, BlockerCode: supportsTarget ? null : "InvalidControlEntity", BlockerMessage: supportsTarget ? null : "Control entity does not expose bounded target temperature attributes.", SupportsScheduleResume: supportsResume);
    }

    public async Task<RoomHeatingProviderResult> SubmitTemporaryTargetAsync(RoomHeatingProviderContext context, CancellationToken cancellationToken)
    {
        if (context.RequestedTargetTemperatureCelsius is null) return new(RoomHeatingProviderOutcome.Rejected, FailureCode: "MissingTarget", FailureMessage: "Target temperature is required.");
        var mapping = await LoadMapping(context.SourceMappingId, cancellationToken);
        if (mapping?.Provider?.ProviderType != ProviderType.HomeAssistant) return Unavailable("ProviderUnavailable", "Home Assistant provider is not configured.");
        var call = await CallService(mapping.Provider, "climate", "set_temperature", new { entity_id = mapping.ExternalSourceId, temperature = context.RequestedTargetTemperatureCelsius.Value }, cancellationToken);
        return call.Success ? new(RoomHeatingProviderOutcome.Accepted, $"ha:{context.CommandId:N}") : new(call.Unavailable ? RoomHeatingProviderOutcome.Unavailable : RoomHeatingProviderOutcome.Rejected, FailureCode: call.Code, FailureMessage: call.SafeMessage);
    }

    public async Task<RoomHeatingProviderResult> ResumeScheduleAsync(RoomHeatingProviderContext context, CancellationToken cancellationToken)
    {
        var mapping = await LoadMapping(context.SourceMappingId, cancellationToken);
        if (mapping?.Provider?.ProviderType != ProviderType.HomeAssistant) return Unavailable("ProviderUnavailable", "Home Assistant provider is not configured.");
        var strategy = ParseResume(mapping.Provider.DiagnosticMetadata);
        if (strategy is null) return new(RoomHeatingProviderOutcome.Rejected, FailureCode: "ResumeUnsupported", FailureMessage: "No safe resume strategy is configured.");
        var payload = strategy.Value.preset is null ? new Dictionary<string, object?> { ["entity_id"] = string.IsNullOrWhiteSpace(strategy.Value.entityId) ? mapping.ExternalSourceId : strategy.Value.entityId } : new Dictionary<string, object?> { ["entity_id"] = string.IsNullOrWhiteSpace(strategy.Value.entityId) ? mapping.ExternalSourceId : strategy.Value.entityId, ["preset_mode"] = strategy.Value.preset };
        var call = await CallService(mapping.Provider, strategy.Value.domain, strategy.Value.service, payload, cancellationToken);
        return call.Success ? new(RoomHeatingProviderOutcome.Accepted, $"ha-resume:{context.CommandId:N}") : new(call.Unavailable ? RoomHeatingProviderOutcome.Unavailable : RoomHeatingProviderOutcome.Rejected, FailureCode: call.Code, FailureMessage: call.SafeMessage);
    }

    private async Task<RoomClimateSourceMapping?> LoadMapping(Guid id, CancellationToken ct) => await db.RoomClimateSourceMappings.Include(m => m.Provider).FirstOrDefaultAsync(m => m.Id == id, ct);
    private static RoomHeatingProviderResult Unavailable(string c, string m) => new(RoomHeatingProviderOutcome.Unavailable, FailureCode: c, FailureMessage: m);

    private async Task<HaResult> GetState(ClimateProvider provider, string entityId, CancellationToken ct)
    {
        var client = Client(provider, out var error);
        if (error is not null) return HaResult.Fail(error.Value.code, error.Value.message, error.Value.unavailable);
        try
        {
            using var res = await client.GetAsync(new Uri(BaseUri(provider), $"api/states/{Uri.EscapeDataString(entityId)}"), ct);
            var body = await ReadBounded(res, ct);
            if (res.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden) return HaResult.Fail("AuthenticationFailed", "Home Assistant authentication failed.", true);
            if (res.StatusCode == HttpStatusCode.NotFound) return HaResult.Fail("EntityMissing", "Home Assistant entity was not found.", true);
            if (!res.IsSuccessStatusCode) return HaResult.Fail("ProviderUnavailable", "Home Assistant returned an unavailable status.", true);
            var entity = JsonSerializer.Deserialize<HaEntity>(body, JsonOpts);
            return entity is null || string.IsNullOrWhiteSpace(entity.EntityId) ? HaResult.Fail("MalformedResponse", "Home Assistant returned malformed entity state.", true) : HaResult.Ok(entity);
        }
        catch (OperationCanceledException) { throw; }
        catch { return HaResult.Fail("ProviderUnreachable", "Home Assistant could not be reached.", true); }
    }

    private async Task<HaCallResult> CallService(ClimateProvider provider, string domain, string service, object payload, CancellationToken ct)
    {
        var client = Client(provider, out var error); if (error is not null) return new(false, error.Value.code, error.Value.message, error.Value.unavailable);
        try
        {
            using var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            using var res = await client.PostAsync(new Uri(BaseUri(provider), $"api/services/{domain}/{service}"), content, ct);
            _ = await ReadBounded(res, ct);
            if (res.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden) return new(false, "AuthenticationFailed", "Home Assistant authentication failed.", true);
            return res.IsSuccessStatusCode ? new(true, null, null, false) : new(false, "ServiceRejected", "Home Assistant rejected the service request.", false);
        }
        catch (OperationCanceledException) { throw; }
        catch { return new(false, "ProviderUnreachable", "Home Assistant could not be reached.", true); }
    }

    private HttpClient Client(ClimateProvider provider, out (string code, string message, bool unavailable)? error)
    {
        error = null;
        if (!Uri.TryCreate(provider.ExternalInstanceReference, UriKind.Absolute, out var uri) || (uri.Scheme != Uri.UriSchemeHttps && uri.Scheme != Uri.UriSchemeHttp) || !string.IsNullOrEmpty(uri.UserInfo)) { error = ("InvalidConfiguration", "Home Assistant base URL is invalid.", true); return null!; }
        var token = Environment.GetEnvironmentVariable("HOMEASSISTANT__ACCESSTOKEN") ?? Environment.GetEnvironmentVariable("HomeAssistant__AccessToken");
        if (string.IsNullOrWhiteSpace(token)) { error = ("MissingCredential", "Home Assistant access token is not configured.", true); return null!; }
        var client = httpClientFactory.CreateClient("HomeAssistantClimate");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    private static async Task<string> ReadBounded(HttpResponseMessage res, CancellationToken ct)
    {
        await using var s = await res.Content.ReadAsStreamAsync(ct); using var ms = new MemoryStream(); var buffer = new byte[8192]; int read; var total = 0;
        while ((read = await s.ReadAsync(buffer.AsMemory(0, buffer.Length), ct)) > 0) { total += read; if (total > MaxBody) throw new InvalidOperationException("Home Assistant response was too large."); ms.Write(buffer, 0, read); }
        return Encoding.UTF8.GetString(ms.ToArray());
    }

    private static Uri BaseUri(ClimateProvider provider)
    {
        if (!Uri.TryCreate(provider.ExternalInstanceReference, UriKind.Absolute, out var uri)) throw new InvalidOperationException("Invalid Home Assistant base URL.");
        return new Uri(uri.GetLeftPart(UriPartial.Authority).TrimEnd('/') + "/");
    }

    private static HomeAssistantEntityValidationResult ValidateRole(ClimateSourceRole role, HaEntity e)
    {
        if (!e.Available) return new(false, MappingHealth.Unavailable, "EntityUnavailable", "Home Assistant entity is unavailable.");
        var domain = e.EntityId.Split('.', 2)[0];
        return role switch
        {
            ClimateSourceRole.ComfortTemperature => (domain == "sensor" || domain == "climate") && Temperature(e) is not null ? Valid(e) : Invalid("RoleMismatch", "Temperature mapping requires a readable temperature sensor or climate current temperature."),
            ClimateSourceRole.Humidity => domain == "sensor" && Humidity(e) is not null ? Valid(e) : Invalid("RoleMismatch", "Humidity mapping requires a readable humidity sensor."),
            ClimateSourceRole.HeatingTargetTemperature or ClimateSourceRole.HeatingControlTemperature => domain == "climate" && Target(e) is not null ? Valid(e) : Invalid("MissingAttribute", "Climate entity must expose target temperature."),
            ClimateSourceRole.HeatingStatus => domain == "climate" ? Valid(e) : Invalid("RoleMismatch", "Heating status requires a climate entity."),
            ClimateSourceRole.HeatingControl => domain == "climate" && AttrDecimal(e, "min_temp") is { } min && AttrDecimal(e, "max_temp") is { } max && min < max && (AttrDecimal(e, "target_temp_step") ?? 0.5m) > 0 ? Valid(e) : Invalid("MissingAttribute", "Heating control requires valid bounded climate target attributes."),
            _ => Invalid("UnsupportedRole", "Mapping role is unsupported.")
        };
    }
    private static HomeAssistantEntityValidationResult Valid(HaEntity e) => new(true, MappingHealth.Healthy, "Healthy", "Entity is valid.", e.Attributes.FriendlyName);
    private static HomeAssistantEntityValidationResult Invalid(string c, string m) => new(false, MappingHealth.NeedsReview, c, m);
    private static HomeAssistantEntityValidationResult ValidationFailure(HaResult r) => new(false, StateToHealth(r), r.Code, r.SafeMessage);
    private static MappingHealth StateToHealth(HaResult r) => r.Code switch { "EntityMissing" => MappingHealth.Missing, "EntityUnavailable" or "ProviderUnavailable" or "ProviderUnreachable" or "AuthenticationFailed" => MappingHealth.Unavailable, _ => MappingHealth.NeedsReview };

    private SubmitRoomClimateObservationRequest? Observation(RoomClimateSourceMapping m, HaEntity e, DateTimeOffset now)
    {
        var temp = m.SourceRole is ClimateSourceRole.ComfortTemperature ? Temperature(e) : null;
        var humidity = m.SourceRole is ClimateSourceRole.Humidity ? Humidity(e) : null;
        var target = m.SourceRole is ClimateSourceRole.HeatingTargetTemperature or ClimateSourceRole.HeatingControlTemperature or ClimateSourceRole.HeatingControl ? Target(e) : null;
        var state = m.SourceRole is ClimateSourceRole.HeatingStatus or ClimateSourceRole.HeatingControl ? Operating(e) : RoomClimateOperatingState.Unknown;
        if (temp is null && humidity is null && target is null && state == RoomClimateOperatingState.Unknown) return null;
        return new(m.Id, now, now, temp, humidity, target, state, e.Available, e.EntityId, $"Home Assistant {e.State}");
    }

    private static decimal? Temperature(HaEntity e) { var unit = AttrString(e, "unit_of_measurement") ?? AttrString(e, "temperature_unit"); var isClimate = e.EntityId.StartsWith("climate.", StringComparison.OrdinalIgnoreCase); var v = Decimal(e.State) ?? (isClimate ? AttrDecimal(e, "current_temperature") : null); if (v is null) return null; if (unit is "°C" or "C" or "celsius") return v; if (unit is "°F" or "F" or "fahrenheit") return decimal.Round((v.Value - 32m) * 5m / 9m, 2); return null; }
    private static decimal? Humidity(HaEntity e) { var unit = AttrString(e, "unit_of_measurement"); var v = Decimal(e.State); return unit is "%" && v is >= 0 and <= 100 ? v : null; }
    private static decimal? Target(HaEntity e) => AttrDecimal(e, "temperature") ?? AttrDecimal(e, "target_temp");
    private static RoomClimateOperatingState Operating(HaEntity e) => (AttrString(e, "hvac_action") ?? e.State).ToLowerInvariant() switch { "heating" => RoomClimateOperatingState.Heating, "cooling" => RoomClimateOperatingState.Cooling, "idle" or "off" => RoomClimateOperatingState.Idle, "unavailable" or "unknown" => RoomClimateOperatingState.Unavailable, _ => RoomClimateOperatingState.Unknown };
    private static decimal? AttrDecimal(HaEntity e, string name) => e.Attributes.Values.TryGetValue(name, out var v) ? Decimal(v.ToString()) : null;
    private static string? AttrString(HaEntity e, string name) => e.Attributes.Values.TryGetValue(name, out var v) ? v.ToString() : null;
    private static decimal? Decimal(string? s) => decimal.TryParse(s, NumberStyles.Number, CultureInfo.InvariantCulture, out var d) ? d : null;

    private async Task Mark(RoomClimateSourceMapping m, MappingHealth h, string code, string message, CancellationToken ct) { m.Health = h; m.LastCheckedUtc = clock.GetUtcNow(); m.DiagnosticSummary = $"{code}: {message}"[..Math.Min(500, $"{code}: {message}".Length)]; m.UpdatedUtc = clock.GetUtcNow(); await db.SaveChangesAsync(ct); }
    private static bool ValidResume(string? metadata) => ParseResume(metadata) is not null;
    private static (string domain, string service, string? entityId, string? preset)? ParseResume(string? metadata)
    {
        if (string.IsNullOrWhiteSpace(metadata)) return null;
        if (!metadata.StartsWith("ha-resume:", StringComparison.OrdinalIgnoreCase)) return null;
        var parts = metadata[10..].Split(':', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length < 2) return null;
        var key = parts[0] + "." + parts[1];
        if (key.Equals("script.turn_on", StringComparison.OrdinalIgnoreCase)) return parts.Length > 2 ? (parts[0], parts[1], parts[2], null) : null;
        if (key.Equals("climate.set_preset_mode", StringComparison.OrdinalIgnoreCase)) return parts.Length > 2 ? (parts[0], parts[1], parts.Length > 3 ? parts[3] : null, parts[2]) : null;
        return null;
    }

    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };
    private sealed record HaResult(bool Success, HaEntity? Entity, string Code, string SafeMessage, bool Unavailable) { public static HaResult Ok(HaEntity e) => new(true, e, "Healthy", "Healthy", false); public static HaResult Fail(string c, string m, bool u) => new(false, null, c, m, u); }
    private sealed record HaCallResult(bool Success, string? Code, string? SafeMessage, bool Unavailable);
    private sealed record HaEntity([property: System.Text.Json.Serialization.JsonPropertyName("entity_id")] string EntityId, string State, HaAttributes Attributes) { public bool Available => State is not ("unavailable" or "unknown"); }
    private sealed record HaAttributes
    {
        [System.Text.Json.Serialization.JsonExtensionData] public Dictionary<string, JsonElement> Values { get; init; } = [];
        public string? FriendlyName => Values.TryGetValue("friendly_name", out var v) ? v.ToString() : null;
    }
}

public sealed record HomeAssistantEntityValidationResult(bool IsValid, MappingHealth Health, string Code, string Message, string? DisplayName = null);
public sealed record HomeAssistantRefreshResult(int MappingCount, int SubmittedCount, int FailedCount);
