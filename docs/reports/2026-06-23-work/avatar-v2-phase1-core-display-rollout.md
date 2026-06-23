# Avatar V2 Phase 1 Core Display Rollout

## Summary
FamilyAvatar now renders Avatar V2 when `member.avatarV2Config` exists, preserving the existing FamilyAvatar public API and call sites. The rollout reaches the Family Member hero, Child hero area, and Home family strip through that shared component.

## Implemented
- FamilyAvatar now normalizes `avatarV2Config`, renders Avatar V2 SVG output, and keeps compact/large sizing behavior through the existing size classes.
- Legacy fallback remains: when `avatarV2Config` is missing, FamilyAvatar still renders the existing legacy CSS/span avatar from `member.avatar`.
- Initials fallback remains: when neither Avatar V2 nor legacy avatar data is available, FamilyAvatar still renders initials.
- Focused tests cover Avatar V2 rendering, legacy fallback, initials fallback, Family Member hero/child hero rendering, and Home family strip rendering.
- API contracts, DTOs, persistence, migrations, and legacy avatar fields were unchanged.
- Motivation cards were intentionally left out of scope. Because they already use FamilyAvatar, they may receive Avatar V2 indirectly for members with `avatarV2Config`; no Motivation-specific redesign or refactor was performed.

## Verified
- `npm test -- --run src/home/FamilyAvatar.test.tsx src/home/FamilyMemberPage.test.tsx src/home/HomeDashboard.test.tsx`
- `npm run build`

## Risks
- FamilyAvatar is a shared component, so existing Motivation card uses can inherit Avatar V2 indirectly when passed a member with `avatarV2Config`. This is an unavoidable global-component impact of the preferred implementation approach and was not otherwise redesigned in this slice.
- Avatar V2 SVG is injected from the local deterministic renderer; this keeps renderer output centralized but means FamilyAvatar display depends on renderer SVG markup remaining safe and compatible with small avatar containers.

## Modified Files
- `src/HomeOps.Client/src/home/FamilyAvatar.tsx`
- `src/HomeOps.Client/src/styles.css`
- `src/HomeOps.Client/src/home/FamilyAvatar.test.tsx`
- `src/HomeOps.Client/src/home/FamilyMemberPage.test.tsx`
- `src/HomeOps.Client/src/home/HomeDashboard.test.tsx`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-06-23-work/avatar-v2-phase1-core-display-rollout.md`

## Next Prompt Context
Avatar V2 Phase 1 core display rollout is implemented through FamilyAvatar. Family Member hero, Child hero area, and Home family strip now render Avatar V2 when `avatarV2Config` exists. Legacy avatar fallback and initials fallback remain. API/contracts/persistence/migrations and legacy avatar fields remain unchanged. Motivation cards were not intentionally changed, but any existing Motivation use of FamilyAvatar may inherit Avatar V2 indirectly for configured members.
