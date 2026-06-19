# Calendar JSON Export Foundation

## Summary
Implemented the first canonical HomeOps Calendar JSON export foundation.

## Implemented
- Added a versioned `homeops.calendar.export` document with schema metadata, exported timestamp, household timezone, calendar payload version, event sources, EventSeries records, and reserved future exception/recurrence shape.
- Export is logical calendar data, not database-shaped data.
- EventOccurrence is not included as canonical export data.
- Added `/api/calendar/export` for backend export access.

## Verified
- Added backend tests for EventSeries inclusion, schema/version metadata, household timezone inclusion, event source inclusion, and absence of canonical occurrence export fields.

## Risks
- The schema is V1 and intentionally rejects recurrence and EventException runtime data until those slices are designed.
- Google Drive upload and ICS remain out of scope.

## Modified Files
- `src/HomeOps.Api/CalendarEvents/CalendarExportDtos.cs`
- `src/HomeOps.Api/CalendarEvents/CalendarPortabilityService.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeriesEndpoints.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarPortabilityTests.cs`

## Next Prompt Context
HomeOps Calendar JSON export is canonical and versioned. EventSeries is exported as source-of-truth data. EventOccurrence remains projection-only and is not canonical export data. Recurrence, EventException runtime behavior, Google Drive, Google Calendar, and ICS remain out of scope.
