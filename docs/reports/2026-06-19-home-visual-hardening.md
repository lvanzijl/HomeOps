# Home Visual Hardening

## Summary
Hardened the existing Home hierarchy without redesigning the page: Agenda remains primary, Lists becomes useful, Family Members become contextual, and framework/demo feeling is reduced.

## Implemented
- Increased Home content width and reduced panel padding/chrome.
- Made Agenda proportionally stronger than Lists in the summary grid.
- Renamed summary card headings to family-facing language: `Today & next` and `Remember`.
- Strengthened card action affordances and highlighted the leading Agenda item plus list rows.
- Stacked summary cards at tablet portrait widths with a wider responsive breakpoint.

## Verified
- Home visual screenshot capture was attempted but not completed because this container has no Docker runtime for PostgreSQL-backed app startup and no installed browser; Playwright browser download was blocked by the environment with HTTP 403.
- Requested screenshot paths, not produced in this environment:
  - `docs/reports/home-dashboard-hardening-slice-1-desktop.png`
  - `docs/reports/home-dashboard-hardening-slice-2-tablet-landscape.png`
  - `docs/reports/home-dashboard-hardening-slice-3-tablet-portrait.png`
- `dotnet restore HomeOps.sln`
- `dotnet build HomeOps.sln`
- `dotnet test HomeOps.sln`
- `npm test --prefix src/HomeOps.Client`
- `npm run build --prefix src/HomeOps.Client`
- `npx --yes nswag run nswag.json` was attempted but could not complete because PostgreSQL was unavailable and Docker is not installed.

## Risks
- Live visual validation still needs to be rerun in an environment with PostgreSQL/Docker and a browser available.

## Modified Files
- `src/HomeOps.Client/src/home/HomeDashboard.tsx`
- `src/HomeOps.Client/src/main.tsx`
- `src/HomeOps.Client/src/shopping/listsSummaryApi.ts`
- `src/HomeOps.Client/src/shopping/listsSummaryApi.test.ts`
- `src/HomeOps.Client/src/styles.css`
- `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx`
- `src/HomeOps.Client/src/workspaces/workspaceModel.ts`
- `docs/state/current-state.md`
- `docs/roadmap/phase-1.md`

## Next Prompt Context
Run live visual review in a browser-enabled environment with PostgreSQL available; verify Home loads with active list content and capture the three requested screenshots.
