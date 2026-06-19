# Calendar Time Zone and Recurrence Semantics Analysis

## Summary

### Facts
- This is an analysis-only report.
- No implementation, code changes, tests, migrations, or database changes were performed.
- Preflight `dotnet --version` returned `10.0.301`.
- HomeOps Calendar is the preferred source of truth.
- Manual Events are transitional.
- EventSeries is the currently preferred conceptual direction.
- Recurrence will exist in the future.
- PostgreSQL is the primary persistence technology.
- JSON is expected to become the canonical HomeOps export format.
- ICS remains out of scope for implementation, but its calendar concepts are relevant for analysis.
- Agenda renders concrete occurrences.
- Event management operates on logical entities.

### Analysis conclusion
HomeOps should not model calendar time as “UTC only.” UTC instants are useful for querying and occurrence rendering, but the logical source of truth for HomeOps-owned events should preserve the user's intended local calendar semantics. Timed recurring events need a local wall-clock time plus an IANA time zone. All-day events and date-based multi-day periods need date-only semantics rather than midnight UTC semantics. EventSeries should conceptually own the time zone, recurrence rule, and occurrence generation policy for HomeOps-owned calendar data.

## Current Facts

### Facts
- HomeOps is a modular monolith using ASP.NET Core, React, TypeScript, Vite, PostgreSQL, OpenAPI, and NSwag.
- Widgets are presentation units, and data models must not be widget-specific.
- Manual Events currently persist concrete single event occurrences only.
- Prior analysis recommends migrating Manual Events to non-recurring EventSeries before recurrence or canonical calendar export is implemented.
- Prior analysis recommends JSON as the canonical HomeOps logical export format and ICS only as a supplemental interoperability format.
- Prior analysis recommends that Agenda consume generated EventOccurrence values rather than recurrence internals.

### Accepted decisions
- HomeOps Calendar is the preferred source of truth.
- Manual Events are transitional.
- EventSeries is the preferred conceptual direction.
- Recurrence will be introduced later.
- JSON export/import is expected to become canonical for HomeOps-owned data.

### Assumptions
- Household calendar events are primarily authored for a household locality, currently expected to behave like Europe/Amsterdam examples unless a different event time zone is explicitly chosen.
- Users expect “Wednesday 18:00” recurring events to remain at 18:00 local civil time across daylight saving time transitions.
- Users expect birthdays, holidays, and vacation dates to remain on their calendar dates, not to shift because of UTC conversion.

## Industry Practices Analysis

### Google Calendar concepts
Google Calendar distinguishes calendars, events, all-day event dates, timed event date-times, recurrence rules, recurring event instances, and exceptions. Official Google Calendar API documentation states that event time zones use IANA time zone identifiers and that recurring events require the event time zone because it specifies the time zone in which recurrence is expanded. Google also models recurrence with RRULE/RDATE/EXDATE-style recurrence fields and can expand a recurring event into instances. Sources: Google Calendar events and calendars concepts, Google Calendar Events resource, and Google recurring events best-practices documentation.

### Outlook / Exchange concepts
Outlook and Exchange concepts similarly distinguish event date-time values, an all-day flag, recurrence patterns, recurrence ranges, instances, modified occurrences, and cancelled occurrences. Microsoft Graph's event resource explicitly has `isAllDay`; when true, start and end must be midnight and in the same time zone. Microsoft Graph also exposes time-zone-sensitive event start/end values and supports requesting response conversion with a `Prefer: outlook.timezone` header for GET operations.

### iCalendar concepts
RFC 5545 iCalendar distinguishes VEVENT components, `DTSTART`, `DTEND` or `DURATION`, date versus date-time values, `TZID` time-zone references, `RRULE`, `RDATE`, `EXDATE`, `RECURRENCE-ID`, and VTIMEZONE definitions. Conceptually, iCalendar treats recurrence as a rule applied from an initial start value, with exclusions and modified instances layered on top.

### Analysis conclusions
- Established calendar systems do not treat UTC instants as the only source of truth for all calendar data.
- Established systems preserve local event definitions and time-zone semantics for recurring timed events.
- Established systems treat all-day/date events differently from timed events.
- Established systems separate logical recurring series from expanded concrete instances.
- ICS is conceptually useful because it encodes decades of calendar edge cases, even if HomeOps JSON remains the canonical export format.

## Time Zone Analysis

### Option A — Store everything in UTC

#### Advantages
- Simple comparison and sorting for already-resolved timed occurrences.
- Efficient range queries for Agenda windows when occurrences are concrete instants.
- Aligns with many backend logging and scheduling practices.

#### Disadvantages
- Loses the user's wall-clock intent for recurring events unless additional local metadata is stored elsewhere.
- Cannot correctly represent date-only all-day events without artificial midnight instants.
- Can shift birthdays, holidays, vacations, and all-day events when viewed in another time zone.
- Makes DST behavior ambiguous because “every Wednesday 18:00” cannot be reconstructed from only UTC instants.
- Makes future JSON export less portable because the export would not know whether an event was intended as 18:00 Europe/Amsterdam, 17:00 UTC, or a floating local time.

#### Long-term risks
- High migration risk before recurrence.
- High portability risk for all-day and multi-day events.
- High risk of user-visible DST defects.
- High risk that EventSeries implementation would require reverse-engineering intent from stored UTC values.

### Option B — Store local event definitions with time zone information

#### Advantages
- Preserves user intent: for example, football training every Wednesday at 18:00 Europe/Amsterdam.
- Supports correct DST behavior by expanding recurrence in the named time zone.
- Supports all-day and date-only events without UTC date shifting.
- Aligns with Google Calendar, Outlook/Exchange, and iCalendar conceptual models.
- Produces better canonical JSON because the logical definition is exportable.

#### Disadvantages
- Requires careful occurrence expansion logic.
- Requires IANA time-zone identifiers and a policy for time-zone database changes.
- Requires explicit handling of ambiguous or nonexistent local times around DST transitions.
- Queries often need generated or computed occurrence instants for efficient Agenda rendering.

#### Long-term risks
- Medium complexity risk because recurrence expansion must be deterministic.
- Low semantic risk because the model preserves the information needed for future behavior.

### Option C — Hybrid approach

#### Concept
Store the logical event definition in local/calendar terms, including time zone or date-only semantics, and generate concrete UTC instants for occurrence rendering, caching, and range querying.

#### Advantages
- Preserves source-of-truth intent while still enabling efficient Agenda queries.
- Keeps EventSeries and EventOccurrence responsibilities separate.
- Supports JSON export from logical data rather than generated cache data.
- Allows PostgreSQL to store or index resolved occurrence windows later without making them authoritative.

#### Disadvantages
- Requires clear rules to prevent generated occurrence data from becoming the source of truth.
- Requires invalidating or regenerating cached occurrences when rules, exceptions, or time-zone data change.
- Requires explicit naming of date-only versus date-time event kinds.

#### Long-term risks
- Medium implementation complexity.
- Low domain-model risk if logical definitions remain authoritative.

### Analysis conclusion
Option C is the strongest conceptual direction. HomeOps should preserve local event definitions with time-zone/date semantics as the authoritative model and use UTC only for generated timed occurrence instants, range queries, and display projections.

## Recurring Events Analysis

### Logical source of truth
For a recurring timed event such as “every Wednesday 18:00 Europe/Amsterdam,” the logical source of truth should be:
- the EventSeries identity;
- the local start time, such as 18:00;
- the duration or local end time;
- the IANA time zone, such as Europe/Amsterdam;
- the recurrence rule, such as weekly on Wednesday;
- the recurrence start date and optional end/count;
- exceptions for skipped, modified, or detached occurrences.

### DST transitions
A weekly event at 18:00 Europe/Amsterdam should remain at 18:00 local Amsterdam time before and after daylight saving time changes. Its UTC instant will change when the offset changes. That UTC change is correct; preserving a fixed UTC instant would be wrong for a normal household training session.

For ambiguous or nonexistent local times near DST transitions, HomeOps needs a policy before implementation. Examples include local times that occur twice when clocks fall back, or local times that do not exist when clocks spring forward. The policy should be explicit and exportable enough to remain deterministic.

### Information that must be preserved
- IANA time-zone identifier.
- Local start date and local start time for timed events.
- Duration or local end semantics.
- Recurrence frequency, interval, days, month rules, count/until semantics, and start anchor.
- Whether recurrence is date-based, local-time-based, or all-day/date-only.
- Exceptions and modified occurrences.
- Original logical series identity and external/import identity if applicable.

### Analysis conclusion
Recurring events are logical series, not lists of stored UTC instants. Generated occurrences are derived projections for Agenda and interoperability.

## All-Day Events Analysis

### Birthdays
Birthdays are date-based concepts. They should not be represented as midnight UTC timed events. A birthday occurs on a local calendar date and should remain visible on that date regardless of offset conversion.

### Holidays
Holidays are date-based concepts. They may be jurisdiction-specific and may span one or more dates. They should use date-only semantics.

### Vacation periods
Vacation can be all-day and multi-day. A vacation from Monday through Friday should be represented as a date interval, not as Monday 00:00 UTC through Friday 23:59 UTC.

### Should all-day events behave differently from timed events?
Yes. All-day events should have date-only semantics. They should not require a clock time. They may optionally have a calendar or locality context for display and import/export, but their core meaning is a date or date range.

### Should date-only concepts exist?
Yes. Date-only concepts should exist for birthdays, holidays, and all-day vacation periods. This is necessary to prevent timezone-induced date shifts and to support clean JSON export/import.

### Analysis conclusion
HomeOps should conceptually distinguish timed events from all-day/date-only events before recurrence is implemented.

## Multi-Day Events Analysis

### Start/end semantics
Multi-day all-day events should use a start date and an exclusive end date, matching common calendar interchange semantics. For example, a vacation displayed Monday through Friday is represented as start Monday and exclusive end Saturday. This avoids ambiguous “end of day” timestamps.

Timed multi-day events, such as a conference beginning Tuesday 09:00 and ending Thursday 17:00, should use local date-time start/end values with a time zone. They may generate UTC instants for occurrence querying, but the logical definition should preserve local times and zone.

### Time-zone implications
- Date-only multi-day events should not shift dates due to UTC conversion.
- Timed multi-day events need a time zone to define the local meaning of start and end.
- Travel events may eventually need event-specific time zones, but that is a future product decision.

### Portability implications
- JSON should preserve date-only start/end values for all-day multi-day events.
- JSON should preserve local date-times plus IANA time zone for timed multi-day events.
- If ICS interoperability is added later, all-day multi-day events should map to DATE `DTSTART` and exclusive DATE `DTEND` concepts rather than artificial midnight UTC instants.

### Analysis conclusion
Multi-day events reinforce the need to separate date-only periods from timed intervals.

## JSON Export Analysis

### Facts
- JSON is expected to become the canonical HomeOps export format.
- JSON should be logical, not database-shaped.
- PostgreSQL backups remain operational recovery; JSON exports are the portability contract.

### Time-zone-related information to preserve
Canonical JSON should preserve:
- event kind: timed, all-day/date-only, or generated-source projection if applicable;
- IANA time-zone identifier for timed local events and recurring timed series;
- local start date and local start time for timed events;
- local end date/time or duration;
- date-only start date and exclusive end date for all-day events;
- recurrence rule and recurrence expansion time zone;
- exception dates/occurrence identifiers using the same semantic basis as the series;
- original imported/exported external identity where applicable;
- source ownership and source capability;
- export schema version and calendar domain version.

### Analysis conclusion
The JSON export must preserve the logical time model. Exporting only generated UTC occurrences would not be a canonical calendar export; it would be a lossy Agenda projection.

## Migration Risk Analysis

### Risks if HomeOps stores only UTC
- Recurrence wall-clock intent is lost.
- DST behavior becomes incorrect or unrecoverable.
- All-day events can shift dates.
- Multi-day all-day periods become hard to interpret.
- JSON export becomes lossy.
- Future EventSeries migration becomes more complex.

### Risks if HomeOps stores only local times
- Absolute ordering across time zones is ambiguous.
- Timed event range queries require knowing the time zone before conversion.
- Events authored for travel or imported from external systems may not have enough context.
- Integrations may need UTC instants for APIs and synchronization.

### Risks if timezone information is omitted
- Recurring timed events cannot be expanded correctly.
- DST transitions cannot be handled deterministically.
- Exports cannot preserve intended behavior.
- Imported events may display differently after restore.
- HomeOps may be forced into incompatible assumptions such as “server local time” or “household default time zone.”

### Analysis conclusion
The highest-risk path is omitting time-zone and date-only semantics now, then adding recurrence later.

## Future Recurrence Analysis

### Should EventSeries own timezone information?
Yes, for timed HomeOps-owned events. The EventSeries is the logical entity users manage, so it should own the time zone used to interpret its local start/end values and recurrence expansion. All-day/date-only series may not need a clock time zone, but may still need a calendar/locality context for imports, display, or jurisdiction-specific holidays.

### Should EventSeries own recurrence information?
Yes. Recurrence is part of the logical definition of a series. A one-time event can be modeled as an EventSeries with no recurrence rule.

### Should EventSeries own occurrence generation rules?
Conceptually yes. The EventSeries should define the inputs and policy for generating occurrences. The implementation may use a separate recurrence service, but Agenda should not own or understand recurrence internals.

### Analysis conclusion
EventSeries should conceptually own timezone semantics, recurrence semantics, and occurrence generation policy. EventOccurrence should remain generated output.

## Risks

### Domain risks
- Treating all events as UTC instants would produce a fragile model for recurrence.
- Treating all-day events as timed midnight events would create date-shift defects.
- Introducing recurrence before settling timezone policy would create migration debt.
- Allowing Agenda to manage recurrence details would violate the separation between logical event management and presentation rendering.

### Portability risks
- JSON exports that omit IANA time zones cannot reliably restore recurring timed events.
- JSON exports that omit date-only semantics cannot reliably restore birthdays, holidays, or vacations.
- ICS interoperability may later reveal edge cases not represented in HomeOps JSON if the logical model is too narrow.

### Implementation-timing risks
- Manual Events may accumulate more data before migration.
- Adding Google Calendar import before HomeOps logical calendar semantics are settled could mix provider concepts into the core model.
- Deferring timezone decisions until after EventSeries persistence would increase schema and migration risk.

## Open Questions

### Architectural decisions needed before EventSeries implementation
- What is the default household time zone, and where is it configured?
- Can each EventSeries choose its own IANA time zone, or is the first implementation household-time-zone only?
- What is the explicit policy for nonexistent local times during spring-forward DST transitions?
- What is the explicit policy for ambiguous local times during fall-back DST transitions?
- Should all-day events store only date ranges, or also an optional calendar/locality context?
- Should multi-day all-day end dates be exclusive in the HomeOps JSON contract? This analysis recommends yes.
- What subset of recurrence rules will the first EventSeries implementation support?
- How will modified, skipped, and detached occurrences be represented conceptually?
- How should “this and future” edits split or version an EventSeries?
- Should unsupported imported recurrence rules be rejected, preserved read-only, or simplified?
- Should ICS remain out of scope for implementation until after JSON export, or should an ICS mapping analysis precede recurrence persistence?

## Recommended Direction

### Accepted decisions to preserve
- HomeOps Calendar is the source of truth.
- Manual Events are transitional.
- EventSeries is the preferred logical event entity.
- Agenda renders generated concrete occurrences.
- JSON is the canonical HomeOps export format.

### Analysis conclusions
- Use a hybrid time model: logical local/date definitions as source of truth, generated UTC instants for timed occurrence projections.
- Store timed recurring series as local wall-clock definitions with IANA time-zone identifiers.
- Treat all-day events as date-only, not timed midnight UTC events.
- Treat multi-day all-day events as date ranges, preferably start date plus exclusive end date.
- Treat one-time timed events as non-recurring EventSeries with local date-time plus time zone.
- Treat recurring timed events as EventSeries with recurrence rules expanded in the series time zone.
- Preserve recurrence and timezone semantics in canonical JSON export.
- Do not implement recurrence, migrations, database changes, or API changes until these decisions are explicitly accepted.

### Recommended next analysis or implementation gate
Before EventSeries implementation, HomeOps should make explicit decisions about default household time zone, per-series time-zone support, DST ambiguity policy, date-only event representation, supported recurrence subset, and exception semantics.

## Next Prompt Context

Use this context for the next planning or implementation prompt:

> HomeOps Calendar remains the preferred source of truth. Manual Events are transitional and should become non-recurring EventSeries before recurrence is added. Calendar time should not be modeled as UTC-only. The recommended conceptual direction is a hybrid model: EventSeries preserves logical local/date semantics, including IANA time zone for timed events and date-only ranges for all-day events, while generated EventOccurrence values can include UTC instants for Agenda range queries and rendering. Recurring timed events such as “every Wednesday 18:00 Europe/Amsterdam” should expand in the series time zone and remain at 18:00 local time across DST transitions. All-day events such as birthdays, holidays, and vacations should use date-only semantics, with multi-day all-day events represented by start date and exclusive end date. Canonical JSON export must preserve event kind, local date/time values, IANA time zone, recurrence rules, exceptions, source ownership, and schema versions. Before implementation, decide household/default time zone, per-series time-zone support, DST ambiguity/nonexistent-time policies, supported recurrence subset, and exception/split semantics.

## References Consulted

- Repository guidance: `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`.
- Architecture and state documents: `docs/architecture.md`, `docs/state/current-state.md`, `docs/roadmap/phase-2.md`.
- Prior reports: architecture realignment, calendar source-of-truth, recurrence architecture, and data model/portability analyses.
- Google Calendar API concepts and Events resource documentation.
- Microsoft Graph event and calendar list documentation.
- RFC 5545 iCalendar specification.
