# Calendar Restore Safety

## Summary
Hardened full restore safety for local-only Calendar portability.

## Implemented
- Documented restore as local-only, full restore only functionality.
- Removed the intermediate destructive save so validation and restore application do not save a partially cleared calendar.
- Added tests proving rejected exports leave existing EventSeries data unchanged.
- Documented automatic pre-restore export as a future safety requirement.

## Verified
- Backend restore rejection tests confirm invalid exports do not modify existing calendar data.

## Risks
- Automatic pre-restore export is not implemented yet.
- Restore UI confirmation is not implemented.

## Modified Files
- `src/HomeOps.Api/CalendarEvents/CalendarPortabilityService.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarPortabilityTests.cs`
- `docs/architecture.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

## Next Prompt Context
Restore is local-only and full restore only. Validation must remain before destructive actions. Future restore work should add automatic pre-restore export before replacement.
