# Home Family Member Cleanup

## Summary
Cleaned up Home so Family Members are navigational/contextual and Home stays a dashboard.

## Implemented
- Family Member strip now navigates to member detail pages.
- Removed Home editor affordance and edit-specific ARIA copy.
- Preserved compact avatar rendering and member visibility on Home.

## Verified
- Frontend tests cover Home rendering, member visibility, and member selection navigation.

## Risks
- Without persistence, Home reflects in-memory avatar edits only during the current session.

## Modified Files
- `src/HomeOps.Client/src/home/HomeDashboard.tsx`
- `src/HomeOps.Client/src/home/HomeDashboard.test.tsx`
- `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx`

## Next Prompt Context
Home should remain summary-first; route future member-specific editing or functionality away from Home.
