# UI copy audit — FamilyBoard frontend

Date: 2026-07-09

## Summary

This audit inspected visible frontend copy across FamilyBoard pages, dialogs, cards, empty states, headers, chips, buttons, helper text, labels, tooltips, seeded/demo data, and tests that assert UI text.

Overall finding: the UI is mostly Dutch and task-oriented, but several newer viewport-driven pages contain visible **PO-tekst**: copy that explains the layout strategy, bounded panels, reserved regions, design intent, or implementation behavior instead of helping a real household user. A smaller set of **demotekst** remains in demo agenda data, examples/placeholders, and English fallback/error strings. Most destructive-action, validation, privacy/safety, form-label, status, and accessibility text should remain.

Highest-priority cleanup areas for follow-up implementation:

1. Settings dashboard and settings dialogs: remove or shorten repeated text about bounded panels, calm maintenance, validation availability, and HomeOps/provider internals.
2. Shopping list page and overlays: remove copy that explains fixed/reserved regions and bounded overlays.
3. Tasks page dialogs/overlays: shorten page subtitles, remove “bounded lijst” wording, and simplify secondary tile descriptions.
4. Weekly reset: remove implementation/process language such as undo availability and “same task actions as now”.
5. Motivation page: shorten emotional/explanatory storyline copy and rename a few abstract headings.
6. Demo agenda sources/events: decide whether they are still needed in production Home/Agenda data. If yes, label them as sample/demo only in non-production contexts; if no, remove from production-visible composition.

## Scope inspected

Frontend-only inspection covered:

- Workspace shell and navigation: `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx`, `workspaceModel.ts`, `DomainPlaceholderPage.tsx`.
- Home page and dialogs: `src/HomeOps.Client/src/home/HomeDashboard.tsx`, `WeatherDetailDialog.tsx`, `FamilyMemberPage.tsx`, `FamilyAvatarEditor.tsx`.
- Agenda page/widget: `src/HomeOps.Client/src/widgets/components/AgendaWidget.tsx`, agenda utilities, calendar source copy, demo agenda data.
- Tasks page/dialogs: `src/HomeOps.Client/src/tasks/TasksPage.tsx`, task grouping and tests.
- Shopping/List page/dialogs: `src/HomeOps.Client/src/widgets/components/ShoppingListWidget.tsx`, shopping grouping/state and tests.
- Motivation page/dialogs: `src/HomeOps.Client/src/MotivationPage.tsx`, `HelpfulMoments.tsx`, `motivationData.ts`, `helpfulMomentsData.ts`.
- Mijn Pagina / family member pages and avatar dialogs: `FamilyMemberPage.tsx`, `FamilyAvatarEditor.tsx`, `AvatarEditorPage.tsx`, `AvatarCatalogControls.tsx`.
- Settings and calendar maintenance dialogs: `src/HomeOps.Client/src/settings/SettingsDashboard.tsx`, `CalendarPortabilityWidget.tsx`, `calendarSourcesApi.ts`, `calendarPortability.ts`.
- Onboarding dialog: `src/HomeOps.Client/src/FirstRunWizard.tsx` and tests.
- Weekly reset page: `src/HomeOps.Client/src/weeklyReset/WeeklyResetPage.tsx`.
- Visible-copy assertions and seeded UI text in tests: `*.test.tsx`, `*.test.ts` under `src/HomeOps.Client/src`.
- Story/demo fixtures and sample data: `src/HomeOps.Client/src/demo/demoAgendaData.ts`, API-backed fixture usage, tests that seed English/demo data.

Not changed: production UI code, screenshots, binary files, generated client code, generated assets.

## Classification rules used

- **PO-tekst**: visible text that explains product intent, demo behavior, layout strategy, design intent, review behavior, implementation behavior, or internal architecture to a Product Owner/developer/reviewer instead of helping the household user.
- **demotekst**: temporary placeholder/demo copy, sample events, example names, seeded data, or fixtures that can appear as real content.
- **gebruikerstekst**: visible copy that directly helps a real user complete a task, understand status, avoid mistakes, or recover from an error.

Classification actions:

- **Remove**: visible PO-tekst/demotekst that should not be shown to real users.
- **Shorten**: useful gebruikerstekst that is too long, repetitive, or likely to consume vertical space.
- **Rename**: unclear, inconsistent, overly abstract, or not family-friendly enough.
- **Keep**: concise, useful gebruikerstekst, including accessibility labels and safety/validation/error text.
- **Needs product decision**: copy/content whose removal depends on product scope, data model, or UX choice.

## Findings by page/dialog

### Global shell, navigation, and workspace headers

| Text/source | Classification | Recommendation | Reason |
|---|---:|---|---|
| “Dagelijkse gezinsplek”, “Gezinsinstellingen”, “Familiecheck” in workspace headers | Shorten / Remove | Remove from page header where the page title already says the destination. | This is mostly taxonomy, not task help, and consumes vertical space on primary pages. |
| Workspace descriptions from `workspaceModel.ts`, e.g. “Een rustige gezinscheck voor volgende week.” | Shorten | Keep only where a page needs orientation; otherwise rely on nav/page title. | Repeats the visible page purpose. |
| Admin nav aria label “{label} voor gezinsinstellingen” | Keep | Keep as accessibility-only label. | Helps screen-reader users distinguish icon-only/settings nav. |
| “Gezinsinstellingen laden…” | Keep | Keep. | Loading status is useful gebruikerstekst. |
| Add family member dialog “Voeg iemand toe aan het gezinsbord zonder account aan te maken.” | Keep / Shorten | Keep, or shorten to “Geen account nodig.” | Useful expectation-setting, but can be shorter. |

### Home

| Text/source | Classification | Recommendation | Reason |
|---|---:|---|---|
| Date/time labels “Vandaag”, current time, weather advice | Keep | Keep. | Core dashboard information. |
| Home card action labels “Boodschap toevoegen”, “Boodschappen openen”, equivalent Agenda/Tasks actions | Keep | Keep. | Clear action-oriented gebruikerstekst. |
| Home quick status “toegevoegd aan…”, “afgevinkt in…” | Keep | Keep. | Confirms action outcome. |
| Error text “Agenda-overzicht kon niet worden geladen.”, “Boodschappenoverzicht kon niet worden geladen.”, “Takenoverzicht kon niet worden geladen.” | Keep | Keep. | User-visible recovery/status text. |
| Demo agenda source/event data injected with `demoReadOnlyEvents` and `demoReadOnlyEventSources` | Needs product decision / demotekst | Decide whether demo read-only sources should be visible in production. If production-visible, replace with real integration state or hide behind demo mode. | Demo events can look like real household data. |
| Placeholder examples in quick-add dialogs, such as task/event/shopping examples | Keep / demotekst | Keep if clearly placeholder examples; ensure examples are short and Dutch. | Placeholders help input, but should not look like persisted data. |

### Agenda

| Text/source | Classification | Recommendation | Reason |
|---|---:|---|---|
| Agenda lead summaries such as “Morgen begint op…” and “Vandaag blijft open” | Shorten | Reduce to direct status: “Morgen: …”, “Geen afspraken vandaag.” | Useful but wordy; dashboard copy should be compact. |
| “Hele dag zichtbaar voor het gezin.” | Remove / Rename | Rename to “Hele dag” or remove if all-day styling already communicates it. | Explains visibility/design rather than user action. |
| “De afspraken van vandaag liggen al achter het gezin.” | Shorten | Use “Vandaag afgerond.” | Long, somewhat scripted. |
| Event source/status labels “mislukt”, “nog niet ververst”, “beschikbaar” | Keep | Keep. | Sync state must remain understandable. |
| Calendar source grouping labels like “Verjaardagen”, “Vakanties”, “School”, “Gezin” | Keep | Keep. | Useful grouping/filter labels. |
| Calendar import/sync errors from `calendarSourcesApi.ts` | Keep | Keep. | Required to explain sync failures/import errors. |

### Tasks

| Text/source | Classification | Recommendation | Reason |
|---|---:|---|---|
| “Familie-acties voor vandaag” | Rename | “Vandaag” or “Taken vandaag”. | Abstract and promotional; page already shows tasks. |
| “Doe vandaag eerst; planning en beheer blijven compact beschikbaar.” | Remove / Shorten | Remove, or shorten to “Vandaag eerst.” | Explains layout strategy (“compact beschikbaar”). |
| Empty state: “Taken maken hulp zichtbaar zonder van de dag administratie te maken.” | Shorten | “Maak hulp zichtbaar met een taak.” | Useful intent, but reads like product positioning. |
| Secondary tile descriptions: “Bewaren zonder druk”, “Terugzetten blijft dichtbij”, “Routines klaarzetten”, “Kies samen wat deze week helpt” | Shorten | Use terse labels/counts only or one/two-word descriptors. | Tile label and count already carry meaning; descriptions add vertical cost. |
| “Naar de vaste weekcheck” | Shorten / Rename | “Weekcheck openen”. | Current wording explains navigation rather than action. |
| Dialog descriptions: “Alles wat vandaag aandacht vraagt in één bounded lijst.” | Remove / Rename | “Taken voor vandaag.” | “bounded” is direct PO/developer language and not Dutch gebruikerstaal. |
| Planning dialog: “Bekijk morgen, deze week en later zonder de pagina langer te maken.” | Remove | Replace with no description or “Morgen en later.” | Explicit viewport/layout PO-tekst. |
| “Gebruik vaste klusjes opnieuw nadat duidelijk is wat vandaag nodig is.” | Shorten | “Gebruik routines opnieuw.” | Wordy explanation under dialog header. |
| Form labels: “Wat moet er gebeuren?”, “Wie pakt dit op?”, “Wanneer moet dit gebeuren?”, recurrence options | Keep | Keep. | Directly supports task creation. |
| Destructive/archive actions and “Terugkerende routine kon niet worden verwijderd.” | Keep | Keep. | Error/safety text. |

### Shopping/List

| Text/source | Classification | Recommendation | Reason |
|---|---:|---|---|
| Empty/loading text “De actieve lijst wordt in dit vaste vak geladen.” | Remove | Replace with “Boodschappen laden…” only. | “vaste vak” explains layout implementation. |
| Empty state “Deze ruimte blijft gereserveerd voor de actieve lijst per winkel.” | Remove | Replace with “Voeg je eerste boodschap toe.” | PO-tekst about reserved region and viewport strategy. |
| Overlay descriptions: “zonder de actieve lijst te verplaatsen”, “in een begrensd herstelvak”, “zonder de standaardweergave uit te breiden”, “op aanvraag” | Remove | Remove descriptions or use concise task descriptions (“Afgevinkte boodschappen”, “Recent verwijderd”). | Explains layout strategy, not household task. |
| Footer `statusMessage` duplicated in command row and footer pill | Shorten / Remove duplicate | Keep one status location. | Repetition consumes space and may be noisy. |
| Store group `span` “{n} open” repeated under each store | Shorten / Needs decision | Keep count only if useful; otherwise rely on items visible. | Repeated source/category counts may be implied by grouping. |
| Buttons “Afgevinkt”, “Herstellen”, “Andere lijsten”, “Beheer” | Keep | Keep. | Concise navigation/actions. |
| “Lijst beheren”, “Lijstnaam”, “Hernoemen”, “Archiveren”, “Verwijderen” | Keep | Keep. | Required management/action copy. |
| Error messages “Boodschap kon niet worden toegevoegd/bijgewerkt/verwijderd/teruggezet.” | Keep | Keep. | Necessary validation/recovery text. |

### Motivation and helpful moments

| Text/source | Classification | Recommendation | Reason |
|---|---:|---|---|
| “Gedeeld familiekompas” | Rename | “Familiedoel” or “Samen doel”. | Abstract metaphor; not as direct for household users. |
| “Waarom dit ertoe doet” block | Shorten / Remove | Consider removing from default card or moving into detail. | Explains emotional/product intent; costs vertical space. |
| “Elke kleine stap laat zien waar jullie als gezin samen naartoe groeien.” | Shorten | “Elke stap telt.” | Long and somewhat scripted. |
| “Ondersteunend bewijs bij jullie gedeelde verhaal.” | Remove / Rename | “Voortgang per onderdeel.” | “bewijs” and “gedeelde verhaal” are PO/storytelling language. |
| “Resterend”, “Gezin helpt mee”, progress numbers | Keep | Keep. | Direct progress information. |
| “Vieringen die we onthouden”, “herinneringen om later samen terug te lezen” | Keep / Shorten | Keep, maybe shorten to “Vieringen” and “Om later terug te lezen.” | User-facing and warm, but can be tighter. |
| Helpful Moments “Lieve dingen die jullie hebben gezien.” | Keep / Shorten | Keep or shorten to “Wat jullie zagen.” | Warm user-facing copy, not PO-tekst. |
| “Dank je wel.” | Keep | Keep. | User-facing appreciation. |
| “Waardering sluiten dialog” aria label | Rename | “Waardering sluiten”. | “dialog” is implementation wording in Dutch UI/accessibility label. |
| Placeholder “Riley hielp opruimen zonder dat iemand het vroeg.” | demotekst / Keep as placeholder | Keep if placeholder-only; consider generic “Bijvoorbeeld: hielp opruimen.” | It is an example, but named demo/person copy can feel seeded. |

### Mijn Pagina / family member and avatar dialogs

| Text/source | Classification | Recommendation | Reason |
|---|---:|---|---|
| Family member detail labels, member names, type, birthday/color/avatar fields | Keep | Keep. | Directly supports profile editing. |
| “Voeg iemand toe aan het gezinsbord zonder account aan te maken.” | Keep / Shorten | Keep or shorten to “Geen account nodig.” | Helpful setup expectation. |
| Avatar editor “Live voorbeeld avatar” | Keep / Rename | “Voorbeeld” is enough. | “Live” is okay but not needed if immediate preview is obvious. |
| Avatar option labels and category labels | Keep | Keep. | Required selection labels. |
| Tests with English avatar/sample names | demotekst in tests | No UI change unless values can leak into fixtures. | Tests may seed text; ensure not production-visible. |

### Settings and calendar maintenance

| Text/source | Classification | Recommendation | Reason |
|---|---:|---|---|
| Header “Is alles in orde?” / “Alles is in orde.” | Keep / Shorten | Keep one of the two, not both. | Repetition in header. |
| “Kalenderbronnen, back-up en herstel blijven beschikbaar zonder dat de pagina druk wordt.” | Remove | Replace with “Beheer kalenderbronnen en back-ups.” | Explicit layout/design intent. |
| “Herstellen opent in een begrensd paneel met controle vooraf.” | Remove | Replace with “Kies een back-upbestand om te herstellen.” | PO-tekst about panel containment. |
| “extra gezinsinstellingen beschikbaar voor rustig onderhoud” | Shorten | “{n} extra instellingen beschikbaar.” | “rustig onderhoud” is vague. |
| “Alles staat klaar voor rustig gezinsonderhoud.” | Shorten | “Geen meldingen.” | Shorter status is clearer. |
| “Onderhoudsbewijs” | Rename | “Back-up en herstel” or “Overzicht”. | “bewijs” is reviewer/product language. |
| “Status en validatie” | Rename | “Status” or “Meldingen”. | Validation is technical. |
| “Gedetailleerde validatie blijft beschikbaar in een begrensd paneel wanneer dat nodig is.” | Remove | Do not show when no validation errors. | PO-tekst and vertical-space cost. |
| “Onderhoudsrail” | Remove / Rename | “Acties” or omit. | Layout-region label, not user terminology. |
| Dialog descriptions: “zonder de hoofdpagina te verlengen”, “Open aanvullende gezinsinstellingen in een begrensd paneel.” | Remove | Use concise dialog titles only. | Direct no-page-scroll implementation explanation. |
| “Voeg een nieuwe iCal-bron toe zonder de API te gebruiken.” | Remove / Rename | “Voeg een iCal-bron toe.” | “API” is developer/PO language. |
| “iCal-bestanden in HomeOps” and “HomeOps al kan lezen” | Shorten / Needs decision | Use user-facing import instructions; avoid internal product mechanics. | Technical internals. |
| “Deze bron gebruikt HomeOps zonder extra providerdetails op de pagina.” | Remove / Rename | “Geen extra details beschikbaar.” | Internal implementation/source-provider language. |
| Restore warning “Herstellen vervangt de huidige gezinsagenda… Agenda’s worden niet samengevoegd.” | Keep | Keep. | Required destructive-action clarity. |
| Confirmation “Ik begrijp dat herstellen de huidige gezinsagenda vervangt.” | Keep | Keep. | Required irreversible/destructive confirmation. |
| Source errors and validation lists | Keep | Keep. | Sync/import errors must remain visible. |

### Onboarding / first run

| Text/source | Classification | Recommendation | Reason |
|---|---:|---|---|
| Welcome/setup labels and member creation form copy | Keep | Keep if short and Dutch. | Helps initial household setup. |
| Test assertions around older English strings | demotekst / test debt | Keep tests aligned with current Dutch UI; ensure old English strings do not re-enter visible UI. | Test-only English can hide stale product expectations. |

### Weekly reset

| Text/source | Classification | Recommendation | Reason |
|---|---:|---|---|
| Intro “Neem samen een rustig moment: vier wat af is, kies wat meegaat…” | Shorten | “Kies wat meegaat naar volgende week.” | Useful but long. |
| Metric description “Blijft actief, gaat naar later of wordt gearchiveerd met dezelfde taakacties als nu.” | Remove / Shorten | “Actief, later of archiveren.” | “same task actions as now” is implementation/process explanation. |
| Checklist item “Undo blijft beschikbaar waar dat vandaag al bestaat.” | Remove | Do not expose implementation capability as checklist copy. | PO/developer wording. |
| “Open taken kunnen actief blijven of rustig doorschuiven naar later.” | Keep / Shorten | “Houden of naar later zetten.” | User-facing, can be tighter. |
| Completion text “Neem nog één rustig rondje…” | Shorten | “Bekijk de open keuzes nog.” | Long ritual wording. |

### Generic widgets, placeholders, tests, and demo fixtures

| Text/source | Classification | Recommendation | Reason |
|---|---:|---|---|
| `TextWidget` fallback “Family note” | Rename / demotekst | Localize to “Gezinsnotitie” or avoid visible fallback. | English fallback can leak into UI. |
| `PlaceholderWidget` / domain placeholders | Needs product decision | If placeholders remain production-visible, make them concise Dutch “Nog niet beschikbaar.” | Placeholder pages can be acceptable but should not demo-script future features. |
| English errors in `calendarPortability.ts` | Rename | Localize to Dutch. | Visible error text should preserve Dutch UI direction. |
| Tests seeding “Review library books”, “Fill the helper path”, “helps”, “reads”, “Old Shopping” | demotekst in tests | Fine as tests unless rendered in visual fixtures; localize if exposed in snapshots/demos. | Test/demo data should not appear as production copy. |

## High-priority removals

1. Settings: remove all visible “begrensd paneel”, “zonder de pagina druk wordt”, “zonder de hoofdpagina te verlengen”, “status en validatie”, “onderhoudsrail”, and “zonder de API te gebruiken” copy.
2. Shopping: remove “vaste vak”, “ruimte blijft gereserveerd”, “begrensd herstelvak”, and “standaardweergave uit te breiden”.
3. Tasks: remove “bounded lijst” and “zonder de pagina langer te maken”.
4. Weekly reset: remove “Undo blijft beschikbaar waar dat vandaag al bestaat” and implementation-equivalence wording.
5. Demo agenda data: make a product decision on production visibility of `demoReadOnlyEvents`/`demoReadOnlyEventSources`.
6. English fallback/error copy: localize `Family note` and calendar portability English errors if visible.

## Shorten/rename candidates

- Rename “Gedeeld familiekompas” → “Familiedoel” or “Samen doel”.
- Rename “Onderhoudsbewijs” → “Back-up en herstel” or “Overzicht”.
- Rename “Status en validatie” → “Status” or “Meldingen”.
- Rename “Familie-acties voor vandaag” → “Taken vandaag”.
- Rename “Routinestarters” → “Routines” unless the distinction is product-critical.
- Shorten “Doe vandaag eerst; planning en beheer blijven compact beschikbaar.” → “Vandaag eerst.” or remove.
- Shorten “Taken maken hulp zichtbaar zonder van de dag administratie te maken.” → “Maak hulp zichtbaar met een taak.”
- Shorten Motivation storyline copy to one-line progress/user value.
- Shorten Settings summaries to status values, not prose.
- Shorten Weekly reset intro/metric text.

## Texts that should stay

- Form labels and legends: task title/owner/date/recurrence, family member name/type/birthday/color, source name/type/feed/file fields.
- Primary buttons: add/save/cancel/open/restore/delete/archive/refresh/toggle actions.
- Status feedback after successful actions: item/task/event added, source saved, backup saved, calendar restored.
- Loading states: “laden…” states where the user needs feedback.
- Empty states that directly tell the user what to do next, such as “Voeg de eerste helpende taak toe” and “Begin met je eerste boodschap”, once PO explanatory sentences are removed.
- Calendar source labels and sync states.
- Weather labels/advice where concise.
- Household member names and labels.
- Accessibility labels that identify controls, dialogs, current page, badges, and destructive actions.

## Accessibility/validation text that must not be removed

- `aria-label`, `aria-labelledby`, `aria-current`, `role="alert"`, and `role="status"` labels that identify pages, dialogs, controls, and live status.
- Form labels/legends for every input/select/checkbox.
- Restore warning: current agenda is replaced and calendars are not merged.
- Restore confirmation checkbox text.
- Calendar source validation errors and server/import/sync failure messages.
- Destructive action warnings for source/list deletion and archive/delete actions.
- Task recurrence deletion errors.
- Weather/calendar/list/task load failures.
- Status messages confirming save/delete/restore/toggle outcomes.

Audit note: accessibility labels can still be renamed to remove implementation terms, e.g. “Waardering sluiten dialog” should become “Waardering sluiten”; do not remove the label itself.

## Recommended implementation slices for a follow-up Copilot task

1. **Settings copy cleanup**
   - Files: `SettingsDashboard.tsx`, `CalendarPortabilityWidget.tsx`, `calendarPortability.ts`, related tests.
   - Remove PO-tekst about bounded panels/layout/API internals.
   - Rename “Onderhoudsbewijs”, “Status en validatie”, “Onderhoudsrail”.
   - Keep restore/destructive/sync validation text.

2. **Shopping copy cleanup**
   - Files: `ShoppingListWidget.tsx`, related tests.
   - Remove reserved/fixed/bounded/standard-view explanation text.
   - Reduce duplicated status copy.
   - Keep list management, destructive actions, and errors.

3. **Tasks copy cleanup**
   - Files: `TasksPage.tsx`, task tests.
   - Rename header/subtitle/tile descriptions.
   - Remove “bounded lijst” and no-page-length explanations.
   - Keep creation dialog labels and validation/error text.

4. **Motivation and Weekly Reset copy cleanup**
   - Files: `MotivationPage.tsx`, `HelpfulMoments.tsx`, `WeeklyResetPage.tsx`, tests.
   - Shorten motivational storyline text.
   - Rename abstract labels.
   - Remove implementation/process checklist text.

5. **Demo/fixture visibility decision**
   - Files: `demoAgendaData.ts`, `HomeDashboard.tsx`, `AgendaWidget.tsx`, tests/visual fixtures.
   - Decide whether demo read-only agenda sources/events should be production-visible.
   - If kept, gate behind explicit demo/visual-review mode.

6. **English/fallback localization cleanup**
   - Files: `TextWidget.tsx`, `calendarPortability.ts`, tests.
   - Localize English fallback/error text to Dutch.

## Verification performed

Repository-local environment was prepared before analysis/validation using the repository-local cache pattern plus the requested `PACKAGE_HOME` and `DOTNET_HOME` exports. The runner had `dotnet` at `/root/.dotnet/dotnet` and npm at `/root/.nvm/versions/node/v20.20.2/bin/npm`, so `DOTNET_HOME` and `PACKAGE_HOME` were detected from those tools rather than hardcoded to broken paths.

```bash
export DOTNET_HOME="$(dirname "$(which dotnet)")"
export PACKAGE_HOME="$(dirname "$(dirname "$(which npm)")")"
export DOTNET_CLI_HOME="$PWD/.dotnet-home"
export DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1
export DOTNET_NOLOGO=1
export NUGET_PACKAGES="$PWD/.nuget/packages"
export npm_config_cache="$PWD/.npm-cache"
export PATH="$PACKAGE_HOME/bin:$DOTNET_HOME:$PATH"
mkdir -p "$DOTNET_CLI_HOME" "$NUGET_PACKAGES" "$npm_config_cache"
```

Commands/results:

- FAIL (setup prerequisite) — `dotnet build HomeOps.sln --no-restore` initially failed because `project.assets.json` files were missing; this confirmed restore had not yet been run in the prepared cache environment.
- PASS with warning — `dotnet restore HomeOps.sln && dotnet build HomeOps.sln --no-restore` completed successfully. Restore/build emitted warning `NU1903` for `SQLitePCLRaw.lib.e_sqlite3` 2.1.11 in `tests/HomeOps.Api.Tests`, but the build had 0 errors.
- PASS with warnings — `cd src/HomeOps.Client && npm run build` completed successfully. npm emitted the existing `Unknown env config "http-proxy"` warning and Vite emitted the existing large-chunk warning after a successful build.

Inspection commands used included:

- `find .. -name AGENTS.md -print`
- `cat AGENTS.md`
- `rg -n "PACKAGE_HOME|DOTNET_HOME|dotnet build|npm|pnpm|yarn" docs -S`
- `find src/HomeOps.Client -path '*/node_modules' -prune -o -type f \( -name '*.tsx' -o -name '*.ts' -o -name '*.json' \) -print`
- `rg -n "begrensd|vaste vak|zonder de pagina|zonder de hoofdpagina|rustig|bewijs|design|API|standaardweergave|beschikbaar zonder|gereserveerd|blijft beschikbaar|implement|demo|voorbeeld|review|fixture|HomeOps|Product|PO|bounded|vaste weekcheck" src/HomeOps.Client/src -g '*.{ts,tsx}'`
- Targeted `sed -n` reads of the frontend files listed in “Scope inspected”.

## Risks / product decisions

- Removing PO-tekst may reveal that some pages rely on explanatory subtitles to communicate hierarchy. Follow-up implementation should preserve enough labels/headings for orientation, especially in Settings and Tasks.
- Some “warm” FamilyBoard copy is intentional brand tone, not automatically PO-tekst. Product should choose how much warmth to keep on Motivation and Weekly Reset.
- Demo agenda source/event visibility requires a product/data decision; this audit does not decide whether demo sources are acceptable in production mode.
- Accessibility text must be edited carefully. Remove implementation wording, but keep labels and status semantics.
- Viewport impact should improve after copy removal, but follow-up changes that alter page layout still require the Viewport-First Workflow when primary-page layout changes are involved.

## Modified files

- `docs/reports/2026-07-09-ui-copy-audit/ui-copy-audit.md` — new analysis report only.
