# Avatar V2 Color System Analysis

## Executive summary

Avatar V2 should use a data-driven color system with separate palette roles for skin, hair, clothing, accessories, and optional future accents. Skin tone must become a first-class avatar attribute rather than a renderer-derived or legacy field. Hair and clothing should not share one undifferentiated palette because they have different expectations: hair needs realism, family resemblance, grey/white aging options, and optional fantasy expression; clothing needs broad expressive choice, seasonal friendliness, and future pattern compatibility.

The recommended production strategy is:

- **Skin tones:** 12 carefully spaced tones, named neutrally and inclusively, with no redundant near-duplicates.
- **Hair colors:** 24 core natural hair colors plus a separate optional 12-color fantasy extension.
- **Clothing colors:** 32 core colors organized by neutral, soft, bright, and seasonal families, designed to remain useful if patterns are added later.
- **Architecture:** palettes are typed data, not hard-coded UI controls; each swatch carries stable id, localized label key, hex/render token references, category metadata, sort order, accessibility metadata, and optional availability rules.
- **UI organization:** FamilyBoard should prioritize simple family-friendly grouping over professional design-tool complexity: Recommended, Natural/Everyday, Bright/Fun, Seasonal, and Optional Fantasy where relevant. Recent and Favorites can wait until palette size or user behavior justifies them.
- **Accessibility:** selection must never rely on color alone; swatches need visible outlines, labels, keyboard support, screen reader labels, and selected-state icons or checkmarks with sufficient contrast.

This keeps the initial editor approachable while allowing larger palettes, seasonal packs, holiday colors, brand themes, and user-configurable palettes later without redesigning the data model or editor layout.

## Findings

### Existing Avatar V2 direction

Prior Avatar V2 work established a typed avatar configuration with hair style/color, shirt style/color, glasses style/color, accessory style/color, and internal palette tokens for SVG rendering. The existing engine report also states that user-facing UI did not expose raw color names or hex values in the initial isolated renderer work. This means Avatar V2 already has the right conceptual separation between user intent and rendering internals, but the color system needs a more intentional production taxonomy before expanding palettes.

The current Avatar V2 model has also moved toward persisted user intent rather than storing SVG output, renderer geometry, or visual internals. The color strategy should preserve that boundary: persisted avatar color choices should be stable semantic ids, while renderer tokens, hex values, gradients, and derived shade/highlight colors remain implementation details.

### Key product constraints

- Avatar editing is a family-facing workflow, not a professional illustration tool.
- The editor must remain usable by children and caregivers.
- Larger palettes must not make the editor vertically unbounded or document-like.
- Skin tone is identity-sensitive and should be treated more carefully than clothing or accessory color.
- Hair color should support realistic family resemblance first, with playful fantasy choices available only if they do not dilute the default experience.
- Clothing color is more expressive and can safely offer broader playful choice.
- Future additions should be possible through palette data, not by rewriting the editor.

## Recommended architecture

### Palette roles

Avatar V2 should define color as role-specific palettes rather than one global color picker.

| Avatar property | Recommended color support | Palette strategy | Notes |
| --- | --- | --- | --- |
| Skin tone | Yes, first-class | Dedicated `skinTone` palette | Identity-sensitive; no fantasy or seasonal variants. |
| Hair | Yes | Dedicated core natural hair palette plus optional fantasy group | Hair colors need realistic shade/highlight tuning. |
| Clothing | Yes | Dedicated clothing palette | Broader expression; future patterns should reuse foreground/background color roles. |
| Accessories | Yes | Shared accessory/accent palette derived from clothing palette subset | Keep smaller to reduce noise. |
| Glasses frames | Yes | Dedicated small frame palette or neutral/accent subset | Mostly neutrals plus a few child-friendly colors. |
| Mouth/eyes/facial features | No direct user color in V2 | Renderer-defined | Avoid uncanny combinations and excess complexity. |
| Background/avatar base | Optional later | Dedicated background palette | Should not block core avatar identity work. |
| Pattern colors | Future | Pattern-specific foreground/background token roles | Should extend clothing data model, not replace it. |

### Data-driven palette model

Palettes should be data-driven from the beginning, even if the first implementation stores data in frontend TypeScript rather than a backend table. A palette item should include:

- Stable id, for example `hair.brown.chestnut` or `skin.06.mediumWarm`.
- Palette role, for example `skinTone`, `hair`, `clothing`, `accessory`, `glassesFrame`.
- Localized display label key.
- Accessibility label key if different from display label.
- Sort order.
- Category metadata, for example `natural`, `fantasy`, `neutral`, `bright`, `seasonal`, `warm`, `cool`.
- Render token reference or base color values.
- Derived SVG colors where needed: base, shade, highlight, line/accent.
- Optional availability metadata, for example `core`, `seasonal`, `experimental`, `disabled`.
- Optional recommended/default flag.

Persisted avatar configuration should store only stable palette item ids. Rendering should resolve ids through the palette registry. This enables palette expansion, localization, and accessibility labels without database migrations for every new color.

### Backend/frontend ownership

Initial production can keep palette definitions in frontend design-system data if avatar choices are persisted as stable strings and validated against a known set. Longer-term, backend validation should recognize palette ids by versioned allowlists so stored avatars remain valid even if labels, order, categories, or rendering values change.

Recommended split:

- **Frontend:** palette presentation, grouping, labels, ordering, swatch display, editor layout, renderer token mapping.
- **Backend:** stores selected ids, validates supported ids, preserves unknown-but-existing ids on updates where practical, exposes current avatar config.
- **Do not store:** raw hex from user choices, generated SVG, gradient definitions, or renderer-specific shade math in the domain model.

## Recommended palettes

## Skin tone system

### Recommendation

Use **12 skin tones** across the spectrum.

A good production starting set is:

1. Porcelain
2. Fair
3. Light
4. Light Medium
5. Medium
6. Medium Tan
7. Tan
8. Golden Brown
9. Brown
10. Deep Brown
11. Rich Deep
12. Very Deep

These are friendly labels, but localization keys should remain stable and internal ids should not encode value judgments such as `normal`, `default`, `darkest`, or ethnicity names.

### Distribution

The 12 tones should be perceptually spaced rather than mathematically spaced by hex value. The set should avoid clusters of visually redundant beige tones while leaving enough range for families to recognize themselves. A useful distribution is:

- 3 light tones.
- 3 medium tones.
- 3 brown tones.
- 3 deep tones.

### Warm and cool variants

Warm/cool variants are useful for realism but can quickly create redundant choices and make the editor feel technical. For Avatar V2 production, warm/cool should be handled mostly in the renderer's derived shade/highlight values, not exposed as separate user choices.

A later advanced palette could add a few undertone variants, but the initial family-facing editor should not ask users to understand undertones.

### Default behavior

Default skin tone should be explicit during avatar setup when a family member is created or edited. If a default must be assigned automatically, choose a middle tone only as a temporary neutral placeholder and make it easy to change. Avoid implying that one tone is the system norm.

### Accessibility considerations

- Do not use skin tone names as jokes, food names, or ethnicity labels.
- Provide screen reader labels such as “Skin tone: Medium Tan.”
- Selected state must include a checkmark or ring, not only a different border color.
- Swatches should be large enough to compare adjacent tones without precision pointing.

## Hair color system

### Recommendation

Use **24 core natural hair colors** plus an optional **12 fantasy colors** in a separated group.

Hair should be rendered as flat base color with deterministic shade/highlight colors generated from palette data. Do not introduce user-selectable gradients for V2. Gradients increase rendering complexity, make small avatars less legible, and can conflict with the existing SVG layer style. Palette-defined highlight and shade colors are enough to create depth while preserving a clean family-friendly aesthetic.

### Core natural hair palette: 24 colors

| Group | Count | Recommended colors |
| --- | ---: | --- |
| Black | 3 | Soft Black, Natural Black, Blue Black |
| Brown | 6 | Light Brown, Warm Brown, Chestnut, Chocolate Brown, Dark Brown, Espresso |
| Blonde | 5 | Sandy Blonde, Honey Blonde, Golden Blonde, Ash Blonde, Light Blonde |
| Red/Ginger | 4 | Strawberry Blonde, Copper, Ginger, Auburn |
| Grey/White | 4 | Silver Grey, Warm Grey, Charcoal Grey, White |
| Transitional | 2 | Salt and Pepper, Dark Roots Blonde |

This gives enough coverage for children, adults, and older family members without creating a hair-color wall.

### Fantasy hair colors

Fantasy colors should exist, but as an optional separated group rather than part of the default natural palette. Recommended fantasy set:

1. Bubblegum Pink
2. Coral
3. Lavender
4. Purple
5. Sky Blue
6. Teal
7. Mint
8. Lime
9. Sunshine Yellow
10. Rainbow Red
11. Pastel Peach
12. Pastel Blue

The editor should label this group as “Fun colors” or “Fantasy colors,” depending on the product tone. FamilyBoard should avoid making fantasy colors feel like rewards, unlocks, or gamification unless a future explicit slice introduces that system.

### Reasoning

A 24-color natural palette balances realism and editor simplicity. Most families need hair colors that communicate identity at small sizes: black, brown, blonde, red/ginger, grey, and white. The biggest risk is overproducing near-identical browns and blondes. The recommended counts intentionally give brown and blonde more room, because they need common real-world variation, while keeping black and grey smaller because too many near-black/grey variants are hard to distinguish in small avatar sizes.

## Clothing color system

### Recommendation

Use **32 core clothing colors**.

Clothing can support a larger palette than hair because clothing is expressive, less identity-sensitive, and more likely to be changed for preference, season, or mood. The palette should include neutrals, soft colors, bright child-friendly colors, and seasonal colors.

### Core clothing palette: 32 colors

| Group | Count | Recommended colors |
| --- | ---: | --- |
| Neutrals | 8 | White, Cream, Light Grey, Charcoal, Black, Navy, Denim, Brown |
| Soft colors | 8 | Blush, Peach, Butter Yellow, Sage, Mint, Sky, Lavender, Lilac |
| Bright colors | 8 | Red, Orange, Yellow, Green, Blue, Purple, Pink, Teal |
| Seasonal/deep colors | 8 | Burgundy, Pumpkin, Mustard, Forest, Evergreen, Winter Blue, Plum, Cocoa |

### Children's colors

Children's choices should favor clear, recognizable labels and cheerful swatches. The clothing palette should include simple primary/secondary colors even if more refined product colors exist elsewhere. A child should be able to find “pink,” “blue,” “green,” or “purple” without decoding brand-specific names.

### Seasonal colors

Seasonal colors should be included as ordinary colors in the core clothing palette only where they are broadly useful year-round: Burgundy, Pumpkin, Mustard, Forest, Evergreen, Winter Blue, Plum, and Cocoa. Holiday-specific palettes should be future optional packs, not part of the default initial editor.

### Pattern support

Clothing should eventually support patterns, but pattern support should not multiply the base palette. Instead, clothing should use:

- Primary clothing color.
- Optional secondary/pattern color.
- Pattern id, for example stripes, dots, stars, hearts, plaid.

Pattern support changes the palette design by requiring colors to be tested in pairs. The palette should therefore include contrast metadata and recommended pairings later. However, the initial palette can still be a flat list if the data model anticipates a future secondary color slot.

## Palette organization

### Alternatives evaluated

| Option | Strengths | Weaknesses | Recommendation |
| --- | --- | --- | --- |
| Natural vs Fantasy | Clear for hair; protects realistic defaults | Not useful for skin; only partly useful for clothing | Use for hair only. |
| Neutral vs Bright | Good for clothing and accessory colors | Does not describe skin or hair well | Use for clothing/accessories. |
| Warm vs Cool | Useful for designers | Too technical for most families and children | Keep as metadata, not primary UI. |
| Recent | Helpful with large palettes | Requires interaction history and persistence/local storage | Defer. |
| Favorites | Useful for frequent customization | Extra management complexity | Defer until users customize often. |
| Recommended | Reduces choice overload | Can feel arbitrary if too dominant | Use as first compact row. |
| All colors | Complete and predictable | Can overwhelm as palettes grow | Provide after grouped sections or as the default grid within a role. |

### Recommended FamilyBoard organization

Use role-specific groupings:

- **Skin:** one ordered “Skin tones” grid only.
- **Hair:** “Recommended,” “Natural colors,” “Grey & white,” and optional collapsed “Fun colors.”
- **Clothing:** “Recommended,” “Neutrals,” “Soft,” “Bright,” and “Seasonal.”
- **Accessories/glasses:** “Recommended,” “Neutrals,” and “Colors.”

Do not introduce Recent or Favorites initially. They are useful only when users repeatedly customize avatars or when palettes exceed roughly 48 visible choices per role.

## Naming recommendations

### Friendly names

User-facing colors should use friendly names because families and children need understandable labels. Examples:

- “Honey Blonde” instead of `#D9A441`.
- “Sky Blue” instead of `blue-300`.
- “Medium Tan” instead of `skin-06`.

### Internal names

Internal ids should be stable, lowercase, semantic, and role-scoped:

- `skin.mediumTan`
- `hair.brown.chestnut`
- `hair.fantasy.lavender`
- `clothing.soft.sky`
- `accessory.neutral.charcoal`

Avoid ids that include implementation details, exact hex values, or UI sort positions.

### Localization strategy

Every palette item should use a localization key from the beginning, even if only one locale is initially shipped. Labels should not be embedded directly in persisted data. Suggested keys:

- `avatar.color.skin.mediumTan.label`
- `avatar.color.hair.chestnut.label`
- `avatar.color.clothing.sky.label`
- `avatar.color.hair.chestnut.a11yLabel`

Accessibility labels can often match visual labels, but separate keys allow languages to provide clearer descriptions where needed.

### Accessibility naming

Names should describe the color, not the person. For example:

- Good: “Deep Brown skin tone.”
- Avoid: “African,” “Asian,” “Caucasian,” “normal,” “default,” “exotic,” or food-based skin labels.

## Accessibility evaluation

### Contrast

Swatches need contrast against the editor background and selected-state indicator. Very light skin, white hair, white clothing, and cream clothing need an internal border or outline so they remain visible on light surfaces. Very dark colors need a light selected icon or double-ring treatment.

### Color blindness

Color blindness is less severe for avatar customization than for status communication, but the editor still must not rely on hue alone. Requirements:

- Every swatch has text or an accessible name.
- Selected state includes shape/icon treatment.
- Focus state is visually distinct from selected state.
- Group headings help users locate colors by name/category.

### Selection indicators

Use a layered indicator:

- Outer focus ring for keyboard focus.
- Inner selected ring or checkmark for current selection.
- Checkmark color chosen per swatch contrast, usually white on dark swatches and dark on light swatches.
- `aria-pressed` or equivalent radio semantics for selected swatches.

### Keyboard navigation

Swatches should behave like a radio group per property:

- Arrow keys move within the grid.
- Home/End move to first/last item in the group.
- Tab moves between properties or major groups.
- Enter/Space selects a swatch.
- Current selected swatch is announced.

### Screen reader support

Each control should announce role, color name, group, and selection state. Example: “Honey Blonde, hair color, selected.” If fantasy colors are optional/collapsed, the disclosure should announce expanded/collapsed state.

## Future extensibility

The architecture should support future palettes even if the initial editor does not expose them.

| Future addition | Include in initial architecture? | Initial UI exposure? | Rationale |
| --- | --- | --- | --- |
| Seasonal palettes | Yes | Only broad seasonal clothing colors | Needs metadata and grouping support. |
| Holiday palettes | Yes | No | Avoid clutter and holiday assumptions in core editor. |
| Special event colors | Yes | No | Can be added as temporary palette packs later. |
| Brand themes | Yes | No | Useful if FamilyBoard introduces household/theme branding. |
| User-configurable palettes | Partially | No | Store stable selected ids now; raw custom colors can wait. |
| Pattern colors | Yes | No | Clothing model should allow future secondary color/pattern. |
| Accessibility high-contrast palette | Yes | No dedicated UI initially | Could become a settings-driven filter or alternate rendering mode. |

The key is not to build every future feature now, but to ensure palette data can carry category, availability, version, and label metadata without changing editor structure.

## Design system recommendations

### Swatch size

- Desktop: 36-40 px swatches with 8-10 px gaps.
- Touch/tablet/mobile: 44-48 px minimum target size.
- Compact rows may visually show 32 px color discs inside a 44 px button.

### Grid layout

- Desktop modal/sidebar: 6-8 columns depending on available width.
- Tablet: 5-6 columns.
- Mobile: 4 columns, with internal scrolling inside the palette panel if needed.
- Keep group headers sticky only if the palette panel becomes internally scrollable; do not make the full page scroll.

### Desktop layout

Use a two-region avatar editor:

- Left or top reserved preview region with avatar preview and save/cancel actions.
- Right or lower bounded controls region with tabs/sections for Body, Hair, Clothing, Accessories.
- Color grids live inside the bounded controls region with internal overflow if a future palette becomes large.

### Mobile layout

Use a step-based or accordion layout:

- Preview remains visible or quickly reachable.
- One property is edited at a time.
- Color groups use collapsible sections.
- Avoid showing all properties and all colors at once.

### Maximum practical palette size before search

Search is not needed for the recommended initial palettes. Search or filtering becomes useful when:

- Any single role exceeds about 48 colors.
- Total visible colors in one editor section exceeds about 72.
- User-configurable palettes or brand palettes add many custom names.

Before search, prefer grouping, recommended rows, and collapsed optional groups.

## Complexity assessment

| Capability | Frontend complexity | Backend complexity | Notes |
| --- | --- | --- | --- |
| Expand hair colors | Medium | Low to medium | Renderer may need palette-derived shade/highlight tuning; backend validates stable ids. |
| Expand clothing colors | Low to medium | Low | Mostly palette data and editor layout; rendering is simpler than hair. |
| Add skin tones | Medium | Medium | First-class persisted field, validation, defaults, migration/default behavior, careful labels. |
| Separate fantasy hair | Medium | Low | UI grouping/collapse and optional availability metadata. |
| Add future palettes | Medium | Medium | Requires versioned palette registry, availability flags, and unknown-id preservation. |
| Add patterns | High | Medium | New clothing intent fields, preview logic, contrast pair testing, UI controls. |
| Add user custom colors | High | High | Requires validation, storage, safety constraints, accessible naming, possible moderation/product rules. |
| Add localization | Medium | Low | Mostly frontend label keys unless backend returns display metadata. |

## Alternatives considered

### One shared global color palette

Rejected. A global palette is simple to implement but creates poor avatar outcomes. Skin, hair, clothing, accessories, and glasses need different constraints. A global palette would allow unnatural skin choices unless restricted, too many irrelevant clothing colors in hair, and insufficient hair-specific shade/highlight tuning.

### Very small curated palettes only

Rejected as the long-term architecture. Small palettes are approachable, but the known Avatar V2 direction already anticipates larger palettes. A tiny set would frustrate identity matching, especially for skin and hair.

### Full design-tool color picker

Rejected. Raw color pickers create inaccessible, inconsistent, and hard-to-render avatars. They also introduce backend validation and child-safety complexity. FamilyBoard needs curated choices, not arbitrary color input.

### Gradients for hair and clothing

Rejected for initial production. Gradients can look polished at large sizes but reduce consistency and legibility at avatar-chip sizes. Palette-defined shade/highlight colors provide enough depth while preserving deterministic SVG output.

### Recent/Favorites first

Deferred. Recent and Favorites solve a repeat-use problem, not an initial palette architecture problem. They add state and UI complexity before there is evidence that families need them.

## Risks

- **Choice overload:** 24 hair colors and 32 clothing colors are manageable only if grouped and bounded in the editor.
- **Skin tone sensitivity:** poor labels, uneven distribution, or a biased default can create exclusionary UX.
- **Small-size legibility:** near-black, near-white, grey, and pale clothing swatches need careful outlines and renderer contrast.
- **Renderer drift:** if palette ids map directly to raw hex values in too many places, future visual tuning becomes risky.
- **Persistence compatibility:** removing or renaming palette ids later can break saved avatars unless ids are stable and unknown values are handled gracefully.
- **Future pack clutter:** seasonal and holiday palettes can overwhelm the editor if added directly into the main grid without availability/category rules.

## Final recommendation

Avatar V2 should adopt a role-based, data-driven color architecture now, even if implementation remains frontend-local at first. The production color strategy should be:

1. Store avatar color choices as stable semantic palette ids.
2. Make skin tone a first-class avatar attribute with 12 inclusive, ordered tones.
3. Use a 24-color natural hair palette, with a separate optional 12-color fantasy group.
4. Use a 32-color clothing palette organized into neutrals, soft colors, bright colors, and seasonal/deep colors.
5. Keep accessories and glasses on smaller curated subsets rather than exposing every clothing color by default.
6. Render hair and clothing with flat base colors plus palette-defined shade/highlight values, not user-selectable gradients.
7. Use friendly localized labels for people and stable technical ids internally.
8. Design swatches as accessible radio-style controls with labels, keyboard navigation, high-contrast focus/selected states, and non-color selection indicators.
9. Build the palette registry with metadata for category, availability, localization, render tokens, and future expansion.
10. Defer Recent, Favorites, search, custom colors, holiday packs, and patterns until usage or explicit roadmap slices justify them.

This balances simplicity, scalability, accessibility, family-friendly UX, and long-term maintainability while avoiding premature implementation of advanced customization features.
