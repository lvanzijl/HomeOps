# FamilyBoard Preview Video

- Date: 2026-06-28
- Pre-flight docs read: `/home/runner/work/HomeOps/HomeOps/.github/copilot-instructions.md`, `/home/runner/work/HomeOps/HomeOps/AGENTS.md`, `/home/runner/work/HomeOps/HomeOps/docs/development/visual-review-runtime.md`
- Pre-flight command result: `dotnet --version` → `10.0.301`

## Runtime and fixtures

- Was VisualReview used? **Yes**
- Runtime used: `ASPNETCORE_ENVIRONMENT=VisualReview`
- API runtime: `dotnet run --project src/HomeOps.Api/HomeOps.Api.csproj --no-launch-profile --urls 'http://127.0.0.1:5108;http://127.0.0.1:5152'`
- Frontend runtime: `VITE_HOMEOPS_API_BASE_URL=http://127.0.0.1:5108 npm run dev -- --host 127.0.0.1 --port 5173`
- Was `visual-full` used? **Yes**
- Was `visual-weekly-reset` used? **Yes**
- Fixture reset commands used:
  - `curl -sS -X POST http://127.0.0.1:5108/api/visual-review-fixtures/visual-full/reset`
  - `curl -sS -X POST http://127.0.0.1:5108/api/visual-review-fixtures/visual-weekly-reset/reset`

## Output artifact

- Video path: `/home/runner/work/HomeOps/HomeOps/docs/demo/familyboard-preview.mp4`
- Relative video path: `docs/demo/familyboard-preview.mp4`
- Video duration: **89.7 seconds**
- Video resolution: **1920×1080**
- Video codec: `h264`
- Video frame rate: **30 fps**
- Binary artifact confirmation: this task created one new repository binary artifact: `docs/demo/familyboard-preview.mp4`

## Scenes recorded

1. Intro title card — `FamilyBoard Preview Video`
2. Home overview
3. Family member page and avatar editor
4. Agenda month, week, and list views
5. Tasks with one completion action
6. Shopping with one added item
7. Motivation overview
8. Weekly Reset after `visual-weekly-reset` reset
9. Settings backup/restore surface
10. Outro title card — `FamilyBoard / Built for family rhythm.`

## Recording notes

- Was a title card included? **Yes**
- Were feature panels included? **Yes**
- Recording method: Playwright browser recording at 1920×1080 with injected title-card pages and injected floating feature panels used only during capture
- Conversion method: Playwright `.webm` converted to `.mp4` with bundled `ffmpeg` from `imageio-ffmpeg`
- Audio: none

## Validation performed

- Verified VisualReview API health with `curl -sS http://127.0.0.1:5108/health`
- Verified frontend availability with `curl -I -sS http://127.0.0.1:5173/`
- Confirmed fixture resets returned successful JSON responses for both scenarios
- Collected video metadata from the final MP4 with `imageio_ffmpeg.read_frames`
- Confirmed final metadata:
  - duration `89.7`
  - size `1920x1080`
  - codec `h264`
  - fps `30.0`
- Extracted representative frames at intro, home, avatar, agenda, shopping, weekly reset, and outro timestamps for spot-check support during recording validation
- Ran `git diff --check`
- Baseline repository validation run before artifact work:
  - `dotnet restore HomeOps.sln` ✅
  - `dotnet build HomeOps.sln` ✅
  - `dotnet test HomeOps.sln` ✅
  - `cd src/HomeOps.Client && npm test` ⚠️ one pre-existing failing test: `src/home/FamilyMemberPage.test.tsx > owns avatar editing with live editor controls`
  - `cd src/HomeOps.Client && npm run build` ✅
  - `npx --yes nswag run nswag.json` ✅

## Cleanup

- Were temp files removed? **Yes**
- Removed or cleaned temp recording artifacts from `/tmp/fbvideo`, including extracted frames, scratch scripts, and intermediate `.webm` files after MP4 creation
- Were any artifacts besides the MP4 and report created? **No additional repository artifacts for this task**

## Modified files

- `docs/demo/familyboard-preview.mp4`
- `docs/reports/2026-06-28-familyboard-preview-video/familyboard-preview-video.md`

## Diff and artifact checks

- Did `git diff --check` pass? **Yes**
- Production code modified? **No**
- CSS modified? **No**
- Tests modified? **No**
- Screenshots added to the repository for this task? **No**
