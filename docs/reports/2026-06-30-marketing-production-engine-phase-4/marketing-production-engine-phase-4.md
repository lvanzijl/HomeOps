# Marketing Production Engine Phase 4 Recording

## Summary
- Added a Recording stage to the Marketing Production Engine.
- The production engine now executes Runtime, Storyboard, and Recording in order.
- The Recording stage loads Playwright, creates the existing RecordingSession, runs all 9 storyboard scenes, and produces a temporary raw WebM artifact.
- The raw validation artifact was produced at `/tmp/familyboard-marketing-preview-v1.webm` and was not committed.
- No audio was generated, no muxing occurred, no metadata generation was implemented, no timing report was generated, no cleanup stage was implemented, and no MP4 was produced.

## Recording architecture
The Recording stage lives in `tools/marketing-production/recording/` and exposes `runRecordingStage(config, { recordingPlan, runtimeStatus, repoRoot })` to the production engine.

The stage receives:

- validated production configuration
- structured RecordingPlan from the Storyboard stage
- Runtime stage status
- repository root for module/tool resolution

The stage does not load or validate the storyboard again and does not create its own recording plan. The Storyboard stage keeps the executable Director scenes attached to the structured RecordingPlan as a non-enumerable implementation detail so the production engine can pass the same plan forward without serializing executable callbacks.

## Recording stage
The stage owns production-level recording orchestration:

- loads Playwright from the client toolchain
- imports the existing RecordingSession
- creates a RecordingSession with configured app URL, fixture base URL, and raw video directory
- starts the RecordingSession, which creates the browser context and page through the existing Recording Framework
- runs all 9 scenes from the generated RecordingPlan
- closes the browser/session through RecordingSession shutdown
- persists the raw Playwright WebM to `/tmp/familyboard-marketing-preview-v1.webm`

The stage does not duplicate RecordingSession internals, camera helpers, touch helpers, transitions, fixture reset behavior, or Chapter Card rendering.

## Structured status
The production engine now returns structured Recording status with:

- `recordingStarted`
- `recordingCompleted`
- `rawRecordingPath`
- `sceneCount`
- `completedSceneCount`
- `browserStarted`
- `browserContextCreated`
- `recordingSessionCreated`
- `browserClosed`
- `failure` when applicable

For validation, the returned status showed recording started and completed, 9 scenes were completed, the browser was started and closed, the RecordingSession was created, and the raw WebM path existed.

## Validation
Validated:

- Runtime stage passes.
- Storyboard stage passes.
- Recording stage passes.
- Playwright launches.
- Browser context is created.
- RecordingSession is created.
- RecordingSession executes all 9 storyboard scenes.
- Raw recording artifact exists at `/tmp/familyboard-marketing-preview-v1.webm`.
- Browser shuts down through RecordingSession stop.
- No muxing was performed.
- No audio was generated.
- No metadata was generated.
- No timing report was generated.
- No cleanup stage was implemented.
- No MP4 was produced.
- Whitespace diff check passes.

Commands run:

```bash
npm --prefix src/HomeOps.Client install --save-dev playwright
npm --prefix src/HomeOps.Client exec -- playwright install chromium
npm --prefix src/HomeOps.Client exec -- playwright install-deps chromium
node tools/marketing-production/production.mjs
npm --prefix src/HomeOps.Client run marketing:record
du -h /tmp/familyboard-marketing-preview-v1.webm
git diff --check
git diff --stat
git diff -- tools/marketing-production src/HomeOps.Client/package.json src/HomeOps.Client/package-lock.json docs/reports/2026-06-30-marketing-production-engine-phase-4/marketing-production-engine-phase-4.md docs/state/current-state.md docs/roadmap/phase-2.md
```

## Modified files
- `tools/marketing-production/production.mjs`
- `tools/marketing-production/config/default-production-config.mjs`
- `tools/marketing-production/storyboard/storyboard-stage.mjs`
- `tools/marketing-production/recording/recording-stage.mjs`
- `src/HomeOps.Client/package.json`
- `src/HomeOps.Client/package-lock.json`
- `docs/reports/2026-06-30-marketing-production-engine-phase-4/marketing-production-engine-phase-4.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

## Explicit answers
- Does the Production Engine now own recording execution? **Yes.** The production entry point now runs the Recording stage after Runtime and Storyboard pass.
- Does it reuse RecordingSession? **Yes.** The Recording stage imports and creates the existing `RecordingSession` instead of duplicating Recording Framework internals.
- Does it execute the complete RecordingPlan? **Yes.** The Recording stage executes all 9 scenes from the Storyboard stage RecordingPlan.
- Does it produce a raw recording artifact? **Yes.** The validation run produced `/tmp/familyboard-marketing-preview-v1.webm`.
- Was no MP4 intentionally produced? **Yes.** Phase 4 stops at raw WebM recording output and does not mux or export MP4.
- Was no audio intentionally produced? **Yes.** Audio generation remains unimplemented for this phase.
