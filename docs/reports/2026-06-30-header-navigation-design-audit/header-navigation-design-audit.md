# FamilyBoard Header Navigation Design Audit

Date: 2026-06-30

## Summary

The workspace primary navigation was measured against higher-emphasis and lower-emphasis FamilyBoard controls. The audit confirmed the primary navigation touch target was usable but visually undersized: each primary nav button measured 34.39 px tall, which was shorter than dialog primary actions (44 px), card actions (40.8 px), Weekly Reset actions (44 px), and the Shopping primary add action (48 px). The fix updates only shared navigation/back sizing tokens so the workspace navigation carries stronger visual authority without changing labels, colors, routes, or behavior.

## Before measurements

Measured with the VisualReview runtime at 1280×720 using `visual-marketing-home`, `visual-marketing-family`, `visual-marketing-tasks`, `visual-marketing-shopping`, and `visual-marketing-motivation`.

| Surface | Control | Width | Height | Icon | Text size | Horizontal padding | Vertical padding | Radius | Gap | Line height | Wrap |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | --- | --- |
| Home header | Thuis | 66.61 px | 34.39 px | 0 px | 14.08 px | 21.76 px | 11.52 px | 12 px | normal | 16.19 px | no |
| Home header | Agenda | 77.47 px | 34.39 px | 0 px | 14.08 px | 21.76 px | 11.52 px | 12 px | normal | 16.19 px | no |
| Home header | Taken | 63.89 px | 34.39 px | 0 px | 14.08 px | 21.76 px | 11.52 px | 12 px | normal | 16.19 px | no |
| Home header | Boodschappen | 127.66 px | 34.39 px | 0 px | 14.08 px | 21.76 px | 11.52 px | 12 px | normal | 16.19 px | no |
| Home header | Motivatie | 89.00 px | 34.39 px | 0 px | 14.08 px | 21.76 px | 11.52 px | 12 px | normal | 16.19 px | no |
| Home header | Instellingen admin nav | 116.17 px | 30.39 px | 16 px | 12.48 px | 21.76 px | 9.60 px | 12 px | 4 px | 14.35 px | no |
| Task dialog | Verder | 96.05 px | 44.00 px | 0 px | 16 px | 33.60 px | 21.76 px | 999 px | normal | normal | no |
| Weekly Reset | Deze week overslaan | 192.28 px | 44.00 px | 0 px | 16 px | 32.00 px | 2.00 px | 999 px | normal | normal | no |
| Shopping | Toevoegen | 135.39 px | 48.00 px | 0 px | 16 px | 36.80 px | 14.40 px | 999 px | normal | normal | no |
| Motivation | Doelen beheren | 205.72 px | 40.80 px | 16 px | 16 px | 35.84 px | 16.00 px | 999 px | 8.8 px | 18.4 px | no |

## Visual hierarchy analysis

The intended hierarchy is workspace navigation first, then primary dialog actions, then card actions, then compact actions/chips. Before the change, the primary workspace navigation was 34.39 px tall and had 21.76 px total horizontal padding. That made it visually smaller than dialog, card, Weekly Reset, and Shopping actions despite navigation being the top-level wayfinding system. The admin navigation remained appropriately secondary at 30.39 px and was not the target of the refinement.

## Design token changes

Only shared navigation/back design tokens were changed:

- `--fb-button-nav-min-height`: `2.15rem` → `3rem` (48 px).
- `--fb-button-nav-padding-block`: `0.36rem` → `0.62rem`.
- `--fb-button-nav-padding-inline`: `0.68rem` → `0.9rem`.
- `--fb-button-back-size`: `2.75rem` → `3rem` (48 px).

Typography, color, border, shadow, border radius, navigation labels, and navigation behavior were left unchanged. Admin navigation retained its smaller admin-specific token values.

## After measurements

| Surface | Control | Width | Height | Icon | Text size | Horizontal padding | Vertical padding | Radius | Gap | Line height | Wrap |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | --- | --- |
| Home header | Thuis | 73.64 px | 48.00 px | 0 px | 14.08 px | 28.80 px | 19.84 px | 12 px | normal | 16.19 px | no |
| Home header | Agenda | 84.50 px | 48.00 px | 0 px | 14.08 px | 28.80 px | 19.84 px | 12 px | normal | 16.19 px | no |
| Home header | Taken | 70.92 px | 48.00 px | 0 px | 14.08 px | 28.80 px | 19.84 px | 12 px | normal | 16.19 px | no |
| Home header | Boodschappen | 134.69 px | 48.00 px | 0 px | 14.08 px | 28.80 px | 19.84 px | 12 px | normal | 16.19 px | no |
| Home header | Motivatie | 96.03 px | 48.00 px | 0 px | 14.08 px | 28.80 px | 19.84 px | 12 px | normal | 16.19 px | no |
| Home header | Instellingen admin nav | 116.17 px | 30.39 px | 16 px | 12.48 px | 21.76 px | 9.60 px | 12 px | 4 px | 14.35 px | no |
| Task dialog | Verder | 96.05 px | 44.00 px | 0 px | 16 px | 33.60 px | 21.76 px | 999 px | normal | normal | no |
| Weekly Reset | Deze week overslaan | 192.28 px | 44.00 px | 0 px | 16 px | 32.00 px | 2.00 px | 999 px | normal | normal | no |
| Shopping | Toevoegen | 135.39 px | 48.00 px | 0 px | 16 px | 36.80 px | 14.40 px | 999 px | normal | normal | no |
| Motivation | Doelen beheren | 205.72 px | 40.80 px | 16 px | 16 px | 35.84 px | 16.00 px | 999 px | 8.8 px | 18.4 px | no |

## Before/after comparison

| Metric | Before | After | Result |
| --- | ---: | ---: | --- |
| Primary nav height | 34.39 px | 48.00 px | Navigation now matches the strongest Shopping action height and exceeds dialog/card action heights. |
| Primary nav total horizontal padding | 21.76 px | 28.80 px | Labels have more breathing room with no copy or font-size changes. |
| Primary nav total vertical padding | 11.52 px | 19.84 px | The header controls have more visual authority while preserving the same text size. |
| Primary nav text size | 14.08 px | 14.08 px | Typography unchanged. |
| Primary nav icon size | 0 px | 0 px | No icons were introduced into primary nav buttons. |
| Primary nav wrapping | no | no | No new navigation wrapping was measured at 1280×720. |
| Admin nav height | 30.39 px | 30.39 px | Secondary admin control remained compact. |

## Validation

- The targeted VisualReview header audit was run before and after the token change.
- The primary nav now measures 48 px high with unchanged text size, unchanged radius, and no measured wrapping.
- Dialog primary, card action, Weekly Reset action, and Shopping action measurements were unchanged by the navigation-token update.
- The button text-fit audit was rerun after the change. It found no new navigation clipping/wrapping; six existing Agenda calendar/dialog compact controls were still reported as low side-padding risk-only findings by the conservative script and were not changed because this slice was limited to shared navigation tokens.
- Client tests and `git diff --check` were run after the implementation.

## Modified files

- `src/HomeOps.Client/src/styles.css`
- `docs/reports/2026-06-30-header-navigation-design-audit/header-navigation-design-audit.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

## Explicit answers

- Were the navigation buttons visually undersized? Yes. The primary nav measured 34.39 px tall before the fix, below dialog, card, Weekly Reset, and Shopping controls.
- Were measurements used to justify the change? Yes. The before/after tables above record DOM-derived dimensions.
- Was the navigation given greater visual authority? Yes. The primary nav now measures 48 px tall with more horizontal and vertical padding.
- Were shared design tokens updated? Yes. Only shared navigation/back sizing tokens were changed.
- Were touch targets preserved? Yes. Primary nav and the reserved back slot now use 48 px sizing.
- Did the existing button audit remain clean? No new navigation clipping or wrapping was measured; the conservative text-fit script still reports six pre-existing Agenda compact-control padding risks outside this navigation-token slice.
- Were screenshots or binaries committed? No.
- Was no movie intentionally produced? Yes. No movie was recorded or generated.
