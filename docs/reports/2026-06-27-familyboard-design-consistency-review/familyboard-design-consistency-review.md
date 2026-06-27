# FamilyBoard Design Consistency Review

## Executive Summary

- **Overall FamilyBoard design maturity:** 6/10.
- **Overall product cohesion:** Partially cohesive. FamilyBoard has a recognizable shared product shell, shared workspace navigation, pastel domain colors, rounded panels, soft shadows, and common header language on most workspace pages. The main cohesion gap is that pages are at different levels of visual maturity.
- **Primary conclusion:** The product should prioritize a shared design system before continuing individual page optimization. Motivation and Home behave most like dashboards, while Agenda, Tasks, and Shopping still read more like document or single-card work areas.

## Page Scorecard

### Home

- **Design score:** 7/10
- **Dashboard score:** 8/10
- **FamilyBoard identity score:** 8/10

**Strengths**

- Strong dashboard composition with date/time hero and four summary cards.
- Good visual balance at both reviewed desktop sizes.
- No vertical scrolling observed at either 1366×768 or 1920×1080.
- Clear two-column summary-card rhythm.
- Feels like the natural FamilyBoard landing dashboard.

**Weaknesses**

- Does not use the same visible page header treatment as Agenda, Tasks, Shopping, and Motivation.
- Width is constrained compared with Motivation, which expands wider on large screens.
- Summary card actions use compact icon-only circular buttons, while other pages use text buttons or native-looking controls.
- Empty/error states dominated the observed rendering because several summaries could not load.

### Agenda

- **Design score:** 5/10
- **Dashboard score:** 4/10
- **FamilyBoard identity score:** 6/10

**Strengths**

- Uses the shared workspace shell, navigation, page header, rounded panel, and domain color.
- Clear event grouping by date.
- Week/Months toggle fits the broader rounded control language.

**Weaknesses**

- Required vertical scrolling at 1366×768 during the completed review.
- Behaves more like a long agenda document/list than a dashboard.
- “Add household event” appeared as a full-width rectangular native-style button.
- Source filters looked form-like and utilitarian compared with the rest of the product.
- Single large card lacked secondary dashboard zones or summary tiles.

### Tasks

- **Design score:** 6/10
- **Dashboard score:** 5/10
- **FamilyBoard identity score:** 7/10

**Strengths**

- Consistent workspace header and teal domain color.
- Clear empty-state copy and primary action.
- Large rounded panel fits the FamilyBoard visual language.
- Main “Add a family task” action appeared touch-friendly.
- No scrolling observed at either reviewed desktop size.

**Weaknesses**

- Very low information density with significant unused vertical space.
- Bottom actions appeared as plain rectangular native-style buttons.
- Reads as an empty-state management card rather than a complete dashboard.
- Does not yet provide multiple dashboard zones such as today, upcoming, assigned, blocked, or reset prompts.
- Visual hierarchy is simple but shallow.

### Shopping

- **Design score:** 5/10
- **Dashboard score:** 4/10
- **FamilyBoard identity score:** 6/10

**Strengths**

- Uses shared workspace shell, domain color, rounded panel, and page header.
- Clear distinction between primary Shopping content and “Other Lists.”
- No scrolling observed at either reviewed desktop size.
- Yellow/orange domain tint is consistent with navigation accent.

**Weaknesses**

- Sparse layout with large unused vertical space.
- Single-card composition feels more like a document or management page than a dashboard.
- “Other Lists” layout reads horizontally and table-like rather than card/dashboard-like.
- No visible primary action was present in the inspected empty/error state.
- Page title and card title repeat, weakening hierarchy.

### Motivation

- **Design score:** 8/10
- **Dashboard score:** 8/10
- **FamilyBoard identity score:** 7/10

**Strengths**

- Most mature dashboard composition among the reviewed pages.
- Uses multiple dashboard zones: family goal, appreciations, celebrations, and stats.
- Good density for desktop.
- Makes better use of wide screens than the other pages.
- Buttons are generally rounded and visually integrated with card design.

**Weaknesses**

- Uses a wider page layout than other pages, making it feel more advanced but also somewhat separate.
- Observed Motivation copy included Dutch text while the rest of the app was English.
- Some content/actions appeared tightly placed near the bottom of the 1366×768 viewport.
- Its higher polish exposes inconsistency in older pages.

## Cross-Page Consistency

### Headers

Most non-Home pages use a common workspace header pattern: position pill, page title, and supporting description. Home differs by suppressing the visible workspace header and relying on its dashboard hero instead. This is acceptable for a landing dashboard, but it creates a rhythm break between Home and the rest of the product. Agenda and Shopping also repeat page titles inside their primary cards, which weakens hierarchy.

### Cards

Cards share rounded corners, light borders, and soft shadows, but card composition is inconsistent. Home uses summary cards, Agenda uses one long list card, Tasks uses one sparse task card, Shopping uses one sparse list-management card, and Motivation uses a mature dashboard grid. The visual family is recognizable, but the card grammar is not yet systematized.

### Buttons

Button styling is one of the most visible inconsistencies. Workspace navigation buttons are cohesive, but page-level actions vary significantly. Home uses circular icon buttons, Motivation uses rounded action pills, Agenda and Tasks include native-looking rectangular buttons, and Shopping had no prominent action visible in the reviewed state. Primary, secondary, utility, and icon actions need a shared treatment.

### Typography

The app generally uses a consistent sans-serif voice, compact workspace headers, bold titles, and uppercase eyebrow labels. However, Motivation has the strongest internal hierarchy, Home has strong card titles but no visible page title, Agenda reads utilitarian, and Shopping’s “Other Lists” section reads more like document/table typography than dashboard typography.

### Colours

FamilyBoard has a clear pastel domain-color strategy. Navigation reinforces domain identity, and warm surfaces are recurring. The inconsistency is intensity: Motivation’s warm/orange treatment is more immersive, Agenda’s purple is mostly shell-level, Tasks uses teal lightly, and Shopping’s yellow/orange accent is underused. Home combines multiple domain signals but often uses purple action icons, which weakens domain-specific clarity.

### Icons

Icon usage is not yet fully standardized. Home uses large circular plus/arrow action icons, Motivation uses more illustrative and polished icons, Agenda uses source dots, and Settings uses a small gear treatment. Sizes, emphasis, and decorative versus functional roles vary across pages.

### Illustrations

Motivation is the only reviewed page where illustration-style assets were visibly part of the dashboard composition. Home, Agenda, Tasks, and Shopping relied mostly on text, cards, controls, and empty states. Illustration usage is therefore not yet a FamilyBoard-wide system.

### Navigation

Navigation is one of the strongest cohesive elements. Primary workspace buttons are consistently present, domain-colored, and rhythmically spaced. Settings remains separated as an administration action. Motivation’s wider layout makes the navigation and shell feel more expansive than other pages on large desktops.

### Spacing

Shell spacing is compact and consistent, but page spacing varies. Motivation uses a wider and denser layout, Home uses a balanced compact dashboard, Agenda scrolls at 1366×768, and Tasks/Shopping leave large empty lower areas. The result is inconsistent perceived density.

### Visual Hierarchy

Visual hierarchy is strongest in Motivation and Home. Agenda is list-first, Shopping is sparse and document-like, and Tasks has a clear empty state but limited dashboard hierarchy. A shared hierarchy system would help align section labels, titles, metadata, actions, and empty states.

## Reusable Design System Opportunities

1. **WorkspaceHeader**
   - **Priority:** High
   - Standardize visible header behavior, position pill, title, supporting text, and title duplication rules.

2. **DashboardCard**
   - **Priority:** High
   - Standardize card radius, border, padding, elevation, heading area, action placement, loading state, empty state, and error state.

3. **FamilyButton**
   - **Priority:** High
   - Define primary, secondary, ghost, icon, destructive, and utility actions.

4. **DashboardGrid**
   - **Priority:** High
   - Provide consistent dashboard layouts for two-column, four-zone, compact, and responsive compositions.

5. **SectionHeader**
   - **Priority:** High
   - Normalize eyebrow, title, supporting text, metadata, and right-aligned action patterns.

6. **EmptyState**
   - **Priority:** High
   - Standardize unavailable, empty, loading, and error states with optional illustration and action.

7. **StatTile**
   - **Priority:** Medium-high
   - Reuse Motivation’s stat-like patterns across Home, Tasks, Shopping, and Agenda where appropriate.

8. **ActionCluster**
   - **Priority:** Medium-high
   - Standardize grouped action placement in headers, cards, and footer rows.

9. **IllustrationContainer**
   - **Priority:** Medium
   - Normalize size, placement, role, and spacing for decorative or informative illustration assets.

10. **IconButton**
    - **Priority:** Medium
    - Align circular icon buttons, compact controls, settings, close buttons, and Motivation action icons.

## Top 20 UX Improvements

1. **Priority:** P1
   - **Improvement:** Standardize all button treatments.
   - **Affected pages:** Home, Agenda, Tasks, Shopping, Motivation
   - **Expected impact:** High polish and action clarity.
   - **Design-system or local:** Design system.

2. **Priority:** P1
   - **Improvement:** Create a shared DashboardCard pattern.
   - **Affected pages:** All reviewed pages
   - **Expected impact:** Stronger visual cohesion and reusable card grammar.
   - **Design-system or local:** Design system.

3. **Priority:** P1
   - **Improvement:** Resolve Motivation’s width exception or intentionally extend wider dashboard behavior across the product.
   - **Affected pages:** Home, Motivation, shell-level dashboard pages
   - **Expected impact:** Reduces the impression that Motivation is a separate visual system.
   - **Design-system or local:** Design system.

4. **Priority:** P1
   - **Improvement:** Convert Agenda from a document list into a dashboard composition.
   - **Affected pages:** Agenda
   - **Expected impact:** Makes Agenda feel more like part of FamilyBoard.
   - **Design-system or local:** Local composition using shared components.

5. **Priority:** P1
   - **Improvement:** Add dashboard zones to Shopping.
   - **Affected pages:** Shopping
   - **Expected impact:** Reduces sparse document feel.
   - **Design-system or local:** Local composition using shared components.

6. **Priority:** P1
   - **Improvement:** Add dashboard zones to Tasks.
   - **Affected pages:** Tasks
   - **Expected impact:** Makes Tasks feel more like a family operations dashboard.
   - **Design-system or local:** Local composition using shared components.

7. **Priority:** P1
   - **Improvement:** Standardize empty, error, unavailable, and loading states.
   - **Affected pages:** All reviewed pages
   - **Expected impact:** High; several observed states were unavailable or could not load.
   - **Design-system or local:** Design system.

8. **Priority:** P2
   - **Improvement:** Standardize visible page header behavior.
   - **Affected pages:** Home and all non-Home pages
   - **Expected impact:** More predictable page rhythm.
   - **Design-system or local:** Design system.

9. **Priority:** P2
   - **Improvement:** Remove duplicated page/card title hierarchy.
   - **Affected pages:** Agenda, Shopping
   - **Expected impact:** Cleaner hierarchy.
   - **Design-system or local:** Local, guided by SectionHeader.

10. **Priority:** P2
    - **Improvement:** Normalize card internal spacing.
    - **Affected pages:** All reviewed pages
    - **Expected impact:** Improved perceived product maturity.
    - **Design-system or local:** Design system.

11. **Priority:** P2
    - **Improvement:** Define primary versus secondary action placement.
    - **Affected pages:** Home, Agenda, Tasks, Motivation
    - **Expected impact:** Clearer next steps.
    - **Design-system or local:** Design system.

12. **Priority:** P2
    - **Improvement:** Normalize icon sizes.
    - **Affected pages:** Home, Motivation, shell navigation/settings
    - **Expected impact:** Reduced visual noise.
    - **Design-system or local:** Design system.

13. **Priority:** P2
    - **Improvement:** Make Agenda controls less form-like.
    - **Affected pages:** Agenda
    - **Expected impact:** More polished dashboard feel.
    - **Design-system or local:** Local, using shared controls.

14. **Priority:** P2
    - **Improvement:** Standardize section eyebrow usage.
    - **Affected pages:** All reviewed pages
    - **Expected impact:** Stronger hierarchy and consistency.
    - **Design-system or local:** Design system.

15. **Priority:** P2
    - **Improvement:** Balance vertical density on Tasks.
    - **Affected pages:** Tasks
    - **Expected impact:** Reduces empty-space impression.
    - **Design-system or local:** Local.

16. **Priority:** P2
    - **Improvement:** Balance vertical density on Shopping.
    - **Affected pages:** Shopping
    - **Expected impact:** Reduces empty-space impression.
    - **Design-system or local:** Local.

17. **Priority:** P3
    - **Improvement:** Define illustration usage rules.
    - **Affected pages:** Motivation first, then empty states across all pages
    - **Expected impact:** Stronger FamilyBoard identity.
    - **Design-system or local:** Design system.

18. **Priority:** P3
    - **Improvement:** Align domain color intensity across pages.
    - **Affected pages:** Agenda, Tasks, Shopping, Motivation
    - **Expected impact:** Makes domains feel equally designed.
    - **Design-system or local:** Design system.

19. **Priority:** P3
    - **Improvement:** Revisit Home summary icon color semantics.
    - **Affected pages:** Home
    - **Expected impact:** Better domain clarity.
    - **Design-system or local:** Local or design system.

20. **Priority:** P3
    - **Improvement:** Normalize responsive dashboard behavior.
    - **Affected pages:** All reviewed pages
    - **Expected impact:** More predictable behavior across desktop and tablet widths.
    - **Design-system or local:** Design system.

## Product Readiness

### Internal prototype

**Assessment:** Ready.

**Justification:** The product has a coherent shell, recognizable domain navigation, and enough dashboard behavior to support internal review and iteration.

### Friends & Family beta

**Assessment:** Almost ready, but design-system cleanup should happen first.

**Justification:** The experience is understandable, but Agenda, Shopping, and Tasks are visibly less polished than Home and Motivation. Native-looking actions and sparse document-like pages would be noticeable to family testers.

### Public beta

**Assessment:** Not ready.

**Justification:** The visual maturity is uneven. Motivation appears significantly more mature than several other pages, and the observed mixed-language Motivation content would undermine public-facing trust.

### Production

**Assessment:** Not ready.

**Justification:** Production readiness requires consistent page composition, standardized actions, polished empty/error states, and unified responsive behavior.

## Final Recommendation

**Design System First**

The highest-impact issues are cross-page inconsistencies rather than isolated page defects. Continuing individual page improvements would likely widen the maturity gap between Motivation/Home and Agenda/Tasks/Shopping. A design-system pass should define shared headers, cards, buttons, dashboard grids, section headers, empty states, icons, and illustration rules before further feature-page polish.

## Validation

- **Preflight result:** `dotnet --version` returned `10.0.301` after setting `DOTNET_CLI_HOME=/tmp/dotnet` and adding `$HOME/.dotnet/tools` to `PATH`.
- **Browser validation:** Reused from the completed FamilyBoard Design Consistency Review. Browser validation was not repeated for this documentation-only follow-up because the required findings were already captured.
- **Viewports from completed review:** 1366×768 and 1920×1080.
- **Completed-review browser findings reused:**
  - Home: no scroll at 1366×768 or 1920×1080; dashboard behavior; balanced compact layout.
  - Agenda: scroll at 1366×768 with page height 828px; no scroll at 1920×1080; document/list behavior.
  - Tasks: no scroll at either viewport; sparse single-card workspace behavior.
  - Shopping: no scroll at either viewport; sparse document/list workspace behavior.
  - Motivation: no scroll at either viewport; dashboard behavior; strong visual balance with tight lower content at 1366×768.
- **Markdown formatting:** Validated by inspecting the generated Markdown file structure and headings.
- **Report completeness:** Validated against the requested report sections.
- **`git diff --check`:** Passed.
- **Binary artifact confirmation:** No screenshots or binary artifacts were added.

## Modified Files

- `docs/reports/2026-06-27-familyboard-design-consistency-review/familyboard-design-consistency-review.md`

## Binary Artifact Check

- No binary files committed.
- No screenshots committed.
- Temporary screenshots from the previous review were already removed and no new screenshots were created for this documentation-only follow-up.
- No PNG, JPG, JPEG, GIF, WEBP, or PDF files were added.
