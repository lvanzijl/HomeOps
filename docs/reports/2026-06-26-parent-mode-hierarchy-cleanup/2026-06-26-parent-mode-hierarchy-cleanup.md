# 2026-06-26 Parent Mode Hierarchy Cleanup

## Summary

Implemented the focused Parent Mode hierarchy cleanup. Parent Mode now centers the selected family member first, separates household and safety responsibilities, keeps direct CRUD-style editing for speed, and preserves avatar editing, Add Family Member, removal, persistence, routing, and existing APIs.

## Preflight Findings

- Repository instructions were reviewed before editing.
- The prior Parent Mode UX analysis was reviewed and used as the implementation guide.
- `FamilyMemberPage` showed the previous Parent Mode as a single administration block with intro actions, an edit form, a duplicated read-only details card, and avatar status.
- Avatar integration remained owned by `FamilyAvatar` and `FamilyAvatarEditor`; this slice only moved the avatar entry point into the Parent Mode Identity section.
- Add Family Member was opened from Parent Mode via `WorkspaceShell`; this slice preserved that entry point and softened only its dialog copy.
- Related Parent Mode styles used dashed/bordered administration framing and equal-weight cards.

## Copy Improvements

- Replaced the visible Parent Mode heading from `Administration` with member-specific grown-up settings.
- Replaced record/management-oriented copy with short practical language about updating the member profile and household options.
- Renamed the edit section from `Edit member` to `Personal details`.
- Renamed `Member type` to `Adult / Child` and `Date of birth` to `Birthday`.
- Updated removal copy from normal household lists to household membership.
- Softened the Add Family Member dialog eyebrow and helper copy from management/account language to household/family-dashboard language.

## Information Architecture Changes

Parent Mode now follows the requested responsibility order:

1. **Identity**
   - Contains Avatar status/action.
   - Contains Display color.
2. **Basic Information**
   - Contains Name.
   - Contains Adult / Child.
   - Contains Birthday.
   - Keeps Save details as the primary action.
3. **Household**
   - Contains Add Family Member.
   - Keeps household-level actions out of the selected member's primary settings.
4. **Safety**
   - Contains Remove Family Member.
   - Separates destructive removal from normal editing.

The duplicated read-only Member details card was removed because it repeated editable fields and exposed implementation-feeling values like initials and raw color.

## Action Hierarchy Changes

- Primary: `Save details` remains in Basic Information.
- Secondary: `Edit avatar` now lives in Identity; `Add Family Member` now lives in Household.
- Destructive: `Remove Family Member` now lives in Safety and no longer shares the Save details action row.
- Navigation: Back, Child Mode, and Parent Mode were preserved unchanged.

## Visual Cleanup

- Removed the dashed gray administration container styling.
- Kept the existing card system, but separated Parent Mode into clearer section groups.
- Reduced explanatory text in the Parent Mode intro.
- Removed duplicated read-only details content.
- Added small section-heading and support-grid styles for the new hierarchy without redesigning the page.

## Verified

- `dotnet --version` with `DOTNET_CLI_HOME=/tmp/dotnet-home` returned `10.0.301`.
- `npm test -- FamilyMemberPage FamilyAvatarEditor FamilyAvatar` passed.
- `npm run build` passed.
- No backend code was touched, so backend tests were not run.
- No browser was used and no screenshots were created.

## Risks

- Adult Parent Mode now shows the member avatar in both the hero and Identity section. This is intentional for identity editing, but could be visually compacted in a future layout pass.
- The Add Family Member dialog still uses the shared avatar-editor modal styling. This preserves scope but leaves some modal-level visual heaviness for a later slice.
- Removal still uses `window.confirm`; this preserves speed and scope but remains less polished than an in-product confirmation.

## Modified Files

- `src/HomeOps.Client/src/home/FamilyMemberPage.tsx`
- `src/HomeOps.Client/src/styles.css`
- `src/HomeOps.Client/src/home/FamilyMemberPage.test.tsx`
- `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx`
- `docs/reports/2026-06-26-parent-mode-hierarchy-cleanup/2026-06-26-parent-mode-hierarchy-cleanup.md`

## Next Prompt Context

Parent Mode now has the intended IA: current member first, then household, then safety. A good next slice would compact the Avatar editor modal or refine the Add Family Member dialog styling, but should not move Add Family Member back to Home or convert efficient parent settings into conversational flows.
