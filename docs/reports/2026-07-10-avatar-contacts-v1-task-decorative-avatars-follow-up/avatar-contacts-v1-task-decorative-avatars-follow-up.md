# Summary

Implemented the Slice 8 follow-up for recurring task decorative avatars and shared picker extraction. Recurring task series now store the same nullable FamilyMember/KnownPerson decorative avatar reference contract as one-off Tasks and Shopping, generated occurrences inherit that reference, and Shopping/Tasks now import the manual picker and resolver from `avatarContacts` instead of Shopping owning shared infrastructure.

# Recurring Task Architecture

The current Tasks recurrence model is series-plus-materialized-occurrences. `RecurringTaskSeries` stores the inherited recurrence fields: household, title, start date, frequency, ownership kind, optional assigned `FamilyMemberId`, deletion state, and timestamps. Generated `HouseholdTask` rows store their own due date, completion/lifecycle state, optional `RecurringTaskSeriesId`, and `RecurrenceFrequency`.

`GenerateRecurringTasks` loads active series and calls `GenerateOccurrencesForSeries`. Occurrence generation builds tasks from the series title, ownership, family member assignment, frequency, and due dates over the existing 60-day horizon. There is no separate occurrence override or exception entity for Tasks. Existing update semantics for a recurring task update the series, remove incomplete materialized occurrences in that series, regenerate occurrences, and preserve completed historical occurrences. Series deletion soft-deletes the series and removes incomplete materialized occurrences.

The API distinguishes one-off tasks and recurring tasks by `RecurrenceFrequency` and `RecurringTaskSeriesId`: one-off tasks use `None` and no series id; generated occurrences have a series id and the series frequency.

# Series Decorative Avatar Persistence

`RecurringTaskSeries` now stores `DecorativeAvatarReferenceType?` and `DecorativeAvatarReferenceId?`. EF maps the type as a string, limits ids to the existing 120-character contract, adds an index for deletion clearing, and enforces the same nullable-pair check-constraint pattern used by Shopping and one-off Tasks.

Validation still uses `DecorativeAvatarReferenceValidation`; no duplicate validation logic, avatar snapshots, AvatarProfile abstraction, or semantic ownership model was introduced.

# Occurrence Propagation

Generated occurrences inherit the series decorative reference when `GenerateOccurrencesForSeries` creates each `HouseholdTask`. Creating a recurring task stores the selected reference on the series before generation, so all generated occurrences receive the decoration. Updating a recurring series changes the series reference, removes incomplete materialized occurrences per existing semantics, and regenerates them with the updated reference. Clearing the series reference regenerates incomplete occurrences without decoration.

Already-completed materialized occurrences are preserved because existing recurrence update semantics only remove incomplete occurrences. No new historical rewrite behavior was introduced.

# Shared Picker Extraction

The manual picker, picker value parsing, and FamilyMember/KnownPerson identity resolution moved from `ShoppingListWidget` into `src/HomeOps.Client/src/avatarContacts/DecorativeAvatarPicker.tsx`. Shopping and Tasks now import the shared picker/resolver. The shared picker keeps the existing no-avatar option, Suggested group, Family Members group, Shared People group, and Private People group. Suggestions remain hints only and never attach automatically.

# Deletion Clearing

KnownPerson deletion now clears matching decorative references from one-off/materialized task rows and recurring task series. FamilyMember deletion does the same. Existing assignment behavior is preserved: decorative clearing does not delete tasks or series and does not change task text, ownership kind, assigned family member, recurrence rule, completion, or lifecycle state.

# API and Migration Changes

No public Task DTO shape changed in this follow-up because Slice 8 already added the optional decorative avatar contract to task create/update/read payloads. NSwag was rerun and produced no OpenAPI/generated-client changes.

A new EF migration, `20260711070334_AddRecurringTaskSeriesDecorativeAvatars`, adds nullable decorative columns, an index, and the nullable-pair check constraint to `RecurringTaskSeries`. An idempotent migration SQL script was generated to `/tmp/homeops-task-decorative-follow-up.sql` for validation and was not committed.

# Tests

Validation commands executed:

- `dotnet build HomeOps.sln --no-restore` — passed with the existing NU1903 `SQLitePCLRaw.lib_e_sqlite3` advisory.
- `npx tsc -p src/HomeOps.Client/tsconfig.json --noEmit` — passed.
- `dotnet test tests/HomeOps.Api.Tests/HomeOps.Api.Tests.csproj --no-build --filter "FullyQualifiedName~TaskDecorativeAvatarApiTests|FullyQualifiedName~TaskApiTests|FullyQualifiedName~FamilyMemberApiTests|FullyQualifiedName~KnownPersonApiTests|FullyQualifiedName~ListApiTests"` — passed, 70 tests.
- `DOTNET_ROOT=/root/.dotnet /root/.dotnet/.dotnet/tools/dotnet-ef migrations script --project src/HomeOps.Api/HomeOps.Api.csproj --startup-project src/HomeOps.Api/HomeOps.Api.csproj --idempotent --output /tmp/homeops-task-decorative-follow-up.sql` — passed; EF tools emitted the existing tool/runtime version advisory.
- `DOTNET_ROOT=/root/.dotnet PATH="$PATH:/root/.dotnet/.dotnet/tools" npx --yes nswag run nswag.json` — passed.
- `dotnet test HomeOps.sln --no-build` — passed, 430 tests.
- `npm test -- --run src/tasks/TasksPage.test.tsx src/widgets/components/ShoppingListWidget.test.tsx src/avatarContacts/DecorativeAvatarPicker.test.tsx src/avatarContacts/DecorativeAvatar.test.tsx src/avatarContacts/decorativeAvatarSuggestions.test.ts` — passed, 33 tests.
- `npx tsc -p src/HomeOps.Client/tsconfig.json --noEmit` — passed after the shared reference alias cleanup.
- `npm test -- --run src/avatarContacts/DecorativeAvatarPicker.test.tsx src/tasks/TasksPage.test.tsx src/widgets/components/ShoppingListWidget.test.tsx` — passed, 23 tests after the shared reference alias cleanup.
- `npm run build` — passed; Vite emitted the existing large-chunk advisory.
- `npm test -- --run` — passed, 274 tests.
- `npm test -- --run` — passed again after the shared reference alias cleanup, 274 tests.
- `dotnet restore HomeOps.sln` — passed with the existing NU1903 advisory.
- `dotnet build HomeOps.sln --no-restore` — passed with the existing NU1903 advisory.

# Verified

- Recurring series can be created without decoration.
- Recurring series can be created with FamilyMember or KnownPerson decoration.
- Generated occurrences inherit the series decorative reference.
- Series updates and clears regenerate incomplete future/current occurrences with the updated/cleared reference under existing recurrence semantics.
- Completed materialized occurrences are not rewritten by this follow-up beyond existing recurrence behavior.
- Invalid nullable pairs and invalid references are rejected through the shared validator.
- KnownPerson and FamilyMember deletion clear one-off task and recurring-series decorative references without changing assignment or recurrence semantics.
- Shopping and Tasks both use the shared avatarContacts picker/resolver.
- Shopping manual picker behavior and Suggested behavior remain unchanged.

# Risks and Follow-up Work

- The existing Tasks recurrence model has no separate occurrence exception/override model. This follow-up intentionally did not add one.
- Existing recurrence update behavior removes all incomplete materialized occurrences for a series and regenerates them. Decorative avatar updates follow that existing behavior rather than introducing a separate this/future occurrence model.
- Vite still reports the repository's existing large JavaScript chunk advisory during production builds.

# Modified Files

- `docs/reports/2026-07-10-avatar-contacts-v1-task-decorative-avatars/avatar-contacts-v1-task-decorative-avatars.md`
- `docs/reports/2026-07-10-avatar-contacts-v1-task-decorative-avatars-follow-up/avatar-contacts-v1-task-decorative-avatars-follow-up.md`
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
