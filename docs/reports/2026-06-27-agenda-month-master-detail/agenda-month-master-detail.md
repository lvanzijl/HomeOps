# Agenda Month Master-Detail

## Summary
Implemented the first Agenda redesign slice: Agenda is now a month-first family planning workspace with a permanent selected-day detail panel on desktop. The month grid is the primary navigation surface, and the detail panel is the integrated day view.

## Preflight analysis
- `.github/copilot-instructions.md` was read before implementation.
- Preflight command passed: `export DOTNET_CLI_HOME=/tmp/dotnet && export PATH="$PATH:$HOME/.dotnet/tools" && dotnet --version` returned `10.0.301`.
- Current Agenda lived in `AgendaWidget` as a single component with loading, source filtering, create/edit/delete dialog state, a Week default view, and a Months grouped-list view.
- Events loaded through `loadCalendarAgendaData`, merged with demo read-only events, filtered by `useAgendaLayerSettings`, then hydrated with source metadata.
- Add-event used the existing conversation dialog and `createCalendarAgendaEvent`; save updated local `calendarEvents` state without backend/API contract changes.
- Existing view switching exposed Week and Months buttons; no standalone Day page existed in this widget.
- Existing responsive behavior was generic stacked widget/card behavior rather than Agenda-specific desktop master-detail.

## Root cause analysis
The old Agenda experience treated the calendar as a switchable event list. Week was the default operational surface and Months was a grouped list of events, so there was no stable month navigation model and no persistent day working surface. Add-event was global to the widget instead of contextual to the day being planned.

## Implementation plan
- Keep backend, API contracts, persistence, and business logic unchanged.
- Replace visible Week/Months switching with a month workspace.
- Build a complete-week seven-column month grid using Dutch weekday labels.
- Track selected day in widget state and update a permanent selected-day panel without route/view navigation.
- Move the primary add-event action into the detail panel and seed the existing event form with the selected date.
- Reuse the existing event list, edit, delete, create, validation, and local refresh mechanics.
- Add responsive CSS: fixed-width desktop detail panel and simple stacked mobile fallback.

## Implemented changes
- Month grid with Dutch weekday labels, complete weeks, today highlighting, selected-day highlighting, event counts, and click/tap selection.
- Permanent desktop detail panel showing the selected day, selected-day events, and a Dutch empty state.
- `Gebeurtenis toevoegen` now lives in the detail panel header and defaults the form date to the selected day; if no selected day exists, it falls back to today.
- Existing event creation/edit/delete persistence and local refresh behavior were preserved.
- The old Week/Months toggle and list-first month rendering are no longer part of the primary Agenda experience.
- Agenda tests were updated to validate selected-day behavior and the Dutch add-event flow.

## Desktop validation
Browser validation was completed with Playwright/Chromium after installing missing container browser libraries. No screenshots were saved.

### 1366×768
- Month grid visible: PASS
- Detail panel visible: PASS
- Selected day updates correctly: PASS (`zaterdag 27 juni 2026` to `donderdag 11 juni 2026`)
- Add-event uses selected date: PASS (`2026-06-11`)
- Today highlighting: PASS
- Selected-day highlighting: PASS
- Empty state visible for an empty selected day: PASS
- Desktop layout stability: PASS, but page-level scrolling remains.

### 1920×1080
- Month grid visible: PASS
- Detail panel visible: PASS
- Selected day updates correctly: PASS (`zaterdag 27 juni 2026` to `donderdag 11 juni 2026`)
- Add-event uses selected date: PASS (`2026-06-11`)
- Today highlighting: PASS
- Selected-day highlighting: PASS
- Empty state visible for an empty selected day: PASS
- Desktop layout stability: PASS.

## Browser measurements
| Viewport | Document height | Viewport height | Workspace height | Month grid height | Detail panel height | Page-level scrolling required |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 1366×768 | 961px | 768px | 558px | 558px | 313px | Yes |
| 1920×1080 | 1080px | 1080px | 558px | 558px | 313px | No |

## Acceptance criteria (PASS/FAIL)
- Month grid became the primary navigation surface: PASS.
- Detail panel became the integrated day view: PASS.
- Add-event correctly defaults to the selected day: PASS.
- Month grid remains visible while selecting days: PASS.
- No standalone Day view or Day mode introduced: PASS.
- Week view not implemented or expanded: PASS.
- List view not implemented or expanded: PASS.
- Backend/API/database/business logic unchanged: PASS.
- Dutch user-facing Agenda UI: PASS for touched Agenda UI.
- Desktop scrolling remains: PASS/known debt — 1366×768 still has page-level scrolling; 1920×1080 does not.

## Validation results
- `npm test -- --run src/widgets/components/AgendaWidget.test.tsx`: PASS.
- `npm run build`: PASS with existing Vite chunk-size warning.
- `git diff --check`: PASS.
- Browser validation at 1366×768 and 1920×1080: PASS with measured scroll caveat above.

## Remaining UX debt
- Reduce vertical chrome/spacing enough to remove page-level scrolling at 1366×768 if that becomes a hard requirement.
- Event indicators are simple counts only; richer family-friendly event indicators remain future work.
- Detail-panel event rows still inherit some schedule/list styling from the existing reusable event list.
- Mobile uses the simple stacked fallback rather than a full mobile planning redesign.

## Modified files
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.tsx`
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.test.tsx`
- `src/HomeOps.Client/src/styles.css`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-06-27-agenda-month-master-detail/agenda-month-master-detail.md`

## Binary artifact confirmation
No new binary artifacts were added. No screenshots were committed. The implementation added only text/code documentation and frontend source changes. Existing historical PNG files under `docs/reports/` predated this slice.

## Next work
Implement next in this order: Week workspace for Sunday evening planning, List workspace for chronological upcoming events, then event indicators/configuration once the core planning architecture is stable.
