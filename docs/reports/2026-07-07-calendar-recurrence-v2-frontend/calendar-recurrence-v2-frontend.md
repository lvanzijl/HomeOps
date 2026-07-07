# Summary

Completed the final Calendar Recurrence V2 frontend slice by regenerating the finalized NSwag client, replacing temporary recurrence handling with backend-backed series and occurrence operations, extending Agenda with compact Dutch recurrence UX, and validating recurring create/edit/delete/skip/restore behavior end to end. A minimal backend integration adjustment was preserved so recurring occurrences expose `EventSeriesId` and editable series contracts include `Location`, which the finalized frontend flows require.

# Frontend Integration

- Regenerated `/home/runner/work/HomeOps/HomeOps/src/HomeOps.Client/src/api/homeOpsApiClient.ts` from the finalized backend OpenAPI with recurrence summaries, occurrence operations, and updated series contracts.
- Reworked `/home/runner/work/HomeOps/HomeOps/src/HomeOps.Client/src/agenda/calendarEventsApi.ts` to use the generated client as the source of truth for series CRUD, one-occurrence edits, skip/restore, this-and-future split/delete, and recurrence-aware mapping.
- Extended `/home/runner/work/HomeOps/HomeOps/src/HomeOps.Client/src/events/eventSourceModel.ts` so agenda events carry `eventSeriesId`, `occurrenceKey`, recurrence state, exception state, and recurrence summaries.
- Preserved the existing Agenda event flow rather than creating a separate recurrence screen.

# Event Dialog

- Added a compact `Herhalen` section to `/home/runner/work/HomeOps/HomeOps/src/HomeOps.Client/src/widgets/components/AgendaWidget.tsx`.
- Supported `Niet herhalen`, `Dagelijks`, `Wekelijks`, `Maandelijks`, and `Jaarlijks`.
- Kept the normal conversation flow for title, date, day kind, and details while progressively revealing only the recurrence controls relevant to the selected frequency.
- Added editable location support alongside title, description, date, time, and all-day recurrence inputs.

# Recurrence UX

- Weekly recurrence now exposes weekday chips plus interval and end mode.
- Monthly recurrence now exposes day-of-month plus interval and end mode.
- Yearly recurrence now exposes month/day plus interval and end mode.
- End mode supports `Nooit`, `Op datum`, and `Na aantal keer`, with only the required fields visible for the selected mode.
- Added compact household-facing summaries such as weekly/day-of-month/yearly phrasing and end-condition phrasing without exposing domain terms.
- Added inline loading feedback for save, split, delete, skip, and restore actions.

# Edit Scope

- Editing a recurring occurrence now opens a scope dialog on save.
- `Alleen deze afspraak` is offered only when recurrence settings stay unchanged.
- `Deze en volgende afspraken` uses the backend split operation.
- `Hele reeks` updates the full recurring series.

# Skip & Restore

- Added direct `Deze keer overslaan` in the recurring event dialog for the common skip workflow.
- Added `Deze keer terugzetten` in both the dialog and the post-skip banner when restoration is possible.
- Kept delete scope separate from skip so families can skip quickly without entering the delete dialog.

# Calendar Display

- Recurring events now render from backend occurrence projections instead of temporary series-only frontend assumptions.
- Edited single occurrences can move to their replacement date/time without leaving duplicates behind in the original slot.
- Skipped and deleted-single occurrences disappear from the calendar and can be restored through the occurrence API.
- This-and-future edits and deletes use backend occurrence targeting so past history remains visible while future behavior changes.

# Validation

- Friendly validation now surfaces household-facing Dutch messages such as:
  - `Kies minstens één weekdag.`
  - `Kies een geldige datum.`
  - `Vul in hoe vaak deze afspraak zich herhaalt.`
- API error handling stays non-technical and avoids exception names or raw backend terminology.
- Automated browser validation covered:
  - create recurring event
  - edit one occurrence
  - edit whole series
  - edit this and following
  - skip occurrence
  - restore occurrence
  - delete one occurrence
  - delete future occurrences
  - delete whole series
  - recurrence summaries
  - validation messages
  - viewport checks
  - keyboard/label checks

# Accessibility

- Preserved accessible dialog roles and close controls.
- Added explicit labels for recurrence frequency, interval, end mode, weekday picker, month/day controls, and scope dialogs.
- Verified keyboard close with `Escape` and label-based checkbox/select interaction in browser review.

# Responsive Review

- Validated Agenda at `1600×1200` with no document-level vertical or horizontal overflow on the primary page.
- Validated Agenda at `390×844` with no horizontal overflow.
- Kept the main recurring workflows inside Agenda-owned surfaces rather than reintroducing page scrolling.

# Screenshots

- `docs/reports/2026-07-07-calendar-recurrence-v2-frontend/agenda-planning.png`
- `docs/reports/2026-07-07-calendar-recurrence-v2-frontend/agenda-month-recurring.png`
- `docs/reports/2026-07-07-calendar-recurrence-v2-frontend/agenda-recurrence-dialog.png`
- `docs/reports/2026-07-07-calendar-recurrence-v2-frontend/agenda-save-scope-dialog.png`

# Backend Integration Fixes

- Added `EventSeriesId` to `/home/runner/work/HomeOps/HomeOps/src/HomeOps.Contracts/Events/NormalizedEvent.cs` so the frontend can target the correct series when editing recurring occurrences.
- Added `Location` to event series create/update/read contracts and propagated it through the calendar projection/endpoints so occurrence edits and split flows can round-trip editable series data.
- Regenerated `/home/runner/work/HomeOps/HomeOps/src/HomeOps.Contracts/openapi.json` after those minimal integration fixes.

# Tests

- `dotnet build HomeOps.sln`
- `dotnet test HomeOps.sln --no-build`
- `cd /home/runner/work/HomeOps/HomeOps/src/HomeOps.Client && npx vitest run src/widgets/components/AgendaWidget.test.tsx`
- `cd /home/runner/work/HomeOps/HomeOps/src/HomeOps.Client && npm test`
- `cd /home/runner/work/HomeOps/HomeOps/src/HomeOps.Client && npm run build`
- `npx --yes nswag run /home/runner/work/HomeOps/HomeOps/nswag.json`
- Browser validation via `/tmp/homeops-playwright/validate-recurrence-ui.js` against the real frontend and backend with `visual-marketing-agenda`

# Risks

- Full repository validation still reports the pre-existing `NU1903` warning for `SQLitePCLRaw.lib.e_sqlite3` in `tests/HomeOps.Api.Tests`.
- Frontend production build still reports the pre-existing Vite large-chunk warning even though the build succeeds.

# Modified Files

- `src/HomeOps.Api/CalendarEvents/EventOccurrence.cs`
- `src/HomeOps.Api/CalendarEvents/EventOccurrenceProjector.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeriesDtos.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeriesEndpoints.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeriesNormalizer.cs`
- `src/HomeOps.Api/EventSources/Birthdays/BirthdaySourceAdapter.cs`
- `src/HomeOps.Api/EventSources/GoogleCalendar/GoogleCalendarAdapter.cs`
- `src/HomeOps.Client/src/agenda/calendarEventsApi.ts`
- `src/HomeOps.Client/src/agenda/calendarEventsApi.test.ts`
- `src/HomeOps.Client/src/api/homeOpsApiClient.ts`
- `src/HomeOps.Client/src/events/eventSourceModel.ts`
- `src/HomeOps.Client/src/styles.css`
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.tsx`
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.test.tsx`
- `src/HomeOps.Contracts/Events/NormalizedEvent.cs`
- `src/HomeOps.Contracts/openapi.json`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarRecurrenceV2ManualEventApiTests.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarRecurrenceV2OccurrenceOperationApiTests.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarRecurrenceV2SeriesSplitApiTests.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarSourceDomainContractsTests.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/EventOccurrenceProjectionTests.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/ManualEventApiTests.cs`
- `tests/HomeOps.Api.Tests/Events/EventFrameworkModelTests.cs`
- `tests/HomeOps.Api.Tests/Lists/VisualReviewFixtureApiTests.cs`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-07-07-calendar-recurrence-v2-frontend/calendar-recurrence-v2-frontend.md`
- `docs/reports/2026-07-07-calendar-recurrence-v2-frontend/agenda-planning.png`
- `docs/reports/2026-07-07-calendar-recurrence-v2-frontend/agenda-month-recurring.png`
- `docs/reports/2026-07-07-calendar-recurrence-v2-frontend/agenda-recurrence-dialog.png`
- `docs/reports/2026-07-07-calendar-recurrence-v2-frontend/agenda-save-scope-dialog.png`
