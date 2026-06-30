# Marketing Production Engine Phase 1

## Summary
- Created `tools/marketing-production/` as the first deterministic FamilyBoard Marketing Production Engine slice.
- Added a validation-only executable entry point for future production orchestration.
- Added a shared production configuration model and ordered pipeline model.
- Added an npm script for the future `marketing:record` command path.
- No browser was started, no recording was made, no audio was generated, and no movie was produced.

## Architecture
The new production engine is the orchestration layer above the existing stack:

1. Marketing Production Engine
2. Recording Framework
3. Marketing Director
4. Executable Storyboard
5. VisualReview Runtime

The engine discovers existing repository systems rather than moving, duplicating, or replacing them:

- Recording Framework: `tools/marketing-recording/session.mjs`
- Marketing Director: `tools/marketing-recording/director.mjs`
- Audio Framework: `tools/marketing-recording/audio/index.mjs`
- Executable storyboard: `tools/marketing-recording/storyboards/marketing-preview-v1.mjs`

## Production entry point
`tools/marketing-production/production.mjs` is executable and validates orchestration only. It loads the production config, validates the pipeline model, resolves the executable storyboard, discovers existing systems, and reports that Phase 1 intentionally produced no movie.

## Configuration model
`tools/marketing-production/config/default-production-config.mjs` defines shared production configuration concepts:

- production name
- storyboard module/export names
- runtime URLs and VisualReview runtime documentation
- output path and report path
- resolution, frame rate, codecs, and container
- audio enabled and audio format settings
- cleanup policy

The configuration references the existing storyboard module and does not duplicate storyboard scene data.

## Pipeline model
`tools/marketing-production/pipeline.mjs` defines the deterministic phase order:

1. Runtime
2. Storyboard
3. Recording
4. Audio
5. Metadata
6. Timing
7. Cleanup
8. Report

Phase 1 marks orchestration validation as non-media-producing. Later phases can implement individual stages without changing the responsibility boundary.

## Validation
Validated:

- production engine loads
- configuration loads
- storyboard resolves
- recording framework can be discovered
- marketing director can be discovered
- audio framework can be discovered
- production pipeline model validates
- whitespace diff check passes

Commands run:

```bash
node tools/marketing-production/production.mjs
npm --prefix src/HomeOps.Client run marketing:record
git diff --check
git diff --stat
git diff -- tools/marketing-production src/HomeOps.Client/package.json docs/reports/2026-06-30-marketing-production-engine-phase-1/marketing-production-engine-phase-1.md docs/state/current-state.md docs/roadmap/phase-2.md
```

## Modified files
- `tools/marketing-production/production.mjs`
- `tools/marketing-production/pipeline.mjs`
- `tools/marketing-production/config/default-production-config.mjs`
- `src/HomeOps.Client/package.json`
- `docs/reports/2026-06-30-marketing-production-engine-phase-1/marketing-production-engine-phase-1.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

## Explicit answers
- Was a production engine created? **Yes.** `tools/marketing-production/` now contains the Phase 1 production engine entry point, configuration, and pipeline model.
- Does it orchestrate existing systems rather than replacing them? **Yes.** It discovers and validates existing Recording Framework, Marketing Director, Audio Framework, and executable storyboard modules.
- Is it ready for future implementation phases? **Yes.** The deterministic phase model and configuration boundary are in place for later runtime, recording, audio, metadata, timing, cleanup, and reporting implementations.
- Was no movie intentionally produced? **Yes.** Phase 1 intentionally produced no movie and did not start a browser, record, generate media, mux output, or add binary artifacts.
