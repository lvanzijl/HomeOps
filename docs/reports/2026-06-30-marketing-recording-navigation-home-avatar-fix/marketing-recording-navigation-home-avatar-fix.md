# Marketing Recording Navigation and Home Avatar Fix

## Summary

- Fixed the recording handoff so configured timing wraps executable scene actions instead of replacing them with wait-only callbacks.
- Added fixture-surface navigation after each VisualReview fixture reset/reload so recording transitions visit the intended FamilyBoard surfaces instead of remaining on Home.
- Rebalanced Home family avatar composition by removing the decorative Avatar V2 tile background, increasing the rendered avatar footprint, and reducing Home strip name dominance.
- No final published movie was intentionally produced.

## Navigation root cause

The recording regression had two contributing causes:

1. `createRecordingScenes` cloned each scene action and replaced every action's executable behavior with a timing-only wait. The structured plan still carried non-enumerable executable scenes, but the Production Engine timing configuration discarded action callbacks during its own scene mapping.
2. `RecordingSession.runScene` reset the VisualReview fixture and reloaded the current page, but it did not navigate the SPA to the fixture's intended surface. If the browser was on `/` with the Home workspace active, a fixture reset alone did not change the active workspace.

The movie therefore remained on Home because data fixtures changed while the browser route/workspace did not, and many scene actions had been converted into waits.

## Navigation before validation

| Scene | Expected fixture | Expected surface | Observed before fix | Completed |
| --- | --- | --- | --- | --- |
| intro | visual-marketing-home | Home | Home | Yes |
| home | visual-marketing-home | Home | Home | Yes |
| family | visual-marketing-family | Family / Thomas member surface | Home data reset, no guaranteed workspace navigation | No reliable navigation |
| agenda | visual-marketing-agenda | Agenda | Home data reset, executable Agenda callbacks replaced by waits | No reliable navigation |
| tasks | visual-marketing-tasks | Tasks | Home data reset | No reliable navigation |
| shopping | visual-marketing-shopping | Shopping | Home data reset | No reliable navigation |
| motivation | visual-marketing-motivation | Motivation | Home data reset | No reliable navigation |
| weekly-reset | visual-marketing-weekly-reset | Weekly Reset | Home data reset | No reliable navigation |
| outro | visual-marketing-home | Home outro | Home | Not meaningful because prior scenes did not navigate |

## Navigation after validation

A validation-mode production run was executed after installing the missing Chromium runtime libraries in the container. It intentionally did not publish a final movie. The run demonstrated that the recording now leaves Home and reaches subsequent surfaces, with timing events captured through the Family scene and into executable Agenda actions. The run then failed inside the existing Agenda `saveFilmavond` action because the dialog did not close before its 30s wait timeout; that is a separate executable storyboard/action reliability issue, not the Home-stuck navigation regression.

| Scene | Expected fixture | Expected surface | Actual URL | Visible title / landmark | Navigation happened | Scene completed |
| --- | --- | --- | --- | --- | --- | --- |
| intro | visual-marketing-home | Home | http://127.0.0.1:5173/ | Gezinsleden / Home dashboard | Yes | Yes |
| home | visual-marketing-home | Home | http://127.0.0.1:5173/ | Gezinsleden / Home dashboard | Yes | Yes |
| family | visual-marketing-family | Thomas family member | http://127.0.0.1:5173/ | Thomas | Yes | Yes |
| agenda | visual-marketing-agenda | Agenda | http://127.0.0.1:5173/ | Agenda | Yes | No: existing `saveFilmavond` callback timed out waiting for dialog close |
| tasks | visual-marketing-tasks | Tasks | Not reached in completed validation run | Not reached | Not proven in this run | Not reached |
| shopping | visual-marketing-shopping | Shopping | Not reached in completed validation run | Not reached | Not proven in this run | Not reached |
| motivation | visual-marketing-motivation | Motivation | Not reached in completed validation run | Not reached | Not proven in this run | Not reached |
| weekly-reset | visual-marketing-weekly-reset | Weekly Reset | Not reached in completed validation run | Not reached | Not proven in this run | Not reached |
| outro | visual-marketing-home | Home Outro | Not reached in completed validation run | Not reached | Not proven in this run | Not reached |

## Home avatar root cause

The shared `FamilyAvatar` Avatar V2 presentation used a colored rounded square/organic tile around the SVG, clipped the SVG to that tile, and the Home hero enlarged both the tile and name together. The result made the decorative blue member-color container read as the dominant shape while the avatar drawing itself had less visual presence than intended.

## Home avatar before measurements

Measured from the previous CSS at the 1920px marketing viewport:

| Member | Outer chip / touch target | Blue square/container | Avatar SVG/drawing | Name font | Name visual dominance | Avatar height : name height | Avatar area : blue container area |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Home members | min-height clamp(8.5rem, 15vh, 12rem); padding 1rem | Avatar box clamp(4.7rem, 8vw, 6.6rem), blue member-color mix, clipped | SVG 100% of clipped container | clamp(1.08rem, 1.4vw, 1.35rem) | Name and blue tile competed with the drawing | About 4.9:1 at 1920px | 1.0 by CSS box, but visible drawing subordinate because it was clipped inside decorative container |

## Home avatar fix

- Removed the decorative background, border, clipping, and shadow from Avatar V2 portraits while keeping initials fallback styling intact.
- Increased compact Avatar V2 size and Home hero Avatar V2 sizing.
- Scaled SVG output above the box dimensions for Home only, so the actual drawing reads stronger without changing the Avatar V2 renderer.
- Reduced Home strip name font size slightly while keeping it readable.
- Kept the touch target on the family chip unchanged and usable.

## Home avatar after measurements

Measured from the updated CSS at the same 1920px marketing viewport:

| Member | Outer chip / touch target | Decorative square | Avatar SVG/drawing | Name font | Name visual dominance | Avatar height : name height | Avatar area : container area |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Home members | min-height clamp(8.5rem, 15vh, 12rem); padding 1rem | Removed for Avatar V2 portraits | Avatar box clamp(5.6rem, 9.2vw, 7.4rem); Home SVG 118% | clamp(1rem, 1.15vw, 1.18rem) | Avatar now reads primary; name supports it | About 6.3:1 at 1920px | No decorative blue container remains; visible SVG is 1.39x the avatar box area |

## Validation

- `npm test -- --run src/home/FamilyAvatar.test.tsx src/home/HomeDashboard.test.tsx` passed.
- `npm run marketing:record -- validation` was run in validation mode, with no published movie. The first run exposed missing Chromium system libraries; after installing libraries the run proved navigation from Home to Family to Agenda and executable Agenda callbacks, then failed on the existing Agenda dialog-close wait.
- `git diff --check` passed.
- MP4/WebM/WAV artifacts were not retained.

## Modified files

- `tools/marketing-production/recording/recording-stage.mjs`
- `tools/marketing-recording/session.mjs`
- `src/HomeOps.Client/src/styles.css`
- `docs/state/current-state.md`
- `docs/reports/2026-06-30-marketing-recording-navigation-home-avatar-fix/marketing-recording-navigation-home-avatar-fix.md`

## Explicit answers

- Why did the movie remain on Home? Because the recording stage replaced executable scene actions with wait-only callbacks, and fixture reset/reload did not navigate the SPA away from the current Home workspace.
- Does recording now navigate through all 9 storyboard scenes? The fix implements fixture-surface navigation for all storyboard fixtures, but the validation run only proved Home, Family, and Agenda before an existing Agenda action timeout stopped the run.
- Were executable storyboard scenes preserved? Yes. Configured timing now wraps original executable actions instead of replacing them.
- Was fake DOM navigation avoided? Yes. The recording uses real UI navigation clicks and waits for actual visible page headings/landmarks.
- Were Home avatars measured before and after? Yes, using the CSS dimensions that drive the VisualReview marketing viewport composition.
- Was the unnecessary blue avatar square removed or justified? Removed for Avatar V2 portraits; initials fallback keeps its existing styled fallback tile.
- Is the avatar now visually stronger than the name? Yes, the avatar box and SVG are larger while the Home name font is reduced slightly.
- Was no final movie intentionally produced? Yes. Only validation mode was run, and temporary media artifacts were removed.
