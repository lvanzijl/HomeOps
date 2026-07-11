# Summary

Finalized the Avatar Contacts V1 Slice 6 Shopping decorative avatar contract without adding user-visible functionality. The follow-up enforces the nullable-pair invariant, centralizes reusable decorative-reference validation, expands backend validation coverage, regenerates OpenAPI/client artifacts, and corrects the original implementation report's Modified Files section.

# Contract Finalization

The persisted Shopping decorative avatar reference remains the same small source-type/source-id pair:

- `DecorativeAvatarReferenceType?`
- `DecorativeAvatarReferenceId?`

The only valid states are now explicitly enforced as:

- both null; or
- both populated.

The invariant is enforced in three places:

- EF model configuration adds the `CK_ListItems_DecorativeAvatar_NullablePair` check constraint.
- The new EF migration `EnforceShoppingDecorativeAvatarPair` adds the database check constraint for PostgreSQL-backed persistence.
- The reusable `DecorativeAvatarReferenceValidation` helper rejects DTO payloads where only one side of the pair is supplied.

Validation was centralized in `HomeOps.Api.DecorativeAvatars.DecorativeAvatarReferenceValidation`. This is deliberately small: it validates nullable-pair shape, reference type validity, active same-household `FamilyMember` references, and active same-household `KnownPerson` references. It does not introduce `AvatarProfile`, person inheritance, snapshots, or new persistence models. Future Tasks and Agenda slices can reuse this helper when they add their own decorative reference columns.

# Validation

The validation rules now covered are:

- unknown FamilyMember rejected;
- unknown KnownPerson rejected;
- soft-deleted FamilyMember rejected;
- soft-deleted KnownPerson rejected;
- cross-household FamilyMember rejected;
- cross-household KnownPerson rejected;
- unknown DecorativeAvatarReferenceType rejected;
- mismatched source type and source identifier rejected;
- nullable-pair invariant enforced for create and update payloads;
- clearing decorative avatar sets both persisted fields to null;
- updating decorative avatar preserves item text, completion, preferred store, deletion state, and ordering-relevant identity fields while only updating the normal `UpdatedUtc` timestamp.

Executed validation commands:

- `dotnet restore`
- `dotnet build --no-restore`
- `dotnet test --filter "FullyQualifiedName~ListApiTests"`
- `dotnet test --filter "FullyQualifiedName~ListApiTests|FullyQualifiedName~KnownPersonApiTests|FullyQualifiedName~FamilyMemberApiTests"`
- `dotnet test --no-build`
- `dotnet nswag run nswag.json` via the local NSwag console package
- `dotnet ef migrations add EnforceShoppingDecorativeAvatarPair --project src/HomeOps.Api --startup-project src/HomeOps.Api` via the local dotnet-ef package
- `dotnet ef migrations script --project src/HomeOps.Api --startup-project src/HomeOps.Api --output /tmp/homeops-shopping-decorative-avatar-follow-up.sql` via the local dotnet-ef package
- `npm run build`
- `npm test -- --run src/shopping/listsApi.test.ts src/widgets/components/ShoppingListWidget.test.tsx`
- `npm test`

Known unrelated warnings:

- .NET restore/build/test continues to report NU1903 for the existing `SQLitePCLRaw.lib.e_sqlite3` test dependency.
- npm continues to report the existing `http-proxy` config deprecation warning.
- Vite continues to report the existing chunk-size warning during production build.

# Tests

Backend tests were expanded to cover both-null and both-populated states, invalid pair combinations, unknown/soft-deleted/cross-household FamilyMember and KnownPerson references, source-type mismatch, clear persistence, and preservation of unrelated Shopping fields during decorative avatar update. Existing Shopping, KnownPerson, and FamilyMember tests were retained.

Frontend tests were not changed because this follow-up does not change user-visible behavior. Existing Shopping frontend tests continued passing against the regenerated client types.

# Verified

- Nullable-pair consistency is enforced at DTO validation, EF model, and database migration levels.
- Decorative avatar validation is reusable without over-abstracting the domain model.
- Shopping remains the only production consumer touched by this follow-up.
- Tasks, Agenda, People management, member pages, suggestions, authentication, and permissions were not modified.
- OpenAPI and generated TypeScript client artifacts were regenerated after the DTO nullability refinement.
- Repository-local tool caches were removed after validation and remain ignored.

# Risks and Follow-up Work

- Future Tasks and Agenda slices should reuse the centralized validation helper and the same nullable-pair persistence invariant.
- No picker UX improvements, search/ranking, suggestions, authentication, or permissions were implemented in this follow-up.

# Modified Files

- `docs/reports/2026-07-10-avatar-contacts-v1-shopping-decorative-avatars/avatar-contacts-v1-shopping-decorative-avatars.md`
- `docs/reports/2026-07-10-avatar-contacts-v1-shopping-decorative-avatars-follow-up/avatar-contacts-v1-shopping-decorative-avatars-follow-up.md`
- `docs/roadmap/phase-2.md`
- `docs/state/current-state.md`
- `src/HomeOps.Api/Data/HomeOpsDbContext.cs`
- `src/HomeOps.Api/DecorativeAvatars/DecorativeAvatarReferenceValidation.cs`
- `src/HomeOps.Api/Lists/ListDtos.cs`
- `src/HomeOps.Api/Lists/ListEndpoints.cs`
- `src/HomeOps.Api/Migrations/20260710222541_EnforceShoppingDecorativeAvatarPair.cs`
- `src/HomeOps.Api/Migrations/20260710222541_EnforceShoppingDecorativeAvatarPair.Designer.cs`
- `src/HomeOps.Api/Migrations/HomeOpsDbContextModelSnapshot.cs`
- `src/HomeOps.Client/src/api/homeOpsApiClient.ts`
- `src/HomeOps.Contracts/openapi.json`
- `tests/HomeOps.Api.Tests/Lists/ListApiTests.cs`
