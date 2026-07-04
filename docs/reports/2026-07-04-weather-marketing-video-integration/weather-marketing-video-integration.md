# Weather Marketing Video Integration

## Summary

Integrated the completed FamilyBoard weather feature into the existing marketing video production flow without redesigning the weather UI or introducing a frontend mock layer. The Home weather pill is now an explicit opening/Home validation anchor, the Home scene briefly opens and closes the existing weather detail dialog, and Agenda validation confirms the already-implemented subtle weather context appears inside the Planning briefing.

## Storyboard Changes

- Updated the canonical marketing storyboard to mention weather as quiet context in the Home continuity thread.
- Increased the Home scene preferred duration from 7 seconds to 8 seconds, keeping the total preferred duration at 85 seconds and the maximum at 90 seconds.
- Preserved the existing 9-scene narrative, scene order, chapter structure, and feature emphasis.
- Added the weather detail dialog as a short supporting beat in the Home scene. It is shown briefly, then closed so Home returns to the same dashboard state.
- Added Agenda wording that the already-implemented weather context appears subtly where it naturally belongs in the Planning briefing.

## Production Data Strategy

Production recording uses controlled backend VisualReview scenario weather data through a VisualReview-only `IWeatherSnapshotSource`. The frontend continues to call the real generated weather API/client path for Home, detail, and Agenda weather. No frontend weather mock layer was introduced.

Live Open-Meteo data is still used outside VisualReview. VisualReview uses deterministic marketing weather so the Home pill, weather detail dialog, and Agenda weather clusters are reproducible during marketing production.

## Weather Scenes Covered

- **Intro / Home opening:** validates that the Home header weather pill is visible as part of the initial dashboard.
- **Home:** validates the weather pill, opens the existing `Weer voor vandaag` detail dialog briefly, then closes it and returns to the Home dashboard.
- **Agenda:** validates the Planning briefing and confirms the subtle Today weather context is present in the implemented Agenda surface.

## Validation

- `dotnet --info` completed with the requested local .NET environment exports.
- `node tools/marketing-recording/storyboards/marketing-preview-v1.mjs` passed storyboard validation with 9 scenes, 85 seconds preferred duration, and 90 seconds maximum duration.
- `npm --prefix src/HomeOps.Client run marketing:record` reached runtime and storyboard validation, started the production recording path, and confirmed the 85-second recording plan. It remains blocked at Chromium launch because the environment is missing `libatk-1.0.so.0`.
- `dotnet test HomeOps.sln --no-restore` passed.
- No frontend files changed, so frontend build/tests were not required for this slice.
- No unintended binary artifacts were added to the changeset.

## Risks

- Full video recording/export could not be completed in this environment because Chromium cannot launch without `libatk-1.0.so.0`.
- The weather detail dialog adds one second to preferred timing. This remains within the existing 90-second maximum, but final visual pacing should be reviewed when the recording environment can launch Chromium.
- VisualReview weather is deterministic and production-mode-only; future marketing weather variations should remain backend scenario data rather than frontend mocks.

## Modified Files

- `docs/design/marketing-storyboard-v1.md`
- `docs/reports/2026-07-04-weather-marketing-video-integration/weather-marketing-video-integration.md`
- `docs/roadmap/phase-2.md`
- `docs/state/current-state.md`
- `src/HomeOps.Api/Program.cs`
- `src/HomeOps.Api/VisualReviewFixtures/VisualReviewMarketingWeatherSnapshotSource.cs`
- `tests/HomeOps.Api.Tests/Weather/VisualReviewMarketingWeatherSnapshotSourceTests.cs`
- `tools/marketing-production/storyboard/storyboard-stage.mjs`
- `tools/marketing-recording/storyboards/marketing-preview-v1.mjs`
