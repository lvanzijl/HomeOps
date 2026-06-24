# Tasks and Weekly Reset Family-First Pass

## Summary
- Updated Tasks copy and hierarchy to emphasize family help, today’s needs, and routines rather than administration.
- Kept Weekly Reset contextual and made the Tasks entry read as a natural family planning moment.
- Chose `Shopping` as the beta-facing label instead of `Shopping / Lists`.
- Tightened narrow navigation sizing to reduce wrapping without changing destinations.

## Language Changes
- Replaced workspace-style orientation text with warmer family orientation text.
- Replaced administrative Tasks headers with family-help language.
- Softened task ownership labels from system states into household-facing phrases where visible.
- Kept underlying task state values unchanged.

## Tasks Hierarchy Changes
- Preserved active urgency groups as the primary Tasks content.
- Reframed Add Task as adding family help.
- Reframed templates as routine starters and saved family rhythms.
- Kept Someday after active work and described it as later ideas away from today’s pressure.

## Weekly Reset Discoverability
- Kept Weekly Reset out of primary/global navigation.
- Changed the contextual Tasks action to `Plan the week` with review count when applicable.
- Changed the full reset action to `Open family reset`.
- Reframed the inline reset panel as a family check-in for loose tasks.

## Shopping Label Decision
- Chosen beta-facing label: `Shopping`.
- Rationale: `Shopping` is shorter, easier to scan on mobile, and clearer for beta households than `Shopping / Lists`. The implementation still supports family list functionality; this pass only changes the visible navigation label and related presentation copy.

## Mobile Navigation Changes
- Reduced narrow-width nav button padding, font size, radius, and gaps.
- Hid the Settings text label on very narrow widths while preserving the Settings button and accessible label.
- Kept navigation structure and destinations unchanged.

## UX Review
- Father: Tasks feels more like deciding what helps the family today, with Weekly Reset easier to notice as week planning.
- Mother: The warmer labels reduce administrative tone; routine starters still remain available but secondary.
- Child (8 years old): Labels like `Done`, `Anyone`, and `Whole family` are easier to understand than system words.
- UX Expert: The pass improves information scent and mobile scanability while respecting existing architecture and workflows.

## Verification
- Existing functionality was intended to remain unchanged: no API, business rule, lifecycle, route, FamilyMember, or Avatar V2 behavior changes were made.
- Navigation structure remains Home, Agenda, Tasks, Shopping, Motivation, plus contextual Weekly Reset and Settings affordance.
- Tasks and Weekly Reset action handlers were left in place; copy and presentation were changed only.

## Risks
- Some tests assert exact button text and required updates alongside the copy changes.
- Settings text is hidden at narrow widths; the icon and accessible label remain, but this should be visually checked on devices before beta.

## Modified Files
- `src/HomeOps.Client/src/tasks/TasksPage.tsx`
- `src/HomeOps.Client/src/weeklyReset/WeeklyResetPage.tsx`
- `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx`
- `src/HomeOps.Client/src/workspaces/workspaceModel.ts`
- `src/HomeOps.Client/src/styles.css`
- `src/HomeOps.Client/src/tasks/TasksPage.test.tsx`
- `src/HomeOps.Client/src/weeklyReset/WeeklyResetPage.test.tsx`
- `src/HomeOps.Client/src/workspaces/WorkspaceShell.test.tsx`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

## Next Prompt Context
- Validate Weekly Reset discoverability in-browser at mobile and desktop widths.
- Confirm whether `Shopping` remains sufficient once multiple non-shopping family lists become more prominent.
- Continue to avoid adding new task workflows, task lifecycle behavior, Weekly Reset behavior, authentication, Google Calendar, Home Assistant, shopping-list domain expansion, sensors, media, or gamification unless a future prompt explicitly advances that roadmap slice.
