# Shopping Viewport-Fit Analysis

## Summary

The Shopping page should be treated as a bounded dashboard/control panel, not as a document-style list-management page. The current implementation still relies on `.workspace-page-body` scrolling for the Lists/Shopping workspace because the page stacks hero, quick-add, active grouped list, empty/start state, recent chips, other lists, and lifecycle management vertically in one flow. The recommended implementation is a fixed-height Shopping dashboard with a compact command row, one dominant internally scrolling active-shopping region, and a bounded secondary/status rail for recent, completed, deleted, list management, and other lists.

This report is analysis-only. No source implementation changes were made.

## Scope

In scope:

- Shopping page composition and viewport-fit behavior.
- Existing Shopping widget/component hierarchy, styles, workspace shell behavior, and Shopping list states.
- Active, completed, deleted, grouped, other-list, loading, error, and empty states.
- Recommended dashboard composition and overflow strategy for a later implementation slice.

Out of scope:

- Source code changes.
- Backend, API, database, migration, seed, authentication, integration, or unrelated page changes.
- New product features.
- Screenshots, videos, binary files, or generated assets.

## Shopping information-reduction findings

- The active shopping list should be the only full list visible by default because it is the high-frequency execution surface: add, scan by store, check off, and remove.
- Completed, deleted, and undo/recovery items should not be full visible lists by default. They should be summarized with counts and opened in bounded panels or drawers when needed.
- Store/category grouping helps shopping execution when it remains compact and vertically stacked inside the active-list viewport. It hurts viewport fit when every group expands the page height without an internal height cap.
- A full shopping list should use an internally scrolling active-list region with compact row density and optional per-group visible-row summaries. The page itself must not grow with item count.
- Quick-add should remain permanently visible because Shopping is a fast capture workflow. It should be a compact command/add row rather than a separate tall card with explanatory helper copy.
- List metadata, helper copy, and empty-state text currently consume too much vertical space for a dashboard. Default helper copy should be reduced to one short line or moved into empty/error states.
- The page should behave more like a shopping control panel than a list-management page: commands and current shopping execution stay visible; maintenance and history are accessible but bounded.

## Current layout assessment

### Current page composition

The Shopping page is rendered through the Lists workspace using the `shopping-list-mvp` widget instance. The shell adds a workspace page header, then a scrollable `.workspace-page-body`, then a `.widget-host`, then the Shopping widget card.

Inside the Shopping widget, the current visual order is:

1. Hero card with title, explanatory copy, and illustration.
2. Quick-add panel with section label, heading, helper text, loading/error state, and add form.
3. Active list surface grouped by preferred store.
4. First-use empty/start card when no active, completed, or deleted items exist.
5. Recent-items panel with up to four active items as chips.
6. Other lists section with expandable list cards.
7. Lifecycle workspace with completed, list management, and recently deleted details.

### Grid/layout and component hierarchy

- The shell gives the workspace panel a fixed-height grid, but `.workspace-page-body` is explicitly scrollable.
- `.shopping-workspace` is a vertical CSS grid with no fixed row contract and `min-height: calc(100vh - 8.9rem)`.
- The active store workspace is one normal grid child, not the bounded flexible middle row of the page.
- Store groups are rendered as a single-column vertical stack in the later CSS override, so each store group adds document height.
- Shopping rows have a large operational minimum height, checkbox, optional store controls, and remove/undo actions, which is useful for touch but expensive vertically.

### Spacing and card sizing

- The page has nested card surfaces: workspace panel padding, widget card padding, hero card padding, quick-add card padding, active-list card padding, store-card padding, row padding, recent card padding, other-list card padding, and lifecycle card padding.
- The hero and quick-add regions are visually warm but consume permanent vertical budget before the active list begins.
- The active list has no `minmax(0, 1fr)` reserved region or max-height, so additional groups/items grow the global composition.

### Responsive behavior

- At narrower widths, quick-add, recent, lifecycle, and item action layouts collapse to one column. That improves horizontal fit but increases vertical height.
- No Shopping-specific responsive rule caps the page height or changes the active list into an internally scrolling area.

### Overflow behavior

- The global `html`, `body`, and `#root` are hidden, but `.workspace-page-body` uses `overflow: auto`.
- Lists/Shopping does not override that shared scroll region, unlike some primary pages that use hidden/bounded body behavior.
- The result is that Shopping can avoid browser body scroll while still becoming a vertically scrollable page inside the shared page-body region, which violates the Shopping objective for this analysis.

## Root causes of viewport overflow

1. **Document-flow composition:** Shopping stacks every section vertically instead of assigning fixed dashboard regions.
2. **Shared page-body scroll reliance:** The Lists workspace inherits `.workspace-page-body { overflow: auto; }`, so overflow is delegated to the shell instead of handled inside Shopping sections.
3. **Unbounded active list:** The active grouped list grows with every store group and item.
4. **Unbounded secondary sections:** Other lists and lifecycle panels are in the default flow below the primary list.
5. **Permanent explanatory content:** Hero copy, quick-add helper copy, other-list helper copy, recent heading copy, and first-use copy all compete with operational list space.
6. **Row and card density:** Large row minimum heights and nested cards are appropriate for touch but need a bounded list viewport.
7. **Grouping cost:** Preferred-store grouping improves scanability but currently adds header and card chrome for every group without a fixed group/list region.

## Desktop viewport budget

Recommended design target: common laptop viewport of **1280 × 720** and desktop viewport of **1440 × 900**. The page must fit the fixed workspace panel without `.workspace-page-body` scrolling.

Approximate 720 px high viewport allocation:

| Region | Approx. height | Notes |
| --- | ---: | --- |
| Browser/root app boundary | 720 px | Fixed viewport. |
| Workspace navigation | 52 px | Existing primary/admin navigation row. |
| Shell/panel outer gaps and padding | 28 px | App/shell/panel padding and borders. |
| Page header | 76 px | Current Lists workspace heading; may be compacted but remains visible. |
| Shopping dashboard internal gaps | 24 px | Reserved row gaps, not accumulated per section. |
| Command/add row | 76 px | Permanent compact quick-add with minimal helper text. |
| Main shopping content region | 410 px | Dominant active-list viewport; internally scrolls when content exceeds capacity. |
| Secondary/status row or rail | 54 px inside main/side region or 90 px bottom max | Completed/deleted/other/recent summarized, not full lists. |
| Safety reserve | 30-50 px | Accounts for font rendering, borders, and OS/browser variance. |

A 720 px laptop can therefore fit: navigation (52) + shell/panel/header/padding/gaps (128) + command row (76) + main region (410) + compact secondary/status (54) = **720 px**. On taller desktop viewports, the active-list region expands; secondary sections do not grow the page.

## Section-by-section evaluation

| Section/state | Primary or secondary | Always visible? | Sizing | Information-reduction decision | Overflow handling |
| --- | --- | --- | --- | --- | --- |
| Workspace navigation | Primary shell | Yes | Fixed by shell | Keep as-is. | No Shopping-owned overflow. |
| Page header | Secondary context | Yes, but compact | Fixed/auto capped | Keep label/title/one-line description; avoid large Shopping-specific duplicate hero. | Header should not grow beyond reserved height. |
| Shopping hero | Secondary/warmth | No, not as separate large card | Remove or merge | Merge title/context into compact page/header or command area. Illustration should not consume default vertical space. | No independent hero region. |
| Quick-add command | Primary | Yes | Fixed row | Keep permanently visible; reduce helper copy to one short line or visually hidden accessible description. | Form does not scroll; validation/error appears inline within fixed row or compact alert slot. |
| Loading state | Primary status | Yes while loading | Fixed command/main placeholders | Use bounded skeleton/message in main region. | No page growth. |
| Error state | Primary status | Yes when present | Fixed alert slot | Use compact alert in command row or top of main region. | Alert wraps within reserved height; long error text truncates/wraps to two lines. |
| Active shopping list | Primary | Yes | Flexible `minmax(0, 1fr)` | Only full list visible by default. Store grouping remains visible because it supports shopping execution. | Main region internally scrolls. Groups may have sticky/compact headers and row limits per group if needed. |
| Store groups | Primary organization | Yes when active items exist | Inside active-list region | Keep grouping, but reduce group chrome. Prefer vertical stack or two-column only if height remains bounded. | Internal scroll; optional `+N more in store` if per-group row cap is used. |
| Active item rows | Primary | Yes until region fills | Row fixed/compact | Keep checkbox, label, store hint, and compact actions. Hide advanced store edit behind row detail. | Row list scrolls internally; long labels wrap to max two lines or truncate with full text available. |
| Recently added | Secondary reassurance | Not required as full panel | Fixed chip/status | Reduce to inline chips/count in secondary rail or command-area hint. | Limit to 3-4 chips with `+N more`; no wrap beyond reserved height. |
| Empty shopping state | Primary onboarding | Yes only when no items | Fixed main-region state | Keep a concise empty state inside active-list region; do not add a separate card below quick-add. | Empty content centered in main region and capped. |
| Completed items | Secondary lifecycle | Count visible, full list hidden | Collapsed/bounded | Show count and maybe last 1 item; default collapsed. | Open in bounded drawer/panel/internal scroll, not page flow. |
| Deleted/undo items | Secondary recovery | Count/undo status visible, full list hidden | Collapsed/bounded | Show count and most recent undo affordance only if useful; full recovery hidden. | Bounded drawer/panel/internal scroll. |
| List management | Secondary/admin | No | Collapsed | Keep accessible through compact management button/details in secondary rail. | Management form opens in bounded panel/drawer; does not push page. |
| Other lists | Secondary | Count/list names visible at most | Collapsed/bounded | Remove full other-list cards from default viewport; show compact summary/count. | Open selected list in bounded panel or navigate/expand within secondary rail with internal scroll. |
| First-use create-list state | Primary setup | Yes when no list exists | Fixed main-region state | Keep create-list action inside main active region; do not add extra standalone card. | No page growth. |

## Recommended dashboard composition

### Overall grid

Use a fixed-height Shopping dashboard inside the existing workspace panel:

```text
Shopping page body (overflow hidden)
└── Shopping dashboard grid: rows auto auto minmax(0, 1fr)
    ├── Compact page/title context (or reuse workspace header)
    ├── Command row: quick-add + compact active/recent status
    └── Main bounded region: two columns on desktop
        ├── Primary column: active shopping list by store (full height, internal scroll)
        └── Secondary rail: completed/deleted/manage/other summaries (fixed width, internal bounded panels)
```

### Rows and columns

- **Row 1: Header/context** — use the existing workspace header or a compact Shopping context row, not both a full workspace header and a full Shopping hero.
- **Row 2: Command/add row** — always visible. Contains quick-add, loading/error slot, and small status chips such as active count or recently added chips.
- **Row 3: Main content** — the only flexible region. It is `minmax(0, 1fr)` and contains:
  - **Primary active-list column** (about 70% width): grouped active shopping list.
  - **Secondary/status rail** (about 30% width): summarized lifecycle, other lists, and management.

### Component priorities

1. Quick-add input and add button.
2. Active open shopping items grouped by store.
3. Immediate item actions: complete, remove, compact store edit access.
4. Status summaries: completed count, deleted count, recently added chips, other-list count.
5. Management/recovery details.

### Sizing strategy

- Shopping dashboard: `height: 100%`, `min-height: 0`, `overflow: hidden`.
- Command row: fixed/auto capped height around 68-80 px.
- Main region: `minmax(0, 1fr)`.
- Active list: `height: 100%`, `overflow-y: auto`.
- Secondary rail: fixed width on desktop, `overflow: hidden`; individual panels internally scroll only when opened.
- Mobile/narrow layouts may stack, but still use reserved rows and internal scrolling rather than page scrolling.

### Default visible information

Visible by default:

- Page title/context.
- Quick-add form.
- Active shopping list grouped by store.
- Compact counts/chips for active, recently added, completed, deleted, and other lists.
- Access points for management/recovery.

Summarized or moved out of default viewport:

- Completed full list.
- Deleted full list.
- Full other-list contents.
- Rename/archive/delete form.
- Large hero illustration and repeated helper copy.

## Alternative compositions considered

### Alternative A: Single-column bounded list with bottom status bar

- Header, quick-add row, one full-width active-list region, and a bottom status bar with completed/deleted/other-list counts.
- Reduces default visible information significantly by hiding the secondary rail and showing only counts/actions in the bottom bar.
- Pros: maximum active-list width and simplest viewport budget.
- Cons: management and recovery require an overlay/drawer; less context is visible for households juggling other lists.

### Alternative B: Two-column control panel with secondary rail (recommended)

- Header, quick-add row, active-list primary column, secondary rail for recent/completed/deleted/other/manage summaries.
- Pros: keeps Shopping execution dominant while preserving discoverability of lifecycle and other-list features. Stable at 1280×720 because both columns are bounded.
- Cons: the active list has less horizontal width than Alternative A; row action density must be carefully designed.

### Alternative C: Store-first kanban/grid board

- Quick-add row above a grid of store columns/cards, each internally scrolling.
- Pros: strong store scanning when there are only a few stores.
- Cons: poor fit when many stores exist; column headers and independent scroll areas can become complex; narrow laptop widths suffer. Not recommended as the default long-term composition.

The recommended layout is Alternative B because it balances operational shopping, lifecycle discoverability, and viewport stability without making maintenance sections equal to the active list.

## Overflow strategy for every section

- **Workspace/page body:** Shopping implementation should not rely on `.workspace-page-body` vertical scrolling. The Shopping page body should be overflow hidden for Lists/Shopping, with overflow handled inside the dashboard.
- **Header:** Cap to the reserved header region. Keep copy short and avoid wrapping beyond two lines.
- **Quick-add:** Fixed command row. Error/loading messages use a compact reserved slot; they do not add rows below the command area.
- **Active list:** Internal vertical scrolling. This is the only full-list scroller visible by default.
- **Store groups:** Render inside the active-list scroller. Keep group headers compact. If store groups become very large, use per-group row limits with `+N more` only if internal scrolling alone proves hard to scan.
- **Item rows:** Compact operational rows; long labels wrap to at most two lines or truncate with accessible full text. Advanced store controls stay in row-level details/popovers and must not expand the page.
- **Recently added:** Limit to 3-4 chips and a `+N more` indicator. It should not wrap into multiple rows outside its reserved status area.
- **Completed:** Default collapsed summary with count. Full list opens in bounded drawer/rail panel with internal scrolling.
- **Deleted/undo:** Default collapsed summary with count and possibly one most-recent undo affordance. Full list opens in bounded drawer/rail panel with internal scrolling.
- **List management:** Compact button/details in the secondary rail. Rename/archive/delete controls open inside a bounded panel and must not push the active list down.
- **Other lists:** Default summary with count and maybe first 2 list names. Full other-list content opens in a bounded panel or separate list-management view, not in the default page flow.
- **Empty state:** Render inside the main active-list region. Keep one headline, one short sentence, and create/add action.
- **Loading/error:** Render within reserved command/main status slots.

## Responsive strategy

- Desktop/laptop (>= 1100 px): two-column main region, active list primary, secondary rail right.
- Medium widths (760-1099 px): keep header and command row fixed, stack active list above a compact secondary summary strip inside the same bounded main region. Active list remains the flexible scroller.
- Narrow/mobile (< 760 px): use a single bounded dashboard with command row and active-list scroller; secondary sections become compact tabs/details beneath or in a drawer. If the browser viewport is too short, reduce spacing, row density, and helper copy before allowing page scroll.
- Across all breakpoints: item count changes must only affect internal scroll, not global page height.

## Risks and trade-offs

- Internal scrolling can hide lower active items; clear scroll affordance, sticky group headers, and counts can mitigate this.
- Reducing helper copy and removing the large hero may make the page feel less warm, but Shopping is a task-oriented dashboard and needs operational space.
- Moving completed/deleted/other lists out of the default flow reduces immediate visibility, but those are secondary lifecycle/recovery surfaces.
- A secondary rail adds horizontal complexity; at medium widths it must collapse predictably without increasing page height.
- Row density must still preserve FamilyBoard's touch-friendly use. Do not over-compress checkboxes or primary row labels.

## Recommendation for implementation

Implement the recommended two-column bounded control-panel layout in a future implementation slice:

1. Make the Lists/Shopping page body or widget host a non-scrolling bounded viewport for Shopping.
2. Remove or merge the standalone Shopping hero into compact header/context.
3. Keep quick-add permanently visible as a fixed command row.
4. Make the active shopping list the only full default list and give it internal scrolling.
5. Convert recent/completed/deleted/list-management/other-lists into bounded summaries in a secondary rail or status strip.
6. Keep store grouping for active items, but ensure group and item overflow remains inside the active-list region.
7. Validate at 1280×720 and 1440×900 that `document.body` and `.workspace-page-body` do not vertically scroll and that long lists only scroll inside the active-list region.

## Validation performed

- Read repository rules in `AGENTS.md` and `.github/copilot-instructions.md`.
- Configured repository-local .NET/NuGet/npm cache environment variables before inspection commands.
- Inspected the Shopping widget, Shopping state helpers, Shopping CSS, and workspace shell/page-body rules.
- Ran Git status checks before and after report creation to verify scope.
- No build, test, Playwright, export, or screenshot command was run because this was an analysis-only documentation task and source behavior was not changed.

## Files inspected

- `AGENTS.md`
- `.github/copilot-instructions.md`
- `src/HomeOps.Client/src/widgets/components/ShoppingListWidget.tsx`
- `src/HomeOps.Client/src/styles.css`
- `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx`
- `src/HomeOps.Client/src/shopping/shoppingListState.ts`
- `src/HomeOps.Client/src/shopping/shoppingGrouping.ts`
- `docs/state/current-state.md`

## Confirmation that no implementation changes were made

Confirmed. This task only added this Markdown analysis report. No source code, styles, tests, backend files, API contracts, database schema, migrations, seed data, or unrelated pages were changed.

## Confirmation that no binary files were added

Confirmed. No screenshots, videos, PNG, JPG, JPEG, GIF, WEBP, PDF, or other binary files were added.
