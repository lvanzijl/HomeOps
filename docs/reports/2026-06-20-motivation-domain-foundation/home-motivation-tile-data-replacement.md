# Home Motivation Tile Data Replacement

## Implemented
- Updated the Home Motivation tile to load the family goal from the Motivation API.
- The tile remains compact, shows only family-goal title/progress, and still routes to the Motivation page.
- Loading, empty, and error states fall back to safe compact copy without breaking Home.

## Boundaries
- Home does not show individual goals, rankings, balances, shop data, gems, or leaderboards.
