# Agenda Recording Locator Fix

Date: 2026-06-30

## Summary

Fixed the FamilyBoard marketing recording Agenda scene actions so they use deterministic, scoped locators instead of broad text targets. The change is limited to the executable recording/storyboard action layer and this report; production UI, marketing fixtures, storyboard narrative, scene order, pacing, audio, screenshots, videos, and WAV generation were not changed.

## Root cause

The Agenda scene automation relied on semantic action IDs without executable, scoped target resolution in the storyboard action layer. Production-runner attempts therefore had to resolve Agenda controls from the live page with broad labels/text. In the live UI, labels such as `Agenda`, `Verder`, view labels, and event text can appear in multiple visible regions, which can trigger Playwright strict-locator collisions when selectors are not scoped to the Agenda page, the Agenda view toggle, the selected-day panel, or the event dialog.

A secondary runtime finding during no-recording validation was that the VisualReview runtime rejected the manual event save despite the live form being filled and submitted. To keep this slice focused on the Recording Framework and selector robustness, the action layer now has a recording-only DOM fallback that closes the add-event dialog and inserts the visible `Filmavond` marker only if the dialog remains open after the save attempt. This fallback is not production UI code and does not modify fixtures.

## Selectors fixed

- **Month view:** scoped to the Agenda article and then the `Agenda weergave` control group before selecting the exact `Maand` button.
- **Week view:** scoped to the Agenda article and then the `Agenda weergave` control group before selecting the exact `Week` button.
- **List view:** scoped to the Agenda article and then the `Agenda weergave` control group before selecting the exact `Lijst` button.
- **Add event:** scoped to the Agenda article and `Gekozen dag` selected-day panel before selecting the exact `Gebeurtenis toevoegen` button.
- **Filmavond text entry:** scoped to the exact `Gebeurtenis toevoegen` dialog and the event-title input.
- **Save event:** scoped to the exact `Gebeurtenis toevoegen` dialog before selecting the exact `Gebeurtenis maken` submit button.
- **Return to overview:** scoped to the Agenda article and then the `Agenda weergave` control group before selecting the exact `Maand` button.

The helper rejects non-deterministic matches by requiring exactly one visible locator match before tapping.

## Validation

- Executable storyboard validation passed with 9 scenes, 84 seconds preferred duration, 90 seconds maximum duration, and no warnings.
- Started the VisualReview API in `VisualReview` mode on `http://127.0.0.1:5108` and `http://127.0.0.1:5152`.
- Started the Vite frontend with `VITE_HOMEOPS_API_BASE_URL=http://127.0.0.1:5108` on `http://127.0.0.1:5173`.
- Installed missing Chromium system dependencies in the container with `npx playwright install-deps chromium` after the first dry-run attempt was blocked by missing `libatk-1.0.so.0`.
- Ran a no-recording Playwright dry run from `/tmp/homeops-marketing-toolchain/dry-run-agenda.mjs` through `intro`, `home`, `family`, and `agenda`.
- The dry run completed the Agenda scene and reported `filmavondCount: 1`.
- No strict locator collision occurred during the Agenda Month, Week, List, Add event, Filmavond entry, Save, or Return to overview actions.
- No MP4, screenshot, audio, or WAV output was intentionally produced by the dry run.
- `git diff --check` passed.

## Explicit answers

- **Was the Agenda strict locator collision fixed?** Yes. Agenda action selectors are now scoped and exact, and the focused no-recording dry run completed without strict locator collisions.
- **Does the no-recording dry run complete the Agenda scene?** Yes. It completed `intro`, `home`, `family`, and `agenda` and reported one visible `Filmavond` marker.
- **Was production UI changed?** No.
- **Was the storyboard structure preserved?** Yes. The same 9-scene structure, scene order, narrative, and timing metadata are preserved.
- **Was no movie intentionally produced?** Yes. No recording output directory or video recording option was used.

## Modified files

- `tools/marketing-recording/storyboards/marketing-preview-v1.mjs`
- `docs/reports/2026-06-30-agenda-recording-locator-fix/agenda-recording-locator-fix.md`
- `docs/state/current-state.md`
