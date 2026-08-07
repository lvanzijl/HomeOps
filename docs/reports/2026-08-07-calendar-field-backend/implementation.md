# Backend calendar-field correction

**Remediation slice:** 3.2  
**Audit:** TIME-01  
**Status:** Completed

## Outcome

Manual event persistence now starts from household-local calendar fields rather than extracting UTC components. Create/update accept the approved field set; occurrence modify and this-and-future split accept an optional atomic `timing` group. The household IANA zone is used for validation and projection. Nonexistent wall times are rejected, and ambiguous fall-back times use the larger offset/earlier UTC instant.

Read DTOs continue returning projected `startUtc` and `endUtc`. A nullable deprecated UTC-input compatibility path remains for the current frontend only, keeping Slice 3.2 independently deployable. Slice 3.3 owns migrating all callers and deleting that path.

## Import boundary

iCalendar parsing now accepts the household zone. UTC and `TZID` timestamps convert into household-local fields; floating timestamps and all-day dates remain calendar fields. The household normalization zone participates in content fingerprints so a later forced refresh under another household zone can reapply provider data.

## Historical repair

Migration `20260807185444_AddCalendarWriteContractVersion` marks existing writable manual series as version 1. New and explicitly repaired manual writes use version 2; imported series remain unversioned. The API lists version-1 candidates, previews user-entered replacement fields, and applies them only with explicit confirmation and a matching `UpdatedUtc`. It never guesses or automatically shifts an event.

## Validation

- `dotnet build HomeOps.sln --no-restore`: passed with the existing `SQLitePCLRaw.lib.e_sqlite3` NU1903 advisory.
- Calendar-focused backend tests: 256/256 passed.
- Full backend tests: 598/598 passed.
- Frontend build: passed.
- Standard frontend suite reached 321/325 before four unrelated known 5-second timeout flakes; the complete suite passed 325/325 with `--testTimeout=20000`.
- `dotnet ef migrations has-pending-model-changes`: no pending model changes.
- Idempotent migration script generation: passed.
- Pinned NSwag 14.7.1 ran twice; OpenAPI and generated-client hashes were unchanged on the second run.
