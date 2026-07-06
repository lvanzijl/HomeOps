# Summary

HomeOps Recurrence V2 should treat iCalendar recurrence as an import/export interchange format that maps into the settled HomeOps recurrence domain, not as a second recurrence model and not as an RFC5545 execution engine.

Recommended mapping:

- Supported `RRULE` values become the owned `EventRecurrenceRule` value on `EventSeries`.
- `EXDATE` becomes skipped `EventException` records keyed by the original `OccurrenceKey`.
- Supported detached `RECURRENCE-ID` VEVENTs become modified `EventException` records keyed by the original generated occurrence.
- Imported recurring master VEVENTs become `EventSeries` records with optional owned `EventRecurrenceRule` plus provider recurrence metadata.
- Unsupported recurrence should be imported as provider-preserved, non-generated recurrence metadata rather than rejected, partially generated, or silently downgraded to normal non-recurring events.
- Synchronization should compare provider master identity, provider revision/fingerprint, normalized HomeOps recurrence fields, raw provider recurrence metadata, `EXDATE` keys, and detached occurrence identities.
- Export should produce iCalendar recurrence only for recurrence shapes HomeOps can represent faithfully; unsupported imported recurrence should preserve provider metadata for synchronization but should not be re-exported as a HomeOps-generated approximation.

This report is analysis only. It does not design APIs, UI, migrations, database schema, parser implementation, occurrence-engine implementation, or provider-specific code paths.

# RRULE Mapping

## Mapping principles

HomeOps should map only recurrence rules that can be represented exactly by the frozen Recurrence V2 model:

- `Frequency`: daily, weekly, monthly, yearly.
- `Interval`: positive integer, default `1` when absent.
- `EndMode`: never, after count, or on date.
- `WeeklyDays`: one or more weekdays for weekly recurrence.
- `MonthlyDayOfMonth`: one day-of-month for monthly recurrence.
- `YearlyMonth` and `YearlyDayOfMonth`: one month/day pair for yearly recurrence.

The mapper should reject unsupported rule parts for HomeOps generation rather than approximating them. Exactness matters because recurrence mistakes create family-calendar trust issues and synchronization churn.

## FREQ

Direct mappings:

| iCalendar `FREQ` | HomeOps mapping |
| --- | --- |
| `DAILY` | `EventRecurrenceRule.Frequency = Daily` |
| `WEEKLY` | `EventRecurrenceRule.Frequency = Weekly` |
| `MONTHLY` | `EventRecurrenceRule.Frequency = Monthly` |
| `YEARLY` | `EventRecurrenceRule.Frequency = Yearly` |

Unsupported:

- `SECONDLY`.
- `MINUTELY`.
- `HOURLY`.
- Any unknown or provider-specific frequency.

Unsupported frequencies must not become generated HomeOps recurrence because the occurrence engine intentionally works at date/day cadence for household events.

## INTERVAL

Direct mapping:

- Missing `INTERVAL` maps to `Interval = 1`.
- Positive whole-number `INTERVAL` maps to `EventRecurrenceRule.Interval`.

Unsupported:

- `INTERVAL = 0`.
- Negative values.
- Decimal or malformed values.
- Values above the HomeOps product maximum if a later validation slice defines one.

HomeOps interval semantics match the occurrence-engine decision: interval applies to recurrence periods, not to individual emitted candidates inside a period. For weekly rules with multiple days, `INTERVAL=2` means included weeks every two weeks, with all supported `BYDAY` days inside each included week.

## COUNT

Direct mapping:

- `COUNT=N` maps to `EndMode = AfterCount` and `Count = N`.

Rules:

- `N` must be a positive whole number.
- `COUNT` counts generated candidate occurrences before exceptions.
- Invalid monthly/yearly dates that do not produce candidates do not count.
- Skipped and modified exceptions still count because the original candidates exist.

Unsupported:

- `COUNT=0`.
- Negative, decimal, missing, or malformed count values.
- `COUNT` together with `UNTIL`.

## UNTIL

Direct mapping:

- `UNTIL` maps to `EndMode = OnDate` and `UntilDate` when it can be interpreted as a household-local inclusive original-start date boundary.

Recommended normalization:

- Date-only `UNTIL` maps directly to the household-local date.
- Date-time `UNTIL` should map only if it can be converted to a household-local date boundary without changing HomeOps date-based semantics. The stored HomeOps value remains date-only.
- The boundary is inclusive: a candidate whose original local start date is on `UntilDate` is eligible.

Unsupported:

- Malformed `UNTIL`.
- `UNTIL` together with `COUNT`.
- `UNTIL` values that cannot be safely interpreted in the household timezone.
- Time-of-day-sensitive end semantics that would include or exclude candidates within the same local date differently than HomeOps can represent.

HomeOps should preserve the raw provider RRULE even when `UNTIL` normalizes successfully, so synchronization can compare provider intent without relying only on the date-only HomeOps value.

## BYDAY

Direct mapping for weekly recurrence:

- `FREQ=WEEKLY` with `BYDAY=MO`, `TU`, `WE`, `TH`, `FR`, `SA`, and/or `SU` maps to `WeeklyDays`.
- Missing `BYDAY` on a weekly rule maps to the weekday of the series start.
- Multiple weekdays are supported.

Unsupported:

- Ordinal `BYDAY`, such as `1MO`, `-1FR`, or `2TU`.
- `BYDAY` on `DAILY`, `MONTHLY`, or `YEARLY` rules.
- `BYDAY` combined with `BYSETPOS`.
- Empty or malformed weekday lists.

Reason: HomeOps V2 supports weekly day selection but does not support nth weekday monthly/yearly patterns, weekdays-only daily filters, or positional recurrence.

## BYMONTHDAY

Direct mapping for monthly recurrence:

- `FREQ=MONTHLY` with exactly one positive `BYMONTHDAY` value from `1` through `31` maps to `MonthlyDayOfMonth`.
- Missing `BYMONTHDAY` on a monthly rule maps to the day-of-month of the series start.

Unsupported:

- Multiple `BYMONTHDAY` values.
- Negative `BYMONTHDAY` values such as `-1`.
- `BYMONTHDAY=0` or values above `31`.
- `BYMONTHDAY` on `DAILY`, `WEEKLY`, or `YEARLY` rules.
- `BYMONTHDAY` combined with `BYDAY` or `BYSETPOS`.

HomeOps monthly invalid-date policy remains unchanged: months without the requested day are skipped, not clamped.

## BYMONTH

Direct mapping for yearly recurrence:

- `FREQ=YEARLY` with exactly one `BYMONTH` value from `1` through `12` plus exactly one positive `BYMONTHDAY` value from `1` through `31` maps to `YearlyMonth` and `YearlyDayOfMonth`, when the month/day exists in at least one year.
- Missing `BYMONTH` and `BYMONTHDAY` on a yearly rule maps to the series start month/day.

Unsupported:

- Multiple `BYMONTH` values.
- `BYMONTH` outside `1..12`.
- `BYMONTH` without a representable yearly day-of-month when the intended pattern cannot be inferred from the series start.
- `BYMONTH` on `DAILY`, `WEEKLY`, or `MONTHLY` rules.
- `BYMONTH` combined with ordinal `BYDAY`, `BYSETPOS`, `BYYEARDAY`, or `BYWEEKNO`.

February 29 is supported because HomeOps yearly invalid dates are skipped in non-leap years.

## Directly supported combinations

Supported combinations are intentionally small:

1. `FREQ=DAILY` with optional `INTERVAL` and optional one end condition (`COUNT` or `UNTIL`).
2. `FREQ=WEEKLY` with optional `INTERVAL`, optional plain weekday `BYDAY`, and optional one end condition.
3. `FREQ=MONTHLY` with optional `INTERVAL`, optional single positive `BYMONTHDAY`, and optional one end condition.
4. `FREQ=YEARLY` with optional `INTERVAL`, optional single `BYMONTH` plus single positive `BYMONTHDAY`, and optional one end condition.

All supported combinations also require that no unsupported RRULE parts are present.

## Unsupported RRULE parts and combinations

Unsupported in Recurrence V2:

- `SECONDLY`, `MINUTELY`, `HOURLY`.
- `BYSECOND`, `BYMINUTE`, `BYHOUR`.
- `BYYEARDAY`.
- `BYWEEKNO`.
- `BYSETPOS`.
- `WKST` as a behavior-changing input. HomeOps weekly interval anchoring remains internal and deterministic.
- `RDATE` additional recurrence dates.
- Multiple RRULEs for one event.
- Multiple `BYMONTHDAY` values.
- Multiple `BYMONTH` values.
- Ordinal or negative `BYDAY`.
- Negative `BYMONTHDAY`.
- Business-day, holiday-aware, or provider-specific recurrence extensions.
- Any combination that depends on set expansion/filtering beyond the supported direct mappings.

# EXDATE Mapping

## Recommendation

`EXDATE` should become skipped `EventException` records.

Mapping:

- Each provider `EXDATE` value identifies an original generated occurrence.
- The original occurrence identity maps to `OccurrenceKey`.
- HomeOps creates or updates an `EventException` with `ExceptionType = Skipped` for that key.
- The parent series and recurrence rule remain unchanged.

This matches the settled occurrence-engine model: exceptions are overlays after candidate generation, and skipped candidates still count for `COUNT` semantics.

## Why not recurrence exclusions

A separate recurrence-exclusion collection is not recommended for V2 because it would duplicate skipped exceptions and force the occurrence engine to process two exclusion concepts. Families also think of these as “this appointment is skipped,” not as rule-level exclusions.

## Identity and timezone handling

For each `EXDATE`, HomeOps should preserve the raw provider value as metadata while matching by the normalized original household-local start in `OccurrenceKey`.

- Timed `EXDATE` maps to the original local date/time for the candidate.
- Date-only `EXDATE` for all-day events maps to local midnight with `IsAllDay = true`.
- If an `EXDATE` cannot be matched to a supported generated candidate, preserve it as provider metadata and mark the recurrence as not fully HomeOps-generated rather than inventing an exception against a non-existent candidate.

# RECURRENCE-ID Mapping

## Recommendation

Detached `RECURRENCE-ID` VEVENTs should become modified `EventException` records when they refer to a candidate generated by the supported HomeOps recurrence rule.

Mapping:

- The recurring master VEVENT maps to `EventSeries` plus optional owned `EventRecurrenceRule`.
- A detached VEVENT with `RECURRENCE-ID` maps to `EventException.ExceptionType = Modified`.
- The `RECURRENCE-ID` value identifies the original occurrence and maps to `OccurrenceKey`.
- Replacement fields come from the detached VEVENT.

## Occurrence identity

HomeOps occurrence identity remains the original generated occurrence:

```text
(EventSeries.Id, OccurrenceKey)
```

`OccurrenceKey` should contain:

- `OriginalLocalStart` normalized from `RECURRENCE-ID`.
- `IsAllDay` discriminator.
- optional raw provider recurrence id metadata for synchronization matching.

The key must not change when the detached occurrence moves to a different date/time. A moved occurrence still belongs to the original recurrence instance.

## Replacement fields

Detached instances should populate replacement fields only for data that differs or is authoritative on the detached VEVENT:

- title/summary;
- description;
- location;
- all-day flag when supported by the domain;
- replacement start date/time;
- replacement end date/time or duration-derived end;
- provider status/cancel state if later domain slices support it.

If a detached VEVENT represents cancellation rather than modification, it should map to a skipped `EventException` rather than a modified exception.

## Provider metadata

`EventException` should preserve detached-instance provider metadata needed for future synchronization:

- raw `RECURRENCE-ID` value;
- normalized provider recurrence id string;
- detached provider event id if the provider exposes one;
- detached provider revision/sequence/etag when available;
- detached content fingerprint;
- raw detached VEVENT recurrence-related metadata needed to compare future snapshots.

Provider detached metadata belongs on `EventException`, not on `EventSeries` or `EventRecurrenceRule`, because it identifies one occurrence-level divergence.

# Imported Series Mapping

## Master VEVENT to EventSeries

An imported recurring master VEVENT maps to one HomeOps `EventSeries`.

`EventSeries` owns:

- household/source ownership;
- title/summary;
- description;
- location;
- all-day flag;
- base start/end local timing;
- provider master event id;
- provider master revision/etag/sequence;
- provider content fingerprint;
- provider source identity.

## RRULE to EventRecurrenceRule

If the RRULE is supported exactly, it maps to the owned `EventRecurrenceRule` value:

- `Frequency` from `FREQ`.
- `Interval` from `INTERVAL` or default `1`.
- `EndMode`, `Count`, and `UntilDate` from `COUNT`/`UNTIL`.
- `WeeklyDays` from supported weekly `BYDAY`.
- `MonthlyDayOfMonth` from supported monthly `BYMONTHDAY` or start day.
- `YearlyMonth` and `YearlyDayOfMonth` from supported yearly `BYMONTH`/`BYMONTHDAY` or start date.
- `RawProviderRecurrenceRule` preserving the raw RRULE text.

If there is no RRULE, the imported event has no recurrence rule and is non-recurring.

## EXDATE and RECURRENCE-ID to EventException

Provider exceptions map under the imported series:

- `EXDATE` values become skipped `EventException` records.
- Detached modified instances become modified `EventException` records.
- Detached cancellation instances become skipped `EventException` records.

Exceptions should be keyed by original `OccurrenceKey`, not by replacement time or provider display order.

# Synchronization Mapping

## What synchronization compares

For recurring imported events, synchronization should compare at three levels.

Master series level:

- provider source id;
- provider master event id;
- provider revision/etag/sequence when available;
- content fingerprint of master non-recurrence fields;
- start/end/all-day fields;
- raw provider recurrence metadata presence.

Recurrence rule level:

- raw RRULE text or canonical provider recurrence string;
- normalized HomeOps recurrence fields;
- unsupported-recurrence classification;
- normalized `EXDATE` collection identity/fingerprint if the provider supplies exclusions as part of the master object.

Exception level:

- `OccurrenceKey`;
- raw `RECURRENCE-ID` or normalized provider recurrence id;
- detached provider event id if available;
- detached revision/etag/sequence;
- detached content fingerprint;
- exception type (`Skipped` or `Modified`);
- replacement fields.

## What updates

Synchronization updates an existing imported `EventSeries` when the provider master identity matches and the provider data changes:

- master template fields update on `EventSeries`;
- supported recurrence changes replace the owned `EventRecurrenceRule` value;
- raw provider recurrence metadata updates on the recurrence rule or provider metadata sidecar;
- `EXDATE` differences update skipped exceptions;
- detached instance differences update matching modified or skipped exceptions;
- missing provider detached instances are removed or marked inactive according to later persistence policy, but they must no longer affect generated occurrences.

## What creates

Synchronization creates:

- a new imported `EventSeries` when a provider master event id has not been seen for that source;
- a new owned `EventRecurrenceRule` when the provider master has a supported RRULE;
- skipped `EventException` records for new `EXDATE` entries;
- modified `EventException` records for new detached instances that match supported generated candidates.

## What deletes

Synchronization deletes or deactivates imported recurrence data only when the provider source no longer contains it:

- provider master removed: remove the imported `EventSeries`, its owned recurrence rule, and its imported exceptions.
- provider RRULE removed: remove the owned recurrence rule and imported recurrence metadata, making the imported event non-recurring only if the provider itself now says it is non-recurring.
- provider `EXDATE` removed: remove the corresponding provider-owned skipped exception unless it has been intentionally converted to a local manual exception by a later feature.
- provider detached instance removed: remove the corresponding provider-owned modified/skipped exception.

Manual exceptions on manual series are not part of imported synchronization. Local edits to imported events remain outside this mapping unless a future provider-writeback feature explicitly defines them.

# Unsupported Recurrence Policy

## Alternatives compared

### Reject import

Benefits:

- Avoids displaying wrong recurrence.
- Simple conceptual boundary.

Costs:

- Hides potentially important family events.
- One unsupported recurring event could make a calendar feed look broken.
- Poor provider compatibility.

Assessment: not recommended.

### Import as non-recurring

Benefits:

- Simple.
- Keeps at least the master event visible.

Costs:

- Misrepresents the provider event.
- Can show only the first occurrence of an ongoing routine.
- Looks like data loss and may cause duplicate manual recreation.

Assessment: not recommended as the default policy.

### Import partial recurrence with warnings

Benefits:

- Shows some generated events.
- May appear useful for simple approximations.

Costs:

- Dangerous because partial recurrence is silently wrong in family planning.
- Breaks synchronization fidelity.
- Can create phantom or missing appointments.

Assessment: strongly not recommended.

### Preserve metadata without HomeOps generation

Benefits:

- Does not lie by approximating unsupported recurrence.
- Preserves provider data for future synchronization and later feature support.
- Allows the product to surface a safe “unsupported recurring event” representation if a later UI chooses to.
- Keeps provider fidelity without creating provider-specific occurrence generation branches.

Costs:

- Unsupported recurring occurrences are not generated by HomeOps V2.
- Users may not see every occurrence until support expands or provider-expanded instances are introduced by a future integration strategy.

Assessment: recommended.

## Recommended policy

Unsupported recurrence should be imported as provider-preserved recurrence metadata without HomeOps occurrence generation.

That means:

- Preserve the master `EventSeries` and provider identity.
- Preserve raw recurrence metadata, including raw RRULE and any raw exception identifiers needed for future sync.
- Do not create a HomeOps `EventRecurrenceRule` for unsupported recurrence.
- Do not approximate unsupported recurrence as `Daily`, `Weekly`, `Monthly`, `Yearly`, or non-recurring.
- Do not create partial generated occurrences.
- Produce a warning/diagnostic classification for observability.

If the product must show something for unsupported imported recurrence in V2, it should show only a safe provider-backed placeholder or the master event with an explicit unsupported status, not a generated recurrence approximation. The exact UI is outside this report.

# Provider Metadata

## Placement rules

Provider metadata should live at the domain level that owns the concept.

### EventSeries

Store provider master metadata on `EventSeries`:

- provider source id;
- provider master event id / UID;
- provider calendar id if needed by the source;
- provider revision / etag / sequence;
- master content fingerprint;
- import status/classification for supported versus unsupported recurrence;
- last seen sync timestamp.

### EventRecurrenceRule

Store provider recurrence-shape metadata on the owned recurrence rule or equivalent recurrence metadata component:

- raw RRULE;
- canonicalized RRULE if the importer creates one;
- raw recurrence-related master properties needed to compare provider changes;
- unsupported recurrence reason when the RRULE does not map to HomeOps generation;
- raw `EXDATE` collection fingerprint when exclusions are represented on the master object.

A separate `ProviderRecurrenceFingerprint` is not required as a core domain concept if raw recurrence text and normalized fields are compared directly. If a later persistence implementation uses a hash for efficient synchronization, it should be treated as technical sync metadata, not as a separate business object.

### EventException

Store provider occurrence-level metadata on `EventException`:

- raw `RECURRENCE-ID`;
- normalized provider recurrence id;
- detached provider event id if any;
- detached provider revision / etag / sequence;
- detached content fingerprint;
- raw detached recurrence metadata;
- source ownership marker showing whether the exception came from provider sync or local manual editing.

# Export Restore Mapping

## Manual recurrence export

Manual HomeOps recurrence should export to iCalendar only when it maps directly:

- `Frequency` exports as `FREQ`.
- `Interval` exports as `INTERVAL` when not `1`; exporting `INTERVAL=1` is optional.
- `EndMode = AfterCount` exports as `COUNT`.
- `EndMode = OnDate` exports as `UNTIL` using the HomeOps date boundary represented safely for iCalendar consumers.
- Weekly days export as `BYDAY`.
- Monthly day-of-month exports as `BYMONTHDAY`.
- Yearly month/day exports as `BYMONTH` plus `BYMONTHDAY`.

Skipped manual exceptions export as `EXDATE`. Modified manual exceptions export as detached VEVENTs with `RECURRENCE-ID` and replacement fields.

## Imported recurrence export

Imported recurrence has two different export purposes:

1. Portability backup/restore inside HomeOps.
2. iCalendar interchange outside HomeOps.

For HomeOps backup/restore, preserve normalized supported recurrence plus provider metadata needed to refresh from the source. Unsupported imported recurrence should preserve raw metadata but should not be restored as a manually generated HomeOps recurrence.

For iCalendar interchange, export supported imported recurrence using the same mapping as manual recurrence only if HomeOps is responsible for emitting the data. If the source provider remains authoritative, prefer preserving provider identity and refreshing from the provider rather than exporting stale provider-owned copies.

## Exceptions export

- Skipped exceptions export as `EXDATE` when they represent skipped generated candidates.
- Modified exceptions export as detached VEVENTs with `RECURRENCE-ID` equal to the original `OccurrenceKey`.
- Moved occurrences export with `RECURRENCE-ID` pointing to the original time and `DTSTART`/`DTEND` carrying the replacement time.
- Exception provider metadata should round-trip through HomeOps restore where possible, but should not leak into user-facing recurrence semantics.

## Restore

Restore should rebuild the HomeOps aggregate shape:

- `EventSeries` for each series template.
- Owned `EventRecurrenceRule` for supported recurrence.
- `EventException` records for skipped and modified occurrences.
- Provider metadata at the correct level.

Restore must not turn unsupported raw provider recurrence into approximate HomeOps generation. It should preserve unsupported metadata and diagnostics so future synchronization or future recurrence support can handle it accurately.

# Future Provider Compatibility

## Google Calendar

Google Calendar exposes recurring masters, recurrence rule strings, exclusions/cancelled instances, and overridden instances. The recommended mapping supports this without Google-specific recurrence logic:

- master event maps to `EventSeries`;
- supported recurrence strings map to `EventRecurrenceRule`;
- cancelled instances map to skipped `EventException` records;
- overridden instances map to modified `EventException` records;
- provider event ids, recurring event ids, original start times, etags, and sequence values remain provider metadata.

## CalDAV

CalDAV commonly carries iCalendar VEVENT data directly, including RRULE, EXDATE, and RECURRENCE-ID. The recommended mapping is naturally aligned:

- VEVENT master maps to `EventSeries`;
- supported RRULE maps to `EventRecurrenceRule`;
- EXDATE maps to skipped exceptions;
- RECURRENCE-ID VEVENTs map to modified or skipped exceptions;
- raw iCalendar values are preserved for sync fidelity.

## Exchange

Exchange may expose recurrence through provider-specific structured recurrence in addition to iCalendar-like concepts. The mapping still holds if the importer normalizes provider recurrence into the same conceptual inputs:

- master event identity and revision map to `EventSeries` metadata;
- supported daily/weekly/monthly/yearly rule shapes map to `EventRecurrenceRule`;
- deleted occurrences map to skipped exceptions;
- changed occurrences map to modified exceptions;
- provider-specific recurrence blobs remain metadata and do not create provider-specific generation branches.

# Frozen Mapping Decisions

1. iCalendar is an interchange input/output, not HomeOps' recurrence source of truth.
2. Supported RRULEs map to the owned `EventRecurrenceRule` value on `EventSeries`.
3. Unsupported RRULEs do not create HomeOps-generated recurrence.
4. `FREQ=DAILY|WEEKLY|MONTHLY|YEARLY` are the only supported frequencies.
5. `INTERVAL` maps to `Interval`; missing interval defaults to `1`.
6. `COUNT` maps to `EndMode = AfterCount`; `UNTIL` maps to `EndMode = OnDate`; both together are unsupported.
7. Weekly plain `BYDAY` maps to `WeeklyDays` only for `FREQ=WEEKLY`.
8. Monthly single positive `BYMONTHDAY` maps to `MonthlyDayOfMonth` only for `FREQ=MONTHLY`.
9. Yearly single `BYMONTH` plus single positive `BYMONTHDAY` maps to `YearlyMonth` and `YearlyDayOfMonth` only for `FREQ=YEARLY`.
10. Ordinal weekdays, `BYSETPOS`, multiple month days, multiple months, yearly week/year-day rules, and sub-day recurrence are unsupported.
11. `EXDATE` maps to skipped `EventException` records.
12. Detached `RECURRENCE-ID` VEVENTs map to modified `EventException` records when they refer to supported generated candidates.
13. Detached cancellations map to skipped `EventException` records.
14. `OccurrenceKey` remains the identity of the original generated occurrence, not the replacement time.
15. Raw provider RRULE and recurrence identifiers must be preserved for synchronization fidelity.
16. Provider master metadata belongs on `EventSeries`; provider recurrence-shape metadata belongs with the recurrence rule/recurrence metadata; provider detached-instance metadata belongs on `EventException`.
17. Synchronization compares master, recurrence, and exception levels separately.
18. Export emits only recurrence that HomeOps can represent faithfully; unsupported recurrence is preserved for sync/restore, not exported as an approximation.
19. Google Calendar, CalDAV, and Exchange should normalize into the same mapping without provider-specific occurrence generation logic.

# Trade-offs

## Normalized HomeOps recurrence versus raw RRULE source of truth

Recommendation: normalized HomeOps recurrence is the source of truth for supported generation, with raw RRULE preserved as provider metadata.

This keeps the occurrence engine simple and family-focused. The trade-off is that HomeOps cannot represent every iCalendar recurrence shape. That is acceptable for V2 because unsupported recurrence must not be approximated.

## EXDATE as skipped exceptions versus rule exclusions

Recommendation: map `EXDATE` to skipped `EventException` records.

This unifies manual skips and imported exclusions and keeps count/until semantics consistent. The trade-off is that large EXDATE collections create many exception records. That is still preferable to introducing a second exclusion model.

## Detached instances as modified exceptions versus separate occurrence entities

Recommendation: map detached instances to modified exceptions.

This matches the settled no-stored-occurrences model. The trade-off is that detached instances whose original recurrence cannot be generated by a supported rule cannot be fully represented as normal HomeOps occurrences. Those should remain provider-preserved unsupported metadata.

## Reject unsupported recurrence versus preserve unsupported metadata

Recommendation: preserve unsupported metadata without HomeOps generation.

This avoids data loss and avoids false generated events. The trade-off is reduced visibility for unsupported recurring imported events until support expands or a future provider-expanded-instance strategy is chosen.

## Provider-neutral mapping versus provider-specific generation

Recommendation: provider-neutral mapping.

Provider-specific recurrence generation would improve fidelity for some calendars but would violate the settled occurrence-engine direction and make behavior inconsistent across sources. Provider-specific parsing can normalize inputs, but generation should remain HomeOps-domain based.

# Risks

- **Unsupported recurrence visibility risk:** Preserving unsupported recurrence without generation may hide future instances from the HomeOps agenda. Mitigation: surface diagnostics or provider-backed placeholders in a later UI slice without approximating recurrence.
- **Timezone fidelity risk:** iCalendar recurrence may use per-event timezones, while HomeOps V2 generation is household-local. Mitigation: preserve raw provider values and classify unsafe mappings as unsupported rather than silently changing semantics.
- **Large exception set risk:** Provider calendars can contain many `EXDATE` or detached instances. Mitigation: keep exception processing indexed by `(EventSeriesId, OccurrenceKey)` in later persistence design.
- **Synchronization churn risk:** Raw RRULE ordering or formatting may differ even when semantics are equivalent. Mitigation: compare normalized fields for supported recurrence and preserve raw text for traceability; canonicalization can be technical sync metadata later.
- **Detached mismatch risk:** A detached `RECURRENCE-ID` may not match a candidate when the RRULE is unsupported or timezone conversion is ambiguous. Mitigation: preserve detached metadata and do not invent a HomeOps exception for a non-generated candidate.
- **Export overclaim risk:** Exporting unsupported imported recurrence as generated HomeOps recurrence would create false fidelity. Mitigation: export only faithful mappings and keep unsupported recurrence as provider metadata for restore/sync.
- **Provider-writeback ambiguity:** This report covers import/export/restore mapping, not editing provider-owned recurring events back to providers. Mitigation: defer writeback rules to a future provider synchronization design.

# Files Referenced

- `.github/copilot-instructions.md`
- `AGENTS.md`
- `docs/reports/2026-07-05-calendar-recurrence-v2-baseline/calendar-recurrence-v2-baseline.md`
- `docs/reports/2026-07-05-calendar-recurrence-v2-domain-analysis/calendar-recurrence-v2-domain-analysis.md`
- `docs/reports/2026-07-05-calendar-recurrence-v2-domain-refinement/calendar-recurrence-v2-domain-refinement.md`
- `docs/reports/2026-07-06-calendar-recurrence-v2-occurrence-engine-analysis/calendar-recurrence-v2-occurrence-engine-analysis.md`
- `docs/reports/2026-07-06-calendar-recurrence-v2-manual-events-analysis/calendar-recurrence-v2-manual-events-analysis.md`
