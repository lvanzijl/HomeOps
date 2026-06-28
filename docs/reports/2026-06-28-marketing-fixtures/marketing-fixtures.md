# FamilyBoard Marketing Fixtures Report

## Summary

Implemented deterministic VisualReview marketing fixtures for the canonical Van Zijl family household. The fixtures are data-only reset scenarios for future screenshots, videos, demonstrations, and browser reviews.

No recording helpers, audio, Playwright changes, screenshots, videos, or production UI changes were added.

## Fixture architecture

- Added eight VisualReview scenarios:
  - `visual-marketing-home`
  - `visual-marketing-family`
  - `visual-marketing-agenda`
  - `visual-marketing-tasks`
  - `visual-marketing-shopping`
  - `visual-marketing-motivation`
  - `visual-marketing-weekly-reset`
  - `visual-marketing-settings`
- The scenarios use the existing `/api/visual-review-fixtures/{scenarioName}/reset` reset pipeline.
- Each reset clears VisualReview review data first, recreates the canonical household, and saves a deterministic response.
- The canonical marketing anchor is fixed at `2026-06-16T07:05:00Z`, matching the approved Tuesday fixture date and calendar refresh story.

## Shared household implementation

A shared `MarketingHouseholdFixtureBuilder` creates the canonical FamilyBoard marketing household:

- Household: Van Zijl family.
- Primary members: Dad, Mom, Thomas, and Robin.
- Stable Avatar V2 configurations for every primary family member.
- Canonical June 2026 week events, including school, daycare, swimming, football, shopping, birthday, Father's Day breakfast, and Weekly Reset.
- Canonical task story aligned to agenda needs.
- Canonical shopping groups for Albert Heijn, Jumbo, Kruidvat, Bakker, and HEMA.
- Canonical motivation story with the pancake-breakfast family goal, individual goals, and appreciations.

Scene-specific differences are limited to fixture intent, such as the agenda fixture including one natural extra event, the motivation fixture including an extra appreciation-ready state, and the Weekly Reset fixture showing the end-of-week completed state.

## Fixtures implemented

- `visual-marketing-home`: complete non-empty household dashboard data for the Tuesday opening shot.
- `visual-marketing-family`: same family and avatars for Family Members and Avatar Editor demonstration readiness.
- `visual-marketing-agenda`: breathable but active month/week/list agenda data with one additional natural event.
- `visual-marketing-tasks`: practical open tasks where one completion visibly improves progress while the page remains tidy.
- `visual-marketing-shopping`: populated grouped shopping by realistic Dutch stores.
- `visual-marketing-motivation`: family goal, individual goals, appreciation, celebration setup, and statistics-ready data.
- `visual-marketing-weekly-reset`: completed canonical-week state for a natural Sunday Weekly Reset conclusion.
- `visual-marketing-settings`: reassuring canonical household state for settings-adjacent review without destructive data.

## Validation performed

- Built the backend solution.
- Reset every new marketing fixture through the VisualReview endpoint.
- Verified each reset response returned non-empty canonical household data, tasks, shopping items, goals, helpful moments, and agenda events as appropriate.
- Added automated API coverage to assert that every marketing scenario is exposed and uses the same canonical family, agenda, shopping, and motivation anchors.
- Ran whitespace validation with `git diff --check`.

## Modified files

- `src/HomeOps.Api/VisualReviewFixtures/MarketingHouseholdFixtureBuilder.cs`
- `src/HomeOps.Api/VisualReviewFixtures/VisualReviewFixtureService.cs`
- `tests/HomeOps.Api.Tests/Lists/VisualReviewFixtureApiTests.cs`
- `docs/reports/2026-06-28-marketing-fixtures/marketing-fixtures.md`
- `docs/state/current-state.md`

## Required answers

- **Is there a shared marketing household builder?** Yes. `MarketingHouseholdFixtureBuilder` is the shared implementation for all marketing fixtures.
- **Are all fixtures deterministic?** Yes. All IDs, dates, names, avatars, event times, task state, shopping items, goals, and appreciations are hard-coded and do not depend on the current date or randomness.
- **Do all fixtures represent the same canonical household?** Yes. Every marketing fixture resets to the Van Zijl family with Dad, Mom, Thomas, and Robin and the same canonical June 2026 week.
- **Can future marketing videos start from these fixtures without manual preparation?** Yes. Each fixture can be reset through the existing VisualReview endpoint and provides prepared data for the requested marketing scene.
