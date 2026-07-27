# Family-member API contract tests

**Remediation phase:** Phase 0 — Safety baseline and regression harness  
**Slice:** 0.2 — Real API contract tests  
**Status:** Completed  
**Date:** 2026-07-27

## Outcome

Added four tests that send frontend-shaped JSON through a fresh `WebApplicationFactory<Program>` and isolated database:

1. current dual-avatar create returns HTTP 400, exposes the expected validation error, and persists no member;
2. current dual-avatar update returns HTTP 400 and leaves the existing member unchanged;
3. canonical `avatarSelection`-only create returns HTTP 201, persists the normalized selection, and round-trips through GET;
4. canonical `avatarSelection`-only update returns HTTP 200, persists the normalized selection, and round-trips through GET.

This records `MEMBER-01` as a reproducible contract defect without implementing the Phase 2 fix. Phase 2 Slice 2.1 remains responsible for changing the frontend to send only `avatarSelection`.

## Phase 2 follow-up

Phase 2 Slice 2.1 completed `MEMBER-01` on 2026-07-27. The frontend now sends only `avatarSelection`; five contract tests now cover canonical create/update persistence, single-field legacy create/update compatibility, and rejection of ambiguous mixed payloads.

## Files

- `tests/HomeOps.Api.Tests/Contracts/FamilyMemberFrontendContractTests.cs`
- remediation tracker, Phase 2 roadmap, and current-state updates

## Validation

Passed:

- focused real-API contract tests: 4/4;
- focused frontend `familyMembersApi` serializer tests: 2/2;
- full backend suite: 579/579;
- backend build: 0 errors;
- frontend TypeScript and production build.

Warnings:

- existing `NU1903` warning for `SQLitePCLRaw.lib.e_sqlite3` 2.1.11;
- existing frontend production chunk-size warning.

Initially blocked common gate:

- full frontend suite: 303 passed, 7 failed;
- failures are confined to `HomeDashboard.test.tsx` and `AgendaWidget.test.tsx`;
- failures concern existing controlled-date, Agenda grouping, and weather-hour expectations;
- no failing test touches the family-member adapter or new backend contract tests.

NSwag regeneration does not apply because this slice changes no API contract or production endpoint.

## Blocker resolution

Slice 0.2A corrected the offset-sensitive Agenda date arithmetic and stabilized the local weather-hour assertion. Post-fix validation passes:

- affected frontend files: 44/44;
- full frontend suite: 310/310;
- full backend suite: 579/579;
- frontend production build.

Slice 0.2 is completed. Phase 0 remains in progress because Slice 0.3 browser E2E coverage is still outstanding.
