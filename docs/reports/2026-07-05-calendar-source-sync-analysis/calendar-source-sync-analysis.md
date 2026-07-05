# Summary

Synchronization should be modeled as source-scoped synchronization for one configured `EventSource` at a time.

The inspected implementation and previous calendar source reports support these conclusions:

- `EventSource` remains the aggregate root for configured calendar sources.
- Imported events remain `EventSeries` records owned by an `EventSource`.
- Provider-specific configuration should live outside the generic `EventSource` fields.
- Multiple configured sources of the same provider family should be supported by source identity, not by `SourceType` uniqueness.
- Synchronization should become provider-independent after provider data has been normalized.

The recommended synchronization architecture is:

1. A synchronization use case starts from a configured `EventSource`.
2. A provider-specific importer reads provider data and normalizes it into HomeOps calendar event input.
3. A provider-independent synchronization component compares the normalized input with imported `EventSeries` currently owned by that source.
4. That synchronization component applies differences by creating new imported series, updating existing imported series, and deleting imported series that disappeared from the provider result.
5. `EventSource` owns source-level health, failure state, enabled/disabled state, and source-level synchronization timestamps.
6. Imported `EventSeries` owns event-level import identity required to match provider records across sync runs.

This report is architecture analysis only. It does not define APIs, migrations, background workers, scheduling, UI, or implementation steps.

# Synchronization Lifecycle

The synchronization lifecycle should be source-scoped.

A synchronization run should begin with one configured `EventSource`. The source is the correct starting point because the current persistence model already makes every `EventSeries` belong to an `EventSource`, and the EF relationship already cascades source deletion to owned event series. Previous reports also concluded that `EventSource` should remain the aggregate root for configured calendar sources.

Recommended lifecycle:

1. Load the configured `EventSource`.
2. Determine whether the source is eligible for synchronization.
3. Load provider-specific configuration associated with the source.
4. Invoke the provider-specific importer for that source.
5. Normalize provider-specific calendar data into provider-independent HomeOps event input.
6. Load the currently stored imported `EventSeries` rows owned by that source.
7. Match normalized provider events to imported `EventSeries` by source-scoped external identity.
8. Create missing imported `EventSeries` records.
9. Update matching imported `EventSeries` records whose normalized content changed.
10. Delete imported `EventSeries` records owned by the source whose external identities are no longer present in the provider result.
11. Record source-level synchronization outcome on `EventSource`.

Disabled sources should remain stored but hidden. Whether disabled sources should be skipped by automatic synchronization or allowed to synchronize manually is not found in the current implementation. The domain model should support both possibilities by keeping disabled/enabled state separate from synchronization health and timestamps.

Failed sources should remain stored but hidden. A failed synchronization run should update source health/failure state without deleting existing imported events solely because the provider could not be read. Deletion of removed events should occur only after a successful provider read and normalization result, because a failed fetch is not evidence that provider events were removed.

Manual events must not participate in the synchronization lifecycle. The current implementation protects manual updates and deletes through `EventSource.IsWritable`; imported sources should remain read-only and synchronization should only target imported series owned by the synchronized source.

# Source Responsibilities

`EventSource` should own source-level synchronization and lifecycle responsibilities.

Responsibilities that belong on `EventSource`:

- Source identity within HomeOps.
- Household ownership.
- Provider/source family discriminator.
- Source display name.
- Source writability/read-only capability.
- Enabled/disabled state.
- Health/failure state.
- Source-level synchronization timestamps.
- Source-level external identity when the provider exposes a stable source/calendar identifier.
- Durable source presentation defaults such as color and default visibility, if those concepts remain part of the source contract.
- Ownership of imported/manual `EventSeries` records.

The current persisted `EventSource` already has `Id`, `HouseholdId`, `Name`, `SourceType`, `IsWritable`, `CreatedUtc`, `UpdatedUtc`, and an `EventSeries` collection. It does not currently have enabled/disabled state, failure state, external identity, synchronization timestamps, or provider configuration linkage. Those missing source lifecycle fields were also identified by previous reports.

Provider-specific configuration should not be flattened into generic `EventSource` fields. Provider-specific configuration includes feed URLs, uploaded file references, credentials or tokens, provider-specific cursors, provider-specific import options, and provider-specific metadata shapes. This follows the previous architecture conclusion that generic lifecycle/status/presentation metadata belongs on `EventSource`, while provider-specific configuration belongs in associated configuration data.

`EventSource` should not own provider parsing rules. Parsing iCal, Google Calendar, CalDAV, Exchange, or other provider formats belongs to provider-specific importers/adapters.

`EventSource` should not own the detailed diff algorithm. It owns the source aggregate boundary and durable source state; the synchronization component owns comparing normalized provider data to source-owned imported events.

# Event Responsibilities

Imported events should remain `EventSeries` records.

Responsibilities that belong on imported `EventSeries`:

- HomeOps event series identity.
- Owning `EventSourceId`.
- Normalized event content used by calendar projection: title, description, all-day flag, date/time range, recurrence information, and exceptions where supported.
- Source-scoped external event identity used to match provider events across synchronization runs.
- Event-level provider revision, sequence, updated timestamp, or content fingerprint when available.
- Event-level import provenance needed to distinguish imported read-only events from manual writable events.
- Last-seen marker or equivalent event-level synchronization metadata if needed by the diff strategy.

The current `EventSeries` model does not contain external/import identity fields. Not found in the current implementation.

Manual events should remain normal `EventSeries` records owned by the writable manual source, but they should not receive synchronization ownership from external providers. Synchronization must only operate on imported series owned by the synchronized external source. This keeps manual events outside create/update/delete decisions made from provider data.

Imported events should remain read-only. Read-only behavior should be derived from source capability rather than from a separate widget-specific or event-specific edit flag. The existing manual update/delete implementation already relies on source writability, so imported sources can preserve the same boundary by using a non-writable source.

Deletion of removed provider events should delete imported `EventSeries` rows owned by that source. It should not delete manual series and should not delete imported series owned by other sources. The event deletion rule is therefore source-scoped and external-identity-scoped.

# Synchronization Metadata

Synchronization metadata should be split between source-level metadata and imported-event-level metadata.

Source-level metadata belongs on `EventSource` when it describes the configured source as a whole.

Recommended `EventSource` synchronization metadata:

- Enabled/disabled state.
- Health state, such as healthy, failed, disabled, or never synchronized.
- Last synchronization attempt timestamp.
- Last successful synchronization timestamp.
- Last failed synchronization timestamp.
- Failure reason category.
- Failure detail suitable for diagnostics or user-facing status.
- Source-level external source/calendar identifier, when provider supplied.
- Source-level provider revision, ETag, sync token, or cursor only when it represents the whole source and is provider-independent enough to belong in the generic source model.
- Created and updated timestamps for source lifecycle.

Provider-specific source metadata should remain outside generic `EventSource` fields:

- iCal feed URL.
- Uploaded file storage reference.
- HTTP cache headers or feed retrieval details.
- OAuth tokens or credentials.
- Google sync tokens if treated as provider-specific.
- CalDAV collection URLs and sync tokens if treated as provider-specific.
- Exchange folder identifiers or delta tokens if treated as provider-specific.
- Provider-specific import options.

Imported-event-level metadata belongs on `EventSeries` when it is required to match, update, or delete a provider event.

Recommended imported `EventSeries` synchronization metadata:

- External event identifier scoped to `EventSourceId`.
- External recurrence instance identifier, if the provider exposes recurrence instances separately.
- Provider event revision, sequence, updated timestamp, ETag, or equivalent when available.
- Normalized content fingerprint for provider-independent change detection.
- Last seen synchronization timestamp or run marker.
- Import created timestamp.
- Import updated timestamp.
- Optional raw provider provenance key only if required for deterministic matching.

The minimum required imported-event metadata is source-scoped external event identity. Without it, synchronization cannot reliably update existing imported events or delete only removed provider events. Previous reports identified that the current `EventSeries` model lacks this import identity.

The normalized event contract currently includes an optional `ExternalEventId`, but persisted `EventSeries` projection does not populate provider external identity from storage. This supports using external event identity as part of synchronization metadata, but persistence does not currently contain the required field. Not found in the current implementation.

# Synchronization Ownership

Synchronization should be owned by a provider-independent source synchronization component in the calendar domain/application layer.

Ownership answers:

1. Where synchronization should start: synchronization should start from a configured `EventSource`.
2. Which component owns synchronization: a provider-independent calendar source synchronization component should own the synchronization run for one source.
3. Which component owns applying differences: the same provider-independent synchronization component should own diff application to source-owned imported `EventSeries` records.
4. Which component owns importing provider data: provider-specific importers/adapters should own fetching, parsing, provider validation, and normalization.
5. Which component owns deletion of removed events: the provider-independent synchronization component should own deletion after a successful provider result, constrained to imported `EventSeries` rows owned by the synchronized source.
6. Which component owns source health/failure state: `EventSource` owns durable source health and failure state; the synchronization component updates that state as part of the source sync outcome.
7. Which component owns synchronization timestamps: `EventSource` owns source-level attempt/success/failure timestamps; imported `EventSeries` owns event-level last-seen/import timestamps if needed.
8. Which metadata is required on imported `EventSeries`: source-scoped external event identity, change detection metadata, import provenance, and last-seen metadata.
9. Which metadata belongs on `EventSource`: enabled/disabled state, health/failure state, sync timestamps, source-level external identity, provider family, display/presentation defaults, and generic source lifecycle state.
10. Whether synchronization should be provider-independent after normalization: yes.

This ownership split keeps provider-specific concerns outside the persistence-neutral diff/apply rules. Provider importers know provider formats. The synchronization component knows HomeOps source ownership and imported event lifecycle. `EventSource` stores source state. `EventSeries` stores normalized imported events.

# Alternative Designs

## Alternative A: EventSource-centered provider-independent synchronization

In this design, each sync run starts from an `EventSource`. A provider importer normalizes provider data. A provider-independent synchronization component applies the normalized result to imported `EventSeries` rows owned by the source.

Benefits:

- Builds on the existing aggregate root decision.
- Reuses the existing `EventSourceId` ownership relationship.
- Preserves manual event protection through source writability.
- Supports multiple providers using the same synchronization lifecycle.
- Makes deletion of removed provider events source-scoped and safe.
- Keeps future providers aligned with the same model after normalization.

Trade-offs:

- Requires source-level sync/health metadata that does not currently exist.
- Requires imported-event identity metadata on `EventSeries` that does not currently exist.
- Requires a clear distinction between provider-specific configuration and generic source state.

Recommendation: choose this design.

## Alternative B: Provider-specific synchronization services own diff and apply

In this design, every provider owns its own synchronization logic, including matching, creating, updating, and deleting imported events.

Benefits:

- Providers can use provider-native semantics directly.
- Provider-specific delta/cursor behavior can be optimized.
- Initial implementation for one provider may appear simpler.

Risks and trade-offs:

- Duplicates matching, deletion, failure, and timestamp semantics across providers.
- Makes manual-event safety dependent on every provider implementation.
- Makes future providers harder to reason about consistently.
- Increases the risk that iCal, Google, CalDAV, and Exchange handle deletion or failure state differently.

Recommendation: do not use provider-specific diff/apply ownership as the domain model. Provider-specific services may fetch and normalize provider data, but should not own HomeOps event lifecycle rules after normalization.

## Alternative C: Runtime adapter-only synchronization with no imported event persistence

In this design, provider adapters are invoked at read time and return normalized events without persisting imported `EventSeries`.

Benefits:

- Avoids adding imported metadata to `EventSeries`.
- Avoids storing provider event cache data.
- Fits the existing adapter shape superficially.

Risks and trade-offs:

- Does not satisfy the fixed requirement that feed sync creates new events.
- Does not satisfy the fixed requirement that existing imported events are updated.
- Does not satisfy the fixed requirement that events removed from the feed are removed from stored imported events.
- Makes source health and hidden failed-source behavior harder to model consistently.
- Creates a separate calendar read path rather than reusing persisted `EventSeries` projection.

Recommendation: do not use this design for synchronized sources.

## Alternative D: Separate imported-event storage parallel to EventSeries

In this design, imported provider events are stored in a separate imported-event table/model and merged with manual `EventSeries` during calendar reads.

Benefits:

- Keeps current `EventSeries` model unchanged.
- Allows provider-specific imported event metadata without expanding `EventSeries`.

Risks and trade-offs:

- Duplicates the event model.
- Requires calendar reads to merge manual and imported event models.
- Weakens the existing source-to-series ownership boundary.
- Requires separate projection and deletion behavior.
- Conflicts with previous reports recommending imported events remain `EventSeries`.

Recommendation: do not use this design unless future requirements prove that imported events cannot be represented as `EventSeries`. That limitation is not found in the current implementation.

# Recommended Architecture

Use EventSource-centered, provider-independent synchronization after normalization.

Recommended architecture:

- `EventSource` remains the aggregate root for configured calendar sources.
- Each sync run is scoped to exactly one `EventSource`.
- Provider-specific configuration remains associated with the source but outside generic source fields.
- Provider-specific importers fetch and parse provider data.
- Provider-specific importers normalize provider records into provider-independent event input.
- A provider-independent synchronization component performs matching and diff application.
- Imported provider records are stored as `EventSeries` owned by the source.
- Matching uses `(EventSourceId, ExternalEventId)` or an equivalent source-scoped external identity.
- Changed provider events update the corresponding imported `EventSeries`.
- New provider events create new imported `EventSeries`.
- Missing provider events delete existing imported `EventSeries` owned by the source.
- Failed provider reads update source health/failure state but do not imply provider-side deletion.
- Disabled sources remain stored and hidden.
- Failed sources remain stored and hidden.
- Manual sources remain writable.
- Imported sources remain read-only.

The synchronization domain should treat provider output as an authoritative snapshot only after successful import and normalization. Removed-event deletion should be based on that successful snapshot, not on failed attempts.

Provider independence after normalization is required for future providers. iCal feeds, iCal files, Google Calendar, CalDAV, Exchange, and later providers should all converge into the same normalized synchronization input. Provider-specific logic should be limited to provider retrieval, provider parsing, provider authentication/configuration, provider recurrence interpretation where unavoidable, and mapping into HomeOps-normalized event input.

# Risks

- The current persisted `EventSource` does not contain enabled/disabled state. Not found in the current implementation.
- The current persisted `EventSource` does not contain health/failure state. Not found in the current implementation.
- The current persisted `EventSource` does not contain last attempted, last successful, or last failed synchronization timestamps. Not found in the current implementation.
- The current persisted `EventSource` does not contain provider-specific configuration linkage. Not found in the current implementation.
- The current persisted `EventSeries` does not contain external/import identity. Not found in the current implementation.
- The current persisted `EventSeries` does not contain provider revision, content fingerprint, or last-seen sync metadata. Not found in the current implementation.
- The current event read path does not filter by disabled or failed source state because those fields do not exist. Not found in the current implementation.
- The current persistence mapping enforces a unique index on `(HouseholdId, SourceType)`, which conflicts with multiple configured sources of the same provider family.
- The current source normalizer has previously been reported as treating persisted sources as manual/enabled/default presentation sources, which would need to evolve before external synchronized source metadata can be represented correctly.
- If deletion is performed after a failed provider fetch, HomeOps could remove valid imported events incorrectly. The synchronization model must distinguish failed fetch from successful empty provider result.
- If matching relies on title/time rather than source-scoped external identity, synchronization can create duplicates or update the wrong imported event.
- If provider-specific diff/apply logic is duplicated per provider, future providers may diverge in deletion, failure, read-only, and timestamp behavior.

# Files Referenced

- `.github/copilot-instructions.md`
- `AGENTS.md`
- `docs/reports/2026-07-05-eventsource-domain-analysis/eventsource-domain-analysis.md`
- `docs/reports/2026-07-05-calendar-source-integration-analysis/calendar-source-integration-analysis.md`
- `docs/reports/2026-07-05-calendar-source-architecture-analysis/calendar-source-architecture-analysis.md`
- `docs/reports/2026-06-18-google-calendar-adapter.md`
- `docs/reports/2026-06-19-calendar-data-model-and-portability-analysis.md`
- `docs/reports/2026-06-19-calendar-recurrence-architecture-analysis.md`
- `docs/reports/2026-06-19-eventseries-readiness-analysis.md`
- `docs/reports/2026-06-19-calendar-json-contract-hardening.md`
- `docs/reports/2026-06-19-calendar-json-export-contract-analysis.md`
- `docs/reports/2026-06-19-calendar-portability-ux-hardening.md`
- `docs/reports/2026-06-19-calendar-terminology-cleanup.md`
- `src/HomeOps.Api/CalendarEvents/EventSource.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeries.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeriesEndpoints.cs`
- `src/HomeOps.Api/Data/HomeOpsDbContext.cs`
- `src/HomeOps.Api/EventSources/IEventSourceAdapter.cs`
- `src/HomeOps.Contracts/Events/EventSource.cs`
- `src/HomeOps.Contracts/Events/NormalizedEvent.cs`
