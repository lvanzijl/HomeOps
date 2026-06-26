# Summary

Implemented a focused Shopping page update so the top navigation remains **Shopping**, the dedicated Shopping list stays primary, and non-Shopping household lists remain accessible under a secondary **Other Lists** section.

# Preflight Findings

- Latest screenshot review inspected: `docs/reports/2026-06-26-full-product-screenshot-review/2026-06-26-full-product-screenshot-review.md`.
- The review reported that the Shopping page loaded only the dedicated Shopping list, while Home Shopping summary showed only Shopping items.
- Before this change, non-Shopping lists were not reachable from the Shopping page UI. Access disappeared at the widget/page layer because the Shopping workspace rendered only `ShoppingListWidget`, and that widget loaded a single list.
- `loadShoppingList` resolved the dedicated Shopping list by calling `getLists()`, picking the list named exactly `Shopping`, and falling back to the first list when Shopping was missing.
- `listsSummaryApi.ts` already had `loadListSummaries()` that can load all list details with active items, but Home now correctly uses `loadShoppingListSummary()` for the dedicated Shopping list only.
- The generated API client already exposes `getLists()` and `getListById()`, so backend changes were not needed.
- Existing item lifecycle APIs (`addListItem`, `toggleListItemCompletion`, `removeListItem`, `undoListItemLifecycle`, rename/archive/delete list) can operate on any list id.
- The Shopping widget was too coupled to the dedicated Shopping list because it called only `loadShoppingList()` and held one `listId`/`items` state pair.

# Implemented

- Added a Shopping-page loader that returns the dedicated Shopping list plus all non-Shopping lists separately.
- Kept `loadShoppingList()` available for Home quick capture and other existing callers, now backed by the Shopping-page loader.
- Refactored the Shopping widget into a primary Shopping surface plus reusable list surfaces for Other Lists.
- Added focused tests for dedicated Shopping loading, Other Lists reachability, non-Shopping list item management, Home-only Shopping summary behavior, grouping, item lifecycle, and top navigation.

# Shopping Page Changes

- Page heading and top-level mental model remain **Shopping**.
- The dedicated Shopping list is primary and expanded with the existing add, complete, remove, undo, preferred-store grouping, store suggestions, and list settings behavior.
- A secondary **Other Lists** section appears below Shopping and lists non-Shopping lists such as Vacation Packing and Camping.

# Other Lists Behavior

- Other Lists are compact by default using expandable list cards.
- Opening an Other List shows its items and supports add, complete, remove, undo, and list settings using the same persistence APIs.
- Other Lists deliberately do not show Shopping-specific store controls or store headings.
- Other Lists do not appear on Home.

# Tests

- `npm --prefix src/HomeOps.Client test -- --run src/widgets/components/ShoppingListWidget.test.tsx src/shopping/listsApi.test.ts src/shopping/listsSummaryApi.test.ts src/home/HomeDashboard.test.tsx`
- `npm --prefix src/HomeOps.Client test -- --run src/workspaces/WorkspaceShell.test.tsx`
- `npm --prefix src/HomeOps.Client run build`

# Verified

- Shopping page still shows the dedicated Shopping list.
- Shopping page shows non-Shopping lists under Other Lists.
- Other Lists are reachable and usable through the Shopping page UI.
- Home still only uses the dedicated Shopping summary.
- Non-Shopping lists do not appear on Home.
- Shopping grouping still works for the dedicated Shopping list.
- Shopping item lifecycle behavior still works.
- Top navigation remains Shopping.
- Backend code was not touched, so backend tests were not run.

# Risks

- The Shopping-page loader now loads details for every list so Other Lists can be immediately usable. This is acceptable for the current small household-list scope but may need pagination or lazy detail loading if list volume grows substantially.
- Other Lists reuse the shared list item model, so list items still technically support `preferredStore` in persisted data, even though the Other Lists UI hides Shopping-specific store controls.

# Modified Files

- `src/HomeOps.Client/src/shopping/listsApi.ts`
- `src/HomeOps.Client/src/shopping/listsApi.test.ts`
- `src/HomeOps.Client/src/widgets/components/ShoppingListWidget.tsx`
- `src/HomeOps.Client/src/widgets/components/ShoppingListWidget.test.tsx`
- `src/HomeOps.Client/src/styles.css`
- `docs/reports/2026-06-26-shopping-other-lists/2026-06-26-shopping-other-lists.md`

# Next Prompt Context

The Shopping page now preserves the Shopping-first navigation model while restoring access to non-Shopping lists under Other Lists. Future work can refine the compact Other Lists presentation or add list creation if product scope calls for it, but this slice intentionally avoided backend/schema changes and avoided changing Home behavior.
