# Tasks Task Card Redesign — 2026-06-27

## Summary
- Task cards became visually richer: **YES**. Active cards now have a warm visual rail, icon slot, status line, compact metadata chips, and grouped actions.
- Action presentation improved: **YES**. Complete, edit, more, and future-ready Morgen actions now render as FamilyBoard-style pill buttons instead of plain row buttons.
- Recurring tasks became easier to recognise: **YES**. Recurring cards receive a recurring class, visual rail variation, icon-slot variation, and `Herhaalt ...` metadata chip.
- Prepared for future FamilyBoard SVG icons: **YES**. Icons are isolated behind `TaskCardIcon` and `TaskActionIcon` components so placeholder text can later be replaced with SVG assets without changing card layout.
- Backend/API/schema remained unchanged: **YES**. Only frontend page, style, tests, and documentation files changed.
- Recommended next slice: design a production FamilyBoard SVG icon set for task states/actions, then replace the placeholder icon slots without changing card structure.

## Preflight analysis
- Current Tasks page already uses time-first grouping and existing task lifecycle handlers.
- Current task cards are compact but still read as list rows with simple metadata pills and separate text buttons.
- Current action buttons preserve completion, reopening, editing, and recurring series deletion but lack touch-friendly visual hierarchy.
- Current recurring task presentation is text-only through the recurrence metadata chip.
- Current task metadata includes assignee, due timing, recurrence, and completion state but needs stronger visual grouping.
- Current completion flow calls the existing complete/reopen API helpers and must remain unchanged.
- Preflight command result: `dotnet --version` returned `10.0.301`.

## Root cause analysis
The time-first slice fixed organisation, but individual cards still looked like functional checklist rows. Users could scan dates, but recurring status, card identity, and action affordances did not yet feel like FamilyBoard touch targets. The card needed a richer visual hierarchy without changing task workflow or data.

## Implementation plan
1. Keep time-first grouping and lifecycle handlers unchanged.
2. Add a richer card shell with visual rail, icon slot, content area, metadata chips, and grouped action area.
3. Improve action buttons while preserving complete/reopen/edit/delete-series calls.
4. Add disabled, future-ready Morgen affordance because no postpone-one-day backend behavior exists.
5. Isolate placeholder icon rendering behind replaceable components for future SVG assets.
6. Update focused tests, docs, report, and run browser validation.

## Implemented changes
- Added rich active task card structure with `rich-task-card`, `task-card-visual`, `task-card-content`, and `task-card-actions`.
- Added reusable `TaskCardIcon`, `TaskActionIcon`, and `TaskMetadataChip` components.
- Added distinct recurring card styling and recurring metadata treatment.
- Replaced plain card buttons with touch-friendly action pills for Klaar/Terugzetten, Morgen, Aanpassen, and Meer/Routine verwijderen.
- Kept Morgen disabled with explanatory title because backend postpone behavior does not exist in this slice.
- Updated focused tests to verify recurring metadata, disabled Morgen affordance, and recurring more action presentation.

## Browser validation
Browser validation was performed with Playwright against the Vite dev server using routed API fixtures. The temporary validation spec and Playwright output were deleted after validation.

Validated viewports:
- 1366×768
- 1920×1080

Verified:
- Richer task cards: **PASS** — `.rich-task-card` rendered for task fixtures.
- Action buttons remain functional: **PASS** — completion click issued the intercepted complete request.
- Edit remains functional: **PASS** — Aanpassen opened the existing `Taak aanpassen` dialog.
- Recurring visualization improved: **PASS** — recurring fixture rendered `.is-recurring` and `Herhaalt wekelijks`.
- Metadata readability improved: **PASS** — assignee, due timing, and completion chips were visible.
- Completion still works: **PASS** — complete request count increased at both viewport validations.
- Existing recurrence unchanged: **PASS** — recurrence was displayed only from existing `recurrenceFrequency`; no recurrence API or logic changed.

## Browser measurements
- 1366×768: cards `4`; action buttons `16`; metadata chips `13`; document scroll height `1404`; viewport height `768`; first card metadata `[Hele gezin, Vandaag, Openstaand]`; completion calls after click `1`; Morgen disabled `true`; edit dialog visible `true`; recurring chip visible `true`.
- 1920×1080: cards `4`; action buttons `16`; metadata chips `13`; document scroll height `1300`; viewport height `1080`; first card metadata `[Hele gezin, Vandaag, Openstaand]`; completion calls after click `2`; Morgen disabled `true`; edit dialog visible `true`; recurring chip visible `true`.

## Acceptance criteria (PASS/FAIL)
- Rich task cards: **PASS**
- Better action presentation: **PASS**
- Better metadata presentation: **PASS**
- Improved recurring visualization: **PASS**
- FamilyBoard visual hierarchy: **PASS**
- Completion logic unchanged: **PASS**
- Recurrence logic unchanged: **PASS**
- Weekly Reset logic unchanged: **PASS**
- Backend/API/schema unchanged: **PASS**
- Future SVG icon replacement prepared: **PASS**
- No binary assets introduced: **PASS**
- No screenshots retained: **PASS**

## Validation results
- `dotnet --version`: PASS — `10.0.301`.
- `npm test -- taskGrouping.test.ts TasksPage.test.tsx`: PASS — 2 files, 9 tests.
- `npm run build`: PASS with Vite chunk-size warning.
- `npm exec -- playwright test tasks-card-validation.spec.mjs --reporter=line`: PASS at 1366×768 and 1920×1080.
- `git diff --check`: PASS.

## Remaining UX debt
- Placeholder text icon slots should be replaced by production FamilyBoard SVG assets in a dedicated iconography slice.
- Morgen remains disabled until a real postpone-one-day workflow exists.
- Completed tasks remain on the main page unchanged; a future UX review should decide whether Afgerond stays visible.

## Future compatibility assessment
The card layout is structured around replaceable icon components and existing task fields. It does not introduce new task data, widget-specific models, backend endpoints, API contract changes, database schema changes, recurrence changes, or Weekly Reset changes.

## Modified files
- `src/HomeOps.Client/src/tasks/TasksPage.tsx`
- `src/HomeOps.Client/src/styles.css`
- `src/HomeOps.Client/src/tasks/TasksPage.test.tsx`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-06-27-tasks-task-card-redesign/tasks-task-card-redesign.md`

## Binary artifact confirmation
No binary artifacts were added. No screenshots were retained. Temporary browser validation files and Playwright output were deleted before completion.
