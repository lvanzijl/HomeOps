# Tasks Time-First Workspace — 2026-06-27

## Summary
- Tasks became time-first instead of list-first: **YES**. Active tasks now render as Vandaag, Morgen, Deze week, Volgende week, and Later; recently completed tasks remain in Afgerond so reopening is still available.
- Today became the primary operational focus: **YES**. Vandaag is first, includes overdue and due-today tasks, and receives the strongest visual emphasis.
- Recurring-task behaviour remained unchanged: **YES**. The slice only changed grouping and presentation; recurrence create/update/delete-series handlers remain the existing frontend calls.
- Weekly Reset behaviour remained unchanged: **YES**. The existing contextual Weekreset panel and family reset entry remain secondary and use the same review handlers.
- Backend/API/schema remained unchanged: **YES**. No backend, generated contract, or database files were modified.
- Recommended next slice: validate a dedicated Weekly Reset UX pass separately, without mixing it into Tasks organisation.

## Preflight analysis
- Current Tasks implementation was a single React page backed by existing task APIs and local grouping utilities.
- Current task grouping was urgency/list-first: overdue, due today, upcoming, no-date, and completed recently.
- Current recurring-task behaviour was represented by `recurrenceFrequency` and `recurringTaskSeriesId`, with existing create/update payloads and delete-series action.
- Current completion flow used existing complete/reopen API calls and local task replacement after completion.
- Current Weekly Reset integration was a secondary expandable panel plus contextual navigation entry.
- Current task cards were compact list rows with title, owner/due/recurrence metadata, edit, delete-series, and done/reopen actions.
- Current responsive behaviour used flex/grid task rows with narrow-screen stacking.
- Preflight command result: `dotnet --version` returned `10.0.301`.

## Root cause analysis
Tasks previously answered “what exists?” more than “what should the family do next?” because the page grouped by generic urgency/list states and no-date maintenance. That made Today compete with overdue, upcoming, no-date review, completed history, templates, and Weekly Reset controls instead of acting as the operational starting point.

## Implementation plan
1. Replace urgency-first grouping with time-first operational groups.
2. Keep all existing task lifecycle handlers and API payloads unchanged.
3. Redesign cards to keep title, assignee, due timing, recurrence, and completion state compactly visible.
4. Make Vandaag visually strongest while keeping future groups calmer.
5. Update focused tests, state docs, roadmap docs, and this report.

## Implemented changes
- Added time-first grouping with Dutch section labels and empty-state copy.
- Updated Tasks page to render time sections and compact operational cards.
- Preserved edit, delete-series, complete/reopen, template, Someday, and Weekreset actions.
- Added CSS for Vandaag emphasis, quieter future sections, and compact metadata pills.
- Updated Tasks tests to cover the new grouping and Dutch UI labels.

## Browser validation
Browser validation was performed with Playwright against the Vite dev server using routed API fixtures. The temporary validation spec was deleted after use.

Validated viewports:
- 1366×768
- 1920×1080

Verified:
- Correct grouping: **PASS** — headings were Vandaag, Morgen, Deze week, Volgende week, Later, Afgerond.
- Today visual priority: **PASS** — Vandaag rendered with `today-focus`.
- Empty groups omitted: **PASS** — only groups with fixture tasks rendered.
- Task cards remain functional: **PASS** — card actions rendered and the completion button was clickable.
- Completion still works: **PASS** — the browser click issued the intercepted complete request.
- Recurring tasks still behave correctly: **PASS** — recurring fixture displayed Herhaalt wekelijks and delete-series UI remained available for recurring series.
- Weekly Reset behaviour unchanged: **PASS** — Weekreset entry remained visible and secondary.

## Browser measurements
- 1366×768: headings `[Vandaag, Morgen, Deze week, Volgende week, Later, Afgerond]`; card count `6`; document scroll height `1653`; viewport height `768`; completion calls after click `1`; Today class `task-group task-time-group today-focus`.
- 1920×1080: headings `[Vandaag, Morgen, Deze week, Volgende week, Later, Afgerond]`; card count `6`; document scroll height `1653`; viewport height `1080`; completion calls after click `2`; Today class `task-group task-time-group today-focus`.
- Scrolling is present at both sizes and acceptable for this slice.

## Acceptance criteria (PASS/FAIL)
- Time-first instead of person-first/list-first: **PASS**
- Today is primary operational focus: **PASS**
- Only populated sections shown: **PASS**
- Assignee appears inside task cards: **PASS**
- Existing completion preserved: **PASS**
- Existing editing preserved: **PASS**
- Existing deleting/recurring-series removal preserved: **PASS**
- Existing recurring logic unchanged: **PASS**
- Existing Weekreset integration unchanged: **PASS**
- Backend/API/schema unchanged: **PASS**
- No binary assets introduced: **PASS**
- No screenshots retained: **PASS**

## Validation results
- `dotnet --version`: PASS — `10.0.301`.
- `npm test -- taskGrouping.test.ts TasksPage.test.tsx`: PASS — 2 files, 9 tests.
- `npm run build`: PASS with existing Vite chunk-size warning.
- `git diff --check`: PASS.
- Browser validation: PASS after installing missing browser system libraries required by Playwright in the container.

## Remaining UX debt
- Weekreset itself still deserves a separate UX redesign pass.
- Templates/routinestarters remain secondary but could use a future Dutch-language polish pass beyond this organisational slice.
- Completed task history is intentionally minimal; a future slice may decide whether Afgerond belongs on Tasks long-term or behind a history affordance.

## Future compatibility assessment
The time-grouping utility is frontend-only and consumes existing `HouseholdTask` fields. It remains compatible with future shared task models because it does not introduce widget-specific data, backend fields, API contract changes, schema changes, recurrence logic changes, or Weekly Reset workflow changes.

## Modified files
- `src/HomeOps.Client/src/tasks/taskGrouping.ts`
- `src/HomeOps.Client/src/tasks/tasksModel.ts`
- `src/HomeOps.Client/src/tasks/TasksPage.tsx`
- `src/HomeOps.Client/src/styles.css`
- `src/HomeOps.Client/src/tasks/taskGrouping.test.ts`
- `src/HomeOps.Client/src/tasks/TasksPage.test.tsx`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-06-27-tasks-time-first-workspace/tasks-time-first-workspace.md`

## Binary artifact confirmation
No binary artifacts were added by this slice. Temporary browser validation files and Playwright output were deleted. Existing historical report screenshots in the repository were not touched.
