# Profile Picker Removal and Family-First Cleanup

## Summary
- Confirmed HomeOps has no backend Profile aggregate, no persisted active-profile state, and no route-backed Netflix-style profile picker.
- Removed the remaining profile-oriented startup/navigation assumption by taking the isolated Avatar V2 editor out of workspace administration navigation.
- Cleaned product-facing client copy so Family Member surfaces describe household members without referring to profiles.
- Preserved the family-first startup contract: incomplete household setup opens First Run Wizard; completed household setup opens Home.

## Findings
- `WorkspaceShell` already initialized to the Home workspace and gated only on onboarding status before rendering the app shell.
- No Profile Picker page component or `/profile` route existed in the client source.
- Profile wording survived in Family Member avatar/help copy, the Avatar V2 editor navigation description, and historical planning documentation.
- The Avatar V2 editor was reachable from Administration as an isolated testing page with copy that explicitly framed it as pre-profile-integration work.
- Backend references to `launch profile` are .NET launch settings terminology, not product Profile functionality.

## Implemented
- Removed `avatarEditor` from `WorkspaceId`, workspace definitions, navigation roles, domain colors, and default workspace layout records.
- Removed the `AvatarEditorPage` import and rendering branch from `WorkspaceShell`, leaving the Avatar V2 code and browser-local editor persistence files untouched.
- Replaced Family Member page explanatory copy from “profiles” to “accounts”.
- Replaced the Family Avatar editor note so it no longer calls the avatar setting a profile setting.
- Updated current-state and Phase 2 roadmap notes for this cleanup slice.

## Startup Flow Changes
- Startup remains a two-step family-first decision:
  1. `requiresOnboarding === true` renders First Run Wizard.
  2. `requiresOnboarding === false` renders the Home workspace.
- No profile selection state, selected profile storage, or profile-picker screen is part of startup.
- Completing onboarding still resets navigation to Home and clears any active Family Member context.

## Navigation Changes
- Removed the Administration navigation entry for the isolated Avatar V2 editor because it existed as a temporary pre-profile-integration testing surface.
- Preserved primary navigation for Home, Agenda, Tasks, Lists, and Motivation.
- Preserved secondary navigation for Weekly Reset, House Status, Media, and Gamification.
- Preserved Settings administration.
- Preserved contextual Family Member management from the Home family strip.

## Verification
- `dotnet --version` reported `10.0.301`.
- `dotnet test` passed 124 backend tests with an existing package vulnerability warning for `SQLitePCLRaw.lib.e_sqlite3`.
- `npm test` from `src/HomeOps.Client` passed 113 frontend tests across 24 files.
- `npm run build` from `src/HomeOps.Client` passed TypeScript and Vite production build.
- `npm test -- --runInBand` from `src/HomeOps.Client` failed because Vitest does not support the Jest `--runInBand` option.
- `npm test -- --runInBand` from the repository root failed because the root has no `package.json`; frontend npm commands must run in `src/HomeOps.Client`.

## Risks
- Historical docs still mention profiles as explicit non-goals or past analysis context; those were not rewritten to avoid changing historical records.
- Avatar V2 editor code remains in the source tree and tests because the task prohibited Avatar V2 persistence/integration changes; it is no longer exposed through product navigation.
- No browser screenshot was captured because this cleanup changed routing/navigation exposure and copy only, without a new visual surface.

## Modified Files
- `src/HomeOps.Client/src/workspaces/workspaceModel.ts`
- `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx`
- `src/HomeOps.Client/src/workspaces/workspaceLayout.ts`
- `src/HomeOps.Client/src/workspaces/domainColors.ts`
- `src/HomeOps.Client/src/home/FamilyMemberPage.tsx`
- `src/HomeOps.Client/src/home/FamilyAvatarEditor.tsx`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-06-23-work/profile-picker-removal-and-family-first-cleanup.md`

## Next Prompt Context
- Profile does not survive as product-facing MVP functionality; remaining source mentions are historical docs, .NET launch-profile terminology, and explicit non-goal language.
- The Netflix-style profile picker is fully removed/not present in the runnable client flow.
- Startup is family-first: onboarding when household setup is incomplete, Home dashboard when complete.
- Before Avatar V2 FamilyMember persistence, decide the backend FamilyMember avatar contract and migration from the existing MVP avatar fields without adding users, authentication, permissions, or profile concepts.
