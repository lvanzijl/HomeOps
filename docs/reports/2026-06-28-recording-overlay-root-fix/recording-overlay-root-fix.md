# Recording Overlay Root Fix

Date: 2026-06-28

## Summary

Fixed the Recording Framework dry-run blocker where the first scene Chapter Card could throw after scene transition reloads removed the overlay root from the page DOM.

No movie, screenshots, audio, WAV files, storyboard changes, marketing fixture changes, or production UI changes were produced.

## Root cause

The recording overlay root was installed once at session start. Scene transitions can reset fixtures and reload the page, replacing the document and removing the previously installed overlay root and injected overlay styles. `showChapter()` then attempted to append the Chapter Card to a missing root, causing `Cannot read properties of null (reading 'appendChild')`.

## Fix

- Added an idempotent `ensureRecordingOverlayRoot()` helper that recreates both the recording overlay stylesheet and overlay root when missing.
- Kept `installRecordingOverlays()` as a stable call site, now backed by the ensure helper.
- Ensured Chapter Card, touch point, ripple, move, and hide helpers call the ensure helper immediately before touching overlay DOM.
- Ensured transition execution recreates the overlay root before transition DOM work, immediately after transition callbacks such as fixture reset/reload, and after transition cleanup.

## Validation

- Node/import validation confirmed the overlay helper module exports `ensureRecordingOverlayRoot` and all existing overlay helpers.
- Executable storyboard validation passed for the approved 9-scene marketing preview storyboard.
- No-recording first-scene dry run launched Chromium, started a recording session without `recordVideoDir`, loaded the executable storyboard, initialized the first scene, reached and completed `ChapterStarted`/`ChapterCompleted`, completed the first scene, and confirmed the overlay root existed after the transition/reload path.
- `git diff --check` passed.

## Modified files

- `tools/marketing-recording/overlays.mjs`
- `tools/marketing-recording/transitions.mjs`
- `docs/state/current-state.md`
- `docs/reports/2026-06-28-recording-overlay-root-fix/recording-overlay-root-fix.md`

## Explicit answers

- **Was the missing overlay root fixed?** Yes.
- **Is overlay installation idempotent?** Yes.
- **Does Chapter Card initialization survive scene navigation or reload?** Yes; `showChapter()` now recreates the root and styles before appending the Chapter Card.
- **Does the dry run proceed beyond ChapterStarted?** Yes; the first-scene dry run reached `ChapterCompleted` and `SceneCompleted`.
- **Was no movie intentionally produced?** Yes; the dry run did not pass `recordVideoDir` and produced no new movie.
- **Were any production UI files changed?** No.
