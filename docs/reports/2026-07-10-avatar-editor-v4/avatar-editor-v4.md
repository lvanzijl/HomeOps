# Avatar Editor V4 — UX Redesign

_Date: 2026-07-10_

> **Scope: UX redesign only.** This slice redesigns the FamilyBoard Avatar
> Editor's editing experience. The avatar renderer, SVG artwork, catalog data,
> catalog structure, renderer bindings, adapter, persistence, validation, and API
> contracts are unchanged. A saved avatar renders identically before and after
> this change — only the way a user edits it is different.

---

## Executive Summary

The Avatar Editor V3 redesign introduced a catalog-driven, two-level navigation
model: a high-level **category rail** (Huid, Haar, Gezicht, Kleding,
Accessoires) plus per-category **attribute sub-tabs** (Stijl / Kleur) that showed
exactly one internally-scrolling option grid at a time. It was architecturally
sound and it scaled, but it carried one latent cost identified in the V4
exploration: navigation was a **two-hop hierarchy**. To change hair colour a user
had to (1) select the Haar category, then (2) select the _Kleur_ sub-tab —
categories and attributes lived at two different levels of the UI.

Avatar Editor V4 removes that hop. The editor is now an **Adaptive Studio**:

- A permanent, larger **hero preview** on the left that never disappears and
  updates immediately.
- A single, always-visible **category bar** (Huid, Haar, Gezicht, Kleding,
  Accessoires) — the stable taxonomy is preserved.
- A single **bounded, internally-scrolling option surface** that shows _all_ of
  the active category's attributes at once (e.g. Hair shows style tiles **and**
  grouped colour swatches together), each under a clear, sticky section heading.

No sub-tabs, no second navigation level, no page scroll. The existing option
tiles (with their live miniature avatar previews) and grouped colour swatches are
reused unchanged; only where they appear and how they are navigated has changed.

The redesign is purely presentational: it lives in one React component
(`AvatarCatalogControls`), its stylesheet, and the two thin editor shells that
already embedded it. It touches no backend, no catalog data, no renderer, and no
persistence.

---

## Repository Review

The parts of the system this redesign **reuses unchanged**:

| Concern | Location | Status |
|---|---|---|
| Canonical catalog data | `src/shared/avatar-catalog.json` | Unchanged |
| Frontend catalog helpers | `src/HomeOps.Client/src/avatarCatalog/avatarCatalog.ts` | Unchanged |
| Selection ↔ render adapter | `src/HomeOps.Client/src/avatarCatalog/avatarCatalogAdapter.ts` | Unchanged |
| SVG renderer | `src/HomeOps.Client/src/avatarV2/avatarV2.ts` | Unchanged |
| Backend catalog validation | `src/HomeOps.Api/AvatarCatalog/…`, `FamilyMembers/FamilyMemberEndpoints.cs` | Unchanged |
| Persistence contract (`avatarSelection` only) | `src/HomeOps.Client/src/home/familyMembersApi.ts` | Unchanged |

Key enablers that made a data-driven redesign possible without touching data:

- **Presentation metadata already lives on each category** —
  `presentation.control` (`tile` | `swatch`), `itemLabelVisibility`,
  `groupStrategy` (`none` | `tag`), and `optionMinWidthRem`. The editor reads
  these to decide how to render each attribute, so V4 needed no new catalog
  fields.
- **`editorPanels`** already groups leaf categories into the five stable product
  categories, each with an `icon` and localized labels. V4 keeps this grouping as
  the category bar and simply renders every category inside the active panel on
  one surface instead of behind a sub-tab.
- **Tiles are true previews.** `buildAvatarTilePreviewSelection` renders a real
  mini-avatar per option. V4 preserves this strength verbatim.

The two editor shells that host the shared controls:

- `src/HomeOps.Client/src/home/FamilyAvatarEditor.tsx` — the production modal used
  from the Family surface.
- `src/HomeOps.Client/src/avatarV2/AvatarEditorPage.tsx` — the standalone surface
  used by tests.

Both already delegated all option rendering to
`avatarCatalog/AvatarCatalogControls.tsx`, so the redesign is concentrated there.

---

## UX Design Rationale

**Problem.** V3's two-hop navigation asks the user to hold a small mental model
("which attributes does this category have, and which sub-tab am I on?"). As the
catalog grows — 40 hairstyles, 60 hair colours, hats, mouths, facial hair,
fantasy content — more attributes appear per category and the "where is that
control?" cost compounds.

**Principle.** In a creative studio, the canvas is always visible and the tools
are always one click away. The editor should feel like a studio, not a settings
page with nested tabs.

**Response.**

1. **One navigation level.** The category bar is the only place a user navigates.
   Selecting a category reveals _everything_ that category can change, in reading
   order, on one surface. Discovery is now "scroll", not "find the second tab".
2. **Preview as the hero.** The preview column stretches to fill the dialog
   height and centres a larger avatar, reinforcing that the avatar — not the
   controls — is the product.
3. **Always-oriented.** The active category chip is strongly highlighted and each
   chip shows a live summary of its current selection (e.g. "Bob opzij ·
   Kastanje"), so the user always knows _where they are_ and _what is set_.
   Visible, sticky section headings ("Haar", "Haarkleur") tell the user _what
   they are editing_ as they scroll. The live preview and the "Niet-opgeslagen
   wijzigingen" / "Opgeslagen" status tell them _what changed_.
4. **Bounded overflow.** Growth is absorbed by internal scrolling inside the
   option surface. The dialog never grows the page; the global composition is
   stable regardless of how many options a category contains.

---

## Major Design Decisions

- **Removed the attribute sub-tabs entirely.** The `Stijl` / `Kleur` toggle and
  its associated state (`activeCategoryId`) are gone. All categories in the
  active panel render as stacked sections in one scroll surface.
- **Kept the five-category taxonomy.** Huid, Haar, Gezicht, Kleding,
  Accessoires remain the stable concepts. The avatar taxonomy was not
  redesigned.
- **Made section headings visible** for multi-attribute categories (Haar,
  Kleding, Accessoires) instead of visually-hidden. Single-attribute categories
  (Huid, Gezicht) keep the heading accessible; the visible label reinforces
  orientation without adding chrome. Headings are sticky within the scroll area.
- **Reused existing tiles and swatches verbatim.** `TileSection` and
  `SwatchSection`, the live mini-previews, grouped swatch families, and the
  catalog-driven `optionMinWidthRem` sizing are unchanged. Only their container
  and headings changed.
- **Enlarged the preview.** The preview card now uses a
  `auto / 1fr / auto` row layout so the avatar grows to fill available height,
  and the family-editor avatar SVG was enlarged.
- **Preserved every interaction contract:** save, cancel, reset, live preview,
  Escape-to-close, focus management, `aria-pressed` state, and the arrow-key
  roving focus inside every option group (`data-option-group` +
  `handleOptionGroupKeyDown`) are untouched.

---

## Scalability Assessment

The redesign is designed as though the catalog already contained 40 hairstyles,
60 hair colours, 40 clothing styles, 80 clothing colours, plus glasses, hats,
mouths, eyes, eyebrows, noses, and fantasy/seasonal content. None of those are
added here; the editor simply proves it could host them:

- **More options per attribute** → the responsive `auto-fit` grids reflow and the
  option surface scrolls internally. The page never grows. This is already
  visible today: Hair colour renders 30 grouped swatches and Clothing colour
  renders 48, all inside the bounded surface.
- **More attributes per category** (e.g. adding _mouths_, _noses_, _facial hair_
  to Gezicht) → each new catalog category inside the panel becomes another
  stacked, headed section on the same surface. No new navigation level, no
  redesign — just catalog data plus a renderer binding.
- **A new top-level category** → one more chip on the category bar (the bar
  already scrolls horizontally on narrow viewports).
- **New presentation styles** → because rendering is driven by
  `presentation.control` / `groupStrategy` / `itemLabelVisibility`, a new
  attribute picks up the right control from catalog data alone.

The single-surface model means the desktop and touch layouts share one
information architecture, so future growth does not fork into two designs.

---

## Compatibility Notes

- **No visual change to a saved avatar.** The renderer, adapter, and catalog are
  untouched; the same selection produces the same SVG.
- **Persistence unchanged.** The editor still emits `avatarSelection` and the
  derived `avatarV2Config` through the existing `onChange` contract; the
  Save/Cancel/Reset behaviour is byte-for-byte the same.
- **Component API unchanged.** `AvatarCatalogControls` keeps its exact props
  (`selection`, `controlsLabel`, `onSelectionChange`, `renderSelectionPreview`),
  so both editor shells consume it without modification.
- **Accessibility preserved.** Dialog role/labelling, focus-on-open, Escape
  handling, `aria-pressed` selection state, `aria-labelledby` sections, and
  arrow-key roving focus are all retained.
- **Pre-existing note (out of scope):** `familyMembersApi.ts` sends both
  `avatarSelection` and `avatarV2Config`; the backend rejects both and derives
  the legacy config from the selection. This cross-layer save-contract mismatch
  predates this slice and is a persistence concern outside a UX-only boundary, so
  it was not changed here.

---

## Validation

- **Feature boundary:** changes are confined to the frontend editor presentation
  — one component, one stylesheet, and the two editor test files. No backend,
  catalog JSON, renderer, adapter, persistence, or unrelated pages were touched.
- **Viewport contract:** reviewed live in a 1440×900 desktop browser for all
  five categories. The dialog fits the viewport with no `document.body` vertical
  scroll; overflow is handled inside the bounded option surface only.
- **Changeset sanity:** the diff is proportionate (frontend source, styles,
  tests, report, and five screenshots). The temporary Vite harness used to
  capture screenshots was removed and never committed; no caches, build
  artifacts, or binaries outside the report folder were introduced.

## Test Results

| Check | Command | Result |
|---|---|---|
| Backend restore | `dotnet restore HomeOps.sln` | Success (pre-existing NU1903 warning only) |
| Backend build | `dotnet build HomeOps.sln --no-restore` | Success, 0 errors |
| Backend tests | `dotnet test HomeOps.sln --no-build` | **359 passed**, 0 failed |
| Frontend tests | `npm test` (vitest) | **215 passed**, 0 failed |
| Frontend build | `npm run build` (tsc + vite) | Success |

The two editor test files were updated to the single-surface model (style and
colour are asserted to be visible together, without a `Kleur` sub-tab hop); all
other assertions — save, cancel, reset, live-preview immediacy, grouped palettes,
eyewear under Face, Escape-to-close — are unchanged and pass.

## Screenshot Summary

Populated desktop screenshots (1440×900), captured with the existing catalog on a
child avatar "Noor" (light-medium skin, side-bob chestnut hair, round glasses,
navy overall, mint flower clip):

| File | Shows |
|---|---|
| `screenshots/main.png` | Main editor — hero preview, category bar, Skin surface (grouped human + fantasy tones) |
| `screenshots/hair.png` | Hair — style tiles and grouped colour swatches together on one surface |
| `screenshots/clothing.png` | Clothing — outfit tiles and grouped colour families together |
| `screenshots/face.png` | Face — eyewear tiles with live mini-previews |
| `screenshots/accessories.png` | Accessories — accessory tiles and grouped accessory colours together |

---

## Risks

- **More vertical content per category.** Showing style + colour together makes a
  category taller; this is intentionally absorbed by internal scroll, but users
  who expected the old sub-tab split may need a moment to learn the new flow.
  Mitigated by sticky section headings and per-chip selection summaries.
- **Test coupling.** The editor tests asserted the old sub-tab structure and were
  updated. Future structural changes will similarly require test updates; this is
  expected for UI redesigns.
- **Wide colour rows for label-hidden swatches.** Categories whose
  `optionMinWidthRem` is large (e.g. hair colour) render fewer, wider swatches.
  This is existing catalog-driven sizing and was intentionally left unchanged to
  respect the "do not redesign the tiles" constraint; it can be tuned later via
  catalog data only.

## Future Opportunities

- **Search / filter** across a category's options once counts are large (the
  catalog already tags colour families via `optionGroups`).
- **Recently used / favourites** row at the top of a category surface.
- **New Face attributes** (eyes, eyebrows, nose, mouth, facial hair) drop straight
  into the Gezicht surface as additional catalog categories.
- **New top-level categories** (e.g. Hats, Background) add one chip each.

All of the above are catalog-data or additive-section changes that the
single-surface model absorbs without another editor redesign.

---

## Modified Files

- `src/HomeOps.Client/src/avatarCatalog/AvatarCatalogControls.tsx` — removed the
  attribute sub-tabs and their state; render all of the active category's
  attributes on one bounded, internally-scrolling option surface with visible,
  sticky section headings.
- `src/HomeOps.Client/src/styles.css` — replaced the sub-tab / single-scroll
  rules with the studio option-surface layout, added the visible section-heading
  style, stretched the preview column, and enlarged the family-editor preview.
- `src/HomeOps.Client/src/home/FamilyAvatarEditor.test.tsx` — updated to the
  single-surface model.
- `src/HomeOps.Client/src/avatarV2/AvatarEditorPage.test.tsx` — updated to the
  single-surface model.
- `docs/reports/2026-07-10-avatar-editor-v4/avatar-editor-v4.md` — this report.
- `docs/reports/2026-07-10-avatar-editor-v4/screenshots/*.png` — five populated
  desktop screenshots.
- `docs/state/current-state.md`, `docs/roadmap/phase-2.md` — slice records.
