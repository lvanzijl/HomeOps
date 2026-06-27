# Tasks Morgen Action — 2026-06-27

## Summary
- Morgen became a real action: **YES**. For eligible non-recurring tasks, pressing Morgen now updates the existing task due date to tomorrow using the existing frontend update flow.
- Normal tasks: pressing Morgen moves the due date to tomorrow, updates local state, and the task moves to the Morgen group without a page refresh.
- Overdue tasks: pressing Morgen also moves the due date to tomorrow, clearing the overdue placement because the task leaves Vandaag and appears under Morgen.
- Recurring tasks: Morgen is hidden because the existing backend update endpoint edits recurring series/pending occurrence behavior rather than explicitly postponing one occurrence. No recurring schedule is modified.
- Backend/API/schema remained unchanged: **YES**. No backend, API contract, generated contract, or database schema files changed.
- Recommended next slice: add a dedicated, contract-backed single-occurrence recurring postpone workflow if families need postponing recurring chores.

## Preflight analysis
- Current completion flow uses `completeTask`/`reopenTask` and local state replacement; it is unchanged.
- Current edit flow uses `saveTask` (`PUT /api/tasks/{taskId}`) with title, due date, ownership, assignee, and recurrence fields.
- Current due-date persistence is available through the existing update-task API; no new API is needed for normal tasks.
- Current recurrence implementation has recurring task series generation and update behavior in the backend. The existing update endpoint can change series fields/pending occurrences when recurrence is enabled, but there is no explicit single-occurrence postpone contract.
- Current task model already includes `dueDate`, `recurrenceFrequency`, and `recurringTaskSeriesId`, which are enough to identify eligible non-recurring tasks and hide Morgen for recurring tasks.
- Conclusion: postponing normal/non-recurring tasks until tomorrow can be implemented with existing APIs; recurring single-occurrence postpone cannot be safely inferred from current contracts.
- Preflight command result: `dotnet --version` returned `10.0.301`.

## Root cause analysis
The previous slice exposed a disabled Morgen affordance because no workflow had been implemented yet. That made a visible primary card action non-functional. The frontend already had enough update capability for normal tasks, but recurring tasks needed protection because existing recurrence behavior is series-oriented rather than a clear single-occurrence postpone workflow.

## Implementation plan
1. Reuse the existing `saveTask` update flow for eligible non-recurring tasks.
2. Compute tomorrow from the current local date and send it as the updated `dueDate`.
3. Replace the updated task in local state so grouping changes immediately without page refresh.
4. Hide Morgen for completed, recurring, and already-due-tomorrow tasks.
5. Keep completion, editing, recurrence, and Weekly Reset logic unchanged.
6. Add focused tests, browser validation, documentation, and report.

## Implemented changes
- Added `moveTaskToTomorrow` in `TasksPage` using the existing `saveTask` helper.
- Wired eligible task cards to call `moveTaskToTomorrow`.
- Removed the disabled Morgen button from card rendering.
- Hid Morgen for recurring tasks, completed tasks, and tasks already due tomorrow.
- Added styling for the now-functional Morgen action while reusing existing FamilyBoard action button structure.
- Added Tasks test coverage for normal/overdue movement, recurring hiding, and already-tomorrow hiding.

## Browser validation
Browser validation was performed with Playwright against the Vite dev server using routed API fixtures. The temporary validation spec and Playwright output were deleted after validation.

Validated viewports:
- 1366×768
- 1920×1080

Verified:
- Normal task moves to Morgen: **PASS**.
- Overdue task moves to Morgen: **PASS**.
- Task leaves Vandaag: **PASS** for both normal and overdue fixtures.
- Task appears under Morgen: **PASS** for both normal and overdue fixtures.
- Recurring task behavior remains correct: **PASS** — recurring fixture retained recurring data and had no Morgen action.
- No disabled Morgen buttons remain: **PASS** — browser validation found zero disabled Morgen buttons.

## Acceptance criteria (PASS/FAIL)
- Functional Morgen action: **PASS**
- Normal tasks move due date to tomorrow: **PASS**
- Overdue tasks move due date to tomorrow and leave Vandaag: **PASS**
- Tasks already due tomorrow do not duplicate updates: **PASS**
- Recurring tasks do not expose Morgen without single-occurrence support: **PASS**
- No disabled Morgen buttons remain: **PASS**
- UI updates without page refresh: **PASS**
- Completion logic unchanged: **PASS**
- Recurrence engine unchanged: **PASS**
- Weekly Reset logic unchanged: **PASS**
- Backend/API/schema unchanged: **PASS**
- No binary assets introduced: **PASS**
- No screenshots retained: **PASS**

## Validation results
- `dotnet --version`: PASS — `10.0.301`.
- `npm test -- taskGrouping.test.ts TasksPage.test.tsx`: PASS — 2 files, 10 tests.
- `npm run build`: PASS with Vite chunk-size warning.
- `npm exec -- playwright test tasks-tomorrow-validation.spec.mjs --reporter=line`: PASS at 1366×768 and 1920×1080.
- `git diff --check`: PASS.

## Remaining UX debt
- Recurring chores still need a real single-occurrence postpone design and backend contract if families require that behavior.
- Already-tomorrow tasks intentionally hide Morgen; future UX may decide whether to show explanatory secondary text.

## Future compatibility assessment
The slice uses existing task update inputs and existing task model fields only. It does not add workflow-specific fields, backend endpoints, API contract changes, schema changes, recurrence engine changes, or Weekly Reset changes. A future recurring occurrence postpone feature can be added separately without changing the normal-task Morgen flow.

## Modified files
- `src/HomeOps.Client/src/tasks/TasksPage.tsx`
- `src/HomeOps.Client/src/styles.css`
- `src/HomeOps.Client/src/tasks/TasksPage.test.tsx`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-06-27-tasks-tomorrow-action/tasks-tomorrow-action.md`

## Binary artifact confirmation
No binary artifacts were added. No screenshots were retained. Temporary browser validation files and Playwright output were deleted before completion.
