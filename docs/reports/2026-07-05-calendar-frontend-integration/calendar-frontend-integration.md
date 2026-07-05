# Summary

Completed the final Calendar Sources frontend slice by wiring the regenerated OpenAPI client into Settings and Agenda, delivering full household-facing source management, and validating the end-to-end experience with automated browser review and desktop screenshots. A minimal backend integration fix was included so newly created sources keep their intended `NeverSynced` health and requested poll interval instead of falling back to EF default values.

# Frontend Integration

- Regenerated `/home/runner/work/HomeOps/HomeOps/src/HomeOps.Client/src/api/homeOpsApiClient.ts` from the finalized OpenAPI and used the generated `listEventSources`, `createEventSource`, `updateEventSource`, `deleteEventSource`, `refreshEventSource`, and `refreshAllEventSources` methods as the source of truth.
- Added `/home/runner/work/HomeOps/HomeOps/src/HomeOps.Client/src/calendarSources/calendarSourcesApi.ts` to normalize DTOs, expose household-friendly labels, sanitize error messaging, and centralize CRUD/refresh behavior.
- Removed the old Agenda demo-source fallback so source state now reflects backend configuration only.
- Added focused frontend coverage for source creation, editing, refresh, toggle, delete, empty-state, warning-badge, and error-sanitization behavior.

# Settings

- Added a bounded `Kalenderbronnen` management card to `/home/runner/work/HomeOps/HomeOps/src/HomeOps.Client/src/settings/SettingsDashboard.tsx`.
- Each source card now shows icon, name, type, enabled state, health state, poll interval, last sync, next attempt, provider summary, last error, and primary actions.
- Added source creation for iCal Feed and iCal File, editing for name/icon/enabled/poll interval/provider settings, deletion for user-managed sources, source refresh, and refresh-all.
- Preserved the protected manual source with household-friendly copy instead of destructive controls.
- Added loading, empty, validation, and progress states without requiring page reloads.

# Calendar Bronnen

- Updated `/home/runner/work/HomeOps/HomeOps/src/HomeOps.Client/src/widgets/components/AgendaWidget.tsx` and related agenda helpers so `Bronnen` reflects backend-configured sources.
- Disabled unavailable sources in the Agenda selector and added compact state hints for failed/disabled/never-synced behavior.
- Ensured the Agenda source list shows manual, healthy, failed, and disabled configured sources without duplicating source-management logic.

# Refresh UX

- Source cards support individual `Verversen` actions with in-place progress and result messaging.
- `Alles verversen` refreshes all supported enabled sources and keeps the source list visible while results are summarized in the status card.
- Refresh result summaries now report created/updated/deleted/unchanged counts in Dutch product language.

# Error Handling

- Sanitized source failure messaging in the frontend so Settings and refresh summaries avoid raw HTTP/provider wording.
- Settings now shows household-friendly retry guidance for feed lookup failures, invalid configuration, inaccessible files, invalid file content, timeouts, and unsupported providers.
- Failed refreshes keep the source visible and retryable.

# Accessibility

- Preserved keyboard-reachable dialogs and source actions inside the existing Settings bounded-dialog pattern.
- Added explicit labels for source toggles, dialog close actions, source form fields, and the Agenda Bronnen group.
- Verified the primary Calendar Sources flows through automated browser interaction using real buttons, inputs, toggles, and dialogs.

# Responsive Review

- Validated the Settings and Agenda Calendar Sources surfaces at desktop review size (`1440×1024`) with no document-level vertical overflow during the exercised flows.
- Captured final review screenshots at `1600×1200` and confirmed the bounded Settings and Agenda compositions remained within the viewport.
- Kept overflow ownership inside existing page regions rather than reintroducing page scrolling.

# Screenshots

- `docs/reports/2026-07-05-calendar-frontend-integration/settings-calendar-sources.png`
- `docs/reports/2026-07-05-calendar-frontend-integration/settings-add-source-dialog.png`
- `docs/reports/2026-07-05-calendar-frontend-integration/settings-refresh-results.png`
- `docs/reports/2026-07-05-calendar-frontend-integration/agenda-bronnen.png`

# Backend Integration Fixes

- Updated `/home/runner/work/HomeOps/HomeOps/src/HomeOps.Api/Data/HomeOpsDbContext.cs` to use explicit enum sentinels for `EventSource.HealthStatus` and `EventSource.PollInterval`, preventing EF Core from discarding explicit `NeverSynced` / requested poll-interval values during source creation.
- Extended `/home/runner/work/HomeOps/HomeOps/tests/HomeOps.Api.Tests/CalendarEvents/CalendarSourceManagementApiTests.cs` to lock in the corrected create behavior.
- Updated VisualReview fixture builders so the seeded manual source remains marked as the protected system source during frontend review.

# Tests

- `dotnet restore HomeOps.sln`
- `dotnet build HomeOps.sln --no-restore`
- `dotnet test HomeOps.sln --no-build`
- `cd src/HomeOps.Client && npm test`
- `cd src/HomeOps.Client && npm run build`
- `npx --yes nswag run nswag.json`
- `cd src/HomeOps.Client && npx vitest run src/settings/SettingsDashboard.test.tsx src/widgets/components/AgendaWidget.test.tsx src/agenda/calendarEventsApi.test.ts src/agenda/layerSettings.test.ts src/workspaces/WorkspaceShell.test.tsx`
- `cd src/HomeOps.Client && npx vitest run src/calendarSources/calendarSourcesApi.test.ts src/settings/SettingsDashboard.test.tsx src/workspaces/WorkspaceShell.test.tsx`
- `dotnet test tests/HomeOps.Api.Tests/HomeOps.Api.Tests.csproj --filter "CalendarSourceManagementApiTests|VisualReviewFixtureApiTests"`
- Browser validation via `/tmp/homeops-playwright/validate-calendar-sources-ui.js` covering Settings create/edit/delete/toggle/refresh/refresh-all plus Agenda Bronnen visibility

# Risks

- iCal File management still depends on backend-managed file references rather than direct browser upload, so household setup for file-based sources remains more administrative than feed-based setup.
- Full repository validation still carries the pre-existing NU1903 warning for `SQLitePCLRaw.lib.e_sqlite3` in the test project.
- Vite still reports the pre-existing large-chunk build warning during production build.

# Modified Files

- `src/HomeOps.Api/Data/HomeOpsDbContext.cs`
- `src/HomeOps.Api/VisualReviewFixtures/MarketingHouseholdFixtureBuilder.cs`
- `src/HomeOps.Api/VisualReviewFixtures/VisualReviewFixtureService.cs`
- `src/HomeOps.Client/src/api/homeOpsApiClient.ts`
- `src/HomeOps.Client/src/agenda/calendarEventsApi.ts`
- `src/HomeOps.Client/src/agenda/calendarEventsApi.test.ts`
- `src/HomeOps.Client/src/agenda/layerSettings.ts`
- `src/HomeOps.Client/src/calendarSources/calendarSourcesApi.ts`
- `src/HomeOps.Client/src/calendarSources/calendarSourcesApi.test.ts`
- `src/HomeOps.Client/src/events/eventSourceModel.ts`
- `src/HomeOps.Client/src/settings/SettingsDashboard.tsx`
- `src/HomeOps.Client/src/settings/SettingsDashboard.test.tsx`
- `src/HomeOps.Client/src/styles.css`
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.tsx`
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.test.tsx`
- `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx`
- `src/HomeOps.Client/src/workspaces/WorkspaceShell.test.tsx`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarSourceManagementApiTests.cs`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-07-05-calendar-frontend-integration/calendar-frontend-integration.md`
- `docs/reports/2026-07-05-calendar-frontend-integration/settings-calendar-sources.png`
- `docs/reports/2026-07-05-calendar-frontend-integration/settings-add-source-dialog.png`
- `docs/reports/2026-07-05-calendar-frontend-integration/settings-refresh-results.png`
- `docs/reports/2026-07-05-calendar-frontend-integration/agenda-bronnen.png`
