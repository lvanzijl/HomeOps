# Summary

Separated Add Family Member from Home completely. Home no longer exposes household administration through a hero, compact header action, hidden action, prop, or duplicate entry point. Add Family Member remains available through the family management experience by surfacing one compact action in Parent administration.

# Preflight Findings

- No dedicated standalone Family Member management workspace exists.
- Family Member pages are reached from Home family identity chips, and existing management fields live in Parent administration.
- Parent Mode is the existing management surface for child members; adult member pages already render Parent administration directly.
- Settings exists as a household setup area, but there is no Family Member-specific settings widget. Because Parent administration already manages member records, it is the better relocation target than Settings.
- Add Family Member was reachable from Home only through the compact Home management action added by the previous cleanup; onboarding has its own separate member creation flow.

# Home Changes

- Removed the compact Add Family Member header action from Home.
- Removed the `onAddFamilyMember` prop from `HomeDashboard`.
- Updated Home tests to verify Home no longer exposes an Add Family Member action.
- Preserved Home family identity chips, dashboard summaries, and quick daily interactions.

# Family Management Changes

- Added one compact Add Family Member action to Parent administration.
- Reused the existing `WorkspaceShell` Add Family Member dialog and create-member flow.
- Passed the add-member callback from `WorkspaceShell` into `FamilyMemberPage` instead of `HomeDashboard`.
- Preserved Parent Mode, adult member administration, member editing, avatar editing, and member removal behavior.

# Discoverability

Preferred discovery is now:

1. First-run onboarding for initial household setup.
2. Family Member management / Parent administration for adding members later.
3. Parent Mode for child member administration.

Home is no longer part of the Add Family Member discovery path.

# Verified

- Home contains no Add Family Member action.
- Parent administration exposes one Add Family Member action when the shell provides the existing add-member callback.
- Add Family Member still opens through the existing WorkspaceShell dialog path.
- Existing onboarding, Parent Mode, and Family Member navigation behavior are preserved.

# Risks

- Users who previously expected household member administration from Home must now discover it through Parent administration.
- There is still no dedicated Family Members management workspace, so Parent administration is the current best-fit management location rather than a final information-architecture destination.

# Modified Files

- `src/HomeOps.Client/src/home/HomeDashboard.tsx`
- `src/HomeOps.Client/src/home/HomeDashboard.test.tsx`
- `src/HomeOps.Client/src/home/FamilyMemberPage.tsx`
- `src/HomeOps.Client/src/home/FamilyMemberPage.test.tsx`
- `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx`
- `src/HomeOps.Client/src/styles.css`
- `docs/reports/2026-06-24-home-family-management-separation/2026-06-24-home-family-management-separation.md`

# Next Prompt Context

Consider a future dedicated Family Members management surface if household administration grows beyond simple add/edit/remove member flows. Until then, keep Home focused on daily dashboard information and keep household administration inside Parent administration.
