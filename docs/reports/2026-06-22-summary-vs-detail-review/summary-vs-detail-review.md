# Summary vs Detail Review

Date: 2026-06-22

Evidence reviewed:

- Home Screen UX Review: `docs/reports/2026-06-21-home-screen-ux-review/home-screen-ux-review.md`
- Cross-Page UX Pattern Review: `docs/reports/2026-06-22-cross-page-ux-pattern-review/cross-page-ux-pattern-review.md`
- Full Visual System Review: `docs/reports/2026-06-22-full-visual-system-review/full-visual-system-review.md`
- Visual evidence: `home-full.png`, `motivation-full.png`, `child-young-full.png`, `child-older-full.png`, `tasks-full.png`, `shopping-full.png`, and `weekly-reset-full.png` in `docs/reports/2026-06-22-full-visual-system-review/`

## Executive Summary

Yes. HomeOps has a systemic Summary vs Detail problem, but it is uneven across pages.

The recent Dashboard First, Execution First, and Review First work corrected the most obvious management-first failures on Home, Tasks, Lists, and Weekly Reset. However, the current product still frequently asks an overview page to behave like a detail page. The remaining pattern is less about raw feature placement and more about depth: oversized cards, full authoring surfaces, repeated row controls, repeated progress stories, and recap-level content appear in places where users need a fast answer first.

The clearest current offenders are:

1. **Motivation** — tries to show family goal status, celebration memory, Helpful Moments authoring, Helpful Moment history, and personal goals in one long status page.
2. **Child Workspace** — shows child identity, primary progress, family goal participation, today tasks, weekly progress, family goal again, and Helpful Moments; it repeats the same story at multiple depths.
3. **Home** — is correctly an overview in concept, but its hero/add treatment and shopping preview still allow detail-level visual weight to compete with the actual daily summary.
4. **Weekly Reset** — is correctly a review page, but shows row-level review decisions and recap detail at once, creating a deep maintenance surface.
5. **Lists and Tasks** — are much improved after compaction, but still expose some detail controls on their overview surfaces.

The highest-value next UX slice is **Overview/detail separation**, starting with **Motivation and Child Workspace content depth**. Shell compaction remains visually important, but the Summary vs Detail problem is now most damaging where emotional/status pages expose too much narrative and authoring depth at once.

## Summary vs Detail Model

### Overview pages in HomeOps

An overview page should answer one primary question in one scan. It should show enough information for orientation and the next likely action, but not the full underlying workflow.

Overview content should include:

- Current state: what is happening now, due now, active now, or ready now.
- Small counts and short summaries.
- Top one to three representative items.
- Primary next action.
- Clear routing to deeper pages.
- Exceptional states that change priority, such as overdue tasks, ready celebrations, or stale review candidates.

Overview pages should optimize for:

- Fast scanning.
- Low scrolling.
- Strong hierarchy.
- Fewer controls.
- “What should I know or do next?” rather than “what can be configured here?”

### Detail pages in HomeOps

A detail page should support deliberate exploration, editing, management, history, explanation, and larger workflows. It can be longer and more control-heavy because the user has chosen depth.

Detail content should include:

- Full item lists.
- Item history and recap history.
- Forms and multi-field authoring.
- Edit, archive, delete, rename, and settings controls.
- Full recurrence/template concepts.
- Store assignment details.
- Celebration memory detail.
- Helpful Moment creation and browsing.
- Personal goal editing.
- Review rationale and review decisions.

Detail pages should optimize for:

- Completeness.
- Clear local workflow.
- Error prevention.
- Intentional action.
- Lower pressure to fit above the fold.

### What should never appear on an overview page

The following should not appear by default on overview pages unless the page itself is explicitly a management or review page:

- Full create/edit forms.
- Rename/archive/delete controls.
- Repeated row actions on every item.
- Raw/internal status values.
- Empty sections that do not change the next action.
- Full histories or recaps.
- Multiple competing versions of the same progress story.
- Settings and lifecycle controls.
- Advanced recurrence/template controls.
- Authoring surfaces that are not the page's primary job.

## Home Review

### Is Home an overview page?

Yes. Home is the household overview. Its primary job is to answer: **what matters today?** The prior Home review already framed Home as a today board rather than a capture surface, and the current visual evidence shows Home using summary cards for Agenda, Tasks, Motivation, and Shopping.

### Does Home contain detail information?

Some, but the deeper issue is detail-level visual weight rather than raw detail quantity.

Current summary-appropriate content:

- Date/time context.
- Family member chips as navigation/context.
- Agenda preview.
- Overdue/upcoming task preview.
- Motivation progress summary.
- Shopping list preview.
- Links to full pages.

Current detail-like or over-weighted content:

- The oversized central Add treatment in the hero. It is not detail content, but it behaves like a detail/action surface because it dominates the first scan.
- The Shopping card shows individual item rows and repeated list names. That is acceptable only as a tiny preview; it becomes detail-like if expanded further.
- Agenda still occupies a large amount of vertical space relative to Tasks, even when overdue tasks are more urgent.
- Shopping item examples include store labels; useful, but store-level detail should remain compact.

### What should remain?

Home should retain:

- Today/next Agenda.
- Overdue and due-soon Tasks.
- One compact Motivation state.
- One compact Shopping reminder.
- Compact quick-capture actions.
- Family/date context.

### What should move elsewhere?

Home should not contain:

- Full capture forms.
- More than a compact preview of shopping items.
- Full agenda detail.
- Family member management.
- Advanced task or list controls.
- Celebration history or Helpful Moments detail.

### Determination

Home is correctly scoped in concept after recent compaction, but not yet cleanly in presentation. It remains an overview page with a detail-weight problem: the hero/add treatment and large preview cards slow the answer to “what matters today?”

## Tasks Review

### What belongs on Tasks overview?

Tasks overview should show active execution state:

- Overdue tasks.
- Due today tasks.
- Upcoming tasks.
- Owner and due date.
- A compact Add Task action.
- Compact navigation to templates, recurrence management, Someday, and Weekly Reset.

### What belongs in task detail?

Task detail should contain:

- Full task edit form.
- Recurrence rules and series-level decisions.
- Template configuration.
- Someday lifecycle decisions.
- Archive/delete decisions.
- Full review history.
- Notes, advanced metadata, or future approvals if introduced later.

### Are recurrence, templates, Someday, and review concepts correctly placed?

Mostly after the compaction work. The Cross-Page UX Pattern Review identified Tasks as the clearest unresolved offender before compaction, because creation, templates, Weekly Reset, recurrence, and Someday competed with active responsibilities. The current visual system review says the page now feels execution-first and that management is mostly secondary.

Remaining issues:

- The current screenshot shows a loading state, so the visible evidence does not fully prove the populated hierarchy.
- Add Task, Templates, and Weekly Reset are compact, but still appear above the populated task board area in the loading view.
- Row-level `Edit` / `Complete` noise was identified as a remaining density problem in the full visual review.
- Empty groups such as `Due Today / No tasks` should not compete with active urgency groups.

### Determination

Tasks was mixing summary and detail severely before the compaction slice. It is now mostly corrected. The remaining Summary vs Detail risk is row-level control density and secondary management entry points, not page-level scope.

## Lists Review

### What belongs on a shopping overview?

A shopping/list overview should show:

- Active list count.
- Quick add.
- Active items grouped by store when useful.
- Checked/completed state only when relevant.
- A compact indication of completed/deleted content, not full management.
- A compact path to list settings.

### What belongs in list detail?

List detail should contain:

- Full item history.
- Completed items when there are enough to review.
- Recently deleted items.
- Rename/archive/delete list controls.
- Store assignment and store management.
- List lifecycle settings.

### Are store controls, lifecycle controls, and settings correctly placed?

Mostly. The current screenshot shows active shopping behavior first: item add, active items, and store grouping. `List settings` is collapsed, which correctly demotes lifecycle controls. This is a strong correction from the earlier pattern where rename/archive/delete controls were too prominent.

Remaining issues:

- Store controls are repeated per row. This is useful when organizing a shopping trip, but on a high-level list page it can look like management detail.
- Completed and Recently Deleted sections appear even when empty, adding detail scaffolding without useful content.
- The page title still says “Full lists page for household list management,” which positions the page as a mixed execution/management surface.

### Determination

Lists is no longer a major Summary vs Detail offender. It is an execution page with some visible detail scaffolding. The next refinement should hide empty detail sections and keep store controls progressive when the list grows.

## Motivation Review

### What belongs on Motivation overview?

Motivation overview should show:

- Current family goal name.
- Progress toward the family goal.
- Whether celebration is ready, close, or recently completed.
- A small count or preview of Helpful Moments.
- A small preview of personal goals.
- Clear entry points to Family Goal detail, Helpful Moments, Memory, and Personal Goals.

### What belongs in Family Goal detail?

Family Goal detail should include:

- Full goal description.
- Goal edit controls.
- Celebration rules and reward/celebration detail.
- Full progress history.
- Family member contribution breakdown.
- Celebration readiness and completion flow.

### What belongs in Helpful Moments detail?

Helpful Moments detail should include:

- Appreciation creation form.
- Full Helpful Moment list.
- Filtering by child, value, or time.
- Editing/deleting moments if supported.
- Long notes and history.

### What belongs in Memory detail?

Memory detail should include:

- Celebration memory gallery/history.
- Full recap text.
- Date and contributor context.
- Multiple past celebrations.

### What belongs in Personal Goal detail?

Personal Goal detail should include:

- Full child goal cards.
- Edit controls.
- Step-level progress.
- Per-child history.
- Goal creation.

### Is Motivation trying to show too many concepts simultaneously?

Yes. Motivation is the strongest current Summary vs Detail offender.

The screenshot shows a family-goal status section, a large celebration memory section, a large Helpful Moments section with a visible creation form, multiple Helpful Moment cards, and personal goal cards on the same page. Each of these can be valid, but together they make Motivation behave as overview, authoring page, memory archive, and personal-goal dashboard simultaneously.

The most problematic mix is Helpful Moments. It is both content and authoring. The visible creation form pulls the page toward data entry inside what should first be a status and encouragement overview. Personal goals also appear as large cards with edit controls, which pushes detail into the overview.

### Determination

Motivation needs a clearer split:

- Motivation overview: active family goal, readiness/celebration status, compact Helpful Moments preview, compact personal-goal preview.
- Family Goal detail: goal progress and editing.
- Helpful Moments detail: create and browse appreciations.
- Memory detail: celebration memories and recaps.
- Personal Goal detail: child-specific goal management.

## Child Workspace Review

### What should a child see immediately?

A child should immediately see:

- Their identity: “this is my page.”
- What to do today.
- Their current progress toward their own goal.
- One encouraging family context if it helps motivation.
- A simple next action.

For a child, overview means “what is next for me?” not “what does the whole household system know about me?”

### What should require intentional exploration?

The following should require scrolling, tabbing, or opening detail:

- Full family goal explanation.
- Helpful Moments history.
- Weekly progress history.
- Parent Mode.
- Family participation details.
- Repeated celebration/goal story cards.

### Is Today more important than Progress?

For daily use, **Today should be at least as important as Progress and often more important**. Children need the page to answer “what should I do now?” Progress motivates the work, but it should not hide the work.

In the screenshots, the large hero/progress section appears before Today. It gives ownership, but it delays the actionable task list.

### Is Progress more important than Family Goal?

Yes. On a child workspace, the child's own progress should outrank the family goal. The family goal should be context: “your help contributes to this.” It should not appear as a second large detail section unless intentionally opened.

### Are Helpful Moments overview content or detail content?

Helpful Moments can be overview content only as a small encouragement preview: one or two recent appreciations. The full list of appreciation cards is detail content. It should not be a large default section on the child overview.

### Determination

Child Workspace mixes overview and detail. It succeeds emotionally and ownership-wise, but it repeats the same motivational story in several places:

- Hero identity and progress.
- `Today` task section.
- `My progress` weekly card.
- Family Goal section.
- Helpful Moments section.

This produces excessive scrolling and weakens the child’s immediate next action. The next model should be:

- Child overview: identity, Today, personal progress, one family-goal cue, one appreciation preview.
- Child detail/progress: weekly progress and goal history.
- Family goal detail: full family contribution story.
- Appreciation detail: Helpful Moments list.
- Parent Mode: management.

## Weekly Reset Review

### What belongs in review summary?

Weekly Reset summary should show:

- Number of items needing review.
- Top review candidates by category.
- Goal status requiring decision.
- Shopping/list maintenance requiring decision.
- A short recap headline.
- Clear completion/skip affordance.

### What belongs in review detail?

Review detail should include:

- All candidates.
- Reason each item is being reviewed.
- Keep/Someday/Archive decisions.
- Goal archival decisions.
- Shopping cleanup decisions.
- Confirmation state and completed decisions.

### What belongs in recap detail?

Recap detail should include:

- Full Helpful Moment recap list.
- Celebration memory details.
- Task completion story.
- Per-child contribution details.
- Long historical content.

### Determination

Weekly Reset is supposed to be a maintenance page, so detail is more acceptable here than on Home or Motivation. Still, it currently shows review detail and recap detail on one long page. The review candidates expose repeated controls and raw-looking values (`0` / `1`), while the recap shows multiple large memory rows. That makes the page operational but heavy.

Weekly Reset should preserve review-first behavior but separate depth:

- Top summary: counts, categories, and next review action.
- Review detail: candidate-by-candidate decisions.
- Recap detail: expanded weekly story/memories.

## Cross-Page Patterns

### Pattern 1: Overview pages contain detail cards

Motivation and Child Workspace are the clearest examples. Their top-level pages include full-size cards that would work better as detail entries: Helpful Moment history, celebration memory, weekly progress, and personal goal management.

### Pattern 2: Detail pages act as dashboards

Weekly Reset is a review-detail page but also contains a recap dashboard. Motivation is a domain dashboard but also contains detail workflows. Child Workspace is a child dashboard but also contains family-goal and appreciation detail.

### Pattern 3: Repeated information across sections

Child Workspace repeats progress/family-goal content. Motivation repeats family goal, memory, Helpful Moments, and personal goals as equally large stories. Home repeats shopping/list item labels. Weekly Reset repeats task candidates and controls.

### Pattern 4: Multiple stories compete for attention

The product often has several valid stories on a page: tasks, progress, family goal, appreciation, memory, review, shopping. The issue is not that any individual story is wrong; it is that many are presented at the same depth.

### Pattern 5: Authoring appears inside status pages

Helpful Moments creation appears in Motivation. Quick capture appears on Home. Add Task appears on Tasks. Lists add item is appropriate because shopping execution includes adding items, but other authoring surfaces should be more intentional.

### Pattern 6: Empty or low-value detail scaffolding consumes space

Lists shows empty Completed and Recently Deleted sections. Tasks can show empty urgency groups. Weekly Reset shows raw values and repeated controls. These elements add depth without adding overview value.

### System-wide determination

HomeOps does have a systemic Summary vs Detail issue. The issue is not equally severe everywhere, and recent compaction work reduced it on operational pages. The remaining systemic problem is **depth parity**: summary, detail, history, authoring, and management surfaces are often rendered with similar visual weight.

## Prioritization

### 1. Highest severity — Motivation

Motivation is the largest current offender because it combines family goal overview, goal detail, memory history, Helpful Moments authoring, Helpful Moments history, and personal goal management in one page. This creates excessive scrolling, oversized cards, and competing concepts.

### 2. Highest severity — Child Workspace

Child Workspace is emotionally successful but mixes immediate child action with progress dashboard, family-goal detail, weekly progress, and appreciation history. It should be the child’s “what should I do now?” page first.

### 3. Medium severity — Home

Home is conceptually correct as an overview, but the hero/add treatment, shell prominence, and card scale still slow the daily summary. It needs visual compaction more than information architecture redesign.

### 4. Medium severity — Weekly Reset

Weekly Reset correctly contains maintenance detail, but it should separate review summary, review decisions, and recap detail more clearly.

### 5. Low-to-medium severity — Lists

Lists is mostly corrected. Remaining issues are empty detail sections, repeated store controls, and management-language framing.

### 6. Low severity — Tasks

Tasks was previously severe but is now mostly corrected. Remaining issues are repeated row controls, empty group noise, and ensuring secondary concepts stay compact after data loads.

## Recommended Next UX Slice

If only one UX improvement may be implemented next, choose **Overview/detail separation for Motivation and Child Workspace**, starting with a compact **Motivation overview split**.

### Why this slice

- It directly addresses the most severe current Summary vs Detail problem.
- It reduces excessive scrolling and oversized emotional cards.
- It creates reusable rules for other pages: compact preview on overview, full authoring/history in detail.
- It protects Child Workspace from becoming a long adult-authored progress dossier.
- It complements prior Dashboard First, Execution First, and Review First work without adding new domains.

### Suggested slice boundaries

Do:

- Make Motivation overview show only active family goal status, celebration readiness, compact Helpful Moments preview, and compact personal-goal preview.
- Move Helpful Moments creation and full history behind a deliberate detail route/panel/section.
- Move celebration memory history behind a Memory detail surface.
- Keep personal goal editing behind a child/personal-goal detail surface or progressive disclosure.
- Use the same model to later simplify Child Workspace: Today + personal progress first, family/appreciation details secondary.

Do not:

- Add new motivation concepts.
- Add rewards, points, gamification, notifications, authentication, or new data models.
- Rework persistence.
- Implement the full Child Workspace split in the same slice unless explicitly requested.

## Next Prompt Context

Use this context for the next implementation prompt:

> Apply Summary vs Detail separation to Motivation only. Do not add new capabilities or persistence. Convert Motivation into a compact overview that shows active family-goal status, celebration readiness/recent celebration, a small Helpful Moments preview, and a small Personal Goals preview. Move full Helpful Moments authoring/history, celebration memory history, and personal goal management out of the default overview through progressive disclosure or detail surfaces. Preserve existing data and behavior. Do not implement rewards, points, gamification, notifications, authentication, new migrations, or new data models. Do not modify Phase 1 history.
