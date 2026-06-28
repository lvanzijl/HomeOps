# FamilyBoard Marketing Household Canonicalization Report

## Summary

Canonicalized the FamilyBoard marketing household naming across the marketing design document, VisualReview marketing fixtures, marketing fixture tests, and existing marketing fixture report.

The canonical marketing household is now the **Van Zijl family**. Parent display names are intentionally generic: **Dad** and **Mom**. Thomas and Robin remain unchanged.

## Changes performed

- Updated `docs/design/marketing-household.md` from the previous named-family/parent wording to Van Zijl/Dad/Mom.
- Updated `MarketingHouseholdFixtureBuilder` so marketing fixture data uses:
  - Household: Van Zijl family.
  - Parent member IDs/display names: `dad`/`Dad` and `mom`/`Mom`.
  - Parent-owned tasks, appreciations, and calendar source naming aligned with Dad/Mom.
- Updated VisualReview marketing scenario descriptions to Van Zijl.
- Updated marketing fixture API coverage to assert Dad, Mom, Robin, and Thomas as the canonical fixture members.
- Updated the prior marketing fixtures report and current-state entry so marketing documentation matches the new canonical names.

## Validation

- Searched scoped marketing assets for the previous household and parent names; no old marketing household names remain in those assets.
- Ran backend tests to confirm VisualReview fixture API coverage still passes.
- Ran VisualReview API reset checks for all eight `visual-marketing-*` scenarios and confirmed each reset still returns deterministic, non-empty canonical fixture data.
- Ran `git diff --check`.

## Modified files

- `docs/design/marketing-household.md`
- `src/HomeOps.Api/VisualReviewFixtures/MarketingHouseholdFixtureBuilder.cs`
- `src/HomeOps.Api/VisualReviewFixtures/VisualReviewFixtureService.cs`
- `tests/HomeOps.Api.Tests/Lists/VisualReviewFixtureApiTests.cs`
- `docs/reports/2026-06-28-marketing-fixtures/marketing-fixtures.md`
- `docs/reports/2026-06-28-marketing-household-canonicalization/marketing-household-canonicalization.md`
- `docs/state/current-state.md`

## Required answers

- **Is Van Zijl now the canonical marketing household?** Yes. The marketing design document, fixtures, tests, and reports now use Van Zijl as the canonical marketing household.
- **Are Dad and Mom used consistently throughout all marketing assets?** Yes. Marketing assets now use Dad and Mom rather than first names for the parent fixtures and documentation.
- **Were any production features changed?** No. This was a marketing documentation and VisualReview fixture naming consistency pass only.
- **Do all marketing fixtures remain deterministic?** Yes. IDs, dates, event times, task states, shopping items, goals, appreciations, avatars, and scenario mappings remain hard-coded and repeatable.
