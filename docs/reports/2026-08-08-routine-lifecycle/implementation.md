# Phase 4 Slice 4.3 — Routine/template lifecycle

## Outcome

Routines now have a dedicated ordered-item editor and a complete reversible lifecycle inside the existing bounded Tasks `Routines` surface. The editor does not reuse the single-task conversation. It captures routine name, optional description, and one or more independently configured steps, with add, edit, remove, and reorder controls before save.

Each step stores title, owner, optional family member, recurrence, and optional start offset. The server rejects empty routines, blank titles, duplicate trimmed titles case-insensitively, invalid family-member assignments, and offsets outside 0–365 days. A recurring step remains a supported routine definition and creates its existing recurring series when applied; occurrence-level mutation scope remains Slice 4.4.

## Prospective edit contract

Routine definitions are reusable blueprints, not live parents of already-created tasks. Editing a routine affects future applications only. Existing one-off tasks and recurring series retain the values that were copied when they were created. The editor states this explicitly, and backend coverage applies a routine before and after editing to prove both versions remain independently represented.

## Lifecycle contract

- `GET /api/task-templates` returns active routines.
- `GET /api/task-templates/archived` returns archived routines with their ordered steps.
- `POST /api/task-templates/{templateId}/archive` accepts only an active routine.
- `POST /api/task-templates/{templateId}/restore` accepts only an archived routine.
- `DELETE /api/task-templates/{templateId}?confirmed=true` permanently deletes only an archived routine.
- Update and apply exclude archived routines; update can no longer toggle archive state implicitly.
- Permanent deletion explicitly removes managed routine steps with the archived definition and does not alter previously created tasks.

The existing `IsArchived` field and step relationship were sufficient, so no migration was required. OpenAPI and the TypeScript client were regenerated twice with pinned NSwag 14.7.1; the second run produced identical hashes.

## Bounded interaction

The implementation follows `docs/reports/2026-08-08-tasks-interaction-analysis/viewport-analysis.md`. The default command band, Today/Planning grid, and horizontal secondary rail are unchanged. The existing `Routines` tile opens active/archive tabs, the ordered editor, internally scrolling lists, and a routine-specific permanent-delete confirmation. Cancellation returns to the archived list; failed deletion retains the selected routine and explains that it remains safe.

The portalled task menu now distinguishes deliberate user scroll from browser element positioning: wheel/touch scrolling closes it, while synthetic positioning scroll cannot detach it before an action click. Focus still uses `preventScroll`, and outside interaction plus Escape behavior remain unchanged.

## Validation

- Focused routine API tests: 8/8 passed.
- Focused Tasks frontend tests: 19/19 passed.
- Full backend tests: 628/628 passed.
- Full frontend tests with the repository extended timeout: 349/349 passed.
- Frontend production build: passed.
- Full solution build: passed with the pre-existing `SQLitePCLRaw.lib.e_sqlite3` NU1903 advisory warning and no errors.
- PostgreSQL migration/model-drift tests: 3/3 passed through Rancher Desktop.
- PostgreSQL-backed Playwright smoke suite: 8/8 passed, including ordered creation/editing, archive, restore, cancellation, confirmed deletion, and no document overflow at 1280×720; established primary-page checks at 1440×900 and 1366×768 also passed.
- Pinned NSwag 14.7.1: two runs passed; second run idempotent.

No migration, screenshot, video, binary, or unrelated feature artifact is part of this slice.
