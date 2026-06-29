# Shopping Marketing Rendering Fix

Date: 2026-06-29

## Summary

Fixed the VisualReview Shopping rendering mismatch where `visual-marketing-shopping` exposed one active localized `Boodschappen` list with active items, but the Shopping page treated that list as an auxiliary list and rendered the primary empty state.

No movie, screenshots, videos, audio, WAV files, storyboard changes, marketing fixture changes, Marketing Director changes, Recording Framework changes, Audio Framework changes, binary artifacts, or production UI redesign were produced.

## Root cause

The Shopping page data source only recognized a dedicated shopping list when its name was exactly `Shopping`. The marketing fixture creates the canonical list with the localized name `Boodschappen`, which Home already treated as a primary shopping-list name.

That name mismatch caused `loadShoppingPageLists()` to return an empty synthetic primary `Shopping` list and place the populated `Boodschappen` fixture list under supporting lists. The primary Shopping surface therefore rendered `Geen open boodschappen` even though the API returned one active populated list.

Home had a related summary mismatch risk because `loadShoppingListSummary()` depended on the generated `itemCount` value before fetching list details. The generated API client can be used with summary-like data in tests and runtime projections, so the Shopping summary should identify the dedicated list first and then fetch details to determine whether active items exist.

## Fix

- Centralized dedicated-list detection so both `Shopping` and localized `Boodschappen` names are recognized case-insensitively after trimming.
- Kept Shopping page rendering unchanged; the fix only corrects which API list becomes the primary Shopping page list.
- Updated Home shopping summary loading to fetch the dedicated shopping list details once the dedicated list exists, then derive active-item state from the detailed payload.
- Added focused tests for localized `Boodschappen` list selection and Home summary loading when item-count metadata is absent.

## Validation

- Focused Shopping tests passed:
  - `listsApi` localized-list selection.
  - `listsSummaryApi` localized summary loading.
  - existing grouping behavior.
  - existing Shopping widget behavior.
- Client production build passed.
- VisualReview runtime validation after resetting `visual-marketing-shopping` confirmed:
  - API reset returned one list and 18 list items.
  - `/api/lists` returned active list `Boodschappen` with `itemCount: 18`.
  - Shopping page primary surface rendered `Boodschappen per winkel` without `Geen open boodschappen`.
  - Grouped store sections rendered for `Albert Heijn`, `Jumbo`, `Kruidvat`, `Bakker`, and `HEMA`.
  - The quick-add input was enabled immediately, so the storyboard interaction can begin without navigating through empty states.
  - Home shopping summary rendered `18 actief` and displayed fixture items from the same list.
- The current checked-in `visual-marketing-shopping` fixture data contains grouped items such as `Volkoren pasta`, `Passata`, `Bananen`, and `Griekse yoghurt`; it does not currently contain `Bloem`, `Roomboter`, `Chocoladestukjes`, or `Vanillesuiker`. Per scope, the fixture was not modified.
- `git diff --check` passed.

## Modified files

- `src/HomeOps.Client/src/shopping/listsApi.ts`
- `src/HomeOps.Client/src/shopping/listsApi.test.ts`
- `src/HomeOps.Client/src/shopping/listsSummaryApi.ts`
- `src/HomeOps.Client/src/shopping/listsSummaryApi.test.ts`
- `docs/state/current-state.md`
- `docs/reports/2026-06-29-shopping-marketing-rendering-fix/shopping-marketing-rendering-fix.md`

## Explicit answers

- **Does the Shopping page now render the active marketing shopping list?** Yes.
- **Is the empty state removed?** Yes; the primary open-shopping empty state is no longer shown for the active marketing list.
- **Does the Shopping page match the marketing fixture?** Yes for the current checked-in fixture payload returned by the API.
- **Does the Shopping page match the Home shopping summary?** Yes; both now identify the localized `Boodschappen` list as the primary shopping list.
- **Was production runtime behavior changed?** No production-only path was changed; normal runtime still uses the API lists and now consistently recognizes both canonical and localized shopping-list names.
- **Was no movie intentionally produced?** Yes.
