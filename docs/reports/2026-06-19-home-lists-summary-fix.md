# Home Lists Summary Fix

## Summary
Fixed the Home Lists summary data path so Home can render meaningful active list items instead of an empty state when the list index only returns summary rows.

## Implemented
- Changed Home list summary loading to fetch list details for non-empty lists using `getListById`.
- Kept active-item-only filtering.
- Preserved visible item limits and overflow routing.
- Added frontend regression coverage for detail loading and active item filtering.

## Verified
- `npm test --prefix src/HomeOps.Client`
- `npm run build --prefix src/HomeOps.Client`

## Risks
- Home now performs one detail request per non-empty list; acceptable for the current seeded MVP list count.

## Modified Files
- `src/HomeOps.Client/src/shopping/listsSummaryApi.ts`
- `src/HomeOps.Client/src/shopping/listsSummaryApi.test.ts`
- `src/HomeOps.Client/src/home/HomeDashboard.tsx`
- `docs/state/current-state.md`
- `docs/roadmap/phase-1.md`

## Next Prompt Context
If list volume grows, add a purpose-built backend Home summary endpoint rather than expanding Home-specific data models.
