# Motivation Viewport-Fit Analysis

## Summary

This is the mandatory viewport-first analysis for the Motivation page only. No source implementation was changed.

The Motivation page is currently closer to a compact dashboard than a document page, but it still has structural risks that conflict with the FamilyBoard hard requirement that primary pages must never rely on vertical page scrolling. The page currently depends on the shared `.workspace-page-body` scroll container for overflow containment, and Motivation-specific CSS later overrides the Motivation workspace panel to hide panel overflow. That combination can mask overflow rather than reserve stable regions for every Motivation concept.

Recommended direction: keep Motivation as a family morale dashboard, not a history/admin page. The default viewport should intentionally reduce visible information: family progress, current celebration/reward context, two recent appreciation signals, and compact household progress stats should remain visible. Memories/history and full personal-goal management should be contextual drawers or bounded internal panels, not extra sections appended below the dashboard.

## Scope

In scope:

- Motivation page composition and viewport-fit analysis.
- Current Motivation component hierarchy and CSS behavior.
- Existing visible Motivation concepts: family goal, family celebration/reward context, recent appreciation/helpful moments, statistics, memories/history, and personal goals.
- A recommended viewport-first dashboard composition for future implementation.

Out of scope:

- Source code implementation.
- Backend, API, schema, migration, seed, or data-model changes.
- New product features.
- Redesign of unrelated pages.
- Screenshots, videos, binary assets, or generated exports.

## Motivation information-reduction findings

Motivation should primarily answer: **How is the family encouraged, progressing together, and ready to celebrate?** It should behave more like a family morale dashboard than a history, rewards, or administration page.

Findings:

- The strongest default signal should be family progress toward the active family goal.
- Child/family progress should dominate the viewport because it is the encouragement anchor and the most actionable household signal.
- Reward/celebration detail should be visible, but summarized. It should clarify what the family is working toward without becoming a reward economy or full reward detail page.
- Recent appreciation should remain visible because it supports morale and recognition, but only as a bounded preview.
- Personal goals are important, but full management is secondary and should not appear by default as an appended, variable-height section.
- Achievement/history/memory content should be contextual by default. It supports reflection, but it is not necessary for the always-visible dashboard state.
- The current page shows many motivational concepts at once: family goal, celebration, appreciation feed, upcoming moments, stats, memory detail, and personal-goal management. The long-term composition needs information reduction, not only tighter spacing.
- Visual warmth is useful, but large illustrations, generous card padding, duplicated warm surfaces, and repeated cards can consume vertical space that should be reserved for stable layout regions.

## Current layout assessment

Current composition inside `MotivationPage`:

1. Root section: `.motivation-page.motivation-dashboard-page`.
2. Main dashboard grid: `.motivation-dashboard.familyboard-dashboard-grid`.
3. Primary family-goal card: `.family-goal-card.motivation-dashboard-card.motivation-dashboard-primary`.
4. Recent appreciation: `HelpfulMomentsSection` with `compact`, `showCreate`, and title `Recente waardering`.
5. Upcoming celebrations/memories summary: `UpcomingCelebrationsCard`.
6. Family stats and personal-goal actions: `FamilyStatsCard`.
7. Conditional celebration memory detail appended after the main dashboard when history is expanded.
8. Conditional personal-goal management appended after the main dashboard when personal goals are expanded or being created.
9. Dialog overlays for family-goal editing, appreciation creation, and personal-goal editing/creation.

Current desktop CSS uses a two-column Motivation dashboard and named grid areas. The current source contains multiple Motivation layout passes in the stylesheet. The later pass sets the main grid to:

- Left column: family goal.
- Right/top: appreciation.
- Bottom-left: celebration summary.
- Bottom-right: stats.

The current page shell provides a fixed app height and hidden shell/panel overflow, but `.workspace-page-body` remains an `overflow: auto` region. Motivation-specific CSS then sets `.workspace-panel-motivation` to `overflow: hidden`, while the body still has shared scroll behavior.

## Root causes of viewport overflow

The page exceeds, or is at risk of exceeding, its reserved viewport because of structural causes rather than a single spacing bug:

1. **Shared body scroll remains available.** `.workspace-page-body` is the common scroll container and still uses `overflow: auto`. Motivation is rendered inside that container, so vertical overflow can be absorbed by shared page-body scrolling instead of being prevented by a bounded Motivation composition.
2. **The root Motivation surface uses viewport-relative minimum height.** `.motivation-dashboard-page` has had `min-height: calc(100vh - 8.9rem)` in a later Motivation desktop block. This calculation is independent of the actual shell/header/nav budget and can conflict with the reserved workspace body height.
3. **Conditional detail sections are appended below the dashboard.** Celebration memory detail and personal-goal management render as sibling sections after the dashboard. When opened, they add document height instead of occupying a reserved panel/drawer region.
4. **Helpful moments can expand from preview to all loaded moments.** Compact mode initially limits to two moments, but the “Alles bekijken” state shows up to the loaded set. That can enlarge the appreciation card unless future CSS bounds the feed internally.
5. **Personal goals can expand to all goals.** The collapsed render uses a two-goal slice only when the details section is rendered but not expanded. The management state maps all goals, and goal cards include star rows based on target count, which can vary in height and visual density.
6. **Celebration memories are only summarized in the default card, but detailed history is appended.** The detail view is contextual content, but it currently contributes to page height rather than replacing or overlaying a bounded region.
7. **Several sections have content-driven height.** Family celebration copy, appreciation titles/descriptions, personal-goal stars, action button wrapping, and stat action wrapping can all increase card height.
8. **Responsive fallback stacks every card.** Below 860px/1180px rules, Motivation stacks grid areas into one column. That may be acceptable for non-desktop if governed by a separate mobile rule, but for common laptops the page must reduce density before page overflow appears.
9. **Panel overflow is hidden in places.** Hiding overflow can make the browser page not scroll, but it does not guarantee all important content is visible or accessible.

## Desktop viewport budget

Target common laptop viewport: **1366×768**.

Approximate available vertical budget:

| Region | Budget | Notes |
| --- | ---: | --- |
| App shell vertical padding | 8-16 px | Motivation already compacts shell padding. |
| Navigation | 40-48 px | Primary nav plus settings affordance should remain one row on common desktop/laptop widths. |
| Workspace shell gap | 6-8 px | Keep fixed and small. |
| Workspace panel padding | 12-18 px total | Prefer 6-9 px top/bottom inside Motivation panel. |
| Page header | 54-66 px | Keep current workspace header visible but compact; avoid extra Motivation-specific page hero. |
| Header/body gap | 6-8 px | Fixed. |
| Motivation dashboard region | 600-620 px | One bounded grid occupying remaining space. |
| Reserved internal gaps | 20-28 px | Grid row/column gaps only; no unreserved appended sections. |

Budget proof for 768px height:

- 768 total viewport height.
- Minus app shell padding: ~8 px top + ~8 px bottom = 752 px.
- Minus navigation row: ~44 px = 708 px.
- Minus shell gap: ~6 px = 702 px.
- Minus panel padding: ~14 px = 688 px.
- Minus workspace header: ~60 px = 628 px.
- Minus header/body gap: ~8 px = **~620 px available for Motivation dashboard**.

Recommended dashboard allocation inside ~620 px:

| Dashboard row | Height | Contents |
| --- | ---: | --- |
| Row 1 primary | 340-370 px | Family progress hero + celebration summary + compact action. |
| Row 1 right top | 165-180 px | Recent appreciation preview. |
| Row 1 right bottom | 150-170 px | Progress signals/stats and personal-goal summary/actions. |
| Row 2 bottom strip | 170-190 px | Celebration/reward/memory summary or recent morale strip, depending final grid. |
| Grid gaps | 12-18 px | One or two row gaps only. |

A two-column composition with left primary region spanning both rows and right column split into two bounded cards fits this budget. If a bottom strip is kept, it must be shallow and bounded; otherwise the safer recommendation is one primary row with no appended sections.

## Section-by-section evaluation

| Section | Always visible? | Priority | Sizing | Information reduction / overflow decision |
| --- | --- | --- | --- | --- |
| Workspace nav | Yes | Primary shell | Fixed/auto one row | Keep compact; Motivation implementation should not affect navigation. |
| Workspace page header | Yes | Primary context | Fixed compact | Keep one short header. Do not add a second large Motivation hero above the dashboard. |
| Family goal card | Yes | Primary | Fixed reserved region, flexible internal content | Dominates viewport. Show title, plain progress, remaining count, progress bar, current celebration summary, and edit action. Limit title/copy lines. |
| Family progress number/bar | Yes | Primary | Fixed within family goal card | Always visible; use compact typography on shorter viewports before allowing overflow. |
| Celebration attached to family goal | Yes, summarized | Primary support | Fixed compact strip inside family card | Show current celebration status and one action if ready. Full details/history should not occupy default viewport. |
| Recent appreciation / helpful moments | Yes, preview only | Secondary morale signal | Fixed card with internal bounded feed | Show latest 2 items plus count and add action. Expanded list should open contextual bounded drawer/panel, not grow the card/page. |
| Upcoming celebrations card | Yes, summarized | Secondary | Fixed compact card | Show next celebration and maybe latest memory count. No unbounded list. |
| Family stats card | Yes, compact | Secondary | Fixed compact card | Keep 3-4 metrics, but consider merging with personal-goal summary to reduce card count. Actions may wrap internally or move to command area. |
| Personal goals detail | No | Secondary/admin | Contextual drawer/panel with internal scroll | Default should show only summary such as active count and remaining steps. Full cards and editing belong in a bounded management panel. |
| Individual goal cards | No by default | Secondary/admin | Bounded internal list | Limit visible cards or make list internally scrollable. Star rows should be capped/condensed for high target counts. |
| Celebration memory detail | No by default | Secondary/history | Contextual drawer/panel with internal scroll | Default should show latest memory summary/count only. History must never append below dashboard. |
| Empty family-goal state | Yes when no goal | Primary | Fixed within family goal region | Empty state should occupy the primary region only; do not add extra explanatory sections. |
| Dialog overlays | Contextual | Workflow | Viewport-bounded modal | Dialogs should fit viewport with internal scrolling for form overflow. |

## Recommended dashboard composition

Recommended composition: **bounded family morale dashboard with one dominant progress region and two compact support regions**.

### Overall grid

Desktop/laptop layout within the Motivation body:

```text
┌──────────────────────────────────────────────────────────────┐
│ Workspace header: Motivatie                                  │
├──────────────────────────────────────────────────────────────┤
│ Motivation dashboard, fixed available height                 │
│ ┌───────────────────────────────┬──────────────────────────┐ │
│ │ Family progress hero          │ Recent appreciation       │ │
│ │ - goal title                  │ - latest 2 moments       │ │
│ │ - progress number/bar         │ - +N more                │ │
│ │ - remaining encouragement     │ - add appreciation       │ │
│ │ - current celebration strip   ├──────────────────────────┤ │
│ │ - edit goal action            │ Progress signals          │ │
│ │                               │ - personal goals summary  │ │
│ │                               │ - household stats         │ │
│ │                               │ - manage/open actions     │ │
│ ├───────────────────────────────┴──────────────────────────┤ │
│ │ Celebration/memory summary strip                          │ │
│ │ - next celebration or ready-to-celebrate state             │ │
│ │ - latest memory/count                                      │ │
│ │ - open history action                                      │ │
│ └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Reserved regions

- Root Motivation page: `height: 100%`, `min-height: 0`, `overflow: hidden`.
- Dashboard: fixed to available body height with `grid-template-rows: minmax(0, 1fr) auto` or an explicit bounded ratio.
- Family hero: spans the first main row in the left column and owns the largest reserved area.
- Right rail: two stacked bounded cards: recent appreciation and progress signals.
- Bottom strip: bounded, shallow celebration/memory summary across both columns. If implementation reveals the bottom strip cannot fit 768px reliably, merge it into the family hero and progress card instead of adding vertical scroll.

### Component priorities

1. Family goal/progress always visible.
2. Celebration/reward status always visible as a compact support signal.
3. Latest appreciation always visible as morale proof.
4. Personal-goal status visible only as summary by default.
5. Memories/history accessible but not default-expanded.
6. Administration/editing accessible through actions and bounded dialogs/panels.

### Default visible information

- Active family goal title.
- Current/target progress and progress bar.
- Remaining action count or ready-to-celebrate message.
- Current celebration/reward title and status.
- Latest two appreciation moments with count and “+N more”.
- Personal-goal count and aggregate remaining steps.
- Latest celebration memory count or latest memory title, not a full history list.

### Information moved out of the default viewport

- Full helpful moment history.
- Full celebration memory history.
- Full personal-goal card grid.
- Personal-goal editing list.
- Long descriptions attached to moments/memories.

## Alternative compositions considered

### Alternative A: Three-column command dashboard

```text
Family progress hero | Appreciation feed | Goals/admin summary
Family progress hero | Celebration strip | Goals/admin summary
```

Pros:

- Keeps all concepts visible without a bottom full-width strip.
- Good for wide 1440px+ displays.

Cons:

- Too tight for 1366px laptops, especially with Dutch labels and action buttons.
- Risks making family progress less dominant.
- More likely to wrap actions and increase height.

### Alternative B: Reduced-information morale board

```text
Family progress hero | Morale rail
Family progress hero | Morale rail
```

Default rail contains only:

- one latest appreciation,
- current celebration status,
- personal-goal aggregate count,
- one button to open details.

Pros:

- Strongest viewport guarantee.
- Best at preventing the page from feeling like history/admin.
- Most clearly intentional about information reduction.

Cons:

- Hides more existing visible concepts by default.
- Requires users to open contextual panels more often.
- Less useful for at-a-glance parent review.

### Alternative C: Current four-card dashboard, strictly bounded

Keep the current four cards: goal, appreciation, celebrations, stats. Add strict heights, internal scrolling, and prevent appended details.

Pros:

- Smallest conceptual change from current implementation.
- Preserves recognizability.

Cons:

- Still shows many concepts at once.
- Does not solve information hierarchy as well as the recommended approach.
- More likely to need dense CSS tuning for 768px viewports.

### Preferred layout

The recommended layout is preferred because it preserves existing Motivation functionality while making a clear information hierarchy: family progress dominates, recognition and celebration support it, and history/admin move to bounded contextual surfaces. It intentionally reduces default visible information without removing access to existing functions.

## Overflow strategy for every section

| Section | Overflow strategy |
| --- | --- |
| Root Motivation page | No page overflow. Set the Motivation surface to fill available body height and hide root overflow only after all child regions are explicitly bounded. |
| Main dashboard grid | No auto-height growth. Use reserved rows/columns and `min-height: 0` on grid children. |
| Family goal title/copy | Clamp to 1-2 lines with accessible full text via native title/expanded detail if needed. Avoid allowing long text to enlarge the card. |
| Progress display | Fixed block. Numeric text scales down at shorter heights; progress bar remains visible. |
| Celebration summary in hero | Single compact strip. Hide secondary sentence on short viewports. Only one primary action visible. |
| Recent appreciation | Show latest 2 by default with `+N more`. Feed area internally scrolls only in expanded contextual panel, not in default card. |
| Appreciation creation | Modal/dialog overlay with internal form scroll if needed. It must not alter dashboard height. |
| Celebration summary card/strip | Show next/current item plus latest memory count. No more than 1-2 compact rows. |
| Celebration memory history | Open as a bounded side panel, modal, or in-place drawer replacing the support rail. History list scrolls internally. |
| Family stats | Fixed metric grid. Labels truncate/wrap to a fixed two-line maximum. Actions move to a compact command row if wrapping threatens height. |
| Personal-goal summary | Show aggregate count and remaining steps by default. Do not render all goal cards in the default viewport. |
| Personal-goal management | Bounded side panel/modal with internal scroll. Limit visible goal cards or paginate within panel. |
| Individual goal star/check rows | Cap visible icons or use segmented progress bars when target count exceeds a small threshold. Do not let high target counts create taller cards. |
| Empty state | Bounded inside family hero region with one explanation and one action. |
| Error/loading states | Occupy the relevant card's reserved area only. Loading or error messages must not add new page sections. |
| Responsive stacked layout | On common laptop/desktop widths, reduce density and row heights before stacking. If stacked below tablet/mobile widths, still keep shell bounded and use internal section scroll or mobile-specific navigation; do not use document scrolling for primary desktop/laptop validation. |

## Responsive strategy

- **Desktop/laptop (>=1180px):** Use the recommended two-column reserved dashboard. Must pass 1366×768 and 1440×900 without body/page scrolling.
- **Narrow desktop/tablet (860-1179px):** Prefer a compact two-row layout with family hero first and support cards in a horizontally scrollable/segmented support region, or use a bounded one-column layout with internal card scroll. Do not simply stack every card into document flow.
- **Short viewport (<760px height):** Reduce padding, icon sizes, line counts, and visible appreciation rows before hiding content. Family progress, current celebration status, and at least one appreciation signal should remain visible.
- **Mobile-like widths:** If the product later supports mobile, define a separate mobile interaction pattern. Do not let desktop viewport rules regress by relying on mobile-style document scrolling.

## Risks and trade-offs

- Moving history and personal-goal management out of the default viewport may make them feel less prominent. This is acceptable because Motivation should not default to administration/history.
- Internal scrolling inside contextual panels must be obvious and accessible.
- Line clamping can hide nuance in appreciation or celebration copy; expanded detail panels should preserve access to full content.
- A bottom celebration/memory strip may still be too much for 1366×768 if the page header or nav wraps. Implementation should prefer merging celebration summary into the hero if budget becomes tight.
- The current stylesheet has multiple Motivation layout passes. Implementation should consolidate intent rather than add another override layer.
- Hidden overflow can hide bugs. Validation must measure `document.body`, `.workspace-page-body`, and Motivation grid overflow, not only visual appearance.

## Recommendation for implementation

Implement the Motivation viewport-fit slice by following this analysis as the contract:

1. Keep the existing Motivation functionality and data flows.
2. Convert the Motivation root and dashboard to a height-bounded layout that consumes the reserved workspace body without relying on `.workspace-page-body` scrolling.
3. Make the active family goal/progress the dominant region.
4. Keep current celebration/reward status visible as a compact support signal.
5. Keep only a bounded appreciation preview visible by default.
6. Replace appended memory and personal-goal sections with bounded contextual panels/drawers/modals that scroll internally if needed.
7. Merge or compact family stats and personal-goal summary so the default viewport shows aggregate progress, not full administration.
8. Validate on 1366×768 and 1440×900 that there is no body/page scroll, no visible browser scrollbar, no shared page-body scroll reliance, and no clipped required content.

## Validation performed

Validation was analysis-only and source-inspection based.

Commands executed:

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
sed -n '1,220p' AGENTS.md
sed -n '220,520p' AGENTS.md
sed -n '1,220p' .github/copilot-instructions.md
sed -n '220,520p' .github/copilot-instructions.md
```

```bash
find src/HomeOps.Client -maxdepth 4 -type f | sed 's#^#/#' | rg -n "Motivation|motivation|\.tsx$|\.css$"
sed -n '1,620p' src/HomeOps.Client/src/MotivationPage.tsx
sed -n '1,220p' src/HomeOps.Client/src/HelpfulMoments.tsx
sed -n '1,360p' src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx
sed -n '1,120p' src/HomeOps.Client/src/workspaces/workspaceModel.ts
sed -n '134,310p' src/HomeOps.Client/src/styles.css
sed -n '4507,5155p' src/HomeOps.Client/src/styles.css
sed -n '6620,6835p' src/HomeOps.Client/src/styles.css
sed -n '1,220p' src/HomeOps.Client/src/MotivationPage.test.tsx
```

```bash
git branch --show-current
git status --short
git ls-files .dotnet-home .nuget .npm-cache .github/copilot-instructions.md src/HomeOps.Client/src/MotivationPage.tsx src/HomeOps.Client/src/styles.css
```

No .NET, npm, Playwright, export, screenshot, or binary-producing command was run. No implementation validation was required or performed because this task explicitly forbids implementation changes.

## Files inspected

- `AGENTS.md`
- `.github/copilot-instructions.md`
- `src/HomeOps.Client/src/MotivationPage.tsx`
- `src/HomeOps.Client/src/HelpfulMoments.tsx`
- `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx`
- `src/HomeOps.Client/src/workspaces/workspaceModel.ts`
- `src/HomeOps.Client/src/styles.css`
- `src/HomeOps.Client/src/MotivationPage.test.tsx`
- `docs/roadmap/phase-2.md` search output was reviewed for existing Motivation context.
- Existing Motivation report search results under `docs/reports/2026-06-20-motivation-page-ux/` were reviewed for historical product framing.

## Confirmation that no implementation changes were made

Confirmed. This task produced only this Markdown analysis report under `docs/reports/2026-07-03-work/`.

## Confirmation that no binary files were added

Confirmed. No screenshots, videos, PNG, JPG, JPEG, GIF, WEBP, PDF, or other binary files were added.
