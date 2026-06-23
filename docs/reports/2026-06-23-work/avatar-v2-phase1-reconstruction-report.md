# Avatar V2 Phase 1 Reconstruction Report

## Summary

The current repository does not contain the intended Avatar V2 Phase 1 display rollout. No shared Avatar V2 display renderer/component is present, and the Family Member hero, Child hero area, and Home family strip still render through the existing legacy `FamilyAvatar` CSS/span implementation.

The Avatar V2 work actually present in the tree is earlier persistence/editor preparation: FamilyMember-owned `avatarV2Config`, backend DTO/API persistence support, generated TypeScript client support, the Avatar V2 editor preview flow, and related tests. That work is outside the stated Phase 1 display-rollout scope for this reconstruction.

## Implemented

- Avatar V2 engine/editor foundation exists under `src/HomeOps.Client/src/avatarV2/`.
- Family Member avatar editor uses Avatar V2 preview/rendering and saves `avatarV2Config` back to the selected `FamilyMember`.
- Frontend `FamilyMember` includes both legacy `avatar` and `avatarV2Config`.
- Frontend family member API mapper round-trips `avatarV2Config` while preserving/sending legacy avatar data.
- Backend FamilyMember model, DTOs, endpoints, EF mapping, migration, and API tests include Avatar V2 persistence support.
- Rollout analysis documentation exists at `docs/reports/2026-06-23-work/avatar-v2-rollout-analysis.md`.

## Verified

- Working tree was clean before this report was created.
- Current branch: `work`.
- Recent history shows Avatar V2 persistence and rollout-analysis documentation, but no later display-rollout implementation commit.
- `FamilyAvatar` still reads `member.avatar`, sets legacy CSS variables/classes, and falls back to initials when legacy avatar data is missing.
- Family Member hero still renders `<FamilyAvatar member={member} size="large" />`.
- Child hero area still renders `<FamilyAvatar member={member} size="large" />`.
- Home family strip still renders `<FamilyAvatar member={member} />` for each family chip.
- Motivation cards still render `FamilyAvatar`; they were not migrated to Avatar V2.
- Helpful Moments did not receive person-avatar rollout changes in the inspected tree.
- Relevant client tests passed: `npm test -- --run src/home/FamilyAvatar.test.tsx src/home/FamilyMemberPage.test.tsx src/home/HomeDashboard.test.tsx src/avatarV2/avatarConfig.test.ts src/avatarV2/avatarV2.test.ts src/home/FamilyAvatarEditor.test.tsx`.
- Client build passed: `npm run build`.
- Family Member API test filter exited successfully: `dotnet test --no-restore --filter "FullyQualifiedName~FamilyMemberApiTests"`.

## Out Of Scope Confirmations

For the intended Phase 1 display rollout, these remain out of scope and were not changed by this report:

- Motivation cards: still legacy `FamilyAvatar`; no Phase 1 migration applied.
- Helpful Moments: no Avatar V2 person-avatar rollout found.
- API contract changes: current tree already has Avatar V2 API/DTO/client/persistence work from earlier commits, but no additional contract work was performed for this report.
- DTO changes: current tree already has Avatar V2 DTO support from earlier commits, but no additional DTO work was performed for this report.
- Persistence changes: current tree already has Avatar V2 persistence and migration work from earlier commits, but no additional persistence work was performed for this report.
- Legacy avatar removal: not performed; legacy avatar model/rendering remains active.

## Unexpected Findings

- The intended Phase 1 display-rollout implementation is not present in the current tree.
- No shared Avatar V2 display component distinct from the editor preview path was found.
- The checked-in OpenAPI JSON still only shows legacy `avatar` on Family Member schemas in the inspected section, while the generated TypeScript client and C# DTOs include `avatarV2Config`. This predates this report and was not changed.
- The current repository already contains out-of-scope Avatar V2 persistence/API/DTO/migration work from prior commits. Therefore, the current overall repository state is broader than the intended Phase 1 display-rollout scope, even though the requested Phase 1 renderer rollout itself is absent.

## Modified Files

Files modified by this reconstruction task:

- `docs/reports/2026-06-23-work/avatar-v2-phase1-reconstruction-report.md`

Avatar V2-related files found in recent implementation history, not modified by this report:

- `docs/reports/2026-06-23-work/avatar-v2-familymember-persistence.md`
- `docs/reports/2026-06-23-work/avatar-v2-rollout-analysis.md`
- `docs/roadmap/phase-2.md`
- `docs/state/current-state.md`
- `src/HomeOps.Api/Data/HomeOpsDbContext.cs`
- `src/HomeOps.Api/FamilyMembers/AvatarV2Config.cs`
- `src/HomeOps.Api/FamilyMembers/FamilyMember.cs`
- `src/HomeOps.Api/FamilyMembers/FamilyMemberDtos.cs`
- `src/HomeOps.Api/FamilyMembers/FamilyMemberEndpoints.cs`
- `src/HomeOps.Api/Migrations/20260623173647_AddAvatarV2FamilyMemberConfig.Designer.cs`
- `src/HomeOps.Api/Migrations/20260623173647_AddAvatarV2FamilyMemberConfig.cs`
- `src/HomeOps.Api/Migrations/HomeOpsDbContextModelSnapshot.cs`
- `src/HomeOps.Client/src/api/homeOpsApiClient.ts`
- `src/HomeOps.Client/src/avatarV2/AvatarEditorPage.test.tsx`
- `src/HomeOps.Client/src/avatarV2/AvatarEditorPage.tsx`
- `src/HomeOps.Client/src/avatarV2/avatarConfig.test.ts`
- `src/HomeOps.Client/src/avatarV2/avatarConfig.ts`
- `src/HomeOps.Client/src/home/FamilyAvatarEditor.test.tsx`
- `src/HomeOps.Client/src/home/FamilyAvatarEditor.tsx`
- `src/HomeOps.Client/src/home/FamilyMemberPage.test.tsx`
- `src/HomeOps.Client/src/home/familyMembers.ts`
- `src/HomeOps.Client/src/home/familyMembersApi.ts`
- `tests/HomeOps.Api.Tests/Lists/FamilyMemberApiTests.cs`

## Remaining Work

- Add a shared Avatar V2 display renderer/component for non-editor surfaces.
- Roll out the shared display renderer to the Family Member hero.
- Roll out the shared display renderer to the Child hero area.
- Roll out the shared display renderer to the Home family strip.
- Preserve legacy avatar fallback behavior during rollout.
- Keep Motivation cards, Helpful Moments, API contracts, DTOs, persistence, migrations, and legacy avatar removal out of the Phase 1 display-rollout slice unless explicitly requested.
- Add/adjust focused tests for the shared display renderer and the three intended rollout surfaces.

## Next Prompt Context

Start from the current tree, where Avatar V2 persistence/editor preparation exists but Phase 1 display rollout is not implemented. Implement only the Phase 1 display rollout: shared Avatar V2 display renderer/component, Family Member hero, Child hero area, and Home family strip. Do not change Motivation cards, Helpful Moments, API contracts, DTOs, persistence, migrations, or remove legacy avatar support.
