# Weekly Reset copy cleanup

## Summary
- Removed Product Owner/developer-facing copy from the Weekly Reset experience.
- Kept Weekly Reset actions, confirmations, status feedback, and accessibility hooks unchanged.
- Simplified the Dutch guidance so the page helps families decide what to do next.

## Implemented changes
- Rewrote the Weekly Reset hero and metric descriptions to focus on the family review moment instead of internal behavior.
- Replaced the implementation-facing intention card copy with short guidance about what families should review together.
- Simplified task, goal, shopping, and skip-state helper copy without changing the existing actions or flow.
- Updated the Weekly Reset page test expectations to cover the new visible copy.

## Exact text removed
- `Undo blijft beschikbaar waar dat vandaag al bestaat.`
- `Afgeronde taken blijven afgerond; de taaklogica verandert niet.`
- `Blijft actief, gaat naar later of wordt gearchiveerd met dezelfde taakacties als nu.`
- `Kijk alleen naar lijstjes die mogelijk aandacht vragen; er wordt hier niets automatisch verwijderd.`
- `blijft doorlopen als jullie niets veranderen`

## Exact text renamed
- `Neem samen een rustig moment: vier wat af is, kies wat meegaat en laat los wat niet meer helpt.` → `Kijk samen terug, kies wat meegaat en rond af wat niet meer past.`
- `Verdwijnt uit de werkvoorraad en blijft als voortgang zichtbaar in de terugblik.` → `Even stilstaan bij wat deze week lukte.`
- `Blijft actief, gaat naar later of wordt gearchiveerd met dezelfde taakacties als nu.` → `Taken die samen een rustige keuze vragen.`
- `Doelen en lijstjes blijven bestaan, tenzij jullie bewust archiveren.` → `Doelen en lijstjes om samen kort langs te lopen.`
- `Wat verandert er?` → `Waar letten jullie op?`
- `Jullie maken alleen bewuste keuzes` → `Kies wat nog helpt`
- `Terugkerende taken komen volgens de bestaande regels weer terug.` → `Begin bij wat gelukt is en geef daar even aandacht aan.`
- `Open taken kunnen actief blijven of rustig doorschuiven naar later.` → `Kies per open taak: meenemen, later bewaren of loslaten.`
- `Deze taak wacht op een zachte ja, later of klaar.` → `Samen kiezen: mee, later of loslaten.`
- `Bevestig of ieder kind nog een passend doel heeft.` → `Bekijk samen of ieder kind nog een passend doel heeft.`
- `Kijk alleen naar lijstjes die mogelijk aandacht vragen; er wordt hier niets automatisch verwijderd.` → `Loop samen langs welke lijstjes nog passen bij komende week.`
- `blijft staan voor een bewuste keuze later` → `kijk of deze lijst nog past bij komende week`
- `Prima. Alles blijft zoals het nu is: taken, doelen en lijstjes veranderen niet.` → `Prima. Jullie laten het deze week zoals het is en kunnen later altijd terugkomen.`
- `Bespreek of dit gezinsdoel nog energie geeft voor volgende week.` → `Bespreek of dit gezinsdoel nog past bij komende week.`
- `blijft doorlopen als jullie niets veranderen` → `kijk samen of dit doel nog past`

## Accessibility verification
- Preserved the existing `aria-labelledby="weekly-reset-title"` page heading relationship.
- Preserved the existing section `aria-label` values, visible button labels, and the `role="status"` status message.
- Verified the Weekly Reset page test suite still covers the primary heading, review content, and the skip/reopen flow after the copy updates.

## Build verification
- `dotnet restore HomeOps.sln` — passed with the existing `NU1903` warning for `SQLitePCLRaw.lib.e_sqlite3` 2.1.11 in `tests/HomeOps.Api.Tests/HomeOps.Api.Tests.csproj`.
- `dotnet build HomeOps.sln` — passed with the same existing `NU1903` warning.
- `cd src/HomeOps.Client && npm test` — passed (32 files, 205 tests).
- `cd src/HomeOps.Client && npm run build` — passed with the existing Vite chunk-size warning for bundles over 500 kB.
- Frontend verification required `npm ci` first because `src/HomeOps.Client/node_modules` was not present in the fresh checkout.

## Risks
- Weekly Reset copy assertions remain string-based, so future copy changes in this surface will require test updates.
- Some helper text still references the existing review structure by section, so future Weekly Reset UX changes should review the copy as a set instead of line by line.

## Modified files
- `/home/runner/work/HomeOps/HomeOps/src/HomeOps.Client/src/weeklyReset/WeeklyResetPage.tsx`
- `/home/runner/work/HomeOps/HomeOps/src/HomeOps.Client/src/weeklyReset/WeeklyResetPage.test.tsx`
- `/home/runner/work/HomeOps/HomeOps/docs/reports/2026-07-09-weekly-reset-copy-cleanup/weekly-reset-copy-cleanup.md`
