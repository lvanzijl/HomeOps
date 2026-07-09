# Tasks copy cleanup

## Summary
Removed Product Owner and implementation-facing copy from the Tasks experience while keeping the existing Tasks layout, flows, labels, validation, and actions intact.

## Implemented changes
- Shortened the Tasks header copy to focus on today instead of layout behavior.
- Replaced planning and overlay helper copy that described bounded lists or page growth with concise task-oriented text.
- Simplified secondary rail helper text for Later, Ooit, Afgerond, Routines, and Week plannen.
- Renamed the template entry point from `Routinestarters` to `Routines` and aligned the template save action copy.
- Shortened visible group descriptions for Vandaag, Morgen, Deze week, Later, and Afgerond.
- Updated the related Tasks test to use the renamed visible routine label.

## Exact text removed
- `Doe vandaag eerst; planning en beheer blijven compact beschikbaar.`
- `Bekijk morgen, deze week en later zonder de pagina langer te maken.`
- `Alles wat vandaag aandacht vraagt in één bounded lijst.`

## Exact text renamed
- `Familie-acties voor vandaag` → `Vandaag`
- `Nu eerst: alles wat vandaag aandacht nodig heeft.` → `Pak deze taken vandaag op.`
- `Klaarzetten zonder de dag drukker te maken.` → `Kijk wat morgen klaarstaat.`
- `Binnenkort, maar niet meteen nu.` → `Bekijk wat later deze week speelt.`
- `Rustig vooruit kijken.` → `Bewaar taken voor later.`
- `Net klaar, zodat terugzetten mogelijk blijft.` → `Bekijk wat net is afgerond.`
- `Rustig vooruit` → `Later oppakken`
- `Bewaren zonder druk` → `Idee bewaren`
- `Terugzetten blijft dichtbij` → `Bekijk en herstel`
- `Routinestarters` → `Routines`
- `Routines klaarzetten` → `Snel opnieuw gebruiken`
- `Kies samen wat deze week helpt` → `Kies voor deze week`
- `Houd zicht op morgen en deze week zonder meerdere lijsten te lezen.` → `Houd zicht op morgen en deze week.`
- `Net afgerond, zodat terugzetten dichtbij blijft.` → `Bekijk wat net is afgerond.`
- `Bewaar rustige ideeën zonder ze standaard in beeld te houden.` → `Bewaar ideeën voor later.`
- `Gebruik vaste klusjes opnieuw nadat duidelijk is wat vandaag nodig is.` → `Gebruik routines opnieuw.`
- `Opslaan als routine starter` → `Opslaan als routine`

## Duplicate text removed
- Reduced duplicate header framing by renaming the eyebrow `Familie-acties voor vandaag` to `Vandaag`, so it no longer repeats the page title `Taken voor het gezin`.

## Accessibility verification
- Kept existing dialog labels, form labels, button actions, loading states, error handling, and task-management flows unchanged.
- Verified Tasks interaction coverage through the focused Tasks frontend test and the full frontend test suite.

## Build verification
- Environment prepared with the repository-local exports for `PACKAGE_HOME`, `DOTNET_HOME`, `DOTNET_CLI_HOME`, `NUGET_PACKAGES`, `npm_config_cache`, and `PATH`.
- `dotnet restore HomeOps.sln`
- `dotnet build HomeOps.sln`
- `dotnet test HomeOps.sln`
- `cd src/HomeOps.Client && npm test -- src/tasks/TasksPage.test.tsx`
- `cd src/HomeOps.Client && npm test -- --runInBand`
- `cd src/HomeOps.Client && npm run build`
- Notes:
  - `dotnet restore` and `dotnet build` emitted the existing `NU1903` warning for `SQLitePCLRaw.lib.e_sqlite3` 2.1.11 in `tests/HomeOps.Api.Tests/HomeOps.Api.Tests.csproj`.
  - `npm run build` emitted the existing Vite chunk-size warning for the production bundle.

## Risks
- Copy updates are limited to the Tasks surface, so the main risk is test brittleness around exact visible strings.
- The routines label change from `Routinestarters` to `Routines` assumes the simpler terminology is acceptable across the Tasks workflow.

## Modified files
- `/home/runner/work/HomeOps/HomeOps/src/HomeOps.Client/src/tasks/TasksPage.tsx`
- `/home/runner/work/HomeOps/HomeOps/src/HomeOps.Client/src/tasks/TasksPage.test.tsx`
- `/home/runner/work/HomeOps/HomeOps/docs/reports/2026-07-09-tasks-copy-cleanup/tasks-copy-cleanup.md`
