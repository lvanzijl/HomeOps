# Marketing Production Engine Phase 4.1 Temporary Toolchain

## Summary
- Removed the direct Playwright dependency from the product client package.
- Updated the Recording stage so the Marketing Production Engine owns a temporary Playwright toolchain outside the repository.
- The temporary toolchain is created or reused at `/tmp/familyboard-marketing-tools`.
- The Recording stage still launches Playwright, creates the existing RecordingSession, executes the recording plan, and produces the temporary raw WebM artifact.
- No production UI, storyboard, Recording Framework, Marketing Director, or Audio Framework code was changed.
- No MP4, audio, screenshots, WAV files, or committed binary artifacts were produced.

## Root cause
Phase 4 correctly moved recording orchestration into deterministic Production Engine code, but it installed Playwright into `src/HomeOps.Client/package.json` and `src/HomeOps.Client/package-lock.json`.

That made the Product package aware of a marketing-production-only toolchain. The intended architecture is that the Product and Marketing Production Engine remain separate, with Playwright owned by the Production Engine's temporary toolchain instead of by the product client.

## Temporary toolchain architecture
The updated architecture is:

1. Repository
2. Product client package
3. Marketing Production Engine
4. Temporary toolchain outside the repository
5. Playwright installed in the temporary toolchain

The configured toolchain path is `/tmp/familyboard-marketing-tools`.

The Recording stage now:

- creates the toolchain directory when missing
- creates a minimal temporary `package.json` when missing
- checks whether Playwright is already resolvable from that toolchain
- installs Playwright into the temporary toolchain only when missing
- installs the Playwright Chromium browser into the temporary toolchain when Playwright is first installed
- loads Playwright through `createRequire` from the temporary toolchain package

The product client package no longer needs to install or expose Playwright for marketing production recording.

## Recording stage update
`tools/marketing-production/recording/recording-stage.mjs` now resolves Playwright from the Production Engine-owned temporary toolchain instead of `src/HomeOps.Client`.

The Recording stage continues to:

- receive validated production configuration
- receive the Storyboard stage RecordingPlan
- require Runtime success before recording
- create the existing RecordingSession
- run all 9 scenes
- close the browser/session
- persist the temporary raw WebM artifact to `/tmp/familyboard-marketing-preview-v1.webm`

## Validation
Validated:

- Runtime stage passes.
- Storyboard stage passes.
- Recording stage passes.
- Temporary toolchain is created or reused at `/tmp/familyboard-marketing-tools`.
- Playwright launches successfully from the temporary toolchain.
- RecordingSession executes.
- Raw WebM is produced at `/tmp/familyboard-marketing-preview-v1.webm`.
- No MP4 is produced.
- No audio is produced.
- `src/HomeOps.Client/package.json` no longer contains a direct Playwright dependency.
- `src/HomeOps.Client/package-lock.json` no longer contains `node_modules/playwright`.
- Whitespace diff check passes.

Commands run:

```bash
npm --prefix src/HomeOps.Client uninstall playwright
rm -rf /tmp/familyboard-marketing-tools /tmp/familyboard-marketing-preview-v1.webm
node tools/marketing-production/production.mjs
npm --prefix src/HomeOps.Client run marketing:record
! rg '"playwright":' src/HomeOps.Client/package.json
! rg '"node_modules/playwright"' src/HomeOps.Client/package-lock.json
git diff --check
git diff --stat
git diff -- tools/marketing-production src/HomeOps.Client/package.json src/HomeOps.Client/package-lock.json docs/reports/2026-06-30-marketing-production-engine-phase-4-1/marketing-production-engine-phase-4-1.md docs/state/current-state.md docs/roadmap/phase-2.md
```

## Modified files
- `tools/marketing-production/recording/recording-stage.mjs`
- `tools/marketing-production/config/default-production-config.mjs`
- `src/HomeOps.Client/package.json`
- `src/HomeOps.Client/package-lock.json`
- `docs/reports/2026-06-30-marketing-production-engine-phase-4-1/marketing-production-engine-phase-4-1.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

## Explicit answers
- Was Playwright removed from the product package? **Yes.** The direct Playwright dependency was removed from `src/HomeOps.Client/package.json` and the `node_modules/playwright` lockfile entry was removed.
- Does the Production Engine own the temporary toolchain? **Yes.** It creates or reuses `/tmp/familyboard-marketing-tools` and installs/loads Playwright there.
- Can the Recording stage still execute successfully? **Yes.** `node tools/marketing-production/production.mjs` and `npm --prefix src/HomeOps.Client run marketing:record` both completed successfully after the toolchain move.
- Is the repository now independent of Playwright? **Yes.** The product package no longer has a direct Playwright dependency; the temporary toolchain is outside the repository.
- Was no movie intentionally produced? **Yes.** No final movie or MP4 was produced; validation only produced the temporary raw WebM recording artifact required by the recording stage.
