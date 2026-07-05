# Home Header Layout Motivation Refinement

## Summary

Implemented a small frontend-only Home refinement slice for FamilyBoard without redesigning the dashboard, cards, navigation, Weather Detail Dialog, Agenda page, Tasks page, or backend.

Explicit confirmations:
- Home weather now uses two lines;
- the second line contains the short departure advice;
- avatars were not reduced;
- Agenda, Shopping, and Tasks now use the available width better;
- the Motivation progress copy was reduced to one visible progress sentence;
- no backend files changed;
- no new functionality was added;
- only the required screenshot was added as a binary artifact.

## Header Weather Changes

- `/home/runner/work/HomeOps/HomeOps/src/HomeOps.Client/src/styles.css` keeps the Home header as one row while changing the weather trigger itself into a compact two-line unit.
- The first weather line remains the shared icon + temperature presentation from `WeatherTemperatureBadge`.
- The second weather line now carries the short departure advice summary as smaller, calmer copy.
- The weather trigger still has no chip, no rounded weather container, no background, and no border.
- Browser validation confirmed the header order remains Date/Time → Weather → Avatars and the family avatars stay at the existing 81.6 × 81.6 px size.

## Home Card Layout Changes

- The existing Home top-row cards stay in the current order: Shopping, Agenda, and Tasks.
- The unused desktop fourth slot came from a `min-width: 1180px` override that changed the Home summary grid to four equal columns even though only three top-row cards exist.
- `/home/runner/work/HomeOps/HomeOps/src/styles.css` now keeps the Home summary grid at three equal columns on desktop, so Agenda, Shopping, and Tasks spread evenly across the available width instead of leaving an empty gutter.
- Browser validation at 1440×960 and 1280×800 confirmed all three cards render at equal widths and the Home page remains free of vertical page scrolling.

## Motivation Copy Analysis

- The clearest single progress message for the Home card is the remaining-progress sentence, not the ratio or the raw total target.
- Keeping the remaining-progress sentence works best in this UI because the progress bar already communicates journey/proportion, while the sentence answers the family’s glanceable question: how much is still needed before the celebration.
- `/home/runner/work/HomeOps/HomeOps/src/HomeOps.Client/src/home/HomeDashboard.tsx` now keeps only the single visible progress sentence in the card body: `Nog X ... tot ...`.
- The duplicated progress ratio was removed from the Motivation card header metadata so the Home card no longer repeats the same number relationship in multiple visible formats.

## Validation

- Setup: `npm ci`
- Focused post-change validation: `npm test -- src/home/HomeDashboard.test.tsx`
- Post-change validation: `npm run build`
- Full post-change validation: `npm test`
- Full post-change validation: `npm run build`
- Browser validation against `visual-marketing-home`
  - reset fixture with `POST /api/visual-review-fixtures/visual-marketing-home/reset`;
  - confirmed no document/body vertical overflow at 1440×960;
  - confirmed no document/body vertical overflow at 1280×800;
  - confirmed the header order stayed Date/Time → Weather → Avatars;
  - confirmed the weather unit renders as a grid/two-line block and the advice line shows the short departure advice;
  - confirmed Agenda, Shopping, and Tasks each render at ~336 px width on the populated desktop review state.

## Screenshot

- `/home/runner/work/HomeOps/HomeOps/docs/reports/2026-07-04-home-header-layout-motivation-refinement/home-header-layout-motivation-refinement.png`

## Modified Files

- `src/HomeOps.Client/src/home/HomeDashboard.tsx`
- `src/HomeOps.Client/src/home/HomeDashboard.test.tsx`
- `src/HomeOps.Client/src/styles.css`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-07-04-home-header-layout-motivation-refinement/home-header-layout-motivation-refinement.md`
- `docs/reports/2026-07-04-home-header-layout-motivation-refinement/home-header-layout-motivation-refinement.png`
