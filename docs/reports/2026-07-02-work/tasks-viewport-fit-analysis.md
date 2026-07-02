# Tasks Page Viewport-Fit Analysis

## Summary

The Tasks page should be redesigned as a viewport-bounded dashboard, not a document-style page containing every task queue at once. The current implementation attempts to show Today, Tomorrow, This Week, Later, Completed, support actions, optional templates, optional weekly reset review, and Someday in one page body. It also relies on `.workspace-page-body { overflow: auto; }`, so overflow is absorbed by the shared page-body scroll region instead of being contained by task sections.

Recommended direction after the additional planning-density investigation: reduce the default viewport to three stable regions: a compact command/header band, a Today-first main work area, and a compact Planning summary/secondary-access region. Show Today as the primary operational list. Replace the previously recommended default Planning panel that simultaneously exposes Tomorrow and This Week lists with a lower-density Planning summary that communicates upcoming workload through counts, urgency, ownership, and one or two exception signals. Tomorrow, This Week, and Later remain available after interaction through a bounded planning detail surface. Move Later, Completed, Templates, Week Planning review, and Someday out of the default viewport into collapsed drill-in panels or secondary routes/panels opened from fixed-height summary tiles. This intentionally shows less information by default to make the page more useful and permanently viewport-fit.

## Scope

In scope:

- Tasks page composition and hierarchy.
- Tasks grid/layout, spacing, card sizing, responsive behavior, and overflow behavior.
- Information-reduction recommendations for visible Tasks sections.
- A recommended dashboard composition for a future implementation slice.

Out of scope:

- Source-code implementation.
- Backend, API, schema, migration, seed, or task lifecycle changes.
- Unrelated pages.
- New product features.
- Binary artifacts.

## Key information-reduction findings

- The page currently tries to show too many simultaneous lists by default: Today, Tomorrow, This Week, Later, Completed, Someday, optional Templates, and optional Week Planning review.
- There are too many competing sections for a dashboard page. Today should be the page's operational focus; future and administrative queues should not compete visually with it.
- The current five-column desktop grid makes the non-primary columns narrow. Narrow columns reduce task-title readability, force metadata chip wrapping/truncation, and make each queue feel like an equal destination even when it is secondary.
- Later, Completed, Templates, Week Planning, and Someday are useful capabilities but should not be default dashboard content.
- Tomorrow and This Week are both planning information, but the additional planning-density investigation concludes they should not both remain visible as task lists by default. They should roll up into a Planning summary, with detailed Tomorrow, This Week, and Later lists exposed only after interaction.
- Completed is recovery/history, not planning; it should be summarized by count and opened only on demand.
- Someday is intentionally non-urgent; showing all Someday items below the dashboard undermines the no-pressure mental model and creates page overflow.
- The recommended design intentionally reduces default visible information while preserving access to every existing task capability.

## Current layout assessment

### Component hierarchy

The Tasks page is rendered by `TasksPage` inside `WorkspaceShell`. `WorkspaceShell` always wraps the active workspace content in `.workspace-page-body`, and Tasks renders inside that body as `.tasks-page`.

Current visible Tasks structure when tasks exist:

1. Tasks page-local header with title, explanatory copy, and Add Task action.
2. Today summary pill row.
3. Error/loading/empty state region when applicable.
4. Dashboard grid:
   - Today primary group.
   - Tomorrow planning group.
   - This Week planning group.
   - Later queue group.
   - Completed history group.
5. Support action strip:
   - Routinestarters.
   - Week plannen.
   - Gezinsreset openen.
6. Modal task dialog when adding/editing.
7. Secondary stack below the dashboard:
   - Templates panel when opened.
   - Week Planning review panel when opened.
   - Someday task list when any Someday tasks exist.

### Grid/layout

The latest CSS overrides the earlier two-column layout with a five-column desktop grid:

- Today: `minmax(34rem, 1.5fr)`.
- Tomorrow: `minmax(18rem, 0.78fr)`.
- This Week: `minmax(17rem, 0.72fr)`.
- Later: `minmax(14rem, 0.56fr)`.
- Completed: `minmax(14rem, 0.56fr)`.

The wrapper elements use `display: contents`, so all five groups participate as direct grid columns. Each task-time group receives a `min-height: clamp(31rem, 60vh, 43rem)`, which reserves a tall content band before the support actions and secondary stack are considered.

### Spacing and card sizing

- The outer `.tasks-page` has card chrome, padding, and a grid gap.
- The page-local `.tasks-header` is a full card inside the workspace page, even though `WorkspaceShell` already renders a workspace-level page header above it.
- Task groups have card padding, section headings, count pills, list gaps, and task-card minimum heights.
- Primary task cards are at least `5.55rem` tall; planning cards are at least `4.85rem`; compact cards are at least `3.95rem`.
- Even compact secondary queues consume large vertical space because the groups themselves reserve the same `clamp(31rem, 60vh, 43rem)` height.

### Responsive behavior

At max-width 1180px, the five columns collapse into a single-column stack and the time-group minimum height is removed. That helps narrow layouts horizontally but turns the page into a long document, which conflicts with the primary-page rule that the browser page must not vertically scroll during normal product use.

### Overflow behavior

The shared `.workspace-page-body` has `overflow: auto`, while `.tasks-page` has `min-height: calc(100vh - 8.9rem)` rather than a strict reserved height with internal regions. The result is that overflowing Tasks content can be handled by the shared page-body scroll region. This violates the dashboard constraint because the page content grows instead of containing overflow inside specific task components.

## Root causes of viewport overflow

1. **Shared page-body scrolling is still active.** `.workspace-page-body` permits scrolling for the entire active workspace body, so Tasks can rely on page-body scroll rather than internal component containment.
2. **The page has duplicate header layers.** `WorkspaceShell` provides a workspace-level header, then `TasksPage` adds another large header card and summary row before the dashboard.
3. **Five default columns create too much simultaneous information.** The design gives Today, Tomorrow, This Week, Later, and Completed simultaneous default presence.
4. **Group heights are reserved globally, not budgeted.** Every visible group in the dashboard receives a tall min-height, including secondary queues.
5. **Task lists have no visible-row contract.** `TaskGroup` maps every task in a group into the visible list, so task volume can grow the group and the page.
6. **Secondary stack lives below the dashboard.** Templates, Week Planning review, and Someday are rendered after the dashboard and support actions, so opening panels or having Someday items lengthens the page.
7. **Completed details can expand in place.** Completed is a `<details>` group; expanding it can add arbitrary rows into the main page flow.
8. **Responsive collapse becomes document flow.** At narrower desktop/laptop widths, the grid collapses vertically instead of using a bounded dashboard composition.

## Desktop viewport budget

Target common laptop viewport: **1366 × 768**.

Approximate vertical budget for the recommended design:

| Region | Allocation | Notes |
| --- | ---: | --- |
| Browser viewport | 768px | Baseline common laptop height. |
| App/shell padding and safe margins | 16-24px | Existing panel padding should be compact. |
| Navigation | 52-60px | Keep primary nav compact. |
| Workspace page header | 54-64px | Use one shell/page header, not two full headers. |
| Tasks command/summary band | 52-64px | Add task, today count, overdue count, review count. |
| Reserved gaps | 24-32px | Includes panel gaps between nav/header/content. |
| Main Tasks content region | ~560px | Fixed-height grid; internal cards/lists manage overflow. |

Fit demonstration for 768px height:

- 56px navigation.
- 60px workspace header.
- 60px Tasks command/summary band.
- 28px total gaps/margins.
- 564px main content region.
- Total: 768px.

For a taller 900px viewport, the main content region can expand to about 690px. For a shorter 720px viewport, reduce header copy and command-band padding first, preserving a main content region around 510px.

The page must reserve the main content region with `minmax(0, 1fr)` and place all variable task volume inside internal list containers with visible-row limits, summary counts, or internal scrolling. The browser document and shared workspace body should not become the overflow mechanism.

## Section-by-section evaluation

| Section | Primary/secondary | Always visible? | Fixed/flexible | Evaluation | Recommended default behavior |
| --- | --- | --- | --- | --- | --- |
| Workspace page header | Primary orientation | Yes | Fixed/compact | Existing shell header is enough for workspace identity. | Keep compact; remove or drastically reduce duplicate Tasks-local prose. |
| Tasks-local header | Secondary orientation/action | Partially | Fixed | Duplicates the shell header and consumes vertical budget. | Merge with command/summary band; retain Add Task action and one short phrase only if needed. |
| Today summary | Primary summary | Yes | Fixed | Useful but should not be a separate tall region. | Merge into command band as compact chips: total, overdue, routines, review count. |
| Error/loading/empty state | State-dependent primary | Yes when applicable | Fixed within content | Necessary but should not change page chrome height dramatically. | Show in bounded main content region. |
| Today list | Primary operational work | Yes | Flexible within fixed region | This is the true primary list. It should be widest and easiest to scan. | Keep as main column; limit default visible rows; overflow internally or show `+N more`. |
| Tomorrow list | Secondary planning | Yes as summary/detail | Flexible within fixed panel | Useful but currently competes as its own narrow column. | Merge into a wider Planning panel with This Week; show 2-4 rows or active segment. |
| This Week list | Secondary planning | Yes as summary/detail | Flexible within fixed panel | Useful but currently too narrow and equal-weight. | Merge with Tomorrow into Planning panel; show fewer rows and counts. |
| Later queue | Tertiary planning | No | Summary tile fixed | Not a daily dashboard primary. | Show count/status only in secondary rail/footer; open drill-in panel on demand. |
| Completed history | Tertiary recovery/history | No | Summary tile fixed | Useful for undo/reopen but not daily work. | Show count only; drill in on demand; never expand inside page flow. |
| Support action strip | Secondary actions | Yes, compact | Fixed | Important access point, but current strip plus secondary stack encourages below-fold content. | Convert to compact fixed secondary rail/footer with bounded buttons/summary tiles. |
| Templates panel | Secondary management | No | Drill-in | Useful but administrative; currently can open below dashboard and grow page. | Hide from default viewport; open in modal/side panel/internal drawer with its own scroll. |
| Week Planning review panel | Secondary/periodic review | No, except count | Drill-in | Review count is valuable; full review list should not be inline. | Show count in command/rail; open bounded review panel or Weekly Reset workspace. |
| Someday list | Tertiary/no-pressure backlog | No | Drill-in | Showing full Someday list contradicts no-pressure design and creates overflow. | Count tile only; drill in when requested. |
| Task dialog | Primary interaction overlay | No | Modal with internal scroll | Existing modal strategy is acceptable because it is outside normal page flow. | Keep overlay bounded; ensure max-height and internal scroll remain. |

## Recommended dashboard composition

### Information architecture

Default viewport should answer only three questions:

1. **What needs attention now?** Today/overdue list.
2. **What is coming next?** Merged planning preview for Tomorrow and This Week.
3. **Where do I access secondary task management?** Compact fixed controls/counts for Later, Completed, Routines, Week Planning, and Someday.

### Overall grid

Recommended desktop composition:

```text
Tasks viewport region
┌────────────────────────────────────────────────────────────┐
│ Compact command + status band                              │
│ Add task | Today count | Overdue | Routines | Review count  │
├───────────────────────────────┬────────────────────────────┤
│ Today / Now                   │ Planning                   │
│ widest operational list       │ Tomorrow + This Week       │
│ fixed-height internal list    │ wider secondary panel      │
│ visible 4-6 rows + +N more    │ segment/tabs or two blocks │
├───────────────────────────────┴────────────────────────────┤
│ Secondary access rail/footer: Later | Someday | Completed  │
│ Routines | Week Planning / Reset                            │
└────────────────────────────────────────────────────────────┘
```

### Columns

Use fewer, wider columns than the current layout:

- Column 1: Today, about 58-62% of content width.
- Column 2: Planning, about 38-42% of content width.

This is preferable to five columns because task titles and metadata remain readable, Today is clearly primary, and secondary queues stop competing with active work.

### Rows and reserved regions

- Row 1: compact command/status band, fixed height around 52-64px.
- Row 2: main content, `minmax(0, 1fr)`, two columns, fixed by viewport remainder.
- Row 3: secondary access rail/footer, fixed height around 56-72px.

### Component priorities

1. Today list: highest priority, largest card, always visible.
2. Planning panel: secondary, always visible but condensed.
3. Add Task: command priority, always visible.
4. Review/Reset signal: visible as count/action, not full list.
5. Later, Someday, Completed, Templates: accessible but not visible as full lists by default.

### Sizing strategy

- The Tasks page should use `height: 100%` or the shell-provided remaining height, not a viewport-derived min-height that can exceed the parent.
- The dashboard should use `grid-template-rows: auto minmax(0, 1fr) auto`.
- Today and Planning cards should use `min-height: 0` and internal list containers.
- Lists should have explicit row caps or internal overflow; they should never increase the global page height.

## Alternative compositions considered

### Alternative A — Recommended: two-column focus dashboard

- Today in a wide left column.
- Merged Planning panel on the right for Tomorrow and This Week.
- Secondary rail/footer for Later, Someday, Completed, Routines, Week Planning, and Reset.

Pros:

- Uses fewer columns than the current layout.
- Strongest hierarchy and best title readability.
- Reduces default visible information while preserving access.
- Fits common laptop viewports with stable page composition.

Cons:

- Users see fewer queues at once.
- Requires careful interaction design for drilling into secondary queues.

### Alternative B — Three-column operational board

- Today wide column.
- Tomorrow medium column.
- This Week medium column.
- Later, Completed, Someday, Templates, and Week Planning remain hidden behind a compact footer/rail.

Pros:

- Preserves a more familiar time-horizon board.
- Keeps Tomorrow and This Week simultaneously visible.

Cons:

- Still creates narrower columns than recommended.
- Leaves less horizontal space for metadata and selected actions.
- More likely to feel busy on 1366px-wide laptops.

### Alternative C — Single-column Today-first dashboard with planning drawer

- Today takes the full main content width.
- Planning is represented by summary cards and opens in an internal drawer or side panel.
- Secondary management remains behind fixed controls.

Pros:

- Maximum focus and strongest viewport fit.
- Best for families using Tasks mainly as a daily action board.

Cons:

- Planning is less visible by default.
- Could make the page feel too sparse on large desktop displays.

### Previous rationale for Alternative A

Before the additional planning-density investigation below, Alternative A was preferred because it best balanced operational clarity and planning awareness among the original alternatives. It removed the current five-column density problem, kept the next planning horizon visible, and stopped tertiary queues from consuming default viewport space. It also gave implementation a clear viewport contract: one fixed command band, one bounded two-column content region, and one fixed secondary access rail.

The addendum below re-opens that conclusion and supersedes it where the default Planning hierarchy is concerned.


## Additional planning-density investigation

### Question being re-opened

The completed analysis recommended a two-column dashboard where Today remains the dominant operational column and a merged Planning panel keeps Tomorrow and This Week simultaneously visible in condensed form. This addendum challenges that assumption: even when Tomorrow and This Week are merged into one wider panel, the page may still ask the family to process multiple planning horizons before the current day has been handled.

The investigation focuses on whether the default Tasks dashboard should show multiple future task lists, or whether it should communicate future workload as a summary until a user intentionally asks for planning detail.

### Option A — Today plus Planning detail by default

Option A is the previous recommendation:

- Today remains the primary operational list.
- Planning is visible by default as a detail panel containing Tomorrow and This Week.
- Tomorrow and This Week may be represented as tabs, segments, or two compact blocks.
- Later remains outside the default detail view.

Strengths:

- Strong short-term planning visibility.
- Helpful for evening preparation, handoff moments, and adults checking whether tomorrow is overloaded.
- Clearer than the current five-column board because future lists are consolidated into one secondary area.
- Good for users who already understand Tasks as a time-horizon board.

Weaknesses:

- Still presents at least three mental buckets by default: Today, Tomorrow, and This Week.
- Risks turning the right panel into a small planning dashboard inside the main dashboard.
- Encourages scanning future work even when the household's immediate question is “what needs doing now?”
- May make the page feel administratively dense for children or quick family check-ins.
- Uses precious viewport height for future task rows that may not need row-level visibility every time the page opens.

### Option B — Today plus Planning summary by default

Option B changes the default hierarchy:

- Today remains the primary operational list.
- The default Planning area becomes a summary, not a pair of task lists.
- The summary communicates upcoming workload without listing Tomorrow and This Week simultaneously.
- Interaction with the Planning summary opens bounded planning detail for Tomorrow, This Week, and Later.

The summary could communicate:

- number of tasks coming tomorrow;
- number of tasks due this week;
- whether any upcoming task is overdue-risk, unassigned, high-effort, recurring, or needs review;
- the next one urgent exception only, if necessary;
- a plain-language state such as “Tomorrow looks light,” “3 things coming tomorrow,” or “This week has 8 planned tasks.”

This is not a feature implementation proposal; it is an information-hierarchy conclusion for the analysis. The important design point is that the default page answers “is planning under control?” without asking the family to read multiple future lists.

### Comparative evaluation

| Criterion | Option A: Today + Planning detail | Option B: Today + Planning summary |
| --- | --- | --- |
| Cognitive load | Lower than the current five-column board, but still requires comparing Today, Tomorrow, and This Week. | Lowest default load; users first process Today, then a compact signal about future workload. |
| Dashboard clarity | Clear two-column structure, but the Planning panel can still become a secondary dashboard. | Strongest clarity: one work area and one planning signal. |
| Information density | Moderate; row-level future tasks remain visible. | Low by default; detail is deferred until intent is expressed. |
| Discoverability | Future tasks are highly discoverable because they are already visible. | Requires strong affordance on the summary so families know they can open Tomorrow, This Week, and Later. |
| Family usability | Good for adult planning; potentially busy for children or quick shared glances. | Better for shared household use because it separates doing from planning and uses simpler status language. |
| Viewport efficiency | Better than five columns, but future rows still consume the main content budget. | Best efficiency; the summary can stay compact and preserve more stable space for Today. |
| Hierarchy | Today is primary, but Tomorrow and This Week still have default row-level presence. | Strongest hierarchy: Today is the default task workspace; planning detail is a secondary mode. |
| Daily household suitability | Good for a planning session or end-of-day review. | Better for repeated daily use, morning checks, and quick family coordination. |

### Critical finding

The previous two-column recommendation solved the most obvious viewport problem, but it did not fully solve the information hierarchy problem. It reduced five columns to two regions while still preserving multiple future horizons as default row-level content. That is an improvement, but it keeps the Tasks page oriented partly toward planning administration rather than daily household action.

For a FamilyBoard dashboard, the default Tasks page should be biased toward the current household moment. Most openings of the page should answer: “what are we doing today?” and “is anything upcoming becoming a problem?” They should not require reading Tomorrow and This Week as separate lists unless the user chooses to plan.

### Final recommendation from this investigation

Replace the previous default Planning detail recommendation with the Planning summary hierarchy.

The recommended default viewport should contain:

1. **Today** as the only row-level task list shown by default.
2. **Planning summary** as a compact signal of upcoming workload, not multiple simultaneous future task lists.
3. **Detailed planning after interaction**, exposing Tomorrow, This Week, and Later in a bounded panel, drawer, segmented detail view, or equivalent non-page-scrolling surface.

This replacement is superior because it better matches the FamilyBoard principle that primary pages are dashboards, not document-style planning boards. It lowers cognitive load, improves dashboard clarity, protects viewport space, and creates a cleaner household hierarchy: do today first; inspect future detail only when planning is the user's intent.

The main trade-off is discoverability. Option B must make the Planning summary visibly actionable and informative enough that future work does not feel hidden. The summary should therefore carry clear counts, plain-language status, and an obvious affordance to open planning details. With that caveat, Option B is the stronger default design for daily household use.

## Overflow strategy for every section

| Section | Overflow strategy |
| --- | --- |
| Page/shell | Browser document and shared workspace page body must not scroll for normal Tasks use. Tasks must fill its reserved parent with `min-height: 0` and `overflow: hidden`. |
| Command/status band | Fixed height. Truncate optional helper copy first. Collapse counts into chips if width is constrained. |
| Today list | Show 4-6 rows depending on viewport height. If more tasks exist, show `+N more today` and allow internal list scrolling or a bounded drill-in list. The Today card height remains fixed. |
| Tomorrow subset | In the merged Planning panel, show up to 2-3 Tomorrow rows plus count. Extra rows use `+N more`. |
| This Week subset | Show up to 3 rows or only the active segment if Tomorrow is selected. Extra rows use `+N more this week`. |
| Later | Default viewport shows only a count/status tile. Open in bounded drawer/modal/panel with internal scroll. |
| Completed | Default viewport shows only a count and latest completed timestamp/label if desired. Open in bounded drawer/modal/panel; do not use an in-flow `<details>` expansion. |
| Routines/Templates | Default viewport shows a compact action button/count. Full routine management opens in bounded overlay/panel with internal scroll. |
| Week Planning review | Default viewport shows count of review candidates and action to open review/reset. Full review list opens in bounded panel or navigates to Weekly Reset. |
| Someday | Default viewport shows count only. Full Someday list opens in bounded secondary panel; it must not render below the dashboard by default. |
| Task cards | Keep selected-card actions progressive, but ensure selected actions do not increase row height or push the list. Metadata chips should reduce before wrapping excessively. |
| Empty states | Empty Today/Planning states should occupy the same reserved card regions and not create extra page height. |
| Task dialog | Continue as overlay with `max-height` and internal scrolling; overlay does not affect page layout height. |

## Responsive strategy

- Above ~1200px: recommended two-column main grid with Today and Planning.
- 1024-1199px: keep two columns but reduce gaps, card padding, metadata chip count, and visible rows before collapsing.
- Below ~1024px or constrained height: use one main column with Today visible and Planning as a segmented panel below/alongside inside the same fixed content region, not a document stack. The secondary rail may become a compact horizontal scroller inside a fixed-height footer.
- Width reductions should hide low-priority metadata chips before reducing title readability.
- Height reductions should remove prose, reduce padding, and reduce visible rows before allowing page overflow.
- Do not use the current single-column vertical stack as the primary responsive fallback for primary product use.

## Risks and trade-offs

- Showing less information by default may initially feel like a reduction for users accustomed to seeing all queues.
- Drill-in panels must be discoverable enough that Later, Someday, Completed, and Routines do not feel removed.
- Internal scrolling should be used sparingly and only inside clearly bounded list regions; excessive nested scroll areas could feel awkward.
- Row limits require thoughtful empty/count states so users understand hidden volume.
- If implementation keeps the shared `.workspace-page-body` scroll behavior unchanged, the page may still accidentally scroll even after Tasks is compacted. The Tasks page should explicitly avoid relying on that shared scroll region.

## Recommendation for implementation

Implement the future slice as a structural information-architecture change, not a CSS-only compaction pass:

1. Remove the current five-column default dashboard.
2. Replace it with a two-column viewport-bounded grid: Today and merged Planning.
3. Convert Later, Completed, Someday, Templates, and Week Planning review from default in-flow lists into compact secondary access controls with bounded drill-in surfaces.
4. Merge the Tasks-local header and Today summary into a compact command/status band.
5. Add explicit visible-row limits and `+N more` summaries for Today and Planning.
6. Ensure every task list has a fixed containing region with `min-height: 0` and internal overflow behavior.
7. Ensure the page itself and `.workspace-page-body` are not the normal overflow mechanism for Tasks.

## Validation performed

Commands run:

```bash
export DOTNET_CLI_HOME="$PWD/.dotnet-home"
export DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1
export DOTNET_NOLOGO=1
export NUGET_PACKAGES="$PWD/.nuget/packages"
export npm_config_cache="$PWD/.npm-cache"
mkdir -p "$DOTNET_CLI_HOME" "$NUGET_PACKAGES" "$npm_config_cache"
```

```bash
find .. -name AGENTS.md -print
```

```bash
cat AGENTS.md
sed -n '1,240p' .github/copilot-instructions.md
```

```bash
rg -n "TasksPage|function Tasks|export.*Tasks|tasks-page|task-board|task-column|page-body|workspace" src/HomeOps.Client/src -S --glob '!**/*.map'
```

```bash
sed -n '1,1280p' src/HomeOps.Client/src/tasks/TasksPage.tsx
```

```bash
sed -n '260,285p' src/HomeOps.Client/src/styles.css
sed -n '1480,1735p' src/HomeOps.Client/src/styles.css
sed -n '5880,6065p' src/HomeOps.Client/src/styles.css
sed -n '6390,6620p' src/HomeOps.Client/src/styles.css
sed -n '7100,7355p' src/HomeOps.Client/src/styles.css
```

No .NET, npm, Playwright, test, export, screenshot, or product validation command was run because this was an analysis-only task with no implementation changes.

## Files inspected

- `AGENTS.md`
- `.github/copilot-instructions.md`
- `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx`
- `src/HomeOps.Client/src/tasks/TasksPage.tsx`
- `src/HomeOps.Client/src/tasks/taskGrouping.ts`
- `src/HomeOps.Client/src/styles.css`
- `docs/roadmap/phase-2.md`

## Confirmation that no implementation changes were made

No source-code implementation changes were made. This task only added this markdown analysis report.

## Confirmation that no binary files were added

No screenshots, videos, PNG, JPG, JPEG, GIF, WEBP, PDF, or other binary files were added.
