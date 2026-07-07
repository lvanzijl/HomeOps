# Summary

Implemented the Calendar Recurrence V2 occurrence operations slice for backend manual recurring events. Operations target a single generated occurrence by `EventSeriesId` plus canonical `OccurrenceKey`, persist skipped/modified state as `EventException` rows, and keep generated occurrences transient.

# Implemented

- Added occurrence-level skip, restore, modify, and delete-as-skip endpoints under the existing events API.
- Added request contracts for occurrence targeting and modification payloads.
- Added generated-occurrence validation so operations only apply to occurrences produced by the series recurrence rule or legacy compatibility recurrence.
- Regenerated backend OpenAPI for the new backend contract surface.

# Occurrence Targeting

Operations target the original generated occurrence with `OccurrenceKey`; replacement date/time is never used as the operation key. Targets are validated against the loaded writable recurring series before any exception row is created, updated, or removed.

# Skip Operation

Skip creates or updates one `EventException` with `ExceptionType = Skipped`, `IsSkipped = true`, and the original `OccurrenceKey`. Repeated skips update the existing exception instead of creating duplicates.

# Restore Operation

Restore removes the existing skipped or modified exception for the target occurrence. Restoring an occurrence without an exception is treated as safe and leaves the series unchanged.

# Modify Operation

Modify creates or updates one `EventException` with `ExceptionType = Modified`, preserves the original `OccurrenceKey`, and supports replacement title, description, location, all-day state, start date/time, and end date/time. The event series template and recurrence rule are not changed.

# Delete Occurrence

Deleting one occurrence is implemented as skip. It does not delete the `EventSeries`, does not alter the recurrence rule, and does not affect other generated occurrences.

# Read Behavior

The existing occurrence generator exception overlay now reflects API-created exceptions: skipped occurrences are suppressed, modified occurrences overlay replacement fields, and moved occurrences appear in the replacement window with deterministic identity based on the original occurrence key.

# Validation

Validation covers parseable occurrence keys, recurring series only, writable sources only, generated occurrence membership, non-blank replacement titles when provided, replacement end not before replacement start, required replacement start when replacement end is supplied, and at least one replacement field for modify.

# Tests

Added API/integration coverage for skip, restore, modify, delete-as-skip, duplicate skip idempotency, read suppression, moved occurrence read behavior, deterministic occurrence identity, non-recurring rejection, read-only imported source rejection, invalid occurrence keys, non-generated keys, invalid replacement ranges, invalid titles, and empty modify payloads.

# Risks

- Occurrence operations intentionally support whole-single-occurrence exceptions only; no "Deze en volgende", future edits, or series splitting is included.
- Read-only imported source operations follow existing writable-event API conventions and return not found rather than exposing protected source details.

# Modified Files

- `src/HomeOps.Api/CalendarEvents/EventOccurrenceGenerator.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeriesDtos.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeriesEndpoints.cs`
- `src/HomeOps.Contracts/openapi.json`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarRecurrenceV2OccurrenceOperationApiTests.cs`
- `docs/reports/2026-07-06-calendar-recurrence-v2-occurrence-operations/calendar-recurrence-v2-occurrence-operations.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
