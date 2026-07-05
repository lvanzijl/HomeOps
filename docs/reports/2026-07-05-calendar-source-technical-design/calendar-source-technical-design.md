# Executive Summary

Calendar Sources will extend the existing persisted calendar model so configured sources are first-class domain objects, synchronized provider data is stored as `EventSeries`, and calendar reads remain provider-independent. `EventSource` remains the aggregate root for source lifecycle, source visibility, enabled state, provider health, synchronization metadata, and ownership of event series. Manual events and imported events both remain `EventSeries`; manual series are writable through the manual source, while imported series are read-only because their owning source is read-only.

The final design is EventSource-centered synchronization: every synchronization run targets exactly one source, provider-specific code fetches and normalizes provider data, and a provider-independent synchronization engine applies create, update, and delete changes to imported `EventSeries` rows owned by that source. This consolidates the architecture, integration, domain, and synchronization reports into a single implementation blueprint.

The MVP source types are:

- Manual.
- iCal Feed.
- iCal File.

The model must also support later providers without redesign, including Google Calendar, CalDAV, Exchange, School Holidays, and TV Series. Provider configuration uses a shared `EventSourceConfiguration` abstraction with provider-specific configuration records so each future provider can add retrieval, authentication, cursor, and parsing configuration without polluting the shared source model.

Key fixed decisions:

- `EventSource` remains the aggregate root.
- Imported events remain `EventSeries`.
- Manual events remain `EventSeries`.
- Imported events are read-only.
- Manual events remain editable.
- Synchronization is source-scoped.
- Synchronization is provider-independent after provider normalization.
- Failed synchronization never deletes events.
- `IsEnabled` is separate from `HealthStatus`; health values are `NeverSynced`, `Healthy`, and `Failed`.
- Polling is exposed as fixed `PollInterval` choices: `EveryHour`, `Every8Hours`, and `EveryDay`.
- Sources are always visible in Settings, including disabled, failed, and never-synced sources.
- Calendar output hides disabled sources, failed sources, and never-synced provider sources until the first successful sync; Settings always shows all configured sources.
- The system manual source cannot be deleted by any entry point.
- Backup includes source configuration and excludes imported events.

This specification is the authoritative implementation reference for the Calendar Sources feature. Future implementation slices should not reopen these architectural decisions unless a documented product requirement contradicts them.

# Goals

1. Define the final domain model for Calendar Sources.
2. Define the exact responsibilities of `EventSource`, `EventSeries`, provider configuration, and synchronization components.
3. Define synchronization lifecycle semantics for creation, update, deletion, failure, disabled sources, and background execution.
4. Define calendar query behavior so disabled or failed sources are hidden while stored configuration and imported events remain durable.
5. Define backup and restore behavior that includes source configuration but excludes imported events.
6. Define API, DTO, persistence, and testing requirements in enough detail for implementation prompts to proceed without architecture decisions.
7. Preserve the existing modular monolith architecture using ASP.NET Core, C#, PostgreSQL, OpenAPI, NSwag, React, TypeScript, and Vite.
8. Support the MVP providers while keeping future providers compatible with the same model.

# Non-Goals

This document does not implement the feature.

This document intentionally does not define:

- Authentication or OAuth flows.
- Google Calendar implementation details beyond extensibility requirements.
- CalDAV, Exchange, School Holidays, or TV Series implementation details beyond extensibility requirements.
- A new recurrence engine beyond what is required to persist normalized provider data as `EventSeries`.
- Widget-specific data models.
- Microservices, Kubernetes, CQRS, event sourcing, distributed messaging, or a separate synchronization service.
- UI layout implementation.
- Screenshots or binary artifacts.

# Architecture Overview

The final architecture has four layers of responsibility:

1. **Configured source aggregate:** `EventSource` stores source identity, household ownership, display metadata, enabled state, read/write capability, health status, and source-level synchronization metadata.
2. **Provider configuration:** Provider configuration is modeled through a shared `EventSourceConfiguration` abstraction linked one-to-one to the owning `EventSource`, with provider-specific derived/configuration records for iCal feed, iCal file, and future providers.
3. **Provider importers:** Provider-specific importers fetch or read provider data, validate provider inputs, parse provider-native formats, and normalize provider records into provider-independent synchronization inputs.
4. **Provider-independent synchronization engine:** The synchronization engine receives normalized provider data and applies source-scoped create, update, and delete changes to imported `EventSeries` records.

The chosen design follows the architecture and sync reports: provider-specific services may understand iCal, Google, CalDAV, Exchange, or other formats, but they must not own HomeOps event lifecycle rules after normalization. The provider-independent engine owns matching, diffing, imported-event writes, removed-event deletion, and source health updates.

Rejected alternatives:

- **Runtime adapter-only reads:** Rejected because the fixed product requirement says synchronization creates, updates, and removes stored imported events. Runtime-only adapters cannot satisfy durable sync metadata, failure health, source lifecycle, or backup semantics.
- **Provider-specific diff/apply services:** Rejected because each provider would duplicate deletion, failure, read-only, and matching rules, increasing the risk of inconsistent behavior.
- **Separate imported-event storage parallel to `EventSeries`:** Rejected because previous reports concluded imported events should remain `EventSeries`, and the existing model already uses `EventSourceId` as the ownership boundary.
- **Flattened provider settings on `EventSource`:** Rejected because provider-specific URLs, file references, credentials, cursors, cache validators, and import options differ by provider and would make the generic source model unstable.
- **Unrelated provider-specific tables without a shared configuration abstraction:** Rejected because it would force source management, backup/restore, validation, and DTO handling to special-case every provider instead of depending on a consistent source-configuration contract.

# Domain Model

## EventSource aggregate

`EventSource` is the aggregate root for configured calendar sources.

Required fields:

- `Id`: HomeOps source identifier.
- `HouseholdId`: owning household.
- `Name`: user-visible source name.
- `Icon`: emoji icon for MVP source presentation.
- `SourceType`: source/provider family discriminator.
- `IsEnabled`: user-controlled on/off state that controls calendar output and automatic background sync eligibility.
- `IsWritable`: whether events owned by the source can be edited through manual event APIs.
- `HealthStatus`: synchronization/provider health state, separate from enabled state.
- `LastSyncAttemptUtc`: last synchronization attempt timestamp.
- `LastSuccessfulSyncUtc`: last successful synchronization timestamp.
- `LastFailedSyncUtc`: last failed synchronization timestamp.
- `LastErrorCode`: durable machine-readable failure category.
- `LastErrorMessage`: sanitized user-facing failure summary.
- `LastErrorDetail`: optional diagnostic detail suitable for admin/debug UI, not raw secrets.
- `PollInterval`: fixed background synchronization cadence choice.
- `NextSyncAfterUtc`: scheduler hint derived from health status, poll interval choice, and last attempt/success.
- `ProviderSourceId`: optional provider source/calendar identity when the provider exposes one.
- `CreatedUtc`.
- `UpdatedUtc`.
- `EventSeries`: owned event series collection.

Recommended enum values:

- `SourceType`: `Manual`, `ICalFeed`, `ICalFile`, `GoogleCalendar`, `CalDav`, `Exchange`, `SchoolHolidays`, `TvSeries`, `Provider`.
- `EventSourceHealthStatus`: `NeverSynced`, `Healthy`, `Failed`.
- `EventSourcePollInterval`: `EveryHour`, `Every8Hours`, `EveryDay`.

Health status and enabled state are related but not identical:

- `IsEnabled = false` means the user disabled the source. Settings still shows it. Calendar output hides it. Automatic background sync skips it. Configuration remains stored.
- `HealthStatus = NeverSynced` means a provider source has no successful synchronization yet. Settings shows it, but calendar output hides any imported rows for that source until the first successful sync. Manual source behavior remains unchanged.
- `HealthStatus = Healthy` means the source is eligible for calendar output when `IsEnabled = true`.
- `HealthStatus = Failed` means the last sync failed or the source is unhealthy. Settings still shows it. Calendar output hides it. Configuration and imported events remain stored. Future manual or scheduled retry may move it back to `Healthy`.
- Disabled state is represented only by `IsEnabled = false`; do not add a health value for disabled sources.

## EventSeries

`EventSeries` remains the persisted event model for both manual and imported events.

Existing responsibilities remain:

- Own event title, description, all-day flag, date/time range, recurrence type, exceptions, created timestamp, and updated timestamp.
- Belong to exactly one `EventSource` through `EventSourceId`.
- Project to runtime occurrences and normalized events through the existing occurrence projection path.

Additional imported-event fields are required:

- `ProviderEventId`: required for imported events, null for manual events.
- `ProviderInstanceId`: optional provider identity for detached recurrence instances when needed.
- `ProviderRevision`: optional provider revision, sequence, ETag, updated timestamp, or equivalent.
- `ContentFingerprint`: provider-independent hash of normalized event content used only as a change-detection optimization after matching by `(EventSourceId, ProviderEventId)`; it is never event identity.
- `ImportedAtUtc`: first import timestamp, null for manual events.
- `LastImportedUtc`: last time normalized provider content was applied, null for manual events.
- `LastSeenSyncAttemptUtc`: timestamp or run marker for the last successful provider snapshot that included this event.

Recommended constraints:

- Unique index on `(EventSourceId, ProviderEventId)` for imported series where `ProviderEventId` is not null.
- Manual series keep `ProviderEventId = null`.
- Synchronization must only operate on series whose owning source is the synchronized source and whose `ProviderEventId` is not null.

## Provider configuration

Provider configuration is linked to `EventSource` through a shared `EventSourceConfiguration` abstraction and remains separate from generic source metadata. The architecture follows a provider-plugin model: `EventSource` owns lifecycle and source-level metadata while depending only on the provider configuration abstraction, never on concrete provider configuration types.

Chosen model:

- Use a shared `EventSourceConfiguration` abstraction for source management, validation, backup/restore, API DTO discrimination, and importer lookup.
- Store provider-specific details in derived/configuration records keyed by `EventSourceId`; provider-specific persistence is an implementation detail behind the abstraction.
- Provider importers own provider-specific configuration loading, validation, authentication/cursor interpretation, and provider-native parsing.
- The synchronization engine receives normalized provider snapshots and must never depend on concrete provider configuration types.
- New providers are added by implementing a new provider configuration and importer registration without modifying synchronization engine logic.
- Manual sources do not require a configuration record.
- This gives HomeOps a consistent configuration contract while preserving provider-specific shapes.

MVP derived/configuration records:

- `ICalFeedSourceConfiguration`:
  - `EventSourceId`.
  - `FeedUrl`.
  - Optional HTTP cache metadata such as `ETag` and `LastModified`.
  - Optional provider-specific retrieval metadata.
  - Created/updated timestamps.
- `ICalFileSourceConfiguration`:
  - `EventSourceId`.
  - Stored file reference, blob key, or persisted text reference chosen by implementation.
  - Original filename.
  - Content hash.
  - Uploaded timestamp.
  - Created/updated timestamps.
- Manual sources do not require a provider configuration record.

Future provider configuration examples:

- Google Calendar: calendar ID, OAuth account reference, sync token, selected calendar metadata.
- CalDAV: collection URL, credential reference, sync token/CTag, calendar color metadata if provider-owned.
- Exchange: mailbox/folder ID, credential reference, delta token.
- School Holidays: region/country, provider revision metadata.
- TV Series: selected series IDs, provider API metadata.

# EventSource

`EventSource` owns source-level state and lifecycle. It does not parse provider data and does not implement provider-specific retrieval.

Responsibilities:

- Define source identity in HomeOps.
- Define household ownership.
- Define source type/provider family.
- Define user-facing source name and emoji icon.
- Define enabled/disabled state.
- Define write capability for owned events.
- Define source health state.
- Store source-level sync timestamps and failure details.
- Store fixed poll interval choice and scheduling hints.
- Own all manual or imported `EventSeries` records for that source.
- Gate calendar output visibility separately from Settings visibility.
- Gate manual event mutation via `IsWritable`.

Non-responsibilities:

- Fetching provider data.
- Parsing iCal, Google, CalDAV, Exchange, or other provider formats.
- Applying provider-specific authentication.
- Owning provider-specific URLs, credentials, tokens, file data, or cursor shapes.
- Owning the provider-independent diff algorithm directly as entity methods.

Why chosen:

- The current persistence model already makes every `EventSeries` belong to an `EventSource`.
- Previous architecture and sync reports concluded that `EventSource` should remain the aggregate root.
- Source-scoped ownership makes deletion safe: only imported events owned by the synchronized source can be removed.

Rejected alternatives:

- Making providers aggregate roots was rejected because it would duplicate source lifecycle state and weaken the existing source-to-series relationship.
- Making each event own its provider configuration was rejected because configuration applies to the source, not individual normalized events.

# EventSeries

`EventSeries` owns event-level calendar content. Manual and imported events share this model.

Responsibilities for all series:

- Store normalized calendar content.
- Store recurrence data and exceptions where supported.
- Belong to exactly one source.
- Project to occurrences for calendar reads.

Additional responsibilities for imported series:

- Store source-scoped provider event identity through `(EventSourceId, ProviderEventId)`.
- Store event-level import metadata needed for change detection after identity matching.
- Store last-seen metadata needed for safe deletion after successful provider snapshots.
- Remain read-only through source capability.

Manual series responsibilities:

- Remain editable through the writable manual source.
- Never participate in provider synchronization.
- Keep imported-event metadata null.

Why chosen:

- Previous reports fixed that imported events remain `EventSeries` and manual events remain `EventSeries`.
- A shared event model keeps calendar queries provider-independent.
- Source writability already protects manual update/delete behavior and extends naturally to imported read-only sources.

Rejected alternatives:

- A separate `ImportedEvent` table was rejected because it would duplicate event storage and force calendar reads to merge two event models.
- Treating imported events as runtime-only adapter events was rejected because synchronization must durably create, update, and remove events.

# Provider Configuration

Provider configuration must be separate from generic `EventSource` metadata.

Rules:

- Each non-manual source has exactly one provider configuration record of the shape required by its `SourceType`, exposed through the shared `EventSourceConfiguration` abstraction.
- `EventSource` references provider configuration only through the abstraction; it must not add provider-specific columns beyond provider-neutral source metadata.
- Provider configuration is loaded only by source management and provider importer code.
- Provider importers own concrete provider configuration types and translate provider-native data into normalized synchronization inputs.
- The synchronization engine must not load, inspect, cast, or branch on concrete provider configuration types. It works only with the selected source, importer result, and normalized event snapshot.
- Adding Google Calendar, School Holidays, TV Series, or another future provider requires a provider configuration implementation, DTO discrimination, persistence behind the abstraction, and importer registration; it must not require synchronization engine changes.
- Provider-specific persistence tables, JSON columns, cursor storage, or secure references are allowed only as implementation details behind `EventSourceConfiguration`.
- Generic calendar reads do not need provider configuration.
- Backup exports provider configuration through the shared source-configuration contract.
- Restore recreates source configuration but does not restore imported events.
- Sensitive data must be stored as references to secure storage where applicable; source DTOs must not expose secrets.

MVP provider configuration:

## iCal Feed

Use a provider configuration record linked to the source.

Required data:

- Feed URL.

Optional data:

- HTTP ETag.
- HTTP Last-Modified.
- Last fetched content hash.
- Provider-specific import options if later required.

The importer fetches the URL, parses iCalendar content, and normalizes events.

## iCal File

Use a provider configuration record linked to the source.

Required data:

- Stored file reference or persisted file content reference.
- Original filename.
- Content hash.

The importer reads the stored uploaded file content, parses iCalendar content, and normalizes events.

Why chosen:

- iCal Feed and iCal File both use iCalendar parsing but have different retrieval and configuration lifecycles.
- Keeping retrieval configuration separate lets the synchronization engine receive identical normalized event inputs for both.

Rejected alternatives:

- Separate provider-specific tables only, with no shared `EventSourceConfiguration` abstraction, was rejected because generic source management, backup/restore, and importer dispatch need a stable configuration contract as providers grow. Provider-specific persistence shapes remain allowed behind the abstraction.
- Storing feed URLs or file references directly on `EventSource` was rejected because future providers would continually add unrelated nullable fields.
- Treating iCal files as manual imports was rejected because imported events are read-only and source-scoped synchronization/removal behavior still applies.

# Synchronization Engine

The synchronization engine is provider-independent after normalization.

Primary service responsibilities:

1. Accept a source ID and synchronization trigger context.
2. Load the `EventSource` and verify source eligibility.
3. Load provider configuration through the provider-specific importer.
4. Ask the importer to produce a successful normalized snapshot or a failure result.
5. On successful provider snapshot:
   - Load existing imported `EventSeries` rows for the source.
   - Match incoming normalized events by `(EventSourceId, ProviderEventId)`.
   - Create missing imported series.
   - Update matching series if content or import metadata changed.
   - Delete existing imported series whose provider identities are absent from the successful snapshot.
   - Update source `HealthStatus` to `Healthy` and sync timestamps.
6. On failed provider import:
   - Update source `HealthStatus` to `Failed` and failure metadata.
   - Never delete imported events.
7. On disabled source:
   - Do not run automatic sync.
   - Preserve configuration and imported events.
   - Hide source from calendar output.

Normalized importer output should include:

- Provider event ID.
- Optional provider instance ID.
- Title.
- Description.
- Location where supported.
- All-day flag.
- Start/end date/time.
- Time zone interpretation needed to persist HomeOps event fields.
- Recurrence representation supported by HomeOps.
- Exceptions where supported.
- Provider revision/sequence/updated/ETag where available.
- Content fingerprint or enough normalized content for the sync engine to compute one.

The engine must treat successful empty snapshots as authoritative and delete existing imported events for that source. It must treat failed fetch, parse, validation, authentication, permission, timeout, and provider unavailable outcomes as failures and delete nothing.

Why chosen:

- Previous synchronization analysis concluded synchronization should start from `EventSource`, be source-scoped, and apply differences only after provider normalization.
- This design gives all providers the same deletion and failure behavior.

Rejected alternatives:

- Provider-owned diff/apply was rejected because it duplicates core lifecycle rules.
- Matching by title/time was rejected because it can create duplicates and update the wrong event when provider events are renamed or rescheduled.

# Synchronization Lifecycle

A synchronization run has these phases:

1. **Requested:** A manual refresh, background scheduler, source creation, source update, or restore action requests sync for one source.
2. **Eligibility check:** The engine loads the source.
   - Manual sources are not synchronized.
   - Disabled sources are skipped by automatic sync.
   - Unknown source types fail with a configuration error.
   - Missing provider configuration fails with a configuration error.
3. **Attempt recorded:** Set `LastSyncAttemptUtc` and clear transient in-memory run state. Do not clear prior failure details until success unless UI requires a separate `InProgress` indicator.
4. **Provider import:** The importer fetches/reads provider data and normalizes it.
5. **Snapshot validation:** The engine verifies every normalized event has a source-scoped provider identity and valid normalized date/time data.
6. **Diff computation:** Existing imported series are matched to incoming normalized events only by `(EventSourceId, ProviderEventId)`.
7. **Apply changes:** Create, update, and delete imported series in one transaction where practical.
8. **Outcome recorded:** Set health status and metadata.
   - Success: `HealthStatus = Healthy`, set `LastSuccessfulSyncUtc`, clear failure fields.
   - Failure: `HealthStatus = Failed`, set `LastFailedSyncUtc`, set failure fields, delete nothing.
   - Skipped because `IsEnabled = false`: preserve previous health metadata and report the skip from operation context, not by changing `HealthStatus`.
9. **Calendar visibility:** Calendar queries include enabled manual sources and enabled healthy imported sources according to the rules in this document; Settings visibility is unaffected by health or enabled state.

Creation rules:

- Newly created non-manual sources should be stored before initial sync.
- If initial sync fails, the source remains stored with failed health and is hidden from calendar output while remaining visible in Settings.
- If initial sync succeeds, imported events are stored and source becomes visible if enabled.

Update rules:

- Updating source display fields does not require deleting events.
- Updating provider configuration should request a sync.
- If the new configuration fails, keep the source stored, mark health failed, hide it from calendar output, and keep it visible in Settings.
- If the new configuration succeeds, apply the successful snapshot to the source-owned imported series.

Deletion rules:

- Deleting a source deletes its owned imported series through the source aggregate relationship.
- Deleting the system manual source is forbidden as a domain invariant; no API, restore process, background process, or internal application service may delete it.
- Disabling a source does not delete configuration or events.

# Synchronization Metadata

Source-level metadata belongs on `EventSource` when it describes the configured source as a whole.

Required source-level sync metadata:

- `IsEnabled`.
- `HealthStatus`.
- `PollInterval`.
- `LastSyncAttemptUtc`.
- `LastSuccessfulSyncUtc`.
- `LastFailedSyncUtc`.
- `NextSyncAfterUtc`.
- `LastErrorCode`.
- `LastErrorMessage`.
- `LastErrorDetail`.
- `ProviderSourceId`.

Event-level metadata belongs on `EventSeries` when it is needed to match, update, or delete provider events.

Required event-level sync metadata:

- `ProviderEventId`.
- `ProviderInstanceId` where needed.
- `ProviderRevision` where available.
- `ContentFingerprint` as a post-match change-detection aid only, never as identity.
- `ImportedAtUtc`.
- `LastImportedUtc`.
- `LastSeenSyncAttemptUtc`.

Provider-specific metadata belongs in provider configuration:

- Feed URL.
- File reference.
- HTTP cache validators.
- OAuth tokens or credential references.
- Google sync token.
- CalDAV sync token/CTag.
- Exchange delta token.
- Provider-specific import options.

Why split metadata:

- Source-level metadata drives Settings UI, calendar visibility, background scheduling, and backup configuration.
- Event-level metadata drives matching and deletion safety.
- Provider-specific metadata changes per provider and should not destabilize generic source records.

# Failure Model

Failure is source-scoped.

Failure categories:

- `ConfigurationMissing`.
- `ConfigurationInvalid`.
- `AuthenticationFailed`.
- `AuthorizationFailed`.
- `ProviderUnavailable`.
- `NetworkTimeout`.
- `ParseFailed`.
- `ValidationFailed`.
- `UnsupportedProviderData`.
- `Unknown`.

Failure rules:

- A failed sync updates source failure metadata.
- A failed sync never deletes imported events.
- A failed source remains stored.
- A failed source is hidden from calendar output.
- A failed source can be retried manually through Refresh Source or Refresh All.
- Background sync may retry failed sources if they are enabled and their retry interval has elapsed, but calendar output remains hidden until a successful sync restores health.
- Failure details must not expose secrets in API DTOs or backup files.

Why chosen:

- Previous sync analysis explicitly warned that failed provider reads are not evidence of removed provider events.
- Hiding failed sources avoids displaying stale imported events as if they were current while preserving data for recovery.

Rejected alternatives:

- Deleting events on failed sync was rejected as unsafe.
- Leaving failed sources visible was rejected because product decisions require failed sources to be hidden from calendar output.

# Calendar Queries

Calendar reads must remain provider-independent and should query persisted `EventSeries` through `EventSource` ownership.

Inclusion rules:

- Include manual source events when the manual source is enabled and not failed; manual source behavior otherwise remains unchanged.
- Include imported source events only when `IsEnabled = true` and `HealthStatus = Healthy`.
- A source with `HealthStatus = NeverSynced` should not contribute imported events because none should exist yet; if rows exist unexpectedly, queries should not display them until the source is healthy.
- Exclude disabled sources from calendar output while keeping them visible in Settings.
- Exclude failed sources from calendar output while keeping them visible in Settings.
- Exclude deleted sources and their cascaded series.

Editability rules:

- Occurrences from writable manual sources are editable.
- Occurrences from imported read-only sources are not editable.
- Editability is derived from source capability, not widget state.

Query projection rules:

- Existing occurrence generation remains the shared projection path for persisted series.
- Normalized event DTOs should include source ID, source display metadata if required by UI, provider event ID where appropriate, description, location if persisted, all-day flag, and editability.
- Query filters must be source-state-aware so disabled and failed sources do not appear in agenda, calendar, widgets, or export-derived display paths.

Why chosen:

- This preserves the existing persisted calendar read path and avoids runtime provider calls during calendar display.
- Filtering by enabled state and health status implements fixed product decisions without changing event ownership.

# Backup & Restore

Backup includes source configuration and excludes imported events.

Backup must include:

- Manual source metadata required to preserve manual event ownership.
- Non-manual source generic metadata:
  - source ID or stable backup identity,
  - name,
  - icon,
  - source type,
  - enabled flag,
  - poll interval choice,
  - source-level provider identity if safe and useful,
  - created/updated metadata where backup format already preserves lifecycle metadata.
- Provider configuration for each source:
  - iCal feed URL and safe retrieval configuration.
  - iCal file source reference/content strategy as defined by implementation.
  - Future provider configuration excluding secrets unless restored through secure references.
- Manual events.

Backup must exclude:

- Imported `EventSeries` rows.
- Imported event exceptions generated from provider data.
- Event-level synchronization metadata for imported events.
- Provider secrets or raw tokens unless a future secure backup design explicitly allows them.
- Last sync error details that are diagnostics rather than configuration.

Restore rules:

- Restore source configuration first.
- Restore manual events for manual sources.
- Do not restore imported events.
- Restored enabled non-manual sources should be marked `NeverSynced` with a clear “sync required” health state until synchronization succeeds.
- Restore may enqueue or request sync after configuration is restored, but imported events only appear after successful provider sync.
- Restored disabled non-manual sources remain disabled and hidden from calendar output, but visible in Settings.

Why chosen:

- Imported events are provider-derived cache data and should be recreated from providers.
- Source configuration is user-owned and must survive backup/restore.

Rejected alternatives:

- Backing up imported events was rejected because it would restore stale provider cache data and conflict with source-of-truth semantics.
- Excluding source configuration was rejected because users would lose configured sources after restore.

# Background Synchronization

Background synchronization runs inside the existing backend application as part of the modular monolith.

Rules:

- The scheduler finds enabled non-manual sources whose `NextSyncAfterUtc` is due and whose fixed `PollInterval` choice has elapsed.
- Disabled sources are skipped.
- Manual sources are skipped.
- Each sync run is source-scoped.
- Concurrent sync for the same source must be prevented by a database lock, row version, advisory lock, or equivalent implementation mechanism.
- Different sources may synchronize independently if implementation later supports concurrency.
- Poll interval choice comes from `EventSource.PollInterval`; scheduling code may derive minutes internally from `EveryHour`, `Every8Hours`, or `EveryDay`, but minutes are not the domain/API/settings model.
- Failed enabled sources may retry according to the fixed poll interval choice or a conservative retry policy.
- Refresh All requests enqueue or directly execute sync for all enabled non-manual sources.
- Refresh All should return per-source results, not fail the entire operation because one source failed.

MVP scheduling recommendation:

- Use a hosted background service within ASP.NET Core.
- Keep execution durable through persisted source metadata rather than in-memory-only state.
- Avoid distributed scheduling infrastructure.

Why chosen:

- The repository architecture is a modular monolith and explicitly excludes distributed architecture.
- Source-scoped metadata is sufficient for scheduling and retry decisions.

# API Design

The API surface should be source-centered.

Recommended endpoints:

## Source management

- `GET /api/event-sources`
  - Returns all configured sources for the household, including disabled and failed sources for Settings.
  - Does not expose secrets.
- `GET /api/event-sources/{sourceId}`
  - Returns source details and provider-safe configuration.
- `POST /api/event-sources`
  - Creates a source and provider configuration.
  - For non-manual sources, may trigger initial sync.
- `PUT /api/event-sources/{sourceId}`
  - Updates display metadata, enabled state, poll interval choice, and provider configuration.
  - Provider configuration changes should request sync.
- `DELETE /api/event-sources/{sourceId}`
  - Deletes a non-system source and owned imported events.
  - Must enforce the domain invariant that the required system manual source cannot be deleted by any entry point.

## Synchronization

- `POST /api/event-sources/{sourceId}/refresh`
  - Runs or enqueues sync for one source.
  - Returns per-source sync result.
- `POST /api/event-sources/refresh-all`
  - Runs or enqueues sync for all enabled non-manual sources.
  - Returns per-source sync results.

## Calendar reads

- Existing `GET /api/events` should include only eligible visible sources.
- Existing manual event create/update/delete endpoints should continue to mutate only writable manual source series.

API behavior rules:

- Settings endpoints must show disabled, failed, and never-synced sources so users can fix or complete setup.
- Calendar event output must hide disabled sources, failed sources, and never-synced provider sources.
- Imported event mutation through manual event endpoints must return not found or forbidden according to existing endpoint conventions because imported source `IsWritable = false`.
- Validation errors should be explicit for missing configuration, unsupported source type, invalid feed URL, invalid file content, and invalid poll interval choice.

# DTO Design

DTOs must distinguish generic source metadata from provider-specific configuration.

Recommended DTOs:

## EventSourceDto

Fields:

- `id`.
- `name`.
- `icon`.
- `sourceType`.
- `enabled`.
- `writable`.
- `healthStatus`.
- `pollInterval`.
- `lastSyncAttemptUtc`.
- `lastSuccessfulSyncUtc`.
- `lastFailedSyncUtc`.
- `nextSyncAfterUtc`.
- `lastError` object:
  - `code`.
  - `message`.
- `providerSourceId` where safe.
- Presentation fields already supported by existing contracts where still required, such as color or visibility group.

## CreateEventSourceRequest

Fields:

- `name`.
- `icon`.
- `sourceType`.
- `enabled`.
- `pollInterval`.
- `providerConfiguration` discriminated by source type.

## UpdateEventSourceRequest

Fields:

- `name`.
- `icon`.
- `enabled`.
- `pollInterval`.
- Optional `providerConfiguration` discriminated by source type.

## Provider configuration DTOs

- `ICalFeedConfigurationDto`:
  - `feedUrl`.
- `ICalFileConfigurationDto`:
  - `fileId` or upload reference.
  - `originalFilename`.
  - `contentHash` if exposed.

## Sync DTOs

- `SyncSourceResultDto`:
  - `sourceId`.
  - `healthStatus`.
  - `attemptedAtUtc`.
  - `successfulAtUtc`.
  - `createdCount`.
  - `updatedCount`.
  - `deletedCount`.
  - `error` if failed.
- `RefreshAllResultDto`:
  - `results` array of `SyncSourceResultDto`.

## Event DTO changes

Normalized event output should support:

- `sourceId`.
- `providerEventId` for imported events when safe.
- `location` if imported and persisted.
- `editable` derived from source writability.

Why chosen:

- Existing contracts already include normalized source and event concepts, but previous reports found that persisted projection does not populate all provider metadata.
- Discriminated provider configuration avoids a large sparse DTO with irrelevant nullable fields.

# Persistence Design

Persistence changes required:

## EventSources table

Add columns:

- `Icon` required with emoji default for existing/manual source.
- `IsEnabled` required, default true.
- `HealthStatus` required, string or enum conversion.
- `PollInterval` required with default.
- `LastSyncAttemptUtc` nullable.
- `LastSuccessfulSyncUtc` nullable.
- `LastFailedSyncUtc` nullable.
- `NextSyncAfterUtc` nullable.
- `LastErrorCode` nullable.
- `LastErrorMessage` nullable.
- `LastErrorDetail` nullable.
- `ProviderSourceId` nullable.

Change indexes:

- Replace the current unique `(HouseholdId, SourceType)` index because multiple iCal feeds, files, or future provider calendars must be allowed.
- Add an index on `(HouseholdId, IsEnabled, HealthStatus)` for calendar query filtering.
- Add an index on `(HouseholdId, SourceType)` as non-unique if useful.
- Add an index on `NextSyncAfterUtc` for background scheduling.

## EventSeries table

Add columns:

- `ProviderEventId` nullable.
- `ProviderInstanceId` nullable.
- `ProviderRevision` nullable.
- `ContentFingerprint` nullable.
- `ImportedAtUtc` nullable.
- `LastImportedUtc` nullable.
- `LastSeenSyncAttemptUtc` nullable.
- `Location` nullable if imported event location is required in normalized output.

Add indexes:

- Unique filtered index on `(EventSourceId, ProviderEventId)` where `ProviderEventId IS NOT NULL`.
- Index on `(EventSourceId, LastSeenSyncAttemptUtc)` if deletion uses last-seen markers.

## Provider configuration tables

Add provider-specific tables behind the shared `EventSourceConfiguration` abstraction:

- `ICalFeedSourceConfigurations`:
  - `EventSourceId` primary key/foreign key.
  - `FeedUrl`.
  - `ETag` nullable.
  - `LastModified` nullable.
  - `LastContentHash` nullable.
  - `CreatedUtc`.
  - `UpdatedUtc`.
- `ICalFileSourceConfigurations`:
  - `EventSourceId` primary key/foreign key.
  - `FileReference` or chosen storage reference.
  - `OriginalFilename`.
  - `ContentHash`.
  - `UploadedUtc`.
  - `CreatedUtc`.
  - `UpdatedUtc`.

Relationship rules:

- Provider configuration records cascade delete with their owning source.
- Imported series cascade delete with their owning source.
- The system manual source deletion must be protected as a domain invariant and cannot be deleted by any entry point; persistence and API layers should enforce the invariant rather than relying on an API-only check.

Migration data rules:

- Existing manual source becomes `SourceType = Manual`, `IsWritable = true`, `IsEnabled = true`, `HealthStatus = Healthy`, default icon, default poll interval choice if required by the schema, and protected by the non-deletable system manual source invariant.
- Existing manual event series keep imported metadata null.

Why chosen:

- The current unique source-type index conflicts with multiple configured sources of the same provider type.
- The new indexes support visible calendar reads and due background sync discovery.

# Testing Strategy

Testing must validate product behavior, not only compilation.

## Unit tests

Synchronization engine:

- Creates imported series for new normalized provider events.
- Updates existing imported series when the `(EventSourceId, ProviderEventId)` match is found and content fingerprint or other normalized metadata changes.
- Does not update matching series when identity matches and normalized content is unchanged.
- Deletes imported series missing from a successful provider snapshot.
- Does not delete anything when provider import fails.
- Does not touch manual series.
- Does not touch imported series owned by other sources.
- Requires `(EventSourceId, ProviderEventId)` identity for imported events.
- Records success metadata.
- Records failure metadata.

Provider importers:

- iCal feed importer parses supported event shapes.
- iCal file importer parses supported event shapes.
- Invalid iCalendar content produces failed import result without partial writes.
- Provider recurrence and all-day events normalize consistently with HomeOps event fields.

Domain/validation:

- Manual sources are writable.
- Imported sources are read-only.
- Poll interval choices are limited to `EveryHour`, `Every8Hours`, and `EveryDay`.
- Unsupported source types are rejected.
- Provider configuration is required for non-manual sources.

## Integration tests

Persistence:

- Multiple sources with the same `SourceType` can exist in one household.
- `(EventSourceId, ProviderEventId)` uniqueness prevents duplicate imported events per source.
- Same `ProviderEventId` can exist in different sources.
- Source deletion cascades imported series and provider configuration.
- Disabled source remains stored.
- Failed source remains stored.

API:

- Settings/source list includes disabled, failed, and never-synced sources.
- Calendar event reads exclude disabled sources.
- Calendar event reads exclude failed sources.
- Calendar event reads exclude never-synced provider source events until first successful sync.
- Imported event update/delete through manual endpoints is blocked.
- Refresh source returns per-source sync result.
- Refresh all returns mixed success/failure results without failing the whole operation.

Backup/restore:

- Backup includes source configuration.
- Backup excludes imported events.
- Restore recreates source configuration.
- Restore does not recreate imported events.
- Restored enabled non-manual sources remain hidden until successful sync.

## End-to-end or workflow tests

- Create iCal feed source, refresh, verify events appear.
- Disable source, verify events disappear from calendar output and source remains in settings.
- Re-enable and refresh source, verify events reappear after success.
- Provider failure hides source but preserves configuration.
- Successful later refresh restores source visibility.
- Refresh all reports per-source outcomes.

## Regression tests

- Existing manual event CRUD remains functional.
- Existing recurrence projection remains functional for manual events.
- Existing calendar export/restore for manual events remains functional.

# Future Providers

Future providers fit by adding provider configuration and importer implementations, not by changing synchronization rules.

Provider extension contract:

1. Add `SourceType` value.
2. Add provider configuration storage and DTOs.
3. Implement provider importer that produces normalized source-scoped event snapshots.
4. Register importer with the synchronization engine.
5. Add provider-specific validation and tests.

Provider examples:

## Google Calendar

- Configuration: calendar ID, OAuth account/credential reference, optional sync token.
- Importer: calls Google Calendar API, maps Google event IDs and recurrence data to normalized input.
- Sync engine: unchanged.

## CalDAV

- Configuration: collection URL, credential reference, CTag/sync token.
- Importer: retrieves calendar objects, parses iCalendar content, normalizes events.
- Sync engine: unchanged.

## Exchange

- Configuration: mailbox/folder identity, credential reference, delta token.
- Importer: maps Exchange event identifiers and recurrence metadata to normalized input.
- Sync engine: unchanged.

## School Holidays

- Configuration: country/region and provider selection.
- Importer: fetches or generates holiday events with stable provider IDs.
- Sync engine: unchanged.

## TV Series

- Configuration: selected series identifiers and provider metadata.
- Importer: fetches episodes and maps them to read-only calendar events.
- Sync engine: unchanged.

Why future providers fit:

- Generic source metadata is provider-neutral.
- Provider-specific configuration is isolated.
- The synchronization engine only requires normalized event snapshots with stable provider identities.
- Calendar reads only depend on persisted `EventSeries` and source visibility.

# Implementation Roadmap

Implementation must proceed in dependency order and remain one implementation slice per run.

1. **Persistence foundation**
   - Add source lifecycle fields.
   - Add imported-event metadata fields.
   - Replace incompatible unique source-type index.
   - Add provider configuration tables.
   - Migrate existing manual source and series.

2. **Domain and DTO foundation**
   - Add source type, health-status, and poll-interval enums or validated constants.
   - Add source DTOs and discriminated provider configuration DTOs.
   - Update event DTO projection for provider metadata and location if required.

3. **Source management API**
   - Implement list/detail/create/update/delete source endpoints.
   - Validate provider configuration.
   - Enforce the system manual source deletion domain invariant.
   - Ensure Settings can show disabled, failed, and never-synced sources.

4. **iCalendar provider normalization**
   - Implement shared iCalendar parser/normalizer used by iCal Feed and iCal File.
   - Produce provider-independent normalized event inputs with stable provider identities.
   - Add parser tests for supported iCalendar shapes.

5. **iCal Feed importer**
   - Implement feed retrieval and configuration loading.
   - Map fetch, validation, and parse errors to failure categories.
   - Add feed importer tests.

6. **iCal File importer**
   - Implement file configuration and content loading strategy.
   - Normalize uploaded file events through shared iCalendar parser.
   - Add file importer tests.

7. **Provider-independent synchronization engine**
   - Implement source-scoped sync lifecycle.
   - Implement create/update/delete diff application.
   - Implement source success/failure metadata updates.
   - Ensure failed sync deletes nothing.

8. **Calendar query filtering**
   - Filter event reads by source enabled state and health status.
   - Ensure imported events are read-only.
   - Add calendar read tests for disabled, failed, and never-synced provider sources.

9. **Refresh APIs**
   - Implement refresh source.
   - Implement refresh all with per-source results.
   - Add API tests.

10. **Backup/restore updates**
    - Include source configuration.
    - Exclude imported events.
    - Restore sources as hidden until successful sync where appropriate.
    - Add backup/restore tests.

11. **Background synchronization**
    - Implement hosted scheduler.
    - Use source `PollInterval` choice and due metadata.
    - Prevent concurrent sync for the same source.
    - Add scheduler tests with controlled clock.

12. **Settings UI integration**
    - Add Calendar Sources settings UI using source management and refresh APIs.
    - Show name, icon, source type, enabled state, poll interval choice, health status, last sync, and error information.
    - Add Refresh All action.
    - Follow viewport-first workflow before any primary page layout changes.

# Open Questions

The following are implementation details, not architecture blockers:

1. Exact iCal file storage strategy: database text/blob, filesystem reference, or existing file storage abstraction if one exists.
2. Whether manual refresh of disabled sources should be allowed. Automatic background sync must skip disabled sources; a manual refresh could either be blocked until enabled or allowed as a diagnostic action. The source remains hidden while disabled either way.
3. Exact secret-handling strategy for future authenticated providers. DTOs and backups must not expose raw secrets.
4. Exact recurrence coverage for imported iCalendar events in the MVP. Unsupported recurrence shapes should fail the source or skip affected events according to a future product decision; the synchronization architecture remains unchanged.

# References

- `docs/reports/2026-07-05-calendar-source-architecture-analysis/calendar-source-architecture-analysis.md`
- `docs/reports/2026-07-05-calendar-source-integration-analysis/calendar-source-integration-analysis.md`
- `docs/reports/2026-07-05-eventsource-domain-analysis/eventsource-domain-analysis.md`
- `docs/reports/2026-07-05-calendar-source-sync-analysis/calendar-source-sync-analysis.md`
- `.github/copilot-instructions.md`
- `AGENTS.md`
