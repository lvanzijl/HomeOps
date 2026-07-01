# Home Avatar Container Removal

## Summary

Measured the Home family strip in the `visual-marketing-home` VisualReview fixture before and after the corrective pass. The blue decorative square still existed visually before this work, but it was not produced by the Avatar V2 renderer itself. It came from the Home family-strip button tile styling. The corrective pass removes that Home-only decorative tile treatment, enlarges the Home Avatar V2 portrait, reduces caption dominance, and preserves the four-member strip and touch target dimensions.

No movie, screenshot, MP4, WebM, or WAV artifact was produced.

## Root cause

The blue square originated in the Home family strip `.home-hero .family-chip` / `.family-chip` styling:

- `background: var(--member-surface)` rendered as a blue/lavender surface in the marketing fixture.
- `border: 1px solid var(--member-border)` rendered as a blue border.
- The Home-specific strip used `FamilyAvatar member={member}` with the default compact Avatar V2 size, so the portrait was only 37.6px wide inside a much larger 216.6px × 162px tile.

The Avatar V2 renderer and `FamilyAvatar` wrapper did not own the blue square. The Avatar V2 span measured transparent background, no border, and no shadow before and after.

## Before measurements

VisualReview fixture: `visual-marketing-home`  
Viewport: 1920 × 1080  
Measurement method: Playwright DOM geometry and computed styles; no screenshot or movie.

| Member | Touch target / outer tile | Decorative container style | Avatar container | Avatar SVG visible | Name | Vertical spacing | Avatar:name height ratio |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Dad | 216.6 × 162.0 = 35,085.7 px² | blue/lavender background + blue border | 37.6 × 37.6 = 1,413.3 px² | 37.6 × 44.4 = 1,667.6 px² | 38.3 × 20.0 = 766.9 px²; 17.28px font | 10.4px | 2.22× |
| Mom | 216.6 × 162.0 = 35,088.2 px² | blue/lavender background + blue border | 37.6 × 37.6 = 1,413.3 px² | 37.6 × 44.4 = 1,667.6 px² | 47.0 × 20.0 = 940.9 px²; 17.28px font | 10.4px | 2.22× |
| Robin | 216.6 × 162.0 = 35,085.7 px² | blue/lavender background + blue border | 37.6 × 37.6 = 1,413.3 px² | 37.6 × 44.4 = 1,667.6 px² | 55.7 × 20.0 = 1,114.7 px²; 17.28px font | 10.4px | 2.22× |
| Thomas | 216.6 × 162.0 = 35,088.2 px² | blue/lavender background + blue border | 37.6 × 37.6 = 1,413.3 px² | 37.6 × 44.4 = 1,667.6 px² | 75.9 × 20.0 = 1,517.2 px²; 17.28px font | 10.4px | 2.22× |

Before conclusion:

- The decorative blue container still existed.
- The decorative tile area was about 21× the visible avatar SVG area.
- The avatar was visually subordinate to the Home tile/container.
- The Avatar V2 portrait itself was much smaller than the name/tile composition implied.

## Container ownership

Owner: Home family strip CSS in `src/HomeOps.Client/src/styles.css`.

Not owners:

- `FamilyAvatar` did not add the blue square; its Avatar V2 wrapper measured transparent with no border/shadow.
- `Avatar V2` renderer did not add the blue square; the inner SVG measured as only the visible portrait.
- The Family Member page presentation was not modified.
- The Avatar Editor presentation was not modified.

## Fix

Home-only CSS changes:

- Made the `.home-hero .family-chip` background transparent.
- Made the `.home-hero .family-chip` border transparent.
- Kept the existing Home family-strip button/touch target size.
- Increased `.home-hero .family-avatar-compact` to a large Home-only portrait size.
- Reduced Home family-strip caption size and spacing so the name reads as a caption under the portrait.

No Avatar V2 renderer changes were made. No Family Member page Avatar V2 presentation changes were made.

## After measurements

VisualReview fixture: `visual-marketing-home`  
Viewport: 1920 × 1080  
Measurement method: same Playwright DOM geometry and computed styles; no screenshot or movie.

| Member | Touch target / outer tile | Decorative container style | Avatar container | Avatar SVG visible | Name | Vertical spacing | Avatar:name height ratio |
| --- | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| Dad | 216.6 × 162.0 = 35,085.7 px² | transparent background + transparent border | 116.0 × 116.0 = 13,456.0 px² | 116.0 × 136.9 = 15,877.5 px² | 33.7 × 16.7 = 564.0 px²; 15.2px font | 0px | 8.20× |
| Mom | 216.6 × 162.0 = 35,088.2 px² | transparent background + transparent border | 116.0 × 116.0 = 13,456.0 px² | 116.0 × 136.9 = 15,877.5 px² | 41.4 × 16.7 = 691.7 px²; 15.2px font | 0px | 8.20× |
| Robin | 216.6 × 162.0 = 35,085.7 px² | transparent background + transparent border | 116.0 × 116.0 = 13,456.0 px² | 116.0 × 136.9 = 15,877.5 px² | 49.0 × 16.7 = 819.7 px²; 15.2px font | 0px | 8.20× |
| Thomas | 216.6 × 162.0 = 35,088.2 px² | transparent background + transparent border | 116.0 × 116.0 = 13,456.0 px² | 116.0 × 136.9 = 15,877.5 px² | 66.7 × 16.7 = 1,115.7 px²; 15.2px font | 0px | 8.20× |

Family page reference measurement for Thomas at the same viewport:

- Family page Avatar V2 container: 153.6 × 153.6 = 23,593.0 px².
- Family page visible Avatar V2 SVG: 153.6 × 172.0 = 26,422.3 px².
- Home visible Avatar V2 SVG after fix: 116.0 × 136.9 = 15,877.5 px².
- Home is 79.6% of the Family page visible SVG height and 75.5% of its width. The height is effectively at the 80% target boundary; width remains lower because the shared Avatar V2 SVG has vertical overflow in this presentation.

## Validation

- The blue square was removed from the Home family strip: Home tile background and border now measure transparent.
- Four family members still fit in the Home strip at 1920 × 1080.
- Touch targets were preserved at the measured 216.6px × 162.0px per member.
- Avatar V2 visible height increased from 44.4px to 136.9px.
- Avatar-to-name height ratio increased from 2.22× to 8.20×.
- No movie was intentionally produced.

Commands run:

```bash
ASPNETCORE_ENVIRONMENT=VisualReview dotnet run --project src/HomeOps.Api/HomeOps.Api.csproj --no-launch-profile --urls 'http://127.0.0.1:5108;http://127.0.0.1:5152'
npm run dev -- --host 127.0.0.1 --port 5173
curl -sS -m 3 http://127.0.0.1:5108/health
curl -sS -m 10 -X POST http://127.0.0.1:5108/api/visual-review-fixtures/visual-marketing-home/reset
NODE_PATH=/tmp/node_modules node /tmp/measure-home-avatar.mjs
NODE_PATH=/tmp/node_modules node /tmp/measure-family-avatar.mjs
```

## Modified files

- `src/HomeOps.Client/src/styles.css`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-07-01-home-avatar-container-removal/home-avatar-container-removal.md`

## Explicit answers

- Did the blue square still exist? **Yes, before this corrective pass.**
- Where did it originate? **The Home family strip `.family-chip` / `.home-hero .family-chip` CSS background and border.**
- Was it completely removed? **Yes for the Home family strip Avatar V2 presentation; measured background and border are transparent.**
- Is the avatar now approximately 80–90% of the Family page visual size? **Approximately at the lower bound by visible height: 136.9px vs 172.0px, or 79.6%.**
- Is the avatar now visually stronger than the name? **Yes; avatar:name height ratio is 8.20× after the fix.**
- Were touch targets preserved? **Yes; measured touch target stayed 216.6px × 162.0px.**
- Was no movie intentionally produced? **Yes; no movie was produced.**
