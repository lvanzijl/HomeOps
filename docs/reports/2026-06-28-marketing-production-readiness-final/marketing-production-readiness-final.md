# Marketing Production Readiness Final

Date: 2026-06-28

## Summary

Final production-readiness validation was executed against the real `VisualReview` API runtime and the Vite client runtime.

No movie, screenshots, audio, WAV files, or other media artifacts were produced.

The executable storyboard validates, the runtime starts, Playwright/Chromium/FFmpeg can be executed after bootstrap, and fixture resets succeed.

Production must **not** begin yet because concrete blockers remain in baseline validation, Agenda week synchronization, Shopping rendering, the first-scene recording dry run, and audio asset availability.

## Runtime status

- API started successfully with `ASPNETCORE_ENVIRONMENT=VisualReview` on `http://127.0.0.1:5108` and `http://127.0.0.1:5152`.
- Frontend started successfully on `http://127.0.0.1:5173` with `VITE_HOMEOPS_API_BASE_URL=http://127.0.0.1:5108`.
- Fixture resets succeeded for:
  - `visual-marketing-home`
  - `visual-marketing-family`
  - `visual-marketing-agenda`
  - `visual-marketing-tasks`
  - `visual-marketing-shopping`
  - `visual-marketing-motivation`
  - `visual-marketing-weekly-reset`
- Observed marketing anchors:
  - Tuesday scenes: `2026-06-16T07:05:00+00:00`
  - Weekly Reset scene: `2026-06-21T17:35:00+00:00`

## Toolchain bootstrap

- `npm ci` was required because `src/HomeOps.Client/node_modules` was absent.
- `npx playwright --version` worked, but `node -e "require('@playwright/test')"` initially failed because `@playwright/test` was not present in the checked-out client install.
- For environment verification only, Playwright tooling was bootstrapped in `/tmp/homeops-marketing-tools` and Chromium was installed with `npx playwright install chromium` from that bootstrap location.
- `ffmpeg` was not available on `PATH`; it was installed with the approved non-root path via `python -m pip install --user imageio-ffmpeg`.

## Toolchain verification

- `npx playwright --version` => `Version 1.61.1`
- `node -e "require('@playwright/test'); console.log('playwright ok')"` => passed after the temporary bootstrap
- Playwright Chromium launch => passed (`chromium ok`)
- FFmpeg executable => `/home/runner/.local/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2`

## Executable storyboard validation

Command run:

```bash
node tools/marketing-recording/storyboards/marketing-preview-v1.mjs
```

Observed result:

- Marketing Director loaded the executable storyboard.
- Storyboard validation succeeded.
- Recording plan creation succeeded.
- Scene count = `9`
- Preferred total duration = `84000ms` (`84s`)
- Maximum storyboard duration metadata = `90000ms`
- Emotional curve metadata exists.
- Chapter Card metadata exists on every scene.

## Marketing runtime validation

### Confirmed working surfaces

- **Home** rendered the canonical Tuesday state: `dinsdag 16 juni`, `7:05`, today's agenda, today's tasks, and `12/20 helpful moments`.
- **Tasks** rendered `Vandaag`, `Morgen`, `Deze week`, and `Volgende week` relative to the canonical Tuesday anchor.
- **Motivation** rendered the canonical family goal (`20 helpful moments before Sunday pancake breakfast`) with `12/20` progress.
- **Weekly Reset** rendered the Sunday close of the same family story with:
  - `9` completed tasks
  - `5` helpful moments
  - family goal `20 / 20`
  - the Sunday pancake breakfast celebration memory
- **Family fixture reset** succeeded and kept the Tuesday marketing anchor.

### Blocking findings

- **Agenda current-week synchronization is incorrect.**
  - After `visual-marketing-agenda` reset, the page correctly marked `16` June as `Vandaag` and the list view grouped events around the canonical Tuesday.
  - The same page's **Week** view showed `WEEK 26` / `22 jun – 28 jun` instead of the canonical week `15 jun – 21 jun`.
- **Shopping marketing rendering is incorrect.**
  - After `visual-marketing-shopping` reset, the API exposed one active list named `Boodschappen` with `18` items.
  - The Shopping UI primary surface still showed `Geen open boodschappen` and only surfaced the populated list under supporting lists, so the intended grouped-shopping scene is not recordable from the main page.

## Dry run validation

Dry run scope:

- start the recording session
- load the executable storyboard
- create the recording plan
- initialize the first scene only
- stop before any video recording begins

Observed results:

- Browser launch succeeded.
- Recording session start succeeded.
- Executable storyboard load succeeded.
- Recording plan creation succeeded.
- Touch overlay initialization succeeded before scene execution.
- No MP4 was created.
- The dry run failed when the first scene reached `ChapterStarted`.

Failure:

- `RecordingSession.runScene(plan.scenes[0])` failed in `showChapter()` with:
  - `TypeError: Cannot read properties of null (reading 'appendChild')`
- Stack trace origin:
  - `tools/marketing-recording/overlays.mjs:73`
  - `tools/marketing-recording/session.mjs:37`
- The emitted events reached:
  - `SceneStarted`
  - `TransitionStarted`
  - `TransitionCompleted`
  - `ChapterStarted`
- The first scene therefore does **not** complete its Chapter Card initialization in the current execution path.

## Remaining blockers

1. Baseline repository validation is not clean: `dotnet test HomeOps.sln --no-build` failed in `HomeOps.Api.Tests.Lists.VisualReviewFixtureApiTests.MarketingScenariosUseCanonicalHousehold("visual-marketing-weekly-reset")` because the test still expects `2026-06-16T07:05:00+00:00` while the actual Weekly Reset anchor is `2026-06-21T17:35:00+00:00`.
2. Agenda Week view is not synchronized to the canonical marketing week after `visual-marketing-agenda` reset (`22 jun – 28 jun` shown instead of `15 jun – 21 jun`).
3. Shopping primary rendering is not synchronized to the marketing shopping fixture: the API returns one active `Boodschappen` list with `18` items, but the main Shopping page renders `Geen open boodschappen`.
4. The recording dry run fails before the first scene can complete its Chapter Card initialization because `showChapter()` cannot find the overlay root after the scene reload.
5. The Audio Framework references missing WAV assets under `tools/marketing-recording/audio/assets/`; runtime validation found missing `transition.wav`, `tap.wav`, `taskComplete.wav`, `appreciation.wav`, and `success.wav`.

## Explicit answers

- **Is Playwright executable?** Yes.
- **Is Chromium executable?** Yes.
- **Is FFmpeg executable?** Yes.
- **Is the executable storyboard valid?** Yes.
- **Is the Marketing Director ready?** No.
- **Is the Recording Framework ready?** No.
- **Is the Audio Framework ready?** No.
- **Is the marketing runtime deterministic?** No.
- **Is the system ready to record?** No.
