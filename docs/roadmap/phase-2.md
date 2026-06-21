# Phase 2 Roadmap

| Slice | Name | Status |
| --- | --- | --- |
| 2.1 | Durable Lists Foundation | Completed |
| 2.2 | Widget/Layout Persistence | Completed |
| 2.3 | Manual Events Source | Completed |
| 2.4 | Backend-Backed Agenda Layer Settings | Completed |
| 2.5 | Event Editing UX Hardening | Completed |
| 2.6 | EventSeries Contract + Migration | Completed |
| 2.7 | Calendar Terminology, Projection, and Timezone Foundation | Completed |
| 2.8 | Calendar JSON Export and Full Restore Foundation | Completed |
| 2.9 | Calendar Portability Hardening, Restore Safety, and JSON Contract Freeze | Completed |
| 2.10 | Calendar Portability UX and Pre-Restore Export | Completed |
| 2.11 | Calendar Validation, Snapshot Storage, Restore Safety UX, and Documentation Hardening | Completed |
| 2.12 | Calendar Recurrence, EventException, and Occurrence Generation Runtime | Completed |
| 2.13 | Real Google Calendar Read-Only Integration | Recommended next |
| 2.14 | Sensor Dashboard Foundation | Planned |
| 2.15 | Media/TV Source Foundation | Planned |
| 2.16 | Home Hierarchy Tightening | Completed |
| 2.23 | Home Task Summary | Completed |
| 2.30 | Child Workspace Foundation | Completed |
| 2.31 | Child Mode | Completed |
| 2.32 | Child Hero Area | Completed |
| 2.39 | Goal Hygiene | Completed |
| 2.40 | Shopping Lifecycle | Completed |
| 2.41 | No-Date Task Lifecycle | Completed |

Phase 2 theme: Durable Household Core.

## Completed Slice 2.1 — Durable Lists Foundation
Durable Lists Foundation combines the persistence foundation, generic Lists domain, deterministic development seed data, generated NSwag client workflow, and Shopping List widget conversion from in-memory state to API-backed persisted list data.

## Completed Slice 2.2 — Widget/Layout Persistence
Widget/Layout Persistence adds household-owned workspace layout storage, seeded default layouts that match the validated dashboard, minimal get/save layout APIs, generated NSwag client support, and frontend layout loading with default fallback. The widget catalog remains application-owned; persisted layout records only choose catalog widgets and their placement metadata.

## Completed Slice 2.3 — Manual Events Source
Manual Events Source originally added the first writable HomeOps-owned event source with household-owned event persistence, deterministic seed data, minimal event source and event CRUD APIs, normalization into the existing Agenda event model, generated NSwag client support, and embedded Agenda validation UI for retrieval, create, update, and delete.

## Completed Slice 2.4 — Backend-Backed Agenda Layer Settings
Backend-Backed Agenda Layer Settings adds device-scoped persistence for Agenda source visibility, a generated local device key sent through API headers, independent Week and Months settings, minimal get/save APIs, generated NSwag client support, and frontend replacement of browser-only layer settings storage.

## Completed Slice 2.5 — Event Editing UX Hardening
Event Editing UX Hardening improves the embedded Agenda event form with create/edit/delete usability, all-day and timed input handling, frontend validation, backend validation problem responses, loading/error states, and regression coverage while preserving existing Agenda views and sources.

## Completed Slice 2.6 — EventSeries Contract + Migration
EventSeries Contract + Migration replaces occurrence-shaped local calendar persistence with non-recurring EventSeries as the primary HomeOps calendar entity, adds dynamic EventOccurrence projection for Agenda rendering, preserves existing event CRUD behavior and source filtering, and keeps recurrence, EventException, Google Calendar, import/export, ICS, reminders, notifications, authentication, and timezone UI out of scope.

## Completed Slice 2.7 — Calendar Terminology, Projection, and Timezone Foundation
Calendar Terminology, Projection, and Timezone Foundation aligns API contracts and UI wording around EventSeries/HomeOps Calendar terminology, hardens EventOccurrence as projection-only output, persists household timezone on Household with initial `Europe/Amsterdam` fallback behavior, and realigns roadmap documentation around HomeOps Calendar as source of truth, Google Calendar as optional integration, and JSON export as the future canonical portability format.

## Completed Slice 2.8 — Calendar JSON Export and Full Restore Foundation
Calendar JSON Export and Full Restore Foundation adds a versioned canonical `homeops.calendar.export` JSON backend contract, exports household timezone metadata, event source metadata, and EventSeries source-of-truth records, keeps EventOccurrence out of canonical export data, and adds full restore-only backend behavior that validates before replacing calendar sources and EventSeries. Google Drive remains a future export destination only. ICS, recurrence runtime behavior, EventException runtime behavior, selective import, merge import, and conflict resolution remain out of scope.

## Completed Slice 2.9 — Calendar Portability Hardening, Restore Safety, and JSON Contract Freeze
Calendar Portability Hardening freezes the V1 canonical JSON contract, reserves recurrence, exception, and future metadata sections, strengthens schema/version/identifier/ownership/timezone/timing validation, and keeps restore local-only and full-restore-only. Restore validation occurs before destructive actions, rejected exports leave calendar data unchanged, and automatic local pre-restore export snapshots now run before calendar full restore replacement.

## Completed Slice 2.12 — Calendar Recurrence, EventException, and Occurrence Generation Runtime
Calendar Recurrence adds V1 recurrence metadata to EventSeries, supports None/Daily/Weekly/Monthly/Yearly only, persists EventException records for skipped and modified occurrences, and expands Agenda-facing EventOccurrence output at runtime with household timezone local wall-clock semantics. EventOccurrence remains projection-only and is not persisted. Advanced recurrence rules, ICS, recurrence UI, occurrence edit UI, per-event timezones, notifications, reminders, and authentication remain out of scope.


## Completed Slice 2.41 — No-Date Task Lifecycle
No-Date Task Lifecycle adds a trust-preserving review state for undated tasks: Active, Needs Review, Someday, Completed, and Archived. Older no-date tasks participate in the Weekly Household Reset with parent-facing language, “Still part of the plan?”, and actions to keep active, add a due date, move to Someday, complete, or archive. Someday is an explicit recoverable destination for long-term ideas that should not create daily pressure. Home and Child Workspace remain focused by keeping Someday, archived, and review-only stale-task pressure out of child-facing surfaces. No notifications, project management, reward economy, categories, analytics, or dashboard redesign were introduced.

## Recommended Next Slice
Proceed with Real Google Calendar Read-Only Integration only after preserving HomeOps Calendar as source of truth and local-only portability boundaries. Keep any Google Calendar work optional and integration-scoped; do not add two-way sync, authentication beyond an explicitly scoped integration requirement, sensors, media, notifications, recurring event editing, or offline-first synchronization.


## Calendar Portability UX and Pre-Restore Export Update
Automatic local pre-restore export snapshots now run before calendar full restore replacement. The snapshot directory is configurable through `CalendarPortability:PreRestoreSnapshotDirectory` and defaults safely to local API storage when unset; Docker/container deployments should mount the configured path to writable persistent storage when snapshots must survive container replacement. The Settings workspace exposes simple local export/restore controls with version, timestamp, validation feedback, friendly errors, an explicit destructive replacement warning, and a required confirmation checkbox. JSON remains the canonical export format; restore remains local-only and full restore only.

## Completed Slice 2.13 — Home Dashboard MVP, Family Member MVP, and Home Navigation Flows
Home Dashboard MVP establishes Home as the primary glassboard-style dashboard with date/time, Family Member strip, quick capture entry points, Agenda summary, and Lists summary. Family Members are minimal household presentation entities only, not users or authentication identities. Home summary content, overflow affordances, and quick capture actions route to dedicated Agenda and Lists pages so Home remains summary-first and existing domain functionality stays on the domain pages.

## Completed Slice 2.16 — Home Hierarchy Tightening
Home Hierarchy Tightening reduces Home app chrome and marketing-style copy, keeps the top area focused on date/time plus a lightweight weather placeholder, tightens portrait spacing, groups Home Agenda rows under Today/Tomorrow/Later / Next, replaces abstract Lists card naming with concrete Shopping/Boodschappen-oriented list naming when available, and compacts the Family Member strip. Family Members remain placeholder presentation entities only; avatar redesign, avatar modeling/editor/badges, Family Member persistence, ownership, tasks, gamification, notifications, authentication, and profile behavior remain out of scope.


## Completed Slice 2.17 — Family Member Avatar MVP
Family Member Avatar MVP replaces Home initials-only chips with friendly frontend-only configurable avatars and a compact Home editor with live preview. The local model covers id, name, display color, initials, age group, presentation, skin tone, hair color, hair style, glasses, and shirt color. Family Members remain non-authentication household presentation entities only; no users, profiles, permissions, ownership, tasks, gamification, points, badges, notifications, or persistence were introduced. Future badge placeholders for task count, points, warning/attention, and today involvement remain deferred.

## Completed Slice 2.18 — Family Member Page and Avatar Editor Relocation
Family Member Page adds a dedicated page per Family Member reached from the Home Family Member strip. The page displays avatar, name, display color, current avatar configuration, and clearly marked future placeholders for Tasks and Points without implementing those domains. Avatar editing moved from Home to the Family Member page while preserving the existing live preview and frontend-only avatar controls. Home remains a dashboard-only, summary-first surface with a purely navigational/contextual Family Member strip. No authentication, profiles, permissions, ownership, tasks, gamification, points, badges, notifications, reminders, House Status, Media, Google Calendar, or persistence were introduced.

## Completed Slice 2.19 — Task Page Foundation
Task Page Foundation establishes Tasks as a real household domain separate from Lists, Calendar, and Gamification. Tasks support a required title, optional due date, ownership state (`Unassigned`, assigned to one Family Member, or `SharedHousehold`), and a two-state lifecycle of available/completed with reopen support. The dedicated Tasks page is urgency-first with Overdue, Due Today, Upcoming, No Due Date, and compact Completed Recently groups; owner remains metadata rather than the primary organizing axis. Family Member task ownership references household presentation entities only and does not introduce users, authentication, permissions, roles, profiles, approval, recurrence, points, notifications, reminders, Google Calendar, House Status, or Media behavior.

## Completed Slice 2.20 — Domain Color System and Future Domain Placeholders
Domain Color System adds centralized pastel frontend color tokens for Home, Agenda, Lists, Tasks, House Status, Media, Gamification, and Settings. Navigation buttons, active navigation state, and subtle page backgrounds now share the same domain color family while cards remain white or near-white for readability. Tasks adopts the shared Tasks color family to feel less clinical without changing urgency-first grouping or adding recurrence, approval, points, categories, or Home task summaries. House Status, Media, and Gamification have navigation entries and coming-later placeholder pages only; no sensors, device state, media integration, points, rewards, badges, authentication, permissions, Google Calendar, or domain logic were introduced.

## Completed Slice 2.21 — Home Quick Capture
Home Quick Capture makes Home behave more like the household glassboard by adding direct Shopping and Calendar capture while preserving Home as a dashboard. Shopping capture uses one text field plus Add and sends items to the seeded Shopping list without list selection. Calendar capture uses What and When with Today, Tomorrow, and Pick date support; detailed editing remains on Agenda. Shopping history suggestions now have a local non-AI foundation based on captured and active list item names. Future preferred-store learning remains deferred; store selection, grouping, icons, shopping intelligence, tasks quick capture, recurrence, approval, points, gamification, Google Calendar, notifications, reminders, House Status, and Media remain out of scope.
## Completed Slice 2.22 — Family Member Persistence
Family Member Persistence promotes Family Members from temporary frontend-only presentation data to durable household-owned records. The backend stores member identity fields and avatar configuration, exposes minimal retrieval/update APIs, and seeds the existing household members. Home, the Family Member page, and Tasks now load Family Members from persistence with existing frontend fallback behavior preserved. Task ownership validates assigned Family Member references against persisted household members while keeping Unassigned and Shared Household ownership supported. Family Members remain non-user, non-profile, non-authentication, non-permission household entities; points, badges, gamification, approval, recurrence, authentication, roles, permissions, notifications, reminders, Google Calendar, House Status, and Media remain out of scope.

## Completed Slice 2.23 — Home Task Summary
Home Task Summary completes the dashboard's three core household pillars by adding a compact Tasks summary beside Agenda and Shopping/Lists. Home shows only overdue, due today, and upcoming active tasks with title, ownership/shared household indicator, and due information, and all card/header/overflow interactions navigate to the dedicated Tasks page. Home remains summary-only and does not add task creation, editing, completion, recurrence, approval, points, categories, notifications, reminders, or configuration behavior.

## Completed Slice 2.24 — Motivation Page Foundation
Motivation Page Foundation adds a dedicated family encouragement surface separate from Tasks, Gamification, and Reward Economy. The page leads with one active seeded family goal, plain progress, encouraging copy, and an optional shared reward label, then shows equal-weight individual Family Member goal cards using avatars, names, stars, checkmarks, and progress language. Home now includes a compact Motivation tile with only the active family goal title and progress that routes to Motivation. Gems, tokens, coins, shop, spend/redeem flows, avatar unlocks, Helpful Moments, leaderboards, negative points, task approval, task recurrence, authentication, permissions, and roles remain out of scope and deferred.

## Completed Slice 2.25 — Motivation Domain Foundation
Motivation Domain Foundation promotes the Motivation surface from frontend-only seeded data to a persisted read-only household read model. The backend stores an active family goal and individual goals linked to persisted Family Members, exposes a read-only snapshot API, and generates NSwag client support. The Motivation page and Home Motivation tile now load API-backed data and handle loading, empty, and error states without adding editing or reward mechanics. Goal editing, Helpful Moments, gems, tokens, coins, reward shop, spend/redeem flows, avatar unlocks, leaderboards, negative points, task recurrence, task approval, authentication, permissions, and roles remain deferred.

### Motivation Progress Foundation — Completed 2026-06-20
- Motivation now consumes completed Tasks as a downstream read model.
- Family goal progress counts completed Shared Household tasks only.
- Individual goal progress counts completed tasks assigned to the matching Family Member only.
- Reopening eligible tasks reverses previously applied progress, with progress bounded by target count.
- Motivation page and Home Motivation tile continue reading from the Motivation API; no editing screens were added.
- Helpful Moments, Reward Economy, Gems, Tokens, Shop, avatar unlocks, badges, leaderboards, negative points, task recurrence, task approval, authentication, permissions, and roles remain deferred.

## Completed Slice 2.26 — Family Member Management Foundation
Family Member Management Foundation makes persisted household Family Members manageable without developer involvement. The backend adds explicit Adult/Child member kind, nullable date of birth with child-required validation, create/update APIs, and soft delete. Home adds a lightweight add-member flow, while the Family Member page becomes the management location for name, member type, date of birth, display color, avatar editing, and confirmed removal. Deleted members disappear from normal Family Member lists and new Task assignment while existing Task and Motivation references remain preserved. First Run Wizard, Empty State UX, Goals, Rewards, Motivation editing, Gamification, permissions, authentication, roles, notifications, and Google Calendar remain out of scope.

## Completed Slice 2.27 — First Run Wizard
First Run Wizard completes the second P0 onboarding slice by adding household first-run detection, a guided initial household setup flow, household review, and persisted onboarding completion. The wizard appears when the seeded household has no active Family Members or has not completed onboarding, then guides users through Welcome, Add Adults, Add Children, Review Household, and Finish. Adults and children use the existing Family Member creation capability, children require date of birth, and all household members remain editable later through existing Family Member Management. Successful completion stores the household onboarding flag and opens Home so configured households do not repeatedly see onboarding. Empty State UX, Goals, Rewards, Motivation editing, Gamification, permissions, authentication, roles, notifications, and Google Calendar remain out of scope.

### Completed Slice 2.28 — Empty State UX Foundation
- Added guided empty states across Home, Tasks, Lists, Motivation, and Agenda.
- Empty pages now explain the value of the domain and expose a clear first action.
- This closes the P0 onboarding completion gap identified by user research after First Run Wizard.
- Kept empty states lightweight and out of tutorial, rewards, Google Calendar, notification, and gamification scope.


## Completed Slice 2.29 — Family Goal Creation and Editing
Family Goal Creation and Editing removes the final functional P0 blocker for Motivation by letting a newly onboarded household create its first active family goal without developer assistance. The Motivation empty state now explains family goals and opens a minimal create form for title, target count, progress wording, and an optional family celebration label. The active family goal can be edited in place, preserving progress and capping progress when the target is lowered. Home continues to surface the active family goal through the existing Motivation tile after navigation back to Home. Individual goal creation, Helpful Moments, Gems, Reward Economy, Shop, badges, leaderboards, negative points, templates, recurrence, notifications, Google Calendar, authentication, permissions, and roles remain out of scope.

### Child Progress View — Completed
- Family Member child pages now surface avatar, name, age-aware context, active family goal participation, and individual Motivation goals in a warm progress presentation.
- The slice remains encouragement-only: no Reward Economy, gems, shops, badges, leaderboards, negative points, notifications, recurrence, or goal templates were introduced.
- Existing Family Member persistence, avatar editing, Motivation, Tasks, Home, and navigation flows remain preserved.

### Helpful Moments Foundation — Completed 2026-06-20
- Added persisted, household-owned Helpful Moments for parent-entered recognition of kindness, initiative, teamwork, responsibility, and routines.
- Added lightweight creation and recent-feed display on Motivation, plus member-specific recognition on Family Member pages.
- Kept Helpful Moments separate from Tasks and Reward Economy: no points, gems, tokens, shop, leaderboard, negative points, or automatic goal progress linkage were added.

### Family Goal Celebration Foundation — Completed 2026-06-20
- Replaced the loose family-goal reward label with a structured Family Celebration attached to family goals.
- Added `Planned`, `ReadyToCelebrate`, and `Celebrated` celebration states with lightweight parent confirmation after goal completion.
- Motivation now communicates what the family is working toward and what happens when the goal succeeds while keeping progress and encouragement primary.
- Home Motivation tile includes compact celebration context only when it helps summarize the active family goal.
- Reward Economy remains deferred: no gems, tokens, coins, shops, purchases, avatar unlocks, badges, leaderboards, notifications, individual rewards, or goal templates were added.


### Individual Goal Management — Completed 2026-06-20
- Added parent-managed individual Motivation goals for persisted Family Members.
- Supports creating goals with Family Member, title, target count, and unit label.
- Supports editing title, target count, unit label, and assigned Family Member while preserving/capping progress.
- Supports archiving goals so retired goals disappear from active Motivation and Child Progress views while history remains persisted.
- Child Progress and Motivation displays now reflect active individual goal changes automatically through the Motivation snapshot.
- Kept Reward Economy, gems, tokens, shops, purchases, avatar unlocks, badges, leaderboards, negative points, notifications, recurrence, and templates out of scope.

### Recurring Tasks Foundation — Completed 2026-06-20
- Added the first major P2 recurring task slice so parents can configure common chores once instead of recreating them repeatedly.
- Supports Daily, Weekly, and Monthly recurrence with a human-readable model only.
- Recurring task generation creates future task occurrences while keeping the recurring series definition separate from individual completion.
- Recurring task editing covers title, owner, due/start date, and recurrence frequency for the whole simple series.
- Recurring task deletion is explicit series deletion; occurrence-only deletion, exceptions, series splitting, task templates, advanced scheduling, notifications, and calendar reminders remain deferred.
- Motivation compatibility is preserved: recurring task occurrences still advance family goals and individual goals through existing task completion behavior.

### Task Templates Foundation — Completed 2026-06-20
- Added persisted Task Templates so parents can reuse common household task collections without recreating each task manually.
- Template CRUD supports create, edit, and soft archive; archived templates disappear from the normal Tasks page selection.
- Applying a template is repeatable and creates fresh tasks each time.
- Template items with no recurrence create normal Household Tasks; template items with Daily, Weekly, or Monthly recurrence create Recurring Task Series and generated task occurrences using the existing recurring task model.
- Seeded starter templates are Morning Routine, Bedtime Routine, Homework Routine, Pet Care, and Kitchen Reset, and remain household-editable/archiveable after seeding.
- This slice intentionally does not add Goal Templates, Reward Economy, gems, shop, notifications, sharing, marketplace, import/export, or AI-generated templates.


### Shopping Intelligence Foundation — Completed 2026-06-20
Shopping Intelligence Foundation reduces shopping-list administration without adding capture friction. Shopping items now have optional preferred-store metadata, deterministic household item-name preferences, inherited stores for future matching additions, per-item store overrides, grouped Shopping presentation, and store context in suggestions/summaries. Home quick capture and Shopping capture remain item-name only. Store selection is not required, uncategorized items remain visible, and AI classification, OCR, barcode scanning, notifications, shopping automation, and Reward Economy remain out of scope.

### Completed Slice 2.30 — Child Workspace Foundation
Child Workspace Foundation evolves child Family Member pages from management-first screens into encouragement-first child workspaces. The workspace leads with avatar identity, age-aware context, active family goal progress, family celebration visibility, active individual goals, and recent Helpful Moments before secondary administration controls. Ages 3-5 receive simpler visual star/checkmark presentation with less text, while ages 6-12 receive richer progress and celebration detail in the same shared experience. Existing Family Member persistence, avatar editing, Motivation, Family Goals, Individual Goals, Helpful Moments, Tasks, and Home behavior remain preserved. Reward Economy, gems, shops, balances, purchases, avatar unlocks, badges, leaderboards, notifications, Google Calendar, and household settings remain out of scope.

### Completed Slice 2.31 — Child Mode
Child Mode transforms child Family Member pages from a management-adjacent record into “My Place In The Family.” The page now lands on child-first content that answers “How am I doing?” through avatar identity, family goal progress, personal goals, Helpful Moments, and family celebration context before any administrative controls. Parent Mode remains accessible as a secondary administration area for editing member details, date of birth, member type, display color, avatar configuration, and removal. Existing Family Member persistence, avatar editing, Child Workspace, Motivation, Goals, Helpful Moments, and Celebrations remain preserved. Reward Economy, gems, shops, purchases, notifications, Google Calendar, household settings, and dashboard customization remain out of scope.


### Completed Slice 2.32 — Child Hero Area
Child Hero Area makes Child Mode hero-first by adding a dominant top section that combines the child avatar and name, current primary individual goal when available, visual progress, active family goal context, and family celebration status. The hierarchy is identity → current goal → progress → family goal → celebration, so the first screen answers “Who am I?”, “How am I doing?”, “What am I working on?”, and “How am I helping my family?” before secondary cards or Parent Mode. Family contribution copy emphasizes belonging and shared progress without rankings, comparisons, leaderboards, Reward Economy, gems, shops, purchases, notifications, Google Calendar, dashboard customization, or household settings. Existing Child Workspace, Child Mode, Motivation, Family Goals, Individual Goals, Helpful Moments, Family Celebrations, and avatar editing remain preserved.

### Completed Slice 2.33 — Child Journey
Child Journey completes the final major Child Experience flow before Celebration and Motivation refinement. Child Mode now answers the three core child questions in order: Today answers “What should I do?” with child-owned active tasks and a compact friendly count; This Week answers “What am I working on?” with active individual goals and progress; Family Goal answers “How am I helping?” with shared family progress, contribution context, and celebration visibility. The reading order is Hero, Today, This Week, Family Goal, Helpful Moments, then Parent Mode access, keeping administration secondary while preserving existing Child Mode, Child Hero Area, Motivation, Family Goals, Individual Goals, Helpful Moments, Family Celebrations, Tasks, and avatar editing. Reward Economy, gems, shops, purchases, notifications, Google Calendar, dashboard customization, household settings, rankings, comparisons, and leaderboards remain out of scope.

### Completed Slice 2.34 — Helpful Moments Upgrade
Helpful Moments Upgrade reframes the existing parent-entered recognition surface as “Things My Family Appreciates.” Motivation and Child Mode now use warmer child-facing appreciation language, including “My Family Appreciates,” “Thank you for,” and “We noticed,” and the cards are styled as memorable appreciation notes instead of a feed, log, or audit trail. The existing Helpful Moments persistence and creation flow remain unchanged, and recognition stays separate from Reward Economy and progress mechanics. Existing Child Workspace, Child Journey, Motivation, Family Goals, Individual Goals, Family Celebrations, Tasks, and avatar editing remain preserved. Reward Economy, gems, shops, purchases, notifications, automatic rewards, automatic progress, goal editing, rankings, comparisons, and leaderboards remain out of scope.

### Completed Slice 2.35 — Celebration Surface
Celebration Surface promotes existing Family Celebrations from compact goal-card context into visible emotional product surfaces. Motivation now tells the family story as Goal → Progress → Celebration, keeping celebrations attached to family progress and recognition rather than administration. Child Mode highlights the celebration in the hero and Family Goal journey areas so children can see what is upcoming, ready, or already celebrated. Home adds a compact summary-first celebration surface, with ReadyToCelebrate styled as hard to miss without turning Home into a rewards page. Reward Economy, gems, shops, purchases, individual rewards, notifications, celebration history, celebration memory, goal templates, and dashboard customization remain out of scope.

### Celebration Memory — Completed 2026-06-21
- Celebrated Family Celebrations now remain visible as recent Celebration Memories with title, optional description, and celebrated date.
- Motivation presents memories as warm family history and extends the story from Goal → Progress → Celebration to Goal → Progress → Celebration → Memory.
- Child Mode shows recent celebration memories so children can see what the family already achieved and celebrated together.
- This stays presentation-focused and avoids Reward Economy, gems, shops, purchases, individual rewards, notifications, comments, reactions, social feeds, rankings, and dashboard customization.

### Completed Slice 2.37 — Celebration Anticipation Moment
Celebration Anticipation Moment upgrades existing Family Celebration presentation from “something is planned” to “this is the fun thing we are getting closer to.” Planned celebration copy now names the celebration and connects remaining family progress to anticipation across Motivation, Home, and Child Mode. Child Mode shows how today’s help moves the family closer in both the hero and Family Goal journey areas, while Motivation keeps the lightweight Goal → Progress → Celebration story and upgrades ReadyToCelebrate into a “We did it” family arrival moment. Existing Family Goals, Motivation, Child Workspace, Child Journey, Helpful Moments, Celebration Surface, and Celebration Memory remain preserved. Reward Economy, gems, shop, purchases, notifications, celebration planning workflows, photos, comments, reactions, social feeds, voting systems, and new persistence models remain out of scope.

### Completed Slice 2.38 — Family Contribution Story Foundation
Family Contribution Story Foundation reframes the child-facing Motivation journey from Goal → Progress → Celebration → Memory to Contribution → Progress → Celebration → Memory. Helpful Moments now bridge everyday appreciation to the shared family journey as evidence of how the family got closer, without automatically increasing progress or becoming points, rewards, rankings, leaderboards, badges, gems, balances, or streaks. Child Mode strengthens non-competitive ownership with “my help mattered” language, celebrations feel family-created instead of system-created, and memories now explain why the celebration happened using existing goal, progress, celebration, and Helpful Moment information. Existing Family Goals, Progress, Helpful Moments, Family Celebrations, Celebration Memory, Child Workspace, and Child Journey remain preserved.


### HomeOps Long-Term Usage Review — Completed 2026-06-21
- Added retention-focused long-term usage review reports under `docs/reports/2026-06-21-work/`.
- Evaluated 30-day and 90-day household usage across expert, father, mother, six-year-old child, and ten-year-old child perspectives.
- Identified recurring tasks, shopping intelligence, child contribution visibility, and family goal rituals as the strongest long-term retention anchors.
- Identified maintenance burden, stale tasks, generic recognition, stale goals, template dormancy, and unritualized memories as the primary retention risks.
- Final verdict: the family would probably still use HomeOps after 90 days, especially if a weekly household reset and recap consolidates ongoing maintenance into a sustainable ritual.

## 2026-06-21 Update — Recurring Task Hygiene
- Implemented recurring task hygiene as a Phase 2 maintenance-reduction slice.
- Older incomplete occurrences from the same recurring series expire when a current or upcoming occurrence exists, keeping task lists focused on what should be done now.
- Completed occurrences remain preserved, avoiding data loss and preserving Motivation compatibility.


### Completed Slice 2.39 — Goal Hygiene
Goal Hygiene reduces Motivation maintenance burden by making focus the default. Family Goal creation and editing now preserve the invariant that only one Family Goal can be active for the household, retiring previous active family goals through the existing inactive lifecycle model. Individual Goal creation and editing now preserve the invariant that each Family Member has at most one active Individual Goal, retiring only that member's previous active goal and leaving other Family Members unchanged. Database-level partial unique indexes protect those invariants outside normal API flows, and migration cleanup deactivates duplicate active records before the constraints are added. Existing Family Goals, Individual Goals, Motivation progress, Family Celebrations, Child Workspace, Family Contribution Story, and progress history remain preserved. Reward Economy, notifications, shopping changes, analytics, goal templates, new goal types, and dashboard changes remain out of scope.


### Completed Slice 2.40 — Shopping Lifecycle
Shopping Lifecycle reduces shopping-list maintenance burden and list clutter while preserving frictionless capture and Shopping Intelligence. Lists now support rename plus archive and soft-delete lifecycle states so old lists leave normal views without unnecessary hard deletion. Completed items move below active items, remain visible for 24 hours, and can be undone before they are omitted from the active list view. Deleted items are soft-deleted, shown with deleted state and strikethrough styling for 24 hours, and can be restored through undo before cleanup hides them from normal views. Home quick capture remains item-name only, preferred-store learning remains unchanged, and Shopping Intelligence V2, Reward Economy, notifications, analytics, OCR, barcode scanning, and AI classification remain out of scope.


## No-Date Task Lifecycle
- Completed review state, Someday lane, Weekly Household Reset participation, and trust-preserving Home/Child visibility rules.
