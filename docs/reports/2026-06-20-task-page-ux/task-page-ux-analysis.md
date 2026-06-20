# Task Page UX Analysis

## Summary
The Tasks page should be the household responsibility surface: a place to see, create, assign, complete, and review household work without turning Home, Lists, Calendar, Family Members, or Gamification into task-management surfaces.

Recommended direction:
- Use a hybrid default view: urgency-led sections with lightweight owner chips and filters.
- Keep Home summary-only: overdue, due today, next up, unassigned, and awaiting approval counts or rows.
- Support categories later, not in the first implementation slice.
- Start creation with only title, ownership, and optional due timing.
- Keep recurrence, approval, and points as advanced Tasks-page/detail concepts, not Home concepts.
- Use one-tap completion for normal tasks, with an optional future awaiting-approval state only when a task explicitly requires approval.
- Show Family Member avatars prominently enough to clarify ownership, but do not make the page look like account management.
- Keep Gamification secondary: show non-zero task point values only as metadata, never leaderboards, balances, stores, or scoring logic.

This report is analysis-only. It does not define persistence, API contracts, migrations, tests, or implementation details.

## Task Page Purpose
The Tasks page exists to answer:
- What household work needs attention now?
- What is overdue, due today, upcoming, unassigned, or awaiting approval?
- Who is responsible, if anyone?
- What can be completed quickly?
- Which task needs more detail, assignment, recurrence, approval, or point configuration?

The Tasks page should own:
- Full task list browsing.
- Task creation beyond Home quick capture.
- Assignment and reassignment.
- Due timing and urgency review.
- Completion and reopening.
- Optional approval workflow when implemented.
- Recurrence configuration when implemented.
- Optional task point values when implemented.
- Task detail and history when implemented.

The Tasks page should not own:
- Generic shopping, packing, or reminder lists.
- Calendar event management.
- Family Member account/profile/authentication management.
- Gamification balances, leaderboards, reward stores, streaks, badges, or redemption.
- Home dashboard summaries beyond navigation targets.
- Sensor, media, or house-status workflows.

Product boundary: Tasks are household responsibilities. Lists are lightweight memory/checkoff surfaces. Calendar is time-blocked scheduling. Gamification is optional motivation built on top of completed/approved task outcomes.

## Task Organization
### Option A — Group by owner
Owner grouping makes responsibility obvious and works well for families asking, “What is mine?” It supports child-friendly scanning when avatars are recognizable.

Strengths:
- Clear accountability.
- Natural relationship to Family Members.
- Useful for member-specific pages and filters.
- Helps parents review one child’s responsibilities.

Weaknesses:
- Can hide urgent tasks under the wrong owner section.
- Unassigned and shared household tasks may feel secondary or awkward.
- A family with several members may require too much scrolling.
- It risks implying Family Members are user accounts if overemphasized.

Best use: filters, owner chips, member detail pages, and optional secondary grouped views.

### Option B — Group by urgency
Urgency grouping makes the page action-oriented and is the strongest default for a shared household surface.

Recommended urgency groups:
1. Overdue.
2. Due today.
3. Upcoming.
4. No due date / anytime.
5. Completed recently, collapsed or secondary.

Strengths:
- Answers what needs attention first.
- Aligns with Home’s summary needs.
- Works for assigned, unassigned, and shared tasks.
- Keeps overdue and today’s tasks from being buried.

Weaknesses:
- Less direct for “show me Alex’s tasks” unless owner filtering is easy.
- Tasks without due dates can accumulate into a low-signal bucket.
- Recurring chores may need careful copy so generated instances do not feel duplicated.

Best use: default view.

### Option C — Group by status
Status grouping is useful for workflow review, especially approval. It is less useful as the primary household view because status can be too abstract for daily use.

Possible status groups:
- Available.
- Awaiting approval.
- Completed.
- Reopened.
- Archived/dismissed.

Strengths:
- Clear lifecycle semantics.
- Good for approval review.
- Good for administrative cleanup.

Weaknesses:
- “Available” can become a large undifferentiated pile.
- It does not naturally prioritize overdue versus later tasks.
- It may feel bureaucratic for simple chores.

Best use: approval queues, filters, and detail/history views.

### Option D — Hybrid
Hybrid is the best direction: urgency-first default, with owner chips, status filters, and optional category filters.

Recommended default:
- Primary grouping: urgency.
- Row metadata: owner/shared/unassigned, due date, status, optional category, optional non-zero points.
- Top filters: owner, status, category later, completed visibility.
- Quick view toggles later: “By due date” default, “By person” optional.

This preserves the action-oriented daily scan while still supporting household responsibility and lifecycle review.

## Task Categories
Categories such as Cleaning, Pets, Kitchen, Outdoor, and School are useful as organization metadata, but they are not required for the first implementation slice.

### Needed now
Not needed now.

Reasons:
- The first UX problem is responsibility, urgency, and completion, not taxonomy.
- Categories add creation friction and require category management decisions.
- Families may use categories inconsistently unless the product has enough tasks to justify them.
- Categories can become a premature substitute for ownership, due dates, or recurrence.

### Needed later
Likely needed later once households have enough tasks.

Later category value:
- Filtering long task boards.
- Creating recurring chore templates by household area.
- Supporting “Kitchen reset” or “Pet care” mental models.
- Helping with weekly reviews.
- Enabling future summary cards without making Home category-heavy.

Recommended later model at the UX level:
- Optional category per task.
- Small fixed starter set or household-defined names only after category management is explicitly scoped.
- Category display as a small label, not a primary task identity.

### Not needed
Categories should not become:
- Permission groups.
- Gamification teams.
- Calendar sources.
- Widget-specific groupings.
- Required fields for quick capture.

## Home Relationship
Home should link to the Tasks page in two ways after Tasks exists:
- From the Tasks summary card title, “View Tasks,” or overflow affordance.
- From summary rows or counts scoped to the relevant Tasks page filter when possible, such as overdue, due today, unassigned, or awaiting approval.

Home should show from Tasks:
- A bounded count or short list of overdue tasks.
- A bounded count or short list due today.
- Next up / soon when today is sparse.
- Unassigned tasks needing someone to take responsibility.
- Awaiting approval when approval exists.
- Owner avatar/name/color for assigned tasks.
- Shared household indicator for shared tasks.
- Optional non-zero points only as secondary metadata.

Home should not show from Tasks:
- Full task lists.
- Category management.
- Recurrence editing.
- Approval policy setup.
- Point configuration.
- Task history or analytics.
- Bulk reassignment.

Home quick capture may open a minimal add-task flow or route to the Tasks page with an add form. Advanced creation belongs on Tasks.

## Task Creation UX
### Minimum quick creation fields
Minimum fields should be:
- Title: required.
- Ownership: default to Unassigned or Shared Household; allow one Family Member when obvious.
- Due timing: optional, with fast choices like Today, Tomorrow, This weekend, No due date.

Recommended first quick-create behavior:
- The user can create a usable task with only a title.
- Default ownership should avoid implying an account. “Household” or “Unassigned” is safer than auto-assigning to a person.
- Due timing should be easy to skip.

### Advanced fields
Advanced fields belong on the Tasks page or task detail page:
- Description/notes.
- Category later.
- Recurrence later.
- Approval required later.
- Point value later.
- Availability window later.
- Priority later only if urgency grouping proves insufficient.
- Attachments/comments/history only in a much later slice, if ever.

### What belongs on Home
Home may support:
- Add task title.
- Optional owner.
- Optional due shortcut.
- Save and route/view task.

Home should not support:
- Recurrence rules.
- Approval setup.
- Point setup.
- Category management.
- Detailed notes as a default requirement.

### What belongs on Tasks page
Tasks page should support:
- Full create form.
- Owner choice.
- Due date/timing.
- Description.
- Category when introduced.
- Advanced section for recurrence, approval, and points when introduced.

## Task Detail UX
### Task list page
The task list page should show enough information to act quickly:
- Title.
- Owner avatar/name, unassigned label, or shared household label.
- Urgency/due date.
- Status.
- One-tap complete action for normal available tasks.
- Awaiting approval badge/action when applicable.
- Optional category label later.
- Optional non-zero points as secondary metadata later.

The list page should avoid dense configuration. It should not expose recurrence rule editing, approval policy details, or point setup inline by default.

### Task detail page
The task detail page should own the full context:
- Title.
- Description.
- Owner and reassignment.
- Due date and availability timing.
- Status and completion history when available.
- Recurrence configuration when implemented.
- Approval requirement and approval/reopen actions when implemented.
- Point value or reward eligibility when implemented.
- Category when implemented.

Recommended field placement:

| Field | List page | Detail page |
| --- | --- | --- |
| Title | Primary | Editable/full |
| Description | Preview only if short; usually hidden | Full |
| Owner | Visible chip/avatar | Editable |
| Due date | Visible | Editable |
| Recurrence | Small indicator later | Full configuration later |
| Approval | Badge/action if awaiting | Requirement and workflow later |
| Points | Small non-zero badge later | Configuration later |
| Category | Small label later | Editable later |

## Task Completion UX
### One-tap completion
One-tap completion should be the default for simple tasks.

Rules:
- Available tasks without approval can be completed directly from the list.
- Completion feedback should be immediate and reversible through undo or reopen.
- Large touch targets matter because household tasks may be completed from a shared tablet.

### Approval workflow
Approval should be optional and later-slice friendly:
- If approval is not required, completion finalizes the task.
- If approval is required, completion moves the task to Awaiting Approval.
- Approve finalizes it.
- Reopen returns it to actionable work.

Approval must not imply secure identity, parent accounts, roles, or authentication in the first UX model. It is a household workflow state, not a permission system.

### Shared household completion
Shared household tasks can be completed by anyone.

Simplest usable model:
- Shared task appears with a household/shared icon.
- Completion does not require selecting who did it in the first slice.
- Later, the detail page may optionally record “completed by” if Family Member actor selection becomes valuable.

Recommended simplest model:
- Start with Available and Completed for all tasks.
- Include owner states: Unassigned, Assigned to one Family Member, Shared Household.
- Reserve Awaiting Approval, Approved, and Reopened language for later unless approval is explicitly in scope.

## Family Member Relationship
Family Members should appear on the Tasks page as assignment and filtering aids, not as user accounts.

Recommended presentation:
- Owner chips with avatar, display color, and name where space allows.
- Shared Household chip/icon for household-owned tasks.
- Unassigned chip that looks actionable but not broken.
- Top owner filter using avatars: All, Unassigned, Shared, each Family Member.

Avatars should be prominent enough to support fast recognition, especially in row metadata and filters. They should not dominate task titles or make the page feel like profile management.

Owner filtering makes sense and should be available early because:
- Families often ask “What do I need to do?”
- Parents/caregivers may review one child’s chores.
- It prevents owner grouping from becoming the only navigation model.

Avoid:
- Login indicators.
- Online/offline presence.
- Permission labels.
- Parent/child role enforcement.
- Point-account presentation on the Tasks page.

## Gamification Relationship
Gamification should be minimally visible on the Tasks page.

Visible on Tasks page when implemented:
- Non-zero point value on a task as small metadata.
- Possibly “points pending approval” copy for approval-required point tasks.
- Completion celebration can be lightweight, but it should not dominate.

Hidden from Tasks page:
- Point balances.
- Leaderboards.
- Reward store.
- Badges.
- Streaks.
- Leveling.
- Redemption rules.
- Fairness algorithms.
- Gamification settings beyond the task’s own optional point value.

Tasks must remain completeable when Gamification is disabled, and zero-point tasks must look normal.

## Recommended Task Page Layout
Low-fidelity information architecture:

```text
Tasks
Household responsibilities, not shopping lists or calendar events

[+ Add task]                           [Search later]

Filters:
[All] [Overdue] [Today] [Upcoming] [Unassigned] [Awaiting approval]
Owners:
[All] [Household] [Unassigned] [Ava avatar] [Sam avatar] [Parent avatar]

---------------------------------------------------------------
Overdue (2)                                      [View all]
[ ] Feed the dog                 Ava     Due yesterday    5 pts
[ ] Put bins outside             Household Due yesterday

Due today (4)
[ ] Empty dishwasher             Sam     Today
[ ] Pack sports bag              Unassigned Today
[✓] Water plants                 Household Completed today

Upcoming
[ ] Clean bedroom                Ava     Tomorrow         Approval
[ ] Vacuum living room           Household Saturday

Anytime / no due date
[ ] Sort board games             Unassigned No due date

Completed recently                           [Hide / Show more]
[✓] Take laundry upstairs        Sam     Completed today
```

Detail flow:

```text
Task detail: Clean bedroom

Title
Description / notes
Owner: [Ava avatar]
Due: Tomorrow
Status: Available

Advanced
- Recurrence: None / later configuration
- Approval required: Yes / No later
- Points: 0 by default; optional later
- Category: Cleaning later

Actions
[Complete] [Reassign] [Edit] [Archive]
```

Home-to-Tasks navigation:

```text
Home Tasks summary
Overdue 2  | Due today 4 | Awaiting approval 1
[Feed the dog] [Ava] [Due yesterday]
[Pack sports bag] [Unassigned] [Today]
[View Tasks]
```

## Risks
### UX risks
- Owner-first grouping could hide urgent tasks.
- Status-first grouping could make simple chores feel like workflow software.
- Too many filters and labels could overwhelm a wall-tablet or child-friendly experience.
- Unassigned and shared household tasks may be confused unless they have distinct copy and visual treatment.
- Approval could create confusion if users think completion failed rather than moved to a review state.

### Product risks
- Users may expect Lists and Tasks to merge because both can be checked off.
- Families may want categories, recurrence, approval, and points immediately, creating pressure to overbuild the first slice.
- Home may become cluttered if every task queue appears at equal weight.
- Task detail pages may feel heavy if created before the task list experience is useful.

### Domain-boundary risks
- Adding owner/approval/points to Lists would blur Lists and Tasks.
- Showing point balances on Tasks would blur Tasks and Gamification.
- Treating Family Members as secure actors would pull authentication into the Task slice.
- Reusing Calendar recurrence UX too literally could make chores feel like events.

### Premature implementation risks
- Building categories, recurrence, approval, and points together would lock in too many unvalidated decisions.
- Creating database migrations before the UX model is accepted could harden the wrong lifecycle.
- Implementing Home task widgets before the Tasks page exists could create placeholder behavior that later conflicts with real task management.
- Designing task actors around users would violate the accepted Family Member boundary.

## Open Questions
1. Should the first implementation call the surface “Tasks,” “Chores,” or “Responsibilities” in the UI?
2. Should quick creation default to Unassigned or Shared Household?
3. Should the first slice include due dates, or only owner and completion?
4. Should completed tasks appear in the default list at all, or only in a collapsible recent section?
5. Should owner filters be visible by default on small screens, or hidden behind a filter button?
6. When approval later exists, who can approve in a non-authenticated household model?
7. Should categories be a curated starter set or household-defined labels when introduced?

## Recommended Direction
Adopt a dedicated Tasks page with a hybrid urgency-first default view.

Decision summary:
- Default organization: urgency groups.
- Secondary tools: owner filters and status filters.
- Categories: defer; add later only as optional labels/filters.
- Creation: title-only possible; owner and due timing optional but easy.
- Detail: owns description, reassignment, advanced recurrence, approval, and points.
- Completion: one-tap for normal tasks; approval only when explicitly required later.
- Family Members: visible as assignment chips/filters, not users.
- Gamification: non-zero task point metadata only; no gamification surfaces.
- Home: summary and navigation only.

## Recommended First Implementation Slice
Recommended first implementation slice: **Task Page Foundation, Ad-Hoc Tasks Only**.

Scope:
- Dedicated Tasks page.
- Create ad-hoc tasks with title, optional owner state, and optional due date.
- Show urgency-first groups.
- Support Unassigned, Assigned to one Family Member, and Shared Household in the UI language.
- Support one-tap completion and simple reopen/undo if feasible.
- Keep Home integration out or limited to navigation until the Tasks page is real.

Explicitly out of scope:
- Recurrence.
- Approval workflow.
- Points and Gamification.
- Categories.
- Authentication, users, roles, permissions, PINs, or secure actors.
- List-to-task conversion.
- Calendar integration.
- Task analytics/history beyond recent completed visibility.

## Next Prompt Context
Proceed with a Task Page Foundation implementation slice only after this UX direction is accepted.

Constraints for the next implementation prompt:
- Implement the smallest dedicated Tasks page first.
- Keep Tasks separate from Lists, Calendar, Family Members, and Gamification.
- Do not modify List Items to add task semantics.
- Do not implement recurrence, approval, points, gamification ledgers, badges, streaks, reward stores, or leaderboards.
- Do not add authentication, users, roles, permissions, or secure approval enforcement.
- Do not add migrations or API contracts unless explicitly requested by the implementation prompt.
- Keep Home summary-only; avoid making Home the task management surface.
- Preserve Family Members as household entities, not users.
