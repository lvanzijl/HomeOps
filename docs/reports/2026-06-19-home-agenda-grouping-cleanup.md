# Home Agenda Grouping Cleanup

## Summary
Grouped Home Agenda summary items under shared date buckets instead of repeating the bucket label on every row.

## Implemented
- Added grouped Home Agenda sections for `Today`, `Tomorrow`, and `Later / Next`.
- Kept the visible Agenda summary bounded at five items.
- Preserved overflow routing through the existing `+x more` action.
- Kept Home Agenda summary-only; no editing or full agenda management was added.

## Verified
- HomeDashboard unit test covers Today/Tomorrow rendering and Agenda overflow.

## Risks
- The grouping is based on the bounded visible set, so a later bucket may be hidden when earlier buckets fill the five-row cap.

## Modified Files
- `src/HomeOps.Client/src/home/HomeDashboard.tsx`
- `src/HomeOps.Client/src/styles.css`

## Next Prompt Context
Future urgency work can add priority cues inside the existing grouped summary without changing Agenda source-of-truth behavior.
