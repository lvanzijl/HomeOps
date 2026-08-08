# Phase 4 Slice 4.2 — Normal task archive/delete

## Outcome

Normal, non-recurring tasks now have a reversible archive lifecycle. Archiving removes a task from operational lists while preserving its title, due date, owner, completion state, and completion timestamp. Restore returns incomplete tasks to Active and completed tasks to Completed. Completion and motivation progress are not undone by archive, restore, or permanent record removal.

Permanent deletion is deliberately narrower: it is available only for an archived normal task and requires the explicit `confirmed=true` contract. Recurring occurrences and series cannot enter this lifecycle; their destructive scope remains deferred to Slice 4.4.

## API and persistence contract

- `GET /api/tasks/archived` lists archived non-recurring tasks for the current household.
- `POST /api/tasks/{taskId}/archive` rejects recurring tasks and archives only an operational task.
- `POST /api/tasks/{taskId}/restore` restores only an archived normal task.
- `DELETE /api/tasks/{taskId}?confirmed=true` permanently removes only an archived normal task.
- Operational edit, completion, reopen, no-date review, and series routes no longer load archived records.
- The existing `NoDateReviewState.Archived` and `ArchivedUtc` fields are authoritative, so no schema migration was needed. Household and family-member dependencies remain untouched.

OpenAPI and the TypeScript client were regenerated twice with pinned NSwag 14.7.1; the second run produced identical SHA-256 hashes.

## Bounded Tasks interaction

The implementation follows `docs/reports/2026-08-08-tasks-interaction-analysis/viewport-analysis.md`. Normal task More menus now contain Archive. Recurring task menus do not imply normal archive support and retain their routine-series action.

One compact `Archief` tile was added to the existing horizontal secondary rail. It opens an internally scrolling dialog with direct Restore and Permanent delete actions. Permanent delete first replaces the list with a task-specific confirmation and clear irreversible consequence. Cancellation returns to the archive list; an API failure retains the selected task and states that the archived record remains safe. The default command band and Today/Planning grid did not change.

The archive flow also exposed a menu timing edge after restore. Portalled menu focus now uses `preventScroll`, so focus cannot trigger the menu's own scroll-close behavior.

## Validation

- Focused normal-task archive API tests: 3/3 passed.
- Focused Tasks frontend tests: 15/15 passed.
- Full backend tests: 625/625 passed.
- Full frontend tests with the repository extended timeout: 345/345 passed.
- Frontend production build: passed.
- Full solution build: passed with the pre-existing `SQLitePCLRaw.lib.e_sqlite3` NU1903 advisory warning and no errors.
- PostgreSQL migration/model-drift tests: 3/3 passed through Rancher Desktop.
- PostgreSQL-backed Playwright smoke suite: 7/7 passed, including archive, restore, cancellation, confirmed deletion, and no document overflow at 1280×720; established primary-page checks at 1440×900 and 1366×768 also passed.
- Pinned NSwag 14.7.1: two runs passed; second run idempotent.

No migration, screenshot, video, binary, or unrelated feature artifact is part of the slice.
