# Floor-plan Replacement Review Contracts — Backend/Client Follow-up

## Summary

This follow-up unblocks the future Slice 8 frontend implementation by exposing the accepted floor-plan replacement review backend lifecycle through OpenAPI and the generated TypeScript client.

No replacement review UI was implemented. No runtime climate rendering, climate readings, Stories, heating controls, Home Assistant integration, polygon-editor changes, screenshots, or binary assets were added.

Slice 8 must be rerun after this contract follow-up is merged.

## Root cause

The replacement review backend endpoints were registered in application startup and runtime API tests covered them, but the checked-in OpenAPI document and generated TypeScript client predated those endpoints. As a result, Copilot could only see direct floor-plan asset activation/rollback methods and could not implement the frontend workflow using generated review-scoped contracts.

## Endpoint registration verified

`Program.cs` maps the replacement review endpoint group through `app.MapFloorPlanReplacementReviewEndpoints()` alongside the other Woning floor-plan endpoint groups. The endpoint group is rooted at:

`/api/floors/{floorId:guid}/floor-plan-replacement-reviews`

The follow-up also adds two small repository-consistent read endpoints over already accepted lifecycle data:

- active review discovery for a Floor;
- rollback availability inspection for an activated review.

These expose existing state safely and do not add new lifecycle semantics.

## OpenAPI paths exposed

The regenerated OpenAPI document now exposes:

- `POST /api/floors/{floorId}/floor-plan-replacement-reviews`
- `GET /api/floors/{floorId}/floor-plan-replacement-reviews`
- `GET /api/floors/{floorId}/floor-plan-replacement-reviews/active`
- `GET /api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}`
- `GET /api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}/rooms`
- `PUT /api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}/rooms/{roomId}/disposition`
- `POST /api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}/rooms/{roomId}/approve-reuse`
- `POST /api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}/rooms/{roomId}/replacement-overlay`
- `POST /api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}/rooms/{roomId}/reset`
- `GET /api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}/validation`
- `POST /api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}/activate`
- `POST /api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}/cancel`
- `GET /api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}/rollback`
- `POST /api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}/rollback`

## DTOs and enums exposed

OpenAPI and the generated client now expose concrete schemas for:

- `FloorPlanReplacementReviewDto`
- `FloorPlanReplacementCompatibilityDto`
- `FloorPlanReplacementReviewItemDto`
- `StartFloorPlanReplacementReviewRequest`
- `UpdateRoomReplacementDispositionRequest`
- `ApproveReuseCandidateRequest`
- `AttachReplacementOverlayRequest`
- `ReplacementReviewValidationResultDto`
- `FloorPlanReplacementRollbackAvailabilityDto`

Review detail now includes household/floor/assets, review status, compatibility metadata, rollback availability, activation/cancellation timestamps, and typed Room review items. Room review items include Room display name/type, disposition, reuse candidate availability, reusable/approved overlay IDs, anchor approval, fallback reason, and timestamps.

The generated client exposes typed TypeScript enums for:

- `FloorPlanReplacementReviewStatus` with `Draft`, `InReview`, `ReadyToActivate`, `Activated`, `Cancelled`, and `Invalid`.
- `RoomReplacementDisposition` with `PendingReview`, `ApprovedReuse`, `RedrawRequired`, `NotConfiguredYet`, `IntentionallyNotDrawn`, and `BlockedFallback`.

`ReadyToActivate` remains an accepted backend status value because it is already part of the persisted lifecycle enum and active-review uniqueness filter. The readiness endpoint remains the source of truth for whether activation is currently allowed.

## Readiness contract

Readiness validation is non-mutating and exposed as `ReplacementReviewValidationResultDto` through:

`GET /api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}/validation`

The typed result includes:

- `reviewId`;
- `isReady`;
- `blockers` as typed `RoomOverlayValidationIssue` values with code, message, overlay reference, and Room reference where applicable.

The frontend can distinguish successful readiness validation from transport/validation failures without parsing storage paths or raw exception data.

## Generated TypeScript methods

| Backend operation | HTTP route | Generated TypeScript method | Request DTO | Response DTO |
| --- | --- | --- | --- | --- |
| Start replacement review | `POST /api/floors/{floorId}/floor-plan-replacement-reviews` | `startFloorPlanReplacementReview(floorId, req)` | `StartFloorPlanReplacementReviewRequest` | `FloorPlanReplacementReviewDto` |
| List Floor review history | `GET /api/floors/{floorId}/floor-plan-replacement-reviews` | `listFloorPlanReplacementReviews(floorId)` | none | `FloorPlanReplacementReviewDto[]` |
| Get active Floor review | `GET /api/floors/{floorId}/floor-plan-replacement-reviews/active` | `getActiveFloorPlanReplacementReview(floorId)` | none | `FloorPlanReplacementReviewDto` or 204 no active review |
| Get review detail | `GET /api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}` | `getFloorPlanReplacementReview(floorId, reviewId)` | none | `FloorPlanReplacementReviewDto` |
| Get Room review items | `GET /api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}/rooms` | `getFloorPlanReplacementReviewRooms(floorId, reviewId)` | none | `FloorPlanReplacementReviewItemDto[]` |
| Update Room disposition | `PUT /api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}/rooms/{roomId}/disposition` | `updateFloorPlanReplacementRoomDisposition(floorId, reviewId, roomId, req)` | `UpdateRoomReplacementDispositionRequest` | `FloorPlanReplacementReviewDto` |
| Approve reusable geometry | `POST /api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}/rooms/{roomId}/approve-reuse` | `approveFloorPlanReplacementReuse(floorId, reviewId, roomId, req)` | `ApproveReuseCandidateRequest` | `FloorPlanReplacementReviewDto` |
| Attach/approve replacement overlay | `POST /api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}/rooms/{roomId}/replacement-overlay` | `attachFloorPlanReplacementOverlay(floorId, reviewId, roomId, req)` | `AttachReplacementOverlayRequest` | `FloorPlanReplacementReviewDto` |
| Reset Room review item | `POST /api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}/rooms/{roomId}/reset` | `resetFloorPlanReplacementRoomReview(floorId, reviewId, roomId)` | none | `FloorPlanReplacementReviewDto` |
| Validate readiness | `GET /api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}/validation` | `validateFloorPlanReplacementReview(floorId, reviewId)` | none | `ReplacementReviewValidationResultDto` |
| Activate review | `POST /api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}/activate` | `activateFloorPlanReplacementReview(floorId, reviewId)` | none | `FloorPlanReplacementReviewDto` |
| Cancel review | `POST /api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}/cancel` | `cancelFloorPlanReplacementReview(floorId, reviewId)` | none | `FloorPlanReplacementReviewDto` |
| Inspect rollback availability | `GET /api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}/rollback` | `getFloorPlanReplacementRollbackAvailability(floorId, reviewId)` | none | `FloorPlanReplacementRollbackAvailabilityDto` |
| Roll back activated review | `POST /api/floors/{floorId}/floor-plan-replacement-reviews/{reviewId}/rollback` | `rollbackFloorPlanReplacementReview(floorId, reviewId)` | none | `FloorPlanReplacementReviewDto` |

## Error contracts

The endpoint metadata declares typed success responses, not-found responses, validation/problem responses, and review-specific validation results where the backend already returns them.

Expected user-safe failure categories remain represented through repository-standard validation problems or typed validation result DTOs, including duplicate active review, invalid replacement asset, stale active asset, pending/incomplete Room disposition, missing approved overlay, overlap conflicts, not-ready activation, activated/cancelled review constraints, rollback unavailable, and cross-household/missing-resource access.

## Contract tests

Focused contract tests assert:

- replacement review paths exist in OpenAPI;
- successful responses reference concrete schemas;
- collection methods generate typed arrays;
- request bodies reference concrete request DTOs;
- review status and Room disposition enum names are present;
- compatibility, readiness, and rollback availability schemas are present;
- generated TypeScript methods return typed DTOs and expose reusable enums.

## Runtime regression

Focused runtime tests cover:

- start and read review;
- active review discovery;
- Room review item listing;
- Room disposition mutation;
- reusable geometry approval;
- replacement overlay attachment;
- readiness validation;
- activation;
- cancellation;
- rollback availability;
- rollback execution;
- direct replacement asset activation rejection.

FloorPlanAsset and RoomOverlay regressions were also run to confirm the contract changes did not alter adjacent accepted lifecycle behavior.

## Frontend unblock verification

Generated-client verification confirms Slice 8 can be implemented without:

- handwritten replacement-review fetch calls;
- local duplicated review-state or disposition enums;
- `any`-based response normalization;
- direct asset activation as a replacement for review activation.

The generated client is sufficient to discover/start/resume a review, render Room items/dispositions, show compatibility and reuse eligibility, save Room decisions, approve replacement geometry, validate readiness, activate, cancel, inspect rollback availability, and execute review-scoped rollback.

## Remaining limitations

- No replacement review UI was implemented in this follow-up.
- Readiness remains validated through the backend endpoint; `ReadyToActivate` must not be fabricated by the frontend.
- The active-review endpoint returns 204 when there is no active review; generated clients should treat that as an empty state.
- Slice 8 must be rerun after this contract follow-up is merged.

## Modified files

- `src/HomeOps.Api/FloorPlans/FloorPlanReplacementReviewDtos.cs`
- `src/HomeOps.Api/FloorPlans/FloorPlanReplacementReviewEndpoints.cs`
- `tests/HomeOps.Api.Tests/FloorPlans/FloorPlanReplacementReviewApiTests.cs`
- `src/HomeOps.Contracts/openapi.json`
- `src/HomeOps.Client/src/api/homeOpsApiClient.ts`
- `docs/reports/2026-07-14-floor-plan-replacement-review-contracts/floor-plan-replacement-review-contracts.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
