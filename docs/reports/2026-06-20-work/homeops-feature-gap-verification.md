# HomeOps Feature Gap Verification

Date: 2026-06-20  
Branch: `work`  
Scope: repository analysis only. The application was not run and no browser automation was used.

## Method

Reviewed backend endpoint/domain files, OpenAPI contract, frontend pages/components/API wrappers, workspace navigation, and relevant tests/documentation. A feature is treated as discoverable only when a normal user can reach it from existing client navigation or visible UI controls.

## Summary Table

| # | Feature | Backend support | API support | UI support | Navigation | Discoverable | Production complete | Assessment |
|---:|---|---|---|---|---|---|---|---|
| 1 | Family member creation | No | No | No | No | No | No | CONFIRMED MISSING |
| 2 | Family member deletion | No | No | No | No | No | No | CONFIRMED MISSING |
| 3 | Family member editing | Partial | Yes | Partial | Yes | Yes | No | IMPLEMENTED BUT INCOMPLETE |
| 4 | Family onboarding workflow | No | No | No | No | No | No | CONFIRMED MISSING |
| 5 | Goal creation | No | No | No | Yes to Motivation page | No | No | CONFIRMED MISSING |
| 6 | Goal editing | No | No | No | Yes to Motivation page | No | No | CONFIRMED MISSING |
| 7 | Goal deletion | No | No | No | Yes to Motivation page | No | No | CONFIRMED MISSING |
| 8 | Reward creation | No | No | No | Yes to Motivation page | No | No | CONFIRMED MISSING |
| 9 | Reward editing | No | No | No | Yes to Motivation page | No | No | CONFIRMED MISSING |
| 10 | Reward redemption | No | No | No | No | No | No | CONFIRMED MISSING |
| 11 | Shopping list creation | Yes | Yes | No | Lists page exists | No | No | IMPLEMENTED BUT HARD TO DISCOVER |
| 12 | Shopping list rename | No | No | No | No | No | No | CONFIRMED MISSING |
| 13 | Shopping list deletion | No | No | No | No | No | No | CONFIRMED MISSING |
| 14 | Multiple list support | Partial | Partial | Partial | Lists page exists | Partial | No | IMPLEMENTED BUT INCOMPLETE |
| 15 | Task recurrence | No | No | No | No | No | No | CONFIRMED MISSING |
| 16 | Task templates | No | No | No | No | No | No | CONFIRMED MISSING |
| 17 | Calendar recurrence editing | Partial backend runtime | No CRUD API | No | Agenda page exists | No | No | IMPLEMENTED BUT INCOMPLETE |
| 18 | Calendar reminders | No | No | No | No | No | No | CONFIRMED MISSING |
| 19 | Notifications | No | No | No | No | No | No | CONFIRMED MISSING |
| 20 | Google Calendar integration | Adapter/test only | No integration API | No | No | No | No | IMPLEMENTED BUT INCOMPLETE |
| 21 | Child-specific task view | Partial data assignment | No member-filter API | Placeholder only | Family member page exists | No | No | IMPLEMENTED BUT INCOMPLETE |
| 22 | Gamification functionality | Placeholder/motivation progress | Snapshot only | Placeholder plus motivation page | Gamification nav exists | Placeholder discoverable | No | IMPLEMENTED BUT INCOMPLETE |
| 23 | Dashboard customization | Backend layout persistence | Layout API | No user customization UI | Home/settings exist | No | No | IMPLEMENTED BUT HARD TO DISCOVER |
| 24 | User authentication | No | No | No | No | No | No | CONFIRMED MISSING |
| 25 | Household settings | Timezone persisted only | No settings API | Settings placeholder/export UI | Settings nav exists | Partial | No | IMPLEMENTED BUT INCOMPLETE |

---

## 1. Family member creation

**Evidence Found**

- Backend family-member endpoints expose `GET /api/family-members`, `GET /api/family-members/{memberId}`, and `PUT /api/family-members/{memberId}` only; there is no `POST` route for creation in `src/HomeOps.Api/FamilyMembers/FamilyMemberEndpoints.cs`.
- Family members are seeded in `src/HomeOps.Api/FamilyMembers/SeedFamilyMembers.cs` and persisted via `FamilyMember` domain/entity files.
- Frontend loads and saves existing members via `src/HomeOps.Client/src/home/familyMembersApi.ts`; no create wrapper was found.
- `FamilyMemberPage` displays an existing selected member and an avatar editor but no create form in `src/HomeOps.Client/src/home/FamilyMemberPage.tsx`.
- Workspace navigation can reach family member pages from Home through selected seeded/loaded members in `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx` and `src/HomeOps.Client/src/home/HomeDashboard.tsx`, but not a member-creation screen.

**Assessment: CONFIRMED MISSING**

**Reasoning**

Backend persistence exists for family members, but there is no repository evidence of backend/API/UI support for creating new members. Navigation only exposes existing member pages.

**Suggested User Research Correction**

Keep the previous gap as a true missing capability. If research said users could add family members, correct it to: family members can be viewed and partly edited only after they already exist.

## 2. Family member deletion

**Evidence Found**

- `FamilyMemberEndpoints.cs` has no `DELETE /api/family-members/{memberId}` route.
- `FamilyMemberPage.tsx` has no delete/remove control.
- No frontend API wrapper for deletion was found in `src/HomeOps.Client/src/home/familyMembersApi.ts`.

**Assessment: CONFIRMED MISSING**

**Reasoning**

No backend, OpenAPI, client wrapper, UI, or navigation evidence supports deleting a family member.

**Suggested User Research Correction**

Keep deletion classified as missing.

## 3. Family member editing

**Evidence Found**

- Backend supports `PUT /api/family-members/{memberId}` and updates name, display color, initials, and avatar fields in `src/HomeOps.Api/FamilyMembers/FamilyMemberEndpoints.cs`.
- OpenAPI contains `/api/family-members/{memberId}` and the update operation in `src/HomeOps.Contracts/openapi.json`.
- Frontend `WorkspaceShell` calls `saveFamilyMember(updated)` after a member changes in `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx`.
- `FamilyMemberPage.tsx` offers an `Edit avatar` button and renders `FamilyAvatarEditor`, but the page itself only displays name/initials/color as details.
- `FamilyAvatarEditor.tsx` is avatar-focused. Repository evidence does not show a normal UI for editing name, initials, or display color even though backend accepts them.

**Assessment: IMPLEMENTED BUT INCOMPLETE**

**Reasoning**

Editing exists, is reachable from Home by selecting a member, and can save through the API, but the visible editing UI is limited to avatar fields. Backend supports more fields than the UI exposes, so production completeness is partial.

**Suggested User Research Correction**

Change any blanket “family member editing is missing” conclusion to: avatar editing is implemented and discoverable; full member editing is incomplete.

## 4. Family onboarding workflow

**Evidence Found**

- No onboarding route/page/component was found under `src/HomeOps.Client/src`.
- Family members are seeded by `SeedFamilyMembers.cs`; no setup wizard or initial household flow was found.
- Workspace navigation in `workspaceModel.ts` contains Home, Agenda, Lists, Tasks, Motivation, House Status, Media, Gamification, and Settings only.

**Assessment: CONFIRMED MISSING**

**Reasoning**

The repository shows seeded bootstrap data and normal workspace navigation, but no first-run onboarding workflow or family setup flow.

**Suggested User Research Correction**

Keep onboarding workflow as missing.

## 5. Goal creation

**Evidence Found**

- Motivation backend exposes only `GET /api/motivation` in `src/HomeOps.Api/Motivation/MotivationEndpoints.cs`.
- Tests assert motivation creation endpoints are not allowed by posting to `/api/motivation/family-goals` and related paths in `tests/HomeOps.Api.Tests/Lists/MotivationApiTests.cs`.
- Motivation data is seeded in `src/HomeOps.Api/Motivation/SeedMotivation.cs`.
- `MotivationPage.tsx` displays existing family and individual goals but has no goal creation form.
- Navigation contains a Motivation page in `workspaceModel.ts` and `WorkspaceShell.tsx`.

**Assessment: CONFIRMED MISSING**

**Reasoning**

Read-only motivation snapshots and seeded goals exist, but no goal creation API or UI exists.

**Suggested User Research Correction**

Keep goal creation as missing.

## 6. Goal editing

**Evidence Found**

- Motivation backend exposes only `GET /api/motivation`.
- `MotivationPage.tsx` renders current goal titles/progress/reward labels without edit controls.
- Progress can change indirectly from task completion/reopen in `TaskEndpoints.cs`, but goal definitions cannot be edited.

**Assessment: CONFIRMED MISSING**

**Reasoning**

There is no direct goal-editing backend/API/UI. Indirect progress mutation is not goal editing.

**Suggested User Research Correction**

Keep goal editing as missing.

## 7. Goal deletion

**Evidence Found**

- No DELETE route exists in `MotivationEndpoints.cs`.
- Motivation page has no delete/archive control.
- Motivation domain has `IsActive` fields in `MotivationFamilyGoal.cs` and `MotivationIndividualGoal.cs`, but no endpoint/UI to deactivate or delete goals.

**Assessment: CONFIRMED MISSING**

**Reasoning**

Domain fields could support inactive goals, but no repository evidence exposes deletion/deactivation to API or UI.

**Suggested User Research Correction**

Keep goal deletion as missing.

## 8. Reward creation

**Evidence Found**

- `MotivationFamilyGoal` includes `RewardLabel`, and motivation DTOs return `rewardLabel` in `src/HomeOps.Api/Motivation/MotivationDtos.cs`.
- `MotivationPage.tsx` displays `When we finish: {familyGoal.rewardLabel}` when present.
- No create endpoint or UI for rewards exists; motivation API is read-only.

**Assessment: CONFIRMED MISSING**

**Reasoning**

A static reward label can be seeded/displayed, but users cannot create rewards.

**Suggested User Research Correction**

If prior research called rewards absent, refine it: reward display exists as a label attached to seeded family goals, but reward creation is missing.

## 9. Reward editing

**Evidence Found**

- No motivation update endpoint exists in `MotivationEndpoints.cs`.
- `MotivationPage.tsx` displays reward labels without edit controls.

**Assessment: CONFIRMED MISSING**

**Reasoning**

Reward labels exist as data, but cannot be edited through API or UI.

**Suggested User Research Correction**

Keep reward editing as missing, with the note that reward labels can be displayed when already present.

## 10. Reward redemption

**Evidence Found**

- No reward redemption entity, endpoint, or frontend component was found.
- `MotivationPage.test.tsx` explicitly checks that reward economy wording is not rendered.
- Gamification workspace is a placeholder in `WorkspaceShell.tsx`.

**Assessment: CONFIRMED MISSING**

**Reasoning**

The repo contains no reward economy or redemption workflow. Existing reward support is display-only label text.

**Suggested User Research Correction**

Keep reward redemption as missing.

## 11. Shopping list creation

**Evidence Found**

- Backend supports `POST /api/lists` in `src/HomeOps.Api/Lists/ListEndpoints.cs`.
- OpenAPI includes `/api/lists` in `src/HomeOps.Contracts/openapi.json`.
- Frontend `ShoppingListWidget` loads a hard-coded list named `Shopping` and supports item add/toggle/remove only.
- `listsApi.ts` has no create-list helper; it finds the existing list by name `Shopping`.
- Workspace navigation includes `Lists`, and `WorkspaceShell.tsx` renders a shopping-list widget for that page.

**Assessment: IMPLEMENTED BUT HARD TO DISCOVER**

**Reasoning**

API support exists, but no normal user UI exposes list creation. From a user's perspective, the feature is not discoverable even though backend/API support exists.

**Suggested User Research Correction**

Change “missing” to “API-supported but not exposed in the UI” if the previous conclusion evaluated the product as a whole.

## 12. Shopping list rename

**Evidence Found**

- `ListEndpoints.cs` has no `PUT /api/lists/{listId}` or patch route.
- `listsApi.ts` has no rename/update-list wrapper.
- `ShoppingListWidget.tsx` has no rename form or control.

**Assessment: CONFIRMED MISSING**

**Reasoning**

No backend/API/UI evidence supports list rename.

**Suggested User Research Correction**

Keep shopping list rename as missing.

## 13. Shopping list deletion

**Evidence Found**

- `ListEndpoints.cs` has no `DELETE /api/lists/{listId}` route.
- UI supports removing list items, not lists, in `ShoppingListWidget.tsx`.
- Client API supports `removeShoppingListItem`, not list deletion, in `listsApi.ts`.

**Assessment: CONFIRMED MISSING**

**Reasoning**

List item deletion exists; list deletion does not.

**Suggested User Research Correction**

Keep shopping list deletion as missing; distinguish it from item removal, which is implemented.

## 14. Multiple list support

**Evidence Found**

- Backend `GET /api/lists` returns multiple list summaries and `POST /api/lists` can create additional lists in `ListEndpoints.cs`.
- `HomeDashboard.tsx` loads list summaries and flattens active items across lists for the Home overview.
- `listsSummaryApi.ts` exists for multi-list summaries.
- `listsApi.ts` and `ShoppingListWidget.tsx` are hard-coded to the list named `Shopping`; the widget does not let users switch lists.
- Workspace label says `Lists`, but `WorkspaceShell.tsx` renders only the `shopping-list-mvp` widget on that page.

**Assessment: IMPLEMENTED BUT INCOMPLETE**

**Reasoning**

Data/API support for multiple lists exists, and Home summarizes across lists, but the main list UI remains a single hard-coded shopping list with no list picker/creation/rename/delete. Normal user discoverability is partial at best.

**Suggested User Research Correction**

Change “multiple lists missing” to “partially implemented in backend and summaries, incomplete in list-management UI.”

## 15. Task recurrence

**Evidence Found**

- Task domain `HouseholdTask.cs` includes title, due date, ownership, completion, timestamps; no recurrence fields were found.
- Task DTOs in `TaskDtos.cs` include title, due date, ownership, completion; no recurrence fields.
- Task endpoints create ad-hoc tasks only in `TaskEndpoints.cs`.
- `TasksPage.tsx` describes “ad-hoc tasks” and has title/owner/family member/due date controls only.

**Assessment: CONFIRMED MISSING**

**Reasoning**

No backend model, API contract, or UI supports task recurrence.

**Suggested User Research Correction**

Keep task recurrence as missing.

## 16. Task templates

**Evidence Found**

- No task template entity, DTO, endpoint, or UI component was found.
- `TasksPage.tsx` only supports one-off task creation.

**Assessment: CONFIRMED MISSING**

**Reasoning**

Repository evidence contains only ad-hoc household tasks.

**Suggested User Research Correction**

Keep task templates as missing.

## 17. Calendar recurrence editing

**Evidence Found**

- Backend `EventSeries` has `RecurrenceType` and `Exceptions`, and migrations include recurrence runtime.
- `EventOccurrenceGenerator.cs` projects recurrence occurrences.
- `EventSeriesEndpoints.cs` create/update requests use `Title`, `Description`, `StartUtc`, `EndUtc`, and `IsAllDay`; the endpoint does not accept recurrence fields.
- `AgendaWidget.tsx` has event create/edit/delete UI for title, description, start/end, and all-day only; no recurrence controls.
- Reports such as `docs/reports/2026-06-19-calendar-json-contract-hardening.md` state recurrence sections were reserved or constrained in prior slices.

**Assessment: IMPLEMENTED BUT INCOMPLETE**

**Reasoning**

Some backend recurrence runtime exists, but user-editable recurrence is not exposed through create/update API or UI. Calendar recurrence editing is not discoverable or production-ready.

**Suggested User Research Correction**

Change “calendar recurrence missing” to: backend recurrence projection/foundation exists, but recurrence editing is incomplete and unavailable to users.

## 18. Calendar reminders

**Evidence Found**

- Calendar event entity/DTO/endpoint files contain no reminder fields.
- `AgendaWidget.tsx` has no reminder control.
- Existing report `docs/reports/2026-06-19-eventseries-contract-and-migration.md` lists reminders as unimplemented/out of scope.

**Assessment: CONFIRMED MISSING**

**Reasoning**

No repository evidence supports reminders.

**Suggested User Research Correction**

Keep calendar reminders as missing.

## 19. Notifications

**Evidence Found**

- No notification entity, service, endpoint, frontend module, or UI was found.
- Existing event-series reports list notifications as unimplemented/out of scope.

**Assessment: CONFIRMED MISSING**

**Reasoning**

No repository evidence supports notifications.

**Suggested User Research Correction**

Keep notifications as missing.

## 20. Google Calendar integration

**Evidence Found**

- Backend contains adapter/provider/configuration files under `src/HomeOps.Api/EventSources/GoogleCalendar/`.
- `GoogleCalendarAdapterTests.cs` verifies adapter normalization behavior using a fake provider.
- Contracts include `EventSourceType.GoogleCalendar`.
- No credentials/configuration UI, OAuth/auth flow, sync service, or Google Calendar management endpoint was found.
- `demoAgendaData.ts` supplies read-only demo events/sources; Google source handling appears adapter-level only.

**Assessment: IMPLEMENTED BUT INCOMPLETE**

**Reasoning**

There is adapter-level/fake-provider support and contract typing, but no production integration flow, credentials, API surface, UI, or user navigation for connecting Google Calendar.

**Suggested User Research Correction**

Change “Google Calendar entirely missing” to: adapter/foundation exists, but user-facing production integration is missing/incomplete.

## 21. Child-specific task view

**Evidence Found**

- Tasks can be assigned to a family member via `TaskOwnershipKind.FamilyMember` and `FamilyMemberId` in `TaskEndpoints.cs` and `TaskDtos.cs`.
- `TasksPage.tsx` supports choosing a family member owner and displays owner names.
- `FamilyMemberPage.tsx` includes a Tasks card that says “Coming later. Not implemented in this slice.”
- No member-specific task route/filter UI was found.

**Assessment: IMPLEMENTED BUT INCOMPLETE**

**Reasoning**

The task assignment data model exists, but there is no child-specific/member-specific task view. The family member page explicitly marks tasks as not implemented.

**Suggested User Research Correction**

Change “missing” to “task assignment exists; child-specific task viewing is incomplete/missing from UI.”

## 22. Gamification functionality

**Evidence Found**

- Workspace navigation includes a `Gamification` workspace.
- `WorkspaceShell.tsx` renders `DomainPlaceholderPage` for gamification with placeholder text about future points/rewards/progress.
- Motivation goals progress when tasks are completed/reopened in `TaskEndpoints.cs`.
- `MotivationPage.tsx` renders cooperative progress and intentionally avoids competitive/reward economy language per `MotivationPage.test.tsx`.
- Family member page has a Points card that says “Coming later. Not implemented in this slice.”

**Assessment: IMPLEMENTED BUT INCOMPLETE**

**Reasoning**

There is a discoverable placeholder and a cooperative motivation/progress feature, but no production gamification system, points economy, rewards, redemption, or child points view.

**Suggested User Research Correction**

If prior research said gamification is absent, refine it to: motivation/progress foundations and navigation placeholder exist, but gamification functionality is incomplete.

## 23. Dashboard customization

**Evidence Found**

- Backend supports workspace layout persistence through `WorkspaceLayoutEndpoints.cs` and widget placement/domain files.
- Tests cover `GET/PUT /api/workspaces/home/layout` in `tests/HomeOps.Api.Tests/WidgetLayouts/WorkspaceLayoutApiTests.cs`.
- Frontend `WorkspaceShell.tsx` loads workspace layout via `loadWorkspaceLayout` and renders widget instances.
- `workspaceLayout.ts` has load/save helpers, but no visible customization UI was found.
- Widget catalog exists in `widgetCatalog.ts`, but no add/remove/reorder dashboard controls were found.

**Assessment: IMPLEMENTED BUT HARD TO DISCOVER**

**Reasoning**

Backend/API/client plumbing can persist layouts, but normal users have no UI to customize the dashboard. It is not discoverable despite implementation support.

**Suggested User Research Correction**

Change “dashboard customization missing” to “layout persistence is implemented but no user-facing customization controls are exposed.”

## 24. User authentication

**Evidence Found**

- Family member page states members are not users, login identities, profiles, or permission holders in `FamilyMemberPage.tsx`.
- No auth middleware/configuration, login page, user entity, identity provider setup, or authorization attributes were found.
- AGENTS instructions and prior reports explicitly keep authentication out of bootstrap/current scope.

**Assessment: CONFIRMED MISSING**

**Reasoning**

No backend/API/UI evidence supports authentication. Family members are intentionally not users.

**Suggested User Research Correction**

Keep user authentication as missing.

## 25. Household settings

**Evidence Found**

- Household entity stores `TimeZoneId` in `src/HomeOps.Api/Households/Household.cs`; `HouseholdTimeZone.cs` defines a default.
- Migration and tests cover household timezone foundation in `tests/HomeOps.Api.Tests/Households/HouseholdTimeZoneTests.cs`.
- There is no general household settings endpoint under `/api/household` or `/api/settings`.
- Workspace navigation includes `Settings`; `WorkspaceShell.tsx` renders Calendar Export / Restore widget there and otherwise widget-host content.
- `widgetCatalog.ts` contains a settings placeholder definition.

**Assessment: IMPLEMENTED BUT INCOMPLETE**

**Reasoning**

A household timezone field exists and Settings navigation exists, but there is no production household settings UI/API for editing household properties. Settings currently exposes calendar portability/admin UI rather than household preferences.

**Suggested User Research Correction**

Change “household settings missing” to “settings workspace exists and household timezone persistence exists, but editable household settings are incomplete.”

---

## Repository Evidence Index

Key files reviewed include:

- `src/HomeOps.Api/FamilyMembers/FamilyMemberEndpoints.cs`
- `src/HomeOps.Api/Lists/ListEndpoints.cs`
- `src/HomeOps.Api/Tasks/TaskEndpoints.cs`
- `src/HomeOps.Api/Motivation/MotivationEndpoints.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeriesEndpoints.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeries.cs`
- `src/HomeOps.Api/EventSources/GoogleCalendar/*`
- `src/HomeOps.Api/WidgetLayouts/WorkspaceLayoutEndpoints.cs`
- `src/HomeOps.Api/Households/Household.cs`
- `src/HomeOps.Contracts/openapi.json`
- `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx`
- `src/HomeOps.Client/src/workspaces/workspaceModel.ts`
- `src/HomeOps.Client/src/home/FamilyMemberPage.tsx`
- `src/HomeOps.Client/src/home/FamilyAvatarEditor.tsx`
- `src/HomeOps.Client/src/home/HomeDashboard.tsx`
- `src/HomeOps.Client/src/tasks/TasksPage.tsx`
- `src/HomeOps.Client/src/MotivationPage.tsx`
- `src/HomeOps.Client/src/shopping/listsApi.ts`
- `src/HomeOps.Client/src/widgets/components/ShoppingListWidget.tsx`
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.tsx`
- `src/HomeOps.Client/src/widgets/widgetCatalog.ts`
- `tests/HomeOps.Api.Tests/Lists/MotivationApiTests.cs`
- `tests/HomeOps.Api.Tests/WidgetLayouts/WorkspaceLayoutApiTests.cs`
- `tests/HomeOps.Api.Tests/EventSources/GoogleCalendarAdapterTests.cs`
