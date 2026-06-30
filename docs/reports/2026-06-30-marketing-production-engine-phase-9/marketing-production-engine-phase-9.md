# Marketing Production Engine Phase 9 — Configuration

## Summary

Phase 9 moves remaining production behavior into deterministic configuration so future production tuning can happen primarily by editing config files rather than implementation code.

The Production Engine architecture remains unchanged. The existing stages continue to own Runtime, Storyboard, Recording, Audio, Export, Metadata/Timing, and Cleanup while reading their tunable behavior from the shared configuration model.

## Configuration architecture

Configuration is now split under `tools/marketing-production/config/` by concern:

- `production-config.mjs` keeps production identity, storyboard reference, runtime settings, output naming, report naming, toolchain, and metadata paths together.
- `timing-config.mjs` owns global, scene-level, and interaction-level timing tuning.
- `audio-config.mjs` owns audio workspace, placeholder asset, mixed soundtrack, music, and volume settings.
- `export-config.mjs` owns container, codecs, frame rate, resolution, FFmpeg resolution preferences, and temporary export location.
- `cleanup-config.mjs` owns temporary artifact retention/removal policy.
- `default-production-config.mjs` composes those files into the shared production configuration and validates the full model.

## Timing configuration

Timing is now tunable through configuration without changing storyboard source:

- global Chapter Card duration
- default page hold
- default post-action hold
- default transition multiplier
- default touch hesitation
- per-scene multiplier
- per-scene additional hold
- per-scene transition multiplier
- tap delay
- swipe multiplier
- long-press delay

The Recording stage applies these values to cloned executable scene data during production execution only. The approved storyboard remains unchanged.

## Audio configuration

Audio orchestration now reads configuration for:

- enabled state
- placeholder asset directory
- temporary workspace
- soundtrack output path
- music enabled
- sound effect volume
- music volume
- sample rate

The Audio Framework remains unchanged; the Production Engine passes configured values into the existing Audio Framework APIs.

## Export configuration

Export now reads configuration for:

- temporary export directory
- output path
- container
- video codec
- video codec label
- audio codec
- frame rate
- resolution
- FFmpeg preference order
- imageio-ffmpeg target
- Python executable

FFmpeg discovery now honors the configured preference order before exporting.

## Cleanup configuration

Cleanup policy now supports:

- removing temporary recordings
- removing temporary WAVs
- removing temporary browser profiles
- removing the temporary toolchain
- retaining metadata
- retaining timing JSON
- removing intermediate export files

The Cleanup stage removes only artifact classes enabled by configuration.

## Validation

Validated with:

- `node -e "import('./tools/marketing-production/production.mjs').then(async ({validateProductionEngine}) => { const {defaultProductionConfig}=await import('./tools/marketing-production/config/default-production-config.mjs'); const config={...defaultProductionConfig, timing:{...defaultProductionConfig.timing, global:{...defaultProductionConfig.timing.global, chapterCardDurationMs: 900}}, export:{...defaultProductionConfig.export, frameRate: 24}, audio:{...defaultProductionConfig.audio, soundEffectVolume: 0.2}, cleanup:{...defaultProductionConfig.cleanup, retainTimingJson: true}}; const result=await validateProductionEngine(config); if(!result.valid) { console.error(result); process.exit(1); } console.log('config-variation-ok'); })"`
- `node tools/marketing-production/production.mjs`
- `test -f /tmp/familyboard-marketing-metadata.json && test -f /tmp/familyboard-marketing-timing.json`
- `find . -path './.git' -prune -o \( -name '*.webm' -o -name '*.wav' -o -name '*.mp4' \) -print`
- `git diff --check`

Validation confirmed:

- Runtime uses configuration.
- Storyboard uses configuration.
- Recording uses configuration.
- Audio uses configuration.
- Export uses configuration.
- Metadata uses configuration.
- Cleanup uses configuration.
- A config-only variation validated successfully without code changes.
- The Production Engine completed successfully.
- No generated WebM, WAV, or MP4 files remained in the repository.

## Modified files

- `tools/marketing-production/config/production-config.mjs`
- `tools/marketing-production/config/timing-config.mjs`
- `tools/marketing-production/config/audio-config.mjs`
- `tools/marketing-production/config/export-config.mjs`
- `tools/marketing-production/config/cleanup-config.mjs`
- `tools/marketing-production/config/default-production-config.mjs`
- `tools/marketing-production/recording/recording-stage.mjs`
- `tools/marketing-production/audio/audio-stage.mjs`
- `tools/marketing-production/export/export-stage.mjs`
- `tools/marketing-production/cleanup/cleanup-stage.mjs`
- `docs/reports/2026-06-30-marketing-production-engine-phase-9/marketing-production-engine-phase-9.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

## Explicit answers

- Is production behavior now configuration-driven? Yes. Runtime, Storyboard, Recording, Audio, Export, Metadata/Timing, and Cleanup all read from the shared configuration model.
- Can timing be tuned without changing code? Yes. Timing can be tuned in `timing-config.mjs`.
- Can export settings be changed without changing code? Yes. Export settings can be tuned in `export-config.mjs`.
- Can cleanup policy be changed without changing code? Yes. Cleanup behavior can be tuned in `cleanup-config.mjs`.
- Can audio behavior be changed without changing code? Yes. Audio behavior can be tuned in `audio-config.mjs`.
- Was no movie intentionally produced? Yes. Validation retained no repository movie and no generated media artifacts were committed.
