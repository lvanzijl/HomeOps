# Agenda/Home copy cleanup

## Summary

Removed production-visible demo agenda sources/events from the Home dashboard data merge, shortened remaining Product Owner-facing all-day copy in Agenda, and aligned the Agenda source picker terminology with shared calendar wording.

## Implemented changes

- Removed the Home dashboard import and merge of `demoReadOnlyEventSources` and `demoReadOnlyEvents`, so Home now shows only API-backed agenda data.
- Kept `src/HomeOps.Client/src/demo/demoAgendaData.ts` available for automated tests through `src/HomeOps.Client/src/agenda/agendaUtils.test.ts`.
- Renamed the Agenda source picker label and group label to `Kalenderbronnen`.
- Shortened the Agenda planning cue for all-day events to `Hele dag.`.
- Updated directly related frontend tests to match the production copy and fixture usage.

## Demo content changes

- Production users no longer receive demo agenda sources or demo agenda events through `HomeDashboard.tsx`.
- The demo dataset remains in the repository for automated test coverage only.
- Demo sample content retained for tests only includes:
  - `School Holidays`
  - `TV Series`
  - `Birthdays`
  - `Teacher planning day`
  - `Premièreavond kijken`
  - `Inschrijving zomerkamp bevestigen`
  - `Seizoensfinale-marathon`
  - `Verjaardag Avery`
  - `Verjaardag Morgan`
  - `Verjaardag Riley`
  - `Verjaardag Casey`

## Terminology changes

- Agenda source filtering now uses `Kalenderbronnen` instead of the more generic `Bronnen` wording.
- The all-day planning cue now uses concise household-facing wording without explaining UI visibility behavior.

## Exact text removed

Removed from production-visible Home agenda content by deleting the demo-data merge:

- `School Holidays`
- `TV Series`
- `Birthdays`
- `Teacher planning day`
- `Premièreavond kijken`
- `Inschrijving zomerkamp bevestigen`
- `Seizoensfinale-marathon`
- `Verjaardag Avery`
- `Verjaardag Morgan`
- `Verjaardag Riley`
- `Verjaardag Casey`

## Exact text renamed

- `Hele dag zichtbaar voor het gezin.` → `Hele dag.`
- `Bronnen` → `Kalenderbronnen`
- `Bronnen in de agenda` → `Kalenderbronnen`

## Accessibility verification

- Verified with existing frontend tests that Home and Agenda still expose the expected accessible buttons, group labels, dialogs, and alerts.
- Confirmed the renamed Agenda source selector remains queryable by accessible group name in `src/HomeOps.Client/src/widgets/components/AgendaWidget.test.tsx`.
- Preserved loading, error, sync-state, event-detail, and weather-related accessible UI behavior by keeping existing functionality unchanged.

## Build verification

Environment prepared with repository-local exports for `PACKAGE_HOME`, `DOTNET_HOME`, `DOTNET_CLI_HOME`, `NUGET_PACKAGES`, `npm_config_cache`, and `PATH`.

Commands run:

- `dotnet restore HomeOps.sln`
- `dotnet build HomeOps.sln --no-restore`
- `dotnet test HomeOps.sln --no-build`
- `cd src/HomeOps.Client && npm ci`
- `cd src/HomeOps.Client && npm test`
- `cd src/HomeOps.Client && npm run build`

Results:

- `dotnet restore HomeOps.sln` passed with the existing `NU1903` warning for `SQLitePCLRaw.lib.e_sqlite3` 2.1.11 in `tests/HomeOps.Api.Tests`.
- `dotnet build HomeOps.sln --no-restore` passed with the same existing `NU1903` warning.
- `dotnet test HomeOps.sln --no-build` passed: 354/354 tests.
- `cd src/HomeOps.Client && npm ci` passed.
- `cd src/HomeOps.Client && npm test` passed: 205/205 tests.
- `cd src/HomeOps.Client && npm run build` passed with the existing Vite chunk-size warning for bundles over 500 kB.

## Risks

- The demo agenda dataset still exists in the repository, so future production imports could reintroduce sample content if used outside test-only paths.
- The shared demo fixtures remain English in the test dataset because they are no longer production-visible; if they are intentionally surfaced again later, they should be localized or explicitly gated.

## Modified files

- `src/HomeOps.Client/src/home/HomeDashboard.tsx`
- `src/HomeOps.Client/src/home/HomeDashboard.test.tsx`
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.tsx`
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.test.tsx`
- `src/HomeOps.Client/src/agenda/agendaUtils.test.ts`
- `docs/reports/2026-07-10-agenda-home-copy-cleanup/agenda-home-copy-cleanup.md`
