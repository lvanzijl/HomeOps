# Honest asynchronous family-member mutations

**Date:** 2026-07-27  
**Plan slice:** Phase 2, Slice 2.2  
**Audit IDs:** `MEMBER-02`, supporting `DATA-01`  
**Status:** Completed

## Outcome

Family-member mutations now tell the truth about server state:

- the shell returns awaited promises for create, update, and remove and changes local members only after success;
- profile and avatar editors show pending, success, and recoverable failure states;
- member-add dialogs and onboarding forms retain their drafts after rejected requests;
- pending actions disable duplicate submission and cannot be closed accidentally;
- profile and removal failures keep Settings open and expose explicit retry actions;
- “Gegevens opgeslagen.” appears only after the API resolves successfully.

The profile draft also survives closing and reopening Settings after a failed save. Successful avatar and profile writes are verified through the real browser, API, and PostgreSQL database after a page refresh.

## Regression coverage

- simulated HTTP 400 profile save: no optimistic member update, no success message, draft retained, retry offered;
- simulated HTTP 500 member create: dialog and draft retained with an alert;
- rejected avatar save: editor remains open with the selected draft and retry;
- rejected removal: Settings remains open with retry;
- rejected onboarding member create: form fields remain populated;
- real API profile and avatar update: both survive browser refresh.

## Validation

- focused mutation tests: 39/39 passed;
- full frontend suite: 317/317 passed;
- frontend production build/type-check: passed;
- full backend suite: 580/580 passed;
- backend restore and build: passed;
- isolated Playwright suite: 5/5 outcomes passed, including the normal family-member persistence scenario; three unrelated known defects remain expected failures.

Existing non-blocking warnings remain: `SQLitePCLRaw.lib.e_sqlite3` NU1903, the Vitest runner Node DEP0190 warning, and Vite's large-chunk warning.

## Scope

No API contract, generated client, database schema, migration, backend behavior, or primary-page layout changed. Atomic onboarding, production/demo bootstrap separation, member restore, central family administration, and the Phase 7 shared error framework remain later slices. `DATA-01` therefore remains open at program level.
