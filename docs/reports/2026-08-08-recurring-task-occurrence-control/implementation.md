# Phase 4 Slice 4.4 — recurring-task occurrence control

## Outcome

Recurring task edits and removals now require an explicit scope: `Occurrence`, `ThisAndFuture`, or `EntireSeries`. The previous implicit whole-series update and unconfirmed series-delete route were replaced by scoped contracts. Completed task history and its motivation effects remain intact.

## Persistence and projection

`RecurringTaskExceptions` records modified or skipped original due dates. A modified exception keeps the selected task identity plus its replacement title, due date, ownership, family member, and decorative avatar. A skipped exception reserves the original due date so normal generation cannot recreate it. The generator projects both types deterministically.

`RecurringTaskSeries.EndDate` is an inclusive series boundary. `ThisAndFuture` updates split the definition at the selected original occurrence: the old series ends immediately before it and a new series starts from the confirmed draft. `ThisAndFuture` removal ends the series without altering earlier occurrences. Entire-series edits regenerate incomplete occurrences from the updated definition; entire-series removal marks the series deleted and removes only incomplete occurrences. Completed occurrences always remain history.

Occurrence-only edits cannot change frequency, collide with another occurrence date, or rewrite completed history. Frequency changes therefore require `ThisAndFuture` or `EntireSeries`. Every destructive scope requires `Confirmed = true`. The migration `20260808080048_AddRecurringTaskOccurrenceControl` adds only the boundary and exception persistence, with unique original-date and replacement-task constraints.

## Bounded interaction

The implementation follows `viewport-analysis.md` in this report directory. The default command band, Today/Planning grid, task cards, and secondary rail are unchanged. Recurring edit submission and `Herhaling beheren` open one bounded scope dialog with internally owned overflow. It uses the task equivalents of the Agenda meanings: `Alleen deze taak`, `Deze en volgende`, and `Hele reeks`.

Edit cancellation returns to the populated editor. Removal requires a task-specific checkbox before the final button is enabled. Failed requests retain scope, confirmation, and explanatory error state. Completed occurrences expose only entire-series management; occurrence-only scope is also unavailable when the draft changes recurrence frequency.

## Validation

- Focused recurring-task API tests: 15/15 passed.
- Focused Tasks frontend tests: 21/21 passed.
- Full backend tests: 633/633 passed.
- Full frontend tests with the repository extended timeout: 351/351 passed.
- Frontend production build: passed.
- Full solution build: passed with the pre-existing `SQLitePCLRaw.lib.e_sqlite3` NU1903 advisory warning and no errors.
- PostgreSQL migration baseline tests through Rancher Desktop: 3/3 passed.
- EF pending-model-change check: passed.
- PostgreSQL-backed Playwright smoke suite: 9/9 passed, including occurrence edit, explicit destructive scope, confirmation gating, and no document overflow at 1280×720; established 1440×900 and 1366×768 checks also passed.
- Pinned NSwag 14.7.1: two final runs passed; the second run was hash-identical.

No screenshot, video, binary, cache, or unrelated feature artifact is part of this slice.
