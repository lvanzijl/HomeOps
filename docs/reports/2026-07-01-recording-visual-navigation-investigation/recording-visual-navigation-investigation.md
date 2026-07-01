# Recording Visual Navigation Investigation

## Summary

Validation-mode browser instrumentation confirmed the discrepancy was caused by workspace detection in `RecordingSession.navigateToFixtureSurface`, not by the Production Engine, RecordingPlan, fixture reset API, browser context, or recording page selection.

The Recording Session considered a workspace reached when any heading with the target name existed on the page. The Home dashboard contains card headings such as `Agenda`, `Taken`, `Boodschappen`, and `Motivatie`, so scenes for those workspaces could be reported as complete without leaving Home. The fix scopes workspace detection to the active workspace title and verifies a rendered surface unique to the expected workspace before scene execution can continue.

## Investigation

Measured possibilities:

- Browser navigation: measured through per-scene actual URL, active workspace heading, active navigation button, and screenshots.
- Recording page vs automation page: measured by taking screenshots from the same Playwright page used by the Recording Session after each scene completed.
- Scene completion timing: hardened so scene completion occurs only after `verifyFixtureSurface` confirms the expected rendered UI.
- Fixture reset and reload: retained; the divergence was after reload, in workspace detection.
- Production Engine and RecordingPlan: not changed; both continued to produce the canonical 9-scene plan.

## Scene-by-scene browser verification

Validation command: `npm run marketing:record` from `src/HomeOps.Client` on 2026-07-01.

| Scene | Fixture | Expected workspace | Actual URL | Active workspace / heading | Active navigation | Screenshot |
| --- | --- | --- | --- | --- | --- | --- |
| intro | visual-marketing-home | Thuis | http://127.0.0.1:5173/ | Thuisdashboard / Thuis | Thuis | Captured temporarily |
| home | visual-marketing-home | Thuis | http://127.0.0.1:5173/ | Thuisdashboard / Thuis | Thuis | Captured temporarily |
| family | visual-marketing-family | Thomas | http://127.0.0.1:5173/ | Thomas gezinslidpagina / Thomas | Thuis | Captured temporarily |
| agenda | visual-marketing-agenda | Agenda | http://127.0.0.1:5173/ | Agenda widgets / Agenda | Agenda | Captured temporarily |
| tasks | visual-marketing-tasks | Taken | http://127.0.0.1:5173/ | Takenpagina / Taken | Taken | Captured temporarily |
| shopping | visual-marketing-shopping | Boodschappen | http://127.0.0.1:5173/ | Boodschappen widgets / Boodschappen | Boodschappen | Captured temporarily |
| motivation | visual-marketing-motivation | Motivatie | http://127.0.0.1:5173/ | Motivatiedashboard / Motivatie | Motivatie | Captured temporarily |
| weekly-reset | visual-marketing-weekly-reset | Weekritueel | http://127.0.0.1:5173/ | Overzicht van het weekritueel / Weekritueel | n/a | Captured temporarily |
| outro | visual-marketing-home | Thuis | http://127.0.0.1:5173/ | Thuisdashboard / Thuis | Thuis | Captured temporarily |

## Root cause

`RecordingSession.navigateToFixtureSurface` used a broad heading lookup for workspace scenes. Because Home contains card headings with the same names as primary workspace navigation labels, the session could treat Home dashboard content as proof that `Agenda`, `Taken`, `Boodschappen`, or `Motivatie` was already active. That allowed validation events to advance while the visible page stayed on Home.

## Fix

- Added rendered-surface inspection for scene id, fixture, expected workspace, expected URL, actual URL, active workspace, active page heading, active navigation button, timestamps, scene start, scene completion, and temporary screenshot path.
- Replaced broad heading-based workspace detection with active-workspace-title verification.
- Added fixture-specific rendered UI checks so scene completion is blocked until the expected surface is visible.
- Kept Production Engine, RecordingPlan, Marketing Director, storyboard content, Production UI, audio, and timing configuration unchanged.

## Validation

- Validation mode completed successfully with all 9 scenes.
- Browser screenshots were captured temporarily under `/tmp/familyboard-recording-visual-navigation` during validation.
- Temporary screenshots were removed after validation.
- Metadata was generated at `/tmp/familyboard-marketing-metadata.json`.
- Timing was generated at `/tmp/familyboard-marketing-timing.json`.
- Cleanup succeeded and removed the validation MP4 and temporary recording/audio artifacts.
- No final published movie was intentionally produced.

## Required answers

- Why does the published movie remain on Home? Because workspace detection in the Recording Session matched headings on the Home dashboard instead of verifying the active workspace, so validation could report scene completion before actual navigation away from Home.
- Was the visual navigation issue measured? Yes. Per-scene rendered UI data and temporary browser screenshots were captured during validation mode.
- Does the browser now visibly reach every storyboard scene? Yes. Validation captured Home, Family/Thomas, Agenda, Tasks/Taken, Shopping/Boodschappen, Motivation, Weekly Reset, and Home Outro.
- Do validation events now match rendered UI? Yes. Scene completion now follows rendered-surface verification.
- Were temporary screenshots removed? Yes. `/tmp/familyboard-recording-visual-navigation` was removed after validation.
- Was no final published movie intentionally produced? Yes. Validation mode was used; `producedMovie` was `false` and cleanup removed the temporary MP4.

## Modified files

- `tools/marketing-recording/session.mjs`
- `tools/marketing-production/recording/recording-stage.mjs`
- `docs/reports/2026-07-01-recording-visual-navigation-investigation/recording-visual-navigation-investigation.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
