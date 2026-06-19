# Home Chrome Cleanup

## Summary
Removed Home-facing framework/demo wording so Home reads as a family dashboard rather than a workspace framework demonstration.

## Implemented
- Replaced the app header copy with family-oriented Home copy.
- Hid Home workspace title/description/count chrome while preserving accessible Home heading and non-Home page chrome.
- Changed non-Home count wording from `Workspace` to `Page`.

## Verified
- `npm test --prefix src/HomeOps.Client`
- `npm run build --prefix src/HomeOps.Client`

## Risks
- Top-level navigation still exists by design to preserve existing navigation.

## Modified Files
- `src/HomeOps.Client/src/main.tsx`
- `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx`
- `src/HomeOps.Client/src/workspaces/workspaceModel.ts`
- `src/HomeOps.Client/src/styles.css`
- `docs/state/current-state.md`
- `docs/roadmap/phase-1.md`

## Next Prompt Context
Home chrome is cleaner; continue to preserve the existing dashboard structure and navigation if future visual work is requested.
