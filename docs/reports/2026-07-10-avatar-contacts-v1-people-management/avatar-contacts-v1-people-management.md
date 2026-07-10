# Summary

Implemented Avatar Contacts V1 Slice 3 as a frontend People management capability for KnownPerson records. The capability is exposed from Settings as a flexible management surface rather than a permanent primary navigation page.

# Implemented

- People management surface for listing, searching, creating, editing, and deleting KnownPerson records.
- Read-only Family Members summary.
- Shared People and member-scoped PrivateToMember sections.
- Presentation-only relationship grouping derived from KnownPersonRelationshipType.
- KnownPerson avatar display and editing through the Slice 2 reusable avatar editor infrastructure.
- Loading, empty, error, no-search-results, and save/delete error states.

# People Capability

People management is reachable through the Settings action rail via "People beheren". This keeps People as a capability without treating it as a permanent primary product page. The surface accepts the already-loaded FamilyMember list for read-only summaries and PrivateToMember scope selection.

# KnownPerson CRUD

The UI uses the KnownPerson API layer from Slice 2 for all CRUD operations:

- `listKnownPeople()` loads the management list.
- `createKnownPerson()` creates a record.
- `updateKnownPerson()` edits an existing record, including Shared ↔ PrivateToMember scope changes.
- `deleteKnownPerson()` removes the record from People management through the backend soft-delete endpoint.

The UI does not call generated NSwag client classes directly.

# Avatar Integration

KnownPerson rows render avatars by adapting the existing FamilyAvatar renderer to the KnownPerson avatar selection. Editing reuses `KnownPersonAvatarEditor`, which remains a thin adapter around `AvatarSelectionEditor`. No additional avatar editor or renderer was added.

# Validation

Executed validation:

- Repository-local .NET environment configured with `DOTNET_CLI_HOME`, `DOTNET_HOME`, `NUGET_PACKAGES`, `npm_config_cache`, and `DOTNET_SKIP_FIRST_TIME_EXPERIENCE` before .NET commands.
- `dotnet restore HomeOps.sln` passed with the existing NU1903 warning for `SQLitePCLRaw.lib.e_sqlite3` in the test project.
- `dotnet build HomeOps.sln --no-restore` passed with the same existing NU1903 warning.
- `dotnet test tests/HomeOps.Api.Tests/HomeOps.Api.Tests.csproj --no-build --filter FullyQualifiedName~KnownPersonApiTests` passed: 22 tests.
- `cd src/HomeOps.Client && npm run build` passed. Vite reported the existing large chunk warning.
- `cd src/HomeOps.Client && npm test` passed: 39 files, 256 tests.

No frontend lint command was run because `src/HomeOps.Client/package.json` does not define a lint script.

# Tests

Added People management frontend tests covering:

- loading state;
- empty state;
- error state;
- search;
- relationship grouping;
- Shared list;
- Private member lists;
- create;
- edit;
- delete;
- scope switching;
- FamilyMember selector visibility;
- KnownPersonAvatarEditor / AvatarSelectionEditor reuse.

Existing KnownPerson API, KnownPerson avatar editor, AvatarSelectionEditor, and FamilyAvatar/FamilyMember avatar tests are included in the full frontend suite.

# Verified

- People management remains isolated from member pages, shopping, tasks, agenda, motivation, authentication, permissions, and decorative avatar picker work.
- Relationship groups are UI-only presentation mapping and were not added to persistence, API contracts, or enums.
- Search is client-side only and does not call additional backend APIs.
- PrivateToMember scope shows and requires the FamilyMember selector; Shared scope hides it and clears `familyMemberId` before save.
- Changing scope in either direction updates visible controls immediately.

# Risks and Follow-up Work

- People management currently lives behind Settings as a capability entry point. Later UX slices may move or refine the entry point without changing KnownPerson CRUD behavior.
- Backend validation remains authoritative; frontend validation is intentionally limited to required/max-length affordances matching current backend field limits.
- Member-page Friends sections, avatar picker, decorative avatars, smart suggestions, and domain integrations remain intentionally deferred.

# Modified Files

- `src/HomeOps.Client/src/knownPeople/PeopleManagement.tsx`
- `src/HomeOps.Client/src/knownPeople/PeopleManagement.test.tsx`
- `src/HomeOps.Client/src/knownPeople/KnownPersonAvatar.tsx`
- `src/HomeOps.Client/src/knownPeople/peoplePresentation.ts`
- `src/HomeOps.Client/src/settings/SettingsDashboard.tsx`
- `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx`
- `src/HomeOps.Client/src/styles.css`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
