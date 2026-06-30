# Marketing Production Engine Phase 8 — Timing Metadata

## Summary

Phase 8 integrates deterministic timing generation into the existing Metadata stage. No separate Timing pipeline stage was added. The Recording stage now captures monotonic execution timings while scenes, transitions, Chapter Cards, and actions execute, and the Metadata stage persists detailed timing JSON alongside the production metadata JSON.

The production engine still runs the existing pipeline boundaries: Runtime, Storyboard, Recording, Audio, Export, Metadata, and Cleanup. Cleanup removes temporary media artifacts while retaining the metadata and timing JSON validation outputs outside the repository.

## Timing architecture

Timing is production metadata. The Production Engine writes detailed timing to:

- `/tmp/familyboard-marketing-timing.json`

The timing JSON includes:

- recording start offset
- recording finish offset
- total recorded scene duration
- planned total duration
- scene count
- per-scene planned start, actual start, actual finish, actual duration, and delta
- per-transition planned and actual duration
- per-Chapter Card planned and actual duration
- per-action start, finish, and duration

## Recording instrumentation

The Recording stage creates a monotonic timing recorder before scene execution starts. It passes that recorder as the `eventBus` into the existing `RecordingSession.runScene` calls, so timing is captured from execution events instead of inferred afterward.

The recorder observes existing scene, transition, Chapter Card, and action lifecycle events and records actual monotonic offsets as the events happen. The stage returns the captured timing object on the structured Recording status for the Metadata stage to persist.

## Metadata integration

The Metadata stage now requires captured recording timing before metadata generation can complete. It writes `/tmp/familyboard-marketing-timing.json`, verifies the timing JSON can be loaded, and stores only a timing summary/reference in `/tmp/familyboard-marketing-metadata.json`.

The metadata JSON includes:

- timing file path
- overall duration
- scene count
- planned duration
- actual duration

Detailed timing remains in the timing JSON and is not duplicated into metadata.

## Validation

Validated with:

- `node tools/marketing-production/production.mjs`
- `node -e "const fs=require('fs'); const timing=JSON.parse(fs.readFileSync('/tmp/familyboard-marketing-timing.json','utf8')); if(timing.scenes.length!==9) process.exit(1); if(timing.transitions.length!==9) process.exit(1); if(timing.chapterCards.length!==9) process.exit(1); if(timing.totalDurationMs!==timing.scenes.reduce((total, scene)=>total+scene.actualDurationMs,0)) process.exit(1); console.log('timing-ok');"`
- `test -f /tmp/familyboard-marketing-metadata.json && test -f /tmp/familyboard-marketing-timing.json`
- `find . -path './.git' -prune -o \( -name '*.webm' -o -name '*.wav' -o -name '*.mp4' \) -print`
- `git diff --check`

Validation confirmed:

- Runtime passed.
- Storyboard passed.
- Recording passed.
- Audio passed.
- Export passed to a temporary MP4 path.
- Metadata passed and wrote metadata plus timing JSON.
- Cleanup passed and removed temporary media artifacts.
- Every storyboard scene had timing.
- Every transition had timing.
- Every Chapter Card had timing.
- Total duration equaled the sum of recorded scene execution durations.
- No generated WebM, WAV, or MP4 files remained in the repository.

## Modified files

- `tools/marketing-production/recording/recording-stage.mjs`
- `tools/marketing-production/metadata/metadata-stage.mjs`
- `tools/marketing-production/config/default-production-config.mjs`
- `tools/marketing-production/pipeline.mjs`
- `tools/marketing-production/production.mjs`
- `docs/reports/2026-06-30-marketing-production-engine-phase-8/marketing-production-engine-phase-8.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

## Explicit answers

- Does the Production Engine now generate deterministic timing? Yes. It generates `/tmp/familyboard-marketing-timing.json` from monotonic execution timings.
- Is timing captured during execution instead of inferred afterwards? Yes. The Recording stage captures timing from lifecycle events while scenes execute.
- Does every scene contain planned and actual duration? Yes. Each scene includes planned duration, actual start, actual finish, actual duration, and delta.
- Is timing integrated with Metadata? Yes. Metadata writes the timing JSON and stores a timing summary/reference in metadata JSON.
- Was no new pipeline stage introduced? Yes. Timing is integrated into Metadata and the pipeline does not include a separate Timing stage.
- Was no production UI changed? Yes. No production UI files were changed.
- Was no movie intentionally retained? Yes. Export output remains temporary and Cleanup removes temporary media artifacts.
