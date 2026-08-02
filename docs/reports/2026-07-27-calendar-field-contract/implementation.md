# Calendar-field contract

**Remediation slice:** 3.1  
**Audit:** TIME-01  
**Status:** Completed

## Decision

Manual HomeOps calendar writes express the household's intended calendar fields. They do not send a JavaScript instant for the API to reinterpret.

The household `TimeZoneId` is authoritative and is not supplied by normal create, update, occurrence-modify, or split requests. The server validates and stores the submitted fields as `DateOnly` and optional `TimeOnly`; it resolves an instant only when an occurrence must be displayed, queried, or interoperated with.

```text
startDate: YYYY-MM-DD
startTime: HH:mm | null
endDate: YYYY-MM-DD
endTime: HH:mm | null
isAllDay: boolean
```

`startUtc` and `endUtc` are removed from manual write requests in Slice 3.2. The replacement fields are the wire representation of `DateOnly` and `TimeOnly`, not locale-formatted strings. Clients must retain date-input values as `YYYY-MM-DD` and time-input values as `HH:mm`; they must not create a `Date`, call `toISOString()`, or send an offset for these values.

## Invariants

| Event kind | Required fields and semantics |
| --- | --- |
| All-day | `isAllDay` is `true`; both times are `null`; `startDate` and `endDate` are required; the date range is inclusive and `endDate >= startDate`. |
| Timed | `isAllDay` is `false`; all four calendar fields are required; the local end must be on or after the local start in the household zone. Same-day zero-duration events remain valid, matching the current API rule. |
| Timed multi-day | `endDate` may be after `startDate`; time-of-day is preserved exactly on both dates. |
| All-day multi-day | `endDate` may be after `startDate`; the stored dates identify every all-day calendar date, inclusively. No synthetic midnight or UTC conversion is stored. |
| Recurring series | The series anchor is the submitted start date/time. Recurrence generates dates from that local anchor and preserves its wall-clock time; it must not advance by fixed UTC durations across DST. |
| One-occurrence exception | The occurrence key continues to identify the original local series occurrence. A timing replacement supplies a complete calendar-field set and is validated by the same rules; a non-timing edit leaves its calendar fields absent. |
| This-and-future split | The split key is a local occurrence key. If replacement timing is supplied it is a complete calendar-field set; otherwise the new series inherits the split occurrence's local date/time and duration. |
| Imported event | Imported source data is read-only and does not use a manual write request. Import metadata and source identity remain separate from household calendar intent. |

For partial occurrence-modify and split requests, `startDate`, `startTime`, `endDate`, `endTime`, and `isAllDay` form one atomic replacement group: either none are supplied, or all are supplied. An `endDate`/`endTime` without the matching start fields is invalid. This prevents a timing edit from accidentally combining old UTC-derived fields with new local fields.

## Local-time resolution

The server combines a timed event's `DateOnly` and `TimeOnly` into a `DateTimeKind.Unspecified` local wall-clock value and validates it with the household IANA time zone.

- A nonexistent local time is rejected; it is never shifted forward or backward. For example, a request for `2026-03-29 02:30` in `Europe/Amsterdam` returns a validation error on `startTime` (or `endTime`): `02:30 does not occur in Europe/Amsterdam on 2026-03-29 because clocks move forward.`
- An ambiguous fall-back time is accepted deterministically. HomeOps selects the earlier UTC instant, using the larger of the zone's two UTC offsets (the first occurrence of the local clock time). The same policy applies to start and end, recurrence projection, exceptions, splits, and display/read-model projection.
- The API does not add an offset or a per-event time-zone field to a manual request. If an explicit user choice between the two fall-back occurrences becomes a product need, it requires a future contract revision rather than silently changing this policy.

The validation implementation and regression tests belong to Slice 3.2; the frontend request mapper belongs to Slice 3.3.

## Imported instants are a separate boundary

Provider timestamps retain their provider meaning while parsing and synchronization distinguish their source form:

- UTC instants are converted once to the household zone, then persisted as the resulting local `DateOnly`/`TimeOnly` fields for HomeOps occurrence generation.
- Provider-local timestamps with `TZID` are interpreted in that provider zone before conversion to the household zone.
- Floating provider timestamps remain provider-local calendar fields; they are not treated as UTC. The importer documents the chosen source semantics and normalizes them explicitly.
- Provider all-day values remain date-only. They are never converted through UTC midnight.

Imported data must not pass through the manual-request resolver, and manual data must not pass through provider-instant normalization. `ImportedAtUtc`, synchronization timestamps, and provider revision metadata remain operational instants and are unrelated to event calendar intent.

## Read contract and migration boundary

Existing read DTOs may continue to expose normalized occurrence instants for display and interoperability. They are projections from stored local fields in the household zone, not the source of truth for a subsequent manual edit. Slice 3.2 changes only manual write contracts and preserves the existing data-repair rule: it does not automatically shift historical manual events because original intent may be unknowable.

## Required regression matrix before endpoint changes

Slice 3.2 must first add failing focused tests for the new request mapper/validator and endpoint behavior, then implement the endpoint change. At minimum, cover:

1. Manual all-day and timed create/update round trips in `Europe/Amsterdam` in January and July without a date or clock-time shift.
2. Timed and all-day multi-day ranges, including inclusive all-day end dates.
3. Spring-forward rejection for both start and end times, with the field-specific clear message.
4. Fall-back ambiguity resolving to the first (earlier-UTC, larger-offset) occurrence consistently for series, one-occurrence modification, and split.
5. Recurrence across both DST boundaries preserving the intended local clock time and occurrence key.
6. Imported UTC, `TZID`, floating, and all-day inputs each taking the explicit import path rather than the manual request path.
7. Rejection of incomplete or mixed all-day/timed calendar-field groups, and rejection of `end < start`.

The current `EventOccurrenceProjector` and manual event endpoint tests demonstrate the UTC-extraction behavior that Slice 3.2 replaces; no endpoint or test behavior is changed by this design-only slice.

## Validation status

On 2026-08-02, `dotnet build HomeOps.sln --no-restore` passed with the existing `SQLitePCLRaw.lib.e_sqlite3` `NU1903` advisory warning; `dotnet test HomeOps.sln --no-build` passed 588/588; `pnpm --dir src/HomeOps.Client test` passed 325/325; and `pnpm --dir src/HomeOps.Client build` passed.

The child-sandbox attempt could not resolve pnpm's profile (`EPERM: operation not permitted, realpath 'C:\Users\lesle'`), so the parent orchestrator performed the required repair. Its `pnpm dlx nswag@14.7.1 run nswag.json` command ran twice successfully; the second run left `src/HomeOps.Contracts/openapi.json` and `src/HomeOps.Client/src/api/homeOpsApiClient.ts` unchanged. This is a design-only slice, so no generated contract drift was expected or introduced.
