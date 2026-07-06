# Executive Summary

Calendar Recurrence V2 replaces the current enum-only recurrence capability with one canonical, provider-independent recurrence model shared by manual events and imported events. `EventSeries` remains the aggregate root and represents the event template, ownership boundary, and provider master identity. `EventRecurrenceRule` is an optional owned value object on `EventSeries` and represents the supported recurrence shape. `EventException` remains an entity under the series and represents one-off skips or modifications keyed to the original generated occurrence through `OccurrenceKey`.

The design intentionally keeps occurrence generation in the HomeOps domain rather than delegating recurrence expansion to iCalendar text, provider-specific engines, or persisted generated occurrences. Generation is windowed, deterministic, household-local, and provider-independent. It creates candidate occurrences first, applies `COUNT` and `UNTIL` semantics to candidates before exception processing, then overlays skipped or modified exceptions. Generated occurrences remain transient read models.

Manual and imported recurrence use the same domain model. iCalendar is an interchange format, not the source of truth. Supported RRULEs map into `EventRecurrenceRule`; `EXDATE` maps to skipped `EventException` rows; detached `RECURRENCE-ID` instances map to modified `EventException` rows. Unsupported recurrence is preserved as provider metadata and diagnostics, never approximated as a different HomeOps recurrence.

This document consolidates and freezes the accepted decisions from the Recurrence V2 analysis reports. Future implementation work must use this specification as the canonical blueprint and must not reopen the architectural decisions documented here.

# Goals

- Define the canonical Calendar Recurrence V2 implementation blueprint.
- Preserve `EventSeries` as the aggregate root for event templates, recurrence, exceptions, source ownership, and provider master identity.
- Model recurrence with an optional owned `EventRecurrenceRule` value object rather than enum-only fields or raw RRULE as source of truth.
- Keep `EventException` as an entity for occurrence-level skips and modifications.
- Use `OccurrenceKey` to identify the original generated occurrence, independent of replacement date/time.
- Support the frozen recurrence set:
  - non-recurring events;
  - daily recurrence;
  - weekly recurrence with one or more weekdays;
  - monthly day-of-month recurrence;
  - yearly month/day recurrence;
  - interval;
  - no end;
  - end on date;
  - end after count.
- Generate occurrences through a provider-independent, windowed, deterministic occurrence engine.
- Use one shared recurrence model for manual and imported events.
- Map supported iCalendar RRULE/EXDATE/RECURRENCE-ID data faithfully into the HomeOps domain.
- Preserve unsupported provider recurrence metadata without approximation.
- Define validation, API, DTO, persistence, synchronization, export/restore, and testing expectations for implementation.

# Non-Goals

- No source-code implementation is included in this report.
- No UI implementation is included in this report.
- No database migration is included in this report.
- No generated OpenAPI/NSwag client changes are included in this report.
- No provider writeback is defined for editing provider-owned recurring events.
- No provider-specific occurrence generation is introduced.
- No stored occurrence table is introduced for generated occurrences.
- No Kubernetes, microservices, CQRS, event sourcing, or distributed recurrence architecture is introduced.
- No support is added for advanced iCalendar recurrence forms outside the frozen V2 scope.
- No support is added for per-event recurrence timezones as a generation source of truth.
- No support is added for `RDATE`, ordinal weekdays, monthly nth-weekday recurrence, multiple monthly days, multiple yearly months, `BYSETPOS`, `BYYEARDAY`, `BYWEEKNO`, sub-day recurrence, or arbitrary RRULE evaluation.

# Architecture Overview

Calendar Recurrence V2 is a modular-monolith domain feature inside the existing HomeOps calendar module.

The architecture has four layers of responsibility:

1. **Domain aggregate**
   - `EventSeries` is the aggregate root.
   - `EventRecurrenceRule` is an optional owned value object on the series.
   - `EventException` is an entity under the series.
   - `OccurrenceKey` is the stable identity for the original generated occurrence.

2. **Occurrence generation**
   - The occurrence engine reads an `EventSeries`, its optional recurrence rule, and its exceptions.
   - It generates candidates inside a requested date window.
   - It applies recurrence stopping rules and exceptions.
   - It returns transient read-model occurrences.

3. **Input/output mapping**
   - Manual API DTOs map recurrence fields into the same domain model used by imported events.
   - iCalendar import maps supported RRULEs into `EventRecurrenceRule` and exceptions into `EventException`.
   - iCalendar export maps only faithfully represented HomeOps recurrence into RRULE/EXDATE/detached VEVENTs.
   - Export/restore preserves HomeOps recurrence and provider metadata without inventing unsupported semantics.

4. **Synchronization**
   - Provider import normalizes provider data into provider-neutral series/rule/exception concepts.
   - Synchronization compares and updates master series, recurrence rule, and exceptions separately.
   - Provider-specific metadata may be stored for fidelity, but generation remains HomeOps-domain based.

This architecture was chosen because the baseline found the current enum-only model too limited for intervals, end conditions, weekly multiple weekdays, iCalendar exceptions, and manual occurrence edits. The domain analysis selected a dedicated recurrence rule owned by `EventSeries`; the domain refinement froze it as a value object rather than an entity. The occurrence-engine analysis froze transient, windowed generation rather than persisted occurrence rows. The iCalendar mapping analysis froze HomeOps recurrence as source of truth and iCalendar as interchange.

Rejected alternatives:

- **Keep recurrence as fields directly on `EventSeries`:** rejected because it causes the aggregate root to accumulate recurrence-specific fields and does not scale cleanly to end modes, weekly days, provider recurrence metadata, and validation.
- **Separate recurrence rule entity:** rejected because the rule has no independent lifecycle or identity outside the series.
- **Raw RRULE as source of truth:** rejected because HomeOps would inherit arbitrary iCalendar complexity and provider-specific behavior.
- **Stored generated occurrences:** rejected because generated occurrences are projections of a series/rule/exception state and should not become a second source of truth.
- **Provider-specific generation:** rejected because manual, iCal, Google, CalDAV, and Exchange recurrence must behave consistently after normalization.

# Domain Model

The canonical domain model is:

- `EventSeries`
  - aggregate root;
  - owns stable event template fields;
  - owns optional `EventRecurrenceRule`;
  - owns `EventException` entities;
  - stores source ownership and provider master metadata.
- `EventRecurrenceRule`
  - owned value object;
  - optional;
  - present only when HomeOps can generate recurrence faithfully;
  - contains normalized recurrence semantics and recurrence-shape provider metadata where needed.
- `EventException`
  - entity;
  - belongs to one `EventSeries`;
  - keyed by `OccurrenceKey` for the original generated occurrence;
  - represents one skipped or modified occurrence.
- `OccurrenceKey`
  - value that identifies the original generated occurrence;
  - stable across one-off modifications and moves;
  - used by exceptions, occurrence identity, synchronization, and export mapping.

Manual and imported recurrence use exactly this model. There must not be separate manual recurrence entities, imported recurrence entities, or provider-specific recurrence generation branches.

# EventSeries

`EventSeries` remains the aggregate root.

Responsibilities:

- Own the household/source boundary for the event.
- Store the event template content:
  - title;
  - description;
  - location;
  - all-day flag;
  - base start date/time;
  - base end date/time or duration-defining fields.
- Own the optional `EventRecurrenceRule` value object.
- Own `EventException` entities for one-off skips and modifications.
- Store provider master metadata for imported events:
  - source id;
  - provider master event id/UID;
  - provider revision/etag/sequence where available;
  - provider master content fingerprint;
  - last-seen synchronization metadata;
  - unsupported recurrence classification/status when needed.
- Enforce aggregate-level consistency:
  - one recurrence rule per series at most;
  - exceptions must belong to generated occurrences of the series;
  - exception keys must be unique within the series.

Why this was chosen:

- The event series is already the natural ownership boundary in the baseline model.
- Recurrence changes alter how the event template repeats, so the rule belongs to the series.
- Exceptions have no meaning without the series and original generated occurrence.
- Provider master identity belongs to the master series, not to generated occurrences.

Rejected alternatives:

- Putting recurrence on generated occurrences would make generated read models authoritative, which conflicts with deterministic transient generation.
- Splitting imported recurring events into provider-specific aggregate types would duplicate behavior and violate the shared recurrence model decision.

# EventRecurrenceRule

`EventRecurrenceRule` is an owned value object of `EventSeries`.

It is optional. Absence of the value means the series is non-recurring or has unsupported provider recurrence that HomeOps must preserve but not generate.

Canonical fields:

- `Frequency`
  - `Daily`;
  - `Weekly`;
  - `Monthly`;
  - `Yearly`.
- `Interval`
  - positive integer;
  - defaults to `1`.
- `EndMode`
  - `Never`;
  - `OnDate`;
  - `AfterCount`.
- `UntilDate`
  - required only when `EndMode = OnDate`;
  - inclusive household-local original-start date.
- `Count`
  - required only when `EndMode = AfterCount`;
  - counts generated candidates before exception processing.
- `WeeklyDays`
  - required for weekly recurrence;
  - one or more weekdays;
  - may contain multiple weekdays.
- `MonthlyDayOfMonth`
  - required for monthly recurrence;
  - positive day-of-month only.
- `YearlyMonth`
  - required for yearly recurrence.
- `YearlyDayOfMonth`
  - required for yearly recurrence.
- Optional provider recurrence metadata for imported supported recurrence:
  - raw RRULE;
  - canonicalized RRULE if implementation creates one;
  - unsupported reason/status where persisted as recurrence-shape metadata;
  - recurrence metadata fingerprint if implementation needs an efficient comparison value.

Value-object semantics:

- The rule has no independent identity.
- Replacing the rule is equivalent to changing the recurrence pattern of the series.
- Persistence may use owned-type tables or flattened columns, but the domain semantics remain owned value object semantics.

Why this was chosen:

- The domain refinement concluded the recurrence rule is descriptive state of a series, not an independently addressable business entity.
- Owned value-object semantics prevent duplicate lifecycle concerns and avoid a separate recurrence aggregate.
- It cleanly separates event template content from recurrence shape while keeping both inside the same aggregate.

Rejected alternatives:

- A standalone recurrence entity was rejected because no user or provider addresses a recurrence rule independently of its series in V2.
- Raw RRULE-only storage was rejected because HomeOps needs validation, manual UX, deterministic generation, and provider-neutral synchronization over normalized fields.

# EventException

`EventException` remains an entity under `EventSeries`.

Responsibilities:

- Represent a single divergence from a generated candidate occurrence.
- Support one-off skipped occurrences.
- Support one-off modified occurrences.
- Preserve occurrence-level provider metadata for imported detached instances.
- Keep replacement fields separate from original occurrence identity.

Canonical fields:

- `Id`
  - persistent entity identity.
- `EventSeriesId`
  - parent aggregate id.
- `OccurrenceKey`
  - original generated occurrence identity.
- `ExceptionType`
  - `Skipped`;
  - `Modified`.
- Replacement fields for modified exceptions, as supported by the domain:
  - title override;
  - description override;
  - location override;
  - all-day override if included by implementation;
  - replacement start date/time;
  - replacement end date/time or duration-derived replacement end.
- Provider detached-instance metadata where applicable:
  - raw `RECURRENCE-ID`;
  - normalized provider recurrence id;
  - detached provider event id if available;
  - detached revision/etag/sequence;
  - detached content fingerprint;
  - raw detached recurrence metadata needed for sync fidelity;
  - source ownership marker if needed to distinguish provider-created and manual exceptions.

Identity and uniqueness:

- There may be at most one active exception for a given `(EventSeriesId, OccurrenceKey)`.
- A moved occurrence keeps the same `OccurrenceKey`; its replacement start/end fields change display placement only.
- A skipped occurrence produces no generated read-model occurrence.

Why this was chosen:

- The existing model already uses exceptions for skipped and modified instances.
- The domain and iCalendar analyses both concluded `EXDATE` and detached `RECURRENCE-ID` instances should map to exceptions, not to separate occurrence entities.
- Entity semantics are required because exceptions have lifecycle, persistence identity, provider metadata, and may be created/updated/deleted independently within the aggregate.

Rejected alternatives:

- Rule-level exclusions were rejected because skips and detached provider cancellations need the same occurrence-level behavior as manual skips.
- Persisted modified occurrences as standalone event series were rejected because they lose the original occurrence identity and complicate edit/delete scope behavior.

# OccurrenceKey

`OccurrenceKey` identifies the original generated occurrence. It does not identify the replacement time of a moved occurrence.

Canonical V2 meaning:

- It is derived from the original generated candidate's local start date/time in the household recurrence context.
- It remains stable if a single occurrence is moved, renamed, or otherwise modified.
- It is used to match exceptions to generated candidates.
- It is used for deterministic occurrence identity and API operations that target one occurrence.
- It is used to map iCalendar `RECURRENCE-ID` and `EXDATE` values to HomeOps exceptions.

The simplest sufficient key for V2 is a single temporal original-start key, normalized in household-local recurrence terms. Implementation may encode it as a date for all-day/date-based recurrence and as local date/time where timed recurrence needs uniqueness. The key must be provider-neutral and must not depend on the replacement display date.

Why this was chosen:

- The occurrence-engine analysis froze deterministic occurrence identity and single-value original temporal identity as sufficient for V2.
- It matches iCalendar's `RECURRENCE-ID` concept: the detached instance refers to the original recurrence position, not necessarily the new start time.
- It avoids a persisted occurrence table solely for identity.

Rejected alternatives:

- Using replacement date/time as identity was rejected because moved occurrences would lose their relationship to the original generated candidate.
- Using provider instance ids as the core key was rejected because manual events and different providers need the same model.
- Adding sequence/index-based keys was deferred because the current supported recurrence shapes can be identified by original generated start.

# Occurrence Engine

The occurrence engine is provider-independent and generates transient read models.

## Pipeline

1. **Aggregate input**
   - Load `EventSeries` with optional `EventRecurrenceRule` and relevant `EventException` rows.
2. **Generation context**
   - Resolve the household timezone.
   - Resolve requested date/time window.
   - Resolve base event duration and local wall-clock start/end semantics.
3. **Candidate generation**
   - Generate original candidate occurrences according to the series and recurrence rule.
   - Apply `Interval`, frequency, weekday/month/year fields, `COUNT`, and `UNTIL` during candidate generation.
4. **Exception processing**
   - Match exceptions by `OccurrenceKey` after candidates are generated.
   - Skip candidates with skipped exceptions.
   - Overlay modified exception fields on matching candidates.
5. **Final occurrences**
   - Return ordered transient read models.
   - Use deterministic occurrence identity for generated candidates and exception-aware identity for modified occurrences.

## Frozen generation semantics

- Generation is windowed.
- Candidate generation happens before exception processing.
- `COUNT` counts generated candidates before exceptions.
- `UNTIL` is an inclusive household-local original-start date.
- Weekly recurrence supports multiple weekdays.
- Monthly recurrence supports day-of-month only.
- Invalid monthly dates are skipped, not clamped.
- Invalid yearly dates are skipped, not clamped.
- February 29 occurs only in leap years.
- Generated occurrences are transient read models.
- Occurrence identity is deterministic.

## Frequency behavior

### Daily

- Generate every `Interval` days from the series start date.
- Respect `COUNT`, `UNTIL`, and the requested window.

### Weekly

- Generate on one or more selected weekdays.
- The week containing the series start date is recurrence week zero.
- `Interval` applies to recurrence weeks, not to individual selected weekdays.
- A candidate is valid only if it is on a selected weekday and belongs to an included interval week.
- Selected weekdays before the series start within the first recurrence week must not create occurrences before the series start.

### Monthly

- Generate on a single positive day-of-month.
- `Interval` applies to months from the series start month.
- Months without that day are skipped.
- The engine must not clamp to the last day of month.

### Yearly

- Generate on a single month/day pair.
- `Interval` applies to years from the series start year.
- Invalid dates are skipped.
- February 29 generates only in leap years.

## Time handling

- Recurrence generation uses household-local wall-clock semantics.
- All-day events remain all-day events across recurrence.
- Timed events retain local start/end wall-clock times across recurrence.
- DST transitions must preserve intended local wall-clock time where possible.
- Per-event provider timezone information may be preserved as metadata, but it is not the recurrence generation source of truth in V2.

## Performance

- Generation must be bounded by the requested read window.
- Implementations should avoid iterating from distant historical starts when a safe jump to the first relevant interval is possible.
- Exception lookup should be indexed by `(EventSeriesId, OccurrenceKey)`.
- The engine must handle unbounded series by using request windows and practical generation limits rather than materializing all future occurrences.

Why this was chosen:

- The occurrence-engine analysis selected windowed generation because generated occurrences are read projections, not persisted business records.
- Candidate-before-exception processing gives clear `COUNT` semantics and aligns with iCalendar-style recurrence expansion.
- Skipping invalid dates avoids surprising moves and preserves the requested recurrence day.

Rejected alternatives:

- Counting after exceptions was rejected because skipped events would change the number of generated recurrence positions and produce unexpected later occurrences.
- Clamping invalid monthly/yearly dates was rejected because “31st monthly” should not silently become “30th” or “28th”.
- Per-provider generation was rejected to keep occurrence behavior consistent across sources.

# Manual Event UX

Manual recurrence is configured through a compact **Herhalen** section in the event dialog.

Supported frequency labels:

- `Niet herhalen`
- `Dagelijks`
- `Wekelijks`
- `Maandelijks`
- `Jaarlijks`

Fields:

- Frequency.
- Interval.
- Weekly weekday selection when frequency is weekly.
- Monthly day-of-month derived from or selected relative to the start date.
- Yearly month/day derived from the start date.
- End mode:
  - `Nooit`;
  - `Op datum`;
  - `Na aantal keer`.
- End date when `Op datum` is selected.
- Count when `Na aantal keer` is selected.

One-off actions:

- Skip one occurrence.
- Modify one occurrence.
- Restore a skipped occurrence where UI support is present.

Edit scope:

- `Alleen deze afspraak`
  - creates or updates a modified `EventException` for one occurrence.
- `Deze en volgende afspraken`
  - splits recurrence at the selected occurrence boundary.
  - The previous series ends before the selected original occurrence.
  - A new series begins at the selected occurrence with the edited template/rule.
- `Hele reeks`
  - updates the series template and/or recurrence rule.

Delete scope:

- Delete/skip one occurrence.
- Delete this and future occurrences by ending or splitting the series.
- Delete the whole series.

Why this was chosen:

- The manual-events analysis selected a compact Herhalen section as the best balance of discoverability and low cognitive load for family use.
- Scope selection prevents accidental edits to an entire recurring series.
- Treating skip as an explicit one-off action makes user intent clear.

Rejected alternatives:

- Always showing recurrence fields in the primary dialog was rejected because it adds cognitive load for common non-recurring events.
- Hiding recurrence in an advanced section was rejected because recurrence would be too hard to discover.
- Always editing the whole series was rejected because it is unsafe for family planning.
- Inferring skip only through delete was rejected because skip and deletion have different user intent and scope implications.

# Validation Rules

Validation must exist at API/domain boundaries and should be reflected in frontend form behavior.

## General

- Title remains required according to existing event rules.
- End must not be before start.
- Recurrence is optional.
- A non-recurring event must not carry recurrence-specific fields.
- Manual and imported supported recurrence must pass the same domain validation.

## Frequency

- Required when a recurrence rule exists.
- Allowed values: `Daily`, `Weekly`, `Monthly`, `Yearly`.
- Unsupported frequencies must be rejected for manual input.
- Unsupported provider frequencies must be preserved as unsupported metadata, not converted to a rule.

## Interval

- Required when a recurrence rule exists.
- Must be a positive integer.
- Defaults to `1` when omitted by supported iCalendar input.
- UI should keep interval simple and bounded to a practical range; exact upper bound may be implementation-defined but must be documented in API validation.

## Weekly days

- Required for weekly recurrence.
- Must contain at least one weekday.
- Must not contain duplicate weekdays.
- Must not be supplied for non-weekly recurrence.

## Monthly day

- Required for monthly recurrence.
- Must be a positive day-of-month in the supported range.
- Monthly recurrence supports day-of-month only.
- Months without the requested day are skipped.
- Monthly nth-weekday patterns are unsupported.

## Yearly month/day

- Required for yearly recurrence.
- Month must be valid.
- Day must be valid for at least one year/month combination in the supported Gregorian calendar model.
- February 29 is valid and occurs only in leap years.
- Invalid yearly dates are skipped, not clamped.

## End mode

- Required when a recurrence rule exists.
- Allowed values: `Never`, `OnDate`, `AfterCount`.
- `UntilDate` is required only for `OnDate`.
- `Count` is required only for `AfterCount`.
- `UntilDate` and `Count` must not both be set.

## End date

- Interpreted as inclusive household-local original-start date.
- Must not be before the first recurrence candidate's original-start date.
- Must be date-based, not provider timezone text.

## Count

- Must be a positive integer.
- Counts generated candidates before exception processing.
- Skipped exceptions do not increase or decrease the count.

## Exceptions

- An exception must reference an existing series.
- An exception must use a valid `OccurrenceKey` that corresponds to a generated candidate for supported recurrence.
- One active exception per `(EventSeriesId, OccurrenceKey)` is allowed.
- Skipped exceptions must not carry replacement fields unless implementation explicitly ignores them.
- Modified exceptions must carry at least one meaningful replacement field or replacement time change.

# iCalendar Mapping

HomeOps recurrence remains the source of truth. iCalendar remains an interchange format.

## RRULE to EventRecurrenceRule

Supported mappings:

- `FREQ=DAILY` -> `Frequency = Daily`.
- `FREQ=WEEKLY` -> `Frequency = Weekly`.
- `FREQ=MONTHLY` -> `Frequency = Monthly`.
- `FREQ=YEARLY` -> `Frequency = Yearly`.
- Missing `INTERVAL` -> `Interval = 1`.
- `INTERVAL=n` -> `Interval = n` when positive.
- `COUNT=n` -> `EndMode = AfterCount`, `Count = n`.
- `UNTIL=value` -> `EndMode = OnDate`, `UntilDate` as inclusive household-local original-start date.
- No `COUNT` or `UNTIL` -> `EndMode = Never`.
- Weekly plain `BYDAY` with weekdays only -> `WeeklyDays` for weekly recurrence.
- Monthly single positive `BYMONTHDAY` -> `MonthlyDayOfMonth` for monthly recurrence.
- Yearly single `BYMONTH` plus single positive `BYMONTHDAY` -> `YearlyMonth` and `YearlyDayOfMonth`.

Unsupported RRULE cases include:

- `COUNT` and `UNTIL` both present.
- Unsupported `FREQ` values.
- Negative month days.
- Multiple monthly days.
- Multiple yearly months.
- Ordinal weekdays.
- `BYSETPOS`.
- `BYYEARDAY`.
- `BYWEEKNO`.
- `BYSECOND`, `BYMINUTE`, or `BYHOUR` recurrence expansion.
- Any recurrence whose timezone semantics cannot be safely represented as household-local recurrence.

Unsupported recurrence policy:

- Preserve raw provider recurrence metadata.
- Record a warning/diagnostic classification.
- Do not create an `EventRecurrenceRule` for unsupported recurrence.
- Do not approximate unsupported recurrence as non-recurring or as a simpler supported rule.

## EXDATE to EventException

- Each supported `EXDATE` maps to a skipped `EventException`.
- The exception key is the original generated occurrence key.
- `EXDATE` values that cannot be matched safely to generated candidates must be preserved as provider metadata/diagnostics rather than invented exceptions.

## RECURRENCE-ID to EventException

- Detached VEVENTs with `RECURRENCE-ID` map to modified `EventException` rows when they refer to supported generated candidates.
- Detached cancellations map to skipped `EventException` rows.
- The `OccurrenceKey` is derived from the original `RECURRENCE-ID`, not from detached replacement `DTSTART`.
- Replacement fields are copied from the detached instance.
- Provider detached metadata belongs on the exception.

Why this was chosen:

- The iCalendar mapping analysis froze supported RRULE mapping into `EventRecurrenceRule`, `EXDATE` as skipped exceptions, and `RECURRENCE-ID` as modified exceptions.
- Preserving unsupported recurrence avoids false events and future data loss.

Rejected alternatives:

- Rejecting whole imports for unsupported recurrence was rejected because one unsupported event should not break a family calendar feed.
- Importing unsupported recurrence as non-recurring was rejected because it misrepresents future occurrences.
- Partially approximating unsupported recurrence was rejected because it creates phantom or missing appointments.

# Synchronization Mapping

Synchronization is provider-neutral. Providers normalize into the same series/rule/exception model.

## Compare levels

Synchronization compares three levels separately:

1. **Master series**
   - provider source id;
   - provider master event id;
   - provider revision/etag/sequence;
   - content fingerprint of master fields;
   - start/end/all-day fields;
   - source ownership and last-seen metadata.

2. **Recurrence rule**
   - supported normalized recurrence fields;
   - raw RRULE or canonical recurrence string;
   - unsupported recurrence classification;
   - recurrence metadata fingerprint if used;
   - EXDATE collection identity/fingerprint when represented on the master provider object.

3. **Exceptions**
   - `OccurrenceKey`;
   - raw or normalized provider recurrence id;
   - detached provider event id;
   - detached revision/etag/sequence;
   - detached content fingerprint;
   - exception type;
   - replacement fields.

## Creates

- Create a new imported `EventSeries` when a provider master id is new for a source.
- Create an owned `EventRecurrenceRule` when the provider recurrence is supported.
- Create skipped `EventException` rows for supported `EXDATE` values.
- Create modified/skipped `EventException` rows for supported detached instances.

## Updates

- Update `EventSeries` master fields when provider master data changes.
- Replace the owned recurrence value when supported recurrence changes.
- Update recurrence metadata when provider recurrence metadata changes.
- Update skipped exceptions when `EXDATE` changes.
- Update detached exceptions when detached provider instances change.

## Deletes/deactivates

- Provider master removed -> remove or deactivate the imported series and its owned recurrence/exceptions according to existing source synchronization policy.
- Provider RRULE removed -> remove the owned rule only if the provider now represents the event as non-recurring.
- Provider `EXDATE` removed -> remove the corresponding provider-owned skipped exception unless later local-edit policy says otherwise.
- Provider detached instance removed -> remove the corresponding provider-owned modified/skipped exception.

Manual exceptions on manual series are not touched by provider synchronization. Local edits to imported events and provider writeback are outside V2 unless a later design explicitly defines them.

# Export & Restore

There are two export/restore concerns:

1. HomeOps backup/restore.
2. iCalendar interchange.

## HomeOps backup/restore

Backup must preserve:

- `EventSeries` template fields.
- Optional supported `EventRecurrenceRule` values.
- `EventException` entities.
- `OccurrenceKey` values.
- Provider metadata at the correct domain level where imported recurrence state is included.
- Unsupported provider recurrence metadata without converting it into generated recurrence.

Restore must rebuild:

- the series aggregate;
- the owned recurrence value for supported recurrence;
- skipped and modified exceptions;
- provider metadata needed for later refresh/synchronization.

Restore must not:

- approximate unsupported recurrence;
- convert unsupported provider recurrence into manual generated recurrence;
- create stored generated occurrences;
- lose the distinction between series template, recurrence rule, and occurrence exception.

## iCalendar interchange export

When exporting HomeOps-owned supported recurrence to iCalendar:

- `Frequency` exports as `FREQ`.
- `Interval` exports as `INTERVAL` when not `1`; exporting `INTERVAL=1` is optional.
- `EndMode = AfterCount` exports as `COUNT`.
- `EndMode = OnDate` exports as `UNTIL` using a safe date/time representation for iCalendar consumers.
- Weekly days export as `BYDAY`.
- Monthly day-of-month exports as `BYMONTHDAY`.
- Yearly month/day exports as `BYMONTH` plus `BYMONTHDAY`.
- Skipped exceptions export as `EXDATE`.
- Modified exceptions export as detached VEVENTs with `RECURRENCE-ID` equal to the original occurrence key and replacement fields on the detached event.

Unsupported recurrence must not be exported as a generated HomeOps rule. Imported provider-owned recurrence should be exported only when HomeOps can represent it faithfully or when the export purpose is internal backup/restore metadata preservation.

# API Design

The API must expose recurrence and exception behavior without leaking provider-specific recurrence concepts into manual event workflows.

## Event series create/update

Manual create/update endpoints should accept:

- existing event template fields;
- optional recurrence rule input;
- recurrence end mode fields;
- weekly day fields when applicable.

Creating a recurring event creates one `EventSeries` with an owned `EventRecurrenceRule`. Creating a non-recurring event creates one `EventSeries` without a recurrence rule.

Updating the whole series updates the series template and owned recurrence rule.

## Occurrence operations

The API must support occurrence-targeted operations by `EventSeriesId` plus `OccurrenceKey` or by a deterministic occurrence identifier that can resolve to those values.

Required operation categories:

- Skip one occurrence.
- Modify one occurrence.
- Restore/remove one exception where supported.
- Delete one occurrence, implemented as a skip for recurring events.
- Edit whole series.
- Edit this-and-future by splitting or ending the prior series and creating/updating the future series.
- Delete this-and-future by ending the existing recurrence before the selected occurrence or splitting according to implementation policy.

## Read APIs

Read APIs should return transient occurrence DTOs over a requested or default window.

Each occurrence should include enough metadata for UI actions:

- display id/deterministic occurrence id;
- parent `EventSeriesId`;
- `OccurrenceKey`;
- start/end;
- all-day flag;
- title/description/location;
- source/editability metadata;
- recurrence metadata indicating whether it belongs to a recurring series;
- exception status where relevant.

## Provider APIs

Provider synchronization APIs should not expose provider-specific recurrence generation behavior. Provider input is normalized internally into the shared recurrence model.

# DTO Design

DTOs should mirror the domain concepts while remaining API-friendly.

## Recurrence rule DTO

Suggested fields:

- `frequency`;
- `interval`;
- `endMode`;
- `untilDate`;
- `count`;
- `weeklyDays`;
- `monthlyDayOfMonth`;
- `yearlyMonth`;
- `yearlyDayOfMonth`.

DTO rules:

- The recurrence object is absent/null for non-recurring events.
- Unsupported provider recurrence metadata is not part of the normal manual recurrence input DTO.
- Read DTOs may include a recurrence summary for display/edit forms.

## Exception DTO

Suggested fields:

- `eventSeriesId`;
- `occurrenceKey`;
- `exceptionType`;
- replacement title/description/location;
- replacement start/end;
- replacement all-day flag where supported.

Provider metadata should not be exposed in manual UI DTOs unless a later provider-admin/debug API requires it.

## Occurrence DTO

Suggested fields:

- `id` or deterministic occurrence id;
- `eventSeriesId`;
- `occurrenceKey`;
- `title`;
- `description`;
- `location`;
- `start`;
- `end`;
- `allDay`;
- `sourceId`;
- `providerEventId` when already exposed by existing contracts;
- `isRecurring`;
- `isException`;
- `isEditable`;
- optional recurrence summary.

## Export DTO

Export DTOs should include:

- recurrence rule fields as structured data, not only enum strings;
- exception records keyed by `OccurrenceKey`;
- provider metadata sections where needed for restore fidelity;
- unsupported recurrence metadata preserved separately from generated recurrence rule fields.

# Persistence Design

Persistence must preserve the domain semantics even if the physical schema is optimized.

## EventSeries table

Keep series-owned fields on the series record:

- event template fields;
- source ownership;
- provider master metadata;
- timestamps;
- unsupported recurrence status/classification when owned by master series state.

The existing enum recurrence field should be replaced or superseded by structured recurrence persistence.

## EventRecurrenceRule persistence

Because `EventRecurrenceRule` is an owned value object, acceptable persistence options are:

- owned columns on the `EventSeries` table; or
- an owned dependent table with the same lifecycle as the series.

Implementation should choose the option that best fits EF Core mapping and migration clarity, but it must not expose the recurrence rule as an independently addressable aggregate.

Persisted fields should cover the canonical rule fields:

- frequency;
- interval;
- end mode;
- until date;
- count;
- weekly days;
- monthly day;
- yearly month/day;
- recurrence-shape provider metadata where needed.

Weekly days may be stored as a normalized collection, bitmask, or owned serialized value, provided validation prevents duplicates and read/write behavior remains deterministic.

## EventException table

Persist exceptions as child entities:

- id;
- event series id;
- occurrence key;
- exception type;
- replacement fields;
- provider detached metadata;
- timestamps/source ownership fields where needed.

Required uniqueness/indexing:

- unique active `(EventSeriesId, OccurrenceKey)`.
- lookup index for `(EventSeriesId, OccurrenceKey)`.
- provider metadata indexes only if needed by synchronization.

## Generated occurrences

Do not persist generated occurrences. They are transient read models generated from series, rule, and exceptions.

Why this was chosen:

- It maintains one source of truth.
- It supports deterministic read models.
- It avoids large generated occurrence tables for unbounded recurrence.

# Testing Strategy

Testing must verify domain behavior, mapping behavior, API behavior, persistence behavior, synchronization behavior, and export/restore fidelity.

## Domain/unit tests

- Recurrence rule validation for every frequency.
- Interval validation.
- End mode validation.
- Weekly multiple weekday behavior.
- Monthly invalid date skip behavior.
- Yearly invalid date skip behavior.
- February 29 leap-year behavior.
- `COUNT` before exceptions.
- Inclusive `UNTIL` behavior.
- `OccurrenceKey` stability when occurrences are moved.
- Exception uniqueness by `(EventSeriesId, OccurrenceKey)`.

## Occurrence engine tests

- Non-recurring events.
- Daily recurrence with intervals and end modes.
- Weekly recurrence with one weekday and multiple weekdays.
- Weekly interval behavior.
- Monthly day-of-month recurrence across short months.
- Yearly recurrence including leap day.
- Windowed generation boundaries.
- DST/local wall-clock preservation.
- Skipped exceptions.
- Modified exceptions.
- Moved occurrences whose display date differs from original occurrence key.
- Large-window safeguards and old-series optimization behavior.

## iCalendar mapping tests

- Supported RRULE mapping for each frequency.
- Missing interval defaults to `1`.
- `COUNT` and `UNTIL` mapping.
- Weekly `BYDAY` mapping.
- Monthly `BYMONTHDAY` mapping.
- Yearly `BYMONTH`/`BYMONTHDAY` mapping.
- Unsupported RRULE diagnostics and metadata preservation.
- `EXDATE` to skipped exceptions.
- Detached `RECURRENCE-ID` to modified exceptions.
- Detached cancellations to skipped exceptions.
- Unsupported detached instances preserved without invented exceptions.

## API tests

- Create non-recurring event.
- Create recurring event for each supported frequency.
- Update whole series recurrence.
- Edit one occurrence.
- Skip one occurrence.
- Delete one occurrence as skip.
- Edit this-and-future.
- Delete this-and-future.
- Restore skipped occurrence where API supports it.
- Validation failures for invalid recurrence combinations.

## Persistence tests

- Recurrence rule persists and reloads as an owned value.
- Replacing a recurrence rule works without orphaned domain state.
- Removing recurrence makes the series non-recurring.
- Exceptions persist with stable `OccurrenceKey`.
- Uniqueness constraints prevent duplicate active exceptions.

## Synchronization tests

- Provider master creates/updates/deletes imported series.
- Supported RRULE creates/replaces owned recurrence rule.
- Unsupported RRULE preserves metadata and does not generate recurrence.
- `EXDATE` creates/removes skipped exceptions.
- Detached instances create/update/remove modified exceptions.
- Synchronization compares master, recurrence, and exception changes separately.
- Warning diagnostics do not block synchronization unless classified as errors by existing policy.

## Export/restore tests

- Supported manual recurrence round-trips through HomeOps backup/restore.
- Exceptions round-trip with `OccurrenceKey`.
- Unsupported provider recurrence remains preserved and unsupported after restore.
- Export does not approximate unsupported recurrence.
- iCalendar export emits faithful RRULE/EXDATE/detached VEVENT structures for supported recurrence.

# Unsupported Scope

Calendar Recurrence V2 does not support:

- arbitrary RRULE evaluation;
- `RDATE` additions;
- ordinal weekdays such as second Tuesday;
- monthly nth-weekday recurrence;
- negative `BYMONTHDAY` values;
- multiple monthly days;
- multiple yearly months;
- `BYSETPOS`;
- `BYYEARDAY`;
- `BYWEEKNO`;
- sub-day recurrence through `BYHOUR`, `BYMINUTE`, or `BYSECOND`;
- simultaneous `COUNT` and `UNTIL`;
- per-event timezone as generation source of truth;
- provider-specific occurrence generation;
- provider writeback for recurring event edits;
- storing generated occurrences;
- approximating unsupported recurrence;
- separate manual/imported recurrence domain models;
- recurrence models tied to widgets or UI presentation units.

Unsupported provider recurrence must be preserved as metadata and diagnostics, not discarded or converted into misleading recurrence.

# Implementation Roadmap

Implementation should proceed in small, reviewable slices without reopening architecture.

1. **Domain and persistence foundation**
   - Add `EventRecurrenceRule` as an owned value object.
   - Add/upgrade `OccurrenceKey` on exceptions.
   - Expand `EventException` fields as needed for V2.
   - Add persistence mappings and migrations.
   - Preserve existing non-recurring behavior during migration.

2. **Occurrence engine V2**
   - Implement windowed candidate generation for supported frequencies.
   - Implement interval, count, until, weekly days, monthly day, yearly day behavior.
   - Implement exception application by `OccurrenceKey`.
   - Preserve deterministic occurrence identity.

3. **Manual API and DTOs**
   - Add recurrence DTOs to create/update flows.
   - Add occurrence-targeted skip/modify/delete endpoints or command shapes.
   - Add validation and API tests.
   - Regenerate OpenAPI/NSwag clients as part of the implementation slice that changes contracts.

4. **Manual UI**
   - Add compact `Herhalen` section.
   - Add recurrence validation messages.
   - Add edit/delete scope flows.
   - Add one-off skip and modification flows.
   - Validate viewport behavior if a primary page layout changes.

5. **iCalendar import mapping**
   - Map supported RRULE to `EventRecurrenceRule`.
   - Map `EXDATE` to skipped exceptions.
   - Map detached `RECURRENCE-ID` VEVENTs to modified/skipped exceptions.
   - Preserve unsupported recurrence metadata and diagnostics.

6. **Synchronization V2**
   - Compare master, recurrence, and exception levels separately.
   - Update/create/delete imported recurrence and exceptions according to provider snapshots.
   - Keep generation provider-independent.

7. **Export/restore V2**
   - Extend export DTOs for structured recurrence and occurrence keys.
   - Round-trip supported recurrence and exceptions.
   - Preserve unsupported provider recurrence metadata without approximation.
   - Add restore validation for V2 recurrence fields.

8. **Full regression and compatibility validation**
   - Run backend unit/integration tests.
   - Run frontend tests after UI/API changes.
   - Validate export/restore compatibility.
   - Validate representative manual and imported recurrence scenarios.

# Open Questions

The architecture is frozen. The following are implementation-detail questions that must be answered during the relevant slice without changing the architectural decisions:

- Exact physical encoding of `WeeklyDays` in persistence.
- Exact upper bound for manual recurrence `Interval` and `Count` validation.
- Exact string format for serialized `OccurrenceKey` in APIs and export documents.
- Exact endpoint shape for occurrence commands versus nested series routes.
- Exact split mechanics for `Deze en volgende afspraken`, including whether historical modified exceptions are copied, ended, or left on the prior series.
- Exact internal representation of provider recurrence metadata and fingerprints.
- Exact iCalendar `UNTIL` export formatting that best preserves the HomeOps inclusive household-local date semantics.
- Exact frontend wording for validation errors beyond the frozen labels and scope names.

These questions are not permission to reopen the frozen model of `EventSeries`, `EventRecurrenceRule`, `EventException`, `OccurrenceKey`, provider-independent generation, or the shared manual/imported recurrence model.

# References

- `docs/reports/2026-07-05-calendar-recurrence-v2-baseline/calendar-recurrence-v2-baseline.md`
- `docs/reports/2026-07-05-calendar-recurrence-v2-domain-analysis/calendar-recurrence-v2-domain-analysis.md`
- `docs/reports/2026-07-05-calendar-recurrence-v2-domain-refinement/calendar-recurrence-v2-domain-refinement.md`
- `docs/reports/2026-07-06-calendar-recurrence-v2-occurrence-engine-analysis/calendar-recurrence-v2-occurrence-engine-analysis.md`
- `docs/reports/2026-07-06-calendar-recurrence-v2-manual-events-analysis/calendar-recurrence-v2-manual-events-analysis.md`
- `docs/reports/2026-07-06-calendar-recurrence-v2-ical-mapping-analysis/calendar-recurrence-v2-ical-mapping-analysis.md`
- `.github/copilot-instructions.md`
- `AGENTS.md`
