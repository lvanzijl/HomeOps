# Child Workspace Summary vs Detail Review

Date: 2026-06-22

Evidence reviewed:

- Summary vs Detail Review: `docs/reports/2026-06-22-summary-vs-detail-review/summary-vs-detail-review.md`
- Motivation Overview / Detail Separation implementation: `docs/reports/2026-06-22-motivation-overview-detail-separation/implementation.md`
- Child Workspace Foundation: `docs/reports/2026-06-20-child-workspace/implementation.md`
- Child Progress View: `docs/reports/2026-06-20-child-progress-view/implementation.md`
- Child Hero Area: `docs/reports/2026-06-21-child-hero-area/implementation.md`
- Child Journey: `docs/reports/2026-06-21-child-journey/implementation.md`
- Family Contribution Story: `docs/reports/2026-06-21-family-contribution-story/implementation.md`
- Helpful Moments Upgrade: `docs/reports/2026-06-21-helpful-moments-upgrade/implementation.md`
- Celebration Memory: `docs/reports/2026-06-21-celebration-memory/implementation.md`
- Child Ownership Asset Integration: `docs/reports/2026-06-21-child-ownership-asset-integration/implementation.md`
- Full Visual System Review: `docs/reports/2026-06-22-full-visual-system-review/full-visual-system-review.md`
- Visual evidence: `child-young-full.png` and `child-older-full.png` in `docs/reports/2026-06-22-full-visual-system-review/`

## Executive Summary

**Child Workspace partially has the same Summary vs Detail problem that Motivation had.** It is not as severe as pre-separation Motivation because Child Workspace already has a clearer child-first order: Hero, Today, This Week, Family Goal, Helpful Moments, then Parent Mode access. However, it still asks one page to act as:

- A child overview.
- A daily execution surface.
- A weekly progress review.
- A family-goal status page.
- An appreciation/history surface.
- A parent management gateway.

The page's core story is correct: **this is my page, here is what I can do today, here is how my help matters, and here is what our family is working toward.** The problem is depth. Hero progress, This Week, Family Goal progress, and contribution copy repeat related progress narratives at multiple sizes. Helpful Moments is emotionally valuable, but on the main page it can become a large adult-authored history block. Parent Mode is correctly separated in principle, but its placement is too low if it is the main mode switch.

Recommended direction: **Child Workspace should adopt Motivation's Overview First / Detail On Demand pattern, with stricter child-first priorities.** The default page should answer three questions within one scan:

1. **What should I do today?**
2. **How am I doing?**
3. **What are we working toward together?**

Everything beyond that should be deliberately explored: full progress history, full Helpful Moments history, family goal detail, celebration memory detail, and parent controls.

## Child Workspace Purpose

### What the page is trying to accomplish

Child Workspace is the child's personal household surface. It should make a child feel ownership and encouragement while translating household work into simple daily action and shared family progress.

It is not primarily a management page, family goal editor, audit log, or reward dashboard. It should avoid competitive mechanics and preserve the current non-ranking, non-economy model.

### What a child should understand within 5 seconds

A child should immediately understand:

1. **This is my page.** The name/avatar and child language should make ownership obvious.
2. **This is what I should do today.** Today's responsibilities should be visible without scrolling past multiple status blocks.
3. **My help matters.** A simple progress/contribution cue should connect today's work to family progress.
4. **We are working toward something together.** The family goal should be present, but summarized.

### What a parent should understand within 5 seconds

A parent should immediately understand:

1. Whether the child has anything actionable today.
2. Whether the child is making progress.
3. Whether the page is in Child Mode or Parent Mode.
4. Where to deliberately switch into parent controls.

### Core purpose

**Core purpose: Child Workspace should be a child-first daily overview that shows today's action, personal progress, and shared family-goal participation, while keeping history and management behind deliberate exploration.**

## Information Inventory

| Section | Current role | Summary/detail classification | Notes |
| --- | --- | --- | --- |
| Child Hero | Identity, current goal, progress, family context, celebration visibility | Overview with some duplicated detail | Strong ownership anchor, but the large progress treatment can pre-repeat This Week and Family Goal. |
| Today | Child-owned active tasks and friendly count | Overview / execution | Highest child utility. Should remain near the top and compact. |
| This Week | Individual goal progress reframed as weekly progress | Overview becoming detail | Useful, but should summarize only the most important progress on the main page. Full goal detail belongs deeper. |
| Family Goal | Shared progress, contribution copy, celebration context | Overview becoming detail | Necessary on the child overview, but should not repeat the hero's full progress story. |
| Helpful Moments / Things My Family Appreciates | Warm recognition cards | Overview preview + history risk | One recent appreciation belongs on overview; the full stream is detail/history. |
| Celebration / Memory | Celebration state and recent memories | History/detail if expanded | A small celebration-ready or recent-memory cue is useful; full memory history belongs in detail. |
| Parent Mode | Avatar editing and family member management access | Management | Correctly separated conceptually, but the mode switch should be easier to find. |

## Immediate Child Needs

Priority order for the child overview:

1. **What should I do today?**  
   Today is the most actionable and least abstract need. It should not be buried below repeated progress storytelling.

2. **How am I doing?**  
   A child needs one simple progress signal, not several versions of the same percentage/story.

3. **What are we working toward?**  
   The family goal should be visible as context and motivation, but not as a full detail page.

4. **Did someone notice my help?**  
   Appreciation is emotionally important, especially for children, but it should support the page rather than dominate it.

5. **What happened before?**  
   History, celebration memories, and older appreciation should require deliberate exploration.

## Progress Review

### Is progress repeated?

Yes. The existing evidence shows progress appearing through multiple story beats:

- Hero progress: large percentage/ring/bar and age-aware progress text.
- This Week: individual goal progress.
- Family Goal: shared progress and contribution story.
- Helpful Moments: narrative evidence that help mattered.
- Celebration/memory: historical proof of achieved progress.

Each is valid independently, but together they make the page repeat the same emotional message: **you are helping and the family is moving forward.** The repetition is especially costly because Child Workspace already has a large hero and child-friendly visual assets.

### Is the same story told multiple times?

Partially yes. The story appears as:

- **My progress** in the hero.
- **This Week** in goal cards.
- **You helped** in family contribution copy.
- **Family progress** in the Family Goal card.
- **Family appreciation** in Helpful Moments.

The problem is not contradiction; it is layering. A child should get one immediate progress answer, then choose to explore detail.

### Which progress belongs on overview?

Overview should contain:

- One primary progress indicator.
- One short child-friendly explanation of what it means.
- One next-step link/action such as `See my progress` or `See family goal`.
- At most one family-goal summary progress cue if the hero's progress is personal.

### Which progress belongs in detail?

Detail should contain:

- Full individual goal card set.
- Goal-by-goal progress bars.
- Weekly progress history.
- Celebration memory history.
- Full contribution story and older appreciated moments.

### Determination

**Progress depth is excessive for an overview.** The page should keep progress, but compress it into a single overview story and move the detailed weekly/family/history layers behind exploration.

## Helpful Moments Review

### Should Helpful Moments be overview content?

Yes, but only as a preview. Helpful Moments are one of the strongest ways to make a child feel seen. The overview should show that the family noticed the child, not expose a full appreciation feed.

### Should full appreciation history be visible?

No. Full appreciation history should require deliberate exploration because it is history content. It can be emotionally valuable, but it is not the child's first daily question.

### How much appreciation belongs on the main page?

Recommended default:

- One most recent Helpful Moment, or a compact `Family noticed 3 helpful moments this week` summary.
- A short CTA such as `Read more appreciation`.
- No full list on the overview.
- No authoring surface in Child Mode.

### Determination

Helpful Moments should become **overview preview content** on Child Workspace. Full browsing belongs in a detail/history view, and creation belongs with parent/adult flow rather than the child's immediate surface.

## Family Goal Review

### What belongs on Child Workspace?

Child Workspace should show:

- Family goal name.
- A short shared-purpose line.
- One compact progress cue.
- A child-specific contribution cue such as `Your help is part of this`.
- Celebration-ready state if the goal is ready to celebrate.

### What belongs in Family Goal detail?

Family Goal detail should contain:

- Full description.
- Full progress history.
- Celebration details and memory history.
- Helpful Moments connected to that goal.
- Editing and management controls.
- Any parent-facing interpretation of contribution.

### Determination

Family Goal belongs on the child overview as **context**, not as a full goal page. The current Child Workspace appears to carry too much family-goal narrative by default when combined with the hero and This Week sections.

## Parent Mode Review

### Is Parent Mode correctly separated?

Yes in principle. Parent Mode is management and should not be interleaved with Child Mode content. Keeping avatar editing and family member persistence controls outside the child-first journey is the right boundary.

### Is it discoverable enough?

Probably not. The Full Visual System Review specifically notes that the Child Mode / Parent Mode switch is too low on the page if it is a key framing control.

### Is it too prominent?

No. The bigger risk is the opposite: parent controls should not dominate the child experience, but the mode switch itself should be visible enough for adults to find without scanning the entire page.

### Is it not prominent enough?

Yes for the switch, not for the controls. The recommended model is:

- Keep the switch near the top, compact and secondary.
- Keep actual parent controls behind Parent Mode.
- Do not show parent management cards in the child overview.

### Determination

Current placement is conceptually appropriate but likely too low. Parent Mode should be discoverable as a compact top-level mode control, while parent management remains hidden until selected.

## Child Overview Model

Recommended overview-only Child Workspace first screen:

1. **Compact identity header**
   - Avatar/name.
   - `My page` ownership language.
   - Compact Child Mode / Parent Mode switch.

2. **Today first**
   - Friendly count of today's tasks.
   - Top 1-3 tasks or a clear empty state.
   - No management controls.

3. **One progress summary**
   - Either personal weekly progress or current goal progress, but not both at full size.
   - A simple child-readable line: `You are making progress this week.`
   - Link to `See my progress`.

4. **Family Goal summary**
   - Goal name.
   - Compact shared progress cue.
   - One contribution line.
   - Link to `See family goal`.

5. **One appreciation preview**
   - Latest Helpful Moment or small count.
   - Link to `Read more`.

The first screen should prioritize **action + encouragement**, not full history. The child should not need to scroll through multiple large emotional cards before finding today's tasks.

## Child Detail Model

Move behind deliberate exploration:

- Full Helpful Moments history.
- Helpful Moment creation/authoring.
- Full individual goal list and detailed progress bars.
- Weekly progress history.
- Family Goal full detail.
- Celebration Memory history.
- Full contribution narrative.
- Parent controls.
- Avatar editing and family member persistence actions.

Suggested detail destinations or disclosures:

- `See my progress` for individual/weekly goal detail.
- `See family goal` for full family goal, contribution, celebration, and memory detail.
- `Read more appreciation` for Helpful Moments history.
- `Parent Mode` for avatar/member management and adult controls.

## Cross-Page Pattern Check

### Does Child Workspace suffer from the same Summary vs Detail issue previously found in Motivation?

**Partially.**

Motivation's earlier problem was more severe because it tried to be overview, authoring surface, history view, and management page at the same time. Child Workspace already has better separation because Parent Mode is distinct and the page order is explicitly child journey-oriented.

However, Child Workspace still mirrors Motivation's depth problem:

- It repeats progress and contribution across multiple sections.
- It includes history-like appreciation and memory content on the main journey.
- Its emotional cards are visually tall, making overview scanning slower.
- It has detail-level family-goal and progress storytelling on a page whose first job should be immediate child orientation.

**Answer: Partially yes.** Child Workspace should follow the same Overview First / Detail On Demand pattern as Motivation, but with an even stricter child-first rule: today's action and one encouragement signal should beat narrative completeness.

## Prioritization

Comparison of next UX targets:

1. **Shell/Home Hero**  
   Highest global visibility. Full Visual System Review identifies shell/navigation over-dominance and Home hero/add treatment as the most visible remaining issue across the product.

2. **Child Workspace Summary vs Detail**  
   High conceptual importance and strong candidate for the next emotional-surface refinement. It would improve child comprehension and align with the new Motivation pattern.

3. **Card System consistency**  
   Broad design-system value, but it is a larger cross-page normalization effort and should follow the most visible hierarchy fixes.

### Determination

The next UX implementation target should still be **Shell/Home Hero cleanup** if choosing by product-wide impact. Child Workspace should be the next emotional-page refinement after that, or bundled only if the slice is explicitly about applying Overview First / Detail On Demand to child surfaces.

## Recommended Next UX Slice

If only one UX improvement may be implemented next:

**Implement workspace shell and Home above-the-fold compaction first.**

Why:

- It is the most visible issue on every session.
- It fixes the product's first impression before optimizing secondary pages.
- It addresses the current system-level hierarchy problem identified by the Full Visual System Review.
- Motivation already received overview/detail separation; Child Workspace can follow as the next focused content-depth slice.

If the next slice must target Child Workspace specifically, the recommended slice is:

**Child Workspace Overview First compaction.**

Scope:

- Move Today higher.
- Reduce hero height.
- Keep one progress summary on overview.
- Convert Helpful Moments to one preview.
- Convert Family Goal to a compact summary.
- Move full progress, appreciation, goal, memory, and parent controls behind deliberate exploration.

## Next Prompt Context

Repository: `HomeOps`

Recommended model: `GPT-5.4` for a normal UX-only implementation slice. Use `GPT-5.5` only if explicitly requested for deeper cross-page analysis.

This review found that Child Workspace **partially** shares Motivation's Summary vs Detail issue. The page has the right child-first intent and already separates Parent Mode conceptually, but it repeats progress/contribution narratives and exposes too much appreciation/history/family-goal depth on the default page.

For a Child Workspace implementation slice:

- Do not add features.
- Do not add persistence.
- Do not add migrations.
- Do not introduce rewards, points, badges, leaderboards, shops, purchases, streaks, or notifications.
- Preserve Child Mode and Parent Mode behavior.
- Make the default Child Workspace answer: `What should I do today?`, `How am I doing?`, and `What are we working toward?`
- Move full Helpful Moments history, full progress detail, Family Goal detail, Celebration Memory history, and parent controls behind deliberate exploration.
- Use existing child screenshots and visual fixtures for validation.
