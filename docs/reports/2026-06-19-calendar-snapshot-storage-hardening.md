# Calendar Snapshot Storage Hardening

## Summary
Hardened automatic pre-restore snapshot storage by making the snapshot directory configurable while preserving safe local defaults.

## Implemented
- Added configuration support for `CalendarPortability:PreRestoreSnapshotDirectory`.
- Preserved the default local `calendar-restore-snapshots` directory under the API base directory when no path is configured.
- Documented Docker/container behavior and writable path assumptions in architecture and current-state docs.
- Added backend coverage for configured and default snapshot paths.

## Verified
- Restore still writes a pre-restore canonical JSON snapshot before replacement.
- Restore still aborts without modifying EventSeries when snapshot creation fails.
- Configuring a writable mounted container path is supported through standard ASP.NET Core configuration.

## Risks
- Operators must ensure any configured container path is writable and backed by persistent storage if snapshots should survive container replacement.

## Modified Files
- `src/HomeOps.Api/CalendarEvents/CalendarPortabilityService.cs`
- `src/HomeOps.Api/Program.cs`
- `src/HomeOps.Api/appsettings.json`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarPortabilityTests.cs`
- `docs/architecture.md`
- `docs/state/current-state.md`

## Next Prompt Context
Do not add cloud, scheduled, or Google Drive backup storage unless explicitly scoped. Keep snapshots local-only.
