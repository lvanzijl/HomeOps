# Slice 2.6 — First-run setup checklist

## Implemented scope

- Added a household-persisted checklist dismissal timestamp and migration.
- Extended onboarding status with derived optional-state indicators for a first list, a non-system calendar source, and an active Home Assistant provider. Weather remains explicitly unconfigured because household weather location belongs to deferred `WEATHER-01`.
- Added a bounded, dismissible post-onboarding dialog and focused backend/frontend coverage. The viewport analysis is in [viewport-analysis.md](viewport-analysis.md).
- Backfilled existing completed households as dismissed so an upgrade does not replay first-run UI.

## Contract and migration result

The parent execution environment ran the pinned `pnpm dlx nswag@14.7.1 run nswag.json` command after the child sandbox could not access the user pnpm store. OpenAPI and the generated TypeScript client now expose the checklist read/dismiss contract, and a second generation produced identical hashes. PostgreSQL clean-install and upgrade tests cover the new migration, existing completed-household backfill, and preserved legacy user data.

## Validation evidence

- `dotnet build HomeOps.sln --no-restore`: passed.
- `dotnet test HomeOps.sln --no-build --no-restore`: 588/588 passed.
- Full frontend Vitest suite: 325/325 passed.
- Frontend production build and TypeScript project build: passed.
- `dotnet ef migrations has-pending-model-changes`: no pending model changes.
- Pinned NSwag generation: passed and idempotent.
- Isolated PostgreSQL migration suite: 3/3 passed.
- Playwright product-integrity smoke suite: all 6 outcomes passed. The checklist is visible after fresh onboarding, creates no document overflow at 1366×768, dismisses through the API, and stays dismissed after refresh.

The existing `NU1903` advisory for `SQLitePCLRaw.lib.e_sqlite3` and Vite's large-chunk warning remain outside this slice.
