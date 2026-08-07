# Slice 3.4 — household time-zone setting

Date: 2026-08-07
Status: completed

## Delivered

- Current-zone, searchable supported-IANA, preview, and confirmed update endpoints.
- Effect counts and truthful preservation rules for manual timed/all-day events and enabled/disabled imports.
- Full enabled-source preflight in the proposed zone with conditional HTTP caching bypassed.
- Transactional household-zone and prepared-snapshot synchronization with source-specific rollback feedback.
- Persisted imported-source normalization zone, disabled-source stale marking, and re-enable gating until refresh.
- Bounded Settings dialog with search, preview, confirmation, pending state, and recoverable source failures.
- Dynamic read reprojection in the new zone without changing stored manual calendar fields.

The viewport-first implementation authority is `viewport-analysis.md` in this directory.

## Validation

- `dotnet build HomeOps.sln --no-restore`: passed.
- `dotnet test HomeOps.sln --no-restore`: 606 passed.
- Required PostgreSQL migration and time-zone atomicity filter: 6 passed with `HOMEOPS_REQUIRE_POSTGRES_TESTS=true`.
- Client production build: passed.
- Client tests with `--testTimeout=20000`: 334 passed.
- Isolated Playwright suite: six scenarios passed, including zero document scroll for Settings and the household-time-zone dialog at 1440x900 and 1366x768; the existing Tasks scenario remains an intentional expected failure.
- EF pending-model check: no drift; idempotent migration script generated successfully.
- Pinned NSwag 14.7.1 ran twice with identical OpenAPI and generated-client SHA-256 hashes.
