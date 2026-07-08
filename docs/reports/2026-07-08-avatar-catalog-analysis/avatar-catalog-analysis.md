# FamilyBoard Avatar Catalog Technical Architecture Analysis

Date: 2026-07-08
Status: analysis only; revised architecture recommendation
Scope: future Avatar Catalog architecture; no production-code changes

## 1. Executive summary

The Avatar Catalog should become the canonical source of truth for every user-selectable avatar customization option. It should own stable option IDs, category membership, labels, accessibility text, ordering, deprecation metadata, validation metadata, and renderer bindings. Avatar rendering should remain a frontend responsibility because Avatar V2 is currently an SVG renderer implemented in the React client, while the backend remains authoritative for persistence and server-side validation.

Recommended architecture:

- Define the Avatar Catalog as source-controlled shared catalog data used by both backend and frontend.
- Keep the backend as the canonical validation authority for saved avatar selections.
- Keep stable, namespaced catalog IDs that survive label changes, localization changes, and renderer refactors.
- Use a typed catalog architecture with typed category and item entities instead of loose key/value metadata.
- Persist avatar selections immediately as a dedicated JSON value object containing selected catalog item IDs.
- Retain `SchemaVersion` for the shared catalog document shape, but do not persist or require a separate catalog content version while catalog data ships with the application.
- Render the Avatar Editor generically from catalog categories, items, and metadata; the editor must contain no avatar-content special cases.
- Keep renderer implementation details behind a renderer adapter that maps catalog IDs to Avatar V2 renderer tokens.
- Introduce a Catalog Provider boundary, initially backed only by a Local Catalog Provider, so future sources can be added without changing editor or validation consumers.

A dedicated runtime Avatar Catalog API is not recommended now. Because FamilyBoard ships the catalog together with the application, backend and frontend should consume the same shared catalog definition directly. A catalog API should be introduced only if administrators, downloadable content, seasonal packs, or marketplace content need to modify catalog content independently of application releases.

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
- API contracts expose raw strings without typed catalog-selection semantics.

The Avatar Catalog should close this gap by introducing one shared, typed catalog definition that backend validation and frontend rendering both consume.

## 3. Goals and non-goals

### 3.1 Goals

- Make the Avatar Catalog the shared source of truth for avatar customization options.
- Keep the backend as the canonical source of truth for validation and persisted selections.
- Provide stable IDs that survive label changes, localization changes, and renderer refactors.
- Support localization and accessibility labels as first-class metadata.
- Support optional short display labels for compact UI surfaces.
- Support category metadata, tags, ordering, default selections, and deprecation.
- Enable server-side validation of persisted avatar selections.
- Preserve compatibility with existing Avatar V2 saved configurations through a focused legacy migration.
- Avoid widget-specific data modeling.
- Keep the architecture extensible without adding infrastructure FamilyBoard does not need today.

### 3.2 Non-goals

- Rebuilding the SVG renderer.
- Implementing a runtime catalog API for the current local catalog.
- Implementing a marketplace, user-uploaded assets, downloadable content, or remote asset CDN.
- Introducing microservices, distributed catalog publishing, event sourcing, or independent catalog deployment.
- Adding authentication or per-user authorization rules to the catalog itself.
- Replacing the broader design asset system.
- Building a compatibility rule engine for visual combinations before a real product requirement exists.

## 4. Recommended catalog architecture

### 4.1 High-level components

1. **Shared catalog definition**
   - Source-controlled catalog data that ships with the application.
   - The same catalog definition is consumed by backend validation and frontend editor rendering.
   - It can be stored as shared JSON plus generated/handwritten typed C# and TypeScript models, or another repo-local format that both applications can consume reliably.
   - The catalog includes categories, items, defaults, localized labels, accessibility metadata, deprecation metadata, ordering, and renderer bindings.

2. **Catalog Provider boundary**
   - Provides catalog categories, items, defaults, and metadata to consumers.
   - Starts with one Local Catalog Provider backed by the bundled shared catalog definition.
   - Keeps backend validation and frontend editor code independent of where catalog content originates.
   - Allows future providers without implementing them now.

3. **Catalog domain service**
   - Loads the Local Catalog Provider output.
   - Validates the catalog at application startup.
   - Provides lookup by category and item ID.
   - Provides default avatar selection.
   - Provides deprecation and replacement handling.

4. **Avatar selection validation**
   - Backend validates creates and updates against the shared catalog.
   - Validation returns structured field errors for unknown, retired, category-mismatched, or missing required selections.
   - Frontend may mirror validation for UX, but backend remains authoritative.

5. **Frontend catalog consumer**
   - Imports or receives the bundled shared catalog definition at build/runtime as local app data, not through a dedicated catalog endpoint.
   - Renders editor sections from catalog categories, item metadata, and ordering.
   - Uses labels from catalog localization metadata.
   - Sends stable IDs back to the backend as avatar selections.
   - Keeps only renderer code and the ID-to-renderer adapter client-side.

6. **Renderer adapter**
   - Maps catalog item IDs to the existing Avatar V2 renderer tokens, or uses identical IDs where possible.
   - Keeps renderer-specific tokens, layer names, and mount points out of the generic editor.
   - Allows a future Avatar V3 renderer to consume the same selection IDs through a new adapter.

### 4.2 Ownership boundary

| Concern | Owner | Rationale |
|---|---|---|
| Stable catalog IDs | Shared catalog definition | IDs affect persistence, validation, and rendering compatibility. |
| Schema version | Shared catalog definition | Consumers must know the catalog document shape they understand. |
| Labels and accessibility metadata | Shared catalog definition | UI should not hard-code option names or accessible names. |
| Display ordering and grouping | Shared catalog definition | Catalog metadata determines editor composition. |
| SVG path rendering | Frontend renderer | Rendering is currently TypeScript/SVG and browser-facing. |
| Color expansion for SVG rendering | Renderer binding/catalog metadata as appropriate | The user-facing color option belongs to the catalog; exact drawing values can remain renderer-bound. |
| Family-member selected IDs | Backend persistence | Saved avatars belong to household/member data. |
| Frontend editor layout | Frontend | Presentation remains client-owned, but content decisions come from catalog metadata. |
| Validation rules | Backend authoritative, frontend mirrored for UX | Backend must protect persistence; frontend can pre-validate for responsiveness. |
| Catalog source | Catalog Provider | Consumers should not care whether content is local today or externally provided later. |

### 4.3 Why no runtime Catalog API now

A dedicated `GET /api/avatar/catalog` endpoint would add infrastructure, loading states, API contracts, client caching, and deployment coordination without solving a current FamilyBoard problem. The catalog is local application content today. Backend and frontend are deployed together and can share the same catalog definition directly.

This keeps the architecture simpler:

- No catalog fetch is needed before rendering the editor.
- No runtime catalog caching policy is needed.
- No historical catalog lookup endpoint is needed.
- No API surface is added for static data.
- Backend and frontend still validate/render from the same source-controlled definition.

Introduce a catalog API later only if catalog content becomes independently deployable or mutable outside application releases, for example administrator-managed content, seasonal providers, downloadable content, or marketplace providers.

## 5. Catalog Providers

### 5.1 Provider principle

Catalog consumers should depend on a provider abstraction, not on a specific storage or delivery mechanism. The provider returns a normalized catalog definition containing categories, items, defaults, metadata, and renderer bindings. The editor and backend validation service should not care where catalog items originate.

### 5.2 Initial provider

The initial provider should be:

- **Local Catalog Provider**: loads the source-controlled catalog bundled with the application.

This is the only provider recommended for implementation now.

### 5.3 Future providers

The architecture should allow future providers such as:

- Seasonal Provider.
- Marketplace Provider.
- Downloadable Content Provider.

Do not implement these providers now. They are extension points only. If they are ever introduced, they should merge or layer catalog items before the editor and backend validation service consume the catalog, preserving the same consumer-facing catalog shape.

## 6. Catalog entities

### 6.1 Catalog envelope

The catalog envelope describes the shared catalog document and its schema shape.

Fields:

- `catalogId`: stable catalog namespace, e.g. `familyboard.avatar`.
- `schemaVersion`: version of the catalog document schema.
- `defaultLocale`: default BCP 47 locale, e.g. `nl-NL`.
- `supportedLocales`: ordered supported locales.
- `categories`: ordered category definitions.
- `items`: typed catalog items grouped by category or flat with `categoryId`.
- `defaults`: default selected item IDs by slot.
- `deprecatedItemPolicy`: global policy for deprecated items.

Do not include `CatalogVersion` as a persisted requirement while catalog data ships with the application. A content version can be introduced later if catalogs become independently deployable.

### 6.2 Category entity

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
- `kind`: `style`, `color`, `rendererStyle`, `none`, or `system`.
- `required`: whether a selection is required.
- `allowsNone`: whether `none` is valid.
- `multiSelect`: future-proofing, normally false.
- `order`: category display order.
- `labels`: localized category labels.
- `accessibilityLabels`: localized category screen-reader labels.
- `description`: localized helper text.
- `tags`: category tags such as `editor`, `appearance`, `body`, `clothing`.
- `presentation`: metadata that tells the generic editor how to render the category, such as `tile`, `swatch`, or `compactList`.

### 6.3 Catalog item entity

A catalog item is one selectable option.

Fields:

- `id`: stable item ID.
- `categoryId`: category membership.
- `type`: `color`, `rendererStyle`, `none`, or future typed variant.
- `status`: `active`, `deprecated`, `hidden`, `retired`.
- `order`: display order within category.
- `labels`: localized display labels.
- `shortLabels`: optional compact labels.
- `accessibilityLabels`: localized accessible names.
- `description`: optional localized description.
- `tags`: searchable/filterable tags.
- `renderer`: optional renderer binding metadata.
- `preview`: optional preview metadata for generic editor tiles.
- `color`: optional color metadata for color items.
- `deprecatedSince`: date or schema-era note when deprecated.
- `replacementId`: preferred replacement item.
- `legacyIds`: temporary migration aliases.
- `metadata`: reserved structured extension object.

Typed catalog entities are preferred over loose key/value data. The shared envelope should define common fields while item `type` determines the required typed metadata for each item.

### 6.4 Renderer binding entity

Renderer metadata should be explicit but not leak all rendering internals into the catalog. Recommended fields:

- `rendererFamily`: e.g. `avatar-v2-svg`.
- `rendererToken`: current renderer token if it differs from the catalog item ID.
- `layer`: optional render layer, e.g. `hair`, `shirt`, `accessory`.
- `mountPoint`: optional recommended mount point for accessories.
- `requires`: optional renderer capabilities.

Renderer bindings are not an asset pipeline. Avatar assets remain bundled with the application. The catalog only supplies enough metadata for the renderer adapter to select the correct local renderer behavior.

## 7. Stable ID strategy

### 7.1 ID format

Use lowercase dotted IDs for categories and namespaced kebab-style IDs for items:

- Category IDs: `hair.style`, `hair.color`, `clothing.style`, `accessory.style`.
- Item IDs: `hair.style.short-messy`, `hair.color.cocoa`, `clothing.style.hoodie`, `accessory.style.star`.

Why not keep raw Avatar V2 tokens only?

- Existing tokens such as `shortMessy` are renderer-friendly but not globally namespaced.
- Namespaced IDs prevent collisions across categories, for example `style.none` versus `accessory.style.none`.
- Dotted names make validation errors and migrations clearer.

### 7.2 Stability rules

- Never reuse an item ID for a different visual meaning.
- Do not rename IDs for label or translation changes.
- Do not encode display order into IDs.
- Do not encode version into IDs.
- If a visual option materially changes, either:
  - keep the ID if the user intent is still the same; or
  - introduce a new ID and deprecate the old one if the user intent changes.
- Preserve aliases only as migration metadata, not as canonical IDs.

### 7.3 Alias mapping for migration

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

Backend should accept legacy IDs only through controlled migration code, not indefinitely as normal writes.

## 8. Versioning strategy

### 8.1 SchemaVersion only for now

Retain `SchemaVersion` to describe the shape of the shared catalog document and the typed models that backend and frontend understand.

Do not introduce `CatalogVersion` as a persisted requirement while catalog data ships together with the application. A separate catalog content version would add migration and diagnostics overhead without meaningful benefit when the catalog, backend, and frontend are released together.

### 8.2 When explicit catalog versioning becomes useful

Explicit catalog content versioning can be introduced later if catalogs become independently deployable, for example:

- administrators can modify catalog content without an application release;
- downloadable content can be installed independently;
- seasonal or marketplace providers can publish content on a separate cadence;
- clients need to inspect historical catalog definitions.

Until then, source control history, application release version, migration reports, and `SchemaVersion` are sufficient.

### 8.3 Backward compatibility behavior

When reading a saved avatar:

1. Load saved catalog item IDs from the JSON value object.
2. Resolve them against the current shared catalog.
3. If an item is active, render normally.
4. If deprecated, render normally but discourage re-selection in editor.
5. If retired but still renderable, render normally and prompt replacement on edit.
6. If unknown or no longer renderable, use `replacementId` or category default and surface a non-blocking normalization warning where appropriate.

## 9. Localization and labels

### 9.1 Localized fields

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

### 9.2 Fallback policy

- Prefer exact user locale.
- Fall back to language-only locale if introduced later, e.g. `nl`.
- Fall back to `defaultLocale`.
- If missing, frontend may display the stable ID only in development diagnostics, not normal product UI.

### 9.3 Optional display labels

Display labels should be optional only for non-visible system items or where the category label plus swatch already communicates the choice. Accessibility labels should be required for every active selectable item.

For color-only swatches, a visible label may be omitted in compact views, but the item still needs:

- accessible label, e.g. `Hemelkleurige kledingkleur`;
- tooltip or detail label if the UI exposes one;
- deterministic ordering.

## 10. Generic editor design principle

The Avatar Editor contains no knowledge about avatar content.

The editor receives:

- category;
- items;
- metadata.

It renders those inputs generically. It must not contain special-case logic such as:

- `if hair`;
- `if clothing`;
- `if accessory`.

Those decisions belong to the catalog. Category metadata should tell the editor whether a category uses swatches, tiles, compact labels, descriptions, optional `none` choices, or preview hints. Item metadata should tell the editor what label, accessible label, color preview, tile preview, status, and ordering to use.

The frontend may still contain general presentation components such as `SwatchOption`, `TileOption`, or `CompactOption`, but category selection between those components should be driven by catalog metadata rather than hard-coded avatar-domain branches.

## 11. Category metadata and tags

### 11.1 Category metadata

Category metadata should drive editor composition but not hard-code page layout. Recommended metadata:

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
  "presentation": { "control": "tile", "density": "compact" },
  "tags": ["editor", "optional", "decoration"]
}
```

### 11.2 Tags

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

Use tags for filtering, recommendations, analytics, and future UI grouping. Do not use tags as the only source of validation.

## 12. Ordering strategy

Ordering should be numeric and explicitly stored.

Rules:

- Categories have global `order` values.
- Items have category-local `order` values.
- Use gaps such as 10, 20, 30 to allow insertion.
- Do not sort by localized label because order would change by locale.
- Deprecated items remain ordered but are normally hidden from new selections.
- If deprecated selected items are shown, place them at their existing order with a status indicator or in a separate “previously selected” group.

## 13. Deprecation and retirement

### 13.1 Status values

- `active`: selectable and valid.
- `deprecated`: valid for existing selections, visible only when selected or in advanced views, not promoted for new choices.
- `hidden`: valid but not shown in normal editor, useful for rollout or fixtures.
- `retired`: not selectable and should migrate to replacement if possible.

### 13.2 Deprecation fields

- `deprecatedSince`
- `deprecationReason`
- `replacementId`

### 13.3 Validation policy

- Existing saved deprecated IDs remain valid.
- New writes should reject retired IDs.
- New writes may accept deprecated IDs only when preserving an existing selection or under explicit policy.
- Unknown IDs should be rejected for writes and normalized for reads only if legacy migration rules apply.

## 14. Future compatibility

### 14.1 Future categories

The schema should support adding categories without breaking older clients. Future examples:

- `skin.tone`
- `glasses.style`
- `glasses.color`
- `facial.feature`
- `background.style`
- `pattern.style`
- `pose.style`
- `prop.style`

The editor can ignore unsupported presentation metadata until a future slice adds the corresponding generic UI capability. The saved selection payload should be extensible enough to carry future slots.

### 14.2 Renderer evolution

A future Avatar V3 renderer should be able to consume the same catalog selection IDs with a new adapter. This requires:

- stable user-intent IDs;
- renderer bindings separated by `rendererFamily`;
- visual overlap handled by renderer logic wherever possible;
- migrations that update bindings without changing user selections where possible.

### 14.3 Compatibility rules deliberately omitted

Do not introduce a compatibility rule engine now. The current product does not require hairstyle restrictions, headband rules, warning rules, or a general combination engine.

Visual overlap should be solved in renderer logic wherever possible, because the renderer understands layers, geometry, mount points, and drawing order. A rule engine should be introduced only if a real product requirement appears, such as intentionally locked combinations, paid-content eligibility, or content safety constraints.

## 15. Should colors, styles, and future items use one generic catalog model?

### 15.1 Option A: one fully generic catalog model

A fully generic model would store every option as a loose item with arbitrary metadata.

Advantages:

- One table/document shape.
- Easy to add new item types.
- Minimal DTO churn.

Disadvantages:

- Weak validation for category-specific requirements.
- Frontend must inspect arbitrary metadata and can fail at runtime.
- Contracts become less useful.
- Color values and renderer style tokens have different requirements.
- Accessibility and localization requirements become harder to enforce per type.

### 15.2 Option B: one shared catalog envelope with typed item variants

A shared envelope defines common fields, while item `type` determines required typed metadata.

Examples:

- `color` items require color tokens or swatches.
- `rendererStyle` items require renderer bindings.
- `none` items require explicit `isNone: true` semantics.

Advantages:

- Shared ordering, localization, tags, status, and schema versioning.
- Stronger validation by type.
- Better C#/TypeScript typing.
- Safer future extension.
- Still flexible enough for future categories.

Disadvantages:

- More initial design work.
- Backend validation service needs type-aware checks.
- Frontend renderer adapter needs type-specific handling.

### 15.3 Recommendation

Use one shared catalog architecture and envelope, but not one untyped generic item model. Colors, styles, and future items should share common catalog metadata while using typed payloads for their specific needs.

This balances extensibility with safety and keeps the catalog suitable as a persistence and validation authority.

## 16. Proposed schema examples

### 16.1 Catalog envelope example

```json
{
  "catalogId": "familyboard.avatar",
  "schemaVersion": "1.0",
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
  "items": []
}
```

### 16.2 Category example

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
  "presentation": {
    "control": "tile",
    "density": "compact"
  },
  "tags": ["editor", "appearance", "hair"]
}
```

### 16.3 Renderer style item example

```json
{
  "id": "hair.style.short-messy",
  "categoryId": "hair.style",
  "type": "rendererStyle",
  "status": "active",
  "order": 60,
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

### 16.4 Color item example

```json
{
  "id": "clothing.color.sky",
  "categoryId": "clothing.color",
  "type": "color",
  "status": "active",
  "order": 10,
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

### 16.5 Accessory with renderer binding example

```json
{
  "id": "accessory.style.tiny-crown",
  "categoryId": "accessory.style",
  "type": "rendererStyle",
  "status": "active",
  "order": 80,
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

## 17. Persistence strategy

### 17.1 Recommended persistence shape

Adopt JSON persistence immediately. `AvatarSelection` should be a dedicated JSON value object from the beginning of the catalog migration.

Recommended shape:

```json
{
  "catalogId": "familyboard.avatar",
  "schemaVersion": "1.0",
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

### 17.2 Why JSON is preferred immediately

A growing avatar system is a cohesive selection document, not a set of unrelated relational attributes. JSON persistence is preferable because:

- future categories can be added without database migrations for every new slot;
- catalog-driven selections naturally fit a slot-to-item-ID document;
- family-member rows avoid accumulating many nullable avatar columns;
- backend validation remains explicit through the catalog service;
- the persisted shape remains stable even when renderer bindings change;
- PostgreSQL JSONB is appropriate for this bounded value-object use case.

The trade-off is that ad hoc SQL querying is less convenient than dedicated columns. That is acceptable because avatar customization is product state, not a reporting-heavy domain. If reporting needs emerge, generated read models can be added later.

### 17.3 Existing Avatar V2 migration

Existing Avatar V2 owned columns should be migrated directly into the JSON `AvatarSelection` value object using legacy ID mappings. Avoid intermediate dedicated canonical-ID columns unless implementation reveals a concrete limitation.

## 18. Validation architecture

### 18.1 Startup catalog validation

At application startup, validate the shared catalog definition:

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
- Presentation metadata uses supported generic editor controls.

Startup should fail fast in development/test if the catalog is invalid.

### 18.2 Write validation

On family-member create/update:

- Fill missing selection slots from current defaults only if the API contract allows partial selections.
- Reject unknown category slots.
- Reject unknown item IDs.
- Reject item/category mismatch.
- Reject retired items.
- Accept deprecated items only when preserving an existing saved selection or under explicit policy.
- Return structured validation errors.

Do not validate visual combinations with a generic rule engine unless a real product requirement appears.

### 18.3 Read normalization

On reads:

- Do not silently mutate persisted records.
- Resolve current display metadata from the shared catalog.
- If persisted selections are legacy or deprecated, return normalized catalog IDs only after migration has updated storage, or return warnings if needed.

### 18.4 Frontend validation

Frontend should mirror backend validation for immediate UX:

- Disable retired/hidden options.
- Hide deprecated options unless currently selected.
- Prevent unknown or category-mismatched selections before submit.

Backend remains authoritative.

## 19. API and DTO strategy

### 19.1 No Catalog API in the initial architecture

Do not add a dedicated runtime Avatar Catalog API for the local bundled catalog. The frontend should render from the shared catalog definition bundled with the application, and the backend should validate against the same definition.

### 19.2 Family-member avatar selection DTO

Family-member APIs should expose the saved avatar selection value object:

```json
{
  "catalogId": "familyboard.avatar",
  "schemaVersion": "1.0",
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

The DTO does not need to include catalog item labels or option lists. Those come from the shared catalog definition used by the frontend.

### 19.3 Compatibility with existing DTOs

During migration, the API can support both:

- existing `avatarV2Config`; and
- new `avatarSelection`.

Recommended transitional rule:

- Reads may return both for one release slice if needed.
- Writes accept the new `avatarSelection` as the preferred shape.
- Writes may temporarily accept `avatarV2Config` only for legacy callers.
- Requests that provide conflicting values should be rejected.
- Existing `avatarV2Config` is removed after all callers migrate.

## 20. Migration from current Avatar V2

### 20.1 Current-to-catalog mapping

| Current field | Current example | New slot | New catalog ID |
|---|---:|---|---|
| `headVariant` | `round` | `headVariant` | `head.variant.round` |
| `hairStyle` | `shortMessy` | `hairStyle` | `hair.style.short-messy` |
| `hairColor` | `hairCocoa` | `hairColor` | `hair.color.cocoa` |
| `clothingStyle` | `hoodie` | `clothingStyle` | `clothing.style.hoodie` |
| `clothingColor` | `shirtSky` | `clothingColor` | `clothing.color.sky` |
| `accessory` | `star` | `accessoryStyle` | `accessory.style.star` |
| `accessoryColor` | `accessoryCoral` | `accessoryColor` | `accessory.color.coral` |

### 20.2 Simplified implementation roadmap

Recommended implementation order:

1. **Shared Avatar Catalog foundation**
   - Add the shared source-controlled catalog definition.
   - Add typed catalog entities for backend and frontend.
   - Add the Local Catalog Provider boundary.
   - Add startup/catalog-shape tests.

2. **Backend validation**
   - Validate create/update avatar selections against the shared catalog.
   - Add structured validation errors for unknown, retired, category-mismatched, or missing required selections.

3. **JSON AvatarSelection persistence**
   - Add the dedicated JSON value object.
   - Backfill existing Avatar V2 fields directly into catalog IDs.
   - Avoid intermediate dedicated canonical-ID columns unless a concrete implementation constraint appears.

4. **Generic editor consuming catalog metadata**
   - Remove hard-coded avatar option arrays and content-specific editor branches.
   - Render categories and options from catalog metadata.
   - Preserve the current viewport-safe editor layout.

5. **Renderer adapter**
   - Map stable catalog IDs to Avatar V2 renderer tokens.
   - Keep renderer-specific geometry and overlap decisions in renderer logic.

6. **Legacy migration cleanup**
   - Remove the old `avatarV2Config` write path after callers are migrated.
   - Remove obsolete frontend normalization arrays.
   - Keep migration aliases only as long as needed for controlled data migration.

### 20.3 Migration risks

- Existing backend may contain invalid non-blank strings because it currently cleans strings but does not check membership.
- Some current renderer tokens are present in type definitions but not exposed in user-facing config, such as `starClip` in the accessory type.
- Frontend labels are currently embedded in editor components, so migration must preserve Dutch UX text.
- API clients may depend on `avatarV2Config` shape.
- JSON value-object mapping in EF Core needs focused validation.
- Generated OpenAPI clients may need regeneration once DTOs change.

### 20.4 Handling invalid existing data

Backfill should use this hierarchy:

1. Exact current token to catalog ID mapping.
2. Legacy alias mapping from catalog.
3. Category default if no valid mapping exists.
4. Record migration warning in logs or a one-time report.

Do not drop existing invalid values before they are inspected. Prefer producing a migration report that counts invalid values by field and member.

## 21. Complexity estimate

### 21.1 Backend complexity

Estimated complexity: **medium**.

Main work:

- Define typed catalog DTOs/domain records.
- Add the Local Catalog Provider.
- Add shared catalog data and startup validation.
- Add catalog lookup/validation service.
- Add family-member write validation.
- Add JSON `AvatarSelection` value-object persistence and backfill.
- Add API contract changes for avatar selections.
- Add tests for catalog validity, legacy mapping, and invalid writes.

Risk drivers:

- DTO migration while preserving existing clients.
- Choosing JSONB value-object mapping in EF Core.
- Backfilling any invalid current data.

### 21.2 Frontend complexity

Estimated complexity: **medium**.

Main work:

- Consume the bundled shared catalog definition.
- Refactor Avatar Editor to render categories/items from catalog metadata.
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

### 21.3 Overall complexity

Estimated implementation size: **4 to 6 focused slices**, matching the simplified roadmap in section 20.2.

The work is still meaningful, but avoiding a runtime catalog API, persisted catalog content versioning, a compatibility rule engine, and an asset pipeline keeps it proportionate for FamilyBoard.

## 22. Recommended implementation contract for a future slice

When implementation begins, the first slice should be deliberately narrow:

- Add the shared source-controlled catalog definition.
- Add typed backend/frontend catalog models as needed.
- Add the Local Catalog Provider boundary.
- Add startup catalog validation.
- Do not add a runtime catalog API.
- Do not redesign the Avatar Editor layout.
- Do not remove Avatar V2 renderer types.
- Do not introduce compatibility rules or asset delivery infrastructure.
- Add tests proving the catalog contains all currently user-facing Avatar V2 options.

This keeps the first change safe and establishes the shared source of truth before migrating persistence or UI writes.

## 23. Open decisions

- Exact shared catalog file/module format that is easiest for both ASP.NET Core and React/Vite to consume.
- Whether the JSON value object should store `schemaVersion` only or also an application release/build marker for diagnostics.
- Whether deprecated items should be selectable when already selected or only visible as read-only.
- Whether color swatch values should be catalog-owned immediately or remain renderer-owned until the catalog read path is stable.
- How long the API should accept legacy `avatarV2Config` writes during migration.

## 24. Final recommendation

Adopt a shared, source-controlled Avatar Catalog with typed catalog entities, stable namespaced IDs, localization metadata, accessibility metadata, explicit ordering, and renderer bindings. Keep the backend as the authoritative validator for persisted selections, but let frontend and backend consume the same shared catalog definition rather than introducing a runtime Catalog API.

Persist avatar choices immediately as a dedicated JSON `AvatarSelection` value object with `SchemaVersion` and selected catalog item IDs. Do not persist a separate `CatalogVersion` while catalog content ships with the application. Introduce explicit catalog content versioning only if catalogs become independently deployable.

Keep the Avatar Editor fully catalog-driven: it receives categories, items, and metadata, then renders generic controls without `hair`, `clothing`, or `accessory` special cases. Keep Avatar V2 rendering independent behind a renderer adapter, and solve visual overlap in renderer logic instead of a premature compatibility rule engine.

This architecture emphasizes simplicity, maintainability, extensibility, minimal infrastructure, catalog-driven UI, backend validation, JSON persistence, and renderer independence while avoiding speculative infrastructure unlikely to be required by FamilyBoard.
