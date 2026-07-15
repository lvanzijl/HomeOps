# Runtime Room Climate — Woning Climate Floor Plans Slice 10

## Summary
Implemented the frontend-only, read-only `Klimaat in huis` runtime deep-dive for FamilyBoard Woning. The main Woning surface remains Story-first and exposes only a concise factual climate entry point.

## Implemented
- Added a Woning summary entry with unavailable/stale floor summary and `Klimaat bekijken` navigation.
- Added a runtime climate workspace that loads generated Household/Floor climate read-model contracts directly.
- Added one-floor-at-a-time floor selection, floor summary counts, active-plan rendering, trusted overlay filtering, room-list fallback, selected-room details, loading, refresh, and retry states.

## UX decisions
- The deep-dive is factual and read-only: no heating controls, schedules, recommendations, comfort scores, Stories, charts, weather, presence, or Home Assistant setup were added.
- The main Woning page stays a short household status surface and does not become an engineering dashboard.

## Floor navigation
Floors render in the backend-provided canonical order from the Household climate summary. Manual refresh preserves the selected floor where possible.

## Floor-plan rendering
Runtime rendering uses the active asset derivative URL and only Trusted overlays that match both the active asset and the room read model's trusted overlay reference. Replaced/inactive asset overlays and non-trusted geometry are not rendered.

## Room-list fallback
The room list is complete and remains available for every room, including rooms with no active plan, unconfigured geometry, intentional non-spatial status, or needs-review overlays.

## Room climate presentation
Room rows show room name, current temperature, optional humidity and target, operating state, freshness, configuration/provider issue text, and spatial fallback state. Selected-room details expose the same facts with timestamps when available.

## Freshness and operating states
Generated freshness states are mapped to Dutch labels: `Actueel`, `Wordt ouder`, `Verouderd`, and `Niet beschikbaar`. Generated operating states are mapped to `Onbekend`, `In rust`, `Verwarmen`, `Koelen`, and `Niet beschikbaar`. No local heating/cooling inference was added.

## Missing/partial data
The UI explicitly handles no configuration, disabled climate, no observation, unavailable provider, no active floor plan, room-list fallback, intentionally not drawn, and overlay-needs-review states with household-facing Dutch copy.

## Accessibility
The floor selector, room list, refresh/retry actions, and overlays are buttons with text labels. Loading and refresh status use `role="status"`; failures use `role="alert"`; the room list is a complete non-canvas representation; status labels do not rely on color alone.

## Responsive behavior
Desktop uses bounded plan, room-list, and selected-room detail regions with internal overflow. Tablet collapses the grid into stacked bounded regions. Phone prioritizes the room list and keeps plan/detail secondary while preserving all climate facts.

## Tests
Focused frontend tests cover entry navigation, deterministic floor order, factual summaries, runtime values, generated operating/freshness labels, active trusted overlay rendering, replaced overlay suppression, list/overlay selection, no-active-plan fallback, manual refresh, and missing/provider-unavailable copy. Production frontend build passed.

## Deferred scope
Heating controls, temporary target changes, schedules, Stories, comfort scoring, recommendations, historical charts, Home Assistant setup, provider mapping, weather, presence, window sensors, energy optimization, screenshots, binary assets, and floor-plan editing remain out of scope.

## Risks/limitations
The implementation depends on the generated Room/Floor/Household climate read-model contracts already present in the client. It intentionally uses the generated API client directly and did not add handwritten fetch calls or local enum duplicates. Runtime plan zoom controls were not introduced because no zoom interaction was required for this slice's bounded baseline.

## Modified files
- `src/HomeOps.Client/src/WoningClimatePage.tsx`
- `src/HomeOps.Client/src/WoningClimatePage.test.tsx`
- `src/HomeOps.Client/src/woningClimateApi.ts`
- `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx`
- `src/HomeOps.Client/src/styles.css`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-07-15-runtime-room-climate/README.md`
