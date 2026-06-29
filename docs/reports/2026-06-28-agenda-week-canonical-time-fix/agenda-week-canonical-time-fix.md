# Agenda Week Canonical Time Fix

Date: 2026-06-28

## Summary

Fixed the VisualReview Agenda Week rendering bug where the Week view could remain anchored to the live machine date after a VisualReview marketing anchor loaded asynchronously.

After resetting `visual-marketing-agenda`, Agenda Month, Week, and List now derive their visible current-day/current-week state from the same active VisualReview marketing anchor.

No movie, screenshots, videos, audio, WAV files, storyboard changes, marketing fixture changes, Recording Framework changes, Audio Framework changes, or production UI changes were produced.

## Root cause

`AgendaWidget` correctly read the VisualReview marketing anchor through `useVisualReviewNow()`, but the component initialized `selectedDate` and `weekAnchorDate` state from the first render's `today` value. The VisualReview anchor is fetched asynchronously, so those state values could remain stuck on the live machine date even after `today` changed to the canonical marketing date.

The Week view used `weekAnchorDate`, so it continued to render the live-clock week (`22 Jun – 28 Jun`) while Today highlighting and List grouping were already using the canonical Tuesday anchor (`2026-06-16`).

## Fix

- Synchronized `selectedDate` and `weekAnchorDate` when `today` changes from the previous initial clock value to the VisualReview marketing anchor, while preserving user navigation if the user has already selected a different date/week.
- Kept all Week calculations (`Week` label, week start, week end, day cards, Today button) deriving from the synchronized Agenda anchor state.
- Updated the Agenda event conversation quick-date choices so Today/Tomorrow use the same active Agenda `today` value instead of the static demo date.
- Added focused Agenda widget coverage for the VisualReview marketing anchor across Month, Week, and List views.

## Validation

- Focused Agenda widget tests passed, including the new VisualReview marketing-anchor synchronization test.
- Client production build passed.
- VisualReview runtime validation passed after resetting `visual-marketing-agenda`:
  - API reset returned anchor `2026-06-16T07:05:00+00:00`.
  - Week view rendered `WEEK 25` and `15 jun – 21 jun`.
  - Week view highlighted Tuesday `16 jun` as Today.
  - Month view highlighted `16` with the `Vandaag` badge.
  - List view contained `Vandaag`, `Deze week`, and `Volgende week` groups from the same canonical anchor.
- `git diff --check` passed.

## Modified files

- `src/HomeOps.Client/src/widgets/components/AgendaWidget.tsx`
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.test.tsx`
- `docs/state/current-state.md`
- `docs/reports/2026-06-28-agenda-week-canonical-time-fix/agenda-week-canonical-time-fix.md`

## Explicit answers

- **Does Agenda Week now use the VisualReview marketing anchor?** Yes.
- **Are Month, Week and List synchronized?** Yes.
- **Does Today highlight the canonical date?** Yes; Month and Week both highlight `2026-06-16` after `visual-marketing-agenda` reset.
- **Was production runtime behavior changed?** No; production still falls back to the normal clock when no VisualReview marketing anchor is available.
- **Was no movie intentionally produced?** Yes.
