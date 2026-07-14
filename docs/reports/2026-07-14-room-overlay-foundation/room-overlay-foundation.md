# Woning Climate Floor Plans Slice 5 — Room Overlay Foundation

## Summary
Implemented the backend foundation for FamilyBoard-owned room overlays and manual label anchors. The slice adds persistence, validation, lifecycle APIs, active-asset trust rules, lifecycle downgrades, backup/restore portability, and focused geometry tests.

## Implemented
- Room overlay domain model with Household, Room, Floor, active floor-plan Asset context, normalized polygon JSON, optional normalized label anchor, lifecycle state, and timestamps.
- Minimal APIs for listing by Floor/Room, retrieving one overlay, create, update geometry, update/reset anchor, trust, mark NeedsReview, archive, restore, delete, and validation status.
- EF Core migration and model snapshot for `RoomOverlays` with restrictive relationships and a filtered unique Trusted overlay index per Room/Asset.
- Backup export/restore payload section for overlays with point order, precision, anchor, state, and timestamps.
- Lifecycle downgrades for Room move/archive and Asset replacement/archive/missing so stale Trusted overlays are not left trusted.

## Domain decisions
- Polygons are FamilyBoard-owned spatial configuration and do not define Room identity or climate capability.
- V1 keeps one overlay linked to exactly one canonical Room and one Floor-plan Asset.
- Trusted overlays are intentionally reached only through an explicit trust operation.
- Restore rejects invalid Trusted data rather than silently downgrading it.

## Geometry model
- Points are normalized decimals in the inclusive 0..1 range.
- Polygons are implicitly closed and persisted as ordered JSON vertices.
- Rectangles are ordinary polygons; concave polygons are accepted.
- Holes, disconnected regions, durable unlinked polygons, and automatic correction are deferred.

## Trust lifecycle
- Supported states: Draft, Valid, NeedsReview, Trusted, Invalid, Archived.
- Create may persist Draft or Valid but never Trusted.
- Geometry edits downgrade Trusted overlays to Valid and revalidate geometry/anchor.
- Trust requires valid geometry, active Room/Floor/Asset relationships, Active usable Asset, no duplicate Trusted overlay for the Room/Asset, and no positive-area overlap with Trusted peers.
- Restore returns overlays to Valid; explicit trust is required again.

## Label anchors
- Manual anchors are optional normalized points.
- Anchors outside 0..1 or outside the polygon are blocking validation failures.
- Resetting the anchor returns the overlay to automatic-label positioning for future runtime rendering.

## Validation
- Blocks too few unique vertices, duplicate adjacent points, zero area, out-of-range coordinates, self-intersection, invalid anchors, missing/inactive Room, Room/Floor mismatch, Asset/Floor mismatch, non-usable Asset, duplicate Trusted Room/Asset overlays, positive-area Trusted overlap, and cross-Household relationships.
- Allows shared borders and shared vertices between adjacent Trusted overlays.
- Emits a high-vertex warning below the configured maximum.

## API/contracts
- Added backend-only minimal API contracts under `/api/floors/{floorId}/overlays`, `/api/rooms/{roomId}/overlay`, and `/api/room-overlays/{overlayId}`.
- No raw storage paths or asset source content are exposed by overlay APIs.

## Persistence/migration
- Added `RoomOverlays` with ordered JSON polygon vertices, decimal anchors, lifecycle state, timestamps, and restrictive foreign keys to Household/Floor/Asset plus cascade on permanent Room delete.
- Added lookup indexes for Floor/Asset/State and Room/Asset/State and filtered uniqueness for Trusted Room/Asset overlays.

## Backup/restore
- Exports and restores overlay identity, Room/Floor/Asset references, ordered points, optional anchor, state, archive timestamp, and create/update timestamps.
- Legacy backups with the section absent remain compatible.
- Explicit empty overlay section participates in full Floor/Room replacement semantics.
- Restore validates references, geometry, anchors, duplicate IDs, duplicate Trusted overlays, non-Active Trusted assets, and Trusted overlap before applying data.

## Tests
- Added focused geometry tests for valid triangle/rectangle/concave polygons, invalid geometry, anchor validation, shared edge allowance, positive overlap detection, and maximum vertex blocking.
- Ran focused geometry tests and full solution build.

## Risks/limitations
- Polygon overlap is deterministic and suitable for V1 residential hand-drawn overlays, but it is not a CAD/spatial-engine replacement.
- Restore validation currently targets overlay payload consistency and trust safety; advanced replacement-review workflows remain deferred.
- Runtime floor-plan rendering and editor UX are intentionally absent.

## Deferred scope
- Polygon editor frontend, canvas, asset upload UI, replacement review UI, runtime rendering, runtime room labels, climate readings, comfort calculations, Stories, heating controls, and Home Assistant discovery/synchronization.

## Modified files
- `src/HomeOps.Api/FloorPlans/RoomOverlay.cs`
- `src/HomeOps.Api/FloorPlans/RoomOverlayDtos.cs`
- `src/HomeOps.Api/FloorPlans/RoomOverlayEndpoints.cs`
- `src/HomeOps.Api/FloorPlans/RoomOverlayGeometry.cs`
- `src/HomeOps.Api/Data/HomeOpsDbContext.cs`
- `src/HomeOps.Api/Program.cs`
- `src/HomeOps.Api/FloorPlans/FloorPlanEndpoints.cs`
- `src/HomeOps.Api/FloorPlans/FloorPlanAssetEndpoints.cs`
- `src/HomeOps.Api/CalendarEvents/CalendarExportDtos.cs`
- `src/HomeOps.Api/CalendarEvents/CalendarPortabilityService.cs`
- `src/HomeOps.Api/Migrations/20260714165430_AddRoomOverlayFoundation.cs`
- `src/HomeOps.Api/Migrations/20260714165430_AddRoomOverlayFoundation.Designer.cs`
- `src/HomeOps.Api/Migrations/HomeOpsDbContextModelSnapshot.cs`
- `tests/HomeOps.Api.Tests/FloorPlans/RoomOverlayGeometryTests.cs`
