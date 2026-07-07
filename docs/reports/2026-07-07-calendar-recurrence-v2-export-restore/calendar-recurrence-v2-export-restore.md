# Summary

Implemented Calendar Recurrence V2 export and restore support in the existing Calendar Portability feature. Structured recurrence rules, occurrence keys, recurrence exceptions, and unsupported provider recurrence metadata now round-trip through backup/restore without exporting generated occurrences.

# Export Changes

Calendar export now includes structured recurrence fields on each exported `EventSeries`, including frequency, interval, end mode, end date/count, weekly days, monthly day, yearly month/day, raw provider RRULE, and unsupported recurrence metadata. Exported exceptions now include `OccurrenceKey`, exception type, replacement location/all-day state, replacement date/time fields, and provider detached-instance metadata.

# Restore Changes

Calendar restore now reconstructs owned `EventRecurrenceRule` values and `EventException` rows with their original `OccurrenceKey` identities. Legacy exports without structured recurrence fields continue to restore through the existing `RecurrenceType` compatibility path.

# Recurrence Support

Manual supported recurrence, imported supported recurrence metadata, skipped exceptions, modified exceptions, and unsupported provider recurrence metadata are preserved. Unsupported recurrence remains non-generating metadata and is not approximated.

# Compatibility

The existing export document/schema version remains accepted with optional Recurrence V2 fields for backward compatibility. Calendar source configuration restore behavior is preserved, while imported event rows included in a Recurrence V2 export can now restore their provider identity and recurrence metadata without restoring synchronization scheduler state.

# Validation

Restore validation now checks structured recurrence enum values, recurrence rule consistency, unsupported recurrence raw metadata, occurrence-key parseability, duplicate occurrence keys per series, exception references, event-series references, and existing source/configuration invariants.

# Tests

Added and updated Calendar Portability tests for Recurrence V2 rule export/restore, manual recurrence round-trip, imported unsupported recurrence preservation, modified exception metadata, occurrence-key preservation, duplicate occurrence-key rejection, invalid recurrence rejection, imported event restore, and legacy recurrence compatibility.

# Risks

- iCalendar interchange export remains out of scope for this slice.
- Provider synchronization state, scheduler state, and generated occurrences are intentionally not exported as runtime state.

# Modified Files

- `src/HomeOps.Api/CalendarEvents/CalendarExportDtos.cs`
- `src/HomeOps.Api/CalendarEvents/CalendarPortabilityService.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarPortabilityTests.cs`
- `docs/reports/2026-07-07-calendar-recurrence-v2-export-restore/calendar-recurrence-v2-export-restore.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
