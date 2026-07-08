# FamilyBoard Avatar Catalog Technical Architecture Analysis

Date: 2026-07-08
Status: analysis only
Scope: future Avatar Catalog architecture; no production-code changes

## 1. Executive summary

The Avatar Catalog should become the canonical source of truth for every user-selectable avatar customization option. It should own stable option IDs, category membership, labels, accessibility text, ordering, compatibility rules, deprecation metadata, and validation rules. Avatar rendering should remain a frontend responsibility because Avatar V2 is currently an SVG renderer implemented in the React client, while the backend should own persistence, API contracts, catalog version negotiation, and server-side validation of saved selections.

Recommended architecture:

- Store the canonical catalog definition in backend-owned, versioned catalog data.
- Expose it through an API endpoint such as `GET /api/avatar/catalog`.
- Generate or mirror frontend TypeScript types from the OpenAPI contract rather than maintaining separate hard-coded lists.
- Persist family-member avatar selections as stable catalog item IDs plus the catalog version used when saved.
- Keep renderer implementation details separate from catalog metadata.
- Use a typed catalog envelope with typed category schemas, not a fully generic key/value catalog for everything.
- Use one shared catalog infrastructure pattern for colors, styles, and future assets, but not one unbounded generic item model with no category-specific constraints.

The current Avatar V2 implementation is close enough to migrate incrementally because persisted values are already string tokens. The main migration work is moving validation and option metadata out of frontend constants and backend string cleanup into a shared catalog contract.

## 2. Current Avatar V2 baseline

### 2.1 Frontend ownership today

Avatar V2 currently defines the render-facing type system in the frontend. It includes head variants, palette tokens, hair styles, glasses styles, shirt styles, accessory styles, mount points, render configuration, anatomy, and palette expansion. The palette values and SVG renderer live in `src/HomeOps.Client/src/avatarV2/avatarV2.ts`.

The user-facing configuration layer is also frontend-owned. It defines `AvatarV2Configuration`, default choices, allowed arrays per category, client-side normalization, and conversion from user choices to render config in `src/HomeOps.Client/src/avatarV2/avatarConfig.ts`.

### 2.2 Backend ownership today

The backend persists an owned `AvatarV2Config` on family members with string properties for the current configurable categories:

- `HeadVariant`
- `HairStyle`
- `HairColor`
- `ClothingStyle`
- `ClothingColor`
- `Accessory`
- `AccessoryColor`

The backend normalizes only null/blank strings to defaults. It does not validate values against a catalog of allowed tokens. This means the frontend is currently the stricter source of truth, while the database can store any non-blank string in the avatar fields.

### 2.3 Architectural gap

The current state has duplicated partial knowledge:

- Frontend knows the complete option sets and display labels.
- Backend knows persistence fields and defaults but not allowed values.
- Renderer knows colors and geometry details that are not catalog metadata.
- API contracts expose raw strings without catalog version context.

The Avatar Catalog should close this gap by introducing one canonical, versioned domain catalog.

## 3. Goals and non-goals

### 3.1 Goals

- Make the Avatar Catalog the single source of truth for avatar customization options.
- Provide stable IDs that survive label changes, localization changes, and renderer refactors.
- Support localization and accessibility labels as first-class metadata.
- Support optional short display labels for compact UI surfaces.
- Support category metadata, tags, ordering, default selections, compatibility, and deprecation.
- Enable server-side validation of persisted avatar selections.
- Allow future assets, such as more hairstyles, clothing, accessories, glasses, skin tones, patterns, and externally stored image/SVG assets.
- Preserve compatibility with existing Avatar V2 saved configurations.
- Avoid widget-specific data modeling.

### 3.2 Non-goals

- Rebuilding the SVG renderer.
- Implementing a marketplace, user-uploaded assets, or remote asset CDN.
- Introducing microservices, distributed catalog publishing, or event sourcing.
- Adding authentication or per-user authorization rules to the catalog itself.
- Replacing the broader design asset system.

## 4. Recommended catalog architecture

### 4.1 High-level components

1. **Catalog definition source**
   - Backend-owned versioned static data, initially stored as embedded JSON or C# records.
   - Later, this can move to database-backed seeded data if admin-editable catalog content becomes required.

2. **Catalog domain service**
   - Loads and validates the catalog at application startup.
   - Provides lookup by category and item ID.
   - Provides default avatar selection.
   - Provides compatibility checks.
   - Provides deprecation and replacement handling.

3. **Catalog API**
   - `GET /api/avatar/catalog` returns the current catalog envelope.
   - Optional `GET /api/avatar/catalog/{version}` can be introduced later if clients need historical catalog inspection.
   - Family-member DTOs continue to return avatar selections, eventually with `catalogVersion`.

4. **Avatar selection validation**
   - Backend validates creates and updates against the current catalog.
   - Validation returns structured field errors for unknown, incompatible, deprecated-blocked, or missing required selections.

5. **Frontend catalog consumer**
   - Fetches catalog metadata once and caches it for the session.
   - Renders editor sections from catalog categories and ordering.
   - Uses labels from catalog localization metadata.
   - Sends stable IDs back to the backend.
   - Keeps only renderer code and ID-to-renderer adapter client-side.

6. **Renderer adapter**
   - Maps catalog item IDs to the existing Avatar V2 renderer tokens, or uses identical IDs where possible.
   - Should be a narrow layer so the catalog can evolve independently from rendering internals.

### 4.2 Ownership boundary

| Concern | Owner | Rationale |
|---|---|---|
| Stable catalog IDs | Backend domain | IDs affect persistence and API compatibility. |
| Catalog version | Backend domain/API | Versioning must be authoritative for validation and migration. |
| Labels and accessibility metadata | Backend catalog | UI should not hard-code option names. |
| Display ordering and grouping | Backend catalog | Catalog determines editor composition. |
| SVG path rendering | Frontend renderer | Rendering is currently TypeScript/SVG and browser-facing. |
| Color expansion for SVG rendering | Frontend renderer initially; catalog metadata later | Renderer needs exact colors, but catalog should describe user-facing color choices. |
| Family-member selected IDs | Backend persistence | Saved avatars belong to household/member data. |
| Frontend editor layout | Frontend | Presentation remains client-owned. |
| Validation rules | Backend authoritative, frontend mirrored | Backend must protect persistence; frontend can pre-validate for UX. |

## 5. Catalog entities

### 5.1 Catalog envelope

The catalog envelope describes one immutable published catalog version.

Fields:

- `catalogId`: stable catalog namespace, e.g. `familyboard.avatar`.
- `version`: semantic-ish catalog version, e.g. `2026.07.08` or `1.0.0`.
- `schemaVersion`: version of the catalog document schema.
- `defaultLocale`: default BCP 47 locale, e.g. `nl-NL`.
- `supportedLocales`: ordered supported locales.
- `categories`: ordered category definitions.
- `items`: catalog items grouped by category or flat with `categoryId`.
- `rules`: cross-category compatibility and validation rules.
- `defaults`: default selected item IDs by slot.
- `deprecatedItemPolicy`: global policy for deprecated items.

### 5.2 Category entity

A category represents a user-selectable slot or taxonomy group. Examples:

- `head.variant`
- `hair.style`
- `hair.color`
- `clothing.style`
- `clothing.color`
- `accessory.style`
- `accessory.color`
- future `glasses.style`
- future `skin.tone`

Category fields:

- `id`: stable category ID.
- `slot`: persisted selection slot if selectable.
- `kind`: `style`, `color`, `asset`, `taxonomy`, or `system`.
- `required`: whether a selection is required.
- `allowsNone`: whether `none` is valid.
- `multiSelect`: future-proofing, normally false.
- `order`: category display order.
- `labels`: localized category labels.
- `accessibilityLabels`: localized category screen-reader labels.
- `description`: localized helper text.
- `tags`: category tags such as `editor`, `appearance`, `body`, `clothing`.
- `constraints`: category-level constraints such as maximum active selections.

### 5.3 Catalog item entity

A catalog item is one selectable option.

Fields:

- `id`: stable item ID.
- `categoryId`: category membership.
- `type`: `color`, `rendererStyle`, `rendererAsset`, `none`, or future type.
- `status`: `active`, `deprecated`, `hidden`, `retired`.
- `order`: display order within category.
- `labels`: localized display labels.
- `shortLabels`: optional compact labels.
- `accessibilityLabels`: localized accessible names.
- `description`: optional localized description.
- `tags`: searchable/filterable tags.
- `renderer`: optional renderer binding metadata.
- `preview`: optional preview metadata.
- `color`: optional color metadata for color items.
- `compatibility`: item-level compatibility constraints.
- `deprecatedSince`: version/date when deprecated.
- `replacementId`: preferred replacement item.
- `introducedIn`: catalog version.
- `metadata`: reserved structured extension object.

### 5.4 Renderer binding entity

Renderer metadata should be explicit but not leak all rendering internals into the catalog. Recommended fields:

- `rendererFamily`: e.g. `avatar-v2-svg`.
- `rendererToken`: current renderer token if it differs from the catalog item ID.
- `layer`: optional render layer, e.g. `hair`, `shirt`, `accessory`.
- `mountPoint`: optional recommended mount point for accessories.
- `requires`: optional renderer capabilities.

This allows a future Avatar V3 renderer to map the same catalog ID to a new renderer token or asset.

## 6. Stable ID strategy

### 6.1 ID format

Use lowercase dotted IDs for categories and namespaced kebab-style IDs for items:

- Category IDs: `hair.style`, `hair.color`, `clothing.style`, `accessory.style`.
- Item IDs: `hair.style.short-messy`, `hair.color.cocoa`, `clothing.style.hoodie`, `accessory.style.star`.

Why not keep raw Avatar V2 tokens only?

- Existing tokens such as `shortMessy` are renderer-friendly but not globally namespaced.
- Namespaced IDs prevent collisions across categories, for example `style.none` versus `accessory.style.none`.
- Dotted names make validation errors and migrations clearer.

### 6.2 Stability rules

- Never reuse an item ID for a different visual meaning.
- Do not rename IDs for label or translation changes.
- Do not encode display order into IDs.
- Do not encode version into IDs.
- If a visual option materially changes, either:
  - keep the ID if the user intent is still the same; or
  - introduce a new ID and deprecate the old one if the user intent changes.
- Preserve aliases only as migration metadata, not as canonical IDs.

### 6.3 Alias mapping for migration

Each item may define `legacyIds` during migration:

```json
{
  "id": "hair.style.short-messy",
  "legacyIds": ["shortMessy"],
  "renderer": {
    "rendererFamily": "avatar-v2-svg",
    "rendererToken": "shortMessy"
  }
}
```

Backend should accept legacy IDs only during a controlled migration window or through migration code, not indefinitely as normal writes.

## 7. Versioning strategy

### 7.1 Catalog version versus schema version

Use two separate versions:

- `schemaVersion`: shape of the catalog document and API DTOs.
- `catalogVersion`: content version of the published catalog.

Example:

```json
{
  "catalogId": "familyboard.avatar",
  "schemaVersion": "1.0",
  "version": "2026.07.08"
}
```

### 7.2 Version increments

Recommended catalog versioning policy:

- Patch/content version: label text, tags, order adjustments, non-breaking metadata additions.
- Minor/content version: new active items or categories where defaults preserve compatibility.
- Major/content version: changed required categories, removed retired items from normal selection, or changed validation semantics.

A date-based version is simple for this project and works well with migration reports. If stricter compatibility tracking becomes necessary, semantic versioning can be adopted later.

### 7.3 Persisted selection version

Family-member avatar persistence should include:

- `CatalogId`
- `CatalogVersion`
- Selected item IDs by slot

The persisted `CatalogVersion` records what the user saved against. It does not freeze rendering forever. It enables diagnostics and future migrations.

### 7.4 Backward compatibility behavior

When reading an older saved avatar:

1. Load saved item IDs.
2. Resolve them against the current catalog.
3. If an item is active, render normally.
4. If deprecated, render normally but discourage re-selection in editor.
5. If retired but still renderable, render normally and prompt replacement on edit.
6. If unknown or no longer renderable, use `replacementId` or category default and surface a non-blocking normalization warning.

## 8. Localization and labels

### 8.1 Localized fields

Use locale dictionaries for user-facing text:

- `labels`: normal display name.
- `shortLabels`: optional compact label for dense UI.
- `accessibilityLabels`: accessible name for screen readers.
- `descriptions`: optional explanatory copy.

Example:

```json
{
  "labels": {
    "nl-NL": "Kort warrig",
    "en-US": "Short messy"
  },
  "shortLabels": {
    "nl-NL": "Warrig",
    "en-US": "Messy"
  },
  "accessibilityLabels": {
    "nl-NL": "Kapsel kort warrig",
    "en-US": "Short messy hairstyle"
  }
}
```

### 8.2 Fallback policy

- Prefer exact user locale.
- Fall back to language-only locale if introduced later, e.g. `nl`.
- Fall back to `defaultLocale`.
- If missing, frontend may display the stable ID only in development diagnostics, not normal product UI.

### 8.3 Optional display labels

Display labels should be optional only for non-visible system items or where the category label plus swatch already communicates the choice. Accessibility labels should be required for every active selectable item.

For color-only swatches, a visible label may be omitted in compact views, but the item still needs:

- accessible label, e.g. `Hemelkleurige kledingkleur`;
- tooltip or detail label if the UI exposes one;
- deterministic ordering.

## 9. Category metadata and tags

### 9.1 Category metadata

Category metadata should drive editor composition but not hard-code layout. Recommended metadata:

```json
{
  "id": "accessory.style",
  "slot": "accessoryStyle",
  "kind": "rendererStyle",
  "required": true,
  "allowsNone": true,
  "order": 60,
  "labels": { "nl-NL": "Accessoire", "en-US": "Accessory" },
  "description": { "nl-NL": "Kies iets extra’s.", "en-US": "Choose an extra detail." },
  "tags": ["editor", "optional", "decoration"]
}
```

### 9.2 Tags

Tags should be stable metadata, not UI copy. Examples:

- `hair`
- `clothing`
- `color`
- `warm`
- `cool`
- `playful`
- `calm`
- `child-friendly`
- `accessory`
- `mount.head-top`
- `palette.pastel`

Use tags for filtering, recommendations, compatibility, analytics, and future UI grouping. Do not use tags as the only source of validation.

## 10. Ordering strategy

Ordering should be numeric and explicitly stored.

Rules:

- Categories have global `order` values.
- Items have category-local `order` values.
- Use gaps such as 10, 20, 30 to allow insertion.
- Do not sort by localized label because order would change by locale.
- Deprecated items remain ordered but are normally hidden from new selections.
- If deprecated selected items are shown, place them at their existing order with a status indicator or in a separate “previously selected” group.

## 11. Deprecation and retirement

### 11.1 Status values

- `active`: selectable and valid.
- `deprecated`: valid for existing selections, visible only when selected or in advanced views, not promoted for new choices.
- `hidden`: valid but not shown in normal editor, useful for rollout or fixtures.
- `retired`: not selectable and should migrate to replacement if possible.

### 11.2 Deprecation fields

- `deprecatedSince`
- `deprecationReason`
- `replacementId`
- `renderUntilVersion` if render support has a planned removal date/version.

### 11.3 Validation policy

- Existing saved deprecated IDs remain valid.
- New writes should reject retired IDs.
- New writes may accept deprecated IDs only when preserving an existing selection; otherwise reject or warn depending on product policy.
- Unknown IDs should be rejected for writes and normalized for reads only if legacy migration rules apply.

## 12. Future compatibility

### 12.1 Future categories

The schema should support adding categories without breaking older clients. Future examples:

- `skin.tone`
- `glasses.style`
- `glasses.color`
- `facial.feature`
- `background.style`
- `pattern.style`
- `pose.style`
- `prop.style`

The API can expose unsupported categories while the frontend editor only renders categories it understands. The saved selection payload should be extensible enough to carry future slots.

### 12.2 Future assets

Future assets may be:

- inline SVG fragments;
- local bundled SVG modules;
- backend-served static assets;
- raster thumbnails;
- renderer tokens for programmatic drawing.

The catalog should identify assets and metadata, but production rendering should not depend on arbitrary backend-provided SVG execution. If the backend eventually serves SVG assets, use a constrained trusted asset pipeline, content hashing, and sanitization.

### 12.3 Renderer evolution

A future Avatar V3 renderer should be able to consume the same catalog selection IDs with a new adapter. This requires:

- stable user-intent IDs;
- renderer bindings separated by `rendererFamily`;
- compatibility rules not embedded only in TypeScript union types;
- migrations that update bindings without changing user selections where possible.

## 13. Should colors, styles, and future assets use one generic catalog model?

### 13.1 Option A: one fully generic catalog model

A fully generic model would store every option as a loose item with arbitrary metadata.

Advantages:

- One table/document shape.
- Easy to add new item types.
- Minimal API DTO churn.

Disadvantages:

- Weak validation for category-specific requirements.
- Frontend must inspect arbitrary metadata and can fail at runtime.
- OpenAPI contracts become less useful.
- Color values, renderer style tokens, and external assets have different safety requirements.
- Accessibility and localization requirements become harder to enforce per type.

### 13.2 Option B: one shared catalog envelope with typed item variants

A shared envelope defines common fields, while item `type` determines required typed metadata.

Examples:

- `color` items require color tokens or swatches.
- `rendererStyle` items require renderer bindings.
- `asset` items require asset references and integrity metadata.
- `none` items require explicit `isNone: true` semantics.

Advantages:

- Shared ordering, localization, tags, status, and versioning.
- Stronger validation by type.
- Better OpenAPI/TypeScript contract generation.
- Safer future asset handling.
- Still flexible enough for future categories.

Disadvantages:

- More initial design work.
- Backend validation service needs type-aware rules.
- Frontend renderer adapter needs type-specific handling.

### 13.3 Recommendation

Use one shared catalog architecture and envelope, but not one untyped generic item model. Colors, styles, and future assets should share common catalog metadata while using typed payloads for their specific needs.

This balances extensibility with safety and keeps the catalog suitable as a persistence and validation authority.

## 14. Proposed schema examples

### 14.1 Catalog envelope example

```json
{
  "catalogId": "familyboard.avatar",
  "schemaVersion": "1.0",
  "version": "2026.07.08",
  "defaultLocale": "nl-NL",
  "supportedLocales": ["nl-NL", "en-US"],
  "defaults": {
    "headVariant": "head.variant.round",
    "hairStyle": "hair.style.short-messy",
    "hairColor": "hair.color.cocoa",
    "clothingStyle": "clothing.style.hoodie",
    "clothingColor": "clothing.color.sky",
    "accessoryStyle": "accessory.style.star",
    "accessoryColor": "accessory.color.coral"
  },
  "categories": [],
  "items": [],
  "rules": []
}
```

### 14.2 Category example

```json
{
  "id": "hair.style",
  "slot": "hairStyle",
  "kind": "rendererStyle",
  "required": true,
  "allowsNone": false,
  "multiSelect": false,
  "order": 20,
  "labels": {
    "nl-NL": "Haar",
    "en-US": "Hair"
  },
  "accessibilityLabels": {
    "nl-NL": "Kapselkeuzes",
    "en-US": "Hairstyle choices"
  },
  "description": {
    "nl-NL": "Kies een kapsel.",
    "en-US": "Choose a hairstyle."
  },
  "tags": ["editor", "appearance", "hair"]
}
```

### 14.3 Renderer style item example

```json
{
  "id": "hair.style.short-messy",
  "categoryId": "hair.style",
  "type": "rendererStyle",
  "status": "active",
  "order": 60,
  "introducedIn": "2026.07.08",
  "legacyIds": ["shortMessy"],
  "labels": {
    "nl-NL": "Kort warrig",
    "en-US": "Short messy"
  },
  "shortLabels": {
    "nl-NL": "Warrig",
    "en-US": "Messy"
  },
  "accessibilityLabels": {
    "nl-NL": "Kapsel kort warrig",
    "en-US": "Short messy hairstyle"
  },
  "tags": ["hair", "playful", "short"],
  "renderer": {
    "rendererFamily": "avatar-v2-svg",
    "rendererToken": "shortMessy",
    "layer": "hair"
  }
}
```

### 14.4 Color item example

```json
{
  "id": "clothing.color.sky",
  "categoryId": "clothing.color",
  "type": "color",
  "status": "active",
  "order": 10,
  "introducedIn": "2026.07.08",
  "legacyIds": ["shirtSky"],
  "labels": {
    "nl-NL": "Hemelsblauw",
    "en-US": "Sky blue"
  },
  "accessibilityLabels": {
    "nl-NL": "Hemelsblauwe kledingkleur",
    "en-US": "Sky blue clothing color"
  },
  "tags": ["color", "cool", "clothing", "palette.pastel"],
  "color": {
    "format": "expandedSwatch",
    "base": "#8fc8ef",
    "shade": "#67a8d8",
    "highlight": "#b6ddf6",
    "line": "#417895"
  },
  "renderer": {
    "rendererFamily": "avatar-v2-svg",
    "rendererToken": "shirtSky"
  }
}
```

### 14.5 Accessory with mount metadata example

```json
{
  "id": "accessory.style.tiny-crown",
  "categoryId": "accessory.style",
  "type": "rendererStyle",
  "status": "active",
  "order": 80,
  "introducedIn": "2026.07.08",
  "legacyIds": ["tinyCrown"],
  "labels": {
    "nl-NL": "Kroontje",
    "en-US": "Tiny crown"
  },
  "accessibilityLabels": {
    "nl-NL": "Klein kroontje als accessoire",
    "en-US": "Tiny crown accessory"
  },
  "tags": ["accessory", "playful", "mount.head-top"],
  "renderer": {
    "rendererFamily": "avatar-v2-svg",
    "rendererToken": "tinyCrown",
    "layer": "accessory",
    "mountPoint": "headTop"
  }
}
```

### 14.6 Future asset item example

```json
{
  "id": "background.style.rainbow-soft",
  "categoryId": "background.style",
  "type": "asset",
  "status": "hidden",
  "order": 10,
  "introducedIn": "2026.10.01",
  "labels": {
    "nl-NL": "Zachte regenboog",
    "en-US": "Soft rainbow"
  },
  "accessibilityLabels": {
    "nl-NL": "Zachte regenboogachtergrond",
    "en-US": "Soft rainbow background"
  },
  "asset": {
    "assetKind": "svg",
    "source": "bundled-client",
    "path": "avatar/backgrounds/rainbow-soft.svg",
    "contentHash": "sha256-placeholder",
    "trusted": true
  },
  "tags": ["background", "future", "playful"]
}
```

### 14.7 Compatibility rule example

```json
{
  "id": "accessory.headband.mounts-with-hair",
  "type": "disallowCombination",
  "when": {
    "accessoryStyle": "accessory.style.headband"
  },
  "unless": {
    "hairStyle": [
      "hair.style.soft-crop",
      "hair.style.short-messy",
      "hair.style.curly-playful"
    ]
  },
  "message": {
    "nl-NL": "Deze haarband past niet goed bij dit kapsel.",
    "en-US": "This headband does not fit this hairstyle well."
  },
  "severity": "warning"
}
```

The first implementation should avoid complex compatibility unless needed. The schema should be ready for it, but most current Avatar V2 combinations can remain allowed.

## 15. Persistence strategy

### 15.1 Recommended future persistence shape

Current persistence uses dedicated columns for Avatar V2 fields. The catalog can evolve in two stages.

#### Stage 1: dedicated columns with canonical IDs

Add or repurpose columns to store canonical IDs:

- `AvatarCatalogId`
- `AvatarCatalogVersion`
- `AvatarHeadVariantId`
- `AvatarHairStyleId`
- `AvatarHairColorId`
- `AvatarClothingStyleId`
- `AvatarClothingColorId`
- `AvatarAccessoryStyleId`
- `AvatarAccessoryColorId`

Advantages:

- Easy reporting and indexing.
- Clear migrations from existing columns.
- Strong database shape for current categories.

Disadvantages:

- Schema migration required for every future slot.

#### Stage 2: flexible selection document plus generated read model

If avatar categories grow significantly, store selections in a JSONB document:

```json
{
  "catalogId": "familyboard.avatar",
  "catalogVersion": "2026.07.08",
  "selections": {
    "headVariant": "head.variant.round",
    "hairStyle": "hair.style.short-messy",
    "hairColor": "hair.color.cocoa",
    "clothingStyle": "clothing.style.hoodie",
    "clothingColor": "clothing.color.sky",
    "accessoryStyle": "accessory.style.star",
    "accessoryColor": "accessory.color.coral"
  }
}
```

Advantages:

- Future categories can be added without database migrations.
- Natural fit for catalog-driven selections.
- Keeps family-member table from accumulating many nullable columns.

Disadvantages:

- Requires application-level validation discipline.
- Harder ad hoc SQL querying.
- Requires careful OpenAPI DTO modeling.

### 15.2 Recommendation

Use a JSONB-backed value object for the long-term Avatar Catalog selection, but introduce it through a controlled migration from the existing Avatar V2 owned columns.

Reasoning:

- Avatar customization is expected to grow with future assets and slots.
- The selection is a cohesive value object, not independent relational entities.
- Validation belongs to the catalog service, not to foreign-key tables for every static option.
- PostgreSQL supports JSONB well for this bounded use case.

Do not store the catalog item definitions themselves only in the database initially. Keep definitions source-controlled until a real administration workflow exists.

## 16. Validation architecture

### 16.1 Startup catalog validation

At application startup, validate the catalog definition:

- Unique category IDs.
- Unique item IDs.
- Every item references an existing category.
- Required localized fields exist for default locale.
- Active selectable items have accessibility labels.
- Category defaults exist and are active.
- `replacementId` exists and points to same category unless explicitly cross-category.
- Orders are unique within category or stable tie-breaking is defined.
- Renderer tokens exist for categories handled by Avatar V2.
- Legacy IDs do not map ambiguously.
- Compatibility rules reference known slots and item IDs.

Startup should fail fast in development/test if the catalog is invalid.

### 16.2 Write validation

On family-member create/update:

- Fill missing selection slots from current defaults only if the API contract allows partial selections.
- Reject unknown category slots.
- Reject unknown item IDs.
- Reject item/category mismatch.
- Reject retired items.
- Reject incompatible combinations with error severity.
- Accept deprecated items only when preserving an existing saved selection or under explicit policy.
- Return structured validation errors.

### 16.3 Read normalization

On reads:

- Do not silently mutate persisted records.
- Resolve current display metadata.
- If persisted selections are legacy or deprecated, return normalized catalog IDs in the DTO only after a migration has updated storage, or return a `warnings` field if needed.

### 16.4 Frontend validation

Frontend should mirror backend validation for immediate UX:

- Disable retired/hidden options.
- Hide deprecated options unless currently selected.
- Warn for discouraged combinations.
- Prevent impossible selections before submit.

Backend remains authoritative.

## 17. API contract proposal

### 17.1 Catalog response DTO

```json
{
  "catalogId": "familyboard.avatar",
  "schemaVersion": "1.0",
  "version": "2026.07.08",
  "defaultLocale": "nl-NL",
  "supportedLocales": ["nl-NL", "en-US"],
  "categories": [
    {
      "id": "hair.style",
      "slot": "hairStyle",
      "kind": "rendererStyle",
      "required": true,
      "allowsNone": false,
      "order": 20,
      "labels": { "nl-NL": "Haar" },
      "accessibilityLabels": { "nl-NL": "Kapselkeuzes" },
      "tags": ["editor", "hair"]
    }
  ],
  "items": [
    {
      "id": "hair.style.short-messy",
      "categoryId": "hair.style",
      "type": "rendererStyle",
      "status": "active",
      "order": 60,
      "labels": { "nl-NL": "Kort warrig" },
      "accessibilityLabels": { "nl-NL": "Kapsel kort warrig" },
      "renderer": { "rendererFamily": "avatar-v2-svg", "rendererToken": "shortMessy" }
    }
  ],
  "defaults": {
    "hairStyle": "hair.style.short-messy"
  }
}
```

### 17.2 Family-member avatar selection DTO

```json
{
  "catalogId": "familyboard.avatar",
  "catalogVersion": "2026.07.08",
  "selections": {
    "headVariant": "head.variant.round",
    "hairStyle": "hair.style.short-messy",
    "hairColor": "hair.color.cocoa",
    "clothingStyle": "clothing.style.hoodie",
    "clothingColor": "clothing.color.sky",
    "accessoryStyle": "accessory.style.star",
    "accessoryColor": "accessory.color.coral"
  }
}
```

### 17.3 Compatibility with existing DTOs

During migration, the API can support both:

- existing `avatarV2Config`; and
- new `avatarCatalogSelection`.

Recommended transitional rule:

- Reads return both for one release slice.
- Writes accept both but reject requests that provide conflicting values.
- Frontend moves to catalog selection.
- Existing `avatarV2Config` is deprecated and removed after all callers migrate.

## 18. Migration from current Avatar V2

### 18.1 Current-to-catalog mapping

| Current field | Current example | New slot | New catalog ID |
|---|---:|---|---|
| `headVariant` | `round` | `headVariant` | `head.variant.round` |
| `hairStyle` | `shortMessy` | `hairStyle` | `hair.style.short-messy` |
| `hairColor` | `hairCocoa` | `hairColor` | `hair.color.cocoa` |
| `clothingStyle` | `hoodie` | `clothingStyle` | `clothing.style.hoodie` |
| `clothingColor` | `shirtSky` | `clothingColor` | `clothing.color.sky` |
| `accessory` | `star` | `accessoryStyle` | `accessory.style.star` |
| `accessoryColor` | `accessoryCoral` | `accessoryColor` | `accessory.color.coral` |

### 18.2 Migration sequence

1. **Catalog analysis and contract approval**
   - Complete this document and agree on schema boundaries.

2. **Backend catalog foundation**
   - Add catalog definitions and validation service.
   - Add catalog API endpoint.
   - Add startup validation tests.
   - Keep existing family-member avatar fields unchanged.

3. **Frontend catalog read path**
   - Fetch catalog.
   - Render editor options from catalog metadata.
   - Keep renderer adapter mapping to existing Avatar V2 tokens.
   - Continue submitting existing `avatarV2Config` until write migration is ready.

4. **Persistence migration**
   - Add `AvatarCatalogSelection` value object and storage.
   - Backfill from existing Avatar V2 columns using legacy ID mapping.
   - Read from new selection when present, otherwise derive from old fields.

5. **API migration**
   - Expose `avatarCatalogSelection` in family-member DTOs.
   - Accept catalog selections on writes.
   - Keep `avatarV2Config` temporarily for backward compatibility.

6. **Frontend write migration**
   - Submit catalog selections.
   - Remove hard-coded option arrays.
   - Use catalog validation metadata for disabled/deprecated options.

7. **Cleanup**
   - Remove old write path.
   - Keep renderer adapter and renderer tokens.
   - Remove obsolete frontend normalization arrays after all selections are catalog-driven.

### 18.3 Migration risks

- Existing backend may contain invalid non-blank strings because it currently cleans strings but does not check membership.
- Some current renderer tokens are present in type definitions but not exposed in user-facing config, such as `starClip` in the accessory type.
- Frontend labels are currently embedded in editor components, so migration must preserve Dutch UX text.
- API clients may depend on `avatarV2Config` shape.
- Generated OpenAPI clients may need regeneration once DTOs change.

### 18.4 Handling invalid existing data

Backfill should use this hierarchy:

1. Exact current token to catalog ID mapping.
2. Legacy alias mapping from catalog.
3. Category default if no valid mapping exists.
4. Record migration warning in logs or a one-time report.

Do not drop existing invalid values before they are inspected. Prefer producing a migration report that counts invalid values by field and member.

## 19. Complexity estimate

### 19.1 Backend complexity

Estimated complexity: **medium**.

Main work:

- Define catalog DTOs/domain records.
- Add embedded catalog data and startup validation.
- Add catalog lookup/validation service.
- Add `GET /api/avatar/catalog` endpoint.
- Add family-member write validation.
- Add persistence migration to catalog selection.
- Add OpenAPI/NSwag contract changes.
- Add tests for catalog validity, legacy mapping, and invalid writes.

Risk drivers:

- DTO migration while preserving existing clients.
- Choosing JSONB value object mapping in EF Core.
- Backfilling any invalid current data.

### 19.2 Frontend complexity

Estimated complexity: **medium-high**.

Main work:

- Add catalog API client and loading state.
- Refactor Avatar Editor to render categories/items from catalog.
- Preserve current editor layout without introducing primary-page viewport regressions.
- Replace hard-coded labels and arrays with localized catalog metadata.
- Build ID-to-renderer adapter.
- Support deprecated/hidden item display rules.
- Update tests from hard-coded options to catalog fixtures.

Risk drivers:

- The renderer still expects current Avatar V2 token unions.
- The UI needs deterministic previews from catalog items.
- Editor tests currently assume specific visible button names and hard-coded options.
- Localization fallback logic must be reliable.

### 19.3 Overall complexity

Estimated implementation size: **3 to 5 focused slices**.

Recommended slices:

1. Backend catalog definition/API/read-only validation.
2. Frontend catalog consumption for editor read path.
3. Backend catalog selection persistence and backfill.
4. Frontend catalog write path and DTO migration.
5. Cleanup/deprecation removal and documentation update.

## 20. Recommended implementation contract for a future slice

When implementation begins, the first slice should be deliberately narrow:

- Add backend-owned read-only catalog definition.
- Add startup catalog validation.
- Add `GET /api/avatar/catalog`.
- Do not change persisted family-member avatar fields yet.
- Do not redesign the Avatar Editor layout.
- Do not remove Avatar V2 renderer types.
- Add tests proving the catalog contains all currently user-facing Avatar V2 options.

This keeps the first change safe and establishes the source of truth before migrating persistence or UI writes.

## 21. Open decisions

- Whether catalog content version should use date-based versions or semantic versions.
- Whether the first persistence migration should add dedicated canonical-ID columns or move directly to JSONB.
- Whether deprecated items should be selectable when already selected or only visible as read-only.
- Whether color swatch values should be backend-owned immediately or remain renderer-owned until the catalog read path is stable.
- Whether future asset references will be client-bundled only or backend-served through a static asset endpoint.

## 22. Final recommendation

Adopt a backend-owned, versioned Avatar Catalog with a typed shared envelope. Use stable namespaced IDs for all selectable options, support localization and accessibility labels in the catalog, and persist avatar selections as catalog IDs with catalog version metadata. Keep rendering in the frontend behind a small adapter that maps catalog IDs to Avatar V2 renderer tokens.

Colors, styles, and future assets should use the same catalog infrastructure but typed metadata variants. This avoids a brittle generic model while preserving future compatibility.

Migration from Avatar V2 should be incremental: introduce the catalog as read-only first, migrate frontend reads, then persistence and writes, then remove the legacy `avatarV2Config` path after compatibility is proven.
