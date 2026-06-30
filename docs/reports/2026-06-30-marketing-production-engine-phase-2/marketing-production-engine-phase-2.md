# Marketing Production Engine Phase 2 Runtime

## Summary
- Extended the Phase 1 Marketing Production Engine with a Runtime stage.
- The production engine now starts the VisualReview API and Vite frontend from shared production configuration.
- The runtime stage performs structured API and frontend health checks.
- The runtime stage owns process lifetime and shuts down owned processes before the production engine exits.
- No browser was launched, no recording occurred, no audio was generated, and no movie was produced.

## Runtime architecture
The Runtime stage lives in `tools/marketing-production/runtime/` and exposes a small `startRuntimeStage(config, options)` interface to the production engine.

The stage reads runtime settings from `default-production-config.mjs`, including:

- API project
- VisualReview environment
- API URL
- API health path
- frontend directory
- frontend host
- frontend port
- app URL
- startup timeout
- shutdown timeout

The production entry point validates the Phase 1 configuration/storyboard/pipeline first. If validation succeeds, it starts the Runtime stage, collects structured runtime status, and then stops the runtime before exiting. If runtime startup fails, the returned result is marked invalid and no later media stages are attempted.

## Process ownership
The Runtime stage owns process creation and cleanup for:

- `dotnet run --project src/HomeOps.Api/HomeOps.Api.csproj --no-launch-profile -p:UseSharedCompilation=false`
- `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`

The stage starts each process in its own process group, captures bounded output tails for structured failure reporting, and terminates owned process groups during shutdown. Shutdown happens in reverse startup order so the frontend stops before the API.

## Health validation
The Runtime stage validates:

- API process startup was initiated.
- API health endpoint `http://127.0.0.1:5108/health` returned HTTP 200.
- Frontend process startup was initiated.
- Frontend URL `http://127.0.0.1:5173` returned HTTP 200.

Health is returned as structured JSON under `runtime.api.health` and `runtime.frontend.health`.

## Validation
Validated:

- runtime stage initializes
- API starts
- frontend starts
- API health succeeds
- frontend health succeeds
- runtime stage shuts everything down cleanly
- no browser launches
- no recording occurs
- no media is produced
- whitespace diff check passes

Commands run:

```bash
node tools/marketing-production/production.mjs
npm --prefix src/HomeOps.Client run marketing:record
ps -ef | rg 'dotnet|vite|marketing-production|npm run dev' || true
git diff --check
git diff --stat
git diff -- tools/marketing-production docs/reports/2026-06-30-marketing-production-engine-phase-2/marketing-production-engine-phase-2.md docs/state/current-state.md docs/roadmap/phase-2.md
```

## Modified files
- `tools/marketing-production/production.mjs`
- `tools/marketing-production/config/default-production-config.mjs`
- `tools/marketing-production/runtime/runtime-stage.mjs`
- `docs/reports/2026-06-30-marketing-production-engine-phase-2/marketing-production-engine-phase-2.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

## Explicit answers
- Does the production engine now own runtime startup? **Yes.** It starts the VisualReview API and Vite frontend through the Runtime stage.
- Does it own runtime shutdown? **Yes.** It shuts down the owned frontend and API process groups before exiting.
- Does it validate API health? **Yes.** It validates `http://127.0.0.1:5108/health` and returns structured health status.
- Does it validate frontend availability? **Yes.** It validates `http://127.0.0.1:5173` and returns structured health status.
- Was no browser launched? **Yes.** The engine starts only API/frontend runtime processes and does not launch Playwright or a browser.
- Was no movie intentionally produced? **Yes.** The recording, audio, muxing, and media-output phases remain unimplemented in this slice.
