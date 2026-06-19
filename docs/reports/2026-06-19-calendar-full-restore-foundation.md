# Calendar Full Restore Foundation

## Summary
Implemented the first full calendar restore foundation for canonical HomeOps Calendar JSON exports.

## Implemented
- Added restore validation before applying changes.
- Restore rejects unsupported format/schema/calendar payload versions, invalid timezone identifiers, invalid source/series references, recurrence payloads, and EventException payloads.
- Restore replaces existing calendar source and EventSeries domain contents for the seeded household.
- Restore preserves valid supplied event source and EventSeries identifiers.
- Restore updates household timezone when the export contains a valid timezone.
- Added `/api/calendar/restore` for backend full restore access.

## Verified
- Added backend tests for invalid version rejection, replacement behavior, preserved/restored EventSeries, Agenda output equivalence after restore, and Agenda availability after rejected restore.

## Risks
- There is no pre-restore backup file or UI confirmation yet.
- Restore is full restore only; selective import, merge import, and conflict resolution remain intentionally out of scope.
- Restore currently targets the single seeded household boundary only.

## Modified Files
- `src/HomeOps.Api/CalendarEvents/CalendarPortabilityService.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeriesEndpoints.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarPortabilityTests.cs`

## Next Prompt Context
Full restore replaces HomeOps Calendar domain contents after validation. It preserves safe identifiers, restores required source metadata and EventSeries, restores valid household timezone metadata, and rejects invalid exports. No selective import, merge import, conflict resolution, authentication, recurrence runtime behavior, or EventException runtime behavior has been added.
