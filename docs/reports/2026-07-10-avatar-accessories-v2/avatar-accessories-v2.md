# Executive Summary

Avatar Accessories V2 expands the existing single accessory slot conservatively. It adds ten new catalog options, keeps the existing Bow, Flower, and Tiny Crown valid, groups the Accessories panel visually, and renders the new artwork through the current Avatar V2 accessory layer and mount-point architecture.

No persistence model, API contract, migration, accessory array, second accessory slot, drag/drop positioning, scaling, rotation, marketplace, inventory, unlock, seasonal filter, or editor redesign was introduced. Multiple simultaneous accessories, additional persistence slots, and accessory arrays were intentionally postponed.

# Repository Review

Reviewed `.github/copilot-instructions.md`, root `AGENTS.md`, the task instructions, and the design-authority research report at `docs/reports/2026-07-10-avatar-accessories-research/avatar-accessories-research.md` before implementation.

Implementation review covered:

- Avatar V2 renderer and existing accessory assets.
- Avatar Editor V4 catalog-driven controls.
- Shared avatar catalog JSON.
- Accessories V1 eyewear architecture.
- Eyes V1 face-panel integration.
- Clothing V3 catalog/renderer expansion pattern.
- Existing accessory renderer and mount points.
- Backend/frontend catalog validation and adapter tests.

# Design Decisions

- Continued using `accessoryStyle` as the only non-eyewear accessory slot.
- Kept existing accessory IDs valid and unchanged.
- Kept eyewear/glasses unchanged in the Face panel and dedicated glasses renderer layer.
- Used visual grouping inside the existing Accessories category rather than adding nested navigation or extra editor pages.
- Reused `hairLeft`, `hairRight`, `headTop`, and `chestCenter` mount metadata. Neck accessories use conservative chest/neck artwork anchored through the existing chest-center binding rather than adding a new mount point in this slice.
- Added backend presentation metadata shape support so the shared catalog's grouping metadata is available to backend validation/tests as well as the frontend.

# Accessory Collection

The expanded Accessories V2 collection is:

| Accessory | Status | Group | Renderer token | Notes |
|---|---:|---|---|---|
| Bow / Strik | Existing retained | Hair Accessories | `bow` | Existing ID/artwork preserved. |
| Flower / Bloemspeld | Existing retained | Hair Accessories | `flower` | Existing ID/artwork preserved. |
| Hair Clip / Haarspeld | New | Hair Accessories | `hairClip` | Small everyday barrette. |
| Ribbon / Lint | New | Hair Accessories | `ribbon` | Soft hair accessory distinct from bow. |
| Baseball Cap / Pet | New | Headwear | `baseballCap` | Everyday headwear. |
| Beanie / Muts | New | Headwear | `beanie` | Cold-weather headwear. |
| Party Hat / Feesthoed | New | Headwear | `partyHat` | Celebration option. |
| Crown / Kroon | New | Headwear | `crown` | Clearer crown while retaining tiny crown compatibility. |
| Sun Hat / Zonnehoed | New | Headwear | `sunHat` | Practical seasonal headwear. |
| Helmet / Helm | New | Headwear | `helmet` | Safety/occupation option. |
| Necklace / Ketting | New | Neckwear | `necklace` | Simple pendant necklace. |
| Scarf / Sjaal | New | Neckwear | `scarf` | Practical cold-weather neckwear. |

# Renderer

New SVG artwork was added to the existing `avatarV2AccessoryAssets` map. The renderer still emits a single accessory layer for the configured accessory, with the existing special headband partial-occlusion behavior preserved. Existing avatars, existing glasses, and existing accessory layer ordering remain stable.

# Headwear Model V2

## Root Cause Review

The first correction improved horizontal alignment because all six headwear renderers stopped using unrelated fixed X coordinates and began sharing the resolved head center. That removed the obvious left/right drift across round, oval, and wide heads.

The fix was still insufficient because it treated headwear as a shared pseudo-anatomy block. `resolveAvatarAnatomy` exposed `head.headwear` crown, brim, lower, width, and scale values. Those values were renderer concepts, not anatomy. The shared baselines also sat too low: brim and lower-rim positions were derived from `hairline + 15` and `hairline + 21`, which pushed caps, sun hats, beanies, and helmets into the upper face. As a result:

- vertical placement remained incorrect even though X centering improved;
- hats still sat too low because their bands and brims inherited the same low shared baseline;
- crowns behaved like forehead bands because the crown base used the same brim baseline as caps;
- sun hats intersected the eye region because their brim was derived from that low brim baseline;
- helmets covered eyes because their lower rim used the lowest shared headwear baseline.

This confirmed the issue was not six independent asset defects. It was a second-iteration positioning-model defect: item-specific geometry had to be derived by the renderer from semantic anatomy rather than precomputed as universal hat geometry inside anatomy.

## Anatomy / Renderer Boundary

`resolveAvatarAnatomy` now remains renderer-agnostic. It exposes semantic head anatomy only: head top, head center, head bounds, head width, head height, hairline, forehead, and the existing face eye line. It no longer exposes cap/brim/lower-rim/headwear-specific geometry.

The headwear renderer derives a local placement model from those anatomical anchors. It computes an eye-safe line from the eye line, then each headwear family chooses its own band, base, brim, shell, crown, and tip positions relative to head top, hairline, forehead, head width, and the protected eye region. This preserves a pure anatomy model while keeping renderer-specific placement in the renderer.

## Family-Specific Placement

- Baseball Cap: crown width follows head width, the cap band rests near the hairline, and the brim derives from the forehead while staying above the eye-safe line.
- Beanie: lower band aligns to the hairline and the rounded body grows toward the head top without floating or dropping into the eyes.
- Party Hat: base sits just above the hairline/crown region, while the tip remains centered over the anatomical head top.
- Crown: base sits above the forehead/hairline, uses a narrower crown width, and keeps visible points so it reads as a crown rather than as a forehead band.
- Sun Hat: crown derives from head width and hairline, while the wide brim derives from the forehead and is clamped above the eye-safe line.
- Helmet: shell width and height derive from head width/top, and the lower rim remains above the eye-safe line so it reads as protective head coverage instead of an eye-covering mask.

## Layer Strategy

The existing accessory layer order remains unchanged. No universal hat simulation was introduced. The current six headwear items render as a single front accessory layer so they cover upper/front hair consistently. Split front/back rendering was not added in this slice because the main defect was semantic placement, and the existing layer order already provides acceptable hat-over-hair behavior without changing unrelated hair/accessory rendering.

## Visual Matrix Reviewed

A temporary renderer-generated matrix was created outside the repository at `/tmp/avatar-headwear-v2-alignment-matrix.svg`. It covered all 72 required combinations:

- six headwear items;
- round, oval, and wide head variants;
- short, long, curly, and side-bob representative hairstyles.

The committed `avatar-accessories-v2-variety.svg` was regenerated from renderer output as a text SVG headwear alignment sheet, and XML parsing passed. The visual review confirmed that baseball caps, beanies, party hats, crowns, sun hats, and helmets stay centered, derive from the head dimensions, and remain above the protected eye region across the representative matrix.

## Compatibility Impact

Compatibility is preserved:

- existing accessory IDs and saved selections still resolve;
- the single `accessoryStyle` slot is unchanged;
- non-headwear accessories continue to use their existing mounted accessory model;
- Tiny Crown remains distinct from the larger Crown;
- eyewear, mouths, eyes, clothing, hair definitions, backend validation, API contracts, and database models are unchanged.

## Tests Added

Focused renderer tests verify semantic invariants rather than full-SVG snapshots:

- every Accessories V2 headwear item renders through `data-headwear-model="anatomy-relative"`;
- headwear center stays aligned to the resolved head center;
- headwear width derives from the resolved anatomical head width;
- every reported headwear baseline remains above the protected eye-line threshold;
- every headwear item renders for round, oval, and wide heads across representative hairstyles;
- non-headwear accessories do not receive the headwear model metadata.

## Remaining Limitations

The renderer still uses a deliberately limited hat-over-hair strategy rather than simulating hair tucked under every hat for every hairstyle. This is acceptable for the current slice because the corrected headwear now centers, scales, and clears the eye-safe region consistently across the current head variants and representative hairstyles. Richer per-hairstyle hat/hair occlusion should remain a dedicated future renderer slice if product requirements demand it.

# Editor Integration

The top-level editor rail still exposes `Accessoires`. Inside the existing Accessories option surface, the accessory style category now uses tag-based visual groups:

- Geen
- Haaraccessoires
- Hoofddeksels
- Halsaccessoires

The current editor architecture absorbed the larger catalog with grouped tile sections and visible item labels. There is no nested navigation, no extra editor page, and no new persistence slot.

# Compatibility Notes

- Existing `accessoryStyle` saves remain valid.
- Existing legacy renderer tokens remain mapped.
- Existing glasses/eyewear behavior is unchanged.
- Existing accessory IDs remain valid.
- Unknown IDs and category mismatches remain rejected by backend validation.
- Save/load continues through the existing AvatarSelection JSON model and legacy AvatarV2Config adapter shim.

# Validation

Validation covered backend catalog rules, frontend catalog metadata, renderer output, adapter mapping, editor grouping, existing compatibility, unknown IDs/category mismatches, save/load behavior through existing tests, SVG XML validity, git diff hygiene, CodeQL availability, and Playwright browser interaction.

# Test Results

- `dotnet restore HomeOps.sln` passed with the existing NU1903 warning for `SQLitePCLRaw.lib.e_sqlite3`.
- `dotnet build HomeOps.sln --no-restore` passed with the same existing NU1903 warning.
- `dotnet test HomeOps.sln --no-build` passed: 385 tests.
- `npm test --prefix src/HomeOps.Client` passed: 237 tests.
- `npm test --prefix src/HomeOps.Client -- avatarV2.test.ts --runInBand` passed: 29 targeted renderer tests.
- `npm run build --prefix src/HomeOps.Client` passed; Vite reported the pre-existing large chunk warning.
- `python` XML parsing of the committed variety SVG and temporary `/tmp/avatar-headwear-v2-alignment-matrix.svg` passed.
- Playwright verification passed against the VisualReview API and Vite frontend after installing missing browser OS dependencies.
- `git diff --check` passed.
- `codeql_checker` was checked and is unavailable in this container.

# SVG Validation

Generated `avatar-accessories-v2-variety.svg` as a standalone SVG contact sheet using renderer output for the required 72-combination headwear matrix. XML parsing passed with Python `xml.etree.ElementTree`. The artifact contains no scripts, raster images, or external dependencies.

# Playwright Verification

Playwright was run against the real VisualReview API plus Vite frontend at 1440×900. It verified:

- The Avatar Editor opens from Thomas's page.
- The Accessories category opens.
- Group headings appear.
- New accessories appear.
- Selecting Pet, Muts, Feesthoed, Kroon, Zonnehoed, and Helm updates the live preview to anatomy-relative headwear.
- Each selected headwear item reports a baseline above the protected eye-safe line.
- `document.body` does not vertically overflow the viewport.

Playwright browser dependencies were installed in the container because Chromium initially could not launch due to missing Linux shared libraries. No screenshots or traces were committed.

# Risks

- Neckwear currently uses conservative chest/neck artwork without a dedicated `neckCenter` mount; a future renderer slice can add that mount if more complex neckwear is needed.
- Headwear placement is now derived from semantic anatomy for the six Accessories V2 items, but it remains a limited hat-over-hair model rather than a full per-hairstyle occlusion simulation for every future silhouette.
- The single accessory slot means a user still cannot combine a hat, hair clip, and scarf simultaneously.

# Future Opportunities

- Add family-specific accessory slots only when coexistence creates clear product value.
- Add `neckCenter` or `headFront` mounts in focused renderer slices if future artwork requires them.
- Add catalog filters only when the Accessories catalog becomes too large for simple groups.
- Add family-specific colors if jewelry, hats, and scarves need independent color choices.

# Modified Files

Headwear Model V2 follow-up modified only:

- `src/HomeOps.Client/src/avatarV2/avatarV2.ts`
- `src/HomeOps.Client/src/avatarV2/avatarV2.test.ts`
- `docs/state/current-state.md`
- `docs/reports/2026-07-10-avatar-accessories-v2/avatar-accessories-v2.md`
- `docs/reports/2026-07-10-avatar-accessories-v2/avatar-accessories-v2-variety.svg`
