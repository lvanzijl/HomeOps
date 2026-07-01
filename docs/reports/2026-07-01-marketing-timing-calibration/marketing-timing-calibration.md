# Marketing Timing Calibration

## Summary

Calibrated the executable FamilyBoard marketing storyboard in validation mode without publishing a final movie. The completed baseline run measured Agenda at 131.4s in this environment, consistent with the reported approximately 138s blocker. After calibration, the final validation run completed all 9 scenes with Agenda at 15.0s against a 14.0s target and total runtime at 97.7s against the 84.0s storyboard plan.

## Timing investigation

The baseline timing metadata showed the overrun was concentrated in Agenda. The final validation metadata showed the executable storyboard still completed all 9 scenes, generated metadata and timing JSON, cleaned temporary media, and reported `producedMovie: false`.

| Scene | Planned | Previous actual | New actual | Delta vs planned |
| --- | ---: | ---: | ---: | ---: |
| Intro | 5.0s | 8.5s | 8.5s | +3.5s |
| Home | 7.0s | 6.5s | 6.3s | -0.7s |
| Family | 10.0s | 11.4s | 11.6s | +1.6s |
| Agenda | 14.0s | 131.4s | 15.0s | +1.0s |
| Tasks | 10.0s | 10.3s | 9.9s | -0.1s |
| Shopping | 7.0s | 9.8s | 9.3s | +2.3s |
| Motivation | 10.0s | 9.2s | 10.9s | +0.9s |
| Weekly Reset | 14.0s | 14.9s | 14.8s | +0.8s |
| Outro | 7.0s | 11.7s | 11.6s | +4.6s |
| **Total** | **84.0s** | **213.7s** | **97.7s** | **+13.7s** |

## Agenda action breakdown

| Agenda component | Previous actual | New actual | Contribution / finding |
| --- | ---: | ---: | --- |
| Transition | 3.8s | 4.4s | Reload/navigation and transition overhead remained real application time. |
| Chapter Card | 1.0s | 1.0s | Not the source of the overrun. |
| Month action | 11.9s | 2.2s | Overrun came from slow touch overlay/path execution for a simple view toggle. |
| Month pause | 0.9s | 0.3s | Calibrated pause remains readable. |
| Week action | 5.4s | 0.8s | Calibrated to direct deterministic locator click. |
| Week pause | 0.9s | 0.3s | Calibrated pause remains readable. |
| List action | 5.8s | 0.8s | Calibrated to direct deterministic locator click. |
| List pause | 0.9s | 0.3s | Calibrated pause remains readable. |
| Add Event / Filmavond entry | 89.8s | 3.1s | Main root cause; locator-click form progression used touch movement waits and default interaction pacing that multiplied across the add-event dialog. |
| Save | 0.9s | 0.3s | Save no longer contributes material runtime. |
| Wait after save | 1.2s | 0.5s | Calibrated but still leaves a readable saved-state beat. |
| Return to overview | 8.6s | 0.7s | Calibrated to deterministic locator click. |

## Root cause

Agenda consumed approximately 138s because executable Agenda actions were using warm touch-driver movement and locator-click synchronization for simple deterministic controls. The add-event dialog amplified this: each “Verder” step moved through the touch overlay and locator click path, while the scene also had explicit pauses and a separate save/hold/return sequence. The root cause was measured in timing metadata and confirmed with temporary action timeline instrumentation during investigation; instrumentation was not the cause and was not retained.

## Configuration changes

The storyboard order and narrative were preserved. Agenda action timing was calibrated in the existing storyboard action metadata:

- Month / Week / List / Return controls now use deterministic direct locator clicks with shorter holds.
- Agenda view pauses were reduced from 900ms-class pauses to 300ms while remaining readable.
- Filmavond typing is configurable and uses zero per-character delay for the validation recording path.
- The post-save visible hold was reduced while preserving a saved-state beat.

A small executable-action helper option was added so calibrated actions can use a real locator click without the decorative touch-path overhead. This is not fake DOM navigation and still exercises the production UI.

## Before/after timing table

The previous actual column is from the completed baseline validation metadata captured before this calibration in this environment. The new actual column is from the final validation-mode production run after calibration.

| Scene | Planned | Previous Actual | New Actual | Delta |
| --- | ---: | ---: | ---: | ---: |
| Intro | 5.0s | 8.5s | 8.5s | +3.5s |
| Home | 7.0s | 6.5s | 6.3s | -0.7s |
| Family | 10.0s | 11.4s | 11.6s | +1.6s |
| Agenda | 14.0s | 131.4s | 15.0s | +1.0s |
| Tasks | 10.0s | 10.3s | 9.9s | -0.1s |
| Shopping | 7.0s | 9.8s | 9.3s | +2.3s |
| Motivation | 10.0s | 9.2s | 10.9s | +0.9s |
| Weekly Reset | 14.0s | 14.9s | 14.8s | +0.8s |
| Outro | 7.0s | 11.7s | 11.6s | +4.6s |
| **Total** | **84.0s** | **213.7s** | **97.7s** | **+13.7s** |

## Validation

- `npm run marketing:record -- validation` passed after calibration: all 9 scenes completed, no action timeouts occurred, metadata generated, timing generated, cleanup completed, and `producedMovie` was `false`.
- `npm test -- --run src/agenda/calendarEventsApi.test.ts src/widgets/components/AgendaWidget.test.tsx` passed.
- `git diff --check` passed.

## Modified files

- `tools/marketing-recording/storyboards/marketing-preview-v1.mjs`
- `docs/reports/2026-07-01-marketing-timing-calibration/marketing-timing-calibration.md`
- `docs/state/current-state.md`

## Explicit answers

- **Why did Agenda consume approximately 138 seconds?** The measured cause was slow touch-driver/locator-click execution inside Agenda, especially the Add Filmavond dialog, layered with explicit pauses and return navigation.
- **Was the root cause measured?** Yes. Timing metadata isolated Agenda and per-action metadata isolated Add Filmavond, view toggles, and return overview as the large contributors.
- **Were implementation changes required or was configuration sufficient?** Configuration handled the pacing values, with one small helper option for deterministic direct locator clicks where touch-path overhead was the measured implementation-level defect.
- **Does Agenda now execute close to storyboard timing?** Yes. Agenda measured 15.0s against the 14.0s target in the final validation run.
- **Does the total movie now execute close to storyboard timing?** It is much closer: 97.7s against the 84.0s plan, with Agenda corrected and remaining overhead concentrated in transitions/runtime scene setup.
- **Was no final published movie intentionally produced?** Yes. Only validation mode was run; no final published movie was produced.
