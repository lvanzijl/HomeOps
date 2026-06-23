# Avatar V2 Slice 1 Frontend/Product Cleanup

## Summary
Implemented the first legacy-removal preparation slice on the frontend only. Normal user-visible Family Member management no longer displays legacy avatar configuration fields, normal frontend-created/mock members now carry Avatar V2 defaults, and legacy avatar payload construction remains only as compatibility data for the current API contract.

## Implemented
- Replaced the Family Member parent/detail legacy avatar configuration list with Avatar V2-oriented status/fallback copy.
- Added Avatar V2 defaults to First Run Wizard and Home add-member flows while keeping the existing hidden legacy avatar compatibility payload.
- Added Avatar V2 config to normal frontend fallback/mock family members used by Home, Family Member, and Motivation flows.
- Added focused coverage for no visible legacy avatar configuration text, Avatar V2 defaults in creation flow, Motivation's Avatar V2 ownership cue, initials fallback preservation, and legacy update/create payload compatibility.
- No backend files changed.
- No API/contracts/DTOs changed.
- No migrations changed.
- Family Member UI no longer exposes legacy avatar configuration.
- Legacy compatibility payload remains where required by the current generated API contract.
- Initials fallback remains.

## Verified
- `npm test -- --run src/home/FamilyMemberPage.test.tsx src/FirstRunWizard.test.tsx src/workspaces/WorkspaceShell.test.tsx src/home/FamilyAvatar.test.tsx src/home/HomeDashboard.test.tsx src/MotivationPage.test.tsx src/home/familyMembersApi.test.ts`
- `npm run build`
- Inspected `git diff` before finalizing.
- Confirmed no backend, contract, migration, or screenshot/image files were changed.

## Risks
- Legacy avatar data still exists in frontend models and payload mappers until later API/contract slices remove it.
- Members returned without Avatar V2 config can still use the legacy renderer because renderer removal is explicitly deferred.
- Avatar V2 defaults are intentionally generic; a later migration/backfill decision is still needed for existing persisted households.

## Modified Files
- `src/HomeOps.Client/src/home/FamilyMemberPage.tsx`
- `src/HomeOps.Client/src/home/familyMembers.ts`
- `src/HomeOps.Client/src/FirstRunWizard.tsx`
- `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx`
- `src/HomeOps.Client/src/home/FamilyMemberPage.test.tsx`
- `src/HomeOps.Client/src/FirstRunWizard.test.tsx`
- `src/HomeOps.Client/src/MotivationPage.test.tsx`
- `src/HomeOps.Client/src/home/familyMembersApi.test.ts`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-06-23-work/avatar-v2-slice1-frontend-product-cleanup.md`

## Next Prompt Context
Avatar V2 Slice 1 is complete. Product-facing Family Member UI no longer displays legacy avatar configuration fields, normal frontend creation and fallback/mock members carry Avatar V2 config, current API compatibility payloads remain, and initials fallback remains. Next removal work should proceed to the renderer cleanup slice only after confirming the app should render initials for missing Avatar V2 config once the legacy renderer is removed; do not change backend contracts, generated clients, persistence, or migrations until their dedicated slices.
