# Avatar V2 Slice 4 Final Legacy Persistence Removal

## Summary
Completed the final legacy avatar persistence removal slice. Legacy avatar fields were removed from the backend FamilyMember model, EF mapping, seed/default data, frontend fallback fixtures/types, and migration/model snapshot artifacts. Avatar V2 config remains supported and initials fallback remains permanent.

## Implemented
- Removed legacy avatar persistence properties from `FamilyMember`.
- Removed legacy avatar EF property mappings from `HomeOpsDbContext`.
- Removed server-side create/update defaults that existed only to satisfy legacy persistence columns.
- Removed legacy avatar values from deterministic seed helpers and visual review fixture members.
- Removed dead frontend legacy avatar fixture/type definitions and test payloads.
- Cleaned migration/model snapshot artifacts so fresh development schema no longer includes legacy avatar columns.
- Deleted the obsolete legacy avatar enum file.

## Verified
- Backend tests passed.
- Backend build passed.
- Relevant frontend tests passed.
- Frontend build passed.
- Inspected git diff before finalizing.
- Confirmed no public API legacy avatar fields exist.
- Confirmed no legacy avatar persistence references remain in runtime code.
- Confirmed Avatar V2 config remains supported.
- Confirmed initials fallback remains.
- Confirmed no screenshots/images were added.

## Removed Legacy Components
- `AgeGroup`
- `Presentation`
- `SkinTone`
- `HairColor` legacy FamilyMember property
- `HairStyle` legacy FamilyMember property
- `Glasses`
- `ShirtColor`
- Legacy avatar enum definitions
- Legacy avatar EF mappings
- Legacy avatar entity defaults
- Legacy avatar seed values
- Legacy avatar frontend fixture/type data
- Legacy avatar test-only payloads

## Risks
- Historical design/report documents still mention legacy avatar fields as historical context.
- Existing local developer databases created before this cleanup may need to be recreated because the product is not live and compatibility migrations were intentionally not preserved.

## Modified Files
- `src/HomeOps.Api/FamilyMembers/FamilyMember.cs`
- `src/HomeOps.Api/FamilyMembers/FamilyMemberAvatarEnums.cs`
- `src/HomeOps.Api/FamilyMembers/FamilyMemberEndpoints.cs`
- `src/HomeOps.Api/Data/HomeOpsDbContext.cs`
- `src/HomeOps.Api/VisualReviewFixtures/VisualReviewFixtureService.cs`
- `src/HomeOps.Api/Migrations/20260620084548_AddFamilyMemberPersistence.cs`
- `src/HomeOps.Api/Migrations/*.Designer.cs`
- `src/HomeOps.Api/Migrations/HomeOpsDbContextModelSnapshot.cs`
- `src/HomeOps.Client/src/home/familyMembers.ts`
- `src/HomeOps.Client/src/home/FamilyAvatar.test.tsx`
- `src/HomeOps.Client/src/home/familyMembersApi.test.ts`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-06-23-work/avatar-v2-slice4-final-legacy-removal.md`

## Remaining Legacy References
No legacy avatar persistence fields remain in runtime code, EF mappings, seed/default paths, frontend fixtures/types, or public API contracts. Historical documentation/report references remain only as past-context records. Avatar V2 remains the sole avatar model, initials fallback remains, no legacy avatar DTOs remain, no legacy avatar rendering remains, and no remaining runtime dependency on legacy avatar data exists.

## Next Prompt Context
Avatar V2 legacy removal is complete through Slice 4. FamilyAvatar renders Avatar V2 from `avatarV2Config` only and falls back to initials when Avatar V2 data is missing or invalid. Public API contracts no longer expose legacy avatar DTOs. Backend persistence no longer stores legacy avatar fields, and new development schema artifacts no longer create or seed those columns. The product is not live, so obsolete compatibility layers and legacy migration preservation were intentionally avoided.
