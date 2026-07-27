# PostgreSQL migration testing

HomeOps migration baseline tests use real PostgreSQL databases because EF InMemory and SQLite do not reproduce PostgreSQL migrations, types, constraints, or upgrade behavior.

## Safety boundary

The test fixture:

- connects to the `postgres` maintenance database;
- creates a database named `homeops_test_<guid>`;
- migrates and mutates only that generated database;
- refuses to drop a database without the `homeops_test_` prefix;
- force-drops the generated database during disposal;
- never connects to the normal `homeops` database as its test target.

The default connection matches the repository Docker Compose PostgreSQL service. Override it with `HOMEOPS_TEST_POSTGRES_CONNECTION` or the script's `-ConnectionString` parameter when needed. The configured PostgreSQL role must be allowed to create and drop test databases.

## Run the required migration tests

From the repository root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ./tools/test/run-postgres-migration-tests.ps1
```

The script starts the existing Compose PostgreSQL service, waits for readiness, requires the PostgreSQL tests to execute, and runs only the migration baseline test class. It leaves PostgreSQL running for normal development. Add `-StopPostgresOnExit` when the service should be stopped afterward.

For an externally managed PostgreSQL server:

```powershell
$env:HOMEOPS_TEST_POSTGRES_CONNECTION = "Host=127.0.0.1;Port=5432;Database=postgres;Username=homeops_test_admin;Password=<secret>"
powershell -NoProfile -ExecutionPolicy Bypass -File ./tools/test/run-postgres-migration-tests.ps1 -SkipPostgres -ConnectionString $env:HOMEOPS_TEST_POSTGRES_CONNECTION
```

Do not put real passwords in committed scripts, documentation, test output, or connection-string snapshots.

## Normal backend suite behavior

When PostgreSQL is reachable, the baseline tests execute as part of the normal backend suite. When it is unavailable, the tests return without touching external state unless `HOMEOPS_REQUIRE_POSTGRES_TESTS=true`. The dedicated script sets that flag so a missing server is a visible failure rather than a silent omission.

## Current characterized schema gap

The baseline intentionally records the confirmed `HOUSE-04` defect: the model contains five Home Assistant resume-strategy properties, while the latest migration discoverable by EF is currently `20260715205518_AddRoomHeatingCommands` and a freshly migrated database lacks those five columns.

Phase 5 Slice 5.1 must register and validate the existing `20260717124500_AddHomeAssistantResumeStrategyConfiguration` migration. At that point, update the characterization assertion to require no missing columns.
