# FamilyBoard Avatar V2 Editor UX and Interaction Analysis

Date: 2026-07-08
Scope: analysis only. No source-code implementation is included.

## Current editor summary

The current Avatar V2 editor exists in two nearly identical forms:

- `FamilyAvatarEditor`, used as a modal for editing a family member avatar.
- `AvatarEditorPage`, used as a standalone avatar creation/testing page.

The editor presents a live preview beside a list of controls. The current control model is flat and section-based:

1. Hair style: visual asset tiles.
2. Hair color: circular swatches.
3. Clothing style: visual asset tiles.
4. Clothing color: circular swatches.
5. Accessory style: visual asset tiles.
6. Accessory color: circular swatches.

The current data shape supports head variant, hair style, hair color, clothing style, clothing color, accessory, and accessory color. Rendering currently hard-codes skin tone to `skinPeach`, so skin tone is not actually editable in the editor even though skin palette tokens exist.

## Current-state observations

### Scalability

The current editor is workable for a small palette, but it does not scale well beyond the current counts.

Current visible option counts are small:

- 8 hair styles.
- 3 hair colors.
- 6 clothing styles.
- 4 clothing colors.
- 8 accessory styles.
- 2 accessory colors.

With 30+ hair colors, 30+ clothing colors, and 30+ skin tones, the current vertical section stack would become long and visually noisy. Swatches are rendered as wrapping rows with no category grouping, names, filtering, progressive disclosure, or internal scroll strategy. A 30-color row at the current 3rem swatch size would wrap into multiple lines, consuming more vertical space than the editor can comfortably reserve.

The modal variant caps the dialog height and hides overflow at the editor container. The controls area does not provide an explicit scroll region in the current family editor variant. This creates a risk that additional controls or expanded palettes become clipped or inaccessible inside the modal.

### Support for 30+ hair colors, clothing colors, and skin tones

The current design is not ready for 30+ swatches per category.

Main issues:

- **No skin-tone control:** the normalized configuration does not expose skin tone, and the render mapping always supplies `skinPeach`.
- **Flat swatch rows:** every color is treated as equal and ungrouped.
- **Weak labeling:** swatches are announced as ordinal choices rather than meaningful colors.
- **No selected-value summary:** users cannot quickly see "dark brown hair / teal shirt / warm brown skin" without interpreting the swatch.
- **No search or grouping:** 30+ colors need families such as natural, bright, pastel, neutral, warm, cool, or recommended.
- **No viewport containment strategy:** large palettes would expand section height rather than living in a reserved panel.

For 30+ colors per category, the editor needs either tabs, accordions, a dedicated color picker panel, grouped chips, a carousel with paging, or a searchable/paginated palette drawer.

### Desktop usability

Desktop strengths:

- Preview and controls are side-by-side, which supports immediate feedback.
- Visual style tiles make hair, clothing, and accessory choices easy to understand.
- Save, cancel, and reset are close to the preview.

Desktop weaknesses:

- The preview column competes with actions and status; it is useful but not strongly sticky inside the modal because the family editor uses static positioning.
- The controls column has many cards with similar visual weight, so the primary task path is not strongly guided.
- The first hair section spans both columns in the family editor, but later sections use two columns. This creates a slightly uneven scan pattern.
- There is no compact mode for advanced palettes.
- The layout optimizes for a small number of options, not for editing speed across many categories.

### Mobile usability

Mobile weaknesses are more pronounced:

- The responsive layout collapses to a single column, placing preview above all controls. As users scroll through options, the live preview may move out of view.
- A 30+ swatch category would require substantial vertical scrolling.
- Save/cancel/reset can be separated from the active control area.
- The current modal width/height behavior risks awkward clipping on short mobile viewports if the control stack grows.
- There is no mobile-specific interaction pattern such as bottom sheets, category tabs, horizontal swatch strips, or sticky action bars.

### Touch friendliness

Strengths:

- Current swatches are visually large at 3rem square/circle.
- Asset tiles are large enough for coarse pointer input.
- Buttons have reasonable minimum height.

Weaknesses:

- Dense future palettes would either shrink touch targets or create excessive scrolling.
- Swatches rely heavily on color alone, which is not sufficient for low vision, color blindness, or ambiguous similar tones.
- There is no visible text label for swatches.
- On touch devices, a selected swatch among 30+ similar swatches may be difficult to relocate.

### Visual hierarchy

Strengths:

- The live preview is visually prominent.
- Section titles are clear.
- Selected state uses border and focus-like ring.

Weaknesses:

- Every section appears as a similar card. This makes primary vs secondary controls feel equal.
- The editor does not distinguish foundational identity choices from decorative choices. Skin, head, hair, and clothing should be primary; accessories should be secondary.
- Save/cancel/reset actions are grouped in the preview card, but the editor does not clearly communicate the editing sequence.
- Status is useful, but it is not paired with a concise summary of the selected avatar attributes.

### Accessibility

Strengths:

- The modal uses `role="dialog"` and `aria-modal="true"`.
- Sections are labelled with headings.
- Buttons use `aria-pressed` for selected choices.
- Status uses `aria-live`.

Risks and gaps:

- Swatch labels are ordinal rather than semantic. "Hair color choice 1" does not help screen reader users understand the choice.
- Color selection depends on visual color perception.
- The backdrop has `role="presentation"`, but there is no explicit evidence of focus trapping, initial focus placement, escape-key handling, or restore-focus behavior in the editor component.
- The injected SVG previews are decorative inside option tiles but may still carry internal SVG semantics unless consistently hidden.
- The selected state is not accompanied by visible text for swatches.
- Similar skin tones require names and possibly contrast-safe outlines.
- Long palettes need keyboard navigation semantics, such as roving tabindex in a radiogroup or clear button groups by category.

### Discoverability

Strengths:

- Section titles make available dimensions discoverable.
- Visual previews communicate style options well.

Weaknesses:

- Head variant is in the configuration but not exposed in the current editor UI.
- Skin tone exists as palette data but is not editable.
- Accessory color exists but only two choices are available.
- Reset may be interpreted as reset current section or reset entire avatar; scope is not explicit.
- Users are not shown what changed since last save beyond a generic unsaved status.

### Editing speed

For the current small option set, editing is fairly quick: users can scan all visible choices and click directly.

For larger sets, editing speed would degrade because:

- Users must visually search through long, ungrouped swatch lists.
- There are no recents, favorites, recommended defaults, or color families.
- There are no keyboard shortcuts, next/previous controls, or section navigation.
- On mobile, users may need repeated scroll-preview-scroll cycles.

### Future extensibility

The current implementation is simple but tightly coupled to fixed arrays and section rendering.

Future extensibility needs:

- A metadata-driven option schema with category, label, description, grouping, tags, and availability rules.
- One reusable selector pattern for visual assets and another for large palettes.
- A way to add skin tone, glasses, facial features, body/base, age style, pattern, and future accessories without growing the page indefinitely.
- Explicit layout rules for modal and primary-page variants.
- Internal scrolling or paged panels that preserve the global FamilyBoard no-page-scroll requirement.

## Alternative layout concepts

### Option 1: Preview-left with category tabs and fixed option panel

```
+--------------------------------------------------------------+
| Avatar van Riley bewerken                         [X]        |
+----------------------+---------------------------------------+
|                      | [Skin] [Hair] [Clothes] [Extra]       |
|      LIVE PREVIEW    |---------------------------------------|
|                      | Hair                                  |
|   Status summary     | [Style] [Color]                       |
|                      |                                       |
| [Save] [Undo] [Reset]| [ tile ][ tile ][ tile ][ tile ]      |
|                      | [ tile ][ tile ][ tile ][ tile ]      |
|                      |                                       |
|                      | Color family: [Natural][Bright][All]  |
|                      | [●][●][●][●][●][●][●][●][●][●]       |
|                      | [●][●][●][●][●][●][●][●][●][●]       |
+----------------------+---------------------------------------+
```

Pros:

- Keeps preview visible on desktop.
- Reduces vertical stack by showing one category at a time.
- Scales better to 30+ colors through internal panel scrolling or color-family filters.
- Makes primary categories discoverable through tabs.
- Supports future categories without adding more page height.

Cons:

- Requires users to switch tabs instead of seeing all controls at once.
- Needs careful mobile adaptation.
- More stateful UI than the current simple section stack.

Best fit: balanced desktop/mobile editor with many options.

### Option 2: Mobile-first bottom-sheet editor with sticky preview header

```
+------------------------------+
| Avatar van Riley        [X]  |
|  [ small live preview ]      |
|  Dark hair · Hoodie · Star   |
+------------------------------+
| [Skin] [Hair] [Top] [Extra]  |
+------------------------------+
| Hair color                   |
| [Natural] [Warm] [Fun] [All] |
|                              |
| [●] Cocoa       [●] Chestnut |
| [●] Plum        [●] Black    |
| [●] Blonde      [●] Auburn   |
| ... internal scroll ...      |
+------------------------------+
| [Cancel]              [Save] |
+------------------------------+
```

Pros:

- Strong mobile ergonomics.
- Preview and actions remain visible.
- List-style color rows can include accessible names and large touch targets.
- Works well for 30+ colors because the active panel scrolls internally.

Cons:

- Less efficient on wide desktop unless adapted.
- Visual asset grids may feel cramped if represented as list rows.
- Requires careful height budgeting to avoid page scroll.

Best fit: touch-heavy household tablet/mobile use.

### Option 3: Step-by-step wizard

```
+--------------------------------------------------+
| Step 2 of 5: Hair                                |
+----------------------+---------------------------+
|                      | Choose a hairstyle        |
|     LIVE PREVIEW     | [ tile ][ tile ][ tile ]   |
|                      | [ tile ][ tile ][ tile ]   |
| Current selections   |                           |
| Skin: Warm brown     | Choose a hair color       |
| Hair: Curly, Cocoa   | [●][●][●][●][●][●][●]     |
+----------------------+---------------------------+
| [Back]                    [Skip] [Next] [Save]   |
+--------------------------------------------------+
```

Pros:

- Very approachable for first-time users and children.
- Clear hierarchy and low cognitive load.
- Natural place for guidance, recommended choices, and defaults.
- Easy to keep each step within viewport.

Cons:

- Slower for power users who want quick changes across multiple categories.
- Editing one existing setting can require navigation.
- More workflow complexity around save, skip, and back behavior.

Best fit: onboarding or first avatar creation, less ideal for frequent edits.

### Option 4: Inspector layout with compact summary and expandable drawers

```
+--------------------------------------------------------------+
| Avatar editor                                      [X]       |
+----------------------+---------------------------------------+
|     LIVE PREVIEW     | Selected avatar                       |
|                      | Skin: Peach        [Change]           |
| [Save] [Cancel]      | Hair: Short messy   [Change]          |
|                      | Hair color: Cocoa   [Change]          |
|                      | Clothing: Hoodie    [Change]          |
|                      | Clothing color: Sky [Change]          |
|                      | Accessory: Star     [Change]          |
|                      |---------------------------------------|
|                      | Expanded drawer: Hair color           |
|                      | [Natural] [Bright] [All]              |
|                      | [●][●][●][●][●][●][●][●][●][●]       |
+----------------------+---------------------------------------+
```

Pros:

- Excellent selected-state clarity.
- Users can jump directly to the attribute they want to change.
- Keeps most of the editor compact even with many categories.
- Extensible as new attributes become summary rows.

Cons:

- Adds one extra click to expose choices.
- Less playful than always-visible visual tiles.
- Needs clear drawer transitions and keyboard behavior.

Best fit: settings-style editing where clarity and compactness matter more than browsing.

### Option 5: Matrix palette drawer plus style grid

```
+--------------------------------------------------------------+
| Avatar editor                                      [X]       |
+----------------------+---------------------------------------+
|     LIVE PREVIEW     | [Hair style grid]                     |
|                      | [ tile ][ tile ][ tile ][ tile ]      |
| Status + actions     | [ tile ][ tile ][ tile ][ tile ]      |
|                      |---------------------------------------|
|                      | Color drawer                          |
|                      | Editing: ( ) Skin (•) Hair ( ) Shirt  |
|                      | Family: [Natural][Warm][Cool][Fun]    |
|                      | [●][●][●][●][●][●][●][●][●][●]       |
|                      | [●][●][●][●][●][●][●][●][●][●]       |
+----------------------+---------------------------------------+
```

Pros:

- Avoids repeating separate large swatch sections for skin, hair, and clothing.
- Efficient for users who want to tune multiple colors quickly.
- Color grouping can be shared across all color-bearing attributes.
- Preserves visual tile browsing for shape/style attributes.

Cons:

- Users must understand which target the color drawer is editing.
- Could cause accidental edits if the active color target is unclear.
- Less straightforward for screen reader users unless radiogroups and labels are very explicit.

Best fit: color-heavy avatar editing where palettes are the biggest scalability challenge.

## Preferred recommendation

Recommended design: **Option 1, preview-left with category tabs and a fixed option panel**, with selected elements from Option 2 for mobile.

Reasoning:

- It best balances discoverability, editing speed, scalability, and extensibility.
- It preserves the current editor's strongest pattern: live preview beside visual choices.
- It prevents the editor from becoming a long document-style form.
- It gives the product a durable place to add skin tone, head shape, glasses, patterns, and future accessories.
- It can satisfy FamilyBoard's viewport-first rule by reserving fixed regions: header, preview/actions, category tabs, and one internally scrollable option panel.

Preferred desktop composition:

```
+--------------------------------------------------------------------+
| Avatar van Riley bewerken                              [Close]     |
| Kies uiterlijk, kleding en extra's.                                |
+------------------------+-------------------------------------------+
|                        | [Skin] [Head] [Hair] [Clothes] [Extras]   |
|      LIVE PREVIEW      +-------------------------------------------+
|                        | Hair                                      |
|                        | [Style] [Color]                           |
| Summary:               |                                           |
| Skin: Warm brown       | Style                                     |
| Hair: Curly / Cocoa    | [ tile ][ tile ][ tile ][ tile ]          |
| Top: Hoodie / Sky      | [ tile ][ tile ][ tile ][ tile ]          |
| Extra: Star / Coral    |                                           |
|                        | Color                                     |
| [Save] [Cancel]        | [Natural] [Warm] [Cool] [Fun] [All]       |
| [Reset avatar]         | [●][●][●][●][●][●][●][●][●][●]           |
|                        | [●][●][●][●][●][●][●][●][●][●]           |
+------------------------+-------------------------------------------+
```

Preferred mobile composition:

```
+----------------------------------+
| Avatar van Riley            [X]  |
+----------------------------------+
| [preview] Hair: Curly / Cocoa    |
| [Cancel]              [Save]     |
+----------------------------------+
| [Skin][Head][Hair][Top][Extra]   |
+----------------------------------+
| Hair                             |
| [Style] [Color]                  |
|                                  |
| [ tile ] [ tile ]                |
| [ tile ] [ tile ]                |
|                                  |
| Natural colors                   |
| [● Cocoa] [● Chestnut]           |
| [● Black] [● Auburn]             |
| ... internal scroll ...          |
+----------------------------------+
```

Implementation principles for the recommended design, if a later task approves implementation:

1. **Use fixed regions:** modal/page header, preview summary, category navigation, active option panel, and action bar.
2. **Make only the active option panel scrollable:** do not let the browser page or modal body become the uncontrolled scroll container.
3. **Add semantic labels to every color:** use names such as "Cocoa brown", "Warm ivory", or "Deep brown" rather than ordinal labels.
4. **Expose skin tone as a first-class category:** skin tone is foundational and should not remain hard-coded.
5. **Group large palettes:** natural, warm, cool, bright, pastel, neutral, recommended, and all.
6. **Keep selected-state summaries visible:** users should always know what the current avatar uses without inspecting swatches.
7. **Use accessible selection semantics:** each category should behave like a named radiogroup or equivalent button group with clear `aria-pressed`/selected behavior.
8. **Design for touch first:** maintain at least comfortable touch targets and avoid dense unlabeled color-only dots for large palettes.
9. **Support future metadata:** options should carry labels, category, group, tags, preview strategy, and compatibility metadata.

## Priority issues to resolve before scaling palettes

1. Add an editable skin-tone attribute to the Avatar V2 configuration and UI model.
2. Replace flat swatch rows with grouped, labelled, accessible palette selectors.
3. Introduce category-level navigation so the editor does not grow vertically with every future attribute.
4. Reserve an internal scroll area for large option sets.
5. Add visible selected summaries for all editable attributes.
6. Clarify reset scope and destructive behavior.
7. Validate modal focus management, keyboard navigation, escape behavior, and focus restoration.

## Bottom line

The current Avatar V2 editor is a strong small-palette prototype, but it should not be scaled by simply adding more swatches to the existing section stack. For 30+ hair colors, clothing colors, and skin tones, the editor needs a category-based layout with a stable preview, grouped accessible palettes, visible summaries, and internally bounded scrolling. The preferred direction is a preview-left/category-tabs editor on desktop with a sticky-preview/tabbed-panel adaptation on mobile.
