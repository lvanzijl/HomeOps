# Executive Summary

Oversized primary actions are not an isolated button-sizing defect. The audit found a systemic UX hierarchy pattern in which setup, navigation, and management actions sometimes occupy the same high-attention space as dashboard or page content.

The most visible issue is Home, where the apparent gigantic Add action is the Add Family Member control rendered as a family chip inside the Home hero. This is not merely too large; it is a household management action placed in the dashboard hero, which makes setup feel like a primary daily Home action.

A second pattern appears on Family Member detail pages, where Back to Home is rendered as page content before the member hero. That makes navigation compete with the page itself. Tasks also shows a related hierarchy issue: several unrelated actions are grouped together as large primary actions even though only Add family task is truly primary.

The issue is therefore best understood as an information architecture problem: utility and management actions are leaking into hero or primary page areas. The recommended response is relocation, removal of duplicate actions, and conversion of several controls to compact header actions, not arbitrary resizing.

# Home Hero Investigation

## What the gigantic Home hero action actually is

The gigantic Home hero action is the Add Family Member control. Visually it appears as an Add chip in the Home hero family strip, but its accessible label and callback identify it as Add Family Member.

## What component renders it

It is rendered by `HomeDashboard` inside the `home-hero` header as a `button` with classes `family-chip add-family-chip`.

`WorkspaceShell` passes `onAddFamilyMember={() => setIsAddingMember(true)}` into `HomeDashboard`. When activated, `WorkspaceShell` renders `AddFamilyMemberDialog`.

## What it does

The action opens the Add Family Member dialog. Submitting the dialog creates a family member, adds it to the local member list, selects the new member page, and closes the dialog.

## Why it is so visually dominant

The Add control is visually dominant because it inherits the same chip pattern as family member identity chips and lives inside the Home hero. It is placed in the `family-strip`, alongside member chips, and styled as a pill-like family chip with strong text, border, icon, and minimum height. The dashed `add-family-chip` treatment further calls attention to it.

This means the Add Family Member action is not simply a large button. It is being promoted into the Home hero’s identity/navigation area.

## Whether it belongs on Home at all

The capability belongs somewhere in the product, but the action does not belong as a hero-level Home control. Home can function without it because the dashboard summaries, family member navigation, quick capture dialogs, and daily status content do not depend on the Add chip.

The action appears to be post-onboarding household management rather than onboarding itself. The application already has a first-run wizard for initial adult/child setup, so keeping Add Family Member in the Home hero mixes ongoing dashboard use with household administration.

Recommendation: relocate Add Family Member to a compact Home header action, a household settings area, or a dedicated family member management surface.

# Oversized Action Inventory

| Page | Action | Purpose | Approximate visual prominence | Classification |
| --- | --- | --- | --- | --- |
| Home | Add / Add Family Member | Opens Add Family Member dialog | High: hero chip in family strip | Relocate |
| Home | Family member chips | Opens individual family member pages | Moderate/high: hero identity navigation | Keep |
| Family Member | Back to Home | Returns from member detail to Home | High: content button before hero | Convert to header action |
| Family Member | Child Mode / Parent Mode | Switches between child-facing and parent admin views | Moderate: tab-like mode switch | Keep |
| Parent Mode | Edit avatar | Opens avatar editor for member | Moderate: management action in admin surface | Reduce / contextualize |
| Parent Mode | Save details | Saves member details | Moderate: form primary action | Keep |
| Parent Mode | Remove/delete member action | Removes or requests removal of member | Moderate/high by risk, not hero-level | Keep with caution |
| Tasks | Add family task | Opens task creation dialog | High: first large primary action in action row | Convert to header action |
| Tasks | Routine starters | Toggles task templates panel | Medium/high: peer to primary actions | Reduce |
| Tasks | Plan the week | Toggles weekly reset planning panel | Medium/high: peer to task creation | Relocate |
| Tasks | Open family reset | Navigates to Weekly Reset workspace | Medium/high and duplicative | Remove or relocate |
| Tasks empty state | Add a family task | Starts first task when there are no tasks | High but contextual | Keep |
| Task dialog | Back | Moves to previous task dialog question | Dialog-local | Keep |
| Task dialog | Continue | Moves to next task dialog question | Dialog-local | Keep |
| Task dialog | Create task / Save task | Submits task dialog | Dialog-local primary | Keep |
| Agenda | Add household event | Opens event dialog | Low/moderate: compact action under widget header | Convert to header action |
| Agenda empty state | Start with one household event | Starts first event when there are no events | High but contextual | Keep |
| Agenda dialog | Back | Moves to previous event dialog question | Dialog-local | Keep |
| Agenda dialog | Continue | Moves to next event dialog question | Dialog-local | Keep |
| Agenda dialog | Create event / Save event | Submits event dialog | Dialog-local primary | Keep |
| Shopping | Add | Adds shopping item from top input | Moderate: core input action | Keep |
| Shopping empty state | Create Shopping list / Start by adding one item | Creates or starts first list item | High but contextual | Keep |
| Shopping list settings | Rename / Archive / Delete | Manages list metadata/lifecycle | Low: hidden in details | Keep |
| Motivation | Create family goal | Opens family goal creation dialog | High but contextual empty-state CTA | Keep |
| Motivation | Edit family goal | Opens family goal edit dialog | Moderate inside active goal card | Reduce / contextualize |
| Motivation | Manage personal goals | Expands personal-goal management view | Moderate in section heading | Reduce |
| Motivation | Add personal goal | Opens personal-goal dialog | Moderate in section heading | Convert to section/header action |
| Weekly Reset | Skip this week | Skips weekly reset view | Moderate/high: hero-level secondary action | Relocate / reduce |
| Weekly Reset skipped state | Open family reset again | Reopens skipped reset | Contextual recovery action | Keep |
| Settings | Export calendar | Exports calendar data | Moderate inside admin widget | Keep |
| Settings | Restore calendar data | Performs gated destructive restore | Moderate/high by risk, not hero-level | Keep |
| Onboarding | Start setup | Starts first-run setup | High in wizard | Keep |
| Onboarding | Add adult / Add child | Adds household members during setup | High in wizard form | Keep |
| Onboarding | Back / Continue / Review household / Finish and open Home | Wizard navigation and completion | High in wizard | Keep |
| Avatar | Save | Saves draft avatar configuration | Moderate in editor preview card | Keep |
| Avatar | Cancel | Reverts draft avatar changes | Moderate in editor preview card | Keep |
| Avatar | Reset | Resets draft avatar configuration | Moderate in editor preview card | Reduce / keep secondary |
| Placeholder pages | None | No primary actions | None | Keep as-is |

# Page-by-Page Classification

## Home

Classification: Relocate Add Family Member; keep family member navigation.

The family member chips are legitimate Home identity/navigation elements. The Add Family Member chip is different: it is household management placed in the Home hero. It should be removed from the hero and relocated to a compact header action, Settings, or a dedicated household/family member management page.

## Agenda

Classification: Keep primary event creation, but convert Add household event to a header action.

Agenda’s Add household event action is a valid primary page action. The empty-state action is also appropriate because it appears only when the user has no events. The dialog Back, Continue, and Create/Save controls are local workflow controls and should remain in the dialog.

## Tasks

Classification: Convert Add family task to a header action; reduce Routine starters; relocate Plan the week; remove or relocate Open family reset.

Tasks has the strongest systemic action-hierarchy problem after Home. Task creation, routines, weekly planning, and navigation to Weekly Reset are presented as peers. Only Add family task is the core primary page action. Routine starters and planning should be secondary. Open family reset appears duplicative when Weekly Reset is available as its own workspace.

## Shopping

Classification: Keep.

Shopping’s top Add action is the core page interaction and belongs near the list input. Empty-state list creation is appropriate. Rename, Archive, and Delete are hidden in List settings and do not dominate the page.

## Motivation

Classification: Keep empty-state Create family goal; reduce or contextualize Edit and personal-goal management actions.

Create family goal is appropriate when no family goal exists. Edit family goal, Manage personal goals, and Add personal goal are useful, but should remain compact section-level actions rather than page-level hero actions.

## Family Members / Family Member Detail

Classification: Convert Back to Home to a header action; keep Child Mode / Parent Mode.

Family member pages are reached through Home family chips rather than a standalone Family Members workspace. The Back to Home action is navigation and should be in compact page chrome, not primary content before the member hero. Child Mode / Parent Mode is core local navigation and should remain.

## Parent Mode

Classification: Keep form actions; reduce or contextualize management actions.

Parent Mode is an appropriate place for editing member details, editing avatars, saving changes, and member removal controls. These actions should remain in the parent/admin surface rather than leaking into Home.

## Avatar

Classification: Keep editor actions.

Save, Cancel, and Reset are editor-local controls in the avatar preview/editor layout. They are not a dashboard hero issue. Reset should remain secondary relative to Save.

## Weekly Reset

Classification: Relocate or reduce Skip this week; keep recovery action.

Skip this week is useful, but placing it in the hero gives a dismissal action too much page-level emphasis. Open family reset again is appropriate as a skipped-state recovery action.

## Settings

Classification: Keep.

Export and Restore calendar actions are administrative widget actions. Restore is gated by file selection and confirmation, which is appropriate given the destructive behavior.

## Onboarding

Classification: Keep.

Onboarding actions are intentionally prominent because the user is inside a setup wizard. These controls do not indicate a dashboard hierarchy problem.

## Placeholder Pages

Classification: Keep as-is.

House Status, Media, and Gamification placeholder pages do not contain hero actions.

# Recurring Layout Patterns

## Utility actions occupying hero space

Home places Add Family Member inside the hero family strip. This promotes household administration into daily dashboard space.

## Navigation treated as primary content

Family Member detail renders Back to Home before the hero as a prominent content button. This makes navigation compete with the page’s identity and progress content.

## Onboarding/setup responsibilities leaking into dashboard pages

Add Family Member is a setup/management action. Because there is already a first-run onboarding wizard, its presence in the Home hero suggests setup functionality is leaking into the ongoing dashboard experience.

## Multiple unrelated primary actions grouped together

Tasks groups task creation, template management, weekly planning, and reset navigation in one primary action row. This weakens the meaning of “primary action.”

## Contextual empty-state CTAs are generally correct

Agenda, Tasks, Shopping, and Motivation use prominent CTAs when content is empty. These are appropriate because they are contextual and disappear once the page has content.

## Legacy CTA panels are limited

The audit did not find a large number of legacy standalone CTA panels. The more important pattern is misplaced utility/navigation actions rather than obsolete panels.

# Information Architecture Findings

The oversized controls indicate mixed responsibilities more than intentional visual design.

Home shows an incorrect page hierarchy: the dashboard hero combines family identity/navigation with household management. The Add Family Member action is functional, but its placement makes it feel like a primary daily Home action.

Family Member detail shows navigation being treated as content. The Back to Home action should exist, but not as a dominant content control before the member hero.

Tasks shows grouped responsibilities. It combines creation, templates, weekly planning, and cross-workspace navigation as peer primary actions. That suggests the page lacks a clear action hierarchy.

Onboarding controls are intentional and should remain prominent. Empty-state CTAs are also intentional and generally correct.

The overall issue is not arbitrary button size. It is inconsistent information architecture: setup, management, and navigation controls sometimes occupy the same visual tier as the page’s primary content.

# Recommended Removals

The audit recommends very few complete removals.

- Remove the Home Add Family Member action from the hero family strip. Do not remove the capability; relocate it.
- Consider removing Open family reset from the Tasks primary action row if Weekly Reset remains available as its own workspace/navigation destination.

No dialog Back, Continue, Create, Save, or Finish actions should be removed outright because they are local workflow controls.

# Recommended Relocations

## Headers

- Home Add Family Member should move to a compact Home header action or household header action.
- Family Member Back to Home should move to compact page-header navigation.
- Tasks Add family task should move to the Tasks page header as the single primary action.
- Agenda Add household event should move to the Agenda page/widget header.
- Weekly Reset Skip this week should move to a secondary header action.

## Contextual menus or secondary panels

- Tasks Routine starters should move to a secondary tools area, contextual menu, or collapsible templates section.
- Motivation Edit family goal should become a compact card-level action.
- Motivation Manage personal goals should remain a secondary section action.
- Avatar Reset should remain secondary to Save and Cancel.

## Dedicated management pages

- Add Family Member belongs in household setup, family member management, or Settings if a dedicated Family Members page is not created.
- Parent Mode member-management actions should stay in Parent Mode rather than Home.

## Onboarding only

- First-run adult/child member creation should remain in onboarding.
- Onboarding Back, Continue, Review, and Finish actions should remain prominent inside the wizard only.

# Recommended Header Actions

The following should become compact header or header-adjacent icon actions:

- Home: Add Family Member.
- Family Member detail: Back to Home.
- Tasks: Add family task.
- Agenda: Add household event.
- Weekly Reset: Skip this week.
- Motivation section/card headers: Add personal goal and Edit family goal, if the design system supports compact section actions.

# Risks

Removing or relocating Add Family Member from the Home hero may reduce discoverability for post-onboarding household management unless a clear replacement is provided.

Moving Back to Home into header chrome requires a consistent page-header navigation pattern. Without that pattern, member detail pages may become harder to exit.

Simplifying Tasks actions may affect users who currently rely on the large action row to discover Routine starters or Weekly Reset.

Removing Open family reset from Tasks may reduce cross-discovery between Tasks and Weekly Reset unless the workspace navigation or page header clearly surfaces reset planning.

Changing action hierarchy may require test updates later because several tests likely query buttons by visible names and assume current render locations.

# Next Prompt Context

Highest-priority implementation slice:

1. Remove Add Family Member from the Home hero family strip.
2. Add a compact replacement entry point in a header or household management area.
3. Convert Family Member Back to Home into compact header/back navigation.
4. Simplify Tasks so Add family task is the only primary action, while Routine starters and Weekly Reset actions become secondary or relocated.

This slice addresses the clearest information architecture problems without changing empty-state CTAs, onboarding wizard controls, or dialog workflow controls.
