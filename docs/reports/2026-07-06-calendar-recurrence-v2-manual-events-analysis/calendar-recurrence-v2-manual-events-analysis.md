# Summary

Manual recurring events should feel like a small family calendar feature, not an expert recurrence editor. Recurrence V2 should expose one clear event creation flow for non-recurring, daily, weekly, monthly, and yearly events, with plain-language controls for interval and ending. It should map directly onto the frozen recurrence domain: `EventSeries` is the event template, an optional owned `EventRecurrenceRule` describes repetition, `EventException` records per-occurrence skips or modifications, and `OccurrenceKey` identifies the original generated occurrence.

Recommended product model:

- A normal event is still the default: recurrence is off unless the user opens the repeat section and chooses a repeat option.
- Recurrence belongs in a collapsed/compact **Herhalen** section in the main event dialog, not in a separate advanced editor.
- Supported repeat options are: **Niet herhalen**, **Dagelijks**, **Wekelijks**, **Maandelijks**, **Jaarlijks**.
- Interval is shown only when recurrence is enabled and should read naturally, such as **Elke 2 weken**.
- End options are: **Nooit**, **Op datum**, **Na aantal keer**.
- Editing an occurrence should open the normal edit dialog first and ask scope only after the user presses **Opslaan**, using the actual changed fields to show only valid scope options: **Alleen deze afspraak**, **Deze en volgende afspraken**, or **Hele reeks**.
- Skipping one occurrence should be a dedicated family-friendly action named **Deze keer overslaan**, implemented conceptually as a skipped `EventException`, not hidden behind destructive delete wording.
- Moving or changing one occurrence should create or update a modified `EventException` keyed by the original `OccurrenceKey`.
- Deleting should use non-technical wording and separate occurrence, future, and whole-series outcomes.

This report is analysis only. It does not design persistence, endpoint routes, database changes, migrations, occurrence generation internals, synchronization, or frontend implementation.

# Creating Recurring Events

## Recommended creation flow

The event dialog should start with the same primary fields for every event:

1. Title.
2. Date.
3. Start/end time or all-day.
4. Optional location.
5. Optional description/details.
6. Compact **Herhalen** section.

Default state: **Herhalen: Niet herhalen**. This keeps the most common family action simple and prevents recurrence controls from increasing cognitive load for one-off events.

When the user chooses a recurrence option, the dialog expands only the controls needed for that frequency.

## Non-recurring events

Default choice:

- Label: **Niet herhalen**.
- Domain mapping: `EventSeries` with no `EventRecurrenceRule`.
- End controls: hidden.
- Interval controls: hidden.

This should remain the fastest path: users should be able to create a one-time dentist appointment or school event without seeing recurrence complexity.

## Daily events

Recommended controls:

- Repeat choice: **Dagelijks**.
- Interval row: **Elke [1] dag(en)**.
- End row: **Eindigt: [Nooit | Op datum | Na aantal keer]**.

Defaults:

- Interval: `1`.
- End mode: **Nooit**.
- Count field hidden unless **Na aantal keer** is selected.
- Until date hidden unless **Op datum** is selected.

Family examples:

- Medication reminder every day.
- Daily childcare note.

Domain mapping:

- `Frequency = Daily`.
- `Interval = N`.
- `EndMode = Never | OnDate | AfterCount`.

## Weekly events

Recommended controls:

- Repeat choice: **Wekelijks**.
- Weekday chips: selected by default to the event start weekday.
- Interval row: **Elke [1] week/weken**.
- End row: **Eindigt: [Nooit | Op datum | Na aantal keer]**.

Defaults:

- Interval: `1`.
- Weekly days: event start weekday.
- End mode: **Nooit**.

The weekday chips should be visible because they are family-friendly and frequently useful: sports training on Tuesday and Thursday, music class every Wednesday, or library day every Friday. The UI should not require opening an advanced RRULE-like editor.

Domain mapping:

- `Frequency = Weekly`.
- `WeeklyDays = selected weekdays`.
- `Interval = N` applies to recurrence weeks, not individual selected days.
- `Count`, when used, counts generated candidates before exceptions.

## Monthly events

Recommended controls:

- Repeat choice: **Maandelijks**.
- Plain summary: **Elke maand op dag [D]** where `D` defaults to the event start day.
- Interval row: **Elke [1] maand(en)**.
- End row: **Eindigt: [Nooit | Op datum | Na aantal keer]**.

Defaults:

- Monthly day-of-month: event start day.
- Interval: `1`.
- End mode: **Nooit**.

Important UX note: Recurrence V2 should not expose custom monthly patterns such as “the second Tuesday” or “the last weekday.” If the start date is the 31st, the UI should explain only when necessary: **Maanden zonder dag 31 worden overgeslagen.** This matches the frozen occurrence-engine decision that invalid monthly dates are skipped, not clamped.

Domain mapping:

- `Frequency = Monthly`.
- `MonthlyDayOfMonth = start day or selected day`.
- No end-of-month special rule in V2.

## Yearly events

Recommended controls:

- Repeat choice: **Jaarlijks**.
- Plain summary: **Elk jaar op [day month]**.
- Interval row: **Elke [1] jaar** or hidden until interval is customized.
- End row: **Eindigt: [Nooit | Op datum | Na aantal keer]**.

Defaults:

- Yearly month/day: event start month/day.
- Interval: `1`.
- End mode: **Nooit**.

Important UX note: February 29 should be supported by the domain as a yearly date that occurs only in leap years. The UI should show an explanatory note when selected: **29 februari verschijnt alleen in schrikkeljaren.**

Domain mapping:

- `Frequency = Yearly`.
- `YearlyMonth` and `YearlyDayOfMonth` from the event start date.

## Interval selection

Recommended model: show interval as a simple number input or stepper when recurrence is enabled.

Wording examples:

- **Elke 1 dag**.
- **Elke 2 weken**.
- **Elke 3 maanden**.
- **Elke 1 jaar**.

The UI should avoid technical labels such as “interval.” Family users should see a sentence, not a domain property.

Recommended bounds:

- Minimum: `1`.
- Maximum: product-defined small bound, recommended `99` for all frequencies.
- Whole numbers only.

## End selection

Recommended options:

1. **Nooit**.
2. **Op datum**.
3. **Na aantal keer**.

Defaults:

- New recurring manual events default to **Nooit**, because many family routines are open-ended.
- If a user changes an event that obviously belongs to a temporary period, they can select an end date or count.

Trade-off: A never-ending default can create long-running series. That is acceptable because the frozen occurrence engine is windowed and supports unbounded recurrence. The product should prefer simple defaults over forcing every family routine to have an artificial end.

# Editing Recurring Events

## Editing scope problem

When a user edits a recurring occurrence, they may mean one of three things:

1. Only this occurrence is different.
2. This occurrence and future occurrences should change.
3. The entire recurring series should change.

HomeOps should not guess silently. Silent guesses create high-impact mistakes, such as changing all football trainings when the family only wanted to move tomorrow's practice.

## Alternatives compared

### Alternative A: Always edit the whole series

Benefits:

- Simplest implementation and mental model.
- No scope dialog.

Costs:

- Unsafe for family calendars.
- Cannot handle common cases like “this week training is at 18:30.”
- Encourages users to delete and recreate events.

Assessment: not recommended.

### Alternative B: Edit form first, then ask scope on save

Benefits:

- User can focus on what they want to change before deciding how broadly it applies.
- The event dialog stays identical for recurring and non-recurring events until the user saves.
- The scope question appears only after there is a concrete change to apply.
- The dialog can inspect the changed fields and hide invalid scope options automatically.
- Common family edits, such as changing only the title, time, location, or description, can keep all three scope choices available.
- Recurrence-rule changes can remove **Alleen deze afspraak** because changing the repetition pattern cannot be represented as a one-off occurrence exception.

Costs:

- The user does not choose scope before editing, so the form must avoid implying that every visible field can always be saved as a one-off change.
- The save interaction has one extra confirmation step for recurring events.
- The implementation must classify changed fields before presenting the scope dialog.

Assessment: recommended for HomeOps. It matches how families naturally think: first decide “what changed,” then decide “is this only this time, from now on, or the whole routine?” It also reduces early interruption and lets the product prevent invalid scope choices with less explanation.

### Alternative C: Ask scope before opening edit form

Benefits:

- The form can be tailored to the chosen scope.
- The user knows the scope before changing fields.
- It can reduce accidental series edits when the user already understands the impact of their intended change.

Costs:

- Adds a decision before the user has clarified what they want to change.
- Forces a scope choice even when the user is only exploring details or making a minor edit.
- Can increase cognitive load because family users must reason about recurrence semantics before seeing the editable fields.
- If the user later changes a field that is not valid for the chosen scope, the flow still needs a second warning or a redesigned form state.

Assessment: not recommended as the default HomeOps edit interaction. It is safer in a narrow technical sense, but it interrupts the family-first flow too early and can ask the hardest question at the moment when the user has the least information.

## Recommended edit model

When opening an occurrence that belongs to a recurring series, open the normal event edit dialog first. The user edits the event as usual and presses **Opslaan**. HomeOps then shows a small scope chooser based on the fields that actually changed:

- **Alleen deze afspraak** — “Wijzig alleen deze afspraak.”
- **Deze en volgende afspraken** — “Wijzig deze afspraak en alle latere afspraken.”
- **Hele reeks** — “Wijzig alle afspraken in deze reeks.”

Recommended default highlight: **Alleen deze afspraak** when the user opened a specific occurrence from the agenda and the changed fields can be represented as an occurrence exception, because the user likely acted on what they saw. For edits started from a series settings/details area, default to **Hele reeks**.

The scope chooser should not show invalid choices. If the changed fields include recurrence settings, **Alleen deze afspraak** should disappear because a recurrence-rule change is not a single-occurrence edit. If the changed fields are occurrence-replaceable fields such as title, date, time, location, or description, all three choices may remain available.

## Decision factors

### Usability

The save-time scope dialog is more usable for everyday family edits because it follows the natural sequence: open event, make the change, save, then choose whether the change is for one appointment, future appointments, or the whole routine. The pre-edit scope chooser is most useful for expert users who already know the recurrence impact before they start editing, but that is not the primary HomeOps audience.

### Cognitive load

The save-time model lowers initial cognitive load by postponing recurrence semantics until they are necessary. It also allows the UI to remove impossible choices, so the user does not need to understand why a recurrence-pattern edit cannot apply to only one appointment. The pre-edit model asks the hardest question first and can require the user to predict which fields they will change.

### Discoverability

The pre-edit model makes recurrence scope highly visible before editing. The save-time model is slightly less upfront, so the edit form should make recurrence status visible with a compact label such as **Herhalende afspraak**. The final scope dialog remains discoverable because it appears before any recurring edit is applied.

### Accidental edits

Both models must prevent accidental broad edits. The save-time model should do this by showing a concise change summary and requiring an explicit scope before applying changes to future appointments or the whole series. It has an additional safety advantage: it can tailor scope options to the actual field changes rather than relying on the user's early guess.

### Family friendliness

The save-time model is more family-friendly because it avoids interrupting users before they know what they are trying to fix. It keeps the edit form familiar for recurring and non-recurring events and uses plain choices at the moment they matter.

### Implementation implications

At a high level, the save-time model requires change classification before the scope dialog is shown. The UI needs to know whether the changed fields are occurrence-replaceable, series-template fields, or recurrence-rule fields. This is more involved than a pre-edit chooser, but it keeps the interaction cleaner and does not require redesigning the recurrence model or occurrence engine.

## Scope behavior

### Alleen deze afspraak

Use when one date/time/content instance is different.

Domain mapping:

- Target the occurrence by `OccurrenceKey`.
- Create or update a modified `EventException`.
- Leave `EventSeries` and `EventRecurrenceRule` unchanged.

Fields allowed:

- Title.
- Date.
- Time/all-day only if the domain supports all-day replacement in the implementation slice.
- Location.
- Description/details.

### Deze en volgende afspraken

Use when a routine changes from a point forward.

Product behavior:

- Conceptually split the series at the selected occurrence.
- The old series ends before the selected occurrence.
- A new series begins at the selected occurrence with the new template/rule.

This report does not design persistence, but the interaction model should be explicit: this is not a single occurrence exception. It is a future-series change.

Recommended wording:

- **Deze en volgende afspraken aanpassen**.
- Confirmation summary: **Eerdere afspraken blijven hetzelfde.**

### Hele reeks

Use when the family wants the entire routine changed.

Domain mapping:

- Target the `EventSeries` and optional owned `EventRecurrenceRule`.
- Update base event fields and/or recurrence rule.
- Existing exceptions need product-specific handling in later implementation, but the UX should warn if the series already has changed/skipped occurrences.

Recommended wording:

- **Hele reeks aanpassen**.
- Confirmation summary: **Alle afspraken in deze reeks krijgen deze wijziging.**

# Skipping Occurrences

## Recommended model

Skipping should be a dedicated non-destructive action:

- Primary wording: **Deze keer overslaan**.
- Secondary description: **De reeks blijft bestaan. Alleen deze afspraak wordt verborgen.**

Domain mapping:

- Create or update an `EventException` with `ExceptionType = Skipped` for the original `OccurrenceKey`.
- Do not delete the `EventSeries`.
- Do not change the `EventRecurrenceRule`.
- Do not reduce count or move the end date. The frozen engine counts candidates before exceptions.

## Why not hide skip inside edit?

Skipping through edit would make users open an edit form just to cancel one practice or one lesson. That is too indirect. Families need a fast, clear action from the event details surface.

## Why not make skip automatic through deletion only?

Deletion wording feels destructive. If a user taps **Verwijderen**, they may fear removing the whole series. For one occurrence, HomeOps can still offer delete wording in a delete flow, but the direct action should be **overslaan** because it describes the intent.

## Restoring a skipped occurrence

A skipped occurrence should remain visible in an appropriate management context, such as the series detail view or a collapsed “overgeslagen” row near that date if the UI later supports it. The restore action should be:

- **Deze keer terugzetten**.
- Description: **De afspraak verschijnt weer volgens de reeks.**

Domain mapping:

- Remove the skipped exception or change it back to a modified exception only if replacement fields exist.
- The restored occurrence returns to the generated candidate from the series template unless a modified exception remains.

# Moving Occurrences

## Recommended model

Moving one occurrence is an occurrence modification, not a recurrence-rule change.

If the user chooses **Alleen deze afspraak** and changes date or time, HomeOps should create or update a modified `EventException` keyed by the original occurrence `OccurrenceKey`.

The original generated occurrence should not remain visible in the old slot. The modified occurrence appears at the replacement date/time. Window filtering should use the replacement interval, consistent with the frozen occurrence-engine analysis.

## Field behavior

### Changing date

- This becomes a modified `EventException`.
- The `OccurrenceKey` remains the original scheduled date/time.
- Replacement start/end date fields carry the new date.

### Changing time

- This becomes a modified `EventException`.
- The key remains the original start.
- Replacement time fields carry the new local wall-clock time.

### Changing title

- For **Alleen deze afspraak**, this becomes a modified `EventException` with replacement title.
- For **Hele reeks**, this updates `EventSeries.Title`.
- For **Deze en volgende afspraken**, this belongs to the future series template after a split.

### Changing location

- For **Alleen deze afspraak**, this should become a modified `EventException` with replacement location.
- The frozen domain baseline notes current exceptions do not yet include location, but the settled V2 interaction model should treat one-off location changes as occurrence exceptions.
- If the first implementation slice cannot support replacement location, it should not pretend to support one-off location edits; it should either disable that field for occurrence-only edits or expand the exception replacement fields intentionally.

# Deleting Occurrences

## Recommended delete flow

Recurring event deletion should ask for scope with family-safe wording.

For a selected occurrence:

1. **Alleen deze afspraak verwijderen**.
   - Explanation: **De andere afspraken in de reeks blijven staan.**
   - Domain mapping: skipped `EventException`.
2. **Deze en volgende afspraken verwijderen**.
   - Explanation: **Eerdere afspraken blijven staan. De reeks stopt vóór deze afspraak.**
   - Domain mapping: future deletion/end adjustment or series split/end behavior in a later API design.
3. **Hele reeks verwijderen**.
   - Explanation: **Alle afspraken in deze reeks worden verwijderd.**
   - Domain mapping: delete `EventSeries` and owned recurrence/exception records.

Recommended button labels:

- Destructive primary button should include the selected scope, not just **Verwijderen**.
- Example: **Alleen deze afspraak verwijderen**.

## Delete occurrence versus skip occurrence

Product distinction:

- **Overslaan** is the friendly day-to-day action for “this one is not happening.”
- **Verwijderen** is still available in the delete flow and maps to the same skipped-exception result for one occurrence.

Recommendation: expose both concepts carefully:

- Event details quick action: **Deze keer overslaan**.
- More/options destructive flow: **Verwijderen...** with scope choices.

# Validation Rules

## Recurrence frequency

Valid manual frequencies:

- None/non-recurring.
- Daily.
- Weekly.
- Monthly.
- Yearly.

Invalid combinations:

- Frequency absent while recurrence-specific fields are present.
- Frequency present without a valid rule object.
- Unsupported frequency names or arbitrary RRULE text.

## Interval

Rules:

- Required when recurrence is enabled.
- Must be a whole number.
- Minimum `1`.
- Recommended maximum `99`.
- Default `1`.

Invalid examples:

- `0`.
- Negative values.
- Decimal values.
- Blank interval when recurrence is enabled.

Family-friendly validation message:

- **Kies hoe vaak dit moet herhalen. Gebruik een getal van 1 of hoger.**

## Weekly days

Rules:

- Weekly recurrence must have at least one selected weekday.
- Default to the event start weekday.
- Multiple weekdays are allowed.
- Selected weekdays before the first start date in the first recurrence week do not create occurrences before the series start.

Invalid example:

- Weekly recurrence with no weekdays selected.

Message:

- **Kies minstens één dag van de week.**

## Monthly day

Rules:

- Monthly recurrence uses one day-of-month.
- Default to the start date's day-of-month.
- Valid range: `1` through `31`.
- Months without that date are skipped.

Invalid examples:

- Day `0`.
- Day `32`.
- Multiple day-of-month values.
- Last-day or nth-weekday patterns in V2.

Message for 29/30/31:

- **Sommige maanden hebben deze dag niet. Die maanden worden overgeslagen.**

## Yearly month/day

Rules:

- Yearly recurrence uses one month/day pair.
- Default to the start date's month/day.
- Date must exist in at least one year.
- February 29 is valid and occurs only in leap years.

Invalid examples:

- April 31.
- Month `13`.
- Day `0`.

Message:

- **Kies een geldige datum voor de jaarlijkse herhaling.**

## End mode

Valid end modes:

- Never.
- On date.
- After count.

Rules:

- `Never` must not carry count or until values.
- `OnDate` requires an until date.
- `AfterCount` requires a count.
- Only one end mode can be active.

## End date

Rules:

- Required for **Op datum**.
- Date-only, household-local.
- Inclusive boundary: an original occurrence on that date is allowed.
- Must be on or after the series start date.

Recommended stricter validation:

- The selected end date should allow at least one generated occurrence. For example, a monthly event starting January 31 with an end date of February 28 has one occurrence only if the January 31 start is included; if the rule is being created for a future selected start, the UI should preview or validate that at least one candidate exists.

Message:

- **Kies een einddatum op of na de eerste afspraak.**

## Count

Rules:

- Required for **Na aantal keer**.
- Whole number.
- Minimum `1`.
- Recommended maximum `999`.
- Counts generated candidate occurrences before skipped or modified exceptions.

Message:

- **Kies hoe vaak de afspraak in totaal moet voorkomen.**

## Impossible combinations

Reject or prevent:

- Non-recurring event with interval/end/count fields.
- Daily rule with weekly days.
- Weekly rule without weekdays.
- Monthly rule with weekly days or yearly month fields.
- Monthly day outside `1..31`.
- Yearly invalid month/day.
- `Never` plus count or until date.
- `OnDate` plus count.
- `AfterCount` plus until date.
- Occurrence-only edit without an `OccurrenceKey`.
- Occurrence-only skip/restore for a generated occurrence that does not belong to the selected series.

# API Interaction Model

This section intentionally avoids route or endpoint design. It defines natural API behavior from the frozen domain.

## Create non-recurring event

Target concept:

- `EventSeries`.

Behavior:

- Create an `EventSeries` with no `EventRecurrenceRule`.
- Return the created series and/or projected occurrence read model as later API design chooses.

## Create recurring event

Target concept:

- `EventSeries` with owned `EventRecurrenceRule`.

Behavior:

- Create the event template and recurrence rule together.
- Validate recurrence fields as one cohesive rule value.
- Do not create stored occurrences.

## Edit one occurrence

Target concept:

- `(EventSeries.Id, OccurrenceKey)`.

Behavior:

- The API should target a generated occurrence by original `OccurrenceKey`, not by displayed replacement date/time.
- Create/update an `EventException` for modified fields.
- For skip/delete occurrence, create/update a skipped exception.
- For restore, remove the skipped exception or clear the skip state.

Rationale:

- `OccurrenceKey` is the settled domain identity for a generated occurrence.
- Moved occurrences must remain addressable by their original key.

## Edit whole series

Target concept:

- `EventSeries` and optional owned `EventRecurrenceRule`.

Behavior:

- Update series template fields and/or the owned recurrence rule.
- The API should treat the recurrence rule as part of the series aggregate, not as an independently addressable recurrence-rule resource.

## Edit this and future

Target concept:

- The selected original `OccurrenceKey` as a split boundary plus series-level data for the new future template.

Behavior:

- Later API design should represent this as a series-level operation with a boundary occurrence.
- It should not be modeled as many per-occurrence exceptions.
- It should not mutate past generated occurrences.

## Delete future

Target concept:

- `EventSeries` with boundary `OccurrenceKey` or boundary date.

Behavior:

- Later API design should stop the recurrence before the selected occurrence or split/delete the future series shape.
- It should preserve past occurrences according to read-model semantics.

# Family-First UX

## Tone and wording

Use family language instead of technical calendar language.

Recommended Dutch labels:

- **Herhalen** instead of “recurrence.”
- **Niet herhalen**.
- **Dagelijks**.
- **Wekelijks**.
- **Maandelijks**.
- **Jaarlijks**.
- **Nooit**.
- **Op datum**.
- **Na aantal keer**.
- **Deze keer overslaan**.
- **Deze keer terugzetten**.
- **Alleen deze afspraak**.
- **Deze en volgende afspraken**.
- **Hele reeks**.

Avoid:

- RRULE.
- Occurrence key.
- Exception.
- Instance.
- Recurrence rule.
- Until/count as visible technical labels.

## Low cognitive load principles

- Start with non-recurring by default.
- Hide interval/end fields until recurrence is enabled.
- Show only fields relevant to the selected frequency.
- Use sentence-like controls.
- Prefer previews over abstract rules where possible, such as **Eerstvolgende: ma 6 juli, ma 13 juli, ma 20 juli** in a future implementation.
- Ask edit/delete scope before applying destructive or broad changes; for edits, this means after **Opslaan** but before the change is committed.
- Make one-off actions reversible when possible.

## Mistake prevention

Important confirmations:

- Editing whole series when exceptions exist.
- Deleting whole series.
- Deleting this and future.
- Changing recurrence frequency for an existing series.

Do not over-confirm:

- Creating a normal non-recurring event.
- Creating a simple weekly routine.
- Skipping one occurrence if there is a clear restore path.

# Unsupported Scope

The following should intentionally remain outside Recurrence V2 manual-event UX:

- Arbitrary RRULE editing.
- Raw iCalendar recurrence display/editing.
- Business-day recurrence.
- Holiday-aware recurrence.
- School-holiday-aware recurrence.
- “Every weekday” as a distinct business concept; it can be represented later as weekly Monday-Friday if desired, but does not need a special V2 mode.
- Nth weekday monthly patterns, such as second Tuesday.
- Last weekday monthly patterns.
- Last day of month recurrence.
- Multiple day-of-month monthly rules.
- Multiple month/day yearly rules.
- Multiple recurrence rules per event.
- RDATE-style arbitrary extra dates.
- Timezone-per-event recurrence editing.
- Provider-specific recurrence editors.
- Full detached-instance synchronization UX.
- Bulk exception management UI beyond basic skipped/restored occurrence behavior.
- Shared recurrence templates.

These exclusions protect the family-first goal. HomeOps should solve common household routines before power-user calendar parity.

# Trade-offs

## Recurrence in primary dialog versus Herhalen section versus advanced section

### Primary dialog always visible

Benefits:

- Discoverable.
- Fast for users who often create recurring events.

Costs:

- Adds clutter to every event creation.
- Makes one-off event creation feel more complicated.

Assessment: not recommended.

### Collapsed/compact Herhalen section

Benefits:

- Discoverable but not intrusive.
- Keeps one-off events simple.
- Supports family-friendly labels.
- Allows progressive disclosure by frequency.

Costs:

- One additional tap/click for recurrence.

Assessment: recommended.

### Advanced section

Benefits:

- Keeps primary dialog very clean.

Costs:

- Makes common family routines feel advanced.
- Reduces discoverability.
- Encourages users to create duplicate one-off events manually.

Assessment: not recommended.

## Edit scope before versus after form

Recommendation: open the edit form first, then ask scope after the user presses **Opslaan**.

Reason: it lets family users decide what changed before deciding how broadly to apply it. The save-time scope dialog can use the changed fields to hide invalid options, such as removing **Alleen deze afspraak** when recurrence settings changed, while preserving the same familiar edit form for recurring and non-recurring events.

## Skip as action versus delete as action

Recommendation: use **Deze keer overslaan** as the direct action and scoped delete for destructive flows.

Reason: skipping is the family's intent for a canceled practice or appointment; deletion is too ambiguous for recurring events.

## Never-ending default versus requiring end

Recommendation: default to **Nooit**.

Reason: many family routines are ongoing. Requiring an end increases friction and creates fake data. The occurrence engine is designed for windowed unbounded recurrence.

## Monthly invalid dates: skip versus clamp

Recommendation: skip invalid months.

Reason: this follows the frozen occurrence-engine decision and avoids hidden substitutions. The UI should explain this only when the selected day may be absent.

# Frozen UX Decisions

1. Manual recurrence is configured in a compact **Herhalen** section in the event dialog.
2. New events default to **Niet herhalen**.
3. Supported manual frequencies are daily, weekly, monthly, and yearly only.
4. Interval is supported for all recurring frequencies and defaults to `1`.
5. End modes are **Nooit**, **Op datum**, and **Na aantal keer**.
6. Weekly recurrence defaults to the event start weekday and may support multiple selected weekdays.
7. Monthly recurrence is day-of-month only.
8. Yearly recurrence is month/day only.
9. Editing a recurring occurrence opens the normal edit form first, then asks scope on **Opslaan** using only valid options: **Alleen deze afspraak**, **Deze en volgende afspraken**, **Hele reeks**.
10. One-off edits create/update modified `EventException` records keyed by original `OccurrenceKey`.
11. One-off skips use skipped `EventException` records.
12. Moving one occurrence does not change the recurrence rule; it is a modified exception.
13. Deleting one occurrence maps to a skipped exception, but the quick user action should be worded as skipping.
14. Series edits target `EventSeries` and its owned `EventRecurrenceRule`.
15. Future edits/deletes are series-level operations with a boundary occurrence, not mass exception creation.
16. Arbitrary RRULE editing and power-user recurrence patterns are outside Recurrence V2.

# Risks

- **Save-time scope surprise:** Asking scope after **Opslaan** may surprise users who expected the save to finish immediately. Mitigation: use clear dialog wording, show a concise change summary, and present only valid scope choices.
- **Future-edit complexity:** “This and future” likely requires series split/end semantics later. Mitigation: keep it as a product/API operation, not a pile of exceptions.
- **Exception-field mismatch:** The current baseline exception model does not include all replacement fields such as location/all-day override. Mitigation: implementation slices must either expand exception replacement fields intentionally or disable unsupported occurrence-only fields.
- **Monthly 29/30/31 confusion:** Skipping invalid months may surprise users. Mitigation: show a plain note only for affected days.
- **Leap-year confusion:** February 29 yearly events are rare but confusing. Mitigation: show a note when selected.
- **Imported versus manual parity:** Provider recurrences may contain unsupported patterns. Mitigation: do not expose unsupported power-user controls in manual UX and do not redesign the frozen domain.
- **Restore discoverability:** Restoring skipped occurrences requires users to find skipped items. Mitigation: later implementation should include a small series-detail view for skipped/changed occurrences.

# Files Referenced

- `.github/copilot-instructions.md`
- `AGENTS.md`
- `docs/reports/2026-07-05-calendar-recurrence-v2-baseline/calendar-recurrence-v2-baseline.md`
- `docs/reports/2026-07-05-calendar-recurrence-v2-domain-analysis/calendar-recurrence-v2-domain-analysis.md`
- `docs/reports/2026-07-05-calendar-recurrence-v2-domain-refinement/calendar-recurrence-v2-domain-refinement.md`
- `docs/reports/2026-07-06-calendar-recurrence-v2-occurrence-engine-analysis/calendar-recurrence-v2-occurrence-engine-analysis.md`
