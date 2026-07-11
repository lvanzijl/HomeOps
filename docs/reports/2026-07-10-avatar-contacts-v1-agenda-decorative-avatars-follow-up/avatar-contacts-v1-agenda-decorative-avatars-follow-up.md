# Summary

Finalized the Avatar Contacts V1 Slice 9 Agenda decorative avatar integration by expanding backend/frontend correctness coverage around validation, deletion clearing, recurrence operations, imported read-only behavior, and migration script inspection. The implementation continues to reuse the existing decorative avatar contract; no Agenda-specific decorative reference model, EventException decorative field, automatic attachment, or provider writeback behavior was added.

# Validation Completion

Agenda create/update validation now has explicit backend coverage for every required decorative avatar rule:

- both nullable fields omitted or null are accepted;
- both fields populated with an active same-household FamilyMember are accepted;
- both fields populated with an active same-household KnownPerson are accepted;
- type without id is rejected;
- id without type is rejected;
- unknown FamilyMember is rejected;
- unknown KnownPerson is rejected;
- soft-deleted FamilyMember is rejected;
- soft-deleted KnownPerson is rejected;
- cross-household FamilyMember is rejected;
- cross-household KnownPerson is rejected;
- source-type and identifier mismatches are rejected;
- invalid `DecorativeAvatarReferenceType` values are rejected;
- clearing the decorative avatar clears both persisted nullable fields.

The Agenda endpoints continue to call `DecorativeAvatarReferenceValidation`; the follow-up adds coverage rather than duplicating validation logic.

# Deletion Clearing

KnownPerson deletion is verified to clear only the Agenda `EventSeries` decorative reference while preserving title, description, location, timing, recurrence rule, provider identifiers, provider revision/fingerprint metadata, import/sync timestamps, existing `EventException` behavior, and series lifecycle.

FamilyMember deletion is verified to clear only the Agenda `EventSeries` decorative reference while preserving existing Agenda semantics, recurrence, provider identifiers, and exceptions. No imported provider data is modified and no event series are deleted.

# Recurrence Verification

Recurring Agenda coverage now verifies that:

- generated occurrences inherit the series decorative avatar;
- updating the series decorative avatar updates generated occurrences according to existing series semantics;
- clearing the series decorative avatar removes decorative metadata from generated occurrences;
- split-series operations copy the decorative avatar to the new future series;
- skipped occurrences remain skipped and are restored through the existing exception workflow;
- modified occurrences keep existing modified-occurrence behavior while projecting the series decorative avatar;
- restored modified occurrences return to generated-series behavior with the series decorative avatar;
- `EventException` has no decorative avatar persistence field.

No occurrence-specific decorative persistence or override model was introduced.

# Imported Event Behaviour

Product decision: imported events are intentionally not decoratable through the Agenda API in this version.

Imported calendar events remain read-only through the Agenda event update endpoint, so decorative avatar writes are rejected by the same imported-source writability boundary as other imported-event edits. The follow-up test verifies that an attempted decorative-avatar update for an imported event leaves provider identifiers, provider revision data, provider fingerprint data, import timestamps, sync timestamps, title, and local decorative columns unchanged.

# Migration Validation

Generated and inspected an idempotent migration script for `20260711075341_AddAgendaDecorativeAvatars` at `/tmp/homeops-agenda-decorative-avatars.sql`.

Inspection confirmed:

- nullable `DecorativeAvatarReferenceId` column using `character varying(120)`;
- nullable `DecorativeAvatarReferenceType` column using `character varying(32)` for enum string persistence;
- seed-data updates retain null decorative values;
- composite decorative reference index is emitted;
- nullable-pair check constraint `CK_EventSeries_DecorativeAvatar_NullablePair` is emitted.

The migration script was generated for validation only and was not committed.

# Tests

Backend tests were expanded in `AgendaDecorativeAvatarApiTests` to cover validation, deletion clearing, recurring occurrence projection, split-series propagation, skipped/modified/restored occurrence behavior, absence of occurrence-specific decorative persistence, and imported-event read-only behavior.

Frontend tests were expanded to cover Agenda imported event rendering, recurring event rendering, API decorative-avatar mapping for returned series details, split-series API mapping, and clearing a decorative avatar through the manual picker.

# Verified

Commands executed during this follow-up:

- `dotnet restore HomeOps.sln`
- `dotnet build HomeOps.sln --no-restore`
- `dotnet test tests/HomeOps.Api.Tests/HomeOps.Api.Tests.csproj --no-build --filter "FullyQualifiedName~AgendaDecorativeAvatarApiTests"`
- `dotnet test tests/HomeOps.Api.Tests/HomeOps.Api.Tests.csproj --no-build --filter "FullyQualifiedName~CalendarEvents"`
- `dotnet test tests/HomeOps.Api.Tests/HomeOps.Api.Tests.csproj --no-build --filter "FullyQualifiedName~FamilyMemberApiTests|FullyQualifiedName~KnownPersonApiTests"`
- `dotnet test HomeOps.sln --no-build`
- `cd src/HomeOps.Client && npm run build`
- `cd src/HomeOps.Client && npm test -- src/widgets/components/AgendaWidget.test.tsx src/agenda/calendarEventsApi.test.ts`
- `cd src/HomeOps.Client && npm test -- src/avatarContacts src/widgets/components/AgendaWidget.test.tsx src/agenda/calendarEventsApi.test.ts`
- `cd src/HomeOps.Client && npm test`
- `DOTNET_ROOT=/root/.dotnet ./.dotnet-tools/dotnet-ef migrations script 20260711070334_AddRecurringTaskSeriesDecorativeAvatars 20260711075341_AddAgendaDecorativeAvatars --idempotent --project src/HomeOps.Api --startup-project src/HomeOps.Api -o /tmp/homeops-agenda-decorative-avatars.sql`
- `rg -n "DecorativeAvatarReference(Type|Id)|CK_EventSeries_DecorativeAvatar_NullablePair|IX_EventSeries_DecorativeAvatarReferenceType|character varying\(32\)|character varying\(120\)" /tmp/homeops-agenda-decorative-avatars.sql`
- `DOTNET_ROOT=/root/.dotnet PATH="$PATH:/root/.dotnet/.dotnet/tools" npx --yes nswag run nswag.json`

Observed unrelated warnings:

- `dotnet restore`/`dotnet build` continued to report the pre-existing `NU1903` warning for `SQLitePCLRaw.bundle_e_sqlite3`.
- `npm run build` continued to report the existing Vite chunk-size warning.

# Risks and Follow-up Work

No new functional follow-up is required for Agenda decorative avatars in this slice. Imported events remain intentionally non-decoratable through Agenda APIs; any future local-only decoration workflow for imported events would require a separate product decision and explicit API/UI design.

# Modified Files

- `tests/HomeOps.Api.Tests/CalendarEvents/AgendaDecorativeAvatarApiTests.cs`
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.tsx`
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.test.tsx`
- `src/HomeOps.Client/src/agenda/calendarEventsApi.test.ts`
- `docs/reports/2026-07-10-avatar-contacts-v1-agenda-decorative-avatars-follow-up/avatar-contacts-v1-agenda-decorative-avatars-follow-up.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
