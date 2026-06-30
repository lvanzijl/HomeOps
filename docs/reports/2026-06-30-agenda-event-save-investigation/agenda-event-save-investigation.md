# Agenda Event Save Investigation

Date: 2026-06-30

## Summary

Investigated and fixed the real Agenda event-save failure that forced the previous recording-only `Filmavond` DOM fallback. The strict locator fixes remain, but the Agenda scene now relies on the real application save path: the add-event form posts to the Agenda API, the API persists the new event against the active writable manual event source, and the UI displays `Filmavond` through normal React state updates.

No movie, screenshots, audio, WAV files, or binary artifacts were produced.

## Root cause

The event creation endpoint hardcoded `SeedCalendarEvents.EventSourceId` as the only writable target for new events. That works for normal seeded data, but VisualReview marketing fixtures replace the household calendar source with fixture-specific writable source IDs, such as the marketing Agenda source `88000000-0000-0000-0000-000000000001`.

During the dry run, the UI submitted a valid `Filmavond` event, but the API looked for the seeded source ID instead of the current fixture source. Because that seeded source did not exist in the VisualReview fixture database, the endpoint returned `404 Not Found`; the dialog remained open and the previous recording action fallback inserted a fake visible marker.

## Fix

- Updated event creation to resolve the current household's writable manual event source instead of hardcoding the seed source ID.
- Added API regression coverage that removes the seeded event source, installs a fixture-shaped writable manual source, creates `Filmavond`, and asserts the created event uses that current source.
- Removed the recording-only DOM fallback from the Agenda recording action implementation.
- Kept the scoped Agenda locators and added harmless synchronization around the event dialog flow so the recording action waits for either the details step or the naturally saved `Filmavond` event.

## Validation

- API-focused event tests passed: `EventSeriesApiTests` ran 9 tests including the new fixture-source regression.
- Executable storyboard validation passed with 9 scenes and no warnings.
- VisualReview API started in `VisualReview` mode on `http://127.0.0.1:5108` and `http://127.0.0.1:5152`.
- Vite frontend started with `VITE_HOMEOPS_API_BASE_URL=http://127.0.0.1:5108` on `http://127.0.0.1:5173`.
- The no-recording dry run through `intro`, `home`, `family`, and `agenda` completed successfully.
- The dry run reported `filmavondCount: 1`; the marker came from the normal application save path, not recording-only DOM insertion.
- No strict locator collisions occurred.
- `git diff --check` passed.

## Explicit answers

- **Was the real event save fixed?** Yes. The API now creates new events against the active writable manual source for the household, including VisualReview fixture sources.
- **Was the recording-only DOM fallback removed?** Yes. The storyboard action no longer injects `Filmavond` or mutates the rendered Agenda DOM.
- **Is Filmavond now created through the normal application workflow?** Yes. The recording opens the dialog, enters `Filmavond`, submits the form, and the UI renders the persisted event through application state.
- **Was any production UI changed?** No. The fix is in the API save path and recording action synchronization only.
- **Was no movie intentionally produced?** Yes. No recording video directory was configured and no media artifacts were generated.

## Modified files

- `src/HomeOps.Api/CalendarEvents/EventSeriesEndpoints.cs`
- `tests/HomeOps.Api.Tests/CalendarEvents/ManualEventApiTests.cs`
- `tools/marketing-recording/storyboards/marketing-preview-v1.mjs`
- `docs/reports/2026-06-30-agenda-event-save-investigation/agenda-event-save-investigation.md`
- `docs/state/current-state.md`
