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
