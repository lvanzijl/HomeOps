# Member copy cleanup

## Summary
Removed Product Owner and implementation-facing helper copy from Mijn Pagina member dialogs while keeping the existing profile, avatar, progress, validation, accessibility, and feedback behavior unchanged.

## Implemented changes
- Replaced the goals dialog helper copy with concise household-facing Dutch.
- Replaced the history dialog helper copy with concise household-facing Dutch.
- Replaced the settings dialog helper copy with concise household-facing Dutch.
- Updated the related member page tests to verify the renamed dialog descriptions and confirm the audited strings are gone.

## Exact text removed
- `Bekijk persoonlijke voortgang en het gezinsdoel zonder de pagina te vergroten.`
- `Lees waarderingen en vieringen terug in een begrensd overzicht.`
- `Werk profielgegevens en gezinsopties bij in een begrensde beheerweergave.`

## Exact text renamed
- `Bekijk persoonlijke voortgang en het gezinsdoel zonder de pagina te vergroten.` → `Persoonlijke voortgang en gezinsdoel.`
- `Lees waarderingen en vieringen terug in een begrensd overzicht.` → `Waarderingen en vieringen.`
- `Werk profielgegevens en gezinsopties bij in een begrensde beheerweergave.` → `Werk profielgegevens en gezinsopties bij.`

## Accessibility verification
- Kept existing dialog names, profile form labels, avatar controls, validation messaging, and loading or error behavior unchanged.
- Verified the dialog content through the related FamilyMemberPage frontend tests, including the visible renamed helper text.

## Build verification
- Environment prepared with the repository-local exports for `PACKAGE_HOME`, `DOTNET_HOME`, `DOTNET_CLI_HOME`, `NUGET_PACKAGES`, `npm_config_cache`, and `PATH`.
- `dotnet restore HomeOps.sln`
- `dotnet build HomeOps.sln`
- `cd src/HomeOps.Client && npm run build`
- `cd src/HomeOps.Client && npm run test`
- Notes:
  - `dotnet build HomeOps.sln` emitted the existing `NU1903` warning for `SQLitePCLRaw.lib.e_sqlite3` 2.1.11.
  - `npm run build` emits the existing Vite chunk-size warning for the production bundle.

## Risks
- This slice only changes visible dialog copy, so the main risk is brittleness in assertions that depend on exact text.

## Modified files
- `/home/runner/work/HomeOps/HomeOps/src/HomeOps.Client/src/home/FamilyMemberPage.tsx`
- `/home/runner/work/HomeOps/HomeOps/src/HomeOps.Client/src/home/FamilyMemberPage.test.tsx`
- `/home/runner/work/HomeOps/HomeOps/docs/reports/2026-07-09-member-copy-cleanup/member-copy-cleanup.md`
