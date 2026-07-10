# Avatar Editor V3 Redesign

_Date: 2026-07-10_

## Executive Summary

The FamilyBoard Avatar Editor was rebuilt around a two-level, catalog-driven
navigation model so it can scale to dozens of options per category without a
future redesign. The previous editor exposed six flat attribute panels
(Huidskleur, Kapsel, Haarkleur, Kledingstijl, Kledingkleur, Accessoires) in a
narrow left rail, stacking every attribute of the active panel vertically. As
the catalog grows this forces long internal scrolling and mixes unrelated
attributes in one column.

V3 introduces five high-level **categories** — Huid (Skin), Haar (Hair),
Gezicht (Face), Kleding (Clothing) and Accessoires (Accessories) — surfaced as a
prominent visual **category rail**. Only the active category is shown. Inside a
category, individual attributes (for example Hair → _Stijl_ / _Kleur_) are
presented as a compact **segmented sub-tab**, so exactly one option grid is
visible at a time. That grid scrolls internally while the large live avatar
preview and the category rail stay permanently fixed. The interaction model, not
just the styling, was changed: navigation is now hierarchical, each attribute
owns the full option area, and every category has room to grow substantially.

No avatar content was added. All catalog items, colors, renderer bindings,
persistence, API contracts and validation are unchanged. Existing avatars
continue to load, render and save identically.

## Repository Review

**Editor architecture.** The editor is a thin wrapper around a shared,
catalog-driven controls component:

- `src/HomeOps.Client/src/avatarV2/AvatarEditorPage.tsx` — standalone editor
  surface (used by tests) with a permanent preview card + Save/Cancel/Reset.
- `src/HomeOps.Client/src/home/FamilyAvatarEditor.tsx` — the production modal
  launched from `FamilyMemberPage.tsx`, same layout inside a dialog.
- `src/HomeOps.Client/src/avatarCatalog/AvatarCatalogControls.tsx` — the shared
  control surface both wrappers render.

**Catalog-driven rendering.** The canonical catalog lives in
`src/shared/avatar-catalog.json` and is consumed by the frontend
(`avatarCatalog/avatarCatalog.ts`) and validated at API startup
(`AvatarCatalog/SharedAvatarCatalogSource.cs`, `AvatarCatalogValidator.cs`). The
catalog declares `categories` (one per selection slot), `items`, `palettes`,
`optionGroups`, `defaults` and `editorPanels`. `editorPanels` are a
presentation-only grouping consumed by the frontend controls; the backend
deserializer ignores them and the validator does not inspect them.

**Catalog volume today.** hair.style 8, hair.color 30, clothing.style 6,
clothing.color 48, eyewear.style 8, accessory.style 8, accessory.color 48,
skin.tone 20, head.variant 3 (defined but not currently exposed in the editor).
Clothing/accessory color already reach 48 options each, so scalable presentation
is already required.

**Renderer bindings / SVG preview.** Selections are mapped to the Avatar V2 SVG
renderer through `avatarCatalog/avatarCatalogAdapter.ts`
(`avatarSelectionToAvatarV2RenderConfig`) and rendered by
`avatarV2/avatarV2.ts` (`renderAvatarV2Svg`). Every tile/swatch renders a small
live preview of the avatar with that option applied.

**Selection model / validation.** `AvatarCatalogSelection` is a
`schemaVersion` + `selections` record keyed by slot. Helpers
(`updateAvatarSelection`, `normalizeAvatarSelection`, `avatarSelectionsEqual`,
`buildAvatarTilePreviewSelection`) are pure and unchanged. Backend validation
(`AvatarCatalogTests.cs`) rejects unknown/mismatched item ids and enforces
required slots — untouched by this slice.

**Accessories implementation.** Eyewear (Bril), head accessory (Accessoire) and
accessory color shared one flat "Accessoires" panel. Eyewear is single-select
with a "Geen bril" (none) option and maps to the Avatar V2 glasses layer.

**Responsiveness / touch / tests.** The controls used a two-column
`nav | panel` grid collapsing to one column under 900px, with a roving-arrow
keyboard handler over `[data-option-group]`. Tests
(`AvatarEditorPage.test.tsx`, `FamilyAvatarEditor.test.tsx`,
`avatarCatalog.test.ts`) covered live-preview updates, Save/Cancel/Reset,
grouped swatches, visual-only tiles and eyewear application.

## UX Design Rationale

_(This section is the required Viewport-First analysis; the editor is a bounded
dialog/surface that must fit the viewport with only internal scrolling.)_

**Current composition & why it strains.** The old controls placed a narrow
attribute rail beside a single panel that stacked _all_ of the active panel's
attributes. The Accessories panel alone stacked three attributes (eyewear +
accessory style + 48 accessory colors). Every attribute competes for the same
vertical column, so adding hairstyles, clothing styles, mouths, eyes, etc. makes
the column grow and pushes the interaction toward long internal scrolling. Flat
top-level attributes (6 today) would keep multiplying as new families are added.

**Primary vs secondary.** Primary and permanently visible: the live avatar
preview and the top-level category navigation. Secondary: the specific attribute
being edited and its option grid — these can be switched and internally
scrolled.

**What is compacted / paginated / internally scrolled.** Within a category, only
one attribute's option grid is mounted at a time (segmented sub-tabs). That grid
is the only element that scrolls; the preview, rail and sub-tabs stay fixed.
Permanent text is minimized — tiles/swatches stay visual with accessible names
retained as `aria-label`s and visually-hidden region headings.

**Proposed composition (reserved regions).**

- Editor surface: `preview column (fixed ~28rem) | controls column (flex)`.
- Preview column: status chip · large live preview (permanent) · Save / Cancel ·
  Reset.
- Controls column (`grid-rows: auto minmax(0,1fr)`):
  - Region A — **Category rail**: 5 visual chips (icon + name + current
    selection summary), always visible.
  - Region B — **Category body** (`grid-rows: auto minmax(0,1fr)`):
    - B1 — attribute sub-tabs (segmented) shown only when a category has more
      than one attribute.
    - B2 — a single internally-scrolling option grid for the active attribute.

**Viewport fit.** The editor surface owns a bounded height (page: `min-height`
clamp with `overflow:hidden`; modal: `height: min(56rem, 100vh - 2.5rem)` with
`overflow:hidden`). Only Region B2 scrolls (`min-height:0; overflow:auto`), so no
matter how many options a category holds, the surface never grows and the page
never gains a vertical scrollbar. Validated at 1280×800 and 1440×900.

**Information architecture mapping (existing content only).**

| Category (rail) | Attributes (sub-tabs) | Catalog categories |
| --- | --- | --- |
| Huid / Skin | – | `skin.tone` |
| Haar / Hair | Stijl · Kleur | `hair.style`, `hair.color` |
| Gezicht / Face | – | `eyewear.style` |
| Kleding / Clothing | Stijl · Kleur | `clothing.style`, `clothing.color` |
| Accessoires | Stijl · Kleur | `accessory.style`, `accessory.color` |

Glasses (Bril) move from the old Accessories panel into **Gezicht (Face)**,
where facial features belong and where future eyes/eyebrows/nose/mouth/facial
hair will live. This is a grouping change only — the item, renderer binding,
default and persistence are unchanged.

**Risks / trade-offs / alternatives considered.** Sub-tabs add one click to
reach a second attribute (e.g. hair color) — accepted because it gives each
attribute the entire, scalable option area and removes cross-attribute scroll.
Alternatives considered: (a) keep flat panels and only restyle — rejected, does
not scale; (b) show all attributes stacked with per-attribute internal scroll —
rejected, splits limited height across attributes and re-creates the crowding;
(c) a single mega-grid with filter chips — rejected, mixes semantically distinct
attributes and weakens clear selected states.

## Major Design Decisions

1. **Two-level catalog-driven navigation** (category rail → attribute sub-tabs)
   defined entirely by `editorPanels` + `categories`, so new attributes/families
   are added as data, not as another editor redesign.
2. **Five high-level categories** matching the desired experience
   (Skin/Hair/Face/Clothing/Accessories), grouping existing attributes.
3. **One option grid at a time** with internal scroll; preview and rail are
   permanently visible — the preview is never displaced by expanding lists.
4. **Glasses relocated to Face** to seed the Face category with real content and
   reserve it for future facial features.
5. **Concise sub-tab labels** via new optional `shortLabels` category metadata
   (`Stijl` / `Kleur`), while full category labels remain the accessible
   region names.
6. **Panel `icon` metadata** drives lightweight, decorative inline category
   glyphs (no new global icon assets), keeping the editor self-contained.
7. **Accessibility preserved**: roving-arrow keyboard nav retained for rails,
   sub-tabs and option grids; `aria-pressed`, `aria-label`s and region headings
   intact; selected states preserved.

## Scalability Assessment

- Adding hairstyles/hair colors/clothing/mouths/eyes/etc. is a catalog data
  change: add `items` (and, for a brand-new attribute, a `category` + reference
  it from a panel's `categoryIds`). The controls render any number of
  attributes as sub-tabs and any number of options in the internally-scrolling
  grid.
- New accessory families (hats, masks, …) are new categories added to the
  Accessories (or a new) panel — they appear as additional sub-tabs
  automatically.
- The category rail holds a small, stable set of top-level families; option
  volume lives behind sub-tabs and internal scroll, so the surface height is
  independent of catalog size.

## Compatibility Notes

- `src/shared/avatar-catalog.json`: only `editorPanels` were restructured and
  optional `icon` / `shortLabels` metadata added. No `items`, `categories`
  slots, `palettes`, `optionGroups`, `defaults`, renderer bindings, ids or
  colors were changed or removed.
- Backend: `editorPanels` are ignored by the deserializer and not validated;
  API contracts, persistence and validation are unchanged.
- Adapter/renderer: untouched. Existing `AvatarSelection` and legacy
  `avatarV2Config` continue to load and map identically.

## Validation

- Existing avatars load: `normalizeAvatarSelection` / legacy mapping unchanged;
  adapter tests pass; the populated editor was opened against live
  VisualReview data (`visual-full`) and every existing selection loaded and
  rendered correctly (see screenshots).
- Existing avatars save: the save path is unchanged by this slice. The redesign
  does not alter the selection payload for an equivalent choice, so save
  behaviour is byte-identical to baseline. At the API contract level a
  single-field `avatarSelection` `PUT /api/family-members/riley` carrying the
  new selections (e.g. `clothing.style.overall`, `eyewear.style.round`) returns
  `200 OK`, confirming the reshaped catalog remains contract-valid. **A
  pre-existing save bug was discovered during validation — see Risks.**
- No catalog entries broken: `avatarCatalog.test.ts` item-count/label/eyewear
  assertions pass; backend `AvatarCatalogTests` (359 API tests) pass.
- Renderer output correct: `avatarV2` tests and eyewear glasses-layer
  assertions pass; the live preview updates immediately on every selection in
  the browser review (glasses, clothing, colors all render correctly).
- Viewport: with the editor open at 1366×900, `document.body` and
  `document.documentElement` both stay at `900px` (`scrollHeight === clientHeight`);
  the page is not vertically scrollable. Only the option grid scrolls internally.

## Test Results

- `dotnet restore HomeOps.sln` — success (pre-existing `NU1903`
  `SQLitePCLRaw.lib.e_sqlite3` high-severity advisory warning only; unrelated to
  this slice).
- `dotnet build HomeOps.sln --no-restore` — success, 0 errors (same `NU1903`
  warning).
- `dotnet test HomeOps.sln --no-build` — **359 passed, 0 failed, 0 skipped**.
- `npm test -- --run` (frontend, `src/HomeOps.Client`) — **215 passed** across
  35 files (includes the rewritten avatar editor tests).
- `npm run build` (`tsc -b && vite build`) — success; production bundle emitted.

## Screenshot Summary

Populated desktop screenshots (1366×900, live VisualReview data, Riley) stored in
`docs/reports/2026-07-10-avatar-editor-v3/`:

- `01-main-editor-skin.png` — main editor with the category rail and large live
  preview; Skin category active (grouped Menselijk / Fantasy swatches).
- `02-hair-style.png` — Hair category, **Stijl** sub-tab (visual hairstyle tiles).
- `03-hair-color.png` — Hair category, **Kleur** sub-tab (grouped color swatches).
- `04-clothing-style.png` — Clothing category, Stijl sub-tab.
- `05-clothing-changed-state.png` — a changed/unsaved selection (Tuinbroek): the
  preview and the Kleding rail summary update immediately and Save/Cancel enable
  ("Niet-opgeslagen wijzigingen").
- `06-accessories-style.png` — Accessories category, Stijl sub-tab.
- `07-face-glasses-selected.png` — Face category with **Ronde bril** selected;
  glasses render on the preview and the Gezicht rail summary updates.

## Risks

- Sub-tabs add one interaction to reach a second attribute (mitigated by clearer
  hierarchy and full-width grids).
- Relocating glasses to Face changes where users find that control; documented
  and reflected in tests.
- **Pre-existing save-contract mismatch (not introduced by this slice).** The
  frontend save adapter `src/HomeOps.Client/src/home/familyMembersApi.ts` always
  sends **both** `avatarSelection` and `avatarV2Config`, but the backend
  `FamilyMemberEndpoints.ResolveAvatarSelection` rejects requests that carry both
  ("Provide either avatarSelection or avatarV2Config, not both.") and instead
  derives the legacy `avatarV2Config` from the selection. As a result the in-app
  Save currently returns `400 Bad Request` for every member. This is a
  cross-layer persistence-contract bug that predates and is independent of this
  presentation redesign (the redesign does not touch the save path, and an
  existing test — `familyMembersApi.test.ts` — locks the "send both" behaviour).
  It is therefore outside this slice's presentation feature boundary and is
  reported here rather than fixed. **Recommended follow-up (own slice):** change
  `familyMembersApi.ts` to send only `avatarSelection` (the canonical
  catalog-driven format the backend expects) and update `familyMembersApi.test.ts`
  accordingly.

## Future Opportunities

- Surface `head.variant` under Face when face-shape editing is desired.
- Add search/filter within very large option grids (e.g. 50+ colors).
- Per-category "recently used" or favourites row.

## Modified Files

- `src/shared/avatar-catalog.json`
- `src/HomeOps.Client/src/avatarCatalog/avatarCatalog.ts`
- `src/HomeOps.Client/src/avatarCatalog/AvatarCatalogControls.tsx`
- `src/HomeOps.Client/src/avatarCatalog/avatarCategoryGlyphs.tsx` (new)
- `src/HomeOps.Client/src/styles.css`
- `src/HomeOps.Client/src/avatarV2/AvatarEditorPage.test.tsx`
- `src/HomeOps.Client/src/home/FamilyAvatarEditor.test.tsx`
- `src/HomeOps.Client/src/home/FamilyMemberPage.test.tsx`
- `src/HomeOps.Client/src/avatarCatalog/avatarCatalog.test.ts`
- `docs/reports/2026-07-10-avatar-editor-v3/avatar-editor-v3.md`
- `docs/reports/2026-07-10-avatar-editor-v3/01-main-editor-skin.png` (new)
- `docs/reports/2026-07-10-avatar-editor-v3/02-hair-style.png` (new)
- `docs/reports/2026-07-10-avatar-editor-v3/03-hair-color.png` (new)
- `docs/reports/2026-07-10-avatar-editor-v3/04-clothing-style.png` (new)
- `docs/reports/2026-07-10-avatar-editor-v3/05-clothing-changed-state.png` (new)
- `docs/reports/2026-07-10-avatar-editor-v3/06-accessories-style.png` (new)
- `docs/reports/2026-07-10-avatar-editor-v3/07-face-glasses-selected.png` (new)
- `docs/state/current-state.md`
