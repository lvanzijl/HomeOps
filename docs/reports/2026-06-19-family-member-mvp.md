# family member mvp

## Summary
Implemented the scoped Home dashboard slice while preserving existing Agenda, Lists, Calendar, EventSeries, and export/restore boundaries.

## Implemented
- Added the Home dashboard surface with date/time, quick capture, Agenda summary, Lists summary, and bounded overflow behavior.
- Added minimal Family Member presentation data with name, display color, and initials only.
- Added Home navigation flows from summary cards, overflow buttons, and quick capture actions to Agenda and Lists pages.
- Updated architecture, roadmap, and current state documentation for the new Home behavior.

## Verified
- dotnet restore HomeOps.sln
- dotnet build HomeOps.sln
- dotnet test HomeOps.sln
- npm test --prefix src/HomeOps.Client
- npm run build --prefix src/HomeOps.Client
- npx --yes nswag run nswag.json

## Risks
- Family Members are currently static client presentation data and intentionally not persisted.
- Quick capture routes to domain pages only; no Home-native capture forms were added.
- Visual verification was limited to automated render/navigation coverage and production build.

## Modified Files
- src/HomeOps.Client/src/home/HomeDashboard.tsx
- src/HomeOps.Client/src/home/HomeDashboard.test.tsx
- src/HomeOps.Client/src/home/familyMembers.ts
- src/HomeOps.Client/src/shopping/listsSummaryApi.ts
- src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx
- src/HomeOps.Client/src/workspaces/WorkspaceShell.test.tsx
- src/HomeOps.Client/src/workspaces/workspaceLayout.ts
- src/HomeOps.Client/src/workspaces/workspaceModel.ts
- src/HomeOps.Client/src/styles.css
- docs/architecture.md
- docs/roadmap/phase-1.md
- docs/roadmap/phase-2.md
- docs/state/current-state.md

## Next Prompt Context
Home is now the summary-first dashboard. Keep Tasks, gamification, House Status, Media, authentication, profiles, permissions, notifications, reminders, Google Calendar, recurrence UI, and export/restore UI changes out of Home unless a later prompt explicitly scopes them.
