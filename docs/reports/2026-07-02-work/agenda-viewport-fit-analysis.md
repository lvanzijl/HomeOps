# Agenda Viewport-Fit Analysis

## Summary

This is the mandatory Viewport-First Workflow analysis for the Agenda page only. No implementation changes were made.

The current Agenda page is functionally rich but not viewport-first. It renders a full Agenda widget inside the shared workspace shell and relies on the shared `.workspace-page-body` internal scroll region when the widget content exceeds the reserved panel height. The root document is protected from page scrolling, but the Agenda page composition itself is not stable: mode content, selected-day content, list-group content, and responsive breakpoints can make the widget taller than the available page-body region.

Recommended direction: convert the Agenda page into a fixed-height dashboard shell with a compact command/filter band and one bounded content region per active mode. Month, Week, and List should each fit inside that reserved region and handle excess events internally with limits, summaries, `+N more` affordances, or internal scrolling inside the relevant card/pane rather than by growing the page.

## Scope

In scope:

- Agenda page viewport-fit analysis only.
- Current React component hierarchy, CSS layout, spacing, sizing, responsive behavior, and overflow behavior.
- Current visible Agenda sections: workspace page header, widget header, source selector, Month view, selected-day panel, Week view, List view, loading/error states, and event dialog overlay.
- Long-term dashboard composition recommendation that preserves existing functionality.

Out of scope:

- Source-code, CSS, backend, API, schema, migration, seed, screenshot, binary, or fixture changes.
- Redesign of Home, Tasks, Shopping, Motivation, Settings, or unrelated pages.
- New Agenda product features beyond preserving current Month/Week/List, filtering, create/edit/delete, and event visibility behavior.

## Current layout assessment

### Shell and page composition

The application shell uses a fixed viewport-height boundary: `html`, `body`, and `#root` are `height: 100%` with `overflow: hidden`; `.app-shell` uses `height: var(--fb-viewport-height)` and `overflow: hidden`; `.workspace-shell` reserves navigation above a `minmax(0, 1fr)` panel. The workspace panel itself is fixed within the viewport and hides overflow.

Inside that panel, non-Home pages render a page header followed by `.workspace-page-body`. The page body currently has `overflow: auto`, so it is the shared internal scroll region for page content that does not fit.

Agenda page rendering then adds:

1. Workspace page header: position label, `Agenda`, and page description.
2. `.workspace-page-body` shared scroll container.
3. `.widget-host` for the Agenda widget.
4. One `.widget-card.agenda-widget` containing:
   - Agenda widget header and Month/Week/List toggle.
   - Loading and error status rows when applicable.
   - Event dialog overlay when open.
   - Source selector fieldset.
   - Active workspace mode: Month, Week, or List.

### Current mode composition

#### Month mode

Month mode is a two-column grid:

- Left: month grid card with month title, weekday row, and 42 day cells.
- Right: selected-day panel with selected-day header, add-event action, and the selected day event list or empty state.

The month grid day cells use `min-height: clamp(5.4rem, 9vh, 7.4rem)`. At common laptop heights this alone produces a tall calendar grid before counting widget header, source selector, card padding, page header, nav, gaps, and panel padding. The selected-day panel has its own `max-height: calc(100vh - 10rem)` and `overflow: auto`, but the month grid column does not have an equivalent fixed available-height calculation.

#### Week mode

Week mode renders a week card with a header/navigation row, optional empty-state block, and a seven-card day grid. The week workspace sets `min-height: calc(100vh - 12.5rem)`, and each day card sets `min-height: clamp(18rem, 50vh, 31rem)`. The seven-column desktop grid can fit horizontally on large desktops, but at narrower desktop/laptop widths it becomes four columns, and at mobile width one column. Those breakpoints make the grid taller structurally, which conflicts with the no-primary-page-scroll rule.

Week events are already limited per day, but the day-card minimum height and multi-row responsive grid make the view taller than a stable dashboard region.

#### List mode

List mode renders a list workspace card with a header and timeline groups. On wide screens the timeline uses four columns: one wider first group and three secondary groups. At max-width 1200px it becomes two columns, and at max-width 860px it becomes one column. Event lists inside each timeline group are not capped in the List view, so a populated group can make its timeline card and the entire list workspace taller.

### Information hierarchy

The current hierarchy over-explains the page vertically:

- The workspace page header says the page is Agenda.
- The widget header repeats `Familieplanning`, `Agenda`, and a helper sentence.
- The source selector occupies a full horizontal row below the widget header.
- Each mode then has another title/header.

The Agenda product value is the planning surface itself. The page currently gives too much reserved vertical space to labels and helper copy compared with the actual calendar/list content.

## Root causes of viewport overflow

1. **Shared scroll dependency:** The Agenda page content is placed in `.workspace-page-body`, whose `overflow: auto` becomes the fallback for oversized primary-page content. That prevents document scrolling but still violates the requirement that the primary page composition itself fit the reserved viewport.
2. **Unbounded widget-card growth:** `.agenda-widget` has no page-specific fixed-height contract such as `height: 100%`, `grid-template-rows`, and `min-height: 0` for mode content. The active mode contributes natural height to the widget.
3. **Large cumulative chrome:** Workspace header, widget header, source selector, mode header, card padding, gaps, borders, and shadows stack vertically before the useful planning region starts.
4. **Month grid cell minimums:** Six calendar rows with `min-height: clamp(5.4rem, 9vh, 7.4rem)` exceed available laptop height once all surrounding chrome is included.
5. **Week view double height pressure:** The week workspace has a viewport-derived minimum height, while each day card also has a large viewport-derived minimum height. This can overshoot the actual panel body height because the calculation does not subtract the real navigation, panel padding, workspace header, widget header, filter row, and mode header.
6. **Responsive breakpoints increase vertical footprint:** Week and List switch from wide grids to multi-row or single-column structures. That may be appropriate for document pages but not for fixed dashboard pages.
7. **List content is unbounded:** Timeline groups render all events in their group. More events increase group height and then the page-body scroll region handles it.
8. **Selected-day panel uses viewport math instead of region math:** The selected-day panel has internal scrolling, but its `max-height: calc(100vh - 10rem)` is independent of the actual workspace-panel/page-body height and does not reserve space for all Agenda chrome.
9. **Filtering row is full-height and always expanded:** Source filters are primary controls but secondary reading content. The full fieldset with checkbox labels consumes vertical space even when users are not changing filters.
10. **Duplicated labels:** Workspace and widget headers both identify the page and reduce the planning surface area.

## Section-by-section evaluation

| Section | Current role | Priority | Always visible? | Height strategy | Can be summarized / limited / compacted? | Recommendation |
| --- | --- | --- | --- | --- | --- | --- |
| Global navigation | Page switching | Primary shell | Yes | Fixed by shell | Can compact at small widths | Keep as shell-owned; Agenda must fit below it. |
| Workspace page header | Page title/description | Secondary for Agenda once active | Prefer visible but compact | Fixed compact band | Yes: remove/reduce helper description for Agenda-specific layout | Keep a compact page identity row or let Agenda dashboard absorb title; do not spend tall header space. |
| Widget header | Agenda label, helper copy, mode toggle | Mixed: mode toggle primary; repeated title secondary | Mode toggle yes; repeated title no | Fixed command band | Yes: merge with page header and filters | Replace with a single compact Agenda command bar. |
| Loading status | Data state | Primary only while loading | Yes when loading | Fixed small row or inline status | Yes | Reserve a small status slot in command band; do not push content after load. |
| Error status | Data state | Primary when error exists | Yes when error exists | Fixed small row or inline alert | Yes | Use reserved alert/status row or overlay inside content region. |
| Source selector | Filter controls | Secondary controls | Available, but not necessarily expanded | Fixed compact control area | Yes: chips, dropdown/popover, horizontal scroll, collapsed details | Convert to compact filter chips or a bounded horizontal filter rail; never add vertical rows. |
| Month title | Current month context | Primary in Month mode | Yes | Fixed small row inside content header | Yes | Keep compact; navigation can be added later only if existing behavior requires it. |
| Month weekday row | Calendar orientation | Primary in Month mode | Yes | Fixed one row | Already compact | Keep. |
| Month day cells | Month planning overview | Primary | Yes | Flexible within reserved grid | Yes: event indicators already limited; reduce minimums | Use a fixed grid region where six rows share available height; no natural page growth. |
| Month event indicators | Density summary | Primary summary | Yes within cells | Fixed cap | Already limited to 3 + overflow | Keep 2-3 indicators plus overflow; do not show full events in cells. |
| Selected-day panel | Detailed day events and add action | Primary supporting detail | Yes on desktop | Fixed side panel | Yes: cap visible events then internal scroll or +N | Keep visible on desktop; internally scroll only event list, not the page. |
| Selected-day add button | Create event | Primary action | Yes | Fixed in panel header | Can compact label | Keep visible, possibly icon + short label on laptop. |
| Selected-day event list | Details for selected day | Primary but data-variable | Yes for top events | Flexible bounded | Yes: list can internally scroll after visible rows | Make list the scrollable child inside the side panel. |
| Event cards | Event detail/actions | Primary data | Top cards yes | Compact rows | Yes: reduce icon/action footprint | Use compact card density in bounded regions; actions visible for editable events. |
| Event dialog | Create/edit workflow | Primary when open | Yes overlay | Overlay fixed to viewport | Current overlay independent of page height | Keep as overlay; ensure dialog internally handles small heights if needed. |
| Week header/navigation | Week context and navigation | Primary in Week mode | Yes | Fixed content header | Yes: shorter labels on smaller widths | Keep compact. |
| Week empty state | Empty feedback | Secondary | No, if space constrained | Bounded | Yes | Show small inline empty state or per-day quiet indicators; do not add a full block that pushes grid. |
| Week day cards | Week planning | Primary | Yes | Fixed grid rows/columns | Yes: cap events, denser cards | Use a bounded seven-day dashboard grid; at laptop widths prefer two-row layout rather than unbounded stacking. |
| Week per-day events | Details | Primary but variable | Top 1-2 visible | Bounded inside day card | Already limited; can reduce max on small height | Keep cap and `+N`; optionally internal scroll only inside day card if edit actions must remain reachable. |
| List header | Upcoming context | Primary in List mode | Yes | Fixed small row | Yes | Keep compact. |
| Timeline groups | Upcoming buckets | Primary in List mode | Yes as buckets | Fixed grid within content region | Yes: cap visible events per group; internal scroll group body | Keep groups visible but make each group a bounded panel. |
| Timeline group event lists | Variable details | Primary but data-variable | Top items visible | Internal group scroll | Yes | Cap initial visible rows and/or scroll inside each group. |

## Recommended dashboard composition

### Recommended layout: fixed Agenda dashboard with command band and bounded mode canvas

Use the existing Agenda functionality, but restructure the page around reserved regions:

```text
Workspace panel
└── Agenda dashboard page (height: 100%; min-height: 0; overflow: hidden)
    ├── Compact page/command band (fixed)
    │   ├── Title/context: Agenda
    │   ├── Mode segmented control: Maand / Week / Lijst
    │   ├── Primary action/status: add event/status/error summary where applicable
    │   └── Compact source filters: chips or bounded horizontal rail
    └── Mode canvas (minmax(0, 1fr); overflow: hidden)
        ├── Month canvas
        │   ├── Month grid card: 1fr main region, six fixed/equal calendar rows
        │   └── Selected-day panel: fixed width, internal event-list scroll
        ├── Week canvas
        │   ├── Compact week header/navigation
        │   └── Seven-day grid inside remaining height
        └── List canvas
            ├── Compact list header
            └── Timeline group grid with bounded group bodies
```

### Reserved regions and sizing strategy

- **Dashboard root:** fills `.workspace-page-body` and sets `overflow: hidden`; it must not rely on `.workspace-page-body` scrolling.
- **Command band:** fixed-height, approximately one compact row on desktop/laptop, with wrapping avoided. If filters cannot fit, they should scroll horizontally or collapse into a bounded control, not create another vertical row.
- **Mode canvas:** one `minmax(0, 1fr)` region. Every mode receives this bounded height.
- **Month canvas:** desktop/laptop two columns: `minmax(0, 1fr)` month grid and `clamp(17rem, 24vw, 22rem)` selected-day panel. Month grid rows should divide remaining calendar height instead of using viewport-based minimums. Selected-day event list scrolls internally.
- **Week canvas:** keep all seven days visible. Preferred desktop: seven columns only when width allows usable cards. Common laptop: a fixed two-row grid such as four days over three days, with rows sharing the available height and denser cards. Avoid one-column stacking for primary desktop/laptop use because it guarantees vertical overflow.
- **List canvas:** fixed timeline group grid. On wide desktop use four columns; common laptop can use two-by-two groups, each with an internal scrollable event-list body. If four groups are present, all buckets remain visible; individual event lists never change global height.

### Why this fits common desktop/laptop viewports

The recommended composition uses the viewport shell as the boundary and subtracts only fixed regions: navigation, panel padding, optional compact page identity/command band, and a compact mode header. The remaining mode canvas receives all available height. Calendar rows, week-day cards, selected-day panel, and list groups size from that region rather than from `100vh` guesses or content height.

On common desktop and laptop heights such as 768px, the layout can remain stable because:

- The Agenda header/filter controls do not stack into multiple rows.
- The Month grid has equal rows inside the available canvas, not six rows with independent `min-height` values.
- The selected-day panel scrolls only its event list.
- Week cards share fixed rows inside the available canvas and show capped event counts.
- List groups have fixed heights and internal overflow.

## Alternative compositions considered

### Alternative 1: Month-dominant planning board with drawer detail

Composition:

- Command band at top.
- Month grid occupies the full mode canvas width.
- Selected-day details open in a right drawer or bottom overlay when a day is selected.

Pros:

- Maximizes month readability.
- Removes side-panel width pressure.
- Strong for wall-display calendar scanning.

Cons:

- Selected-day details are no longer always visible on desktop.
- Add/edit workflows require an extra interaction or overlay state.
- Current Month page value includes immediate selected-day context, so hiding it weakens the existing experience.

Reason not preferred: it fits well, but it demotes selected-day detail too far. Families need the selected day and its actions visible while scanning a month.

### Alternative 2: Three-mode split dashboard always showing Month + Today + Upcoming

Composition:

- Top command band.
- Persistent three-panel dashboard: compact month, today/selected day, and upcoming list.
- Week and List become views inside side panels or tabs within the dashboard.

Pros:

- Strong dashboard hierarchy.
- Reduces mode switching.
- Keeps today/upcoming visible regardless of mode.

Cons:

- Changes the current information architecture more significantly.
- Month, Week, and List functionality would compete for one dashboard instead of preserving current mode-specific workflows.
- Risk of introducing new product behavior rather than preserving existing Agenda functionality.

Reason not preferred: it may be a stronger future product direction, but it is too broad for a viewport-fit implementation slice that should keep existing functionality.

### Alternative 3: Recommended bounded mode canvas

Composition:

- Compact command/filter band.
- Exactly one active mode in a fixed content canvas.
- Each mode handles its own overflow internally.

Pros:

- Preserves existing Month/Week/List mental model and functionality.
- Least disruptive to current code and tests.
- Directly satisfies the no-page-scroll rule.
- Provides clear region ownership for overflow.

Cons:

- Requires careful density tuning per mode.
- Week view at narrow widths needs a deliberate non-document responsive design.
- Some long event lists will require internal scrolling or visible-row limits.

Reason preferred: it fixes the viewport contract while preserving the current Agenda product model.

## Overflow strategy for every section

- **Workspace shell/navigation:** no Agenda-owned overflow; remains shell-owned and fixed.
- **Workspace page header / Agenda command band:** fixed height. If labels/actions do not fit, reduce helper copy, shorten labels, or move filters to horizontal chips/popover. Do not wrap into multiple vertical rows on desktop/laptop.
- **Loading/error status:** use reserved inline status area in the command band or fixed alert line. Long error text should truncate with accessible full text or wrap inside a bounded alert, not push the mode canvas down unpredictably.
- **Source filters:** use horizontal scrolling chips, compact dropdown/details, or max one-row wrapping with fixed row height. Additional source count should be summarized (`+N bronnen`) if necessary.
- **Month grid:** six calendar rows share available height. Event display remains indicators plus `+N`; no full event names in cells. Cell content clips gracefully if height is tight.
- **Selected-day panel:** panel height is exactly the mode canvas height. Header/action are fixed; event list area is `minmax(0, 1fr)` with internal `overflow: auto`. Empty state fits within the panel body.
- **Selected-day event cards:** show compact details; if many events exist, the panel list scrolls. Cards do not alter page height.
- **Week header/navigation:** fixed compact header. Button labels may shorten at laptop widths.
- **Week empty state:** reserve a small inline state or replace with per-day empty cards. It must not add a separate block that changes the week grid height.
- **Week day cards:** day cards are fixed within grid tracks. Show a limited number of event cards by height/width; use `+N more` for hidden events. If edit/delete access to hidden events is required, make the card body internally scrollable or route selection to List/selected detail without growing the page.
- **List header:** fixed compact header.
- **Timeline groups:** all group cards have bounded heights. Group event lists scroll internally or show top rows plus `+N more`.
- **Event dialog:** remains viewport overlay. Dialog body should scroll internally if the viewport is short; opening a dialog must not affect page layout height.

## Responsive strategy

The responsive strategy should reduce density before allowing vertical growth:

1. **Desktop wide:** command band plus Month two-column layout; Week seven columns; List four columns.
2. **Common laptop / medium width:** keep command band one row; Month remains two columns if width allows, otherwise selected-day panel can narrow. Week should switch to a fixed two-row grid (4+3) with denser event cards, not an unbounded document stack. List can switch to two-by-two bounded groups.
3. **Small width / tablet:** preserve fixed page boundary. Use horizontal navigation/chip rails, reduce paddings, hide secondary helper copy, and cap visible rows more aggressively. If single-column content is unavoidable, only the relevant component body should scroll internally; the primary page must still not use page-body scroll as the structural solution.
4. **Short viewport:** reduce calendar cell padding, event-card icon size, visible event rows, and helper copy. Month cells should stay equal-height within the canvas.

## Risks and trade-offs

- **Information density vs. calm design:** Fitting a full Agenda into 768px height requires tighter chrome and smaller event cards. The design must preserve FamilyBoard warmth while prioritizing dashboard density.
- **Discoverability of filters:** Compact filters save vertical space but can make source visibility less obvious. Use clear chip states and accessible labels.
- **Week readability:** A seven-day board in limited height may show fewer event details. The `+N more` indicator must be clear and actionable enough for families.
- **Internal scroll ergonomics:** Component-level scrolling is acceptable but must be limited to event bodies, not nested throughout the page. Too many nested scroll areas can feel busy.
- **Current tests may encode document-like behavior:** Implementation may require updating layout assumptions in tests without changing product functionality.
- **Viewport calculations must use container height:** Avoid replacing current `100vh` guesses with more `100vh` guesses. The implementation should use grid/flex `minmax(0, 1fr)` region sizing from the actual parent container.

## Recommendation for implementation

Implement a single Agenda viewport-fit slice after this analysis is accepted:

1. Make the Agenda page/widget root fill the available `.workspace-page-body` height and opt out of shared page-body scrolling for Agenda by using an Agenda-owned fixed grid with `overflow: hidden`.
2. Merge/reduce repeated page and widget header content into a compact command band with mode toggle, status, and compact source filters.
3. Convert Month, Week, and List modes to bounded canvases with `min-height: 0` and container-derived sizing.
4. Replace viewport-derived minimum heights in Agenda mode content with grid/flex tracks that fit the reserved content region.
5. Add internal overflow only to selected-day event lists, week day event bodies when necessary, and timeline group bodies.
6. Preserve existing create/edit/delete, filtering, Month/Week/List, event indicators, and event-source behavior.

## Validation performed

- Inspected repository instructions in `AGENTS.md` and `.github/copilot-instructions.md`.
- Configured repository-local .NET, NuGet, and npm environment locations before validation-capable commands.
- Inspected the Agenda implementation and shared workspace shell/CSS.
- Confirmed this analysis added documentation only.
- Ran targeted Agenda component tests after creating the report.
- Ran Markdown/diff checks after creating the report.

## Files inspected

- `AGENTS.md`
- `.github/copilot-instructions.md`
- `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx`
- `src/HomeOps.Client/src/workspaces/workspaceLayout.ts`
- `src/HomeOps.Client/src/workspaces/workspaceModel.ts`
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.tsx`
- `src/HomeOps.Client/src/styles.css`
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.test.tsx`
- Prior Agenda/UX reports under `docs/reports/`, including `docs/reports/2026-06-27-agenda-final-polish/agenda-final-polish.md`, `docs/reports/2026-06-27-agenda-week-workspace/agenda-week-workspace.md`, and `docs/reports/2026-06-28-familyboard-functional-ux-review/familyboard-functional-ux-review.md`.

## Confirmation that no implementation changes were made

Confirmed. This task created an analysis report only. No source code, CSS, backend, API, schema, migration, seed, fixture, or product implementation files were modified.

## Confirmation that no binary files were added

Confirmed. No screenshots, videos, PNG, JPG, JPEG, GIF, WEBP, PDF, or other binary files were added. The only added file is this Markdown report.
