# Motivation Frontend Data Replacement

## Implemented
- Replaced page-level use of the hardcoded Motivation snapshot with generated NSwag client loading.
- Kept shared mapping/helpers in `motivationData.ts` while removing seeded UI data from the client.
- Motivation page now renders loading, neutral empty, and error-safe states while preserving the existing encouragement layout.
- Individual goals are joined to the loaded Family Member collection by persisted Family Member id.

## Boundaries
- No goal editing or creation UI was added.
- No Reward Economy, shop, gems, balances, or leaderboards were introduced.
