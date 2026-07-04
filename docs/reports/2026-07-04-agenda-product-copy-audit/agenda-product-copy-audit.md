# FamilyBoard Agenda Product Copy Audit

## Executive Summary

The Agenda page still contains a significant amount of design-preview language. The copy frequently explains the intended information architecture instead of simply helping the family read the day. The biggest issues are:

- `Agenda` appears in navigation, page title, widget title, and the event dialog eyebrow. Only the navigation/page identity and dialog context have clear purpose; the widget title repeats the page title on the dedicated Agenda page.
- `Planning`, `Planning tools`, `Wat moet het gezin hierna weten?`, and similar phrases describe the design model rather than a household need.
- Helper text is overused. Many sections already communicate their purpose through events, dates, counts, or actions.
- Several empty states sound like UX rationale (`rustig in beeld`, `compacte geruststelling`, `horizon`) rather than kitchen-whiteboard language.
- Most action labels and form questions are usable household copy and should remain, with light cleanup where labels are duplicated or technical.

Recommendation: keep the Agenda page minimal. Let event titles, dates, counts, and actions carry the experience. Retain one top-level `Agenda` identity, use `Vandaag`, `Deze week`, `Later`, and `Plannen` as the visible section hierarchy, and remove most explanatory subtitles.

## Copy Audit

| Current text | Classification | Keep / Rewrite / Remove | Proposed replacement | Reasoning |
| --- | --- | --- | --- | --- |
| `Agenda` in primary navigation | Real product copy | Keep | `Agenda` | Essential wayfinding; common household term. |
| `Dagelijkse gezinsplek` | Design explanation / repeated workspace framing | Remove | — | Explains product taxonomy, not the family's agenda. |
| `Agenda` as page title | Real product copy | Keep | `Agenda` | One visible page identity is useful. |
| `Gedeelde gezinsplanning en afspraken.` | Redundant UI copy | Remove or rewrite | Prefer remove; if retained: `Afspraken voor het gezin.` | The page title and content already establish this. |
| `Familieplanning` | Redundant context label | Remove | — | Competes with `Agenda` and `Planning`; not needed on the Agenda page. |
| `Agenda` as widget title on the Agenda page | Duplicate heading | Remove on dedicated page | — | Repeats navigation/page title without adding information. |
| `Vandaag, straks en wat er binnenkort aankomt.` | Real product copy but still explanatory | Rewrite | `Vandaag en binnenkort.` | Shorter, whiteboard-like, less designed. |
| `Kies een dag om ruimte te vinden of een afspraak in te plannen.` | Helper text | Rewrite | `Kies een dag of plan een afspraak.` | Removes abstract `ruimte vinden`. |
| `Terug naar planning` | Real product copy | Rewrite | `Terug` or `Terug naar vandaag` | `Planning` is internal framing; `Terug` is enough in context. |
| `Gebeurtenis toevoegen` | Real product copy | Rewrite | `Afspraak toevoegen` | Families more naturally say afspraak than gebeurtenis. |
| `Agenda laden…` | System status | Keep | `Agenda laden…` | Useful loading feedback. |
| `HomeOps Agenda-gebeurtenissen konden niet worden geladen.` | Developer/product-name language | Rewrite | `De agenda kon niet worden geladen.` | Removes implementation brand and technical noun. |
| `Gebeurtenis bewerken` | Real product copy | Rewrite | `Afspraak bewerken` | More natural household language. |
| `Gebeurtenis toevoegen` in dialog | Real product copy | Rewrite | `Afspraak toevoegen` | More natural household language. |
| `Sluit gebeurtenisvenster` | Accessibility copy, developer-ish | Rewrite | `Sluit afspraakvenster` or `Sluiten` | Functional but wordy. |
| `Wat gebeurt er?` | Household language | Keep | `Wat gebeurt er?` | Natural form question. |
| `Zwemles` placeholder | Demo/example copy | Keep | `Zwemles` | Good realistic placeholder. |
| `Wanneer moet het gezin dit onthouden?` | Household language but wordy | Rewrite | `Wanneer is het?` | Shorter and more natural. |
| `Vandaag` quick choice | Real product copy | Keep | `Vandaag` | Essential. |
| `Morgen` quick choice | Real product copy | Keep | `Morgen` | Essential. |
| `Kies datum` quick choice | Real product copy | Keep | `Kies datum` | Clear. |
| `Duurt het de hele dag?` | Household language | Keep | `Duurt het de hele dag?` | Natural. |
| `Hele dag` | Real product copy | Keep | `Hele dag` | Clear. |
| `Kies een tijd` | Real product copy | Keep | `Kies een tijd` | Clear. |
| `Datum` | Real product copy | Keep | `Datum` | Clear. |
| `Einddatum` | Real product copy | Keep | `Einddatum` | Clear. |
| `Begintijd` | Real product copy | Keep | `Begintijd` | Clear. |
| `Eindtijd` | Real product copy | Keep | `Eindtijd` | Clear. |
| `Nog details?` | Household language | Keep | `Nog details?` | Natural. |
| `Optionele notitie voor het gezin` | Helper text | Rewrite | `Notitie` | Shorter; optionality is implied. |
| `Terug` | Real product copy | Keep | `Terug` | Clear. |
| `Verder` | Real product copy | Keep | `Verder` | Clear. |
| `Gebeurtenis opslaan` | Real product copy | Rewrite | `Afspraak opslaan` | More natural. |
| `Gebeurtenis maken` | Real product copy | Rewrite | `Afspraak maken` | More natural. |
| `Opslaan…` | System status | Keep | `Opslaan…` | Useful. |
| `Zichtbaar in de agenda` | Accessibility/group label | Keep | `Zichtbaar in de agenda` | Useful context for filters. |
| `Bronnen` | Developer-ish label | Rewrite | `Agenda's` | `Bronnen` exposes data-source language. |
| `Planningoverzicht` | Accessibility label / design model | Rewrite | `Agendaoverzicht` | Avoids internal IA term. |
| `Planning` eyebrow | Design explanation | Remove | — | Repeats the IA concept and does not help the family. |
| `Wat moet het gezin hierna weten?` | Design explanation | Remove or rewrite | Prefer remove; if a heading is required: `Vandaag` | It states the page's design intent instead of content. |
| `Vandaag eerst, daarna de vorm van de week en pas dan rustig vooruitkijken.` | Design explanation | Remove | — | Explicitly explains hierarchy; violates product philosophy. |
| `Vandaag briefing` aria label | Design language | Rewrite | `Vandaag` | `briefing` is not household/kitchen language. |
| `Vandaag` eyebrow | Real product copy | Keep | `Vandaag` | Primary family concept. |
| `Nu telt vooral dit` | Design-preview language | Rewrite | `Nu` | Shorter and more direct. |
| `Aandacht nu` | UI tone chip | Rewrite | `Nu` or remove | Tone labels feel evaluative; event timing can carry urgency. |
| `Nu bezig` | Real product copy | Keep | `Nu` or `Nu bezig` | Useful when an event is active. |
| `Verder vandaag` | Real product copy | Keep | `Verder vandaag` | Useful grouping. |
| `+N meer vandaag` | Real product copy | Keep | `+N meer vandaag` | Useful overflow. |
| `Dit komt hierna` | Household language | Keep or rewrite | `Straks` | `Straks` is shorter and matches badge. |
| `Drukkere dag` | Tone label | Rewrite/remove | Prefer remove; if retained: `Druk` | May be useful but not essential. |
| `In balans` | Tone label / design tone | Remove | — | Sounds like UX tone language, not family copy. |
| `Vandaag is ingevuld` | Awkward household copy | Rewrite | `Vandaag staat erop` | More natural. |
| `Vandaag blijft open` | Household-ish empty state | Rewrite | `Geen afspraken vandaag` | Clearer and less poetic. |
| `Rustige dag` | Household language but overused tone | Keep only as optional empty chip | `Rustig` or remove | Good word, but tone chips are not always necessary. |
| `De belangrijkste afspraak loopt nu.` | Real product copy | Rewrite | `Deze afspraak is nu bezig.` | Less judgmental. |
| `Eén duidelijke afspraak vraagt vandaag om aandacht.` | Design-ish helper | Remove/rewrite | `Eén afspraak vandaag.` | Less interpretive. |
| `De afspraken van vandaag liggen al achter het gezin.` | Awkward copy | Rewrite | `De afspraken van vandaag zijn voorbij.` | Natural household wording. |
| `Geen afspraken vandaag en niets dringends direct daarna.` | Household language | Rewrite | `Geen afspraken vandaag.` | Avoids reassuring design language. |
| `Deze week` | Real product copy | Keep | `Deze week` | Essential time grouping. |
| `N afspraken in beeld` | Design explanation | Rewrite | `N afspraken` | `in beeld` explains display, not life. |
| `De rest van de week is rustig` | Household language | Rewrite | `Geen afspraken meer deze week` | More concrete. |
| `Morgen begint op [weekday] en laat direct de weekvorm zien.` | Design explanation | Remove/rewrite | `[N] afspraken deze week.` | `weekvorm` is not family language. |
| `Na vandaag hoeft er nog niets extra's voorbereid te worden.` | Household language | Rewrite | `Na vandaag staat er niets gepland.` | Simpler. |
| `Geen extra drukte zichtbaar` | Design explanation | Remove/rewrite | `Geen afspraken meer deze week` | `zichtbaar` refers to UI. |
| `Na vandaag blijft de komende week voorlopig ruim.` | Poetic helper | Remove | — | Empty heading is enough. |
| `+N meer op [weekday]` | Real product copy | Keep | `+N meer op [weekday]` | Useful overflow. |
| `Vooruitkijken` | Real product copy but section could be simpler | Rewrite | `Later` | More whiteboard-like and shorter. |
| `Verder vooruit blijft in beeld` | Design explanation | Remove/rewrite | `Later` or `[N] later` | `in beeld` explains UI persistence. |
| `Nog niets verder vooruit` | Household language | Rewrite | `Nog niets gepland` | More direct. |
| `Compacte geruststelling voor wat later komt.` | Design explanation | Remove | — | Pure design rationale. |
| `Zodra er iets na deze week staat, verschijnt het hier rustig in beeld.` | Design explanation | Remove | — | Explains component behavior. |
| `+N meer vooruit` | Real product copy | Rewrite | `+N later` | Shorter and aligns with `Later`. |
| `De horizon is rustig` | Poetic/design-preview copy | Remove/rewrite | `Nog niets gepland` | `horizon` is not kitchen-board language. |
| `Gebruik de maandweergave zodra je verder vooruit wilt plannen.` | Instruction/helper | Remove | — | The `Maand bekijken` button already provides the affordance. |
| `Planning tools` aria label | Developer/designer language | Rewrite | `Plannen` | Avoid English and internal tooling. |
| `Planning tools` eyebrow | Developer language | Remove/rewrite | `Plannen` | English tooling language is not family copy. |
| `Rustige hulpruimte` | Design-preview language | Remove/rewrite | `Plannen` | Explains the layout role rather than a task. |
| `Pas gebruiken wanneer iemand wil plannen of iets wil opzoeken.` | Design explanation | Remove | — | Tells users how the layout is intended to work. |
| `Afspraak plannen` | Household language | Keep | `Afspraak plannen` | Clear action. |
| `Datum kiezen` | Real product copy | Keep if it selects a date | `Datum kiezen` | Clear action, but may duplicate `Maand bekijken`. |
| `Maand bekijken` | Real product copy | Keep | `Maand bekijken` | Clear action. |
| `Geselecteerde dag` | Real product copy | Keep | `Gekozen dag` | Align with selected-day panel. |
| `Bewerken` | Real product copy | Keep | `Bewerken` | Clear. |
| `Verwijderen` / `Verwijderen…` | Real product copy/status | Keep | `Verwijderen` / `Verwijderen…` | Clear. |
| `Weekplanning` | Real product copy | Keep if week view remains reachable | `Weekplanning` or `Week` | Acceptable but `Week` is cleaner. |
| `Week [number]` | Real product copy | Keep | `Week [number]` | Useful date context. |
| `Vorige week` / `Deze week` / `Volgende week` | Real product copy | Keep | Same | Clear navigation. |
| `Een rustige week in zicht` | Household language | Rewrite | `Geen afspraken deze week` | More direct. |
| `Er staat nog weinig op de planning. Mooi moment om samen vooruit te kijken.` | Helper text | Remove | — | Explains what to do; content state is enough. |
| `+N meer voor deze dag` | Real product copy | Keep | `+N meer` | Shorter; day context is already visible. |
| `Maandplanning` | Real product copy | Keep | `Maand` | `Planning` suffix unnecessary. |
| `Maandrooster` | Real product copy | Keep | `Maand` | Simpler if visible/announced. |
| `Maand` | Real product copy | Keep | `Maand` | Useful context. |
| `Vandaag` month badge | Real product copy | Keep | `Vandaag` | Essential. |
| `Gekozen dag` | Real product copy | Keep | `Gekozen dag` | Clear. |
| `Nog geen afspraken.` | Real product copy | Keep | `Geen afspraken.` | Slightly shorter. |
| `N op de planning.` | Real product copy but vague | Rewrite | `N afspraken.` | More concrete. |
| `Toevoegen` | Real product copy | Keep | `Toevoegen` | Clear in context. |
| `Begin met de eerste gebeurtenis` | Product onboarding language | Rewrite | `Nog geen afspraken` | Avoids generic `gebeurtenis`. |
| `Deze dag is nog leeg` | Household language | Rewrite | `Geen afspraken` | More direct. |
| `Ruimte in de agenda.` | Poetic helper | Remove | — | Not necessary. |
| Event category labels: `Verjaardag`, `Vakantie`, `School`, `Sport`, `Zorg`, `Boodschappen`, `Familie`, `Werk`, `Kijken`, `Afspraak` | Real product copy | Keep | Same | Useful scannable event categories. |
| `Hele dag zichtbaar voor het gezin.` | Design explanation | Remove/rewrite | `Hele dag` | `zichtbaar` describes UI behavior. |
| `Verjaardag: denk aan kaartje of cadeau.` | Household language | Keep | Same | Useful family cue. |
| `Vakantiedag: opvang of dagindeling controleren.` | Household language | Keep | Same | Useful family cue. |
| Validation errors such as `Een titel voor de gebeurtenis is verplicht.` | System guidance, technical noun | Rewrite | `Geef de afspraak een naam.` | More direct and natural. |
| `Gebeurtenissen met tijd hebben een eindtijd nodig.` | System guidance, technical noun | Rewrite | `Kies ook een eindtijd.` | Natural and shorter. |
| `De gebeurtenis kon niet worden opgeslagen.` | System error | Rewrite | `De afspraak kon niet worden opgeslagen.` | More natural. |
| `De gebeurtenis kon niet worden verwijderd.` | System error | Rewrite | `De afspraak kon niet worden verwijderd.` | More natural. |

## Duplicate Heading Analysis

### `Agenda`

Current occurrences with visible or accessible purpose:

1. Primary navigation button: should remain. It is the way users move to the Agenda.
2. Workspace page title: should remain as the single visible page title on the dedicated Agenda page.
3. Widget title: should disappear or be visually suppressed on the dedicated Agenda page because it repeats the page title.
4. Dialog eyebrow: can remain as quiet context if the dialog can appear over multiple surfaces, but it is optional. If retained, it should not be prominent.
5. Event backup/restore widget title is outside the main Agenda page audit unless surfaced in Settings, but should be reviewed separately.

Recommendation: dedicated Agenda page should show `Agenda` once as the visible page title. Inside the Agenda card, start directly with `Vandaag` or the active view content.

### `Planning`

Current occurrences include page/body section heading, aria labels, helper copy, and tool area. The word is over-represented and frequently describes IA rather than household content.

Recommendation: remove `Planning` as a visible repeated concept. Use everyday time headings:

- `Vandaag`
- `Deze week`
- `Later`
- `Plannen`

### `Planning tools`

This is English developer/designer language. It should not be visible. Replace with `Plannen` if a heading is required, or remove the heading and let buttons stand alone.

## Developer Language Audit

Copy that reads as developer, designer, or implementation language:

- `Dagelijkse gezinsplek`
- `Familieplanning`
- `Planningoverzicht`
- `Planning tools`
- `Rustige hulpruimte`
- `Vandaag eerst, daarna de vorm van de week en pas dan rustig vooruitkijken.`
- `Verder vooruit blijft in beeld`
- `Compacte geruststelling voor wat later komt.`
- `Zodra er iets na deze week staat, verschijnt het hier rustig in beeld.`
- `Geen extra drukte zichtbaar`
- `Hele dag zichtbaar voor het gezin.`
- `HomeOps Agenda-gebeurtenissen konden niet worden geladen.`
- `Bronnen`

Recommendation: remove these rather than rewrite most of them. Where a functional label is required, use household words: `Agenda's`, `Vandaag`, `Later`, `Plannen`, `Afspraak`.

## Household Language Audit

Copy that already feels close to household language:

- `Agenda`
- `Vandaag`
- `Morgen`
- `Deze week`
- `Afspraak plannen`
- `Maand bekijken`
- `Wat gebeurt er?`
- `Duurt het de hele dag?`
- `Nog details?`
- `Verjaardag: denk aan kaartje of cadeau.`
- `Vakantiedag: opvang of dagindeling controleren.`
- `Bewerken`
- `Verwijderen`

These should form the vocabulary for the page. The strongest pattern is short nouns, dates, and direct questions.

## Whiteboard Language Test

Question: would a family naturally write this on a kitchen whiteboard?

Passes:

- `Agenda`
- `Vandaag`
- `Deze week`
- `Later`
- `Afspraak plannen`
- `Geen afspraken vandaag`
- `Geen afspraken meer deze week`
- `Wat gebeurt er?`
- `Wanneer is het?`

Fails:

- `Dagelijkse gezinsplek`
- `Wat moet het gezin hierna weten?`
- `Vandaag eerst, daarna de vorm van de week en pas dan rustig vooruitkijken.`
- `Nu telt vooral dit`
- `Verder vooruit blijft in beeld`
- `Compacte geruststelling voor wat later komt.`
- `Rustige hulpruimte`
- `Planning tools`
- `Geen extra drukte zichtbaar`
- `Hele dag zichtbaar voor het gezin.`

## Recommended Final Copy

### Dedicated Agenda page shell

- Navigation: `Agenda`
- Page title: `Agenda`
- Page subtitle: remove, or `Afspraken voor het gezin.` only if the shell requires a subtitle.
- Remove page position eyebrow `Dagelijkse gezinsplek` for primary pages, or hide it on Agenda.

### Agenda default view

- Remove widget eyebrow and duplicate widget title on the dedicated Agenda page.
- Header subtitle: remove. If required: `Vandaag en binnenkort.`
- Main sections:
  - `Vandaag`
  - `Deze week`
  - `Later`
  - `Plannen`

### Today section

- Active event state:
  - Heading: `Nu`
  - Lead label: `Nu bezig`
  - Summary: `Deze afspraak is nu bezig.`
- Next event state:
  - Heading: `Straks`
  - Summary: `N afspraken vandaag.` or `Eén afspraak vandaag.`
- Empty state:
  - Heading: `Geen afspraken vandaag`
  - Summary: remove, or `Volgende afspraak: [day] [date] · [title].` when useful.
- Overflow: `+N meer vandaag`

### Week section

- Heading: `Deze week`
- Count line: `N afspraken`
- Empty state: `Geen afspraken meer deze week`
- Remove explanatory summary under the week heading.
- Overflow: `+N meer op [weekday]`

### Later section

- Heading: `Later`
- Count line: `N afspraken later` or no count if events are visible.
- Empty state: `Nog niets gepland`
- Remove all explanatory helper copy.
- Overflow: `+N later`

### Planning/actions section

- Heading: `Plannen` if a heading is required.
- Remove subtitle.
- Actions:
  - `Afspraak plannen`
  - `Datum kiezen`
  - `Maand bekijken`
- Selected date label: `Gekozen dag`
- Source/filter label: `Agenda's`

### Month view

- Header: `Maand`
- Selected day panel:
  - Eyebrow: `Gekozen dag`
  - Summary with events: `N afspraken.`
  - Empty state: `Geen afspraken`
  - Button: `Toevoegen`
- Remove `Ruimte in de agenda.`

### Event dialog

- Dialog heading: `Afspraak toevoegen` / `Afspraak bewerken`
- Questions:
  - `Wat gebeurt er?`
  - `Wanneer is het?`
  - `Duurt het de hele dag?`
  - `Nog details?`
- Placeholder: `Zwemles`
- Details placeholder: `Notitie`
- Buttons:
  - `Terug`
  - `Verder`
  - `Afspraak maken`
  - `Afspraak opslaan`

## Text To Remove

- `Dagelijkse gezinsplek`
- `Familieplanning`
- Dedicated-page duplicate widget title `Agenda`
- `Planning` eyebrow
- `Wat moet het gezin hierna weten?`
- `Vandaag eerst, daarna de vorm van de week en pas dan rustig vooruitkijken.`
- `In balans`
- `Morgen begint op ... en laat direct de weekvorm zien.`
- `Geen extra drukte zichtbaar`
- `Na vandaag blijft de komende week voorlopig ruim.`
- `Verder vooruit blijft in beeld`
- `Compacte geruststelling voor wat later komt.`
- `Zodra er iets na deze week staat, verschijnt het hier rustig in beeld.`
- `De horizon is rustig`
- `Gebruik de maandweergave zodra je verder vooruit wilt plannen.`
- `Planning tools`
- `Rustige hulpruimte`
- `Pas gebruiken wanneer iemand wil plannen of iets wil opzoeken.`
- `Ruimte in de agenda.`
- `Hele dag zichtbaar voor het gezin.`

## Text To Rewrite

- `Gedeelde gezinsplanning en afspraken.` → remove or `Afspraken voor het gezin.`
- `Vandaag, straks en wat er binnenkort aankomt.` → `Vandaag en binnenkort.`
- `Kies een dag om ruimte te vinden of een afspraak in te plannen.` → `Kies een dag of plan een afspraak.`
- `Gebeurtenis toevoegen` → `Afspraak toevoegen`
- `Gebeurtenis bewerken` → `Afspraak bewerken`
- `Gebeurtenis maken` → `Afspraak maken`
- `Gebeurtenis opslaan` → `Afspraak opslaan`
- `Wanneer moet het gezin dit onthouden?` → `Wanneer is het?`
- `Optionele notitie voor het gezin` → `Notitie`
- `Bronnen` → `Agenda's`
- `Planningoverzicht` → `Agendaoverzicht`
- `Nu telt vooral dit` → `Nu`
- `Dit komt hierna` → `Straks`
- `Vandaag blijft open` → `Geen afspraken vandaag`
- `N afspraken in beeld` → `N afspraken`
- `De rest van de week is rustig` → `Geen afspraken meer deze week`
- `Vooruitkijken` → `Later`
- `Nog niets verder vooruit` → `Nog niets gepland`
- `+N meer vooruit` → `+N later`
- `N op de planning.` → `N afspraken.`
- `Begin met de eerste gebeurtenis` → `Nog geen afspraken`
- `Deze dag is nog leeg` → `Geen afspraken`
- Error messages using `gebeurtenis` → use `afspraak`

## Text To Keep

- `Agenda` in navigation and one page title
- `Agenda laden…`
- `Vandaag`
- `Morgen`
- `Kies datum`
- `Duurt het de hele dag?`
- `Hele dag`
- `Kies een tijd`
- `Datum`
- `Einddatum`
- `Begintijd`
- `Eindtijd`
- `Nog details?`
- `Terug`
- `Verder`
- `Opslaan…`
- `Verder vandaag`
- `+N meer vandaag`
- `Deze week`
- `+N meer op [weekday]`
- `Afspraak plannen`
- `Datum kiezen`
- `Maand bekijken`
- `Gekozen dag`
- `Toevoegen`
- `Bewerken`
- `Verwijderen`
- Event category labels: `Verjaardag`, `Vakantie`, `School`, `Sport`, `Zorg`, `Boodschappen`, `Familie`, `Werk`, `Kijken`, `Afspraak`

## Final Heading Hierarchy

Recommended visible hierarchy for the dedicated Agenda page:

1. `Agenda` — page title only.
2. `Vandaag` — primary section.
   - State heading: `Nu`, `Straks`, or `Geen afspraken vandaag`.
   - Optional subgroup: `Verder vandaag`.
3. `Deze week` — secondary section.
   - Day headings: weekday + short date.
4. `Later` — quieter future section.
5. `Plannen` — action area, only if a heading is needed.
6. Month view when opened:
   - `Maand`
   - `Gekozen dag`

Avoid visible `Planning`, `Planning tools`, `Familieplanning`, and duplicate `Agenda` headings inside the same page.

## Complete Recommended Subtitle Hierarchy

Recommended subtitle strategy:

- Page subtitle: none. Optional only if shell requires one: `Afspraken voor het gezin.`
- Agenda default view subtitle: none. Optional only if required by layout: `Vandaag en binnenkort.`
- `Vandaag`: no fixed subtitle; show a short data-driven sentence only when useful.
- `Deze week`: no explanatory subtitle; use counts and day groups.
- `Later`: no subtitle.
- `Plannen`: no subtitle.
- Month selected day: `Geen afspraken.` or `N afspraken.`

## Validation Performed

- Inspected Agenda user-facing strings in the Agenda widget source.
- Inspected workspace shell/title sources to understand repeated `Agenda` occurrences.
- Inspected workspace definitions and default layout sources to identify navigation, page title, description, and widget title origins.
- No code, CSS, backend, API, layout, test, or binary implementation changes were made.

## Files Inspected

- `src/HomeOps.Client/src/widgets/components/AgendaWidget.tsx`
- `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx`
- `src/HomeOps.Client/src/workspaces/workspaceModel.ts`
- `src/HomeOps.Client/src/workspaces/workspaceLayout.ts`
- `src/HomeOps.Client/src/widgets/widgetCatalog.ts`

## No Implementation Confirmation

This report is analysis only. No application source files were modified. The only repository change is this markdown report.

## Binary File Confirmation

No binary files were added.
