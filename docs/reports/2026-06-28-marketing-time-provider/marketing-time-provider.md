# Marketing Time Provider

Date: 2026-06-28

## Summary

VisualReview marketing rendering now has an explicit marketing time provider. Resetting a `visual-marketing-*` fixture records that fixture's canonical anchor and exposes it to the API and browser runtime. Production runtime continues to use the normal machine clock.

## Root cause

The marketing fixture data was anchored to the canonical June 2026 week, but rendered surfaces still derived current-day and current-week concepts from live clock calls. Weekly Reset used `DateTimeOffset.UtcNow` for its contribution window, so the `visual-marketing-weekly-reset` fixture's June 2026 helpful moments and completed tasks fell outside the calculated week and the recap returned zero.

## Time provider architecture

- `VisualReviewMarketingTimeProvider` stores the active marketing fixture anchor after a VisualReview reset.
- `/api/visual-review-fixtures/marketing-time` exposes the active anchor to browser rendering.
- Weekly Reset reads the marketing anchor when present and otherwise falls back to `DateTimeOffset.UtcNow`.
- Client marketing surfaces ask for the VisualReview anchor and use it for current-day grouping, current-week agenda highlighting, Today/Tomorrow quick actions, and child/family date calculations.
- The fixture remains the source of truth: regular marketing surfaces anchor to Tuesday, 16 June 2026, while the Weekly Reset fixture anchors to Sunday, 21 June 2026.

## VisualReview surfaces updated

- Home dashboard: uses the VisualReview anchor for the live board clock, agenda buckets, task grouping, and quick-capture Today/Tomorrow defaults.
- Agenda: uses the VisualReview anchor for selected date, week anchor, and Today highlighting.
- Tasks: uses the VisualReview anchor for Today, Tomorrow, overdue, and grouped time horizons.
- Family/child rendering: uses the VisualReview anchor for age and child Today calculations.
- Weekly Reset: uses the VisualReview anchor for the contribution recap week window.

## Weekly Reset fix

The Weekly Reset root cause was a date-window mismatch. Completed tasks, helpful moments, and celebration memories were seeded in June 2026, but the recap queried the live machine week. Weekly Reset now calculates its recap window from the active VisualReview marketing anchor, so `visual-marketing-weekly-reset` naturally returns canonical-week contributions without fixture-specific recap hacks.

## Validation

Commands run:

- `dotnet build HomeOps.sln`
- `npm run build` from `src/HomeOps.Client`
- VisualReview API fixture reset/curl sweep for:
  - `visual-marketing-home`
  - `visual-marketing-family`
  - `visual-marketing-agenda`
  - `visual-marketing-tasks`
  - `visual-marketing-shopping`
  - `visual-marketing-motivation`
  - `visual-marketing-weekly-reset`
- `git diff --check`

Observed reset anchors:

- Tuesday fixtures: `2026-06-16T07:05:00+00:00`, Today `2026-06-16`.
- Weekly Reset fixture: `2026-06-21T17:35:00+00:00`, Today `2026-06-21`.

Observed Weekly Reset recap after `visual-marketing-weekly-reset` reset:

- Completed tasks: 9.
- Helpful moments: 5.
- Celebration memories: 1.
- Family goal progress: 20 / 20.

`npm test` was attempted after the successful client build, but the Vitest process produced no test completion output before it was terminated during cleanup. No test success is claimed for that command.

## Modified files

- `src/HomeOps.Api/Program.cs`
- `src/HomeOps.Api/VisualReviewFixtures/MarketingHouseholdFixtureBuilder.cs`
- `src/HomeOps.Api/VisualReviewFixtures/VisualReviewFixtureEndpoints.cs`
- `src/HomeOps.Api/VisualReviewFixtures/VisualReviewFixtureService.cs`
- `src/HomeOps.Api/VisualReviewFixtures/VisualReviewMarketingTimeProvider.cs`
- `src/HomeOps.Api/WeeklyReset/WeeklyResetEndpoints.cs`
- `src/HomeOps.Client/src/visualReviewTime.ts`
- `src/HomeOps.Client/src/home/HomeDashboard.tsx`
- `src/HomeOps.Client/src/home/FamilyMemberPage.tsx`
- `src/HomeOps.Client/src/tasks/TasksPage.tsx`
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.tsx`
- `docs/reports/2026-06-28-marketing-time-provider/marketing-time-provider.md`
- `docs/state/current-state.md`

## Explicit answers

- Does VisualReview still use the machine clock anywhere during marketing rendering? No known marketing rendering path for Home, Agenda, Tasks, Family/child, or Weekly Reset bypasses the VisualReview marketing time provider after the reset anchor has loaded. Non-rendering actions and production fallback paths still use the machine clock where appropriate.
- Does Weekly Reset now reflect the canonical fixture week? Yes. The Weekly Reset fixture recap returns canonical-week completed tasks, helpful moments, celebration memory, and the completed family goal.
- Are Home, Agenda, Tasks, Shopping, Motivation and Weekly Reset synchronized? Yes. The marketing reset flow now exposes one active fixture anchor and all updated current-day/current-week calculations derive from it.
- Was production runtime behavior changed? No. The provider only has an active anchor after VisualReview marketing fixture resets; production endpoints and browser fallback behavior still use the normal clock.
- Is the marketing runtime now deterministic across all supported pages? Yes for the audited supported marketing surfaces after fixture reset: Home, Agenda, Tasks, Shopping, Motivation, Family/child, and Weekly Reset.
