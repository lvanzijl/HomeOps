# Tasks Viewport-Fit Implementation

## Summary

Implemented the approved Tasks viewport-fit redesign from `docs/reports/2026-07-02-work/tasks-viewport-fit-analysis.md`.

The Tasks page now uses a fixed viewport-bounded composition with:

- one compact command/status band;
- one bounded two-column main region with **Vandaag** and a **Planning** summary;
- one compact secondary access rail for Later, Ooit, Afgerond, Routinestarters, Week plannen, and Gezinsreset openen;
- bounded overlay surfaces for detailed planning and secondary task-management flows.

No backend, API, schema, migration, seed, or binary artifact changes were made.

## Files changed

- `src/HomeOps.Client/src/tasks/TasksPage.tsx`
- `src/HomeOps.Client/src/tasks/TasksPage.test.tsx`
- `src/HomeOps.Client/src/workspaces/WorkspaceShell.test.tsx`
- `src/HomeOps.Client/src/styles.css`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-07-02-work/tasks-viewport-fit-implementation.md`

## How the implementation follows the approved analysis

- Replaced the previous five-column default dashboard with a fixed two-region default layout: **Vandaag** plus a compact **Planning** summary.
- Removed default row-level Tomorrow / This Week / Later / Completed / Someday rendering from the main viewport.
- Merged the Tasks-local header and Today summary into one compact command/status band.
- Converted Later, Afgerond, Ooit, Routinestarters, and Week plannen into compact secondary-access tiles instead of in-flow page sections.
- Replaced inline expanded secondary stacks with bounded overlay surfaces that own their own internal scrolling.
- Replaced the in-flow completed `<details>` expansion with bounded overlay access.
- Added an explicit Today visible-row contract with `+N meer vandaag` drill-in access.
- Kept the Tasks page itself viewport-bounded with internal overflow ownership instead of relying on `.workspace-page-body` scrolling for normal use.
- Preserved existing task workflows: create, edit, complete, reopen, move to tomorrow, template apply/edit/archive, weekly review actions, and weekly reset navigation.

## Validation performed

### Repository validation

Commands run with the required repository-local environment exports:

```bash
export DOTNET_CLI_HOME="$PWD/.dotnet-home"
export DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1
export DOTNET_NOLOGO=1
export NUGET_PACKAGES="$PWD/.nuget/packages"
export npm_config_cache="$PWD/.npm-cache"
mkdir -p "$DOTNET_CLI_HOME" "$NUGET_PACKAGES" "$npm_config_cache"
```

```bash
dotnet restore HomeOps.sln
dotnet build HomeOps.sln
dotnet test HomeOps.sln
cd src/HomeOps.Client
npm test
npm run build
cd /home/runner/work/HomeOps/HomeOps
npx --yes nswag run nswag.json
```

Results:

- `dotnet build` ✅
- `dotnet test` ✅ (`137` passed)
- `npm test` ✅ (`165` passed)
- `npm run build` ✅
- `npx --yes nswag run nswag.json` ✅

Observed existing warning:

- `SQLitePCLRaw.lib.e_sqlite3` `2.1.11` vulnerability warning during .NET restore/build/test in `tests/HomeOps.Api.Tests/HomeOps.Api.Tests.csproj`

### Viewport-fit verification

Used a temporary Playwright validation workspace outside the repository plus the existing local app runtime.

Validation steps:

1. Started Docker Compose services.
2. Started the API on `http://localhost:5152`.
3. Started the Vite frontend on `http://localhost:5173`.
4. Reset the `visual-marketing-tasks` fixture through `/api/visual-review-fixtures/visual-marketing-tasks/reset`.
5. Opened the Tasks page at a `1366x768` viewport and measured layout/overflow behavior.

Verified results:

- `document.body` did not vertically scroll.
- `html` / `body` overflow remained hidden.
- `.workspace-panel-tasks .workspace-page-body` used `overflow: hidden`.
- `.workspace-page-body` client height and scroll height matched after the final fix.
- `.tasks-page` client height and parent height matched.
- Default dashboard headings were only `Vandaag` and `Planning`.
- Secondary access stayed in the fixed rail instead of rendering as in-flow lists.

## Remaining limitations

- The existing repository-wide Vite chunk-size warning still appears during `npm run build`.
- The existing SQLite package advisory warning still appears during .NET validation and was not changed in this slice.

## Confirmation that no binary files were added

No screenshots, videos, PNG, JPG, JPEG, GIF, WEBP, PDF, or other binary files were added to the repository.
