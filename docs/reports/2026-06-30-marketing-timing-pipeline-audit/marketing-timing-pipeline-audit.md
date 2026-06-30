# Marketing Timing Pipeline Audit

Date: 2026-06-30

## Summary

The produced FamilyBoard marketing movie was reported at **183.8 seconds** while the approved executable storyboard remains **84 seconds preferred** and **90 seconds maximum**.

The audit found duplicated timing in the recording pipeline: scene duration was treated as an authored scene target, but the recording session appended an additional automatic tail hold after every scene. Transition execution also applies the configured transition duration once for the cover-in and once for the reveal-out, so transition time is additive and must be counted separately from authored scene duration.

The corrective pass removes the unconditional per-scene tail hold from `RecordingSession`. The storyboard durations, scene order, Marketing Director pacing profile, Weekly Reset slowest-scene intent, production UI, marketing fixtures, audio framework, and generated media are preserved.

No movie, screenshot, audio, WAV file, or binary artifact was intentionally produced.

## Timing pipeline

Measured timing chain before correction:

1. Storyboard scene `preferredDurationMs` is copied into the Director recording plan as `durationHintMs`.
2. Marketing Director computes transition duration from transition metadata and pacing profile.
3. `RecordingSession.runScene` executes the transition through `runTransition`.
4. `runTransition` waits the transition duration before fixture reset/reload and waits the same transition duration again after reload.
5. `RecordingSession.runScene` waits for page idle through `camera.waitForIdle`, including a fixed 220 ms camera pause after load/font readiness.
6. The Chapter Card runs for its configured duration.
7. Scene actions run, including explicit action waits where action implementations use them.
8. Before correction, `RecordingSession.runScene` appended `Math.max(300, scene.durationHintMs * 0.12)` after every scene.

Corrected timing chain:

1. Storyboard preferred duration remains authoritative in the recording plan.
2. Marketing Director still computes pacing and transitions.
3. RecordingSession still executes transitions, page idle, Chapter Card, and actions.
4. RecordingSession no longer appends an extra duration-derived tail hold after each scene.
5. Timing plans now sum the storyboard preferred scene durations to **84,000 ms**.

## Per-scene timing table

The table below separates the deterministic timing stages in source. `Actual` is the corrected timing-plan duration, not a newly recorded movie duration.

| Scene | Storyboard | Director | Camera | Touch | Transition | Other waits | Actual | Delta |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Intro | 5.000s | 5.000s | 0.220s | 0.000s | 1.954s | 1.600s | 5.000s | 0.000s |
| Home | 7.000s | 7.000s | 0.220s | action-defined | 1.954s | 1.840s | 7.000s | 0.000s |
| Family | 10.000s | 10.000s | 0.220s | action-defined | 1.954s | 2.200s | 10.000s | 0.000s |
| Agenda | 14.000s | 14.000s | 0.220s | action-defined | 1.954s | 2.680s | 14.000s | 0.000s |
| Tasks | 10.000s | 10.000s | 0.220s | action-defined | 1.954s | 2.200s | 10.000s | 0.000s |
| Shopping | 7.000s | 7.000s | 0.220s | action-defined | 1.954s | 1.840s | 7.000s | 0.000s |
| Motivation | 10.000s | 10.000s | 0.220s | action-defined | 1.954s | 2.200s | 10.000s | 0.000s |
| Weekly Reset | 14.000s | 14.000s | 0.220s | action-defined | 4.960s | 2.680s | 14.000s | 0.000s |
| Outro | 7.000s | 7.000s | 0.220s | 0.000s | 1.954s | 1.840s | 7.000s | 0.000s |
| **Total** | **84.000s** | **84.000s** | **1.980s** | action-defined | **20.592s** | **19.080s** | **84.000s** | **0.000s** |

`Other waits` includes the Chapter Card hold plus the now-removed automatic 12% per-scene tail hold in the pre-correction chain. Touch waits are action-defined because exact pointer travel time depends on element coordinates at runtime; the audit did not record a new movie.

## Root cause

The root cause was duplicated/cumulative scene timing in `RecordingSession`:

- the Director already passes the storyboard preferred duration as the scene duration hint;
- actions and Chapter Cards add their own authored holds;
- transitions add their own in/out waits;
- then RecordingSession added another duration-derived tail hold to every scene.

That final automatic hold was not part of the storyboard and scaled with the same preferred duration it was supposed to respect. It contributed **10.08 seconds** of deterministic extra runtime across the 9-scene storyboard and encouraged the recording path to treat preferred duration as something to add to, not as the scene budget.

The full **183.8-second** produced movie cannot be decomposed per scene from repository source alone because no per-scene production timing log was committed with the movie report. The source audit does explain why the pipeline could exceed the 84-second plan: timing was cumulative rather than budgeted, and the recording session appended scene-duration-derived waits after all other waits.

## Corrective changes

- Removed the unconditional `scene.durationHintMs * 0.12` tail pause at the end of `RecordingSession.runScene`.
- Preserved storyboard durations and scene order.
- Preserved Marketing Director pacing profile and Weekly Reset's slow transition metadata.
- Did not modify production UI.
- Did not modify marketing fixtures.
- Did not record a new movie.

## Validation

- Executable storyboard validation passed and still reports 9 scenes, **84,000 ms** preferred duration, and **90,000 ms** maximum duration.
- Marketing Director validation passed with no warnings.
- Focused timing-plan validation passed: planned total is **84,000 ms** and Weekly Reset remains tied for longest storyboard scene while retaining the longest transition.
- `git diff --check` passed.

## Modified files

- `tools/marketing-recording/session.mjs`
- `docs/state/current-state.md`
- `docs/reports/2026-06-30-marketing-timing-pipeline-audit/marketing-timing-pipeline-audit.md`

## Explicit answers

- **Why did the movie become 183.8 seconds?** Because the recording pipeline treated timing cumulatively: storyboard preferred duration, transition in/out waits, Chapter Card holds, action waits, idle waits, and an additional duration-derived scene tail hold were all added instead of being constrained to the storyboard scene budget. No per-scene production timing log was available to split the already-produced 183.8-second artifact by scene.
- **Was duplicated timing found?** Yes. `RecordingSession` appended an unconditional duration-derived tail wait after every scene.
- **Were duplicated waits removed?** Yes. The unconditional per-scene tail wait was removed.
- **Does the planned runtime now match the storyboard?** Yes. The timing plan sums to **84,000 ms**.
- **Was the storyboard preserved?** Yes. No storyboard file was changed.
- **Was no movie intentionally produced?** Yes. No movie, screenshot, audio, WAV file, or binary artifact was produced.
