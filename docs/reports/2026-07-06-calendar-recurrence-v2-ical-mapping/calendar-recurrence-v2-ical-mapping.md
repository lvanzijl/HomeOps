# Summary

Implemented the Calendar Recurrence V2 iCalendar mapping slice for backend Calendar Sources. Supported provider RRULEs now map into `EventRecurrenceRule`; `EXDATE` and detached `RECURRENCE-ID` instances map into `EventException` rows through synchronization.

# RRULE Mapping

Supported `FREQ`, `INTERVAL`, `COUNT`, `UNTIL`, weekly `BYDAY`, monthly `BYMONTHDAY`, and yearly `BYMONTH` + `BYMONTHDAY` are normalized into `EventRecurrenceRule`. Raw provider RRULE metadata is preserved. Unsupported RRULE shapes are classified with diagnostics and retained as unsupported recurrence metadata without approximating them as supported recurrence.

# EXDATE Mapping

Supported `EXDATE` values are normalized to skipped `EventException` models keyed by the original generated occurrence `OccurrenceKey`. The recurrence rule remains unchanged.

# RECURRENCE-ID Mapping

Detached VEVENTs with `RECURRENCE-ID` are normalized to modified exceptions keyed by the original `RECURRENCE-ID`. Replacement title, description, location, all-day state, replacement start/end, raw recurrence id, normalized recurrence id, detached provider id/revision/fingerprint, and raw detached metadata are preserved where available. Cancelled detached instances become skipped exceptions.

# Synchronization Integration

Provider snapshots now carry normalized recurrence rules and exceptions. Synchronization creates, updates, and removes owned `EventRecurrenceRule` data separately from event-series template data, and it creates, updates, and removes provider-derived `EventException` rows as provider EXDATE/detached-instance state changes.

# Compatibility

Legacy `RecurrenceType` remains available for compatibility. Imported supported Recurrence V2 data writes structured recurrence rules while unsupported provider recurrence remains non-generating metadata. Manual recurrence APIs, occurrence operations, series split behavior, scheduler behavior, backup/restore, frontend, and provider writeback were not changed.

# Tests

Added and updated parser/importer/synchronization coverage for supported RRULE mapping, unsupported RRULE diagnostics, EXDATE skipped exceptions, detached modified and cancelled exceptions, recurrence rule synchronization, exception creation/removal, and existing importer diagnostic preservation.

# Risks

- iCalendar export and provider writeback remain out of scope.
- Unsupported recurrence metadata is preserved for synchronization fidelity, but HomeOps does not generate occurrences from unsupported recurrence.

# Modified Files

- `src/HomeOps.Api/CalendarEvents/ICalendar/ICalendarParser.cs`
- `src/HomeOps.Api/CalendarEvents/ICalendar/NormalizedICalendarEvent.cs`
- `src/HomeOps.Api/CalendarEvents/Synchronization/NormalizedProviderEvent.cs`
- `src/HomeOps.Api/CalendarEvents/Synchronization/CalendarSourceSynchronizationEngine.cs`
- `src/HomeOps.Api/CalendarEvents/EventOccurrenceGenerator.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/ICalendarParserTests.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/ICalFeedImporterTests.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/ICalFileImporterTests.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarSourceSynchronizationEngineTests.cs`
- `docs/reports/2026-07-06-calendar-recurrence-v2-ical-mapping/calendar-recurrence-v2-ical-mapping.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
