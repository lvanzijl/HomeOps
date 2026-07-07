# Summary

Implemented the Calendar Recurrence V2 occurrence engine. Generation now uses `EventRecurrenceRule` when present, falls back to legacy `RecurrenceType` only for compatibility, produces transient `EventOccurrence` read models, identifies recurring occurrences by `OccurrenceKey`, and applies exceptions by original occurrence identity rather than displayed replacement date.

# Implemented

- Replaced legacy enum-only stepping with a provider-independent recurrence engine.
- Added V2 generation for daily, weekly, monthly, and yearly recurrence.
- Added interval, `Never`, `OnDate`, and `AfterCount` support.
- Added weekly multi-day generation in canonical weekday order.
- Added monthly day-of-month generation that skips invalid months rather than clamping.
- Added yearly month/day generation with leap-year behavior.
- Added deterministic recurring occurrence ids based on `(EventSeriesId, OccurrenceKey)`.
- Preserved non-recurring normalized event id compatibility by keeping the series id for non-recurring occurrences.
- Added occurrence metadata to transient read models for recurrence status, exception status, and occurrence key.

# Generation Pipeline

The engine pipeline is:

1. Load `EventSeries` with optional `EventRecurrenceRule` and exceptions.
2. Select `EventRecurrenceRule` when present, otherwise build a compatibility rule from legacy `RecurrenceType`.
3. Generate original candidate `OccurrenceKey` values.
4. Apply `COUNT` / `UNTIL` to generated candidates before exception filtering.
5. Match exceptions by `OccurrenceKey`.
6. Suppress skipped exceptions.
7. Overlay modified exception replacement fields.
8. Filter final transient occurrences to the requested window.

# Supported Recurrence

- Non-recurring events continue to generate one occurrence when their event interval overlaps the window.
- Daily recurrence supports positive intervals and end modes.
- Weekly recurrence supports one or more weekdays, canonical ordering, and interval weeks from the week containing the series start.
- Monthly recurrence supports day-of-month only and skips months where the requested day does not exist.
- Yearly recurrence supports one month/day pair and skips invalid dates such as February 29 in non-leap years.

# Exception Processing

- Exceptions are keyed by `OccurrenceKey`.
- Skipped exceptions suppress the generated occurrence.
- Modified exceptions preserve original identity while overlaying replacement title, description, location, all-day state, and replacement start/end fields.
- Moved occurrences remain tied to the original `OccurrenceKey`; matching does not use the replacement display date.
- Legacy `OccurrenceDate` / `IsSkipped` exception fields are normalized in memory for compatibility.

# Windowing

- Generation starts near the requested window for unbounded daily, weekly, monthly, and yearly rules instead of always iterating from series start.
- `AfterCount` rules generate from series start so `COUNT` semantics remain candidate-based before exception processing.
- Window filtering is applied after exception overlay, so moved occurrences can appear in the replacement display window.
- Multi-day events are included when the event interval overlaps the requested window.

# Compatibility

- Existing non-recurring event behavior is preserved.
- Existing manual event create/update behavior is unchanged.
- Existing imported event synchronization is unchanged.
- Legacy `RecurrenceType` is still supported as an in-memory compatibility source when no V2 rule exists.
- Generated occurrences remain transient and no persistence schema was changed.
- No APIs, DTO contracts, frontend files, iCalendar mapping, synchronization behavior, backup/restore behavior, screenshots, or binary artifacts were added or changed in this slice.

# Tests

Added and ran occurrence-engine tests covering:

- non-recurring event windows;
- daily interval/count/until;
- weekly multi-day ordering and interval behavior;
- monthly invalid-date skipping;
- yearly leap-day behavior;
- skipped and modified exceptions;
- moved occurrence identity;
- deterministic ids;
- old-series windowing;
- multi-day overlap;
- spring and autumn DST offset transitions.

# Risks

- The engine preserves household-local wall-clock recurrence using `TimeZoneInfo` offsets. Invalid local instants are advanced to the next valid minute; this is intentionally conservative for rare recurrence times inside DST gaps.
- Legacy `RecurrenceType` fallback remains until later slices migrate import/manual creation paths to populate `EventRecurrenceRule` directly.
- Recurrence summaries emitted from transient occurrences currently indicate recurrence status only; richer summary fields can be filled by later API/UI slices without changing occurrence generation.

# Modified Files

- `src/HomeOps.Api/CalendarEvents/EventOccurrence.cs`
- `src/HomeOps.Api/CalendarEvents/EventOccurrenceGenerator.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarRecurrenceV2OccurrenceEngineTests.cs`
- `docs/reports/2026-07-06-calendar-recurrence-v2-occurrence-engine/calendar-recurrence-v2-occurrence-engine.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
