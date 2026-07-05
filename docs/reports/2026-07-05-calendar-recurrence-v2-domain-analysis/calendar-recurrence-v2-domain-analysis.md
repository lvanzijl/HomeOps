# Summary

HomeOps recurrence should move from a single `EventSeries.RecurrenceType` enum field to a dedicated recurrence rule model owned by an `EventSeries`. The long-term model should treat the series as the calendar event template and ownership boundary, while a recurrence rule describes how that template repeats. Exceptions should remain associated with the series but evolve from date-only overrides into occurrence-specific overrides keyed by a richer occurrence identity.

The recommended domain shape is:

- `EventSeries` owns stable event content, source ownership, provider identity for the master imported component, and an optional recurrence rule.
- `EventRecurrenceRule` owns recurrence frequency, interval, end condition, weekly days, monthly pattern, yearly pattern, raw provider rule metadata where needed, and generation policy fields.
- `EventException` owns skipped or modified occurrence state for one generated occurrence or imported detached instance.
- Imported and manual recurrence use the same recurrence rule and exception model; provider-specific identity is metadata on the same domain records, not a separate import-only recurrence system.

This report intentionally does not design APIs, UI, migrations, storage schema, or implementation steps.

# Domain Requirements

The recurrence domain model needs to support both household-created recurring events and imported iCal recurring events without introducing separate recurrence concepts for imports. The shared model needs to represent recurrence semantics rather than only a display hint.

Required domain capabilities:

- A non-recurring event remains possible.
- A recurring event can repeat daily, weekly, monthly, or yearly.
- A recurring event can repeat every N units, not only every one unit.
- A recurring event can end never, after a count, or on a date.
- Weekly recurrence can identify one or more days of week.
- Monthly recurrence can identify a day of month.
- Yearly recurrence can identify a month and day.
- Occurrence generation can exclude specific occurrence starts.
- Occurrence generation can apply modified occurrence content.
- Imported iCal series and manual series can share the same recurrence and exception representation.
- Imported recurring series can retain provider identity for the master series and detached/overridden instances.
- The model can map future iCal `RRULE`, `EXDATE`, and `RECURRENCE-ID` into HomeOps concepts.
- The model remains small enough for HomeOps family calendar needs and does not attempt full iCalendar parity.

Non-goals for this analysis:

- API request/response contract design.
- UI workflow design.
- Database migration design.
- Occurrence generator implementation design.
- Full iCalendar compatibility.

# Current Model Fit

The current model fits simple read-time recurrence because `EventSeries` has one `RecurrenceType` and `EventOccurrenceGenerator` can step by fixed enum values. It is suitable for daily, weekly, monthly, and yearly repetition without interval, end date, count, by-day rules, exclusions, or detached imported instances.

The current model is not a good long-term fit for Calendar Recurrence V2 because the recurrence concept is too compressed. A single enum field cannot express interval, recurrence ending, weekly day sets, monthly pattern choices, yearly date choices, exclusions, raw provider identity, or detached instance identity.

Keeping all recurrence concepts as additional scalar fields directly on `EventSeries` would technically support more scenarios, but it would make `EventSeries` carry both event-template responsibilities and recurrence-rule responsibilities. That would blur invariants, make non-recurring rows contain many irrelevant nullable fields, and make future imported recurrence handling harder to reason about.

`EventException` is closer to the right boundary because skipped and modified occurrences are separate from the base event template. However, date-only `OccurrenceDate` is insufficient as the long-term occurrence key because iCal detached instances identify an original recurrence instance, not merely a local calendar date. A date-only key also becomes ambiguous for multiple same-day instances, timezone-sensitive original starts, and imported `RECURRENCE-ID` values.

# Domain Model Options

## Option A: Keep recurrence as fields on `EventSeries`

This option keeps the current shape and adds fields such as interval, end count, end date, weekly days, monthly day, yearly month/day, and raw RRULE directly to `EventSeries`.

Benefits:

- Lowest conceptual change from the current model.
- Simple queries for common event details.
- No additional domain object boundary.

Costs:

- `EventSeries` becomes a large mixed-purpose record.
- Non-recurring events carry many irrelevant nullable recurrence fields.
- Recurrence invariants become harder to enforce because valid fields depend on frequency and end mode.
- Import-specific recurrence metadata is likely to leak onto all event series.
- Future support for richer recurrence rules would continue expanding the series row instead of keeping recurrence cohesive.

Assessment: acceptable for a narrow V1, but not the best long-term model for a shared manual/import recurrence system.

## Option B: Dedicated recurrence rule owned by `EventSeries`

This option makes recurrence a dedicated value object or owned entity associated with one `EventSeries`. A series either has no recurrence rule or has exactly one active recurrence rule. The rule stores frequency, interval, end condition, weekly/monthly/yearly pattern fields, and provider/raw recurrence metadata where needed.

Benefits:

- Clear boundary between event template and recurrence pattern.
- Non-recurring events remain simple: no rule means no recurrence.
- Rule invariants are localized to one concept.
- Manual and imported recurrence can share one representation.
- Future recurrence parsing and generation can target the rule model directly.
- Export/restore can serialize recurrence as a cohesive object rather than a placeholder enum/value pair.

Costs:

- More domain concepts than the current enum.
- Requires careful invariant definition for frequency-specific fields.
- Requires occurrence generation to read across series, rule, and exceptions.

Assessment: best fit for HomeOps Recurrence V2.

## Option C: Dedicated recurrence rule plus provider-specific import recurrence model

This option gives manual events a HomeOps recurrence rule and imported events a separate iCal recurrence storage model.

Benefits:

- Preserves imported provider details without loss.
- Could reduce initial mapping pressure for complex iCal inputs.

Costs:

- Violates the goal of no separate recurrence system for imports.
- Calendar reads would need to merge two recurrence systems.
- Manual and imported behavior could diverge.
- Exceptions and detached instances would have duplicate concepts.

Assessment: not recommended because it conflicts with the stated product direction.

## Option D: Store raw RRULE as the recurrence source of truth

This option stores iCalendar RRULE/EXDATE/RECURRENCE-ID concepts directly, using iCal semantics as the primary domain model for both manual and imported events.

Benefits:

- Strong alignment with iCal import/export semantics.
- Fewer lossy transformations for imported events.

Costs:

- Makes iCalendar a core HomeOps domain dependency.
- Exposes too much complexity for family calendar needs.
- Makes manual recurrence validation and explanation harder.
- Encourages full iCalendar parity, which is outside HomeOps scope.

Assessment: useful as provider metadata, but not recommended as the primary HomeOps recurrence domain model.

# Recommended Recurrence Model

Use a dedicated recurrence rule owned by `EventSeries`, plus evolved exceptions keyed by a richer occurrence identity.

Recommended conceptual model:

```text
EventSeries
  Id
  EventSourceId
  Base event fields
  Provider master identity fields
  Optional EventRecurrenceRule
  EventExceptions

EventRecurrenceRule
  EventSeriesId
  Frequency
  Interval
  EndMode
  Count
  UntilDate
  WeeklyDays
  MonthlyPattern
  MonthlyDayOfMonth
  YearlyMonth
  YearlyDayOfMonth
  RawProviderRecurrenceRule
  ProviderRecurrenceFingerprint

EventException
  EventSeriesId
  OccurrenceKey
  ExceptionType
  Replacement event fields
  Provider detached-instance identity fields
```

The recurrence rule should be required for recurring series and absent for non-recurring series. It may be implemented later as an owned value object or a separate entity; the domain recommendation is the boundary, not a persistence design.

Recommended enums/value concepts:

- `RecurrenceFrequency`: `Daily`, `Weekly`, `Monthly`, `Yearly`.
- `RecurrenceEndMode`: `Never`, `AfterCount`, `OnDate`.
- `RecurrenceMonthlyPattern`: initially `DayOfMonth` only.
- `EventExceptionType`: `Skipped`, `Modified`.
- `OccurrenceKey`: richer identity for the original recurrence instance.

Recommended representation for requested concepts:

| Concept | Recommended home |
| --- | --- |
| Frequency | `EventRecurrenceRule.Frequency` |
| Interval | `EventRecurrenceRule.Interval` |
| End never | `EventRecurrenceRule.EndMode = Never` |
| End after count | `EventRecurrenceRule.EndMode = AfterCount` plus `Count` |
| End on date | `EventRecurrenceRule.EndMode = OnDate` plus `UntilDate` |
| Weekly days | `EventRecurrenceRule.WeeklyDays` |
| Monthly day-of-month | `EventRecurrenceRule.MonthlyPattern = DayOfMonth` plus `MonthlyDayOfMonth` |
| Yearly date | `EventRecurrenceRule.YearlyMonth` plus `YearlyDayOfMonth` |
| Exclusions | `EventException` with `ExceptionType = Skipped`, or a rule-owned exclusion collection if exclusions without metadata become common |
| Modified occurrences | `EventException` with `ExceptionType = Modified` and replacement fields |

# EventSeries Responsibilities

`EventSeries` should remain the aggregate root and event template. It should answer: what event is being repeated, who owns it, where did it come from, and what source controls editability.

Concepts that belong on `EventSeries`:

- Household/source ownership through `EventSourceId`.
- Base event title.
- Base description.
- Base location.
- Base all-day flag.
- Base start date/time.
- Base end date/time or duration semantics.
- Created/updated timestamps.
- Manual vs imported source writability through `EventSource`.
- Provider master event identity for imported series.
- Provider revision/fingerprint for imported master series.
- Link to optional recurrence rule.
- Collection of occurrence exceptions.

Concepts that should not remain directly on `EventSeries` long term:

- Frequency as a flat `RecurrenceType` field.
- Interval.
- Count/until/end mode.
- Weekly day set.
- Monthly recurrence details.
- Yearly recurrence details.
- Raw RRULE text as the only recurrence source of truth.
- EXDATE lists as unrelated scalar fields.
- Detached instance recurrence identity.

This boundary keeps `EventSeries` focused on event identity and default content. The recurrence rule explains when the default content appears.

# Recurrence Rule Responsibilities

The recurrence rule should own the pattern that generates candidate occurrences from the series template. It should be expressive enough for HomeOps needs and for common iCal RRULEs, but intentionally narrower than the complete iCalendar standard.

Concepts that belong in the recurrence rule:

- Frequency: daily, weekly, monthly, yearly.
- Interval: positive integer, default 1.
- End mode: never, after count, or on date.
- Count for count-bounded recurrence.
- Until date for date-bounded recurrence.
- Weekly day set for weekly recurrence.
- Monthly day-of-month for day-based monthly recurrence.
- Yearly month/day for annual recurrence.
- Optional provider/raw recurrence metadata for traceability, such as raw RRULE and recurrence fingerprint.

Rule invariants should be frequency-aware:

- Daily rules do not need weekly/monthly/yearly pattern fields.
- Weekly rules should use one or more weekly days.
- Monthly day-of-month rules should use one day number.
- Yearly rules should use one month/day pair.
- `AfterCount` requires a positive count.
- `OnDate` requires an until date.
- `Never` should not require count or until date.

The rule should not own modified occurrence content. Modified occurrence state belongs in exceptions because it is tied to individual occurrences, not to the recurrence pattern.

# EventException Responsibilities

`EventException` should continue to represent occurrence-level divergence from the recurrence rule. Its long-term responsibility should include both HomeOps-created exceptions and imported provider detached instances.

Recommended exception responsibilities:

- Identify the original generated occurrence using a rich occurrence key.
- Mark an occurrence as skipped/excluded.
- Store replacement content for a modified occurrence.
- Store replacement timing for a modified occurrence.
- Store provider identity for an imported detached instance when applicable.
- Preserve provider revision/fingerprint for imported detached instance updates.
- Distinguish HomeOps-authored exceptions from provider-authored exceptions through existing source ownership/provider metadata, not through a separate exception model.

`EventException` should evolve beyond the current nullable replacement fields by covering all base event fields that can differ for one occurrence:

- title;
- description;
- location;
- all-day flag;
- start date/time;
- end date/time;
- provider detached-instance metadata.

## Occurrence key

`EventException` should not rely only on `OccurrenceDate` long term. It should use a richer occurrence key that represents the original scheduled recurrence instance.

Recommended conceptual occurrence key:

- original local start date;
- original local start time for timed events;
- all-day indicator or local date-only marker for all-day events;
- optional provider recurrence id/raw value for imported detached instances;
- optional timezone context if provider recurrence ids require it.

Reasons to move beyond date-only keys:

- Multiple occurrences from the same series can theoretically occur on the same local date if future rules become more expressive.
- Timed and all-day recurrence identities are not equivalent.
- iCal `RECURRENCE-ID` identifies the original instance start, not merely the date.
- Detached imported instances need stable matching against provider recurrence identifiers.
- Timezone-sensitive recurrence can make date-only matching ambiguous around local/UTC boundaries.

A compatibility path can still treat the current `OccurrenceDate` as an occurrence key for all-day/simple daily cases, but the long-term domain concept should be richer.

# Manual and Imported Recurrence

Manual and imported recurring events should share the same `EventSeries` + `EventRecurrenceRule` + `EventException` model.

Manual recurrence:

- A user-created recurring event creates an `EventSeries` with base event fields and a HomeOps-authored recurrence rule.
- Manual skipped or modified occurrences create `EventException` records under the same series.
- Manual recurrence does not need provider identity fields.

Imported recurrence:

- An imported recurring master component creates or updates an `EventSeries` with the same base fields and a recurrence rule mapped from provider recurrence data.
- Imported `EXDATE` values become skipped exceptions or rule-owned exclusions depending on final persistence design; the domain meaning is excluded occurrences.
- Imported detached `RECURRENCE-ID` components become modified exceptions under the matching series.
- Imported provider metadata is stored on the same series/rule/exception records rather than in an import-only recurrence subsystem.

Shared behavior:

- Calendar reads expand recurrence from the same rule model regardless of source.
- Exceptions are applied the same way regardless of source.
- Editability remains a source capability question, not a recurrence model question.
- Import synchronization updates provider-owned recurrence and exceptions without creating a separate provider recurrence read path.

# Provider Identity

Provider identity should be split by domain level.

For imported recurring master series, `EventSeries` should store:

- provider event id / UID for the master component;
- provider revision, sequence, last modified, or equivalent revision marker;
- provider content fingerprint;
- provider source id where source-level identity is available;
- import timestamps and last-seen sync attempt metadata.

For imported recurrence rules, the recurrence rule should store:

- raw provider RRULE when useful for traceability and re-synchronization comparisons;
- normalized recurrence fields used by HomeOps generation;
- recurrence fingerprint or equivalent normalized/raw comparison value.

For imported detached instances, `EventException` should store:

- provider event id / UID, usually matching the master UID;
- provider recurrence id / original instance identifier;
- provider instance id if the provider exposes one separately;
- provider revision/fingerprint for the detached instance;
- last imported and last seen metadata if needed for sync reconciliation.

This separation avoids overloading the series provider id with detached instance identity. The master series remains the imported event identity; detached instances are occurrence-level provider records.

# Unsupported Scope

HomeOps should intentionally avoid full iCalendar recurrence parity in Recurrence V2. The model should focus on common family-calendar patterns and common import interoperability.

Recommended unsupported scope for Recurrence V2:

- Multiple RRULEs per event series.
- Sub-daily recurrence frequencies such as hourly, minutely, or secondly.
- Complex `BYSETPOS` rules.
- `BYYEARDAY`, `BYWEEKNO`, and `BYSECOND`/`BYMINUTE`/`BYHOUR` recurrence modifiers.
- Multiple monthly pattern modes beyond day-of-month in the initial domain model.
- Business-day calendars or holiday-aware recurrence adjustment.
- Event-specific timezone management if the product remains household-timezone based.
- Arbitrary provider-specific recurrence semantics that cannot be normalized into the HomeOps rule.
- Event sourcing, CQRS, distributed recurrence workers, or microservice-style recurrence engines.

Some currently unsupported capabilities should become supported because they are central to the requested goal:

- interval;
- end after count;
- end on date;
- weekly days;
- monthly day of month;
- yearly date;
- exclusions;
- modified occurrences;
- provider recurrence identity for detached instances.

# Trade-offs

The recommended model is more complex than the current enum field, but the added complexity aligns with real domain boundaries. Recurrence has enough rules and invariants to justify a dedicated concept.

Benefits:

- Keeps `EventSeries` readable and focused.
- Gives recurrence a cohesive invariant boundary.
- Supports manual and imported recurrence with one model.
- Provides a natural home for iCal RRULE mapping without making iCal the domain model.
- Allows exceptions to represent both HomeOps edits and imported detached instances.
- Makes unsupported recurrence explicit rather than silently flattening everything to `None`.

Costs:

- More model concepts for developers to understand.
- Occurrence generation becomes more sophisticated.
- Synchronization must reconcile series, recurrence rules, exclusions, and detached instances together.
- Export/restore must carry richer recurrence and exception data.
- Validation must be frequency-aware and end-mode-aware.

Why not keep fields on `EventSeries`:

- It is simpler initially but scales poorly as recurrence concepts accumulate.
- It makes unrelated nullable columns/fields normal for non-recurring events.
- It gives no strong boundary for recurrence invariants.
- It increases the chance of import-specific fields leaking into manual event concepts.

Why not raw RRULE as source of truth:

- It overfits HomeOps to an external interchange format.
- It makes manual recurrence harder to validate and explain.
- It encourages supporting edge cases the product should intentionally avoid.
- It weakens the shared domain language for manual and imported recurrence.

# Risks

Domain risks:

- A too-small recurrence rule may still fail common imported calendars.
- A too-large recurrence rule may recreate full iCalendar complexity inside HomeOps.
- Ambiguous occurrence identity can cause modified or skipped occurrences to attach to the wrong generated instance.
- Count-bounded recurrence semantics can be tricky when exclusions and detached instances interact.
- Date-bounded recurrence semantics need a clear local-date interpretation.
- Month-end behavior needs explicit policy for days such as the 29th, 30th, and 31st.
- Leap-day yearly recurrence needs explicit policy.
- Provider synchronization can overwrite local interpretation if provider identity is not separated cleanly between master series and detached instances.

Product/scope risks:

- Adding recurrence power can create UI and support complexity later, even though UI is outside this analysis.
- Imported calendars may contain unsupported RRULEs that must be degraded or reported clearly.
- Families may expect provider parity once iCal import supports basic recurrence.
- If raw RRULE is preserved but not authoritative, developers must understand which fields drive occurrence generation.

Mitigation at the domain level is to keep the HomeOps recurrence model explicit, bounded, and provider-aware without making provider syntax the primary model.

# Files Referenced

- `.github/copilot-instructions.md`
- `AGENTS.md`
- `docs/reports/2026-07-05-calendar-recurrence-v2-baseline/calendar-recurrence-v2-baseline.md`
- `src/HomeOps.Api/CalendarEvents/EventSeries.cs`
- `src/HomeOps.Api/CalendarEvents/RecurrenceType.cs`
- `src/HomeOps.Api/CalendarEvents/EventException.cs`
- `src/HomeOps.Api/CalendarEvents/EventOccurrenceGenerator.cs`
- `src/HomeOps.Api/CalendarEvents/EventOccurrenceProjector.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeriesEndpoints.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeriesDtos.cs`
- `src/HomeOps.Api/CalendarEvents/CalendarExportDtos.cs`
- `src/HomeOps.Api/CalendarEvents/CalendarPortabilityService.cs`
- `src/HomeOps.Api/CalendarEvents/ICalendar/ICalendarParser.cs`
- `src/HomeOps.Api/CalendarEvents/ICalendar/NormalizedICalendarEvent.cs`
- `src/HomeOps.Api/CalendarEvents/Synchronization/NormalizedProviderEvent.cs`
- `src/HomeOps.Api/CalendarEvents/Synchronization/CalendarSourceRefreshDispatcher.cs`
- `src/HomeOps.Api/CalendarEvents/Synchronization/CalendarSourceSynchronizationEngine.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/EventOccurrenceProjectionTests.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/ICalendarParserTests.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/ICalFeedImporterTests.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/ICalFileImporterTests.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarSourceSynchronizationEngineTests.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarPortabilityTests.cs`
