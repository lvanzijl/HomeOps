# Phase 3 — Calendar and local-time correctness

Phase 3 makes household-local calendar intent authoritative across manual writes, recurrence, imports, settings, and device-specific agenda preferences.

| Slice | Status | Outcome |
| --- | --- | --- |
| 3.1 Calendar-field contract | Completed | Approved manual calendar fields, import boundary, and DST policy. |
| 3.2 Backend writes and recurrence | Completed | Calendar-field API, household-zone projection, import normalization, migration, and explicit repair endpoints. |
| 3.3 Frontend forms and quick actions | Completed | Shared literal calendar-field writes, action-time household dates, draft transfer, and bounded repair UI. |
| 3.4 Household time-zone setting | Completed | Previewed, preflighted, transactional IANA-zone changes with stale-source gating. |
| 3.5 Calendar source lifecycle | Not started | Real iCal upload, replacement, archive, restore, and removal. |
| 3.6 Device settings identity | Not started | Versioned identity, last-seen cleanup, and reset. |
| 3.7 Reminder decision | Not started | Truthfully defer reminders and close the phase. |

## Slice 3.2 implementation boundary

The backend now treats `startDate`/`startTime`/`endDate`/`endTime`/`isAllDay` as the authoritative manual-write representation. Occurrence changes and splits use an optional complete `timing` object. The household zone validates nonexistent times and deterministically resolves fall-back ambiguity. Read DTOs continue exposing projected instants for display and interoperability.

Existing writable manual events are marked contract version 1 and appear in an explicit repair-candidate API. Repairs require user-supplied calendar fields, preview, confirmation, and an unchanged `UpdatedUtc`; no historical event is shifted automatically. New or repaired manual events use version 2, and imported events remain outside this repair classification.

At the Slice 3.2 deployment boundary, deprecated nullable `startUtc`/`endUtc` request fields remained accepted for the then-current frontend. Completed Slice 3.3 migrated every caller and deleted that compatibility path from DTOs, validation, OpenAPI, and the generated client.

Validation: backend 598/598; frontend 325/325 with a 20-second timeout for the already documented timeout-sensitive tests; backend and frontend builds; 256 calendar tests; EF model-drift check; idempotent migration script; and two identical pinned NSwag 14.7.1 generations.

## Slice 3.3 implementation boundary

All Home and Agenda manual-write flows now share a mapper that sends literal `YYYY-MM-DD` and `HH:mm` calendar fields. Create/update send the complete top-level field set; occurrence edits and splits send the complete nested `timing` set. The temporary UTC-input request fields and backend compatibility validation are removed from DTOs, OpenAPI, and the generated client. Projected read instants are converted back to form values in the server-authoritative household IANA zone.

Home resolves today/tomorrow at the action boundary from the current clock and household zone. `Meer opties` transfers only title, chosen date, and all-day intent through a versioned session draft into the existing bounded Agenda editor. Settings exposes `Kalendercontrole` in its existing action rail; its bounded dialog retains correction input across errors and requires server preview plus explicit per-event confirmation.

The approved viewport contract is recorded in `docs/reports/2026-08-07-calendar-fields-frontend/viewport-analysis.md`. Home, Agenda, Settings, Home quick-add, the Agenda editor, and Kalendercontrole pass zero-document-scroll checks at 1440x900 and 1366x768. The former TIME-01 Playwright expected failure is a normal passing regression.

Validation: backend 598/598; frontend 332/332 with the documented 20-second budget; backend/frontend builds; 256 focused calendar backend tests; six Playwright smoke scenarios; and two identical pinned NSwag 14.7.1 generations.

## Slice 3.4 implementation boundary

Settings now exposes household time-zone management through one compact action in the existing rail and a bounded, internally scrolling dialog. The server supplies the current zone and searchable IANA identifiers. Preview counts manual timed/all-day events and enabled/disabled imported sources, explains preservation semantics, and requires explicit confirmation.

An update force-loads every enabled iCal source without conditional-cache headers and normalizes the prepared snapshots in the proposed zone. Any source failure returns source-specific feedback without changing the household or events. A successful preflight enters one transaction that changes the household zone, synchronizes all prepared imported snapshots, and marks disabled imports as stale. Stale sources remain hidden and cannot be enabled until a successful refresh under the current zone. Stored manual calendar fields are never changed; their UTC projections are computed in the new zone at read time.

The approved viewport contract is recorded in `docs/reports/2026-08-07-household-time-zone/viewport-analysis.md`. Validation passes 606 backend tests, 334 frontend tests, the client build, six required PostgreSQL migration/atomicity tests with PostgreSQL required, six Playwright scenarios including both Settings viewport sizes, EF model-drift and idempotent-script checks, and two identical pinned NSwag 14.7.1 generations.
