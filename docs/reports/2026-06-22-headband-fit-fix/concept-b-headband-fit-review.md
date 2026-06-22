# Concept B Headband Fit Review

## Summary

The Concept B headband issue is now treated as a geometry-fit problem rather than a visibility or layer-order problem. The renderer keeps the partial-occlusion layering from the visibility fix, but the visible and rear headband segments now derive from a shared anatomy-based anchor curve around the head volume.

## Root Cause

The previous fix split the headband into rear and visible segments, which made the accessory easier to see, but those segments were still based on fixed offsets. The right visible segment in particular extended outward and upward independently of the head contour, so the band read as floating behind the hair but in front of the head rather than wrapping around the skull.

## Geometry Analysis

The before and current-after samples showed that the headband endpoints and control points were not centered on a single head-volume curve. The rear curve used one set of offsets, while the visible side arcs used another set. That mismatch created a disconnected physical model: the center was hidden by curls, but the exposed side arcs did not land on the same implied curve.

The incorrect assumption was that a short visible arc could be placed by approximate hair-relative offsets. A headband needs a head-relative curve first; hair occlusion should hide portions of that curve afterward.

## Chosen Headband Model

The selected model is a dedicated anatomy-generated headband anchor curve derived from `AvatarAnatomy.head.bounds`. The curve uses left and right side contact points plus upper control points based on head width and height. This keeps the band centered around the head for round, oval, and wide variants without adding an asset-specific sample hack.

Head bounds are the correct source for this slice because the accessory is physically tied to the skull volume. A separate editor-facing anchor system or new accessory model would be broader than the requested geometry correction.

## Fix Implemented

- Added a shared `headbandAnchorCurve` helper that derives the headband contact points and control points from `AvatarAnatomy` head bounds.
- Updated normal and curly headband rendering to use the same curve model.
- Kept the curly-hair partial occlusion rule: rear headband renders behind foreground curls, while short side arcs render above the completed hair stack.
- Regenerated before, after, and closeup validation SVGs under this report folder.

## Visual Assessment

- The headband now looks physically attached in the generated after sample because the exposed side arcs sit on the same curve as the hidden rear wrap.
- It follows the head volume more convincingly than the prior fixed-offset arcs.
- It remains immediately recognizable as a headband because the coral side arcs are still visible on both sides of the curl mass.
- It still works with Concept B: the hairstyle is unchanged, the face-strip fix remains intact, and the curls continue to occlude the center of the band naturally.

Concept B + Headband is now shippable for this isolated Avatar V2 sample context, with the caveat that broader editor readiness still needs matrix review across colors, head variants, and other hairstyles.

## Verification

- Pre-flight .NET SDK version: `10.0.301`.
- Ran the Avatar V2 Vitest suite for deterministic rendering, SVG-only output, raster/external URL guards, headband layer ordering, and sample rendering.
- Ran the frontend production build to verify the existing client/showcase pipeline remains functional.
- Checked regenerated validation SVGs for absence of raster `<image>` tags and external URL references.

## Risks

- The curve is intentionally anatomy-derived but still stylized; future full-matrix art review may tune percentages for non-Concept-B combinations.
- The visual assessment is based on generated SVG inspection rather than a browser screenshot, because this slice changes standalone SVG samples rather than a runnable web application view.

## Modified Files

- `src/HomeOps.Client/src/avatarV2/avatarV2.ts`
- `src/HomeOps.Client/src/avatarV2/avatarV2.test.ts`
- `docs/reports/2026-06-22-headband-fit-fix/concept-b-headband-before.svg`
- `docs/reports/2026-06-22-headband-fit-fix/concept-b-headband-after.svg`
- `docs/reports/2026-06-22-headband-fit-fix/concept-b-headband-closeup.svg`
- `docs/reports/2026-06-22-headband-fit-fix/concept-b-headband-fit-review.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

## Next Prompt Context

The headband problem was geometry, not layering. Keep the current partial-occlusion layer rule, but treat the headband as an anatomy-derived object wrapped around the head. Future work should avoid fixed visible accessory offsets that do not share the same underlying head-volume curve. Do not redesign Concept B hair, add new accessories, build editor UI, add persistence, or integrate Avatar V2 into production unless explicitly scoped.
