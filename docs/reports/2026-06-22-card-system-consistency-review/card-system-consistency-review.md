# Card System Consistency Review

## Executive Summary

HomeOps has a moderately coherent card direction, but it does not yet have one fully consolidated card system. The strongest shared language is the rounded, lightly bordered, tinted-card pattern used across Home summaries, Motivation, Child Workspace, task panels, and Weekly Reset. The fragmentation is architectural rather than preference-based: similar cards are implemented as separate one-off classes (`home-summary-card`, `family-goal-card`, `individual-goal-card`, `child-progress-card`, `task-templates-panel`, `reset-card`, and `widget-card`) with duplicated border, radius, shadow, padding, and header conventions.

The product now feels like one product at the page level because recent compaction and hierarchy work made Home, Tasks, Lists, Motivation, Child Workspace, and Weekly Reset follow an overview-first / execution-first rhythm. However, card language is still assembled per page rather than generated from a shared set of card primitives.

**Conclusion:** HomeOps uses one emerging visual family, but multiple competing card implementations. The highest-value next design-system improvement is **A. Card System Consolidation**.

## Card Inventory

### Shared or semi-shared card components

| Card family | Evidence | Role | Consistency assessment |
| --- | --- | --- | --- |
| `widget-card` | Used by widget-rendered content such as Lists. | Legacy/general widget shell. | Shared but visually older: smaller radius, flatter border, less semantic hierarchy than newer cards. |
| `home-summary-card` | Home summary modules for Agenda, Tasks, Motivation, and Lists. | Dashboard overview card. | Strong internal consistency on Home, but not exported as a reusable summary primitive. |
| `empty-state-card` | Used by Home, Lists, Tasks, and Motivation empty states. | Empty state shell. | Good candidate for existing shared card primitive. |
| `secondary-action`, `more-link`, `widget-type`, `eyebrow` | Shared action/label vocabulary across several pages. | Reusable micro-patterns. | Helpful consistency, but not enough to unify full card architecture. |

### Specialized card components

| Specialized card | Page | Role | Notes |
| --- | --- | --- | --- |
| `home-date-card` | Home | Date/time hero card. | Unique hero card, intentionally different from summary cards. |
| `family-strip` / `family-chip` | Home | Family member selector row. | Chip system, not a normal card. |
| `quick-capture` | Home | Compact execution card. | Distinct capture surface with compact form behavior. |
| `family-goal-card` | Motivation | Primary family goal card. | Semantically primary, emotional, and decorated. Shares visual family but custom implementation. |
| `individual-goal-card` | Motivation | Personal goal card. | Similar to family goal but lower hierarchy. |
| `celebration-surface` / `celebration-memory-card` | Motivation | Emotional/status cards. | Intentional richer emotional presentation, but partially detached from generic cards. |
| `child-progress-card` | Child Workspace | Child-facing overview/detail cards. | Warm, asset-led, high-affect card language. Related to Motivation but separately implemented. |
| `family-celebration-card`, `child-goal-card` | Child Workspace | Nested cards. | Denser nested emotional cards. |
| `task-templates-panel` | Tasks | Secondary setup/reuse panel. | Card-like panel separate from `task-group`. |
| `task-group` | Tasks | Task urgency sections. | Section/card hybrid; border-top rather than contained card. |
| `task-item` | Tasks | Task row card. | Repeated list-row card pattern. |
| `reset-card` | Weekly Reset | Review cards. | Clear review-card primitive, but implemented only for reset. |
| `recap-card` | Weekly Reset | Full-width review summary. | Variant of `reset-card`. |

### Reused card styles

- Rounded corners are consistent in spirit: most modern cards use 1rem to 1.35rem radius.
- Bordered white/tinted surfaces recur across Home, Motivation, Child Workspace, Tasks, Lists, and Weekly Reset.
- Domain color tokens influence many surfaces through `--domain-border`, `--domain-tint`, and `--domain-accent`.
- Eyebrow labels and `widget-type` labels are the most reused header labeling mechanisms.

### One-off card styles

- Home summary cards use `#fffdf8`, `#eadfd1`, and a warm shadow before later domain overrides partially normalize them.
- Motivation cards use their own shared selector group for header/card/form styling.
- Child Workspace cards have their own member-color border and warm shadow system.
- Weekly Reset cards are flatter, smaller, and more utilitarian than Motivation/Child cards.
- Tasks combines contained panels, border-top groups, list rows, and page-level card behavior without one common task card primitive.

## Card Header Consistency

### What is consistent

- Most major cards include a short label above or near the title: `widget-type` on Home/Tasks/Lists and `eyebrow` on Home hero, Motivation, Child Workspace, and Weekly Reset.
- Home summary cards share an explicit `CardHeader` shape: title, optional meta, and right-side action text.
- Weekly Reset cards consistently use `reset-card-heading` with title on the left and status/count on the right.
- Motivation and Child Workspace use emotional labels such as “Family goal,” “Personal goals,” “Today,” and “This Week” consistently within their own surfaces.

### What is inconsistent

- There is no shared card header component beyond Home’s local `CardHeader` function.
- Header title levels vary by surface (`h2`, `h3`, `h4`) based on local page structure rather than card role taxonomy.
- Actions appear as right-side text pills on Home, buttons in Weekly Reset rows, header-adjacent buttons in Motivation sections, and disclosure summaries in Lists.
- Meta/count placement differs: Home uses header meta/action, Lists uses a header paragraph count, Tasks uses primary action buttons above card sections, Weekly Reset uses heading spans, and Child cards often place status in body copy.

### Assessment

Card headers are **moderately consistent visually** but **weakly consistent architecturally**. The same concepts recur, but they are not expressed through a shared `CardHeader`/`CardMeta`/`CardActions` structure.

## Spacing System Review

### Internal padding

- Common card padding clusters around `0.8rem` and `1rem`.
- Home summary cards and child progress cards use `1rem` padding.
- Motivation and Weekly Reset use denser `0.8rem` padding after compaction.
- Task templates use `1rem`; task rows use `0.85rem`; child nested cards use `0.75rem` to `0.85rem`.

### Card margins and gaps

- Major page sections commonly use `gap: 0.75rem` or `gap: 1rem`.
- Home summary grid uses `0.75rem`, Motivation page uses `0.75rem`, Weekly Reset page/grid uses `0.75rem`, and Child Workspace uses `1rem`.
- Tasks is denser in section stacking because `task-group` relies on border-top and internal padding instead of contained card gaps.

### Density comparison

| Page | Density | Rationale |
| --- | --- | --- |
| Home | Moderate/dense | Compact summary grid; cards are small but readable. |
| Tasks | Dense | Execution-first forms, task rows, secondary stack, review drawer, and border-top groups create the densest surface. |
| Lists | Moderate | Widget-card shell plus list sections; list rows are compact. |
| Motivation | Moderate | Compacted overview, but emotional cards and assets increase visual volume. |
| Child Workspace | Spacious/emotional | Larger assets, hero, and child-friendly cards create more breathing room. |
| Weekly Reset | Dense/moderate | Review grid is compact and efficient after explanation compaction. |

### Assessment

Spacing is **moderate**. The system uses a recognizable scale (`0.75rem`, `0.8rem`, `1rem`), but those values are applied directly per component instead of through named spacing/card density tokens.

## Card Hierarchy Review

### Home

Home has the clearest overview-card hierarchy. The date hero, family strip, quick capture, and summary grid have different roles. Summary cards behave consistently with shared header/action/list patterns.

### Tasks

Tasks is structurally correct for execution-first use, but visually less card-coherent. The main page shell acts as the container, task setup/templates are panels, task groups are section dividers, and task items are row cards. Weekly Reset embedded inside Tasks uses another card style.

### Lists

Lists still relies on the legacy `widget-card` language. It is coherent as a widget, but it does not match the newer Home summary or Review card languages as strongly.

### Motivation

Motivation has a strong internal hierarchy: family goal as primary, personal goals as secondary, celebration/memories as emotional detail. It uses a warmer, more decorated card family than Tasks/Weekly Reset. This difference is mostly intentional, but implementation is separate.

### Child Workspace

Child Workspace intentionally uses a more emotional and asset-forward language. Primary cards are identifiable, especially the hero/today/progress areas. It is related to Motivation but more playful and spacious.

### Weekly Reset

Weekly Reset has a coherent review-card hierarchy: hero, grid cards, rows, and recap. It is one of the clearest candidates for a shared `ReviewCard` variant.

### Assessment

Hierarchy is **strong at the page level** and **moderate at the system level**. Important cards are usually identifiable, but the visual treatment of “primary,” “summary,” “detail,” and “review” is not standardized across pages.

## Action Pattern Review

### Buttons and primary actions

- Home uses compact quick-capture action buttons and summary card right-side action text such as “Open.”
- Tasks places primary page actions near the top and task actions inside each row.
- Lists exposes add action near the top, management actions inside `details`, and per-item actions beside each item.
- Motivation uses `secondary-action` buttons for edit/add/detail access and compact variants for lower-priority actions.
- Child Workspace is mostly read-oriented for children, with parent/admin actions separated into Parent Mode.
- Weekly Reset puts review actions inside each review row.

### Edit/create/review placement

- Create actions are mostly top-of-card/top-of-page on Home, Tasks, Lists, and Motivation.
- Edit/manage actions vary: Motivation uses visible buttons; Lists hides management behind `details`; Child Workspace hides parent administration behind mode switching; Weekly Reset presents review decisions inline.
- Expand/collapse patterns exist in Tasks Weekly Reset, Lists settings/details, and Child detail disclosures, but they are not visually unified.

### Assessment

Action patterns are **moderate**. Placement generally follows user intent, but card-level action architecture is inconsistent. A shared distinction between `CardPrimaryAction`, `CardSecondaryActions`, `InlineRowActions`, and `DisclosureActions` would reduce fragmentation.

## Visual Weight Review

### Card height and density

- Home cards are compact summary containers.
- Tasks and Weekly Reset are dense because they optimize execution/review.
- Motivation and Child Workspace use larger emotional cards and assets.
- Lists is compact but less visually rich because it remains tied to the older widget shell.

### Decorative elements and assets

- Motivation and Child Workspace use semantic icon/assets and warmer emotional treatments.
- Home Motivation tile also uses celebration surfaces, helping connect Home and Motivation.
- Weekly Reset includes semantic icons in recap rows but remains utilitarian.
- Tasks and Lists are mostly functional, with minimal decoration.

### Color, borders, shadows

- Domain tokens give a shared product palette.
- Shadows are inconsistent: Home summary and Child/Motivation cards use noticeable soft shadows; Weekly Reset and Lists are flatter; Tasks panels are very light.
- Borders are generally present but vary in opacity, token usage, and color source.

### Do emotional pages use a different card language?

Yes. Motivation and Child Workspace use a more emotional card language with assets, warmer shadows, member/domain colors, and celebratory nested cards. This is largely intentional and product-appropriate, but it currently depends on specialized card classes rather than an explicit `EmotionalCard` or `CelebrationCard` variant. Because Home Motivation uses related patterns, the difference still feels like one product rather than a separate app.

## Card System Fragmentation

### Critical inconsistencies

None. There is no evidence that pages feel like completely separate products or that card styles break major information architecture.

### Major inconsistencies

1. **Duplicate base card shells.** `widget-card`, `home-summary-card`, `family-goal-card`, `individual-goal-card`, `child-progress-card`, `task-templates-panel`, and `reset-card` all encode similar surface rules independently.
2. **No shared card header architecture.** Home, Weekly Reset, Lists, Motivation, Tasks, and Child Workspace each define header/action/meta placement differently.
3. **Review-card and summary-card variants are not reusable.** Weekly Reset has a clear review pattern and Home has a clear summary pattern, but neither is generalized for other pages.
4. **Legacy Lists card language lags behind newer pages.** Lists uses `widget-card` and functional list rows while Home/Tasks/Motivation/Child/Reset have moved toward more intentional page-specific cards.
5. **Action surfaces are inconsistent.** Buttons, links, pill text, inline row actions, disclosure summaries, and mode switches solve similar card action problems differently.

### Minor inconsistencies

1. Padding varies between `0.8rem`, `0.85rem`, and `1rem` without named density rules.
2. Border radius varies between `0.875rem`, `1rem`, `1.25rem`, `1.35rem`, `18px`, and `24px`.
3. Shadows vary from none to warm large shadows without explicit elevation tokens.
4. Eyebrow labels and `widget-type` labels overlap semantically.
5. Card title sizes are locally chosen rather than tied to card variants.

## Consolidation Opportunities

### Recommended merges

1. **Shared `Card` foundation**
   - Merge base surface properties: background, border, radius, shadow/elevation, padding, and optional domain/member tint.
   - Preserve variants rather than forcing all cards to look identical.

2. **Shared `SummaryCard`**
   - Start from Home’s summary cards.
   - Applicable to Home Agenda/Tasks/Motivation/Lists and future overview panels on Tasks, Lists, Motivation, and Child Workspace.

3. **Shared `ReviewCard`**
   - Start from Weekly Reset `reset-card` and `reset-card-heading`.
   - Applicable to Weekly Reset and task review/someday review surfaces.

4. **Shared `DetailCard`**
   - Start from Motivation individual goal cards and child progress cards.
   - Applicable to personal goals, child goals, detail panels, and memory cards.

5. **Shared `CardHeader`**
   - Normalize label, title, subtitle/meta, and action slot placement.
   - Allow variants: compact, review, emotional, dashboard.

6. **Shared `InlineItemCard`**
   - Normalize task rows, shopping rows, reset rows, child task rows, and possibly helpful moment rows.
   - Preserve domain-specific content while aligning padding, radius, and action placement.

### Not recommended yet

- Do not merge emotional assets out of Motivation/Child Workspace. Their richer visual weight appears intentional and should become an explicit variant, not be flattened.
- Do not make every card the same height. Home dashboard, Tasks execution, and Weekly Reset review have different content density needs.
- Do not prioritize color cleanup before card primitives; color is already partially governed by domain tokens.

## Design System Readiness

### One card system: **Moderate**

HomeOps has a recognizable card family, but it is implemented through multiple competing local classes. The design intent is converging, but the architecture is not yet consolidated.

### One spacing system: **Moderate**

Most pages use a small spacing vocabulary around `0.75rem` and `1rem`. However, there are no explicit density tokens or shared card spacing contracts, and Tasks/Weekly Reset are noticeably denser than Child Workspace/Motivation.

### One interaction pattern: **Weak to Moderate**

Actions usually appear where users need them, but action architecture differs substantially by page. The product needs shared card action slots and disclosure/action variants more than it needs a visual redesign.

### Overall readiness: **Moderate**

The product is ready for card-system consolidation because the page-level patterns are now stable enough to abstract. It is not ready to freeze the design system as-is because current consistency relies on repeated CSS conventions rather than reusable primitives.

## Recommended Next Step

**A. Card System Consolidation**

Rationale:

- The remaining inconsistency is structural: too many classes encode the same card concepts independently.
- Color tokens already exist and are used broadly enough that color cleanup would be a secondary refinement.
- Typography inconsistencies exist, but most stem from missing card header primitives rather than a separate typography failure.
- “No major card work needed” is not supported because major duplication remains across Home, Motivation, Child Workspace, Tasks, Lists, and Weekly Reset.

Recommended first consolidation slice:

1. Define card taxonomy and primitives only: `Card`, `CardHeader`, `SummaryCard`, `ReviewCard`, `DetailCard`, `InlineItemCard`.
2. Do not redesign pages visually in the first slice.
3. Start with non-emotional cards first: Home summary cards, Weekly Reset reset cards, and Tasks review/task panels.
4. Then adapt Lists from `widget-card` into the same system.
5. Finally map Motivation and Child Workspace to emotional/detail variants while preserving assets and warmth.

## Next Prompt Context

Use this context for the next implementation prompt:

- HomeOps currently has a moderately coherent visual card family but not one coherent card architecture.
- Do not flatten emotional Motivation and Child Workspace cards; convert them into explicit variants.
- Highest-value next work is Card System Consolidation, not color cleanup or typography review.
- Initial implementation should be a narrow design-system slice, preferably creating shared card primitives and migrating a small set of low-risk cards.
- Suggested first migration targets: Home `home-summary-card` + local `CardHeader`, Weekly Reset `reset-card` + `reset-card-heading`, and optionally Tasks `task-templates-panel`/review panels.
- Keep visual output intentionally equivalent unless a small normalization is required by the shared primitive.
