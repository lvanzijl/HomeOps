# Home Family Strip Compaction

## Summary
Made the Family Member strip more compact while keeping current initial-based placeholders.

## Implemented
- Removed repeated `On the board` copy.
- Kept member name, initials, and display color.
- Reduced chip and avatar dimensions.
- Did not add avatars, ownership, points, badges, persistence, or profile behavior.

## Verified
- HomeDashboard unit test still confirms the Family Members region and member names render.

## Risks
- Family Members remain lightweight placeholders until a separate avatar/ownership analysis slice defines richer behavior.

## Modified Files
- `src/HomeOps.Client/src/home/HomeDashboard.tsx`
- `src/HomeOps.Client/src/styles.css`

## Next Prompt Context
Avatar redesign remains deferred; do not implement avatar models, editors, or badges without a separate prompt.
