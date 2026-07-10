# Executive Summary

Avatar Clothing V3 extends the existing Clothing V2 multi-color foundation with eight additional dual-color garments: Zip Hoodie, Varsity Jacket, Rugby Shirt, Contrast Pocket Hoodie, Winter Coat, Cardigan, Sports Shirt, and Apron / Smock. The slice is catalog and renderer artwork only; it does not add a new clothing architecture, tertiary regions, patterns, logos, or garment-specific editor behavior.

# Repository Review

Reviewed the Clothing V2 report, shared avatar catalog, Avatar V2 renderer asset registry, `ClothingAsset.colorRegions`, primary/secondary color resolution, catalog renderer bindings, editor gating for `clothing.secondary-color`, adapter normalization, and existing renderer/catalog/backend tests. Polo, Jacket, and Dress already established the reusable pattern: each garment declares `primary` and `secondary`, receives the same primary/secondary swatches, and lets existing catalog metadata drive editor visibility.

# Design Decisions

The implementation reuses the Clothing V2 primary/secondary architecture. No new renderer architecture was required because each garment is a normal `ClothingAsset` with `colorRegions: ["primary", "secondary"]` and an SVG render function. The eight garments remain visually distinct through silhouette, accent placement, collars, pockets, panels, trims, and overlays rather than through prohibited graphics or patterns.

Primary regions cover garment bodies, sleeves, or base layers. Secondary regions cover hoods/linings, zippers, drawstrings, sleeves, collars, cuffs, plackets, pockets, side panels, undershirts, apron overlays, and trim. Compatibility is preserved because existing IDs, defaults, saved selections, primary-only garments, Polo/Jacket/Dress behavior, adapter mappings, and the `avatarSelection` persistence path are unchanged.

# Clothing Collection

## Zip Hoodie

- Catalog ID: `clothing.style.zip-hoodie`
- Dutch label: Vest met rits
- Primary region: torso, sleeves, hood exterior
- Secondary region: hood lining, zipper, drawstrings
- Design rationale: a clear hood silhouette plus center zipper and readable drawstrings distinguish it from the existing hoodie.
- Representative color combination: navy / sky

## Varsity Jacket

- Catalog ID: `clothing.style.varsity-jacket`
- Dutch label: Collegejack
- Primary region: jacket torso
- Secondary region: sleeves, collar, cuffs, lower trim
- Design rationale: contrasting sleeves and ribbed trims create a varsity read without letters, team logos, or numbers.
- Representative color combination: red / cream

## Rugby Shirt

- Catalog ID: `clothing.style.rugby-shirt`
- Dutch label: Rugbyshirt
- Primary region: main torso and sleeves
- Secondary region: collar, button placket, sleeve cuffs
- Design rationale: broad shirt body, collar, and placket identify the style without stripe patterns.
- Representative color combination: forest / white

## Contrast Pocket Hoodie

- Catalog ID: `clothing.style.contrast-pocket-hoodie`
- Dutch label: Hoodie met contrastzak
- Primary region: torso, sleeves, hood exterior
- Secondary region: kangaroo pocket, hood lining, drawstrings
- Design rationale: the large contrast kangaroo pocket gives it a different focal point from the Zip Hoodie.
- Representative color combination: plum / lavender

## Winter Coat

- Catalog ID: `clothing.style.winter-coat`
- Dutch label: Winterjas
- Primary region: coat body and sleeves
- Secondary region: collar/inner lining, button/placket, cuffs
- Design rationale: heavier coat proportions and central placket read as winter outerwear without bundling a scarf.
- Representative color combination: denim / coral

## Cardigan

- Catalog ID: `clothing.style.cardigan`
- Dutch label: Vest
- Primary region: cardigan body and sleeves
- Secondary region: visible undershirt, button strip/trim
- Design rationale: open front edges and visible undershirt separate it from a jacket.
- Representative color combination: cocoa / mint

## Sports Shirt

- Catalog ID: `clothing.style.sports-shirt`
- Dutch label: Sportshirt
- Primary region: central shirt body
- Secondary region: side panels, shoulder/sleeve accents, collar trim
- Design rationale: panel geometry reads sporty without logos, numbers, or team markings.
- Representative color combination: teal / mustard

## Apron / Smock

- Catalog ID: `clothing.style.apron-smock`
- Dutch label: Schort
- Primary region: underlying shirt/smock base
- Secondary region: apron/front overlay, straps/trim
- Design rationale: a neutral overlay and straps suit children and adults without gendered assumptions.
- Representative color combination: rose / butter

# Implementation Summary

Added eight `ShirtStyle` tokens, renderer asset entries, catalog items with Dutch labels, accessibility labels, tags, renderer bindings, stable IDs, and `primary`/`secondary` color region metadata. Existing artwork was not changed.

# Editor Integration

No editor-specific code was required. The existing data-driven `clothing.secondary-color` gating sees the new catalog `colorRegions` declarations and exposes secondary color controls for all eight new garments. Primary-only garments still hide the secondary controls.

# Compatibility Notes

Existing avatars render through the same renderer path. Existing clothing IDs and defaults remain valid. Single-color garments still declare primary only and ignore secondary colors. Polo, Jacket, and Dress remain dual-color with unchanged behavior. The modern `avatarSelection` path and API contracts remain compatible.

# Validation

Validation covered the Clothing V3 compatibility and rendering invariants that matter for a catalog-only artwork expansion:

- All eight new garments are registered renderer assets and each declares `colorRegions: ["primary", "secondary"]`.
- Existing primary-only garments remain primary-only and continue to ignore the secondary clothing color, preserving their rendered output behavior.
- Existing Polo, Jacket, and Dress remain dual-color garments with unchanged primary/secondary semantics.
- All new garments expose secondary-color controls through the existing catalog metadata because editor gating remains data-driven by `clothing.secondary-color`, `governingSlot: "clothingStyle"`, and each selected garment's `colorRegions`.
- Primary-only garment gating remains intact: selecting an existing primary-only garment hides the secondary color surface.
- Contrasting primary/secondary color selections render both selected swatches for dual-color garments.
- Identical primary/secondary color selections render safely because the same existing primary/secondary swatch resolution path is used and garment geometry does not depend on color contrast.
- Adapter normalization and selection mapping remain compatible with the existing `avatarSelection` persistence path.
- Save/load compatibility was confirmed through backend create/read tests that accept valid new clothing selections and persist the selected clothing style plus secondary color.
- Unknown IDs and category-mismatched secondary-color IDs remain rejected by existing backend catalog validation.
- No renderer regressions were found in layer ordering, valid SVG output, or existing primary-only/dual-color behavior.

# Test Results

The following verification was completed for the Clothing V3 slice on 2026-07-10. The results are recorded here so the report remains self-contained.

| Verification | Command | Result | Notes |
| --- | --- | --- | --- |
| .NET environment | `dotnet --info` | Passed | Confirmed .NET SDK 10.0.301 with repository-local `DOTNET_CLI_HOME` and `DOTNET_HOME` set. |
| Backend restore | `dotnet restore HomeOps.sln` | Passed | Restore completed. NuGet initially saw a transient 502 for one package and retried successfully; `SQLitePCLRaw.lib.e_sqlite3` vulnerability warning NU1903 was reported from existing dependencies. |
| Backend build | `dotnet build HomeOps.sln --no-restore` | Passed | Build succeeded with 0 errors and the existing NU1903 warning. |
| Backend tests | `dotnet test HomeOps.sln --no-build` | Passed | 378 passed, 0 failed, 0 skipped. |
| Frontend tests | `npm --prefix src/HomeOps.Client run test` | Passed | 35 test files passed; 228 tests passed. |
| Frontend production build | `npm --prefix src/HomeOps.Client run build` | Passed | Vite production build completed; Vite reported the existing chunk-size advisory for the main bundle. |
| NSwag/OpenAPI generation | `npx --yes nswag run nswag.json` | Passed | NSwag v14.7.1 completed successfully. |
| API/client diff verification | `git diff -- src/HomeOps.Contracts/openapi.json src/HomeOps.Client/src/api/homeOpsApiClient.ts --exit-code` | Passed | Exit code 0; no generated OpenAPI or TypeScript client diff was produced. |
| Playwright verification | `node /tmp/playwright-avatar-check.mjs` against a Vite dev server at `http://127.0.0.1:5173/` | Environment blocked | Chromium could not launch in this container because `libatk-1.0.so.0` is missing. The behavioral checks for live editor controls and 1366 × 768 viewport scrolling therefore remain unverified in this environment. No screenshots, traces, videos, or browser artifacts were added to the changeset. |
| SVG/XML validation | `python - <<'PY' ... xml.etree.ElementTree.fromstring(...) ... PY` | Passed | Confirmed XML parsing, title, eight example groups, distinct garment list, expected labels/assets, no script/image elements, no raster content, no external references beyond the standard SVG namespace, and unique IDs after per-avatar prefixing. |
| Diff whitespace check | `git diff --check` | Passed | No whitespace errors. |
| CodeQL checker | `command -v codeql_checker` | Not available | `codeql_checker` is not installed in this container, so CodeQL could not be executed locally. |

# SVG Variety Sheet

- Output filename: `docs/reports/2026-07-10-avatar-clothing-v3/avatar-clothing-v3-variety.svg`
- Represented garments: Zip Hoodie, Varsity Jacket, Rugby Shirt, Contrast Pocket Hoodie, Winter Coat, Cardigan, Sports Shirt, Apron / Smock
- Color combinations: navy/sky, red/cream, forest/white, plum/lavender, denim/coral, cocoa/mint, teal/mustard, rose/butter
- Every avatar body was generated from the real Avatar V2 renderer and then arranged into a standalone contact sheet.

## SVG Validation

The standalone SVG was validated as follows:

- Valid XML: parsed successfully with Python `xml.etree.ElementTree.fromstring`.
- Valid standalone SVG: contains an inline `<svg>` root with viewBox, title, description, text, and vector content only.
- Expected title present: `Avatar Clothing V3 multi-color variety sheet`.
- Exactly eight `avatar-example` groups are present.
- Exactly eight distinct garment values are present through `data-garment`: `zipHoodie`, `varsityJacket`, `rugbyShirt`, `contrastPocketHoodie`, `winterCoat`, `cardigan`, `sportsShirt`, and `apronSmock`.
- Expected renderer clothing assets are present through `data-clothing-asset` for the same eight renderer tokens.
- All visible garment labels are present: Zip Hoodie, Collegejack, Rugbyshirt, Hoodie met contrastzak, Winterjas, Vest, Sportshirt, and Schort.
- All color-combination labels are present: Navy / Sky, Red / Cream, Forest / White, Plum / Lavender, Denim / Coral, Cocoa / Mint, Teal / Mustard, and Rose / Butter.
- No `<script>` elements are present.
- No `<image>` elements are present.
- No embedded raster content is present.
- No external dependencies are present; the only URL-like value is the standard SVG namespace (`xmlns="http://www.w3.org/2000/svg"`). There are no `href`, `xlink:href`, HTTP(S) asset links, linked fonts, scripts, or external images.
- Renderer IDs are unique across the combined contact sheet. The real renderer output was post-processed only to prefix repeated internal renderer `id` values per avatar instance (for example, `avatar-v3-example-1-avatar-v2-layer-shirt`) while preserving the renderer-generated geometry, `data-*` asset markers, fills, strokes, and layer order.

# Risks

The larger clothing catalog increases the number of tiles in the bounded editor surface, so future catalog growth should continue to be monitored for viewport usability. Similar garment families must continue to assign `colorRegions` accurately or the editor gating could expose or hide the secondary color incorrectly.

# Future Opportunities

Future slices could add additional garments, patterns, or tertiary regions, but those should be separate architecture/product decisions and were intentionally not introduced here.

# Modified Files

- `src/HomeOps.Client/src/avatarV2/avatarV2.ts`
- `src/shared/avatar-catalog.json`
- `src/HomeOps.Client/src/avatarV2/avatarV2.test.ts`
- `src/HomeOps.Client/src/avatarCatalog/avatarCatalog.test.ts`
- `docs/reports/2026-07-10-avatar-clothing-v3/avatar-clothing-v3.md`
- `docs/reports/2026-07-10-avatar-clothing-v3/avatar-clothing-v3-variety.svg`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
