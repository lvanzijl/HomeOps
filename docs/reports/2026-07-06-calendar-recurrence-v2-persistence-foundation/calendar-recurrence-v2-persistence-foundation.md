# Summary

Implemented the Calendar Recurrence V2 persistence foundation only. The slice adds structured recurrence storage on `EventSeries`, introduces `OccurrenceKey` persistence for `EventException`, expands exception replacement/provider metadata, and creates an EF Core migration that preserves existing manual/imported event rows while backfilling legacy recurrence and exception data.

# Implemented

- Added `EventRecurrenceRule` as an optional owned value object on `EventSeries`.
- Added canonical Recurrence V2 enums for frequency, end mode, and unsupported recurrence status.
- Added `OccurrenceKey` as the original-generated-occurrence identity value object.
- Expanded `EventException` with Recurrence V2 exception type, replacement fields, replacement location/all-day state, and provider detached-instance metadata.
- Preserved legacy `RecurrenceType`, `OccurrenceDate`, and `IsSkipped` fields for compatibility with existing runtime behavior.

# Persistence Changes

- `EventSeries` now owns optional recurrence columns for frequency, interval, end mode, until date, count, weekly days, monthly day, yearly month/day, raw provider RRULE, and unsupported recurrence metadata.
- `EventException` remains an entity under `EventSeries` with cascade delete.
- `OccurrenceKey` is persisted as a stable original-start key string and is unique per `EventSeries`.
- Existing generated occurrence behavior is unchanged; no generated occurrence table was added.

# Migration

- Added `AddCalendarRecurrenceV2PersistenceFoundation` migration.
- Existing legacy recurring series are backfilled into structured recurrence columns where possible:
  - daily, weekly, monthly, and yearly map to matching Recurrence V2 frequencies;
  - interval defaults to `1`;
  - end mode defaults to `Never`;
  - weekly days/monthly day/yearly month-day derive from the existing series start date.
- Existing exceptions are backfilled from `OccurrenceDate` to `OccurrenceKey`.
- Existing skipped exceptions are backfilled to `ExceptionType = Skipped`; all other existing exceptions become `Modified`.
- Existing manual and imported event metadata columns are preserved.

# Compatibility

- Legacy runtime recurrence behavior remains in place through `RecurrenceType`.
- Legacy exception behavior remains in place through `OccurrenceDate` and `IsSkipped`.
- No API contracts, DTOs, frontend files, recurrence engine behavior, iCalendar mapping behavior, synchronization behavior, backup/restore behavior, or generated OpenAPI/client files were changed.

# Tests

- Added focused SQLite persistence tests for:
  - non-recurring series without a recurrence rule;
  - recurring series with owned rule persistence across daily, weekly multi-day, monthly day-of-month, yearly month/day, interval, and end-mode fields;
  - occurrence key persistence;
  - skipped exception persistence;
  - modified exception replacement/provider metadata persistence;
  - replacement location persistence;
  - `(EventSeriesId, OccurrenceKey)` uniqueness;
  - cascade delete of exceptions from `EventSeries`.
- Ran focused recurrence persistence tests.
- Ran solution build.

# Risks

- Migration backfill uses PostgreSQL SQL expressions because the production database target is PostgreSQL. SQLite tests validate the EF model shape with `EnsureCreated`, not provider-specific migration SQL execution.
- `WeeklyDays` is persisted as a normalized string for this foundation slice. Later API/domain validation slices must enforce canonical values and duplicate prevention at input boundaries.
- Runtime recurrence generation still uses legacy behavior by design; this slice intentionally does not activate Recurrence V2 generation.

# Modified Files

- `src/HomeOps.Api/CalendarEvents/EventRecurrenceRule.cs`
- `src/HomeOps.Api/CalendarEvents/OccurrenceKey.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeries.cs`
- `src/HomeOps.Api/CalendarEvents/EventException.cs`
- `src/HomeOps.Api/Data/HomeOpsDbContext.cs`
- `src/HomeOps.Api/Migrations/20260706125153_AddCalendarRecurrenceV2PersistenceFoundation.cs`
- `src/HomeOps.Api/Migrations/20260706125153_AddCalendarRecurrenceV2PersistenceFoundation.Designer.cs`
- `src/HomeOps.Api/Migrations/HomeOpsDbContextModelSnapshot.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarRecurrenceV2PersistenceTests.cs`
- `docs/reports/2026-07-06-calendar-recurrence-v2-persistence-foundation/calendar-recurrence-v2-persistence-foundation.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
