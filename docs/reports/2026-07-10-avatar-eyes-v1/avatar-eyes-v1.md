# Executive Summary

Avatar Eyes V1 adds the `eye.style` identity category exactly as recommended by the completed research. It ships four neutral FamilyBoard eye styles, makes Classic Round the compatibility default, moves eye rendering into the dedicated `avatar-v2-layer-eyes` renderer layer, and integrates eyes into the existing Face editor before Mouth and Eyewear.

This slice intentionally does not implement eye color, eyebrows, expressions, animation, blinking, closed eyes, wink states, angry/sleepy/surprised states, makeup, eyelashes, or renderer/editor redesigns.

# Repository Review

Reviewed `.github/copilot-instructions.md`, repository `AGENTS.md`, the Avatar Eyes research report, Mouths V1 renderer/catalog patterns, glasses renderer behavior, Avatar V2 renderer composition, catalog adapter paths, Face editor tests, catalog tests, and backend avatar selection validation tests.

# Design Decisions

- `eye.style` is a stable identity category, not an expression system.
- Existing avatars normalize to `eye.style.classic-round` and render with the same dark round eye geometry and catchlight philosophy as before.
- Eye style selection uses the existing catalog/default/normalization path instead of a migration.
- The Face editor order is Eyes, Mouth, Eyewear.
- Glasses remain an overlay above eyes with no sunglasses-specific logic.

# Eye Collection

## Classic Round

The compatibility default. It preserves the current FamilyBoard eyes: two dark round marks with subtle warm-white catchlights.

## Soft Almond

A slightly wider oval/almond shape that adds mature, calm identity variation while staying rounded and neutral.

## Gentle Arc

A visible open eye body with a soft upper arc. It adds warmth without becoming closed, sleepy, happy, or expressive eyes.

## Bright Wide

A subtly taller open shape that gives a youthful/readable identity option without anime-like sparkle, oversized sclera, or exaggerated expression.

# Renderer

Eyes now render in `avatar-v2-layer-eyes`, between the base head layer and the mouth layer. The base layer retains skin/head/ear/highlight geometry only. Eye drawing uses the existing anatomy anchors (`leftEye`, `rightEye`, and `eyeLineY`) and does not reposition facial anatomy.

Layer ordering is preserved as: back hair, shirt, base head, eyes, mouth, behind-front-hair accessory, front hair, glasses, hair highlights, accessory. Glasses continue to render above eyes.

# Editor Integration

The existing catalog-driven Face editor naturally absorbs `eye.style`. The Face category now surfaces Eyes first, then Mouth, then Eyewear. No editor redesign was introduced.

# Compatibility Notes

Existing saves remain valid because catalog normalization fills missing `eyeStyle` with `eye.style.classic-round`. Legacy Avatar V2 configuration conversion also defaults eyes to Classic Round. No database migration or API contract change was required.

# Validation

Validation covered unknown IDs, category mismatches, defaults, persistence, legacy compatibility, renderer output, editor integration, glasses compatibility, and layer ordering through backend and frontend tests.

# Test Results

- `dotnet restore HomeOps.sln` passed with the pre-existing `SQLitePCLRaw.lib.e_sqlite3` NU1903 warning.
- `dotnet build HomeOps.sln --no-restore` passed with the same NU1903 warning.
- `dotnet test HomeOps.sln --no-build` passed: 384 tests.
- `npm --prefix src/HomeOps.Client test` passed: 233 tests.
- `npm --prefix src/HomeOps.Client run build` passed with the existing Vite chunk-size warning.
- `npx --yes nswag run nswag.json` passed.
- `git diff --check` passed.
- `codeql_checker` was unavailable in this container.

# SVG Validation

Generated `avatar-eyes-v1-variety.svg` from the real Avatar V2 renderer. XML parsing passed. The artifact contains renderer-generated avatars only, unique IDs, no scripts, and no raster/image content. It demonstrates all four eye styles across representative head shapes, mouths, glasses, skin tones, and hairstyles.

# Playwright Verification

A Playwright verification was attempted against the real Vite app and editor flow, but Chromium could not launch in this container because `libatk-1.0.so.0` is missing from the environment. The intended verification covered Eyes appearing in Face, all four styles, live preview updates, glasses still rendering, and no page scrolling. Equivalent editor behavior is covered by React Testing Library tests in this slice; browser-level Playwright remains unverified due to the missing system dependency.

# Risks

- Browser-level visual validation could not complete because Playwright's browser dependency is missing.
- Eye shapes are intentionally subtle; future visual review may tune tiny geometry values while preserving the approved architecture.
- Sunglasses intentionally render over eyes and may obscure differences, which matches the research recommendation.

# Future Opportunities

Future slices may add eye color, eyebrows, expressions, or animation as separate systems. Eye color, eyebrows, expressions, and animation were intentionally postponed in Eyes V1.

# Modified Files

- `src/shared/avatar-catalog.json`
- `src/HomeOps.Api/AvatarCatalog/AvatarSelection.cs`
- `src/HomeOps.Client/src/avatarCatalog/avatarCatalog.ts`
- `src/HomeOps.Client/src/avatarCatalog/avatarCatalogAdapter.ts`
- `src/HomeOps.Client/src/avatarCatalog/avatarCatalog.test.ts`
- `src/HomeOps.Client/src/avatarCatalog/avatarCatalogAdapter.test.ts`
- `src/HomeOps.Client/src/avatarV2/avatarConfig.ts`
- `src/HomeOps.Client/src/avatarV2/avatarV2.ts`
- `src/HomeOps.Client/src/avatarV2/avatarV2.test.ts`
- `src/HomeOps.Client/src/avatarV2/AvatarEditorPage.test.tsx`
- `tests/HomeOps.Api.Tests/Lists/AvatarCatalogTests.cs`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-07-10-avatar-eyes-v1/avatar-eyes-v1.md`
- `docs/reports/2026-07-10-avatar-eyes-v1/avatar-eyes-v1-variety.svg`
