# Agenda Copy Cleanup

## Summary

Implemented the focused Agenda copy cleanup without changing layout, functionality, information architecture, backend behavior, APIs, schema, migrations, or seeds. The slice removes preview/designer copy, keeps a single visible Agenda page title, and updates the remaining Agenda labels to the requested product wording.

## Files changed

- `docs/reports/2026-07-04-agenda-copy-cleanup/implementation.md`
- `docs/roadmap/phase-2.md`
- `docs/state/current-state.md`
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.test.tsx`
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.tsx`
- `src/HomeOps.Client/src/workspaces/WorkspaceShell.test.tsx`
- `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx`

## Duplicate Agenda heading resolved

- Kept `Agenda` in the primary navigation.
- Kept one visible page title `Agenda` in the workspace header.
- Removed the duplicate Agenda widget title and the extra Agenda-specific header copy so the page content starts immediately after the page title.
- Removed the Agenda-specific header position/supporting copy that repeated the shell pattern instead of helping the Agenda page itself.

## Text removed

- `Dagelijkse gezinsplek` from the Agenda page header.
- `Familieplanning`
- `Wat moet het gezin hierna weten?`
- `Vandaag eerst, daarna de vorm van de week en pas dan rustig vooruitkijken.`
- `Verder vooruit blijft in beeld`
- `Compacte geruststelling voor wat later komt.`
- `Zodra er iets na deze week staat, verschijnt het hier rustig in beeld.`
- `Geen extra drukte zichtbaar`
- `De horizon is rustig`
- `Rustige hulpruimte`
- `Pas gebruiken wanneer iemand wil plannen of iets wil opzoeken.`
- `Ruimte in de agenda.`

## Text replaced

- `Nu telt vooral dit` → `Nu`
- `Planning tools` → `Plannen`
- `Bronnen` → `Agenda's`
- `HomeOps Agenda-gebeurtenissen konden niet worden geladen.` → `De agenda kon niet worden geladen.`
- `Gebeurtenis toevoegen` → `Afspraak toevoegen`
- `Gebeurtenis bewerken` → `Afspraak bewerken`
- `Gebeurtenis maken` → `Afspraak maken`
- `Gebeurtenis opslaan` → `Afspraak opslaan`
- `Wanneer moet het gezin dit onthouden?` → `Wanneer is het?`
- `Optionele notitie voor het gezin` → `Notitie`
- `N afspraken in beeld` → `N afspraken`
- `Begin met de eerste gebeurtenis` → `Nog geen afspraken`
- `Deze dag is nog leeg` → `Geen afspraken`
- `N op de planning.` → `N afspraken.`

## Validation performed

- Baseline repository validation before edits:
  - `dotnet restore HomeOps.sln`
  - `dotnet build HomeOps.sln --no-restore`
  - `dotnet test HomeOps.sln --no-build`
  - `npm ci`
  - `npm test`
  - `npm run build`
- Focused post-change validation:
  - `npm test -- src/widgets/components/AgendaWidget.test.tsx src/workspaces/WorkspaceShell.test.tsx`
  - `npm run build`
- Manual source verification:
  - Confirmed the Agenda workspace header keeps a single visible `Agenda` title.
  - Confirmed the removed strings are absent from the Agenda implementation paths.
  - Confirmed the replacement strings are present in the Agenda implementation paths.

## Functionality confirmation

No functionality changed. Event loading, planning/month navigation, source filtering, and appointment create/edit/delete behavior remained unchanged.

## Binary artifact and cache confirmation

No binary files were added. Repository-local cache directories remained ignored, and no cache artifacts were added to the final changeset.
