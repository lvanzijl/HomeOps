# Summary

Implemented Calendar Sources backup and restore integration in the existing calendar portability feature. Exports now preserve source metadata, lifecycle/settings, and provider configuration while excluding imported events and provider synchronization/cache metadata. Restore recreates source configuration and manual events only; external sources return as `NeverSynced` and wait for future explicit synchronization.

# Backup Changes

- Export includes source display metadata, enabled state, system flag, poll interval, and provider-safe configuration.
- Export includes manual `EventSeries` and manual `EventException` rows only.
- Export excludes imported `EventSeries`, imported exceptions, provider event identity, sync timestamps, last error details, provider source ids, and cached retrieval metadata.

# Restore Changes

- Restore recreates configured sources and provider configuration before restoring manual events.
- Imported events are not restored.
- Enabled external sources restore as `NeverSynced` with synchronization metadata cleared.
- Disabled external sources remain disabled and also restore as `NeverSynced`.
- The protected system manual source remains a writable system manual source and cannot be restored with a different identifier.
- Restore does not trigger synchronization, refresh, scheduling, or polling.

# Provider Configuration

Provider configuration is exported through the shared calendar source configuration shape:

- iCal Feed exports the feed URL only.
- iCal File exports storage-independent file reference metadata, original filename, content hash, and upload timestamp.

Provider secrets, tokens, provider source ids, ETags, Last-Modified values, last content hashes, and last-error diagnostics are not exported.

# Compatibility

The export format remains `homeops.calendar.export` with schema version `1` and payload version `1`. New source/configuration fields are optional so existing manual calendar backups remain restorable. Legacy manual source type casing is still normalized during restore.

# Validation

Restore validation now rejects:

- duplicate source ids;
- duplicate manual event ids;
- unsupported format/schema/payload versions;
- malformed/null backups;
- invalid source types;
- missing, mismatched, or duplicated provider configuration shapes;
- attempts to change the protected system manual source identity.

# Tests

Added portability integration coverage for:

- manual events exported;
- imported events excluded from export;
- provider configuration exported;
- provider secrets/cache metadata excluded;
- manual events restored;
- imported events absent after restore;
- source configuration restored;
- external sources restored as `NeverSynced`;
- disabled source state preserved;
- protected manual source validation;
- duplicate ids, invalid configuration, unsupported version, malformed backup validation;
- existing manual backup compatibility.

# Risks

- iCal File backup stores the provider configuration reference, not the file contents. This keeps the backup storage-provider independent as required, but a later upload/storage slice may need a separate file-content portability decision.
- Future providers will need provider-specific configuration DTOs before their configurations can be exported safely.

# Modified Files

- `src/HomeOps.Api/CalendarEvents/CalendarExportDtos.cs`
- `src/HomeOps.Api/CalendarEvents/CalendarPortabilityService.cs`
- `src/HomeOps.Contracts/openapi.json`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarPortabilityTests.cs`
- `docs/reports/2026-07-05-calendar-backup-restore/calendar-backup-restore.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
