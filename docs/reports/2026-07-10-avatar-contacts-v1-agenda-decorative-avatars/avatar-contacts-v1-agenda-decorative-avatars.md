# Summary

Implemented Avatar Contacts V1 Slice 9 by adding optional decorative avatar references to Agenda event series and projecting them through Agenda APIs and UI. Decorative avatars remain local presentation metadata only and do not represent ownership, organiser, attendee, permissions, recipient, participation, or responsibility.

# Implemented

- Added nullable `DecorativeAvatarReferenceType` / `DecorativeAvatarReferenceId` persistence to `EventSeries`.
- Added EF model configuration, index, and nullable-pair check constraint for Agenda event series.
- Regenerated the EF migration/model snapshot, OpenAPI document, and TypeScript API client.
- Added Agenda DTO/request fields for create/update/read and normalized event projections.
- Added frontend Agenda API mapping for decorative avatar references.
- Added Agenda form integration using the shared `DecorativeAvatarPicker` and row rendering using `DecorativeAvatarBadge`.
- Added backend and frontend tests covering Agenda decorative-avatar mapping and recurring occurrence projection.

# Agenda Integration

Agenda events store the shared nullable decorative avatar pair on the existing `EventSeries` aggregate. Create and update endpoints validate and persist the pair while leaving title, description, location, timing, recurrence, source, and provider fields under the existing Agenda model.

# Recurrence Integration

Existing recurrence architecture was preserved:

- Event series are represented by `EventSeries`.
- Generated occurrences are produced by `EventOccurrenceGenerator`.
- Exceptions are represented by `EventException` for skipped/modified occurrences.
- Existing update semantics remain: normal update edits the series; occurrence operations modify/skip/restore a generated occurrence; split creates a new event series from an occurrence.
- Decorative metadata follows series semantics exactly. Generated occurrences project the series decorative reference.
- Split series copies the decorative reference from the original series, matching existing series metadata propagation.
- No occurrence-specific decorative override model was added.

# Imported Event Behaviour

Imported events remain provider-owned/read-only according to the existing `EventSource.IsWritable` behavior. Decorative avatars are stored only in FamilyBoard event-series persistence and are projected locally. No provider payload fields, provider IDs, revision metadata, recurrence IDs, import timestamps, or synchronization fingerprints are changed by decorative avatar handling.

# Decorative Avatar Reuse

Agenda reuses the existing decorative avatar contract:

- `DecorativeAvatarReferenceType`
- `DecorativeAvatarReferenceDto`
- `DecorativeAvatarReferenceValidation`
- `DecorativeAvatarBadge`
- `DecorativeAvatarPicker`
- `decorativeAvatarSuggestions`
- FamilyMember and KnownPerson avatar renderers via the shared resolver

No Agenda-specific decorative reference model, snapshot model, avatar profile, or duplicated renderer was introduced.

# Validation

Backend create/update uses `DecorativeAvatarReferenceValidation` to enforce nullable-pair consistency, active FamilyMember/KnownPerson references, same-household constraints, and source-type consistency. EF also enforces the nullable-pair invariant with `CK_EventSeries_DecorativeAvatar_NullablePair`.

# Tests

Added/updated tests for:

- Agenda API decorative avatar create/update/clear behavior.
- Recurring Agenda occurrence projection of series decorative metadata.
- Frontend Agenda API mapping and generated-client request forwarding.
- Existing decorative avatar, Shopping, Tasks, and Agenda-related frontend regression coverage through focused and full frontend suites.

# Verified

- `dotnet restore HomeOps.sln` passed with the existing SQLitePCLRaw vulnerability warning.
- `dotnet build HomeOps.sln --no-restore` passed with the existing SQLitePCLRaw vulnerability warning.
- `dotnet test tests/HomeOps.Api.Tests/HomeOps.Api.Tests.csproj --no-build --filter "FullyQualifiedName~CalendarEvents"` passed: 222 tests.
- `dotnet test HomeOps.sln --no-build` passed: 432 tests.
- `DOTNET_ROOT=/root/.dotnet PATH="$PATH:/root/.dotnet/.dotnet/tools" npx --yes nswag run nswag.json` passed.
- `cd src/HomeOps.Client && npm run build` passed with the existing Vite chunk-size warning.
- `cd src/HomeOps.Client && npm test -- src/avatarContacts src/widgets/components/ShoppingListWidget.test.tsx src/tasks/TasksPage.test.tsx src/agenda/calendarEventsApi.test.ts` passed: 40 tests.
- `cd src/HomeOps.Client && npm test` passed: 274 tests.

# Risks and Follow-up Work

- Agenda decorative avatar UI is intentionally lightweight and reuses the Shopping/Tasks picker styling; future visual polish can be handled in a separate UI slice.
- Imported read-only events are not manually editable through existing Agenda endpoints, so decorative-avatar editing for imported events would require a separate local-metadata workflow if desired later.

# Modified Files

- `src/HomeOps.Api/CalendarEvents/EventSeries.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeriesDtos.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeriesEndpoints.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeriesNormalizer.cs`
- `src/HomeOps.Api/CalendarEvents/EventOccurrence.cs`
- `src/HomeOps.Api/CalendarEvents/EventOccurrenceGenerator.cs`
- `src/HomeOps.Api/Data/HomeOpsDbContext.cs`
- `src/HomeOps.Api/FamilyMembers/FamilyMemberEndpoints.cs`
- `src/HomeOps.Api/KnownPeople/KnownPersonEndpoints.cs`
- `src/HomeOps.Api/Migrations/20260711075341_AddAgendaDecorativeAvatars.cs`
- `src/HomeOps.Api/Migrations/20260711075341_AddAgendaDecorativeAvatars.Designer.cs`
- `src/HomeOps.Api/Migrations/HomeOpsDbContextModelSnapshot.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/ManualEventApiTests.cs`
- `src/HomeOps.Contracts/Events/NormalizedEvent.cs`
- `src/HomeOps.Contracts/openapi.json`
- `src/HomeOps.Client/src/api/homeOpsApiClient.ts`
- `src/HomeOps.Client/src/agenda/calendarEventsApi.ts`
- `src/HomeOps.Client/src/agenda/calendarEventsApi.test.ts`
- `src/HomeOps.Client/src/events/eventSourceModel.ts`
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.tsx`
- `docs/state/current-state.md`
