# Executive Summary

This slice establishes the first scalable **Accessories** architecture for the
FamilyBoard avatar system and ships the first accessory family — **Eyewear** —
end to end. Following the prior research phase, glasses are **not** a standalone
top-level category. Instead the editor exposes a single **Accessories** area,
and Eyewear lives inside it as a dedicated, first-shown section (conceptually
`Accessories → Face → Eyewear`). Existing head accessories remain available in
the same Accessories area.

The change is intentionally the smallest complete vertical slice: it adds one new
catalog category (`eyewear.style`) with a curated 8-item collection (including
"None"), wires it through the existing renderer, persistence, validation, and
editor UI, and strengthens selection validation so unknown or incompatible IDs
are rejected for every slot. No speculative wearable framework was built. Masks,
goggles, VR headsets, AR glasses, visors, respirators, and multi-slot face
accessories are deliberately **not** implemented, but the structure supports them
later without redesign.

All required verification passed: `dotnet restore/build/test` (359 tests),
frontend `npm test` (213 tests) and production `npm run build`. Desktop
screenshots of the Accessories category, an applied eyewear selection, and all
eyewear examples are included.

# Repository Architecture Review

The avatar system is data-driven from a shared catalog and rendered by a
deterministic SVG renderer. Reviewed areas:

- **Avatar catalog (data):** `src/shared/avatar-catalog.json` is the single
  source of truth (categories, items, editor panels, defaults, palettes). It is
  consumed by both the frontend helpers and backend startup validation.
- **Frontend catalog layer:** `src/HomeOps.Client/src/avatarCatalog/` —
  `avatarCatalog.ts` (types, slots, selection helpers), `avatarCatalogAdapter.ts`
  (selection → renderer config), `AvatarCatalogControls.tsx` (generic editor UI
  driven by editor panels/categories).
- **Selection persistence:** selections are stored as a slot→itemId map
  (`AvatarCatalogSelection` on the client; `AvatarSelection` on the server).
  Family members persist `AvatarSelection`, with a legacy `AvatarV2Config`
  compatibility surface.
- **Catalog validation:** `AvatarCatalogValidator` validates catalog integrity at
  startup; `AvatarCatalogService.ValidateForWrite` validates incoming selections.
- **Renderer bindings:** each catalog item carries a `renderer.rendererToken`;
  the adapter maps tokens to the renderer's typed config.
- **SVG layering:** `avatarV2.ts` composes ordered layers. The glasses layer
  (`renderGlasses`, id `avatar-v2-layer-glasses`) already existed and is drawn
  after front hair and before hair highlights and head accessories — the correct
  face-front position.
- **Current accessory implementation:** a single `accessory.style` /
  `accessory.color` pair holds **head/hair** ornaments (star, bow, headband,
  crown, etc.), mounted at hair/head anchor points.
- **Compatibility mapping:** `MapLegacyAvatarV2` / `ToLegacyAvatarV2` and the
  client adapter round-trip legacy configs; item `legacyIds` map old tokens to
  catalog IDs.
- **DTOs:** `AvatarSelectionDto` carries an open `Selections` dictionary, so
  adding a slot needs no contract/DTO change.
- **Tests:** `avatarCatalog.test.ts`, `avatarCatalogAdapter.test.ts`,
  `avatarV2.test.ts`, `AvatarEditorPage.test.tsx`, and backend
  `AvatarCatalogTests.cs`.
- **Screenshot generation:** the app renders SVG deterministically, so a
  temporary Vite harness mounting the real editor/renderer was sufficient to
  capture desktop screenshots (harness removed after capture).

**Key finding:** because the system is catalog-driven, most of the work is data
plus a small renderer extension. The renderer already supported a `glasses`
layer, so Eyewear could be added with minimal disruption and no changes to
unrelated subsystems.

# Design Decisions

1. **No standalone "Glasses" category.** Eyewear is added as a new
   `eyewear.style` category surfaced inside the existing **Accessories** editor
   panel, shown first (Face → Eyewear), with the existing head accessories below
   it. Users see a friendly "Bril" section, never slots/anchors/layers.
2. **Reuse the existing glasses render layer.** The renderer already draws a
   glasses layer at the correct face-front position, so Eyewear renders through
   it. This avoids introducing a new layering system.
3. **Optional, single-select category with a "None" default.** `eyewear.style`
   is `required: false`, `allowsNone: true`, defaulting to `eyewear.style.none`.
   This preserves backward compatibility (existing avatars implicitly have no
   glasses) while enforcing that only one eyewear item is selected at a time
   (single slot).
4. **Renderer tokens equal renderer style names.** Each eyewear item's
   `rendererToken` matches an `avatarV2` `GlassesStyle`, so the adapter maps
   selection → renderer with a single lookup and no bespoke translation table.
5. **Strengthened validation for all slots.** `ValidateForWrite` now validates
   every provided known slot (unknown ID / wrong category / retired) — not only
   required categories — so optional categories such as Eyewear reject bad input.
6. **No speculative framework.** Masks, goggles, VR headsets, AR glasses,
   visors, respirators, and simultaneous face accessories are out of scope. The
   region/slot naming (`eyewear.style`, `layer: "glasses"`, `face`/`eyewear`
   tags) leaves room to add them later as new categories without redesign.

# Implementation Summary

**Catalog data (`src/shared/avatar-catalog.json`)**
- Added category `eyewear.style` (slot `eyewearStyle`, `required: false`,
  `allowsNone: true`, tile control, tags `editor/accessory/face/eyewear`).
- Added 8 items: `none, regular, thick-frame, round, rectangular, sunglasses,
  star, heart`, each with a `glasses`-layer renderer binding.
- Added default `eyewearStyle: eyewear.style.none`.
- Added `eyewear.style` as the first category in the existing `accessories`
  editor panel and refreshed the panel description.

**Renderer (`src/HomeOps.Client/src/avatarV2/avatarV2.ts`)**
- Expanded `GlassesStyle` to `none | regular | thickFrame | round | rectangular |
  softSquare | sunglasses | star | heart` (kept `softSquare` as a legacy alias).
- Rewrote `renderGlasses` to render framed styles (regular/round/rectangular/
  thick-frame, plus tinted sunglasses) and novelty shaped lenses (star/heart),
  preserving the exact geometry for the previously tested `round`/`softSquare`
  frames.

**Adapter (`avatarCatalogAdapter.ts`)**
- Mapped the eyewear selection's renderer token to the renderer `glasses.style`
  (previously hard-coded to `none`).

**Frontend catalog (`avatarCatalog.ts`)**
- Added the `eyewearStyle` selection slot.

**Backend**
- `AvatarSelection.cs`: added the `EyewearStyle` slot constant.
- `AvatarCatalogService.cs`: `ValidateForWrite` now validates every provided
  known slot for unknown/incompatible/retired items, in addition to enforcing
  required-category presence.

# Compatibility Notes

- **Existing avatars render unchanged.** Selections without `eyewearStyle`
  normalize to `eyewear.style.none` (no glasses), matching prior behavior. The
  legacy `AvatarV2Config` surface is untouched.
- **Existing selections remain valid.** Eyewear is optional, so previously valid
  selections still pass `ValidateForWrite`; on write they are normalized to
  include `eyewearStyle = none`.
- **No migration required.** Because the slot is optional with a default and the
  DTO already carries an open dictionary, no schema or data migration is needed.
- **Renderer legacy alias preserved.** `softSquare` remains a valid
  `GlassesStyle` so existing sample configs/tests continue to work.
- **Contract unchanged.** No new DTOs or endpoints; the OpenAPI contract is
  unaffected.

# Validation

- Unknown eyewear item IDs are rejected (e.g. `eyewear.style.laser` → 400).
- Category-mismatched IDs are rejected (e.g. an `accessory.style.*` value in the
  `eyewearStyle` slot → 400).
- Selections without eyewear remain valid and normalize to `eyewear.style.none`.
- The same stronger checks now apply to every optional slot, not just required
  ones, while required-category presence is still enforced.
- Startup catalog validation continues to accept the bundled catalog (unique
  category IDs/slots/orders, valid defaults, per-item accessibility labels).

# Test Results

Backend (`dotnet test HomeOps.sln`): **359 passed, 0 failed.**
New/updated backend tests in `AvatarCatalogTests.cs`:
- `CreateAcceptsEyewearSelectionAndPersistsIt`
- `CreateRejectsUnknownEyewearItemId`
- `CreateRejectsCategoryMismatchedEyewearItemId`
- `CreateWithoutEyewearRemainsValidAndDefaultsToNone`
- `DefaultSelectionIncludesEyewearNone`
- Fixed the shared `ValidSelection()` helper to use a real skin tone
  (`skin.tone.medium`) so valid-create paths are exercisable.

Frontend (`npm test`): **213 passed, 0 failed.** New/updated coverage:
- `avatarCatalog.test.ts`: eyewear category shape, ordering, single-select
  default, panel wiring, and per-style rendering through the glasses layer.
- `avatarCatalogAdapter.test.ts`: eyewear selection → `glasses.style` mapping
  (including `round`, `thickFrame`, `heart`) and default `none`.
- `avatarV2.test.ts`: framed, tinted, and novelty eyewear styles all produce a
  stable `avatar-v2-layer-glasses`.
- `AvatarEditorPage.test.tsx`: the Accessories panel exposes the Eyewear
  section, applying a pair updates the live preview and deselects "None", and
  head accessories remain available.

Frontend production build (`npm run build`): **succeeded.**

# Screenshot Summary

Captured at a 1440×900 desktop viewport from the real editor/renderer:

- `accessories-eyewear-category.png` — the **Accessories** panel with the
  **Bril (Eyewear)** section shown first, above the existing head accessories.
- `eyewear-selection-applied.png` — **Ronde bril** (round glasses) applied to
  the live avatar, coexisting with a head accessory; the panel summary reads
  "Ronde bril · Ster · Mintgroen".
- `eyewear-style-examples.png` — all eight eyewear styles (None, Bril, Dik
  montuur, Ronde bril, Rechthoekige bril, Zonnebril, Sterrenbril, Hartjesbril)
  rendered on the avatar.

# Risks

- **Fixed frame color (V1).** Eyewear frames use a single neutral frame color;
  a per-eyewear color category is intentionally deferred. Low risk; additive
  later as a sibling `eyewear.color` category.
- **Novelty lens geometry.** Star/heart lenses use shaped paths rather than the
  tested rectangular geometry; they are covered by presence/shape tests but not
  pixel-exact assertions. Low risk for a decorative element.
- **Editor depth.** The `Accessories → Face → Eyewear` hierarchy is represented
  as a first-shown "Bril" section rather than nested navigation, to avoid
  redesigning the editor. If future accessory families multiply, a nested
  sub-navigation may be warranted — a deliberate future step, not a regression.
- **Validation scope broadening.** `ValidateForWrite` now rejects bad IDs in any
  slot; this is stricter than before. Verified against the full backend suite to
  confirm no false rejections for valid selections.

# Proposed Category Hierarchy

Conceptual only — reflects what this slice enables, not additional code.

```
Accessories                      (existing editor area, now the growth point)
├── Face
│   └── Eyewear                  ← delivered in V1 (single-select, "None" default)
│       ├── None
│       ├── Regular glasses
│       ├── Thick-frame glasses
│       ├── Round glasses
│       ├── Rectangular glasses
│       ├── Sunglasses
│       ├── Star glasses
│       └── Heart glasses
└── Head                         (existing head/hair ornaments retained)
    ├── Star / Bow / Headband / Crown / …
    └── (accessory color)
```

Future families slot into the same Accessories area without redesign, e.g.
additional `Face` items (masks, goggles, visors, AR/VR — as new categories with
their own layer/override rules) and new regions (Neck, Ears) as new categories.
Each remains a curated, single-select catalog category surfaced under
Accessories; none needs to become a new top-level avatar category.

# Modified Files

- `src/shared/avatar-catalog.json` — eyewear category, items, default, panel wiring.
- `src/HomeOps.Client/src/avatarCatalog/avatarCatalog.ts` — `eyewearStyle` slot.
- `src/HomeOps.Client/src/avatarCatalog/avatarCatalogAdapter.ts` — eyewear → glasses mapping.
- `src/HomeOps.Client/src/avatarV2/avatarV2.ts` — expanded `GlassesStyle` and `renderGlasses`.
- `src/HomeOps.Api/AvatarCatalog/AvatarSelection.cs` — `EyewearStyle` slot constant.
- `src/HomeOps.Api/AvatarCatalog/AvatarCatalogService.cs` — stronger `ValidateForWrite`.
- `src/HomeOps.Client/src/avatarCatalog/avatarCatalog.test.ts` — eyewear catalog + render tests.
- `src/HomeOps.Client/src/avatarCatalog/avatarCatalogAdapter.test.ts` — eyewear mapping tests.
- `src/HomeOps.Client/src/avatarV2/avatarV2.test.ts` — eyewear style rendering tests.
- `src/HomeOps.Client/src/avatarV2/AvatarEditorPage.test.tsx` — Accessories/Eyewear editor test.
- `tests/HomeOps.Api.Tests/Lists/AvatarCatalogTests.cs` — eyewear persistence/validation tests.
- `docs/reports/2026-07-10-avatar-accessories-v1/` — this report and screenshots.
