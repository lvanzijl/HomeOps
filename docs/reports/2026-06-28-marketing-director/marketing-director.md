# FamilyBoard Marketing Director Report

## Summary

Implemented a reusable Marketing Director layer for future FamilyBoard marketing videos. The Director owns story structure, scene ordering, pacing profile selection, storyboard validation, and event publication. The existing recording session remains responsible for browser execution only.

No movie, screenshots, audio playback, Playwright tests, production UI changes, or binary artifacts were created.

## Architecture

The recording architecture now follows the film-production separation requested for this slice:

Marketing Director → Storyboard → Recording Session → Touch / Camera / Overlay → Browser

- `director.mjs` converts storyboard configuration into a recording plan.
- `sample-storyboard.mjs` demonstrates a minimal internal storyboard.
- `events.mjs` provides an event bus and stable event names for future integrations.
- `session.mjs` consumes scene instructions and publishes execution events while keeping Playwright access inside the session layer.
- `scene.mjs` preserves compatibility with existing scene definitions while carrying richer metadata when provided.

## Director Responsibilities

The Marketing Director is responsible for:

- Storyboard validation.
- Scene ordering through chapter sequencing.
- Narrative order checks.
- Pacing profile application.
- Transition duration selection.
- Producing recording plans for the session.
- Publishing recording start and finish events.

The Director does not import or call Playwright. Browser work remains delegated to the Recording Session.

## Scene Metadata

Scene definitions can now carry richer storytelling metadata:

- `id`
- `fixture`
- `title`
- `subtitle`
- `purpose`
- `emotionalTone`
- `visualFocus`
- `minimumDurationMs`
- `preferredDurationMs`
- `maximumDurationMs`
- `transition`
- `actions`

The sample storyboard demonstrates warm, calm, and reflective scenes focused on agenda, tasks, and motivation.

## Story Validation

Storyboard validation detects descriptive warnings for:

- Missing storyboard or chapter identifiers.
- Duplicate scenes.
- Missing fixtures.
- Missing transitions.
- Missing purpose, emotional tone, or visual focus.
- Invalid or impossible durations.
- Abrupt pacing changes.
- Unknown or out-of-order narrative chapters.

The sample storyboard validates successfully.

## Timing Profiles

Reusable marketing pacing profiles were added:

- Calm Marketing.
- Conference Demo.
- Fast Feature Preview.

Profiles influence movement profile selection, transition duration, chapter timing, pause bias, and preferred scene duration boundaries. They prepare future videos to change feel without rewriting recording mechanics.

## Event Timeline

The new event infrastructure includes stable event types for:

- Recording started / finished.
- Scene started / completed.
- Chapter started / completed.
- Transition started / completed.
- Touch started / completed.
- Gesture started / completed.
- Action started / completed.

The event bus stores published events and supports listeners. This prepares future sound effects, narration, analytics, diagnostics, subtitles, and synchronization without implementing those features now.

## Extensibility

The architecture prepares extension points for:

- Audio synchronization.
- Narration.
- Subtitles.
- Localization.
- Multiple storyboards.
- Alternative pacing profiles.
- Diagnostics and analytics.

These are intentionally extension points only. No audio playback, narration, subtitle rendering, localization runtime, or analytics backend was implemented.

## Validation

Validation performed:

- Ran the sample storyboard validation script and confirmed it returns `valid: true` with no warnings.
- Imported the Marketing Director, event bus, sample storyboard, session, and existing sample sequence modules in Node to confirm module compatibility.
- Ran `git diff --check`.
- Inspected the complete diff with `git diff`.

## Explicit Answers

- **Does the Marketing Director own storytelling?** Yes. It owns narrative order, chapter sequencing, scene metadata validation, pacing profile application, and recording plan generation.
- **Does the Recording Session remain execution-only?** Yes. It still owns browser, fixture reset, transition execution, overlays, camera, touch, and action execution. It consumes scenes rather than deciding the story.
- **Can future videos be created primarily through storyboard configuration?** Yes. Future videos can define chapters, scenes, timing metadata, transitions, and action descriptors through storyboard configuration.
- **Are extension points prepared for audio, narration and localization?** Yes. Stable event publication and storyboard metadata provide integration points for future audio, narration, subtitle, and localization work.
- **Was no movie intentionally produced during this phase?** Yes. No recording command was run and no video artifact was generated.

## Modified Files

- `tools/marketing-recording/director.mjs`
- `tools/marketing-recording/events.mjs`
- `tools/marketing-recording/sample-storyboard.mjs`
- `tools/marketing-recording/scene.mjs`
- `tools/marketing-recording/session.mjs`
- `docs/reports/2026-06-28-marketing-director/marketing-director.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
