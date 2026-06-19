# EventException Foundation

## Summary
Added the minimum EventException foundation for skipped and modified generated occurrences.

## Implemented
- Added persisted EventException records owned by EventSeries.
- Supported skipped occurrences through omission from generated Agenda output.
- Supported modified occurrences through per-occurrence title, description, date, and time overrides.
- Included EventException data in canonical JSON export/restore.

## Verified
- Added automated coverage for skipped and modified occurrence generation.

## Risks
- Series splitting UI, complex recurrence editing, detached hierarchies, and occurrence editing endpoints remain out of scope.

## Modified Files
- `src/HomeOps.Api/CalendarEvents/EventException.cs`
- `src/HomeOps.Api/CalendarEvents/EventOccurrenceGenerator.cs`
- `src/HomeOps.Api/Data/HomeOpsDbContext.cs`
- `src/HomeOps.Api/CalendarEvents/CalendarPortabilityService.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/EventOccurrenceProjectionTests.cs`

## Next Prompt Context
EventException is a backend/runtime foundation only. Future edit/delete occurrence UX can target these records without making EventOccurrence persistent.
