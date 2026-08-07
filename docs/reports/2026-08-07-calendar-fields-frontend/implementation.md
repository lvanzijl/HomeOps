# Slice 3.3 — frontend calendar-field correctness

Date: 2026-08-07
Status: completed

## Delivered

- One literal-string mapper owns every manual calendar write. Create/update use complete top-level calendar fields; occurrence edit and split use complete nested `timing` fields.
- Household time-zone state is loaded from the server and shared through the workspace. Agenda projects read instants into that zone for editing.
- Home calculates today/tomorrow at action time and offers `Meer opties`, transferring only the current title/date/all-day draft to Agenda.
- Settings provides a bounded `Kalendercontrole` dialog for candidate selection, corrected fields, server preview, explicit confirmation, apply, and conflict/error recovery.
- Deprecated manual-write `startUtc`/`endUtc` inputs are absent from runtime DTOs, OpenAPI, and the generated TypeScript client. Projected UTC fields remain read-only output.
- The TIME-01 Playwright expected-failure marker is removed.

The viewport-first implementation contract is in `viewport-analysis.md` in this directory.

## Validation

- `dotnet build HomeOps.sln --no-restore`: passed.
- `dotnet test HomeOps.sln --no-build --no-restore`: 598 passed.
- Calendar backend filter: 256 passed.
- Client build: passed.
- Client tests with `--testTimeout=20000`: 332 passed.
- Isolated Playwright smoke suite: six scenarios passed; the remaining Tasks scenario is still an intentional expected failure.
- Zero document-level overflow passed at 1440x900 and 1366x768 for Home, Agenda, Settings, Home quick-add, Agenda editor, and Kalendercontrole.
- Pinned NSwag 14.7.1 generated twice with identical SHA-256 output.
