# Marketing Video Timing Polish

Date: 2026-06-30

## Summary

Applied the first movie-review timing and gesture polish to the executable FamilyBoard marketing preview pipeline without changing product UI, VisualReview fixtures, scene order, or storyboard structure.

The slice keeps the approved 9-scene storyboard and 84-second preferred duration, while adding clearer hold/gesture metadata and making the recording touch driver less robotic.

No movie, screenshots, video, audio, WAV files, or binary artifacts were produced.

## Timing changes

- Added scene-level timing metadata for initial page holds, post-action holds, result holds, and outro holds.
- Lengthened page visibility before first interaction on Home, Family, Agenda, Tasks, Shopping, Motivation, and Weekly Reset.
- Clarified post-action pauses after important results:
  - Thomas avatar save pauses about one second before returning.
  - Agenda pauses on Month, Week, and List.
  - `Filmavond` remains visible after save.
  - `Koekjes bakken` appears before `Zwemtas klaarzetten` is completed.
  - Task completion animation gets a dedicated hold before leaving Tasks.
  - `Bananen` is the only Shopping addition and receives a brief visible hold after appearing.
  - `Bedankt voor het helpen met opruimen.` receives a longer readability hold in Motivation.
- Added explicit Outro timing metadata to return Home, hold Home, fade to the brand card, hold the brand card for about two seconds, and fade to black.
- Kept Chapter Cards brief and non-persistent with the existing approximately one-second chapter duration.

## Gesture changes

- Slowed base tap durations by about 100–200 ms across recording timing profiles.
- Slowed default swipe duration from 420 ms to 540 ms, roughly a 29% increase.
- Added a small default hesitation before taps, long presses, drags, swipes, and scrolls.
- Added a small settle before taps and longer post-touch holds so indicators do not feel instant or robotic.
- Kept touch indicators temporary through the existing overlay fade/ripple behavior.

## Storyboard/Director changes

- Added `timing` metadata to executable storyboard scenes and actions so review-driven pacing is explicit and inspectable.
- Added per-scene `scenePacing` support in the Marketing Director and used it for Weekly Reset.
- Preserved transition metadata when the Marketing Director creates a recording plan.
- Made Weekly Reset the slowest scene through both storyboard metadata and recording-plan pacing:
  - `pauseMultiplier: 1.45`
  - `movementMultiplier: 0.72`
  - `transitionMultiplier: 1.55`
  - slow warm transition with a 1600 ms base duration, producing the longest planned transition.
- Preserved the approved scene order and total preferred duration.

## Validation

- `node --check tools/marketing-recording/storyboards/marketing-preview-v1.mjs`: passed.
- `node tools/marketing-recording/storyboards/marketing-preview-v1.mjs`: passed; storyboard valid, 9 scenes, 84-second preferred duration, 90-second maximum duration.
- `node --check tools/marketing-recording/director.mjs`: passed.
- `node --check tools/marketing-recording/motion.mjs`: passed.
- `node --check tools/marketing-recording/touch.mjs`: passed.
- `node --check tools/marketing-recording/session.mjs`: passed.
- `node --check tools/marketing-recording/camera.mjs`: passed.
- `node --check tools/marketing-recording/overlays.mjs`: passed.
- Focused Node recording-plan validation passed:
  - executable storyboard imports cleanly;
  - Marketing Director validates it;
  - recording plan can be created;
  - preferred total remains `84000` ms;
  - preferred duration remains between 80 and 90 seconds;
  - Weekly Reset has the slowest pacing metadata and longest planned transition;
  - Outro includes Home hold and brand-card hold;
  - Chapter Cards remain brief and non-persistent;
  - no media artifact outputs were produced.
- `find docs tools src -type f \( -name '*.mp4' -o -name '*.webm' -o -name '*.wav' -o -name '*.png' -o -name '*.jpg' \) -newermt '2026-06-30 11:20:00 UTC' -print | sort`: produced no output.
- `git diff --check`: passed.

## Modified files

- `tools/marketing-recording/storyboards/marketing-preview-v1.mjs`
- `tools/marketing-recording/director.mjs`
- `tools/marketing-recording/motion.mjs`
- `tools/marketing-recording/touch.mjs`
- `docs/reports/2026-06-30-marketing-video-timing-polish/marketing-video-timing-polish.md`

## Explicit answers

- **Were page holds lengthened?** Yes.
- **Were post-action pauses added or clarified?** Yes.
- **Was Weekly Reset made slower than other scenes?** Yes.
- **Were touch gestures made less robotic?** Yes.
- **Was the storyboard structure preserved?** Yes. The same 9 scenes remain in the same order and the preferred total remains 84 seconds.
- **Was no movie intentionally produced?** Yes. No movie, screenshots, video, audio, WAV files, or binary artifacts were produced.
