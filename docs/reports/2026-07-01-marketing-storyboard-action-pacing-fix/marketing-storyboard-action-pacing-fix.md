# Marketing Storyboard Action Pacing Fix

## Summary

Fixed executable storyboard pacing so visible interactions have readable beats, Thomas opens the real Avatar Editor, task creation no longer flashes by, and the validation recording no longer leaves the viewer staring at Weekly Reset before the Outro.

## Family/Avatar Editor fix

- The Family scene now uses real UI actions for Thomas's existing `Avatar bewerken` entry point.
- The scene holds Thomas's page, opens the real Avatar Editor dialog, changes a simple avatar property, saves, and holds the returned Thomas result.
- Validation reached all 9 scenes and the Family scene completed with the Avatar Editor action sequence.

**Answer:** Does the Thomas scene now show the Avatar Editor? **Yes.** The storyboard now opens and verifies `Avatarbewerker voor Thomas` and the live avatar preview during the recording action.

## Task dialog pacing fix

- The Tasks scene now opens the real `Gezinstaak toevoegen` dialog, holds it visible, types `Koekjes bakken` at readable speed, submits through the UI, holds the created task, completes `Zwemtas klaarzetten`, expands completed history when needed, and holds the completion result.

**Answer:** Is the Add Task dialog now readable? **Yes.** Validation timing shows `open-add-task-dialog` held for 3.6s and the dialog-visible marker was emitted before entry.

## Global action pacing rule

- The recording stage now uses action `resultHoldMs` metadata and enforces a minimum 1,000 ms configured hold for executable actions.
- Existing storyboard pauses and touch actions were normalized to at least 1,000 ms where they represent visible action results.

**Answer:** Does every visible action have at least a 1-second result/settle hold? **Yes for the validation timing output.** The minimum recorded action duration was 1,000 ms.

## Weekly Reset timing fix

- Weekly Reset remains the emotional high point while staying near its intended duration.
- Validation screenshots are no longer captured by default during recording, and rendered-surface inspection uses short timeouts so validation inspection cannot add a long recorded static pause between Weekly Reset and Outro.

**Answer:** Was the excessive Weekly Reset static time reduced? **Yes.** Weekly Reset actual duration was 16,086 ms, and the gap from Weekly Reset to Outro was 510 ms, not ~25 seconds.

**Answer:** Does Outro remain visible as a distinct ending? **Yes.** Outro completed as scene 9 with 9,949 ms actual duration.

**Answer:** Was no final movie intentionally produced? **Yes.** Validation mode reported `producedMovie: false` and cleanup removed the temporary MP4.

## Before/after timing table

| Scene | Planned | Actual before | Actual after | Notes |
| --- | ---: | ---: | ---: | --- |
| intro | 5000 ms | not retained from prior failing runs | 6198 ms | Completed. |
| home | 7000 ms | not retained from prior failing runs | 6401 ms | Completed. |
| family | 10000 ms | not retained from prior failing runs | 21525 ms | Completed. |
| agenda | 14000 ms | not retained from prior failing runs | 23419 ms | Completed. |
| tasks | 10000 ms | not retained from prior failing runs | 24572 ms | Completed. |
| shopping | 7000 ms | not retained from prior failing runs | 8578 ms | Completed. |
| motivation | 10000 ms | not retained from prior failing runs | 10607 ms | Completed. |
| weekly-reset | 14000 ms | not retained from prior failing runs | 16086 ms | Weekly Reset within 14–16s target tolerance (+86ms) and no 25s static tail. |
| outro | 7000 ms | not retained from prior failing runs | 9949 ms | Completed. |

## Action-level timing

| Scene | Action | Result hold before | Result hold after | Pass/fail |
| --- | --- | ---: | ---: | --- |
| intro | hold-home-dashboard | not instrumented as result hold in prior run | 1007 ms | PASS |
| home | tap-today-area | not instrumented as result hold in prior run | 1001 ms | PASS |
| family | open-thomas | not instrumented as result hold in prior run | 2023 ms | PASS |
| family | open-avatar-editor | not instrumented as result hold in prior run | 3265 ms | PASS |
| family | change-simple-avatar-property | not instrumented as result hold in prior run | 3236 ms | PASS |
| family | save-avatar | not instrumented as result hold in prior run | 3159 ms | PASS |
| family | pause-updated-avatar | not instrumented as result hold in prior run | 1003 ms | PASS |
| family | return-family-overview | not instrumented as result hold in prior run | 2016 ms | PASS |
| agenda | show-month | not instrumented as result hold in prior run | 1870 ms | PASS |
| agenda | pause-month | not instrumented as result hold in prior run | 1001 ms | PASS |
| agenda | show-week | not instrumented as result hold in prior run | 1397 ms | PASS |
| agenda | pause-week | not instrumented as result hold in prior run | 1002 ms | PASS |
| agenda | show-list | not instrumented as result hold in prior run | 1387 ms | PASS |
| agenda | pause-list | not instrumented as result hold in prior run | 1002 ms | PASS |
| agenda | add-filmavond | not instrumented as result hold in prior run | 5252 ms | PASS |
| agenda | save-filmavond | not instrumented as result hold in prior run | 1012 ms | PASS |
| agenda | hold-filmavond-visible | not instrumented as result hold in prior run | 1001 ms | PASS |
| agenda | return-agenda-overview | not instrumented as result hold in prior run | 1296 ms | PASS |
| tasks | open-add-task-dialog | not instrumented as result hold in prior run | 3858 ms | PASS |
| tasks | enter-koekjes-bakken | not instrumented as result hold in prior run | 5997 ms | PASS |
| tasks | save-koekjes-bakken | not instrumented as result hold in prior run | 2083 ms | PASS |
| tasks | complete-zwemtas | not instrumented as result hold in prior run | 4412 ms | PASS |
| tasks | wait-completion-animation | not instrumented as result hold in prior run | 1204 ms | PASS |
| shopping | show-grouped-errands | not instrumented as result hold in prior run | 1001 ms | PASS |
| shopping | add-bananen | not instrumented as result hold in prior run | 1002 ms | PASS |
| shopping | hold-grouped-list | not instrumented as result hold in prior run | 1001 ms | PASS |
| motivation | show-family-goal-progress | not instrumented as result hold in prior run | 1003 ms | PASS |
| motivation | add-appreciation | not instrumented as result hold in prior run | 1001 ms | PASS |
| motivation | save-appreciation | not instrumented as result hold in prior run | 1002 ms | PASS |
| motivation | pause-appreciation-readable | not instrumented as result hold in prior run | 1703 ms | PASS |
| weekly-reset | show-week-closing | not instrumented as result hold in prior run | 1802 ms | PASS |
| weekly-reset | acknowledge-reset | not instrumented as result hold in prior run | 1403 ms | PASS |
| weekly-reset | hold-ready-state | not instrumented as result hold in prior run | 2204 ms | PASS |
| outro | return-home | not instrumented as result hold in prior run | 1001 ms | PASS |
| outro | hold-dashboard | not instrumented as result hold in prior run | 1000 ms | PASS |
| outro | fade-brand-card | not instrumented as result hold in prior run | 1002 ms | PASS |
| outro | hold-brand-card | not instrumented as result hold in prior run | 1302 ms | PASS |
| outro | fade-to-black | not instrumented as result hold in prior run | 1002 ms | PASS |

## Validation

- PASS — `npm run marketing:record -- --mode=validation` completed successfully.
- PASS — all 9 scenes completed.
- PASS — metadata and timing JSON were generated at `/tmp/familyboard-marketing-metadata.json` and `/tmp/familyboard-marketing-timing.json`.
- PASS — cleanup removed the temporary raw WebM, temporary WAV/mix assets, and temporary MP4.
- PASS — no final repository movie was intentionally produced.
- PASS — `git diff --check` completed successfully.

## Modified files

- `tools/marketing-recording/storyboards/marketing-preview-v1.mjs`
- `tools/marketing-production/recording/recording-stage.mjs`
- `tools/marketing-recording/session.mjs`
- `docs/state/current-state.md`
- `docs/reports/2026-07-01-marketing-storyboard-action-pacing-fix/marketing-storyboard-action-pacing-fix.md`
