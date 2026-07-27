# Production/demo bootstrap separation

**Date:** 2026-07-27  
**Plan slice:** Phase 2, Slice 2.3  
**Audit IDs:** `BOOT-01`, `UX-01`  
**Status:** Completed

## Outcome

Production bootstrap no longer creates a fictional active family. A fresh database contains one incomplete household and only application-owned structural defaults, so the real onboarding flow is shown without Alex, Sam, Riley, Jordan, shopping content, motivation goals, or dated agenda events.

The seed boundary is now explicit:

| Classification | Contents |
| --- | --- |
| Structural defaults | incomplete household, system manual event source, task templates/items, workspace layouts/placements |
| Household demo content | family members, lists/items, motivation goals, event series |
| Product demo | localized `visual-full` scenario, applied only in the explicit `Demo` environment |
| Historical test data | legacy English household graph, applied only by `LegacySeedTestFixture` in tests that require it |

The frontend family-member state starts empty and waits for the API instead of substituting static members.

## Upgrade safety

Migration `20260727121951_SeparateProductionBootstrapFromDemoData` classifies the historical graph before changing it:

- the exact untouched demo graph is removed and the household returns to onboarding;
- any graph with user-created domain data, changed household/member/list/event values, or a changed avatar payload is preserved;
- preserved legacy graphs are marked with `LegacyDemoDataReviewRequired`;
- downgrade removes only the marker column and never recreates demo rows.

The marker deliberately does not trigger automatic cleanup. An administrator-facing preview/action remains later work; this slice establishes the non-destructive persistence signal.

## Regression coverage

- fresh model and PostgreSQL database contain no household demo content;
- exact legacy fixtures remain deterministic and opt-in for tests;
- one-migration-behind databases preserve representative user data;
- an avatar-only legacy edit is preserved even when its timestamp is unchanged;
- VisualReview fixture reset and scenario coverage remain passing;
- browser first run enters onboarding, and profile/avatar changes survive refresh.

## Validation

- guarded PostgreSQL migration suite: 3/3 passed;
- full backend suite: 583/583 passed;
- full frontend suite: 318/318 passed;
- backend build: passed;
- frontend production type-check/build: passed;
- EF pending-model-change check: passed;
- isolated Playwright suite: 5/5 outcomes passed; onboarding, avatar persistence, and viewport checks are normal passes, while the deferred local-day and task-control defects remain expected failures.

Existing non-blocking warnings remain: `SQLitePCLRaw.lib.e_sqlite3` NU1903, the EF tools/runtime version mismatch, and Vite's large-chunk warning.

## Scope

No public API contract, generated client, primary-page layout, authentication, atomic onboarding flow, family restore UI, or task/calendar behavior changed. The Home local-day and Tasks action defects remain assigned to Phases 3 and 4.
