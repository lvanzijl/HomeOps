# 2026-06-26 Parent Mode UX Analysis

## Executive Summary

Parent Mode currently feels administrative because it is explicitly framed and built as administration: the section label, heading, ARIA label, helper copy, form fields, read-only record panel, destructive button, and Add Family Member entry point all describe household records and management rather than a parent-centered family workflow.

The underlying problem is not only visual polish. Parent Mode mixes at least four responsibilities in one surface: editing the current member, reviewing persisted record data, avatar setup, and household-level member management. Those responsibilities are valid, but the page treats them with equal visual weight, which makes the experience feel like a settings console rather than the family product language used by Home, Motivation, Helpful Moments, and conversational dialogs.

The strongest direction is to keep Parent Mode, but reorganize it around the selected member first. Household-level actions and destructive actions should become secondary and clearly separated. Avatar setup can remain accessible from Parent Mode, but it should be presented as identity/personalization rather than record configuration. Editing basic member details should remain efficient and not be forced into a slow conversational flow.

## Preflight Findings

- Repository instructions require concise reporting, no speculative refactoring, and updates to `docs/state/current-state.md` only after implementation work. This was analysis/report work only, so no current-state or roadmap update is included.
- Static validation command completed: `dotnet --version` returned `10.0.301` with `DOTNET_CLI_HOME=/tmp/dotnet-home`.
- Latest screenshot review identifies Parent Mode as reachable through a family member page mode switch and says it “works, but still feels like administration rather than family product UX.” It also flags Parent Mode among remaining admin/enterprise surfaces and recommends softening it so member management feels like household setup instead of administration.
- No browser was used and no screenshots were created for this analysis.

## Parent Mode Responsibilities

Parent Mode currently handles these responsibilities:

1. **Mode separation for child pages**
   - Children land in Child Mode by default.
   - Parent Mode is available through a tab-like mode switch.
   - A helper line says grown-ups can use Parent Mode for settings.

2. **Current member identity editing**
   - Name.
   - Member type: adult or child.
   - Date of birth.
   - Display color.
   - Derived initials.
   - Save details.

3. **Current member record review**
   - Name.
   - Type.
   - Date of birth.
   - Initials.
   - Color token/value.

4. **Avatar personalization / configuration**
   - Parent Mode has an Edit avatar action.
   - Parent Mode shows avatar status copy.
   - The separate avatar editor modal controls hair, hair color, clothing, clothing color, accessory, accessory color, save, cancel, and reset.

5. **Household-level family member management**
   - Add Family Member is exposed from Parent Mode.
   - The Add Family Member dialog creates a new member with name, type, birth date, color, initials, and default avatar config.

6. **Destructive member removal**
   - Remove member appears in the same action row as Save details.
   - Removal uses a browser confirmation explaining that normal household list membership changes but existing task and motivation references are kept.

7. **Persistence orchestration through the shell**
   - Save, create, and delete operations are owned by `WorkspaceShell`, while `FamilyMemberPage` owns page state and UX for the active member.

These responsibilities have become mixed together. The most significant mixing is that selected-member editing, selected-member status, avatar personalization, add-another-member, and remove-current-member all live in the same Parent Mode block and card grid.

## Information Architecture Review

### Primary task

The likely primary task is **help a grown-up manage the selected family member without exposing administrative controls in Child Mode or Home**.

The current page does not state that primary task clearly. Instead, it states “Administration” and describes “household records, avatar setup, and management details,” which makes the purpose sound like a database maintenance screen.

### Secondary tasks

Secondary tasks are:

- Personalize the selected member’s avatar.
- Review the selected member’s saved details.
- Add another family member.
- Remove the selected member.

### Misplaced or over-prominent items

- **Add Family Member** is household-level, not selected-member-level. It belongs in the broader family management area, not visually paired with “Edit avatar” for the current member.
- **Member details** duplicates the edit form and exposes implementation-oriented values like initials and raw color. It reads as an audit panel rather than something a parent needs during normal use.
- **Remove member** is placed beside Save details, giving a destructive action similar proximity and weight to the main completion action.
- **Avatar status copy** is passive and separated from the actual Edit avatar action, so avatar identity feels like a status record rather than a warm personalization task.

### Logical grouping

Current grouping is technically understandable but product-weak:

- Header actions mix selected-member avatar editing and household member creation.
- The grid mixes edit form, read-only detail record, and avatar status.
- Destructive removal is embedded inside the edit form instead of isolated as a safety/advanced action.

## Family Product Review

Parent Mode differs from the rest of HomeOps in several fundamental ways:

### Language

- Home uses everyday family concepts: Today, Agenda, Shopping, Tasks, family chips, quick add actions.
- Motivation uses emotional language: family goals, appreciation, celebrations, “You helped.”
- Helpful Moments uses warm microcopy: “Turn a helpful moment into a warm thank-you.”
- Parent Mode uses administrative language: “Administration,” “household records,” “management details,” “Family Member record,” and “normal household lists.”

### Layout

- Home is a dashboard with summary cards and light quick-capture dialogs.
- Motivation leads with a family goal story and progress before secondary controls.
- Helpful Moments uses cards and a stepped conversational form.
- Parent Mode uses a record-management grid with forms, a definition list, and management actions.

### Interaction

- Home quick capture and Helpful Moments are guided and contextual.
- Parent Mode is direct CRUD: edit fields, save record, inspect details, remove record, add record.
- Direct editing is appropriate for some parent tasks, but the surrounding copy and hierarchy make it feel like an admin console.

### Density and hierarchy

- Family-facing surfaces emphasize one emotional or practical purpose per area.
- Parent Mode presents many unrelated controls at once and does not visually distinguish current-member care from household administration and destructive maintenance.

## Interaction Analysis

| Interaction | Current feel | Recommended treatment | Rationale |
| --- | --- | --- | --- |
| Switch Child Mode / Parent Mode | Configuration / protected settings | Keep, simplify language | The mode switch is useful, but “settings” reinforces admin framing. |
| Edit name | CRUD | Unchanged or lightly contextual | Fast field editing is appropriate. Do not force a dialog. |
| Edit member type | Administration | Keep but group with basics/safety | This changes how the person appears in the product and should remain explicit. |
| Edit date of birth | Record management | Keep, contextual | Needed for child experience; label could explain why it matters. |
| Edit display color | Configuration | Reorganize under identity/personalization | Color is identity, not a record field in family language. |
| Save details | CRUD | Keep primary within basic-details group | Efficient and expected. |
| Remove member | Destructive administration | Move to separate safety/advanced group | Too close to normal saving today. |
| Browser confirm removal | System/enterprise | Keep efficient, improve context later | A full conversational dialog may slow a rare admin action; a clearer in-product confirmation could improve tone. |
| Add Family Member | Household management | Move or de-emphasize within household section | It is not about the selected member. |
| Edit avatar | Personalization, but presented as setup | Keep, reframe as identity | The task fits family product if framed warmly. |
| Avatar editor save/cancel/reset | Configuration | Simplify/reorganize, not conversational | Many choices make a dialog necessary; the issue is size and grouping, not CRUD alone. |
| Read-only Member details panel | Record inspection | Simplify or remove | Duplicates the edit form and exposes internal-feeling details. |

## Action Hierarchy Review

### Primary action

- **Save details** should be the primary action when the edit form is active.
- If the page is reorganized around identity, **Edit avatar** may be a peer primary action for personalization, but not in the same action cluster as Add Family Member.

### Secondary actions

- Edit avatar.
- Add Family Member.
- Back to Home.
- Cancel/reset inside avatar editor.

### Destructive actions

- Remove member.
- Avatar reset is non-destructive to the household record until saved, but still should be visually secondary.

### Navigation actions

- Back to Home.
- Child Mode / Parent Mode tabs.

### Current mismatch

- Add Family Member and Edit avatar share a header action group even though one is household-level and one is selected-member personalization.
- Remove member is adjacent to Save details, which makes destructive maintenance too prominent.
- Member details receives an entire card despite being mostly duplicative.
- Avatar receives a card but the actual action is in the intro, so status and action are separated.

## Visual Density Findings

- The Parent Mode shell adds a bordered, dashed, gray administration container around cards, reinforcing the settings-console feel.
- The card grid gives “Edit member,” “Member details,” and “Avatar” similar weight, even though only one is the core task.
- The read-only detail list repeats values already available in the form and adds raw implementation-like fields.
- Header actions consume top-level attention before the user has seen the member-specific form.
- Destructive and constructive actions share the same form footer.
- The mode discovery copy plus tab switch adds explanatory overhead at the bottom; useful, but the wording is administrative.
- The avatar editor itself is known from screenshot review to exceed the desktop viewport, which increases perceived heaviness.

## Section-by-Section Classification

| Section | Classification | Why |
| --- | --- | --- |
| Back to Home navigation | Keep | Necessary escape/navigation action and already secondary. |
| Member hero | Keep | Provides family identity continuity and is warmer than the admin area. |
| Child Mode default content | Keep | Strong family-facing contrast; not the source of admin feel. |
| Mode discovery line | Simplify | Useful but “settings” frames Parent Mode as admin. |
| Child/Parent mode switch | Keep | Clear separation between child-facing and grown-up controls. |
| Parent Mode intro | Reorganize | The title/copy define the area as administration and mix multiple jobs. |
| Add Family Member action | Move elsewhere or into Household section | Household-level action is misplaced in selected-member controls. |
| Edit avatar action | Reorganize | Should live with avatar/identity section instead of generic admin intro. |
| Edit member card | Keep / Simplify | The core selected-member management task is valid; labels can be more contextual. |
| Save details action | Keep | Efficient form completion should remain direct. |
| Remove member action | Reorganize | Move away from save into safety/advanced/destructive area. |
| Member details card | Remove or Simplify | Mostly duplicates the edit form and exposes raw record values. |
| Avatar status card | Reorganize | Keep avatar state, but combine status and action as personalization. |
| Avatar editor modal | Simplify | Valuable capability, but too tall and control-heavy. |
| Add Family Member dialog | Simplify | Fields are appropriate, but copy and class reuse make it feel like management/configuration. |

## Top 10 UX Improvements

1. Rename the visible Parent Mode heading from “Administration” to a parent-centered purpose such as “Grown-up settings for Riley” or “Riley’s grown-up controls.”
2. Replace “records,” “management details,” and “Family Member record” language with family/identity language.
3. Make selected-member editing the first and clearest responsibility.
4. Move Add Family Member into a separate Household area or a clearly secondary section.
5. Move Remove member into a Safety or Advanced area, visually separated from Save details.
6. Remove or collapse the Member details read-only card unless there is a specific parent need for it.
7. Put Edit avatar inside the Avatar/identity card so action and status are together.
8. Group display color with avatar/identity rather than treating it like a record field.
9. Reduce the dashed gray administration styling so Parent Mode still belongs to the warm family visual system.
10. Shorten and reorganize the avatar editor so personalization feels playful and fits standard viewport constraints.

## Risks

- Over-conversationalizing Parent Mode could slow high-frequency parent maintenance tasks. Basic detail editing should stay direct.
- Hiding Add Family Member too deeply could make household setup harder. It should move or de-emphasize, not disappear.
- Moving destructive controls must preserve discoverability for legitimate cleanup.
- Removing the read-only Member details panel could remove useful confirmation if save feedback remains minimal.
- Reframing member type and date of birth too softly could obscure important behavior differences between adult and child experiences.

## Recommended Implementation Order

1. **Copy and hierarchy pass**: rename headings, helper copy, and labels to remove record/admin framing without changing behavior.
2. **Action separation pass**: separate Save details, Edit avatar, Add Family Member, and Remove member into distinct hierarchy groups.
3. **Card organization pass**: merge or collapse Member details, combine avatar status with Edit avatar, and make selected-member basics primary.
4. **Destructive action safety pass**: move Remove member into a secondary safety/advanced area with clearer consequence language.
5. **Avatar editor compaction pass**: reduce modal height and regroup choices while keeping direct controls.
6. **Add Family Member dialog tone pass**: keep efficient fields, but align copy and styling with family setup rather than management.

## Next Prompt Context

Parent Mode is not failing because it lacks polish; it fails because its IA and language are administration-first. The next implementation prompt should make one focused slice: reorganize Parent Mode around the selected family member, soften admin copy, separate household-level and destructive actions, and leave CRUD-efficient forms intact. Do not implement new family features. Do not move Add Family Member back onto Home. Treat avatar as identity/personalization, not record setup.
