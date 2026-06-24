# Beta Navigation and Surface Cleanup

## Summary
- Removed House Status, Media, and Gamification from user-facing beta navigation while preserving their internal workspace identifiers and placeholder routing for future development.
- Kept the primary navigation focused on the accepted daily family surfaces: Home, Agenda, Tasks, Shopping / Lists, and Motivation.
- Demoted Weekly Reset to a contextual Tasks entry point and kept Settings as a compact Administration affordance.
- Adjusted affected navigation descriptions toward family-first language and away from module/workspace framing.

## Removed Beta Surfaces
- House Status no longer appears in beta navigation.
- Media no longer appears in beta navigation.
- Gamification no longer appears in beta navigation.
- Internal placeholder handling remains available in code so future roadmap slices can reintroduce the surfaces deliberately.

## Navigation Changes
- Primary navigation now contains only Home, Agenda, Tasks, Shopping / Lists, and Motivation.
- Shopping / Lists uses the accepted beta label to make the shopping use case clear while preserving the existing Lists route and functionality.
- Weekly Reset is accessible from Tasks through the existing reset action rather than competing as a top-level navigation destination.
- Settings remains accessible through the gear-style Administration area and does not appear in the daily family navigation group.
- Removed the separate secondary navigation row that previously advertised occasional/future surfaces.

## Family Member Positioning
- Family Members remain contextual to Home and family flows rather than a standalone top-level navigation domain.
- Family Member management continues to be opened from the Home family member strip and related contextual flows.
- Avatar Editor remains reachable through Family Member flows; this slice did not modify Avatar V2 behavior.
- The implementation avoids profile/account wording and keeps members framed as people in the household experience.

## UX Review
### Father
- Navigation is simpler because daily planning, tasks, shopping, and motivation are the only prominent destinations.
- Product focus is clearer because future technical areas no longer look like unfinished chores in the main app.
- HomeOps feels more family-oriented because Weekly Reset is presented where task review naturally happens.

### Mother
- Navigation is simpler because shopping/lists and agenda are easier to distinguish from future placeholders.
- Product focus is clearer because Settings is still available but not competing with everyday household coordination.
- The app feels more like one family product because motivation, tasks, agenda, and shopping read as parts of the same routine.

### Child (8 years old)
- Navigation is simpler because there are fewer confusing buttons.
- Product focus is clearer because the visible areas are about what the family is doing today.
- The app feels more family-oriented because people remain part of Home instead of becoming accounts or profiles.

### UX Expert
- Navigation is simpler: the global IA now separates daily family surfaces from contextual maintenance and future concepts.
- Product focus is clearer: future surfaces no longer create false affordances or imply beta scope expansion.
- The product feels more cohesive: labels and descriptions emphasize shared family routines rather than standalone modules.

## Verification
- Verified with focused WorkspaceShell tests that future surfaces are absent from user-facing navigation, Settings remains available, Weekly Reset is reachable from Tasks, and primary navigation keeps the accepted beta surfaces.
- Verified with full frontend test suite that client behavior still passes after navigation changes.
- Verified with frontend production build that TypeScript and Vite compilation pass.
- Verified with full solution tests that backend and frontend-independent behavior still passes.
- Manual code review confirmed Family Member flows remain contextual and Avatar Editor integration was not changed.

## Risks
- House Status, Media, and Gamification still exist as internal workspace identifiers and placeholder code; future slices should either reintroduce them intentionally or eventually clean up unused placeholder definitions.
- Weekly Reset is no longer globally visible, so users must discover it through Tasks. This is intentional for beta but should be watched in usability review.
- Settings remains visible as an Administration gear; if it still feels too prominent visually, a later visual-only pass could compact the affordance further.

## Modified Files
- `src/HomeOps.Client/src/workspaces/workspaceModel.ts`
- `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx`
- `src/HomeOps.Client/src/workspaces/WorkspaceShell.test.tsx`
- `src/HomeOps.Client/src/styles.css`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-06-23-work/beta-navigation-and-surface-cleanup.md`

## Next Prompt Context
HomeOps beta navigation now presents Home, Agenda, Tasks, Shopping / Lists, and Motivation as the core daily family surfaces. Weekly Reset is contextual from Tasks, Settings is Administration, and House Status, Media, and Gamification are hidden from user-facing beta navigation while preserved internally for future roadmap work. Continue to protect Home as the primary landing page, FamilyMember as the person entity, and Avatar V2 as reachable through Family Member flows only.
