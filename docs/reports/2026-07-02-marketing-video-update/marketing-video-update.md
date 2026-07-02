# Marketing Video Update

## Summary

This revision updates the existing FamilyBoard marketing preview storyboard so the Tasks chapter reflects the redesigned Tasks experience while preserving the current nine-scene marketing narrative, scene order, pacing, and production structure. It is an iteration of the existing product marketing video, not a new standalone Tasks video.

## Storyboard Changes

- **Tasks scene**: Updated the scene focus, camera pacing, gestures, interaction sequence, expected final state, and director notes to explicitly present the redesigned Today-first Tasks dashboard while keeping the existing “planning turns into helping” story beat.
- **Tasks add-task action**: Replaced the previous single-step add flow with the redesigned progressive task dialog sequence: title, owner, date, extras summary, then save.
- **Tasks validation action**: Added storyboard runtime checks for the redesigned Tasks page structure before and after key interactions: Today summary, desktop dashboard grid, wide Today focus column, planning column, quiet queues column, and secondary planning actions.
- **Tasks completion action**: Updated the completion sequence to verify the redesigned task card is visible before completing `Zwemtas klaarzetten`, then confirms the completed visual state settles before the storyboard transitions onward.

No other chapter order, fixture name, duration total, marketing source document reference, emotional curve, or production storyboard identity was changed.

## Tasks Improvements

The Tasks chapter now visually demonstrates the redesigned experience by opening on the cleaner desktop dashboard and validating the key layout landmarks that make the redesign visible:

- a wider `Vandaag` focus area for what matters now;
- a compact `Vandaag in beeld` summary for faster scanning;
- separate planning and queue columns for lower-priority work;
- progressive disclosure for routines and weekly planning;
- a progressive task entry moment that avoids showing all controls at once;
- compact task cards with direct `Klaar` completion and secondary actions kept quieter.

The existing story remains intact: the Tasks chapter shows `Koekjes bakken` entry in the redesigned progressive dialog, then completes `Zwemtas klaarzetten` to resolve the swimming-preparation thread before Shopping, Motivation, Weekly Reset, and the closing Home scene continue.

## Validation

- The storyboard module builds and validates successfully.
- The production recording run reached the redesigned Tasks scene and exposed one runtime issue in the selected-card action disclosure; the storyboard was updated to select `Zwemtas klaarzetten` before completing it.
- The redesigned Tasks experience is included through explicit runtime selectors and updated Tasks scene direction.
- The storyboard is ready for visual validation.
- No binary artifacts remain in the final changeset.

## Files Modified

- `tools/marketing-recording/storyboards/marketing-preview-v1.mjs` — updated the existing executable marketing storyboard Tasks scene and Tasks recording actions for the redesigned Tasks experience.
- `docs/reports/2026-07-02-marketing-video-update/marketing-video-update.md` — added this implementation and validation report.
