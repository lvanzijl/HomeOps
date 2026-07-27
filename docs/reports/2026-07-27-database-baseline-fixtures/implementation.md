# Database baseline and upgrade fixtures

**Remediation phase:** Phase 0 — Safety baseline and regression harness  
**Slice:** 0.1 — Database baseline and upgrade fixtures  
**Status:** Completed  
**Date:** 2026-07-27

## Outcome

Implemented a guarded real-PostgreSQL test fixture and two migration baselines:

1. migrate a generated empty database through every migration currently discoverable by EF;
2. migrate to one version behind, add representative household/user data, upgrade to latest, and verify the data remains.

The focused behavior and repository-wide backend gate pass. A separate, narrow test-stability slice corrected the Windows-only Home Assistant credential-fixture blocker without changing production behavior.

## Safety boundary

The fixture:

- creates only `homeops_test_<guid>` databases;
- connects to `postgres` only as the maintenance database;
- never uses `homeops` as a test target;
- refuses to drop a database outside the `homeops_test_` prefix;
- disables pooling and force-drops each generated database during disposal;
- supports an explicit test connection through `HOMEOPS_TEST_POSTGRES_CONNECTION`;
- fails clearly when `HOMEOPS_REQUIRE_POSTGRES_TESTS=true` and PostgreSQL is unavailable.

After validation, a direct PostgreSQL query confirmed that no `homeops_test_%` databases remained.

## Characterized migration state

The clean-database baseline confirms:

- EF currently discovers `20260715205518_AddRoomHeatingCommands` as the latest migration;
- the EF model contains all five Home Assistant resume-strategy properties;
- a freshly migrated PostgreSQL database lacks those five columns.

This intentionally records audit finding `HOUSE-04`. Phase 5 Slice 5.1 must register and validate `20260717124500_AddHomeAssistantResumeStrategyConfiguration`, then change the characterization to require no missing columns.

## Files

- `tests/HomeOps.Api.Tests/Infrastructure/PostgresTestDatabase.cs`
- `tests/HomeOps.Api.Tests/Infrastructure/DatabaseBaselineTests.cs`
- `tools/test/run-postgres-migration-tests.ps1`
- `docs/development/database-testing.md`
- remediation tracker, Phase 2 roadmap, and current-state updates

## Validation

Passed:

- backend test project build: 0 errors;
- guarded PostgreSQL focused suite: 2/2 passed;
- clean migration baseline;
- one-migration-behind upgrade;
- edited household name preserved;
- user-created Floor preserved;
- four seeded Family Members preserved;
- latest discoverable RoomHeatingCommands table present;
- generated database cleanup verified.

Warnings:

- existing `NU1903` warning for `SQLitePCLRaw.lib.e_sqlite3` 2.1.11.

Post-fix regression gates:

- focused `HomeAssistantClimateProviderTests`: 28/28 passed;
- guarded PostgreSQL focused suite: 2/2 passed;
- repository-wide backend suite: 575/575 passed.

No frontend, API contract, migration, generated client, or product behavior was changed in this slice.

## Completion

Slice 0.1 is completed. Phase 0 remains in progress because the real API contract and browser smoke-test slices are still outstanding.
