# Phase 6 Slice 6.3 — Motivation progress ledger

## Outcome

Goal progress now has one explicit accounting rule. Completing an attributed task appends `+1` to the applicable active goal: shared-household tasks contribute to the active family goal, and member-assigned tasks contribute to that member's active individual goal. Reopening the task appends `-1` and references the completion it compensates. Unassigned tasks and Helpful Moments do not change progress.

There is no arbitrary editable progress field. A parent can make an explicit correction only by appending a signed ledger entry with a required reason. A correction may reference an existing entry; when it does, the server requires the correction to be its exact inverse. Existing rows have private setters and the product exposes no update or delete contract.

Displayed progress is the sum of ledger deltas bounded to `0..TargetCount`. The raw ledger remains intact when a target is lowered or the sum crosses a bound, so later target changes do not destroy history. `CurrentProgress` remains only as a compatibility projection for existing domain consumers and is refreshed from the ledger after writes; Motivation and Weekly Reset reads calculate from ledger entries. Migration `20260808181329_AddMotivationProgressLedger` creates one labelled baseline entry for every existing family and individual goal, including zero-progress goals.

## UI and viewport contract

The implementation follows the approved Motivation analysis in `docs/reports/2026-08-08-phase-6-viewport-analysis/motivation-viewport-analysis.md`:

- the family-goal card now contains only goal identity/anticipation, one compact progress block, one truthful source sentence, and fixed actions;
- duplicate proof tiles, celebration detail, and the off-screen next-step block no longer occupy the primary card;
- celebration state and its completion action remain in the existing bottom story region;
- `Meer voortgang` opens one bounded fixed-header ledger workspace; the ledger list owns vertical overflow;
- `Correctie toevoegen` replaces the same dialog body, retains failed input, and keeps its action row fixed.

Independent inspection at 1280×720 measured zero document/body overflow. The family-goal card has 331 px client and scroll heights, so required content is no longer clipped. The ledger dialog ended at 709.6 px with an internally scrolling 468 px ledger region. The correction action row ended at 690.8 px; its body owns internal overflow.

## Validation

- Focused Motivation backend: 21/21 passed, including family/member task contribution, completion/reopen idempotency, linked compensation, correction history, target bounds, and celebration state.
- Focused Motivation frontend: 14/14 passed, including source copy, bounded ledger states, retained failed correction input, and successful projection refresh.
- Full backend: 658/658 passed.
- Full frontend: 388/388 passed with one worker.
- Solution and frontend production builds passed. Existing SQLitePCL `NU1903` and Vite large-chunk warnings remain.
- PostgreSQL migration baseline/upgrade/backfill/preservation: 5/5 passed through Rancher Desktop.
- EF migration list, no-pending-model-change check, and idempotent script generation passed.
- Pinned NSwag 14.7.1 ran twice; the second OpenAPI and TypeScript client hashes were identical:
  - OpenAPI: `2AF799E16C261F4BFBE78B580A9A76F61EB89680E632A7FBA17A58F0F88BA5A1`
  - TypeScript client: `FF0216B6B51527BAB100F372FF0447EFFDDF20569FCDDF1EA4CC6BD1D4C5D574`
- PostgreSQL-backed Playwright: 19/19 passed, including correction persistence, primary-card containment, ledger/dialog containment, and the no-document-scroll checks at 1440×900 and 1366×768.

## Scope

Changes are limited to Motivation progress accounting, the task-to-progress integration, the Weekly Reset goal projection, directly related fixtures/tests, generated contracts, the approved Motivation card/dialog realization, the migration, and Phase 6 documentation. Helpful-moment edit/delete and family-goal stop/archive/history remain Slice 6.4. No reward economy, authentication, notifications, unrelated page redesign, screenshots, videos, browser traces, or generated caches belong in this slice.
