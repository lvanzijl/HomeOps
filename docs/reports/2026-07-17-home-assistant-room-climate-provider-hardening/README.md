# Home Assistant Room Climate Provider Hardening — Slice 13 Follow-up

## Summary
Added focused automated coverage for the backend Home Assistant room climate provider adapter and fixed concrete defects found while testing HTTP reuse, JSON parsing, URL validation, climate current-temperature mappings, and safe resume payloads.

## Risks addressed
- Reused `HttpClientFactory` clients no longer fail after the first request.
- Home Assistant `entity_id` and dynamic attributes are parsed explicitly.
- Embedded URL credentials are rejected.
- Climate entities exposing `current_temperature` can validate as current-temperature sources.
- Invalid target bounds and invalid target steps fail control validation.

## HTTP/client coverage
Tests cover valid state responses, base URL normalization, trailing slash handling, bearer authorization, configured timeout, authentication/authorization failures, provider unavailable responses, transport exceptions, malformed/empty/oversized bodies, unexpected HTTP statuses, and safe provider-neutral diagnostics.

## Credential handling
Tests prove the token is read from process environment configuration, missing tokens fail safely, and tokens are not persisted to provider fields, diagnostics, observations, command references, or portability export JSON.

## Mapping validation
Tests cover temperature, humidity, target/status/control mappings, Celsius/Fahrenheit handling, climate current-temperature attributes, unsupported domains, malformed values, unsupported units, unavailable/missing entities, and role mismatch outcomes.

## Observation normalization
Tests verify Celsius retention, Fahrenheit conversion, humidity, target temperature, explicit operating states, provider availability, partial observations, safe status text, and no heating inference from temperature difference.

## Refresh isolation
Tests verify provider refresh processes valid mappings even when another mapping fails, updates only the relevant mapping health, and leaves unrelated mappings factual.

## Provider/mapping health
Tests cover Healthy, Missing, Unavailable, and NeedsReview-equivalent transitions with safe diagnostics that exclude tokens, raw bodies, headers, and stack traces.

## Heating capability
Tests cover provider min/max/step discovery, FamilyBoard range intersection through the existing command capability layer, warmer/cooler actions, unavailable/invalid control handling, and resume capability gating.

## Temporary target commands
Tests verify `climate.set_temperature` dispatch, entity/target payload, Celsius target preservation, bearer authentication, command correlation, idempotent replay without duplicate dispatch, no direct observation mutation, and HTTP acceptance remaining `Accepted` rather than `Succeeded`.

## Resume strategies
Tests cover allow-listed `script.turn_on` dispatch. The adapter also supports `climate.set_preset_mode` with an explicit preset payload and rejects unsupported strategy metadata.

## Reconciliation integration
Tests prove accepted Home Assistant commands remain pending/accepted until later matching normalized target observations are reconciled by the existing reconciliation service.

## Security
No new public service executor, arbitrary JSON payload path, frontend setup UI, credentials persistence, or provider raw-payload persistence was added.

## Persistence/portability
Tests verify portable provider/mapping definitions remain exportable while tokens, authorization headers, observations, heating commands, provider command references, and raw Home Assistant payloads remain excluded.

## Atomicity
Tests cover one failed mapping not blocking valid observations and idempotent command replay not creating duplicate provider dispatches.

## Tests
- Focused Home Assistant provider tests.
- Full backend test suite.
- Backend build.
- Frontend generated-client TypeScript/build verification.

## Deferred scope
Hosted periodic Home Assistant refresh, frontend setup UI, OAuth/discovery, generic Home Assistant SDK, arbitrary service execution, automation, screenshots, binary assets, and unrelated product scope remain excluded.

## Remaining limitations
- Periodic refresh scheduling remains intentionally deferred.
- Resume strategy configuration remains intentionally minimal and adapter-local.
- No public OpenAPI contract changed, so OpenAPI/client regeneration was not required.

## Modified files
- `src/HomeOps.Api/FloorPlans/HomeAssistantClimateProvider.cs`
- `tests/HomeOps.Api.Tests/FloorPlans/HomeAssistantClimateProviderTests.cs`
- `docs/reports/2026-07-17-home-assistant-room-climate-provider-hardening/README.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
