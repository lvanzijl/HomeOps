# HomeOps User Research — Father Persona

## Persona

I am a technical father, comfortable configuring systems if the payoff is efficiency. I want one household command center, less repeated discussion, and some automation. I am time constrained, so setup effort must create durable value.

## How I understood HomeOps from the guide

HomeOps appears to be a local household dashboard with top-level pages for Home, Agenda, Lists, Tasks, Motivation, House Status, Media, Gamification, and Settings. It has real capabilities for family members, avatars, shopping/list items, calendar events, task tracking, summaries, motivation progress derived from task completion, and calendar export/restore. Some navigation entries are explicitly placeholders.

## Initial setup from an empty installation

### Profiles / household members

I expected to create exactly Father, Mother, and Child. Repository evidence only proves seeded/persisted family members and avatar editing, not a user-facing add/delete member workflow. I can edit existing member names/details only if seeded members already exist and the page exposes those fields. The family member page displays name and initials, but the visible editor is avatar-focused rather than a full profile management flow.

**Result:** I cannot prove I can create the three required household profiles from zero. I can use existing family member records if they are seeded, and I can configure avatar presentation for them.

### Avatars

I can open each Family Member page from the Home family strip and choose avatar properties such as age group, presentation, hair style, glasses, skin tone, hair color, shirt color, and display color. This is discoverable by selecting a family chip on Home, then using “Edit avatar.”

**Result:** This is understandable and useful for household recognition, especially for the child. It is not a login/profile system.

### Goals

I expected to configure family and individual goals. The Motivation page has an active family goal and individual goals, and progress can be advanced by completing tasks. However, the guide makes clear there is no goal creation/editing UI. Goals are seeded/read-only from the user's point of view.

**Result:** I cannot configure goals myself. This blocks real adoption because the predefined goals may not match our household.

### Tasks

I can create tasks with title, optional due date, and owner state: unassigned, shared household, or a family member. Tasks can be completed and reopened. They are grouped by urgency.

**Result:** This is the strongest operational setup flow. I can create chores and due dates quickly.

### Shopping lists

I can add items to the Shopping list from Home quick capture or from the Lists page. I can toggle completion and remove items. The guide only proves interaction with seeded lists, especially Shopping, not creating arbitrary new lists.

**Result:** Useful for daily household capture, but insufficient for full list administration.

### Calendars

I can add quick all-day events from Home and create/edit/delete events from Agenda with title, description, start, end, and all-day handling. Agenda has Week and Months views and source filtering. Calendar export/restore exists in Settings.

**Result:** Useful for local household calendar capture. It is not integrated with real Google Calendar from the UI, and I cannot configure reminders or notifications.

### Rewards and motivation

Completing shared household tasks advances the family goal, and completing member-assigned tasks advances that member's individual goal. The Motivation page shows progress and reward text if available.

**Result:** Conceptually promising, but because goals/rewards are not configurable, it feels like a demo rather than a household system.

## Several weeks of hypothetical use

### Week 1

I would invest an evening creating tasks: “Take bins out,” “Pack school bag,” “Empty dishwasher,” “Water plants,” and assign some to the child. I would add school events and appointments to Agenda and put grocery items into Shopping. Home would become the daily landing page because it summarizes Agenda, Shopping, Tasks, and Motivation.

Friction appears immediately around household setup. If the seeded family member names do not match us, I cannot prove I can create Father/Mother/Child. If I can only edit avatars, then the family layer is not truly household-owned setup.

### Week 2

Tasks would be valuable if we kept them ad hoc. I would complete child-assigned tasks to advance individual goals and shared tasks to advance family goals. I would like recurrence for chores, but task recurrence is unavailable. I would have to recreate weekly chores manually, which is inefficient.

The calendar would help with one-off events, but I would not trust it as our real family calendar without Google Calendar integration, reminders, and recurring event editing in the UI.

### Week 3

Shopping quick capture would likely stick. It is fast, low administration, and visible on Home. Calendar export/restore is useful for backup but not a daily feature. I would use Settings only occasionally.

Motivation would lose credibility if I cannot change targets/rewards. The child would ask why the goal is what it is, and I would not be able to adjust it in the product.

## Evaluation by topic

### Discoverability

Good: top-level navigation is explicit, Home summaries route to the relevant pages, quick capture is on Home, and family members are visible on Home.

Weak: setup is not discoverable because there is no obvious onboarding, household creation wizard, member creation flow, goal setup flow, or calendar integration setup.

### Onboarding

There is no proven first-run onboarding path. The product assumes seeded data or existing records. For an empty installation, I cannot confirm how I create the initial household structure.

### Information architecture

The separation of Home, Agenda, Lists, Tasks, Motivation, Settings, and future placeholder domains is logical. The distinction between Tasks and Lists is useful: tasks are responsibility/due-date work; lists are item tracking.

The placeholder entries for House Status, Media, and Gamification may create expectations that are not met.

### Feature completeness

Usable daily features: Home summary, quick shopping capture, quick calendar capture, Agenda CRUD, list item management, task creation/completion/reopen, avatar editing, motivation read model, calendar export/restore.

Incomplete for my needs: household member creation, goal configuration, recurring tasks, task templates, reminders, notifications, real calendar integration, shopping list creation, reward economy, child-friendly achievements, and automation.

### Household setup workflow

This is the largest gap. The repository shows household-owned records and seeded defaults, but not a non-technical setup workflow. An empty installation is not sufficiently supported from user-facing evidence.

### Conceptual UX

The concept is strong: a household command center where Home summarizes the day and domain pages handle deeper work. Motivation progress deriving from task completion is a good conceptual bridge.

### Long-term usefulness

I might continue using HomeOps for tasks and shopping if I accepted manual setup. I would likely abandon calendar and motivation for serious household use until configuration, recurrence, and integrations mature.

## Adoption assessment

**Might continue using.** I like the architecture and the task/list/calendar separation. However, the lack of self-service setup and recurring/automation features makes it too manual for a time-constrained technical parent.
