# Woning Climate Floor Plans Slice 16 — Climate Story Deep-Link Integration

## Summary
Implemented frontend-only climate Story deep-linking from Woning into the existing `Klimaat in huis` runtime workspace.

## Implemented
- Added a minimal `ClimateStoryDeepLink` contract in the frontend for Story ID, title, optional Floor ID, optional Room ID, optional translated climate context code, and timestamp.
- Added Story-aware entry from Woning summary into the runtime climate workspace.
- Added Story-context handling in `WoningClimatePage` with safe Floor/Room selection after live data loads.
- Added moved/missing target handling that keeps the climate workspace usable.
- Added focused tests for Story entry, live-state authority, fallback Rooms, missing/moved targets, dismissal, refresh, focus, and Settings escalation.

## UX decisions
The main Woning page remains Story-first and only exposes concise climate actions. The deep-dive continues to own floor plans, room lists, current climate facts, heating controls, diagnostics, and bounded next steps.

## Story navigation contract
The frontend Story link carries only safe navigation context: target workspace by invocation, optional Floor ID, optional Room ID, optional translated context code, and optional originating Story ID. It does not carry polygon coordinates, provider entity IDs, mapping IDs, raw errors, access tokens, Home Assistant payloads, or duplicated climate telemetry.

## Climate workspace integration
Story entry opens the existing `Klimaat in huis` page, selects the referenced Floor when valid, selects the referenced Room when valid, and shows the existing selected-Room detail and heating controls. No second climate detail implementation was introduced.

## Story context behavior
A compact, dismissible Story-context panel explains why the user arrived. It can be collapsed or dismissed and does not replace current room facts. Refresh keeps the original Story text while updating current read-model state.

## Missing/stale targets
When a Room is no longer on the referenced Floor, the runtime searches live Floor data and selects the current Floor if found. When the target cannot be resolved, the page keeps the climate workspace usable and shows a controlled household-safe notice.

## Live-state authority
Current temperature, humidity, freshness, provider, overlay, and heating-control state continue to come from generated climate read models and generated command/capability contracts. Stale Story text never overwrites current facts, and resolved Story contexts show factual resolved copy.

## Settings escalation
Configuration-related Story context codes show an explicit `Klimaatinstellingen openen` action wired to the existing Settings workspace path. The runtime does not auto-redirect and does not add a mapping editor or setup flow.

## Accessibility
The Story action is a real button. The context panel has a heading, keyboard controls, `role="status"` for current/resolved status, `role="alert"` for target-resolution notices, and focus moves to the context heading after Story navigation.

## Responsive behavior
The Story context is bounded and compact inside the climate workspace. Existing internal scrolling for floor plan, room list, and room detail is preserved; phone/tablet layouts keep the panel above the selected room detail/list flow without introducing page-level scrolling.

## Tests
- Focused Woning climate runtime and Story deep-link tests were added and run.
- Full frontend test/build validation is recorded in the final task response.

## Deferred scope
No backend Story generation, Story persistence, Story completion automation, recommendations, comfort scoring, automation, schedule editing, history, Home Assistant setup/discovery, weather/presence integration, screenshots, or binary assets were added.

## Risks/limitations
The existing workspace shell uses internal React state rather than a URL router for the Woning climate subview, so reloadable URL search-state restoration is not introduced in this slice. The implementation follows the existing workspace navigation convention and preserves back-to-Woning behavior inside that convention.

## Modified files
- `src/HomeOps.Client/src/WoningClimatePage.tsx`
- `src/HomeOps.Client/src/WoningClimatePage.test.tsx`
- `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx`
- `src/HomeOps.Client/src/styles.css`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-07-17-climate-story-deep-link/viewport-analysis.md`
- `docs/reports/2026-07-17-climate-story-deep-link/implementation.md`
