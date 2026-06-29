# Marketing Shopping Fixture Alignment

Date: 2026-06-29

## Summary

Aligned the canonical VisualReview marketing shopping fixture with the approved Van Zijl household and Marketing Storyboard V1 continuity. The fixture now includes ordinary baking ingredients for the `Koekjes bakken` storyline before recording begins, while keeping the grouped shopping story intact and leaving `Bananen` absent so the storyboard can still add it once.

No movie, screenshots, videos, audio, WAV files, production shopping behavior changes, UI redesign, Marketing Director changes, Recording Framework changes, Audio Framework changes, or binary artifacts were produced.

## Fixture updates

- Added `Bloem` and `Vanillesuiker` to the `Albert Heijn` grouped shopping fixture items.
- Added `Roomboter` and `Chocoladestukjes` to the `HEMA` grouped shopping fixture items.
- Removed pre-seeded `Bananen` from the shopping fixture so the existing storyboard interaction can add it without duplicating an item.
- Kept the active localized `Boodschappen` list and existing store grouping structure.

## Story continuity improvements

The shopping fixture now supports the approved continuity thread:

Tasks → `Koekjes bakken` → Shopping → Weekly Reset

The baking ingredients are present as normal shopping items rather than highlighted demo-only data, so the Shopping scene can naturally imply that the family is already preparing for baking. The storyboard remains consistent because `Bananen` is not pre-seeded and can still be the single quick-add interaction during recording.

## Validation

- `dotnet test HomeOps.sln` passed, including the focused marketing fixture test that verifies `Bloem`, `Roomboter`, `Chocoladestukjes`, and `Vanillesuiker` are active shopping items and `Bananen` is not pre-seeded.
- `dotnet test HomeOps.sln --no-build` passed after the build validation.
- `git diff --check` passed.
- Diff inspection confirmed changes are limited to the marketing shopping fixture builder, fixture API coverage, this report, and current-state documentation.

## Modified files

- `src/HomeOps.Api/VisualReviewFixtures/MarketingHouseholdFixtureBuilder.cs`
- `tests/HomeOps.Api.Tests/Lists/VisualReviewFixtureApiTests.cs`
- `docs/state/current-state.md`
- `docs/reports/2026-06-29-marketing-shopping-fixture-alignment/marketing-shopping-fixture-alignment.md`

## Explicit answers

- **Does the shopping fixture now support the Koekjes bakken storyline?** Yes.
- **Are the baking ingredients present?** Yes; `Bloem`, `Roomboter`, `Chocoladestukjes`, and `Vanillesuiker` are seeded as active fixture items.
- **Is the storyboard still consistent with the fixture?** Yes; `Bananen` is no longer pre-seeded, so the storyboard can still add it once during recording.
- **Was any production shopping behavior changed?** No.
- **Was no movie intentionally produced?** Yes.
