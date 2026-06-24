# Motivation Family Goal Conversational Dialog

## Summary
Converted only the Motivation family goal create/edit dialog from a dense form into a compact, flow-specific conversational sequence while preserving existing family goal create, update, progress, and celebration behavior.

## Interaction Changes
- Family goal create/edit now asks one primary question at a time: goal title, progress target/unit, optional celebration, then review.
- Continue is blocked until the required title is present.
- Progress keeps the numeric target explicit and editable with the existing unit label.
- Celebration remains optional and can be skipped without blocking creation.
- Edit mode preloads the existing family goal values and reminds the family that existing progress is kept.

## Implemented
- Replaced the family goal form body with a local conversational flow inside `MotivationPage`.
- Added compact review summary before create/save.
- Added focused styles for the flow without introducing shared dialog infrastructure.
- Added focused Motivation tests for create, edit prefill, validation, optional celebration, progress preservation, and Escape close behavior.

## Verified
- `dotnet test tests/HomeOps.Api.Tests/HomeOps.Api.Tests.csproj --filter FullyQualifiedName~MotivationApiTests`
- `npm test -- --run src/MotivationPage.test.tsx`
- `npm run build`

## Risks
- The dialog remains local to Motivation, so future Task/Agenda/Motivation convergence will still need a separate intentional shared-pattern slice.
- The flow relies on the existing API response to preserve progress after edit, matching prior behavior.

## Modified Files
- `src/HomeOps.Client/src/MotivationPage.tsx`
- `src/HomeOps.Client/src/MotivationPage.test.tsx`
- `src/HomeOps.Client/src/styles.css`
- `docs/reports/2026-06-24-motivation-family-goal-dialog/2026-06-24-motivation-family-goal-dialog.md`

## Next Prompt Context
Family goal create/edit now follows the HomeOps conversational dialog pattern. Personal goals and Helpful Moments were intentionally not converted. No generic dialog framework was added. Current state and Phase 2 roadmap docs were intentionally left unchanged per prompt constraints.
