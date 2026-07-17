# Home Assistant Resume Strategy Contract — 2026-07-17

## Summary
Added a typed Home Assistant resume-schedule strategy contract, explicit persistence, adapter integration, generated OpenAPI/TypeScript client support, and Settings UI editing for `Geen`, script, and climate preset strategies.

## Root cause
Slice 15 intentionally left resume strategy read-only because the backend only had legacy `ha-resume:` parsing in generic provider diagnostic metadata. That made the frontend unable to configure the strategy safely without editing a diagnostic blob.

## Typed configuration model
The backend now exposes `HomeAssistantResumeStrategyType` with `None`, `Script`, and `ClimatePreset`, plus safe DTO/request fields for script entity reference, climate entity reference, preset value, validation blockers, validity, and update timestamp.

## Validation
Validation only accepts `script.` entity references for script resume and `climate.` entity references plus a bounded preset string for climate preset resume. Wrong domains, malformed references, missing preset values, oversized values, and control characters are rejected with household-safe messages.

## Persistence/migration
The strategy is stored on `ClimateProvider` as explicit provider-owned configuration fields instead of diagnostic metadata. A migration adds the columns and migrates valid legacy `ha-resume:script:turn_on:script.*` and `ha-resume:climate:set_preset_mode:*:climate.*` metadata where practical.

## Legacy compatibility
The typed model is authoritative after migration. Malformed or unsupported legacy metadata remains unconfigured and cannot enable command execution.

## API/OpenAPI contracts
Added `GET` and `PUT` under `/api/climate-providers/{providerId}/home-assistant/resume-strategy`. OpenAPI and the generated TypeScript client now expose typed get/update methods, request/response DTOs, and the generated enum.

## Adapter integration
The Home Assistant adapter derives resume capability only from the typed strategy and dispatches only allow-listed service calls: `script.turn_on` for script strategy and `climate.set_preset_mode` for climate preset strategy. HTTP success remains provider-neutral `Accepted`.

## Settings UI
The existing Settings > Woning Home Assistant section now includes a typed `Schema hervatten` form with radio choices for `Geen`, `Home Assistant-script gebruiken`, and `Thermostaatpreset gebruiken`, conditional safe fields, validation guidance, explicit save, and clear confirmation.

## Security boundaries
- No arbitrary Home Assistant service execution was added.
- No arbitrary JSON or service editor was added.
- No token input/storage was added.
- The typed configuration is now authoritative.
- Generated contracts are used directly.
- No unrelated product scope was added.

## Portability
The safe strategy fields are exported/restored with climate provider configuration. Tokens remain absent, operational command state remains excluded, and imported mapping health still resets to `Unverified`.

## Tests
Added focused backend validation/adapter/portability coverage and focused frontend strategy-form coverage. Regenerated OpenAPI and the TypeScript client.

## Deferred scope
OAuth, discovery, entity browser, arbitrary service execution, arbitrary JSON, token storage, schedule editing, automation rules, runtime dashboard changes, and unrelated Home Assistant domains remain excluded.

## Risks/limitations
The migration handles practical valid legacy metadata patterns but intentionally does not trust malformed or unsupported legacy metadata. Full frontend suite still shows unrelated flaky failures when all files are run together; affected tests pass when run directly.

## Modified files
- `src/HomeOps.Api/FloorPlans/HomeAssistantResumeStrategy.cs`
- `src/HomeOps.Api/FloorPlans/HomeAssistantResumeStrategyEndpoints.cs`
- `src/HomeOps.Api/FloorPlans/HomeAssistantClimateProvider.cs`
- `src/HomeOps.Api/FloorPlans/ClimateProvider.cs`
- `src/HomeOps.Api/Data/HomeOpsDbContext.cs`
- `src/HomeOps.Api/Migrations/20260717124500_AddHomeAssistantResumeStrategyConfiguration.cs`
- `src/HomeOps.Api/Migrations/HomeOpsDbContextModelSnapshot.cs`
- `src/HomeOps.Api/CalendarEvents/CalendarExportDtos.cs`
- `src/HomeOps.Api/CalendarEvents/CalendarPortabilityService.cs`
- `src/HomeOps.Api/Program.cs`
- `src/HomeOps.Contracts/openapi.json`
- `src/HomeOps.Client/src/api/homeOpsApiClient.ts`
- `src/HomeOps.Client/src/settings/HomeAssistantClimateSettings.tsx`
- `src/HomeOps.Client/src/settings/HomeAssistantClimateSettings.test.tsx`
- `src/HomeOps.Client/src/settings/WoningManagement.test.tsx`
- `src/HomeOps.Client/src/settings/woningApi.ts`
- `src/HomeOps.Client/src/styles.css`
- `tests/HomeOps.Api.Tests/FloorPlans/HomeAssistantClimateProviderTests.cs`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
