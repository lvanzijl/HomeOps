# Home Dashboard Decision Record

## Summary
This decision record freezes the major Home dashboard UX decisions before Home implementation starts.

Home is the primary household screen and replaces the physical household glassboard. It is a calm, touch-first, wall-tablet-optimized dashboard for shared family orientation. It is not a workspace, not a domain management surface, and not a generic container for every available widget.

Accepted direction:
- Home uses Variant C as the strongest dashboard baseline.
- Home uses Variant B's family member presentation direction.
- Variant D is rejected.
- Visual treatment should be pastel, warm, family-friendly, and touch-first.
- Agenda, Lists, Tasks, Family Members, Gamification, and House Status remain distinct product concepts with explicit Home boundaries.

## Home Purpose Statement
Home exists to keep the household oriented at a glance.

Home should answer:
- What is happening today?
- What is coming next soon enough to prepare for?
- What needs to be bought, packed, brought, remembered, or done?
- Who is involved or responsible?
- Is anything urgent or exceptional enough to interrupt the household's attention?

Home explicitly does not exist to:
- Manage the full Agenda.
- Manage all Lists.
- Administer Tasks, recurrence, approval, or point rules.
- Configure Family Members, users, accounts, roles, or authentication.
- Present a full Gamification leaderboard or reward store.
- Present normal sensor telemetry or become a sensor dashboard.
- Act as a workspace editor, settings hub, media center, or technical operations console.

Home should prefer summary, orientation, and quick capture. Dedicated domain pages should own deep management.

## Home Content Rules
| Domain | Home rule | Decision |
| --- | --- | --- |
| Agenda | Always visible | Home must show a today-first Agenda summary with a small near-future preview. |
| Lists | Always visible | Home must show active List summaries, especially the highest-priority pinned or household-relevant lists. |
| Tasks | Optional until Tasks exists; then always visible as summary | Home should show due/overdue/next Task summaries after the Tasks domain is implemented. It must not invent Tasks before that domain exists. |
| Family Members | Always visible as household context | Home should show Family Member avatars/colors and ownership context without implying login or authentication. |
| Gamification | Optional, and only after Tasks/points exist | Home may show lightweight points or encouragement summaries after Tasks can optionally award points. It must not drive the dashboard before Tasks exist. |
| House Status | Optional exception-only | Home may show urgent, actionable House Status exceptions only. Normal readings, history, device lists, and diagnostics never belong on Home. |

Never on Home:
- Full Agenda management.
- Full Lists management.
- Task rule administration.
- Family Member account/security management.
- Gamification configuration, reward store management, or dominant leaderboards.
- Normal sensor telemetry, history, device inventory, or diagnostics.
- Media browsing or playback-control-heavy UI.

## Home Agenda Rules
Home Agenda is a preview, not the Agenda page.

Home Agenda shows:
- Today as the primary agenda horizon.
- Tomorrow as a persistent preparation preview.
- The next few upcoming events after tomorrow when there is remaining space or when today/tomorrow are sparse.
- Event time, title, all-day/timed state when relevant, source color, and Family Member involvement when known.
- Read-only versus editable source affordance only when needed to prevent confusion, not as technical layer management.

Home Agenda should not show:
- Full week/month browsing.
- Source/layer administration.
- Import/export/restore controls.
- Advanced recurrence editing.
- Calendar settings or source configuration.

Scroll decision:
- Home Agenda should not be the primary scroll container on wall-tablet layouts.
- It may internally cap visible items and show a clear `+x more` or `View Agenda` affordance.
- On smaller screens, page-level scrolling is acceptable, but Home Agenda should still remain a bounded preview.

Click behavior:
- Clicking Agenda panel chrome, `View Agenda`, `+x more`, or non-quick-edit event areas navigates to the dedicated Agenda page.
- Clicking a visible event may open a lightweight detail preview if implemented, but deeper edit/manage flows must route to Agenda.
- Simple add-event quick capture may start from Home, but advanced event management belongs on Agenda.

Final horizon decision:
- Always show today.
- Always show tomorrow when events exist or when the empty state is useful for preparation.
- Show next events as a compact overflow preview after today/tomorrow, not as a full rolling calendar.

## Home List Rules
Home Lists are summaries, not full list management.

Home Lists show:
- Pinned or high-priority lists.
- Active incomplete items from those lists.
- List name, a small item count, and a limited number of visible items.
- Completion affordances only for visible simple list items when touch targets remain large.
- A fast add-list-item quick capture affordance.

Full lists do not belong on Home. Home must not expose list creation, rename, archive, reordering, completed-item history, or complex list organization as its default experience.

`+x more` behavior:
- `+x more` indicates hidden active items in the same list summary.
- Clicking `+x more` navigates to the Lists page scoped to that list when possible.
- It should not expand Home into an unbounded full list on wall-tablet layouts.
- If an inline expansion exists for smaller contexts, it must remain temporary and preserve the summary-first Home layout.

Click behavior:
- Clicking a list card, list title, or `View Lists` navigates to the Lists page.
- Clicking a visible item may toggle completion only if the item is simple and does not require task-like ownership, approval, points, or recurrence.
- Adding a new item from Home should default to a selected/pinned list and allow a lightweight list switch.

## Home Task Rules
Tasks are separate from Lists.

Home Tasks show only summaries after the Tasks domain exists:
- Due today.
- Overdue.
- Next up.
- Approval-needed items when approval exists.
- Ownership and recurrence indicators when they clarify responsibility.

Home Tasks do not show:
- Task template management.
- Recurrence rule editing.
- Approval policy setup.
- Point rule setup.
- Task history or analytics.

Ownership visibility:
- Ownership should be visible on Home Tasks by default through Family Member avatar, color, name, or initials.
- Unassigned household tasks may appear with a household/shared treatment.

Points visibility:
- Points are optional and should be visible only when a task awards points.
- Zero-point tasks must look normal, not inferior.
- Points should be secondary metadata, not the dominant Task presentation.

## Family Member Presentation
Family Members are household entities. They are not users and not authentication identities.

Avatar usage:
- Use avatar chips, initials, or simple friendly icons.
- Avatars should be recognizable from a distance and appropriate for children and adults.
- Avatar presentation follows the preferred Variant B direction.

Color usage:
- Assign each Family Member a stable pastel color.
- Use the color consistently for ownership indicators across Agenda, Tasks, and optional Gamification.
- Avoid colors that imply account status, permissions, or online presence.

Ownership visibility:
- Show ownership where it improves clarity: Tasks, task-like responsibilities, and relevant Agenda involvement.
- Do not force ownership onto generic Lists unless a future list-item ownership rule is explicitly added.

Point visibility:
- Show lightweight point summaries only after Tasks can award points.
- Points may appear on Family Member chips/cards as secondary badges.
- Do not show full leaderboards or reward management on Home.

## Quick Capture Decision
Home should support quick capture because it replaces a physical glassboard.

Final recommendation: use separate plus buttons for the primary capture types, presented as a small touch-first quick-capture cluster rather than one ambiguous shared plus button.

Reasons:
- Wall-tablet usage favors immediate, low-cognitive-load actions.
- Add event, add list item, and add task have different required fields and destinations.
- A shared plus button would require an extra menu step and can become ambiguous for children or guests.

Quick capture decisions:
- Add event: available from Home as a simple flow for title, date/time or all-day, and optional note. Advanced recurrence, source management, import/export, and restore belong on Agenda or Settings.
- Add list item: available from Home as the fastest capture action. Default to the primary pinned list, with a lightweight list switch.
- Add task: not available until the Tasks domain exists. Once Tasks exists, Home may support a simple add-task flow with title, owner, and due timing only; recurrence, approval, and point setup belong on Tasks.

## Home vs Domain Page Boundaries
### Home
Home owns:
- Dashboard summary and orientation.
- Today/tomorrow/next Agenda preview.
- Active List summaries.
- Task summaries after Tasks exist.
- Family Member context and ownership indicators.
- Optional lightweight Gamification summary after points exist.
- Urgent, actionable House Status exception tiles only.
- Simple quick capture entry points.

Home does not own:
- Full management, configuration, administration, or historical views for any domain.

### Agenda Page
Agenda page owns:
- Full Agenda browsing.
- Event detail and event management.
- Recurrence and occurrence editing when those UX rules are implemented.
- Source visibility controls and calendar-specific settings.
- Read-only/editable source explanation.

Agenda page does not own:
- Generic list management.
- Task/chore administration outside explicit Agenda relationships.
- House Status or sensor presentation.

### Lists Page
Lists page owns:
- All lists.
- Full list contents.
- List creation, rename, archive, organization, and completed-item review when implemented.
- List item management beyond simple Home capture/toggle.

Lists page does not own:
- Task recurrence, approval, ownership semantics, or points.
- Calendar event management.

### Tasks Page
Tasks page owns:
- Task definitions and task instances.
- Ownership, due dates, recurrence, approval, completion, and optional points.
- Task history and management views when implemented.

Tasks page does not own:
- Generic shopping/packing list semantics.
- Full Gamification reward systems beyond task point configuration.

### House Status Page
House Status page owns:
- Status categories.
- Normal readings.
- Sensor/device state.
- Alerts, diagnostics, history, trends, and controls when implemented.

House Status page does not own:
- Agenda, Lists, Tasks, Family Member identity, or Media.
- Home dashboard layout.

## Implementation Guardrails
Future Home implementation must follow these rules:

1. Home must be summary-first. If a card needs pagination, filtering, forms, or dense controls, it probably belongs on a domain page.
2. Home Agenda must remain a bounded preview of today, tomorrow, and next events. Do not add week/month browsing or calendar administration to Home.
3. Home Lists must remain bounded summaries. Do not turn `+x more` into a persistent full-list expansion on wall-tablet layouts.
4. Home Tasks must wait for the Tasks domain. Do not model tasks as Lists or Agenda events just to fill the dashboard.
5. Family Members must not become users. Do not introduce login, permissions, account settings, or authentication assumptions through Home.
6. Gamification must follow Tasks. Do not award points to generic Lists or Agenda events unless a future decision explicitly expands rewardable actions.
7. House Status on Home must be exception-only. Normal temperature, humidity, device inventory, and telemetry history belong on House Status, not Home.
8. Home must preserve large touch targets, readable typography, pastel hierarchy, and low density for wall-tablet use.
9. Home quick capture must stay simple. Advanced forms route to domain pages.
10. Widget-driven layout must not override product curation. A widget can exist without earning always-visible Home placement.

## Risks
UX risks:
- Home may become too dense if all domains compete equally.
- Agenda summaries may hide important events if the horizon and overflow rules are poorly implemented.
- `+x more` can turn into accidental full-management behavior if not constrained.
- Separate quick capture buttons require careful visual grouping to avoid clutter.
- Pastel cards can reduce hierarchy if all sections receive equal visual weight.

Product risks:
- Tasks may be implemented prematurely as Lists or Agenda events.
- Gamification may force identity, fairness, approval, and reward decisions too early.
- House Status may pull Home toward a technical dashboard if normal telemetry appears there.
- Family Members may accidentally become authentication users if ownership presentation is confused with identity.

Ambiguous decision risks:
- Exact list pinning rules are not yet frozen.
- The precise number of visible Agenda events and List items must be decided during low-fidelity layout work.
- House Status exception thresholds require a future House Status decision.

Future implementation risks:
- Existing workspace/widget architecture may encourage adding widgets because they exist rather than because they serve Home's purpose.
- Domain pages may be skipped if Home quick capture expands too far.
- Recurrence and approval UX can leak into Home unless explicitly routed to Agenda and Tasks pages.

## Open Questions
1. Which lists are pinned to Home by default: Shopping only, Shopping plus the most recently active list, or manually selected lists?
2. How many Agenda rows should be visible on the target wall-tablet viewport before `+x more` appears?
3. How many List items should be visible per Home list card before `+x more` appears?
4. What minimum Family Member fields are required for the first Home implementation: name, color, initials, avatar, or all of these?
5. What exact House Status conditions qualify as urgent and actionable enough for Home?
6. Should Home have a wall-tablet focus mode that reduces navigation chrome and increases card density/scale?

## Recommended Next Slice
Recommended next slice: **Home Dashboard Low-Fidelity Information Architecture**.

Scope:
- Produce a low-fidelity Home layout using the frozen decisions in this record.
- Decide card hierarchy and target wall-tablet viewport behavior.
- Decide visible row counts for Agenda and Lists.
- Decide default pinned-list behavior.
- Define empty, loading, and overflow states.

Do not implement UI, APIs, data models, migrations, Tasks, Gamification, House Status integrations, authentication, or media.

## Next Prompt Context
Use this context for the next prompt:

> Proceed with a Home Dashboard Low-Fidelity Information Architecture analysis/design slice only.
> 
> Constraints:
> - No implementation, code changes, tests, migrations, or database changes outside the analysis artifact.
> - Use the Home Dashboard Decision Record as fixed input.
> - Home is the primary touch-first wall-tablet family glassboard dashboard, not a workspace or management page.
> - Agenda and Lists are always visible summaries with dedicated domain pages for management.
> - Tasks remain separate from Lists and should only appear as summaries after the Tasks domain exists.
> - Family Members are household entities, not users or authentication identities.
> - Gamification is optional and follows Tasks.
> - House Status appears on Home only for urgent, actionable exceptions.
> - Visual direction is pastel, family-friendly, Variant C dashboard baseline, Variant B family member presentation, and not Variant D.
