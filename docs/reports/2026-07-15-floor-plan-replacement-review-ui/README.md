# Floor-plan Replacement Review UI

## Summary
Implemented the Settings > Woning room-by-room replacement review workflow for starting, resuming, validating, activating, cancelling, and rolling back a replacement floor plan.

## Implemented
- Settings Woning entry points for replacement discovery, active review resume, and activated-review rollback.
- Bounded review workspace with floor context, current/replacement plan comparison, room list, selected-room controls, readiness, activation, cancellation, and rollback.
- Direct use of generated OpenAPI TypeScript client contracts; no handwritten networking workaround, generated-file edit, or unrelated product scope was added.

## UX decisions
The workspace uses a fixed Settings-contained grid: room review rail, comparison/detail region, and readiness/actions rail. Lists and detail panels scroll internally so the Settings page does not become document-like.

## Review lifecycle
The UI resumes an active review before starting another one. Starting requires confirmation and states that the current plan remains active until activation succeeds.

## Room dispositions
All generated backend-owned dispositions are exposed with Dutch labels and saved immediately through generated client methods.

## Reuse review
Reuse candidates are shown only when the backend marks them available, with manual approval copy and a preserve/reset label-anchor choice.

## Redraw integration
The existing Room Overlay Editor is reused in review mode against the replacement asset. Saving a valid overlay calls the review-scoped attach method and returns to the same room context.

## Readiness
Readiness is derived from `validateFloorPlanReplacementReview`; local counts are only presented as progress context, not activation authority.

## Activation
Activation is enabled only after backend readiness is ready and uses the review-scoped activation method. Failed activation leaves the workspace intact.

## Cancel and rollback
Cancellation explains that the current plan remains active. Rollback uses generated review-scoped availability and rollback methods, never legacy direct asset rollback.

## Accessibility
Room filters are tabs, the room list is keyboard-accessible buttons, dispositions use radio-group semantics, readiness blockers use alerts, and dialogs use modal semantics with focus on the cancel action.

## Responsive behavior
Desktop uses a three-region bounded grid. Tablet collapses into stacked tab/list/detail regions. Phone hides plan precision comparison/drawing entry and shows the required larger-screen message.

## Tests
Focused frontend tests cover entry/resume/204 handling, labels, filtering, failed disposition preservation, reuse approval, redraw attach, readiness, activation, cancellation, rollback, and responsive/accessibility markers.

## Deferred scope
Runtime Klimaat in huis, readings, Stories, heating controls, provider mapping, Home Assistant setup, image registration, automatic geometry transformation, visual diffing, screenshots, and binary assets remain out of scope.

## Risks/limitations
The current safe plan preview does not perform visual polygon diffing; it communicates candidate/approved/trusted states with text while backend overlay attachment owns trust and activation.

## Modified files
- `src/HomeOps.Client/src/settings/FloorPlanReplacementReview.tsx`
- `src/HomeOps.Client/src/settings/floorPlanReplacementReviewApi.ts`
- `src/HomeOps.Client/src/settings/RoomOverlayEditor.tsx`
- `src/HomeOps.Client/src/settings/WoningManagement.tsx`
- `src/HomeOps.Client/src/styles.css`
- `src/HomeOps.Client/src/settings/FloorPlanReplacementReview.test.tsx`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
