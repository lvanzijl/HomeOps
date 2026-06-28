# FamilyBoard Marketing Recording Framework

## Summary

Implemented an infrastructure-only recording framework for future FamilyBoard marketing videos. The work adds reusable session, scene, touch, motion, overlay, camera, transition, and sample-sequence modules. No final marketing movie, screenshots, audio, Playwright tests, binary artifacts, or production UI changes were created.

## Architecture

The framework is organized under `tools/marketing-recording/` as small reusable modules:

- `session.mjs` coordinates viewport setup, browser context/video options, fixture reset, scene execution, and cleanup.
- `scene.mjs` validates configuration-driven scene definitions.
- `touch.mjs` exposes tablet-style gestures over deterministic pointer paths.
- `motion.mjs` provides easing, curved movement, and timing profiles.
- `overlays.mjs` injects temporary recording-only touch, ripple, chapter, and transition presentation into the browser page.
- `camera.mjs` provides breathing-room helpers for pauses and idle/animation/transition waits.
- `transitions.mjs` provides reusable scene transition execution.
- `sample-sequence.mjs` demonstrates a minimal internal sequence for validating the framework components.

The code is intentionally separate from `src/HomeOps.Client` production UI and from backend production code.

## Recording session

`RecordingSession` owns the reusable lifecycle for future recordings:

1. Start or reuse a browser.
2. Create a tablet-landscape context with a 1920×1080 export target.
3. Navigate to the app.
4. Install temporary recording overlays.
5. Reset each scene fixture through the existing VisualReview fixture endpoint.
6. Execute the scene with camera and touch helpers.
7. Close context/browser resources.

The session accepts `appUrl`, `fixtureBaseUrl`, viewport, timing profile, and optional video output directory so future recordings can configure behavior without hard-coding one video.

## Scene abstraction

Scenes are configuration objects validated by `defineScene`. Each scene supports:

- stable `id`
- `fixture`
- `chapter` title/subtitle/position/duration
- ordered semantic `actions`
- `transition`
- `durationHintMs`

Future videos should primarily add new scene definitions and action callbacks instead of duplicating browser/session setup.

## Touch interaction framework

`TouchDriver` provides deterministic touch-first interactions:

- tap
- double tap
- long press
- swipe
- drag
- scroll

Gestures use curved eased movement rather than teleporting or perfectly linear pointer motion. Timing profiles allow calm, warm, or brisk pacing.

## Touch indicator and ripple

The overlay system injects a temporary high-z-index recording layer at runtime. It creates:

- a soft white circular touch point
- subtle opacity and glow
- smooth movement/fade behavior
- configurable size
- a short, gentle tap ripple with configurable duration and size

This overlay is not part of production UI and is injected only into the recording page context.

## Chapter overlay

The chapter overlay supports a title, optional subtitle, configurable duration, and configurable position. Its default positions keep content near corners so it can avoid obscuring important application content. It fades in/out with warm translucent styling suitable for calm marketing footage.

## Transition framework

`runTransition` provides a reusable fade-style transition wrapper around arbitrary scene-change work, such as fixture reset and page reload. The scene model carries transition type and duration so future transition types can be added without changing scene definitions.

## Validation

A minimal internal sample sequence was added in `sample-sequence.mjs` to demonstrate:

- touch indicator via tap, long press, double tap, and swipe actions
- ripple via tap/double tap/long press
- chapter overlays for two scenes
- scene transitions between VisualReview marketing fixtures
- gesture helpers and camera pauses

This is a reusable validation sample only. It does not create a final marketing movie and does not write screenshots, video, audio, or binary artifacts.

## Modified files

- `tools/marketing-recording/motion.mjs`
- `tools/marketing-recording/overlays.mjs`
- `tools/marketing-recording/camera.mjs`
- `tools/marketing-recording/transitions.mjs`
- `tools/marketing-recording/touch.mjs`
- `tools/marketing-recording/scene.mjs`
- `tools/marketing-recording/session.mjs`
- `tools/marketing-recording/sample-sequence.mjs`
- `docs/reports/2026-06-28-marketing-recording-framework/marketing-recording-framework.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

## Explicit answers

- **Is the framework reusable?** Yes. Session orchestration, scenes, gestures, overlays, camera helpers, and transitions are separate reusable modules.
- **Is it tablet-first?** Yes. The default viewport is tablet landscape with touch enabled and a 1920×1080 export target.
- **Does it require production UI changes?** No. All overlays are temporary runtime injections for recording only.
- **Can future marketing videos be described primarily through scene configuration?** Yes. Future videos can define scene objects with fixtures, chapter copy, transitions, duration hints, and actions.
- **Was the final marketing movie intentionally not created during this phase?** Yes. This phase intentionally created framework infrastructure only.
