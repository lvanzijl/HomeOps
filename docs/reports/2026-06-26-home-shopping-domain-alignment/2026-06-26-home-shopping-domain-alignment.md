# 2026-06-26 Home Shopping Domain Alignment

## Summary

Aligned the Home Shopping card with the Shopping domain by sourcing it only from the dedicated `Shopping` list. Home no longer summarizes generic list storage entities such as packing, camping, Christmas, party, or IKEA lists.

## Preflight Findings

- Repository instructions were inspected before changes.
- Home loaded `loadListSummaries()`, which queried all non-empty list summaries, loaded each list detail, mapped active items, and returned every non-empty list to `HomeDashboard`.
- `HomeDashboard` flattened those returned lists into one shopping/list summary, so all active lists could appear in the Home Shopping card.
- The Shopping widget/page path uses `loadShoppingList()`, which resolves the dedicated `Shopping` list by name before loading its details.
- Home could reuse the same dedicated-name selection concept without changing backend APIs, persistence, Shopping widget behavior, Lists behavior, or the shared grouping utility.

## Implemented

- Exported the dedicated Shopping list name predicate from `listsApi.ts` so Home summary selection and Shopping list loading share the same name rule.
- Added `loadShoppingListSummary()` for Home to load only the dedicated `Shopping` list summary.
- Kept `loadListSummaries()` available and unchanged for generic list-summary use.
- Did not change grouping semantics, preferred-store ordering, lifecycle grouping, backend APIs, or persistence.

## Home Changes

- Home now calls `loadShoppingListSummary()` during initial load and refresh after quick capture.
- Home stores either the Shopping summary as a single-item summary array or an empty array when the Shopping list does not exist or has no active items.
- The existing grouped rendering, compact visible-item limit, and `+N more` behavior remain unchanged.
- The existing empty state still appears when no Shopping summary is available, without falling back to other lists.

## Tests

- Updated Home tests to mock the dedicated Shopping summary source.
- Verified Home shows Shopping items only and does not render Vacation Packing, Camping, Christmas, or their items.
- Verified existing grouping still renders preferred-store headings and `Zonder winkel`.
- Verified `+N more` behavior still works for Shopping-only items.
- Verified the existing Home empty state works when no Shopping summary exists.
- Added list-summary API tests for loading only the dedicated Shopping list and for not falling back to other lists when Shopping is missing.

## Verified

- `dotnet --version` returned `10.0.301`.
- `npm test -- HomeDashboard.test.tsx listsSummaryApi.test.ts ShoppingListWidget.test.tsx` passed.
- `npm run build` passed. Vite emitted the existing chunk-size warning for the built client bundle.
- Final diff inspection showed no backend, schema, roadmap, state, screenshot, or binary changes.

## Risks

- Dedicated Shopping selection remains exact-name based (`Shopping`) to preserve current Shopping page behavior.
- If a household renames the Shopping list, both the existing Shopping widget selection path and the new Home summary path still depend on the same exact-name rule.
- Broader domain/list naming policy remains a future product decision.

## Modified Files

- `src/HomeOps.Client/src/home/HomeDashboard.tsx`
- `src/HomeOps.Client/src/home/HomeDashboard.test.tsx`
- `src/HomeOps.Client/src/shopping/listsApi.ts`
- `src/HomeOps.Client/src/shopping/listsSummaryApi.ts`
- `src/HomeOps.Client/src/shopping/listsSummaryApi.test.ts`
- `docs/reports/2026-06-26-home-shopping-domain-alignment/2026-06-26-home-shopping-domain-alignment.md`

## Next Prompt Context

A future prompt can decide whether the dedicated Shopping list should be identified by immutable metadata instead of display name. This slice intentionally preserved current backend contracts and exact-name Shopping behavior.
