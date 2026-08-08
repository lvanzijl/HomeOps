# Browser E2E testing

HomeOps browser smoke tests run against a disposable PostgreSQL database and test-only API/client ports. They do not use the normal `homeops` household database.

## First-time setup

From the repository root:

```powershell
pnpm --dir tests/HomeOps.E2E install
pnpm --dir tests/HomeOps.E2E exec playwright install chromium
```

The Playwright dependency is pinned in the E2E project and its lockfile.

## Run the suite

```powershell
pnpm test:e2e
```

For an interactive browser:

```powershell
pnpm test:e2e:headed
```

The runner:

1. starts the Docker Compose PostgreSQL service unless `-SkipPostgres` is supplied;
2. creates a guarded `homeops_e2e_<32 hex characters>` database;
3. starts the API in the `E2E` environment at `127.0.0.1:5252`;
4. starts Vite at `127.0.0.1:5273` with its API proxy pointed at that API;
5. waits for both services before running Chromium;
6. stops the child processes and drops only the generated database.

Use `-KeepDatabase` only while diagnosing a failing test. The generated name is printed before startup and must never be replaced with `homeops`. Use `-StopPostgresOnExit` if the test command should also stop the shared development PostgreSQL container.

## Regression baseline

All product-integrity scenarios are normal passing regressions; no expected-failure marker remains. The suite covers fresh-install onboarding (`BOOT-01`), family-member avatar persistence (`MEMBER-01`), Home household-local event placement (`TIME-01`), task/routine/Weekly Reset lifecycle, Woning routes, room climate configuration (`CLIMATE-01`), and primary-page document containment.

The viewport scenario covers 1440x900 and 1366x768, including Home quick-add, Agenda editor, Kalendercontrole, Woning management, and the room climate editor. The climate lifecycle scenario additionally covers strict validation, create/edit/disable, refresh persistence, and archived-room guidance.

## Artifacts

Screenshots and traces are captured only for failures. `test-results/`, `playwright-report/`, `blob-report/`, and the repository-local Playwright browser cache are ignored and must not be committed.
