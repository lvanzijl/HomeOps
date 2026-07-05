# Summary

Implemented the provider-independent Calendar Sources synchronization engine. The engine consumes provider-neutral normalized snapshots and applies them to persisted imported `EventSeries` for a single `EventSource`. It updates source synchronization metadata and health, but does not fetch providers, parse calendars, expose APIs, schedule work, filter calendar reads, change backup/restore, or touch frontend UI.

# Synchronization Engine

- Added `CalendarSourceSynchronizationEngine`.
- Added provider-neutral snapshot/input/result models for synchronization.
- The engine accepts an `EventSource` and a `CalendarProviderSnapshot`.
- The engine is independent of iCal Feed, iCal File, Google Calendar, CalDAV, Exchange, and future provider implementations.
- Provider importers remain responsible for retrieval and parsing; the engine only applies normalized provider data.

# Matching Strategy

- Matching uses only `(EventSourceId, ProviderEventId)`.
- The engine never matches by title, date, location, provider revision, or fingerprint.
- `ContentFingerprint` is used only after identity matching to avoid unnecessary content updates.
- Duplicate provider event ids within one snapshot are rejected as a failed synchronization.
- The same `ProviderEventId` remains valid across different sources because the source id is part of identity.

# Create / Update / Delete Behaviour

- Creates imported `EventSeries` rows for provider ids not already present for the source.
- Updates imported rows when identity matches and the fingerprint differs.
- Leaves unchanged content fields alone when the fingerprint matches while refreshing last-seen sync metadata.
- Deletes imported rows owned by the synchronized source only when a successful authoritative snapshot omits them.
- Leaves manual events and events owned by other sources untouched.
- Successful empty snapshots are authoritative and delete existing imported events for that source.
- Not-modified snapshots are not authoritative empty snapshots and do not delete imported events.

# Source Metadata Updates

On successful synchronization:

- `HealthStatus` is set to `Healthy`.
- `LastSyncAttemptUtc` and `LastSuccessfulSyncUtc` are set.
- Failure metadata is cleared.
- `ProviderSourceId` is updated when provided.
- `NextSyncAfterUtc` is recalculated from the fixed poll interval.

On failed synchronization:

- `HealthStatus` is set to `Failed`.
- `LastSyncAttemptUtc` and `LastFailedSyncUtc` are set.
- Failure code, message, and detail are stored.
- Imported events are not deleted.

# Failure Handling

- Failed provider snapshots update source failure metadata and delete nothing.
- Successful snapshots containing parser error diagnostics are treated as failed synchronization and delete nothing.
- Duplicate provider ids are treated as failed synchronization and delete nothing.
- Unexpected persistence failures return a failed result and do not leave partially created imported events.
- Parser warnings are preserved and counted in the synchronization result.

# Transaction Behaviour

- Synchronization work is transaction-scoped per source.
- Create/update/delete work is saved before source success metadata is committed.
- If persistence fails during imported-event application, no imported `EventSeries` rows are left partially created for the synchronization attempt.

# Tests

- Added SQLite-backed synchronization tests for new event creation, unchanged event handling, changed event updates, duplicate provider id rejection, provider id reuse across sources, removed event deletion, failed snapshot non-deletion, parser error non-deletion, 304/not-modified non-deletion, successful empty snapshot deletion, successful source metadata updates, failed source metadata updates, manual/other-source isolation, warning preservation, provider source id updates, timestamps, and transaction rollback of imported-event creation.
- Ran the focused synchronization test suite and the full backend test suite.

# Risks

- The engine introduces provider-neutral synchronization input models; later importer orchestration slices must map importer-specific normalized results into these models.
- Source metadata updates for unexpected persistence failures are intentionally conservative because the same persistence failure may prevent durable failure-state updates.
- The engine stores last-seen synchronization metadata on unchanged imported events so future successful snapshots can safely distinguish seen events from removed events.

# Modified Files

- `src/HomeOps.Api/CalendarEvents/Synchronization/NormalizedProviderEvent.cs`
- `src/HomeOps.Api/CalendarEvents/Synchronization/CalendarProviderSnapshot.cs`
- `src/HomeOps.Api/CalendarEvents/Synchronization/CalendarSourceSynchronizationResult.cs`
- `src/HomeOps.Api/CalendarEvents/Synchronization/CalendarSourceSynchronizationEngine.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarSourceSynchronizationEngineTests.cs`
- `docs/reports/2026-07-05-calendar-source-synchronization-engine/calendar-source-synchronization-engine.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
