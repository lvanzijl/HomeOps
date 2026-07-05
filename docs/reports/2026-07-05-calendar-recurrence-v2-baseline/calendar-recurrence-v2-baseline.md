# Summary

HomeOps currently has a compact recurrence model on `EventSeries`: a single `RecurrenceType` enum value plus per-occurrence `EventException` rows. The supported recurrence shape is interval-1 daily, weekly, monthly, or yearly repetition from the series start date, with no persisted RRULE text, end condition, count, weekday list, month-day rule, exclusion dates, recurrence timezone, or separate recurrence rule table in active use.

Occurrences are generated at read time from persisted `EventSeries` records. Manual event create/update APIs do not accept recurrence fields and always create non-recurring series. Imported iCal events can carry a mapped `RecurrenceType` when their RRULE is representable by the current enum, and the synchronization engine stores that value on imported `EventSeries` rows. More complex RRULEs are retained only as parser output/fingerprint input and are downgraded to `RecurrenceType.None` with a warning diagnostic before synchronization.

Calendar export/restore serializes the per-series recurrence enum as `CalendarExportRecurrence` and serializes exceptions, but the top-level recurrence rules collection remains an empty contract-stability placeholder. Export excludes imported provider events and their exceptions by filtering out series with `ProviderEventId`, so imported recurrence state is not restored as event data; source configuration is restored and imported data is expected to be refreshed from providers.

# Current Domain Model

`EventSeries` owns the current recurrence field directly through `RecurrenceType RecurrenceType`, defaulting to `None`. It also owns event identity and event content fields: source id, title, description, location, all-day flag, start/end date and time, provider import metadata, and timestamps. `EventSeries.Exceptions` is a collection of `EventException` rows.

`RecurrenceType` is an enum with these values:

- `None`
- `Daily`
- `Weekly`
- `Monthly`
- `Yearly`

`EventException` is tied to one event series by `EventSeriesId` and one original recurrence date by `OccurrenceDate`. It stores `IsSkipped` plus optional replacement title, description, start date/time, and end date/time. It does not store replacement location, all-day override, provider exception identity, raw recurrence data, or exception-specific provider metadata.

The export DTO model has two recurrence surfaces:

- `CalendarExportEventSeries.Recurrence`, which stores the current per-series recurrence as `CalendarExportRecurrence(RuleType, Value)`.
- `CalendarExportPayload.Recurrence`, which stores `CalendarExportRecurrenceSection(Rules)` but is currently emitted with an empty rule collection.

# Current Occurrence Generation

`EventOccurrenceGenerator.Generate` expands one `EventSeries` across an inclusive date window. It computes the event duration in whole days from `EndDate.DayNumber - StartDate.DayNumber`, builds an exception lookup keyed by `OccurrenceDate`, and iterates from the series `StartDate` until the requested end date.

The recurrence step is fixed by enum value:

- daily adds 1 day;
- weekly adds 7 days;
- monthly adds 1 month;
- yearly adds 1 year;
- all other values stop generation by returning `DateOnly.MaxValue`.

For non-recurring events, generation emits at most one occurrence and then breaks. If a non-recurring series starts before the requested start date, generation breaks without emitting it.

When an occurrence falls inside the requested window, generation skips it if an exception exists and `IsSkipped` is true. Otherwise it converts the base series plus any exception override into an `EventOccurrence`.

The generated occurrence uses:

- exception `StartDate` if present; otherwise the generated occurrence date;
- exception `EndDate` if present; otherwise start date plus the original series whole-day duration;
- exception `Title` if non-blank; otherwise the series title;
- exception `Description` if present; otherwise the series description;
- all-day start/end times of `00:00`;
- timed exception start/end times if present; otherwise the series times.

Date/time values are converted to `DateTimeOffset` using `TimeZoneInfo.FindSystemTimeZoneById` and the supplied household timezone id. The conversion treats local wall-clock dates/times as `DateTimeKind.Unspecified` and applies the zone offset for that local instant.

Calendar read behavior uses this generator in `GET /api/events`. The endpoint loads enabled event series for the seeded household, includes event sources and exceptions, filters imported/read-only sources to healthy sources, generates occurrences from one year before current UTC date through 30 months after that start date, orders by occurrence start and title, and returns normalized event contracts.

`EventOccurrenceProjector.Project` is a helper that generates exactly one occurrence for a series start date using a hard-coded default timezone id of `Europe/Amsterdam`. The create/update projector converts incoming API `DateTimeOffset` values to UTC `DateOnly` and `TimeOnly` fields and always sets newly created series recurrence to `None`.

# Current Event Exceptions

Skipped and modified occurrences are represented by the same `EventException` entity.

- A skipped occurrence is represented by `IsSkipped = true` for the original `OccurrenceDate`.
- A modified occurrence is represented by `IsSkipped = false` with one or more optional replacement fields.

The generator keys exceptions only by `OccurrenceDate`, so the exception model assumes at most one exception per generated date for a given series. The exception id becomes the generated occurrence id when an exception is applied. If an exception is skipped, no occurrence is emitted.

There are no current public manual event API endpoints for creating, updating, or deleting event exceptions. Existing exception behavior is exercised through tests and through export/restore compatibility rather than through a dedicated occurrence-edit API.

# Current API Behavior

`EventSeriesDtos` expose manual create/update inputs with title, description, start UTC, optional end UTC, and all-day flag only. They do not expose recurrence, exceptions, location, source selection, provider identity, or occurrence edit fields.

`POST /api/events` validates title and date range, finds the first writable manual source for the seeded household, creates an `EventSeries` through `EventOccurrenceProjector.FromRequest`, and returns an `EventSeriesDto`. Because the projector sets `RecurrenceType.None`, manually created events are non-recurring through this API.

`PUT /api/events/{eventId}` validates title and date range, loads a writable event series for the seeded household, applies title/description/date/time/all-day changes, and returns an `EventSeriesDto`. It does not change recurrence, exceptions, provider metadata, location, or source ownership.

`DELETE /api/events/{eventId}` deletes a writable event series. The API addresses `EventSeries.Id`; it does not expose occurrence IDs as update/delete targets. Generated recurring occurrence ids therefore are read-contract identifiers, not currently accepted as recurring occurrence edit commands.

`GET /api/events/{eventId}` loads an `EventSeries` by id and returns `EventSeriesDto` projected from the first occurrence at the series start date. It does not include recurrence or exception details.

# Current Export Restore Behavior

`GET /api/calendar/export` returns a `CalendarExportDocument` for the seeded household. It exports event sources, manual/non-imported event series, an empty recurrence rule section, exceptions for manual/non-imported series, household timezone metadata, and document/calendar metadata dictionaries.

Event series export filters out imported provider events by requiring `ProviderEventId == null`. Exception export applies the same provider-event exclusion through the exception's event series. Each exported event series includes `new CalendarExportRecurrence(candidate.RecurrenceType.ToString(), string.Empty)`.

`POST /api/calendar/restore` validates the document, writes a pre-restore snapshot, updates the household timezone, removes existing series for the seeded household, removes non-system sources not included in the restore, upserts restored sources and provider configuration, adds restored series, then adds restored exceptions.

Restore parses each series recurrence with `Enum.TryParse<RecurrenceType>` and defaults to `None` if parsing fails after validation. Validation separately requires series recurrence values and top-level recurrence rules to be parseable as `RecurrenceType` names. Validation accepts exception types `Skipped` and `Modified` only.

Restored source behavior is source-oriented rather than imported-event-oriented. Restored non-manual sources get health reset to `NeverSynced`, and provider event rows are not restored because provider event series are excluded from export.

# Current iCal Recurrence Handling

`ICalendarParser` includes `RRULE` in the set of recognized VEVENT properties. During parsing, it reads the raw RRULE string into `RawRecurrenceRule` and maps the parsed recurrence rule to a HomeOps `RecurrenceType` when possible.

An RRULE maps to the current model only when:

- interval is exactly 1;
- there is no count;
- there is no until;
- `BYSECOND`, `BYMINUTE`, `BYHOUR`, `BYDAY`, `BYMONTHDAY`, `BYYEARDAY`, `BYWEEKNO`, `BYMONTH`, and `BYSETPOS` are all empty;
- frequency is daily, weekly, monthly, or yearly.

Supported frequencies map directly to `Daily`, `Weekly`, `Monthly`, or `Yearly`. If there is no RRULE, the parser returns `RecurrenceType.None`.

If an RRULE uses unsupported modifiers or unsupported frequency, the parser adds a warning diagnostic with code `UnsupportedRecurrence` and returns `RecurrenceType.None`. The raw RRULE remains on `NormalizedICalendarEvent.RawRecurrenceRule` and participates in the content fingerprint, but it is not stored on `EventSeries` during synchronization.

The parser does not normalize `EXDATE`, `RDATE`, `RECURRENCE-ID`, detached overridden VEVENT instances, timezone-specific recurrence rules, RRULE count/until end conditions, intervals other than 1, by-day weekly rules, or month-position rules into the current domain model.

# Current Synchronization Behavior

The refresh dispatcher supports iCal feed and iCal file sources. It imports provider events, converts successful import results into `CalendarProviderSnapshot` objects, maps each `NormalizedICalendarEvent` to `NormalizedProviderEvent`, and passes the snapshot to `CalendarSourceSynchronizationEngine`.

`NormalizedProviderEvent` carries the mapped `RecurrenceType` but not `RawRecurrenceRule`. The synchronization engine creates or updates source-owned imported `EventSeries` rows keyed by `ProviderEventId` within the source. It copies title, description, location, start/end date/time, all-day flag, mapped recurrence type, provider event id, provider revision, and content fingerprint into `EventSeries`.

Existing imported series with the same provider event id and unchanged content fingerprint are left unchanged except for `LastSeenSyncAttemptUtc`. Existing imported series missing from the new snapshot are deleted. Duplicate provider event ids within the same snapshot cause synchronization failure and no event creation.

If a successful snapshot contains parser diagnostics with severity `Error`, synchronization treats the snapshot as a failure. Warning diagnostics, including unsupported recurrence warnings, are counted but do not block synchronization.

The engine does not create or update `EventException` rows for imported recurrence exceptions. It does not store raw RRULE, recurrence end conditions, recurrence intervals, detached instances, or provider instance ids. It stores the mapped enum recurrence on the imported series when the parser/importer supplies one.

# Current Frontend Contract

The frontend agenda API contract consumes normalized events and event sources via the generated API client. `EventSeriesInput` contains title, optional description, start timestamp, optional end timestamp, and all-day flag. It does not include recurrence or exception fields.

Creating and updating agenda events sends `CreateEventSeriesRequest`/`UpdateEventSeriesRequest` with the same non-recurrence fields. The frontend maps `EventSeriesDto` responses back to editable normalized events and marks them editable. For event list reads, `NormalizedEvent` includes `providerEventId`, description, location, editability, and source id; recurrence metadata is not exposed to the agenda UI contract.

Calendar portability frontend code and generated API models know about export recurrence and exceptions because those fields are part of the export document. The user-facing portability summary counts event series only and does not summarize recurrence or exceptions.

# Test Coverage

Current recurrence-related coverage includes:

- `EventOccurrenceProjectionTests`: supported daily/weekly/monthly/yearly recurrence generation, local wall-clock behavior across DST, skipped exceptions, and modified exceptions.
- `ICalendarParserTests`: supported RRULE mapping, unsupported RRULE diagnostic behavior, raw recurrence rule preservation, and broader parser validity behavior.
- `ICalFeedImporterTests` and `ICalFileImporterTests`: importer behavior when iCal content contains unsupported recurrence diagnostics.
- `CalendarSourceSynchronizationEngineTests`: imported provider event creation/update/delete behavior, duplicate provider id rejection, warnings such as unsupported recurrence not blocking synchronization, and provider metadata handling.
- `CalendarPortabilityTests`: export includes an empty top-level recurrence rules section, export/restore supports per-series recurrence and exception compatibility, and imported provider events are excluded from restore/export event data.
- `ManualEventApiTests`: manual event CRUD and read filtering behavior; these tests cover the current non-recurring API shape rather than recurrence creation.
- Frontend agenda and portability tests cover event CRUD mapping, source filtering, and export/restore UI behavior, but not recurrence editing.

# Known Limitations

Explicit limitations in code:

- Manual create/update DTOs do not contain recurrence or exception fields.
- `EventOccurrenceProjector.FromRequest` sets new manual event recurrence to `None`.
- iCal RRULE support is limited to interval-1 daily/weekly/monthly/yearly rules with no count, until, or BY* modifiers; unsupported recurrence produces an `UnsupportedRecurrence` warning and maps to `None`.
- Synchronization snapshots carry `RecurrenceType` only and drop raw RRULE before persistence.
- Calendar export has a top-level recurrence rules section but currently emits it as empty.
- Calendar export excludes imported provider event series and exceptions by filtering `ProviderEventId == null`.
- Restore validates recurrence names against the `RecurrenceType` enum and exception types against `Skipped`/`Modified` only.
- Event exceptions do not include location, all-day override, provider exception identity, or raw provider recurrence exception fields.

Limitations implied by the model and current behavior:

- There is no shared rich recurrence rule object for manual and imported events beyond the enum stored on `EventSeries`.
- There is no recurrence interval beyond one unit.
- There is no recurrence end condition, occurrence count, or until date.
- There is no support for weekly BYDAY patterns, monthly nth-weekday patterns, multiple recurrence days, RDATE additions, EXDATE exclusions, or detached `RECURRENCE-ID` instances.
- There is no API contract for editing one occurrence, skipping one occurrence, or changing future occurrences in a series.
- Generated recurring occurrence ids are deterministic for unmodified recurring occurrences but are not persisted and are not accepted by current update/delete endpoints.
- Exception lookup by original occurrence date implies one exception per original date per series.
- Occurrence generation starts iterating at the series start date and advances until the requested end date, so very old unbounded recurring series imply longer read-time iteration.
- All recurrence expansion uses household timezone/local wall-clock projection at generation time; per-event timezone and recurrence-specific DST policies are not modeled.
- iCal imported recurrence exceptions are not represented as `EventException` rows by the synchronization engine.
- Raw RRULE is part of parser output and fingerprinting but not part of the persisted `EventSeries` model or export series recurrence value.

# Files Inspected

- `.github/copilot-instructions.md`
- `AGENTS.md`
- `docs/reports/2026-07-05-calendar-source-architecture-analysis/calendar-source-architecture-analysis.md`
- `docs/reports/2026-07-05-calendar-source-integration-analysis/calendar-source-integration-analysis.md`
- `src/HomeOps.Api/CalendarEvents/EventSeries.cs`
- `src/HomeOps.Api/CalendarEvents/RecurrenceType.cs`
- `src/HomeOps.Api/CalendarEvents/EventException.cs`
- `src/HomeOps.Api/CalendarEvents/EventOccurrence.cs`
- `src/HomeOps.Api/CalendarEvents/EventOccurrenceGenerator.cs`
- `src/HomeOps.Api/CalendarEvents/EventOccurrenceProjector.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeriesEndpoints.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeriesDtos.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeriesNormalizer.cs`
- `src/HomeOps.Api/CalendarEvents/CalendarExportDtos.cs`
- `src/HomeOps.Api/CalendarEvents/CalendarPortabilityService.cs`
- `src/HomeOps.Api/CalendarEvents/ICalendar/ICalendarParser.cs`
- `src/HomeOps.Api/CalendarEvents/ICalendar/NormalizedICalendarEvent.cs`
- `src/HomeOps.Api/CalendarEvents/ICalendar/ICalFeedImporter.cs`
- `src/HomeOps.Api/CalendarEvents/ICalendar/ICalFileImporter.cs`
- `src/HomeOps.Api/CalendarEvents/Synchronization/NormalizedProviderEvent.cs`
- `src/HomeOps.Api/CalendarEvents/Synchronization/CalendarProviderSnapshot.cs`
- `src/HomeOps.Api/CalendarEvents/Synchronization/CalendarSourceRefreshDispatcher.cs`
- `src/HomeOps.Api/CalendarEvents/Synchronization/CalendarSourceSynchronizationEngine.cs`
- `src/HomeOps.Client/src/agenda/calendarEventsApi.ts`
- `src/HomeOps.Client/src/calendarPortability.ts`
- `src/HomeOps.Client/src/api/homeOpsApiClient.ts`
- `src/HomeOps.Client/src/widgets/components/CalendarPortabilityWidget.tsx`
- `src/HomeOps.Client/src/widgets/components/CalendarPortabilityWidget.test.tsx`
- `src/HomeOps.Client/src/agenda/calendarEventsApi.test.ts`
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.test.tsx`
- `tests/HomeOps.Api.Tests/CalendarEvents/EventOccurrenceProjectionTests.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/ICalendarParserTests.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/ICalFeedImporterTests.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/ICalFileImporterTests.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarSourceSynchronizationEngineTests.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarPortabilityTests.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/ManualEventApiTests.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarSourceRefreshApiTests.cs`
