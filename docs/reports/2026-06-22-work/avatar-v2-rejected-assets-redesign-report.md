# Avatar V2 Rejected Assets Redesign Report

## Summary
Redesigned the rejected Avatar V2 assets from the visual rejection review without adding editor UI, persistence, production integration, new avatar systems, new head variants, new clothing assets, or new accessory categories. The work remains SVG-only and deterministic, keeps `AvatarAnatomy` as the positioning source of truth, and preserves the existing sample/rendering pipeline.

The rejected `curlyPlayful` hairstyle now uses a rebuilt curl-cluster silhouette instead of the prior helmet/visor cap. The rejected `leafPin` accessory now uses a clear leaf silhouette with a visible center vein and secondary vein marks. `headband` now follows an asset-specific layer rule with `curlyPlayful`: it renders behind the foreground curls so it reads as wrapped around the head rather than pasted on top of hair.

## CurlyPlayful Redesign
- Rebuilt the hairstyle silhouette instead of only adjusting highlights.
- Replaced the prior single cap/visor read with three foreground curl clusters and a supporting back-hair mass.
- Raised and simplified the forehead curl line so the hair reads as curls while preserving eye readability at small sizes.
- Added curl-flow strokes that describe left, center, and right curl direction.
- Kept BackHair, FrontHair, and HairHighlights as separate deterministic SVG layers.
- Verified the dark plum version remains readable in targeted samples.

## LeafPin Redesign
- Replaced the ambiguous peach/shell/blob shape with a leaf-shaped pointed oval curve.
- Added a visible curved center vein.
- Added two smaller vein marks to reinforce leaf identity at avatar scale.
- Kept the existing `leafPin` accessory id and `hairRight` recommended mount, avoiding a new accessory category or asset-library expansion.
- Verified the redesigned pin remains readable on dark plum hair in `curly-v2-sample-c.svg`.

## Headband Rule Changes
- Reviewed the rejected `curlyPlayful + headband` interaction and changed the simplest necessary rendering rule.
- For `curlyPlayful` only, `headband` renders after the base head but before the foreground hair layer.
- The foreground curls partially occlude the headband, making it read as wrapping around the head/hair volume instead of sitting pasted on top.
- Other headband combinations continue to use the normal accessory layer behavior.
- The SVG includes `data-accessory-layer-rule="behind-front-hair"` for the curly-hair headband case so tests can assert the intended asset-specific behavior.

## Visual Assessment
- `curly-v2-sample-a.svg`: CurlyPlayful V2 only. Shippable for this isolated Avatar V2 sample context. It reads immediately as curly hair, has distinct curl clusters, and no longer reads primarily as a helmet.
- `curly-v2-sample-b.svg`: CurlyPlayful V2 + Headband. Shippable for this sample context. The headband is mostly tucked behind foreground curls and no longer dominates the forehead as a pasted stripe.
- `curly-v2-sample-c.svg`: CurlyPlayful V2 + LeafPin V2. Shippable for this sample context. The pin now reads as a decorative leaf rather than a peach, shell, sticker, injury, or blob.
- `curly-v2-sample-d.svg`: Team-choice strongest combination. Shippable for this sample context. CurlyPlayful V2 pairs best with the flower clip because the flower has an already-recognizable silhouette and does not require crossing the curl band.

## Verification
- Pre-flight `dotnet --version`: `10.0.301`.
- Avatar V2 targeted tests passed: 18/18 in `src/avatarV2/avatarV2.test.ts`.
- Client test suite passed: 106/106.
- Client production build passed.
- Generated targeted validation artifacts:
  - `docs/reports/2026-06-22-work/curly-v2-sample-a.svg`
  - `docs/reports/2026-06-22-work/curly-v2-sample-b.svg`
  - `docs/reports/2026-06-22-work/curly-v2-sample-c.svg`
  - `docs/reports/2026-06-22-work/curly-v2-sample-d.svg`
- Regenerated `showcase-01.svg` through `showcase-06.svg` so the existing standalone showcase set remains functional with the redesigned assets.
- Converted the targeted validation SVGs to local PNGs for manual visual review.

## Risks
- The redesigned `curlyPlayful` is materially stronger, but it remains an SVG illustration asset rather than a hand-authored production character sheet. A final art-direction pass is still recommended before broad editor exposure.
- The headband is now believable with `curlyPlayful`, but it is intentionally visually quieter because foreground curls occlude it. If the product later needs highly prominent headbands, that should be a separate accessory-art pass.
- Existing legacy hairstyles were not redesigned in this slice.

## Modified Files
- `src/HomeOps.Client/src/avatarV2/avatarV2.ts`
- `src/HomeOps.Client/src/avatarV2/avatarV2.test.ts`
- `docs/reports/2026-06-22-work/showcase-01.svg` through `showcase-06.svg`
- `docs/reports/2026-06-22-work/curly-v2-sample-a.svg` through `curly-v2-sample-d.svg`
- `docs/reports/2026-06-22-work/avatar-v2-rejected-assets-redesign-report.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

## Next Prompt Context
CurlyPlayful V2, LeafPin V2, and the CurlyPlayful/headband interaction have been redesigned in the isolated Avatar V2 SVG renderer. CurlyPlayful is now shippable for the current sample context, LeafPin is now shippable, and Headband + CurlyPlayful is now shippable with the behind-foreground-curls rule. Remaining visual blockers before editor readiness are broader full-matrix accessory/hair QA, a final art-direction pass for all legacy hairstyles/accessories, and product/editor UX decisions. No editor UI, persistence, production integration, new systems, new head variants, new clothing assets, gamification, unlockables, raster assets, or external avatar systems were added.
