# Summary

Comprehensive frontend UI copy audit for FamilyBoard completed on 2026-07-09. The application is largely Dutch and family-oriented, but the highest-risk copy is visible reviewer/developer language that explains layout containment, bounded panels, reserved viewport areas, APIs/providers, HomeOps internals, or implementation behavior instead of helping a household user.

Highest priority pages:

1. **Settings** — repeated PO-tekst around bounded panels, validation, maintenance rails, API/provider wording, and HomeOps internals.
2. **Shopping** — visible viewport/layout explanations around fixed/reserved list regions and bounded recovery panels.
3. **Tasks** — visible “bounded” and no-page-growth wording, plus over-explanatory secondary panel descriptions.
4. **Mijn Pagina / member dialogs** — visible bounded/no-page-growth descriptions in context dialogs.
5. **Weekly Reset** — process/implementation copy about undo and current task actions.
6. **Agenda demo data** — English/demo event sources and sample birthdays/events that can become visible.

This is an analysis-only report. No production source files were intentionally changed.

# Scope

Inspected visible user-facing frontend copy in:

- Workspace shell/navigation/page headers.
- Home dashboard cards, quick actions, dialogs, weather detail, member/profile entry points.
- Agenda widget, agenda summaries, calendar source labels, seeded demo agenda data.
- Tasks page, task panels/dialogs, empty/status/error states, task tests that assert copy.
- Shopping widget, list panels/dialogs, list management, status/error states, shopping tests.
- Motivation page, helpful moments, celebration/memory dialogs, motivational data copy.
- Mijn Pagina / family member profile and avatar dialogs.
- Settings dashboard, calendar source management, backup/restore dialogs, portability errors.
- First-run/onboarding wizard and tests.
- Weekly Reset page.
- Shared widget copy/constants, localization/error helpers, visible fallback text.
- Tests and fixtures that intentionally verify or seed visible copy.

Excluded from recommendations to remove: aria labels, form labels, validation messages, destructive confirmations, privacy/safety text, sync/import/export failure explanations, and required status messages. These can still be renamed when they expose implementation terminology.

# Audit methodology

1. Prepared the repository-local environment using detected tool locations and the cache pattern used by prior Codex reports.
2. Ran standard verification: .NET build path and frontend build.
3. Searched source and tests for visible JSX text, string literals returned to UI, status/error messages, demo fixtures, and UI-copy assertions.
4. Performed targeted searches for PO/reviewer/development wording, including `bounded`, `begrensd`, `gereserveerd`, `vaste vak`, `zonder de pagina`, `zonder de hoofdpagina`, `standaardweergave`, `API`, `provider`, `HomeOps`, `bewijs`, `validatie`, `rail`, `demo`, `voorbeeld`, and `review`.
5. Classified each audited text group by intended audience and required action.
6. Prioritized findings by release risk and user impact.

# Statistics

| Metric | Count / estimate |
|---|---:|
| Total visible texts inspected | ~430 |
| PO-teksten | 34 |
| Demoteksten | 18 |
| Gebruikersteksten | ~378 |
| Remove candidates | 25 |
| Shorten candidates | 22 |
| Rename candidates | 11 |
| Needs product decision | 5 |
| Estimated duplicate texts | 12 |
| Estimated vertical space savings | 18-28 visible lines across primary pages/dialogs |
| Highest priority pages | Settings, Shopping, Tasks, Mijn Pagina, Weekly Reset, Agenda demo fixtures |

# Classification rules

- **PO-tekst**: visible text intended for developers, reviewers, Product Owners, or design validation rather than real household users. Typical markers: layout explanation, viewport explanation, implementation behavior, bounded/reserved region wording, API/provider/internal wording, review annotations.
- **Demotekst**: temporary sample, placeholder, fixture, or English/demo data that can become visible as if it were real household content.
- **Gebruikerstekst**: production UI copy that helps a household user understand state, complete an action, avoid mistakes, or recover from errors.

Required action meanings:

- **Remove**: do not show this text to real users.
- **Shorten**: useful copy, but too long/repetitive/space-consuming.
- **Rename**: concept is useful but the label/term is inconsistent, abstract, or implementation-oriented.
- **Keep**: production-appropriate.
- **Needs product decision**: depends on product scope or whether demo/future functionality remains production-visible.

# P0 findings

| Exact visible text | Component/file | Lines | Classification | Priority | Reason | Recommended action |
|---|---|---:|---|---|---|---|
| `Alles wat vandaag aandacht vraagt in één bounded lijst.` | `src/HomeOps.Client/src/tasks/TasksPage.tsx` | 841-842 | PO-tekst | P0 | Exposes English implementation/review term “bounded” in Dutch UI. | Remove; use `Taken voor vandaag.` or no dialog description. |
| `De actieve lijst wordt in dit vaste vak geladen.` | `src/HomeOps.Client/src/widgets/components/ShoppingListWidget.tsx` | 168-172 | PO-tekst | P0 | Explains fixed viewport/layout region instead of user task. | Remove; keep only `Boodschappen laden…`. |
| `Deze ruimte blijft gereserveerd voor de actieve lijst per winkel.` | `src/HomeOps.Client/src/widgets/components/ShoppingListWidget.tsx` | 191-193 | PO-tekst | P0 | Explicit reserved-area/viewport wording and unnecessary vertical space. | Remove; replace with direct empty state if needed. |
| `Herstellen opent in een begrensd paneel met controle vooraf.` | `src/HomeOps.Client/src/settings/SettingsDashboard.tsx` | 104-108 | PO-tekst | P0 | Explains implementation container, not restore task. | Remove; use restore status/action copy. |
| `Gedetailleerde validatie blijft beschikbaar in een begrensd paneel wanneer dat nodig is.` | `src/HomeOps.Client/src/settings/SettingsDashboard.tsx` | 599-602 | PO-tekst | P0 | Combines technical validation and bounded-panel explanation. | Remove when no validation errors; keep actual errors. |
| `Bekijk de rustige onderhoudssamenvatting zonder de hoofdpagina te verlengen.` | `src/HomeOps.Client/src/settings/SettingsDashboard.tsx` | 632-635 | PO-tekst | P0 | Directly explains no-page-scroll viewport strategy. | Remove; title is enough. |
| `Open aanvullende gezinsinstellingen in een begrensd paneel.` | `src/HomeOps.Client/src/settings/SettingsDashboard.tsx` | 723-726 | PO-tekst | P0 | Visible implementation/layout language. | Remove; title is enough. |
| `Voeg een nieuwe iCal-bron toe zonder de API te gebruiken.` | `src/HomeOps.Client/src/settings/SettingsDashboard.tsx` | 737-740 | PO-tekst | P0 | Exposes API/developer implementation to household users. | Rename to `Voeg een iCal-bron toe.` |
| `Deze bron gebruikt HomeOps zonder extra providerdetails op de pagina.` | `src/HomeOps.Client/src/settings/SettingsDashboard.tsx` | 1009-1011 | PO-tekst | P0 | Exposes internal provider/page-detail wording. | Remove or rename to `Geen extra details beschikbaar.` |
| `Undo blijft beschikbaar waar dat vandaag al bestaat.` | `src/HomeOps.Client/src/weeklyReset/WeeklyResetPage.tsx` | 97-101 | PO-tekst | P0 | Implementation capability/checklist note, not household guidance. | Remove. |

# P1 findings

| Exact visible text | Component/file | Lines | Classification | Priority | Reason | Recommended action |
|---|---|---:|---|---|---|---|
| `Bekijk morgen, deze week en later zonder de pagina langer te maken.` | `src/HomeOps.Client/src/tasks/TasksPage.tsx` | 838-840 | PO-tekst | P1 | Explains viewport behavior. | Remove or shorten to `Morgen en later.` |
| `Doe vandaag eerst; planning en beheer blijven compact beschikbaar.` | `src/HomeOps.Client/src/tasks/TasksPage.tsx` | 482-487 | PO-tekst | P1 | “compact beschikbaar” describes layout strategy. | Remove or shorten to `Vandaag eerst.` |
| `Open recente verwijderingen in een begrensd herstelvak.` | `src/HomeOps.Client/src/widgets/components/ShoppingListWidget.tsx` | 323-329 | PO-tekst | P1 | Bounded recovery panel wording is not user-facing. | Rename to `Recent verwijderd.` |
| `Schakel naar ondersteunende lijsten zonder de standaardweergave uit te breiden.` | `src/HomeOps.Client/src/widgets/components/ShoppingListWidget.tsx` | 329-330 | PO-tekst | P1 | Explains default-view/layout behavior. | Rename to `Andere lijsten.` |
| `Bekijk wat al is afgehandeld zonder de actieve lijst te verplaatsen.` | `src/HomeOps.Client/src/widgets/components/ShoppingListWidget.tsx` | 323-327 | PO-tekst | P1 | Explains preservation of layout rather than task. | Rename to `Afgevinkte boodschappen.` |
| `Hernoem, archiveer of verwijder de huidige boodschappenlijst op aanvraag.` | `src/HomeOps.Client/src/widgets/components/ShoppingListWidget.tsx` | 331-332 | Gebruikerstekst | P1 | Useful but verbose; repeats visible actions. | Shorten to `Lijst beheren.` |
| `Bekijk persoonlijke voortgang en het gezinsdoel zonder de pagina te vergroten.` | `src/HomeOps.Client/src/home/FamilyMemberPage.tsx` | 257-262 | PO-tekst | P1 | Explicit no-page-growth wording. | Remove or shorten to `Persoonlijke voortgang en gezinsdoel.` |
| `Lees waarderingen en vieringen terug in een begrensd overzicht.` | `src/HomeOps.Client/src/home/FamilyMemberPage.tsx` | 279-284 | PO-tekst | P1 | Bounded overview language. | Rename to `Waarderingen en vieringen.` |
| `Werk profielgegevens en gezinsopties bij in een begrensde beheerweergave.` | `src/HomeOps.Client/src/home/FamilyMemberPage.tsx` | 300-305 | PO-tekst | P1 | Implementation/container wording. | Rename to `Werk profielgegevens en gezinsopties bij.` |
| `Onderhoudsbewijs` | `src/HomeOps.Client/src/settings/SettingsDashboard.tsx` | 546-550 | PO-tekst | P1 | “Bewijs” sounds reviewer/product-oriented and duplicates card title. | Rename to `Overzicht` or remove eyebrow. |
| `Status en validatie` | `src/HomeOps.Client/src/settings/SettingsDashboard.tsx` | 570-574 | PO-tekst | P1 | “Validatie” is technical unless actual errors are present. | Rename to `Status` or `Meldingen`. |
| `Onderhoudsrail` | `src/HomeOps.Client/src/settings/SettingsDashboard.tsx` | 609-612 | PO-tekst | P1 | Names the layout region. | Remove or rename to `Acties`. |
| `extra gezinsinstellingen beschikbaar voor rustig onderhoud.` | `src/HomeOps.Client/src/settings/SettingsDashboard.tsx` | 109-111 | PO-tekst | P1 | “Rustig onderhoud” is vague product positioning. | Shorten to `{n} extra instellingen beschikbaar.` |
| `Werk naam, icoon, ritme of providerinstellingen rustig bij.` | `src/HomeOps.Client/src/settings/SettingsDashboard.tsx` | 737-740 | PO-tekst | P1 | “Providerinstellingen” exposes internal terminology; “rustig” adds little. | Rename to `Werk naam, icoon of verversing bij.` |
| `iCal-bestanden in HomeOps` | `src/HomeOps.Client/src/settings/SettingsDashboard.tsx` | 868-870 | PO-tekst | P1 | Internal product mechanics in form help. | Rename to `iCal-bestand`. |
| `Gebruik de opgeslagen bestandsreferentie, bestandsnaam en inhoudscontrole van het iCal-bestand dat HomeOps al kan lezen.` | `src/HomeOps.Client/src/settings/SettingsDashboard.tsx` | 868-871 | PO-tekst | P1 | Technical/internal file-reference wording. | Replace with user-facing import guidance. |
| `Blijft actief, gaat naar later of wordt gearchiveerd met dezelfde taakacties als nu.` | `src/HomeOps.Client/src/weeklyReset/WeeklyResetPage.tsx` | 86-89 | PO-tekst | P1 | Describes implementation equivalence rather than decision. | Shorten to `Actief, later of archiveren.` |
| `Afgeronde taken blijven afgerond; de taaklogica verandert niet.` | `src/HomeOps.Client/src/weeklyReset/WeeklyResetPage.tsx` | 97-100 | PO-tekst | P1 | “Taaklogica” is implementation wording. | Rename to `Afgeronde taken blijven afgerond.` |
| `Family note` | `src/HomeOps.Client/src/widgets/components/TextWidget.tsx` | 3-9 | Demotekst | P1 | English fallback/type label can leak into Dutch UI. | Rename to `Gezinsnotitie` or avoid visible fallback. |
| `The selected file is not valid JSON.` | `src/HomeOps.Client/src/calendarPortability.ts` | 53-55 | Demotekst | P1 | English visible error in Dutch UI. | Localize to Dutch. |
| `The calendar export could not be restored. Please review the validation errors and try again.` | `src/HomeOps.Client/src/calendarPortability.ts` | 57-59 | Demotekst | P1 | English restore error; user-facing. | Localize to Dutch while preserving safety. |
| `HomeOps could not complete the calendar request. Please try again after the server is available.` | `src/HomeOps.Client/src/calendarPortability.ts` | 57-60 | Demotekst | P1 | English + internal product wording. | Localize and shorten. |
| `HomeOps could not complete the calendar portability request.` | `src/HomeOps.Client/src/calendarPortability.ts` | 62-62 | Demotekst | P1 | English + technical “portability” wording. | Localize to user task language. |

# P2 findings

| Exact visible text | Component/file | Lines | Classification | Priority | Reason | Recommended action |
|---|---|---:|---|---|---|---|
| `Familie-acties voor vandaag` | `src/HomeOps.Client/src/tasks/TasksPage.tsx` | 482-485 | Gebruikerstekst | P2 | Abstract and duplicates `Taken voor het gezin`. | Rename to `Vandaag` or remove eyebrow. |
| `Routinestarters` | `src/HomeOps.Client/src/tasks/TasksPage.tsx` | 834-836 | Gebruikerstekst | P2 | Less consistent than `Routines` used elsewhere. | Rename to `Routines` unless product distinction is required. |
| `Net afgerond, zodat terugzetten dichtbij blijft.` | `src/HomeOps.Client/src/tasks/TasksPage.tsx` | 843-845 | Gebruikerstekst | P2 | Warm but verbose; repeats panel title. | Shorten to `Net afgerond.` |
| `Bewaar rustige ideeën zonder ze standaard in beeld te houden.` | `src/HomeOps.Client/src/tasks/TasksPage.tsx` | 845-846 | Gebruikerstekst | P2 | Layout/display explanation. | Shorten to `Taken voor later.` |
| `Gebruik vaste klusjes opnieuw nadat duidelijk is wat vandaag nodig is.` | `src/HomeOps.Client/src/tasks/TasksPage.tsx` | 847-848 | Gebruikerstekst | P2 | Over-explains routine use. | Shorten to `Gebruik routines opnieuw.` |
| `Bekijk losse taken en kies wat het gezin nog helpt.` | `src/HomeOps.Client/src/tasks/TasksPage.tsx` | 848-849 | Gebruikerstekst | P2 | Slightly vague. | Shorten to `Kies taken voor deze week.` |
| `Gedeeld familiekompas` | `src/HomeOps.Client/src/MotivationPage.tsx` | 155-157 | Gebruikerstekst | P2 | Abstract metaphor; could be clearer for families. | Rename to `Familiedoel` or `Samen doel`. |
| `Ondersteunend bewijs bij jullie gedeelde verhaal.` | `src/HomeOps.Client/src/MotivationPage.tsx` | 396-401 | PO-tekst | P2 | “Bewijs” and “gedeelde verhaal” sound like review/story framework. | Rename to `Voortgang per onderdeel.` |
| `Neem samen een rustig moment: vier wat af is, kies wat meegaat en laat los wat niet meer helpt.` | `src/HomeOps.Client/src/weeklyReset/WeeklyResetPage.tsx` | 73-75 | Gebruikerstekst | P2 | Good tone but long for dashboard header. | Shorten to `Kies wat meegaat naar volgende week.` |
| `Verdwijnt uit de werkvoorraad en blijft als voortgang zichtbaar in de terugblik.` | `src/HomeOps.Client/src/weeklyReset/WeeklyResetPage.tsx` | 86-87 | PO-tekst | P2 | “Werkvoorraad” and visibility mechanics are internal. | Shorten to `Afgerond voor de terugblik.` |
| `Deze taak wacht op een zachte ja, later of klaar.` | `src/HomeOps.Client/src/weeklyReset/WeeklyResetPage.tsx` | 118-120 | Gebruikerstekst | P2 | Warm but unclear. | Rename to `Kies: houden, later of archiveren.` |
| `Hele dag zichtbaar voor het gezin.` | `src/HomeOps.Client/src/widgets/components/AgendaWidget.tsx` | 3099-3104 | PO-tekst | P2 | Explains visibility/design; all-day state should be enough. | Rename to `Hele dag.` |
| `Deze handmatige gezinsagenda blijft beschikbaar voor eigen afspraken.` | `src/HomeOps.Client/src/settings/SettingsDashboard.tsx` | 533-535 | Gebruikerstekst | P2 | Useful protection copy but appears in action area and repeats “blijft beschikbaar”. | Shorten to `Handmatige agenda is beschermd.` |
| `Broninstellingen blijven bewaard tot je opslaat.` | `src/HomeOps.Client/src/settings/SettingsDashboard.tsx` | 875-877 | Gebruikerstekst | P2 | Useful but slightly indirect. | Shorten to `Sla op om wijzigingen te bewaren.` |

# P3 findings

| Exact visible text | Component/file | Lines | Classification | Priority | Reason | Recommended action |
|---|---|---:|---|---|---|---|
| `Kies rustig een back-up, controleer de waarschuwing en herstel pas na bevestiging.` | `src/HomeOps.Client/src/settings/SettingsDashboard.tsx` | 659-663 | Gebruikerstekst | P3 | Safe and useful, but “rustig” is repeated tone. | Keep or shorten. |
| `Verwijder alleen bronnen die je echt niet meer nodig hebt.` | `src/HomeOps.Client/src/settings/SettingsDashboard.tsx` | 898-902 | Gebruikerstekst | P3 | Appropriate destructive-action caution. | Keep. |
| `Prima. Alles blijft zoals het nu is: taken, doelen en lijstjes veranderen niet.` | `src/HomeOps.Client/src/weeklyReset/WeeklyResetPage.tsx` | 48-52 | Gebruikerstekst | P3 | Friendly and clear, but slightly long. | Keep or shorten. |
| `Open het weekritueel weer` | `src/HomeOps.Client/src/weeklyReset/WeeklyResetPage.tsx` | 50-52 | Gebruikerstekst | P3 | “Ritueel” is a tone/product choice. | Keep if this is desired brand language. |
| `Taak staat rustig bij later.` | `src/HomeOps.Client/src/weeklyReset/WeeklyResetPage.tsx` | 134-137 | Gebruikerstekst | P3 | Warm status copy; acceptable but can be simpler. | Keep or shorten to `Taak staat bij later.` |

# Findings by page

## Global shell / shared widgets

- `Family note` fallback/type label is English visible copy and should be localized or removed as a visible fallback. See P1.
- Accessibility labels should remain, but if labels include implementation words they should be renamed, not removed.

## Home

- Most Home copy inspected is production-appropriate: date/time, weather, quick actions, loaded/error statuses, and action confirmations help household users.
- Product decision: Home/Agenda may combine API-backed events with demo read-only sources in tests and agenda utilities; ensure demo sources are not production-visible unless explicitly in demo mode.

## Agenda

- Keep calendar state, sync, source labels, import/export validation, and failure explanations.
- Rename `Hele dag zichtbaar voor het gezin.` to avoid describing visibility/design.
- Demo source names/events in `demoAgendaData.ts` need product decision because source names `School Holidays`, `TV Series`, `Birthdays` and sample events such as `Teacher planning day`, `Premièreavond kijken`, and sample birthdays can become visible as household content. `src/HomeOps.Client/src/demo/demoAgendaData.ts` lines 5-35 and 37-115.

## Tasks

- Remove P0/P1 viewport and bounded-list language.
- Shorten secondary panel descriptions.
- Keep task form labels, recurrence options, destructive/archive/delete failures, loading/error states, and status confirmations.

## Shopping

- Remove all fixed/reserved/bounded/default-view descriptions.
- Keep list management, item actions, list creation, destructive actions, and error messages.
- Consider removing duplicate status presentation where the same status is shown in command row and footer.

## Motivation

- Keep warm family-oriented progress, celebrations, and appreciation copy.
- Rename abstract/story-review labels: `Gedeeld familiekompas`, `Ondersteunend bewijs bij jullie gedeelde verhaal.`
- Keep close-button accessibility labels, but ensure dialog labels do not include implementation words.

## Mijn Pagina / member dialogs

- Remove bounded/no-page-growth wording from dialog descriptions.
- Keep profile form labels, member kind, birthday/color/avatar labels, destructive/safety messages, and avatar selection labels.

## Settings

- Highest-priority cleanup surface.
- Remove bounded-panel, no-page-growth, rail, API/provider, validation-as-technical-copy, and internal HomeOps file-reference wording.
- Keep restore warning, confirmation checkbox, file input label, source delete warning, source sync/import errors, and validation lists.

## Onboarding

- Keep setup labels and member creation copy if short and Dutch.
- Tests should not reintroduce old English strings into visible UI expectations.

## Weekly Reset

- Remove implementation wording around undo, task logic, and same task actions.
- Shorten ritual/header descriptions while preserving warm family tone.

# Terminology inconsistencies

| Concept | Current terms observed | Recommendation |
|---|---|---|
| Restore | `Herstellen`, `Terugzetten`, `herstelpaneel`, `terugzetten dichtbij` | Use `Herstellen` for backup/list/source recovery; use `Terugzetten` only for undoing completed/deleted item state if product wants a distinction. |
| Delete/archive | `Verwijderen`, `Archiveren`, `gearchiveerd`, `verdwijnen` | Keep distinction: delete is permanent removal, archive hides but preserves. Make warnings explicit. |
| Tasks for later | `Ooit`, `later`, `someday`, `rustige ideeën` | Prefer Dutch `Later` in visible UI; avoid `Ooit` if not consistently used. |
| Routines | `routine`, `routines`, `Routinestarters`, `vaste klusjes` | Prefer `Routines` in page/dialog labels; explain only in form/help text if needed. |
| Status | `Status`, `Status en validatie`, `Meldingen`, `Laatste fout` | Prefer `Status`/`Meldingen`; reserve `validatie` for developer/test terminology or hidden implementation. |
| Settings maintenance | `Onderhoud`, `Onderhoudsbewijs`, `Onderhoudsrail`, `rustig onderhoud`, `gezinsinstellingen` | Prefer `Gezinsinstellingen`, `Back-up en herstel`, `Acties`; remove rail/proof wording. |
| Calendar source internals | `provider`, `API`, `HomeOps`, `bestandsreferentie`, `inhoudscontrole` | Prefer user terms: `bron`, `koppeling`, `bestand`, `controle`. |
| Layout containment | `begrensd`, `bounded`, `vaste vak`, `gereserveerd`, `zonder de pagina...` | Remove from visible UI. This belongs in implementation docs/tests, not product copy. |

# Duplicate copy

Estimated duplicate/redundant visible copy: 12 instances.

- Settings header/status repeats healthy state (`Is alles in orde?`, `Alles is in orde.` style status patterns) and repeats backup/source/status summaries in card + action rail.
- Shopping status can appear in both command/status area and footer/secondary region.
- Tasks repeats page purpose between eyebrow `Familie-acties voor vandaag`, title `Taken voor het gezin`, and description.
- Settings restore readiness repeats restore status in summary card and details dialog.
- Several secondary dialog descriptions restate the button/panel title instead of adding user value.

# Vertical space opportunities

Estimated visible savings if follow-up cleanup is implemented: **18-28 lines** across common desktop/laptop viewports.

Largest opportunities:

1. Settings: remove status hint, action rail label, repeated summary sentences, bounded-panel dialog descriptions, provider detail sentence.
2. Shopping: remove region explanatory paragraphs and panel descriptions.
3. Tasks: remove command-band description and shorten panel descriptions.
4. Mijn Pagina: remove dialog descriptions that only explain containment.
5. Weekly Reset: shorten header and metric/checklist explanatory copy.
6. Motivation: shorten details dialog description and abstract eyebrow.

# Text that must remain

Do not remove these classes of text in implementation:

- Form labels and legends for user input.
- Required field, validation, import/export, and restore failure messages.
- Destructive confirmations and warnings.
- Privacy/safety explanations.
- Sync/load failure explanations.
- Status messages that confirm a save/delete/restore/toggle action.
- Loading states that prevent silent waits.
- Aria labels, accessible names, roles, and live-region labels.
- Calendar source status and last-error messages.

# Accessibility considerations

- Accessibility labels and live regions are not removal candidates by default.
- If an accessible label contains implementation wording, rename it while preserving the accessible name.
- Error, alert, and validation text must remain discoverable to assistive technology.
- Shortening copy must not remove confirmation context for destructive actions such as restore, delete, or archive.
- Replacing visible descriptions with shorter text should preserve the semantic heading/button/label structure.

# Recommended implementation slices

1. **Settings copy cleanup**
   - Files: `SettingsDashboard.tsx`, `calendarPortability.ts`, related settings/portability tests.
   - Remove bounded/no-page/API/provider/internal wording.
   - Rename `Onderhoudsbewijs`, `Status en validatie`, `Onderhoudsrail`.
   - Localize English portability errors.
   - Keep restore warnings, confirmation, and validation lists.

2. **Shopping copy cleanup**
   - Files: `ShoppingListWidget.tsx`, related tests.
   - Remove fixed/reserved/bounded/default-view descriptions.
   - Reduce duplicate status copy.
   - Keep list management and error/safety copy.

3. **Tasks and Weekly Reset copy cleanup**
   - Files: `TasksPage.tsx`, `WeeklyResetPage.tsx`, related tests.
   - Remove bounded/no-page/task-logic/undo implementation wording.
   - Shorten panel and metric descriptions.
   - Keep form labels and task error messages.

4. **Member/Motivation copy cleanup**
   - Files: `FamilyMemberPage.tsx`, `MotivationPage.tsx`, related tests.
   - Remove bounded/no-page-growth descriptions.
   - Rename abstract labels.
   - Preserve warm household tone and accessibility labels.

5. **Demo/fallback data cleanup decision**
   - Files: `demoAgendaData.ts`, `TextWidget.tsx`, agenda tests/utilities.
   - Decide if demo agenda sources/events may be visible in production.
   - Localize or gate demo/fallback text.

# Risks / product decisions

- Demo agenda sources/events require a product decision: either hide/gate as demo data or replace with production-ready Dutch labels and real integration states.
- Removing explanatory subtitles may reduce perceived warmth; follow-up should keep concise, task-oriented microcopy where orientation is needed.
- Changing visible copy will require test updates where tests intentionally assert text.
- Settings copy is intertwined with safety-critical restore/import/delete flows; remove PO wording without weakening destructive-action clarity.
- Any follow-up that changes primary page layout, not only text, must follow the repository Viewport-First Workflow.

# Verification

Environment preparation used detected tool locations, repository-local caches, and prior Codex task pattern:

```bash
export DOTNET_HOME="$(dirname "$(command -v dotnet)")"
export PACKAGE_HOME="$(dirname "$(dirname "$(command -v npm)")")"
export DOTNET_CLI_HOME="$PWD/.dotnet-home"
export DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1
export DOTNET_NOLOGO=1
export NUGET_PACKAGES="$PWD/.nuget/packages"
export npm_config_cache="$PWD/.npm-cache"
export PATH="$PACKAGE_HOME/bin:$DOTNET_HOME:$PATH"
mkdir -p "$DOTNET_CLI_HOME" "$NUGET_PACKAGES" "$npm_config_cache"
```

Commands executed:

- `find .. -name AGENTS.md -print`
- `git status --short`
- `rg -n "PACKAGE_HOME|DOTNET_HOME|Codex|\.dotnet-home|\.npm-cache" -S . --glob '!**/.git/**'`
- `dotnet build HomeOps.sln --no-restore`
- `dotnet restore HomeOps.sln && dotnet build HomeOps.sln --no-restore && cd src/HomeOps.Client && npm run build`
- `rg -n 'bounded|begrensd|gereserveerd|vaste vak|zonder de pagina|zonder de hoofdpagina|standaardweergave|API|provider|HomeOps|Onderhoudsbewijs|Onderhoudsrail|Status en validatie|Familie-acties|compact beschikbaar|Gedeeld familiekompas|Ondersteunend bewijs|Undo blijft|dezelfde taakacties|Family note|Hele dag zichtbaar|blijft beschikbaar|rustig onderhoud|Waardering sluiten dialog' src/HomeOps.Client/src -S --glob '*.{ts,tsx}'`
- Targeted `nl -ba ... | sed -n ...` reads for exact evidence lines listed above.

Build/frontend results:

- `dotnet build HomeOps.sln --no-restore` failed before restore because `project.assets.json` files were missing. This was an expected setup prerequisite failure after cache cleanup.
- `dotnet restore HomeOps.sln && dotnet build HomeOps.sln --no-restore` passed with 0 errors and warning `NU1903` for `SQLitePCLRaw.lib.e_sqlite3` 2.1.11 in `tests/HomeOps.Api.Tests`.
- `cd src/HomeOps.Client && npm run build` passed. npm emitted `Unknown env config "http-proxy"`; Vite emitted the existing chunk-size warning for a bundle larger than 500 kB.

# Modified files

- `docs/reports/2026-07-09-ui-copy-audit/ui-copy-audit.md` — analysis report only.
