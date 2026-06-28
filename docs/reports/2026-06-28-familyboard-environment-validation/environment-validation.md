# FamilyBoard Environment Validation Report

## Preflight

- Required instruction file read: `.github/copilot-instructions.md`.
- Referenced instruction files: none were referenced by `.github/copilot-instructions.md`.
- Required .NET preflight command executed:

  ```bash
  export DOTNET_CLI_HOME=/tmp/dotnet
  export PATH="$PATH:$HOME/.dotnet/tools"
  dotnet --version
  ```

- Result: `10.0.301`.

## Baseline discovery

- Newest committed report under `docs/reports/` containing a `screenshots/` directory: `docs/reports/2026-06-27-familyboard-screenshot-review/`.
- Baseline screenshot directory: `docs/reports/2026-06-27-familyboard-screenshot-review/screenshots/`.
- Screenshot files:
  - `01-home.png`
  - `02-agenda-month.png`
  - `03-agenda-week.png`
  - `04-agenda-list.png`
  - `05-tasks.png`
  - `06-tasks-add-dialog.png`
  - `07-shopping.png`
  - `08-motivation.png`
  - `09-settings.png`
  - `10-weekly-reset.png`

## Expected screenshot set verification

- Home: `01-home.png` exists.
- Agenda: `02-agenda-month.png`, `03-agenda-week.png`, and `04-agenda-list.png` exist.
- Tasks: `05-tasks.png` exists.
- Shopping: `07-shopping.png` exists.
- Motivation: `08-motivation.png` exists.
- Weekly Reset: `10-weekly-reset.png` exists.
- Representative dialog and Settings are also present: `06-tasks-add-dialog.png` and `09-settings.png`.

Result: the baseline screenshot set is complete for the requested major pages.

## Baseline characteristics

The discovered baseline represents a populated household fixture state:

- Home: populated dashboard cards for Agenda, Tasks, Shopping, and Motivation.
- Agenda: populated calendar state across Month, Week, and List screenshots.
- Tasks: task execution board with multiple visible task rows/cards.
- Shopping: active shopping workflow with active items, suggestions, and list-management content.
- Motivation: family goal, recognition/appreciation content, personal goals, activity, and statistics.
- Weekly Reset: populated weekly ritual with readiness hero, statistics, and planning columns.

## Application launch attempt

The runtime expected for browser validation requires the backend and PostgreSQL development database, with visual review fixture scenarios available through the API.

Commands attempted:

```bash
docker --version
docker compose version
dotnet run --project src/HomeOps.Api/HomeOps.Api.csproj
cd src/HomeOps.Client && npm run dev -- --host 127.0.0.1
```

Observed results:

- `docker --version`: failed because `docker` is not installed in this environment.
- `docker compose version`: failed because `docker` is not installed in this environment.
- API startup: failed during Entity Framework migration startup because PostgreSQL was unavailable on `localhost:5432`.
- Frontend startup: Vite served the client at `http://127.0.0.1:5173/`, but the backend proxy target at `http://localhost:5152` was unavailable.

API blocker excerpt:

```text
Failed to connect to 127.0.0.1:5432
```

## Runtime checks

No screenshots were generated. These checks validate runtime equivalence only.

### Home

- Result: FAIL.
- Reason: the baseline Home page is populated with representative household dashboard data, but the current runtime cannot load backend-backed data because the API failed to start without PostgreSQL.

### Agenda

- Result: FAIL.
- Reason: the baseline Agenda screenshots contain populated Month, Week, and List states. The current runtime cannot be reset to the baseline fixture state because the backend and visual review fixture endpoint are unavailable.

### Tasks

- Result: FAIL.
- Reason: the baseline Tasks page contains populated task cards/rows. The current runtime cannot provide the equivalent task data because the API failed during database connection/migration startup.

### Shopping

- Result: FAIL.
- Reason: the baseline Shopping page contains active shopping items and suggestions. The current runtime cannot provide equivalent list data because PostgreSQL is unavailable and the backend is not running.

### Motivation

- Result: FAIL.
- Reason: the baseline Motivation page contains a family goal, appreciations/recognition, personal goals, activity, and statistics. The current runtime cannot provide equivalent motivation data because fixture reset and backend reads are unavailable.

### Weekly Reset

- Result: FAIL.
- Reason: the baseline Weekly Reset page contains a populated ritual with readiness, statistics, and planning columns. The current runtime cannot reproduce this fixture state without the backend and database.

## Failed checks

All major pages fail runtime equivalence:

- Home
- Agenda
- Tasks
- Shopping
- Motivation
- Weekly Reset

## Exact blocker

The environment cannot reproduce the baseline screenshot runtime because Docker is not installed, so the PostgreSQL service defined in `docker-compose.yml` cannot be started. Without PostgreSQL, the ASP.NET Core API exits during startup while trying to connect to `localhost:5432`. Without the API, the visual review fixture reset endpoints cannot load `visual-full` or `visual-weekly-reset`, and the frontend cannot be considered equivalent to the populated baseline.

## Recommended action

Run the validation in an environment with Docker available, start the PostgreSQL development database from `docker-compose.yml`, start the ASP.NET Core API successfully, reset the visual review fixtures to the same scenarios used by the baseline (`visual-full` for the main pages and `visual-weekly-reset` for Weekly Reset), and only then proceed to Phase 2 screenshot capture and visual comparison.

## Stop condition

Phase 1 failed. Per the requested stop condition, Phase 2 was not executed:

- No fresh screenshots were generated.
- No screenshot comparison was performed.
- No visual defect report was produced.
