# Summary

Implemented Avatar Contacts V1 Slice 1 as a backend-only KnownPerson foundation. KnownPerson is a household-scoped, soft-deleted, non-family-member identity that remains separate from FamilyMember and reuses the existing catalog-backed AvatarSelection infrastructure.

# Implemented

- Added KnownPerson domain model, scope enum, relationship enum, DTOs, and CRUD endpoints.
- Added list filtering by scope and familyMemberId.
- Added create/update validation for display fields, enums, scope/member invariants, active same-household FamilyMember references, and avatar selections.
- Added soft-delete behavior for DELETE without touching task, shopping, agenda, motivation, or other domain records.
- Intentionally did not implement frontend UI, frontend API consumption, People management, member-page integration, avatar pickers, decorative avatar persistence, fuzzy matching, suggestion ranking, authentication, permissions, external contact data, or semantic references from existing domains.

# Domain and Persistence

- Added `KnownPeople` persistence with Guid primary key, household restrictive foreign key, nullable FamilyMember restrictive foreign key, enum string persistence, jsonb AvatarSelection, timestamps, and soft-delete fields.
- Added indexes for household/deletion/display name, household/scope/deletion/display name, household/family member/deletion/display name, and household/relationship/deletion.
- Added database check constraint requiring Shared rows to have no FamilyMemberId and PrivateToMember rows to have a FamilyMemberId.
- Added EF Core migration `20260710194203_AddKnownPeopleFoundation`.
- Did not add DisplayColor, CreatedByFamilyMemberId, AvatarV2Config compatibility columns, inheritance, Person base class, AvatarProfile, or avatar snapshots.

# API

- Added `GET /api/known-people` with optional `scope` and `familyMemberId` filters.
- Added `GET /api/known-people/{knownPersonId}`.
- Added `POST /api/known-people`.
- Added `PUT /api/known-people/{knownPersonId}`.
- Added `DELETE /api/known-people/{knownPersonId}` as soft delete.
- Normal get/list operations exclude soft-deleted KnownPerson records.

# Avatar Reuse

- Reused `AvatarSelection`, `AvatarCatalogService.DefaultSelection()`, and `AvatarCatalogService.ValidateForWrite()`.
- Missing avatar selections default through the existing avatar catalog service.
- Invalid schema versions, unknown slots/items, category mismatches, missing required selections, and retired catalog items use the same backend avatar validation path as FamilyMember writes.
- No KnownPerson-specific avatar validation rules were added.

# Validation

- DisplayName is required after trimming and capped at 160 characters.
- Nickname and CustomRelationshipLabel are capped at 80 characters.
- Initials are capped at 8 characters and generated deterministically from DisplayName when omitted.
- Scope and RelationshipType must be valid enum values.
- Shared rejects non-null FamilyMemberId.
- PrivateToMember requires FamilyMemberId and validates it against an active, non-deleted FamilyMember in the seed household.
- Unknown, soft-deleted, and cross-household FamilyMember references are rejected.
- PrivateToMember to Shared updates are supported by clearing FamilyMemberId.

# Tests

Added focused backend API tests covering:

- shared KnownPerson creation;
- private-to-member KnownPerson creation;
- default avatar selection when omitted;
- explicit valid avatar selection;
- invalid avatar schema version;
- unknown avatar slot/item and category mismatch rejection;
- Shared with FamilyMemberId rejection;
- PrivateToMember without FamilyMemberId rejection;
- unknown, soft-deleted, and cross-household FamilyMember rejection;
- duplicate display names allowed;
- list/get exclusion of soft-deleted records;
- update of name, nickname, relationship, custom label, scope, member reference, initials, and avatar selection;
- PrivateToMember to Shared update clearing FamilyMemberId;
- DELETE soft deletion.

# Verified

- `dotnet restore HomeOps.sln` passed with an existing NU1903 warning for `SQLitePCLRaw.lib.e_sqlite3` in the test project.
- `dotnet build HomeOps.sln --no-restore` passed with the same NU1903 warning.
- `dotnet test tests/HomeOps.Api.Tests/HomeOps.Api.Tests.csproj --no-build --filter KnownPersonApiTests` passed: 22/22 in the field-length follow-up validation.
- `dotnet test tests/HomeOps.Api.Tests/HomeOps.Api.Tests.csproj --no-build --filter "KnownPersonApiTests|AvatarCatalogTests|FamilyMemberApiTests"` passed: 72/72 in the field-length follow-up validation.
- `dotnet test tests/HomeOps.Api.Tests/HomeOps.Api.Tests.csproj --no-build` passed: 411/411 in the field-length follow-up validation.
- `dotnet ef migrations script --project src/HomeOps.Api/HomeOps.Api.csproj --startup-project src/HomeOps.Api/HomeOps.Api.csproj --idempotent --output /tmp/knownpeople-migration.sql` passed.
- `nswag run nswag.json` passed and regenerated OpenAPI plus the generated TypeScript client artifact.

# Risks and Follow-up Work

- The repository test host uses the EF InMemory provider, so PostgreSQL-specific enforcement is validated through generated migration/script inspection rather than a live PostgreSQL apply in this slice.
- The generated TypeScript client changed because NSwag emits all API contracts, but no frontend production code was manually implemented or integrated.
- Future slices still need People management UX, member-page placement, picker read models, and decorative use cases without changing the semantic FamilyMember-only references in existing domains.

# Modified Files

- `src/HomeOps.Api/KnownPeople/*`
- `src/HomeOps.Api/Data/HomeOpsDbContext.cs`
- `src/HomeOps.Api/Program.cs`
- `src/HomeOps.Api/Migrations/20260710194203_AddKnownPeopleFoundation.cs`
- `src/HomeOps.Api/Migrations/20260710194203_AddKnownPeopleFoundation.Designer.cs`
- `src/HomeOps.Api/Migrations/HomeOpsDbContextModelSnapshot.cs`
- `src/HomeOps.Contracts/openapi.json`
- `src/HomeOps.Client/src/api/homeOpsApiClient.ts`
- `tests/HomeOps.Api.Tests/Lists/KnownPersonApiTests.cs`
- `docs/state/current-state.md`
- `docs/reports/2026-07-10-avatar-contacts-v1-backend/avatar-contacts-v1-backend.md`
