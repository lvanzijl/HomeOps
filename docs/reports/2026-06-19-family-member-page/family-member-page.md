# Family Member Page

## Summary
Created a dedicated frontend Family Member page so member details and future member-specific functionality live outside Home.

## Implemented
- Added a page for a selected Family Member from the Home strip.
- Displayed avatar, name, display color, and current avatar configuration.
- Added non-functional Tasks and Points placeholders marked as coming later.

## Verified
- Covered by frontend tests for member detail rendering and placeholders.

## Risks
- Page state remains frontend-only and in-memory until a future persistence slice defines durable Family Members.

## Modified Files
- `src/HomeOps.Client/src/home/FamilyMemberPage.tsx`
- `src/HomeOps.Client/src/home/FamilyMemberPage.test.tsx`
- `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx`

## Next Prompt Context
Future Family Member work should keep members as household entities, not users/profiles/auth identities, unless explicitly rescoped.
