# Marketing Production Engine Phase 5 Audio

## Summary
- Added an Audio stage to the Marketing Production Engine.
- The Production Engine now executes Runtime, Storyboard, Recording, and Audio in order.
- The Audio stage creates a deterministic temporary workspace outside the repository.
- The stage generates placeholder WAV assets only in the temporary workspace.
- The stage reuses the existing Audio Framework director, timeline, sound library, mixer, WAV helper, and export helper.
- The stage produces one temporary mixed soundtrack at `/tmp/familyboard-marketing-audio/mix.wav`.
- No MP4 muxing, metadata generation, timing generation, cleanup implementation, production UI change, storyboard change, Recording Framework change, Marketing Director change, or Audio Framework redesign was performed.

## Audio architecture
The Audio stage lives in `tools/marketing-production/audio/` and exposes `runAudioStage(config, { recordingPlan, runtimeStatus, recordingStatus })` to the production entry point.

The stage receives:

- validated production configuration
- structured RecordingPlan from the Storyboard stage
- Runtime status
- Recording status

The stage does not launch Playwright, does not perform recording, and does not create its own recording plan.

## Temporary audio workspace
The configured temporary audio workspace is `/tmp/familyboard-marketing-audio`.

The stage creates or reuses:

- `/tmp/familyboard-marketing-audio`
- `/tmp/familyboard-marketing-audio/assets`

Placeholder WAV assets are written only into `/tmp/familyboard-marketing-audio/assets`. The mixed soundtrack is written only to `/tmp/familyboard-marketing-audio/mix.wav`.

No repository WAV files are created.

## Audio stage
The stage orchestrates the existing Audio Framework by:

- importing `tools/marketing-recording/audio/index.mjs`
- importing the existing recording event types
- importing the existing WAV helper
- generating temporary placeholder WAV files with the existing WAV writer
- wiring temporary asset paths through Sound Library overrides
- creating the existing Marketing Audio Director
- publishing deterministic recording-plan-derived audio events into the Director
- mixing the generated timeline with the existing AudioMixer
- exporting the result with the existing export helper

The Production Engine owns orchestration. The Audio Framework owns timeline, sound library, mixer, and WAV export behavior.

## Structured status
The production engine now returns structured Audio status with:

- `audioStarted`
- `placeholderAssetsGenerated`
- `generatedAssetCount`
- `soundtrackMixed`
- `mixedAudioPath`
- `audioFrameworkLoaded`
- `workspacePath`
- `failure` when applicable

Validation returned `generatedAssetCount: 10`, `soundtrackMixed: true`, and `mixedAudioPath: /tmp/familyboard-marketing-audio/mix.wav`.

## Validation
Validated:

- Runtime stage passes.
- Storyboard stage passes.
- Recording stage passes.
- Audio stage passes.
- Placeholder WAV assets are generated into `/tmp/familyboard-marketing-audio/assets`.
- Audio Framework loads.
- Soundtrack is mixed.
- Mixed soundtrack exists at `/tmp/familyboard-marketing-audio/mix.wav`.
- No MP4 is produced.
- No muxing occurs.
- No repository WAV files are created.
- Whitespace diff check passes.

Commands run:

```bash
rm -rf /tmp/familyboard-marketing-audio /tmp/familyboard-marketing-preview-v1.webm
node tools/marketing-production/production.mjs
npm --prefix src/HomeOps.Client run marketing:record
find . -path './.git' -prune -o -name '*.wav' -print
git diff --check
git diff --stat
git diff -- tools/marketing-production docs/reports/2026-06-30-marketing-production-engine-phase-5/marketing-production-engine-phase-5.md docs/state/current-state.md docs/roadmap/phase-2.md
```

## Modified files
- `tools/marketing-production/production.mjs`
- `tools/marketing-production/config/default-production-config.mjs`
- `tools/marketing-production/audio/audio-stage.mjs`
- `docs/reports/2026-06-30-marketing-production-engine-phase-5/marketing-production-engine-phase-5.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

## Explicit answers
- Does the Production Engine now own audio generation? **Yes.** The production entry point runs the Audio stage after Recording succeeds.
- Does it reuse the existing Audio Framework? **Yes.** The stage imports and uses the existing Audio Director, Sound Library, Timeline, Mixer, WAV helper, and export helper.
- Are placeholder WAV assets generated only into the temporary workspace? **Yes.** They are generated under `/tmp/familyboard-marketing-audio/assets`.
- Is a mixed soundtrack produced? **Yes.** The stage writes `/tmp/familyboard-marketing-audio/mix.wav`.
- Was no MP4 intentionally produced? **Yes.** Muxing and MP4 output remain future phases.
- Were no repository WAV files created? **Yes.** Validation found no `.wav` files in the repository tree.
