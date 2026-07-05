# Summary

Implemented the Calendar Sources refresh API and importer orchestration slice. Refresh now follows the required pipeline: load `EventSource`, select the configured provider importer, convert importer output into a provider-independent `CalendarProviderSnapshot`, invoke the existing synchronization engine, and return a structured synchronization result.

# Provider Dispatcher

Added a provider-aware refresh dispatcher for the orchestration boundary. It supports only `ICalFeed` and `ICalFile`, selects exactly one importer for the source type, and returns a structured unsupported-provider result for all other source types. The synchronization engine remains provider-independent and receives only `CalendarProviderSnapshot` input.

# Refresh Source

Added `POST /api/event-sources/{sourceId}/refresh`.

Behavior:

- Loads the requested household source.
- Returns `404` when the source is missing.
- Returns a structured `400` result for unsupported source types.
- Dispatches supported sources to exactly one importer.
- Invokes synchronization once with the mapped snapshot.
- Returns created, updated, deleted, unchanged, warning, duration, health, timestamp, and failure information.

# Refresh All

Added `POST /api/event-sources/refresh-all`.

Behavior:

- Enumerates enabled supported sources only.
- Skips manual, disabled, and unsupported/future-provider sources.
- Executes each supported source independently.
- Continues after failures and returns one result per attempted source.

# Importer Orchestration

Importer result mapping follows the technical design:

- Successful iCal Feed/File import maps to `CalendarProviderSnapshot.Successful`.
- iCal Feed `304 Not Modified` maps to `CalendarProviderSnapshot.NotModified` and performs no create/update/delete work.
- Failed retrieval maps to `CalendarProviderSnapshot.Failed`, so synchronization records failure metadata and deletes nothing.
- Parser warnings remain diagnostics on a successful snapshot.
- Parser errors flow to the synchronization engine failure path and delete nothing.

# API Contracts

Expanded `SyncSourceResultDto` with success state, unchanged count, warning count, duration, failed timestamp, and sanitized failure information. The result exposes synchronization counts and source health/timestamps only; it does not expose provider configuration, credentials, tokens, or raw parser internals.

OpenAPI was regenerated for the backend contract. The generated frontend TypeScript client was intentionally reverted because frontend regeneration belongs to a later frontend slice.

# Tests

Added integration coverage for:

- iCal Feed refresh success;
- iCal File refresh success;
- unsupported provider refresh rejection;
- failed retrieval non-deletion;
- parser failure non-deletion;
- Not Modified no-op behavior;
- Refresh All mixed success/failure behavior;
- disabled, manual, and unsupported source skipping;
- importer selection and non-selected importer isolation;
- OpenAPI refresh operation coverage.

# Risks

- The default filesystem iCal file content store is a backend implementation detail for orchestration wiring; upload APIs remain out of scope.
- Refresh All is sequential and source-independent for the MVP. No scheduler, automatic polling, retry policy, or background worker was added.

# Modified Files

- `src/HomeOps.Api/CalendarEvents/EventSourceManagementEndpoints.cs`
- `src/HomeOps.Api/CalendarEvents/ICalendar/IICalFeedImporter.cs`
- `src/HomeOps.Api/CalendarEvents/ICalendar/IICalFileImporter.cs`
- `src/HomeOps.Api/CalendarEvents/ICalendar/ICalFeedImporter.cs`
- `src/HomeOps.Api/CalendarEvents/ICalendar/ICalFileImporter.cs`
- `src/HomeOps.Api/CalendarEvents/ICalendar/FileSystemICalFileContentStore.cs`
- `src/HomeOps.Api/CalendarEvents/Synchronization/CalendarSourceRefreshDispatcher.cs`
- `src/HomeOps.Api/Program.cs`
- `src/HomeOps.Contracts/Events/EventSourceManagementContracts.cs`
- `src/HomeOps.Contracts/openapi.json`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarSourceRefreshApiTests.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarSourceManagementApiTests.cs`
- `docs/reports/2026-07-05-calendar-refresh-apis/calendar-refresh-apis.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
