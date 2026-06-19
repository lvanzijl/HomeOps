# Calendar JSON Contract Hardening

## Summary
Froze the V1 canonical Calendar JSON export contract shape.

## Implemented
- Kept `homeops.calendar.export` schema version 1 and calendar payload version 1 as the stable V1 contract markers.
- Added reserved document and calendar metadata sections.
- Added a reserved calendar-level recurrence section.
- Kept the reserved exception section and per-series recurrence placeholder without implementing runtime recurrence or exceptions.
- Added contract stability tests for required reserved sections and rejected future recurrence payloads.

## Verified
- Backend tests verify the reserved V1 sections are emitted and unsupported recurrence content is rejected.

## Risks
- Future contract redesign should require a major schema or payload version change.
- Metadata keys and values are reserved but not semantically interpreted yet.

## Modified Files
- `src/HomeOps.Api/CalendarEvents/CalendarExportDtos.cs`
- `src/HomeOps.Api/CalendarEvents/CalendarPortabilityService.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarPortabilityTests.cs`
- `src/HomeOps.Contracts/openapi.json`
- `src/HomeOps.Client/src/api/homeOpsApiClient.ts`

## Next Prompt Context
The V1 JSON export contract is frozen. Recurrence, exceptions, and future metadata sections are reserved only; do not implement recurrence or exceptions without a dedicated future slice.
