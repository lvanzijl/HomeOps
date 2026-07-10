# Avatar Mouths V1

_Date: 2026-07-10_

## Executive Summary

Avatar Mouths V1 is the first catalog expansion built on top of the redesigned
Avatar Editor. It introduces a new **Mouth** attribute with ten hand-tuned SVG
mouth styles that let each family member's avatar read as a distinct person
while remaining unmistakably FamilyBoard.

The work is deliberately narrow. The editor, renderer architecture, catalog
structure, persistence, validation pipeline and API contracts are all preserved.
Mouth support is added as a normal catalog category (`mouth.style`) with a new
renderer layer, so it flows through the existing data-driven editor and
generic backend validation without new bespoke code paths.

The previous hard-coded facial expression becomes the `neutral` mouth style and
is byte-identical to the original artwork, so **every existing avatar renders
exactly as before** unless a new mouth is explicitly chosen.

## Repository Review

The avatar system spans a shared catalog, a frontend renderer/editor, and a
generic backend validator:

- **Canonical catalog** — `src/shared/avatar-catalog.json` holds every category,
  item, default, option group and editor panel. It is consumed by both the
  frontend catalog helpers and backend startup validation.
- **Renderer** — `src/HomeOps.Client/src/avatarV2/avatarV2.ts` builds the avatar
  SVG. Facial features (eyes and mouth) were rendered inside the
  `avatar-v2-layer-base` group in `renderHeadAndFace`, with the mouth as a single
  hard-coded `<path>`. `renderAvatarV2Svg` assembles the layers in a fixed
  order: back hair → shirt → head/face → behind-front-hair accessory → front
  hair → glasses → hair highlights → accessory.
- **Selection model** — `avatarCatalog.ts` maps catalog slots to a normalized
  `AvatarSelection`; `avatarCatalogAdapter.ts` converts a selection into the
  renderer's `AvatarConfig`; `avatarConfig.ts` provides a legacy fallback path.
- **Editor** — `AvatarCatalogControls` is fully data-driven. A catalog editor
  panel lists `categoryIds`, and each category renders as a labelled region of
  option tiles. The Face panel previously exposed only `eyewear.style`.
- **Backend** — `AvatarCatalogService` derives `DefaultSelection`,
  `ValidateForWrite`, and legacy-config mapping generically from catalog
  categories and defaults. `AvatarSelection.cs` defines the slot-name constants.
  `FamilyMembers/AvatarV2Config.cs` holds the legacy render config and, like
  eyewear, does not carry a mouth field.

The cleanest insertion point was therefore: add a `mouth.style` catalog
category + items, expose it in the existing Face panel, and split the mouth out
of the base layer into its own renderer layer keyed by the new attribute. No
new editor, validator, or persistence machinery is required.

## Design Decisions

- **Mouth is a catalog category, not a special case.** Adding `mouth.style`
  (slot `mouthStyle`, `required: false`, `allowsNone: false`) means the editor,
  normalization, defaults, and backend validation all work with no new logic —
  mirroring how eyewear is modelled.
- **`neutral` is the compatibility default and is byte-identical** to the
  original hard-coded mouth path (`M{cx-18} {cy}c10 12 27 12 37-1`). Existing
  avatars that lack a `mouthStyle` normalize to `neutral` and render unchanged.
- **Dedicated mouth layer.** The mouth moved out of `avatar-v2-layer-base` into
  a new `avatar-v2-layer-mouth` group, inserted immediately after the head/face
  and before hair/glasses/accessory layers. This keeps eyes stable, preserves
  layer ordering for every other feature, and isolates mouth artwork.
- **Shared ink + stroke constants.** Every style reuses the original mouth line
  colour (`#7a4545`) and 3–4px stroke weights, with a warm inner-mouth fill,
  soft tongue tone, and off-white teeth. This guarantees consistent line
  thickness and stroke style across the whole collection.
- **Restrained, on-brand expressions.** Styles are geometric variations of the
  existing smile rather than exaggerated cartoon shapes, so the artwork feels
  like it always belonged in FamilyBoard.
- **camelCase tokens / kebab-case ids.** Catalog item ids use compound suffixes
  (`mouth.style.big-smile`); renderer tokens are camelCase (`bigSmile`), matching
  existing conventions. Bindings carry `layer: "mouth"`.

## Implementation Summary

Ten styles are implemented: **neutral, smile, big smile, open smile, laughing,
smirk, determined, surprised, sad, tongue out**.

Renderer (`avatarV2.ts`):
- Added the `MouthStyle` union and an optional `mouth?: { style: MouthStyle }`
  on `AvatarConfig`.
- Removed the hard-coded mouth `<path>` from `renderHeadAndFace`.
- Added `avatarV2MouthStyles` and `avatarV2DefaultMouthStyle` exports,
  shared mouth ink constants, `mouthStyleArtwork(cx, cy)` producing all ten
  styles at the resolved mouth anchor, and `renderMouth` emitting
  `<g id="avatar-v2-layer-mouth" data-mouth-style="…">`.
- Wired `renderMouth` into `renderAvatarV2Svg` right after `renderHeadAndFace`.

Catalog (`avatar-catalog.json`):
- Added the `mouth.style` category and ten `mouth.style.*` items
  (`type: rendererStyle`, `layer: "mouth"`).
- Added default `"mouthStyle": "mouth.style.neutral"`.
- Extended the Face editor panel's `categoryIds` to
  `["mouth.style", "eyewear.style"]` and updated its description.

Frontend wiring:
- `avatarCatalog.ts` — added the `mouthStyle` selection slot.
- `avatarCatalogAdapter.ts` — maps `mouthStyle` → render config `mouth.style`.
- `avatarConfig.ts` — legacy fallback sets `mouth: { style: 'neutral' }`.

Backend:
- `AvatarSelection.cs` — added the `MouthStyle` slot constant. The mouth is not
  added to legacy `AvatarV2Config`, mirroring eyewear.

## Compatibility Notes

- **No existing avatar changes visually.** `neutral` reproduces the original
  mouth geometry exactly, and the renderer defaults `config.mouth?.style ??
  "neutral"`.
- **Previously-valid selections stay valid.** Because `mouth.style` is
  `required: false`, selections that predate the attribute pass validation and
  normalize to `neutral` on both frontend (`normalizeAvatarSelection`) and
  backend (`NormalizeWithDefaults` from catalog defaults).
- **Legacy config path is safe.** Legacy render configs default the mouth to
  `neutral`, so any avatar restored from legacy data renders identically.
- **API contracts unchanged.** Family-member saves continue to send only
  `avatarSelection`; the backend derives everything else from the catalog.

## Validation

- **Mouth selection** — a provided `mouthStyle` must reference an item in the
  `mouth.style` category; verified by the accepts/persists test.
- **Unknown IDs** — an id outside the category is rejected by the generic
  `ValidateForWrite` provided-value check; covered by a dedicated test.
- **Category mismatch** — an id from another category supplied for `mouthStyle`
  is rejected; covered by a dedicated test.
- **Defaults / compatibility** — omitting `mouthStyle` defaults to
  `mouth.style.neutral`, and the default selection includes the neutral mouth;
  both covered by tests. Legacy config mapping also defaults to neutral.

## Test Results

Added/updated coverage:
- **Renderer** (`avatarV2.test.ts`) — neutral is byte-identical to the original
  mouth; a config without a mouth equals neutral; every style renders
  deterministically with correct layer ordering (base < mouth < front hair).
- **Catalog** (`avatarCatalog.test.ts`) — Face panel now exposes mouth then
  eyewear; ten mouth styles with `neutral` default and `required: false`
  category props; renders through the mouth layer.
- **Adapter** (`avatarCatalogAdapter.test.ts`) — selection → render-config mouth
  mapping (default neutral, laughing, tongue out).
- **Editor** (`AvatarEditorPage.test.tsx`) — opening "Gezicht" and selecting a
  mouth updates the selection.
- **Backend** (`AvatarCatalogTests.cs`) — six tests covering accept/persist,
  unknown id, category mismatch, default-on-omit, legacy default, and
  default-selection-includes-neutral.

Verification runs:
- `dotnet restore` — succeeded.
- `dotnet build` (HomeOps.sln) — succeeded.
- `dotnet test` — **365 passing** (was 359).
- Frontend `npm test` — **221 passing** (was 215).
- Frontend `npx tsc -b` — clean.
- Frontend `npm run build` — succeeded.

_(A pre-existing, unrelated NU1903 SQLitePCLRaw advisory warning surfaces in the
test project restore; it is not introduced by this change.)_

## Screenshot Summary

Stored in `docs/reports/2026-07-10-avatar-mouths-v1/`:

- `face-category-mouth.png` — the Face editor category with the new **Mond**
  section (ten mouth tiles with live per-tile previews) alongside **Bril**, and
  the large hero preview.
- `mouth-styles.png` — all ten mouth styles on a single consistent avatar,
  demonstrating uniform line weight and proportions.
- `avatars-with-mouths.png` — eight distinct avatars, each combining a different
  mouth with different head shapes, skin tones (including a fantasy tone), hair,
  clothing, glasses, sunglasses, and accessories.

## Risks

- **Artwork tuning is subjective.** The ten styles are geometric approximations;
  minor curve adjustments may be desired after real-world use. They are isolated
  in `mouthStyleArtwork` and safe to tweak without touching wiring.
- **Anchor reliance.** Mouth artwork is positioned from `anatomy.face.mouth`,
  the same anchor used by the original mouth, so it scales with every head shape;
  new future head variants should keep providing that anchor.
- **Additive layer.** The new mouth layer sits between base and hair; any future
  feature inserted at the same position should preserve base < mouth ordering.

## Future Opportunities

- Add eye/eyebrow expression variants to further differentiate avatars.
- Group mouths into an option group (e.g. neutral/happy/playful) if the catalog
  gains richer editor grouping.
- Offer subtle per-style colour accents (e.g. lip tint) as an optional attribute.

## Modified Files

- `src/HomeOps.Client/src/avatarV2/avatarV2.ts`
- `src/shared/avatar-catalog.json`
- `src/HomeOps.Client/src/avatarCatalog/avatarCatalog.ts`
- `src/HomeOps.Client/src/avatarCatalog/avatarCatalogAdapter.ts`
- `src/HomeOps.Client/src/avatarV2/avatarConfig.ts`
- `src/HomeOps.Api/AvatarCatalog/AvatarSelection.cs`
- `src/HomeOps.Client/src/avatarCatalog/avatarCatalog.test.ts`
- `src/HomeOps.Client/src/avatarV2/avatarV2.test.ts`
- `src/HomeOps.Client/src/avatarCatalog/avatarCatalogAdapter.test.ts`
- `src/HomeOps.Client/src/avatarV2/AvatarEditorPage.test.tsx`
- `tests/HomeOps.Api.Tests/Lists/AvatarCatalogTests.cs`
- `docs/reports/2026-07-10-avatar-mouths-v1/` (report + screenshots)
- `docs/state/current-state.md`
