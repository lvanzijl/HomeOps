# Agenda Recording Action Reliability

## Summary

Fixed the Agenda recording blocker that stopped the executable storyboard at `saveFilmavond`.

The blocker was not a fixture-data defect or a Production Engine defect. Agenda API calls were using a relative generated API client base URL, which routed through the Vite development proxy. The marketing runtime starts the API on `http://127.0.0.1:5108`, while the static Vite proxy points to `http://localhost:5152`, so Agenda save traffic could fail through the wrong route during recording. The recording action also used a broad `Filmavond` text check scoped to the Agenda article, which could match dialog text instead of a saved event card.

## Root cause

`saveFilmavond` timed out because the dialog waited for application state that could not reliably occur:

1. Agenda calendar API clients did not use `VITE_HOMEOPS_API_BASE_URL`, unlike most other client API wrappers. In the marketing runtime, Agenda save requests therefore went to `/api/events` through Vite instead of directly to the VisualReview API at `http://127.0.0.1:5108`.
2. The save action waited for the dialog to close without first observing whether a save request was actually sent and accepted.
3. The Filmavond visibility check used broad text under the Agenda article. Because the dialog is rendered inside the Agenda article, that condition could match the form/dialog text instead of a real saved Agenda event card.

## Action timeline

Investigation instrumentation recorded these steps during the failing save path:

| Step | Elapsed | Result |
| --- | ---: | --- |
| ensure-agenda-started | 0ms | Agenda page check began. |
| ensure-agenda-completed | 9-59ms | Agenda page was present. |
| dialog-opened | 19-87ms | Add-event dialog was visible. |
| save-button-enabled | 110-179ms | `Gebeurtenis maken` button was enabled. |
| save-clicked | about 22-24s in instrumented failing runs | Save click was issued after touch movement. |
| save-response-received | about 22-24s | Response was `502` while Agenda used the wrong API route. |

After the API base fix and the saved-event locator fix, validation completed all scenes. In the successful run, the save action saw the real saved Filmavond event card and returned immediately because the application had already made Filmavond visible through the normal Agenda flow.

## Fix

- Agenda calendar API calls now use `import.meta.env.VITE_HOMEOPS_API_BASE_URL`, matching the marketing runtime API base used by the rest of the app.
- Agenda layer-settings API calls now use the same runtime API base.
- `saveFilmavond` now instruments key action steps, requires the save button to be enabled, waits for the actual POST response when a click is required, and fails with the response status/body instead of waiting indefinitely for hidden dialog state.
- The saved-Filmavond synchronization target now scopes to `.agenda-event strong`, so it verifies a real saved Agenda event card rather than dialog text.
- Recording surface navigation now waits for the primary navigation landmark before looking for scene navigation buttons, making post-Agenda transitions reliable after reloads.

## Full storyboard validation

Validation-mode Production Engine run: `npm run marketing:record -- validation`.

| Scene | Fixture | Started | Completed | Visible page / surface | Elapsed |
| --- | --- | --- | --- | --- | ---: |
| Intro | visual-marketing-home | Yes | Yes | Home | 8.7s |
| Home | visual-marketing-home | Yes | Yes | Home | 6.1s |
| Family | visual-marketing-family | Yes | Yes | Thomas / Family member flow | 11.5s |
| Agenda | visual-marketing-agenda | Yes | Yes | Agenda | 138.0s |
| Tasks | visual-marketing-tasks | Yes | Yes | Tasks | 10.2s |
| Shopping | visual-marketing-shopping | Yes | Yes | Boodschappen | 9.1s |
| Motivation | visual-marketing-motivation | Yes | Yes | Motivatie | 8.9s |
| Weekly Reset | visual-marketing-weekly-reset | Yes | Yes | Weekritueel | 14.9s |
| Outro | visual-marketing-home | Yes | Yes | Home Outro | 11.4s |

The validation run completed recording, audio, export, metadata, timing, and cleanup in validation mode. It removed temporary WebM, WAV, and MP4 artifacts and did not publish a final movie.

## Validation

- `npm test -- --run src/agenda/calendarEventsApi.test.ts src/widgets/components/AgendaWidget.test.tsx` passed.
- `npm run marketing:record -- validation` passed: 9/9 scenes completed, metadata generated, timing generated, cleanup completed, and `producedMovie` was `false`.
- `git diff --check` passed.

## Modified files

- `src/HomeOps.Client/src/agenda/calendarEventsApi.ts`
- `src/HomeOps.Client/src/agenda/layerSettings.ts`
- `tools/marketing-recording/storyboards/marketing-preview-v1.mjs`
- `tools/marketing-recording/session.mjs`
- `docs/state/current-state.md`
- `docs/reports/2026-07-01-agenda-recording-action-reliability/agenda-recording-action-reliability.md`

## Explicit answers

- Why did `saveFilmavond` timeout? Agenda save traffic was routed through the wrong development proxy because Agenda API clients ignored the marketing runtime API base URL, and the recording action waited on dialog state without observing the save request/response.
- Was the real cause fixed? Yes. Agenda API clients now use `VITE_HOMEOPS_API_BASE_URL`, and the recording action synchronizes to real save response and saved event-card state.
- Does the dialog now close normally? Yes. In validation, the Agenda scene completed and Filmavond was visible through normal application state.
- Does Filmavond appear through the real application? Yes. The recording now verifies the real `.agenda-event` card rather than dialog text or injected DOM.
- Does the executable storyboard now complete all 9 scenes? Yes. The validation-mode Production Engine run completed all 9 scenes.
- Was no final published movie intentionally produced? Yes. Validation mode produced no final published movie and cleanup removed temporary media artifacts.
