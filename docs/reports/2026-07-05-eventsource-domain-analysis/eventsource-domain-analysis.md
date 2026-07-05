# Summary

This report analyzes whether the existing persisted `EventSource` is suitable as the long-term aggregate root for external calendar sources.

The current persisted `EventSource` is already the ownership boundary for stored calendar events: `EventSeries` rows reference `EventSourceId`, `EventSeries` cascades on source deletion, manual writes are guarded by source writability, source IDs are exposed to clients, and source IDs are used by agenda layer settings. Those responsibilities make `EventSource` the correct domain root for a configured calendar source.

However, the current entity is too small for the full long-term source aggregate. It only stores identity, household ownership, display name, provider/type string, writability, timestamps, and child event series. It does not store enabled/disabled state, failure state, external identity, source configuration, synchronization state, durable presentation metadata, or per-import identity. The existing unique index on `(HouseholdId, SourceType)` also prevents multiple configured sources of the same type, which conflicts with multiple iCal feeds or files.

Recommendation: keep `EventSource` as the aggregate root for configured calendar sources, treat `SourceType` as a provider/category discriminator rather than an individual source identity, remove the one-source-per-type assumption from the domain model, add only generic lifecycle/status/presentation fields directly to `EventSource`, and place provider-specific configuration in separate source configuration data associated with the source.

# Current EventSource Responsibilities

## Persisted model

The persisted backend source model is `HomeOps.Api.CalendarEvents.EventSource`. It has `Id`, `HouseholdId`, optional `Household`, `Name`, `SourceType`, `IsWritable`, `CreatedUtc`, `UpdatedUtc`, and an `EventSeries` collection.

The EF model maps `EventSource` to `EventSources`, keys it by `Id`, requires `Name`, `SourceType`, `IsWritable`, `CreatedUtc`, and `UpdatedUtc`, relates it to `Household`, and currently indexes `(HouseholdId, SourceType)` as unique.

## Event ownership

`EventSeries` has a required foreign key to `EventSourceId` and is configured with a cascade delete relationship from source to series. This makes source removal the existing persistence boundary for owned events.

Calendar reads query `EventSeries` by traversing to `EventSource.HouseholdId`, then project event series into normalized events. The query does not currently filter by source type, enabled state, or failure state.

## Manual write boundary

Manual event creation looks for the first event source where the source belongs to the seeded household, `IsWritable` is true, and `SourceType == "manual"`. Manual event update and delete load the event series with its source and require `EventSource.IsWritable`.

This means `IsWritable` is already a generic editability rule on the source aggregate. Manual events are editable because their source is writable, not because the event row itself has a manual-event subtype.

## Portability boundary

Calendar export serializes sources separately from event series. Exported source data currently contains `Id`, `Name`, `SourceType`, `IsWritable`, `CreatedUtc`, and `UpdatedUtc`.

Calendar restore removes existing series for the household, removes existing sources for the household, and then recreates sources and series from the document. Restore validation requires source IDs to be unique and requires source ID, name, and source type, but validation does not explicitly enforce unique source type; the EF unique index enforces that at persistence time.

## Contract and adapter model

The contract-level `HomeOps.Contracts.Events.EventSource` is richer than the persisted source. It contains stable source ID, display name, typed source family, enabled flag, capability, visibility metadata, color metadata, and optional external source ID.

`IEventSourceAdapter` exposes `GetEventSource()` and `GetEvents()`. Existing Google Calendar and Birthday adapters each produce a contract event source and normalized events, but these adapters are not wired into persisted calendar reads in the current backend reports and inspected code.

# Existing Dependencies

## Code that directly depends on one writable manual source

Manual event creation depends on being able to select a writable source with `SourceType == "manual"`. It orders by `CreatedUtc` and takes the first matching source. This query would still work if multiple manual sources existed, but it would choose one implicitly. The current unique index prevents multiple manual sources per household in persistence.

Seed data creates exactly one source for the seeded household: `HomeOps Calendar` with `SourceType = "manual"` and `IsWritable = true`.

Manual event API tests expect the seeded manual source to be returned and create test data using a single manual source. Visual review fixtures also add one manual calendar source for their scenario data.

## Code that depends on SourceType as a persistence discriminator

The creation endpoint uses the string value `"manual"` to locate the manual writable source.

The EF model treats `SourceType` as a required string with maximum length 80 and includes it in the unique index with `HouseholdId`.

Calendar export/restore treats `SourceType` as source data by exporting and restoring it. Restore validation requires non-blank source type, but does not map it to the contract enum or validate it against a fixed list.

## Code that does not depend on one source per SourceType

Calendar event reads do not depend on one source per type. They query all event series for the household through the source relationship.

Update and delete do not depend on `SourceType`; they depend on source household ownership and `IsWritable`.

Agenda layer settings do not depend on `SourceType`; they use `SourceId` strings and per-view `IsEnabled` values.

The contract-level event source model does not require one source per type. It has both an `Id` and a `Type`, which separates individual source identity from provider family.

Google Calendar and Birthday adapter configurations each include a `SourceId` plus a display name and enabled flag, which also separates configured source identity from source family.

# SourceType Analysis

## Current persisted SourceType

Persisted `SourceType` is a required string on `CalendarEvents.EventSource`. The only seeded persisted value found is `"manual"`.

Current backend code has one hard-coded persisted source-type dependency: manual event creation filters by `SourceType == "manual"` as part of selecting the writable manual source.

No current persisted code was found that maps persisted `SourceType` to the contract `EventSourceType` enum. Instead, `EventSeriesNormalizer.ToContract` always returns `EventSourceType.Manual` for every persisted source.

## Contract SourceType

The contract enum `EventSourceType` represents source origin families: `Manual`, `GoogleCalendar`, `Birthdays`, `TvSeries`, `SchoolHolidays`, and `External`.

The enum names describe provider/category families, not individual configured instances. That conclusion is supported by the contract event source having a separate stable `Id`, and by adapter configurations having a separate `SourceId`.

## Provider category versus individual configured source

`SourceType` should represent a provider/category, not an individual configured source.

Reasons from current code:

- The persisted entity already has `Id` for individual source identity.
- The contract event source already has both `Id` and `Type`.
- Adapter configurations already have `SourceId` separate from provider-specific details.
- Agenda layer settings key visibility by `SourceId`, not by source type.

Treating `SourceType` as individual configured source identity would duplicate `Id` and conflict with existing `SourceId` usage across contracts, adapters, event rows, and settings.

## ICalFeed/ICalFile versus External

Two approaches exist:

### Approach A: Add distinct source families for iCal feed and iCal file

This makes source origin explicit in the source family discriminator. It supports different labels, validation rules, and configuration shapes for feed URL sources and uploaded file sources while preserving a shared source aggregate.

Trade-off: the source-type vocabulary grows as new provider categories are added.

### Approach B: Use `External` for both iCal feeds and iCal files

This reuses the existing contract enum value and avoids adding source-family vocabulary. It fits if `External` is intended as the long-term bucket for all non-built-in imported calendars.

Trade-off: feed and file source origins become indistinguishable at the source-type level. The difference would have to live in provider-specific configuration, which weakens the usefulness of `SourceType` for domain rules and source presentation.

### Recommendation

Use distinct provider/category source types for iCal feed and iCal file, not `External` for both, if HomeOps needs first-class iCal behavior. The current enum already distinguishes provider categories such as `GoogleCalendar`, `Birthdays`, `TvSeries`, and `SchoolHolidays`; iCal feed and iCal file are comparable source families. Keep `External` as a fallback for sources that do not have first-class provider semantics.

This recommendation is domain-level only; it does not specify enum, API, or persistence changes.

# Unique Index Analysis

## What the index does

The EF mapping defines a unique index on `(HouseholdId, SourceType)` for persisted `EventSource`. In the current model, this enforces at most one source of a given source type per household.

## Why the index exists

Not found in the current implementation.

No comment, test, or domain rule was found that explains why `(HouseholdId, SourceType)` is unique. The code shows the rule exists in EF mapping and historical migrations, and the current seed data contains one manual source. The implementation does not contain a textual rationale.

## Whether uniqueness is intentional for built-in sources

Not found in the current implementation.

The current persisted data contains one built-in manual source, and manual creation finds a writable manual source by source type. That is consistent with a one-manual-source model, but no inspected code states that built-in source types must be unique forever.

## Existing code that depends on one source per SourceType

Strong dependency:

- The EF unique index enforces one source per `(HouseholdId, SourceType)`.

Behavioral dependency:

- Manual creation uses `SourceType == "manual"`, orders matching sources by creation time, and chooses the first writable source. Because the unique index prevents multiple manual sources per household, this currently behaves as one manual source.

Test/fixture assumptions:

- Seed data creates one manual source.
- Manual event API and persistence tests assert or construct one manual source in their scenarios.
- Visual review and marketing fixture builders add one manual source.

Non-dependencies:

- Event reads do not depend on one source per type.
- Update/delete depend on `IsWritable`, not source type.
- Agenda layer settings depend on source ID, not source type.
- Contract event source identity is source ID, not type.
- Adapter configurations have source IDs, not only source types.

## Fit for multiple iCal feeds

Multiple iCal feeds do not naturally fit the current persisted model while `(HouseholdId, SourceType)` remains unique if all feeds share the same source type.

They do naturally fit the rest of the model: individual source IDs, source-owned event series, source-based visibility settings, and read-only source capability all support multiple configured sources. The blocking issue is the uniqueness rule and missing source metadata, not the aggregate relationship itself.

# Aggregate Evaluation

## Generic fields already present

The fields that are truly generic on persisted `EventSource` are:

- `Id`: individual configured source identity.
- `HouseholdId`: household ownership.
- `Name`: display name.
- `SourceType`: provider/category discriminator.
- `IsWritable`: source-level edit capability.
- `CreatedUtc` and `UpdatedUtc`: lifecycle timestamps.
- `EventSeries`: owned imported/manual event collection.

These fields are not specific to manual events; they apply to configured calendar sources generally.

## Generic metadata that belongs directly on EventSource

Metadata belongs directly on `EventSource` when it controls cross-provider source lifecycle, source visibility, source status, or source presentation consistently across source types.

Based on existing contract fields and current gaps, the generic source metadata that belongs directly on `EventSource` is:

- Enabled/disabled state, because disabled sources are a source-level lifecycle state and agenda settings are per-device preferences rather than authoritative source state.
- Failure/health state summary, because failed-source hiding and failure exposure are source-level behavior.
- Last attempted and last successful synchronization timestamps, because sync status is common to synchronized external sources.
- External source ID, because the contract already has optional `ExternalSourceId`, and adapters such as Google Calendar already expose provider identity separately from HomeOps source ID.
- Presentation defaults such as color and default visibility/group, because the contract already models source color and visibility but persisted normalization currently hard-codes them.

## Metadata that should live in separate configuration data

Provider-specific or potentially sensitive connection/configuration data should live outside the generic `EventSource` fields and be associated with the source.

Examples by category:

- iCal feed URL and feed-specific HTTP retrieval details.
- Uploaded file storage/reference metadata and file-specific import details.
- Provider-specific credentials or tokens, if a provider requires them in the future.
- Provider-specific recurrence/import options that are not generic across source families.
- Provider-specific metadata objects like existing `GoogleCalendarSourceMetadata` or `BirthdaySourceMetadata` shapes.

Reasoning from current code: existing adapter configurations are provider-specific records (`GoogleCalendarSourceConfiguration`, `BirthdaySourceConfiguration`) rather than fields on the contract event source. Existing adapter metadata types are also provider-specific. That pattern supports keeping generic source lifecycle on `EventSource` and provider-specific configuration in source-specific configuration data.

## Aggregate-root suitability

`EventSource` already satisfies several aggregate-root responsibilities:

- It owns event series through `EventSourceId` and cascade delete.
- It scopes events to a household.
- It carries editability through `IsWritable`.
- It is the identifier used by event projection, normalized events, and agenda layer settings.
- It is exported/restored as a first-class calendar record separate from event series.

`EventSource` is currently too small to satisfy the full long-term aggregate responsibilities for external calendar sources because it lacks enabled state, failure state, source configuration association, synchronization metadata, durable presentation metadata, and support for multiple sources of the same provider category.

# Recommended Evolution

Keep `EventSource` as the aggregate root for configured calendar sources.

Evolve the domain meaning as follows:

- `EventSource.Id` remains the individual configured source identity.
- `SourceType` means provider/category family, not configured source instance.
- Multiple sources with the same provider/category should be allowed when the provider category is naturally multi-instance, such as iCal feeds, uploaded iCal files, Google calendars, or other future external sources.
- Built-in singleton concepts, if required, should be represented by explicit domain rules for those concepts rather than by making source type globally unique per household for every provider category.
- Generic lifecycle/status/presentation metadata belongs on `EventSource`.
- Provider-specific configuration belongs in associated source configuration data rather than directly on `EventSource`.
- Manual events remain attached to the writable manual source and keep their existing writability semantics.

This is a domain recommendation only. It does not define APIs, polling, migrations, or implementation steps.

# Trade-offs

## EventSource as aggregate root versus a new CalendarSource aggregate

Keeping `EventSource` as the aggregate root reuses existing event ownership, event read composition, agenda layer settings, export/restore shape, and editability rules. It requires expanding the currently small entity.

Creating a separate `CalendarSource` aggregate would avoid changing the meaning of the current entity, but it would duplicate an already-used source concept and require bridging between `CalendarSource`, `EventSourceId`, event series ownership, agenda settings, contracts, and adapters.

Recommendation: keep `EventSource` as the aggregate root.

## Generic source fields versus provider-specific configuration fields

Putting all metadata directly on `EventSource` makes querying simple but risks turning the source entity into a provider-specific catch-all with many nullable fields.

Keeping only generic lifecycle/status/presentation fields on `EventSource` and placing provider-specific settings in associated configuration data keeps the aggregate root stable across future source types. It requires joining or loading configuration when source-specific behavior is needed.

Recommendation: generic fields on `EventSource`; provider-specific configuration outside the generic source fields.

## Distinct iCal source types versus External

Distinct iCal source types make domain behavior clearer for first-class iCal feed/file support and match the existing contract enum style of named provider families. They increase source-type vocabulary.

Using `External` avoids expanding the source-type vocabulary but makes first-class iCal feed/file distinctions depend entirely on separate configuration data.

Recommendation: use first-class provider/category types for iCal feed and iCal file if both are product-supported source families; reserve `External` for uncategorized or generic external sources.

## One source per type versus multiple configured sources per type

One source per type is simple and matches the current single manual source seed. It cannot represent multiple feeds of the same provider category.

Multiple configured sources per type matches iCal feeds/files and existing contract/adapters where source ID is distinct from source type. It requires source identity, display name, and provider configuration to carry individual source meaning.

Recommendation: multiple configured sources per provider category should be part of the long-term source domain.

# Risks

- Current persistence enforces one source per `(HouseholdId, SourceType)`, which conflicts with multiple iCal feeds/files sharing a provider category.
- Manual creation currently uses `SourceType == "manual"` and chooses the first writable source; if multiple manual sources ever become possible, that behavior would need a domain rule for the default manual source. Not found in the current implementation.
- Current source normalization hard-codes every persisted source as contract `Manual`, enabled, household-visible, and one color; this would hide source-domain distinctions unless normalization is evolved.
- Backup/restore currently exports and restores only the small source shape, so future source configuration would not be represented by the existing DTO shape.
- The current entity has no failure or disabled state, so it cannot alone satisfy source hiding/failure requirements until the aggregate grows.
- Provider-specific configuration directly on `EventSource` would risk making the aggregate unstable as future providers are added.

# Files Inspected

- `.github/copilot-instructions.md`
- `AGENTS.md`
- `docs/reports/2026-07-05-calendar-source-architecture-analysis/calendar-source-architecture-analysis.md`
- `docs/reports/2026-07-05-calendar-source-integration-analysis/calendar-source-integration-analysis.md`
- `src/HomeOps.Api/CalendarEvents/EventSource.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeries.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeriesEndpoints.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeriesNormalizer.cs`
- `src/HomeOps.Api/CalendarEvents/CalendarExportDtos.cs`
- `src/HomeOps.Api/CalendarEvents/CalendarPortabilityService.cs`
- `src/HomeOps.Api/CalendarEvents/SeedCalendarEvents.cs`
- `src/HomeOps.Api/Data/HomeOpsDbContext.cs`
- `src/HomeOps.Api/EventSources/IEventSourceAdapter.cs`
- `src/HomeOps.Api/EventSources/GoogleCalendar/GoogleCalendarAdapter.cs`
- `src/HomeOps.Api/EventSources/GoogleCalendar/GoogleCalendarSourceConfiguration.cs`
- `src/HomeOps.Api/EventSources/GoogleCalendar/GoogleCalendarSourceMetadata.cs`
- `src/HomeOps.Api/EventSources/Birthdays/BirthdaySourceAdapter.cs`
- `src/HomeOps.Api/EventSources/Birthdays/BirthdaySourceConfiguration.cs`
- `src/HomeOps.Api/EventSources/Birthdays/BirthdaySourceMetadata.cs`
- `src/HomeOps.Api/VisualReviewFixtures/VisualReviewFixtureService.cs`
- `src/HomeOps.Api/VisualReviewFixtures/MarketingHouseholdFixtureBuilder.cs`
- `src/HomeOps.Contracts/Events/EventSource.cs`
- `src/HomeOps.Contracts/Events/EventSourceType.cs`
- `src/HomeOps.Contracts/Events/EventSourceCapability.cs`
- `src/HomeOps.Contracts/Events/EventSourceVisibility.cs`
- `src/HomeOps.Contracts/Events/EventSourceColor.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/ManualEventApiTests.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/ManualEventPersistenceTests.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarPortabilityTests.cs`
- `tests/HomeOps.Api.Tests/EventSources/GoogleCalendarAdapterTests.cs`
- `tests/HomeOps.Api.Tests/EventSources/BirthdaySourceAdapterTests.cs`
- `tests/HomeOps.Api.Tests/Events/EventFrameworkModelTests.cs`
