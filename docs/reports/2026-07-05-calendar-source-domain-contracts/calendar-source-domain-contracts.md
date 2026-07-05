# Summary

Implemented the Calendar Sources domain model and contract foundation slice. The work finalizes provider-neutral vocabulary, adds source-management contract records for later API slices, represents the system manual source as an explicit domain invariant, and keeps synchronization, source-management endpoints, refresh endpoints, and UI out of scope.

# Implemented

- Finalized provider-neutral terminology in shared contracts and existing adapters by replacing external event/source terminology with `ProviderEventId` and `ProviderSourceId`.
- Added contract enums for source type, source health, and poll interval using canonical values including `EveryHour`, `Every8Hours`, and `EveryDay`.
- Added source list/detail, create/update request, provider configuration, and sync result contract records for later API slices.
- Added discriminated provider configuration contracts for iCal Feed and iCal File.
- Regenerated OpenAPI and the NSwag TypeScript client after contract terminology changes.

# Domain Invariants

- Added `EventSource.IsSystem` as an explicit domain/persistence flag.
- Added `EventSource.IsSystemManualSource`, which identifies the protected system manual source through `IsSystem == true` and `SourceType == Manual` rather than relying on `SourceType == Manual` alone.
- Added a filtered unique index on `(HouseholdId, IsSystem)` for system sources, and migrated the existing seeded manual source to `IsSystem = true`.
- This represents the future deletion-protection invariant independently from the existence of user-created manual sources.

# Contract Changes

- `EventSourceType` now includes Calendar Sources source families: `Manual`, `ICalFeed`, `ICalFile`, `GoogleCalendar`, `CalDav`, `Exchange`, `SchoolHolidays`, `TvSeries`, and `Provider`.
- Existing compatibility-only `Birthdays` remains available because existing read-only source adapter tests still depend on it.
- Existing normalized event and source contracts now expose `ProviderEventId` and `ProviderSourceId` instead of external terminology.
- Generated OpenAPI and the generated TypeScript API client were updated to match provider-neutral terminology.

# Validation

- Added `EventSourceContractValidation` helpers for supported source types, health statuses, poll interval choices, manual-source provider configuration exclusion, required iCal Feed URL, and required iCal File reference/filename/hash fields.
- Validation remains a contract/domain helper only and is not wired into endpoints in this slice.

# Tests

- Added domain/contract tests for canonical poll interval names, absence of `Disabled` health status, separation of `IsEnabled` from health, system manual invariant representation, provider-neutral JSON serialization, provider configuration shape, and validation helper behavior.
- Updated existing source adapter tests and event framework tests for provider-neutral contract terminology.
- Updated persistence tests to verify the system manual source flag and index.

# Risks

- The explicit system-source flag is persisted before deletion APIs exist so later source-management slices can enforce deletion protection without depending on source type uniqueness.
- Existing frontend contract models were updated only for provider-neutral terminology and generated client alignment; no UI behavior or screens were implemented.
- Source management endpoints, refresh endpoints, synchronization, iCal parsing/importing, calendar filtering, backup/restore expansion, and Settings UI remain unimplemented for later slices.

# Modified Files

- `src/HomeOps.Api/CalendarEvents/EventSource.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeriesNormalizer.cs`
- `src/HomeOps.Api/Data/HomeOpsDbContext.cs`
- `src/HomeOps.Api/EventSources/Birthdays/BirthdaySourceAdapter.cs`
- `src/HomeOps.Api/EventSources/GoogleCalendar/GoogleCalendarAdapter.cs`
- `src/HomeOps.Api/Migrations/20260705152337_AddCalendarSourceDomainContracts.cs`
- `src/HomeOps.Api/Migrations/20260705152337_AddCalendarSourceDomainContracts.Designer.cs`
- `src/HomeOps.Api/Migrations/HomeOpsDbContextModelSnapshot.cs`
- `src/HomeOps.Contracts/Events/*`
- `src/HomeOps.Contracts/openapi.json`
- `src/HomeOps.Client/src/api/homeOpsApiClient.ts`
- `src/HomeOps.Client/src/agenda/calendarEventsApi.ts`
- `src/HomeOps.Client/src/events/eventSourceModel.ts`
- `src/HomeOps.Client/src/events/eventSourceExamples.ts`
- `src/HomeOps.Client/src/demo/demoAgendaData.ts`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarSourceDomainContractsTests.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/CalendarSourcePersistenceFoundationTests.cs`
- `tests/HomeOps.Api.Tests/EventSources/BirthdaySourceAdapterTests.cs`
- `tests/HomeOps.Api.Tests/EventSources/GoogleCalendarAdapterTests.cs`
- `tests/HomeOps.Api.Tests/Events/EventFrameworkModelTests.cs`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
