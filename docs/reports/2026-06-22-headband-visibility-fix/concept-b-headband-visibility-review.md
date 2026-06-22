# Concept B Headband Visibility Review

## Summary

Concept B remains the preferred curly-hair direction, but the prior headband validation sample was not visually successful. The band existed in the SVG while the foreground hair covered nearly all of the readable headband shape. This slice keeps the Concept B face-strip correction intact and changes only the curly-hair headband interaction.

## Root Cause

The previous Concept B headband rendered as one continuous arc behind the foreground hair. The foreground hair mass then covered the center and most of the side contour. Because no visible accessory segment was drawn after the hair, a reviewer could not reliably identify a headband.

## Visibility Analysis

- `concept-b-headband-before.svg` is only partially visible in the technical sense.
- It is not reliably identifiable as a headband because the visible portions are either hidden by the front hair layer or compete with hair strokes.
- The specific obscuring layer is `avatar-v2-layer-front-hair`, with `avatar-v2-layer-hair-highlights` adding additional visual competition over the same upper-hair region.

## Chosen Layering Rule

Option B was selected: the headband should be partially occluded by foreground hair. This is the most believable rule because a real headband wraps around the head and hair volume, while curls naturally sit over parts of it. Option A hides too much to validate the accessory. Option C makes the band feel pasted on top of the hairstyle or like a forehead stripe.

## Fix Implemented

- Split curly headband rendering into a rear wrap segment and a visible side segment.
- Kept the rear wrap behind the foreground hair to preserve the wrapped-around-head feel.
- Added short visible temple-side arcs after the hair layers so the accessory remains readable without becoming a face or forehead stripe.
- Preserved the existing Concept B hair geometry and face-strip fix.

## Visual Assessment

The after sample is visually clearer: the coral side arcs make the accessory identifiable as a headband, while the center remains naturally tucked under the curls. The hair silhouette remains intact and Concept B still reads as the preferred loose curly-hair direction.

## Verification

- Avatar V2 tests passed.
- Generated SVG samples remain deterministic through renderer output comparison coverage.
- Generated SVG samples contain no raster image references and no external URL references.
- The Concept B highlight remains a short upper-right highlight and does not reintroduce the face-strip defect.

## Risks

- The visible side arcs are intentionally conservative; future visual review may tune their exact length or curvature.
- The headband is now clearer, but final editor readiness should still include multi-color and multi-head-size review before production integration.

## Modified Files

- `src/HomeOps.Client/src/avatarV2/avatarV2.ts`
- `src/HomeOps.Client/src/avatarV2/avatarV2.test.ts`
- `docs/reports/2026-06-22-headband-visibility-fix/concept-b-headband-before.svg`
- `docs/reports/2026-06-22-headband-visibility-fix/concept-b-headband-after.svg`
- `docs/reports/2026-06-22-headband-visibility-fix/concept-b-headband-closeup.svg`
- `docs/reports/2026-06-22-headband-visibility-fix/concept-b-headband-visibility-review.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

## Next Prompt Context

Concept B is still the preferred curly-hair direction. The face-strip defect remains corrected. The headband should be reviewed as a partially occluded wrap: rear band behind curls, short visible side arcs above the completed hair stack. Do not treat SVG presence alone as validation; future review should continue to judge whether the accessory is visible, identifiable, and understandable as a headband.
