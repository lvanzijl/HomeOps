# 2026-06-26 Home Shopping Visual Cleanup

## Summary
Cleaned up the Home Shopping summary card by removing Home-only visual and context noise while preserving Shopping grouping semantics and the full Shopping page behavior.

## Preflight Findings
- Repository instructions were inspected in `AGENTS.md`.
- `dotnet --version` returned `10.0.301` with `DOTNET_CLI_HOME=/tmp/dotnet-home`.
- Home Shopping is rendered in `HomeDashboard` from the dedicated shopping summary and uses the shared `groupShoppingItemsByPreferredStore()` utility.
- The Shopping page uses `ShoppingListWidget` and was not changed.
- Screenshot review context was available in `docs/reports/2026-06-26-full-product-screenshot-review/2026-06-26-full-product-screenshot-review.md`; it confirmed the Home Shopping summary showing a single `Zonder winkel` bucket with Bread, Coffee, and Milk.

## Implemented
- Removed the Home Shopping household/member-count context line.
- Hid Home Shopping group headings when exactly one visible group is rendered.
- Kept Home Shopping group headings when two or more visible groups are rendered.
- Removed the Home-specific list-row accent border from Shopping summary rows.

## Home Changes
- Home Shopping rows now render as compact plain item rows without the previous amber row marker.
- A single visible group now shows only item names under the Shopping card.
- Multiple visible groups still show preferred-store headings.
- The `+N more` behavior remains unchanged.

## Tests
- Updated focused `HomeDashboard` tests for household context removal, single-group heading hiding, multi-group heading preservation, item rendering, and `+N more` preservation.

## Verified
- Home dashboard tests were run.
- Shopping grouping tests were run because shared grouping behavior is part of this area, even though the grouping utility was not modified.
- Shopping widget tests were run to confirm Shopping page behavior was not affected by the narrow Home cleanup.
- Frontend build was run.
- Backend tests were not run because backend code was not touched.

## Risks
- CSS-only row accent removal is simple and Home-scoped, but visual confirmation was not captured because screenshots were explicitly out of scope.
- No grouping semantic changes were made; risk is limited to Home heading presentation.

## Modified Files
- `src/HomeOps.Client/src/home/HomeDashboard.tsx`
- `src/HomeOps.Client/src/home/HomeDashboard.test.tsx`
- `src/HomeOps.Client/src/styles.css`
- `docs/reports/2026-06-26-home-shopping-visual-cleanup/2026-06-26-home-shopping-visual-cleanup.md`

## Next Prompt Context
Home Shopping visual noise has been reduced. Future Home visual work should avoid Agenda, Tasks, Motivation, and Helpful Moments unless explicitly scoped. Agenda's separate purple first-event accent remains intentionally out of scope and still needs investigation before changing.
