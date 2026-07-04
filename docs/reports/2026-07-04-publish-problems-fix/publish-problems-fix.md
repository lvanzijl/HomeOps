# FamilyBoard Publish Problems Fix

## Summary

Fixed the current publish blocker in the executable Agenda recording action. Publish mode now completes all 9 scenes and produces a timestamped MP4 under `docs/demo/`.

## Root cause

Publish failed because the Agenda recording script still targeted older Agenda dialog copy. The real production UI opens the add-event dialog as **Afspraak toevoegen**, but the recording helper looked for **Gebeurtenis toevoegen** with an exact accessible-name match. Because no dialog with that older name existed, the helper reported: `Agenda add-event dialog expected exactly 1 match, found 0.`

The same stale-copy issue also existed later in the Agenda add-event flow: the date question and final save button had changed to **Wanneer is het?** and **Afspraak maken** in the application UI, while the recording script still expected older wording.

## Agenda locator/dialog fix

Updated the Agenda recording action to use the real current UI labels:

- Dialog accessible name: `Afspraak toevoegen`.
- Date question: `Wanneer is het?`.
- Final save button: `Afspraak maken`.

No production UI was changed. The fix keeps the recording on the normal application flow: it opens the real Agenda page, uses the real **Afspraak plannen** button, enters `Filmavond`, advances through the real dialog steps, saves with the real button, waits for the POST `/api/events` response, and verifies the saved `Filmavond` event is visible in the Agenda planning surface.

## Validation-mode result

Command:

```bash
npm --prefix src/HomeOps.Client run marketing:record
```

Result:

- Completed successfully.
- Production mode: `validation`.
- All 9 scenes completed.
- Agenda scene completed.
- Agenda dialog markers showed `title-entered`, `question-1-title-completed`, `question-2-date-completed`, `question-3-time-completed`, and `final-details-or-result-ready`.
- Metadata generated: `/tmp/familyboard-marketing-metadata.json`.
- Timing generated: `/tmp/familyboard-marketing-timing.json`.
- Cleanup completed.
- Temporary raw WebM, WAV/audio workspace, and validation MP4 were removed by cleanup.

## Publish-mode result

Command:

```bash
MARKETING_PRODUCTION_MODE=publish npm --prefix src/HomeOps.Client run marketing:record
```

Result:

- Completed successfully.
- Production mode: `publish`.
- All 9 scenes completed.
- Agenda scene completed.
- Metadata generated.
- Timing generated.
- Cleanup completed.
- `producedMovie` was `true`.

## Published movie path

`docs/demo/familyboard-preview-20260704-150034.mp4`

The filename matched `familyboard-preview-YYYYMMDD-HHmmss.mp4` when publish mode produced it. The MP4 was removed from the repository changeset per follow-up review direction; only source and report files remain committed.

## Modified files

- `tools/marketing-recording/storyboards/marketing-preview-v1.mjs`
- `docs/reports/2026-07-04-publish-problems-fix/publish-problems-fix.md`
- `docs/state/current-state.md`

## Explicit answers

- **Why did publish fail?** Publish failed because the Agenda add-event recording action used stale exact-match UI labels for the dialog.
- **Why did the add-event dialog locator find 0 matches?** The real dialog accessible name is `Afspraak toevoegen`, but the recording script searched exactly for `Gebeurtenis toevoegen`.
- **Was the real Agenda workflow fixed?** Yes. The recording now follows the real UI workflow and validates the saved `Filmavond` event through normal application behavior.
- **Did validation mode complete?** Yes.
- **Did publish mode complete?** Yes.
- **Was a timestamped MP4 produced?** Yes: `docs/demo/familyboard-preview-20260704-150034.mp4`.
- **Were temporary WebM/WAV artifacts absent?** Yes. Cleanup removed temporary WebM/WAV artifacts, and no repository WebM/WAV files remain.
- **Was no subjective movie review performed?** Correct. No subjective movie review, pacing analysis, or production-system redesign was performed.
