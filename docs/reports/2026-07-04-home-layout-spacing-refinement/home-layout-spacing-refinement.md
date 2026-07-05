# Home Layout Spacing Refinement

## Summary

Implemented a small frontend-only Home refinement slice without redesigning the FamilyBoard Home composition, card structure, typography, or behavior.

Explicit confirmations:
- shopping groups are visually more compact;
- spacing between different stores is preserved;
- the Motivation section heading was removed;
- Home Motivation visible copy now reads as natural Dutch on the Home page;
- no functionality changed;
- no backend files changed;
- only the required screenshot was added as a binary artifact.

## Shopping Spacing Changes

- `/home/runner/work/HomeOps/HomeOps/src/HomeOps.Client/src/styles.css` now tightens only the shopping rows inside each store section on the Home card by reducing the per-item gap, min-height, and top/bottom padding.
- Store grouping remains unchanged in `/home/runner/work/HomeOps/HomeOps/src/HomeOps.Client/src/home/HomeDashboard.tsx`.
- Inter-store spacing remains owned by `.shopping-summary-groups`; browser validation confirmed the spacing between store sections is still separate from the tighter intra-store rows.
- Checkboxes, grouping, and existing shopping typography remain intact.

## Motivation Card Changes

- `/home/runner/work/HomeOps/HomeOps/src/HomeOps.Client/src/components/cards/Card.tsx` now allows a card header to omit a visible title when a page intentionally does not need one.
- `/home/runner/work/HomeOps/HomeOps/src/HomeOps.Client/src/home/HomeDashboard.tsx` uses that narrower header for the Home Motivation card so the redundant `Motivatie` heading is fully removed.
- The reward title, progress bar, celebration status, motivational message, navigation, and card actions remain intact.
- Home-only motivation presentation now localizes visible English fixture copy such as the family-goal title, celebration title, and remaining-progress sentence into natural Dutch while keeping the underlying backend data unchanged.

## Validation

- Setup: `npm ci`
- Focused post-change validation: `npm test -- src/home/HomeDashboard.test.tsx`
- Post-change validation: `npm run build`
- Full post-change validation: `npm test`
  - current repository status: fails in `src/widgets/components/AgendaWidget.test.tsx > AgendaWidget HomeOps Calendar event integration > keeps planning editing actions available for upcoming grouped events`
  - failure detail: `expected -1 to be less than -1` at `src/widgets/components/AgendaWidget.test.tsx:973`
- Browser validation against populated Home data with `POST /api/visual-review-fixtures/visual-marketing-home/reset`
  - confirmed no document/body vertical overflow at 1440×900;
  - confirmed no document/body vertical overflow at 1280×800;
  - confirmed three populated Home shopping store groups remained visible;
  - confirmed shopping rows render with tighter intra-store spacing while store-group spacing remains separate;
  - confirmed the Motivation header no longer renders a visible section heading;
  - confirmed the Home Motivation card shows Dutch visible copy, including `20 helpmomenten voor zondags pannenkoekenontbijt`, `Bijna zover`, and `Nog 8 helpmomenten tot zondags pannenkoekenontbijt.`

## Screenshot

- `/home/runner/work/HomeOps/HomeOps/docs/reports/2026-07-04-home-layout-spacing-refinement/home-layout-spacing-refinement.png`

## Modified Files

- `src/HomeOps.Client/src/components/cards/Card.tsx`
- `src/HomeOps.Client/src/home/HomeDashboard.tsx`
- `src/HomeOps.Client/src/home/HomeDashboard.test.tsx`
- `src/HomeOps.Client/src/styles.css`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-07-04-home-layout-spacing-refinement/home-layout-spacing-refinement.md`
- `docs/reports/2026-07-04-home-layout-spacing-refinement/home-layout-spacing-refinement.png`
