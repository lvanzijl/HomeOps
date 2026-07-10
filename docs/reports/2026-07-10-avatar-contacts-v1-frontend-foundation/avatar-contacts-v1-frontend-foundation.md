# Summary

Implemented Avatar Contacts V1 Slice 2 as a frontend infrastructure slice. The existing FamilyMember avatar editor is now a thin adapter over a reusable AvatarSelection editor, and KnownPerson has frontend models, an API layer backed by the generated OpenAPI client, and a non-navigated avatar editor wrapper.

# Implemented

- Added `AvatarSelectionEditor` as a reusable AvatarSelection-only editor that renders the existing preview, reuses `AvatarCatalogControls`, manages draft selection state, reset/save/cancel behavior, and calls save with `AvatarSelection` only.
- Refactored `FamilyAvatarEditor` into a thin FamilyMember adapter while preserving existing labels, close behavior, save behavior, `avatarSelection`, and legacy `avatarV2Config` translation.
- Added KnownPerson frontend model types for scope, relationship, optional fields, initials, timestamps, and AvatarSelection.
- Added `KnownPersonAvatarEditor` as a thin non-navigated wrapper around the shared editor.
- Added KnownPerson API mapping for list/get/create/update/delete using the generated `HomeOpsApiClient` KnownPerson methods.
- Added focused frontend tests for reusable editor behavior, FamilyMember regression behavior, KnownPerson wrapper behavior, and KnownPerson API mapping.

# Avatar Editor Refactor

`AvatarSelectionEditor` owns only presentation labels, the current `AvatarSelection`, draft state, preview rendering, catalog controls, reset/cancel/save state, and keyboard close behavior. It does not know about FamilyMember or KnownPerson.

`FamilyAvatarEditor` now loads the FamilyMember's current AvatarSelection, passes FamilyMember-specific Dutch labels to the shared editor, and translates saved selections back to both `avatarSelection` and `avatarV2Config`. The dialog accessible name remains `Avatarbewerker voor {name}` to preserve existing FamilyMember tests and behavior.

`KnownPersonAvatarEditor` mirrors the same editing experience but updates only the KnownPerson `avatarSelection` field. It is not wired into navigation, People management, member pages, or any production entry point.

# KnownPerson Frontend API

The KnownPerson frontend API layer uses the generated NSwag client methods and DTO/enums. It maps generated numeric enum values to frontend string unions, normalizes AvatarSelection payloads, preserves optional nullable fields as `null` in frontend models, and sends create/update requests through generated request classes.

Supported methods:

- `listKnownPeople({ scope, familyMemberId })`
- `getKnownPerson(id)`
- `createKnownPerson(input)`
- `updateKnownPerson(person)`
- `deleteKnownPerson(id)`

# Validation

- `dotnet restore HomeOps.sln` passed with the existing NU1903 warning for `SQLitePCLRaw.lib.e_sqlite3` in the test project.
- `dotnet build HomeOps.sln --no-restore` passed with the same existing NU1903 warning.
- `npm run build` passed; Vite reported the existing large chunk warning.
- Focused frontend tests for AvatarSelectionEditor, FamilyAvatarEditor, FamilyMemberPage avatar behavior, FamilyAvatar, FamilyMembers API, KnownPersonAvatarEditor, and KnownPerson API passed.
- Full frontend `npm test` passed on rerun: 38 files and 251 tests. An earlier full-suite attempt had one transient Agenda weather assertion failure; a focused `AgendaWidget.test.tsx` rerun passed 23/23 before the full-suite rerun also passed.
- `nswag run nswag.json` initially failed because `nswag` was not installed on PATH. Installed `NSwag.ConsoleCore` globally, then `DOTNET_ROOT=$(dirname $(which dotnet)) PATH="$PATH:/root/.dotnet/.dotnet/tools" nswag run nswag.json` passed. The generated OpenAPI/client artifacts had no diff.

# Tests

Added or updated tests covering:

- `AvatarSelectionEditor` renders the existing selection, updates draft selection, restores on cancel, saves updated AvatarSelection, and keeps renderer SVG output present.
- `FamilyAvatarEditor` existing FamilyMember behavior remains covered through existing wrapper tests and FamilyMemberPage avatar workflow tests.
- `KnownPersonAvatarEditor` loads KnownPerson selection, renders KnownPerson labels, and saves KnownPerson AvatarSelection.
- `knownPeopleApi` maps list/get/create/update/delete, enum values, optional fields, and AvatarSelection payloads.

# Verified

- No People page, dialog, navigation entry, KnownPerson CRUD screen, avatar picker, decorative avatar usage, fuzzy matching, suggestions, authentication, or permissions were implemented.
- No backend APIs, migrations, avatar catalog data, AvatarSelection format, renderer output, SVG rendering logic, or FamilyMember production behavior were intentionally changed.
- No screenshots or binary files were added.
- Scope stayed within frontend avatar editor infrastructure, KnownPerson frontend API foundations, tests, and documentation.

# Risks and Follow-up Work

- `KnownPersonAvatarEditor` is intentionally infrastructure-only and has no production entry point until a future People/member-page slice.
- The API layer is ready for UI consumption, but no screen currently calls it.
- An earlier full frontend test attempt showed one transient Agenda weather assertion failure, but the focused Agenda test and final full frontend test rerun both passed.
- Future slices still need People management UX, member-page integration, picker read models, decorative avatar usage, suggestion ranking, and any permission/authentication model if requested.

# Modified Files

- `src/HomeOps.Client/src/avatarContacts/AvatarSelectionEditor.tsx`
- `src/HomeOps.Client/src/avatarContacts/AvatarSelectionEditor.test.tsx`
- `src/HomeOps.Client/src/home/FamilyAvatarEditor.tsx`
- `src/HomeOps.Client/src/knownPeople/KnownPersonAvatarEditor.tsx`
- `src/HomeOps.Client/src/knownPeople/KnownPersonAvatarEditor.test.tsx`
- `src/HomeOps.Client/src/knownPeople/knownPeople.ts`
- `src/HomeOps.Client/src/knownPeople/knownPeopleApi.ts`
- `src/HomeOps.Client/src/knownPeople/knownPeopleApi.test.ts`
- `docs/reports/2026-07-10-avatar-contacts-v1-frontend-foundation/avatar-contacts-v1-frontend-foundation.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
