# Woning Climate Floor Plans Slice 1 — Floor and Room Foundation

## Summary
Implemented the backend-only FamilyBoard-owned Floor and Room foundation from `docs/design/woning-climate-floor-plans.md` without floor-plan assets, polygons, climate configuration, Home Assistant mappings, Stories, runtime UI, screenshots, or binary assets.

## Implemented
- Durable household-owned Floor and Room domain entities.
- REST APIs for listing, reading, creating, updating, reordering, archiving, restoring, deleting, and moving Rooms between Floors.
- RoomType enum vocabulary for Bedroom, Bathroom, LivingRoom, Kitchen, Hall, Office, LaundryRoom, Storage, Landing, Toilet, UtilityRoom, and Other.
- Optional same-household active FamilyMember association for Rooms.

## Domain decisions
- Floor names are trimmed, required, and exact-case duplicate active names are rejected per household.
- Room names are trimmed, required, and exact-case duplicate active names are rejected within the same Floor; duplicate names on different Floors are allowed.
- Ordering uses deterministic contiguous integer `SortOrder` values. Create and restore append to the active set; archive, delete, and source-floor moves compact ordering gaps.
- Floor archive is blocked while active Rooms remain. Floor delete is blocked while any Room references it. Room delete is explicit and does not cascade future concepts.
- FamilyMember deletion does not delete Rooms; future cleanup is limited to nullable association behavior.
- Merge and split are deferred and no placeholder endpoints were added.

## API/contracts
- Added `/api/floors`, `/api/floors/{floorId}`, `/api/floors/reorder`, `/api/floors/{floorId}/archive`, `/api/floors/{floorId}/restore`, `/api/floors/{floorId}/rooms`.
- Added `/api/rooms/{roomId}`, `/api/rooms/reorder`, `/api/rooms/{roomId}/move`, `/api/rooms/{roomId}/archive`, `/api/rooms/{roomId}/restore`.
- Regenerated OpenAPI and the generated TypeScript client artifact only as contract output; no frontend usage was implemented.

## Persistence/migration
- Added `Floors` and `Rooms` tables with household foreign keys, Floor-to-Room restrictions, nullable Room-to-FamilyMember association, enum string persistence, timestamps, archive fields, ordering indexes, and filtered active-name uniqueness indexes.

## Backup/restore
- Extended the existing portability document with optional Floor and Room collections so older backups lacking those fields remain readable.
- Export includes Floor and Room identity, names, ordering, archive/enabled state, RoomType, optional FamilyMember id, and timestamps.
- Restore recreates Floors before Rooms and does not introduce assets, overlays, climate configuration, or provider mappings.

## Validation
- Invalid names, active duplicates, invalid reorder sets, archived Floor room creation, destination move conflicts, inactive destination Floor, invalid FamilyMember association, Floor archive with active Rooms, Floor delete with Rooms, and Room restore into inactive Floors return user-actionable bad-request responses.

## Tests
- Added focused API coverage for Floor lifecycle, exact duplicate rejection, ordering, archive/delete safety with Rooms, Room lifecycle, same-name different-Floor allowance, same-Floor duplicate rejection, RoomType round-trip, optional FamilyMember association, move conflicts, archive, and restore.

## Risks/limitations
- Backup/restore Floor/Room validation is intentionally lightweight in this slice and should be hardened with malformed relationship rejection cases in a follow-up before external portability UX depends on it.
- Current endpoints use the existing seeded household pattern and do not introduce authentication or permissions.

## Deferred scope
- Floor-plan image upload and storage.
- SVG/PNG/JPG/JPEG handling.
- Room overlays, polygons, and label anchors.
- Climate configuration, sensors, policies, Home Assistant/Evohome mappings, and Stories.
- Woning frontend, Settings frontend, editor UX, runtime deep dive, screenshots, and binary assets.
- Room merge and split operations.

## Modified files
- `src/HomeOps.Api/FloorPlans/*`
- `src/HomeOps.Api/Data/HomeOpsDbContext.cs`
- `src/HomeOps.Api/Program.cs`
- `src/HomeOps.Api/Migrations/*AddFloorRoomFoundation*`
- `src/HomeOps.Api/Migrations/HomeOpsDbContextModelSnapshot.cs`
- `src/HomeOps.Api/CalendarEvents/CalendarExportDtos.cs`
- `src/HomeOps.Api/CalendarEvents/CalendarPortabilityService.cs`
- `src/HomeOps.Contracts/openapi.json`
- `src/HomeOps.Client/src/api/homeOpsApiClient.ts`
- `tests/HomeOps.Api.Tests/FloorPlans/FloorPlanApiTests.cs`
