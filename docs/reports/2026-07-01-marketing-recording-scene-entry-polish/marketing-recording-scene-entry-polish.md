# Marketing Recording Scene Entry Polish

## Summary

This slice polishes marketing recording scene entry without changing production UI, fixtures, storyboard order, Production Engine architecture, Recording Framework architecture, Marketing Director architecture, audio, or final publishing behavior.

The recording session now keeps fixture reset, page reload, real UI navigation, target-surface verification, and idle wait under a persistent scene-entry cover. The visible reveal starts only after the expected scene surface has been verified and settled. Validation mode completed all 9 scenes, generated metadata and timing, and cleanup removed temporary media artifacts. No final movie was intentionally produced.

## Root cause

The previous scene-entry code used the recording transition overlay around reset/reload/navigation, but the overlay lived inside the browser document. During `page.reload()`, the document and overlay root were destroyed before target navigation finished. That allowed the recording to briefly show app startup/Home and fast real navigation to the requested surface before the scene was ready.

In other words, the flow was effectively:

1. show current page
2. fade a transition overlay in
3. reset fixture
4. reload page, destroying the overlay document
5. display app startup/Home during reload
6. quickly navigate to target surface
7. verify target surface
8. fade/reveal after some setup had already been visible

## Scene entry flow before/after

### Before

- Transition cover was DOM-local to the current page.
- Reload destroyed the transition cover.
- Real navigation still happened, but rapid intermediate Home-to-target movement could be visible.
- Timing only captured transition start/end, not reset/reload/navigation/reveal milestones.

### After

- The session installs a context init script that applies a persistent setup cover from document start when scene setup is active.
- `runScene` turns on the persistent setup cover once the transition has faded fully over the current scene.
- Fixture reset, reload, and real UI navigation run while the setup cover is active.
- The expected target surface is verified and the camera waits for idle before reveal.
- A fresh transition overlay is reinstalled on the new document, the persistent cover is removed behind it, and then the transition fades out to reveal the verified scene.
- Timing now captures scene-entry milestones for every scene.

## Scene entry timing markers

Validation command: `node tools/marketing-production/production.mjs`  
Mode: validation  
Timestamp: `20260701-162502`  
All values are milliseconds from recording timing origin.

| Scene | Cover start | Reset start/end | Reload start/end | Nav start/end | Target verified | Reveal start | First visible interaction |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| intro | 335 | 391 / 1594 | 1594 / 2210 | 2210 / 4139 | 4435 | 4441 | 5598 (`hold-home-dashboard`) |
| home | 8071 | 8075 / 8170 | 8170 / 8580 | 8580 / 10237 | 10600 | 10606 | 12841 (`tap-today-area`) |
| family | 15311 | 15313 / 15352 | 15352 / 15637 | 15637 / 18477 | 18727 | 18733 | 21001 (`open-thomas`) |
| agenda | 27279 | 27288 / 27318 | 27318 / 28286 | 28286 / 31307 | 31608 | 31630 | 33883 (`show-month`) |
| tasks | 43346 | 43387 / 43407 | 43407 / 44508 | 44508 / 46124 | 46477 | 46487 | 48804 (`add-koekjes-bakken`) |
| shopping | 53499 | 53507 / 53579 | 53579 / 54135 | 54135 / 56230 | 56533 | 56583 | 58246 (`show-grouped-errands`) |
| motivation | 62116 | 62119 / 62129 | 62129 / 62441 | 62441 / 64079 | 64432 | 64479 | 66703 (`show-family-goal-progress`) |
| weekly-reset | 74081 | 74083 / 74097 | 74097 / 74692 | 74692 / 77031 | 77403 | 77419 | 81181 (`show-week-closing`) |
| outro | 117515 | 117581 / 117604 | 117605 / 118578 | 118578 / 120113 | 120378 | 120385 | 121983 (`return-home`) |

The ordering confirms that every target surface was verified before visible reveal and before the first visible interaction.

## Dialog transition findings

The executable storyboard has one fully scripted dialog workflow in this slice: the Agenda `Filmavond` add-event dialog. Other listed moments are represented by storyboard actions/holds in the current executable recording plan, but do not contain custom dialog automation in this script slice; no production UI or storyboard narrative was changed to add new workflows.

| Dialog | Open start | Open visible | Save/cancel/final step | Close completed | Result visible | Notes |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Agenda add event (`Filmavond`) | 37389 | 37726 | 39984 | 40012 | 40022 | The final conversation step auto-completed the event in validation; the result state was recorded and held after visibility. |

## Fix

Modified recording/session/action timing code only:

- Added a persistent scene-entry cover controlled by `localStorage` plus `browserContext.addInitScript`, so reloads start hidden instead of flashing Home.
- Extended `runTransition` with covered/reveal hooks so setup work can remain hidden until the target surface is ready.
- Emitted scene-entry timing events for cover, fixture reset, reload, navigation, target verification, reveal, and first visible interaction.
- Persisted those markers into generated timing metadata.
- Added Agenda dialog transition markers and short readability holds around dialog visibility/result states.

## Validation

Validation mode completed successfully:

- all 9 scenes completed
- metadata generated
- timing generated
- cleanup completed
- no final repository movie was produced
- no retained MP4/WebM/WAV artifacts from this validation run remained
- `git diff --check` passed

Commands run:

```bash
node tools/marketing-production/production.mjs
cd /tmp && npx playwright install-deps chromium
node tools/marketing-production/production.mjs
git diff --check
```

The first validation attempt failed before recording because Playwright browser OS dependencies were missing (`libatk-1.0.so.0`). After installing Chromium dependencies, validation mode completed successfully.

## Modified files

- `tools/marketing-recording/transitions.mjs`
- `tools/marketing-recording/session.mjs`
- `tools/marketing-recording/events.mjs`
- `tools/marketing-recording/storyboards/marketing-preview-v1.mjs`
- `tools/marketing-production/recording/recording-stage.mjs`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-07-01-marketing-recording-scene-entry-polish/marketing-recording-scene-entry-polish.md`

## Explicit answers

- Why was rapid page flipping visible? **Because the transition overlay was document-local and was destroyed by `page.reload()`, exposing app startup/Home and quick real navigation before the target scene was verified.**
- Is fixture reset/navigation now hidden under transition cover? **Yes. Fixture reset, reload, and real UI navigation now run while the persistent scene-entry cover is active.**
- Does each scene reveal only after the target surface is verified? **Yes. Validation timing shows `targetSurfaceVerifiedMs` before `visibleRevealStartMs` for all 9 scenes.**
- Were dialogs slowed/readability-polished? **Yes for the executable Agenda add-event dialog path: dialog visibility/result markers are captured and short holds were added around readable dialog/result states. Existing non-custom action holds for other storyboard moments were preserved.**
- Was no final movie intentionally produced? **Yes. Validation mode was used; `producedMovie` was false and cleanup completed.**
