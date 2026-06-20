# Task / Chore Domain Analysis

## Summary
Tasks should become a core HomeOps household responsibility domain, distinct from Lists, Agenda, Family Members, and Gamification.

Recommended direction:
- A Task represents household work that may need responsibility, timing, completion state, approval, recurrence, and optional reward metadata.
- A List Item represents lightweight memory/capture content inside a list. It should not carry owner, recurrence, approval, or point semantics unless it is promoted into or linked to a Task in a future slice.
- Tasks should support unassigned, assigned-to-member, and shared-household ownership states.
- Recurrence should define how task instances become available over time, but Task completion should operate on concrete occurrences/instances rather than mutating the recurring rule directly.
- Approval should be optional per task or task template, not universal.
- Points should not make Tasks depend on Gamification. Tasks may expose an optional reward value or reward eligibility signal, while Gamification owns scoring, balances, streaks, leaderboards, redemption, and motivational presentation.
- Home should show only bounded Task summaries: due today, overdue, next up, unassigned, and awaiting approval.

This report is analysis-only and intentionally avoids persistence design, migrations, API contracts, UI implementation, and tests.

## Task Definition
A Task is a household responsibility item.

A Task can answer:
- What needs to be done?
- When is it available or due?
- Who is responsible, if anyone?
- Has it been completed?
- Does completion need approval?
- Does completion optionally award points or other gamification credit?

A Task is appropriate when the household needs accountability or workflow. Examples:
- Put bins outside every Tuesday evening.
- Empty the dishwasher today.
- Feed the dog after school.
- Clean bedroom, parent approval required.
- Water plants this weekend.

A Task is not:
- A generic note.
- A shopping item.
- A packing checklist row.
- A calendar event.
- A user account assignment.
- A gamification score ledger entry.
- A widget-specific model.

### Difference Between Task and List Item
A List Item is lightweight list content. It exists to remember, gather, pack, buy, or check off simple items within a list context.

A Task is responsibility-oriented. It can carry accountability, due timing, recurrence, approval, and optional points.

| Question | List Item | Task |
| --- | --- | --- |
| Primary purpose | Remember or collect an item | Complete household work |
| Parent concept | List | Task domain / chore board |
| Ownership | Not required by default | First-class optional concept |
| Due timing | Not required by default | First-class concept |
| Recurrence | Not appropriate by default | First-class concept |
| Approval | Not appropriate | Optional first-class concept |
| Points | Not appropriate | Optional reward input only |
| Home role | Active list summary | Responsibility summary |

Boundary decision: do not add task-like fields to Lists just because some list items sound actionable. If a row needs ownership, recurrence, approval, or points, it is likely a Task, not a List Item.

## Task Lifecycle
The recommended Task lifecycle should separate configuration from work execution.

### Recommended Lifecycle States
For concrete task work items:
1. **Available** — The task occurrence is visible and can be completed. It may be unassigned, assigned, or shared.
2. **Completed** — Someone marked the task as done. If approval is not required, this is the terminal success state before archival/history.
3. **Awaiting Approval** — The task is completed but not final because approval is required.
4. **Approved** — An approver accepted the completion. This is the terminal success state for approval-required tasks.
5. **Rejected / Reopened** — An approver rejected completion and the task returns to actionable work.
6. **Archived / Dismissed** — The household intentionally removes the task occurrence from active views without treating it as successful work.

### States Not Recommended as First-Class Work States
- **Draft** should not be part of the initial concrete task lifecycle. Drafting belongs to task creation UX or template configuration, not the active household board.
- **Assigned** should not be a lifecycle state. Assignment is an ownership property that can coexist with Available, Completed, Awaiting Approval, and Approved.
- **Overdue** should not be a stored lifecycle state. It is derived from due timing plus current household date/time.

### Recommended Lifecycle Shape
Use a small active lifecycle for the first implementation slice:
- Available
- Completed
- Awaiting Approval
- Approved
- Reopened
- Archived/Dismissed

If the first slice needs to be smaller, start with Available and Completed only, but design vocabulary so Awaiting Approval and Approved can be added without changing the definition of completion.

## Ownership Model
Task ownership should describe responsibility without implying authentication, profiles, permissions, or app users.

### Ownership States
Recommended ownership states:
1. **Unassigned** — The task needs doing, but no family member is responsible yet.
2. **Assigned to Family Member** — One family member is responsible.
3. **Shared Household** — The task belongs to the household collectively and can be completed by anyone.

Future optional state:
- **Assigned to Multiple Family Members** — Useful for pair chores, sibling tasks, or parent-child collaboration, but this can be deferred unless explicitly needed.

### Reassignment
Reassignment should be normal and low-friction. Changing owner should not rewrite task history. For product clarity:
- Active tasks can be reassigned.
- Completed tasks should preserve who completed them if that concept exists later.
- Approval-required tasks should preserve who requested approval and who approved if those audit concepts are later introduced.

### Household / Shared Tasks
Shared household tasks should not be represented as a fake family member. They need their own visual treatment such as a house icon, household label, or neutral shared color.

Examples:
- Take recycling out — shared household.
- Buy milk — List Item, not Task, unless assigned as a responsibility.
- Reset router when internet is down — possibly shared household task if HomeOps later supports house status workflows.

## Recurrence Model
Recurrence should belong to Task scheduling/configuration, not to each completed historical result.

### Task and Recurrence Relationship
Recommended model conceptually:
- A Task Definition or Task Series describes the recurring responsibility.
- A Task Occurrence or Task Instance represents a concrete actionable item generated from that definition.
- Completion, approval, reassignment for one day/week/month should apply to that occurrence, not mutate the whole recurrence rule unless the household explicitly edits the series.

This mirrors the existing calendar distinction between logical recurring series and generated occurrences, while keeping Tasks as a separate domain.

### Supported Recurrence Types
Initial task recurrence should stay simple:
- None / ad-hoc
- Daily
- Weekly
- Monthly

Avoid advanced recurrence rules in the first task slice:
- No arbitrary RRULE.
- No complex skip calendars.
- No multi-rule schedules.
- No holiday/business-day adjustment unless a future slice explicitly needs it.

### Daily / Weekly / Monthly / Ad-Hoc
- **Daily chores** should create one actionable occurrence per household day.
- **Weekly chores** should be due on a chosen day or within a weekly window.
- **Monthly chores** should use a simple day-of-month or month-window rule.
- **Ad-hoc tasks** should exist without recurrence and be manually created or captured.

### Availability vs Due Date
The domain should distinguish:
- **Available from**: when the task appears as actionable.
- **Due by**: when it becomes late/overdue.

The first implementation can simplify this to a due date only, but the product language should reserve room for availability windows because chores often become relevant before they are due.

## Approval Model
Approval should be optional and task-specific.

### When Approval Is Needed
Approval is appropriate when:
- A child completes a chore and a parent/caregiver should verify it.
- A task awards meaningful points and the household wants verification.
- The task has quality or safety implications.
- The household explicitly marks the task as approval-required.

Approval is not needed for:
- Routine adult self-managed tasks.
- Simple shared household checkoffs.
- Zero-stakes reminders.
- Tasks where completion is inherently observable and trust-based.

### Approval Belongs in the Task Model
Approval should be a Task domain capability because it changes task lifecycle. A task can be completed but not final until approved.

However, approval should not imply authentication. Family Members are not users. The early product can represent approval conceptually without secure identity enforcement. If secure approvals become required later, that is an authentication/product-policy slice, not part of the Task domain baseline.

### Recommended Approval Fields Conceptually
At the product level, Tasks need to know:
- Whether approval is required.
- Whether the current completion is awaiting approval.
- Whether it was approved or reopened.
- Which family member completed it and which family member approved it, if the product later records actors.

Do not overbuild approval policy in the first slice. Avoid roles, permissions, parent accounts, PINs, or identity enforcement unless explicitly scoped.

## Points Boundary
Tasks may optionally award points, including zero points.

### Zero-Point Tasks
Zero-point tasks are normal Tasks. They should not look inferior or broken. A household may track responsibilities without gamifying them.

### Point-Awarding Tasks
A point-awarding task should expose that completing and, when required, approving the task can produce a reward event. Points should be secondary metadata on the task experience.

### Do Points Belong Directly on Tasks?
Recommended boundary:
- Tasks may own an optional **point value / reward eligibility** field because the household decides that a specific task is worth zero or more points.
- Gamification owns actual scoring mechanics: point ledger, balances, streaks, leaderboards, badges, rewards, redemptions, season resets, and celebratory presentation.

This prevents Tasks from becoming dependent on Gamification while still allowing Tasks to be the source of rewardable actions.

### Architecture Boundary
Tasks should not query or calculate gamification totals. Instead, a future Gamification domain can consume task completion/approval outcomes as inputs.

Product rule: a task can be complete even if Gamification is disabled or unavailable.

## Home Integration
Home remains a summary-first dashboard. It should never become the full task management surface.

### Task Information That Belongs on Home
Home should show a bounded Task summary after the Task domain exists:
- Due today.
- Overdue.
- Next up / soon.
- Awaiting approval.
- Unassigned tasks needing assignment.
- Owner/avatar when assigned.
- Shared household indicator when shared.
- Optional point value only when non-zero and relevant.

### Task Information That Does Not Belong on Home
Home should not show:
- Task template management.
- Recurrence rule editing.
- Approval policy setup.
- Point configuration.
- Task history, analytics, streaks, or leaderboards.
- Bulk reassignment tools.
- Full completed archive.

### Home Quick Capture
Home may eventually support simple add-task quick capture with title, owner, and due timing only. Recurrence, approval requirements, and point setup should route to the Tasks page.

## Family Member Relationship
Tasks relate to Family Members through household responsibility, not through accounts.

Family Members support Tasks by providing:
- Stable household member identity for display and assignment.
- Name.
- Avatar / initials.
- Display color.
- Active/inactive visibility state eventually, if members leave the household or should be hidden from assignment.

Family Members do not need to become:
- Users.
- Login identities.
- Permission holders.
- Security principals.
- Point accounts by default.

Task assignment can reference a Family Member conceptually, but this analysis intentionally does not design persistence or foreign keys.

## Gamification Boundary
Gamification should be built on top of Tasks, not inside Tasks.

### Belongs to Tasks
- Task title/description.
- Available/due timing.
- Ownership state.
- Completion state.
- Approval requirement and approval lifecycle.
- Recurrence configuration.
- Optional point value or reward eligibility.
- Completion/approval outcomes that Gamification can later observe.

### Belongs to Gamification
- Point ledger.
- Current balances.
- Lifetime totals.
- Streaks.
- Badges.
- Levels.
- Reward store.
- Redemption rules.
- Leaderboards.
- Celebration logic.
- Fairness rules such as caps, decay, multipliers, or age balancing.

### Coupling Prevention Rules
- Tasks must work when Gamification is off.
- Zero-point tasks must be first-class.
- Gamification should consume completed/approved task outcomes rather than own task completion.
- Home should present points as secondary metadata, not the reason a task exists.

## Risks
### Product Risks
- Tasks may overlap with Lists if the boundary is not enforced early.
- Families may expect chores, reminders, and checklists to be interchangeable, causing UX confusion.
- Approval could imply parent accounts or secure identity before HomeOps has authentication.
- Points could dominate the domain and make ordinary household responsibilities feel like a game-only feature.

### UX Risks
- Too many states can make simple chores feel bureaucratic.
- Home can become cluttered if overdue, due today, unassigned, and approval queues all compete equally.
- Children may not understand the distinction between completed and awaiting approval without clear copy.
- Shared household tasks need a distinct treatment or they will look like errors/unassigned work.

### Domain-Boundary Risks
- Adding owner, recurrence, approval, or points to List Items would blur the Lists and Tasks domains.
- Making Family Members into users would prematurely introduce authentication and permission semantics.
- Letting Gamification own task completion would make Tasks dependent on an optional feature.
- Reusing Calendar recurrence implementation too literally could leak calendar-specific concepts into Tasks.

### Premature Implementation Risks
- Designing persistence before the lifecycle vocabulary is accepted could lock in the wrong shape.
- Implementing full recurrence, approval policy, roles, or point ledgers in the first slice would exceed the product decision needed now.
- Building Home task UI before the Task domain exists could create placeholder behavior that later conflicts with the real model.

## Open Questions
1. Should the first Task slice include approval, or should it reserve the lifecycle language and implement approval in a later slice?
2. Should initial assignment allow only one Family Member, or should shared/multiple assignment be included from day one?
3. Does the household need due dates only, or availability windows from the first version?
4. Should Task quick capture appear on Home in the first Task slice, or should all creation start on the Tasks page first?
5. Are point values configured per task definition/series only, or can a single occurrence override the value?
6. Should Family Members have an active/inactive state before task assignment is persisted?
7. What terminology should the UI use: Task, Chore, Responsibility, or a localized household-friendly label?

## Recommended Direction
Adopt Tasks as a separate household responsibility domain with a small, durable product vocabulary:
- Task = responsibility/work item.
- List Item = lightweight memory/checkoff item.
- Family Member = optional responsibility target, not a user.
- Recurrence = task series scheduling concept.
- Completion = task outcome.
- Approval = optional task lifecycle extension.
- Points = optional reward metadata for Gamification to consume.

Recommended initial lifecycle language:
- Available
- Completed
- Awaiting Approval
- Approved
- Reopened
- Archived/Dismissed

Recommended initial ownership language:
- Unassigned
- Assigned to Family Member
- Shared Household

Keep the first implementation intentionally narrow and avoid persistence/API/UI decisions until the first slice prompt explicitly scopes them.

## Recommended First Implementation Slice
Recommended first implementation slice: **Task Domain Foundation Without Gamification**.

Scope should include only the minimum needed to establish Tasks as a real domain:
- Create basic ad-hoc task definitions/instances.
- Support title, optional due date, ownership state, and completion.
- Support unassigned, assigned-to-one-Family-Member, and shared household ownership in product terms.
- Keep recurrence, approval, and points either out of implementation or behind clearly inert/reserved fields only if explicitly requested.
- Add a dedicated Tasks page before adding rich Home integration.
- Add Home summary only after basic Tasks are real and bounded.

Avoid in the first slice:
- Gamification ledger.
- Rewards store.
- Leaderboards.
- Authentication or parent/child permissions.
- Complex recurrence.
- Approval enforcement.
- Task/list conversion flows.
- Full analytics/history.

## Next Prompt Context
Proceed with a Task Domain Foundation implementation slice only after accepting this analysis.

Constraints for the next implementation prompt:
- Keep Tasks separate from Lists.
- Do not add authentication, users, permissions, parent roles, or secure approval enforcement.
- Do not implement Gamification, point balances, leaderboards, reward stores, badges, or streaks.
- Do not modify List Items to carry task semantics.
- Do not design advanced recurrence rules.
- Do not make Home the task management page.
- Prefer a dedicated Tasks page/domain surface first, then add bounded Home summary behavior in a later slice if needed.
