# Calendar Pre-Restore Export

## Summary
Added automatic local pre-restore calendar export snapshots before full restore replacement.

## Implemented
- Restore validates the import document first.
- Every valid restore writes a local canonical JSON export snapshot before replacing calendar data.
- Restore aborts if the pre-restore snapshot cannot be created.
- Snapshot storage remains local-only and does not upload to cloud storage.

## Verified
- Added backend tests for snapshot creation before replacement and restore abort on snapshot creation failure.

## Risks
- Snapshot files are written to the API host filesystem and require that runtime path to be writable.

## Modified Files
- `src/HomeOps.Api/CalendarEvents/CalendarPortabilityService.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarPortabilityTests.cs`

## Next Prompt Context
Calendar restore now performs validation, creates a local canonical JSON safety export, and only then replaces local calendar data.
