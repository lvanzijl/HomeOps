# FamilyBoard Marketing Audio Framework

## Summary
- Added a reusable marketing-only audio framework under `tools/marketing-recording/audio/`.
- Added scripts to generate cohesive, warm placeholder WAV sounds for future FamilyBoard marketing recordings on demand.
- Added an event-subscribing audio director that listens to the Marketing Director event bus rather than requiring direct recording calls.
- Added reusable timeline, mixer, music-track, and WAV export helpers for future mixed-track generation and later FFmpeg muxing.
- Generated audio artifacts are intentionally excluded from the PR; validation mixes are local/generated artifacts only.

## Audio architecture
The framework is intentionally split into small modules:
- `director.mjs` subscribes to recording events and schedules sounds.
- `sound-library.mjs` resolves replaceable sound assets and per-sound overrides.
- `music-track.mjs` models optional background music with looping, trim, fade, and volume controls.
- `timeline.mjs` stores reusable clip timing, overlap, delay, role, fade, and automation metadata.
- `mixer.mjs` mixes effects, music, and future narration into one mono PCM track.
- `export-helpers.mjs` normalizes and exports WAV output.
- `wav.mjs` reads and writes uncompressed 16-bit PCM WAV files.
- `config.mjs` provides configuration defaults for future storyboard-level audio settings.

## Audio identity
The placeholder identity uses soft sine-based tones with short fades and restrained volume. The intended feeling is warm, subtle, reassuring, optimistic, modern, and family friendly. The identity avoids arcade/game-like chirps, enterprise notification harshness, and productivity-app urgency. Silence remains the preferred default when an event does not need reinforcement.

## Placeholder assets
Temporary placeholder WAV assets are generated on demand by `tools/marketing-recording/audio/generate-placeholder-assets.mjs` into `tools/marketing-recording/audio/assets/`. The source code defines the required sound IDs: tap, double tap, long press, success, save, task complete, appreciation, celebration, transition, and weekly reset complete.

Generated WAV files are intentionally not committed in this PR. Professional replacements can keep the same IDs or be supplied through sound overrides without changing framework code. Professional audio assets should only be committed in a future explicitly approved artifact slice.

## Event integration
`MarketingAudioDirector` accepts an existing `RecordingEventBus`, subscribes with `eventBus.subscribe(...)`, and maps Marketing Director event types to sound IDs. The default map covers touch, gesture, action completion, transition start, chapter completion, and recording finish. Future storyboards can override event-to-sound behavior through configuration.

Supported event model compatibility includes:
- `RecordingStarted` / `RecordingFinished`
- `SceneStarted` / `SceneCompleted`
- `ChapterStarted` / `ChapterCompleted`
- `TransitionStarted` / `TransitionCompleted`
- `TouchStarted` / `TouchCompleted`
- `GestureStarted` / `GestureCompleted`
- `ActionStarted` / `ActionCompleted`

## Timeline
`AudioTimeline` supports overlapping clips by design because every clip has an independent `startMs`. It also supports delayed clips, fades, role metadata, trim settings, looping flags, and volume automation metadata. The same structure can later schedule narration clips alongside effects and music. Chapter-level music continuity is supported by placing a music clip across a longer duration while scene and chapter sounds overlap it.

## Mixer
`AudioMixer` loads WAV clips, applies trim, looping, volume, fade-in, and fade-out, then sums clips into a single mixed buffer. The mixer is role-agnostic, so sound effects, background music, and future narration share the same pipeline.

## Export pipeline
`exportMixedWav(...)` normalizes the mixed audio and writes a final WAV suitable for later MP4 muxing. The pipeline is intentionally ready for later FFmpeg integration but does not invoke FFmpeg and does not create video.

## Validation
`tools/marketing-recording/audio/validate-audio-framework.mjs` can generate a local validation mix at `tools/marketing-recording/audio/validation/internal-validation-mix.wav` to demonstrate:
- tap
- transition
- task completion
- appreciation
- celebration

Validation mixes are local/generated artifacts, are ignored by git, do not synchronize against the real storyboard, and do not create a movie.

## Modified files
- `tools/marketing-recording/audio/config.mjs`
- `tools/marketing-recording/audio/director.mjs`
- `tools/marketing-recording/audio/export-helpers.mjs`
- `tools/marketing-recording/audio/generate-placeholder-assets.mjs`
- `tools/marketing-recording/audio/index.mjs`
- `tools/marketing-recording/audio/mixer.mjs`
- `tools/marketing-recording/audio/music-track.mjs`
- `tools/marketing-recording/audio/sound-library.mjs`
- `tools/marketing-recording/audio/timeline.mjs`
- `tools/marketing-recording/audio/validate-audio-framework.mjs`
- `tools/marketing-recording/audio/wav.mjs`
- `tools/marketing-recording/audio/.gitignore`
- `docs/reports/2026-06-28-marketing-audio-framework/marketing-audio-framework.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

## Explicit answers
- Is the audio framework reusable? Yes.
- Does it depend on production UI? No.
- Can licensed music be added later without framework changes? Yes.
- Does the framework subscribe to Marketing Director events? Yes.
- Are placeholder sounds intentionally replaceable? Yes; generated placeholders are created on demand and are not committed.
- Was no movie intentionally created? Yes; no movie was created.
