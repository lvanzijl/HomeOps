# Summary

Implemented the Calendar Source Management API slice for configured source CRUD. The slice adds list/detail/create/update/delete endpoints for persisted calendar sources, validates user-creatable source types and provider configuration shapes, enforces the system manual source invariant, updates OpenAPI, and intentionally does not synchronize sources.

# Implemented

- Added source management endpoints under `/api/event-sources`.
- Returned source lifecycle fields, health, enabled state, poll interval, sync metadata, provider identity, and provider-safe configuration.
- Allowed user creation and update for iCal Feed and iCal File sources only.
- Persisted iCal Feed and iCal File provider configuration records through the existing provider configuration model.
- Preserved existing manual event behavior while moving `/api/event-sources` to the source-management DTO contract.

# Endpoints

- `GET /api/event-sources` lists configured sources for the seeded household.
- `GET /api/event-sources/{sourceId}` returns one configured source or `404`.
- `POST /api/event-sources` creates a user-creatable iCal source and provider configuration.
- `PUT /api/event-sources/{sourceId}` updates display metadata, enabled state, poll interval, and provider configuration for managed iCal sources.
- `DELETE /api/event-sources/{sourceId}` deletes non-system sources and relies on existing source ownership for provider configuration and imported-event removal.

# Validation

- Create rejects all reserved source types: Manual, Birthdays, GoogleCalendar, CalDav, Exchange, SchoolHolidays, TvSeries, and Provider.
- Create/update validates source name, icon, poll interval, provider configuration presence, and provider configuration/source-type match.
- iCal Feed validation requires an absolute HTTP/HTTPS feed URL.
- iCal File validation requires file reference, original filename, and content hash.
- Validation failures use the repository's existing `Results.ValidationProblem(...)` conventions.

# Manual Source Invariant

- The protected system manual source cannot be deleted through the source-management API.
- The protected system manual source cannot be modified through the source-management API, preventing it from losing system identity, changing type through this route, or becoming non-writable.
- The invariant uses the explicit `IsSystemManualSource` domain representation from Slice 2 rather than relying on `SourceType == Manual` alone.

# OpenAPI

- Regenerated OpenAPI to include source-management CRUD operations and source-management DTO schemas.
- No refresh endpoints were added.
- The generated TypeScript client was not committed because this slice explicitly excludes frontend changes.

# Tests

- Added API tests for list, get, create iCal Feed, create iCal File, rejecting reserved source types, update, provider configuration update, delete, protected manual source delete/update rejection, validation failures, provider-safe serialization, and OpenAPI operation coverage.
- Ran the focused source-management API test filter and the full backend test suite.

# Risks

- Source creation stores sources as `NeverSynced` and does not trigger synchronization, so newly created sources remain configuration-only until a future synchronization slice.
- Source management currently supports the seeded household model used by existing endpoints; multi-household selection remains outside this slice.
- Generated TypeScript client artifacts are intentionally left unchanged to honor the no-frontend-change boundary; a later frontend/API integration slice should regenerate client artifacts when frontend consumption is in scope.

# Modified Files

- `src/HomeOps.Api/CalendarEvents/EventSourceManagementEndpoints.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeriesEndpoints.cs`
- `src/HomeOps.Api/Program.cs`
- `src/HomeOps.Contracts/openapi.json`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarSourceManagementApiTests.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/ManualEventApiTests.cs`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
