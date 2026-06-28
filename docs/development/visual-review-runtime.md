# VisualReview Runtime

`VisualReview` is the supported browser-facing API runtime for FamilyBoard visual review. It reuses the official `/api/visual-review-fixtures` endpoint system and stores data in an ephemeral EF Core InMemory database so screenshots and Playwright inspection can run without Docker or PostgreSQL.

## Runtime roles

- `Development`: normal local API runtime backed by PostgreSQL.
- `Testing`: integration test host runtime configured by `HomeOpsWebApplicationFactory`.
- `VisualReview`: browser, Playwright, Codex, and Copilot visual review runtime backed by ephemeral InMemory EF Core storage.

## Start the API

For endpoint-only checks, one URL is enough:

```bash
export DOTNET_CLI_HOME=/tmp/dotnet
export PATH="$PATH:$HOME/.dotnet/tools"
ASPNETCORE_ENVIRONMENT=VisualReview \
  dotnet run --project src/HomeOps.Api/HomeOps.Api.csproj \
  --no-launch-profile \
  --urls http://127.0.0.1:5108
```

For Vite browser validation, expose both the documented VisualReview port and the existing Vite proxy target used by generated API clients:

```bash
export DOTNET_CLI_HOME=/tmp/dotnet
export PATH="$PATH:$HOME/.dotnet/tools"
ASPNETCORE_ENVIRONMENT=VisualReview \
  dotnet run --project src/HomeOps.Api/HomeOps.Api.csproj \
  --no-launch-profile \
  --urls 'http://127.0.0.1:5108;http://127.0.0.1:5152'
```

The `VisualReview` launch profile also uses `http://127.0.0.1:5108`.

## Verify fixtures

```bash
curl -sS -m 5 http://127.0.0.1:5108/health
curl -sS -m 5 http://127.0.0.1:5108/api/visual-review-fixtures/scenarios
curl -sS -m 10 -X POST http://127.0.0.1:5108/api/visual-review-fixtures/visual-full/reset
curl -sS -m 10 -X POST http://127.0.0.1:5108/api/visual-review-fixtures/visual-weekly-reset/reset
```

## Run Vite against VisualReview

```bash
cd src/HomeOps.Client
VITE_HOMEOPS_API_BASE_URL=http://127.0.0.1:5108 npm run dev -- --host 127.0.0.1 --port 5173
```

Keep the API listening on `http://127.0.0.1:5152` as well when using the current Vite dev server because generated API clients still rely on relative `/api` requests that are proxied by `vite.config.ts`.

## Playwright/browser workflow

1. Start the `VisualReview` API on both `5108` and `5152`.
2. Start Vite with `VITE_HOMEOPS_API_BASE_URL=http://127.0.0.1:5108`.
3. Reset `visual-full` before inspecting Home, Agenda, Tasks, Shopping, and Motivation.
4. Reset `visual-weekly-reset` before inspecting Weekly Reset.
5. Use the real browser UI; do not mock Playwright routes or duplicate fixture data.
