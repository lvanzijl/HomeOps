# Agenda Publish Reliability

## Summary

Fixed the final FamilyBoard Marketing Production publish blocker in the Agenda `add-filmavond` recording path. Publish mode now completes successfully through runtime, storyboard, recording, Agenda, audio, export, metadata, timing, and cleanup, temporarily producing a timestamped MP4 at `docs/demo/familyboard-preview-20260703-195538.mp4`, then removing that binary artifact from the changeset before completion.

No Production Engine, Recording Framework, Marketing Director, Audio Framework, production UI, storyboard narrative, or timing redesign was performed. No subjective movie review was performed.

## Investigation

The measured Agenda recording path showed that the page and dialog opened successfully and the title/date/time-kind questions advanced, but the recording failed after the third question because the validation locator only searched for `Filmavond` inside `.agenda-event strong`. The redesigned Agenda Planning Briefing renders default planning events inside `.agenda-planning-event strong`, so the real UI workflow had already closed the dialog and returned Filmavond to the Planning briefing, but the recording could not observe the result.

The previous fallback API creation path was not valid for this requirement because the required workflow is the normal UI path. It was removed. The fix now uses only the real application UI.

## Action timeline

Measured during the successful publish run `20260703-195538`:

| Step | Result | Evidence |
| --- | --- | --- |
| Agenda page visible | Passed | Agenda scene started after navigation and target verification. |
| Add Event opened | Passed | Dialog opened and became visible. |
| Filmavond entered | Passed | `title-entered` completed in 1,806 ms. |
| Question 1 completed | Passed | `question-1-title-completed` completed in 1,783 ms. |
| Question 2 completed | Passed | `question-2-date-completed` completed in 2,889 ms. |
| Question 3 completed | Passed | `question-3-time-completed` completed in 3,098 ms. |
| Final details/result reached | Passed | The normal UI workflow completed and Filmavond was observed in the Planning briefing. |
| Save completed / result visible | Passed | `save-filmavond` returned immediately because the real UI result was already visible; no artificial event creation was used. |
| Continue storyboard | Passed | Recording continued through Tasks, Shopping, Motivation, Weekly Reset, and Outro. |

## Backend analysis

- The earlier fallback request targeted `POST /api/events` with a hand-built payload.
- That fallback produced a backend `502` in the previous attempt, but it was not part of the real user workflow and should not have existed.
- The normal UI path uses the app's existing Agenda event creation flow and client-side event handling.
- The successful publish run proves the remaining blocker was recording observation logic, not a required backend or production UI fix.
- The fallback was removed rather than preserved.

## Root cause

`add-filmavond` failed because the recording's `savedFilmavondEvent` locator was stale after the Agenda Planning Briefing redesign. It only searched `.agenda-event strong`, while the current default Planning briefing renders the saved Filmavond item in `.agenda-planning-event strong`.

The dialog progression itself was not the final defect: after measuring the complete path, the recording was failing to observe the valid UI result.

## Fix

- Removed the artificial fallback API creation behavior.
- Added measured Agenda step markers for the title entry and each dialog question.
- Changed internal dialog progression to use direct, enabled real UI button clicks instead of reusing the general touch helper metadata that carried unrelated action options into the question buttons.
- Updated the Filmavond result locator to search both `.agenda-event strong` and `.agenda-planning-event strong`, matching the current Agenda Planning Briefing UI.

## Publish validation

Command:

```bash
MARKETING_PRODUCTION_MODE=publish npm --prefix src/HomeOps.Client run marketing:record
```

Result:

- Runtime passed.
- Storyboard passed with 9 scenes, 84,000 ms preferred duration, and 90,000 ms maximum duration.
- Recording passed all 9 scenes.
- Agenda completed the real Filmavond workflow.
- Audio passed and generated/mixed temporary audio assets.
- Export passed and temporarily produced `docs/demo/familyboard-preview-20260703-195538.mp4`; the MP4 was removed from the working tree before completion so it is not committed.
- Metadata generated at `/tmp/familyboard-marketing-metadata.json` and referenced the temporary published MP4 path before that repository binary was removed.
- Timing generated at `/tmp/familyboard-marketing-timing.json` and references the completed production with all 9 scenes.
- Cleanup completed and removed the temporary WebM, audio assets, mixed WAV, and temporary audio workspace.
- The temporary published MP4 was removed from the changeset.
- No new MP4, WebM, WAV, PNG, JPG, JPEG, or other binary artifact remains in the changeset.
- No temporary WebM or WAV remains in the repository.
- No subjective movie review was performed.

## Explicit answers

- **Why did `add-filmavond` fail?** The result locator only searched the old `.agenda-event` list, while Filmavond is visible in the redesigned Planning briefing under `.agenda-planning-event`.
- **Was the backend 502 resolved?** Yes, by removing the invalid fallback path. The 502 belonged to the artificial fallback, not the required UI workflow.
- **Does the recording now complete the real Filmavond workflow?** Yes.
- **Does publish mode now complete successfully?** Yes.
- **Was a timestamped MP4 produced?** Yes: `docs/demo/familyboard-preview-20260703-195538.mp4` was produced during publish validation, then removed before completion because this slice must not commit binaries.
- **Were metadata and timing generated?** Yes: `/tmp/familyboard-marketing-metadata.json` and `/tmp/familyboard-marketing-timing.json`.
- **Was cleanup completed?** Yes; production cleanup completed, and the retained publish MP4 was also manually removed from the changeset afterward.
- **Was no subjective movie review performed?** Yes; no subjective review was performed.

## Modified files

- `tools/marketing-recording/storyboards/marketing-preview-v1.mjs`
- `docs/reports/2026-07-03-agenda-publish-reliability/agenda-publish-reliability.md`
- `docs/state/current-state.md`
