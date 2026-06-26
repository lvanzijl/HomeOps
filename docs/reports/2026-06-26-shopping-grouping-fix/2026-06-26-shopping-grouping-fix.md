# 2026-06-26 Shopping Grouping Fix

## Summary

Implemented a narrow frontend-only grouping fix for shopping items. Home and the Shopping widget now use one shared shopping-domain grouping utility based on `preferredStore`, with active-only lifecycle exclusion available for Home and summary projections.

## Preflight Findings

- Repository instructions were inspected before changes.
- The previous Shopping Grouping Analysis confirmed no backend grouping contract exists beyond optional `PreferredStore`.
- `HomeDashboard.tsx` flattened list summary items, truncated globally, and rendered `preferredStore` inline as `Milk (Supermarket)`.
- `listsSummaryApi.ts` filtered completed items but did not explicitly filter deleted items.
- `ShoppingListWidget.tsx` had a private `groupItemsByStore()` implementation and rendered English `Uncategorized` labels.
- Existing Home tests asserted flat inline store rendering; existing Shopping widget tests only covered the private widget grouping path.

## Implemented

- Added `shoppingGrouping.ts` as the single frontend shopping grouping utility.
- Grouping uses exact `preferredStore` only.
- Named store groups sort alphabetically.
- No-store items render last with the Dutch label `Zonder winkel`.
- Item order is preserved within each group.
- Active-only grouping excludes completed and deleted items using both backend-style and frontend-style lifecycle field names.

## Home Changes

- Home now explicitly filters active list summary items with the shared shopping lifecycle predicate.
- Home determines the visible compact item set first, then groups only the visible items to avoid misleading group headings.
- Home renders store headings once and item names underneath.
- Home no longer renders inline `Milk (Supermarket)` style output.
- The existing compact item limit and `+N more` behavior are preserved.

## Shopping Changes

- Removed the private Shopping widget grouping implementation.
- Shopping widget lifecycle sections remain unchanged: active, completed, and recently deleted sections are still separate.
- Each Shopping lifecycle section now uses the shared grouping utility with inactive filtering disabled because the section is already lifecycle-filtered.
- Preferred-store updates, undo behavior, removal behavior, and store suggestions behavior are preserved.
- Store suggestions remain suggestions only and do not affect grouping unless `preferredStore` is set.

## Tests

- Added shared grouping utility tests for grouping, sorting, no-store ordering, item order preservation, and completed/deleted exclusion.
- Updated Home tests to assert grouped shopping rendering, one store heading per store, no repeated list/container item labels, no inline store formatting, deleted/completed exclusion, and preserved `+N more` behavior.
- Updated Shopping widget tests to assert the shared no-store Dutch label and that suggestion-only items remain in the no-store group.
- Updated list summary mapping tests to assert deleted items are excluded.

## Verified

- `dotnet --version` returned `10.0.301`.
- `npm test -- shoppingGrouping.test.ts HomeDashboard.test.tsx ShoppingListWidget.test.tsx listsSummaryApi.test.ts` passed.
- `npm run build` passed. Vite emitted the existing chunk-size warning for the built client bundle.
- Final diff inspection showed no backend, schema, roadmap, state, screenshot, or binary changes.

## Risks

- Home still summarizes all active lists returned by the list summary API, not only the Shopping list. This matches the current Home data flow but remains a product question.
- The no-store label is now Dutch where this grouping label is touched, while broader surrounding Shopping/Home copy remains mixed English.
- Grouping remains limited to explicit `preferredStore`; category/section/source fields and purchase-history inference remain out of scope.

## Modified Files

- `src/HomeOps.Client/src/shopping/shoppingGrouping.ts`
- `src/HomeOps.Client/src/shopping/shoppingGrouping.test.ts`
- `src/HomeOps.Client/src/shopping/listsSummaryApi.ts`
- `src/HomeOps.Client/src/shopping/listsSummaryApi.test.ts`
- `src/HomeOps.Client/src/widgets/components/ShoppingListWidget.tsx`
- `src/HomeOps.Client/src/widgets/components/ShoppingListWidget.test.tsx`
- `src/HomeOps.Client/src/home/HomeDashboard.tsx`
- `src/HomeOps.Client/src/home/HomeDashboard.test.tsx`
- `src/HomeOps.Client/src/styles.css`
- `docs/reports/2026-06-26-shopping-grouping-fix/2026-06-26-shopping-grouping-fix.md`

## Next Prompt Context

A future prompt can decide whether Home should show only the Shopping list or continue summarizing all active lists, and whether learned purchase-history suggestions should become explicit inferred grouping metadata after product confirmation.
