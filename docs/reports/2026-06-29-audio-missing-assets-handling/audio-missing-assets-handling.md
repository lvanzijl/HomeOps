# Audio Missing Assets Handling

Date: 2026-06-29

## Summary

Improved the marketing Audio Framework so missing generated placeholder WAV assets are treated as silence rather than fatal errors. The source-only workflow remains intact: the repository can omit generated WAV files, and locally generated placeholder assets will be used automatically when present.

No WAV files, generated audio, movie, screenshots, videos, production UI changes, storyboard changes, Marketing Director changes, Recording Framework changes, Audio Framework redesign, or binary artifacts were produced.

## Root cause

The Audio Framework was intentionally committed without generated placeholder WAV files, but the sound library always returned file paths for placeholder sounds and the mixer attempted to read every clip source. When files such as `tap.wav`, `transition.wav`, `taskComplete.wav`, `appreciation.wav`, or `success.wav` were absent, downstream validation could treat the missing files as a blocker.

## Behaviour without assets

- The sound library now checks whether a requested sound file exists before adding it to the timeline.
- Missing known placeholder sounds return no clip and may emit one diagnostic warning per sound ID.
- Unknown configured sound IDs also return no clip and may emit one diagnostic warning.
- The mixer skips missing clip sources if they appear in a manually constructed timeline.
- WAV export creates its destination directory on demand, so validation/export helpers do not depend on committed generated directories.
- Director/event-bus subscription, timeline creation, mixer creation, and mixing continue without exceptions.

## Behaviour with assets

- Existing sound files are returned normally by the sound library.
- Sound overrides still point to the provided file path.
- Timeline clips and mixer output continue through the normal playback/mixing path when a file exists.
- Future locally generated placeholder WAVs under the expected asset paths will be picked up automatically without code changes.

## Validation

- `node --check tools/marketing-recording/audio/sound-library.mjs` passed.
- `node --check tools/marketing-recording/audio/mixer.mjs` passed.
- `node -e "import('./tools/marketing-recording/audio/index.mjs').then((m)=>console.log(Object.keys(m).sort().join(',')))"` passed.
- Validation A, with no WAV assets present, passed using a Node event-bus/director/timeline/mixer exercise: recording events published, event subscriptions ran, missing placeholder sounds produced no clips, mixing returned silence, and no exceptions occurred.
- Validation B passed with a temporary WAV file under `/tmp` supplied through a sound override: the sound library created one timeline clip, the mixer loaded it, and the mixed output was non-silent. The temporary file was removed and was not committed.
- `git diff --check` passed.

## Modified files

- `tools/marketing-recording/audio/sound-library.mjs`
- `tools/marketing-recording/audio/mixer.mjs`
- `tools/marketing-recording/audio/wav.mjs`
- `docs/state/current-state.md`
- `docs/reports/2026-06-29-audio-missing-assets-handling/audio-missing-assets-handling.md`

## Explicit answers

- **Can the Audio Framework initialize without WAV assets?** Yes.
- **Does the recording pipeline continue without placeholder sounds?** Yes; missing placeholder sounds become silence and do not block event scheduling or mixing.
- **Will generated placeholder WAVs automatically be used later?** Yes; existing files at the configured asset paths or override paths are used normally.
- **Were any generated audio files committed?** No.
- **Was no movie intentionally produced?** Yes.
