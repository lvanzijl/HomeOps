# Summary

Implemented the Avatar Contacts V1 Slice 4 follow-up by extracting the duplicated KnownPerson create/edit form into one reusable `KnownPersonForm` component. No product behavior, API contract, layout, copy, persistence, backend code, decorative avatar behavior, picker behavior, suggestions, authentication, or permissions were changed.

# Implemented

- Added a shared `KnownPersonForm` component for KnownPerson draft editing.
- Removed duplicated form fields, avatar edit launch, initials generation, and draft normalization from both People management and the FamilyMember page.
- Kept People management and FamilyMember page wrappers responsible for CRUD and ownership context.
- Added test assertions proving both wrappers render the shared form and preserve scope visibility rules.

# KnownPersonForm

`KnownPersonForm` owns only form presentation and draft editing:

- `DisplayName`, `Nickname`, `RelationshipType`, and `CustomRelationshipLabel` fields.
- Optional scope radio controls for wrappers that allow scope editing.
- Optional FamilyMember selector when editable scope is `PrivateToMember`.
- `KnownPersonAvatar` display and `KnownPersonAvatarEditor` launch.
- Save/cancel/delete button presentation.
- Backend error presentation while the form is open.
- Shared draft normalization before reporting a save result to the wrapper.

The form does not call `knownPeopleApi`, does not create/update/delete records, and does not know which surface owns the operation.

# Wrapper Refactoring

People management now configures `KnownPersonForm` with editable scope controls and continues to own list/create/update/delete behavior. It still decides whether records are Shared or PrivateToMember and still owns the FamilyMember selector options.

The FamilyMember page now configures `KnownPersonForm` with fixed `PrivateToMember` scope and the current member id. Scope controls and the FamilyMember selector are not visible there. The page continues to own create/update/delete and still forces saves to the current member context through the fixed form configuration.

# Validation

- `dotnet restore HomeOps.sln` passed with the existing `SQLitePCLRaw.lib.e_sqlite3` NU1903 advisory warning.
- `dotnet build HomeOps.sln --no-restore` passed with the same existing NU1903 warning.
- `npm run build` passed; Vite reported the existing chunk-size warning.
- `npm test -- FamilyMemberPage.test.tsx PeopleManagement.test.tsx knownPeopleApi.test.ts KnownPersonAvatarEditor.test.tsx AvatarSelectionEditor.test.tsx` passed 28/28.
- `npm test` passed 258/258.

# Tests

Updated focused frontend tests to verify:

- People management renders `KnownPersonForm`.
- FamilyMember page renders `KnownPersonForm`.
- Scope controls remain visible in People management.
- Scope controls and FamilyMember selector remain hidden on the FamilyMember page.
- FamilyMember page saves `scope = PrivateToMember` and `familyMemberId = current member`.
- Existing create/edit/delete behavior remains unchanged.
- Existing avatar editing remains unchanged.

# Verified

- There is exactly one reusable KnownPerson form implementation after this refactor.
- CRUD remains in the wrappers.
- `KnownPersonAvatarEditor` remains the only KnownPerson avatar editor.
- No backend, generated API client, persistence, layout, copy, shopping, tasks, agenda, motivation, decorative avatar, picker, suggestion, authentication, or permissions changes were made.

# Risks and Follow-up Work

- The shared form intentionally preserves the current compact People dialog markup and copy, so future UX polish should happen in a dedicated slice.
- `KnownPersonForm` is still scoped to the existing People management and FamilyMember page use cases; future picker/decorative flows remain deferred.

# Modified Files

- `src/HomeOps.Client/src/knownPeople/KnownPersonForm.tsx`
- `src/HomeOps.Client/src/knownPeople/PeopleManagement.tsx`
- `src/HomeOps.Client/src/knownPeople/PeopleManagement.test.tsx`
- `src/HomeOps.Client/src/home/FamilyMemberPage.tsx`
- `src/HomeOps.Client/src/home/FamilyMemberPage.test.tsx`
- `docs/reports/2026-07-10-avatar-contacts-v1-knownperson-form/avatar-contacts-v1-knownperson-form.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
