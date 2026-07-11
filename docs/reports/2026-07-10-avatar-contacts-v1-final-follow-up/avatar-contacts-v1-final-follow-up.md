# Summary

Completed the Avatar Contacts V1 final follow-up as a small production-readiness correction. The slice only changes Dutch user-facing terminology, modal accessibility semantics for the shared person form, focused tests, and documentation.

No backend behavior, API contract, persistence, migrations, decorative-avatar semantics, validation rules, ranking, Shopping behavior, Tasks behavior, or Agenda behavior was changed.

# Localization

Final Dutch terminology adopted:

- Capability/Settings entry point: **Bekenden** / **Bekenden beheren**.
- Shared section: **Gedeelde bekenden**.
- Member/private section concept: **Bekenden per gezinslid** in picker groups; member sections remain titled by the owning member name where the current UI already groups private records per member.
- Person create/edit dialogs and buttons: **Bekende toevoegen**, **Bekende bewerken**, **Bekende toevoegen**, **Verwijderen**, **Opslaan**, **Sluiten**.
- Scope radio labels: **Gedeeld** and **Bij gezinslid**.
- Empty/loading/search states: **Bekenden laden…**, **Nog geen bekenden toegevoegd.**, **Geen bekenden gevonden voor deze zoekopdracht.**
- Decorative avatar picker groups: **Voorgesteld**, **Gezinsleden**, **Gedeelde bekenden**, **Bekenden per gezinslid**, and **Geen avatar**.

Implementation terminology such as `KnownPerson`, `KnownPersonScope`, `KnownPersonRelationshipType`, `FamilyMember`, and API enum values remains code/test/API terminology only and is not used as user-facing copy in the Avatar Contacts UI.

# Accessibility

`KnownPersonForm` is currently only rendered inside modal backdrops in Bekenden management and FamilyMember page member-bekenden editing.

Correction made:

- Moved `role="dialog"`, `aria-modal="true"`, and `aria-labelledby="known-person-form-title"` from the reusable form to the modal wrapper in both render sites.
- Kept `KnownPersonForm` as a reusable form with `aria-labelledby` pointing at its visible title.
- Added initial focus to the form close button when the form mounts, so modal opening has deterministic keyboard focus.
- Added tests that assert the modal wrapper exposes dialog semantics and the reusable form itself does not claim dialog role.

# Validation

Exact validation commands executed:

| Command | Result |
| --- | --- |
| `npm test -- --run src/knownPeople/PeopleManagement.test.tsx src/home/FamilyMemberPage.test.tsx src/avatarContacts/DecorativeAvatarPicker.test.tsx src/tasks/TasksPage.test.tsx src/widgets/components/ShoppingListWidget.test.tsx src/settings/SettingsDashboard.test.tsx` | Passed: 6 files, 48 tests. |
| `export DOTNET_CLI_HOME=$PWD/.dotnet-home NUGET_PACKAGES=$PWD/.nuget/packages npm_config_cache=$PWD/.npm-cache; dotnet restore HomeOps.sln` | Passed with existing NU1903 warning for `SQLitePCLRaw.lib.e_sqlite3` 2.1.11. |
| `export DOTNET_CLI_HOME=$PWD/.dotnet-home NUGET_PACKAGES=$PWD/.nuget/packages npm_config_cache=$PWD/.npm-cache; dotnet build HomeOps.sln --no-restore` | Passed with existing NU1903 warning for `SQLitePCLRaw.lib.e_sqlite3` 2.1.11. |
| `export npm_config_cache=$PWD/.npm-cache; npm run build` | Passed with existing Vite chunk-size warning and npm update notice. |
| `export npm_config_cache=$PWD/.npm-cache; npm test` | Passed: 42 files, 276 tests. |
| `export DOTNET_CLI_HOME=$PWD/.dotnet-home NUGET_PACKAGES=$PWD/.nuget/packages npm_config_cache=$PWD/.npm-cache; dotnet test HomeOps.sln --no-build` | Passed: 451 passed, 0 failed, 0 skipped. |
| `git diff --check` | Passed. |

# Tests

Updated frontend tests to cover:

- localized Bekenden labels for loading, empty, search, Settings entry, shared grouping, and create actions;
- decorative picker group labels for shared and member-scoped bekenden;
- modal dialog role and accessible name for create flows;
- deterministic focus on the close button when the KnownPerson form modal opens;
- unchanged CRUD assertions for create, update, and delete;
- unchanged avatar editing behavior through the existing KnownPersonAvatarEditor and AvatarSelectionEditor path.

# Verified

- `KnownPersonForm` no longer claims dialog semantics itself.
- Modal semantics now live on the modal wrappers that actually create the modal presentation.
- The shared form remains used by both Settings Bekenden management and FamilyMember member-bekenden editing.
- No backend, API, persistence, migration, ranking, validation, Shopping, Tasks, Agenda, or decorative-avatar semantic files were modified.
- No screenshots or binary files were added.

# Risks

- The Vite production build still reports the existing large chunk warning. This follow-up did not change bundling.
- .NET restore/build still report the existing NU1903 warning for `SQLitePCLRaw.lib.e_sqlite3` 2.1.11. This follow-up did not change package dependencies.
- The canonical design specification uses English product terminology historically; this follow-up intentionally adopts Dutch UI terminology for the implemented app surfaces per the final follow-up request.

# Modified Files

- `src/HomeOps.Client/src/avatarContacts/DecorativeAvatarPicker.tsx`
- `src/HomeOps.Client/src/avatarContacts/DecorativeAvatarPicker.test.tsx`
- `src/HomeOps.Client/src/home/FamilyMemberPage.tsx`
- `src/HomeOps.Client/src/home/FamilyMemberPage.test.tsx`
- `src/HomeOps.Client/src/knownPeople/KnownPersonForm.tsx`
- `src/HomeOps.Client/src/knownPeople/PeopleManagement.tsx`
- `src/HomeOps.Client/src/knownPeople/PeopleManagement.test.tsx`
- `src/HomeOps.Client/src/settings/SettingsDashboard.tsx`
- `docs/reports/2026-07-10-avatar-contacts-v1-final-follow-up/avatar-contacts-v1-final-follow-up.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
