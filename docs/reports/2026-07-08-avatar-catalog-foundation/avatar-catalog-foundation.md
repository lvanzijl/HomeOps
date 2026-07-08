# Summary

Implemented the first backend-only Avatar Catalog foundation slice. The backend now owns catalog validation, JSON avatar selections, legacy Avatar V2 mapping, EF persistence, and API write validation while preserving the existing Avatar V2 response contract.

# Implemented

- Added typed Avatar Catalog category, palette/color, item, renderer-binding, and selection models.
- Added a local catalog source/repository boundary and startup validation through `AvatarCatalogService`.
- Added first-class skin tone catalog items with stable IDs and accessibility labels.
- Added a JSON `AvatarSelection` value object persisted on family members with `schemaVersion` and `selections`.
- Added backend create/update validation for unknown IDs, category mismatches, unknown slots, unsupported schema versions, retired items, and missing required selections.
- Added legacy mapping from existing `AvatarV2Config` tokens to catalog item IDs and reverse mapping to preserve current Avatar V2 DTO compatibility.
- Added an EF Core migration that backfills existing Avatar V2 columns into `AvatarSelection` JSON.
- Added unit/API tests for catalog validation, invalid selections, legacy mapping, and seeded Avatar V2 migration behavior.

# Verified

- `dotnet build HomeOps.sln`
- `dotnet test tests/HomeOps.Api.Tests/HomeOps.Api.Tests.csproj --filter AvatarCatalogTests`
- `dotnet test tests/HomeOps.Api.Tests/HomeOps.Api.Tests.csproj`
- `dotnet-ef migrations script 20260706125153_AddCalendarRecurrenceV2PersistenceFoundation 20260708195654_AddAvatarCatalogFoundation --project src/HomeOps.Api/HomeOps.Api.csproj --startup-project src/HomeOps.Api/HomeOps.Api.csproj --no-build`

# Risks

- The frontend still writes `avatarV2Config`; this backend slice preserves that compatibility and returns `avatarSelection` for future frontend migration.
- Accessory colors now map to the shared clothing palette catalog IDs while legacy Avatar V2 response tokens are preserved through renderer-token mapping.
- The local catalog is currently code-defined for the backend slice; a future shared frontend slice can move the source-controlled definition to a format consumed by both apps.

# Modified Files

- `src/HomeOps.Api/AvatarCatalog/AvatarCatalogModels.cs`
- `src/HomeOps.Api/AvatarCatalog/AvatarCatalogService.cs`
- `src/HomeOps.Api/AvatarCatalog/AvatarCatalogValidator.cs`
- `src/HomeOps.Api/AvatarCatalog/AvatarSelection.cs`
- `src/HomeOps.Api/AvatarCatalog/LocalAvatarCatalogSource.cs`
- `src/HomeOps.Api/Data/HomeOpsDbContext.cs`
- `src/HomeOps.Api/FamilyMembers/FamilyMember.cs`
- `src/HomeOps.Api/FamilyMembers/FamilyMemberDtos.cs`
- `src/HomeOps.Api/FamilyMembers/FamilyMemberEndpoints.cs`
- `src/HomeOps.Api/Migrations/20260708195654_AddAvatarCatalogFoundation.cs`
- `src/HomeOps.Api/Migrations/20260708195654_AddAvatarCatalogFoundation.Designer.cs`
- `src/HomeOps.Api/Migrations/HomeOpsDbContextModelSnapshot.cs`
- `src/HomeOps.Api/Program.cs`
- `tests/HomeOps.Api.Tests/Lists/AvatarCatalogTests.cs`
- `docs/reports/2026-07-08-avatar-catalog-foundation/avatar-catalog-foundation.md`
- `docs/state/current-state.md`
