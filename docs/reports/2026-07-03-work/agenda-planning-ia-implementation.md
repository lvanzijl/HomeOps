# Agenda Planning IA Implementation

## Summary

Implemented the first frontend-only Agenda information-architecture slice by making Planning the default Agenda experience, removing Week from the visible primary IA, and keeping Month available only through a contextual `Maand bekijken` workflow.

## Files changed

- `src/HomeOps.Client/src/widgets/components/AgendaWidget.tsx`
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.test.tsx`
- `src/HomeOps.Client/src/styles.css`
- `tools/marketing-recording/storyboards/marketing-preview-v1.mjs`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-07-03-work/agenda-planning-ia-implementation.md`

## How implementation follows the approved Agenda IA analysis

- Agenda now opens on a Planning briefing instead of Month / Week / List tabs.
- The default surface answers the approved family question with always-visible Today, Straks, Morgen, weekly-load, and special-date cues plus grouped upcoming event detail.
- Month remains a bounded planning/date-selection workflow and no longer appears as a permanent peer mode.
- Planning and Month are never shown side-by-side by default.

## Default Planning behaviour

- Agenda defaults to `Planningoverzicht`.
- The planning summary row highlights:
  - today;
  - next up (`Straks`);
  - tomorrow;
  - weekly-load cues;
  - special upcoming dates when existing event/source data already implies them.
- The lower planning region keeps fixed groups for `Vandaag`, `Morgen`, `Later deze week`, and `Binnenkort`, with internal empty states when a group has no events.
- Existing event cards, edit/delete actions, and source filtering remain available from the planning groups.

## Week removal/demotion

- Week is no longer visible as a first-class Agenda mode.
- The primary UI no longer exposes Month / Week / List as equal tabs.
- Existing internal Week rendering code was left untouched in this slice because it is no longer reachable from the product UI; removing that dead/internal code can be handled as a follow-up cleanup.

## Month contextual workflow

- Month is now opened through the contextual `Maand bekijken` action.
- Returning to the default briefing uses `Terug naar planning`.
- The Month workspace remains bounded, preserves selected-day behaviour, and keeps event creation/editing/deleting available without introducing page scrolling as part of the implementation intent.

## Backend/API confirmation

- No backend files changed.
- No API contracts changed.
- No database schema, migration, seed, or persistence changes were made.
- Agenda still uses the existing loaded events and source data only.

## Tests updated

- Updated Agenda widget tests for the Planning-first default, contextual Month access, removed Week/List primary IA, VisualReview anchor behaviour, and preserved CRUD/filtering paths.
- Updated the executable marketing storyboard Agenda scene so it references the implemented Planning-first selectors instead of the obsolete Month / Week / List tour.

## Validation performed

- `dotnet restore HomeOps.sln`
- `dotnet build HomeOps.sln`
- `dotnet test HomeOps.sln`
- `cd src/HomeOps.Client && npm ci`
- `cd src/HomeOps.Client && npm test -- --run src/widgets/components/AgendaWidget.test.tsx`
- `cd src/HomeOps.Client && npm run build`

## Remaining follow-ups

- Remove the now-unreachable internal Week workspace/component/style code if the repository wants a dedicated cleanup slice.
- Run the broader frontend/repository validation pass after this slice together with any adjacent queued frontend work if needed.

## Confirmation that no binary files or cache artifacts were added

No binary files, screenshots, videos, image/PDF artifacts, or repository-local cache directories were added to the intended implementation changeset.
