# 2026-06-26 Shopping Grouping Analysis

## Summary

Shopping is not grouped correctly because Home and the Shopping/List surface do not share a grouping model or selector. The backend item model only persists `PreferredStore` plus lifecycle fields; it has no category, section, group, source, or derived grouping field. The Shopping widget groups visually by persisted `preferredStore` after splitting items by lifecycle, while Home uses a separate list-summary projection, flattens active items from every list, limits the first four items globally, and renders a plain `<ul>` with only inline store text.

## Current Data Flow

- Backend list persistence uses the generic Lists domain. `ListItem` stores item text, completion/deletion lifecycle fields, optional `PreferredStore`, and audit timestamps. It does not store category, section, group, status enum, source, or origin.
- `GET /api/lists` returns list summaries with an `ItemCount` that includes active items plus recently completed/deleted items inside a 24-hour undo window.
- `GET /api/lists/{listId}` returns list details filtered to hide expired completed/deleted items, ordered by deleted state, completed state, creation time, then text. It attaches store suggestions from shopping purchase history by normalized exact item text.
- Home calls `loadListSummaries()`, which calls `getLists()` and then `getListById()` for non-empty lists. It maps only incomplete items to `{ id, text, preferredStore }`, discarding completion/deletion timestamps and store suggestions.
- Home quick capture separately calls `loadShoppingList()` to find the Shopping list id, then `addShoppingListItem()`, and refreshes list summaries.
- The Shopping widget calls `loadShoppingList()`, which selects the list named `Shopping` or falls back to the first list, then maps backend `ListItemDto` records into `ShoppingListItem` with lifecycle fields, `preferredStore`, and `storeSuggestions`.

## Current Grouping Behavior

- Backend grouping: none. Backend only filters and sorts list items; it does not group by store, category, section, status, or source.
- Shopping widget grouping: local render-only grouping by exact `preferredStore` inside `groupItemsByStore()`. Active, completed, and deleted sections are split first; each section then renders store groups alphabetically, with uncategorized last.
- Home grouping: none for shopping/list items. Home flattens active items from all returned lists, slices the first four globally, and renders them as a flat summary list. `preferredStore` is displayed as inline text, not as a group heading.
- Shared grouping: none. Home does not use `groupItemsByStore()`, and `groupItemsByStore()` is private to the widget component.
- Inference/learning: store suggestions are learned in `ShoppingPurchaseHistories`, but they are suggestion metadata only. New quick-captured items keep `preferredStore = null`; suggestions are not applied as a grouping field.

## Root Cause

1. **No shared grouping contract or selector.** Grouping exists only as private UI logic in the Shopping widget. Home uses `listsSummaryApi` and never calls that logic.
2. **The persisted grouping metadata is minimal.** The model has optional `PreferredStore`, but no category/section/group field and no automatic inference during quick capture.
3. **Home uses a flat projection.** `loadListSummaries()` strips list details down to active items and `HomeDashboard` flattens across lists before rendering, so grouping by store or by list is impossible at render time except by re-deriving it.
4. **Shopping grouping is visual only.** `groupItemsByStore()` groups by exact `preferredStore`; items with only store suggestions remain uncategorized.
5. **Lifecycle behavior differs by surface.** The backend detail endpoint temporarily returns completed/deleted items for undo. The Shopping widget deliberately renders those in completed/deleted sections. Home filters completed items through `item.isCompleted === false`, but it does not explicitly filter `isDeleted`; it relies on incomplete deleted items being completed or absent, which is a weak assumption.
6. **Tests lock in flat Home behavior.** Home tests assert `Milk (Supermarket)` as inline text and do not assert grouped shopping output. Widget tests assert store grouping only within the Shopping widget.

## Evidence

- `src/HomeOps.Api/Lists/ListItem.cs`: persisted fields are `Text`, `IsCompleted`, `CompletedUtc`, `IsDeleted`, `DeletedUtc`, `PreferredStore`, `CreatedUtc`, and `UpdatedUtc`; no category/store-section/group/status/source field beyond optional store.
- `src/HomeOps.Api/Lists/ListDtos.cs`: `ListItemDto` exposes lifecycle fields, `PreferredStore`, and `StoreSuggestions`; no grouping field.
- `src/HomeOps.Api/Lists/ListEndpoints.cs`: `LoadList()` filters lifecycle visibility and sorts items; `ToDto()` attaches suggestions; store history is keyed by normalized exact text and explicit store updates.
- `src/HomeOps.Api/Lists/ShoppingPurchaseHistory.cs`: learning model stores normalized item text, display text, store, and purchase count; it is not a category/group model.
- `src/HomeOps.Api/Data/HomeOpsDbContext.cs`: EF maps only `PreferredStore` as shopping metadata on list items and seeds list items without stores.
- `src/HomeOps.Client/src/shopping/shoppingListModel.ts`: frontend item model mirrors lifecycle plus optional `preferredStore` and `storeSuggestions`; no category/group field.
- `src/HomeOps.Client/src/shopping/listsApi.ts`: Shopping page/widget loads the Shopping list and preserves lifecycle, preferred store, and suggestions.
- `src/HomeOps.Client/src/shopping/listsSummaryApi.ts`: Home summary source maps only incomplete items to id/text/preferredStore and drops suggestions and lifecycle timestamps.
- `src/HomeOps.Client/src/home/HomeDashboard.tsx`: Home flattens all active list items, slices to four items, and renders a flat `<ul>` with optional inline preferred store.
- `src/HomeOps.Client/src/widgets/components/ShoppingListWidget.tsx`: Shopping widget splits active/completed/deleted items, then groups each section by exact `preferredStore` in private `groupItemsByStore()`.
- `tests/HomeOps.Api.Tests/Lists/ListApiTests.cs`: API tests cover lifecycle visibility and store suggestions, but not grouping contracts.
- `src/HomeOps.Client/src/shopping/listsSummaryApi.test.ts`: summary mapping test asserts active filtering only, not grouping or deleted filtering.
- `src/HomeOps.Client/src/widgets/components/ShoppingListWidget.test.tsx`: widget test covers local store grouping.
- `src/HomeOps.Client/src/home/HomeDashboard.test.tsx`: Home test expects inline `Milk (Supermarket)` and flat list overflow.

## Test Gaps

- No shared unit tests for shopping grouping across Home and Shopping/List.
- No Home tests asserting grouped shopping output when multiple active items have the same `preferredStore`.
- No Home tests verifying deleted items are excluded if an incomplete deleted item appears in the list-detail payload.
- No tests covering uncategorized ordering and store-group ordering in a shared utility.
- No tests confirming quick-captured items with store suggestions remain uncategorized until a store is explicitly selected, or product-confirmed inference is implemented.
- No backend/API contract test for grouping metadata because no such contract exists.
- Existing Home tests assert flat inline store rendering, which would resist the desired grouped behavior.

## Recommended Fix Direction

### 1. Home dashboard

- Keep Home summary-only, but stop rendering shopping as one undifferentiated flat list when `preferredStore` exists.
- Derive a small grouped summary from active, non-deleted items: store groups first, uncategorized last, with the existing global concise item limit applied carefully so group headings are not misleading.
- Prefer Dutch labels/copy in this surface when touching the UI.
- Explicitly filter `!isCompleted && !isDeleted` in the Home summary mapper or selector.

### 2. Shopping/List page

- Keep the richer lifecycle sections, but move grouping out of the component so behavior is testable and reusable.
- Decide whether store suggestions should remain suggestions only or become inferred display groups. If quick capture must remain frictionless and inference is desired, implement it explicitly rather than relying on `preferredStore`.
- Preserve completed/deleted undo sections separately from active groups.

### 3. Shared grouping utility or selector

- Add a shared shopping grouping utility/selector in the frontend shopping domain that accepts normalized active shopping/list items and groups by the agreed display grouping key.
- Start with `preferredStore` because it is the only persisted grouping metadata today.
- Include stable ordering rules: named groups alphabetically, uncategorized last, item order either backend order or a documented secondary sort.
- Use the shared selector from both Home and the Shopping widget/page to avoid contradictory behavior.

### 4. Tests

- Add unit tests for the shared grouping utility: store grouping, uncategorized fallback, ordering, and lifecycle exclusion.
- Update Home tests to assert grouped shopping summary rendering and no completed/deleted pollution.
- Update Shopping widget/page tests to assert it uses the same grouping semantics while preserving completed/deleted sections.
- Add a mapper test for `listsSummaryApi` to ensure deleted items are excluded, not only completed items.

## Risks / Open Questions

- Should Home summarize only the Shopping list or all active lists? Current Home summary flattens Shopping and Vacation Packing together.
- Should grouping be by store, category, store section, or family-friendly labels once category/section metadata exists?
- Should learned `ShoppingPurchaseHistories` infer a default group for new quick-captured items, or should users explicitly confirm a store first?
- What Dutch labels should replace current English UI copy (`Active`, `Completed`, `Uncategorized`, `Lists`, etc.)?
- How should the four-item Home limit behave when items span multiple groups?
- Is the Shopping/List page referenced by the product direction the current widget route/surface, or is a dedicated page planned elsewhere?
