# Avatar V2 Hair Quality Review

## Summary
Improved Avatar V2 hair asset quality for the weak prioritized hairstyles: `shortMessy`, `longSoft`, and `curlyPlayful`. The darker-hair issue was asset-related rather than anatomy-related: the old hair art relied on overlapping, similarly weighted SVG blobs whose seams and outlines became prominent with dark fills. The renderer remains SVG-only, deterministic, anatomy-driven, and isolated from editor, persistence, and production UI integration.

## Hairstyle Assessment
- `softCrop`: Acceptable. Silhouette is simple but readable, growth direction is implied by the top highlight, and it remains recognizable in monochrome and dark colors.
- `curlyCloud`: Acceptable with caveat. Cloud-like curls read as hair because the clustered circles sit above a continuous cap, but it remains a simpler blob-based legacy style.
- `sideBob`: Acceptable. Back/front relationship is minimal but coherent; side length and side strand establish direction.
- `swoop`: Acceptable. Strong side-swept silhouette and monochrome readability.
- `layeredMessy`: Acceptable. Layered point shapes and highlights read as hair flow and remain believable in dark colors.
- `shortMessy`: Weak before this slice. The silhouette was recognizable, but the old spikes and inner strokes fought the cap shape in dark colors.
- `longSoft`: Weak before this slice. The old back hair was too symmetrical and curtain-like, with front hair not clearly connected to the long side masses.
- `curlyPlayful`: Weakest before this slice. Overlapping circles made it read as stacked SVG shapes instead of curl masses, especially with `hairPlum`.

## Root Cause Analysis
- `shortMessy`: The previous front path used several sharp triangular points (`l-10 14`, `l-8-16`, `l-15 18`, `l-5-16`) over a broad cap. In dark hair colors the stroke intersections made the style look like separate paper cutouts. Root cause: silhouette and flow.
- `longSoft`: The previous back path used a single large closed curtain shape with two near-symmetric lower points. Front hair sat as a separate top cap, so back hair and front hair did not convincingly share the same growth direction. Root cause: back/front relationship, proportions, and flow.
- `curlyPlayful`: The previous front was four stroked circles plus a scalloped bridge path. With dark plum hair, the circle outlines dominated and exposed construction seams. Root cause: overlapping SVG-shape layering, silhouette, and highlight flow.

## Improvements Implemented
- Reworked `shortMessy` with a cleaner cap silhouette, fewer contradictory spikes, strand strokes that follow crown-to-fringe growth, and highlight paths tagged for validation.
- Reworked `longSoft` with longer side masses, side-flow interior strands, a front cap that sits logically over the back hair, and highlights following the side sweep.
- Reworked `curlyPlayful` from circle stacking into a unified curl silhouette with internal curl arcs and flow highlights, reducing visible blob seams in dark colors.
- Added `validateAvatarV2HairSvg` to enforce practical automated guards for SVG-only output, front/back layering, style identity, deterministic-compatible structure, and tagged flow highlights.
- Added test coverage for prioritized hairstyles across cocoa, chestnut, and plum hair colors to verify dark and light variants remain valid, SVG-only, and deterministic.

## Validation
- Pre-flight `dotnet --version`: `10.0.301`.
- Avatar V2 tests passed: 16/16.
- Client production build passed.
- Showcase regeneration completed for six showcase samples, the four legacy lettered showcase samples, and the golden sample under `docs/reports/2026-06-22-work/`.
- Manual SVG inspection verified dark hair versions (`hairCocoa`, `hairPlum`), light/warm hair versions (`hairChestnut`), and small-size readability by checking silhouettes, highlight direction, and shape seams in the generated SVG paths.

## Risks
- Automated validation can confirm structure, layering, SVG-only output, style identity, and highlight tagging, but it cannot fully judge taste, charm, or every small-size visual artifact.
- Legacy hairstyles remain simpler than the three prioritized styles; they are acceptable for current showcase needs but may need a future illustrator pass before a full editor launch.
- The headband accessory can visually compete with curly hair in some combinations, but accessory redesign was out of scope.

## Modified Files
- `src/HomeOps.Client/src/avatarV2/avatarV2.ts`
- `src/HomeOps.Client/src/avatarV2/avatarV2.test.ts`
- `docs/reports/2026-06-22-work/avatar-v2-hair-quality-review.md`
- `docs/reports/2026-06-22-work/golden-sample.svg`
- `docs/reports/2026-06-22-work/showcase-01.svg` through `showcase-06.svg`
- `docs/reports/2026-06-22-work/showcase-sample-a.svg` through `showcase-sample-d.svg`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

## Next Prompt Context
Avatar V2 hair assets now have stronger prioritized silhouettes and basic automated quality guards. The dark-hair issue in `curlyPlayful` was resolved by replacing overlapping circle blobs with a unified curl silhouette and flow arcs. Remaining editor-readiness blockers are broader manual QA of all legacy hair/accessory combinations, editor UX, persistence, and production integration, none of which were implemented in this slice.
