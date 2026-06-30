# Back Button Measured Layout Fix

## Summary
Fixed the oversized Family Member detail back button by moving the back action out of the Family Member page content header and into a reserved far-left slot in the main workspace navigation row.

## Root cause
The Thomas detail back action lived inside `.family-member-page-heading` as a `.compact-header-action` using `HomeOpsIcon`. A later broad image sizing rule for celebration/child icons overrode the base `.homeops-icon-asset img { width: 1em; height: 1em; }` rule, so the back SVG asset expanded to the full button area. Because the action was in page content rather than the top navigation row, the oversized control appeared detached from the navigation rhythm.

## Before measurements
VisualReview runtime: `visual-marketing-family` reset, Vite viewport 1280×720, Thomas opened from Family/Home.

| Metric | Family overview | Thomas detail before |
| --- | ---: | ---: |
| Back button width | n/a | 374.89 px |
| Back button height | n/a | 316.38 px |
| Icon width | n/a | 300 px |
| Icon height | n/a | 300 px |
| Back x/y | n/a | x 750.84 / y 65.77 |
| Distance from viewport left/top | n/a | left 750.84 / top 65.77 |
| Distance to page title | n/a | -971.47 px |
| Header/nav height | 34.39 px | 34.39 px |
| Comparable top-menu button | 62.45 × 34.39 px | 62.45 × 34.39 px |

## Layout change
- Added a reusable `WorkspaceBackSlot` in `WorkspaceShell` at the far left of `.workspace-nav`.
- The slot renders a real button only when a Family Member detail page is active.
- The slot renders a non-interactive `span` placeholder when no back action is available, preserving the same 44 px width.
- Removed the visible back control from `FamilyMemberPage` content heading.
- Scoped back-slot icon sizing so broad icon/image presentation rules cannot inflate the navigation icon.

## After measurements
VisualReview runtime: `visual-marketing-family` reset, Vite viewport 1280×720, Thomas opened from Family/Home.

| Metric | Family overview after | Thomas detail after |
| --- | ---: | ---: |
| Reserved back slot | 44 × 44 px | n/a |
| Back button width | n/a | 44 px |
| Back button height | n/a | 44 px |
| Icon width | n/a | 20 px |
| Icon height | n/a | 20 px |
| Back x/y | n/a | x 140.47 / y 10.39 |
| Distance from viewport left/top | n/a | left 140.47 / top 10.39 |
| Distance to page title | n/a | -30.20 px |
| Header/nav height | 44 px | 44 px |
| Comparable top-menu button | 62.45 × 34.39 px | 62.45 × 34.39 px |

## Before/after comparison
| Metric | Before | After | Result |
| --- | ---: | ---: | --- |
| Button width | 374.89 px | 44 px | Reduced to touch-sized navigation control |
| Button height | 316.38 px | 44 px | Reduced to accessible 44 px target |
| Icon width | 300 px | 20 px | Within 18–22 px target |
| Icon height | 300 px | 20 px | Within 18–22 px target |
| Position | Content header, x 750.84 / y 65.77 | Main nav, x 140.47 / y 10.39 | Moved into top menu/header row |
| Header/nav height | 34.39 px | 44 px | Stable with reserved back slot |

## Validation
- Family overview reserves the back slot with a non-interactive hidden placeholder.
- Thomas detail shows a 44 × 44 px back button at the far left of the top navigation row.
- The visible icon is 20 × 20 px and no longer inherits the oversized SVG/image scale.
- The touch target remains usable at 44 × 44 px.
- Returning from Thomas to Family overview works through the nav back button.
- Home/top-level Family overview keeps equivalent reserved space and exposes no interactive hidden back button.
- Avatar Editor entry/return remains inside the Family Member page and the top back slot remains independent of that modal flow.
- No marketing fixtures, storyboard, recording framework, Marketing Director, Audio Framework, screenshots, videos, audio, WAV files, or binary artifacts were changed or produced.

## Explicit answers
- Was the oversized Thomas back button measured before the fix? Yes.
- Was it moved into the top menu/header structure? Yes.
- Is space reserved when the back button is hidden? Yes.
- Was the back button measured again after the fix? Yes.
- Is the visible icon now within the target size? Yes, 20 × 20 px.
- Is the touch target still usable? Yes, 44 × 44 px.
- Were any unrelated navigation changes made? No.
- Was no movie intentionally produced? Yes, no movie was produced.

## Modified files
- `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx`
- `src/HomeOps.Client/src/home/FamilyMemberPage.tsx`
- `src/HomeOps.Client/src/styles.css`
- `src/HomeOps.Client/src/workspaces/WorkspaceShell.test.tsx`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-06-30-back-button-measured-layout-fix/back-button-measured-layout-fix.md`
