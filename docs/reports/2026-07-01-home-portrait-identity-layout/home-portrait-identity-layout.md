# Home Portrait Identity Layout

## Summary

This corrective pass replaces the Home family strip's chip-based member presentation with a dedicated Home portrait presentation. The Home strip still uses real buttons and the shared `FamilyAvatar` component, but the button class and layout now model a portrait card rather than a chip.

No Avatar V2 renderer changes were made. No Family Member page presentation changes were made. No storyboard, Production Engine, Recording Framework, Marketing Director, or Audio Framework files were modified. No movie, screenshot, MP4, WebM, or WAV artifact was produced or committed.

## Root cause

The prior corrective pass removed the visible blue decoration, but the owning Home markup still rendered each person as `className="family-chip"`. That meant the Home identity anchor still inherited a chip abstraction:

- the outer control was still named and tested as a chip
- the layout remained a flex chip variant
- the Home-specific avatar scale was still layered onto a chip selector
- the caption was a bare `strong` child inside chip structure

The result looked less decorative, but the design-system abstraction was still a navigation/status chip rather than a portrait gallery.

## Before measurements

VisualReview fixture: `visual-marketing-home`  
Viewport: 1920 × 1080  
Measurement method: Playwright DOM geometry and computed styles; no screenshot or movie.

| Member | Touch target / outer container | Chip class | Layout | Padding | Avatar container | Avatar SVG visible | Name | Spacing | Empty area | Portrait:name height | Portrait area share |
| --- | ---: | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Dad | 216.6 × 162.0 = 35,085.7 px² | `family-chip` | flex column | 13.6px | 116.0 × 116.0 = 13,456.0 px² | 116.0 × 136.9 = 15,877.5 px² | 33.7 × 16.7 = 564.0 px²; 15.2px | 0px | 18,644.2 px² | 8.20× | 45.3% |
| Mom | 216.6 × 162.0 = 35,088.2 px² | `family-chip` | flex column | 13.6px | 116.0 × 116.0 = 13,456.0 px² | 116.0 × 136.9 = 15,877.5 px² | 41.4 × 16.7 = 691.7 px²; 15.2px | 0px | 18,519.0 px² | 8.20× | 45.3% |
| Robin | 216.6 × 162.0 = 35,085.7 px² | `family-chip` | flex column | 13.6px | 116.0 × 116.0 = 13,456.0 px² | 116.0 × 136.9 = 15,877.5 px² | 49.0 × 16.7 = 819.7 px²; 15.2px | 0px | 18,388.5 px² | 8.20× | 45.3% |
| Thomas | 216.6 × 162.0 = 35,088.2 px² | `family-chip` | flex column | 13.6px | 116.0 × 116.0 = 13,456.0 px² | 116.0 × 136.9 = 15,877.5 px² | 66.7 × 16.7 = 1,115.7 px²; 15.2px | 0px | 18,095.0 px² | 8.20× | 45.3% |

Before conclusion:

- The Home strip was still fundamentally chip-based because each member's button still used `family-chip`.
- The avatar was constrained by a chip-derived flex layout and chip-derived spacing/padding assumptions.
- The portrait was visible and dominant, but only about 45.3% of the touch target area was occupied by visible SVG; empty area remained high.

## Design change

The Home family strip now uses a dedicated Home portrait presentation:

- `HomeDashboard` renders each member button as `home-family-portrait`, not `family-chip`.
- The member name renders as `home-family-portrait-caption`, not a generic chip `strong` child.
- The CSS uses grid portrait composition instead of chip flex composition.
- The portrait row uses the available vertical space, with the caption as a secondary row.
- The shared `FamilyAvatar` component is reused.
- Avatar V2 rendering and Family Member page sizing are unchanged.

## After measurements

VisualReview fixture: `visual-marketing-home`  
Viewport: 1920 × 1080  
Measurement method: same Playwright DOM geometry and computed styles; no screenshot or movie.

| Member | Touch target / outer container | Chip class | Layout | Padding | Avatar container | Avatar SVG visible | Caption | Spacing | Empty area | Portrait:name height | Portrait area share |
| --- | ---: | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Dad | 216.6 × 162.0 = 35,085.7 px² | none | grid portrait card | 7.2px 9.6px | 122.0 × 122.0 = 14,884.0 px² | 122.0 × 144.0 = 17,562.3 px² | 35.5 × 18.4 = 653.4 px²; 16px | 4.8px | 16,870.0 px² | 7.83× | 50.1% |
| Mom | 216.6 × 162.0 = 35,088.2 px² | none | grid portrait card | 7.2px 9.6px | 122.0 × 122.0 = 14,884.0 px² | 122.0 × 144.0 = 17,562.3 px² | 43.6 × 18.4 = 801.7 px²; 16px | 4.8px | 16,724.2 px² | 7.83× | 50.1% |
| Robin | 216.6 × 162.0 = 35,085.7 px² | none | grid portrait card | 7.2px 9.6px | 122.0 × 122.0 = 14,884.0 px² | 122.0 × 144.0 = 17,562.3 px² | 51.6 × 18.4 = 949.7 px²; 16px | 4.8px | 16,573.7 px² | 7.83× | 50.1% |
| Thomas | 216.6 × 162.0 = 35,088.2 px² | none | grid portrait card | 7.2px 9.6px | 122.0 × 122.0 = 14,884.0 px² | 122.0 × 144.0 = 17,562.3 px² | 70.3 × 18.4 = 1,292.8 px²; 16px | 4.8px | 16,233.1 px² | 7.83× | 50.1% |

Family page reference measurement for Thomas at the same viewport:

- Family page Avatar V2 container: 153.6 × 153.6 = 23,593.0 px².
- Family page visible Avatar V2 SVG: 153.6 × 172.0 = 26,422.3 px².
- Home visible Avatar V2 SVG after this pass: 122.0 × 144.0 = 17,562.3 px².
- Home portrait is 83.7% of Family page visible SVG height and 79.4% of Family page visible SVG width. That places the visible portrait at the intended 80–90% visual scale by height and effectively at the lower bound by width.

After conclusion:

- The Home strip no longer uses `family-chip` for member buttons.
- The Home strip now uses a Home-specific portrait-card abstraction.
- Touch target dimensions were preserved at the measured 216.6px × 162.0px.
- Four members still fit across the Home strip.
- Empty area decreased by roughly 1,225–1,862 px² per member, depending on caption width.
- The caption is readable at 16px but remains secondary to the 144px visible portrait.

## Validation

Validation mode and tests completed successfully:

- relevant client tests passed
- Production Engine validation mode completed all 9 scenes
- metadata generated
- timing generated
- cleanup completed
- no final repository movie was produced
- no MP4/WebM/WAV artifacts were added
- `git diff --check` passed

Commands run:

```bash
node /tmp/measure-portrait.mjs
node /tmp/measure-family-ref.mjs
npm test -- HomeDashboard FamilyAvatar
node tools/marketing-production/production.mjs
git diff --check
```

A mistaken test invocation from the repo root failed because `/workspace/HomeOps` has no `package.json`; the same test command was then run successfully from `src/HomeOps.Client`.

## Modified files

- `src/HomeOps.Client/src/home/HomeDashboard.tsx`
- `src/HomeOps.Client/src/home/HomeDashboard.test.tsx`
- `src/HomeOps.Client/src/styles.css`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-07-01-home-portrait-identity-layout/home-portrait-identity-layout.md`

## Explicit answers

- Was the Home family strip still chip-based? **Yes. Before this pass, each member button still used `family-chip`.**
- Was the chip presentation replaced? **Yes. Home now renders `home-family-portrait` buttons with `home-family-portrait-caption` names.**
- Does the Home strip now present portraits instead of chips? **Yes. The Home strip uses a dedicated grid-based portrait-card layout and no longer uses chip styling for family members.**
- Are portraits approximately 80–90% of the Family page visual size? **Yes by visible height: 144.0px vs 172.0px = 83.7%; width is 79.4%, effectively at the lower bound.**
- Are names now captions rather than dominant elements? **Yes. Captions are 18.4px tall and readable, while the visible portrait is 144.0px tall, a 7.83× portrait:name height ratio.**
- Were touch targets preserved? **Yes. The measured target stayed 216.6px × 162.0px for each member.**
- Was no movie intentionally produced? **Yes. Validation mode was used and no final movie was produced.**
