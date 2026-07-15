# Room Climate Read Model

## Summary
Implemented the backend-only normalized current Room climate read model for the future `Klimaat in huis` runtime view.

## Implemented
- Provider-independent current Room climate observations.
- Internal/provider-facing observation submission seam.
- Room, Floor, and Household summary read endpoints.
- Freshness and operating-state enums in OpenAPI and generated TypeScript client.
- EF Core persistence for one current observation per Room/source mapping.

## Domain decisions
- Observations are normalized operational telemetry and do not include Home Assistant entity JSON, credentials, physical paths, or provider-specific attributes.
- Heating is accepted only from an explicit normalized operating state; it is not inferred from temperature versus target.
- Cooling is included in the normalized enum because the provider mapping foundation has status/control roles that can safely carry an explicit cooling state.

## Observation model
Each accepted observation stores household, room, source mapping, provider, observed/received timestamps, nullable Celsius temperature, nullable humidity, nullable target, normalized operating state, provider availability, and optional diagnostic-safe source/status text.

## Freshness policy
Freshness is backend-owned and centralized in `RoomClimateReadModelService`: Fresh up to 20 minutes, Aging up to 2 hours, Stale after 2 hours, and Unavailable when no observation exists or provider availability/state is unavailable.

## Ingestion boundary
The submission seam validates Room/mapping/provider household ownership, active Room/configuration/provider/mapping status, timestamp future tolerance, Celsius and humidity ranges, target range, enum values, and newest-observation semantics. Older observations are ignored consistently without replacing current state.

## Room read model
Room state includes identity, Floor identity, Room type, configuration summary, current values, operating state, freshness, timestamps, provider availability, explicit issues, and spatial-display status.

## Floor summary
Floor state includes active floor-plan asset summary, deterministic Room states, freshness counts, trusted-overlay/fallback counts, observed summary timestamp, and overall factual availability.

## Spatial fallback behavior
Spatial status is derived from active Floor-plan asset, Trusted/NeedsReview overlays, and in-progress replacement review dispositions. Geometry remains owned by floor-plan endpoints and is not returned here.

## APIs and generated contracts
Added typed minimal API endpoints for Room climate state, Floor climate state, Household summary, and current observation submission. Regenerated OpenAPI and the TypeScript client.

## Persistence/migration
Added `RoomClimateObservations` with enum string persistence, restrictive delete behavior, household/room/freshness indexes, and a unique current-observation constraint per Room/source mapping.

## Backup/restore decision
Current observations are operational telemetry and remain excluded from portability exports. Configuration and mapping portability remains unchanged.

## Validation
Validation covers invalid temperature/humidity/target/timestamps, invalid enum values, archived/disabled Rooms, disabled/invalid mappings, cross-household ownership mismatches, and older observation handling.

## Tests
Build and generation checks were run. Focused automated tests were not added in this pass due to slice size; this is a remaining limitation.

## Deferred scope
No runtime UI, floor-plan coloring, comfort scoring, Stories, recommendations, controls, schedules, discovery, Home Assistant client/setup, history, weather integration, presence, or energy optimization was implemented.

## Risks/limitations
The read model uses the existing single-household API convention. The submission endpoint is available via HTTP for test/provider seams and should be protected/segmented when authentication is introduced.

## Modified files
See git diff for source, migration, generated contract, and documentation files.
