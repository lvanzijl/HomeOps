# Full Visual System Review

## Executive Summary

- The compaction wave clearly improved **Tasks**, **Lists**, and **Weekly Reset**. Those pages now read as operational surfaces instead of management-first screens.
- The biggest remaining issue is now the **workspace shell + Home above-the-fold hierarchy**. The primary navigation is too prominent, `Settings` wraps onto its own row, and Home still opens with too much vertical space before the most important household work.
- Home also shows a **critical visual break**: the large central `Add` treatment/plus asset dominates the hero and pulls attention away from “what matters today?”
- **Motivation** and **Child Workspace** now have stronger emotional identity, but they are still visually taller, heavier, and more decorative than the more compact operational pages, so HomeOps does not fully feel like one system yet.
- The next UX slice should target **shell/navigation compaction and Home hero cleanup**, not a new feature.

## Home Review

Evidence: `home-full.png`

- The improved order helps: **Agenda → Tasks → Motivation → Shopping** is better than the earlier Home structure.
- Quick capture is now correctly secondary in concept, but the **hero is still too tall** and uses too much of the first screen.
- The page does **not fully answer “What matters today?” fast enough** because the hero consumes too much space before the user reaches the actionable summaries.
- The **large central `Add` visual** is the strongest element on the page and currently reads like a broken or mis-scaled asset. It is more prominent than date, tasks, agenda, or motivation.
- **Agenda still visually dominates Tasks** because the left card is much larger and taller, even though overdue work is more urgent.
- The wrapped **Settings** button creates a weak second navigation row and makes the shell feel crowded.

Verdict:

- Does Home answer “What matters today?” **Partially.**
- Is hierarchy clear? **More than before, but not yet.**
- Is any section still too prominent? **Yes: the hero/add treatment and top navigation.**

## Tasks Review

Evidence: `tasks-full.png`

- The page now feels **execution-first**.
- Active work dominates the scan: overdue and upcoming tasks appear before creation, templates, and Weekly Reset entry.
- The top action row is compact and secondary enough.
- The remaining issue is **row-level density**: repeated `Edit` / `Complete` actions on every item create visual noise.
- Empty or low-value states like **`Due Today / No tasks.`** still consume scan budget and dilute the urgency story a little.
- The page is operational and much improved, but it still has some **button-wall pressure**.

Verdict:

- Does active work dominate? **Yes.**
- Is management now secondary? **Yes, mostly.**

## Lists Review

Evidence: `shopping-full.png`

- The page now opens correctly around **shopping execution**: active count, item add, active items, then management.
- `List settings` is appropriately demoted behind a disclosure.
- Store grouping stays useful for execution, and management reads as secondary.
- The remaining issue is **visual sparsity**: on a wide layout, one list can feel stretched and under-filled.
- Completed and deleted sections are still shown even when empty, which adds a bit of dead space.
- Repeated `Store` controls can still become noisy when the list gets longer.

Verdict:

- Does shopping dominate? **Yes.**
- Is management secondary? **Yes.**

## Motivation Review

Evidence: `motivation-full.png`

- The page is more **status-first** than before, and the shortened copy helps.
- Family Goal, Memory, Helpful Moments, and Personal Goals follow a sensible order.
- The biggest remaining issue is **scale**: the family goal card is very tall, the Helpful Moments block is very large, and the personal goal cards are oversized for the amount of information shown.
- Helpful Moments still behaves like a **large authoring surface** in the middle of a status page, which slows scanning.
- The page is emotionally warmer and more coherent, but it still reads **heavier and longer** than it needs to.

Verdict:

- Is the page status-first? **Mostly.**
- Does the page scan quickly? **Not yet.**
- Is copy still excessive? **No, but surface size still is.**

## Child Workspace Review

Evidence: `child-young-full.png`, `child-older-full.png`

- The page now clearly belongs to the child. Ownership language is strong: **“My page,” “My progress,” “You helped.”**
- The asset integration is effective here. Child identity and contribution are much clearer than before.
- The remaining issue is again **vertical size**. The hero is large, then the same story repeats in lower cards.
- The **Child Mode / Parent Mode** switch is too low on the page. It should be more discoverable if it is a key framing control.
- Helpful Moments is positive, but it is still a **large adult-authored section** relative to the child’s direct task/progress content.
- Reading burden is lower than before, but the page still asks for a lot of scrolling.

Verdict:

- Does the page belong to the child? **Yes.**
- Is ownership visible? **Yes.**
- Is reading burden low? **Lower, but not low enough yet.**

## Weekly Reset Review

Evidence: `weekly-reset-full.png`

- The page now feels **operational** and review-first.
- Explanation is clearly secondary; the page immediately shows candidates, goals, shopping review, and recap.
- The main remaining issue is **candidate row clarity**. The rows surface raw `0` / `1` style values that read like leaked internal state instead of household language.
- Repeated `Keep active / Someday / Archive` controls create a dense repeated action pattern when many candidates appear.
- The recap is useful, but the visual distinction between recap and review cards could still be stronger.

Verdict:

- Does the page feel operational? **Yes.**
- Is explanation secondary? **Yes.**

## Visual System Review

- HomeOps is closer to one product than before, especially across **Motivation**, **Child Workspace**, **Celebration**, and **Helpful Moments**.
- The main design-system gap is **card-system inconsistency**:
  - Home uses warm dashboard cards.
  - Motivation/Child use heavier, more decorative emotional cards.
  - Tasks/Weekly Reset use flatter, more utilitarian cards.
  - Lists sits somewhere in between.
- **Spacing scale** is inconsistent. Home, Motivation, and Child spend much more vertical space than Tasks, Lists, and Weekly Reset.
- **Navigation color-coding** is consistent, but the shell is over-prominent and too colorful for the amount of placeholder destinations it includes.
- **Typography** is mostly consistent, but repeated all-caps eyebrow labels appear on many sections and add some sameness/noise.
- **Asset consistency** is improved overall, but the oversized Home `Add` treatment is a critical outlier.

Verdict:

- Does HomeOps feel like one product? **Mostly, but not fully.**
- Are there remaining design-system gaps? **Yes: shell prominence, card scale, spacing scale, and visual weight consistency.**

## Cross-Page Patterns

### Critical

1. **Shell and navigation over-dominance**
   - Too many top-level destinations for the current product state.
   - `Settings` wrapping onto its own row weakens polish.
   - Placeholder domains compete with real household work.

2. **Above-the-fold vertical oversizing**
   - Home hero, Motivation lead card, and Child hero all consume too much height.
   - Important content starts too low on the page.

3. **Design-system inconsistency by page type**
   - Emotional pages and operational pages still feel like adjacent systems rather than one tuned system.

### Major

1. **Repeated action clutter**
   - Tasks, Lists, and Weekly Reset still rely on repeated row controls that create visual noise.

2. **Large authoring blocks inside status pages**
   - Helpful Moments especially adds weight in Motivation and Child Workspace.

3. **Duplicate or repeated story beats**
   - Child hero and lower child cards retell the same progress/goal message.

### Minor

1. **Empty-state rows and empty groups still consume space**
2. **Repeated eyebrow styling adds some visual sameness**
3. **A few labels/status outputs still feel internal rather than household-friendly**

## Prioritization

1. **Workspace shell + Home above-the-fold hierarchy cleanup**
2. **Fix oversized/broken Home `Add` treatment**
3. **Normalize card and spacing scale across Home, Motivation, Child, and Weekly Reset**
4. **Compact Helpful Moments on Motivation and Child Workspace**
5. **Reduce repeated row-control noise on Tasks, Lists, and Weekly Reset**
6. **Clean up internal-feeling status labels in Weekly Reset**

## Recommended Next UX Slice

**Implement one UX-only slice focused on workspace shell and Home above-the-fold compaction.**

Why:

- It has the **highest visibility** because every session starts in the shell and usually in Home.
- It addresses the most obvious remaining hierarchy problem: **navigation + hero chrome competing with real household content**.
- It also creates the best foundation for the next round of consistency work across the rest of the product.

## Next Prompt Context

- Repository: `lvanzijl/HomeOps`
- Recommended model: `GPT-5.4`
- This should be a **UX-only implementation slice**
- No feature additions
- No workflow changes
- No persistence changes
- Preserve all existing routes and behaviors
- Use the visual fixtures for validation

Suggested next slice goal:

- Compact the workspace shell and Home above the fold
- Reduce primary navigation prominence
- Prevent `Settings` from wrapping alone
- Demote or better contain placeholder destinations
- Reduce Home hero height
- Remove/fix the oversized central `Add` treatment
- Make the first screen answer **“What matters today?”** more directly
- Keep quick capture secondary
