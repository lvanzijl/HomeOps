# Room Climate Provider Mapping Hardening

## Summary
Added a focused backend hardening pass for Woning Climate Floor Plans provider mappings. The accepted provider/mapping model remains unchanged; this slice adds the canonical internal validation-update seam, verifies the manually authored migration/schema shape, adds focused regression tests, and documents the lifecycle semantics for future provider integrations.

## Validation seam added
`ClimateMappingValidationService` is now the explicit application operation future provider integration code should use to report mapping validation results. It supports marking mappings Healthy, Degraded, Unavailable, Missing, NeedsReview, and explicitly resetting to Unverified. It is not exposed as a public household-facing endpoint.

The seam accepts only household id, mapping id, health outcome, optional metadata, and diagnostics. It cannot change Room identity, Provider identity, source role, priority, or external source identity.

## Health and timestamp semantics
- `Healthy` sets `LastCheckedUtc`, sets `LastSuccessfulUtc`, may refresh external metadata, and clears obsolete diagnostics.
- `Degraded` sets `LastCheckedUtc`, preserves prior successful validation timestamp, and records diagnostics.
- `Unavailable` sets `LastCheckedUtc`, preserves prior successful validation timestamp, and records temporary unavailability.
- `Missing` sets `LastCheckedUtc`, preserves historical success metadata, and records that the configured source no longer resolves.
- `NeedsReview` sets `LastCheckedUtc`, preserves historical success metadata, and records why review is required.
- `Unverified` reset clears validation timestamps and diagnostics only through the explicit reset operation.

## Lifecycle behavior
Archived mappings reject validation updates. Disabled mappings, disabled providers, and disabled climate configurations cannot be marked Healthy as active sources. Archived providers and archived/disabled Rooms reject validation updates. Non-Healthy validation outcomes may still preserve configuration diagnostics for disabled mappings/providers where safe. Restored mappings remain Unverified until validated again.

## Household isolation
The validation seam requires a target Household id, loads mappings by Household + mapping id, verifies that the Room and Provider belong to the same Household, and rejects missing or cross-Household updates. Provider integrations cannot mutate another Household's mapping by mapping id alone.

## Migration verification
Installed `dotnet-ef` into ignored local tooling for verification, regenerated a temporary comparison migration, and confirmed it matched the manual migration's intended table/column/index/foreign-key shape. The temporary migration was removed and the EF model snapshot was updated so future migrations start from the accepted provider-mapping model.

Generated an idempotent script for `AddClimateProviderMappings` and verified:
- `ClimateProviders` and `RoomClimateSourceMappings` table names;
- primary keys;
- Household, Room, and Provider foreign keys with restrict delete behavior;
- enum string column lengths;
- external source and metadata column lengths;
- enabled/archive/health/timestamp columns;
- active duplicate-source uniqueness;
- active priority uniqueness per Room/role;
- Room/role query indexes;
- nullable versus required columns.

## Tests
Added focused service tests for health/timestamp semantics, repeated Healthy updates, degraded/unavailable/missing/needs-review preservation of last successful validation, explicit Unverified reset, metadata persistence, oversized metadata rejection, household isolation, missing mapping rejection, disabled/archive lifecycle handling, restored mapping validation, and identity/priority immutability.

Added model-level persistence tests for table names, primary keys, length constraints, indexes, uniqueness filters, and delete restrictions.

## Risks/limitations
The seam is intentionally application-level only. It does not add live Home Assistant integration, credentials, discovery, polling, actual readings, Stories, heating commands, floor-plan assets, polygons, overlays, frontend UI, screenshots, or binary assets.

The validation service uses the current system clock for timestamps; tests assert semantic ordering/presence rather than injecting a custom clock to avoid adding speculative infrastructure.

## Modified files
- `src/HomeOps.Api/FloorPlans/ClimateMappingValidationService.cs`
- `src/HomeOps.Api/Program.cs`
- `src/HomeOps.Api/Migrations/HomeOpsDbContextModelSnapshot.cs`
- `tests/HomeOps.Api.Tests/FloorPlans/ClimateMappingValidationServiceTests.cs`
- `tests/HomeOps.Api.Tests/FloorPlans/ClimateProviderMappingPersistenceTests.cs`
- `docs/reports/2026-07-13-room-climate-provider-mapping-hardening/README.md`
- `docs/state/current-state.md`
