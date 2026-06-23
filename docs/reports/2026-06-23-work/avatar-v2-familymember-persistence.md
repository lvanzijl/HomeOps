# Avatar V2 FamilyMember Persistence

## Summary
Avatar V2 is now owned by `FamilyMember`. The implementation persists Avatar V2 user choices on the FamilyMembers table, round-trips those choices through FamilyMember API contracts, and connects the Family Member avatar editor to load, preview, save, cancel, and reset persisted member state.

## Domain Model
- Added `AvatarV2Config` as a FamilyMember value object for intent only: `HeadVariant`, `HairStyle`, `HairColor`, `ClothingStyle`, `ClothingColor`, `Accessory`, and `AccessoryColor`.
- Chosen persistence model: EF owned value object mapped to dedicated `FamilyMembers` columns.
- Rationale: the config is small, stable, query-safe, and belongs exclusively to a FamilyMember. Dedicated owned columns are simpler to validate and migrate than JSON, while avoiding a separate table for a seven-field value object.
- The model does not store SVG, rendered output, anatomy values, renderer state, profile state, users, identities, or permissions.

## API Changes
- FamilyMember DTOs now include `AvatarV2Config` alongside the existing legacy avatar DTO.
- Create and update requests accept optional Avatar V2 config and normalize missing values to Avatar V2 defaults.
- Existing FamilyMember create, update, delete, listing, and task-reference behavior remains functional.

## Editor Integration
- Removed browser-local Avatar V2 persistence from the editor configuration module.
- The Family Member avatar editor loads from the selected member's `avatarV2Config`, previews draft changes locally, saves by updating that FamilyMember, cancels back to persisted member state, and resets draft state to Avatar V2 defaults.
- Entry point remains the Family Member management page via “Edit avatar”.
- The editor labels the selected FamilyMember by name so the edit target is explicit.

## UX Review
- Father: Can find avatar editing from Parent Mode / Administration using “Edit avatar”. The page name and dialog heading make it clear which FamilyMember is being edited.
- Mother: Save, Cancel, and Reset are understandable. The only possible confusion is that Reset changes the draft to defaults but still requires Save; the unsaved status helps communicate that.
- Child (8 years old): A child can understand the visual tiles and swatches, but the entry point remains in Parent Mode. That is acceptable for this slice because the goal is FamilyMember management, not Child Workspace integration.

## Verification
- `dotnet --version`: 10.0.301.
- `dotnet test tests/HomeOps.Api.Tests/HomeOps.Api.Tests.csproj`: passed 125 tests; 0 failed.
- `npm test`: passed 116 tests across 25 files; 0 failed.
- `npm run build`: passed TypeScript build and Vite production build.
- `npm test -- --runInBand`: failed before tests because Vitest does not support the Jest `--runInBand` option.

## Risks
- The checked-in NSwag client was manually updated instead of regenerated because this slice did not run the API codegen pipeline.
- Existing legacy family avatar fields remain in place for existing FamilyAvatar rendering surfaces; Avatar V2 is persisted and editable but not rolled into Home, Child Workspace, Home dashboard, or Family Overview.

## Modified Files
- Backend domain/API/persistence: `src/HomeOps.Api/FamilyMembers/AvatarV2Config.cs`, `src/HomeOps.Api/FamilyMembers/FamilyMember.cs`, `src/HomeOps.Api/FamilyMembers/FamilyMemberDtos.cs`, `src/HomeOps.Api/FamilyMembers/FamilyMemberEndpoints.cs`, `src/HomeOps.Api/Data/HomeOpsDbContext.cs`, `src/HomeOps.Api/Migrations/20260623173647_AddAvatarV2FamilyMemberConfig.cs`, `src/HomeOps.Api/Migrations/20260623173647_AddAvatarV2FamilyMemberConfig.Designer.cs`, `src/HomeOps.Api/Migrations/HomeOpsDbContextModelSnapshot.cs`.
- Backend tests: `tests/HomeOps.Api.Tests/Lists/FamilyMemberApiTests.cs`.
- Frontend API/model/editor/tests: `src/HomeOps.Client/src/api/homeOpsApiClient.ts`, `src/HomeOps.Client/src/avatarV2/avatarConfig.ts`, `src/HomeOps.Client/src/avatarV2/avatarConfig.test.ts`, `src/HomeOps.Client/src/avatarV2/AvatarEditorPage.tsx`, `src/HomeOps.Client/src/avatarV2/AvatarEditorPage.test.tsx`, `src/HomeOps.Client/src/home/familyMembers.ts`, `src/HomeOps.Client/src/home/familyMembersApi.ts`, `src/HomeOps.Client/src/home/FamilyAvatarEditor.tsx`, `src/HomeOps.Client/src/home/FamilyAvatarEditor.test.tsx`, `src/HomeOps.Client/src/home/FamilyMemberPage.test.tsx`.
- Documentation: `docs/state/current-state.md`, `docs/roadmap/phase-2.md`, this report.

## Next Prompt Context
Avatar V2 now has FamilyMember persistence and editor integration. Browser-local Avatar V2 storage has been removed. FamilyMember owns the Avatar V2 config, but broader rendering rollout remains intentionally blocked from Home, Family Overview, Child Workspace, dashboards, profiles, authentication, and permissions until a future prompt explicitly scopes those surfaces.
