# Marketing Production Engine Publish Mode

## Summary
- Added configuration-driven Marketing Production Engine modes: `validation` and `publish`.
- Validation remains the default mode and continues to export MP4 to a temporary path before cleanup removes it.
- Publish mode reuses the same runtime, storyboard, recording, audio, export, metadata, timing, and cleanup pipeline, but exports to `docs/demo/` and retains the final MP4.
- No production UI, storyboard, Recording Framework, Marketing Director, or Audio Framework redesign was performed.
- No subjective movie review was performed.

## Mode architecture
The Production Engine resolves mode from either:

```bash
npm --prefix src/HomeOps.Client run marketing:record
```

or:

```bash
MARKETING_PRODUCTION_MODE=publish npm --prefix src/HomeOps.Client run marketing:record
```

A CLI flag is also supported:

```bash
npm --prefix src/HomeOps.Client run marketing:record -- --mode validation
npm --prefix src/HomeOps.Client run marketing:record -- --mode publish
```

Supported values are `validation` and `publish`. If no mode is supplied, the engine uses `validation`.

The timestamp is generated once when the production configuration is created and is reused as the production timestamp and, in publish mode, the filename timestamp.

## Publish output naming
Publish mode writes the final MP4 under:

```text
docs/demo/
```

Published filenames use this deterministic pattern:

```text
familyboard-preview-YYYYMMDD-HHmmss.mp4
```

Because the timestamp is embedded in the filename, multiple published movies can coexist and a publish run does not overwrite earlier publish artifacts.

## Cleanup behavior
Validation mode cleanup removes:
- temporary MP4
- raw WebM
- temporary WAV assets
- mixed soundtrack
- temporary browser profiles

Publish mode cleanup removes:
- raw WebM
- temporary WAV assets
- mixed soundtrack
- temporary browser profiles

Publish mode intentionally retains the timestamped MP4 in `docs/demo/`. Metadata and timing JSON remain retained according to the existing metadata/timing configuration.

## Metadata changes
Metadata now records:
- production mode
- production timestamp
- published output path when running in `publish` mode
- temporary export path when running in `validation` mode
- cleanup retention decision

Timing JSON remains unchanged.

## Validation
Performed checks:
- `npm --prefix src/HomeOps.Client run marketing:record` was attempted for default validation mode. Runtime and storyboard passed, but recording could not launch Chromium because this environment is missing `libatk-1.0.so.0`; no MP4/WebM/WAV files remained in the repository after the failed attempt.
- `MARKETING_PRODUCTION_MODE=publish npm --prefix src/HomeOps.Client run marketing:record` was attempted for publish mode. Runtime and storyboard passed, mode resolved as `publish`, but recording hit the same missing Chromium system library before export/metadata/timing could run; no publish MP4 was generated in this environment.
- `node --input-type=module <<'JS' ... JS` verified publish metadata fields and unchanged timing generation using stage-level deterministic inputs.
- `node --check tools/marketing-production/production.mjs`
- `node --check tools/marketing-production/config/default-production-config.mjs`
- `node --check tools/marketing-production/config/production-mode.mjs`
- `node --input-type=module -e "import { createDefaultProductionConfig } from './tools/marketing-production/config/default-production-config.mjs'; const validation = createDefaultProductionConfig({ mode: 'validation', timestamp: '20260630-214512' }); const publish = createDefaultProductionConfig({ mode: 'publish', timestamp: '20260630-214512' }); if (validation.productionMode !== 'validation' || validation.export.outputPath !== '/tmp/familyboard-marketing-export/familyboard-preview.mp4' || validation.cleanup.removeIntermediateFiles !== true) process.exit(1); if (publish.productionMode !== 'publish' || publish.export.outputPath !== 'docs/demo/familyboard-preview-20260630-214512.mp4' || publish.cleanup.removeIntermediateFiles !== false) process.exit(1);"`
- `git diff --check`

Full default-mode and publish-mode movie generation could not complete in this implementation run because Chromium could not start in the container due to the missing `libatk-1.0.so.0` system library. No MP4 binary was generated or retained by this slice.

## Modified files
- `tools/marketing-production/config/production-mode.mjs`
- `tools/marketing-production/config/default-production-config.mjs`
- `tools/marketing-production/production.mjs`
- `tools/marketing-production/metadata/metadata-stage.mjs`
- `docs/reports/2026-06-30-marketing-production-engine-publish-mode/marketing-production-engine-publish-mode.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

## Explicit answers
- Does the engine support validation and publish modes? **Yes.**
- Is validation mode still the default? **Yes.**
- Does publish mode retain a timestamped MP4? **Yes.**
- Can multiple published movies coexist? **Yes.** Timestamped filenames avoid overwriting previous publish artifacts.
- Are temporary artifacts still cleaned? **Yes.** Raw WebM, WAV assets, mixed soundtrack, and browser profiles remain temporary cleanup targets.
- Was no subjective movie review performed? **Yes.** No subjective movie review was performed.
