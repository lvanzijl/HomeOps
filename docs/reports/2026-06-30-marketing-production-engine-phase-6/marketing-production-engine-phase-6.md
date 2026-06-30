# Marketing Production Engine Phase 6 Export

## Summary
- Added an Export stage to the Marketing Production Engine.
- The Production Engine now executes Runtime, Storyboard, Recording, Audio, and Export in order.
- The Export stage locates the raw WebM recording and mixed WAV soundtrack from structured stage status.
- The stage resolves FFmpeg through configuration, PATH, or the imageio-ffmpeg fallback.
- The stage exports the final MP4 to `docs/demo/familyboard-preview.mp4`.
- No metadata generation, timing generation, cleanup implementation, subjective quality review, production UI change, storyboard change, Recording Framework change, Marketing Director change, or Audio Framework redesign was performed.

## Export architecture
The Export stage lives in `tools/marketing-production/export/` and exposes `runExportStage(config, { runtimeStatus, recordingStatus, audioStatus, repoRoot })` to the production entry point.

The stage receives:

- validated production configuration
- Runtime status
- Recording status
- Audio status

The stage does not launch Playwright, does not record, does not create audio, does not regenerate WAV files, and does not create its own recording plan.

## FFmpeg orchestration
The stage resolves FFmpeg in this order:

1. configured `export.ffmpegExecutable`, when present and available
2. `ffmpeg` on PATH
3. `imageio-ffmpeg` fallback installed under `/tmp/homeops-imageio-ffmpeg`

Validation resolved FFmpeg through the imageio-ffmpeg fallback:

`/tmp/homeops-imageio-ffmpeg/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2`

The FFmpeg command uses the structured Recording and Audio outputs:

- raw video: `/tmp/familyboard-marketing-preview-v1.webm`
- mixed audio: `/tmp/familyboard-marketing-audio/mix.wav`
- output: `docs/demo/familyboard-preview.mp4`

Export settings are H.264 video, AAC audio, 1920×1080, approximately 30 FPS, and `+faststart` for MP4 playback.

## Structured status
The production engine now returns structured Export status with:

- `exportStarted`
- `exportCompleted`
- `ffmpegResolved`
- `ffmpegExecutable`
- `ffmpegSource`
- `rawVideoPath`
- `mixedAudioPath`
- `outputPath`
- `outputExists`
- `failure` when applicable

Validation returned `exportCompleted: true`, `ffmpegResolved: true`, and `outputExists: true` for `/workspace/HomeOps/docs/demo/familyboard-preview.mp4`.

## Validation
Validated:

- Runtime stage passes.
- Storyboard stage passes.
- Recording stage passes.
- Audio stage passes.
- Export stage passes.
- FFmpeg resolves through imageio-ffmpeg fallback.
- Final MP4 exists at `docs/demo/familyboard-preview.mp4`.
- Output path is correct.
- No metadata was generated.
- No timing report was generated.
- No cleanup was implemented.
- No subjective analysis was performed.
- Whitespace diff check passes.

Commands run:

```bash
rm -f /tmp/familyboard-marketing-preview-v1.webm /tmp/familyboard-marketing-audio/mix.wav
node tools/marketing-production/production.mjs
npm --prefix src/HomeOps.Client run marketing:record
git diff --check
git diff --stat
git diff -- tools/marketing-production docs/demo/familyboard-preview.mp4 docs/reports/2026-06-30-marketing-production-engine-phase-6/marketing-production-engine-phase-6.md docs/state/current-state.md docs/roadmap/phase-2.md
```

## Modified files
- `tools/marketing-production/production.mjs`
- `tools/marketing-production/config/default-production-config.mjs`
- `tools/marketing-production/export/export-stage.mjs`
- `docs/demo/familyboard-preview.mp4`
- `docs/reports/2026-06-30-marketing-production-engine-phase-6/marketing-production-engine-phase-6.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

## Explicit answers
- Does the Production Engine now own MP4 export? **Yes.** The production entry point runs the Export stage after Audio succeeds.
- Does it reuse the existing recording and audio outputs? **Yes.** It uses `recording.rawRecordingPath` and `audio.mixedAudioPath` from structured stage status.
- Was FFmpeg resolved successfully? **Yes.** Validation resolved FFmpeg through the imageio-ffmpeg fallback.
- Was the final MP4 produced? **Yes.** `docs/demo/familyboard-preview.mp4` was produced and verified.
- Was no metadata generated? **Yes.** Metadata generation remains unimplemented.
- Was no cleanup implemented? **Yes.** Cleanup remains a future stage.
