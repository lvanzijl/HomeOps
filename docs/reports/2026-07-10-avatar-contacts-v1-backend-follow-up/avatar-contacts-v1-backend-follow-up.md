# Summary

Resolved the Avatar Contacts V1 Slice 1 backend contract follow-up by aligning KnownPerson field lengths with the canonical design and verifying the existing single-household resolution pattern. No frontend UI, People management, member-page integration, picker, decorative-avatar, authentication, permission, or unrelated cleanup work was added.

# Field-Length Resolution

The canonical Avatar Contacts V1 design already specifies `DisplayName varchar(160)`, `Nickname varchar(80)`, `CustomRelationshipLabel varchar(80)`, and `Initials varchar(8)`. The previous implementation used 120/120/120/8 by carrying over nearby repository conventions such as `FamilyMember.Name` rather than following the KnownPerson-specific contract. No stronger repository-wide convention was found that justified diverging from the canonical KnownPerson lengths.

Final accepted limits now match the canonical design:

- DisplayName: 160 characters.
- Nickname: 80 characters.
- CustomRelationshipLabel: 80 characters.
- Initials: 8 characters.

The EF configuration, unmerged migration, model snapshot, shared DTO length metadata, endpoint validation, implementation report, tests, and regenerated OpenAPI schema were updated consistently.

# Household Resolution

KnownPerson continues to use the repository-native single-household pattern based on `SeedHousehold.Id`, matching existing household-scoped endpoints in this application. No authentication, tenant resolver, or current-user abstraction was introduced.

The validation path was tightened so create/update capture the household context once and pass that same value into PrivateToMember FamilyMember validation. PrivateToMember references are accepted only when the FamilyMember is active, non-deleted, and in the same household context as the KnownPerson operation. Cross-household, unknown, and soft-deleted FamilyMember references remain rejected.

# Implemented

- Changed KnownPerson `DisplayName` persistence and validation from 120 to 160 characters.
- Changed KnownPerson `Nickname` persistence and validation from 120 to 80 characters.
- Changed KnownPerson `CustomRelationshipLabel` persistence and validation from 120 to 80 characters.
- Kept KnownPerson `Initials` at 8 characters.
- Edited the unmerged `AddKnownPeopleFoundation` migration and EF model snapshot to avoid adding a redundant follow-up migration.
- Passed a single household context through KnownPerson create/update validation.
- Added focused field-length boundary tests while retaining existing Slice 1 tests.

# Tests

Added or updated focused KnownPerson tests for:

- DisplayName at 160 characters succeeds.
- DisplayName at 161 characters is rejected.
- Nickname at 80 characters succeeds.
- Nickname at 81 characters is rejected.
- CustomRelationshipLabel at 80 characters succeeds.
- CustomRelationshipLabel at 81 characters is rejected.
- Initials at 8 characters succeeds.
- Initials at 9 characters is rejected.

Existing household tests continue to cover valid same-household PrivateToMember creation plus unknown, soft-deleted, and cross-household FamilyMember rejection. Existing CRUD tests continue to cover household-scoped get/list/update/delete behavior through the repository's seed-household context.

# Verified

- `dotnet restore HomeOps.sln` passed with the existing NU1903 warning for `SQLitePCLRaw.lib.e_sqlite3`.
- `dotnet build HomeOps.sln --no-restore` passed with the same NU1903 warning.
- `dotnet test tests/HomeOps.Api.Tests/HomeOps.Api.Tests.csproj --no-build --filter KnownPersonApiTests` passed: 22/22.
- `dotnet test tests/HomeOps.Api.Tests/HomeOps.Api.Tests.csproj --no-build --filter "KnownPersonApiTests|AvatarCatalogTests|FamilyMemberApiTests"` passed: 72/72.
- `dotnet test tests/HomeOps.Api.Tests/HomeOps.Api.Tests.csproj --no-build` passed: 411/411.
- `dotnet ef migrations script --project src/HomeOps.Api/HomeOps.Api.csproj --startup-project src/HomeOps.Api/HomeOps.Api.csproj --idempotent --output /tmp/knownpeople-followup-migration.sql` passed.
- `nswag run nswag.json` passed.

# Risks and Follow-up Work

- The repository still uses a single seed-household context. This is repository-native for the current application, but future tenant/auth work should centralize household resolution before adding multi-household runtime behavior.
- PostgreSQL-specific migration behavior was validated by script generation, not by applying to a live PostgreSQL container in this follow-up.
- The required NSwag workflow updated the OpenAPI schema with maxLength metadata. It did not produce a TypeScript client diff in this follow-up, and no frontend UI or API consumption was implemented.

# Modified Files

- `src/HomeOps.Api/KnownPeople/KnownPersonEndpoints.cs`
- `src/HomeOps.Api/Data/HomeOpsDbContext.cs`
- `src/HomeOps.Api/Migrations/20260710194203_AddKnownPeopleFoundation.cs`
- `src/HomeOps.Api/Migrations/20260710194203_AddKnownPeopleFoundation.Designer.cs`
- `src/HomeOps.Api/Migrations/HomeOpsDbContextModelSnapshot.cs`
- `src/HomeOps.Contracts/openapi.json`
- `tests/HomeOps.Api.Tests/Lists/KnownPersonApiTests.cs`
- `docs/reports/2026-07-10-avatar-contacts-v1-backend/avatar-contacts-v1-backend.md`
- `docs/reports/2026-07-10-avatar-contacts-v1-backend-follow-up/avatar-contacts-v1-backend-follow-up.md`
- `docs/state/current-state.md`
