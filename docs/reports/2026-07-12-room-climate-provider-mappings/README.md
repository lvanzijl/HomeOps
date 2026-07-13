# Room Climate Provider Mappings

## Summary
Implemented the backend provider-mapping foundation for Woning climate floor plans. FamilyBoard now owns provider-neutral climate providers and room climate source mappings that link canonical Rooms to opaque external automation sources without importing readings or provider identity into Room identity.

## Implemented
- Household-owned climate provider definitions with HomeAssistant/Other provider types.
- Room climate source mappings with semantic roles, source metadata, priority, enabled/archive lifecycle, and health metadata.
- Provider and mapping APIs for list/get/create/update/archive/restore/delete, mapping reorder, and room capability summaries.
- Persistence for providers and mappings with string enum storage, restrictive foreign keys, active uniqueness constraints, and efficient Room/role indexes.
- Incremental backup/restore export and restore support for providers and mappings.
- Climate configuration delete/reset safety: deletion is blocked while mappings exist.
- OpenAPI and generated TypeScript client output.
- Focused backend API coverage for provider/mapping lifecycle, duplicate-source handling, shared heating-zone indication, capability summaries, provider delete blocking, and climate delete blocking.

## Domain decisions
- Provider identifiers remain diagnostic/configuration references only and never become Room identity.
- Provider disable/archive preserves mappings and does not mutate Rooms or climate configuration.
- Climate configuration deletion is blocked while any mappings exist; disabling climate configuration preserves dormant mappings.
- Restored mapping health is reset to `Unverified`, with validation metadata cleared, because backup restore cannot assume current provider validation remains true.

## Provider model
Providers are household-owned external integration definitions with stable IDs, provider type, display name, enabled/archive state, optional external instance reference, optional diagnostic metadata, and timestamps. No credentials or secrets are stored.

## Mapping model
Mappings connect one household, one Room, one Provider, one semantic climate source role, and one opaque external source reference. Optional source display, kind, area, and device metadata are retained for diagnostics/configuration only. Mappings include priority, enabled/archive lifecycle, health, last checked/success timestamps, diagnostic summary, and timestamps.

## Semantic roles
Supported roles are `ComfortTemperature`, `Humidity`, `HeatingControlTemperature`, `HeatingStatus`, `HeatingTargetTemperature`, and `HeatingControl`. Comfort temperature and heating-control temperature are separate roles and may point at the same or different external source/provider.

## Priority and duplicate-source behavior
Lower numeric priority is preferred. Priority is unique for active mappings within a Room/source-role scope. Duplicate active mappings for the same Room, role, provider, and external source are rejected, while multiple candidates for the same role are supported through distinct priorities.

## Shared-zone behavior
Heating-related mappings may share the same provider/source across multiple Rooms. Responses derive a shared-source indicator and shared Room IDs for these mappings without claiming room-isolated control or implementing heating actions.

## Health model
The canonical mapping health vocabulary is `Unverified`, `Healthy`, `Degraded`, `Unavailable`, `Missing`, and `NeedsReview`. Health is mapping metadata only; no readings, freshness states, comfort states, or runtime temperature/humidity values were added.

## API/contracts
Added provider-neutral endpoints under `/api/climate-providers`, `/api/rooms/{roomId}/climate-mappings`, `/api/climate-mappings/{mappingId}`, and `/api/rooms/{roomId}/climate-capabilities`. Contracts expose provider and mapping configuration state only; they do not expose readings, credentials, Stories, or command capability execution.

## Persistence/migration
Added the `ClimateProviders` and `RoomClimateSourceMappings` tables. Enums are persisted as strings. Foreign keys restrict deletion to protect Household, Room, Provider, and climate identity. Indexes cover provider lookup, Room/role active ordering, duplicate-source prevention, and priority uniqueness.

## Backup/restore
Backups now export climate providers and source mappings without secrets or readings. Restore validates provider IDs/types, mapping references, duplicate IDs, duplicate mapping identities, priority uniqueness, Room references, and climate configuration references. Restore is full replacement when provider collections are present, restores providers before mappings, resets mapping health to `Unverified`, clears validation timestamps, and remains compatible with legacy backups that omit provider/mapping sections.

## Validation
Validation covers active Room/configuration/provider requirements, role compatibility with Room climate configuration, required and length-bounded opaque external source IDs, duplicate mappings, duplicate priorities, reorder set membership, restore conflicts, provider delete restrictions, and climate configuration delete blocking.

## Tests
Focused API tests exercise provider creation, mapping creation, unverified default health, separate comfort/heating-control mappings, duplicate rejection, shared-zone summary, capability summary, provider delete blocking, and climate configuration delete blocking. Existing Floor/Room, RoomClimateConfiguration, portability, and broader backend tests were run.

## Risks/limitations
- A minimal internal validation seam is represented by mutable mapping health fields and application-level persistence shape; no public integration endpoint, polling, or Home Assistant adapter was introduced.
- Manual migration was authored because `dotnet-ef` is not installed in the container.
- Capability summary is configuration readiness only; it does not select sources using readings and does not calculate climate state.

## Deferred scope
No live Home Assistant integration, credentials/token storage, entity discovery, provider sync, actual climate readings, freshness thresholds, comfort calculations, Stories, heating commands, floor-plan assets, image upload, SVG sanitization, polygons, overlays, frontend implementation, or screenshots were implemented.

## Modified files
- `src/HomeOps.Api/FloorPlans/ClimateProvider.cs`
- `src/HomeOps.Api/FloorPlans/RoomClimateSourceMapping.cs`
- `src/HomeOps.Api/FloorPlans/ClimateMappingDtos.cs`
- `src/HomeOps.Api/FloorPlans/ClimateProviderMappingEndpoints.cs`
- `src/HomeOps.Api/FloorPlans/RoomClimateConfiguration.cs`
- `src/HomeOps.Api/FloorPlans/FloorPlanEndpoints.cs`
- `src/HomeOps.Api/Data/HomeOpsDbContext.cs`
- `src/HomeOps.Api/Program.cs`
- `src/HomeOps.Api/CalendarEvents/CalendarExportDtos.cs`
- `src/HomeOps.Api/CalendarEvents/CalendarPortabilityService.cs`
- `src/HomeOps.Api/Migrations/20260712223000_AddClimateProviderMappings.cs`
- `src/HomeOps.Contracts/openapi.json`
- `src/HomeOps.Client/src/api/homeOpsApiClient.ts`
- `tests/HomeOps.Api.Tests/FloorPlans/ClimateProviderMappingApiTests.cs`
- `docs/reports/2026-07-12-room-climate-provider-mappings/README.md`
- `docs/state/current-state.md`
