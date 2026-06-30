# Oversized Image/Icon Audit

## Summary
Audited FamilyBoard icon and image containment after the measured Thomas back-button issue. The audit confirmed the same shared CSS defect still affected several `HomeOpsIcon` usages on Family Member/Thomas detail, Avatar Editor backdrop content, and Weekly Reset. The fix restores `HomeOpsIcon` as a self-contained `1em` icon host and removes the broad `.homeops-icon-asset img` selector from a later component-image scaling rule.

## CSS root cause analysis
The safe base rule near the top of `styles.css` intended `HomeOpsIcon` image assets to render at `1em`. A later broad rule grouped `.homeops-icon-asset img` together with specific celebration and child-memory image selectors and forced `height: 100%` and `width: 100%`. In contexts where the `HomeOpsIcon` wrapper did not own an explicit width/height, the browser resolved that percentage sizing against large layout areas or intrinsic SVG dimensions, producing 173–528 px icon boxes and several 300 px leaks.

The confirmed unsafe selector was:

```css
.homeops-icon-asset img,
.celebration-surface-icon img,
.home-celebration-surface > span img,
.family-celebration-card > span img,
.child-hero-celebration > span img,
.celebration-memory-card > span img,
.child-memory-list > div > span img { ... width: 100%; height: 100%; }
```

The fix keeps the specific component-image selectors but removes the global `.homeops-icon-asset img` member. `HomeOpsIcon` now owns `width`, `height`, `max-width`, and `max-height` for both image-backed and SVG-backed icons.

## Audit findings
VisualReview runtime was started with the `visual-marketing-family` fixture and a 1280×720 viewport. The DOM audit inspected `.homeops-icon-asset`, `FamilyAvatar`, celebration surfaces, child/helper assets, nav icons, card icons, dialog icons, and common image/svg selectors across the requested surfaces.

| Surface | Result | Notes |
| --- | --- | --- |
| Home / Family overview | No confirmed oversized icons | Family overview/top navigation had 0 risky findings before and after. |
| Thomas detail | Confirmed oversized HomeOpsIcon leaks | Child-progress, child-section, child-goal, celebration, and compact-action icons were inflated. |
| Avatar Editor | Confirmed inherited page-content leaks behind the modal | Same Thomas detail page icons remained inflated behind the modal; Avatar Editor controls were not independently oversized. |
| Agenda | No confirmed oversized icons | 0 risky findings. |
| Add Event dialog | No confirmed oversized icons | 0 risky findings. |
| Tasks | No confirmed oversized icons | 0 risky findings. |
| Shopping | No confirmed oversized icons | 0 risky findings. |
| Motivation | No confirmed oversized icons | 0 risky findings. |
| Add Appreciation dialog | No confirmed oversized icons | 0 risky findings. |
| Weekly Reset | Confirmed oversized HomeOpsIcon leaks | Four reset summary icons measured 300×300 px before the fix. |
| Top navigation/header | No remaining oversized nav icon leak | The prior back-slot fix stayed at 44×44 px with a contained icon after this audit. |

## Confirmed oversized elements
| Surface | Selector/component | Before | Expected/after | Source CSS rule | Status |
| --- | --- | ---: | ---: | --- | --- |
| Thomas detail | `.homeops-icon-asset.child-card-asset` in `.child-journey-today` | 528.42×528.42 px | 52×52 px | Broad `.homeops-icon-asset img { width/height: 100%; }` group | Fixed |
| Thomas detail | `.homeops-icon-asset.child-section-asset` in `.child-hero-family` | 316.19×316.19 px | 60×60 px | Same broad group | Fixed |
| Thomas detail | `.homeops-icon-asset.child-card-asset` in progress card | 300×300 px | 52×52 px | Same broad group | Fixed |
| Thomas detail | `.homeops-icon-asset.child-goal-asset` in `.child-goal-card` | 173.23×173.23 px | 26.39×26.39 px | Same broad group | Fixed |
| Thomas detail | `.homeops-icon-asset` in `.family-celebration-card` | 197.63×197.63 px | 32×32 px | Same broad group | Fixed |
| Thomas detail | `.homeops-icon-asset` in `.secondary-action.compact-action` | 239.17×239.17 px | 16×16 px | Same broad group | Fixed |
| Weekly Reset | Reset recap `HomeOpsIcon` rows | 300×300 px each | 16×16 px each | Same broad group | Fixed |

## Risk-only elements
| Area | Risk | Measurement/result | Action |
| --- | --- | --- | --- |
| Celebration containers | Component-specific selectors still size their child images to fill explicit icon boxes. | No post-fix oversized findings; intentional containers like `.celebration-surface-icon` retain explicit dimensions. | Preserved; no redesign. |
| FamilyAvatar / Avatar V2 | SVG avatars are intentionally sized by avatar classes. | No oversized avatar defects found in audit output. | Preserved; no shrinking. |
| Dialog icon buttons | Close/add icons rely on icon containment. | Add Event, Add Appreciation, Avatar Editor controls had no confirmed post-fix oversized leaks. | Covered by shared `HomeOpsIcon` containment; no page hack. |
| Top navigation/header | Back and settings icons should remain normal. | No post-fix top-navigation risky findings. | Preserved. |

## Fixes applied
- Made `.homeops-icon-asset` own a `1em` square box.
- Made `.homeops-icon-asset img` and `.homeops-icon-asset svg` render within `1em` with `max-width`/`max-height` containment.
- Removed `.homeops-icon-asset img` from the broad component-image fill rule.
- Preserved explicit component containers for celebration/child imagery so intentional hero/avatar/card imagery was not globally shrunk beyond its declared font-size or component box.

## Before/after measurements
| Surface | Risk count before | Risk count after | Key before | Key after |
| --- | ---: | ---: | ---: | ---: |
| Home / Family overview | 0 | 0 | n/a | n/a |
| Thomas detail | 9 | 0 | Largest `HomeOpsIcon`: 528.42×528.42 px | Corresponding icon: 52×52 px |
| Avatar Editor | 9 | 0 | Inherited page-content icons up to 528.42×528.42 px | Corresponding icons contained at 52×52 px / 60×60 px / 32×32 px / 16×16 px |
| Agenda | 0 | 0 | n/a | n/a |
| Add Event dialog | 0 | 0 | n/a | n/a |
| Tasks | 0 | 0 | n/a | n/a |
| Shopping | 0 | 0 | n/a | n/a |
| Motivation | 0 | 0 | n/a | n/a |
| Add Appreciation dialog | 0 | 0 | n/a | n/a |
| Weekly Reset | 4 | 0 | Four reset icons at 300×300 px | Four reset icons at 16×16 px |

## Validation
- Re-ran the DOM icon audit after the CSS fix; all requested surfaces reported 0 risky oversized icon/image findings.
- Verified Thomas detail and Avatar Editor inherited page-content icons no longer show 300 px / 528 px leaks.
- Verified Weekly Reset no longer shows 300×300 px reset summary icons.
- Verified Home, Family overview, Agenda, Add Event dialog, Tasks, Shopping, Motivation, Add Appreciation dialog, and top navigation/header had no post-fix risky oversized findings.
- Verified the fix is shared-rule containment, not a page-specific Thomas or Weekly Reset hack.
- Verified no screenshots, movies, audio, WAV files, generated media, or binary artifacts were produced or committed.

## Modified files
- `src/HomeOps.Client/src/styles.css`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-06-30-oversized-image-icon-audit/oversized-image-icon-audit.md`

## Explicit answers
- Were remaining oversized image/icon issues found? Yes. Thomas detail/Avatar Editor inherited content and Weekly Reset had confirmed oversized `HomeOpsIcon` leaks.
- Were broad image sizing rules identified? Yes. The broad `.homeops-icon-asset img` member in the later component-image fill rule caused the leaks.
- Were fixes scoped to shared rules rather than page-specific hacks? Yes. Only shared `HomeOpsIcon` containment and the broad CSS selector were changed.
- Are HomeOpsIcon usages now contained? Yes. Image-backed and SVG-backed HomeOpsIcon content is constrained to the icon host unless an explicit component container intentionally sizes it.
- Were intentional avatars/hero images preserved? Yes. Avatar and explicit celebration/child component containers were not redesigned or globally shrunk beyond their declared component sizing.
- Were screenshots or binaries committed? No.
- Was no movie intentionally produced? Yes. No movie was produced.
