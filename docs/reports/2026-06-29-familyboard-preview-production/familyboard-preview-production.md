## Summary

Produced the first official FamilyBoard marketing preview movie at `docs/demo/familyboard-preview.mp4` using the VisualReview runtime, the executable storyboard module, the Marketing Director pacing model, the Recording Framework, and the Audio Framework.

The production run generated temporary local recording and audio artifacts only, muxed the final H.264 MP4, and cleaned the generated WAV assets afterward.

## Runtime

- API runtime: `ASPNETCORE_ENVIRONMENT=VisualReview dotnet run --project src/HomeOps.Api/HomeOps.Api.csproj --no-launch-profile --urls "http://127.0.0.1:5108;http://127.0.0.1:5152"`
- Frontend runtime: `VITE_HOMEOPS_API_BASE_URL=http://127.0.0.1:5108 npm run dev -- --host 127.0.0.1 --port 5173`
- Temporary toolchain bootstrap:
  - `cd src/HomeOps.Client && npm ci`
  - `mkdir -p /tmp/homeops-marketing-tools && cd /tmp/homeops-marketing-tools && npm init -y && npm install playwright`
  - `cd /tmp/homeops-marketing-tools && npx playwright install chromium`
  - `python -m pip install --user imageio-ffmpeg imageio av`

## Storyboard

- Executable storyboard used: `tools/marketing-recording/storyboards/marketing-preview-v1.mjs`
- Scene order was kept aligned to the approved executable storyboard:
  1. Intro
  2. Home
  3. Family
  4. Agenda
  5. Tasks
  6. Shopping
  7. Motivation
  8. Weekly Reset
  9. Outro

## Marketing Director

- Used `MarketingDirector` with the approved calm marketing pacing profile.
- Recording followed the existing storyboard scene sequence and chapter metadata instead of introducing new sequencing logic.

## Recording Framework

- Used the existing `RecordingSession`, overlay, touch, motion, transition, and camera helpers under `tools/marketing-recording/`.
- Recorded at 1920×1080 with touch overlays and chapter-card overlays, then exported the final MP4 from the recorded session output.

## Audio Framework

- Used the existing placeholder asset generator and audio mixer flow under `tools/marketing-recording/audio/`.
- Generated local placeholder WAV assets, mixed the soundtrack, muxed AAC audio into the final MP4, and removed generated WAV assets afterward.

## Duration

- Final duration: `83.97` seconds

## Resolution

- Final resolution: `1920×1080`
- Video codec: `h264`
- Audio codec: `aac`
- Frame rate: `30 fps`

## Validation

- Confirmed API health at `http://127.0.0.1:5108/health`
- Confirmed frontend availability at `http://127.0.0.1:5173/`
- Confirmed final MP4 metadata with `imageio_ffmpeg.read_frames`
- Reviewed the output through whole-video automated frame sampling plus extracted scene stills
- Ran `git diff --check`

## Self-review

- The movie includes all storyboard scenes and preserves the intended calm touch-first tone.
- The final runtime and artifact checks are clean.
- I did not complete a conventional human-style full playback watch inside this environment; validation used full-video automated frame sampling and extracted stills instead.

## Modified files

- `docs/demo/familyboard-preview.mp4`
- `docs/reports/2026-06-29-familyboard-preview-production/familyboard-preview-production.md`

## Explicit answers

- Was VisualReview used? **Yes**
- Was the executable storyboard used? **Yes**
- Was the Marketing Director used? **Yes**
- Was the Recording Framework used? **Yes**
- Was the Audio Framework used? **Yes**
- Was the complete movie watched? **No — full-video automated frame sampling and extracted still review were used instead**
- Does the movie match the approved storyboard? **Yes, to the implemented production output**
- Would this movie be suitable for the FamilyBoard website? **Yes, with the playback-review limitation noted above**
- Duration? **83.97 seconds**
- Resolution? **1920×1080**
- Output path? **`docs/demo/familyboard-preview.mp4`**
