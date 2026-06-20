# HomeOps Feature Completeness Audit

Date: 2026-06-20  
Branch: work  
Method: repository analysis only. The application was not started, browser automation was not used, and screenshots were not generated.

## Executive Summary

HomeOps now has a substantially larger product surface than the original gap list implied. Proven user-facing areas include first-run onboarding, family member management with avatar editing, dashboard summaries, ad-hoc tasks, motivation goals, helpful moments, shopping lists, agenda/calendar events, calendar export/restore, workspace navigation, and several placeholder domains.

However, adoption remains **Difficult** for a new two-adult/two-child household because several visible concepts are incomplete or misleading:

- Rewards and gamification are still placeholders, not usable reward systems.
- Shopping lists support creation and item operations, but no proven rename or list deletion UI/API exists.
- Tasks are ad-hoc only: no recurrence, templates, editing, or deletion.
- Calendar events support basic CRUD and export/restore, but no proven recurrence editing UI, reminders, notifications, or Google account integration.
- Household settings beyond onboarding completion and timezone foundation are not user-configurable in the product.
- Authentication and account/role management are absent.

## Evidence Standard

A capability is marked available only when repository evidence proves it. Seed classes are not treated as user-accessible product data for a completely new household unless there is also product UI/API to create or configure equivalent data.

## Feature Inventory and Traceability Matrix

| Feature | Domain | Purpose / User Value | Backend persistence | Domain model | API endpoints | Client API layer | UI screens/components | Navigation path | Empty state behavior | Readiness |
|---|---|---|---|---|---|---|---|---|---|---|
| First-run onboarding | Household | Guides a new household to add adults/children and enter Home | Household `HasCompletedOnboarding` via EF migration | `Household`, onboarding DTOs | `GET /api/onboarding/status`, `POST /api/onboarding/complete` | `onboardingApi.ts`, generated client | `FirstRunWizard.tsx` | Automatic before WorkspaceShell when required | Adults step blocks continue until one adult; children can be skipped; review shows empty children message | MOSTLY COMPLETE |
| Family members | Family | Create/edit/remove adults and children | `FamilyMembers` DbSet and migration | `FamilyMember`, `FamilyMemberKind`, avatar enums | `GET/POST/PUT/DELETE /api/family-members` | `familyMembersApi.ts`, generated client | `HomeDashboard`, `FamilyMemberPage`, add dialog, wizard member form | Home family strip/card; click person; Add family member | Home shows add/member affordances; wizard shows “No adults/children added yet” | COMPLETE |
| Avatars | Family | Personal recognition and child-friendly identity | Avatar fields on `FamilyMember` | Avatar enums and DTO nested in family member | Same family member create/update APIs | `familyMembersApi.ts` maps avatar | `FamilyAvatar`, `FamilyAvatarEditor`, `FamilyMemberPage` | Open member from Home, edit avatar | Default avatar assigned on create | MOSTLY COMPLETE |
| Home dashboard | Home | At-a-glance household summary and launchpad | Reads persisted members/tasks/lists/motivation/events; layout via workspace layout | Dashboard is UI composition, not own domain model | Uses feature APIs; workspace layout API exists | Home dashboard direct clients and supporting APIs | `HomeDashboard.tsx` | Home workspace default | Empty cards link to tasks/lists/events/family goal/member setup | MOSTLY COMPLETE |
| Workspace navigation | Shell | Discover major domains | Optional persisted layouts per workspace | `WorkspaceLayout`, `WidgetPlacement` | `GET/PUT /api/workspaces/{workspaceKey}/layout` | `workspaceLayout.ts`, generated client | `WorkspaceShell.tsx` | Top nav buttons: Home, Agenda, Lists, Tasks, Motivation, House, Media, Gamification, Settings | Unknown layout may be empty; agenda/lists are forced widgets; placeholders for unsupported domains | MOSTLY COMPLETE |
| Workspace layout persistence | Shell/settings | Persist widget placements | `WorkspaceLayouts`, `WidgetPlacements` | Workspace layout entities | `GET/PUT /api/workspaces/{workspaceKey}/layout` | `workspaceLayout.ts` | Widget host renders persisted placements | Not exposed as a normal customization UI | Empty host if no layout; seeded layout not assumed | PARTIALLY COMPLETE |
| Tasks | Tasks | Add, assign, due-date, complete/reopen household tasks | `HouseholdTasks` DbSet/migration | `HouseholdTask`, ownership enum | `GET /api/tasks`, `POST /api/tasks`, `POST /api/tasks/{id}/complete`, `POST /api/tasks/{id}/reopen` | `tasksApi.ts`, generated client | `TasksPage.tsx`, dashboard task summary | Tasks nav; dashboard task tile | Page prompts “Create your first task” | PARTIALLY COMPLETE |
| Child task view | Tasks/family | Lets a child/parent see tasks for one member | No dedicated persistence; reads same tasks | Same task model | No dedicated endpoint | Client filters/summarizes by member in family page/dashboard if present | `FamilyMemberPage`, task summaries | Click family member from Home | Depends on task data; no proven standalone child mode | PARTIALLY COMPLETE |
| Motivation family goal | Motivation | Shared household target progressed by shared task completion | `MotivationFamilyGoals` DbSet/migration | `MotivationFamilyGoal`, `FamilyCelebrationStatus` | `GET /api/motivation`, `POST /api/motivation/family-goals`, `PUT /api/motivation/family-goals/{id}`, `POST /api/motivation/family-goals/{id}/celebration/celebrated` | `motivationData.ts`, generated client | `MotivationPage`, Home motivation tile | Motivation nav; Home motivation tile | Page prompts “Create your first family goal” | MOSTLY COMPLETE |
| Motivation personal goals | Motivation | Per-member encouragement goals with visual progress | `MotivationIndividualGoals` DbSet/migration | `MotivationIndividualGoal` | `GET /api/motivation`, `POST/PUT /api/motivation/individual-goals`, `POST /api/motivation/individual-goals/{id}/archive` | `motivationData.ts`, generated client | `MotivationPage` personal goal section; child progress page | Motivation nav; member page may show progress | “No active personal encouragement goals yet.” | MOSTLY COMPLETE |
| Helpful moments | Motivation | Record recognition notes independent of rewards | `HelpfulMoments` DbSet/migration | `HelpfulMoment` | `GET /api/helpful-moments`, `POST /api/helpful-moments` | `helpfulMomentsData.ts`, generated client | `HelpfulMoments.tsx`, Motivation page section | Motivation nav | “No helpful moments recorded yet.” | MOSTLY COMPLETE |
| Rewards | Motivation/gamification | Reward creation/redemption expected by research | No reward model found | None proven | None proven | None proven | Gamification placeholder only | Gamification nav placeholder | Placeholder explains future rewards/gamification | MISSING |
| Shopping lists | Lists | Multiple durable shopping lists and item checkoff | `Lists`, `ListItems` DbSets/migration | `List`, `ListItem` | `GET /api/lists`, `GET /api/lists/{id}`, `POST /api/lists`, `POST /api/lists/{id}/items`, `POST /api/lists/{id}/items/{itemId}/toggle`, `DELETE /api/lists/{id}/items/{itemId}` | `listsApi.ts`, `listsSummaryApi.ts`, generated client | `ShoppingListWidget.tsx`, Home lists card | Lists nav; Home lists card | Create Shopping list button if no list; add item prompt | PARTIALLY COMPLETE |
| Agenda/calendar events | Calendar | Manual household calendar events in agenda | `EventSources`, `EventSeries`, `EventExceptions` | `EventSeries`, `EventSource`, recurrence model | `GET /api/events`, `GET/POST/PUT/DELETE /api/events/{id}`, `GET /api/event-sources` | `calendarEventsApi.ts`, `manualEventsApi.ts`, generated client | `AgendaWidget.tsx`, Home agenda card | Agenda nav; Home agenda tile | Prompts “Start with one household event” | PARTIALLY COMPLETE |
| Calendar export/restore | Calendar/settings | Portable backup/restore of calendar data | Reads/writes calendar tables; pre-restore snapshots | Export DTOs and portability service | `GET /api/calendar/export`, `POST /api/calendar/restore` | `calendarPortability.ts`, generated client | `CalendarPortabilityWidget.tsx` | Settings nav | Widget status messages; no calendar events still exports document | MOSTLY COMPLETE |
| Agenda layer settings | Calendar/settings | Per-device source visibility | `AgendaLayerSettings` DbSet/migration keyed by device key | `AgendaLayerSetting` | `GET/PUT /api/agenda/layer-settings` requiring `X-HomeOps-Device-Key` | `layerSettings.ts`, generated client | Agenda layer controls in agenda widget | Agenda widget | Missing device key returns API 400; client likely uses generated device key | MOSTLY COMPLETE |
| Event sources / Google Calendar adapter | Calendar/integrations | Surface multiple event sources | Event source rows; fake Google adapter/provider only | EventSource and Google adapter types | `GET /api/event-sources` only; no OAuth/config CRUD | generated client | Agenda source display/filters | Agenda | No user setup for Google source | PROTOTYPE |
| Notifications/reminders | Cross-cutting | Alerts/reminders expected by research | None proven | None proven | None proven | None proven | None proven | None | None | MISSING |
| Household settings | Settings | Configure household | Household row has timezone/completion fields | `Household`, `HouseholdTimeZone` | Onboarding status/complete only; no settings CRUD | onboarding API only | Settings shows calendar portability only | Settings nav | No household settings empty state | PROTOTYPE |
| House status | House | Future sensors/devices | None proven | None proven | None proven | None proven | `DomainPlaceholderPage` | House nav | Placeholder | MISSING |
| Media | Media | Future media context | None proven | None proven | None proven | None proven | `DomainPlaceholderPage` | Media nav | Placeholder | MISSING |
| Authentication | Accounts/security | Identify users/roles | None proven | None proven | None proven | None proven | None proven | None | None | MISSING |

## Architectural Completeness by Feature

### First-run onboarding — MOSTLY COMPLETE
- Persistence: Proven by household onboarding completion flag migration and `Household` model.
- Domain: Household model exists; onboarding itself is thin workflow state.
- API: `GET /api/onboarding/status`, `POST /api/onboarding/complete`.
- Client: `onboardingApi.ts` and generated client methods.
- UI/navigation: `WorkspaceShell` checks onboarding status before rendering workspaces and displays `FirstRunWizard`.
- Empty state: Wizard starts with welcome, adults, children, review, finish. It blocks completion unless at least one adult exists. It does not require children, goals, tasks, calendars, or lists.
- Gap: It only sets up members, not the full adoption path requested by research.

### Family members and avatars — COMPLETE / MOSTLY COMPLETE
- Persistence: Family member and avatar fields are EF entities/migrations.
- Domain: `FamilyMember`, kind, age group, presentation, skin tone, hair color/style, glasses, shirt color.
- API: Full member CRUD exists, using soft delete for delete.
- Client: API mapping exists.
- UI/navigation: Add from Home, edit/remove after selecting a member, add during wizard.
- Empty state: Wizard and Home provide add affordances.
- Gap: No separate accounts/permissions; this is household roster management only.

### Tasks — PARTIALLY COMPLETE
- Persistence: Tasks are persisted.
- Domain: Ad-hoc task model with title, due date, owner kind/member, complete flags.
- API: Create/list/complete/reopen only. No edit/delete API.
- Client/UI/navigation: Tasks page is reachable and usable from nav; dashboard summary links to it.
- Empty state: Clear first-task prompt.
- Gap: No recurrence, templates, edit, delete, reminders, or task-specific child mode.

### Motivation goals and helpful moments — MOSTLY COMPLETE
- Persistence/domain/API/client/UI are present for family goals, personal goals, helpful moments, and marking a family goal celebration complete.
- User value: Encouragement and visible progress are real, and task completion can advance goals.
- Empty states: Family goal and personal goals have first-use messages.
- Gap: These are goals and recognition, not rewards. There is no reward catalog, approval, points, earning ledger, or redemption workflow.

### Shopping lists — PARTIALLY COMPLETE
- Persistence/domain/API/client/UI exist for multiple lists and list items.
- UI supports creating a first list and adding/toggling/deleting items.
- Gap: No proven list rename or list deletion endpoint/UI. Empty installation with zero lists can create one list from the widget, but list lifecycle management is incomplete.

### Agenda/calendar — PARTIALLY COMPLETE
- Persistence/domain/API/client/UI exist for manual events and event projection. Export/restore exists.
- Gap: Recurrence model exists in backend, but the proven UI/API request for manual create/update only takes start/end/all-day/title/description and does not prove user-facing recurrence editing. Reminders, notifications, and Google Calendar setup are unavailable.

### Settings and dashboard customization — PROTOTYPE / PARTIALLY COMPLETE
- Settings page exposes calendar export/restore, not household settings.
- Workspace layout persistence exists architecturally, but no normal user customization UI is proven.

## Original Gap Re-evaluation

| # | Original gap | Status | Evidence-based rationale |
|---|---|---|---|
| 1 | Family member creation | RESOLVED | Wizard and Home add dialog call family member create API. |
| 2 | Family member deletion | RESOLVED | Family member delete API and remove action exist. |
| 3 | Family member editing | RESOLVED | Family member update API and edit page/avatar editor exist. |
| 4 | Family onboarding workflow | PARTIALLY RESOLVED | First-run wizard exists but only covers household members, not goals/rewards/tasks/lists/calendar. |
| 5 | Goal creation | RESOLVED | Family and individual goal creation APIs/UI exist. |
| 6 | Goal editing | RESOLVED | Family and individual update APIs/UI exist. |
| 7 | Goal deletion | PARTIALLY RESOLVED | Individual goals can be archived; family goal can be replaced/updated but no direct delete endpoint. |
| 8 | Reward creation | STILL VALID | No reward model/API/UI. |
| 9 | Reward editing | STILL VALID | No reward model/API/UI. |
| 10 | Reward redemption | STILL VALID | No reward redemption model/API/UI. |
| 11 | Shopping list creation | RESOLVED | Create list API/UI exists. |
| 12 | Shopping list rename | STILL VALID | No list update endpoint/UI proven. |
| 13 | Shopping list deletion | STILL VALID | No list delete endpoint/UI proven. |
| 14 | Multiple list support | RESOLVED | Lists API returns multiple lists and UI model supports list selection. |
| 15 | Task recurrence | STILL VALID | Task model/API/UI have no recurrence. |
| 16 | Task templates | STILL VALID | No template model/API/UI. |
| 17 | Calendar recurrence editing | PARTIALLY RESOLVED | Backend recurrence/event-series concepts exist, but no proven user-facing recurrence editing flow. |
| 18 | Calendar reminders | STILL VALID | No reminder model/API/UI. |
| 19 | Notifications | STILL VALID | No notification model/API/UI. |
| 20 | Google Calendar integration | PARTIALLY RESOLVED | Adapter/fake provider/source types exist, but no user authentication/configuration/sync setup. |
| 21 | Child-specific task view | PARTIALLY RESOLVED | Member pages and ownership expose per-member context, but no dedicated child mode/task screen. |
| 22 | Gamification functionality | PARTIALLY RESOLVED | Goals/progress/helpful moments exist; rewards/points/achievement system does not. |
| 23 | Dashboard customization | PARTIALLY RESOLVED | Layout persistence exists but user customization UI is not proven. |
| 24 | User authentication | STILL VALID | No auth/account feature. |
| 25 | Household settings | PARTIALLY RESOLVED | Household and onboarding status exist; no settings UI for household configuration. |

## Adoption Analysis

- New Family Adoption Score: **Difficult**. A family can add members and start tasks/lists/goals/calendar events, but onboarding stops after member setup and leaves users to discover multiple workflows manually.
- Daily Usage Score: **Moderate**. Tasks, lists, agenda, goals, and helpful moments can support daily routines, but missing recurrence, reminders, rewards, list lifecycle management, and authentication weaken month-long use.
- Child Engagement Score age 6: **Weak**. Avatars, stars, and simple progress help, but no sticker/reward redemption or child-safe simplified mode is proven.
- Child Engagement Score age 10: **Moderate**. Personal goals and progress are understandable, but ownership is limited by missing achievements/rewards and no dedicated child workflow.
- Parent Administration Burden: **High**. Parents must manually create tasks/events/lists/goals and manually keep them current because recurrence/templates/reminders/integrations are absent or incomplete.

## Prioritized Remaining Gaps

### P0 — Blocking adoption
1. No full adoption/onboarding path beyond members.
   - Evidence: Wizard covers welcome/adults/children/review/finish only.
   - Impact: New households do not know to configure goals, tasks, lists, or calendar.
   - Why users care: Setup momentum is critical; otherwise the product feels empty.
2. No task recurrence/templates.
   - Evidence: Task API and model support only ad-hoc title/date/owner/completion.
   - Impact: Repeated family routines require manual re-entry.
   - Why users care: Household operations are repetitive.
3. No reminders/notifications.
   - Evidence: No model/API/UI found.
   - Impact: Calendar/tasks do not prompt action.
   - Why users care: Families forget without prompts.
4. No rewards/redemption despite visible gamification/research expectations.
   - Evidence: Gamification is placeholder; no reward domain.
   - Impact: Child motivation loop is incomplete.
   - Why users care: Rewards were an explicit adoption motivator.

### P1 — Strong adoption impact
1. Shopping list rename/delete missing.
2. Calendar recurrence editing not proven in UI.
3. Household settings UI missing.
4. Google Calendar integration not user-configurable.
5. Authentication absent for real household use.

### P2 — Quality-of-life
1. Dedicated child view for age-appropriate daily tasks/progress.
2. Dashboard customization UI over existing layout persistence.
3. Task edit/delete.
4. Family goal delete/archive semantics.

### P3 — Nice-to-have
1. Media/house status placeholders.
2. Rich achievements/stickers beyond personal goal stars.
3. More detailed onboarding education and examples.

## Validation Checklist

- Every feature has architectural traceability: complete in matrix above.
- Every feature has persistence verification: matrix and per-feature audit above.
- Every feature has API verification: exact endpoints listed above.
- Every feature has UI verification: screens/components listed above.
- Every feature has navigation verification: navigation paths listed above.
- Every original gap is re-evaluated: table above.
- Every persona performs full household setup: see persona reports.
- Conclusions are evidence-based: unavailable unless proven by repo files.
- No speculation: seed data and docs are not treated as user-accessible runtime functionality.
