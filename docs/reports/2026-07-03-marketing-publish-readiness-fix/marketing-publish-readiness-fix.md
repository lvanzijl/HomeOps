# Marketing Publish Readiness Fix

## Summary

Restored the canonical FamilyBoard Marketing Preview V1 preferred storyboard duration from 82,000 ms to 84,000 ms and verified that storyboard validation now passes with the required 9 scenes, 84,000 ms preferred duration, and 90,000 ms maximum duration.

Publish mode was rerun after dependency readiness and Chromium system dependency installation. The Production Engine now starts the API and Vite frontend and passes storyboard validation, but publish execution still does not complete because the Agenda recording action cannot advance reliably to the final event-details/save step. No subjective movie review was performed.

## Root cause

Publish originally failed because a recent Agenda storyboard update reduced the Agenda scene preferred duration from 14 seconds to 12 seconds and changed the storyboard preferred total to 82,000 ms. That conflicted with the Production Engine recording-plan validation, where the canonical marketing storyboard target remains 84,000 ms preferred and 90,000 ms maximum.

The executable storyboard reported 82,000 ms because the scene preferred durations summed to 82 seconds after the Agenda scene was shortened by 2 seconds.

## Dependency readiness

- `npm ci --prefix src/HomeOps.Client` restored the client dependency tree.
- `npm --prefix src/HomeOps.Client exec vite -- --version` confirmed Vite is available from the product package dependency install.
- Publish mode started both the backend API and frontend Vite server successfully.
- The Production Engine continued to use the temporary Playwright toolchain directory at `/tmp/familyboard-marketing-tools`.
- Chromium system dependencies were missing on the first publish attempt after the duration fix. `npx playwright install-deps chromium` installed the environment-supported libraries, after which Chromium launched successfully.
- No permanent Playwright dependency was added to `src/HomeOps.Client/package.json`.
- `node_modules` was not committed.

## Storyboard duration fix

The canonical 84,000 ms storyboard duration was restored by returning the Agenda scene preferred duration to 14,000 ms and restoring `preferredTotalDurationMs` to 84,000 ms. The canonical Markdown storyboard timing summary was updated to match.

Action pacing/readability metadata was left intact; this fix separates canonical authored scene duration from executable action pacing.

## Publish verification

Command run:

```bash
MARKETING_PRODUCTION_MODE=publish npm --prefix src/HomeOps.Client run marketing:record
```

Observed results:

- Storyboard validation passed.
- Preferred duration reported as 84,000 ms.
- Maximum duration reported as 90,000 ms.
- Runtime started the backend API and Vite frontend successfully.
- Chromium launched successfully after system dependency installation.
- Publish mode did not complete.
- No new timestamped MP4 was produced under `docs/demo/`.
- Metadata JSON was not generated.
- Timing JSON was not generated.
- Cleanup did not execute because recording failed before audio/export/metadata/cleanup.

Remaining publish blocker:

- The Agenda scene fails during `add-filmavond`. The recording reaches the Agenda add-event dialog, enters `Filmavond`, and advances through the early questions, but the expected final details/save state is not reached. A fallback API creation attempt also failed with a backend `502`, so the publish run stopped without producing media.

## Validation

- `node tools/marketing-recording/storyboards/marketing-preview-v1.mjs` passed with 9 scenes, 84,000 ms preferred duration, and 90,000 ms maximum duration.
- `npm ci --prefix src/HomeOps.Client` completed and restored Vite.
- `npm --prefix src/HomeOps.Client exec vite -- --version` reported Vite availability.
- `npx playwright install-deps chromium` completed after installing Chromium system libraries; the external `mise.jdx.dev` apt source returned a 403 warning, but Ubuntu package installation continued.
- `MARKETING_PRODUCTION_MODE=publish npm --prefix src/HomeOps.Client run marketing:record` did not complete because of the Agenda `add-filmavond` recording failure described above.
- Temporary WebM/WAV artifacts are absent from the repository working tree.
- No Playwright dependency was added to the product package.
- No subjective movie review was performed.

## Modified files

- `docs/design/marketing-storyboard-v1.md`
- `tools/marketing-recording/storyboards/marketing-preview-v1.mjs`
- `docs/reports/2026-07-03-marketing-publish-readiness-fix/marketing-publish-readiness-fix.md`
- `docs/state/current-state.md`
