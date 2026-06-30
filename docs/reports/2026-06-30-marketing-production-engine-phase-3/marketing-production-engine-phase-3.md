# Marketing Production Engine Phase 3 Storyboard

## Summary
- Added a Storyboard stage to the Marketing Production Engine.
- The production engine now owns executable storyboard loading, validation, Marketing Director loading, and recording-plan generation.
- The stage uses existing storyboard and Marketing Director code instead of duplicating validation or plan-generation logic.
- The engine now executes Runtime, then Storyboard, then stops.
- No browser was launched, no Playwright session started, no recording occurred, no audio was generated, and no movie was produced.

## Storyboard architecture
The Storyboard stage lives in `tools/marketing-production/storyboard/` and exposes `runStoryboardStage(config)` to the production engine.

The stage reads storyboard configuration from `default-production-config.mjs`:

- storyboard module path
- storyboard export name
- storyboard validation export name

The stage resolves the configured executable storyboard module, validates that the configured storyboard export exists, and returns structured stage status instead of relying on free-form logs.

## Marketing Director integration
The Storyboard stage imports the existing `MarketingDirector` and `marketingPacingProfiles` from `tools/marketing-recording/director.mjs`.

It uses the existing Director to:

- validate the executable storyboard
- apply the calm marketing pacing profile
- create the recording plan

The stage also calls the storyboard module's configured validation export when present. It does not reimplement Marketing Director validation logic and does not modify the Director.

## Recording plan
The stage exposes a structured `recordingPlan` object for later pipeline stages.

The plan includes:

- storyboard id and title
- scene count
- preferred and maximum durations in milliseconds and seconds
- emotional curve metadata
- ordered scene summaries
- scene fixture and narrative metadata
- transition metadata
- chapter card metadata
- timing metadata
- recording metadata such as action count, scene duration bounds, duration hint, and pacing profile
- source, household, fixture-date, and canonical-week metadata

Validation confirmed the canonical plan contains 9 scenes, an 84-second preferred duration, a 90-second maximum duration, chapter card metadata for every scene, and emotional curve metadata.

## Structured status
The production engine now returns structured Storyboard status with:

- `loaded`
- `validationPassed`
- `marketingDirectorLoaded`
- `recordingPlanGenerated`
- `sceneCount`
- `preferredDurationMs`
- `maximumDurationMs`
- `chapterCardMetadataExists`
- `emotionalCurveMetadataExists`

The production engine includes that status alongside the structured Runtime status and the structured `recordingPlan`.

## Validation
Validated:

- runtime stage passes
- storyboard loads
- storyboard validates
- Marketing Director loads
- recording plan is generated
- recording plan contains 9 scenes
- preferred duration is 84 seconds
- maximum duration is 90 seconds
- chapter card metadata exists
- emotional curve metadata exists
- no browser launches
- no recording occurs
- no media is produced
- whitespace diff check passes

Commands run:

```bash
node tools/marketing-production/production.mjs
npm --prefix src/HomeOps.Client run marketing:record
ps -ef | rg 'dotnet|vite|marketing-production|npm run dev' || true
git diff --check
git diff --stat
git diff -- tools/marketing-production docs/reports/2026-06-30-marketing-production-engine-phase-3/marketing-production-engine-phase-3.md docs/state/current-state.md docs/roadmap/phase-2.md
```

## Modified files
- `tools/marketing-production/production.mjs`
- `tools/marketing-production/storyboard/storyboard-stage.mjs`
- `docs/reports/2026-06-30-marketing-production-engine-phase-3/marketing-production-engine-phase-3.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

## Explicit answers
- Does the production engine now own storyboard loading? **Yes.** The Storyboard stage loads the configured executable storyboard module and export.
- Does it validate the executable storyboard? **Yes.** It uses the existing Marketing Director validation and the storyboard module's configured validation export.
- Does it use the existing Marketing Director? **Yes.** It imports and instantiates the existing `MarketingDirector` from the Recording Framework layer.
- Does it generate a recording plan? **Yes.** It uses `MarketingDirector.createRecordingPlan` to generate the plan.
- Is the recording plan available for future stages? **Yes.** The production engine result exposes a structured `recordingPlan` object.
- Was no browser launched? **Yes.** Runtime starts API/frontend processes only; no Playwright/browser code is invoked.
- Was no movie intentionally produced? **Yes.** Recording and media-producing stages remain unimplemented in this slice.
