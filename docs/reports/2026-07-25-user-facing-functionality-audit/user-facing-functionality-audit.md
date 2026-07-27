# HomeOps user-facing functionality audit

Date: 2026-07-25  
Application reviewed: HomeOps / FamilyBoard running at `http://192.168.1.2:5173/`  
Scope: all discoverable user-facing areas, contextual dialogs, CRUD operations, navigation paths, and user-relevant backend capabilities

## Executive summary

HomeOps is a broad and visually coherent functional prototype, but it is not yet a complete or safe household product.

The strongest areas are:

- Manual agenda events, including recurring-event scopes.
- Known-person management.
- Floor and room management.
- Shopping-item completion, removal, and recovery.
- Family-member profile and avatar editing.

The largest gaps are:

1. The app and every mutating API are unauthenticated while the development command exposes them to the local network. PostgreSQL is also published to the network with a known development password.
2. The implemented `Huisstatus` runtime, climate overview, and heating controls have no user navigation path.
3. The weekly reset cannot normally reach its own completed state.
4. Home Assistant settings currently fail at runtime with HTTP 500 because the database lacks columns expected by the current application model.
5. Motivation progress is not directly manageable. Generic goals advance only when tasks are completed, regardless of whether a task actually relates to the goal.
6. Task routine creation/editing is internally inconsistent and does not expose the routine’s task items in the routine form.
7. Several important entities have asymmetric CRUD: normal tasks cannot be deleted, shopping-item labels cannot be edited, helpful moments cannot be corrected or removed, and additional shopping lists cannot be created.

Overall assessment: **usable as a trusted single-household prototype, not ready for unattended LAN use or production household data**.

## Audit method and evidence standard

The audit combined:

- A live browser walkthrough of Home, Agenda, Tasks, Shopping, Motivation, Weekly Reset, Settings, family-member pages, Known People, Woning management, weather details, and creation/edit dialogs.
- Read-only API calls against the running service.
- Frontend handler and component inspection.
- Backend endpoint, persistence, and migration inspection.
- Read-only PostgreSQL schema and migration-history inspection for the reproduced Home Assistant failure.

No destructive action was submitted. The audit opened forms and dialogs but did not create, edit, archive, restore, or delete production records. Availability of destructive operations was verified from the UI handler through the client call and backend endpoint.

### Impact scale

| Rating | Meaning |
| --- | --- |
| **5 — Critical** | Blocks a core workflow, exposes household control/data, or makes an implemented feature unreachable. |
| **4 — High** | A frequent workflow is missing or broken, or the behavior can cause significant confusion or data risk. |
| **3 — Medium** | A meaningful capability is incomplete but has a tolerable workaround. |
| **2 — Low** | Discoverability, consistency, or quality-of-life gap with limited operational impact. |
| **1 — Minor** | Cosmetic or edge-case issue. |
| **0 — Complete** | No material missing user-facing capability found in the audited scope. |

## Navigation and surface inventory

### Directly visible main navigation

The top navigation contains:

- Thuis
- Agenda
- Taken
- Boodschappen
- Motivatie
- Instellingen

### Contextual but reachable surfaces

- Family-member page: select a family member from Home.
- Weekly reset: Tasks → `Gezinsreset openen`.
- Known people: Settings → `Bekenden beheren`, or a family-member page.
- Woning management: Settings → `Woning`.
- Calendar source management: Settings.
- Calendar backup/restore: Settings.

### Implemented but unreachable surfaces

- `Huisstatus` summary.
- `Klimaat in huis` runtime.
- Room heating controls.

These components are rendered only when `activeWorkspaceId === "house"`, while `house` is classified as an internal workspace and no UI action calls `navigateWorkspace("house")`.

### Defined placeholders without user navigation

- Media.
- Beloningen / gamification.

These workspaces are also classified as internal. Their components contain “future” placeholder content rather than usable functionality.

## CRUD and interaction matrix

Legend: ✅ available, ⚠️ partial or problematic, ❌ unavailable, — not applicable.

| Entry or capability | View | Add/create | Edit/update | Remove/archive | Restore/reopen | Main finding | Highest gap |
| --- | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| Family member | ✅ | ✅ | ✅ | ✅ | ❌ | Full CRUD except restoration; add is hidden inside an existing member’s settings after onboarding. | **4** |
| Family-member avatar | ✅ | ✅ default | ✅ | — | — | Rich editor is available and persisted through member update. | **2** |
| Known person | ✅ + search | ✅ | ✅ | ✅ | ❌ | Shared/private scopes and avatar editing are present. | **1** |
| Manual agenda event | ✅ | ✅ | ✅ | ✅ | ✅ skipped occurrence | Strongest CRUD area; recurrence scopes are supported. | **1** |
| Imported agenda event | ✅ | via source | ❌ intentional | via source | via source | Correctly behaves as read-only imported data. | **0** |
| Calendar source | ✅ | ✅ | ✅ | ✅ | ❌ | iCal feed works conceptually; iCal file has metadata fields but no file upload. | **4** |
| Shopping list | ✅ | ⚠️ first only | ✅ rename | ✅ archive/delete | ❌ archived list | Existing lists are manageable, but users cannot create another list or restore an archived list. | **4** |
| Shopping item | ✅ | ✅ | ⚠️ store/avatar only | ✅ soft remove | ✅ undo | Item text/quantity cannot be edited; typo correction requires remove and re-add. | **3** |
| Normal task | ✅ | ✅ | ✅ | ❌ | ✅ complete/reopen | No normal delete or archive action/API; archive exists only through no-date review flows. | **4** |
| Recurring task series | ✅ | ✅ | ⚠️ | ✅ whole series | ❌ | Series can be removed, but occurrence/series semantics are less complete than agenda recurrence. | **3** |
| Task routine/template | ✅ | ⚠️ broken flow | ⚠️ broken flow | ✅ archive | ❌ | Routine form does not expose task items; edit flow opens the normal task form. | **4** |
| Family goal | ✅ | ✅ | ✅ definition | ⚠️ weekly reset only | ❌ | No direct progress/correction control; no normal stop/remove action on Motivation. | **4** |
| Individual goal | ✅ | ✅ | ✅ definition | ✅ stop/archive | ❌ | No direct progress/correction control. | **4** |
| Helpful moment / appreciation | ✅ | ✅ | ❌ | ❌ | ❌ | User-authored recognition cannot be corrected or removed. | **4** |
| Weekly-reset decision | ✅ | — | ⚠️ | ⚠️ | — | Task decisions work; goal keep buttons do nothing and shopping candidates have no actions. | **5** |
| Floor | ✅ | ✅ | ✅ | ✅ archive/delete | ✅ | Full lifecycle plus reordering. | **0** |
| Room | ✅ | ✅ | ✅ + move | ✅ archive/delete | ✅ | Full lifecycle plus reordering and optional family-member association. | **0** |
| Floor-plan asset | ⚠️ status only | ❌ UI | — | — | — | Backend ingestion exists, but Settings explicitly says upload comes later. | **4** |
| Room overlay | ✅ when asset exists | ✅ draw | ✅ | ✅ archive/delete | ✅ | Strong editor, but blocked for normal users because no upload path creates the first asset. | **4** |
| Home Assistant provider | ⚠️ runtime error | ✅ form | ✅ form | ❌ UI | ❌ UI | Live provider list currently returns HTTP 500; lifecycle endpoints are not exposed in UI. | **4** |
| Room climate configuration | ⚠️ summary | ❌ UI | ❌ UI | ❌ UI | — | Backend contract exists, but no working editor is exposed. | **5** |
| Climate source mapping | ⚠️ summary | ❌ UI | ❌ UI | ❌ UI | ❌ UI | Buttons labelled “Klimaatinstellingen” and “Koppelingen beheren” only focus a room row. | **5** |
| Runtime climate/heating | implemented | — | command actions | — | resume schedule | Implemented but unreachable because Huisstatus has no navigation path. | **5** |
| Weather | ✅ | — | ❌ location | — | refresh by reload | Detailed forecast works; location is server configuration, not a household setting. | **3** |
| Workspace/widget layout | ✅ rendered | ❌ UI | ❌ UI | ❌ UI | — | Persistence exists, but users cannot add, remove, reorder, or configure widgets. | **3** |
| Calendar/house backup | ✅ download | ✅ | — | replace on restore | pre-restore server snapshot | Substantial but partial household backup; excludes several core domains. | **4** |
| Media | placeholder | ❌ | ❌ | ❌ | — | No user-facing feature. | **1** |
| Rewards/gamification | placeholder | ❌ | ❌ | ❌ | — | Motivation exists, but rewards/points/redemption do not. | **2** |

## Detailed findings by user area

## 1. Global shell and navigation

### What users can do

- Move between the five daily areas and Settings.
- Open a family member from Home and return through a dedicated back button.
- Open Weekly Reset from Tasks.
- Open Woning and Known People from Settings.

### Missing or problematic

#### NAV-01 — Huisstatus has no navigation path

Impact: **5 — Critical**

`Huisstatus`, `WoningSummaryPage`, `WoningClimatePage`, and heating controls are implemented, but the workspace is marked `internal`. No Home card, navigation button, Settings action, or other handler selects the `house` workspace.

This is not the same as Settings → Woning. Settings exposes administration for floors, rooms, and Home Assistant; it does not expose the runtime house/climate view.

Recommended outcome: add one stable route or navigation action for the runtime house surface, then distinguish it clearly from Woning administration.

#### NAV-02 — All navigation state is transient

Impact: **3 — Medium**

The application has no URL routes for workspaces or detail pages. The address remains `/` everywhere.

Consequences:

- Browser Back does not return to the previous HomeOps page.
- Refresh returns to Home.
- A family member, Settings subsection, Weekly Reset, or climate room cannot be bookmarked or shared.
- Deep-link-like climate story state exists only in React memory.

#### NAV-03 — Media and Beloningen are defined but neither navigable nor functional

Impact: **1–2 — Minor/Low**

This is acceptable if they are intentionally future scope. The definitions should remain non-user-facing until they provide value, rather than appearing as incomplete navigation destinations.

#### NAV-04 — No user-facing widget customization

Impact: **3 — Medium**

Workspace-layout persistence and a widget catalog exist, but there are no controls to add, remove, configure, or reorder widgets. The layout architecture is present without the user interaction promised by a widget-driven dashboard.

## 2. First-run setup

### What users can do

- Start a five-step wizard.
- Add one or more adults.
- Add optional children with required birth dates.
- Review the resulting adult/child lists.
- Complete onboarding and open Home.

### Missing or problematic

#### ONB-01 — “Review” is read-only after records have already been created

Impact: **3 — Medium**

Each member is persisted immediately when added. The review step offers no edit or remove action. A typing mistake can only be corrected after completing onboarding and discovering the member Settings dialog.

Recommended outcome: allow edit/remove during review, or stage members locally and persist atomically at completion.

#### ONB-02 — Setup covers only people

Impact: **3 — Medium**

No first-run step configures:

- Household location or time zone.
- A first shopping list name.
- Calendar sources.
- A first recurring task or routine.
- Motivation semantics.
- Woning/Home Assistant.

The user arrives at a feature-rich dashboard without guidance on which data drives which cards.

## 3. Home dashboard and weather

### What users can do

- View date/time, weather advice, family members, shopping, agenda, tasks, and motivation summaries.
- Open weather detail with hourly/daily/detail information.
- Open the full feature page from each summary.
- Quickly add a shopping item.
- Quickly add a task with an owner; its date is fixed to today.
- Quickly add an all-day event for today, tomorrow, or a selected date.
- Check a shopping item directly from Home.

### Missing or problematic

#### HOME-01 — Quick-add capabilities differ silently from full forms

Impact: **2 — Low**

- Home task add has no date, recurrence, or decorative-avatar choice.
- Home agenda add creates all-day events only.
- Home shopping add has no store or decorative-avatar choice.

These shortcuts are useful, but the UI does not explain the reduced behavior.

#### HOME-02 — Summary cards contain nested interactive actions

Impact: **2 — Low**

The full card behaves as a button while also containing add/open buttons and, for shopping, checkboxes. Event propagation is manually stopped in several handlers. This increases keyboard and assistive-technology complexity and makes interaction behavior fragile.

#### WEATHER-01 — Weather location is not configurable

Impact: **3 — Medium**

Weather defaults to latitude `52.3676`, longitude `4.9041` (Amsterdam) unless server configuration overrides it. The UI does not show the configured location or let the household change it.

## 4. Family members, avatars, and known people

### What users can do with family members

- View every active member on Home.
- Open a member page with personal tasks, goals, history, helpful moments, and private known people.
- Edit name, adult/child type, birthday, display color, and avatar.
- Add another family member from the selected member’s Settings.
- Remove the selected family member after confirmation.

The answer to “can we remove family members?” is therefore **yes**, through:

`Home → select member → Instellingen/Ouderinstellingen → Gezinslid verwijderen`.

### Missing or problematic

#### FAMILY-01 — Add-family-member is hidden and fails when the roster becomes empty

Impact: **4 — High**

After onboarding, the add action exists only inside an existing member’s Settings dialog. If the last member is removed, Home has no member to select and therefore no path to add someone back.

Recommended outcome: put `Gezinslid toevoegen` on the Home family strip and prevent or safely handle removal of the last administrator-equivalent adult.

#### FAMILY-02 — Save success is optimistic and errors are swallowed

Impact: **3 — Medium**

The member form displays `Gegevens opgeslagen` immediately after invoking the parent update callback. The actual API promise is handled elsewhere, and failures are ignored. Add and delete failures are also caught without visible feedback.

A user can be told data was saved when persistence failed.

#### FAMILY-03 — Removed members cannot be restored

Impact: **2 — Low**

The backend uses soft deletion, but no archived-member list or restore action exists.

### Known people

Known people are comparatively complete:

- Shared or private-to-member scope.
- Search by name/nickname/relationship.
- Add, edit, delete.
- Relationship type/custom label.
- Avatar editing.

No material CRUD gap was found. The remaining limitation is intentional: known people are decorative identities, not accounts, owners, or permission subjects.

## 5. Agenda and calendar

### What users can do

- View planning, week, and month contexts.
- Select dates and filter calendar sources.
- Add all-day or timed events.
- Add title, date/time, notes, location, decorative avatar, and recurrence.
- Configure daily, weekly, monthly, or yearly recurrence and end conditions.
- Edit or delete a single occurrence, the future series, or the entire series.
- Skip and restore recurring occurrences.
- View imported events as read-only.

Manual agenda CRUD is the most complete core workflow in the app.

### Missing or problematic

#### CAL-01 — No reminders or notifications

Impact: **3 — Medium**

Events can be planned but cannot notify a family member or device. No reminder time, delivery channel, or notification preference exists.

#### CAL-02 — iCal “file” setup is not a file-upload workflow

Impact: **4 — High**

Settings allows a source type named `iCal-bestand`, but the form requests:

- Server-side file location.
- Original filename.
- Content hash.

There is no file picker or upload action. A normal household user cannot complete this workflow without manually provisioning server storage and calculating a hash.

#### CAL-03 — Calendar source coverage is narrower than backend concepts

Impact: **2 — Low**

The normal UI can configure only iCal feed/file sources. Other source types visible in backend contracts are not user-configurable. This is acceptable if they remain explicit future scope.

## 6. Tasks and routines

### What users can do

- Add a task through a guided title → owner → date → extras flow.
- Choose unassigned, household, or one family member.
- Choose today, tomorrow, another date, or no date.
- Choose no recurrence, daily, weekly, or monthly recurrence.
- Add a decorative avatar.
- Edit task definition.
- Complete and reopen tasks.
- Move a non-recurring task to tomorrow.
- Review no-date tasks and keep, date, move to someday, complete, or archive them.
- Delete a recurring series.
- View completed, someday, planning, routines, and weekly-review surfaces.

### Missing or problematic

#### TASK-01 — Normal tasks cannot be deleted

Impact: **4 — High**

A dated, non-recurring task has edit, complete/reopen, and tomorrow actions, but no delete or archive action. The backend also lacks a general task-delete endpoint.

The available archive endpoint is presented through no-date review/weekly reset, not as normal task lifecycle management.

#### TASK-02 — Routine creation does not expose the routine item

Impact: **4 — High**

The Routines panel form asks only for routine name and description. When submitted, it also sends one task item built from hidden shared task-form state (`title`, date, owner, recurrence).

For a fresh routine flow, that hidden title can be empty and cause a generic save failure. The user cannot see or intentionally configure the routine contents from the routine form.

#### TASK-03 — Routine editing opens the normal task dialog

Impact: **4 — High**

Selecting `Aanpassen` on a routine loads the first template item into the normal task dialog. Submitting that dialog follows the normal task create/update handler, not the template-update handler. This can create a household task instead of updating the routine.

#### TASK-04 — Routine archive has no restore or permanent delete UI

Impact: **3 — Medium**

Archived templates disappear from the active list. No archived-routine list or restore action exists.

#### TASK-05 — Recurring-task occurrence control is coarse

Impact: **3 — Medium**

The UI supports deleting an entire recurring series, but not clear per-occurrence skip/edit/delete scopes comparable to Agenda recurrence.

## 7. Shopping and lists

### What users can do

- Add items to the primary shopping list.
- Check/uncheck items.
- Remove items and restore recently removed items.
- Assign/update a preferred store.
- Assign/update a decorative avatar.
- View items grouped by store.
- View completed and deleted items.
- Open pre-existing other lists.
- Rename, archive, or permanently delete a list.

### Missing or problematic

#### SHOP-01 — Users cannot create an additional list

Impact: **4 — High**

The UI can create a list only when no primary list exists. Once a shopping list exists, `Andere lijsten` can open seeded/existing lists but offers no `Nieuwe lijst` action.

The API supports list creation, so this is a frontend capability gap.

#### SHOP-02 — Item labels cannot be edited

Impact: **3 — Medium**

Store and avatar can be changed, but the item name cannot. Correcting quantity, spelling, or product name requires remove + re-add, which also changes history/order.

#### SHOP-03 — Archived lists cannot be restored

Impact: **3 — Medium**

Archive removes a list from normal API results. There is no restore endpoint or archived-list UI. The distinction between `Archiveren` and `Verwijderen` therefore has little user-visible value.

#### SHOP-04 — Destructive list actions have no explicit confirmation in the component

Impact: **3 — Medium**

Archive and permanent delete call their APIs directly. Unlike family members, known people, calendar sources, floors, and rooms, the list-management component does not present a confirmation step.

## 8. Motivation, goals, and appreciation

### What users can do

- Create/edit one active family goal and optional celebration.
- Create/edit/stop an individual goal for a family member.
- See progress, remaining count, personal cards, celebration state, and history.
- Mark a ready family celebration as celebrated.
- Add helpful moments/appreciation with member, title, details, and tag.
- View helpful-moment history on Motivation and member pages.

### Missing or problematic

#### MOT-01 — Goal progress is generic in the UI but task-driven in the backend

Impact: **4 — High**

Goal forms accept arbitrary units such as books, stars, checkmarks, or helpful actions. There is no direct `+1`, `-1`, correct, or record-progress action.

Instead:

- Completing any household task increments the active family goal.
- Reopening that task decrements it.
- Completing any task assigned to a member increments that member’s active goal.

There is no link between the task and a specific goal. Completing “take out the trash” can advance “read five books”. Helpful moments do not advance a “helpful actions” goal.

Recommended outcome: make progress semantics explicit—either goal-linked activities, a direct progress ledger, or narrowly defined task-completion goals.

#### MOT-02 — Helpful moments cannot be edited or deleted

Impact: **4 — High**

Helpful moments are user-authored, person-linked household content. The API and UI provide only list and create.

Users cannot correct:

- Wrong person.
- Typo.
- Inappropriate or sensitive text.
- Wrong recognition tag.

#### MOT-03 — Family goal cannot be stopped from Motivation

Impact: **3 — Medium**

The normal Motivation page supports create/update but not stop/archive. The only exposed family-goal archive action is `Afronden` inside Weekly Reset.

#### MOT-04 — No audit trail for progress changes

Impact: **3 — Medium**

Progress changes when tasks are completed/reopened, but the goal UI shows only the aggregate count. Users cannot see which tasks changed the count or correct a mistaken association.

## 9. Weekly reset

### What users can do

- Review completed-task and helpful-moment recap.
- Resolve eligible no-date tasks through keep, later, or archive.
- Archive a family goal.
- Archive individual goals.
- See shopping-list review candidates.
- Temporarily hide the ritual with `Deze week overslaan`.

### Missing or problematic

#### RESET-01 — The ritual cannot normally reach “ready for next week”

Impact: **5 — Critical**

Readiness counts:

- Review tasks.
- Shopping review candidates.
- Active family goal.
- Active individual goals.

But:

- `Gaat mee` on the family goal has no handler.
- `Gaat mee` on every individual goal has no handler.
- Shopping review candidates have no action buttons.

The only way to clear goal choices is to archive every goal. Shopping choices cannot be cleared from the ritual at all. With the audited data—two shopping candidates, one family goal, and four individual goals—the completion state is unreachable through the page.

#### RESET-02 — Skip is local and not a weekly decision

Impact: **2 — Low**

`Deze week overslaan` toggles component state only. Reloading or leaving/re-entering the page resets it. There is no persisted “skipped this week” record.

#### RESET-03 — There is no final completion action or history

Impact: **3 — Medium**

Readiness is inferred from the absence of candidates. There is no explicit `Week afronden`, completion timestamp, or history of prior resets.

## 10. Woning, climate, floor plans, and Home Assistant

### What users can do in Settings → Woning

- Add, rename, reorder, archive, restore, and delete floors.
- Add, edit, move, reorder, archive, restore, and delete rooms.
- Associate a room with a family member.
- Open Home Assistant provider setup.
- View floor-plan and climate setup state.
- If a usable asset already exists, draw/edit/archive/restore/delete room overlays.
- If replacement assets exist, review, activate, cancel, and roll back a replacement.

### Missing or problematic

#### HOUSE-01 — Runtime house/climate/heating is unreachable

Impact: **5 — Critical**

The runtime includes:

- Floor climate summaries.
- Room filters and details.
- Trusted floor-plan overlays.
- Freshness/provider availability.
- Temporary warmer/cooler commands.
- Resume-schedule commands.
- Shared-zone warnings and command status.

None of it can be opened through the UI because `house` is never selected.

#### HOUSE-02 — No floor-plan upload UI

Impact: **4 — High**

The backend has asset-ingestion and replacement APIs, and the frontend has a mature overlay/replacement workflow. However, Settings explicitly displays `Uploaden komt later`.

A normal user cannot create the first active floor-plan asset, so most spatial functionality remains blocked.

#### HOUSE-03 — Room climate configuration and mapping controls are absent

Impact: **5 — Critical for the climate feature**

The backend supports room climate configuration and provider mappings. The Settings UI reads configuration summaries but does not render an editor.

In Home Assistant mapping summaries, buttons labelled:

- `Klimaatinstellingen`
- `Koppelingen beheren`

only focus the corresponding room row. That row contains room lifecycle controls, not climate configuration/mapping fields.

#### HOUSE-04 — Home Assistant settings currently fail at runtime

Impact: **4 — High**

Observed live behavior:

- `GET /api/climate-providers/` returns HTTP 500.
- Settings shows `Home Assistant-klimaatbronnen laden lukt niet`.

Database evidence:

- Latest applied migration is `20260715205518_AddRoomHeatingCommands`.
- The code model expects five `HomeAssistantResume*` columns.
- The `ClimateProviders` table does not contain those columns.
- `20260717124500_AddHomeAssistantResumeStrategyConfiguration.cs` exists, but unlike normal EF migrations it has no generated designer/metadata file in the repository, so it is not present in migration history.

The provider query materializes the current entity model and fails against the older table schema.

#### HOUSE-05 — Provider lifecycle is not fully exposed

Impact: **3 — Medium**

Backend endpoints support archive, restore, and delete of climate providers. The Home Assistant form exposes create/update/enable only.

#### HOUSE-06 — Home Assistant token setup is operational, not user-facing

Impact: **3 — Medium**

The UI correctly avoids displaying secrets, but setup requires an environment variable outside the app. There is no guided credential-health check before saving the provider.

## 11. Settings, backup, and household configuration

### What users can do

- Add/edit/delete/toggle/refresh iCal sources.
- Refresh all actionable sources.
- Download a JSON backup.
- Select a backup file, review a destructive warning, confirm, and restore.
- Open Woning, Known People, Details, and one placeholder “extra setting”.

### Missing or problematic

#### SETTINGS-01 — “Back-up” is not a complete HomeOps backup

Impact: **4 — High**

The export currently includes:

- Household identifier/time zone.
- Calendar sources, events, recurrence, and exceptions.
- Floors and rooms.
- Room climate configuration.
- Climate providers and mappings.
- Floor-plan derivatives, overlays, and replacement reviews.

It does **not** include:

- Family members and avatars.
- Tasks, recurring-task series, or task templates.
- Shopping lists/items/history.
- Family or individual motivation goals.
- Helpful moments.
- Known people.
- Onboarding state.
- Workspace layouts.

The Settings button says `Back-up maken`, while much of the code and contract still call it a calendar export. Users can reasonably assume more protection than the file provides.

Recommended outcome: label it by exact scope or extend it to a versioned household backup.

#### SETTINGS-02 — Household time zone cannot be changed

Impact: **3 — Medium**

The household stores a time-zone ID, but no Settings endpoint or UI changes it. The seed defaults to `Europe/Amsterdam` if runtime detection does not produce a supported IANA zone.

#### SETTINGS-03 — “Gezinsinstellingen” opens a placeholder

Impact: **2 — Low**

The visible quick action reports one extra household setting, but it opens the generic “Binnenkort beschikbaar” settings placeholder.

#### SETTINGS-04 — No central family-member administration

Impact: **3 — Medium**

Known People and Woning are centrally managed in Settings. Family members are not; their add/edit/remove actions are scattered across each member page.

## 12. Cross-cutting security and data safety

#### SEC-01 — No authentication or authorization on a LAN-exposed service

Impact: **5 — Critical**

The API configures no authentication or authorization middleware, and endpoints do not require authorization.

Any device that can reach the current LAN service can call APIs to:

- Add, edit, or remove family members.
- Modify or delete events, tasks, lists, goals, and known people.
- Restore a backup and replace calendar/house data.
- Configure Home Assistant providers.
- Send heating commands if the climate setup becomes reachable/configured.

Family members are explicitly data records, not accounts or permission identities.

#### SEC-02 — Development PostgreSQL is published to the LAN

Impact: **5 — Critical**

The Docker Compose configuration publishes `5432:5432` on all interfaces and uses:

- Database: `homeops`
- Username: `homeops`
- Password: `homeops_dev_password`

Because the user requested LAN access and the current host binds services to `0.0.0.0`, PostgreSQL is also reachable unless blocked by Windows Firewall.

Recommended outcome: bind PostgreSQL to `127.0.0.1:5432:5432`, keep only the frontend/API reachable on the LAN, and add authentication before relying on network isolation.

#### SEC-03 — Destructive-action consistency is uneven

Impact: **3 — Medium**

Confirmation exists for family members, known people, calendar sources, floors/rooms, restore, and floor-plan lifecycle actions. Shopping list archive/delete and several archive actions execute immediately.

#### DATA-01 — Error reporting is inconsistent

Impact: **3 — Medium**

Some domains show detailed validation and retry state; others silently swallow errors or show a generic page-level error. Member persistence is the clearest example of a success message preceding actual API success.

## 13. Localization and interaction consistency

#### UX-01 — Mixed Dutch and English production content

Impact: **2 — Low**

The shell is Dutch, but seed/runtime content and some labels remain English, for example:

- `Fill the family helper path`
- `Board game night together`
- `helpful actions`
- Family-member field label `Name`

Some character-encoding artifacts are also visible in source strings and may render incorrectly depending on the active build.

#### UX-02 — Different domains use different lifecycle words for similar actions

Impact: **2 — Low**

The UI alternates between:

- Verwijderen
- Weg
- Archiveren
- Afronden
- Doel stoppen
- Niet meer nodig

The underlying permanence/recovery rules are not always visible.

## Prioritized remediation order

### P0 — Safety and blocked workflows

1. Protect LAN use: bind PostgreSQL to localhost and add an access-control boundary for the UI/API.
2. Make Huisstatus/runtime climate navigable.
3. Repair the Home Assistant migration and verify the live provider endpoint.
4. Complete Weekly Reset decisions so every counted candidate can be resolved.
5. Expose real room-climate configuration and mapping management before presenting climate setup as available.

### P1 — Core lifecycle completeness

1. Repair task routine create/edit semantics.
2. Add normal task archive/delete.
3. Add helpful-moment edit/delete.
4. Add a Home/Settings family-member administration entry and handle an empty roster.
5. Add additional-list creation and archived-list restore.
6. Add shopping-item label editing.
7. Implement a real iCal file upload.
8. Label backup scope precisely or include the omitted domains.

### P2 — Product clarity

1. Define goal progress semantics and expose a correction/audit path.
2. Add URL routes/back/deep links.
3. Add household time-zone and weather-location settings.
4. Add explicit weekly-reset completion/history.
5. Replace or hide the placeholder `Gezinsinstellingen` action.
6. Standardize destructive action wording and confirmations.

### P3 — Optional/future product breadth

1. Dashboard/widget customization.
2. Reminders and notifications.
3. Rewards/redemption if the product intends to go beyond cooperative motivation.
4. Media functionality when it has a defined household use case.

## Direct answers to the examples

### Does every entry type have add/remove/edit?

No.

- Family members: **yes**, but add/remove are poorly discoverable and an empty roster creates a lockout.
- Known people: **yes**.
- Manual agenda events: **yes**, including recurring scopes.
- Shopping lists: rename/archive/delete exist, but creating additional lists and restoring archives do not.
- Shopping items: add/remove/restore exist, but item text cannot be edited.
- Tasks: add/edit/complete exist, but normal delete/archive does not.
- Task routines: apply/archive exist; create/edit is not reliable.
- Family goals: create/edit exist; normal stop/remove and direct progress correction do not.
- Individual goals: create/edit/archive exist; direct progress correction does not.
- Helpful moments: add/view only; no edit/remove.
- Floors and rooms: full lifecycle.
- Climate providers/mappings/configuration: backend capability is broader than the UI; current provider loading is broken.

### Can family members be removed?

Yes:

`Home → family member → Instellingen/Ouderinstellingen → Gezinslid verwijderen`.

The record is soft-deleted and task/motivation references are retained. There is no restore UI.

### Why is House missing from navigation?

Because the workspace model explicitly gives `house` the `internal` navigation role. Only workspaces with role `primary` are rendered in the main navigation. No other user action selects `house`, so the implemented runtime house/climate experience is unreachable.

## Validation record

Performed:

- Live UI walkthrough of every reachable product area and major dialog.
- Live Home, Agenda, Tasks, Shopping, Motivation, Weekly Reset, Settings, member, Known People, Woning, and weather inspection.
- Non-destructive tracing of create/edit forms.
- Read-only API probes for health, family members, tasks, lists, events, event sources, motivation, helpful moments, weekly reset, floors, climate providers, and known people.
- Source-to-API cross-check for every CRUD matrix row.
- Read-only PostgreSQL schema/migration inspection for the Home Assistant runtime failure.
- Browser console warning/error check; no captured browser console warnings or errors were present during the walkthrough.

Not performed:

- No create, update, archive, restore, delete, upload, or heating command was submitted.
- No real iCal feed/file was connected.
- No Home Assistant instance was connected.
- No first-run database reset was performed; onboarding was evaluated from code and tests because the audited household was already onboarded.
- No external device security test or network penetration test was performed.

## Primary implementation evidence

- `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx`
- `src/HomeOps.Client/src/workspaces/workspaceModel.ts`
- `src/HomeOps.Client/src/home/HomeDashboard.tsx`
- `src/HomeOps.Client/src/home/FamilyMemberPage.tsx`
- `src/HomeOps.Client/src/FirstRunWizard.tsx`
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.tsx`
- `src/HomeOps.Client/src/tasks/TasksPage.tsx`
- `src/HomeOps.Client/src/widgets/components/ShoppingListWidget.tsx`
- `src/HomeOps.Client/src/MotivationPage.tsx`
- `src/HomeOps.Client/src/HelpfulMoments.tsx`
- `src/HomeOps.Client/src/weeklyReset/WeeklyResetPage.tsx`
- `src/HomeOps.Client/src/settings/SettingsDashboard.tsx`
- `src/HomeOps.Client/src/settings/WoningManagement.tsx`
- `src/HomeOps.Client/src/settings/HomeAssistantClimateSettings.tsx`
- `src/HomeOps.Client/src/WoningClimatePage.tsx`
- `src/HomeOps.Api/Tasks/TaskEndpoints.cs`
- `src/HomeOps.Api/Lists/ListEndpoints.cs`
- `src/HomeOps.Api/Motivation/MotivationEndpoints.cs`
- `src/HomeOps.Api/Motivation/HelpfulMomentEndpoints.cs`
- `src/HomeOps.Api/WeeklyReset/WeeklyResetEndpoints.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeriesEndpoints.cs`
- `src/HomeOps.Api/CalendarEvents/CalendarPortabilityService.cs`
- `src/HomeOps.Api/FamilyMembers/FamilyMemberEndpoints.cs`
- `src/HomeOps.Api/FloorPlans/ClimateProviderMappingEndpoints.cs`
- `src/HomeOps.Api/Program.cs`
- `docker-compose.yml`
