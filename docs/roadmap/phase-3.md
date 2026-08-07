# Phase 3 — Calendar and local-time correctness

Phase 3 makes household-local calendar intent authoritative across manual writes, recurrence, imports, settings, and device-specific agenda preferences.

| Slice | Status | Outcome |
| --- | --- | --- |
| 3.1 Calendar-field contract | Completed | Approved manual calendar fields, import boundary, and DST policy. |
| 3.2 Backend writes and recurrence | Completed | Calendar-field API, household-zone projection, import normalization, migration, and explicit repair endpoints. |
| 3.3 Frontend forms and quick actions | Completed | Shared literal calendar-field writes, action-time household dates, draft transfer, and bounded repair UI. |
| 3.4 Household time-zone setting | Completed | Previewed, preflighted, transactional IANA-zone changes with stale-source gating. |
| 3.5 Calendar source lifecycle | Completed | Real iCal upload/replacement, opaque managed storage, preflighted reconnect, archive, refresh-before-restore, and confirmed removal. |
| 3.6 Device settings identity | Completed | Versioned browser identity, last-seen persistence, 180-day cleanup, and confirmed reset. |
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

## Slice 3.5 implementation boundary

Calendar files enter only through multipart `.ics` upload or replacement and are capped at 5 MiB. The server validates UTF-8, iCalendar structure, at least one event, and unique provider UIDs before persistence. Managed files use opaque references and server-computed SHA-256, filename, size, and upload time; public source DTOs never return the reference and the legacy reference request shape is removed from OpenAPI.

Archive disables and hides imported events without deleting configuration or content. Restore refreshes while hidden and exposes the source only after success. Feed reconnect force-loads the proposed HTTPS URL before changing configuration. Explicit permanent removal deletes imported series, provider configuration, source, and managed content. Settings implements these operations through the existing internally scrolling source list and bounded dialogs under `docs/reports/2026-08-07-calendar-source-lifecycle/viewport-analysis.md`.

Validation passes 615 backend tests, 336 frontend tests, focused upload/lifecycle tests, backend/frontend builds, three required PostgreSQL migration tests through Rancher Desktop, all six Playwright scenarios including both Settings viewport sizes, EF model-drift/idempotent-script checks, and twice-identical pinned NSwag 14.7.1 generation.

## Slice 3.6 implementation boundary

Agenda layer visibility now uses a versioned JSON browser identity stored under `homeops.deviceIdentity.v1`. The former `homeops.deviceKey.v1` string migrates in place so existing server preferences keep the same ID. All Agenda settings reads, writes, and reset calls require both device ID and schema-version headers; the identity remains preference correlation only and has no authentication significance.

`DeviceSettingsIdentities` records schema version, creation time, and last-seen time. Existing layer-setting owners are backfilled by migration, child settings cascade with their identity, reads/writes touch last-seen, and a daily service removes identities inactive for more than 180 days. Reset deletes the current server identity and preferences, creates a fresh local identity, and loads normal source defaults.

The approved composition is recorded in `docs/reports/2026-08-07-device-settings-identity/viewport-analysis.md`: Agenda adds only a compact `Dit apparaat` action to the existing source-selector header and keeps explanation, confirmation, pending, success, and failure states inside a bounded dialog. Settings receives no duplicate control or layout change. Validation passes 622 backend tests, 339 frontend tests, both builds, three PostgreSQL migration tests, six Playwright scenarios including both target viewport sizes and the new dialog, EF drift/script checks, and twice-identical pinned NSwag 14.7.1 generation.
