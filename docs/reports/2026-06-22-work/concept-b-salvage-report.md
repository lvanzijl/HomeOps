# Concept B Salvage Report

## Summary
Concept B, Loose Wavy Curls, was corrected as the only currently viable direction from the curly hairstyle exploration. The fix keeps the Avatar V2 renderer SVG-only and deterministic, keeps anatomy-driven layer composition intact, and changes only the existing CurlyPlayful hair paths used to validate the Concept B visual direction.

CurlyPlayful should not be described as fully production-ready from this slice alone; this slice validates that the corrected Concept B direction is usable enough to continue toward editor readiness.

## Rejected Concepts
- Concept A: rejected by current visual review override.
- Concept C: rejected by current visual review override.

Neither Concept A nor Concept C is recommended by this salvage slice.

## Concept B Root Cause
The visible strip through the face came from the Concept B hair highlight layer, not from the back hair, face layer, clipping, or accessory ordering. The original `curly-concept-b.svg` rendered hair highlights after the face and included this right-side highlight segment:

`M119 74c5 14 3 29-6 43`

Because highlights render above the base face layer and are not clipped to the back hair mass, that segment descended through the cheek/face area down toward the lower head, creating the unexplained vertical strip.

## Fix Implemented
- Kept the Concept B back hair and front hair relationship intact.
- Removed the long descending highlight segment that crossed the face.
- Replaced it with a short upper-right wave highlight that stays inside the visible hair mass.
- Preserved deterministic string-based SVG rendering, AvatarAnatomy-driven head/face composition, and the existing renderer layer order.
- Did not add Concept A, Concept C, new hairstyle concepts, editor UI, persistence, production integration, new head variants, clothing assets, accessories, raster assets, or external URLs.

## Visual Assessment
- The corrected samples no longer show a strip through the face.
- The hair reads as loose wavy/curly hair with believable crown-to-side growth direction.
- The central face, eyes, and mouth remain unobscured.
- Dark plum remains readable through the broad hair silhouette and restrained internal strokes.
- The small-size silhouette is coherent because the cap and side masses remain broad rather than relying on fine texture.
- Headband and leaf-pin samples confirm the existing accessory interaction still works with the corrected Concept B shape.

## Verification
Pre-flight environment setup was run before analysis and implementation:

```bash
export DOTNET_CLI_HOME=/tmp/dotnet
export PATH="$PATH:$HOME/.dotnet:$HOME/.dotnet/tools"
dotnet --version
```

Result: `10.0.301`.

Programmatic verification performed:

- Avatar V2 targeted tests passed.
- Client test suite passed.
- Client production build passed.
- Corrected Concept B SVG samples were checked for SVG-only output, no raster image tags, and no external URL references.
- Existing showcase generation remains functional through renderer sample tests and production build.

## Risks
- This validates Concept B as a usable visual direction, not a full production/editor readiness sign-off.
- The style is still loose wavy/curly rather than tight ringlet curly; future review may still ask for stronger curl identity.
- The samples cover dark plum, chestnut, headband, and leaf-pin interactions only.

## Modified Files
- `src/HomeOps.Client/src/avatarV2/avatarV2.ts`
- `src/HomeOps.Client/src/avatarV2/avatarV2.test.ts`
- `docs/reports/2026-06-22-work/concept-b-fixed-dark.svg`
- `docs/reports/2026-06-22-work/concept-b-fixed-light.svg`
- `docs/reports/2026-06-22-work/concept-b-fixed-with-headband.svg`
- `docs/reports/2026-06-22-work/concept-b-fixed-with-leaf.svg`
- `docs/reports/2026-06-22-work/concept-b-salvage-report.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

## Next Prompt Context
Concept A remains rejected. Concept C remains rejected. Concept B is now the only usable curly hairstyle direction from the reviewed set, with the face-strip defect corrected. Curly hair is no longer blocked at the concept-direction level, but editor readiness still requires an explicit production/editor integration slice and should not claim CurlyPlayful is fully fixed from this salvage work alone.
