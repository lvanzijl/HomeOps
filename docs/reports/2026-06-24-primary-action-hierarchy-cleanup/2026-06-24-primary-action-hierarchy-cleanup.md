# Summary

Implemented the scoped primary action hierarchy cleanup from the audit. The changes remove household management from the Home hero, convert Family Member back navigation into compact header navigation, and make Tasks expose one primary creation action while demoting planning/template/reset controls to compact secondary actions.

# Preflight Findings

- Repository instructions require narrow implementation slices, concise reporting, and no speculative refactoring.
- The audit identified Home Add Family Member, Family Member Back to Home, and the Tasks multi-action row as the highest-priority hierarchy issues.
- Home rendered Add Family Member as a `family-chip add-family-chip` inside the Home hero.
- Family Member rendered Back to Home as page content before the member hero.
- Tasks rendered Add family task, Routine starters, Plan the week, and Open family reset as peer actions in one primary action row.
- Existing compact patterns included `compact-action` and `secondary-action`; no reusable shell-level header action component existed, so the cleanup added focused shared header-action CSS classes without introducing new routing or business logic.

# Home Changes

- Removed the Add Family Member chip from the Home hero family strip.
- Added a compact Home management header action above the hero that still opens the existing Add Family Member dialog.
- Preserved family member chips, dashboard summaries, quick capture, and Home navigation behavior.

# Family Member Changes

- Replaced the page-content Back to Home button with compact header navigation.
- Preserved the existing back callback and routing state behavior.
- Left Child Mode and Parent Mode unchanged.

# Tasks Changes

- Moved Add family task into the Tasks header as the single primary page action when tasks exist.
- Kept the empty-state Add a family task CTA as the only create entry point while the task list is empty.
- Demoted Routine starters, Plan the week, and Open family reset into compact secondary planning actions.
- Preserved task creation, task templates, weekly planning panel, and Weekly Reset navigation behavior.

# Header Consistency

- Added focused compact header action styles for affected pages.
- Reused existing secondary/compact button classes for demoted task planning actions.
- Avoided adding a new large CTA.
- Avoided changing unrelated Shopping, Agenda, Motivation, Weekly Reset, onboarding, or dialog behavior.

# Verified

- Ran focused frontend tests for HomeDashboard, FamilyMemberPage, TasksPage, and WorkspaceShell.
- Ran the full frontend test suite.
- Ran the frontend production build.
- Inspected the final diff for accidental source, documentation, roadmap, state, screenshot, or binary changes.

# Risks

- Moving Add Family Member out of the Home hero reduces hero prominence for household management, so discoverability now depends on the compact header action.
- Tasks now distinguishes primary creation from secondary planning controls; users accustomed to the previous large row may need to adjust.
- The new compact header action CSS is intentionally minimal and may need broader design-system consolidation in a later slice.

# Modified Files

- `src/HomeOps.Client/src/home/HomeDashboard.tsx`
- `src/HomeOps.Client/src/home/FamilyMemberPage.tsx`
- `src/HomeOps.Client/src/tasks/TasksPage.tsx`
- `src/HomeOps.Client/src/tasks/TasksPage.test.tsx`
- `src/HomeOps.Client/src/styles.css`
- `docs/reports/2026-06-24-primary-action-hierarchy-cleanup/2026-06-24-primary-action-hierarchy-cleanup.md`

# Next Prompt Context

Recommended next slice: consolidate compact page-header actions into a small reusable component or shell pattern, then apply it to Agenda and other pages only where the audit already identified header-action opportunities.
