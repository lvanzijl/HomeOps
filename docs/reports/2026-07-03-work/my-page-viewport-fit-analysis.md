# My Page Viewport-Fit Analysis

## Summary

This is an analysis-only report for the FamilyBoard **My Page / Family Member page**. No source implementation was changed.

The current My Page should be treated as a personal dashboard, not as a profile/settings document. The strongest one-primary-question for the page is:

> **How am I doing today?**

The recommended long-term composition is a fixed, viewport-bounded personal dashboard that keeps identity, today's personal focus, current progress, latest appreciation, and contextual actions visible without relying on the shared `.workspace-page-body` scroll region. The design intentionally reduces default visible information by moving expanded goal details, family-goal detail, history, and profile administration into bounded contextual panels/drawers.

## Scope

In scope:

- My Page / `FamilyMemberPage` analysis only.
- Current page composition, hierarchy, spacing, card sizing, responsive behavior, and overflow behavior.
- Child and adult variants present in the current implementation.
- Identity/avatar, personal progress, personal tasks/goals, appreciation, history, and profile/admin actions.
- A viewport-first composition proposal for later implementation.

Out of scope:

- Source code changes.
- CSS changes.
- Backend, API, database, schema, migration, or seed changes.
- New product features.
- Redesigning unrelated pages.
- Screenshots, videos, PDFs, or binary artifacts.

## My Page information-reduction findings

My Page currently shows too many personal concepts at the same page depth:

1. Page title and identity/avatar orientation.
2. Child daily tasks.
3. Helpful/appreciation moments.
4. Current individual or family progress.
5. Detailed personal progress disclosure.
6. Detailed family-goal disclosure.
7. Celebration memory disclosure.
8. Parent/profile administration disclosure.
9. Adult appreciation history and profile administration.
10. Avatar editing entry point.

The current child page already hides some secondary material inside disclosures, but those disclosures still occupy default layout rows and expand in the page flow. The adult page is even more profile/settings oriented: appreciation and the full administration form both sit in the normal page flow.

Recommended information reduction:

- Keep identity as orientation, not the dominant content.
- Make **today's personal focus plus current progress** the primary content.
- Keep appreciation visible as a compact emotional signal.
- Convert goal details, family-goal detail, history, avatar editing, and parent/profile administration into contextual, bounded surfaces.
- For adults, avoid making My Page a settings page; show a personal overview and expose administration through a compact action region.
- For children, use simpler labels and fewer simultaneous concepts by default; expose details progressively.

## One-primary-question recommendation

Recommended primary question:

> **How am I doing today?**

Why this is strongest:

- It supports both child and adult variants better than a profile-management question.
- It naturally combines identity, today's tasks, personal goal progress, and appreciation.
- It keeps My Page personal without turning it into authentication/profile/account management.
- It matches the existing child hero copy (`Hoe gaat het?`) and task prompt (`Wat kan ik vandaag doen?`) while clarifying hierarchy.

Rejected primary questions:

- **What is my place in the family today?** Warm and child-friendly, but less useful for adults and too identity-heavy.
- **What needs my attention?** Useful for tasks, but too operational and underplays progress/appreciation.
- **What progress am I making?** Good for motivation, but too narrow because My Page also contains daily focus and identity.

## Current layout assessment

### Current page composition

The page root renders as `.family-member-page`, a grid with a page-local heading, an identity hero, and then either child-mode content or adult content.

Child variant order:

1. Local page heading (`Familie`, `Pagina van {name}`).
2. Identity hero with large avatar, name, age/context, and avatar edit action.
3. `member-mode-shell`.
4. `child-progress-view child-mode` two-column grid.
5. Today card.
6. Compact Helpful Moments section.
7. Child hero/progress area spanning both columns.
8. Three detail disclosures: personal progress, family goal, memories.
9. Parent admin disclosure below the child grid.
10. Avatar editor modal when opened.

Adult variant order:

1. Local page heading.
2. Identity hero.
3. Non-compact Helpful Moments section.
4. Full Parent Administration settings section.
5. Avatar editor modal when opened.

### Current grid/layout behavior

- `.family-member-page` is a normal grid with `min-height: 100%` and no fixed row budget.
- `.workspace-page-body` is the shared scroll container (`overflow: auto`), so My Page can exceed the reserved workspace and scroll inside the page-body region.
- The identity hero uses a large two-column layout with a scaled large avatar and large responsive name type.
- Child mode uses a two-column grid, then places the child hero and one memory disclosure across both columns.
- Helpful Moments use a card grid and can display more cards when expanded.
- Parent administration uses nested two-column grids for identity/basic info and household/safety sections.

### Current responsive behavior

- The child grid collapses to one column below 760px.
- The child hero collapses to one column below 980px.
- Parent administration grids collapse to one column below 760px.
- These breakpoints improve narrow-width readability but do not create a fixed vertical budget. On smaller laptops, one-column stacking can increase height and worsen vertical overflow.

## Root causes of viewport overflow

My Page exceeds its reserved viewport because the page is structured as a document-like vertical stack inside the shared scroll body rather than a bounded dashboard.

Specific causes:

1. **Shared scroll reliance:** `.workspace-page-body` uses `overflow: auto`, so My Page can become taller than the available workspace and depend on internal page-body scrolling.
2. **No page-level row budget:** `.family-member-page` has `min-height: 100%` but no `height: 100%`, no `minmax(0, ...)` rows, and no containment for child regions.
3. **Duplicated orientation:** The shell already has page navigation and workspace context, but My Page adds a local page heading plus a large identity hero before primary content.
4. **Oversized identity region:** The identity header scales the large avatar and uses very large responsive name typography, consuming vertical space before daily focus/progress.
5. **Primary content order drift:** For children, Today and appreciation appear before the progress hero, while the hero itself spans both columns. This makes the page read as several competing modules rather than one dashboard answer.
6. **Default visible secondary rows:** The three detail disclosures and parent admin disclosure are collapsed, but their summaries still add rows and gaps to the default page.
7. **Expandable content in normal flow:** Opening details, appreciation expansion, or parent settings increases page height instead of being contained in a bounded region.
8. **Adult variant is settings-heavy:** Adult My Page places Helpful Moments plus full profile administration in the page flow, making settings permanently compete with personal context.
9. **Data-volume vulnerability:** Tasks are limited to three visible rows and memories are limited to three, but goals map all available goals when a disclosure opens; appreciation can expand; administration is full-height.
10. **Responsive stacking increases height:** At narrower desktop/laptop widths, two-column regions collapse or stack, increasing vertical height without a compensating density strategy.

## Desktop viewport budget

Assumptions for common laptop/desktop viewports:

- Browser viewport: 1366×768 and 1440×900 are primary budget targets.
- App shell outer padding/gaps: approximately 24-36px vertical total.
- Workspace navigation: approximately 48-64px depending on wrapping.
- Workspace panel padding: approximately 18-30px vertical total.
- Available page body height on a 768px-tall laptop: approximately 620-660px after shell/nav/panel chrome.

Recommended My Page vertical allocation for a 768px-tall laptop:

| Region | Target height | Notes |
| --- | ---: | --- |
| Navigation and shell chrome | 64px | Existing workspace navigation should remain outside My Page's internal budget. |
| Workspace panel padding/gaps | 28px | Existing panel padding and page-body bounds. |
| Page header/identity strip | 88-104px | Compact identity row with avatar, name, age/context, primary status, and avatar action. |
| Primary personal content region | 330-360px | Two-column area: Today/Focal tasks and progress/appreciation summary. |
| Secondary/action region | 92-120px | Compact action rail/tabs for profile, avatar, history, parent settings. |
| Reserved internal gaps/margins | 32-44px | Grid gaps and breathing room. |
| Total My Page content target | 560-628px | Fits within the estimated 620-660px page body budget. |

For 1440×900 and 1920×1080 viewports, the same composition should gain breathing room but should not grow unbounded. Cards should use maximum heights and internal overflow, not larger content stacks.

## Section-by-section evaluation

| Section | Current role | Primary/secondary | Always visible? | Height strategy | Information reduction / action |
| --- | --- | --- | --- | --- | --- |
| Workspace navigation | App navigation/context | Global primary chrome | Yes | Fixed outside page | Preserve. Ensure My Page does not rely on page-body scroll below it. |
| Local page heading | Page label (`Familie`, page name) | Secondary orientation | No, not as separate block | Merge into identity strip | Remove separate vertical row by combining page title/context with identity. |
| Identity/avatar hero | Person orientation and avatar edit | Supporting primary orientation | Yes, compact | Fixed 88-104px | Avatar should orient, not dominate. Use compact avatar and name/status. Avatar editing becomes an action. |
| Today card | Personal tasks/focus | Primary | Yes | Fixed/flexible bounded | Show 2-3 visible items, due/active count, and `+N more`; internal scroll only if needed. |
| Child progress hero | Current progress answer | Primary | Yes | Fixed/flexible bounded | Make this the main progress region beside or below Today. Keep one active goal and progress summary visible. |
| Helpful/appreciation | Emotional support/context | Secondary but valuable | Yes, compact | Fixed summary | Show latest one item or count/last appreciation. Full history in contextual panel. |
| Personal goal detail | Detailed progress/history | Secondary | No | Contextual panel/drawer | Summarize one active goal by default; move full list/detail out of default viewport. |
| Family-goal detail | Household context | Secondary support | Condensed only | Fixed mini-summary | Keep title/progress chip visible if relevant; full details contextual. |
| Celebration memories/history | History | Secondary | No | Contextual panel | Default shows at most a latest memory chip/count, not a full row. |
| Parent/profile administration | Settings/admin | Secondary/contextual | No | Bounded drawer/panel | Keep permanent compact action entry. Full form must not live in default page flow. |
| Adult appreciation section | Personal recognition | Secondary support | Compact yes | Fixed summary | Do not show full non-compact section by default. |
| Adult parent administration | Profile/settings | Secondary/contextual | No | Bounded drawer/panel | Adult My Page should not default to full settings page. |
| Avatar editor | Editing workflow | Contextual | No | Existing modal, bounded | Keep modal. Entry should be in action rail/identity strip. |

## Recommended dashboard composition

### Recommended layout: compact identity + two-region personal dashboard + bounded action rail

Use a viewport-bounded My Page grid:

```text
My Page viewport container (height: 100%, overflow: hidden)
┌────────────────────────────────────────────────────────────┐
│ Compact identity/context strip (fixed)                     │
│ avatar · name · age/context · primary question/status · actions │
├───────────────────────────────┬────────────────────────────┤
│ Primary focus column           │ Progress / appreciation column │
│ - Today focus card             │ - Current progress card      │
│ - 2-3 personal tasks           │ - Family-goal mini context   │
│ - +N more / open tasks action  │ - Latest appreciation summary │
│                               │ - Bounded secondary chip row  │
├───────────────────────────────┴────────────────────────────┤
│ Compact contextual action rail (fixed)                      │
│ Profile · Avatar · Goals detail · History · Parent settings │
└────────────────────────────────────────────────────────────┘
```

### Component priorities

1. **Compact identity strip:** Who this page is for and a one-line daily status. Avatar remains visible but smaller than today/progress content.
2. **Today focus card:** The clearest answer to what the person can do today. This is primary for both children and adults when applicable.
3. **Current progress card:** One active personal goal or family-goal fallback with progress visual and short encouragement.
4. **Latest appreciation:** Small emotional signal supporting the answer, not a full feed.
5. **Action rail:** Profile/admin/history/avatar controls as compact actions opening bounded panels.

### Child variant hierarchy

Children need a warmer, more visual hierarchy:

- Identity strip: avatar, name, age-friendly context, `Hoe gaat het vandaag?`.
- Main region: Today focus and progress both visible immediately.
- Appreciation: latest praise as a compact card/chip.
- Family goal: compact context inside progress card or as a mini-card, not a separate large default section.
- Details/history/settings: contextual panels.

### Adult variant hierarchy

Adults need less child-language and less profile administration by default:

- Identity strip: avatar, name, `Mijn overzicht vandaag`.
- Main region: personal context and appreciation summary. If no adult-owned tasks/goals exist, show a neutral profile/context summary without inventing new functionality.
- Admin/profile actions: compact action rail, not full default form.
- Full administration remains accessible in a bounded panel.

### Sizing strategy

- My Page root: `height: 100%`, `min-height: 0`, `overflow: hidden`.
- Grid rows: `auto minmax(0, 1fr) auto`.
- Main dashboard: `minmax(0, 1fr)` with two columns on desktop.
- Cards: `min-height: 0`, `max-height: 100%`, internal overflow only where needed.
- Avoid full-page document stacking and avoid expanding disclosures in normal flow.

## Alternative compositions considered

### Alternative A: progress-first hero with side task rail

Layout:

- Compact identity strip.
- Large central progress hero occupying most of the page.
- Narrow side rail for Today tasks, latest appreciation, and actions.

Pros:

- Strongly answers `How am I doing today?` through progress.
- Visually warm for children.
- Good when progress is the most important product concept.

Cons:

- Risks making tasks feel secondary even when today's attention is the practical need.
- Adults with little/no personal progress data could see a weak default page.
- Family-goal and appreciation context may compete in the rail.

Reason not preferred: My Page should balance today's focus and progress rather than turn into a Motivation detail page.

### Alternative B: intentionally reduced default page

Layout:

- Compact identity strip.
- One large `Today` card only, with a small inline progress/appreciation summary.
- Bottom action rail for everything else.

Pros:

- Maximum viewport reliability.
- Very clear one-question focus.
- Best for small laptop viewports and child simplicity.

Cons:

- Hides too much existing value by default, especially personal progress and appreciation.
- May feel underpowered compared with other FamilyBoard primary pages.
- Requires more user interaction to understand progress/history.

Reason not preferred: This reduces default visible information more than necessary. The recommended layout intentionally reduces information, but still preserves two primary signals: focus and progress.

### Alternative C: tabbed profile/dashboard/settings page

Layout:

- Identity header.
- Tabs: Today, Progress, Appreciation, Settings.
- Only one tab body visible.

Pros:

- Clear containment and low vertical risk.
- Administration is naturally separated.
- Easy to bound each tab body.

Cons:

- Tabs make the page feel like a settings/profile application.
- Requires interaction before the user sees both daily focus and progress.
- Less dashboard-like and less suitable for a five-second family display.

Reason not preferred: FamilyBoard primary pages should answer a household question immediately, not require tab navigation for the core answer.

## Overflow strategy for every section

| Section | Overflow handling |
| --- | --- |
| My Page root | `overflow: hidden`; never rely on `.workspace-page-body` scrolling. |
| Identity strip | Fixed height; truncate long names with ellipsis/wrap to two controlled lines; action buttons remain compact. |
| Today tasks | Show 2-3 visible tasks; display `+N more`; use internal list scroll only inside the card if the design requires more visible rows. Long task titles clamp to two lines. |
| Current progress | Show one active personal goal or fallback family goal. Full individual goal list moves to contextual panel. Long titles clamp; progress metrics stay visible. |
| Family goal context | Compact mini-summary inside progress region. Full details open in bounded panel. Celebration text clamps to one/two lines. |
| Appreciation | Show latest one appreciation or count/empty state. Full history opens in bounded panel or dialog. Feed expansion must not occur in page flow. |
| Celebration memories | Hidden from default viewport except optional latest/count chip. Full memory list in bounded panel with internal scroll. |
| Parent/profile administration | Compact action entry only. Full form in drawer/modal/panel with its own internal scroll. |
| Avatar editing | Existing modal pattern remains; ensure editor is bounded and internally scrollable if options exceed height. |
| Adult settings/actions | Compact secondary action rail. Full administration in bounded contextual panel. |
| Loading/error states | Reserve the same card heights as ready states to avoid layout shift. |

## Responsive strategy

Desktop/laptop:

- Keep two-column main dashboard down to a practical width threshold if possible.
- Use a compact identity row and fixed bottom action rail.
- Reduce gaps and card padding before changing information hierarchy.

Narrow desktop/tablet:

- Collapse to a bounded two-row layout only if the main region still fits: Today and Progress as equal-height stacked cards inside `minmax(0, 1fr)`.
- Reduce visible task rows from three to two.
- Convert appreciation to a chip/summary row.

Mobile/small height:

- The product rule still forbids page scrolling for primary pages. Use denser spacing, fewer visible rows, and internal card/panel scrolling.
- Avoid placing all cards in a natural document stack.
- Keep action rail horizontally scrollable if needed, not vertically expanding.

## Risks and trade-offs

- Moving settings out of default view may make administration feel less immediate, but it aligns with My Page as a personal dashboard rather than a settings page.
- Reducing avatar dominance could feel like a visual downgrade for children unless the identity strip remains warm and personal.
- A fixed viewport dashboard requires careful empty/loading/error states so cards do not collapse awkwardly.
- Adult pages currently have less true personal dashboard data than child pages; the implementation should preserve current functionality without inventing new adult-only features.
- Contextual panels must remain accessible by keyboard and screen readers.
- If later implementation discovers that existing shared shell constraints prevent page-level containment, the analysis should be revised before implementation continues.

## Recommendation for implementation

Implement My Page later as one bounded dashboard slice:

1. Convert `.family-member-page` into a fixed-height, non-scrolling dashboard container with explicit rows.
2. Merge the separate local heading into a compact identity/context strip.
3. Reorder child content so the page immediately answers **How am I doing today?** with Today focus and current progress as the main region.
4. Convert appreciation, family-goal details, personal-goal details, memories, and profile/admin settings into compact summaries plus bounded contextual panels.
5. Apply the same dashboard principle to adult pages: no full default administration form in the page flow.
6. Validate against desktop/laptop viewports by checking no document/body/page-body vertical overflow and no browser/page scrollbar.

## Validation performed

Commands executed with repository-local environment variables configured:

```bash
export DOTNET_CLI_HOME="$PWD/.dotnet-home"
export DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1
export DOTNET_NOLOGO=1
export NUGET_PACKAGES="$PWD/.nuget/packages"
export npm_config_cache="$PWD/.npm-cache"
mkdir -p "$DOTNET_CLI_HOME" "$NUGET_PACKAGES" "$npm_config_cache"
```

Validation and inspection commands:

```bash
find .. -name AGENTS.md -print
sed -n '1,220p' AGENTS.md
sed -n '1,220p' .github/copilot-instructions.md
git status --short
git branch --show-current
rg -n "My Page|MyPage|my-page|mypage|profile|avatar|personal" -S src docs . --glob '!node_modules' --glob '!.git' --glob '!.dotnet-home' --glob '!.nuget' --glob '!.npm-cache'
rg -n "FamilyMember|Mijn|My Page|MyPage|my page|family-member|child|Parent Mode|Ouder|Kind" src/HomeOps.Client/src -S --glob '!node_modules'
sed -n '1,260p' src/HomeOps.Client/src/home/FamilyMemberPage.tsx
sed -n '260,620p' src/HomeOps.Client/src/home/FamilyMemberPage.tsx
nl -ba src/HomeOps.Client/src/home/FamilyMemberPage.tsx | sed -n '1,820p'
nl -ba src/HomeOps.Client/src/styles.css | sed -n '140,340p'
nl -ba src/HomeOps.Client/src/styles.css | sed -n '1180,1285p'
nl -ba src/HomeOps.Client/src/styles.css | sed -n '2388,2898p'
nl -ba src/HomeOps.Client/src/styles.css | sed -n '3860,3916p'
nl -ba src/HomeOps.Client/src/HelpfulMoments.tsx | sed -n '1,220p'
```

No build, test, Playwright, export, or screenshot command was run because the requested deliverable is analysis-only and implementation validation is intentionally deferred.

## Files inspected

- `AGENTS.md`
- `.github/copilot-instructions.md`
- `src/HomeOps.Client/src/home/FamilyMemberPage.tsx`
- `src/HomeOps.Client/src/HelpfulMoments.tsx`
- `src/HomeOps.Client/src/styles.css`
- `docs/state/current-state.md`
- Existing report examples under `docs/reports/2026-07-02-work/` and `docs/reports/2026-07-03-work/`

## Confirmation that no implementation changes were made

Confirmed. This task only added this markdown analysis report. No application source, test, API, schema, migration, seed, style, or runtime implementation file was modified.

## Confirmation that no binary files were added

Confirmed. No screenshots, videos, PNG, JPG, JPEG, GIF, WEBP, PDF, or other binary files were added.
