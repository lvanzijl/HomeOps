# Phase 5 Slice 5.1 — Home Assistant migration repair

## Outcome

The existing `20260717124500_AddHomeAssistantResumeStrategyConfiguration` migration is discoverable again in its original historical position. No competing migration or model-snapshot change was introduced. Clean databases receive the five resume-strategy columns, and an active pre-migration Home Assistant provider is upgraded and safely backfilled before the provider API is exercised against the fully upgraded PostgreSQL database.

Startup migration state is now visible through `/health`. Healthy and test-only hosts return HTTP 200; pending or failed migration state returns HTTP 503. The public detail is deliberately limited to state, pending count, check time, and a fixed failure code. Exception and connection details remain in server logs.

## Regression coverage

- clean PostgreSQL applies every discoverable migration and contains all five resume-strategy columns;
- the repaired migration is immediately after `20260715205518_AddRoomHeatingCommands`;
- an enabled Home Assistant provider using the legacy script diagnostic is preserved and backfilled;
- the database then upgrades to latest and `GET /api/climate-providers/` returns HTTP 200 through a real Npgsql API host;
- failed health detail returns HTTP 503 without password, host, connection-string, or exception text;
- healthy state clears prior pending/failure detail.

## Validation

- `dotnet ef migrations list`: passed; the repaired migration appears in the correct position.
- Focused migration and health tests: 7/7 passed.
- Required PostgreSQL migration gate through the running Rancher Desktop service: 4/4 passed.
- Full backend suite: 640/640 passed.
- Full frontend suite: 354/354 passed with the established 20-second timeout budget. An initial default 5-second run timed out in four unrelated long-running UI tests; the required-budget rerun passed all tests.
- `dotnet build HomeOps.sln --no-restore`: passed.
- Frontend production build: passed.
- EF pending-model check: no drift.
- EF idempotent migration script: generated successfully.
- Pinned NSwag 14.7.1: two final generations passed and produced identical OpenAPI/client SHA-256 hashes.

No viewport analysis or Playwright run was required because this slice changes no primary-page UI or layout.
