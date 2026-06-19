# Home Family Member Visual Improvement

## Summary
Improved Family Member presentation with lightweight avatar cards while preserving name, color, initials, and non-authentication semantics.

## Implemented
- Changed plain chips into stronger member cards with shaped color avatars.
- Added simple `On the board` context copy.
- Added Home list context showing the board is shared by household members.

## Verified
- `npm test --prefix src/HomeOps.Client`
- `npm run build --prefix src/HomeOps.Client`

## Risks
- Context copy is intentionally lightweight and does not imply profiles, ownership, permissions, or task assignment.

## Modified Files
- `src/HomeOps.Client/src/home/HomeDashboard.tsx`
- `src/HomeOps.Client/src/styles.css`
- `docs/state/current-state.md`
- `docs/roadmap/phase-1.md`

## Next Prompt Context
Family Members remain presentation-only household entities; do not add authentication, profiles, ownership logic, gamification, or permissions without a future explicit slice.
