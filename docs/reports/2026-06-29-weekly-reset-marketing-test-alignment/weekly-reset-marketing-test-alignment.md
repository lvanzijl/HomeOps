# Weekly Reset Marketing Test Alignment

Date: 2026-06-29

## Summary

Aligned the VisualReview marketing fixture API test with the approved marketing timeline: regular marketing fixtures use the canonical Tuesday anchor, while the Weekly Reset fixture intentionally uses the Sunday end-of-week anchor.

No production code, runtime behavior, marketing fixtures, Marketing Time Provider, storyboard, Marketing Director, Recording Framework, Audio Framework, screenshots, videos, audio, WAV files, or binary artifacts were changed.

## Root cause

`visual-marketing-weekly-reset` intentionally represents the Sunday close of the canonical marketing week. The implementation returns `2026-06-21T17:35:00+00:00`, matching the marketing time-provider report and production-readiness findings.

The test still asserted the regular Tuesday marketing anchor (`2026-06-16T07:05:00+00:00`) for every marketing fixture, including Weekly Reset. The implementation was correct; the test expectation was stale.

## Test updates

- Kept the existing marketing fixture validation coverage.
- Updated only the anchor expectation inside `MarketingScenariosUseCanonicalHousehold`:
  - Regular marketing fixtures: `2026-06-16T07:05:00+00:00`.
  - `visual-marketing-weekly-reset`: `2026-06-21T17:35:00+00:00`.
- Left household, task, list, event, and motivation assertions intact.

## Validation

- `dotnet test HomeOps.sln --no-build` passed.
- `git diff --check` passed.

## Modified files

- `tests/HomeOps.Api.Tests/Lists/VisualReviewFixtureApiTests.cs`
- `docs/state/current-state.md`
- `docs/reports/2026-06-29-weekly-reset-marketing-test-alignment/weekly-reset-marketing-test-alignment.md`

## Explicit answers

- **Was the failing test corrected?** Yes.
- **Does the Weekly Reset fixture intentionally use the Sunday canonical anchor?** Yes, `2026-06-21T17:35:00+00:00`.
- **Do the remaining marketing fixtures still use the Tuesday canonical anchor?** Yes, `2026-06-16T07:05:00+00:00`.
- **Were any production files changed?** No.
- **Is the baseline validation now clean?** Yes, `dotnet test HomeOps.sln --no-build` passed.
