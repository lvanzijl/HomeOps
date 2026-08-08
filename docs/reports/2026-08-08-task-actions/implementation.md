# Phase 4 Slice 4.1 — Directly operable task actions

## Outcome

Task cards no longer use an unlabeled click-to-select list item. Each card is a non-interactive `<li>` containing independently named semantic controls for title/details, Complete or Reopen, eligible Tomorrow, and More. Primary actions are visible without hover, focus, or selection state.

The More popup is now a controlled menu rendered through a document-level portal. It measures its trigger, flips and clamps within the viewport, stays outside Tasks and task-list clipping ancestors, and owns a bounded internal overflow region. Opening the menu focuses its first item after positioning; Escape closes it and restores trigger focus, outside pointer interaction closes it, and task actions close the menu before continuing.

The implementation follows `docs/reports/2026-08-08-tasks-interaction-analysis/viewport-analysis.md`. The fixed command band, Today/Planning grid, secondary rail, and existing internal list/dialog overflow ownership are unchanged.

## Interaction contract delivered

- Removed `selectedTaskId`, whole-card click/keyboard handlers, `tabIndex`, and `aria-selected` from task cards.
- Added a named title/details button that opens the existing editor.
- Kept Complete/Reopen and valid Tomorrow as direct, visible, task-specific buttons.
- Added a named More button with `aria-haspopup`, `aria-expanded`, and `aria-controls`.
- Portalled Edit and recurring-series removal into a `role="menu"` outside clipping containers.
- Added viewport positioning, edge clamping, vertical flipping, resize repositioning, scroll closure, Escape behavior, outside-click closure, and focus return.
- Kept action targets at least 40×40 CSS pixels and compacted metadata before actions at constrained heights.

## Tests

Component coverage now verifies that the list item is non-interactive, direct actions are present, menu state is exposed, initial menu focus is correct, Escape restores focus, and outside interaction closes the menu. Existing edit and recurring-action tests use the new semantic controls.

The Playwright task scenario is no longer an expected failure. At 1280×720 it verifies real center-point hit targets and minimum 40×40 geometry for Details, Complete, Tomorrow, More, and Edit; successful mutations; portalled menu viewport bounds; Enter and Space opening; first-item focus; Escape focus return; outside-click closure; and absence of horizontal or vertical document overflow. The existing primary-page checks continue covering 1440×900 and 1366×768.

## Validation

- Focused Tasks frontend tests: 12/12 passed.
- Full frontend tests with the repository's extended timeout: 342/342 passed.
- Frontend production build: passed.
- Full backend tests: 622/622 passed.
- Full solution build: passed with the pre-existing `SQLitePCLRaw.lib.e_sqlite3` NU1903 advisory warning and no errors.
- PostgreSQL-backed Playwright smoke suite through Rancher Desktop: 6/6 passed.
- `git diff --check`: passed.

No API contract, backend behavior, database schema, migration, generated client, screenshot, video, or binary artifact changed.
