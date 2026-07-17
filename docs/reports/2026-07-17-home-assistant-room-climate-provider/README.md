# Home Assistant Room Climate Provider — Slice 13

## Summary
Implemented the first backend Home Assistant climate adapter slice for configured Room climate mappings and bounded heating commands.

## Implemented
- Added an internal Home Assistant climate adapter that implements the existing provider-independent room heating control provider interface.
- Added mapping validation and provider/Room refresh operations for configured Home Assistant entities.
- Added normalized observation submission through the existing Room Climate Read Model seam.

## Architecture boundary
Provider-specific Home Assistant entity IDs, REST paths, service names, states, and attributes remain inside the adapter. Existing FamilyBoard domain contracts continue to use normalized provider-independent observations, mapping health, capabilities, and command outcomes.

## Connection and credential handling
The V1 connection uses the existing provider external instance reference as the Home Assistant base URL. The long-lived token is read from process configuration/environment (`HomeAssistant__AccessToken` / `HOMEASSISTANT__ACCESSTOKEN`) and is not stored on provider entities, returned through DTOs, included in diagnostics, or exported.

## Home Assistant client
The adapter uses `IHttpClientFactory`, bearer authorization applied internally, bounded response reads, cancellation tokens, status mapping, safe malformed-response handling, and provider-neutral outcomes.

## Mapping validation
Validation checks provider type, entity existence, availability, expected domain, required temperature/humidity/target/bounds attributes, readable values, and role compatibility.

## Observation normalization
The adapter normalizes Celsius temperatures, explicit Fahrenheit sensor readings to Celsius, humidity percentages, target temperature, explicit Home Assistant action/state to FamilyBoard operating state, provider availability, observed/received timestamps, and diagnostic-safe status text. It does not infer heating from current-vs-target temperature.

## Refresh scheduling
Manual provider and Room refresh service methods were added. Hosted periodic scheduling is deferred to keep this slice bounded around the adapter seam.

## Provider/mapping health
Mapping health is updated factually as Healthy, Missing, Unavailable, or NeedsReview depending on entity and provider outcomes.

## Heating capability
Capabilities are derived from the configured climate control entity and bounded target attributes. Cooler capability is exposed only when explicit target reduction through the control entity is supportable. Resume is exposed only when a safe configured strategy is present.

## Temporary target
Temporary targets dispatch `climate.set_temperature` for the configured control entity and return Accepted only for provider HTTP acceptance. The adapter does not mark commands Succeeded solely from HTTP success.

## Resume strategy
Resume supports only allow-listed adapter-local metadata strategies using the provider diagnostic metadata prefix `ha-resume:` for `script.turn_on` or `climate.set_preset_mode`. No arbitrary frontend service execution was added.

## Command reconciliation
Provider command references are opaque and include FamilyBoard command correlation. Existing reconciliation remains responsible for observation-based confirmation.

## APIs/contracts
No public API contract expansion was required for this bounded backend adapter slice. Generated contracts were not manually edited.

## Persistence/portability
No raw Home Assistant states, attributes, payload histories, tokens, or command payloads are persisted. Credentials remain external to portable provider fields.

## Security
Tokens are process configuration only, never returned in DTOs, never written to provider diagnostic metadata by the adapter, and not included in mapped observation details.

## Tests
Backend build was executed successfully. Focused provider tests and full backend suite remain deferred due slice-size constraints.

## Deferred scope
Frontend setup UI, OAuth, discovery, arbitrary service execution, lighting, weather, presence, energy, automation rules, weekly heating schedule editing, and generic Home Assistant dashboards were not implemented.

## Risks/limitations
- Connection storage remains minimal and uses the existing provider external reference for base URL plus external token configuration.
- Periodic hosted refresh scheduling remains to be added in a later slice.
- Resume strategy configuration is intentionally minimal and adapter-local.

## Modified files
- `src/HomeOps.Api/FloorPlans/HomeAssistantClimateProvider.cs`
- `src/HomeOps.Api/Program.cs`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
