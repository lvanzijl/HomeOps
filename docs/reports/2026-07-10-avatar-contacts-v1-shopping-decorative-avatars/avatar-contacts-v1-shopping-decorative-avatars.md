# Summary

Implemented Avatar Contacts V1 Slice 6 for Shopping decorative avatars. Shopping items can now carry an optional decorative reference to either a FamilyMember or KnownPerson. The item text, completion state, ordering, preferred store, and lifecycle fields remain the semantic Shopping content.

# Implemented

- Added nullable decorative avatar persistence fields to Shopping list items.
- Added Shopping API request/response contract support for create, update, and clear operations.
- Added manual Shopping UI selection for no avatar, Family Members, Shared People, and private People loaded from existing People APIs.
- Reused `DecorativeAvatar` and `DecorativeAvatarBadge` for rendering.
- Added deletion-safe clearing for KnownPerson and FamilyMember soft deletes.
- Regenerated OpenAPI and the generated TypeScript client.

# Decorative Avatar Contract

The persistence model is a nullable pair on `ListItem`:

- `DecorativeAvatarReferenceType?` with values `FamilyMember` or `KnownPerson`.
- `DecorativeAvatarReferenceId?` containing the selected source identifier.

This model was selected because it is the smallest explicit contract that supports both allowed identity sources without introducing `AvatarProfile`, inheritance, snapshots, duplicated renderer state, ownership semantics, or widget-specific models. The same nullable source-type/source-id pair can be reused by Tasks and Agenda when those slices add their own decorative-avatar columns.

The reference is presentation metadata only. It does not encode ownership, assignment, recipient, responsibility, participation, or permissions.

# Shopping Integration

Shopping item creation accepts an optional decorative avatar. Existing clients can continue sending only item text. Shopping items can also update or clear the decorative avatar independently from text, completion, deletion, store, and ordering fields.

# API Changes

- Added `DecorativeAvatarReferenceDto` and `DecorativeAvatarReferenceType`.
- Extended `AddListItemRequest` and `ListItemDto` with optional decorative avatar data.
- Added `PATCH /api/lists/{listId}/items/{itemId}/decorative-avatar`.
- Regenerated `src/HomeOps.Contracts/openapi.json` and `src/HomeOps.Client/src/api/homeOpsApiClient.ts`.

# Rendering

The Shopping row renders the selected identity through `DecorativeAvatarBadge`, which delegates to `DecorativeAvatar` and the existing `FamilyAvatar` renderer. KnownPerson identities are adapted only at presentation time for rendering and are not persisted as copied avatar snapshots.

# Validation

Executed validation:

- `dotnet restore`
- `dotnet build`
- `dotnet test --filter "FullyQualifiedName~ListApiTests|FullyQualifiedName~KnownPersonApiTests|FullyQualifiedName~FamilyMemberApiTests"`
- `dotnet test --no-build`
- `npm test -- --run src/shopping/listsApi.test.ts src/widgets/components/ShoppingListWidget.test.tsx src/avatarContacts/DecorativeAvatar.test.tsx`
- `npm test -- --run src/widgets/components/ShoppingListWidget.test.tsx`
- `npm run build`
- `npm test`
- `dotnet nswag run nswag.json` via the local NSwag console package.
- `dotnet ef migrations script --project src/HomeOps.Api --startup-project src/HomeOps.Api --output /tmp/homeops-shopping-decorative-avatar.sql` via the local dotnet-ef package.

Known unrelated warnings:

- .NET restore/build/test reports NU1903 for `SQLitePCLRaw.lib.e_sqlite3` from the existing test project dependency.
- npm reports an `http-proxy` config deprecation warning.
- Vite reports the existing large chunk-size warning after production build.

# Tests

Backend tests cover:

- create with no decorative avatar;
- create with FamilyMember decorative avatar;
- create with KnownPerson decorative avatar;
- update decorative avatar;
- clear decorative avatar;
- delete KnownPerson clears decorative references without changing item text, completion, preferred store, or deletion state;
- existing Shopping behavior remains covered by the existing List API suite.

Frontend tests cover:

- existing Shopping rendering and CRUD regression;
- manual decorative avatar selection;
- clearing decorative avatar selection;
- decorative renderer behavior through the existing avatarContacts tests.

# Verified

- Decorative references remain optional.
- Invalid references are rejected on write.
- KnownPerson deletion clears Shopping decorative references.
- FamilyMember soft delete clears Shopping decorative references while preserving existing FamilyMember soft-delete behavior.
- Shopping text remains the semantic content.
- Rendering reuses the decorative avatar infrastructure.
- OpenAPI and generated TypeScript client were regenerated.
- Repository-local `.dotnet-tools/` cache was removed and ignored.

# Risks and Follow-up Work

- The picker is intentionally simple and unranked. Search, automatic suggestions, fuzzy matching, AI, and semantic inference remain out of scope.
- Private People are loaded into the Shopping picker without authentication/permission semantics because the current repository has no authentication boundary.
- Tasks and Agenda should reuse this nullable source-type/source-id persistence contract when their future slices implement decorative avatars.

# Modified Files

- `.gitignore`
- `docs/roadmap/phase-2.md`
- `docs/state/current-state.md`
- `docs/reports/2026-07-10-avatar-contacts-v1-shopping-decorative-avatars/avatar-contacts-v1-shopping-decorative-avatars.md`
- `src/HomeOps.Api/Data/HomeOpsDbContext.cs`
- `src/HomeOps.Api/FamilyMembers/FamilyMemberEndpoints.cs`
- `src/HomeOps.Api/KnownPeople/KnownPersonEndpoints.cs`
- `src/HomeOps.Api/Lists/DecorativeAvatarReferenceType.cs`
- `src/HomeOps.Api/Lists/ListDtos.cs`
- `src/HomeOps.Api/Lists/ListEndpoints.cs`
- `src/HomeOps.Api/Lists/ListItem.cs`
- `src/HomeOps.Api/Migrations/20260710220257_AddShoppingDecorativeAvatars.cs`
- `src/HomeOps.Api/Migrations/20260710220257_AddShoppingDecorativeAvatars.Designer.cs`
- `src/HomeOps.Api/Migrations/HomeOpsDbContextModelSnapshot.cs`
- `src/HomeOps.Client/src/api/homeOpsApiClient.ts`
- `src/HomeOps.Client/src/shopping/listsApi.ts`
- `src/HomeOps.Client/src/shopping/shoppingListModel.ts`
- `src/HomeOps.Client/src/widgets/components/ShoppingListWidget.tsx`
- `src/HomeOps.Client/src/widgets/components/ShoppingListWidget.test.tsx`
- `src/HomeOps.Contracts/openapi.json`
- `tests/HomeOps.Api.Tests/Lists/ListApiTests.cs`
