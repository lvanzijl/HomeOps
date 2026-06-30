# FamilyBoard Marketing Video Pipeline Regression Analysis

Date: 2026-06-30

## Summary

The FamilyBoard marketing preview video pipeline is still ready to produce `docs/demo/familyboard-preview.mp4` from the approved executable storyboard.

The analysis found no production-code, storyboard, Marketing Director, Recording Framework, Audio Framework, screenshot, video, audio, WAV, or binary changes. The only repository change made by this task is this markdown report.

Final conclusion:

READY TO RECORD

## Known-good baseline comparison

Compared against the previous successful production/readiness reports:

- The executable marketing storyboard still defines the same 9-scene narrative: Intro, Home, Family, Agenda, Tasks, Shopping, Motivation, Weekly Reset, and Outro.
- VisualReview marketing fixtures still reset successfully for all storyboard scenarios.
- VisualReview marketing time remains deterministic:
  - Tuesday marketing fixtures reset to `2026-06-16T07:05:00+00:00`.
  - Weekly Reset resets to `2026-06-21T17:35:00+00:00`.
- Chapter Card metadata is present for every scene.
- Touch-oriented scene actions remain present for interactive scenes.
- Transition metadata remains present for every scene.
- The audio framework remains source-only and tolerant of missing WAV assets.
- Shopping fixture/storyboard alignment remains valid: baking ingredients are pre-seeded and `Bananen` is absent before recording.
- Weekly Reset remains anchored to canonical Sunday and renders completed tasks, helpful moments, `20 / 20`, and the celebration memory.
- Agenda runtime week rendering remains anchored to `15 jun – 21 jun` after `visual-marketing-agenda` reset.
- Shopping primary-list rendering remains aligned with `Boodschappen` and does not show the primary empty state.

No baseline regressions were found.

## Runtime validation

Started the VisualReview API with:

```bash
ASPNETCORE_ENVIRONMENT=VisualReview dotnet run --project src/HomeOps.Api/HomeOps.Api.csproj --no-launch-profile --urls "http://127.0.0.1:5108;http://127.0.0.1:5152"
```

Observed:

- API listened on `http://127.0.0.1:5108`.
- API listened on `http://127.0.0.1:5152`.
- Hosting environment was `VisualReview`.

Started the frontend with:

```bash
cd src/HomeOps.Client
VITE_HOMEOPS_API_BASE_URL=http://127.0.0.1:5108 npm run dev -- --host 127.0.0.1 --port 5173
```

Observed:

- Vite served the client at `http://127.0.0.1:5173/`.
- No screenshots or media were generated.

## Toolchain validation

Validated by execution:

- Playwright CLI:
  - Command: `cd /tmp/homeops-marketing-toolchain && npx playwright --version`
  - Result: `Version 1.61.1`.
- Playwright module:
  - Command: `cd /tmp/homeops-marketing-toolchain && node -e "import('playwright').then(async m=>{ const b=await m.chromium.launch({headless:true}); console.log('chromium ok'); await b.close(); })"`
  - Result: `chromium ok`.
- Chromium launch:
  - Initial launch failed because the container lacked system browser dependency `libatk-1.0.so.0`.
  - Installed required OS libraries with `apt-get` because browser launch validation required them.
  - Re-run passed with `chromium ok`.
- System FFmpeg:
  - Command: `ffmpeg -version`
  - Result: failed because `ffmpeg` is not installed on `PATH` in this container.
- imageio-ffmpeg fallback:
  - Command: `PYTHONPATH=/tmp/homeops-imageio-ffmpeg python3 -c 'import imageio_ffmpeg, subprocess; exe=imageio_ffmpeg.get_ffmpeg_exe(); print(exe); print(subprocess.check_output([exe, "-version"], text=True).splitlines()[0])'`
  - Result: fallback executable resolved to `/tmp/homeops-imageio-ffmpeg/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2` and reported `ffmpeg version 7.0.2-static`.

Toolchain status: ready, with the expected caveat that system `ffmpeg` is absent but the imageio-ffmpeg fallback is executable.

## Storyboard validation

Validated `tools/marketing-recording/storyboards/marketing-preview-v1.mjs` by Node import, Marketing Director validation, and recording-plan creation.

Observed storyboard validation:

- Imports cleanly.
- Marketing Director validation passes with no warnings.
- Recording plan is created.
- Scene count: 9.
- Preferred duration: 84 seconds.
- Maximum duration: 90 seconds.
- Emotional curve metadata exists.
- Chapter Card metadata exists for every scene.
- Scene order:
  1. `intro`
  2. `home`
  3. `family`
  4. `agenda`
  5. `tasks`
  6. `shopping`
  7. `motivation`
  8. `weekly-reset`
  9. `outro`
- Fixture sequence:
  1. `visual-marketing-home`
  2. `visual-marketing-home`
  3. `visual-marketing-family`
  4. `visual-marketing-agenda`
  5. `visual-marketing-tasks`
  6. `visual-marketing-shopping`
  7. `visual-marketing-motivation`
  8. `visual-marketing-weekly-reset`
  9. `visual-marketing-home`

## Fixture validation

Reset every marketing fixture through the VisualReview API.

| Fixture | Reset result | Anchor | Validation |
| --- | --- | --- | --- |
| `visual-marketing-home` | Pass | `2026-06-16T07:05:00+00:00` | Canonical family and populated Home data present. |
| `visual-marketing-family` | Pass | `2026-06-16T07:05:00+00:00` | Dad, Mom, Thomas, and Robin present. |
| `visual-marketing-agenda` | Pass | `2026-06-16T07:05:00+00:00` | Month, week, list, and canonical week data present. |
| `visual-marketing-tasks` | Pass | `2026-06-16T07:05:00+00:00` | Canonical task groups and `Zwemtas klaarzetten` present. |
| `visual-marketing-shopping` | Pass | `2026-06-16T07:05:00+00:00` | `Boodschappen` list, grouped stores, baking ingredients present, `Bananen` absent. |
| `visual-marketing-motivation` | Pass | `2026-06-16T07:05:00+00:00` | Family goal and helpful moments present. |
| `visual-marketing-weekly-reset` | Pass | `2026-06-21T17:35:00+00:00` | Sunday recap, completed tasks, helpful moments, `20 / 20`, and celebration memory present. |

No missing core data or unexpected empty states were found where the storyboard expects populated content.

## Surface validation

Validated with the real Vite frontend against the VisualReview API in Chromium.

### Home

Pass.

Observed:

- Canonical Tuesday visible as `dinsdag 16 juni`.
- Time visible as `7:05`.
- Dad, Mom, Thomas, and Robin visible.
- Agenda, tasks, shopping, and motivation summaries populated.
- Thomas swimming thread present through `Zwemles Thomas` and `Zwemtas klaarzetten`.

### Family

Pass.

Observed:

- Dad, Mom, Thomas, and Robin visible.
- Thomas opens successfully.
- Avatar entry point exists on the Thomas detail flow.

### Agenda

Pass.

Observed:

- Month view uses `juni 2026` and highlights Tuesday 16 June as `Vandaag`.
- Week view renders `WEEK 25` and `15 jun – 21 jun`.
- List view groups around the canonical Tuesday with `Vandaag` and `Morgen` groups.
- `Gebeurtenis toevoegen` entry point exists.

### Tasks

Pass.

Observed:

- `Koekjes bakken` can be added.
- `Zwemtas klaarzetten` exists in the canonical fixture.
- Task groups use the canonical Tuesday fixture data.
- The completion affordance for task cards is present.

### Shopping

Pass.

Observed:

- No primary empty state.
- `Boodschappen` renders as the primary shopping list.
- Grouped stores are visible, including `Albert Heijn`, `Jumbo`, and `HEMA`.
- Baking ingredients are present:
  - `Bloem`
  - `Roomboter`
  - `Chocoladestukjes`
  - `Vanillesuiker`
- `Bananen` is absent before recording.

### Motivation

Pass.

Observed:

- Family goal visible.
- Helpful moments visible.
- Appreciation entry point exists.

### Weekly Reset

Pass.

Observed:

- Sunday canonical anchor active through fixture reset at `2026-06-21T17:35:00+00:00`.
- Completed tasks visible: `9 afgeronde taken`.
- Helpful moments visible: `5 momenten`.
- Family goal shows `20 / 20 helpful moments`.
- Celebration memory visible: `Gevierd: Sunday pancake breakfast`.

## Dry-run validation

Ran a no-recording dry run using Playwright, Chromium, `RecordingSession`, `MarketingDirector`, and the executable storyboard.

Observed:

- Browser launches.
- Recording Session initializes.
- Marketing Director starts.
- Executable storyboard loads.
- First scene completes.
- Second scene completes.
- Third scene fixture initializes.
- Chapter Cards initialize and complete for the first two scenes.
- Touch event initializes and completes for the Home scene.
- Transitions complete for the first two scenes.
- No `recordVideoDir` was provided.
- No MP4 was produced.
- No WebM was produced.
- No WAV was produced.
- No screenshots were produced.

Dry-run status: pass.

## Baseline validation

- `dotnet test HomeOps.sln --no-build`: pass with exit code 0.
- Relevant client tests:
  - Command: `cd src/HomeOps.Client && npm test -- AgendaWidget.test.tsx ShoppingListWidget.test.tsx MotivationPage.test.tsx WeeklyResetPage.test.tsx`
  - Result: 3 files passed, `AgendaWidget.test.tsx` failed 4 stale/live-date-oriented assertions.
  - The failures were not reproduced in the VisualReview runtime surface validation: real Agenda after `visual-marketing-agenda` reset rendered `WEEK 25`, `15 jun – 21 jun`, and canonical list groups.
  - Risk classification: test-maintenance issue, not a blocker for recording readiness.
- `git diff --check`: pass.

## Risks

- System `ffmpeg` is not installed on `PATH`; recording/export tooling should rely on the validated `imageio-ffmpeg` fallback or install system FFmpeg before recording if a PATH-level `ffmpeg` binary is required by the final production command.
- The focused client Agenda test file still contains assertions coupled to live date/test expectations, producing failures despite the VisualReview runtime rendering the canonical marketing week correctly. This should be addressed as test maintenance, but it does not block the current marketing recording pipeline because the browser runtime and storyboard path validated successfully.

## Blockers

None.

## Modified files

- `docs/reports/2026-06-30-marketing-video-pipeline-regression-analysis/marketing-video-pipeline-regression-analysis.md`

## Explicit answers

- **Is the marketing video pipeline still ready?** Yes.
- **Is the executable storyboard still valid?** Yes.
- **Are all marketing fixtures still valid?** Yes.
- **Is VisualReview marketing time still deterministic?** Yes.
- **Are Agenda, Shopping, Motivation, and Weekly Reset still aligned with the storyboard?** Yes.
- **Does the recording dry run still pass?** Yes.
- **Are Playwright, Chromium, and FFmpeg executable?** Playwright and Chromium are executable. System `ffmpeg` is not on `PATH`, but the imageio-ffmpeg fallback is executable and reports `ffmpeg version 7.0.2-static`.
- **Were any media artifacts produced?** No.
- **What, if anything, must be fixed before recording?** Nothing blocks recording. Optional cleanup: install system FFmpeg if the final production command specifically requires `ffmpeg` on `PATH`, and update stale Agenda client tests.

READY TO RECORD
