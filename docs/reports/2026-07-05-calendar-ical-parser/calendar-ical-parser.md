# Summary

Implemented the shared iCalendar parser and normalizer slice. The parser accepts raw iCalendar content and returns provider-independent normalized event inputs plus structured diagnostics. It does not synchronize, fetch feeds, import files, write persistence rows, expose APIs, change DTO contracts, add background workers, or touch frontend UI.

# Parser Library

- Chosen library: `Ical.Net` `5.2.3`.
- Rationale: it is a mature .NET iCalendar library with RFC 5545 parsing support for VEVENT fields, all-day and timed values, UTC/floating/TZID date-time handling, and recurrence rule parsing.

# Supported RFC5545 Features

- VEVENT parsing from raw VCALENDAR content.
- Event fields normalized: `UID`, `SUMMARY`, `DESCRIPTION`, `LOCATION`, `DTSTART`, `DTEND`, `LAST-MODIFIED`, `CREATED`, `SEQUENCE`, `STATUS`, and `TRANSP`.
- Timed events.
- All-day events.
- UTC date-times.
- Floating date-times.
- TZID date-times when the time zone can be resolved by the runtime.
- Simple RRULE values that map directly to the current HomeOps recurrence model: daily, weekly, monthly, and yearly with default interval and without additional limiting or BY* clauses.

# Unsupported Features

- Unsupported recurrence shapes, including multiple rules, intervals other than 1, count/until limits, and BY* clauses, are reported as diagnostics instead of being silently converted.
- Unsupported time zones are reported as diagnostics and affected events are skipped to avoid creating misleading normalized data.
- Unsupported VEVENT properties are reported as warnings while the supported event content is still normalized.
- Event persistence, source synchronization, feed downloading, file importing, recurrence expansion, detached recurrence instance handling, APIs, and frontend behavior remain out of scope.

# Normalized Output

- `NormalizedICalendarEvent` includes provider identity via `ProviderEventId`.
- Provider revision is derived from `LAST-MODIFIED` and `SEQUENCE` when available, or from `SEQUENCE` alone when that is the only provider revision metadata available.
- A SHA-256 `ContentFingerprint` is generated from normalized event content for future change-detection use.
- Output includes title, description, location, start/end dates and times, all-day state, created/last-modified timestamps, sequence, status, transparency, mapped recurrence type, and raw recurrence rule text.

# Diagnostics

Structured diagnostics include severity, code, message, optional provider event id, and optional property name. Implemented diagnostic categories include:

- `MalformedCalendar`.
- `MissingUid`.
- `InvalidDTSTART`.
- `InvalidDTEND`.
- `InvalidDateRange`.
- `UnsupportedTimezone`.
- `UnsupportedRecurrence`.
- `UnsupportedProperty`.

# Tests

- Added parser tests covering single and multiple VEVENTs.
- Added date parsing coverage for timed, all-day, UTC, floating, and TZID values.
- Added metadata coverage for UID, summary, description, location, created, last-modified, sequence, status, transparency, provider revision, and content fingerprint.
- Added validation coverage for missing UID, invalid ranges, malformed calendars, unsupported time zones, and unsupported properties.
- Added recurrence coverage for supported daily recurrence and unsupported BYDAY recurrence diagnostics.
- Ran the focused parser test suite and backend test suite.

# Risks

- The parser preserves local wall-clock date/time values for provider-independent normalization; future synchronization/import slices must decide how household time zones are applied when persisted or projected.
- The current HomeOps recurrence model is intentionally simple, so many valid RFC 5545 recurrence rules are diagnostic-only until the product expands recurrence support.
- `Ical.Net` may auto-populate missing UID values, so the parser validates explicit UID presence from the raw content before accepting provider identity.

# Modified Files

- `src/HomeOps.Api/HomeOps.Api.csproj`
- `src/HomeOps.Api/CalendarEvents/ICalendar/ICalendarParseDiagnostic.cs`
- `src/HomeOps.Api/CalendarEvents/ICalendar/ICalendarParseResult.cs`
- `src/HomeOps.Api/CalendarEvents/ICalendar/NormalizedICalendarEvent.cs`
- `src/HomeOps.Api/CalendarEvents/ICalendar/ICalendarParser.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/ICalendarParserTests.cs`
- `docs/reports/2026-07-05-calendar-ical-parser/calendar-ical-parser.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
