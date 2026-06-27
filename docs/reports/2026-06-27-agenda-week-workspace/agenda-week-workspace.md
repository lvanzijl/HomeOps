# Agenda Week Workspace

## Summary
- Implemented a non-default Agenda Week workspace for family planning and Sunday-evening-style weekly awareness.
- Month remains the primary Agenda planning surface and default workspace.
- Week displays seven simultaneous day cards from Monday through Sunday; it does not use an hourly timeline, drag-and-drop, or schedule editing.
- Existing event indicators, icons, colours, and event cards are reused from the Month workspace.
- Backend, API contracts, database schema, Google Calendar integration, event persistence, editing flow, and event-type classifier architecture remained unchanged.

## Preflight analysis
- Instruction preflight completed: `.github/copilot-instructions.md` and the provided repository instructions were reviewed before implementation.
- Environment preflight completed: `DOTNET_CLI_HOME=/tmp/dotnet`, `$HOME/.dotnet/tools` was appended to `PATH`, and `dotnet --version` returned `10.0.301`.
- Current Month workspace review:
  - `AgendaWidget` owns Agenda data loading, source filtering, selected date state, create/edit/delete handlers, and workspace rendering.
  - Month is implemented as a master-detail workspace with `MonthWorkspace`, `MonthGrid`, and `SelectedDayPanel`.
  - Month cells use `getAgendaEventVisual` and `toEventVisualStyle` for compact type-aware indicators and overflow.
- Current event rendering review:
  - `AgendaEventList` renders reusable FamilyBoard-style event cards with type label, icon, pastel visual treatment, and edit/delete actions.
- Current event classification review:
  - Classification is frontend-only and derived from existing event source metadata plus title/source-name matching rules.
  - No persisted event type exists and none was added.
- Current selected-day panel review:
  - The panel is the integrated day view for Month and owns contextual add-event entry.
- Current responsive review:
  - Month has a desktop two-column layout with a stacked fallback below the existing breakpoint.

## Root cause analysis
- The previous Month slice intentionally removed the old week/list switching experience so Agenda could become month-first.
- The product gap after that slice was not data or persistence; it was a missing operational planning surface for families to scan the coming week.
- A Google-calendar-style timeline would overemphasize precise scheduling and violate the family-planning goal, so Week needed a distinct card-based layout.

## Implementation plan
1. Add a workspace-mode toggle while keeping Month as the default active mode.
2. Add a Week workspace component that builds a Monday-start seven-day week from an anchor date.
3. Add previous/current/next week navigation with Dutch labels and FamilyBoard button styling.
4. Reuse existing event indicator and event-card helpers instead of duplicating classification logic.
5. Show compact day cards with day name, date, indicators, summary, limited event cards, overflow copy, and quiet-day states.
6. Add warm Week-specific CSS while avoiding backend, schema, API, persistence, classifier-architecture, and editing-flow changes.
7. Extend Agenda tests to cover Week layout, navigation, reused indicators, overflow, empty week state, and Month remaining available.

## Implemented changes
- Added a non-default `Week` Agenda workspace mode beside the default `Maand` mode.
- Added Monday-through-Sunday week construction and week-range formatting helpers.
- Added `WeekWorkspace` with previous/current/next week navigation and a calm empty-week state.
- Added `WeekDayCard` for compact FamilyBoard planning cards.
- Reused `getAgendaEventVisual`, `toEventVisualStyle`, `AgendaEventList`, and existing edit/delete actions inside Week cards.
- Added Week workspace styling for seven-column desktop layout, warm cards, quiet-day states, compact nested event cards, and simple responsive fallback.
- Updated Agenda regression tests to cover the Week workspace.
- Updated project state and Phase 2 roadmap documentation.

## Browser validation
Browser validation was performed with Playwright/Chromium against the Vite dev server.

Validated viewports:
- 1366×768
- 1920×1080

Validated behaviours:
- Seven simultaneous day cards rendered Monday through Sunday.
- Previous/current/next week navigation worked.
- Event indicators appeared in Week day cards.
- Busy day displayed as visually denser than quiet days through indicators, summary, and compact event cards.
- Quiet days displayed calm `Rustige dag` states.
- Empty future week displayed `Een rustige week in zicht`.
- Month remained available and active when returning to `Maand`.
- Existing event colours and FamilyBoard card treatment remained consistent with Month.

## Browser measurements
| Viewport | Document height | Workspace height | Week workspace height | Week grid height | Page-level scrolling required |
| --- | ---: | ---: | ---: | ---: | --- |
| 1366×768 | 1276 px | 1214 px | 940 px | 817 px | Yes |
| 1920×1080 | 1276 px | 1214 px | 940 px | 817 px | Yes |

Scrolling is acceptable for this richer planning workspace. The first overview remains scannable because all seven day cards are visible simultaneously in the desktop grid.

## Acceptance criteria (PASS/FAIL)
- PASS — Week became a family planning workspace rather than a traditional calendar timeline.
- PASS — Month remained the primary planning surface and default Agenda workspace.
- PASS — Week navigation supports previous week, current week, and next week.
- PASS — Seven day cards are visible simultaneously on desktop.
- PASS — Existing event indicators were reused.
- PASS — Event colours, icons, and FamilyBoard event cards remain consistent with Month.
- PASS — Empty week and quiet day states are warm and non-technical.
- PASS — Backend/API/schema changes were avoided.
- PASS — Google Calendar integration, event persistence, event editing flow, and classifier architecture remained unchanged.
- PASS — No binary assets or screenshots were added.

## Validation results
- `dotnet --version` preflight passed with `10.0.301`.
- Agenda component tests passed.
- Frontend production build passed with the existing Vite chunk-size warning.
- Browser validation passed at 1366×768 and 1920×1080.
- `git diff --check` passed.
- Diff and artifact discipline checks confirmed no screenshots or binary report artifacts were introduced.

## Remaining UX debt
- Week is currently card-based and intentionally not editable beyond existing event edit/delete actions.
- Week does not yet provide deeper Sunday-evening planning prompts, family assignments, reminders, or pressure summaries.
- Week uses information density for busy/quiet awareness; no explicit stress score was introduced.
- Mobile keeps a simple stacked fallback and has not received a dedicated redesign.

## Future compatibility assessment
- The Week workspace reuses shared event visual helpers and event-card rendering, so future List and Week refinements can build on the same visual language.
- Because no event-type persistence was introduced, future user-customisable event types can be added later without migrating this slice's data.
- The recommended next slice is the List workspace as the chronological upcoming-events reference, followed by optional richer event indicators/customisation only after the core Agenda surfaces are complete.

## Modified files
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.tsx`
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.test.tsx`
- `src/HomeOps.Client/src/styles.css`
- `docs/reports/2026-06-27-agenda-week-workspace/agenda-week-workspace.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

## Binary artifact confirmation
- No PNG, JPG, JPEG, GIF, WEBP, PDF, or screenshot artifacts were added.
- Only text-based source, test, CSS, and Markdown documentation files were changed.
