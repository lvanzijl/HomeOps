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

# Headwear Alignment Correction

## Root Cause

The completed Accessories V2 headwear artwork reused the `headTop` mount only as catalog/renderer metadata. The six headwear assets were not actually transformed through `ctx.anatomy.mounts.headTop`; instead, they drew absolute SVG coordinates derived from a fixed `head.bounds.y + 9` top value and mostly fixed widths. That meant `headTop` documented intent but did not control the rendered headwear position.

Because round, oval, and wide heads have different top Y values, heights, and widths, fixed-width artwork drifted visually across variants. Wide heads made brims and helmets read too narrow or misplaced, oval heads shifted crown/base relationships, and all six items shared the same systemic anchor problem rather than six independent defects.

The correction identified that headwear needs shared anatomy-relative geometry rather than independent per-item per-variant coordinates:

- head center X;
- crown/top Y;
- headwear width derived from the resolved head width;
- a hairline/brim baseline that stays above the eye line;
- a lower rim/band baseline for covering hats.

## Shared Anatomy / Mount Correction

`resolveAvatarAnatomy` now resolves explicit `head.headwear` geometry next to the existing head bounds, center, and hairline. The geometry derives from the active head variant once and exposes a center point, crown Y, brim Y, lower Y, width, and scale. Each Accessories V2 headwear renderer consumes that shared geometry and emits `data-headwear-model="anatomy-relative"` along with center/width/baseline metadata for targeted tests.

The assets still keep local item-specific silhouettes, but those silhouettes are positioned and scaled through the shared headwear anchors. No saved IDs, catalog IDs, persistence slots, avatar selections, eyewear, hair assets, mouth assets, clothing assets, backend contracts, or database models changed.

## Layer Strategy

The existing accessory layer remains after front hair, glasses, and hair highlights for these six items. This is intentional for the current limited model: caps, beanies, sun hats, and helmets should visually cover upper/front hair rather than render as tiny ornaments behind it, and they must not render behind the whole head. The correction does not introduce a universal hat simulation or split hair redesign. Existing curly headband split rendering remains unchanged and continues to be the only special partial-occlusion accessory path.

## Affected Items

Corrected through the shared anatomy-relative model:

- Baseball Cap / Pet (`baseballCap`)
- Beanie / Muts (`beanie`)
- Party Hat / Feesthoed (`partyHat`)
- Crown / Kroon (`crown`)
- Sun Hat / Zonnehoed (`sunHat`)
- Helmet / Helm (`helmet`)

## Visual Matrix Reviewed

A temporary renderer-generated matrix was created outside the repository at `/tmp/avatar-headwear-v2-alignment-matrix.svg`. It covered all 72 required combinations:

- six headwear items;
- round, oval, and wide head variants;
- short, long, curly, and side-bob representative hairstyles.

The committed `avatar-accessories-v2-variety.svg` was regenerated from renderer output as a text SVG headwear alignment sheet, and XML parsing passed.

## Compatibility Impact

Compatibility is preserved:

- existing accessory IDs and saved selections still resolve;
- the single `accessoryStyle` slot is unchanged;
- non-headwear accessories continue to use their existing mounted accessory model;
- Tiny Crown remains distinct from the larger Crown;
- eyewear, mouths, eyes, clothing, hair definitions, and backend validation are unchanged.

## Tests Added

Focused renderer tests now verify shared invariants instead of full-SVG snapshots:

- every Accessories V2 headwear item renders through `data-headwear-model="anatomy-relative"`;
- headwear center stays aligned to the resolved head center;
- headwear width scales from the resolved head width;
- brim/band baselines remain between the hairline and protected eye-line threshold;
- every headwear item renders for round, oval, and wide heads across representative hairstyles;
- non-headwear accessories do not receive the headwear model metadata.

## Remaining Limitations

The renderer still uses a deliberately limited hat-over-hair strategy rather than simulating per-hairstyle hair tucked under every hat. This is acceptable for the current slice because the corrected headwear now centers and scales consistently across the current head variants and representative hairstyles, while future richer hat/hair interaction can be handled in a dedicated renderer slice if product requirements need it.

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

Validation covered backend catalog rules, frontend catalog metadata, renderer output, adapter mapping, editor grouping, existing compatibility, unknown IDs/category mismatches, save/load behavior through existing tests, NSwag generation, SVG XML validity, and Playwright browser interaction.

# Test Results

- `dotnet restore HomeOps.sln` passed with the existing NU1903 warning for `SQLitePCLRaw.lib.e_sqlite3`.
- `dotnet build HomeOps.sln --no-restore` passed with the same existing NU1903 warning.
- `dotnet test HomeOps.sln --no-build` passed: 385 tests.
- `npm test --prefix src/HomeOps.Client` passed: 235 tests.
- `npm run build --prefix src/HomeOps.Client` passed; Vite reported the pre-existing large chunk warning.
- `npx --yes nswag run nswag.json` passed.
- `git diff --check` passed.

# SVG Validation

Generated `avatar-accessories-v2-variety.svg` as a standalone SVG contact sheet using renderer output for every newly added accessory. XML parsing passed with Python `xml.etree.ElementTree`. The artifact contains no scripts, raster images, or external dependencies.

# Playwright Verification

Playwright was run against the real VisualReview API plus Vite frontend at 1440×900. It verified:

- The Avatar Editor opens from Thomas's page.
- The Accessories category opens.
- Group headings appear.
- New accessories appear.
- Selecting Pet updates the live preview to `baseballCap`.
- Selecting existing Flower continues rendering correctly.
- `document.body` does not vertically overflow the viewport.

Playwright browser dependencies were installed in the container because Chromium initially could not launch due to missing Linux shared libraries. No screenshots or traces were committed.

# Risks

- Neckwear currently uses conservative chest/neck artwork without a dedicated `neckCenter` mount; a future renderer slice can add that mount if more complex neckwear is needed.
- Headwear is now anatomy-relative for the six Accessories V2 items, but it remains a limited hat-over-hair model rather than a full per-hairstyle occlusion simulation for every future silhouette.
- The single accessory slot means a user still cannot combine a hat, hair clip, and scarf simultaneously.

# Future Opportunities

- Add family-specific accessory slots only when coexistence creates clear product value.
- Add `neckCenter` or `headFront` mounts in focused renderer slices if future artwork requires them.
- Add catalog filters only when the Accessories catalog becomes too large for simple groups.
- Add family-specific colors if jewelry, hats, and scarves need independent color choices.

# Modified Files

- `src/shared/avatar-catalog.json`
- `src/HomeOps.Api/AvatarCatalog/AvatarCatalogModels.cs`
- `src/HomeOps.Client/src/avatarV2/avatarV2.ts`
- `src/HomeOps.Client/src/avatarV2/avatarConfig.ts`
- `src/HomeOps.Client/src/avatarCatalog/AvatarCatalogControls.tsx`
- `src/HomeOps.Client/src/styles.css`
- `src/HomeOps.Client/src/avatarCatalog/avatarCatalog.test.ts`
- `src/HomeOps.Client/src/avatarV2/avatarV2.test.ts`
- `src/HomeOps.Client/src/home/FamilyAvatarEditor.test.tsx`
- `tests/HomeOps.Api.Tests/Lists/AvatarCatalogTests.cs`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-07-10-avatar-accessories-v2/avatar-accessories-v2.md`
- `docs/reports/2026-07-10-avatar-accessories-v2/avatar-accessories-v2-variety.svg`
