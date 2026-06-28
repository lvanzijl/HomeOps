# FamilyBoard Marketing Production Readiness

## Summary

The FamilyBoard marketing production pipeline is **not ready** to begin recording.

Core framework modules load, the VisualReview runtime starts, and all requested marketing fixtures reset successfully. However, three concrete blockers prevent a safe first recording pass:

1. the recording toolchain is incomplete in this environment (`Chromium` present, `Playwright` package absent, `FFmpeg` absent),
2. the approved 9-scene storyboard is still only a design document and is not available as an executable Marketing Director storyboard,
3. several marketing-facing runtime surfaces still derive “today” and “this week” from the live clock instead of the canonical marketing fixture anchor, which already shows up as empty Weekly Reset recap data after fixture reset.

## Runtime status

- `ASPNETCORE_ENVIRONMENT=VisualReview dotnet run --project src/HomeOps.Api/HomeOps.Api.csproj --no-launch-profile --urls "http://127.0.0.1:5108;http://127.0.0.1:5152"`: started successfully.
- `VITE_HOMEOPS_API_BASE_URL=http://127.0.0.1:5108 npm run dev -- --host 127.0.0.1 --port 5173`: started successfully.
- `/health`: returned `200 {"status":"Healthy"}`.
- Baseline checks:
  - `dotnet restore HomeOps.sln`: passed.
  - `dotnet build HomeOps.sln`: passed.
  - `dotnet test HomeOps.sln --no-build`: passed (`134/134`).
  - `npm ci`: passed.
  - `npm test`: passed (`154/154`).
  - `npm run build`: passed.

## Fixture validation

Validated fixture discovery plus reset behavior for:

- `visual-marketing-home`
- `visual-marketing-family`
- `visual-marketing-agenda`
- `visual-marketing-tasks`
- `visual-marketing-shopping`
- `visual-marketing-motivation`
- `visual-marketing-weekly-reset`

Results:

- Every requested fixture exists in `/api/visual-review-fixtures/scenarios`.
- Every requested reset returned `200 OK`.
- No reset exceptions occurred.
- Every reset produced the expected canonical household core:
  - family members: `Dad`, `Mom`, `Thomas`, `Robin`
  - key task present: `Zwemtas klaarzetten`
  - shopping list present: `Boodschappen`
  - family goal present: `20 helpful moments before Sunday pancake breakfast`
  - agenda data includes `Zwemles Thomas`

Observed counts after reset:

| Fixture | Family members | Tasks | Lists | List items | Family goals | Individual goals | Helpful moments | Events |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `visual-marketing-home` | 4 | 11 | 1 | 18 | 1 | 2 | 4 | 19 |
| `visual-marketing-family` | 4 | 11 | 1 | 18 | 1 | 2 | 4 | 19 |
| `visual-marketing-agenda` | 4 | 11 | 1 | 18 | 1 | 2 | 4 | 20 |
| `visual-marketing-tasks` | 4 | 11 | 1 | 18 | 1 | 2 | 4 | 19 |
| `visual-marketing-shopping` | 4 | 11 | 1 | 18 | 1 | 2 | 4 | 19 |
| `visual-marketing-motivation` | 4 | 11 | 1 | 18 | 1 | 2 | 5 | 19 |
| `visual-marketing-weekly-reset` | 4 | 11 | 1 | 18 | 1 | 2 | 5 | 19 |

## Recording Framework validation

Validated by importing the framework modules directly in Node.

- `RecordingSession` loads.
- `defineScene` loads.
- `Camera` loads.
- `TouchDriver` loads.
- overlay helpers load.
- `runTransition` loads.
- Chapter Card support is present through `showChapter(...)`.

What passed:

- `tools/marketing-recording/session.mjs` imports cleanly.
- `tools/marketing-recording/overlays.mjs` exports both overlay installation and Chapter Card helpers.
- `tools/marketing-recording/session.mjs` wires `installRecordingOverlays(...)`, fixture reset, transitions, touch helpers, and `showChapter(...)` together.

What did **not** pass end-to-end:

- I could not complete the requested no-recording dry run through Playwright because the required Playwright package is not available in the environment.

## Marketing Director validation

- `MarketingDirector` loads.
- `validateSampleMarketingStoryboard()` returned:
  - `valid: true`
  - `warnings: []`
- `createRecordingPlan(sampleMarketingStoryboard)` succeeded.

Important limitation:

- The executable storyboard currently available to the Marketing Director is only `tools/marketing-recording/sample-storyboard.mjs`, and it contains **3 scenes**.
- The approved production storyboard for the preview remains `docs/design/marketing-storyboard-v1.md`, which defines **9 scenes** and is not loadable by the Marketing Director as an executable storyboard.

This is a production blocker for the first real recording pass.

## Audio Framework validation

Validated by importing the audio modules directly in Node and publishing recording events through `RecordingEventBus`.

- audio modules load
- event subscriptions work
- timeline loads
- mixer loads

Observed behavior:

- `MarketingAudioDirector.start()` subscribed successfully.
- Publishing `TouchStarted`, `ActionCompleted`, `TransitionStarted`, and `ChapterCompleted` events created timeline clips.
- Stopping the audio director prevented further clip scheduling.

No WAV generation was performed.
No validation mix was generated.

## Toolchain validation

- `Chromium`: available at `/usr/bin/chromium`
- `Playwright`: **not available** as an installed package in the repository or the known temporary validation locations checked during this review
- `FFmpeg`: **not available** on `PATH`

Conclusion:

- Browser runtime is partially available because Chromium exists.
- The actual recording toolchain is not ready because Playwright and FFmpeg are missing.
- Video recording cannot be confirmed for a subsequent prompt in the current environment.

## Storyboard validation

Validated `docs/design/marketing-storyboard-v1.md` as a design artifact.

Passed:

- all referenced fixtures exist
- scene order is valid
- durations are internally consistent
- emotional curve is present
- Chapter Card direction is present

Confirmed storyboard table:

- Intro → Home → Family → Agenda → Tasks → Shopping → Motivation → Weekly Reset → Outro
- preferred durations sum to **84 seconds**
- emotional curve is documented as **Calm → Curiosity → Recognition → Confidence → Warmth → Reflection → Calm**

Blocking gap:

- the canonical storyboard is documented, but not executable by the recording runtime yet

## Dry run

Partial proof only:

- runtime starts: **yes**
- storyboard loads: **sample storyboard only**

Blocked before scene initialization proof:

- no installed Playwright package to drive `RecordingSession`
- no executable version of the approved 9-scene storyboard

Additional runtime mismatch already visible without recording:

- the marketing fixtures are anchored to `2026-06-16` / `2026-06-21`, but multiple runtime surfaces still use the live clock (`new Date()` / `DateTimeOffset.UtcNow`) for “today” and “this week”
- after resetting `visual-marketing-weekly-reset`, `/api/weekly-reset` returned `helpfulMomentCount: 0` in `contributionRecap`, even though the fixture reset reported 5 helpful moments

That mismatch is enough to block recording readiness because the Weekly Reset scene cannot currently be trusted to present the canonical recap state.

## Readiness assessment

- **Is the system ready to record?** No.
- **Are any blockers present?** Yes.
- **What must be fixed before recording?**
  1. Install or otherwise provide the missing recording toolchain pieces: Playwright and FFmpeg.
  2. Convert the approved 9-scene marketing storyboard into an executable storyboard that the Marketing Director can load.
  3. Remove live-clock drift from the marketing runtime path so Home, Agenda, Tasks, and Weekly Reset render against the canonical marketing fixture timeline instead of the current date.
- **Can the next prompt focus exclusively on recording?** No.

## Concrete blockers

1. **Missing recording toolchain**
   - Chromium exists, but Playwright is not installed and FFmpeg is not available.
2. **No executable canonical storyboard**
   - The approved storyboard is still markdown-only; the runtime only has the 3-scene sample storyboard.
3. **Live-clock mismatch against canonical fixture dates**
   - Marketing fixtures are anchored to June 2026, while runtime grouping and Weekly Reset recap logic still use the live current date.
   - Evidence from this review: after resetting `visual-marketing-weekly-reset`, the reset response reported 5 helpful moments, but `/api/weekly-reset` returned `contributionRecap.helpfulMomentCount = 0`.

NOT READY FOR PRODUCTION
