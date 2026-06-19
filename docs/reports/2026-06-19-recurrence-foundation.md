# Recurrence Foundation

## Summary
Added the V1 recurrence foundation for HomeOps Calendar EventSeries while keeping EventOccurrence projection-only.

## Implemented
- Added `RecurrenceType` with only `None`, `Daily`, `Weekly`, `Monthly`, and `Yearly`.
- Added persisted recurrence type metadata on EventSeries with `None` as the safe migration/default behavior.
- Preserved one-time EventSeries behavior through non-recurring occurrence generation.
- Included supported recurrence metadata in canonical JSON export/restore.

## Verified
- Added automated recurrence coverage for daily, weekly, monthly, and yearly generation.

## Risks
- Advanced recurrence rules, RRULE parsing, ICS compatibility, end conditions, and recurrence editing UI remain out of scope.

## Modified Files
- `src/HomeOps.Api/CalendarEvents/RecurrenceType.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeries.cs`
- `src/HomeOps.Api/CalendarEvents/EventOccurrenceGenerator.cs`
- `src/HomeOps.Api/CalendarEvents/CalendarPortabilityService.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/EventOccurrenceProjectionTests.cs`

## Next Prompt Context
HomeOps Calendar now has a narrow recurrence foundation. Future slices should add UI and richer editing only if explicitly scoped, and must keep EventSeries as source-of-truth and EventOccurrence projection-only.
