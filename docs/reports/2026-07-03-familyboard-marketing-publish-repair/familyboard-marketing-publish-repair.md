# FamilyBoard Marketing Publish Repair

## Root cause

The latest publish report failed in the Agenda scene during the executable storyboard action `add-filmavond`. The recording flow switched to Month view, scoped itself to the selected-day panel (`aria-label="Gekozen dag"`), and then looked for a selected-day button named `Gebeurtenis toevoegen`.

The current implemented Agenda UI no longer exposes that control in the selected-day panel. The selected-day panel's compact action is named `Toevoegen`, while the full `Gebeurtenis toevoegen` action lives in the Agenda header command region. The application UI had changed during the viewport-first redesign, but the production recording flow still used the older selected-day selector.

## Storyboard step updated

Updated the Agenda scene's `add-filmavond` recording action to use the implemented header `Gebeurtenis toevoegen` control instead of the outdated selected-day `Gebeurtenis toevoegen` selector.

The executable Agenda storyboard metadata was also clarified so the Agenda scene describes the implemented header add-event action rather than implying that the selected-day panel owns the full add-event control.

## Why the previous recording no longer matched implementation

The previous production recording assumed the selected-day panel owned the full add-event action. In the implemented viewport-first Agenda layout, event creation is initiated from the stable header command area, and the selected-day panel only exposes a compact `Toevoegen` affordance. The interaction order remains Month → Week → List → Month → Add Filmavond → Save → Return overview, but the add-event selector and visual source of the control changed.

## Files modified

- `tools/marketing-recording/storyboards/marketing-preview-v1.mjs`
- `docs/reports/2026-07-03-familyboard-marketing-publish-repair/familyboard-marketing-publish-repair.md`
- `docs/state/current-state.md`

## Publish validation performed

Ran publish mode with:

`MARKETING_PRODUCTION_MODE=publish npm --prefix src/HomeOps.Client run marketing:record`

Two publish attempts were made:

1. The first attempt could not launch Chromium because the container was missing Playwright system libraries (`libatk-1.0.so.0`). I installed the missing Chromium runtime dependencies in the container and reran publish mode.
2. The second attempt passed the repaired Agenda scene. The recording completed 4 scenes, including Agenda, then stopped at the next storyboard mismatch in the Tasks scene as required.

## Publish result

Publish did not complete successfully because a separate Tasks storyboard mismatch was found after the Agenda repair.

The next mismatch is:

- Failing scene: `tasks`
- Failing action: `open-add-task-dialog`
- Missing expected element: `aria-label="Aandacht voor nu"`
- Error: `Tasks wide Today focus column expected exactly 1 match, found 0.`

Per the task instruction, no further unrelated scene repair was performed after this next mismatch was identified.

## Generated output paths

- Raw recording artifact from the failed publish attempt: `/tmp/familyboard-marketing-preview-v1.webm`
- MP4: not generated
- Metadata JSON: not generated
- Timing JSON: not generated
- Cleanup: not executed because the recording stage failed before audio, export, metadata, and cleanup

## Application functionality

No application functionality was changed. This repair is limited to the Marketing Production Engine's executable storyboard/recording flow and repository reporting.

## Binary artifact policy

No binary files were committed. The failed publish attempt left a raw WebM artifact under `/tmp`, outside the repository. No generated MP4, raw WebM, audio, browser profile, or temporary production artifact is part of the repository changeset.
