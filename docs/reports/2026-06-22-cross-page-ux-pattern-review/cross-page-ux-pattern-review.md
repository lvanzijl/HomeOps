# Cross-Page UX Pattern Review

## Executive Summary

Yes. The Home quick-capture finding reveals a broader HomeOps UX pattern: several pages let secondary creation, maintenance, or explanatory surfaces occupy space before the user's primary question is answered.

The pattern is not identical on every page:

- **Home had the clearest version:** persistent capture forms competed with dashboard information.
- **Tasks has the strongest remaining version:** task creation, recurrence, templates, weekly review, and someday maintenance appear before the active task board.
- **Weekly Reset has a moderate version:** it is action-oriented, but explanatory copy and some low-value confirmation controls dilute the review flow.
- **Motivation is mostly status-first:** creation and edit surfaces are usually gated, but Helpful Moments creation and personal-goal management can still become visually prominent.
- **Lists is relevant:** item execution is present, but list rename/archive/delete and store-management controls make management too visible for a shopping behavior surface.
- **Child Workspace is relevant as a contrast:** child mode is ownership-first, while parent mode intentionally contains management; the risk is mainly mode/chrome visibility, not the core child view.

Recommended next UX slice: **Tasks page hierarchy compaction**. It is the highest-value target because management concepts currently appear above the execution board, while Tasks should answer “what needs doing now?” as quickly as Home now answers “what matters today?”

## Home Lesson

### Actual UX problem

Home was not failing because quick capture existed. It was failing because full, persistent input forms occupied the top dashboard zone. The user arrived at a household dashboard but first encountered data-entry surfaces for shopping and events before seeing enough of the day’s most important information.

### Why it was a problem

The Home page’s primary job is household awareness: agenda, urgent tasks, family state, motivation states, and reminders. Persistent forms changed the perceived job of the page from “show me what matters” to “enter new things.” That created three problems:

1. **Hierarchy inversion:** secondary capture controls competed with primary status information.
2. **Above-the-fold cost:** forms consumed scarce tablet-dashboard space.
3. **Mode confusion:** Home felt partly like a dashboard and partly like an administration/input screen.

### Principle that emerged

**Primary status should lead; secondary creation and maintenance should be compact, intentional, and revealed only after user intent.**

The reusable pattern definition:

> If a page exists primarily to show current household state or support execution, then creation, editing, explanation, and maintenance controls must not visually dominate the first scan. They should appear as compact actions, scoped panels, dialogs, secondary sections, or progressive disclosure after the page has answered its primary question.

## Motivation Review

### Current hierarchy

Motivation is mostly **status-first**. The top flow presents the active family goal, progress, celebration state, remembered celebrations, Helpful Moments, and personal goals. Goal creation is only shown prominently when no family goal exists, and family-goal editing is gated behind an action. Personal-goal creation is also initiated by a button before an inline form appears.

### Goal creation

Family-goal creation is appropriately prominent in the empty state because, without a goal, the page has no primary object. Once a family goal exists, creation/editing is not persistent. This already follows the Home lesson better than Home did before compaction.

Risk: the edit form is large once opened and appears directly under the family-goal card. That is acceptable for an intentional editing mode, but it should remain clearly temporary and should not become a default persistent management area.

### Goal editing

Family-goal editing is secondary and reasonably compact before activation. Personal-goal editing is also gated by per-card Edit buttons. The page does not currently lead with goal-management controls.

### Helpful Moments

Helpful Moments is the main area where the Home pattern may recur. The section can include creation behavior (`showCreate`) inside the page. Because Helpful Moments is both recognition content and an input surface, it can shift the page from encouragement/status toward logging/administration if the create control is visually heavy or appears before enough motivational state.

The current placement after family goal and celebration memories is acceptable. It should not move above the active family goal or become a persistent large form by default.

### Celebration

Celebration is status-first and emotionally primary when ready. A ready-to-celebrate action is not secondary clutter; it is the page’s highest-value state when present. Celebration should be allowed to become visually prominent when the goal is complete.

### Memory

Celebration memories are supportive content. They are not a management surface. They can remain visible as long as they do not push the active family goal or ready celebration too far down.

### Personal Goals

Personal goals are slightly more management-like because they include Add and Edit actions and per-child goal cards. Still, the default cards show progress before editing controls. This is a mild version of the pattern, not a severe one.

### Does the user immediately see what matters?

Mostly yes. The user sees the family goal and progress first. If the family goal is absent, the user sees the required setup action first, which is appropriate.

### Should Home-style compaction be applied?

**Lightly, not as a major redesign.** Motivation should preserve status-first ordering and avoid turning Helpful Moments or personal-goal creation into persistent forms. The next Motivation improvement should be selective: ensure create/edit surfaces stay collapsed, and consider making Helpful Moments creation progressive if it currently consumes too much page height in real use.

## Tasks Review

### Current hierarchy

Tasks currently shows the strongest broader pattern. The page is intended to support task execution, but the first major interactive surface is task creation with fields for title, owner, due date, and recurrence. Before the active task groups, it also shows template management, Weekly Household Reset review, and Someday items when present.

This makes the page partly **management-first** even though its core purpose should be execution-first.

### Task creation

Task creation is useful, but it is too prominent as a full form above the task board. It repeats the Home problem in a domain-specific way: a secondary input surface occupies the first scan before active responsibilities.

A better hierarchy would lead with overdue/due-today/upcoming tasks, then provide compact creation through an “Add task” action or a slim quick-add row. Advanced fields such as recurrence should be hidden behind expansion or detail editing.

### Recurring Tasks

Recurrence is a maintenance concept. Its presence in the default create form makes every task feel like it might require scheduling configuration. That increases cognitive load and makes the page feel more like productivity software than a household responsibility board.

Recurrence should be available, but not as a default top-level field for every task creation moment.

### Templates

Templates are clearly secondary. They support repeated setup, not daily task execution. Showing template creation and management above the task groups is a hierarchy problem. Templates should be collapsed, moved below the active board, or accessed through a secondary management action.

### Someday

Someday is appropriate as a lower-pressure holding area, but it should not compete with urgent work. It belongs after active urgency groups or behind a review/management section unless the page is explicitly in planning mode.

### Weekly Reset entry points

The Tasks page includes a Weekly Household Reset panel with review actions. This is useful maintenance, but it sits before the primary task groups. It should be subordinate to execution, or it should route to the dedicated Weekly Reset page instead of occupying default Tasks hierarchy.

### Review actions

Review actions are high-value during a review session and low-value during normal task execution. In the default Tasks page, they should be compact and contextual. The current visible action set makes maintenance concepts too prominent.

### Does task execution dominate?

No. The task groups exist and are urgency-first, but they are preceded by enough creation and maintenance UI that management dominates the first scan.

### Does the same UX pattern exist?

**Yes, strongly.** Tasks has the closest analogue to Home’s old persistent-form problem: form and management surfaces appear before the primary information/action board.

### Should Home-style compaction be applied?

**Yes.** Tasks should get a hierarchy-compaction slice that:

- makes active urgency groups the first meaningful content,
- changes task creation from full persistent form to compact add action or expandable quick-add,
- moves recurrence into advanced/edit detail,
- collapses templates into a secondary management section,
- moves Weekly Reset review out of the default top stack or converts it to a compact entry point,
- keeps Someday below active work.

## Weekly Reset Review

### Current hierarchy

Weekly Reset is more action-led than form-led. It starts with a short hero, then shows review candidates, goal confirmation, children’s goals, shopping review, and recap. It does not lead with a persistent creation form.

### Review candidates

Review candidates are appropriately first in the grid. This aligns with the page purpose: review only items likely to need attention.

### Goal review

Goal review is appropriate, but the “Keep active” action appears non-functional or low-impact in the current static surface if it does not change state. Confirmation controls should either produce meaningful completion/progress in the reset flow or be visually minimized.

### Shopping review

Shopping review is appropriately scoped because only older, archived, or duplicate-looking lists show up. This is maintenance content, but Weekly Reset is itself a maintenance page, so the pattern is less problematic here.

### Recap

The recap is valuable because it reinforces progress and makes the reset feel positive rather than purely administrative. It should remain visible, though it may not need to compete with action cards if there are many review candidates.

### Does the page lead with actions or explanation?

It leads with a short explanation followed by action cards. The explanation is not excessive, but it could be tighter. Some card-level explanatory sentences are low-value once users understand the reset habit.

### Are low-value explanations consuming space?

**Moderately.** Weekly Reset has repeated explanatory copy in the hero and cards. This is not as severe as persistent forms, but on a tablet the copy can reduce density and make the reset feel more instructional than operational.

### Is compaction needed?

**Moderate compaction is useful, but not the top priority.** Weekly Reset should keep its action-first grid and reduce repeated explanations. The main improvement would be making review state clearer and reducing controls that do not visibly advance the reset.

## Lists Review

Lists is relevant because it shows another version of the pattern: shopping/list behavior competes with list management.

### Current hierarchy

The shopping list surface leads with list name editing, rename, archive, and delete controls before item add and active items. That is a management-first hierarchy for a page whose most common behavior is likely checking, adding, and completing list items.

### Does shopping behavior dominate?

Partially. Active items, completion, and store grouping are present, but list-level administration is too high. Store fields on every row also introduce management weight into the item-execution surface.

### Do management actions dominate?

They are too prominent at the top. Rename/archive/delete are not daily shopping behaviors and should not precede the item workflow.

### Do Home-style lessons apply?

**Yes, moderately.** Lists should lead with active items and quick add. List rename/archive/delete should move into a compact settings/menu area. Store assignment should remain available but should not make every item row feel like a data-management form unless the user is actively organizing by store.

## Child Workspace Review

Child Workspace is relevant because it provides a useful contrast between primary-experience and management-mode separation.

### Current hierarchy

For children, the page is mostly ownership-first: identity, “what is next,” child progress, today’s tasks, goals, family participation, memories, and appreciation. Parent Mode contains administration separately.

### Does ownership dominate?

Yes in Child Mode. The child’s identity, progress, and current responsibilities lead. This is the correct pattern for the surface.

### Do management concepts dominate?

Not in Child Mode. Management is intentionally isolated in Parent Mode. For adult members, administration appears more directly, but adult member pages are less likely to be the child-facing workspace.

### Do Home-style lessons apply?

**Mostly as a guardrail, not an urgent fix.** Child Workspace already applies progressive separation by keeping administration out of the child-first flow. The risk is that mode-switch controls or Parent Mode availability could become too prominent in child contexts. The current main lesson is to preserve the separation.

## Cross-Page Pattern Inventory

### 1. Persistent or high-prominence forms

Occurs on:

- **Home before compaction:** shopping and event quick-capture forms.
- **Tasks now:** task creation form appears before active task groups.
- **Lists now:** list-name form and item/store fields appear prominently.
- **Motivation mildly:** goal forms are gated, but Helpful Moments/personal-goal creation must remain compact.

Severity: highest on Tasks; moderate on Lists; low on Motivation after current gating.

### 2. Management-first layouts

Occurs on:

- **Tasks:** templates, Weekly Reset review, recurrence, and Someday compete with active responsibilities.
- **Lists:** rename/archive/delete precede active shopping behavior.
- **Child Workspace Parent Mode:** intentionally, but safely separated from Child Mode.

Severity: highest on Tasks; moderate on Lists.

### 3. Secondary actions above primary information

Occurs on:

- **Home before compaction:** capture controls above Agenda/Tasks.
- **Tasks now:** creation/template/review controls above urgency groups.
- **Lists now:** list administration above active items.

Severity: high on Tasks.

### 4. Excessive or repeated explanation

Occurs on:

- **Weekly Reset:** hero and card explanations repeat the purpose of the reset.
- **Tasks:** template and reset panels explain maintenance concepts before the task board.
- **Motivation lightly:** supportive copy is generally on-brand, but could crowd dense states.

Severity: moderate on Weekly Reset and Tasks.

### 5. Maintenance concepts visible during execution

Occurs on:

- **Tasks:** recurrence, templates, review actions, Someday, archive/delete series.
- **Lists:** archive/delete list and store fields.
- **Weekly Reset:** appropriate because maintenance is the page purpose.

Severity: high on Tasks because it undermines daily execution.

## Prioritization

1. **Highest priority: Tasks**
   - The primary job is execution, but the first scan is dominated by creation and maintenance.
   - It repeats the Home hierarchy problem most directly.
   - It affects daily household utility because users need to see overdue, due today, and next tasks immediately.

2. **Medium priority: Lists**
   - Shopping/list execution is useful, but list management controls are too prominent.
   - A compaction slice would likely be straightforward: active items and quick add first; list settings behind a secondary action.

3. **Medium-low priority: Weekly Reset**
   - The page is already aligned with its maintenance purpose.
   - Improvement should focus on reducing repeated explanation and making action outcomes clearer.

4. **Low priority: Motivation**
   - Mostly status-first.
   - Needs guardrails to keep creation/edit surfaces progressive, especially Helpful Moments and personal goals.

5. **Low priority / preserve pattern: Child Workspace**
   - Child Mode already separates ownership from administration.
   - Preserve this model rather than redesigning it now.

## Recommended Next UX Slice

If only one page receives the next UX improvement, choose **Tasks**.

### Why Tasks

Tasks is the clearest unresolved instance of the Home lesson. It should be a household responsibility board, but the current hierarchy presents setup and maintenance before execution. A focused compaction slice would materially improve daily use without introducing new domains or changing architecture.

### Suggested slice boundaries

Do:

- Make urgency groups the first meaningful content.
- Replace the full top task form with a compact Add Task affordance or expandable quick-add.
- Keep the minimum creation path lightweight: title, optional owner, optional due date.
- Move recurrence to advanced/edit detail or a collapsed section.
- Collapse templates behind a secondary “Templates” panel/action.
- Convert Weekly Reset content on Tasks into a compact entry point or move it below active groups.
- Keep Someday below active work.

Do not:

- Add new recurrence logic.
- Add approval, points, rewards, gamification, notifications, roles, or authentication.
- Rework data models.
- Merge Tasks with Lists or Calendar.
- Turn Weekly Reset into the default Tasks view.

## Next Prompt Context

Use this context for the next implementation prompt:

> Apply the Home dashboard-first hierarchy lesson to the Tasks page only. Do not change persistence or add new capabilities. Reorder and compact the Tasks UI so active urgency groups lead the page, task creation is a compact progressive action, recurrence/templates/Weekly Reset/Someday are secondary, and daily task execution dominates the first scan. Preserve existing task behavior and tests; do not implement approval, points, gamification, notifications, authentication, or new data models.
