# Marketing Storyboard Weather Validation

## Summary

Validated the current FamilyBoard Marketing Preview V1 storyboard after the recent Home, Agenda, weather, layout, and polish changes. The existing validation pipeline now completes successfully in validation mode with all 9 storyboard scenes recorded and verified. No storyboard narrative redesign, scene additions, duration changes, production-structure changes, product UI changes, frontend feature work, backend feature work, movie publish, or repository binary artifacts were introduced.

## Blockers Found

- Initial validation could not start the Playwright Chromium browser because the container was missing required system libraries, beginning with `libatk-1.0.so.0`.
- No storyboard blockers were found from changed selectors, text, layout, Home weather rendering, Agenda weather rendering, timing, or scene assumptions after the browser dependency blocker was removed.
- Home weather validation still found the controlled marketing weather affordance and opened/closed the existing weather detail dialog successfully.
- Agenda validation still found the default Planning briefing, the Today weather context, Planning tools, and saved `Filmavond` in the Planning briefing.

## Fixes Applied

- Installed the missing Playwright Chromium operating-system dependencies in the execution environment with `npx --yes playwright install-deps chromium`.
- No repository source changes were required to selectors, storyboard actions, product UI, frontend features, backend features, weather behavior, scene order, scene duration, or production structure.

## Validation

- `export DOTNET_ROOT=$HOME/.dotnet; export PATH=$HOME/.dotnet:$HOME/.dotnet/tools:$PATH; dotnet --info` completed successfully and confirmed the local .NET SDK/runtime environment.
- Initial `MARKETING_PRODUCTION_MODE=validation npm --prefix src/HomeOps.Client run marketing:record` failed before storyboard recording because Chromium could not load `libatk-1.0.so.0`.
- `npx --yes playwright install-deps chromium` completed successfully after an apt index warning for the external `mise.jdx.dev` repository; Ubuntu package sources supplied the required browser libraries.
- Final `MARKETING_PRODUCTION_MODE=validation npm --prefix src/HomeOps.Client run marketing:record` passed.
- Final validation result: `valid: true`.
- Storyboard stage: loaded, validation passed, Marketing Director loaded, and recording plan generated.
- Recording stage: completed all 9 scenes.
- Cleanup stage: completed with no remaining temporary production artifacts.
- Movie was not rendered/published to the repository. Validation mode produced only temporary media and removed it during cleanup.
- No binary artifacts were added to the changeset.

## Remaining Risks

- The validation run creates temporary recording, audio, export, metadata, and timing files under `/tmp`; the pipeline cleanup removed temporary media artifacts, but `/tmp` metadata/timing are intentionally outside the repository and were not committed.
- The first run exposed an environment dependency risk: fresh containers may need Playwright Chromium system dependencies installed before storyboard validation can reach the browser stage.
- The successful run validates execution and anchors; it is not a subjective movie review and does not publish the marketing movie.

## Modified Files

- `docs/reports/2026-07-05-marketing-storyboard-weather-validation/marketing-storyboard-weather-validation.md`
