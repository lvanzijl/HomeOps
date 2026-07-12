# Room Climate Configuration Foundation

## Summary
Implemented Woning Climate Floor Plans slice 2A as a backend-only foundation for FamilyBoard-owned Room climate configuration attached to canonical Rooms without provider mappings, sensor identifiers, readings, Stories, controls, floor-plan assets, polygons, overlays, or frontend UI.

## Implemented
- Added a separate `RoomClimateConfiguration` persistence/domain model keyed one-to-one by Room.
- Added minimal product-level enums for `HeatingPolicyIntent` and derived `ClimateSourceRole` values.
- Added Room climate configuration API endpoints for get, idempotent upsert, and delete/reset.
- Added validation for active Room ownership, climate enabled/bedtime consistency, temperature ranges, humidity ranges, and bounded-control prerequisites.
- Added incremental backup/restore export, validation, full replacement semantics when present, legacy absent-section compatibility, duplicate/missing reference rejection, and atomic failure behavior through existing restore validation.
- Added EF migration and regenerated OpenAPI/NSwag artifacts.
- Added focused backend tests covering lifecycle, validation, archive/restore/move preservation, and portability behavior.

## Domain decisions
- Canonical Room identity remains unchanged; climate meaning is stored separately.
- A missing configuration means the Room is not configured for climate interpretation but remains eligible for future setup.
- Disabling climate preserves configuration for future re-enable.
- Delete/reset removes the Room climate configuration and returns the Room to not configured.
- Room archive/move operations do not delete or mutate climate configuration.
- Bedtime relevance is allowed only when climate participation is enabled.
- Bounded heating-control intent requires a temperature comfort policy because future bounded control needs a household-facing bound.

## Configuration model
- `IsClimateEnabled` controls participation in future FamilyBoard climate experiences.
- `IsBedtimeRelevant` is feature-specific climate configuration, not Room identity and not derived from RoomType or FamilyMember.
- Optional temperature policy stores Celsius minimum/maximum values with broad supported bounds.
- Optional humidity policy stores relative-humidity percentage minimum/maximum values.
- `HeatingPolicyIntent` supports `None`, `ReadOnlyStatus`, and `BoundedControl` only.
- Required future source roles are derived from configured policy and intent rather than persisted as redundant booleans.

## API/contracts
- `GET /api/rooms/{roomId}/climate-configuration` returns a response that distinguishes not configured from configured-but-disabled.
- `PUT /api/rooms/{roomId}/climate-configuration` creates or replaces the configuration idempotently.
- `DELETE /api/rooms/{roomId}/climate-configuration` removes the configuration.
- Contracts include Room ID, configured state, participation, bedtime relevance, optional ranges, heating-policy intent, derived roles, and timestamps.

## Persistence/migration
- Added `RoomClimateConfigurations` table with Room primary key, Household safety reference, enum string persistence, nullable range columns, timestamps, and cascade deletion with permanent Room deletion.
- Added migration `AddRoomClimateConfigurationFoundation` and verified idempotent migration script generation.

## Backup/restore
- Export includes Room climate configurations after Rooms.
- Restore validates duplicate Room configurations, missing Room references, malformed ranges, unsupported enum values, and invalid lifecycle combinations before applying changes.
- Legacy backups with no climate-configuration collection remain compatible.
- Present empty climate-configuration collection explicitly replaces current climate configurations with none.
- Failed validation leaves current climate configurations unchanged.
- No provider mappings, entity IDs, source health, readings, or provider diagnostics are included.

## Validation
- Active local household Room is required for API mutation/query.
- Archived or disabled Rooms reject active climate configuration operations.
- Temperature and humidity ranges require lower minimum than maximum and supported bounds.
- Bedtime relevance while climate is disabled is invalid.
- Bounded-control heating intent without a temperature comfort range is invalid.

## Tests
- Focused lifecycle/API tests for missing, create, update, disable/re-enable, delete/reset, archive/restore/move preservation, and derived roles.
- Focused validation tests for invalid temperature/humidity ranges, bedtime disabled, bounded-control prerequisites, and archived Room rejection.
- Portability tests for export, disabled preservation, duplicate rejection, invalid value rejection, explicit empty replacement, and atomic failed restore preservation.
- Floor/Room tests and the full backend suite were run.

## Risks/limitations
- Cross-household behavior currently follows the repository's seed-household API model; non-seed household records are not exposed through public routes.
- Incomplete range object validation is limited by the generated request contract shape; malformed JSON/model-binding failures are rejected by ASP.NET before domain persistence.

## Deferred scope
- No Home Assistant mappings.
- No provider definitions or provider mappings.
- No sensor/entity IDs.
- No actual climate readings.
- No source freshness, health, readiness, or confidence.
- No Stories.
- No heating commands, temporary warmer controls, or schedule resume behavior.
- No floor-plan assets, polygons, overlays, label anchors, or frontend implementation.

## Modified files
- Backend domain/contracts/endpoints under `src/HomeOps.Api/FloorPlans/`.
- EF persistence under `src/HomeOps.Api/Data/` and `src/HomeOps.Api/Migrations/`.
- Backup/restore contracts and service under `src/HomeOps.Api/CalendarEvents/`.
- OpenAPI and generated client artifacts under `src/HomeOps.Contracts/` and `src/HomeOps.Client/src/api/`.
- Backend tests under `tests/HomeOps.Api.Tests/FloorPlans/`.
- State and roadmap documentation.
