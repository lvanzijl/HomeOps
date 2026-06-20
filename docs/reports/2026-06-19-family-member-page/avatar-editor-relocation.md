# Avatar Editor Relocation

## Summary
Moved avatar editing ownership from Home to the dedicated Family Member page.

## Implemented
- Removed Home avatar editor state and direct editor opening behavior.
- Kept existing avatar editor component and live preview controls.
- Opened the editor from the Family Member page only.

## Verified
- Frontend tests confirm Home selects a member without opening the editor.
- Frontend tests confirm the Family Member page opens the avatar editor and emits avatar updates.

## Risks
- Avatar changes still reset on reload because persistence remains out of scope.

## Modified Files
- `src/HomeOps.Client/src/home/HomeDashboard.tsx`
- `src/HomeOps.Client/src/home/HomeDashboard.test.tsx`
- `src/HomeOps.Client/src/home/FamilyMemberPage.tsx`
- `src/HomeOps.Client/src/home/FamilyMemberPage.test.tsx`

## Next Prompt Context
Do not reintroduce avatar editing on Home; keep editing on the Family Member page.
