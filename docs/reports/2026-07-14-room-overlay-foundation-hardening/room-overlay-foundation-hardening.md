# Room Overlay Foundation Hardening — 2026-07-14

## Summary
Hardened the accepted Room Overlay foundation without adding product scope. This follow-up adds focused API, lifecycle, portability, atomicity, and schema coverage, and fixes concrete defects found while writing those tests.

## Risks addressed
- Trust API previously did not reject non-Valid lifecycle states before evaluating trust blockers.
- Permanent Room deletion relied on provider cascade behavior; the endpoint now explicitly removes owned overlays before deleting the Room.
- Full Floor/Room restore needed to clear overlays before replacing Assets/Floors/Rooms to avoid stale references.
- Trusted overlay backup input is restored as Valid so runtime trust is never silently recreated during restore.

## Lifecycle API coverage
- Added focused endpoint tests for Draft/Valid create, read/list/get not-found behavior, missing or inactive Room rejection, Room/Floor mismatch, Asset/Floor mismatch, non-usable Asset rejection, and cross-Household rejection.
- Added geometry update tests for valid edits, Trusted-to-Valid downgrade, anchor revalidation, invalid geometry rejection, and no mutation after failed edits.
- Added label-anchor tests for interior anchor set, reset, out-of-range rejection, outside-polygon rejection, and no mutation after failed anchor updates.

## Trust and downgrade behavior
- Added trust tests for Valid-to-Trusted success, Draft/NeedsReview trust rejection, duplicate Trusted Room/Asset rejection, positive-overlap rejection, shared-edge acceptance, archive/restore/delete lifecycle, and failed trust state preservation.
- Added Room lifecycle tests proving Room archive and Room move downgrade Trusted overlays, Room restore does not silently restore trust, and permanent Room delete removes owned overlays only.
- Added Asset lifecycle tests proving replacement activation and mark-missing downgrade affected Trusted overlays.

## Persistence/schema verification
- Added EF model verification for the `RoomOverlays` table, primary key, JSON polygon column, anchor precision/nullability, archive/timestamp fields, Room/Floor/Asset/Household FKs and delete behaviors, lookup indexes, and filtered Trusted uniqueness.
- Verified idempotent migration script generation with `dotnet-ef migrations script --idempotent`.

## Backup/restore verification
- Added portability tests for export/restore of overlay shape, point order, decimal precision, anchor preservation, Trusted input restore as Valid, invalid overlay payload rejection, failed restore preserving existing overlays/Floors/Rooms/Assets, absent overlay collection compatibility, and explicit empty overlay replacement semantics.

## Atomicity
- API tests prove invalid geometry, invalid anchors, and failed trust attempts leave stored overlays unchanged.
- Restore tests prove invalid overlay restore leaves existing overlays and the Floor/Room/Asset graph unchanged.
- Restore remains aligned with existing pre-restore snapshot and transaction conventions; no new transaction framework was introduced.

## Tests
- Focused overlay API tests.
- Focused overlay geometry tests.
- Focused overlay portability/schema tests.
- Floor/Room, FloorPlanAsset, RoomClimateConfiguration, provider mapping, and calendar portability regression tests.
- Full backend suite.
- Final build and git diff inspection.

## Remaining limitations
- This remains backend foundation only; no polygon editor, runtime rendering, labels, climate readings, Stories, heating controls, or Home Assistant integration was added.
- The overlap algorithm remains a deterministic V1 residential polygon validator, not a CAD/spatial-engine replacement.

## Modified files
- `src/HomeOps.Api/CalendarEvents/CalendarPortabilityService.cs`
- `src/HomeOps.Api/FloorPlans/FloorPlanEndpoints.cs`
- `src/HomeOps.Api/FloorPlans/RoomOverlayEndpoints.cs`
- `tests/HomeOps.Api.Tests/FloorPlans/RoomOverlayApiTests.cs`
- `tests/HomeOps.Api.Tests/FloorPlans/RoomOverlayPortabilityAndSchemaTests.cs`
