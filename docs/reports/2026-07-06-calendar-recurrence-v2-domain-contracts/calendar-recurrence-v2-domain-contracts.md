# Summary

Implemented the Calendar Recurrence V2 Domain Model & Contracts foundation. This slice finalizes canonical domain vocabulary, adds specification-aligned recurrence validation, canonicalizes weekly day storage/serialization, finalizes `OccurrenceKey` parsing/formatting/comparison behavior, and introduces shared Recurrence V2 contract DTOs without activating runtime recurrence behavior or adding recurrence APIs.

# Implemented

- Renamed the temporary Slice 1 recurrence support enum to the canonical `UnsupportedRecurrenceStatus` terminology.
- Added `EventRecurrenceRuleValidation` for frequency-aware validation of supported Recurrence V2 rule shapes.
- Added `WeeklyDays` canonical parsing/serialization helpers.
- Expanded `OccurrenceKey` with deterministic parse/try-parse/serialization/comparison behavior.
- Added shared contract DTOs for recurrence rules, recurrence summaries, and event exceptions.
- Added optional recurrence/occurrence contract fields to existing event DTOs for forward-compatible later slices.
- Regenerated backend OpenAPI only; the frontend TypeScript client was intentionally not regenerated.

# Domain Validation

Validation covers the frozen Recurrence V2 rule fields:

- `Frequency` must be `Daily`, `Weekly`, `Monthly`, or `Yearly`.
- `Interval` must be positive.
- `EndMode` must be `Never`, `OnDate`, or `AfterCount`.
- `Never` rejects `UntilDate` and `Count`.
- `OnDate` requires `UntilDate`, rejects `Count`, and can validate against the first candidate date.
- `AfterCount` requires a positive `Count` and rejects `UntilDate`.
- Daily recurrence rejects weekly/monthly/yearly-specific fields.
- Weekly recurrence requires canonical weekly days and rejects monthly/yearly-specific fields.
- Monthly recurrence requires one positive day of month in the supported range and rejects weekly/yearly-specific fields.
- Yearly recurrence requires a valid month/day pair, including February 29 as valid.

# WeeklyDays Canonicalization

`WeeklyDays` now has one deterministic representation:

- comma-separated English weekday names;
- canonical order: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday;
- duplicate weekday values rejected;
- unsupported weekday tokens rejected;
- parsing always returns canonical order;
- serialization always emits canonical order.

# OccurrenceKey

`OccurrenceKey` now provides domain behavior independent of EF persistence details:

- date-only serialization: `yyyy-MM-dd`;
- timed serialization: `yyyy-MM-ddTHH:mm:ss`;
- deterministic parsing and try-parse;
- value equality through the record struct;
- chronological comparison by original date and then original time.

# Contract Changes

- Added `RecurrenceRuleDto` for structured recurrence rule contracts.
- Added `EventExceptionDto` for future occurrence exception contract use.
- Added `RecurrenceSummaryDto` for occurrence-level recurrence summaries.
- Extended `NormalizedEvent` with optional occurrence key, recurrence/exception flags, and recurrence summary fields.
- Extended `EventSeriesDto`, `CreateEventSeriesRequest`, and `UpdateEventSeriesRequest` with optional recurrence contract fields for later slices.
- Regenerated `src/HomeOps.Contracts/openapi.json` only.

# Compatibility

- Existing non-recurring event behavior remains valid.
- Existing create/update APIs continue to accept requests without recurrence fields.
- Existing event responses remain backward-compatible because new recurrence fields are optional/defaulted.
- Existing runtime occurrence generation still uses legacy behavior; no Recurrence V2 engine or recurrence generation behavior was introduced.
- No frontend files, screenshots, binary files, synchronization logic, iCalendar mapping, backup/restore, or recurrence APIs were changed.

# Tests

- Added domain tests for recurrence frequency-specific validation, interval validation, end-mode validation, monthly validation, yearly validation, and leap-day validation.
- Added weekly day tests for canonical ordering, parsing, serialization, duplicate rejection, and invalid value rejection.
- Added occurrence key tests for equality, serialization, parsing, deterministic formatting, and comparison.
- Added DTO serialization/deserialization tests, including backward-compatible normalized event deserialization.

# Risks

- Contract DTOs are now present before the API implementation slice consumes recurrence input behavior; endpoint logic intentionally ignores recurrence request fields until the later API slice.
- `WeeklyDays` uses English `DayOfWeek` names to match canonical domain enum names and storage; frontend localization remains a later UI concern.
- OpenAPI was regenerated without the frontend client by invoking NSwag's OpenAPI generator directly rather than running the full `nswag.json` pipeline.

# Modified Files

- `src/HomeOps.Api/CalendarEvents/EventRecurrenceRule.cs`
- `src/HomeOps.Api/CalendarEvents/EventRecurrenceRuleValidation.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeriesDtos.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeriesNormalizer.cs`
- `src/HomeOps.Api/CalendarEvents/OccurrenceKey.cs`
- `src/HomeOps.Api/CalendarEvents/WeeklyDays.cs`
- `src/HomeOps.Api/Data/HomeOpsDbContext.cs`
- `src/HomeOps.Contracts/Events/NormalizedEvent.cs`
- `src/HomeOps.Contracts/Events/RecurrenceContracts.cs`
- `src/HomeOps.Contracts/openapi.json`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarRecurrenceV2DomainTests.cs`
- `docs/reports/2026-07-06-calendar-recurrence-v2-domain-contracts/calendar-recurrence-v2-domain-contracts.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
