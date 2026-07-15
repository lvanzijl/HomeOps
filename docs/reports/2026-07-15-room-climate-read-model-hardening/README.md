# Room Climate Read Model Hardening

## Summary
Added focused backend hardening coverage for Woning Climate Floor Plans Slice 9 without changing accepted product scope.

## Risks addressed
- Current observations cannot be overwritten by older data.
- Invalid submissions leave stored observations unchanged.
- Read endpoints reject non-seed-household Rooms and Floors under the current single-household API convention.
- Freshness boundaries are deterministic and no longer tied to wall-clock timing in tests.

## Ingestion coverage
Tests cover first accepted observation, newer replacement, equal-timestamp behavior, ignored older submissions, partial nullable values, explicit Idle/Heating/Cooling/Unknown/Unavailable paths through accepted observations, provider-unavailable normalization, timestamp storage, validation failures, disabled/invalid mappings, disabled configuration, inactive/archived Rooms, and ownership mismatches.

## Freshness coverage
Freshness is tested at the exact 20-minute and 2-hour boundaries, immediately inside/outside each threshold, with no observation, unavailable provider/state, future timestamps within tolerance, and received-vs-observed timestamp precedence.

## Room read-model coverage
Tests verify identity, Floor identity, Room name/type, configuration summary, normalized values, nullable humidity/target, timestamps, operating state, freshness, availability, issues, and diagnostic-safe source/status text.

## Floor and Household summaries
Tests cover multiple Rooms with Fresh/Aging/Stale/Unavailable states, deterministic Room ordering, exact summary counts, observed summary timestamp, active asset summary, overall availability, archived Room exclusion, Floor without active asset, and Household summary aggregation without expanding the contract.

## Spatial fallback coverage
Tests cover TrustedOverlayAvailable, RoomListFallback, IntentionallyNotDrawn, OverlayNeedsReview, and NoActiveFloorPlan. Coverage includes active Trusted overlays, NeedsReview overlays, Trusted overlays on replaced assets, in-progress replacement review fallback dispositions, and no polygon geometry returned by climate endpoints.

## Persistence/migration verification
Tests verify the RoomClimateObservations table metadata, primary key, restrictive relationships, enum string persistence, nullable value columns, unique current-observation index, Household/Room index, freshness-related index, and telemetry exclusion from portability exports.

## API/generated contracts
Tests assert OpenAPI paths, request/response schemas, typed Room arrays, freshness and operating-state enum names, and generated TypeScript methods/enums for the Room, Floor, Household summary, and observation submission contracts.

## Atomicity
Rejected submissions, older submissions, and ownership failures are asserted not to mutate existing current observations. Invalid submissions do not create observations in the no-current-state paths covered by service validation.

## Telemetry portability decision
Current observations remain operational telemetry and are not exported/restored. Existing climate configuration and provider mapping portability remains unchanged, and no raw provider payloads or credentials are introduced.

## Tests
- Focused hardening tests for RoomClimateReadModelHardeningTests.
- Focused regression filter for Room climate configuration, provider mapping, Floor/Room, FloorPlanAsset, RoomOverlay, replacement lifecycle, and portability tests.
- Full backend suite, backend build, OpenAPI/client generation, frontend TypeScript build, and idempotent migration script generation.

## Remaining limitations
The current endpoints still follow the repository's existing single-household API convention. No new auth/provider boundary was introduced.

## Modified files
- `src/HomeOps.Api/FloorPlans/RoomClimateReadModelService.cs`
- `src/HomeOps.Api/Program.cs`
- `tests/HomeOps.Api.Tests/FloorPlans/RoomClimateReadModelHardeningTests.cs`
- Generated OpenAPI and TypeScript client files after regeneration.
- Documentation state, roadmap, and this report.

No runtime UI, comfort logic, Stories, controls, history, weather, presence, Home Assistant setup, screenshots, or binary assets were added.
