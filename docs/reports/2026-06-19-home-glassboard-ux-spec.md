# Home Glassboard UX Specification

## Summary
Home should become the family glassboard: a shared, glanceable, touch-first household surface that answers what is happening today, what needs attention, and what the household should remember before leaving the room. Product structure should lead with Agenda and Lists, prepare for Tasks and Family Members, keep Gamification secondary until Tasks exist, and keep House Status and Media off the primary Home surface unless they produce urgent, household-relevant exceptions.

This report is analysis only. It does not define implementation tasks, data changes, migrations, or technical architecture beyond UX boundary implications.

## Home Purpose
Home exists to replace the physical household glassboard. Its job is not to expose every feature; its job is to keep the family oriented.

Home should answer these questions at a glance:
- What is happening today?
- What is coming soon enough that we should plan around it?
- What do we need to buy, pack, bring, or remember?
- Who is involved or responsible?
- What needs to be done next?
- Is anything unusually important or urgent?

Home should always optimize for:
- Shared household visibility over individual productivity.
- Fast scanning from several feet away on a wall tablet.
- Touch-first interaction with large targets and forgiving flows.
- Family-friendly tone, pastel visual treatment, and warm dashboard composition.
- A small number of high-value areas rather than dense application navigation.

Home should not become:
- A settings hub.
- A full calendar management application.
- A task administration console.
- A system monitoring dashboard.
- A media control center.
- A place that assumes authenticated users or per-person logins.

## Home Content Rules
Recommended Home placement by domain:

| Domain | Home placement | Rationale |
| --- | --- | --- |
| Agenda | Always visible | Agenda is a primary glassboard function and should anchor the Home surface. |
| Lists | Always visible | Lists are a primary glassboard function for shopping, packing, and household reminders. |
| Tasks | Sometimes visible now; always visible after task domain exists | Tasks are expected to become important, but should not be over-modeled before task rules exist. |
| Family Members | Always visible as context, not as accounts | Family presence and ownership should be visible without implying login or identity management. |
| Gamification | Sometimes visible after tasks exist | Points are motivational but should not compete with agenda/list utility before task ownership exists. |
| House Status | Separate page with Home exceptions only | Most status belongs in House/Household Status; only urgent or actionable exceptions belong on Home. |
| Media | Separate page | Media is lowest priority and does not belong on the glassboard except possibly as future event-like reminders. |

Always visible on Home:
- Today's agenda and near-future agenda.
- One or more high-priority lists, especially Shopping and any active packing/checklist list.
- Family member strip or family context area.
- Immediate quick capture affordances for the most common glassboard actions.

Sometimes visible on Home:
- Task preview once Tasks exist.
- Family member assignments attached to events/tasks/list contexts.
- Gamification summary after task points exist.
- House alerts only when they are exceptional, actionable, and household-relevant.

Separate page:
- Full agenda management.
- Full list management.
- Full task/chores management.
- Gamification history, rules, rewards, and leaderboards.
- House devices, sensors, history, diagnostics, and controls.
- Media browsing, playback, schedules, and integrations.

## Glassboard Replacement Rules
Information that belongs on the Home glassboard:
- Today's events, appointments, school items, activities, birthdays, and time-sensitive household plans.
- Tomorrow/soon preview when it changes preparation behavior.
- Shopping list highlights and active list items that need household attention.
- Packing or checklist items for upcoming trips, events, school, sports, or errands.
- Tasks/chores that are due today, overdue, or next up once the Tasks domain exists.
- Visible ownership where useful: who is going, who owns the task, who should bring something.
- Friendly family member presence through avatars, names, colors, or initials.
- Optional motivational points summary after task points are real.
- Urgent house exceptions, such as an important sensor state or household issue, if a later House Status slice defines those rules.

Information that does not belong on the Home glassboard:
- Complete historical calendars.
- Deep recurrence, source, import/export, restore, or calendar administration controls.
- Full list archive, list settings, or complex item management.
- Task rule configuration, approval setup, recurrence policy, or points rule editing.
- Authentication, profiles, permissions, invites, roles, or account management.
- Device diagnostics, telemetry history, raw sensor readings, and automation controls.
- Media library management or playback-control-heavy surfaces.
- Any content that requires small text, precise mouse interaction, or long forms as the default Home experience.

## Quick Capture Rules
Home should support quick capture because physical glassboards are valuable partly because adding a reminder is immediate.

Immediate Home actions should include:
- Add list item.
- Add event using a short, simplified flow.
- Add task only after the Tasks domain exists and the minimal ownership/due-date rules are defined.

Recommended behavior:
- Add list item should be the fastest capture action. It can default to the most prominent list, such as Shopping, while allowing a lightweight list switch.
- Add event should be available from Home, but the Home flow should remain simple: title, date/time or all-day, and optional note/source. Advanced recurrence, exceptions, imports, restores, and source management should stay elsewhere.
- Add task should eventually be available from Home for quick household responsibilities, but should not be implemented until the Tasks product model is settled.

Actions that should open dedicated pages:
- Full calendar editing and advanced recurrence.
- Event source management.
- Creating, renaming, archiving, or organizing lists.
- Task recurrence, approval, point configuration, and chore templates.
- Family member management.
- Gamification setup and reward configuration.

## Lists vs Tasks
Lists and Tasks should remain separate product domains.

Lists are for unordered or lightly ordered collections of things:
- Shopping.
- Packing.
- Checklists.
- Things to bring.
- Things to remember.
- One-off household capture that does not require ownership, recurrence, approval, or reward semantics.

Tasks are for responsibilities:
- Owner.
- Due date or recurrence.
- Completion accountability.
- Optional approval.
- Optional points.
- Household chores and commitments.

Why separation matters:
- A shopping item should not need a due date, owner, recurrence, or approval.
- A recurring chore should not be treated like a generic checklist item.
- Points and approvals belong to responsibilities, not every remembered object.
- Keeping domains separate prevents Home from becoming a confusing mixed backlog.

What should appear on Home:
- Lists: top active list items, grouped by list, with fast add and simple complete/remove interactions.
- Tasks: today/overdue/next tasks grouped by owner or urgency once Tasks exist.
- Cross-over: a checklist can look task-like on Home, but unless it has responsibility semantics, it should remain a List.

Do not merge Lists and Tasks until there is a strong product reason. If future UX needs a unified presentation, combine them visually on Home while preserving separate underlying product concepts.

## Family Members
Family Members are household entities, not user accounts and not authentication identities.

Family Member information that belongs on Home:
- Name or nickname.
- Avatar, initials, icon, or color.
- Assignment ownership on tasks and relevant events.
- Optional points summary after gamified tasks exist.
- Possibly today-specific involvement, such as events or tasks associated with a person.

Avatars make sense because:
- The product is family-friendly and wall-tablet-first.
- Children and adults can recognize people faster through color/avatar treatment than text-only names.
- Variant B's family member area is liked and should influence the Home surface.

UX boundary:
- Do not use Family Members to imply login state.
- Do not show profile/security settings on Home.
- Do not require a Family Member to be tied to a device user.
- Assignment ownership should be visible when it improves clarity, especially for tasks and chores.

Recommended Home treatment:
- A warm family strip or card area near the top or side.
- Pastel avatar chips.
- Small today badges, such as task counts or upcoming event involvement, only after those concepts exist.
- No account controls, sign-in prompts, or permission language.

## Gamification
Gamification should follow Tasks because points need a responsibility model before they are meaningful.

Home should eventually show:
- Lightweight points summary by Family Member.
- Celebratory completion feedback for task completion.
- Today's earned points or streak-style encouragement if it remains friendly and not punitive.
- Zero-point tasks without making them look less valid than point-awarding tasks.

Home should not show:
- Full leaderboards as the dominant Home element.
- Reward store management.
- Point rule configuration.
- Historical analytics.
- Competitive framing that undermines household cooperation.

Recommended boundary:
- Points are optional per task.
- Zero-point tasks are normal household responsibilities, not second-class items.
- Gamification should encourage and celebrate, not become the organizing principle of Home.
- Detailed gamification belongs in a dedicated area after the Tasks slice establishes ownership, completion, approval, and point rules.

## House Status
Best naming direction: **House Status**.

Rationale:
- "House" is a broad workspace name and may include devices, rooms, sensors, and controls.
- "House Status" is clearer for a status-focused surface.
- "Household Status" sounds more like people/family state than sensors or home conditions.

What belongs in House Status:
- Current household environment readings when relevant.
- Sensor states.
- Device status.
- Home Assistant-style status summaries if a future slice introduces them.
- Alerts that may require household attention.
- History, trends, and diagnostics on the dedicated House Status page, not Home.

What does not belong in House Status:
- Family member accounts or authentication.
- Agenda items.
- Shopping/list content.
- Task ownership, except possibly chores tied to house maintenance in a future task model.
- Media playback as a primary concern.

Home relationship:
- House Status should not be a primary Home column initially.
- Home may show a compact exception tile only when a condition is urgent, actionable, and family-relevant.
- Avoid filling Home with normal sensor readings; that recreates a technical dashboard rather than a family glassboard.

## Recommended Home Layout
Use the accepted visual direction: family-friendly, touch-first, wall-tablet-first, pastel colors, Variant C as the strongest dashboard baseline, Variant B for the family member area, and avoid Variant D's clinical tone.

### Top Area
Purpose: orientation and immediate family context.

Recommended contents:
- Date, day, and friendly household greeting.
- Current time if useful for a wall tablet.
- Family member strip with avatars/colors/initials.
- Small today summary: events count, active list count, due tasks once tasks exist.
- Primary quick capture button or small cluster.

Avoid:
- Dense navigation.
- Account/profile controls.
- Technical status bars.

### Main Content Area
Purpose: the glassboard core.

Recommended contents:
- Large Agenda panel as the dominant anchor.
- Today-first agenda with a near-future preview.
- Visual grouping by day/time and source color.
- Large touch targets for opening event details.
- Clear empty state that invites adding an event.

Agenda should never require navigation for:
- Seeing today's schedule.
- Seeing the next few important upcoming events.
- Starting a simple add-event flow.

### Secondary Area
Purpose: household memory and responsibilities.

Recommended contents:
- Active Lists card, especially Shopping plus one active checklist/packing list.
- Task preview card when Tasks exist.
- Lightweight family/points card after gamification exists.
- Optional House Status exception tile only when meaningful.

Lists should never require navigation for:
- Seeing the most important active list items.
- Adding a quick item.
- Checking off a visible item.

Tasks should never require navigation for:
- Seeing due-today and overdue responsibilities once Tasks exist.
- Completing a straightforward visible task if no approval is required.

Dedicated pages remain appropriate for:
- Full list organization.
- Full task/chore management.
- Full calendar management.
- House Status detail.
- Media.
- Settings.

## Risks
Product risks:
- Home may become too dense if Agenda, Lists, Tasks, Family Members, Gamification, House Status, and Media all compete equally.
- Building Tasks too early without ownership, recurrence, approval, and points decisions may create confusing overlap with Lists.
- Gamification before Tasks could force artificial point rules onto lists or events.
- House Status could pull Home toward a technical dashboard instead of a family glassboard.
- Treating Family Members like users could accidentally introduce authentication/account assumptions into UX.

UX risks:
- Wall-tablet usage requires larger typography, larger targets, and less density than desktop dashboard layouts.
- Quick capture can become slow if it opens full management forms by default.
- Too many pastel cards without clear hierarchy may reduce glanceability.
- Hidden navigation for core glassboard questions would undermine the product purpose.
- Competitive gamification could become discouraging if not designed around family cooperation.

Missing decisions:
- Exact Home agenda horizon: today only, today + tomorrow, or rolling week preview.
- Which list is the default quick-add target.
- Whether list completion is enough for checklist use cases before Tasks exist.
- Family Member fields: avatar, color, nickname, age/role, visibility rules.
- Task completion model: self-complete, approval-required, or mixed.
- Point display tone and whether points reset daily/weekly or accumulate.
- House Status alert threshold for showing anything on Home.

Premature implementation areas:
- Full task/chores system.
- Gamification rules or rewards.
- Family authentication or user accounts.
- House sensor integrations.
- Media integrations.
- Advanced calendar management from Home.
- Unified Lists/Tasks backend model.

## Open Questions
1. What exact time horizon should the Home Agenda show by default?
2. Should Home prioritize today's schedule only, or include tomorrow/this week as a persistent preview?
3. Which list should quick-add default to when multiple lists exist?
4. Are packing/checklist lists manually promoted to Home, automatically promoted by recent use, or tied to upcoming events?
5. What minimum fields define a Family Member for UX purposes?
6. Should Family Members have colors globally across Agenda, Tasks, and Gamification?
7. What makes a Task approval-required versus self-completable?
8. Should points be shown as daily encouragement, weekly totals, lifetime totals, or a mix?
9. What House Status conditions are important enough to interrupt the Home glassboard?
10. Should Home have a dedicated "focus mode" for wall tablets with reduced navigation and larger cards?

## Recommended Next Slice
Recommended next slice: **Home UX Decision Record and Low-Fidelity Information Architecture**.

Scope:
- Decide Home agenda horizon.
- Decide Home list selection/default behavior.
- Define Family Member display fields.
- Define pre-Tasks placeholder behavior without implementing Tasks.
- Define Home card hierarchy and navigation boundaries.
- Produce a low-fidelity product structure artifact before implementation.

Do not implement UI, APIs, migrations, task models, gamification, sensors, media, authentication, or database changes in that slice unless a later prompt explicitly changes scope.

## Next Prompt Context
Use this context for the next analysis/design prompt:

> Proceed with a Home UX Decision Record and low-fidelity information architecture only.
> 
> Constraints:
> - No implementation, code changes, tests, migrations, or database changes.
> - Home is the primary family glassboard.
> - Agenda and Lists are always visible.
> - Tasks are future responsibilities and must remain separate from Lists.
> - Family Members are household entities, not users or authentication identities.
> - Gamification follows Tasks and remains optional per task.
> - House Status belongs on a separate page, with only urgent/actionable exceptions on Home.
> - Media remains separate and lowest priority.
> - Visual direction is family-friendly, touch-first, wall-tablet-first, pastel, Variant C dashboard baseline, Variant B family member area, not clinical Variant D.
> - Focus on product structure, Home hierarchy, and navigation boundaries.
