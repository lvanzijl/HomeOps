# Agenda List Workspace

## Summary
- Implemented a non-default Agenda List workspace as the family's chronological reference timeline.
- Month remains the primary/default planning surface.
- Week remains the operational family planning workspace.
- List answers `Wat komt eraan?` with grouped upcoming events instead of a table, inbox, or second calendar.
- Existing event indicators, colours, icons, and FamilyBoard event cards are reused.
- Backend, API contracts, database schema, Google Calendar integration, event persistence, edit/delete flow, event indicator architecture, and event classification architecture remained unchanged.

## Preflight analysis
- Instruction preflight completed by reviewing `.github/copilot-instructions.md` and repository instructions.
- Environment preflight completed with `DOTNET_CLI_HOME=/tmp/dotnet`, `$HOME/.dotnet/tools` on `PATH`, and `dotnet --version` returning `10.0.301`.
- Month review: `MonthWorkspace`, `MonthGrid`, and `SelectedDayPanel` remain the default master-detail planning experience.
- Week review: `WeekWorkspace` remains the non-default operational planning workspace with seven day cards.
- Event rendering review: `AgendaEventList` is the shared FamilyBoard event-card renderer with edit/delete actions.
- Event indicator review: `getAgendaEventVisual` and `toEventVisualStyle` centralize all type icons, labels, and pastel colours.
- Filtering review: Agenda source visibility is selected through `useAgendaLayerSettings`; List reuses the existing Month/chronological `months` source selection to avoid a new backend layer contract.

## Root cause analysis
- After Month and Week, Agenda still lacked a reference surface for the simple family question: `What is coming next?`
- Month is spatial and date-oriented; Week is operational and pressure-oriented. Neither is optimized for a quick chronological scan.
- The missing surface was a timeline grouped by nearness, not a new calendar, table, inbox, or admin log.

## Implementation plan
1. Extend the workspace mode model with a non-default `list` mode.
2. Add `Lijst` navigation beside `Maand` and `Week` while preserving Month as the default.
3. Build pure chronological grouping helpers for `Vandaag`, `Morgen`, `Deze week`, `Volgende week`, and `Later`.
4. Omit empty groups and exclude past events from the upcoming timeline.
5. Reuse existing event cards and indicator helpers for recognisable cross-workspace presentation.
6. Add warm FamilyBoard timeline styling without changing Month or Week internals.
7. Add regression tests and browser validation for grouping, ordering, card reuse, indicator reuse, empty state, editing, and deleting.

## Implemented changes
- Added `Lijst` as a third Agenda workspace mode.
- Added `ListWorkspace` and `AgendaTimelineGroup` components.
- Added `buildTimelineGroups`, `getTimelineGroupKey`, and chronological sorting helpers.
- Grouped upcoming events into `Vandaag`, `Morgen`, `Deze week`, `Volgende week`, and `Later`, omitting empty groups.
- Reused `AgendaEventList` for timeline event cards so edit/delete behaviour is unchanged.
- Reused existing event indicators in group headers for fast visual scanning.
- Added timeline CSS for calm section headers, warm cards, a subtle timeline rail, and responsive stacking.
- Added Agenda tests covering List availability, Month/Week preservation, grouping, ordering, indicators, reused cards, empty state, editing dialog, and delete behaviour.
- Updated current-state and Phase 2 roadmap documentation.

## Browser validation
Browser validation was performed with Playwright/Chromium against the Vite dev server.

Validated viewports:
- 1366×768
- 1920×1080

Validated behaviours:
- List workspace is available from Agenda navigation.
- Month remains available and returns as the primary/default planning surface.
- Week remains available as the operational planning workspace.
- Timeline grouping is correct for populated groups: `Vandaag`, `Morgen`, `Volgende week`, and `Later`; empty `Deze week` was omitted as required.
- Events are chronologically ordered inside and across groups.
- Past events are omitted from the upcoming timeline.
- Existing event cards are reused.
- Existing event indicators are reused in timeline group headers.
- Empty state renders when no upcoming events exist.
- Editing still opens the existing `Gebeurtenis bewerken` dialog.
- Deleting still calls the existing delete flow and removes the event from the timeline.

## Browser measurements
| Viewport | Scenario | Document height | Workspace height | List workspace height | Timeline groups height | Page-level scrolling required |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| 1366×768 | populated timeline | 1707 px | 1645 px | 1371 px | 1247 px | Yes |
| 1920×1080 | populated timeline | 1707 px | 1645 px | 1371 px | 1247 px | Yes |
| 1366×768 | empty timeline | 768 px | 474 px | 200 px | n/a | No |

Scrolling is acceptable for List because the workspace is a chronological reference. The grouped headers keep the first scan readable even when the full timeline is taller than the viewport.

## Acceptance criteria (PASS/FAIL)
- PASS — List became the chronological family reference workspace.
- PASS — Month remained the primary planning surface and default workspace.
- PASS — Week remained the operational planning workspace.
- PASS — List was added beside Month and Week without becoming default.
- PASS — Timeline grouping was implemented and empty groups are omitted.
- PASS — Events appear in chronological order.
- PASS — Existing event indicators and cards were reused.
- PASS — Empty state is warm and FamilyBoard-oriented.
- PASS — Existing editing and deleting behaviour was maintained.
- PASS — Backend/API/schema remained unchanged.
- PASS — No binary assets or screenshots were added.

## Validation results
- `dotnet --version` preflight passed with `10.0.301`.
- Agenda component tests passed.
- Frontend production build passed with the existing Vite chunk-size warning.
- Browser validation passed at 1366×768 and 1920×1080.
- `git diff --check` passed.
- Diff and artifact checks confirmed no temporary files, screenshots, or new binary artifacts remained.

## Remaining UX debt
- List currently has no search, quick filters, archive view, or metadata filters.
- List uses existing event cards exactly, so very dense timelines can become tall.
- List has only a simple responsive fallback; mobile has not been redesigned.
- Add-event remains in the existing Month selected-day flow rather than being duplicated in List.

## Future compatibility assessment
- Grouping is isolated in pure helpers so future search, filtering, archived events, and richer event metadata can be layered without replacing the workspace.
- Reusing `AgendaEventList` keeps future event-card improvements consistent across Month, Week, and List.
- Reusing existing visual helpers preserves compatibility with future user-customisable event types.
- Recommended next slice: event indicators/settings discovery only after core Agenda surfaces are stable, or a dedicated Agenda mobile polish slice if desktop validation feedback is complete.

## Modified files
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.tsx`
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.test.tsx`
- `src/HomeOps.Client/src/styles.css`
- `docs/reports/2026-06-27-agenda-list-workspace/agenda-list-workspace.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

## Binary artifact confirmation
- No PNG, JPG, JPEG, GIF, WEBP, PDF, or screenshot artifacts were added.
- Only text-based source, test, CSS, and Markdown documentation files were changed.
