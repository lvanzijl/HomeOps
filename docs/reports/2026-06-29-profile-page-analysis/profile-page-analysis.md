# FamilyBoard Profile Page Analysis

Date: 2026-06-29
Scope: Current `FamilyMemberPage` / child-facing "Mijn pagina" and adult/member administration surface.
Intent: Understand the existing implementation before any redesign decisions.

## Executive Summary

The current "Mijn pagina" surface is implemented as the FamilyBoard Family Member detail page. It is not a separate authenticated profile route, user account page, or permission boundary. The page is opened from the Home family strip when a family member chip is selected, then rendered inside the existing workspace shell while the main navigation remains visible.

For a child member, the page defaults to Kindmodus and combines identity, today's assigned tasks, personal goal progress, family goal participation, appreciation, celebration memories, and a parent-only administration mode behind a UI tab switch. For an adult member, the page skips child mode and shows appreciation plus parent administration directly.

The page is a real, API-backed composite. It reads and updates Family Member data, reads Tasks, reads Motivation snapshot data, reads Helpful Moments, and persists Avatar V2 configuration through the Family Member API. However, it also reflects important MVP constraints: Family Members are presentation entities, not authenticated users; Parent Mode is a visual mode, not access control; there is no page-specific backend read model; several pieces of copy remain mixed Dutch/English; and some secondary content is either duplicated or hidden behind disclosure controls.

The strongest current value of the page is personal recognition: a child can see their avatar, name, tasks, progress, appreciation, and how they contribute to a family goal. The strongest technical constraint for redesign is that the underlying model is a household member record, not a profile/account model.

## Purpose of the Page

The current page serves three overlapping purposes:

1. **Personal identity surface**
   It shows the selected family member's avatar, name, age context, and display color. This makes the app feel personal and lets a child recognize "this is my space."

2. **Child-facing daily and motivational dashboard**
   For child members, the page shows what the child can do today, progress toward individual or family goals, appreciation, and family celebration context.

3. **Parent-facing family member administration**
   Parents can edit the member's name, type, birthday, display color, and avatar, add another family member, or remove the member from the household list.

The page is therefore more than a profile card. It is a hybrid of child dashboard, motivation surface, and household member settings. That hybrid nature is intentional in the current implementation but creates constraints for any future redesign.

## Current Page Structure

### Shell and Navigation Context

The page is rendered inside `WorkspaceShell`. The shell keeps the FamilyBoard navigation visible and uses `activeFamilyMemberId` to decide whether to render the Home dashboard or a selected `FamilyMemberPage`.

The selected member page uses the Home domain color class rather than becoming its own primary workspace. This reinforces that family member pages are reached from Home and are part of the household dashboard flow rather than a separate application area.

### Back Navigation

A compact header navigation row contains a `Terug` button with the arrow-back icon. It calls the `onBack` callback from `WorkspaceShell`, clearing the selected family member and returning the user to Home.

This exists because there is no route stack or browser-level profile route. The page is a stateful subview inside the workspace shell, so the explicit back control is the primary way out of the member page.

### Identity Header

The identity header contains:

- Large Family Avatar.
- Eyebrow label: `Mijn pagina` for children, `Gezinslid` for adults.
- Member name.
- Age/member context line.
- `Avatar bewerken` action.

The header is the page's identity anchor. It depends entirely on the selected `FamilyMember` object: `name`, `memberKind`, `dateOfBirth`, `displayColor`, `initials`, and `avatarV2Config`.

### Child Mode Wrapper

For child members, the page renders a `member-mode-shell` containing:

- A tab-style switch between `Kindmodus` and `Oudermodus`.
- Child mode content when `activeMode === "child"`.
- Parent administration content when `activeMode === "parent"`.
- A discovery note saying adults can use parent mode for settings.

The switch exists to separate child-facing content from settings content. It does not enforce security.

### Child Mode Content

Child mode renders, in order:

1. Today task section.
2. Child hero/progress area.
3. Compact helpful moments/appreciation section.
4. Disclosure for personal progress.
5. Disclosure for family goal details.
6. Disclosure for celebration memories.

This structure puts daily action and progress before detailed history.

### Adult Member Content

Adult members do not get the child/parent mode switch. They render:

1. Helpful moments/appreciation section.
2. Parent administration.

This reflects the current product assumption that the child-facing progress dashboard is for child members only.

### Avatar Editor Modal

When avatar editing is active, `FamilyAvatarEditor` is rendered as a modal overlay. It is accessible from the identity header and from the parent administration identity card.

## Component Inventory

### Workspace Shell

- **Component:** `WorkspaceShell`.
- **What it does:** Owns active workspace, active family member, family member loading, add/update/delete callbacks, and rendering of `FamilyMemberPage`.
- **Why it exists:** Provides the shared FamilyBoard shell and keeps member pages integrated with Home.
- **Implemented or placeholder:** Implemented.
- **Belongs on this page:** It is not part of the page content, but it is required for the page to exist.
- **Data dependencies:** Family Member API, onboarding status, workspace layout API.
- **Importance:** Critical. Without it, the profile page has no entry point or persistence wiring.

### Home Family Strip Entry Point

- **Component:** Family strip inside `HomeDashboard`.
- **What it does:** Shows clickable family chips with avatar and name; selecting one opens the member page.
- **Why it exists:** Provides a household-first path into individual member context.
- **Implemented or placeholder:** Implemented.
- **Belongs on this page:** It is the upstream entry point, not visible after selection except through shell navigation.
- **Data dependencies:** Loaded family members.
- **Importance:** Critical for discoverability.

### Back Button

- **Component:** `FamilyMemberPage` header nav.
- **What it does:** Returns from the member page to Home.
- **Why it exists:** The page is a stateful subview, so users need a clear escape path.
- **Implemented or placeholder:** Implemented.
- **Belongs on this page:** Yes.
- **Data dependencies:** None.
- **Importance:** High.

### Identity Header / Profile Card

- **Component:** Top-level header in `FamilyMemberPage`.
- **What it does:** Shows avatar, page label, name, age/context text, and avatar edit action.
- **Why it exists:** Establishes identity and personal ownership of the page.
- **Implemented or placeholder:** Implemented.
- **Belongs on this page:** Yes.
- **Data dependencies:** Family Member model.
- **Importance:** Critical.

### Family Avatar

- **Component:** `FamilyAvatar`.
- **What it does:** Renders Avatar V2 SVG if the configuration is complete and valid; otherwise renders initials fallback.
- **Why it exists:** Provides recognizable visual identity throughout Home, profile, and Motivation surfaces.
- **Implemented or placeholder:** Implemented.
- **Belongs on this page:** Yes.
- **Data dependencies:** `avatarV2Config`, `displayColor`, `initials`, `name`.
- **Importance:** Critical for emotional/personal recognition.

### Avatar Edit Button

- **Component:** Button inside identity header and parent identity card.
- **What it does:** Opens the Avatar Editor modal.
- **Why it exists:** Lets parents update the member's visual identity.
- **Implemented or placeholder:** Implemented.
- **Belongs on this page:** Yes, though it appears twice.
- **Data dependencies:** Selected `FamilyMember`.
- **Importance:** Medium-high. Important for setup and personalization, less important for daily use.

### Avatar Editor Modal

- **Component:** `FamilyAvatarEditor`.
- **What it does:** Provides live avatar preview, hair choices, hair color, clothing, clothing color, accessory, accessory color, save, cancel, and reset.
- **Why it exists:** Avatar V2 is the current personalization system for Family Members.
- **Implemented or placeholder:** Implemented.
- **Belongs on this page:** Yes for administration/personalization, but it is modal and not part of daily child use.
- **Data dependencies:** `FamilyMember.avatarV2Config`, Avatar V2 renderer/configuration utilities, parent `onChange` callback.
- **Importance:** Medium-high.

### Child / Parent Mode Switch

- **Component:** Mode switch inside `FamilyMemberPage`.
- **What it does:** Toggles between child-facing content and parent administration for child members.
- **Why it exists:** Keeps child view simpler while retaining settings access.
- **Implemented or placeholder:** Implemented as UI state.
- **Belongs on this page:** Yes under the current combined child/admin page design.
- **Data dependencies:** `member.memberKind`, local `activeMode` state.
- **Importance:** High for child pages.

### Today Task Card

- **Component:** `TodaySection`.
- **What it does:** Shows up to three active tasks assigned to the selected child and summarizes today's due/overdue workload.
- **Why it exists:** Gives the child a practical daily action prompt.
- **Implemented or placeholder:** Implemented read-only.
- **Belongs on this page:** Yes if the page is meant to be a child daily dashboard.
- **Data dependencies:** `/api/tasks`, `HouseholdTask`, selected `member.id`, current date.
- **Importance:** High for daily usefulness.

### Child Hero / Progress Area

- **Component:** `ChildHeroArea`.
- **What it does:** Shows child identity, active personal or family goal, progress percentage, remaining effort, progress bar, and a family goal aside.
- **Why it exists:** Makes goal progress emotionally visible and child-friendly.
- **Implemented or placeholder:** Implemented read-only.
- **Belongs on this page:** Yes for the current motivation-focused child page.
- **Data dependencies:** Motivation snapshot, selected member, family goal, individual goals, display color.
- **Importance:** High.

### Family Goal Aside

- **Component:** Part of `ChildHeroArea`.
- **What it does:** Shows the active family goal title, current/target progress, unit label, and celebration cue if present.
- **Why it exists:** Connects the child's page to family-wide progress.
- **Implemented or placeholder:** Implemented read-only.
- **Belongs on this page:** Yes, but it duplicates some content from the detailed family-goal disclosure.
- **Data dependencies:** `MotivationFamilyGoal`, `FamilyCelebrationStatus`.
- **Importance:** Medium-high.

### Helpful Moments Section

- **Component:** `HelpfulMomentsSection`.
- **What it does:** Loads and displays appreciation/helpful moments for the selected family member. In child mode it is compact and titled `Nieuwste waardering`; for adults it is titled `Wat mijn gezin waardeert`.
- **Why it exists:** Provides emotional recognition and reinforces helpful behavior.
- **Implemented or placeholder:** Implemented. Creation exists in the component but is not enabled from this page because `showCreate` is not passed.
- **Belongs on this page:** Yes, especially for child motivation and family warmth.
- **Data dependencies:** `/api/helpful-moments`, selected `familyMemberId`, `HelpfulMoment` data.
- **Importance:** Medium-high.

### Personal Progress Disclosure

- **Component:** `IndividualGoalProgress` inside a details disclosure.
- **What it does:** Shows personal goals with star rows, progress bars for school-age children, and remaining effort.
- **Why it exists:** Provides more detailed goal progress without crowding the top of the page.
- **Implemented or placeholder:** Implemented read-only.
- **Belongs on this page:** Yes, but as secondary content.
- **Data dependencies:** Filtered individual goals from motivation snapshot.
- **Importance:** Medium.

### Family Goal Disclosure

- **Component:** `FamilyGoalParticipation` inside a details disclosure.
- **What it does:** Shows detailed family goal progress, remaining effort, and optional celebration card.
- **Why it exists:** Lets the child understand their contribution to a shared family goal.
- **Implemented or placeholder:** Implemented read-only.
- **Belongs on this page:** Yes, though it repeats family goal information from the hero aside.
- **Data dependencies:** `MotivationFamilyGoal`, motivation loading status.
- **Importance:** Medium.

### Celebration Card

- **Component:** `FamilyCelebrationCard`.
- **What it does:** Shows celebration status and detail for a family goal celebration.
- **Why it exists:** Creates anticipation and emotional payoff for shared progress.
- **Implemented or placeholder:** Implemented read-only.
- **Belongs on this page:** Yes as secondary motivation context.
- **Data dependencies:** Family goal celebration title, description, status, progress.
- **Importance:** Medium.

### Celebration Memories Disclosure

- **Component:** `ChildCelebrationMemories` inside a details disclosure.
- **What it does:** Shows up to three recent family celebration memories if any exist.
- **Why it exists:** Reinforces history and family achievement.
- **Implemented or placeholder:** Partially implemented. The child memory component returns nothing when there are no memories, while the disclosure still exists.
- **Belongs on this page:** Possibly; it supports motivation but is secondary and history-oriented.
- **Data dependencies:** `MotivationSnapshot.celebrationMemories`.
- **Importance:** Low-medium.

### Parent Administration Section

- **Component:** `ParentAdministration`.
- **What it does:** Provides parent-facing controls for identity, basic personal data, household add action, and remove action.
- **Why it exists:** Family Members currently need an in-app place for editing because there is no separate user/profile/settings system.
- **Implemented or placeholder:** Implemented.
- **Belongs on this page:** It belongs under current MVP constraints, but it mixes administration with the child-facing page.
- **Data dependencies:** `FamilyMember` draft state, shell save/delete/create callbacks.
- **Importance:** High for setup/maintenance; lower for daily child use.

### Parent Identity Card

- **Component:** Part of `ParentAdministration`.
- **What it does:** Shows avatar preview, avatar edit button, explanatory text about where the avatar appears, and display color picker.
- **Why it exists:** Manages visual identity.
- **Implemented or placeholder:** Implemented.
- **Belongs on this page:** Yes for parent/admin mode.
- **Data dependencies:** Family Member draft, avatar config, display color.
- **Importance:** Medium-high.

### Basic Information Card

- **Component:** Part of `ParentAdministration`.
- **What it does:** Edits name, adult/child type, and birthday; saves via `submit`.
- **Why it exists:** Maintains minimal member metadata.
- **Implemented or placeholder:** Implemented.
- **Belongs on this page:** Yes for parent/admin mode.
- **Data dependencies:** Family Member draft; Family Member API update.
- **Importance:** High for maintenance, low for daily use.

### Add Family Member Card

- **Component:** Part of `ParentAdministration`, calls shell `onAddFamilyMember`.
- **What it does:** Opens the add-family-member dialog.
- **Why it exists:** Allows household roster management from the family member context.
- **Implemented or placeholder:** Implemented.
- **Belongs on this page:** Debatable; it is household administration rather than selected-member content.
- **Data dependencies:** Family Member create API through `WorkspaceShell`.
- **Importance:** Medium for setup, low for daily use.

### Remove Family Member Card

- **Component:** Part of `ParentAdministration`.
- **What it does:** Confirms and soft-deletes the member from the household list.
- **Why it exists:** Supports household roster maintenance.
- **Implemented or placeholder:** Implemented.
- **Belongs on this page:** Yes for selected-member administration, though it is a destructive/rare action.
- **Data dependencies:** Family Member delete API through `WorkspaceShell`.
- **Importance:** Medium for administration, low for daily use.

### Add Family Member Dialog

- **Component:** `AddFamilyMemberDialog` in `WorkspaceShell`.
- **What it does:** Captures name, type, birthday, display color, and creates a new member.
- **Why it exists:** Onboarding is not the only place to add household members.
- **Implemented or placeholder:** Implemented.
- **Belongs on this page:** It is invoked from parent mode but is a household-level dialog.
- **Data dependencies:** Family Member create API, Avatar V2 default configuration.
- **Importance:** Medium during setup.

## User Journeys Supported

### Journey 1: Open a Child Page from Home

1. User sees family chips on Home.
2. User selects a child chip.
3. `WorkspaceShell` sets `activeFamilyMemberId`.
4. `FamilyMemberPage` renders for that child.
5. Child mode is selected by default.

This journey is fully implemented.

### Journey 2: Child Checks What to Do Today

1. Child opens their page.
2. The Today card loads tasks from `/api/tasks`.
3. The card filters active assigned tasks for the selected child.
4. The child sees up to three tasks and due-date phrasing.

This is implemented as a read-only journey. Completing tasks is not supported on this page.

### Journey 3: Child Checks Progress

1. Child sees top progress in the hero area.
2. The page loads `/api/motivation`.
3. The hero chooses the first individual goal for the child, falling back to the family goal.
4. The child can open progress disclosures for details.

This is implemented as read-only motivation consumption.

### Journey 4: Child Sees Appreciation

1. The page renders compact `HelpfulMomentsSection` for the selected child.
2. The component loads helpful moments filtered by `familyMemberId`.
3. The child sees recent appreciation and can expand the compact view.

This is implemented. Creating appreciation from this page is not enabled.

### Journey 5: Parent Edits Child Information

1. Parent opens a child page.
2. Parent switches from Kindmodus to Oudermodus.
3. Parent edits avatar/display color/name/member type/birthday.
4. Parent saves data.
5. `WorkspaceShell` updates local member state and then persists via API.

This is implemented, but save failure handling is limited.

### Journey 6: Parent Edits Avatar

1. Parent clicks `Avatar bewerken` from the header or parent identity card.
2. Avatar Editor opens.
3. Parent changes avatar attributes.
4. Parent saves.
5. The updated member is persisted through the Family Member update flow.

This is implemented.

### Journey 7: Parent Adds a Family Member

1. Parent uses `Gezinslid toevoegen` in parent administration.
2. Add dialog opens.
3. Parent enters minimal member data.
4. API creates the member.
5. Shell selects the newly created member.

This is implemented.

### Journey 8: Parent Removes a Family Member

1. Parent clicks remove.
2. Browser confirm appears.
3. If confirmed, API soft-deletes the member.
4. Shell removes the member locally and returns to Home.

This is implemented. The warning notes existing task and motivation references remain.

## Data Sources and API Endpoints

### Family Member Data

Frontend source:

- `familyMembersApi.ts` wraps generated `HomeOpsApiClient`.
- `loadFamilyMembers` calls `getFamilyMembers`.
- `saveFamilyMember` calls `updateFamilyMember`.
- `createFamilyMember` calls `createFamilyMember`.
- `removeFamilyMember` calls `deleteFamilyMember`.

Backend endpoints:

- `GET /api/family-members`
- `GET /api/family-members/{memberId}`
- `POST /api/family-members`
- `PUT /api/family-members/{memberId}`
- `DELETE /api/family-members/{memberId}`

Data displayed:

- Name.
- Display color.
- Initials fallback.
- Member kind.
- Date of birth / age context.
- Avatar V2 configuration.

### Task Data

Frontend source:

- `loadTasks()` in `tasksApi.ts` fetches `/api/tasks`.

Data displayed:

- Active tasks assigned to this member.
- Task title.
- Friendly due-date text.
- Count of due/overdue tasks.

Filtering is performed client-side in `TodaySection`.

### Motivation Data

Frontend source:

- `loadMotivationSnapshot()` calls generated client `getMotivationSnapshot()`.

Backend endpoint:

- `GET /api/motivation`

Data displayed:

- Active family goal.
- Active individual goals.
- Celebration status/title/description.
- Celebration memories.

Member-specific individual goals are derived by filtering snapshot goals by selected member ID.

### Helpful Moments Data

Frontend source:

- `HelpfulMomentsSection` calls `loadHelpfulMoments(familyMemberId, 8)`.

Backend endpoint:

- `GET /api/helpful-moments?familyMemberId={id}&limit=8`

Data displayed:

- Helpful moment title.
- Description where present.
- Recognition tag.
- Created timestamp where used by the section.
- Member display metadata where needed.

### Avatar Data

Avatar V2 data is stored as part of Family Member data, not a separate avatar endpoint. The editor changes the family member's `avatarV2Config` and persists through the Family Member update endpoint.

## Backend / Domain Model Dependencies

### Family Member Domain

`FamilyMember` is the central backend entity for this page. It includes:

- `Id`
- `HouseholdId`
- `Name`
- `DisplayColor`
- `Initials`
- `MemberKind`
- `DateOfBirth`
- soft-delete fields
- created/updated timestamps
- `AvatarV2Config`

This entity is explicitly lightweight. It is not a user account or authentication profile.

### Household Dependency

Family Member API queries are scoped to `SeedHousehold.Id`. This means the current system assumes one seeded household rather than multi-household user ownership.

### Motivation Domain

The page depends on:

- active family goal;
- active individual goals;
- celebration status;
- celebration memories;
- helpful moments.

Individual goals are tied to `FamilyMemberId`. Helpful moments are also tied to `FamilyMemberId`.

### Task Domain

The page depends on `HouseholdTask` ownership fields:

- `ownershipKind`
- `familyMemberId`
- `isCompleted`
- no-date review state
- `dueDate`
- `createdUtc`

The page uses those fields to derive the child-specific Today list.

### Avatar V2 Domain

Avatar V2 configuration is embedded in Family Member persistence. The frontend renderer requires a complete valid config before rendering SVG; otherwise it falls back to initials.

## Information Hierarchy

### What the User Sees First

The first visible layers are:

1. Global FamilyBoard navigation.
2. Back action.
3. Identity header with avatar, member name, and context.
4. For children, mode switch and child dashboard content.

This hierarchy says: "You are still in FamilyBoard, but you are looking at this person's space."

### Highest Visual Priority

The identity header and child progress area receive the strongest semantic priority. The avatar and name make the page personal; the progress area makes it motivational.

### Secondary Content

Detailed personal progress, family goal participation, and memories are hidden behind disclosures. This lowers initial density but reduces immediate visibility for some implemented data.

### Below-the-Fold Risk

Depending on viewport height, parent administration, detailed progress, family goal details, and memories are likely below the fold or collapsed. The page front-loads identity and child-friendly daily/motivation content.

### Primary Purpose Implied by Layout

For child members, the layout implies the primary purpose is: "What can I do, and how am I doing?"
For adults, the layout implies: "What is appreciated, and how can this member record be managed?"

Those are different purposes, which explains some of the page's current complexity.

## UX Observations

### Essential Elements

- Back button.
- Avatar/name identity header.
- Child/parent mode switch for children.
- Today task card.
- Progress hero.
- Parent administration form.

### Emotional / Decorative Elements

- Avatar artwork.
- Child/family/progress icons.
- Star rows.
- Celebration and memory icons.

These elements are not purely decorative because they support child recognition and emotional motivation, but they are not required for data entry.

### Actionable Elements

- Back.
- Avatar edit.
- Child/parent mode tabs.
- Helpful moments expand/collapse.
- Disclosure summaries.
- Save member data.
- Add family member.
- Remove family member.
- Avatar editor save/cancel/reset.

### Read-Only Elements

- Today task list is read-only.
- Goal progress is read-only.
- Family goal status is read-only.
- Celebration memories are read-only.
- Helpful moments are read-only on this page because creation is disabled here.

### Redundancy

- Avatar editing appears in two places.
- Avatar appears in both the identity header and child hero identity area.
- Family goal information appears in both the hero aside and the detailed disclosure.

### Belonging and Page Fit

The child-facing sections belong if the page is understood as a child dashboard. The parent settings sections belong if the page is understood as a family-member administration surface. The current implementation supports both, but that dual role creates a heavier experience than a simple profile page.

## UI Observations

### Typography and Labels

The page uses common FamilyBoard patterns such as eyebrow labels, section headings, cards, compact actions, and friendly Dutch copy. However, some English text remains visible:

- `Name`
- `active taak/taken`
- `Family goal`
- `No family goal yet`
- `Only X more`
- `No personal goal right now`

This is inconsistent with the current Dutch localization direction.

### Cards and Density

The page uses card-style sections throughout. This matches the rest of FamilyBoard, but the number of card concepts is high: identity, today, hero, helpful moments, progress, family goal, memories, parent identity, basic info, household, safety.

### Navigation

The compact back button is consistent with the documented recent cleanup. The global nav remains persistent, matching the application shell.

### Iconography

The page uses `HomeOpsIcon` assets for back, child sections, progress, family participation, celebration, memory, add, completed markers, and close actions. This aligns with the broader FamilyBoard icon system, though some icons carry emotional/illustrative weight rather than pure navigation meaning.

### Empty States

Empty/loading/error states exist for:

- motivation loading/error;
- task loading/error/no tasks;
- missing family goal;
- missing personal goals;
- helpful moments loading/error through the shared component.

The memory disclosure is weaker because the child memory content returns `null` when no memories exist, while the disclosure summary still exists.

## Technical Observations

### State Management

The implementation uses local React state rather than a global store:

- Shell state for active workspace/member and loaded members.
- Page state for active mode, draft member, status messages, tasks, motivation, and avatar editor visibility.
- Component state for helpful moments expansion and avatar editor draft configuration.

This is simple and appropriate for the current MVP, but it means cross-domain data is coordinated manually at the page level.

### API Composition

The page composes multiple independent APIs:

- Family Members.
- Tasks.
- Motivation.
- Helpful Moments.

There is no dedicated profile summary endpoint. The frontend is responsible for loading broad datasets and filtering them to the selected member.

### Optimistic Updates and Error Handling

Family member updates are applied to local state before the API response returns. If the save fails, the catch block does not surface an error to the user. Add and delete flows also swallow errors. This keeps the UI simple but limits reliability feedback.

### Parent Mode Is Not Security

The child/parent mode switch is local UI state. Because there is no authentication or permissions model, it should not be understood as access control.

### Avatar Rendering Boundary

`FamilyAvatar` only renders Avatar V2 if the config is complete and valid. This gives a robust fallback path, but any redesign must preserve the initials fallback unless the data guarantees change.

### Date and Age Handling

Age is calculated client-side from `dateOfBirth`, using UTC dates. Children without a birthday get generic copy. Children age five or under are treated as `early-child`; older children are `school-age`.

### Visual Review Time

The page uses `useVisualReviewNow()` so visual review fixtures can stabilize date-dependent output. This matters for screenshot/review workflows.

## Consistency with the Rest of FamilyBoard

### Home

The page is highly consistent with Home because it is opened from Home's family strip and reuses Family Avatar identity. Home is the launch point and the member page is a contextual expansion of the family strip.

### Agenda

The page is shell-consistent with Agenda through the shared navigation and workspace structure. It does not currently consume or display Agenda events.

### Tasks

The page is data-consistent with Tasks because it shows assigned tasks. It is not behavior-consistent with Tasks because task completion/editing is not available here.

### Shopping

The page has no direct Shopping integration. Shopping remains present only through global navigation.

### Motivation

The page is strongly consistent with Motivation. It uses individual goals, family goals, celebration status, celebration memories, and helpful moments. The page effectively acts as a member-specific Motivation read surface.

### Settings

Parent administration overlaps conceptually with Settings, but it lives on the member page because the current app does not have a deeper household/user settings architecture. This is consistent with current MVP constraints but creates IA ambiguity.

### Overall FamilyBoard Patterns

Consistent patterns:

- Workspace shell.
- Rounded cards.
- Eyebrow labels.
- Compact actions.
- Friendly copy.
- Member display color.
- Avatar V2.
- Icon-based emotional cues.

Inconsistent or weaker patterns:

- Mixed Dutch/English copy.
- Parent settings embedded in a child-facing page.
- Some duplicate information across hero and disclosures.

## Placeholder or Unfinished Functionality

### Not a Real User Profile

Despite the page feeling profile-like, Family Members are not accounts, users, roles, profiles, or permission-bearing identities.

### Parent Mode Is Presentation Only

Oudermodus is not protected. It is a UI organization tool only.

### Read-Only Child Tasks

The page shows tasks but does not allow completion, editing, or direct task interaction.

### Read-Only Motivation

The page shows progress but does not create, edit, archive, or mark goals. Those flows are elsewhere.

### Helpful Moment Creation Disabled Here

`HelpfulMomentsSection` can support creation, but this page does not enable `showCreate`, so appreciation is display-only here.

### Memories Empty State

The memories disclosure can be present even when the content component returns nothing.

### Localization Incomplete

Several visible strings remain English or mixed-language.

### No Page-Specific API

The page uses multiple general APIs and filters client-side. This is complete enough for MVP but not a dedicated profile-page backend contract.

### Future Domains Not Integrated

The page does not integrate Agenda, Shopping, House Status, Media, authentication, notifications, reminders, gamification/points, or Google Calendar.

## Technical Constraints Affecting a Future Redesign

### Family Member Model Boundary

The most important constraint is that the entity is a Family Member presentation record, not a user profile. A redesign cannot assume login identity, permissions, private data, profile ownership, or child account behavior without backend changes.

### Existing API Contracts

Family Member data is persisted through existing create/update/delete DTOs. Avatar V2 is embedded in Family Member data. Motivation and tasks are separate APIs. Any redesign that changes what appears on the page must either reuse this composition or introduce a new backend contract.

### Single Household Assumption

The backend scopes current data to a seeded household. Multi-household or user-specific assumptions are not available.

### Soft Deletion and Historical References

Removing a family member soft-deletes the member but existing task and motivation references remain. Future designs must account for historical references and deleted members.

### Client-Side Filtering

Tasks and motivation goals are filtered client-side for the selected member. If a redesign needs richer sorting, prioritization, or summary calculations, those would currently be frontend responsibilities unless new API support is added.

### Shared Avatar System

Avatar V2 is shared across Home, this page, and Motivation. A redesign must preserve the shared renderer and fallback behavior unless changing the avatar system explicitly.

### Shared Shell and Navigation

The page is not an independent route. It is a shell subview controlled by `activeFamilyMemberId`. A redesign that assumes route-level navigation, breadcrumbs, deep links, or browser history would need routing changes.

### Current MVP Scope Boundaries

Existing project state explicitly excludes authentication, profiles, ownership logic, notifications, reminders, Google Calendar, gamification, house status, and media functionality from the current implemented scope. Any redesign relying on those would exceed current technical support.

## High-Level Redesign Opportunities

These are opportunity areas only. They are not proposed layouts or solutions.

1. Clarify whether the page is primarily a child dashboard, member profile, or administration page.
2. Clarify which content is daily-use versus setup/maintenance-use.
3. Reduce conceptual duplication between identity header, child hero identity, family goal aside, and family goal details.
4. Review whether household-level actions belong inside an individual member page.
5. Improve Dutch copy consistency and remove remaining English strings.
6. Decide whether task information should stay read-only or become actionable.
7. Decide how much Motivation content belongs on this member page versus the Motivation workspace.
8. Improve empty states, especially for celebration memories.
9. Consider whether a page-specific read model would improve reliability and reduce frontend filtering.
10. Preserve the important product constraint that Family Members are household presentation entities, not accounts.

## Evidence Reviewed

The analysis reviewed the following implementation areas:

- `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx`
- `src/HomeOps.Client/src/workspaces/workspaceModel.ts`
- `src/HomeOps.Client/src/home/HomeDashboard.tsx`
- `src/HomeOps.Client/src/home/FamilyMemberPage.tsx`
- `src/HomeOps.Client/src/home/FamilyAvatar.tsx`
- `src/HomeOps.Client/src/home/FamilyAvatarEditor.tsx`
- `src/HomeOps.Client/src/home/familyMembers.ts`
- `src/HomeOps.Client/src/home/familyMembersApi.ts`
- `src/HomeOps.Client/src/HelpfulMoments.tsx`
- `src/HomeOps.Client/src/helpfulMomentsData.ts`
- `src/HomeOps.Client/src/motivationData.ts`
- `src/HomeOps.Client/src/tasks/tasksApi.ts`
- `src/HomeOps.Api/FamilyMembers/FamilyMember.cs`
- `src/HomeOps.Api/FamilyMembers/FamilyMemberEndpoints.cs`
- `src/HomeOps.Api/Motivation/MotivationEndpoints.cs`
- `src/HomeOps.Api/Motivation/HelpfulMomentEndpoints.cs`
- `docs/state/current-state.md`
