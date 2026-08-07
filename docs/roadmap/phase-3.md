# Phase 3 — Calendar and local-time correctness

Phase 3 makes household-local calendar intent authoritative across manual writes, recurrence, imports, settings, and device-specific agenda preferences.

| Slice | Status | Outcome |
| --- | --- | --- |
| 3.1 Calendar-field contract | Completed | Approved manual calendar fields, import boundary, and DST policy. |
| 3.2 Backend writes and recurrence | Completed | Calendar-field API, household-zone projection, import normalization, migration, and explicit repair endpoints. |
| 3.3 Frontend forms and quick actions | Not started | Migrate all callers, remove the deprecated UTC write shim, and add repair UI. |
| 3.4 Household time-zone setting | Not started | Previewed and transactional IANA-zone changes. |
| 3.5 Calendar source lifecycle | Not started | Real iCal upload, replacement, archive, restore, and removal. |
| 3.6 Device settings identity | Not started | Versioned identity, last-seen cleanup, and reset. |
| 3.7 Reminder decision | Not started | Truthfully defer reminders and close the phase. |

## Slice 3.2 implementation boundary

The backend now treats `startDate`/`startTime`/`endDate`/`endTime`/`isAllDay` as the authoritative manual-write representation. Occurrence changes and splits use an optional complete `timing` object. The household zone validates nonexistent times and deterministically resolves fall-back ambiguity. Read DTOs continue exposing projected instants for display and interoperability.

Existing writable manual events are marked contract version 1 and appear in an explicit repair-candidate API. Repairs require user-supplied calendar fields, preview, confirmation, and an unchanged `UpdatedUtc`; no historical event is shifted automatically. New or repaired manual events use version 2, and imported events remain outside this repair classification.

For the one-slice deployment boundary, deprecated nullable `startUtc`/`endUtc` request fields remain accepted for the current frontend. Slice 3.3 must migrate every caller to calendar fields and then delete this compatibility path from DTOs, validation, OpenAPI, and the generated client.

Validation: backend 598/598; frontend 325/325 with a 20-second timeout for the already documented timeout-sensitive tests; backend and frontend builds; 256 calendar tests; EF model-drift check; idempotent migration script; and two identical pinned NSwag 14.7.1 generations.
