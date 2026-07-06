# Summary

`EventRecurrenceRule` should be modeled as an owned value object of `EventSeries`, not as a separate aggregate/entity with its own independent lifecycle.

The refined domain boundary is:

```text
EventSeries = event template and aggregate root
EventRecurrenceRule = optional owned rule describing when the template repeats
EventException = occurrence-level entity describing what differs for one generated occurrence
OccurrenceKey = value object identifying the original generated occurrence
```

This keeps recurrence cohesive without creating a second identity model. A recurrence rule belongs to exactly one series, is created/updated/deleted with that series, is not meaningful outside the series, and should not be queried as an independent business object. By contrast, `EventException` should remain an entity because each exception is a durable occurrence-level record with its own identity, synchronization metadata needs, edit history, and export/restore identity.

The simplest sufficient `OccurrenceKey` for Recurrence V2 is the original occurrence start in household-local terms:

- `OriginalStartDate`
- `OriginalStartTime` for timed events
- `IsAllDay` or equivalent discriminator for all-day/date-only occurrence identity
- optional raw provider recurrence id metadata for imported detached instances

The provider recurrence metadata should be split by domain level rather than placed in one catch-all location: master event identity on `EventSeries`, recurrence-rule shape/fingerprint/raw RRULE on `EventRecurrenceRule`, detached-instance identity on `EventException`, and source-level sync state on provider/source metadata.

# Value Object vs Entity

## Recommendation

`EventRecurrenceRule` should be an owned value object of `EventSeries`.

It should not have independent domain identity. Its identity is the owning `EventSeries`. In domain language, the question is not "which recurrence rule is this?" but "what recurrence rule does this series use?" Replacing a rule means changing the series recurrence pattern, not preserving an independently addressable object.

## Why a value object fits

A value object boundary is the best fit because:

- A rule has no standalone meaning without the series template's start date, time, duration, all-day flag, title, and source.
- A series should have either no recurrence rule or exactly one active recurrence rule.
- The rule should be deleted when the series is deleted.
- Occurrence generation needs the series template and the recurrence rule together; the rule alone cannot produce complete occurrences.
- Export/restore should treat the rule as part of the series snapshot, not as an independently restored record.
- Synchronization should compare and update the provider-owned rule under the provider-owned master series, not reconcile rule records independently.
- Future domain invariants are value-oriented: frequency, interval, end mode, weekly days, monthly day, and yearly date form one coherent rule value.

## Why a separate entity is not justified

A separate `EventRecurrenceRule` entity would be justified if rules were shared between multiple series, queried or edited independently, versioned independently, synchronized separately from the master series, or referenced by other aggregate roots. Current code and the Recurrence V2 direction do not require any of those behaviors.

A separate entity would add unnecessary identity and lifecycle questions:

- What is the rule's public/business identifier?
- Can a rule outlive a series?
- Can two series point at the same rule?
- What should happen when a rule changes: mutate the entity, replace it, or create a new version?
- Should exports preserve rule identifiers?

Those questions do not improve the Recurrence V2 model. They make persistence more visible than the domain requires.

## Persistence note

"Owned value object" is the domain decision. The later EF Core implementation can still choose the most practical storage shape, such as owned columns on `EventSeries`, an owned table, or another owned mapping. This report does not design the migration. The important boundary is that the rule is owned by the series and has no independent domain lifecycle.

# Recommended Domain Boundary

The refined domain model should be:

```text
EventSeries
  Id
  EventSourceId
  Base event fields
  Provider master identity fields
  Optional EventRecurrenceRule
  EventExceptions

EventRecurrenceRule
  Frequency
  Interval
  EndMode
  Count
  UntilDate
  WeeklyDays
  MonthlyDayOfMonth
  YearlyMonth
  YearlyDayOfMonth
  Provider raw/fingerprint metadata as needed

EventException
  Id
  EventSeriesId
  OccurrenceKey
  ExceptionType
  Replacement event fields
  Provider detached-instance metadata as needed

OccurrenceKey
  OriginalStartDate
  OriginalStartTime / all-day marker
  Optional provider recurrence id/raw value
```

Mental model:

- `EventSeries` is the template: what the event normally is.
- `EventRecurrenceRule` is when the template repeats.
- `EventException` is what differs for one generated occurrence.
- `OccurrenceKey` identifies which generated occurrence the exception applies to.

This adjusts the prior recommendation by settling the previously open persistence/domain question: `EventRecurrenceRule` should be owned by `EventSeries` as a value object, while `EventException` remains an entity.

# EventSeries Role

`EventSeries` should remain the aggregate root and template for an event. It owns the event's default content and timing and is the parent boundary for recurrence and exceptions.

Existing code supports this role:

- `EventSeries` already carries template fields: title, description, location, all-day flag, start date/time, and end date/time.
- It also carries source/provider master metadata and owns a collection of exceptions.
- EF currently maps `EventSeries` as its own table with a primary key and indexes by source/start date and provider event id.
- The occurrence generator builds occurrences from the series template first, then applies exceptions.

Refined responsibility:

- Keep base event fields on `EventSeries`.
- Keep master provider event identity on `EventSeries`.
- Replace direct recurrence scalar responsibility with an optional owned `EventRecurrenceRule`.
- Continue to own `EventException` records through the aggregate relationship.

`EventSeries` should not become the home for interval, count, until, weekly days, monthly day, yearly date, raw RRULE, EXDATE, or detached instance identity. Those concepts are either rule-level or exception-level.

# EventRecurrenceRule Role

`EventRecurrenceRule` should describe when the `EventSeries` template repeats.

Recommended rule responsibilities:

- Frequency: daily, weekly, monthly, yearly.
- Interval: positive integer, defaulting conceptually to 1.
- End mode: never, after count, or on date.
- Count for count-bounded recurrence.
- Until date for date-bounded recurrence.
- Weekly days for weekly recurrence.
- Monthly day-of-month for monthly recurrence in Recurrence V2.
- Yearly month/day for yearly recurrence in Recurrence V2.
- Provider/raw recurrence metadata needed to compare or trace imported recurrence.

The existing `RecurrenceType` enum is too small for this role. It expresses frequency only. The current generator therefore advances by fixed frequency steps and has no place for interval, count, until, weekly day sets, exclusions, or provider recurrence identity.

EF Core mapping benefits from an owned value object because all rule data is dependent on one parent series. Whether implemented as owned columns or an owned table later, the rule can be cascade-deleted with the series and loaded as part of the aggregate rather than managed through separate repositories or identity reconciliation.

Export/restore benefits because the recurrence rule can be serialized as a nested part of the exported series. The current export already serializes recurrence as part of each `CalendarExportEventSeries`, which aligns better with an owned value than a standalone entity.

Synchronization benefits because provider recurrence changes can be compared at the master-series level. A provider recurrence fingerprint/raw RRULE belongs to the rule, but the sync unit remains the imported master series.

Occurrence generation benefits because the engine can accept one aggregate: series template + owned rule + exceptions. The rule supplies the candidate occurrence schedule; exceptions modify or skip individual candidates.

# EventException Role

`EventException` should remain an entity.

Unlike recurrence rules, exceptions are durable occurrence-level records. They are not simply a replaceable value describing the series. They can represent skipped occurrences, modified occurrences, and imported detached instances. They need stable identity for persistence, export/restore, synchronization, and occurrence projection.

Existing code supports entity treatment:

- `EventException` already has its own `Id`.
- It is stored in a separate `EventExceptions` table.
- It has an `EventSeriesId` foreign key and cascade delete from the series.
- EF enforces uniqueness by series and occurrence date.
- The occurrence generator uses exceptions as separately loaded records keyed by occurrence date, then uses an exception id as the occurrence id for modified/skipped-instance projection behavior.
- Export/restore exports exceptions as a separate collection with ids.

The domain refinement is not to demote exceptions to value objects, but to improve their occurrence identity and provider metadata.

Recommended exception responsibilities:

- Identify the original occurrence using `OccurrenceKey`.
- Represent exception type explicitly, preferably as `Skipped` or `Modified` rather than only a boolean.
- Store replacement fields for modified occurrences.
- Store provider detached-instance identity and revision metadata when imported.
- Remain deleted with the parent series.

# OccurrenceKey

## Current limitation

The current `EventException.OccurrenceDate` is date-only. That is sufficient for the current simple generator because recurrence advances one date at a time and exceptions are keyed by date. It is not sufficient for Recurrence V2.

Date-only occurrence identity has these weaknesses:

- It cannot distinguish two generated occurrences on the same date if future rules or imports create that shape.
- It cannot distinguish all-day date identity from timed original-start identity.
- It does not model iCalendar detached instance semantics, where `RECURRENCE-ID` points to the original occurrence start, not merely a calendar date.
- It is fragile around timezone boundaries when provider recurrence ids are timestamp-based.
- It forces modified occurrences to be matched by displayed date rather than by original generated occurrence.

## Simplest sufficient key

The simplest sufficient Recurrence V2 `OccurrenceKey` is:

```text
OccurrenceKey
  OriginalStartDate: DateOnly
  OriginalStartTime: TimeOnly?       // null for all-day occurrences
  IsAllDay: bool                     // or equivalent date-only/timed discriminator
  ProviderRecurrenceId: string?      // optional raw provider identity for imported detached instances
```

This key should identify the original scheduled occurrence, not the modified replacement date/time. If an occurrence is moved from Tuesday to Thursday, the exception key remains Tuesday's original start; the replacement fields carry Thursday's new time.

## What not to add yet

Do not over-design `OccurrenceKey` for Recurrence V2. It does not need a generated GUID per candidate occurrence, a standalone occurrence table, full timezone rules per occurrence, or complete iCalendar recurrence-id modeling. If the product remains household-timezone based, household-local original start is enough for the HomeOps occurrence engine, with raw provider recurrence id preserved for imported matching.

# Provider Metadata Placement

Provider metadata should be placed at the same domain level as the provider concept it describes.

## `EventSeries`

Store provider metadata for the imported master event:

- provider event id / UID;
- provider instance id only if it identifies the master component;
- provider revision / sequence / last modified;
- content fingerprint;
- import timestamps and last-seen sync attempt.

This aligns with current `EventSeries` fields that already hold provider event id, instance id, revision, content fingerprint, and import timestamps.

## `EventRecurrenceRule`

Store provider metadata for recurrence shape:

- raw RRULE or normalized provider recurrence string;
- recurrence fingerprint;
- unsupported-rule marker or degradation reason if needed later.

This metadata belongs to the rule because it describes how the series repeats. It should not become the source of truth for occurrence generation unless the later occurrence-engine analysis explicitly chooses raw RRULE execution.

## `EventException`

Store provider metadata for detached instances:

- provider recurrence id / original instance id;
- provider detached instance id if exposed separately;
- provider revision/fingerprint for the detached instance;
- last imported / last seen data if needed for reconciliation.

Detached-instance metadata should not be forced onto the master `EventSeries`, because it describes one occurrence-level divergence.

## Provider-specific side metadata

Use provider/source-specific side metadata only for source-level synchronization state or provider details that do not belong to the event domain itself, such as feed ETag, Last-Modified headers, file content hash, OAuth state, or source refresh bookkeeping. Do not create a separate recurrence domain model solely for imported recurrence.

# Adjustments To Previous Domain Analysis

The previous domain analysis should be adjusted in these ways:

1. Freeze `EventRecurrenceRule` as an owned value object of `EventSeries`, not merely a "dedicated recurrence rule" whose value-object/entity status is deferred.
2. Keep `EventException` as an entity, even though it remains cascade-owned by the series at the aggregate lifecycle level.
3. Replace the long-term date-only exception key recommendation with an explicit `OccurrenceKey` value object based on original household-local start.
4. State that the occurrence key identifies the original generated occurrence, while replacement fields describe the modified occurrence.
5. Move provider detached-instance identity explicitly to `EventException`.
6. Move raw recurrence/fingerprint metadata to `EventRecurrenceRule`, while keeping provider master identity on `EventSeries`.
7. Clarify that EF Core can map the owned recurrence value flexibly later; this report freezes the domain ownership, not the physical migration design.
8. Keep the shared manual/import recurrence model, but avoid making raw RRULE the domain source of truth.
9. Keep unsupported iCalendar scope bounded; Recurrence V2 should not become a full iCalendar recurrence implementation.
10. State the mental model consistently as: series is the template, recurrence rule is when it repeats, exception is what differs for one occurrence.

# Frozen Domain Decisions

These decisions should be frozen before occurrence-engine analysis:

- `EventSeries` remains the aggregate root and event template.
- `EventRecurrenceRule` is an optional owned value object of `EventSeries`.
- Non-recurring series have no recurrence rule.
- Recurring series have exactly one active recurrence rule.
- Recurrence V2 supports a bounded HomeOps recurrence model rather than full iCalendar parity.
- Rule fields include frequency, interval, end mode, count, until date, weekly days, monthly day-of-month, and yearly month/day.
- `EventException` remains an entity under `EventSeries`.
- Exceptions represent skipped and modified occurrences.
- Exceptions are keyed by a richer `OccurrenceKey`, not only `OccurrenceDate`.
- `OccurrenceKey` identifies the original generated occurrence, not the modified replacement time.
- Provider master identity belongs on `EventSeries`.
- Provider recurrence shape metadata belongs on `EventRecurrenceRule`.
- Provider detached-instance identity belongs on `EventException`.
- Provider source sync metadata remains in provider/source-specific configuration or side metadata.
- Occurrence generation should consume `EventSeries` + owned `EventRecurrenceRule` + `EventException` records as one aggregate model.

# Risks

- Owned value object mapping can still become physically complex if the rule has collections such as weekly days. This is a persistence-design risk, not a reason to promote the rule to an independent entity.
- A too-small `OccurrenceKey` could still fail edge-case imported calendars with timezone-specific `RECURRENCE-ID` values. Preserving raw provider recurrence id mitigates this without over-designing HomeOps occurrence identity.
- Count-bounded recurrence semantics need careful later analysis when skipped exceptions exist. The domain decision here does not settle whether exclusions count toward `COUNT` expansion.
- Monthly day-of-month and leap-day yearly rules need explicit occurrence-engine policies.
- Provider synchronization may require side metadata for unsupported raw recurrence details. That should not become a separate recurrence domain model unless occurrence-engine analysis proves normalized recurrence cannot handle required imports.
- Treating recurrence as a value object means replacing the whole rule on meaningful pattern change. That is correct domain behavior, but implementation must avoid accidental loss of provider trace metadata during sync.

# Files Referenced

- `.github/copilot-instructions.md`
- `AGENTS.md`
- `docs/reports/2026-07-05-calendar-recurrence-v2-baseline/calendar-recurrence-v2-baseline.md`
- `docs/reports/2026-07-05-calendar-recurrence-v2-domain-analysis/calendar-recurrence-v2-domain-analysis.md`
- `src/HomeOps.Api/CalendarEvents/EventSeries.cs`
- `src/HomeOps.Api/CalendarEvents/EventException.cs`
- `src/HomeOps.Api/CalendarEvents/RecurrenceType.cs`
- `src/HomeOps.Api/CalendarEvents/EventOccurrenceGenerator.cs`
- `src/HomeOps.Api/Data/HomeOpsDbContext.cs`
- `src/HomeOps.Api/CalendarEvents/CalendarPortabilityService.cs`
