# Agenda Event Indicators

## Summary
Implemented the family-friendly event indicator slice for the Agenda month workspace. Month cells now show compact event-type icons instead of simple event-count text, overflow is capped with a `+N` pill, and selected-day events use warmer type-aware FamilyBoard cards.

## Preflight analysis
- `.github/copilot-instructions.md` was read before implementation.
- Preflight command passed: `export DOTNET_CLI_HOME=/tmp/dotnet && export PATH="$PATH:$HOME/.dotnet/tools" && dotnet --version` returned `10.0.301`.
- Current Agenda month implementation already used a month master-detail layout with `MonthWorkspace`, `MonthGrid`, and `SelectedDayPanel` inside `AgendaWidget`.
- Current month cells rendered only simple count text such as `1 gebeurtenis` or the empty text `Rustige dag`.
- Current detail-panel events reused the older list row treatment with source dot, title, time/source/editable metadata, and edit/delete controls.
- Current event model has no persisted event type/category field. Available frontend metadata is title, source type, source name, all-day flag, source capability, description, location, and source colour.
- Google Calendar remains represented only as an existing source type in frontend mapping. This slice consumes existing metadata only and does not alter Google Calendar integration.
- No centralized title-prefix categorisation helper was found. This implementation adds a frontend-only derived classifier using source type first, then title/source keyword patterns.

## Implementation plan
- Add frontend-only event visual classification with stable type ids, Dutch labels, text/emoji icons, and soft pastel colour tokens.
- Keep classification derived from existing source metadata and title keywords so future persisted/custom event types can replace the classifier without changing month/detail render contracts.
- Replace month-cell event counts with up to three event indicators and an overflow `+N` pill.
- Upgrade selected-day event rows to type-aware FamilyBoard cards while preserving edit/delete functionality.
- Keep backend, API contracts, database schema, Google Calendar integration, event persistence, and event editing flow unchanged.
- Add Agenda regression coverage for indicators, overflow, and detail-panel type labels.

## Implemented changes
- Replaced simple count text in populated month cells with event-type indicators.
- Implemented overflow behavior: month cells show at most three indicators and then `+N` for additional events.
- Added frontend-only type visual language for Birthday, Holiday, School, Sports, Medical, Shopping, Family, Work, Media, and General events.
- Improved selected-day event presentation with larger icons, type labels, pastel card backgrounds, softer borders, clearer hierarchy, and preserved edit/delete buttons.
- Warm empty state remains for no-event selected days.
- Cleaned prior Agenda component issues in the touched file: duplicate source checkbox `checked` prop and internal Dutch/English mixed `isBewerkening` naming.

## Browser validation
Browser validation was completed with Playwright/Chromium using temporary route stubs for deterministic event data. No screenshots were saved.

### 1366×768
- Month indicators visible: PASS
- Overflow indicator works: PASS (`+2`)
- Event colours applied: PASS
- Detail panel styling updated: PASS (5 type-card icons rendered)
- Empty state visible: PASS
- Desktop layout preserved: PASS
- Master-detail behavior preserved: PASS
- Page-level scrolling: still required

### 1920×1080
- Month indicators visible: PASS
- Overflow indicator works: PASS (`+2`)
- Event colours applied: PASS
- Detail panel styling updated: PASS (5 type-card icons rendered)
- Empty state visible: PASS
- Desktop layout preserved: PASS
- Master-detail behavior preserved: PASS
- Page-level scrolling: not required

### Browser measurements
| Viewport | Document height | Viewport height | Workspace height | Month grid height | Detail panel height | Page-level scrolling required |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 1366×768 | 978px | 768px | 642px | 642px | 576px | Yes |
| 1920×1080 | 1080px | 1080px | 642px | 642px | 576px | No |

## Acceptance criteria (PASS/FAIL)
- Event counts were replaced by event indicators: PASS.
- Overflow behaviour was implemented: PASS.
- Detail panel became more family-friendly: PASS.
- Event colours are consistent, soft, and type-aware: PASS.
- Empty state remains warm and non-technical: PASS.
- Desktop master-detail layout preserved: PASS.
- Backend/API/schema changes were avoided: PASS.
- Existing event persistence and editing flow preserved: PASS.
- Week workspace not implemented: PASS.
- List workspace not implemented: PASS.
- Event-type editor/settings not implemented: PASS.

## Validation results
- `npm test -- --run src/widgets/components/AgendaWidget.test.tsx`: PASS.
- `npm run build`: PASS with existing Vite chunk-size warning.
- Browser validation at 1366×768 and 1920×1080: PASS with measured scroll caveat above.
- `git diff --check`: PASS.

## Remaining UX debt
- 1366×768 still requires page-level scrolling, and the richer detail cards increased measured detail-panel height.
- Emoji/text icons are appropriate for this no-assets slice but may later need a designed SVG icon system for visual consistency.
- Keyword-derived categorisation can misclassify ambiguous titles until future explicit event-type metadata/settings exist.
- Month cells show compact indicators only; no tooltip/popover preview was added in this slice.

## Future compatibility assessment
The event visual language is derived in one frontend helper that returns a stable type id, Dutch label, icon, and colour tokens. Future Week/List workspaces can reuse that helper immediately, and future user-customisable event types can replace or extend the helper without changing the existing backend contracts in this slice. A future persisted event-type field can be introduced later by making the classifier prefer explicit metadata over title/source inference.

## Modified files
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.tsx`
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.test.tsx`
- `src/HomeOps.Client/src/styles.css`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-06-27-agenda-event-indicators/agenda-event-indicators.md`

## Binary artifact confirmation
No new binary artifacts were added. No screenshots were committed. Temporary browser validation files were deleted before completion.

## Recommended next slice
The recommended next slice is the Week workspace for Sunday evening planning, reusing the event visual classification introduced here. List workspace should follow after Week, with user-customisable event types deferred until the planning surfaces are stable.
