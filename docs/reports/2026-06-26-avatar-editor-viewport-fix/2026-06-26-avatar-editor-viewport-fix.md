# Avatar Editor Viewport Fix

## Summary
The Avatar editor now uses the available desktop width more efficiently and constrains the dialog to the viewport, keeping the header, live preview, and action buttons visible while the option area can scroll if needed.

## Preflight Findings
- The latest screenshot review captured the Avatar editor at 1440×1200 with a scroll height of 1525, so it already exceeded a taller-than-target viewport before considering the 1440×900 laptop target.
- The editor used the shared 44rem dialog width, forcing option tiles into narrow grids and stacking Hair, Hair color, Clothing, Clothing color, Accessory, and Accessory color vertically.
- The live preview card consumed a large fixed vertical footprint with a 20rem preview area and 18rem SVG, while also sitting beside a vertically stacked controls column.
- The largest vertical consumers were the three asset sections because each rendered multiple large preview tiles, followed by the preview card and repeated section padding/gaps.
- The controls could be grouped more efficiently by using horizontal space: keep Hair full-width for readability, then place Clothing/Accessory and swatch sections in a two-column controls area.

## Implemented
- Added Avatar-editor-specific dialog sizing so only the Avatar editor expands to a wider desktop modal and is capped to the viewport height.
- Kept the live preview and Save / Cancel / Reset actions in a fixed left column inside the dialog.
- Converted the Avatar options area to a compact two-column grid on desktop, with only that option area allowed to scroll.
- Tightened Avatar-editor-only padding, gaps, preview sizing, tile minimum height, and tile SVG size without changing the underlying controls or persistence flow.
- Preserved the existing single-column responsive fallback for narrow viewports.

## Viewport Improvements
- The dialog now uses `max-height: calc(100vh - 2rem)` to prevent exceeding a standard laptop viewport.
- The wide Avatar-specific modal reduces vertical stacking by using available horizontal space up to 72rem.
- The content grid uses `min-height: 0` and `overflow: hidden` so the controls pane can scroll internally instead of the entire dialog expanding.
- Header, preview, status, and action buttons remain outside the scrollable controls pane.

## Verified
- Avatar editor focused tests pass.
- Family Member / Parent Mode focused tests pass.
- Frontend production build passes.
- No backend code was touched, so backend tests were not run.

## Risks
- This is a CSS-only layout change; browser visual confirmation was not captured because screenshots were explicitly out of scope.
- Very small desktop heights may still require controls-area scrolling, by design.

## Modified Files
- `src/HomeOps.Client/src/styles.css`
- `docs/reports/2026-06-26-avatar-editor-viewport-fix/2026-06-26-avatar-editor-viewport-fix.md`

## Next Prompt Context
Review the Avatar editor in a 1440×900 viewport and verify the modal stays within the viewport with header, preview, and actions visible. If further tuning is needed, keep changes limited to Avatar editor layout/styles and avoid Avatar V2 rendering, persistence, Parent Mode behavior, and unrelated surfaces.
