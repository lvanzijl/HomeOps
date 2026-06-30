# Agenda Client Test Maintenance

Date: 2026-06-30

## Summary

Fixed the stale Agenda client test failures by making `AgendaWidget.test.tsx` explicitly control both supported active date sources:

- production fallback date, represented by a controlled system date of `2026-06-28T07:05:00+00:00` with no VisualReview anchor;
- VisualReview marketing date, represented by `2026-06-16T07:05:00+00:00` from the mocked marketing-time endpoint.

No production UI behavior, VisualReview runtime behavior, marketing fixtures, storyboard, Marketing Director, Recording Framework, Audio Framework, movie, screenshots, video, audio, generated WAV files, or binary artifacts were changed.

## Root cause

The Agenda widget runtime had already been fixed to use the VisualReview marketing time provider, but several client tests still depended indirectly on the live machine clock. When the machine date moved to 2026-06-30, those tests expected dates and groups that were no longer the component's live-clock fallback output.

The false negatives appeared in event creation defaults, Week view expectations, and List grouping expectations. The real VisualReview runtime still rendered the canonical marketing week correctly, so this was test-maintenance drift rather than a production runtime regression.

## Test updates

Updated `AgendaWidget.test.tsx` to:

- Set Vitest's system date to `2026-06-28T07:05:00+00:00` for fallback-date tests.
- Mock the VisualReview marketing-time fetch in every test, returning no active anchor by default.
- Reuse a `setupUser()` helper configured for fake timers so user-event interactions remain deterministic while the system date is controlled.
- Use the canonical VisualReview marketing anchor `2026-06-16T07:05:00+00:00` in marketing-anchor tests.
- Keep the existing VisualReview synchronization coverage for:
  - Month view highlighting Tuesday 16 June as Today.
  - Week view rendering `Week 25` and `15 jun – 21 jun`.
  - List view grouping canonical events into `Vandaag`, `Deze week`, and `Volgende week`.
- Add explicit quick-choice coverage showing:
  - fallback `Vandaag` / `Morgen` resolve to `2026-06-28` / `2026-06-29` when no VisualReview anchor is active;
  - marketing `Vandaag` / `Morgen` resolve to `2026-06-16` / `2026-06-17` when the VisualReview anchor is active.

No tests were skipped, weakened, or deleted.

## Validation

- `cd src/HomeOps.Client && npm test -- AgendaWidget.test.tsx`: passed, 17 tests.
- `cd src/HomeOps.Client && npm test -- AgendaWidget.test.tsx ShoppingListWidget.test.tsx MotivationPage.test.tsx WeeklyResetPage.test.tsx`: passed, 40 tests across 4 files.
- `cd src/HomeOps.Client && npm test`: passed, 160 tests across 28 files.
- `git diff --check`: passed.

## Modified files

- `src/HomeOps.Client/src/widgets/components/AgendaWidget.test.tsx`
- `docs/reports/2026-06-30-agenda-client-test-maintenance/agenda-client-test-maintenance.md`

## Explicit answers

- **Were the stale Agenda test failures fixed?** Yes.
- **Do the tests now control the active date source?** Yes. They control both fallback system date and VisualReview marketing-anchor date.
- **Do the Agenda tests cover the canonical VisualReview marketing week?** Yes. The tests cover `Week 25`, `15 jun – 21 jun`, Tuesday 16 June Today highlighting, and canonical list grouping.
- **Was production behavior changed?** No.
- **Was no movie intentionally produced?** Yes. No movie, screenshots, video, audio, WAV files, or binary artifacts were produced.
