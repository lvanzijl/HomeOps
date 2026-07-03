# Marketing Storyboard Viewport Redesign Update

## Summary

Reviewed the canonical FamilyBoard marketing storyboard after the completed product-wide viewport-first redesign and updated the storyboard language only. The overall story, scene order, pacing, emotional flow, fixtures, production structure, and recording approach remain intact.

No application code, runtime production logic, screenshots, videos, binary files, or generated media were changed.

## Storyboard scenes reviewed

- Intro
- Home
- Family / Mijn Pagina / Avatar Editor
- Agenda
- Tasks
- Shopping
- Motivation
- Weekly Reset
- Outro

## Storyboard scenes updated

- Intro: reframed the Home opening around the current viewport-first household dashboard rather than the older large-family-anchor/card description.
- Home: updated camera focus and touch language to reflect the current Home dashboard summaries and today's household question.
- Family: updated Mijn Pagina and Avatar Editor direction to reflect the current personal daily overview and bounded avatar-editing flow.
- Agenda: removed the obsolete Month/Week/List tour as the required visual sequence and replaced it with the current Today / This Week / Next Week planning dashboard while preserving the Filmavond story beat.
- Tasks: updated the scene to focus on the compact command/status band and today's bounded work region.
- Shopping: updated the scene to reflect the execution-first shopping dashboard, compact quick-add row, active store-grouped list region, and removal of default lifecycle/management surface recording.
- Motivation: updated the scene to reflect the three-region Shared Family Purpose / Encouragement & Appreciation / Celebration Story composition.
- Sequence justification and validation notes: clarified that Settings is excluded from the emotional sequence but, if referenced, should match the current calm household-health dashboard rather than obsolete calendar administration.

## Product changes reflected

- Primary pages are described as dashboard-first, viewport-first surfaces with stable reserved regions.
- Scene focus now follows one household question per page: today, planning, today's work, active shopping, family purpose, personal overview, and household health when Settings is referenced.
- Contextual detail is described as bounded and secondary rather than permanent page content.
- Shopping lifecycle and management surfaces are no longer treated as default recording content.
- Motivation no longer describes standalone statistics/personal-goal/history cards as default visible surfaces.
- Tasks no longer describes the page as a general task list; it now emphasizes today's work inside a bounded dashboard.

## Obsolete interactions removed

- Removed the Agenda scene requirement to tap Month, Week, and List as a feature tour.
- Removed Shopping direction that could imply opening list-management, lifecycle, completed, deleted, or other-list surfaces.
- Removed Motivation direction that could imply opening history, statistics, or personal-goal management during the main scene.
- Removed Settings wording that treated Settings as an obsolete calendar-administration stack.

## Files modified

- `docs/design/marketing-storyboard-v1.md`
- `docs/reports/2026-07-03-work/marketing-storyboard-viewport-redesign-update.md`
- `docs/state/current-state.md`

## Code and binary confirmation

- No implementation code changed.
- No binary files were added.
- No screenshots were produced.
- No marketing video was produced.
- Storyboard runtime was not validated, per task constraint.
