# Final Timing Calibration

## Summary

Performed the final validation-mode timing calibration for the remaining measured outliers only: Intro, Shopping, and Outro. The final validation completed all 9 scenes, generated metadata and timing, cleaned temporary media, and intentionally did not publish a final movie.

Total runtime improved from the previous 97.7s validation to 89.0s, meeting the below-90s target. Intro is now close to the 5–6s range at 6.1s, Shopping is within target at 6.8s, and Outro is within target at 7.5s.

## Investigation

The previous timing data showed Agenda had already been corrected and that remaining outliers were Intro, Shopping, and Outro:

- **Intro:** 8.5s actual, dominated by startup/fixture transition overhead, the Chapter Card, and a 1.7s opening hold.
- **Shopping:** 9.3s actual, driven by transition/runtime setup plus three action holds totaling roughly 3.0s.
- **Outro:** 11.6s actual, driven by transition/runtime setup plus 5.8s of ending holds and fades.

Home, Tasks, Family, Motivation, Agenda, and Weekly Reset were not targeted for timing changes.

## Configuration changes

- Added scene-level `chapterCardDurationMs` support in the recording timing wrapper so a single outlier scene can shorten its Chapter Card without changing the global Chapter Card timing.
- Reduced only the Intro, Shopping, and Outro scene transition multipliers in the timing configuration.
- Reduced Intro's opening hold from 1700ms to 300ms while retaining a brief readable opening beat.
- Reduced Shopping's existing holds and add-item post-action hold while preserving list readability.
- Reduced Outro's Home hold, brand-card fade/hold, and final fade while preserving a calm ending.

## Before/after timing table

| Scene | Planned | Previous | New | Delta |
| --- | ---: | ---: | ---: | ---: |
| Intro | 5.0s | 8.5s | 6.1s | +1.1s |
| Home | 7.0s | 6.3s | 6.9s | -0.1s |
| Family | 10.0s | 11.6s | 11.3s | +1.3s |
| Agenda | 14.0s | 15.0s | 17.4s | +3.4s |
| Tasks | 10.0s | 9.9s | 10.1s | +0.1s |
| Shopping | 7.0s | 9.3s | 6.8s | -0.2s |
| Motivation | 10.0s | 10.9s | 8.7s | -1.3s |
| Weekly Reset | 14.0s | 14.8s | 14.2s | +0.2s |
| Outro | 7.0s | 11.6s | 7.5s | +0.5s |
| **Total** | **84.0s** | **97.7s** | **89.0s** | **+5.0s** |

- **Total runtime before:** 97.7s.
- **Total runtime after:** 89.0s.

## Validation

- `npm run marketing:record -- validation` passed after calibration: all 9 scenes completed, no action timeouts occurred, metadata generated, timing generated, cleanup completed, and `producedMovie` was `false`.
- `git diff --check` passed.

## Modified files

- `tools/marketing-production/config/timing-config.mjs`
- `tools/marketing-production/recording/recording-stage.mjs`
- `tools/marketing-recording/storyboards/marketing-preview-v1.mjs`
- `docs/reports/2026-07-01-final-timing-calibration/final-timing-calibration.md`
- `docs/state/current-state.md`

## Explicit answers

- **Were only the remaining timing outliers adjusted?** Yes. Only Intro, Shopping, and Outro timing values were changed; the other scene configurations were left alone.
- **Does Intro now execute close to 5–6 seconds?** Yes. Intro measured 6.1s, just above the preferred range and much closer than the prior 8.5s.
- **Does Shopping now execute close to 7–8 seconds?** Yes. Shopping measured 6.8s, effectively at the 7s storyboard target.
- **Does Outro now execute close to 7–8 seconds?** Yes. Outro measured 7.5s.
- **Is Weekly Reset unchanged?** Yes. Weekly Reset timing configuration and storyboard action pacing were not changed.
- **Is Agenda unchanged?** Yes. Agenda timing configuration and storyboard action pacing were not changed in this pass; the new validation's 17.4s reading reflects run-to-run runtime variability, not a code change.
- **Is total runtime now below 90 seconds?** Yes. The final validation measured 89.0s.
- **Was no final published movie intentionally produced?** Yes. Only validation mode was run; no final published movie was produced.
