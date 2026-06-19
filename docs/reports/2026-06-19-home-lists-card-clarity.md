# Home Lists Card Clarity

## Summary
Replaced the abstract Lists card heading with concrete list-oriented naming.

## Implemented
- Removed the `Remember` card title.
- Uses the Shopping/Boodschappen list name when present, falling back to the first available list or generic `Lists`.
- Preserved multiple-list item rendering by continuing to show each active item's source list name.
- Preserved active item limits and overflow routing.

## Verified
- HomeDashboard unit test covers Shopping list item rendering, Vacation Packing list labeling, and Lists overflow.

## Risks
- The heading follows current seeded/API list names and does not introduce localization infrastructure.

## Modified Files
- `src/HomeOps.Client/src/home/HomeDashboard.tsx`

## Next Prompt Context
If UI language selection is introduced later, map list display names through that localization layer rather than hard-coding more labels here.
