# Fail-safe, atomic onboarding

**Date:** 2026-07-27

**Plan slice:** Phase 2, Slice 2.4

**Audit IDs:** `ONB-01`, `ONB-02`
**Status:** Completed

## Outcome

Onboarding no longer creates permanent family members one wizard step at a time. Household name and member drafts stay in the browser until the reviewed collection is submitted through one typed completion request.

The backend:

- validates the household name and supported IANA time zone;
- requires at least one adult;
- validates names, display fields, child birth dates, and canonical avatar selections;
- writes members plus household completion state in one relational transaction;
- returns the existing completed state on retry without inserting duplicate members.

The wizard allows staged members to be removed and routes back to the adult or child step for corrections. If onboarding status cannot be loaded, the application remains closed and shows an explicit retry action.

## Contracts and regression coverage

OpenAPI and `HomeOpsApiClient` were regenerated with NSwag 14.7.1. Required request fields are represented as required in the generated contract.

Coverage includes:

- invalid aggregate requests write no member or completion state;
- invalid household, time-zone, member, and avatar fields return validation details;
- retrying completion produces one active member collection;
- completed status survives a new status read;
- wizard additions remain local before completion;
- review supports removal and correction;
- failed status loading never enters the main application;
- the real browser/API/PostgreSQL path completes onboarding and stays completed after refresh.

## Validation

- focused onboarding API tests: 3/3 passed;
- focused onboarding/shell frontend tests: 18/18 passed;
- full backend suite: 584/584 passed;
- full frontend suite: 319/319 passed;
- backend build: passed;
- frontend production type-check/build: passed;
- NSwag 14.7.1 generation and idempotency check: passed;
- EF pending-model-change check: passed;
- isolated Playwright suite: 5/5 outcomes passed; onboarding, avatar persistence, and viewport checks are normal passes, while the deferred local-day and task-control scenarios remain expected failures.

Existing non-blocking warnings remain: `SQLitePCLRaw.lib.e_sqlite3` NU1903, the EF tools/runtime version mismatch, and Vite's large-chunk warning.

## Scope

No database migration, authentication, family restore/administration, optional setup checklist, primary-page layout, task behavior, or calendar behavior changed.
