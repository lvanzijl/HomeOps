# Summary

Cleaned up the visible Settings copy so household users see concise Dutch wording instead of Product Owner or implementation-oriented language, while keeping restore safety, validation feedback, loading states, and source-management behavior unchanged.

# Implemented changes

- Rewrote the Settings dashboard summary, panel, and dialog copy to remove viewport/layout/internal implementation wording.
- Renamed maintenance-oriented labels to simpler household-facing wording.
- Updated iCal file field labels and helper copy to remove internal terminology while preserving the same inputs and validation flow.
- Localized remaining English calendar portability fallback messages to Dutch.
- Removed `HomeOps`, `API`, and provider-internal wording from Settings-facing error messages shown through calendar source and restore flows.
- Updated related frontend tests for the revised Dutch copy where assertions depended on the old text.

# Exact text removed

- `Herstellen opent in een begrensd paneel met controle vooraf.`
- `Kalenderbronnen, back-up en herstel blijven beschikbaar zonder dat de pagina druk wordt.`
- `Gedetailleerde validatie blijft beschikbaar in een begrensd paneel wanneer dat nodig is.`
- `Bekijk de rustige onderhoudssamenvatting zonder de hoofdpagina te verlengen.`
- `Open aanvullende gezinsinstellingen in een begrensd paneel.`
- `Werk naam, icoon, ritme of providerinstellingen rustig bij.`
- `Voeg een nieuwe iCal-bron toe zonder de API te gebruiken.`
- `Gebruik de opgeslagen bestandsreferentie, bestandsnaam en inhoudscontrole van het iCal-bestand dat HomeOps al kan lezen.`
- `HomeOps kon deze kalenderbron niet opslaan. Controleer de ingevulde gegevens en probeer het opnieuw.`
- `HomeOps kon deze bron niet ophalen. Controleer het adres en probeer het opnieuw.`
- `The selected file is not valid JSON.`
- `The calendar export could not be restored. Please review the validation errors and try again.`

# Exact text renamed

- `Onderhoudsbewijs` → `Overzicht`
- `Status en validatie` → `Meldingen`
- `Onderhoudsrail` → `Snelle acties`
- `Onderhoudsdetails` → `Details bekijken`
- `Herstelgereedheid` → `Herstelstatus`
- `Gezinsconfiguratie` → `Extra instellingen`
- `Bestandsreferentie` → `Bestandslocatie`
- `Inhoudscontrole` → `Controlecode`

# Localization changes

- Translated calendar portability fallback values from English to Dutch:
  - `Unknown format` → `Onbekend formaat`
  - `Unknown timestamp` → `Onbekend tijdstip`
  - JSON/restore/server fallback messages now use Dutch household-facing wording
- Replaced Settings-visible calendar source error text with Dutch copy that removes product/internals wording:
  - `HomeOps ...` variants became neutral Dutch error messages
  - `UnsupportedProvider` messaging now avoids provider-internal wording

# Accessibility verification

- Preserved restore warning text, destructive confirmation checkbox flow, dialog roles, status/alert roles, loading states, and existing source toggle labels.
- Verified with focused frontend tests covering Settings dialogs, restore confirmation, button labels, file input labels, and source actions.

# Build verification

- PASS — `dotnet restore HomeOps.sln`
- PASS — `dotnet build HomeOps.sln`
- PASS — `dotnet test HomeOps.sln`
- PASS — `npm test`
- PASS — `npm run build`
- PASS — `npx vitest run src/settings/SettingsDashboard.test.tsx src/calendarSources/calendarSourcesApi.test.ts`
- Notes:
  - `dotnet` emitted the pre-existing `NU1903` warning for `SQLitePCLRaw.lib.e_sqlite3` in `tests/HomeOps.Api.Tests`.
  - Vite emitted the existing production chunk-size warning during frontend build.

# Risks

- Copy assertions in any future tests that hardcode old Settings wording will need the new Dutch strings.
- iCal file labels are now more household-oriented, so any external documentation that quoted the old internal field names would need matching wording updates.

# Modified files

- `src/HomeOps.Client/src/settings/SettingsDashboard.tsx`
- `src/HomeOps.Client/src/calendarPortability.ts`
- `src/HomeOps.Client/src/calendarSources/calendarSourcesApi.ts`
- `src/HomeOps.Client/src/calendarSources/calendarSourcesApi.test.ts`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-07-09-settings-copy-cleanup/settings-copy-cleanup.md`
