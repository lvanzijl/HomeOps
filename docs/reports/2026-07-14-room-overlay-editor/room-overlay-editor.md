# Woning Climate Floor Plans Slice 6 — Settings Room Overlay Editor

## Summary
Implemented the frontend Settings-side room overlay editor for trusted floor-plan setup. The editor is entered from Settings > Woning for Floors with an active safe derivative and keeps upload/replacement, runtime climate rendering, Home Assistant setup, Stories, climate readings, and heating controls out of scope.

## Implemented
- Settings action for `Kamergrenzen tekenen` when a selected Floor has a usable active safe asset.
- Bounded editor workspace with Floor context, Room list, central safe-derivative canvas, toolbar, validation/review panel, archived overlay management, save state, and status/error messaging.
- Generated-client-backed API adapter for active assets, room overlays, geometry/anchor saves, and lifecycle actions.

## UX decisions
- The Room list is the primary non-canvas representation and stays visible beside the canvas on desktop/tablet.
- No active asset shows a clear blocked state and explicitly states upload belongs to a later slice.
- The editor uses explicit modes to avoid accidental point placement.

## Drawing tools
- Select Room, draw polygon, close with Enter, undo/cancel, rectangle helper, vertex handles, edge insertion handles, selected vertex deletion shortcut, whole-polygon move mode, pan mode label, zoom controls, fit, and center selected Room action.
- The rectangle helper creates a normal editable polygon.

## Validation behavior
- Local guidance covers too few points, self-intersection, bounds, trusted-overlay overlap approximation, small rooms, high point counts, and invalid label anchors.
- Backend validation remains authoritative through save/trust failures and backend validation wording normalization.
- Failed saves leave local geometry visible for retry.

## Trust lifecycle
- Supports Draft save, Valid geometry save, explicit Trusted action, NeedsReview, archive, restore, and destructive delete confirmation.
- Trusted overlays edited locally show downgrade copy before save/trust review.

## Label-anchor UX
- Supports `Kamernaam plaatsen` for manual anchor placement, automatic placement reset, and anchor revalidation against polygon containment.

## Accessibility
- Toolbar and Room rows are keyboard-accessible buttons.
- Validation messages are mirrored as text with `role="alert"` for blockers and status text for successful/neutral states.
- The safe derivative image and SVG canvas include accessible descriptions for the selected Floor and Room.
- Phone users receive clear copy that drawing works better on a larger screen.

## Responsive behavior
- Desktop uses a three-region bounded layout.
- Narrow screens collapse the grid and phone-sized viewports show the editing limitation copy while preserving setup/status navigation.

## Tests
- Added focused Vitest coverage for editor entry, no-asset blocked state, statuses, archived overlays, drawing/save retry, rectangle/anchor/lifecycle actions, list selection, and phone limitation.
- Ran focused editor tests, full frontend tests, and production frontend build.

## Risks/limitations
- The generated OpenAPI client currently types room overlay list/validation responses as `void`; the frontend adapter defensively normalizes runtime values from the generated methods rather than introducing backend API changes in this frontend-only slice.
- Canvas geometry editing is intentionally V1-level and does not include CAD snapping, holes, disconnected regions, or automatic detection.
- Local overlap highlighting is basic; backend trust remains the source of truth for positive-area overlap blockers.

## Deferred scope
Asset upload/replacement/activation review, runtime `Klimaat in huis`, room-state rendering, climate readings, Stories, heating controls, provider mapping UI, and Home Assistant setup.

## Modified files
- `src/HomeOps.Client/src/settings/WoningManagement.tsx`
- `src/HomeOps.Client/src/settings/RoomOverlayEditor.tsx`
- `src/HomeOps.Client/src/settings/roomOverlayEditorApi.ts`
- `src/HomeOps.Client/src/settings/RoomOverlayEditor.test.tsx`
- `src/HomeOps.Client/src/styles.css`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
