# Occurrence Generation Runtime

## Summary
Implemented runtime occurrence generation from EventSeries recurrence metadata and EventException records.

## Implemented
- Agenda API still returns normalized EventOccurrence output only.
- EventOccurrence remains projection-only and is not persisted.
- Occurrences generate from EventSeries, RecurrenceType, EventException, and household timezone.
- Timed recurring events use local wall-clock semantics under the household timezone.
- All-day and multi-day all-day recurring events preserve date-only duration semantics.

## Verified
- Added automated coverage for DST behavior, skipped exceptions, modified exceptions, all-day recurrence, and multi-day all-day recurrence.

## Risks
- The Agenda endpoint uses a bounded runtime expansion window and does not expose queryable date ranges yet.
- Nonexistent/ambiguous local times at DST transition instants are not given a user-facing resolution policy in this slice.

## Modified Files
- `src/HomeOps.Api/CalendarEvents/EventOccurrenceGenerator.cs`
- `src/HomeOps.Api/CalendarEvents/EventOccurrenceProjector.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeriesEndpoints.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/EventOccurrenceProjectionTests.cs`

## Next Prompt Context
Agenda remains occurrence-facing. Future work may add explicit occurrence range query parameters, but should not persist EventOccurrence rows.
