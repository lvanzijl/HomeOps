# Summary

Implemented Avatar Contacts V1 Slice 8 for Tasks decorative avatars. Tasks now consume the same nullable decorative avatar reference contract established by Shopping while keeping task assignment semantics unchanged.

# Implemented

- Added nullable `DecorativeAvatarReferenceType` / `DecorativeAvatarReferenceId` persistence to `HouseholdTask`.
- Added the matching EF configuration, index, and nullable-pair check constraint.
- Added a database migration for task decorative avatar columns and constraint.
- Added task DTO/request decorative avatar fields and regenerated OpenAPI / generated client artifacts.
- Added frontend task model/API support for decorative avatar payloads.
- Added task rendering via the shared `DecorativeAvatarBadge`.
- Added manual task decorative avatar selection in the existing task dialog.

# Task Integration

Tasks support an optional decorative avatar independently of `OwnershipKind` and `FamilyMemberId`. Assignment remains represented only by the existing FamilyMember task assignment model. A task can therefore remain assigned to one family member while displaying a different FamilyMember or KnownPerson as presentation metadata.

# Decorative Avatar Reuse

The implementation reuses the Shopping decorative avatar contract and infrastructure:

- `DecorativeAvatarReferenceDto`
- `DecorativeAvatarReferenceType`
- `DecorativeAvatarReferenceValidation`
- nullable reference type/reference id pair
- EF nullable-pair check constraint approach
- `DecorativeAvatarBadge`
- Shopping's manual `DecorativeAvatarPicker`
- `decorativeAvatarSuggestions`

No task-specific decorative reference model, avatar profile abstraction, inheritance model, snapshot model, or duplicate renderer was introduced.

# Validation

Executed validation:

- `dotnet restore HomeOps.sln` — passed with an existing NU1903 warning for `SQLitePCLRaw.lib_e_sqlite3`.
- `dotnet build HomeOps.sln --no-restore` — passed with the same existing NU1903 warning.
- `DOTNET_ROOT=/root/.dotnet PATH="$PATH:/root/.dotnet/.dotnet/tools" npx --yes nswag run nswag.json` — passed and regenerated OpenAPI/client artifacts.
- `dotnet test tests/HomeOps.Api.Tests/HomeOps.Api.Tests.csproj --no-build --filter "FullyQualifiedName~Task"` — passed, 29 tests.
- `dotnet test HomeOps.sln --no-build` — passed, 424 tests.
- `npm test -- --run src/tasks/TasksPage.test.tsx src/widgets/components/ShoppingListWidget.test.tsx src/avatarContacts/DecorativeAvatar.test.tsx src/avatarContacts/decorativeAvatarSuggestions.test.ts` — passed, 29 tests.
- `npm run build` — passed; Vite emitted the pre-existing large chunk advisory.
- `npm test -- --run` — passed, 270 tests.

# Tests

Backend coverage was added for:

- creating a task with a KnownPerson decorative avatar;
- updating to a FamilyMember decorative avatar;
- clearing the decorative avatar;
- nullable-pair enforcement;
- assignment preservation while decorative avatars change;
- KnownPerson deletion clearing the task decorative reference without changing task text or assignment.

Existing task, Shopping, KnownPerson, FamilyMember, DecorativeAvatar, and avatar suggestion tests were run through focused and full suites.

# Verified

- Shopping's reusable decorative validation is used for Tasks.
- Decorative avatars remain presentation-only metadata.
- Task ownership/assignment remains represented by `OwnershipKind` and `FamilyMemberId` only.
- KnownPerson deletion clears task decorative avatar references.
- FamilyMember deletion clears task decorative avatar references in addition to existing Shopping clearing.
- Task text, assignment, completion, recurrence-related fields, and normal task behavior are preserved by decorative avatar updates/deletion clearing.

# Risks and Follow-up Work

- The task dialog now includes manual decorative avatar selection in the existing extras step; no automatic attachment was added.
- Recurring series persistence was not expanded with a series-level decorative avatar contract. The first created recurring task can carry the selected decorative avatar, but future generated occurrences continue to follow existing series fields only. A future slice should explicitly decide whether recurring series should have their own decorative metadata.
- Vite still reports a large bundle chunk advisory during production build; this is unrelated to the slice.

# Modified Files

- `docs/reports/2026-07-10-avatar-contacts-v1-task-decorative-avatars/avatar-contacts-v1-task-decorative-avatars.md`
- `docs/state/current-state.md`
- `src/HomeOps.Api/Data/HomeOpsDbContext.cs`
- `src/HomeOps.Api/FamilyMembers/FamilyMemberEndpoints.cs`
- `src/HomeOps.Api/KnownPeople/KnownPersonEndpoints.cs`
- `src/HomeOps.Api/Migrations/20260711070334_AddRecurringTaskSeriesDecorativeAvatars.Designer.cs`
- `src/HomeOps.Api/Migrations/20260711070334_AddRecurringTaskSeriesDecorativeAvatars.cs`
- `src/HomeOps.Api/Migrations/HomeOpsDbContextModelSnapshot.cs`
- `src/HomeOps.Api/Tasks/RecurringTaskSeries.cs`
- `src/HomeOps.Api/Tasks/TaskEndpoints.cs`
- `src/HomeOps.Client/src/avatarContacts/DecorativeAvatarPicker.test.tsx`
- `src/HomeOps.Client/src/avatarContacts/DecorativeAvatarPicker.tsx`
- `src/HomeOps.Client/src/shopping/shoppingListModel.ts`
- `src/HomeOps.Client/src/tasks/TasksPage.test.tsx`
- `src/HomeOps.Client/src/tasks/TasksPage.tsx`
- `src/HomeOps.Client/src/tasks/tasksModel.ts`
- `src/HomeOps.Client/src/tasks/tasksApi.ts`
- `src/HomeOps.Client/src/widgets/components/ShoppingListWidget.tsx`
- `tests/HomeOps.Api.Tests/Lists/TaskApiTests.cs`
