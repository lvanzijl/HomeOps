# Browser E2E smoke suite

**Date:** 2026-07-27  
**Plan slice:** Phase 0, Slice 0.3  
**Status:** Completed

## Outcome

HomeOps now has a repository-owned, pinned Playwright smoke project and a single root command:

```powershell
pnpm test:e2e
```

The command provisions an isolated PostgreSQL database, starts the real API and Vite client, waits for health, runs Chromium, terminates its child processes, and deletes only the generated database.

## Coverage

The suite executes five browser scenarios:

1. a clean migrated database should show onboarding;
2. a family-member avatar change should persist through the real PUT endpoint and refresh;
3. a Home “Vandaag” event should remain on the household-local day after refresh;
4. task Complete, Tomorrow, and Edit controls should be unobscured real hit targets without forced clicks;
5. Home, Agenda, Tasks, Shopping, Motivation, Settings, and a member page should not create document-level vertical scrolling at 1440x900 or 1366x768.

Three scenarios still reproduce known defects and are marked as expected failures. This keeps the baseline runnable while making an unexpected pass fail the suite, prompting the responsible remediation slice to remove the marker. The family-member avatar persistence scenario became a normal passing regression in Phase 2 Slice 2.1. The viewport scenario also passes.

## Isolation and safety

- Database names must match `homeops_e2e_<32 lowercase hexadecimal characters>`.
- The normal `homeops` development database is never selected.
- Fixture reset routes are available only in explicit Development, Testing, VisualReview, or E2E contexts; the E2E runner uses only its generated database.
- Background synchronization services are disabled in E2E.
- API and Vite bind only to loopback test ports.
- Failure artifacts and browser binaries are ignored and absent from the changeset.
- A post-run database query confirmed that no generated E2E databases remained.

## Validation

- `pnpm test:e2e`: passed, 5/5 Playwright outcomes; three expected failures and two normal passes after Phase 2 Slice 2.1.
- Post-run isolation check: both test ports were clear and no `homeops_e2e_*` database remained.
- Real-browser spot check: Tasks had zero body/document overflow; “Klaar” and “Morgen” were visibly present but `elementFromPoint` confirmed they did not receive pointer input.
- `dotnet restore HomeOps.sln`: passed.
- Backend suite: 579/579 passed.
- Frontend suite: 310/310 passed.
- Backend build: passed.
- Frontend production build: passed.
- `git diff --check`: passed before documentation finalization and will be rerun in the final audit.

Existing non-blocking warnings remain: the `SQLitePCLRaw.lib.e_sqlite3` NU1903 advisory, the Vitest runner's Node DEP0190 warning, and Vite's large-chunk warning.

NSwag regeneration was not required because this slice changes no API endpoint or DTO contract; the generated OpenAPI and TypeScript client files are untouched.

## Scope

This slice adds only test/runtime isolation, browser coverage, and documentation. It does not fix onboarding, avatar persistence, local-calendar semantics, task hit targets, or any later remediation-phase product behavior.
