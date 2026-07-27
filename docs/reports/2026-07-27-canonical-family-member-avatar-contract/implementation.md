# Canonical family-member avatar contract

**Date:** 2026-07-27  
**Plan slice:** Phase 2, Slice 2.1  
**Audit ID:** `MEMBER-01`  
**Status:** Completed

## Outcome

Family-member create and update requests from the current frontend now serialize exactly one avatar representation: canonical `avatarSelection`.

The adapter still accepts existing in-memory members that only carry `avatarV2Config`. It converts that legacy presentation model to a normalized catalog selection before sending the request. API responses continue mapping canonical selections to both frontend presentation forms, preserving existing rendering and editor behavior.

## Compatibility boundary

- Current frontend writes: `avatarSelection` only.
- Legacy external client writes: a single `avatarV2Config` remains accepted.
- Mixed writes: remain invalid at the backend boundary.
- API request/response DTOs: unchanged.
- Database model and columns: unchanged.
- Backend persistence: canonical selection remains authoritative and the existing legacy projection remains maintained.

No OpenAPI/NSwag regeneration or migration was required.

## Regression coverage

- Frontend create serialization omits `avatarV2Config`.
- Frontend update serialization omits `avatarV2Config`.
- Canonical create returns HTTP 201, persists the normalized selection, and round-trips through GET.
- Canonical update returns HTTP 200, persists the normalized selection, and round-trips through GET.
- Single-field legacy create/update remains accepted and normalizes to canonical selection.
- Playwright changes Dad's avatar through the real UI/API, refreshes, reopens the editor, and verifies the saved selection.

## Validation

- Focused frontend adapter tests: 2/2 passed.
- Focused real-endpoint contract tests: 5/5 passed.
- Isolated browser suite: 5/5 outcomes passed; avatar persistence is now a normal pass, with three unrelated scenarios still expected failures.
- `dotnet restore HomeOps.sln`: passed.
- Full frontend suite: 310/310 passed.
- Full backend suite: 580/580 passed.
- Frontend production build: passed.
- Backend build: passed.

Existing non-blocking warnings remain: the `SQLitePCLRaw.lib.e_sqlite3` NU1903 advisory, the Vitest runner's Node DEP0190 warning, and Vite's large-chunk warning.

## Scope

This slice does not change asynchronous mutation error handling, onboarding, seed data, family removal/restore, API contracts, database schema, primary-page layout, or any later Phase 2 behavior.
