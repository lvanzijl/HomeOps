# 2026-06-24 Home Dashboard Cleanup

## Summary
Home now behaves more like a compact dashboard: large global Quick Capture was removed, card actions moved into compact header icon buttons, card bodies are summary-only, and shopping rows show item names directly.

## Implemented
- Removed the always-visible Home Quick Capture region from the hero.
- Added compact add/open icon buttons to Agenda, Tasks, Lists/Shopping, and Motivation card headers.
- Replaced text header actions and duplicate body navigation buttons with icon-only header actions.
- Added minimal Home modal captures for Shopping item, Task, and Agenda event creation using existing APIs.
- Changed Shopping/List summary rows to show item text and optional preferred store instead of repeating list/container names per row.
- Kept Home summaries bounded with existing visible-row limits and `+N more` indicators.
- Tightened Home layout/card/list spacing to move closer to a non-scrolling dashboard.

## Verified
- `export DOTNET_CLI_HOME=/tmp/dotnet-home && export PATH="$PATH:$HOME/.dotnet/tools" && dotnet --version`
- `npm test -- --run src/home/HomeDashboard.test.tsx`
- `npm run build`

## Risks
- Home still depends on real viewport height, browser chrome, household member count, and data volume; this slice materially reduces height but does not introduce automated viewport-fit visual regression testing.
- Create dialogs are intentionally minimal and do not replace full management flows on dedicated pages.

## Modified Files
- `src/HomeOps.Client/src/home/HomeDashboard.tsx`
- `src/HomeOps.Client/src/home/HomeDashboard.test.tsx`
- `src/HomeOps.Client/src/icons/homeOpsIcons.tsx`
- `src/HomeOps.Client/src/styles.css`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-06-24-home-dashboard-cleanup/2026-06-24-home-dashboard-cleanup.md`

## Next Prompt Context
Continue with a follow-up Home viewport pass only after checking the dashboard in a normal laptop viewport with representative household data. Candidate next slice: tune card density/responsiveness further or move more long-form empty state guidance off Home if overflow remains.
