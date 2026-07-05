# Summary

Implemented the Calendar Sources persistence foundation slice from the canonical technical design. The slice is limited to persisted entities, EF Core mapping, migration defaults, and persistence tests.

# Implemented

- Added EventSource lifecycle, provider health, enabled state, poll interval, sync metadata, provider identity, and icon persistence fields.
- Added EventSeries imported-event identity and synchronization metadata fields.
- Added the shared provider configuration abstraction with persisted iCal feed and iCal file configuration records.
- Replaced the unique household/source-type index with non-unique source-type indexing and added the source visibility/scheduling indexes required by the design.
- Added the filtered unique provider-event index scoped by EventSource.

# Migration

- Added EF Core migration `20260705151231_AddCalendarSourcePersistenceFoundation`.
- Existing manual source rows receive `Icon = 📅`, `IsEnabled = true`, `HealthStatus = Healthy`, `PollInterval = Every8Hours`, and `SourceType = Manual`.
- Existing manual EventSeries rows keep imported-event metadata null.
- Existing manual EventSeries remain attached to the manual source.

# Persistence Changes

- EventSources now store source lifecycle, health, polling, sync timestamps, failure metadata, provider identity, and display icon.
- EventSeries now stores optional imported-provider identity, revision, content fingerprint, import timestamps, last-seen sync marker, and location.
- Provider configuration persistence is modeled through `EventSourceConfiguration` with provider-specific iCal feed and iCal file tables.
- Provider configuration and EventSeries rows cascade delete with their owning source.

# Tests

- Added SQLite-backed persistence tests for EventSource fields, EventSeries imported metadata, provider configurations, source-type multiplicity, provider-event uniqueness, provider-event reuse across sources, cascade delete, required indexes, and manual migration defaults.
- Ran the full .NET test suite.

# Risks

- Provider configuration persistence uses EF Core TPT mapping, which creates the shared configuration table plus provider-specific tables. This preserves the shared abstraction while keeping provider-specific fields outside EventSource.
- Synchronization, importers, APIs, DTO expansion, calendar filtering, backup/restore expansion, and frontend UI remain intentionally unimplemented for later slices.

# Modified Files

- `src/HomeOps.Api/CalendarEvents/EventSource.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeries.cs`
- `src/HomeOps.Api/CalendarEvents/EventSourceHealthStatus.cs`
- `src/HomeOps.Api/CalendarEvents/EventSourcePollInterval.cs`
- `src/HomeOps.Api/CalendarEvents/EventSourceTypes.cs`
- `src/HomeOps.Api/CalendarEvents/EventSourceConfiguration.cs`
- `src/HomeOps.Api/CalendarEvents/ICalFeedSourceConfiguration.cs`
- `src/HomeOps.Api/CalendarEvents/ICalFileSourceConfiguration.cs`
- `src/HomeOps.Api/Data/HomeOpsDbContext.cs`
- `src/HomeOps.Api/Migrations/20260705151231_AddCalendarSourcePersistenceFoundation.cs`
- `src/HomeOps.Api/Migrations/20260705151231_AddCalendarSourcePersistenceFoundation.Designer.cs`
- `src/HomeOps.Api/Migrations/HomeOpsDbContextModelSnapshot.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeriesEndpoints.cs`
- `src/HomeOps.Api/CalendarEvents/CalendarPortabilityService.cs`
- `src/HomeOps.Api/VisualReviewFixtures/MarketingHouseholdFixtureBuilder.cs`
- `src/HomeOps.Api/VisualReviewFixtures/VisualReviewFixtureService.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarSourcePersistenceFoundationTests.cs`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
