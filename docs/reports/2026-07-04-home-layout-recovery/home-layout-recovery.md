# Home Layout Recovery

## Summary

This slice restores the Home dashboard hierarchy by turning the date, time, and weather back into one compact header region, constraining the family portraits to a tighter horizontal identity row, and giving Agenda, Taken, and Boodschappen more vertical space again. Motivation remains visible below the main cards, the blue avatar square stays removed, and no movie or binary artifact was produced.

## Screenshot failure analysis

The provided failure reference showed a broken Home composition:

- the weather chip floated as a separate object instead of reading as part of the header
- the family portraits occupied too much of the upper half of the page
- large empty hero whitespace separated the portraits from the rest of the dashboard
- Agenda, Taken, and Boodschappen were pushed down and visually squeezed
- Motivation lost its supporting but always-visible position in the overall dashboard hierarchy

## Root cause

The regression came from the Home hero using a split composition that treated weather as a separate top-level card while the portrait row still reserved too much height:

- the header grid separated date/time and weather into distinct columns instead of one integrated header band
- the portrait buttons kept a large minimum height and large avatar size, which made the family area dominate the hero
- the overall hero consumed too much vertical space, leaving the three primary cards with less room than intended

## Layout fix

The recovery keeps portrait-based avatars and captions, but compacts and rebalances the composition:

- grouped date, time, and weather into a shared `home-hero-header`
- kept weather attached to the header and reduced the pill size so it no longer reads as a detached floating widget
- converted the family strip into a compact grid row with bounded portrait slots
- reduced Home portrait scale and minimum portrait height without returning to old chip avatars
- kept the portrait buttons transparent so the removed blue square did not return
- reduced hero padding and whitespace
- increased the effective first-row space available to Agenda, Taken, and Boodschappen by shrinking the hero and slightly tightening the Motivation row height

## Validation

- `dotnet restore HomeOps.sln`
- `dotnet build HomeOps.sln --no-restore`
- `dotnet test HomeOps.sln --no-build`
- `npm test`
- `npm test -- HomeDashboard.test.tsx`
- `npm run build`
- VisualReview Home fixture reset: `POST /api/visual-review-fixtures/visual-marketing-home/reset`
- Temporary Playwright DOM review at 1440×900 and 1366×768 using the local VisualReview state
- `git diff --check`

VisualReview Home confirmation:

- weather was rendered inside the compact header band
- portraits sat in a bounded horizontal row directly below the header
- no document-level vertical overflow was present (`scrollHeight === clientHeight` at 1440×900 and 1366×768)
- Agenda / Taken / Boodschappen each regained stable bounded card height
- Motivation remained visible on the page

## Modified files

- `src/HomeOps.Client/src/home/HomeDashboard.tsx`
- `src/HomeOps.Client/src/styles.css`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-07-04-home-layout-recovery/home-layout-recovery.md`

## Explicit answers

- Was the weather chip reintegrated? **Yes.**
- Were avatars moved into a better position? **Yes.**
- Are avatars still readable without dominating the layout? **Yes.**
- Do Agenda/Taken/Boodschappen now have enough room? **Yes.**
- Was the blue avatar square kept removed? **Yes.**
- Was no movie intentionally produced? **Yes.**
