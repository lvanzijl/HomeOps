# Home Dashboard Low-Fidelity Information Architecture

## Summary
Home should feel like a calm household glassboard, not a calendar app, list manager, chore board, sensor dashboard, or workspace editor. The dashboard should reserve the largest footprint for Agenda because time-bound household coordination is the highest-glance need, give Lists a strong secondary footprint because reminders and things-to-bring are core glassboard jobs, and keep Family Members persistently visible as contextual ownership rather than as accounts.

Recommended relative footprint for a wall tablet:

| Section | Visual importance | Home footprint | Dashboard role |
| --- | --- | --- | --- |
| Agenda | 1 | Large | Primary temporal orientation: today, tomorrow, next soon. |
| Lists | 2 | Medium-large | Primary memory surface: shopping, packing, reminders. |
| Family Members | 3 | Small persistent | Ownership and household context across the board. |
| Tasks | 4 | Medium when implemented | Responsibility summary: due, overdue, next up, owner. |
| House Status | 5 | Small exception-only | Interrupt only when urgent/actionable/abnormal. |
| Gamification | 6 | Small optional future | Encouragement only after tasks/points exist. |

Home should roughly read as:

- 45-50% Agenda.
- 25-30% Lists.
- 10-15% Tasks once implemented; before Tasks, this space can strengthen Lists or Agenda.
- 5-10% Family Member persistent context.
- 0-5% House Status, only when an exception exists.
- 0-5% Gamification, only after meaningful task points exist.

The strongest low-fidelity direction is a top family/orientation strip with a two-column dashboard below: Agenda as the dominant left or main panel, Lists and future Tasks as stacked secondary panels, and House Status as a compact interruption banner/tile only when needed.

## Wall Tablet Assumptions
A dedicated wall tablet changes Home from a normal web page into a shared room object. It must support fast scanning while someone is standing nearby, walking past, cooking, leaving the house, or checking what the family needs next.

### Primary layout priorities
1. **Glance first, management second.** Home should answer the household's daily questions without requiring scrolling, filtering, or interpretation.
2. **Today before everything else.** The highest-priority information is what happens today, what needs doing today, and what needs preparing now.
3. **Preparation horizon second.** Tomorrow and the next few upcoming events matter when they change behavior: pack something, buy something, leave earlier, remember an appointment, or prepare a child.
4. **Always-visible summaries only.** Agenda, Lists, Family Members, and eventually Tasks must be visible, but each must be bounded.
5. **Exception-first status.** House Status should interrupt only when it materially changes household action.
6. **No workspace behavior.** Home should not allow panels to expand into full management tools by default.

### Reading distance implications
- The tablet should be readable from a few steps away, not only from seated desktop distance.
- Section titles, event times, list names, family names/initials, and urgent counts should be visually prominent.
- Home should prefer fewer larger items over dense completeness.
- Each section should have an obvious hierarchy: title, most important item, next items, overflow affordance.
- Fine-grained metadata should be secondary or absent. Source/layer mechanics, recurrence rules, sensor details, and list administration should not appear on Home.

### Touch target implications
- Primary actions should be large and sparse: add item, add event, view agenda, view list, complete simple item.
- The dashboard should avoid closely packed controls, nested menus, drag handles, tiny checkboxes, and precise hover states.
- Completion controls on list items and tasks should be usable by children and adults without mis-taps.
- If a section cannot preserve large targets while showing more content, it should show fewer items and a clear overflow action.

## Home Hierarchy
### Ranked visual importance
1. **Agenda — Large.** Agenda is the dominant glassboard function because time-bound events determine household movement, preparation, and urgency.
2. **Lists — Medium-large.** Lists are the second glassboard anchor because they capture shopping, packing, reminders, and things to bring.
3. **Family Members — Small persistent.** Family Members are not a content backlog, but they make ownership and involvement legible across Agenda, Tasks, and future gamification.
4. **Tasks — Medium future.** Tasks should become a meaningful summary once the domain exists, but they should not displace Agenda or Lists until task ownership, recurrence, and completion rules are real.
5. **House Status — Small exception-only.** House Status is important only when abnormal, actionable, and household-relevant.
6. **Gamification — Small optional future.** Gamification should be celebratory metadata, not the organizing principle of Home.

### Footprint categories
| Section | Footprint | Reason |
| --- | --- | --- |
| Agenda | Large | Highest daily orientation value; always visible; today-first. |
| Lists | Medium-large | Core glassboard memory function; always visible; bounded summaries. |
| Tasks | Medium | Important future responsibility layer; summary only; owner-forward. |
| Family Members | Small persistent | Context layer, not a backlog; supports ownership everywhere. |
| House Status | Small conditional | Interrupts only for exceptions; otherwise absent or quiet. |
| Gamification | Small optional | Secondary encouragement after Tasks exists. |

## Agenda Footprint
Agenda should occupy the largest single section of Home: approximately 45-50% of the available dashboard content area on a landscape wall tablet.

### Relative dashboard space
- Agenda should be visually dominant, but not exclusive.
- It should feel like the household's time anchor, not a full calendar application.
- A good target is one large panel with enough room for today, tomorrow, and a compact next-soon preview.

### Visible event count
Recommended visible counts for wall-tablet Home:

- **Today:** 3-5 visible events, prioritizing current/next events and all-day items.
- **Tomorrow:** 1-3 visible events when useful for preparation.
- **Next soon:** 1-2 compact upcoming events only when today/tomorrow are sparse or when the events are preparation-relevant.
- **Total cap:** about 6-8 visible event rows before overflow.

If today has many events, Agenda should prioritize:

1. Current or next timed event.
2. All-day events with household relevance.
3. Events involving children/family logistics.
4. Soonest remaining events.

### Overflow strategy
- Do not make Agenda the primary scroll container on the wall-tablet layout.
- Use a bounded preview with `+x more today`, `+x more this week`, or `View Agenda`.
- Tapping overflow should navigate to the dedicated Agenda page, not expand Home into full calendar management.
- Smaller devices may allow page scrolling, but the Home Agenda section should remain a summary.

### How much Home should feel like Agenda
Home should feel **Agenda-led, but not Agenda-only**. Roughly half of the dashboard may be Agenda, because events are the strongest time-sensitive orientation layer. It should not exceed that by default, because the glassboard also needs memory capture, list reminders, ownership context, and future task responsibility.

## Lists Footprint
Lists should occupy the second-largest footprint: approximately 25-30% of the dashboard content area before Tasks exist, and about 20-25% after Tasks becomes a persistent summary section.

### Number of visible lists
Recommended wall-tablet Home behavior:

- Show **2 pinned/high-priority lists** by default.
- Allow a third compact list only if there is enough space without shrinking touch targets.
- Suggested initial list types: Shopping plus one contextual list such as Packing, Errands, Things to Bring, or Household Reminders.

### Number of visible items
Recommended visible counts:

- **Primary pinned list:** 3-5 active incomplete items.
- **Secondary pinned list:** 2-4 active incomplete items.
- **Third compact list if present:** 1-2 active incomplete items.
- **Total cap:** about 6-9 visible list items across Home.

Completed items should not occupy default Home space. If recently completed feedback is needed, it should be transient and celebratory rather than a persistent history.

### Overflow strategy
- Each list card should show hidden active item count with `+x more`.
- Tapping `+x more`, the list title, or the list card should navigate to the Lists page scoped to that list when possible.
- Home should not inline-expand into the full list on the wall tablet.
- Quick add should be available, but list creation, rename, archive, sorting, completed history, and complex organization belong on the Lists page.

### How much Home should feel like Lists
Home should feel **strongly list-aware but not list-dominated**. Lists are the main replacement for glassboard notes and reminders, so they need enough room to be useful without navigation. However, if Lists grow beyond a medium-large summary, Home risks becoming a task/list workspace rather than a household overview.

## Tasks Footprint
Tasks do not exist yet as a product domain, so Home should not invent task functionality in this IA. Once Tasks exists, it should receive a medium footprint, approximately 10-15% of Home by default, with the ability to grow slightly on high-task days only if Agenda and Lists remain intact.

### Relative size
- Tasks should be smaller than Agenda and usually smaller than Lists.
- Tasks should be large enough to show due/overdue responsibility, not large enough to administer chores.
- A good default is a compact card or stacked panel showing 3-5 task rows.

### Ownership visibility
Ownership should be visible by default because Tasks imply responsibility. Each task row should show:

- Family Member avatar/color/initials or shared household marker.
- Due state: overdue, today, next up, or approval needed when that concept exists.
- Optional points only when real points exist and only as secondary metadata.

Unassigned household tasks should remain valid and should not look broken. They can use a shared household icon or neutral color.

### Relationship with Family Members
Tasks should be the strongest consumer of Family Member ownership. The Family Member strip should provide the visual vocabulary, while task rows reuse the same colors/avatars to make responsibility legible. If tasks are grouped, grouping by urgency should usually beat grouping by person on Home, because Home is a shared dashboard; person-level task management can live on a dedicated Tasks page.

## Family Member Footprint
Family Members should be persistently visible, but they should not become a large content area unless a future slice defines people-specific daily summaries. Recommended footprint: 5-10% of the dashboard, typically a top strip or compact side context area.

### Top strip vs side area vs card
Recommended direction: **top strip integrated with the orientation header**.

Why top strip:

- It keeps household identity visible without competing with Agenda and Lists.
- It supports Variant B-style family member presentation.
- It creates a reusable color/avatar legend for ownership throughout Home.
- It avoids a side panel becoming a pseudo-profile or account area.

A side area is acceptable only if the wall tablet aspect ratio strongly favors it and it remains compact. A large Family Members card is not recommended for the base Home layout because it would consume space without answering the daily glassboard questions as directly as Agenda and Lists.

### Persistent visibility
Family Members should always be visible as:

- Avatar chips, initials, names, or friendly icons.
- Stable pastel colors.
- Optional tiny today badges only after the related domain exists, such as due task count or earned points.

Family Members should not show account status, login state, permissions, security controls, or profile management on Home.

### How much space should Family Members receive
Family Members should receive **small but persistent** space. They are a context layer: important enough to always see, not important enough to dominate. Their visual value is multiplied when Agenda and Tasks use the same colors/avatars for involvement and ownership.

## House Status Footprint
House Status should usually receive no normal dashboard footprint. It should appear only when an exception exists.

### When it appears
House Status can appear on Home when a condition is:

1. **Abnormal:** not a routine reading or healthy state.
2. **Actionable:** someone can or should do something.
3. **Household-relevant:** meaningful to the family, not just a technical diagnostic.
4. **Timely:** useful to know now, not just historical information.

Examples that may qualify after a future House Status slice defines rules:

- Door/window open when leaving or overnight.
- Leak detected.
- Smoke/CO/security alarm state.
- Freezer/fridge temperature unsafe.
- Critical device offline if it makes safety/status unreliable.
- Low battery only when tied to important safety/status devices.

Examples that should not interrupt Home:

- Normal temperature/humidity readings.
- Device inventory.
- Sensor history charts.
- Routine online/offline device diagnostics.
- Automation controls.
- Raw Home Assistant-style entity lists.

### How much space it receives
- **No exception:** no visible card, or at most a tiny healthy indicator if later validated as useful.
- **Single moderate exception:** small banner or compact tile, about 5% of Home.
- **Critical exception:** top interruption banner that temporarily displaces the orientation summary but not the entire dashboard.
- **Multiple exceptions:** show a grouped alert summary with count and highest severity, then route to House Status for details.

### What qualifies as an interruption
An interruption must be urgent enough that a person walking past the wall tablet should notice and potentially act. If it is merely interesting, technical, or diagnostic, it belongs on the House page, not Home.

## Recommended Home Layout
### Section hierarchy
1. Orientation header: date, time, greeting, Family Member strip, quick capture.
2. Primary content: Agenda.
3. Secondary content: Lists.
4. Future responsibility content: Tasks.
5. Optional encouragement: Gamification.
6. Conditional interruption: House Status exception.

### Layout hierarchy
Recommended landscape wall-tablet layout:

```text
┌────────────────────────────────────────────────────────────────────┐
│ Date / Time / Greeting        Family Members        Quick Capture  │
├────────────────────────────────────────────────────────────────────┤
│ Optional House Status Exception Banner, only when actionable        │
├───────────────────────────────┬────────────────────────────────────┤
│ AGENDA                         │ LISTS                              │
│ Today                           │ Shopping                           │
│  • Event 1                      │  □ Item 1                          │
│  • Event 2                      │  □ Item 2                          │
│  • Event 3                      │  □ Item 3                          │
│ Tomorrow                        │  +x more / Add item                │
│  • Event 4                      │ Packing / Reminders                │
│ Next soon                       │  □ Item 1                          │
│  • Event 5                      │  □ Item 2                          │
│ View Agenda / +x more           │ View Lists                         │
├───────────────────────────────┼────────────────────────────────────┤
│ AGENDA continuation if needed   │ FUTURE TASKS / GAMIFICATION        │
│ or breathing room               │ Due today / overdue / next up      │
│                                 │ Small points encouragement later   │
└───────────────────────────────┴────────────────────────────────────┘
```

Alternative if Tasks becomes highly important:

```text
┌────────────────────────────────────────────────────────────────────┐
│ Orientation + Family Members + Quick Capture                       │
├────────────────────────────────────────────────────────────────────┤
│ Exception banner only when needed                                  │
├───────────────────────────────┬────────────────────────────────────┤
│ AGENDA                         │ LISTS                              │
│ ~50% content area               │ ~25% content area                  │
│                                 ├────────────────────────────────────┤
│                                 │ TASKS                              │
│                                 │ ~15% content area                  │
│                                 ├────────────────────────────────────┤
│                                 │ Small optional points/status area  │
└───────────────────────────────┴────────────────────────────────────┘
```

### Relative sizing
| Area | Before Tasks | After Tasks |
| --- | --- | --- |
| Header + Family Members | 5-10% | 5-10% |
| Agenda | 45-50% | 45-50% |
| Lists | 30-35% | 20-25% |
| Tasks | 0% | 10-15% |
| Gamification | 0% | 0-5% |
| House Status | 0-5% conditional | 0-5% conditional |

The dashboard should preserve whitespace and large touch targets. Empty space is acceptable if it protects glanceability.

## Risks
### Information overload
Home can fail if every domain claims always-visible content. Agenda, Lists, Tasks, Family Members, Gamification, and House Status cannot all be large. The IA must enforce caps, overflow, and dedicated pages.

### Poor prioritization
If Lists or future Tasks grow too large, the dashboard may stop answering the most time-sensitive question: what is happening today. If Agenda grows too large, Home becomes a calendar app and loses the glassboard memory function.

### Glassboard failure risks
- Too many visible rows make the wall tablet unreadable from a distance.
- Too many controls make touch interactions error-prone.
- Hidden ownership makes tasks unclear.
- Missing quick capture makes the digital board less useful than the physical board.
- Persistent normal House Status telemetry makes Home feel technical instead of family-oriented.

### Home becoming a workspace
Home becomes a workspace if it supports deep list organization, recurrence editing, task rule administration, family member management, source settings, sensor diagnostics, or media browsing. Each section needs a clear `View ...` route to its dedicated page instead of expanding in place.

## Open Questions
1. What exact wall-tablet size and orientation should be optimized first: landscape 10-11 inch, portrait tablet, or both?
2. Should Home include one global quick capture button or separate quick actions for Add Event and Add List Item?
3. Which Lists are pinned by default: fixed system defaults, household-selected pinned lists, or recent active lists?
4. When Tasks exists, should Home task grouping prioritize urgency, owner, or domain category?
5. Should Family Member chips show today-specific badges, or should ownership appear only inside Agenda/Tasks rows?
6. Should House Status show a quiet all-clear state, or remain completely absent unless exceptional?

## Recommended Next Slice
Create a low-fidelity Home dashboard wireframe specification that translates this IA into a non-visual layout contract: responsive breakpoints, section caps, empty states, overflow labels, quick-capture entry points, and navigation behavior. Do not implement UI until those rules are accepted.

## Next Prompt Context
Use the Home Dashboard Decision Record as fixed. Continue treating Home as the primary glassboard replacement and dashboard only, not a workspace. Preserve Variant C as the dashboard baseline, Variant B for family member presentation, pastel family-friendly touch-first direction, and wall-tablet-first constraints. The next slice should define low-fidelity wireframe behavior and interaction rules only; it should not implement code, migrations, data models, authentication, media, sensors, gamification, or task administration.
