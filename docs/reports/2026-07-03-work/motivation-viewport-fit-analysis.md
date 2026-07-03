# Motivation Viewport-Fit Analysis

## Summary

This is the mandatory viewport-first analysis for the Motivation page only. No source implementation was changed. This addendum re-evaluates Motivation from first principles and intentionally ignores the current widget structure when deciding the default information hierarchy.

The first-principles conclusion is that Motivation should communicate a continuous family story, not a collection of independent status widgets. In five seconds, a family should understand: **what we are working toward, why it matters emotionally, and what recent proof shows we are becoming that kind of family.**

The previous recommendation remains directionally correct about bounding the viewport and moving history/admin details into contextual surfaces, but it is no longer the strongest information architecture. A three-region family story is stronger than the prior bounded-card dashboard because it creates a clearer emotional hierarchy, reduces cognitive load, and treats statistics as supporting evidence rather than a permanent standalone destination.

Updated recommendation: preserve existing functionality, but make the default Motivation viewport only three permanent regions:

1. **Shared family purpose**: active family goal, progress, and why the goal matters.
2. **Encouragement and appreciation**: recent recognition and the next emotionally meaningful encouragement prompt.
3. **Celebration story**: what happened recently, what is ready to celebrate next, and a compact family-memory signal.

Statistics, personal-goal administration, full memories, and history should become contextual or summarized. They should remain accessible, but they should not define the default Motivation page.

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

Motivation should primarily answer: **What kind of family are we becoming together, and what should encourage us today?** It should behave more like a family story board than a history, rewards, statistics, or administration page.

Five-second understanding target:

- The family knows the shared purpose currently in focus.
- The family sees concrete progress without needing to inspect numbers.
- Someone feels noticed, appreciated, or encouraged.
- The family understands what is worth celebrating next.

First-principles ranking of possible Motivation purposes:

| Rank | Purpose | Importance | Reasoning | Default viewport role |
| ---: | --- | --- | --- | --- |
| 1 | Encouragement | Essential | The page should make family members feel capable and willing to continue. | Permanent emotional tone across the page. |
| 2 | Family identity | Essential | Long-term motivation comes from reinforcing “this is who we are together,” not only from counts. | Permanent narrative frame. |
| 3 | Progress | Essential | Families need to see forward movement toward a shared outcome. | Permanent, but explained in human terms. |
| 4 | Celebration | High | Celebration closes the motivation loop and makes effort feel worthwhile. | Permanent as a story/status region. |
| 5 | Appreciation | High | Recognition makes motivation relational rather than transactional. | Permanent, but as curated recent proof. |
| 6 | Personal goals | Medium | Individual goals matter when they connect to the shared family story. | Summarized by default; full management contextual. |
| 7 | Memories | Medium | Memories deepen identity and reflection, but they are not always the immediate motivator. | Compact signal/contextual detail. |
| 8 | Rewards | Medium-low | Rewards can clarify the next celebration, but they risk turning Motivation into a transaction. | Embedded within celebration, not standalone. |
| 9 | Statistics | Low | Statistics describe activity; by themselves they rarely create emotional motivation. | Secondary evidence/contextual detail. |

Updated findings:

- The strongest default signal should be a continuous family story: current purpose, recent encouragement, and next celebration.
- Family progress should remain highly visible, but it should serve the story rather than dominate as a numeric scoreboard.
- Celebration and appreciation deserve permanent space because they create emotional meaning around effort. They should be curated and bounded, not full feeds.
- Statistics should not have their own permanent card. Metrics can support the story as small proof points inside the purpose or celebration regions, or live in a contextual details panel.
- Personal goals should not appear as full cards by default. They should surface only as a family-level summary when they support the shared purpose.
- Memories and history should not be default lists. They should appear as the latest meaningful memory or as a contextual family archive.
- The current design is too close to a status dashboard. It exposes many valid concepts, but it does not sufficiently answer which emotional message the family should take away first.
- The viewport-fit problem should be solved through information hierarchy first and CSS bounding second.

## First-principles three-region investigation

If Motivation had only three permanent visual regions, they should be:

### 1. Shared family purpose

Why it deserves permanent viewport space:

- This is the page anchor. Without a visible shared purpose, the page becomes a set of unrelated motivational fragments.
- It answers “what are we working toward?” and “why does this matter to us?”
- It supports long-term motivation by connecting daily effort to family identity.

Information that belongs here:

- Active family goal title.
- Human-readable reason or encouragement sentence.
- Current progress and remaining effort.
- One compact celebration/reward status only when it clarifies the goal.
- A small supporting metric if it strengthens progress comprehension.

Information that does not belong here:

- Full personal-goal management.
- Full statistics grids.
- Long reward descriptions.
- Historical memories that distract from the current purpose.

### 2. Encouragement and appreciation

Why it deserves permanent viewport space:

- Motivation is relational. A family board should show that effort is seen and appreciated.
- Appreciation is often more emotionally motivating than abstract progress.
- This region gives the page warmth and immediacy.

Information that belongs here:

- One or two recent appreciation moments.
- Who was noticed and why.
- A compact prompt/action to add appreciation.
- A “more appreciation” count or contextual entry point.

Information that does not belong here:

- The full appreciation history.
- Administrative filters.
- Statistics about appreciation volume unless used as a small supporting proof point.
- Personal-goal editing controls.

### 3. Celebration story

Why it deserves permanent viewport space:

- Celebration turns effort into shared memory.
- It answers “what happened recently?” and “what should we celebrate next?”
- It creates continuity between past effort, present encouragement, and future reward.

Information that belongs here:

- Ready-to-celebrate or next-celebration state.
- Latest meaningful memory or memory count.
- One next action such as celebrate, view story, or open history.
- A small personal-goal/family-goal signal only when it explains what celebration is approaching.

Information that does not belong here:

- Full memory timeline.
- Full reward catalog.
- Full statistics card.
- Unbounded history.

Everything else should become contextual: details panels, bounded drawers, dialogs, or drill-in views that preserve existing functionality without competing for permanent viewport space.

## Challenge of existing sections

| Existing section | Default treatment | Rationale |
| --- | --- | --- |
| Family Goal | Permanent | It is the clearest expression of current shared purpose, but it should include meaning and progress rather than exist as a standalone progress widget. |
| Celebration | Permanent, integrated | Celebration is emotionally central, but it should be part of the family story rather than a separate card competing with the goal. |
| Appreciation | Permanent, curated | Appreciation provides encouragement and relational warmth. Keep a bounded recent preview only. |
| Family Stats | Contextual / embedded proof points | Statistics describe activity more than they motivate. Do not reserve a standalone permanent card. Use small metrics inside story regions or move detailed stats behind “details.” |
| Personal Goals | Summarized / contextual | Personal goals matter when tied to family purpose, but full management is administrative and should not occupy default viewport space. |
| Memories | Summarized / contextual | A latest memory or memory count supports the story; full memories belong in history/archive. |
| History | Contextual | History is reflective, not part of the five-second default motivation message. It should open in a bounded archive/detail surface. |

## Statistics investigation

Statistics should not have their own permanent card in the default Motivation viewport. They are useful, but they are usually evidentiary rather than motivational. A family is more likely to feel motivated by “we are close to movie night because everyone helped this week” than by a detached grid of totals.

Recommended statistics placement:

- Place one or two small proof points inside the Shared family purpose region when they clarify progress.
- Place celebration-related counts inside Celebration story when they explain readiness or recent achievement.
- Move full household statistics into a contextual details panel, drawer, or secondary analytics view.
- Avoid making statistics the visual endpoint of Motivation; they should support emotional comprehension, not replace it.

## Family story investigation

A continuous family story creates a stronger emotional hierarchy than the existing independent-widget dashboard. The story should read as:

1. **What are we working toward?** The shared goal and current progress.
2. **Why does it matter?** A short encouragement or identity statement.
3. **What happened recently?** Appreciation or a meaningful memory.
4. **What should we celebrate next?** The next celebration/reward state and action.

This structure is stronger because it lets every default region answer part of one emotional narrative. The existing dashboard asks users to compare separate cards and infer the story themselves. The three-region story makes the intended takeaway explicit.

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

Recommended three-region story allocation inside ~620 px:

| Story region | Height | Contents |
| --- | ---: | --- |
| Shared family purpose | 360-390 px, sharing top row with encouragement on desktop | Goal, meaning, progress, remaining effort, compact celebration context. |
| Encouragement and appreciation | 360-390 px, right side of top row on desktop | Latest 1-2 appreciation moments, add action, +N more. |
| Celebration story | 170-200 px | Ready/next celebration, latest memory/count, contextual detail entry point. |
| Grid gaps | 12-18 px | One vertical gap and one column gap; no appended sections. |

A two-column top row plus shallow bottom story region fits this budget if the three permanent regions are treated as reserved regions instead of independent auto-height cards. If the bottom story region cannot fit 768px reliably during implementation, the analysis must be revised rather than silently reverting to page scrolling.

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
| Family stats card | No standalone card | Secondary evidence | Contextual or embedded proof points | Do not reserve a permanent statistics card. Use at most 1-2 relevant proof points inside story regions; detailed stats move to contextual details. |
| Personal goals detail | No | Secondary/admin | Contextual drawer/panel with internal scroll | Default should show only summary such as active count and remaining steps. Full cards and editing belong in a bounded management panel. |
| Individual goal cards | No by default | Secondary/admin | Bounded internal list | Limit visible cards or make list internally scrollable. Star rows should be capped/condensed for high target counts. |
| Celebration memory detail | No by default | Secondary/history | Contextual drawer/panel with internal scroll | Default should show latest memory summary/count only. History must never append below dashboard. |
| Empty family-goal state | Yes when no goal | Primary | Fixed within family goal region | Empty state should occupy the primary region only; do not add extra explanatory sections. |
| Dialog overlays | Contextual | Workflow | Viewport-bounded modal | Dialogs should fit viewport with internal scrolling for form overflow. |

## Recommended dashboard composition

Updated recommended composition: **three-region family story**.

The implementation contract should no longer be “current cards, bounded better.” It should be “three permanent story regions, with existing functions preserved behind contextual access.”

### Overall grid

Desktop/laptop layout within the Motivation body:

```text
┌──────────────────────────────────────────────────────────────┐
│ Workspace header: Motivatie                                  │
├──────────────────────────────────────────────────────────────┤
│ Motivation story board, fixed available height               │
│ ┌────────────────────────────────────┬─────────────────────┐ │
│ │ Shared family purpose              │ Encouragement       │ │
│ │ - active goal                      │ - latest thanks     │ │
│ │ - why it matters                   │ - noticed effort    │ │
│ │ - progress and remaining effort    │ - add appreciation  │ │
│ │ - compact celebration context      │ - +N more           │ │
│ ├────────────────────────────────────┴─────────────────────┤ │
│ │ Celebration story                                          │ │
│ │ - ready/next celebration                                   │ │
│ │ - latest memory or memory count                            │ │
│ │ - compact detail/history entry point                       │ │
│ └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Reserved regions

- Root Motivation page: `height: 100%`, `min-height: 0`, `overflow: hidden`.
- Story board: fixed to available body height and composed of three permanent regions.
- Shared family purpose: largest region; owns the primary left/top space.
- Encouragement and appreciation: bounded right rail or secondary region; shows only recent curated encouragement.
- Celebration story: shallow bottom region or equivalent reserved story region; never an appended document section.
- Contextual surfaces: details, full stats, personal-goal management, memories, and history open in bounded drawers/dialogs/panels with internal scrolling.

### Component priorities

1. Shared family purpose and progress always visible.
2. Encouragement/appreciation always visible as relational proof.
3. Celebration story always visible as the emotional payoff and next family moment.
4. Personal-goal status summarized only when it supports the shared story.
5. Statistics embedded as small proof points or moved to contextual details.
6. Memories/history accessible but not default-expanded.
7. Administration/editing accessible through actions and bounded dialogs/panels.

### Default visible information

- Active family goal title.
- Short statement of why the goal matters or encouraging next step.
- Current/target progress and progress bar.
- Remaining action count or ready-to-celebrate message.
- Current celebration/reward status only as part of the story.
- Latest one or two appreciation moments with count and “+N more.”
- Latest celebration memory title/count or next celebration prompt.
- At most one or two small statistics when they directly clarify progress or celebration readiness.

### Information moved out of the default viewport

- Standalone family statistics card.
- Full helpful moment history.
- Full celebration memory history.
- Full personal-goal card grid.
- Personal-goal editing list.
- Long descriptions attached to moments/memories.
- Any history/archive list that requires variable page height.

## Alternative compositions considered

### Option A: Current dashboard with bounded cards

This option keeps the existing four-card dashboard structure and prevents appended sections from causing page scroll.

| Criterion | Evaluation |
| --- | --- |
| Emotional clarity | Moderate. The page contains motivational ingredients, but the user must infer the story. |
| Cognitive load | Moderate-high. Several cards compete for attention. |
| Motivation | Moderate. Progress is visible, but encouragement can feel like one widget among many. |
| Encouragement | Moderate. Appreciation is present, but not necessarily central. |
| Family usability | Good for users who already know the page; weaker for quick five-second comprehension. |
| Viewport efficiency | Moderate. Bounded cards can fit, but four concepts plus actions consume space. |
| Information hierarchy | Weak-moderate. Existing cards preserve structure more than intent. |
| Long-term product identity | Moderate. Feels like a dashboard, less like a family morale surface. |

### Option B: Previous recommended bounded morale dashboard

This is the earlier recommendation: one dominant progress region, compact appreciation/progress support regions, and a celebration/memory strip.

| Criterion | Evaluation |
| --- | --- |
| Emotional clarity | Good. Family progress dominates and support content is reduced. |
| Cognitive load | Good. Fewer default details than the current dashboard. |
| Motivation | Good. Progress and celebration are prominent. |
| Encouragement | Good, though appreciation is still a support card rather than part of a continuous story. |
| Family usability | Good. Preserves recognizable areas and keeps common tasks accessible. |
| Viewport efficiency | Good, but the support-card model may still invite too many permanent cards. |
| Information hierarchy | Good. Better than current, but still card/dashboard-oriented. |
| Long-term product identity | Good. Establishes Motivation as morale-oriented, but not as strongly as the story model. |

### Option C: Three-region family story

This option ignores current widget boundaries and creates only three permanent regions: shared purpose, encouragement/appreciation, and celebration story.

| Criterion | Evaluation |
| --- | --- |
| Emotional clarity | Strongest. The five-second takeaway is explicit. |
| Cognitive load | Strongest. Three regions reduce scanning and eliminate permanent statistics/admin competition. |
| Motivation | Strongest. Progress, recognition, and celebration form one loop. |
| Encouragement | Strongest. Appreciation becomes a central emotional signal. |
| Family usability | Strong. Families can understand the page quickly; detailed tasks remain available contextually. |
| Viewport efficiency | Strongest. Three reserved regions are easier to bound than many cards. |
| Information hierarchy | Strongest. Every region has a distinct narrative job. |
| Long-term product identity | Strongest. Positions Motivation as a family story and morale space, not an analytics dashboard. |

### Preferred layout

Option C is now preferred. It is stronger than the previous recommendation because it solves the deeper product problem, not only the layout problem. The earlier recommendation improved viewport control and hierarchy within a dashboard paradigm. The three-region family story reframes the page around the emotional job Motivation should perform: helping the family see purpose, feel encouraged, and anticipate celebration.

Option B remains a viable fallback if implementation reveals technical constraints, but only after the analysis is explicitly revised. Option A should not be used as the target because it preserves too much of the current information architecture.

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
| Family stats | No standalone default card. Embed only 1-2 relevant proof points in story regions; full statistics open in a bounded contextual surface with internal scrolling if needed. |
| Personal-goal summary | Show aggregate count and remaining steps by default. Do not render all goal cards in the default viewport. |
| Personal-goal management | Bounded side panel/modal with internal scroll. Limit visible goal cards or paginate within panel. |
| Individual goal star/check rows | Cap visible icons or use segmented progress bars when target count exceeds a small threshold. Do not let high target counts create taller cards. |
| Empty state | Bounded inside family hero region with one explanation and one action. |
| Error/loading states | Occupy the relevant card's reserved area only. Loading or error messages must not add new page sections. |
| Responsive stacked layout | On common laptop/desktop widths, reduce density and row heights before stacking. If stacked below tablet/mobile widths, still keep shell bounded and use internal section scroll or mobile-specific navigation; do not use document scrolling for primary desktop/laptop validation. |

## Responsive strategy

- **Desktop/laptop (>=1180px):** Use the recommended three-region story board: shared purpose and encouragement in a bounded top row, celebration story in a bounded bottom region. Must pass 1366×768 and 1440×900 without body/page scrolling.
- **Narrow desktop/tablet (860-1179px):** Prefer a compact two-row layout with family hero first and support cards in a horizontally scrollable/segmented support region, or use a bounded one-column layout with internal card scroll. Do not simply stack every card into document flow.
- **Short viewport (<760px height):** Reduce padding, icon sizes, line counts, and visible appreciation rows before hiding content. Family progress, current celebration status, and at least one appreciation signal should remain visible.
- **Mobile-like widths:** If the product later supports mobile, define a separate mobile interaction pattern. Do not let desktop viewport rules regress by relying on mobile-style document scrolling.

## Risks and trade-offs

- Moving history and personal-goal management out of the default viewport may make them feel less prominent. This is acceptable because Motivation should not default to administration/history.
- Internal scrolling inside contextual panels must be obvious and accessible.
- Line clamping can hide nuance in appreciation or celebration copy; expanded detail panels should preserve access to full content.
- A bottom celebration story region may still be too much for 1366×768 if the page header or nav wraps. If this occurs, implementation must stop and revise the analysis rather than invent a fourth card or rely on page scroll.
- The current stylesheet has multiple Motivation layout passes. Implementation should consolidate intent rather than add another override layer.
- Hidden overflow can hide bugs. Validation must measure `document.body`, `.workspace-page-body`, and Motivation grid overflow, not only visual appearance.

## Recommendation for implementation

Implement the future Motivation viewport-fit slice by following the updated three-region family story as the contract:

1. Preserve existing Motivation functionality and data flows.
2. Convert the Motivation root and dashboard to a height-bounded layout that consumes the reserved workspace body without relying on `.workspace-page-body` scrolling.
3. Build the default viewport from exactly three permanent regions: Shared family purpose, Encouragement and appreciation, and Celebration story.
4. Make the active family goal/progress the anchor of Shared family purpose, but include emotional meaning rather than presenting progress as a detached metric.
5. Keep appreciation visible as a curated encouragement signal, not as a full feed.
6. Keep celebration visible as story/payoff, including ready/next celebration and a compact memory signal.
7. Remove standalone permanent statistics from the default viewport; embed only small relevant proof points or move detailed stats to contextual details.
8. Replace appended memory and personal-goal sections with bounded contextual panels/drawers/modals that scroll internally if needed.
9. Summarize personal goals only when they support the shared family story; keep management contextual.
10. Validate on 1366×768 and 1440×900 that there is no body/page scroll, no visible browser scrollbar, no shared page-body scroll reliance, and no clipped required content.

This recommendation is stronger than the previous one because it intentionally designs the default emotional hierarchy before designing the grid. It preserves functionality while making the default Motivation page communicate a single coherent family story.

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

Addendum update commands executed on 2026-07-03:

```bash
pwd && rg --files -g 'AGENTS.md' -g 'motivation-viewport-fit-analysis.md' -g 'current-state.md' -g 'phase-*.md'
cat AGENTS.md
sed -n '1,620p' docs/reports/2026-07-03-work/motivation-viewport-fit-analysis.md
python3 - <<'PY'
# updated the Motivation report text only
PY
git diff -- docs/reports/2026-07-03-work/motivation-viewport-fit-analysis.md
git status --short
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
