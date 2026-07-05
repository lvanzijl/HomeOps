# Summary

This analysis recommends integrating iCal feeds and uploaded iCal files as normal persisted calendar `EventSource` records, while keeping manual events editable and keeping imported events read-only.

The recommendation extends the previous architecture report: the current backend already centers calendar persistence on `EventSource`, `EventSeries`, and `EventException`; manual create/update/delete already gates writes by `EventSource.IsWritable`; source-shaped contracts and adapters already exist; agenda layer settings already store visibility by `SourceId`; and calendar backup/restore already treats sources and series separately.

At the architecture level, the best fit is to reuse persisted `EventSource` as the ownership and lifecycle boundary for iCal sources, reuse `EventSeries` for imported event storage, extend source metadata to represent external configuration, enabled/failed state, and synchronization identity, and keep manual event semantics unchanged.

# Existing Architecture Being Extended

The previous report established these facts that constrain the integration approach:

- Persisted calendar data is centered on `EventSource`, `EventSeries`, and `EventException`.
- Persisted `EventSource` currently has `Id`, `HouseholdId`, `Name`, `SourceType`, `IsWritable`, timestamps, and related `EventSeries`.
- Persisted `EventSeries` belongs to one `EventSource` through `EventSourceId` and contains title, description, all-day flag, date/time range, recurrence type, exceptions, and timestamps.
- Manual event writes already select a writable source with `SourceType == "manual"` for creation and require `EventSource.IsWritable` for update/delete.
- Event reads currently query persisted `EventSeries` for the household and project those series to normalized events.
- `EventSeries` deletion cascades from `EventSource`, so source ownership already maps to event lifecycle ownership.
- Agenda layer settings already store per-device visibility using `SourceId` and `IsEnabled` for `Week` and `Months` views.
- Contract-level `EventSource` already includes enabled, capability, visibility, color, type, and optional external source ID metadata.
- `IEventSourceAdapter` already models an event-producing source abstraction through `GetEventSource()` and `GetEvents()`.
- Calendar export/restore already serializes event sources separately from event series.
- No persisted hidden/disabled field, failed-source state, iCal support, or calendar background processing currently exists.

# Integration Options

## Option A: Persist iCal sources as normal EventSources and imported events as EventSeries

In this option, iCal feeds and uploaded iCal files become persisted `EventSource` rows. Imported calendar entries become persisted `EventSeries` rows owned by those sources. Source-level metadata records source configuration, enabled state, failure state, and synchronization identity. Imported sources use `IsWritable = false`.

This option matches the existing ownership model because event series already belong to event sources, update/delete for manual events already depends on source writability, and removing a source already has the right aggregate boundary for removing its events.

Trade-off: `EventSource` needs additional fields because the current persisted source entity only stores name, type, writability, and timestamps. It does not yet store enabled state, failure state, external configuration, sync metadata, color, visibility, or external source identity.

## Option B: Store iCal sources separately and merge them at query time

In this option, iCal source configuration and imported event cache would live outside the existing `EventSource`/`EventSeries` model, and calendar reads would merge manual persisted events with imported source data.

This option avoids extending the current `EventSource` entity, but it duplicates a source concept that already exists in contracts, adapters, agenda layer settings, and persistence. It also weakens existing source-owned event lifecycle behavior because imported events would not naturally share the same `EventSourceId` ownership model used by manual events.

## Option C: Treat iCal feeds only as adapters with no imported event persistence

In this option, iCal feeds would participate only through an adapter-style runtime source, similar in shape to the existing Google Calendar and Birthday adapters, and calendar reads would invoke adapters directly.

This option aligns with `IEventSourceAdapter`, but it does not satisfy fixed product requirements that feed events are synchronized, removed feed entries are removed, failed sources expose state, and source configuration participates in backup/restore. Those requirements imply persisted source configuration, persisted sync status, and a stored representation of imported event state.

## Recommendation

Option A is recommended. It preserves the current persisted source/event architecture and uses existing boundaries rather than creating a parallel calendar model. `IEventSourceAdapter` should still participate as the source-normalization boundary, but persisted `EventSource` plus persisted `EventSeries` should remain the source of truth for calendar reads.

# Recommended Architecture

## 1. iCal feeds should become normal persisted EventSources

Yes. iCal feeds and uploaded iCal files should become normal persisted `EventSource` records.

This follows the previous report's finding that persisted calendar data is already organized around `EventSource` ownership, and that `EventSeries` already belongs to `EventSource` through `EventSourceId`. It also aligns with the contract-level event source concept, which already has source type, enabled, capability, visibility, color, and external source ID metadata.

A normal persisted source gives iCal feeds the same ownership boundary as manual events: source removal can remove owned imported events, source visibility can be expressed by source ID, and source read-only status can use the same writability guard that already protects manual update/delete.

## 2. Existing EventSource fields that can be reused unchanged

The existing persisted source fields that should be reused unchanged are:

- `Id`: the stable HomeOps source identifier and the source key used by event series and layer settings.
- `HouseholdId`: the household ownership boundary.
- `Name`: the display name for the source.
- `SourceType`: the origin family discriminator; iCal feed and iCal file sources fit this existing pattern as new source types.
- `IsWritable`: the existing editability gate; iCal imported sources should use `false`, and manual sources should remain `true`.
- `CreatedUtc` and `UpdatedUtc`: existing source lifecycle timestamps.
- `EventSeries`: the existing source-owned event collection.

These fields map directly to the fixed requirements that imported events are read-only, manual events remain editable, and removing a source removes imported events.

## 3. New fields needed on EventSource

The current persisted `EventSource` is too small for external source lifecycle requirements. At the architecture level, it needs additional source-level metadata in these categories:

- Source enablement: a persisted enabled/disabled flag so disabled sources can remain stored while hidden from calendar output.
- Failure state: status fields that distinguish healthy, failed, and possibly never-synced sources, plus failure details suitable for exposing failure state.
- Synchronization metadata: last successful sync time, last attempted sync time, and source revision/fingerprint metadata where available.
- External identity/configuration: external source identifier and source configuration needed to reconnect or reprocess the source.
- Source presentation metadata: persisted color and visibility defaults if the contract-level source metadata should become durable rather than hard-coded by `EventSeriesNormalizer`.

The previous report found no persisted hidden/disabled flag or failed-source state, while the product requirements explicitly require disabled sources to be hidden but stored and failed sources to be hidden with exposed failure state. Those requirements belong on the source boundary because visibility, failure, refresh, removal, and configuration are source-level concepts.

## 4. Imported events should remain EventSeries

Imported iCal entries should remain stored as `EventSeries`, not as a separate event persistence model.

The existing `EventSeries` model already contains the normalized event fields needed by calendar reads: source reference, title, description, all-day flag, start/end date and time, recurrence type, exceptions, and timestamps. Event reads already query persisted event series and project them into normalized events. Keeping imported events as event series preserves the existing query and projection architecture.

The main extension need is not a separate model; it is additional import identity and synchronization metadata for imported series. The architecture needs to know which imported row corresponds to which external iCal component so synchronized updates can update the same stored event, removed feed entries can be removed, and duplicate imports can be avoided.

A separate imported-event table would create a parallel event lifecycle and require calendar reads to merge two event models. That conflicts with the current architecture, where event source ownership and event projection already flow through `EventSeries`.

## 5. Existing services that can be reused

The existing occurrence and normalization services can be reused for imported events after imported data is represented as `EventSeries`:

- `EventOccurrenceGenerator` can continue expanding stored event series into occurrences.
- `EventSeriesNormalizer` can continue converting persisted sources and series into contract shapes, though it needs source metadata to avoid hard-coded manual-only values.
- `EventOccurrenceProjector` can remain the manual request-to-series projection path for manual event editing.
- `CalendarPortabilityService` can remain the export/restore boundary for calendar backup and restore, with the source/event split preserved.
- `AgendaLayerSettings` can continue representing per-device layer visibility by `SourceId`.

## 6. Services that should be extended

The services that should be extended at the architecture level are:

- Source normalization: `EventSeriesNormalizer.ToContract` should represent persisted source type, enabled state, capability, visibility, color, and external identity from persisted source metadata rather than assuming every persisted source is manual, enabled, household-visible, and indigo.
- Calendar event query composition: the event read path should account for source-level enabled and failed states so disabled or failed sources are hidden while stored.
- Calendar portability: backup/restore should include source configuration and source state needed to restore configured sources, while excluding imported event series from backup/restore as required.
- Source synchronization application: a calendar source application service boundary should own converting adapter output into persisted source-owned `EventSeries`, including update and removal semantics for imported events.

These are architectural extension points, not API or migration designs.

## 7. IEventSourceAdapter participation

`IEventSourceAdapter` should participate as the normalization boundary between a source-specific provider and HomeOps calendar data.

The current adapter abstraction already exposes source metadata through `GetEventSource()` and normalized events through `GetEvents()`. Existing Google Calendar and Birthday adapters demonstrate that source-specific payloads can be mapped into contract-level `EventSource` and `NormalizedEvent` shapes.

For iCal, an adapter should perform the same architectural role: interpret source-specific iCal input and produce normalized source metadata and normalized events. Persistence should not become source-format-specific; the application layer should translate adapter output into persisted `EventSource` and `EventSeries` records.

The adapter should not replace persisted calendar storage for feeds, because the fixed requirements include synchronization, removal of missing feed entries, failure state, and backup/restore of source configuration.

## 8. Future source types

Future source types should fit by using the same three-layer pattern:

1. Persisted `EventSource` stores source ownership, capability, lifecycle, visibility, status, and configuration metadata.
2. Source-specific adapters normalize external/provider-specific data into HomeOps event-source and event shapes.
3. Persisted `EventSeries` stores normalized calendar events owned by a source for calendar querying and occurrence projection.

This keeps future source types aligned with the existing modular monolith and avoids source-specific calendar query branches. Source-specific behavior remains at the adapter/synchronization boundary; calendar reads continue consuming stored source-owned event series.

## 9. Hidden/failed sources and AgendaLayerSettings

Hidden and failed source behavior should be source-level behavior first, with `AgendaLayerSettings` remaining a per-device layer preference.

The previous report found that agenda layer settings store per-device visibility by `SourceId` and `IsEnabled`, grouped by view type. That makes them suitable for user/device-specific visibility preferences, not for authoritative source lifecycle state.

Disabled sources should have a persisted source-level disabled state so they are hidden for all calendar consumers while remaining stored. Failed sources should have persisted source-level failure state so they are hidden consistently and can expose failure details. Agenda layer settings can still further hide or show healthy enabled sources per device/view, but they should not be the only place where disabled or failed state is represented.

This preserves the distinction between global source state and per-device presentation preferences.

## 10. Existing design that should remain unchanged

The following current design elements should explicitly remain unchanged:

- Manual events should remain stored as `EventSeries` owned by the writable manual source.
- Manual create should continue choosing a writable manual source.
- Manual update/delete should continue requiring a writable source.
- Imported iCal events should not become editable through manual event update/delete semantics.
- Event reads should continue returning normalized events projected from stored calendar data.
- `EventSourceId` should remain the ownership key connecting events, settings, source lifecycle, and source removal.
- `AgendaLayerSettings` should remain per-device/per-view layer preference data rather than becoming source configuration storage.
- Backup/restore should remain a calendar portability boundary, but its imported-event behavior should follow the fixed requirement: source configuration included, imported events excluded.
- The modular monolith shape should remain; iCal integration does not require microservices, CQRS, event sourcing, or distributed architecture.

# Existing Components To Reuse

- Persisted `CalendarEvents.EventSource` as the source ownership root.
- Persisted `EventSeries` as the stored event representation for manual and imported events.
- Persisted `EventException` for occurrence exceptions where imported recurrence handling needs stored exception semantics.
- `EventSourceId` as the cross-cutting source key for events, settings, and lifecycle.
- `IsWritable` as the editability guard separating manual editable sources from imported read-only sources.
- `EventOccurrenceGenerator` for occurrence expansion from stored series.
- `EventSeriesNormalizer` as the source/event-to-contract normalization location.
- `IEventSourceAdapter` as the source-specific normalization abstraction.
- `AgendaLayerSettings` as per-device/per-view source visibility preference storage.
- `CalendarPortabilityService` as the export/restore boundary.

# Components To Extend

- Persisted source metadata, to support enabled/disabled state, failure state, sync status, source configuration, external source identity, and durable presentation metadata.
- Persisted event-series import identity, to support synchronizing existing imported entries and removing entries that disappear from a feed.
- Source normalization, to stop assuming all persisted sources are manual and always enabled.
- Event query composition, to filter hidden/failed sources at source level before or during occurrence projection.
- Portability semantics, to include source configuration while excluding imported events.
- Adapter orchestration, to connect source-specific adapters to persisted source/event synchronization while keeping source-format details out of calendar reads.

# Components That Should Remain Unchanged

- Manual source writability semantics.
- Manual event create/update/delete ownership checks.
- The use of `EventSeries` as the calendar event storage model.
- The source-owned lifecycle in which source removal removes owned events.
- Agenda layer settings as per-device display preferences rather than source lifecycle state.
- Normalized event output as the calendar read contract shape.
- The backend architecture style: ASP.NET Core modular monolith with PostgreSQL persistence and OpenAPI/NSwag contracts.

# Trade-offs

## Persisted EventSource/EventSeries integration versus parallel imported-event storage

Using existing persisted `EventSource` and `EventSeries` maximizes reuse of current ownership, projection, settings, and backup/restore boundaries. It requires extending existing entities with source and import metadata.

Parallel imported-event storage avoids adding fields to existing entities, but it duplicates source and event concepts and requires merged calendar query logic. It also makes source removal and layer visibility less naturally aligned with existing `EventSourceId` behavior.

Recommendation: extend the existing persisted source/event model.

## Source-level hidden/failed state versus AgendaLayerSettings-only visibility

Source-level hidden/failed state provides consistent global behavior for disabled and failed sources and matches product requirements that disabled and failed sources are hidden while remaining stored.

AgendaLayerSettings-only visibility would reuse an existing table, but it is per-device/per-view and does not represent source health or global source lifecycle. It would also make failed-source hiding dependent on presentation preferences.

Recommendation: store disabled/failed state on the source and keep AgendaLayerSettings as additional per-device presentation filtering.

## Adapter-only feeds versus synchronized persisted feeds

Adapter-only feeds keep source-specific integration lightweight and align with the existing adapter abstraction. However, they do not naturally support removed-feed-entry deletion, durable failure state, backup/restore of source configuration, or imported-event exclusion from backup because there is no persisted imported event set to manage.

Synchronized persisted feeds require sync application logic and import identity metadata, but they satisfy the fixed product requirements and preserve calendar reads as persisted-data reads.

Recommendation: use adapters to normalize source data, then synchronize adapter output into persisted source-owned event series.

# Risks

- The current persisted `EventSource` has a unique index on `(HouseholdId, SourceType)`, while multiple iCal feeds or files would share the same source type. The architecture needs multiple sources of the same type, so this existing persistence rule is incompatible with the product requirement as-is.
- The current persisted source has no enabled/disabled or failure-state fields, so source visibility and failure behavior cannot be represented without extending source metadata.
- The current `EventSeries` model has no external/import identity fields, so feed synchronization cannot reliably update existing imported entries or remove missing entries without extending imported-event metadata.
- The current source normalizer hard-codes persisted sources as manual, enabled, household-visible, and one color, so external source metadata would be lost unless source normalization is extended.
- Backup/restore currently exports all event series. The fixed requirement says imported events are excluded while source configuration is included, so portability behavior must distinguish manual event data from imported event cache data.
- No calendar background processing infrastructure exists today, while product requirements include automatic polling. The architecture needs a background processing boundary, but this report intentionally does not design polling.

# Files Referenced

- `docs/reports/2026-07-05-calendar-source-architecture-analysis/calendar-source-architecture-analysis.md`
- `.github/copilot-instructions.md`
- `AGENTS.md`
