# Visual Review Runtime

## Summary

Added a supported `VisualReview` API environment for browser-accessible FamilyBoard visual review. `VisualReview` starts Kestrel without Docker or PostgreSQL, configures `HomeOpsDbContext` with EF Core InMemory storage, exposes the official visual fixture endpoints, and successfully resets both `visual-full` and `visual-weekly-reset`.

## Preflight analysis

Read before editing:

- `.github/copilot-instructions.md`
- `AGENTS.md`

Preflight command:

```bash
export DOTNET_CLI_HOME=/tmp/dotnet
export PATH="$PATH:$HOME/.dotnet/tools"
dotnet --version
```

Result:

```text
10.0.301
```

Reviewed implementation context:

- `src/HomeOps.Api/Program.cs`
- `tests/HomeOps.Api.Tests/Lists/HomeOpsWebApplicationFactory.cs`
- `src/HomeOps.Api/VisualReviewFixtures/VisualReviewFixtureEndpoints.cs`
- `src/HomeOps.Api/VisualReviewFixtures/VisualReviewFixtureService.cs`
- `tests/HomeOps.Api.Tests/Lists/VisualReviewFixtureApiTests.cs`
- `src/HomeOps.Api/appsettings.json`
- `src/HomeOps.Api/appsettings.Development.json`
- `src/HomeOps.Api/Properties/launchSettings.json`
- `src/HomeOps.Client/vite.config.ts`
- prior environment validation reports under `docs/reports/2026-06-28-*environment*` and `docs/reports/2026-06-28-postgresql-environment-check/`

## Root cause analysis

Before this slice there were three runtime paths:

1. `Development` used PostgreSQL and exposed fixtures, but could not run in Codex when PostgreSQL was unavailable.
2. `Testing` worked through `HomeOpsWebApplicationFactory` because the factory replaced `HomeOpsDbContext` with EF Core InMemory.
3. Plain Kestrel with `ASPNETCORE_ENVIRONMENT=Testing` exposed fixture endpoints but registered `HomeOpsDbContext` without a provider, so fixture reset was a trap outside the integration-test host.

The missing piece was an intentional browser-facing environment that reused the official fixture service while configuring a real ephemeral EF provider.

## Implementation plan

1. Preserve `Development` on Npgsql/PostgreSQL and preserve `Testing` for integration tests.
2. Add an explicit `VisualReview` environment branch in `Program.cs` using EF Core InMemory.
3. Skip relational migrations for `VisualReview`, matching the non-relational ephemeral provider.
4. Expose official visual fixture endpoints for `VisualReview`.
5. Add a launch profile and developer documentation for the canonical runtime.
6. Validate API endpoints, fixture resets, API tests, and browser-visible populated state.

## Implemented changes

- Added EF Core InMemory to the API project for the browser-facing visual review runtime.
- Added `VisualReview` environment handling in `Program.cs`:
  - registers an InMemory `HomeOpsDbContext` database named `homeops-visual-review`;
  - skips `Database.Migrate()` for `VisualReview`;
  - exposes official visual fixture endpoints in `VisualReview`;
  - enables permissive CORS only in `VisualReview` for browser inspection from Vite.
- Added a `VisualReview` launch profile on `http://127.0.0.1:5108`.
- Added canonical developer documentation at `docs/development/visual-review-runtime.md`.
- Updated current state documentation.

Development/PostgreSQL behavior remained unchanged: environments other than `Testing` and `VisualReview` continue to use the configured `HomeOps` Npgsql connection and run migrations at startup.

Production behavior remained unchanged for normal non-VisualReview/non-Testing environments.

## How to run VisualReview

Endpoint-only API run:

```bash
export DOTNET_CLI_HOME=/tmp/dotnet
export PATH="$PATH:$HOME/.dotnet/tools"
ASPNETCORE_ENVIRONMENT=VisualReview \
  dotnet run --project src/HomeOps.Api/HomeOps.Api.csproj \
  --no-launch-profile \
  --urls http://127.0.0.1:5108
```

Browser validation run, keeping the documented fixture endpoint on `5108` and the current Vite proxy target on `5152`:

```bash
export DOTNET_CLI_HOME=/tmp/dotnet
export PATH="$PATH:$HOME/.dotnet/tools"
ASPNETCORE_ENVIRONMENT=VisualReview \
  dotnet run --project src/HomeOps.Api/HomeOps.Api.csproj \
  --no-launch-profile \
  --urls 'http://127.0.0.1:5108;http://127.0.0.1:5152'
```

Vite command:

```bash
cd src/HomeOps.Client
VITE_HOMEOPS_API_BASE_URL=http://127.0.0.1:5108 npm run dev -- --host 127.0.0.1 --port 5173
```

Fixture commands:

```bash
curl -sS -m 5 http://127.0.0.1:5108/health
curl -sS -m 5 http://127.0.0.1:5108/api/visual-review-fixtures/scenarios
curl -sS -m 10 -X POST http://127.0.0.1:5108/api/visual-review-fixtures/visual-full/reset
curl -sS -m 10 -X POST http://127.0.0.1:5108/api/visual-review-fixtures/visual-weekly-reset/reset
```

## Fixture endpoint validation

`VisualReview` runs without Docker: yes.

`VisualReview` runs without PostgreSQL: yes.

Official fixture endpoints are reachable: yes.

Validated commands:

```text
curl -sS -m 5 http://127.0.0.1:5108/health
{"status":"Healthy"}

curl -sS -m 5 http://127.0.0.1:5108/api/visual-review-fixtures/scenarios
Returned visual-full, visual-mixed, visual-empty, visual-child-young, visual-child-older, visual-weekly-reset, and visual-shopping-lifecycle.

curl -sS -m 10 -X POST http://127.0.0.1:5108/api/visual-review-fixtures/visual-full/reset
{"scenarioName":"visual-full","anchorUtc":"2026-06-21T09:00:00+00:00","familyMembers":4,"tasks":10,"lists":2,"listItems":6,"familyGoals":1,"individualGoals":2,"helpfulMoments":5,"events":2}

curl -sS -m 10 -X POST http://127.0.0.1:5108/api/visual-review-fixtures/visual-weekly-reset/reset
{"scenarioName":"visual-weekly-reset","anchorUtc":"2026-06-21T09:00:00+00:00","familyMembers":4,"tasks":8,"lists":2,"listItems":6,"familyGoals":1,"individualGoals":2,"helpfulMoments":4,"events":0}
```

`visual-full` reset works: yes.

`visual-weekly-reset` reset works: yes.

## Browser populated-state validation

Playwright/browser inspection sees populated UI state: yes.

Validation setup:

- API: `ASPNETCORE_ENVIRONMENT=VisualReview dotnet run --project src/HomeOps.Api/HomeOps.Api.csproj --no-launch-profile --urls 'http://127.0.0.1:5108;http://127.0.0.1:5152'`
- Vite: `VITE_HOMEOPS_API_BASE_URL=http://127.0.0.1:5108 npm run dev -- --host 127.0.0.1 --port 5173`
- Browser dependency setup: Playwright was installed under `/tmp/pwcheck`; system browser libraries were installed with `apt-get` because the container initially lacked `libatk-1.0.so.0`.
- No screenshots were created.
- No Playwright routes were mocked.

Observed populated browser state:

- Home: populated Agenda, Tasks, Shopping, and Motivation cards.
- Agenda Month: populated month indicators.
- Agenda Week: populated week entries including `School picnic` and `Verjaardag Morgan`.
- Agenda List: populated upcoming entries including `Inschrijving zomerkamp bevestigen` and `Seizoensfinale-marathon`.
- Tasks: populated Today group including `Put breakfast dishes away`.
- Shopping: populated store-grouped items including `Milk` and `Apples`.
- Motivation: populated family goal, appreciation, celebrations, and statistics content including `Fill the kindness path`, `Pancake breakfast`, and `helpful actions`.
- Weekly Reset: populated ritual page with summary/planning cards including `Weekritueel`, `Zijn we klaar voor volgende week?`, `keuzes voor volgende week`, and `Gezinsdoel`.

## Test results

```text
dotnet test tests/HomeOps.Api.Tests/HomeOps.Api.Tests.csproj --filter "VisualReviewFixtureApiTests"
Passed: 4, Failed: 0, Skipped: 0.
```

```text
dotnet test tests/HomeOps.Api.Tests/HomeOps.Api.Tests.csproj
Passed: 126, Failed: 0, Skipped: 0.
```

```text
git diff --check
Passed.
```

Warnings observed:

- `dotnet test` reported the existing `NU1903` warning for `SQLitePCLRaw.lib.e_sqlite3` in the test project.
- `apt-get update` reported a `403 Forbidden` warning for the external `mise.jdx.dev` apt source, but Ubuntu package indexes and required browser libraries installed successfully.
- `npm run dev` reported the existing npm warning: `Unknown env config "http-proxy"`.

## Remaining infrastructure debt

- The Vite dev server proxy still points relative `/api` requests to `http://localhost:5152`. Some generated API-client call sites use relative URLs while other handwritten API helpers can consume `VITE_HOMEOPS_API_BASE_URL`. For browser validation today, run `VisualReview` on both `5108` and `5152`.
- Plain Kestrel `Testing` remains integration-test-only. Browser visual review should use `VisualReview`, not `Testing`.

## Modified files

- `src/HomeOps.Api/Program.cs`
- `src/HomeOps.Api/HomeOps.Api.csproj`
- `src/HomeOps.Api/Properties/launchSettings.json`
- `docs/development/visual-review-runtime.md`
- `docs/state/current-state.md`
- `docs/reports/2026-06-28-visual-review-runtime/visual-review-runtime.md`

## Binary artifact confirmation

No screenshots, PNG, JPG, JPEG, GIF, WEBP, PDF, or other binary artifacts were created or committed. Temporary Playwright files were created under `/tmp`, outside the repository.
