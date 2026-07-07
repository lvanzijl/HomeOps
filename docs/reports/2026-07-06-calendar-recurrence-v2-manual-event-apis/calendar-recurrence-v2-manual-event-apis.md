# Summary

Implemented the Calendar Recurrence V2 manual event API slice. Manual create and whole-series update now accept the existing Recurrence V2 DTOs, validate them with the canonical domain validation, persist new recurring manual events through `EventRecurrenceRule`, and return recurrence information from read APIs.

# Implemented

- Wired `CreateEventSeriesRequest.RecurrenceRule` into manual event creation.
- Wired `UpdateEventSeriesRequest.RecurrenceRule` into whole-series updates.
- Added API-layer mapping from `RecurrenceRuleDto` to `EventRecurrenceRule`.
- Canonicalized weekly day input through `WeeklyDays.Serialize`.
- Applied `EventRecurrenceRuleValidation` before persistence.
- Kept newly created/updated recurring events on `EventRecurrenceRule` while leaving legacy `RecurrenceType` as `None` for new manual events.
- Added legacy read compatibility so old `RecurrenceType` rows without a V2 rule still return recurrence information.

# Create API

Manual event creation now supports:

- non-recurring events with no recurrence payload;
- daily recurrence;
- weekly recurrence with one or more canonical weekdays;
- monthly day-of-month recurrence;
- yearly month/day recurrence.

No `EventException` rows are created by this slice.

# Update API

Whole-series update now supports replacing the event template and recurrence rule together. This slice intentionally does not add occurrence edits, skipped occurrence APIs, modified occurrence APIs, restore occurrence APIs, or this-and-future series splitting.

# Validation

The manual event APIs now reject invalid recurrence rules before persistence:

- invalid recurrence frequency;
- invalid interval;
- invalid end mode;
- invalid count;
- invalid until date;
- invalid weekday values;
- invalid monthly day;
- invalid yearly month/day;
- invalid frequency-specific field combinations.

Existing title and end-after-start validation remains unchanged.

# Read APIs

- `GET /api/events/{eventId}` returns `RecurrenceRuleDto` for V2 recurring event series.
- Legacy enum-recurring series without `EventRecurrenceRule` return compatible recurrence DTOs derived from `RecurrenceType` and the series start date.
- `GET /api/events` continues returning generated transient occurrences and now exposes recurring occurrence metadata from the occurrence engine.
- Non-recurring events continue returning `null` recurrence rules.

# Compatibility

- Non-recurring event create/update behavior remains supported.
- Manual recurring events created by this slice use `EventRecurrenceRule`, not legacy `RecurrenceType`.
- Legacy `RecurrenceType` remains for migrated/imported data compatibility only.
- Existing recurrence generation, synchronization, backup/restore, iCalendar mapping, frontend code, screenshots, and binary artifact policy were not changed.

# Tests

Added API coverage for:

- non-recurring create;
- daily, weekly, monthly, and yearly recurring create;
- whole-series recurrence update;
- validation failures for invalid interval/count/until/weekday/monthly/yearly/combination cases;
- recurrence returned from read APIs;
- non-recurring compatibility;
- legacy recurrence read compatibility.

# Risks

- The API accepts recurrence DTOs before frontend integration; current frontend callers remain compatible because the recurrence payload is optional.
- Recurrence validation uses the existing API date convention based on `StartUtc.UtcDateTime`, matching current manual event persistence behavior.
- Occurrence operations and series splitting remain future slices, so manual recurrence edits in this slice are whole-series only.

# Modified Files

- `src/HomeOps.Api/CalendarEvents/EventSeriesEndpoints.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeriesNormalizer.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarRecurrenceV2ManualEventApiTests.cs`
- `docs/reports/2026-07-06-calendar-recurrence-v2-manual-event-apis/calendar-recurrence-v2-manual-event-apis.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
