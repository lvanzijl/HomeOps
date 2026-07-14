# Woning Climate Floor Plans Slice 6 — Room Overlay Contract Correction

## Summary
Corrected the Room Overlay OpenAPI response declarations so the generated TypeScript client exposes strongly typed overlay list and validation/status responses. This follow-up removes the temporary frontend runtime-normalization workaround from the Settings overlay editor adapter.

No product behavior or scope was added.

## Contract defects corrected
- Floor overlay list response now has a typed `RoomOverlayDto` collection schema.
- Room overlay lookup/list response now has a typed `RoomOverlayDto` collection schema.
- Room overlay validation/status response now has a typed `RoomOverlayValidationResultDto` schema.
- Adjacent Room Overlay create, read, update, label-anchor, trust, needs-review, archive, restore, and delete response declarations were verified and declared consistently.

## Backend response declaration changes
- Added repository-consistent `.Produces<T>()` / `.Produces(statusCode)` metadata to the Room Overlay endpoint group.
- Mutation endpoints now document their actual `RoomOverlayDto`, `RoomOverlayValidationResultDto`, `404`, or `204` responses as appropriate.
- No persistence entities are exposed through the contract.

## Generated client changes
- Regenerated `src/HomeOps.Contracts/openapi.json` and `src/HomeOps.Client/src/api/homeOpsApiClient.ts` with NSwag.
- Generated `getFloorRoomOverlays` and `getRoomOverlays` now return `Promise<RoomOverlayDto[]>`.
- Generated `getRoomOverlayValidation` now returns `Promise<RoomOverlayValidationResultDto>`.

## Frontend workaround removed
- Removed the adapter's defensive `any` calls and runtime list/validation response normalization that existed only because NSwag previously generated `void` methods.
- The adapter now calls the strongly typed generated methods directly and only maps editor points into generated `NormalizedPoint` request DTOs.

## Tests
- Added backend OpenAPI/client contract assertions for Room Overlay list, validation/status, and adjacent mutation response schemas.
- Added frontend adapter tests proving list and validation methods return the typed generated responses directly.
- Re-ran focused Room Overlay frontend tests, full frontend tests, frontend build, Room Overlay backend tests, backend build, and NSwag generation.

## Modified files
- `src/HomeOps.Api/FloorPlans/RoomOverlayEndpoints.cs`
- `tests/HomeOps.Api.Tests/FloorPlans/RoomOverlayApiTests.cs`
- `src/HomeOps.Contracts/openapi.json`
- `src/HomeOps.Client/src/api/homeOpsApiClient.ts`
- `src/HomeOps.Client/src/settings/roomOverlayEditorApi.ts`
- `src/HomeOps.Client/src/settings/roomOverlayEditorApi.test.ts`
- `src/HomeOps.Client/src/settings/RoomOverlayEditor.tsx`
- `src/HomeOps.Client/src/settings/RoomOverlayEditor.test.tsx`
