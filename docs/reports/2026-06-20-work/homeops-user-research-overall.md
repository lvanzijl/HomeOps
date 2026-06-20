# HomeOps Document-Based User Research — Overall Report

## Executive summary

This research evaluated HomeOps from repository evidence only. The exercise started from an empty installation for a household containing Father, Mother, and one 8-year-old Child. The parents must configure everything themselves.

HomeOps has a coherent conceptual foundation: Home is a summary-first household dashboard, with deeper functionality on Agenda, Lists, Tasks, Motivation, Family Member, and Settings surfaces. The strongest usable capabilities are quick shopping capture, task creation/completion, Home summaries, avatar editing, and local calendar event management.

The main product risk is first-run setup. Repository evidence proves seeded/persisted household data and editing of some existing data, but does not prove a complete user-facing onboarding workflow to create the household, add Father/Mother/Child profiles, configure goals, configure rewards, create lists, connect external calendars, or set recurring routines. Under the required invariant of an empty installation, those missing setup capabilities are severe.

The product is promising for daily household visibility, but it currently behaves more like a durable prototype with several real domains than a self-service family product.

## Evidence boundaries and method

This report is based on repository documentation and source code. The application was not started. No browser automation, screenshots, implementation changes, bug fixes, or visual-design evaluation were performed. If a capability could not be proven from repository evidence, it was treated as unavailable.

Evaluated concerns: discoverability, onboarding, information architecture, feature completeness, household setup workflow, conceptual UX, and long-term usefulness.

Explicitly excluded: colors, layout aesthetics, typography, spacing, responsiveness, animations, icons, and visual appearance.

## Generated functional user guide

### 1. Home dashboard

**Purpose:** Home is the main household overview. It shows today's date/time, a family member strip, quick capture for shopping and events, and summary cards for Agenda, Lists, Motivation, and Tasks.

**How a user discovers it:** Home is the first workspace in the top-level navigation and is the default starting page.

**How it is configured:** No Home-specific user configuration is proven. It depends on data from family members, lists, calendar events, tasks, and motivation goals.

**How it is used:** A user reviews summaries, opens family member pages from the family strip, adds a shopping item, adds a quick calendar event, or opens the relevant domain page from a summary card.

**Expected outcome:** The household gets a compact daily overview and quick entry points for common updates.

### 2. Workspace navigation

**Purpose:** Navigation separates HomeOps into Home, Agenda, Lists, Tasks, Motivation, House Status, Media, Gamification, and Settings.

**How a user discovers it:** The navigation buttons are visible in the workspace shell.

**How it is configured:** Repository evidence does not prove user-editable navigation configuration. Workspace layout data exists, but no drag/drop or self-service layout editor is proven.

**How it is used:** Select a navigation button to open the corresponding workspace.

**Expected outcome:** Users can move from overview to domain-specific pages.

### 3. Family member pages

**Purpose:** Family members represent household people for shared context, avatars, task ownership, and motivation display. They are not login accounts, profiles, roles, or permission identities.

**How a user discovers it:** Select a family member chip on Home.

**How it is configured:** Existing family members can be loaded from the backend and displayed. The member page shows name, initials, display color, and avatar configuration. Repository evidence does not prove a user-facing add/delete family member workflow from an empty installation.

**How it is used:** Open a member page to view member details or edit the avatar.

**Expected outcome:** Household members become recognizable in Home, Tasks, and Motivation, but they do not provide authentication or per-user access.

### 4. Avatar editing

**Purpose:** Avatars make family members recognizable and friendlier.

**How a user discovers it:** Open a family member page from Home and choose “Edit avatar.”

**How it is configured:** The editor exposes age group, presentation, hair style, glasses, skin tone, hair color, shirt color, and display color. Changes are sent through the family member update path and are intended to persist.

**How it is used:** Select avatar options, preview the result, and close the editor.

**Expected outcome:** The family member's avatar and display color update across HomeOps surfaces that use family member data.

### 5. Shopping quick capture from Home

**Purpose:** Add a shopping item quickly without opening the Lists page.

**How a user discovers it:** The Home quick capture area includes a Shopping field and Add button.

**How it is configured:** It writes to the Shopping list found through the lists API. Browser-local history and currently active list item names can appear as suggestions.

**How it is used:** Type an item such as “Milk” and select Add.

**Expected outcome:** The item is added to Shopping, Home data refreshes, and the item appears in list summaries.

### 6. Lists / Shopping list

**Purpose:** Track list items, especially the Shopping list.

**How a user discovers it:** Open the Lists navigation item or select the Lists summary on Home.

**How it is configured:** Repository evidence proves persisted generic lists and seeded Shopping/Vacation Packing examples. It proves adding, toggling, and removing list items in the Shopping List widget. It does not prove a user-facing workflow to create, rename, delete, or choose arbitrary lists.

**How it is used:** Add an item, mark an item complete/incomplete with a checkbox, or remove an item.

**Expected outcome:** Active and completed list items are maintained in persistent storage and shown in Home summaries.

### 7. Calendar quick capture from Home

**Purpose:** Add a lightweight all-day calendar event from Home.

**How a user discovers it:** The Home quick capture area includes an Event field, a When selector, and Save.

**How it is configured:** The When selector supports Today, Tomorrow, and Pick date. The quick capture creates an all-day HomeOps Calendar event.

**How it is used:** Type an event title, choose when it happens, and save.

**Expected outcome:** The event is added to the HomeOps Calendar and appears in Agenda/Home summaries.

### 8. Agenda page and HomeOps Calendar events

**Purpose:** Browse and manage household calendar events.

**How a user discovers it:** Open the Agenda navigation item or the Home Agenda summary.

**How it is configured:** Users can choose Week View or Months View and enable/disable event sources independently per view. Source visibility settings are device-specific. Calendar events can be added through an embedded event form.

**How it is used:** Create an event with title, optional description, start, end, and all-day setting. Existing events can be edited or deleted. Users can filter event sources. Week and Months views display generated event occurrences.

**Expected outcome:** Local HomeOps Calendar events are created, updated, deleted, filtered, and displayed in agenda views.

### 9. Calendar recurrence foundation

**Purpose:** The backend data model supports recurrence metadata for EventSeries using None, Daily, Weekly, Monthly, and Yearly, and supports skipped/modified occurrence exceptions.

**How a user discovers it:** Repository evidence does not prove a user-facing recurrence editing workflow. It is mainly a backend/runtime foundation.

**How it is configured:** Not user-configurable from proven UI evidence.

**How it is used:** Users cannot be assumed to use it directly.

**Expected outcome:** Generated agenda occurrences may be produced from recurring EventSeries when such data exists, but recurring event setup/editing is unavailable from proven user-facing evidence.

### 10. Calendar export and full restore

**Purpose:** Back up and restore local HomeOps Calendar data using canonical JSON.

**How a user discovers it:** Open Settings and use the Calendar export / restore widget.

**How it is configured:** No remote destination is configured. Export downloads a JSON file. Restore requires selecting a local JSON export and checking a confirmation box acknowledging full replacement.

**How it is used:** Select Export calendar to download data. For restore, choose a JSON file, review the summary, confirm replacement, and select Restore calendar data.

**Expected outcome:** Export creates a local JSON calendar backup. Restore validates the file and then replaces local calendar event sources and EventSeries data. It is full restore only, not merge.

### 11. Tasks page

**Purpose:** Track ad-hoc household responsibilities separately from lists and calendar events.

**How a user discovers it:** Open Tasks from navigation or the Home Tasks summary.

**How it is configured:** Create a task with title, optional due date, and owner state: Unassigned, Shared household, or Family member. Family member ownership depends on existing family member records.

**How it is used:** Add tasks, review groups, complete tasks, or reopen completed tasks.

**Expected outcome:** Tasks are persisted, grouped by urgency, and visible on Home if overdue/due soon/upcoming. Completing tasks can update Motivation progress.

### 12. Task ownership

**Purpose:** Assign responsibility without creating user accounts.

**How a user discovers it:** The task creation form includes an Owner selector.

**How it is configured:** Choose Unassigned, Shared household, or Family member. If Family member is selected, choose a specific member.

**How it is used:** Owners appear as metadata on task rows and Home task summaries.

**Expected outcome:** The family can see whether a task belongs to the household generally or to a particular member.

### 13. Task completion and reopening

**Purpose:** Track task lifecycle and correct mistakes.

**How a user discovers it:** Each task row has a Complete or Reopen button depending on state.

**How it is configured:** No configuration required.

**How it is used:** Select Complete when finished; select Reopen if the task needs to become active again.

**Expected outcome:** The task state changes. Motivation progress may advance or reverse depending on ownership and eligible goals.

### 14. Home Tasks summary

**Purpose:** Keep due-soon work visible on the main dashboard without turning Home into a full task page.

**How a user discovers it:** Home contains a Tasks summary card.

**How it is configured:** It reads task data and summarizes overdue, due today, and upcoming active tasks.

**How it is used:** Review due-soon tasks and open the full Tasks page for creation/completion.

**Expected outcome:** Important tasks are visible on Home, while task management remains on the Tasks page.

### 15. Motivation page

**Purpose:** Encourage family progress without ranking or punishment.

**How a user discovers it:** Open Motivation from navigation or select the Home Motivation summary.

**How it is configured:** Repository evidence proves a persisted read-only motivation domain with one active family goal and individual goals linked to family members. It does not prove user-facing goal creation or editing.

**How it is used:** Review the active family goal, reward label if present, progress count, and individual member goals.

**Expected outcome:** The family sees progress toward shared and individual encouragement goals.

### 16. Motivation progress from task completion

**Purpose:** Make task completion feed progress automatically.

**How a user discovers it:** The Motivation page and Home tile show progress; task completion changes progress behind the scenes.

**How it is configured:** Goals must already exist. Shared household tasks advance the family goal; tasks assigned to a family member advance that member's individual goals. Reopening reverses eligible progress.

**How it is used:** Complete eligible tasks on the Tasks page.

**Expected outcome:** Motivation progress increases up to the goal target; reopening decreases progress within bounds.

### 17. House Status placeholder

**Purpose:** Reserve a future area for home alerts, sensors, and device state.

**How a user discovers it:** House Status appears in navigation.

**How it is configured:** No user-facing configuration is proven.

**How it is used:** It is a placeholder only.

**Expected outcome:** Users see that the area is planned, but no sensor or device functionality is available.

### 18. Media placeholder

**Purpose:** Reserve a future area for media reminders and household media context.

**How a user discovers it:** Media appears in navigation.

**How it is configured:** No user-facing configuration is proven.

**How it is used:** It is a placeholder only.

**Expected outcome:** Users see that the area is planned, but no media functionality is available.

### 19. Gamification placeholder

**Purpose:** Reserve a future area for points, rewards, and family progress after Tasks mature.

**How a user discovers it:** Gamification appears in navigation.

**How it is configured:** No user-facing configuration is proven.

**How it is used:** It is a placeholder only.

**Expected outcome:** Users see planned gamification, but points, shops, badges, coins, and reward redemption are unavailable.

### 20. Settings

**Purpose:** Provide household/application administration surfaces currently represented by calendar export/restore.

**How a user discovers it:** Settings appears in navigation.

**How it is configured:** Repository evidence proves the Calendar export / restore widget in Settings. Broader household preferences are not proven.

**How it is used:** Use export/restore controls for calendar portability.

**Expected outcome:** Calendar data can be backed up and restored locally.

## Persona simulation summary

### Father

The Father appreciated the architecture, Home summaries, task model, and possibility of progress automation. He struggled with missing first-run setup, lack of self-service goal configuration, no task recurrence, no reminders/notifications, and no real calendar integration. He would **might continue using** HomeOps for tasks and shopping but would not yet trust it as a complete household operations system.

### Mother

The Mother valued Shopping quick capture, simple tasks, and Home as a plain overview. She would avoid setup-heavy areas. Missing onboarding, goal setup, list creation, reminders, and unclear placeholder domains would cause her to narrow use to only the simplest daily features. She would **might continue using** HomeOps, mostly for Shopping and occasional Tasks.

### Child

The Child liked avatars, stars, visible progress, and completing tasks. The Child was not interested in administration, Settings, shopping, or placeholders. Without configurable rewards, a child-centered task view, badges, or clear achievements, the Child would **likely abandon unless parents actively drove use**.

## Household discussion

### Conflicts

- **Father vs. Mother on setup effort:** Father is willing to configure if the payoff is durable. Mother does not want setup to become household labor. Both agree the current first-run setup cannot be proven sufficient.
- **Parents vs. Child on motivation:** Parents like warm, non-competitive encouragement. Child wants concrete rewards, stars, and visible achievements. Current Motivation partially satisfies this but lacks configurable rewards and child-friendly payoff.
- **Father vs. Mother on calendar:** Father sees potential in a local calendar plus export/restore. Mother does not want to maintain a second calendar without reminders or real integration.
- **Navigation expectations:** Father understands placeholders as roadmap areas. Mother and Child see House Status, Media, and Gamification as available pages that do not do anything.

### Different priorities

- **Father:** Automation, recurring routines, integrations, efficient configuration, reliable backups.
- **Mother:** Minimal administration, quick capture, obvious next steps, practical daily value.
- **Child:** Fun, ownership, rewards, stars, progress, simple “what do I do now?” guidance.

### Compromises

- Use Home as the family landing page.
- Use Shopping quick capture immediately.
- Use Tasks only for ad-hoc chores until recurrence exists.
- Treat Agenda as a local supplement, not the authoritative family calendar.
- Treat Motivation as experimental until goals and rewards can be configured.
- Ignore House Status, Media, and Gamification placeholders until they become real.

### Shared conclusions

The family likes the overall concept but needs a guided setup path. The minimum credible product for this household needs user-facing member setup, goal/reward configuration, task recurrence or templates, and reminders/notifications before HomeOps can become the daily household system.

## Best features

1. **Home summary dashboard**
   - **Why valuable:** It brings Agenda, Lists, Tasks, Motivation, date/time, family context, and quick capture into one starting surface.
   - **Personas who liked it:** Father, Mother, Child partially.
   - **Why it drives adoption:** It reduces the need to open multiple pages just to understand the day.

2. **Shopping quick capture**
   - **Why valuable:** It matches a frequent household behavior and requires minimal thought.
   - **Personas who liked it:** Father, Mother.
   - **Why it drives adoption:** Fast capture is useful even if the rest of the product is incomplete.

3. **Tasks with ownership, due dates, completion, and reopening**
   - **Why valuable:** It provides a simple responsibility system without requiring accounts or permissions.
   - **Personas who liked it:** Father, Mother, Child.
   - **Why it drives adoption:** It creates visible household action and can feed Motivation progress.

4. **Avatar editing for family members**
   - **Why valuable:** It makes the system feel household-specific and approachable.
   - **Personas who liked it:** Mother, Child, Father moderately.
   - **Why it drives adoption:** Personal recognition helps children and parents see the board as belonging to their family.

5. **Motivation progress derived from task completion**
   - **Why valuable:** It links chores to encouragement without requiring separate manual progress entry.
   - **Personas who liked it:** Father, Child, Mother conceptually.
   - **Why it drives adoption:** It could turn task completion into shared progress if goals/rewards become configurable.

## Worst features that are still usable

1. **Motivation page with read-only goals**
   - **Why weak:** It displays progress but does not prove users can configure goals or rewards.
   - **Personas who struggled:** Father, Mother, Child.
   - **Likely improvement:** Add guided family and individual goal creation/editing, with reward labels parents can set.

2. **Agenda as a local calendar only**
   - **Why weak:** Event CRUD is usable, but families likely already have calendars elsewhere; no proven real integration, reminders, or notifications.
   - **Personas who struggled:** Father, Mother.
   - **Likely improvement:** Add optional read-only Google Calendar integration or clear import/setup flow, plus reminders when in scope.

3. **Lists page limited to item management**
   - **Why weak:** Adding/toggling/removing items is usable, but full list management is not proven.
   - **Personas who struggled:** Father, Mother.
   - **Likely improvement:** Add create/rename/delete list workflows and a clear default Shopping setup step.

4. **Calendar export/restore**
   - **Why weak:** It is valuable but technical and destructive; it is not a day-to-day family feature.
   - **Personas who struggled:** Mother; Child ignores it.
   - **Likely improvement:** Keep advanced warnings but provide simpler backup language and automated scheduled backup when appropriate.

5. **Placeholder navigation pages**
   - **Why weak:** House Status, Media, and Gamification are reachable but not functionally useful.
   - **Personas who struggled:** Mother, Child.
   - **Likely improvement:** Hide unavailable domains by default or mark them more clearly as future/disabled until implemented.

## Missing functionality attempted by personas

| Persona | Desired outcome | Why they expected it | Impact of absence |
| --- | --- | --- | --- |
| Father, Mother | Create Father, Mother, and Child from an empty installation | Family member navigation and task ownership imply household setup | First-run setup is blocked or depends on seeded data |
| Father, Mother | Add/delete household members | A real household changes over time | Family model cannot be self-managed from proven UI |
| Father, Mother | Rename/edit full member profile details | Member pages show names/initials/details | Incorrect seeded data may be hard to correct |
| Father, Mother, Child | Configure family goals | Motivation page shows active family goals | Motivation may not match household priorities |
| Father, Mother, Child | Configure child/member goals | Individual goal cards imply personal goals | Child cannot pursue personally meaningful progress |
| Father, Mother, Child | Configure rewards | Motivation can show a reward label and Gamification promises rewards later | Motivation lacks payoff and may not sustain child interest |
| Father | Automate recurring chores | Household tasks commonly repeat weekly/daily | Manual task recreation reduces efficiency |
| Mother | Receive reminders/notifications | Calendar/tasks with due dates usually imply reminders | Users may forget to check HomeOps |
| Father, Mother | Connect existing Google Calendar | Agenda/calendar functionality implies calendar integration need | Families must duplicate calendar data |
| Father, Mother | Create/rename/delete lists | Lists workspace implies list management | Shopping works, but broader list use is constrained |
| Child | See “my tasks” only | Child wants simple personal guidance | Child may be overwhelmed by household task list |
| Child | Earn badges/coins/levels | Gamification navigation and Motivation suggest rewards | Progress is less fun and less sticky |
| Father | Configure Home/dashboard widgets | Workspace layout persistence exists conceptually | Technical customization cannot be used by household users |
| Mother | Guided onboarding checklist | Empty installation requires setup | Non-technical parent may abandon before value appears |
| Father, Mother | Calendar recurrence editing in UI | Recurrence exists in backend foundations and families have repeating events | Repeating activities are inefficient to manage |
| Father, Mother | Task recurrence/templates | Household routines repeat | Tasks remain ad-hoc rather than routine management |
| Father, Mother | Authentication/permissions | Family apps often separate adults/children | Everyone is a presentation member, not a secure user |
| Father, Mother | Shopping intelligence/store grouping | Shopping list use invites practical grocery planning | Shopping remains a simple checklist only |
| Father, Mother | Household timezone/preferences UI | Calendar behavior depends on household timezone | Important settings are not self-service |
| Father, Mother | Sensor/device/media integrations | House Status and Media navigation imply future domains | Placeholder areas create expectation without value |

## Adoption assessment

### Father — Might continue using

Father would continue experimenting because Tasks, Home summaries, and quick capture provide value. He would not fully adopt it as household infrastructure until setup, recurrence, integrations, and configurable motivation are available.

### Mother — Might continue using

Mother would use Shopping and occasional Tasks if the system was already set up. She would not own administration. Missing onboarding and goal/reward configuration would prevent broad adoption.

### Child — Would likely abandon unless parents actively drive it

The child likes avatars and progress, but current motivation is not configurable or game-like enough. Without a personal task view and visible rewards, the child depends on parental prompting.

## Key risks

1. **Empty-install setup risk:** The required family cannot be configured from proven UI evidence.
2. **Seed-data dependency risk:** Several features appear to rely on seeded household, family, list, and motivation records.
3. **Motivation credibility risk:** Progress display without goal/reward configuration may disappoint both parents and child.
4. **Manual-routine burden:** No proven task recurrence/templates or calendar recurrence UI means routine household work is repetitive to maintain.
5. **Expectation mismatch from placeholders:** House Status, Media, and Gamification are navigable but not usable.
6. **Calendar duplication risk:** Without proven real calendar integration or reminders, families may not keep HomeOps calendar data current.
7. **Non-technical abandonment risk:** Mother persona would not tolerate unclear setup or technical backup/restore concepts.

## Key opportunities

1. **First-run household setup wizard:** Create household members, avatars, first task, first shopping item, first event, and first goal.
2. **Goal and reward configuration:** Let parents define family goals, child goals, targets, units, and reward labels.
3. **Routine task support:** Add recurring tasks or templates before more advanced gamification.
4. **Child-focused “my tasks and progress” surface:** Give the child a simple view with assigned tasks and visible progress.
5. **Practical calendar integration path:** Add clearly scoped Google Calendar read-only integration or import, plus reminders when allowed.
6. **List management:** Create, rename, delete, and choose lists beyond seeded Shopping.
7. **Placeholder governance:** Hide or disable future domains until they have enough function to evaluate.

## Cross-persona conclusions

- HomeOps' strongest direction is a summary-first household operations board, not a visually polished dashboard or a pure gamification app.
- Tasks and Shopping provide the most immediate utility.
- Motivation has high potential but depends on configurable goals/rewards and child-visible achievements.
- The product cannot be considered self-service for a new family until onboarding and household setup are implemented.
- The family would adopt in a narrow way first: Shopping, Home summaries, and Tasks. Broader adoption depends on setup, recurrence, reminders, integrations, and meaningful rewards.

## Validation checklist

- Every identified feature appears in the user guide: verified while drafting this report.
- Every persona performed initial setup: covered in each persona report under “Initial setup from an empty installation.”
- Every persona attempted realistic household usage: covered in each persona report under “Several weeks of hypothetical use.”
- Best features <= 5: exactly 5.
- Worst features <= 5: exactly 5.
- Missing functionality contains evidence-based observations only: items are limited to attempted outcomes not proven by repository evidence.
- Conclusions reference persona findings: adoption assessment, discussion, risks, and opportunities synthesize the three persona reports.
