# Calendar Portability Hardening

## Summary
Strengthened HomeOps Calendar portability validation while keeping export logical and not database-shaped.

## Implemented
- Hardened schema and payload version checks for the canonical `homeops.calendar.export` V1 document.
- Added identifier validation for duplicate EventSource and EventSeries ids.
- Added local seeded household ownership validation for restore.
- Added source-reference ownership validation for EventSeries records.
- Added all-day/timed shape validation and stricter timezone validation.

## Verified
- Backend tests cover invalid source references, V1 reserved recurrence rejection, and existing export metadata.

## Risks
- Restore still targets the single seeded household only.
- Cross-platform timezone behavior depends on installed system timezone data.

## Modified Files
- `src/HomeOps.Api/CalendarEvents/CalendarExportDtos.cs`
- `src/HomeOps.Api/CalendarEvents/CalendarPortabilityService.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarPortabilityTests.cs`
- `docs/architecture.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-1.md`
- `docs/roadmap/phase-2.md`

## Next Prompt Context
HomeOps Calendar export remains logical V1 JSON. Restore rejects invalid schema, versions, identifiers, household ownership, source references, timezones, recurrence payloads, and exception payloads before changing calendar data.
