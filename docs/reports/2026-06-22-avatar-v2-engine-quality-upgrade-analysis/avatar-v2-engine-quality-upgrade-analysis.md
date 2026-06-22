# Avatar V2 Engine Quality Upgrade Analysis

## Summary
- Go recommendation: **Go for engine upgrade only**.
- Keep Avatar V2 isolated, SVG-only, deterministic, and sample-driven.
- Do not integrate with editor, production UI, persistence, or MVP avatars in this slice.
- Primary required change: move from hard-coded layer geometry to a shared anatomy model consumed by all feature renderers.
- Target quality requires engine capability upgrades before more asset production.

## Current Engine Assessment
- Current renderer is a single TypeScript SVG string renderer with fixed `192 x 192` viewBox.
- Current config covers base age, skin tone, hair style/color, glasses style/color, shirt style/color, and accessory style/color.
- Current palette expands tokens into `base`, `shade`, `highlight`, and `line` roles.
- Current layer order is `Shirt -> Base -> Hair -> Glasses -> Accessory`.
- Eyes, mouth, ears, and face geometry are embedded inside `renderBase`.
- Ear placement is currently asset/function controlled through hard-coded paths, not anchor based.
- Head shape is limited to child/adult size differences through fixed rounded rectangles.
- Hair is one front layer plus highlight; it cannot wrap behind the head or separate volume from bangs/details.
- Clothing is generic shirt geometry; only rounded tee and collar variants are supported.
- Accessories use fixed coordinates and do not attach to named mount points.

## Anatomy Anchor Proposal

### Decision
- Introduce a shared `AvatarAnatomy` model resolved before rendering any layer.
- All renderers receive `{ config, anatomy, palette }`.
- Ears, eyes, nose, mouth, hairline, chin, head bounds, shoulders, and mount points derive from anatomy.
- Ear placement must be controlled only by anatomy anchors.

### Required Data Structures
```ts
type AvatarHeadVariant = 'round' | 'oval' | 'wide' | 'child';

type AvatarPoint = { x: number; y: number };
type AvatarBounds = { x: number; y: number; width: number; height: number; rx?: number; ry?: number };
type AvatarAnchor = AvatarPoint & { rotation?: number; scale?: number };

interface AvatarAnatomy {
  viewBox: { width: 192; height: 192 };
  head: {
    variant: AvatarHeadVariant;
    bounds: AvatarBounds;
    center: AvatarPoint;
    chin: AvatarAnchor;
    hairline: AvatarAnchor;
  };
  face: {
    eyeLineY: number;
    leftEye: AvatarAnchor;
    rightEye: AvatarAnchor;
    nose: AvatarAnchor;
    mouth: AvatarAnchor;
  };
  ears: {
    left: AvatarAnchor;
    right: AvatarAnchor;
    width: number;
    height: number;
  };
  body: {
    neck: AvatarBounds;
    shoulders: AvatarAnchor;
    chest: AvatarAnchor;
    shirtTopY: number;
  };
  mounts: Record<AvatarMountPoint, AvatarAnchor>;
}
```

### Renderer Impact
- `renderBase` splits into `renderHead`, `renderEars`, and `renderFace`.
- Hair, glasses, clothing, and accessory renderers stop owning absolute facial/body placement.
- Geometry helpers should generate paths from anchors instead of inline magic numbers.
- Tests should assert anchor-driven ear output changes with head variant while assets remain unchanged.

### Migration Approach
1. Add anatomy resolver with current child/adult geometry replicated as `child` and `oval` presets.
2. Refactor ears to consume `anatomy.ears` first; keep current visual output as close as practical.
3. Move eyes/mouth/glasses to `anatomy.face` anchors.
4. Move shirt/clothing top and chest points to `anatomy.body`.
5. Add visual sample coverage for each head variant before expanding assets.

## Head Variant Proposal

### Decision
- Add `headVariant` to config independently from member age.
- Keep `base: child | adult` only if it is still needed for defaults; do not use it as the only shape selector.

### Rendering Model
- Use anchor presets per head variant:
  - `round`: balanced width/height, soft cheeks.
  - `oval`: taller face, lower chin.
  - `wide`: wider cheeks/jaw, slightly wider ear span.
  - `child`: rounder, lower facial features, softer chin, smaller body ratio.
- Head renderer should accept bounds and optional path metadata.
- Prefer SVG paths for head silhouettes once rounded rectangles limit identity.

### Configuration Model
```ts
interface AvatarConfig {
  base: 'child' | 'adult';
  headVariant: 'round' | 'oval' | 'wide' | 'child';
  // existing selections retained
}
```

### Asset Implications
- Hair and glasses must be tested against all head variants.
- Ears are not per-asset; they reposition through anatomy.
- Clothing should not depend on head variant except through neck/shoulder anchors.

## Hair Depth Proposal

### Decision
- Replace one Hair layer with three optional hair sublayers:
  - `BackHair`
  - `FrontHair`
  - `HairHighlights`

### Layer Ordering
1. `BackHair`
2. `Shirt` / clothing base
3. `Neck` / body base if separated
4. `Head` and ears
5. `Face`
6. `FrontHair`
7. `Glasses`
8. `HairHighlights`
9. `Accessories`

### Rendering Complexity
- Hair assets become structured definitions rather than one string branch.
- Back hair can sit behind ears/head for bobs, curls, ponytail-like volume, and longer cuts.
- Front hair handles bangs, swoops, curls over forehead, and silhouette variation.
- Highlights remain deterministic paths tied to hair geometry and palette role.

### Backward Compatibility
- Current hair styles map to `FrontHair` only with optional migrated highlights.
- Existing config names can remain valid through an adapter.
- Samples should compare deterministic render output, not exact old SVG strings.

## Clothing Proposal

### Decision
- Replace generic shirt renderer with clothing asset definitions.
- Initial clothing targets: `hoodie`, `sweater`, `tShirt`, `overall`.

### Asset Structure
```ts
type ClothingStyle = 'hoodie' | 'sweater' | 'tShirt' | 'overall';

interface ClothingAsset {
  style: ClothingStyle;
  silhouette: (ctx: AvatarRenderContext) => string;
  details: (ctx: AvatarRenderContext) => string;
  monochromeRequiredDetails: string[];
}
```

### Palette Usage
- Use clothing palette roles for base fabric, shade folds, highlight seam light, line, and optional trim/accent.
- Overalls should use separate fabric and button/strap roles.
- Hoodie should include hood silhouette and drawstrings.
- Sweater should include ribbing/cuffs or neckline texture.
- T-Shirt should retain sleeve and collar shape in monochrome.

### Renderer Responsibilities
- Renderer selects asset, passes anatomy body anchors, and applies palette.
- Asset owns recognizable clothing details, not body placement.
- Every clothing item must remain identifiable using line art plus one fill color.

## Accessory Mount Proposal

### Decision
- Introduce named mount points with optional transforms.
- Accessories render relative to mount anchors, never global fixed coordinates by default.

### Data Model
```ts
type AvatarMountPoint =
  | 'hairLeft'
  | 'hairRight'
  | 'headTop'
  | 'headSideLeft'
  | 'headSideRight'
  | 'chestCenter'
  | 'shirtLeft'
  | 'shirtRight';

interface AvatarAccessoryConfig {
  style: AccessoryStyle;
  color: PaletteToken;
  mount: AvatarMountPoint;
  offset?: AvatarPoint;
  rotation?: number;
  scale?: number;
}
```

### Rendering Rules
- Hair-mounted accessories render after `FrontHair` or after `HairHighlights` depending on accessory type.
- Head-mounted accessories render above hair unless explicitly behind-front-hair.
- Chest/shirt-mounted accessories render on clothing, before head/face layers if visually part of clothing.
- Accessory defaults should be style-specific so users do not manage technical transforms.

### Optional Transforms
- Allow small deterministic `offset`, `rotation`, and `scale` for asset tuning.
- Keep transforms internal/editor-generated; do not expose technical transform controls to children.

## Palette Proposal

### Decision
- Expand palette roles, but keep user-facing choices simple.
- Users choose semantic swatches; engine resolves technical roles.

### Proposed Roles
```ts
interface ExpandedSwatch {
  base: string;
  shade: string;
  highlight: string;
  line: string;
  softShadow: string;
  blush?: string;
  accent?: string;
  trim?: string;
  deepShade?: string;
}
```

### Use Cases
- `softShadow`: grounding under chin, clothing, and hair volume.
- `blush`: warm child-friendly cheek/nose accents for skin palettes.
- `accent`: accessories, patches, buttons, or small identity details.
- `trim`: hoodie strings, collar ribbing, overall straps, sweater cuffs.
- `deepShade`: hair depth and under-layer separation.

### Guardrail
- Do not expose HEX/RGB or role names in UI.
- Keep contrast checked at asset authoring time, not user configuration time.

## Asset Design Rules

### Silhouette Readability
- Each asset must be identifiable at `48 x 48` and `96 x 96`.
- Clothing must be recognizable in monochrome through outline and internal detail.
- Hair styles must have different outer silhouettes, not only different highlights.

### Anatomy Compliance
- Ears must use anatomy anchors only.
- Eyes, glasses, mouth, nose hints, hairline, and chin must align to anatomy anchors.
- Assets may read anchors but must not redefine canonical anatomy positions.

### Contrast
- Lines must remain visible on base fill.
- Highlights should be subtle and not required for recognition.
- Avoid low-contrast detail as the only differentiator between variants.

### Highlight Usage
- Highlights should describe volume, fabric folds, or hair flow.
- Avoid decorative shine that makes avatars feel plastic or toy-like.
- Hair highlights should follow strand direction.

### Asymmetry Guidance
- Use mild asymmetry for personality: side part, clip placement, curl cluster, patch, strap angle.
- Avoid heavy asymmetry that breaks family-friendly consistency or makes samples feel off-model.

### Small-Size Readability
- Minimum stroke target: `2.5px` at `192 x 192` viewBox for primary outlines.
- Avoid details thinner than `2px` unless purely decorative.
- Do not rely on text, tiny symbols, or dense patterns.

### SVG Rules
- SVG only.
- No raster `<image>` references.
- No external URLs or data URLs.
- Deterministic output from config and asset definitions.
- Stable layer IDs for tests and future visual diffing.

## Risks
- Anchor migration can subtly change current samples; treat exact old geometry as non-contractual.
- More layers increase ordering bugs, especially hair/accessory interactions.
- Asset definitions may become code-heavy if no shared path helpers are introduced.
- Palette expansion can drift into technical color controls unless editor scope stays separate.
- Head variants multiply asset QA; every new hair/glasses/accessory asset needs variant checks.

## Recommended Implementation Order
1. Add `AvatarAnatomy` resolver and render context without changing public samples more than necessary.
2. Move ears to anatomy anchors and add tests proving assets do not control ear placement.
3. Add head variants and generate static samples for each variant.
4. Split hair into `BackHair`, `FrontHair`, and `HairHighlights`; migrate existing hair styles.
5. Replace shirt styles with clothing asset definitions for Hoodie, Sweater, T-Shirt, and Overall.
6. Add accessory mount points and migrate current star clip, leaf pin, and crown to mounts.
7. Expand palette roles internally and update assets to use them.
8. Add asset standards checks where practical: no raster refs, deterministic render, required layers, small-size sample review checklist.

## Go / No-Go Recommendation
- **Go** for an isolated Avatar V2 engine quality upgrade.
- **No-Go** for editor integration in the same slice.
- **No-Go** for production UI integration in the same slice.
- **No-Go** for MVP avatar replacement in the same slice.
- Required acceptance gate: SVG-only deterministic samples showing anchor-based ears, at least four head variants, hair depth, recognizable clothing, mounted accessories, and expanded internal palette roles.
