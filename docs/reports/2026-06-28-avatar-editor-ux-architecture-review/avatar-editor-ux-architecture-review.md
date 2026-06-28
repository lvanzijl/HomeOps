# Avatar Editor UX Architecture Review

## Summary

The current Avatar Editor is acceptable for Friends & Family as an all-visible editor because the present option set is small enough to understand at a glance and the live preview remains visible beside the controls. However, the best long-term direction is **B: keep the layout but introduce grouped sections** when the editor next expands. The current layout should not move to tabs now, and collapsible sections would likely reduce discoverability for the current family-oriented customization task.

Explicit answers:

- Is the current all-visible layout acceptable? **Yes, for the current option set and Friends & Family.**
- Are tabs recommended? **No.** Tabs would hide options and add navigation without a clearly superior benefit at the current scale.
- Are grouped sections recommended? **Yes, as the clearest long-term evolution.** The existing categories already imply natural groups, but the structure needs stronger parent grouping before Avatar V2 expands.
- Would collapsible sections improve UX? **Not now.** They may help later for advanced or rarely used categories, but default-collapsed controls would hurt discovery.
- Should anything change before Friends & Family? **No UX architecture change is required before Friends & Family.**
- Should any changes wait until Avatar V2 expands? **Yes.** Grouping should be introduced with the next meaningful category expansion, not as a redesign for its own sake.

## Preflight

Read before review:

- `.github/copilot-instructions.md`
- `AGENTS.md`
- `docs/reports/2026-06-28-avatar-editor-final-polish/avatar-editor-final-polish.md`

Command result:

```bash
export DOTNET_CLI_HOME=/tmp/dotnet
export PATH="$PATH:$HOME/.dotnet/tools"
dotnet --version
# 10.0.301
```

Visual review runtime:

- Backend environment: `ASPNETCORE_ENVIRONMENT=VisualReview`
- Fixture loaded: `visual-full`
- Frontend opened at a 1920×1080 browser viewport.
- Review path: Home → Alex → Avatar bewerken.
- Browser inspection was used for DOM text, visible control counts, group bounds, and first viewport composition.
- A temporary screenshot was created under `/tmp` for inspection and deleted; no screenshot or binary artifact remains in the repository.

## Current editor analysis

The editor opens as a modal over Alex's Family Member page. The modal uses a two-part composition: a persistent preview/action column on the left and an all-visible control area on the right. The visible control groups are:

1. `Haar`
2. `Haarkleur`
3. `Kleding`
4. `Kledingkleur`
5. `Accessoire`
6. `Accessoirekleur`

The control set is direct and concrete: selecting a hair, clothing, or accessory tile immediately communicates that the avatar will change, and the color rows are visually self-explanatory. The live preview and save/reset/cancel actions remain visible while the options are reviewed.

The main UX issue is not clipping anymore. The issue is that the right side reads partly as a dense matrix of controls rather than a guided personalization journey. That is acceptable at today's scale, but it is not the strongest long-term information architecture once more avatar categories are added.

## Cognitive load assessment

Presenting every editable category simultaneously feels **acceptable, but near the upper comfortable limit**.

Evidence from browser inspection at 1920×1080:

- 6 visible customization groups are present in the modal.
- 35 total buttons are present inside the dialog, including close, save, cancel, reset, 22 asset tiles, and 9 color swatches.
- 9 visible color pickers are present: 3 hair swatches, 4 clothing swatches, and 2 accessory swatches.
- The first viewport contains the complete current editor, so the user does not need to wonder whether more controls are hidden below.

Why it is acceptable:

- The categories are familiar family concepts: hair, clothes, accessories, and colors.
- Each asset option is represented visually, not only as abstract text.
- The live preview reduces mental simulation: the user can look left to understand the effect of choices.
- The current number of groups is small enough to scan.

Why it is not ideal long-term:

- Hair and hair color are separated by layout, but semantically they belong together.
- Clothing and clothing color are separated in the same way.
- Accessory and accessory color are separated in the same way.
- The user must visually parse six peer-level sections even though they are really three customization domains with subcontrols.

Assessment: **clear enough for the current release, but not the best eventual structure if categories increase.**

## Discoverability assessment

A first-time family member can likely understand the current editor quickly.

- Hair is discoverable because it is the first and largest section, with visible illustrated hair choices.
- Clothing is discoverable because the outfit tiles are visible without requiring navigation.
- Accessories are discoverable because the entire accessory group, including `Geen accessoire`, is visible in the same first viewport.
- Colors are discoverable because all three color rows are visible and appear as swatches rather than technical controls.

Hiding sections would reduce discoverability right now. Tabs or default-collapsed sections would force users to know that more categories exist and would make the editor feel more like a settings interface. For a family product, seeing the playful choices immediately is a strength.

The current all-visible approach is especially helpful for parents editing with a child nearby: the child can point at visible options without learning a navigation model first.

## Editing flow assessment

The current editor supports direct editing, but it does not strongly guide users through avatar creation.

Strengths:

- The left preview creates an immediate feedback loop.
- The save/cancel/reset actions are always available.
- The visual order begins with hair, then moves to colors/clothing/accessories, which is broadly understandable.

Weaknesses:

- The layout feels more like one large configuration panel than a step-by-step creation flow.
- Color choices are visually detached from their parent asset categories. For example, `Haarkleur` follows `Haar`, but in a two-column grid the relationship is weaker than a single grouped hair section would be.
- There is no explicit conceptual progression such as “Hair,” “Outfit,” “Extras”; users infer it from headings.

This is not a blocking flaw. Avatar creation is exploratory, not a mandatory wizard. A fully guided flow might make quick edits slower. The current flow is best described as **direct manipulation with moderate visual density**, not a guided builder.

## Information architecture assessment

### Current structure

The current information architecture exposes six peer-level sections. That makes every control discoverable but under-represents the natural hierarchy:

- Hair
  - style
  - color
- Clothing
  - style
  - color
- Accessory
  - item
  - color

The editor already has the raw ingredients for a better IA. It does not need a fundamentally different interaction model.

### Better long-term structure

The clearly superior long-term direction is **grouped sections** while preserving all-visible direct controls where possible. The likely conceptual grouping is:

- Hair: style + hair color
- Outfit: clothing + clothing color
- Extras: accessory + accessory color

This would reduce perceived complexity without hiding controls. It would also scale better than six equal-weight groups because future additions can be attached to a meaningful parent group.

### Structures considered

- **Keep current layout:** acceptable now, but will become brittle as more categories are added.
- **Grouped sections:** best balance of discoverability, lower cognitive load, and family friendliness.
- **Collapsible sections:** not recommended now; possible later only for advanced/rare categories.
- **Tabs:** not recommended; they hide options and turn a visual personalization task into navigation.
- **Two-column organization:** already partly present; useful for fit, but not sufficient as IA by itself.
- **Other:** a step-by-step wizard is not recommended because avatar editing benefits from quick comparison and non-linear experimentation.

## Visual density assessment

Now that clipping is fixed, the editor still feels visually dense, but not unacceptably dense.

Measured at 1920×1080 during browser inspection:

- Visible groups: **6**.
- Total dialog buttons: **35**.
- Asset option controls: **22**.
  - Hair: 8.
  - Clothing: 6.
  - Accessory: 8.
- Visible color pickers: **9**.
  - Hair color: 3.
  - Clothing color: 4.
  - Accessory color: 2.
- First viewport composition:
  - modal header and explanatory copy;
  - persistent live avatar preview;
  - save, cancel, and reset actions;
  - all hair options;
  - all hair color options;
  - all clothing options;
  - all clothing color options;
  - all accessory options;
  - all accessory color options.

The density is acceptable because the screen is visual, compact, and complete. The risk is that every group competes for attention at the same level. Grouping would reduce that perceived density without sacrificing visibility.

## Family suitability assessment

For a parent editing a child's avatar, the current editor feels **approachable and understandable**, though somewhat utilitarian.

Family-friendly strengths:

- The labels are plain and concrete.
- The asset choices are visual.
- The live preview makes editing feel safe and reversible.
- Reset, cancel, and save provide clear control for an adult.
- A child could likely understand the main idea by looking at the illustrated choices and color dots.

Family-friendly weaknesses:

- The modal still feels like a control surface more than a playful personalization moment.
- Six visible sections plus action buttons may be a lot for younger children to parse independently.
- The relationship between an item and its color is not as emotionally obvious as it could be.

Overall, the current structure is suitable for a parent-led family product. It is less ideal as an independent child-first avatar creator.

## Scalability assessment

Future Avatar V2 may include hats, glasses, shoes, expressions, and animations. The current all-visible six-section layout does **not** scale well to that future.

If those categories are simply appended as additional peer-level groups, the editor would likely become overwhelming:

- Hats and glasses would compete with current accessories.
- Shoes would probably belong with clothing/outfit, not as an unrelated peer group.
- Expressions and animations are behavior/personality controls, not purely appearance controls.
- More color controls would further increase visible swatch rows.

Grouped sections scale better because new categories can be placed into meaningful families:

- Hair/head: hair, hair color, hats, headbands.
- Outfit: clothing, clothing color, shoes.
- Extras: glasses, pins, crowns, accessories.
- Personality/motion: expressions, poses, animations.

This does not require tabs yet. If Avatar V2 becomes much larger, tabs may later become reasonable at the top group level, but the current evidence does not justify tabs now.

## Alternative structures considered

### A. Keep the current all-visible editor

Advantages:

- Maximum discoverability.
- No new navigation model.
- Fast for quick edits.
- Works for the current category count.

Disadvantages:

- Reads as a configuration panel.
- Does not express parent-child relationships between style and color.
- Has limited room for future categories.

Risk:

- If kept unchanged through Avatar V2 expansion, the editor will likely become too dense.

### B. Keep the layout but introduce grouped sections

Advantages:

- Preserves discoverability.
- Reduces perceived cognitive load.
- Matches the actual mental model: hair, outfit, extras.
- Scales better to new categories.
- Avoids unnecessary tab navigation.

Disadvantages:

- Adds some visual structure that must be designed carefully to avoid increasing bulk.
- May not solve extreme future scale by itself if Avatar V2 grows substantially.

Risk:

- Poorly executed grouping could make the modal taller or visually heavier.

### C. Introduce collapsible sections

Advantages:

- Can reduce visible density.
- Could help once rarely used advanced categories exist.

Disadvantages:

- Hides playful choices.
- Requires users to open sections before understanding what is available.
- May frustrate children or parent-child co-editing.

Risk:

- The editor becomes a settings accordion instead of a visual customization experience.

### D. Introduce tabs

Advantages:

- Strong separation for a very large editor.
- Could work later if there are many top-level domains.

Disadvantages:

- Reduces immediate comparison across categories.
- Hides available choices.
- Adds navigation cost for a task that currently benefits from direct exploration.
- Not clearly superior for only hair, clothing, accessories, and colors.

Risk:

- Tabs could make the editor feel more technical and less family-friendly.

### E. A different structure

A wizard or guided stepper was considered but is not recommended. Avatar editing is exploratory; users often jump between hair, outfit, and color. A wizard would make simple changes slower and would over-structure a playful task.

## Final recommendation

## B

Keep the layout but introduce grouped sections.

This recommendation is intentionally not a request to redesign the editor immediately. The current all-visible layout is acceptable for Friends & Family. The long-term information architecture should evolve toward grouped sections because grouping is the smallest structural change that solves the real IA issue: the editor currently presents six peer-level groups even though users think in broader customization domains.

Recommended timing:

- **Before Friends & Family:** no architecture change required.
- **When Avatar V2 expands:** introduce grouped sections before adding hats, glasses, shoes, expressions, animations, or multiple new color rows.
- **Tabs:** defer unless Avatar V2 becomes large enough that even grouped all-visible sections are objectively too dense.
- **Collapsible sections:** reserve for advanced or rarely used future controls, not the primary current categories.

## Risks of the recommendation

Advantages:

- Keeps the strongest part of the current editor: visible, playful options.
- Reduces cognitive load without hiding choices.
- Creates a more durable IA for Avatar V2 expansion.
- Avoids fashionable but unnecessary tabs.

Disadvantages:

- Does not provide the immediate density reduction that tabs or collapses would provide.
- Requires careful visual design to avoid making groups look like heavy settings panels.
- May still need a second IA decision if Avatar V2 grows far beyond the anticipated categories.

Risks:

- If grouping is delayed too long, future features may be appended as more peer-level sections, making the editor harder to repair later.
- If grouping is implemented before there is actual category expansion pressure, it may spend design effort without improving Friends & Family outcomes.
- If collapsible behavior is added to the primary groups, the product could lose the current editor's strongest discoverability advantage.

## Conclusion

The current Avatar Editor should remain all-visible for the current release because it is understandable, discoverable, and complete in one viewport after the clipping fix. It is acceptable for a parent-led family product and does not need tabs or collapsible sections before Friends & Family.

The long-term direction should be grouped sections, not tabs. Grouping preserves the family-friendly visibility of playful choices while making the IA match how people think about avatar creation: hair, outfit, and extras. Tabs should wait until there is clear evidence that grouped all-visible sections cannot support Avatar V2's expanded category set.
