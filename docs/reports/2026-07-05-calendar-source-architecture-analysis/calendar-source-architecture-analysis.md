# Summary

This report records the current backend calendar architecture as inspected on 2026-07-05. It describes only the implementation that exists today.

The backend calendar model is centered on persisted `EventSource`, `EventSeries`, and `EventException` entities. API event reads project persisted event series into normalized occurrences. Manual event creation, update, and deletion operate only against a writable persisted event source with `SourceType == "manual"`. Calendar export/restore serializes event sources, event series, recurrence placeholders, exceptions, household timezone metadata, and empty metadata dictionaries.

External-source-shaped code exists in the contracts and backend adapters for Google Calendar and Birthdays, but those adapters are not wired into the persisted calendar event endpoints in the inspected code.

# Calendar Domain

## Event source entity

Persisted calendar sources use `HomeOps.Api.CalendarEvents.EventSource` with these fields: `Id`, `HouseholdId`, `Household`, `Name`, `SourceType`, `IsWritable`, `CreatedUtc`, `UpdatedUtc`, and `EventSeries`.

The seeded source is named `HomeOps Calendar`, has `SourceType = "manual"`, and `IsWritable = true`.

## Event series entity

Persisted calendar events are represented as `EventSeries` records with: `Id`, `EventSourceId`, `EventSource`, `Title`, `Description`, `IsAllDay`, `StartDate`, `StartTime`, `EndDate`, `EndTime`, `RecurrenceType`, `Exceptions`, `CreatedUtc`, and `UpdatedUtc`.

`RecurrenceType` supports `None`, `Daily`, `Weekly`, `Monthly`, and `Yearly`.

## Event exception entity

Per-occurrence overrides are represented by `EventException` with: `Id`, `EventSeriesId`, `EventSeries`, `OccurrenceDate`, `IsSkipped`, optional replacement `Title`, `Description`, `StartDate`, `StartTime`, `EndDate`, `EndTime`, plus `CreatedUtc` and `UpdatedUtc`.

## Runtime occurrence model

Runtime projection uses `EventOccurrence` with `Id`, `EventSeriesId`, `EventSourceId`, `Title`, `Description`, `StartsAt`, `EndsAt`, `AllDay`, and `Editable`. Conversion to the shared `NormalizedEvent` contract serializes `Id` and `EventSourceId` as strings and maps description through to `Description`.

The shared `NormalizedEvent` contract also includes `ExternalEventId` and `Location`, but persisted `EventSeries` projection does not populate those two fields.

## Unique identifiers

Persisted event series are keyed by `EventSeries.Id`. Each event series belongs to an event source through `EventSeries.EventSourceId`.

Projected occurrence IDs are generated as follows:

- For non-recurring series, the occurrence ID is the `EventSeries.Id` unless an exception is used.
- For recurring series without an exception, the occurrence ID is deterministically derived from the series ID and occurrence date.
- For occurrences with an exception, the occurrence ID is the `EventException.Id`.

`EventException` rows are unique by `(EventSeriesId, OccurrenceDate)` in the EF model.

## Metadata already present on events

Persisted event series metadata consists of description, all-day flag, date/time range, recurrence type, source reference, created timestamp, and updated timestamp.

Persisted event exceptions contain skip/modify metadata through `IsSkipped` and optional replacement title, description, and date/time fields.

The normalized contract can carry source ID, editability, external event ID, description, and location. Persisted manual event projection carries source ID, editability, and description; external event ID and location are not populated from persisted manual events.

# Persistence

`HomeOpsDbContext` exposes `DbSet`s for `EventSources`, `EventSeries`, and `EventExceptions`.

The EF mapping stores:

- `EventSources` with required name, source type, writability, created/updated timestamps, a required household relationship, and a unique index on `(HouseholdId, SourceType)`.
- `EventSeries` with required title, optional description, date/time columns, all-day flag, string-converted recurrence type, created/updated timestamps, cascading relationship to `EventSource`, and an index on `(EventSourceId, StartDate)`.
- `EventExceptions` with required occurrence date and skip flag, optional replacement fields, timestamps, cascading relationship to `EventSeries`, and a unique index on `(EventSeriesId, OccurrenceDate)`.

Seed data creates one manual event source and four event series: `Dentist Appointment`, `Parent Evening`, `Vacation`, and `Put Bins Outside`.

# APIs

## Event sources

`GET /api/event-sources` returns persisted event sources for the seeded household ordered by source name and normalized through `EventSeriesNormalizer.ToContract`.

The normalizer currently maps persisted sources to contract sources with contract type `Manual`, `Enabled = true`, capability based on `IsWritable`, visibility group `Household`, and color `#4f46e5`.

## Calendar export/restore

`GET /api/calendar/export` returns `CalendarExportDocument` from `CalendarPortabilityService.ExportAsync`.

`POST /api/calendar/restore` passes a `CalendarExportDocument` to `CalendarPortabilityService.RestoreAsync` and returns `204 No Content` on success or validation errors on failure.

## Events

`GET /api/events/` reads the seeded household timezone, loads all event series for the seeded household including exceptions, orders by start date, start time, and title, generates occurrences from one year before current UTC date through 30 months after that start, orders occurrences by start and title, and returns normalized events.

`GET /api/events/{eventId}` fetches a single event series by ID within the seeded household and returns an `EventSeriesDto`, or `404` if not found.

`POST /api/events/` validates title and time range, finds the first writable manual source for the seeded household, projects the request into a new non-recurring `EventSeries`, saves it, and returns `201 Created` with an `EventSeriesDto`.

`PUT /api/events/{eventId}` validates title and time range, fetches the event series only if its source belongs to the seeded household and is writable, applies request fields to the series, saves it, and returns the updated `EventSeriesDto`.

`DELETE /api/events/{eventId}` fetches the event series only if its source belongs to the seeded household and is writable, removes the series, saves, and returns `204 No Content`.

# Services

`EventOccurrenceProjector` converts create/update DTO timestamps into persisted `DateOnly` and `TimeOnly` fields in UTC date/time terms. It sets created and updated timestamps during creation, updates `UpdatedUtc` during updates, and sets new event recurrence to `None`.

`EventOccurrenceGenerator` expands event series into occurrences across an inclusive date window. It advances recurring series by the recurrence type, skips exceptions with `IsSkipped`, applies exception replacement fields when present, and converts local date/time values to `DateTimeOffset` using the supplied household timezone.

`EventSeriesNormalizer` converts persisted sources and event series into contract DTOs. Single-series DTO projection uses a default timezone of `Europe/Amsterdam` through `EventOccurrenceProjector.Project`.

`CalendarPortabilityService` handles calendar export and restore. It also supports configuring the pre-restore snapshot directory from configuration.

No calendar-specific repository classes were found in the inspected backend files; endpoint handlers query `HomeOpsDbContext` directly.

# Settings

The calendar-related settings implementation found in backend scope is agenda layer settings.

`AgendaLayerSetting` stores `Id`, `DeviceKey`, `ViewType`, `SourceId`, `IsEnabled`, `CreatedUtc`, and `UpdatedUtc`.

`GET /api/agenda/layer-settings` requires `X-HomeOps-Device-Key`, normalizes it by trimming, reads rows for that device key, orders by view type and source ID, and returns an `AgendaLayerSettingsDto` grouped into `Week` and `Months` dictionaries.

`PUT /api/agenda/layer-settings` requires the same device key, deletes all existing rows for that device key, writes supplied `Week` and `Months` source-enabled dictionaries, skips blank source IDs, trims source IDs, and returns the saved grouped settings.

The EF model enforces a unique index on `(DeviceKey, ViewType, SourceId)`.

# Existing Bronnen Support

A reusable event-source contract exists in `HomeOps.Contracts.Events.EventSource`. It describes a normalized source with stable ID, name, source type, enabled flag, read-only/writable capability, visibility metadata, color metadata, and optional external source ID.

The contract source type enum includes `Manual`, `GoogleCalendar`, `Birthdays`, `TvSeries`, `SchoolHolidays`, and `External`.

The backend contains `IEventSourceAdapter`, which exposes `GetEventSource()` and `GetEvents()` for normalized event-producing adapters.

Google Calendar adapter code maps provider metadata and event payloads into contract event source and normalized events. Its source is read-only, can carry an external calendar ID, and maps external event ID, description, and location.

Birthday adapter code maps birthday provider data into a writable birthday source contract and generated annual normalized events. Its metadata reports source ID, person count, generation range, recurrence strategy, leap-year strategy, and future editing support.

No wiring from these adapters into the persisted `/api/events` query path was found in the inspected implementation. The persisted `GET /api/events/` path reads only `EventSeries` from `HomeOpsDbContext`.

# Backup & Restore

Export returns a `CalendarExportDocument` with format `homeops.calendar.export`, schema version `1`, exported UTC timestamp, household ID/timezone, calendar payload version `1`, event sources, event series, an empty recurrence rules section, exceptions, and empty metadata dictionaries.

Export includes event sources ordered by name, event series ordered by start date, start time, and title, and exceptions ordered by occurrence date.

Restore validates document presence, format, schema version, payload version, timezone validity, required collections, metadata sections, seeded household ID, unique event source IDs, unique event series IDs, required source and series fields, date/time consistency, supported recurrence rules, supported exception types, and exception references.

Before applying restore, the service exports the current calendar and writes a local pre-restore snapshot JSON file under the configured snapshot directory. Restore is cancelled with validation errors if snapshot creation fails for the handled filesystem/security exceptions.

Restore updates the seeded household timezone when the document timezone is non-blank and valid. It removes existing event series for the seeded household, removes existing event sources for the seeded household, then inserts document event sources, series, and exceptions. Restored exception timestamps are set to the restore time rather than taken from the export DTO, because the export exception DTO has no created/updated timestamp fields.

# Background Processing

No backend calendar background worker, hosted service, scheduler, or timer registration was found in the inspected implementation.

`Program.cs` registers weather services and API endpoints, configures the DbContext, runs migrations outside Testing/VisualReview environments, and maps endpoints. It does not register a calendar background service in the inspected code.

# Test Coverage

Backend calendar test files found:

- `tests/HomeOps.Api.Tests/CalendarEvents/ManualEventPersistenceTests.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/EventOccurrenceProjectionTests.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/ManualEventApiTests.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarPortabilityTests.cs`
- `tests/HomeOps.Api.Tests/AgendaLayerSettings/AgendaLayerSettingsApiTests.cs`
- `tests/HomeOps.Api.Tests/AgendaLayerSettings/AgendaLayerSettingsPersistenceTests.cs`
- `tests/HomeOps.Api.Tests/EventSources/BirthdaySourceAdapterTests.cs`
- `tests/HomeOps.Api.Tests/EventSources/GoogleCalendarAdapterTests.cs`
- `tests/HomeOps.Api.Tests/Events/EventFrameworkModelTests.cs`

The test names indicate coverage for manual event persistence, occurrence projection, manual event APIs, portability/export/restore, agenda layer settings API and persistence, birthday source adapter, Google Calendar adapter, and event framework model contracts. This report did not execute tests, per task instruction.

# Unknowns (items that could not be determined from the current code)

- A calendar-specific repository abstraction was not found in the current implementation.
- A persisted hidden/disabled flag on `EventSeries` or persisted `CalendarEvents.EventSource` was not found in the current implementation.
- Adapter wiring that merges Google Calendar or Birthday adapter events into `/api/events/` was not found in the current implementation.
- Calendar-specific background processing infrastructure was not found in the current implementation.
- iCal file or iCal feed support was not found in the current implementation.

# Files Inspected

- `.github/copilot-instructions.md`
- `AGENTS.md`
- `src/HomeOps.Api/AgendaLayerSettings/AgendaLayerSetting.cs`
- `src/HomeOps.Api/AgendaLayerSettings/AgendaLayerSettingsDtos.cs`
- `src/HomeOps.Api/AgendaLayerSettings/AgendaLayerSettingsEndpoints.cs`
- `src/HomeOps.Api/CalendarEvents/CalendarExportDtos.cs`
- `src/HomeOps.Api/CalendarEvents/CalendarPortabilityService.cs`
- `src/HomeOps.Api/CalendarEvents/EventException.cs`
- `src/HomeOps.Api/CalendarEvents/EventOccurrence.cs`
- `src/HomeOps.Api/CalendarEvents/EventOccurrenceGenerator.cs`
- `src/HomeOps.Api/CalendarEvents/EventOccurrenceProjector.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeries.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeriesDtos.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeriesEndpoints.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeriesNormalizer.cs`
- `src/HomeOps.Api/CalendarEvents/EventSource.cs`
- `src/HomeOps.Api/CalendarEvents/RecurrenceType.cs`
- `src/HomeOps.Api/CalendarEvents/SeedCalendarEvents.cs`
- `src/HomeOps.Api/Data/HomeOpsDbContext.cs`
- `src/HomeOps.Api/EventSources/Birthdays/BirthdayPerson.cs`
- `src/HomeOps.Api/EventSources/Birthdays/BirthdaySourceAdapter.cs`
- `src/HomeOps.Api/EventSources/Birthdays/BirthdaySourceConfiguration.cs`
- `src/HomeOps.Api/EventSources/Birthdays/BirthdaySourceMetadata.cs`
- `src/HomeOps.Api/EventSources/Birthdays/FakeBirthdaySourceProvider.cs`
- `src/HomeOps.Api/EventSources/Birthdays/IBirthdaySourceProvider.cs`
- `src/HomeOps.Api/EventSources/GoogleCalendar/FakeGoogleCalendarEventProvider.cs`
- `src/HomeOps.Api/EventSources/GoogleCalendar/GoogleCalendarAdapter.cs`
- `src/HomeOps.Api/EventSources/GoogleCalendar/GoogleCalendarEventPayload.cs`
- `src/HomeOps.Api/EventSources/GoogleCalendar/GoogleCalendarSourceConfiguration.cs`
- `src/HomeOps.Api/EventSources/GoogleCalendar/GoogleCalendarSourceMetadata.cs`
- `src/HomeOps.Api/EventSources/GoogleCalendar/IGoogleCalendarEventProvider.cs`
- `src/HomeOps.Api/EventSources/IEventSourceAdapter.cs`
- `src/HomeOps.Api/Program.cs`
- `src/HomeOps.Contracts/Events/EventSource.cs`
- `src/HomeOps.Contracts/Events/EventSourceCapability.cs`
- `src/HomeOps.Contracts/Events/EventSourceColor.cs`
- `src/HomeOps.Contracts/Events/EventSourceType.cs`
- `src/HomeOps.Contracts/Events/EventSourceVisibility.cs`
- `src/HomeOps.Contracts/Events/NormalizedEvent.cs`
- `tests/HomeOps.Api.Tests/AgendaLayerSettings/AgendaLayerSettingsApiTests.cs`
- `tests/HomeOps.Api.Tests/AgendaLayerSettings/AgendaLayerSettingsPersistenceTests.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarPortabilityTests.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/EventOccurrenceProjectionTests.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/ManualEventApiTests.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/ManualEventPersistenceTests.cs`
- `tests/HomeOps.Api.Tests/EventSources/BirthdaySourceAdapterTests.cs`
- `tests/HomeOps.Api.Tests/EventSources/GoogleCalendarAdapterTests.cs`
- `tests/HomeOps.Api.Tests/Events/EventFrameworkModelTests.cs`
