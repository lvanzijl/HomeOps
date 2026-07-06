# Summary

Recurrence V2 should use a deterministic, windowed occurrence engine that expands one `EventSeries` aggregate at a time. The engine consumes the series template, its optional owned `EventRecurrenceRule`, and its `EventException` entities. It produces transient calendar occurrences; it does not persist generated occurrences and does not introduce provider-specific generation branches.

The recommended engine is:

1. Normalize the input aggregate into a generation context: template timing, duration, household timezone, recurrence rule, requested date window, and exceptions keyed by `OccurrenceKey`.
2. Generate candidate occurrence keys in original scheduled order using HomeOps recurrence semantics.
3. Stop generation by the earliest applicable stopping condition: rule end date, rule count, requested window plus moved-occurrence safety horizon, or non-recurring single occurrence.
4. Apply exceptions after candidate generation by matching each exception to the candidate's original `OccurrenceKey`.
5. Emit final occurrences for visible unmodified candidates, modified candidates, and moved detached instances whose replacement occurrence intersects the requested window.

Frozen recommendation: `COUNT` counts generated candidate occurrences before exceptions are applied. `UNTIL` is an inclusive household-local original-start date boundary. Weekly multi-day rules are ordered by calendar date, then local start time. Monthly and yearly invalid dates are skipped rather than clamped. February 29 yearly recurrence occurs only in leap years. All recurrence expansion uses local wall-clock semantics in the household timezone, with `RawProviderRecurrenceRule` preserved for synchronization traceability but no separate `ProviderRecurrenceFingerprint`, and without provider-specific generation branches.

# Occurrence Generation Pipeline

The occurrence engine should follow this pipeline:

```text
EventSeries aggregate
  ↓
Generation context
  ↓
Recurrence rule cursor
  ↓
Candidate original occurrences
  ↓
Exception overlay by OccurrenceKey
  ↓
Window filtering by final occurrence interval
  ↓
Final calendar occurrences
```

## 1. Aggregate input

Input is one fully loaded aggregate:

- `EventSeries`: the event template and aggregate root.
- Optional owned `EventRecurrenceRule`: recurrence shape.
- `EventException` collection: skipped or modified occurrence-level records.

A series with no recurrence rule is non-recurring. It yields at most one candidate occurrence at the series original start.

## 2. Generation context

The engine should derive a context before iteration:

- base original start date and start time;
- base end date and end time;
- event duration as a local wall-clock interval, not as a fixed UTC duration;
- all-day versus timed discriminator;
- household timezone id;
- inclusive requested date window;
- recurrence frequency, interval, end mode, count, until date, and frequency-specific fields;
- exceptions indexed by original `OccurrenceKey`, defined as `OriginalLocalStart` plus `IsAllDay` with optional `ProviderRecurrenceId` metadata for imported detached matching.

The context step validates rule consistency for generation. Invalid persisted rules should fail deterministically and visibly rather than silently producing partial calendars. Later API or migration slices may decide how invalid data is prevented; this report only defines occurrence generation.

## 3. Candidate occurrences

A candidate occurrence is the original generated occurrence before exceptions. It contains:

- original `OccurrenceKey`;
- original local start value represented by `OccurrenceKey.OriginalLocalStart`;
- original local end date/time derived from the series duration;
- ordinal candidate number within the recurrence stream;
- recurrence period metadata needed only inside the engine.

Candidate generation must be deterministic. Given the same series, rule, timezone, exceptions, and window, it must emit the same final occurrences in the same order.

## 4. Exceptions

Exceptions are not used to decide whether a candidate exists. They are an overlay on candidates:

- a skipped exception suppresses the matching candidate;
- a modified exception replaces selected display/content/timing fields for the matching candidate;
- a moved occurrence remains keyed by the original candidate but may be emitted in a different requested window because its replacement time moved;
- an imported detached instance is represented as a modified exception when it refers to a supported generated candidate.

## 5. Final occurrences

A final occurrence is a transient read model. It should include:

- stable occurrence id;
- parent series id;
- original `OccurrenceKey`;
- final display/content fields;
- final start/end instants converted from local wall-clock values using household timezone rules;
- all-day flag;
- source/provider metadata already carried by the series or exception as needed by projection.

Final window filtering should be based on the final occurrence interval. This is essential for moved occurrences: a candidate originally outside the query window may need to appear if its modified replacement time intersects the query window.

# Generation Algorithm

## Recommended order

Generation should happen in original occurrence order:

1. Determine the first recurrence period that can affect the requested window.
2. Iterate periods in ascending local date order.
3. Within each period, emit candidates in ascending local original start order.
4. Apply end-mode checks while counting candidates.
5. Apply exceptions to matched candidates.
6. Filter final occurrences by final interval intersection with the requested window.
7. Sort final emitted occurrences by final start, then title, then stable occurrence id.

The engine should distinguish candidate order from final display order. Candidate order controls recurrence count and deterministic exception matching. Final display order controls calendar presentation after moved occurrences.

## Stopping conditions

The engine should stop candidate generation when any applicable condition proves no more relevant candidates can be produced:

- non-recurring series: after the single candidate;
- `EndMode = AfterCount`: after `Count` valid candidates have been considered;
- `EndMode = OnDate`: after candidate original start date is later than the inclusive `UntilDate`;
- unbounded recurrence: after the cursor passes the requested generation horizon;
- invalid next cursor state: fail rather than infinite-loop.

The generation horizon should normally be the requested window end plus a bounded exception lookback/lookahead strategy. Because moved exceptions can relocate an old candidate into the current window, the engine must evaluate candidate keys for relevant exceptions even if the original candidate date is before the normal cursor start.

## Interval handling

`Interval` is a positive integer. Missing interval defaults to `1`.

- Daily: every `Interval` days from the base start date.
- Weekly: every `Interval` weeks from the base start week, using selected weekdays within included weeks.
- Monthly: every `Interval` months from the base start month, using the configured day-of-month.
- Yearly: every `Interval` years from the base start year, using the configured month/day.

An interval applies to recurrence periods, not to emitted candidates within the same period. For example, every two weeks on Monday and Wednesday emits Monday and Wednesday in included weeks, then skips the next week entirely.

## Count handling

`Count` should count candidate occurrences generated by the recurrence rule before exceptions.

Recommended policy:

- Count includes candidates later skipped by exceptions.
- Count includes candidates later moved by exceptions.
- Count excludes invalid dates that do not produce candidates, such as monthly day 31 in a month with only 30 days.
- Count excludes recurrence periods skipped by interval.

This matches common recurrence expectations and avoids making end dates change when a user skips or edits one occurrence.

## Until handling

`UntilDate` should be an inclusive household-local original-start date boundary.

Recommended policy:

- A candidate whose original start date is on or before `UntilDate` is eligible.
- A candidate whose original start date is after `UntilDate` is not eligible.
- Exceptions do not extend the recurrence rule. A moved occurrence whose original key is on or before `UntilDate` may appear after `UntilDate` if its replacement time was moved later.
- `UntilDate` should be date-only in Recurrence V2 because the frozen domain model is household-local and rule end mode is date-based.

## Date-window optimization

The engine should not generate from the beginning of history for every query.

Recommended strategy:

1. Compute a conservative cursor start at or before the requested window start.
2. For daily/monthly/yearly rules, jump by whole intervals from the series start to the nearest period that could produce a candidate near the window.
3. For weekly rules, jump to the first included interval week near the window, then evaluate selected weekdays in that week.
4. Include a duration lookback so multi-day events that started before the window but overlap the window are still emitted.
5. Include exception-key candidates whose replacement intervals intersect the window, even when their original keys predate the optimized cursor start.
6. Never let optimization change count semantics. If `EndMode = AfterCount`, the engine must know the candidate ordinal for the optimized start, either through arithmetic or bounded pre-counting by period.

The optimization boundary must be conservative: it may inspect a few extra candidates but must not miss visible occurrences.

# Weekly Rules

## One weekday

A weekly rule with one weekday emits one candidate in each included recurrence week on that weekday.

If a weekly rule's weekday set is absent for manually created rules, the default should be the series start weekday. Imported rules should preserve the provider-specified weekday set when supported.

## Multiple weekdays

A weekly rule with multiple weekdays emits one candidate for each selected weekday in each included recurrence week.

Recommended ordering:

1. ascending local calendar date;
2. same local start time from the series template;
3. deterministic occurrence key tie-breaker if ever needed.

For a series starting on Wednesday with weekly days Monday and Wednesday, the first emitted candidate should be the start Wednesday, not the Monday earlier in that same week. Candidates before the series start local date/time are never emitted.

## Interval interaction

Weekly interval applies to weeks anchored by the series start week, using the household's configured week-start convention only for calculation consistency. The recommended anchor is the week containing the series start date, with Monday as the internal calculation start because it aligns with iCalendar weekday naming and avoids locale-dependent behavior.

Example: a rule starts Wednesday, 2026-01-07, repeats every 2 weeks on Monday and Wednesday.

- Included week 0: Wednesday 2026-01-07 only; Monday 2026-01-05 is before the series start and is ignored.
- Skipped week 1: no candidates.
- Included week 2: Monday 2026-01-19 and Wednesday 2026-01-21.

# Monthly Rules

## Day-of-month behavior

Recurrence V2 should support day-of-month monthly recurrence only. A monthly rule emits a candidate on `MonthlyDayOfMonth` in each included month when that date exists and is on or after the series start.

If the monthly day is absent for manually created monthly rules, the default should be the series start day-of-month.

## Months without the requested day

Months that do not contain the requested day should be skipped.

Examples:

- Monthly on the 31st emits in January, March, May, July, August, October, and December.
- It skips February, April, June, September, and November.
- Monthly on the 30th skips February.

Skipped invalid months do not count toward `Count` because no candidate occurrence exists in those months. They do count as recurrence periods for interval calculation because interval is month-based.

## End-of-month policy

Do not introduce an implicit end-of-month clamp in Recurrence V2.

A series that starts on January 31 and repeats monthly should not automatically move to February 28 or February 29. It should skip February unless a later explicit `LastDayOfMonth` pattern is added. This keeps generation deterministic and avoids silently changing the user's selected day.

# Yearly Rules

## Month/day behavior

Yearly recurrence emits on the configured `YearlyMonth` and `YearlyDayOfMonth` in each included year when that date exists and is on or after the series start.

If the yearly month/day is absent for manually created yearly rules, the default should be the series start month/day.

## Leap-year policy

Invalid yearly dates are skipped, not clamped.

This mirrors the monthly invalid-date policy and avoids hidden substitutions. It also keeps candidate identity simple: a February 29 rule generates February 29 occurrence keys only.

## February 29 handling

A yearly February 29 event occurs only in leap years.

Recommended behavior:

- Start on 2024-02-29, yearly interval 1: emits 2024-02-29, 2028-02-29, 2032-02-29, and so on.
- Count counts only emitted leap-year candidates.
- Until includes a leap-year candidate if its original start date is on or before `UntilDate`.
- Non-leap years are skipped periods, not generated February 28 or March 1 substitutes.

# Exception Processing

## Matching point

Exceptions apply after a candidate occurrence has been generated and before final window filtering. The match key is the candidate's original `OccurrenceKey`, not the candidate's displayed date after modification.

## Skipped occurrences

A skipped exception suppresses the matching candidate entirely.

Rules:

- The candidate still counts toward recurrence `Count`.
- The skipped occurrence has no final occurrence in any window.
- A skipped exception for a non-existent candidate should be treated as orphaned data and ignored for projection, while validation or diagnostics may report it later.

## Modified occurrences

A modified exception overlays replacement fields on the matching candidate.

Rules:

- Unspecified replacement fields fall back to the series template.
- Replacement timing may move the occurrence to another date/time.
- Replacement content does not change the recurrence rule or neighboring candidates.
- Modified candidates still count as their original candidate for count and until semantics.

## Moved occurrences

A moved occurrence is a modified exception whose replacement start/end differs from the original candidate.

Rules:

- The occurrence key remains the original scheduled start.
- Window inclusion uses the replacement final interval.
- The original slot is not separately emitted.
- Date-window optimization must include moved exceptions that intersect the query window even when their original candidates are outside the optimized recurrence cursor range.

## Provider detached instances

Provider detached instances should be imported as modified exceptions when they refer to an occurrence generated by the supported HomeOps recurrence rule.

Rules:

- Provider `RECURRENCE-ID` or equivalent maps to `OccurrenceKey`.
- Detached instance content/timing maps to replacement fields.
- Detached cancellation maps to a skipped exception.
- Raw provider detached-instance identifiers remain metadata on `EventException` for synchronization matching.
- The generation algorithm remains the same for manual and imported exceptions.

If a provider detached instance references an occurrence that HomeOps cannot generate because the rule shape is unsupported, that event is outside Recurrence V2 occurrence generation and should not be faked through provider-specific branching.

# Occurrence Identity

## Stable occurrence id

Generated occurrence ids should be deterministic and derived from:

- parent `EventSeries.Id`;
- original `OccurrenceKey`;
- exception identity only as secondary metadata, not as the primary generated id source.

Recommended policy: the read-model occurrence id should remain stable across unchanged recurrence data and should not change merely because an exception is added, removed, or edited. This is better than using exception id as the occurrence id because clients can keep referring to the same logical occurrence before and after a modification.

## Stable identity

The stable business identity of a recurring occurrence is:

```text
(EventSeries.Id, OccurrenceKey)
```

`OccurrenceKey` identifies the original generated occurrence. It should not identify the replacement time of a moved exception.

For non-recurring series, the occurrence identity can be the series id plus a single non-recurring occurrence key derived from the base start. Projection may expose the series id as the occurrence id for compatibility if needed later, but the conceptual identity remains explicit.

## Deterministic generation

The generator must be a pure function of:

- series template fields;
- recurrence rule value;
- exception records;
- household timezone;
- requested window.

It must not depend on current time, provider type, database ordering of exceptions, or previous query windows.

## Interaction with OccurrenceKey

`OccurrenceKey` should contain one original household-local temporal value plus the discriminator and optional provider matching metadata:

- `OriginalLocalStart`: the original scheduled household-local start;
- `IsAllDay`: the all-day versus timed discriminator;
- optional `ProviderRecurrenceId` metadata for imported detached matching.

For all-day occurrences, `OriginalLocalStart` is local midnight on the all-day date. For timed occurrences, `OriginalLocalStart` is the actual household-local start date/time. This keeps occurrence identity deterministic while avoiding separate date/time invariants, comparison rules, and hashing paths.

The provider recurrence id is matching metadata, not the sole HomeOps identity. HomeOps should still be able to generate and match manual occurrences without provider data. `OriginalLocalStart` and `IsAllDay` are sufficient for manual recurrence and remain aligned with provider `RECURRENCE-ID` semantics after import normalization.

# Time Handling

## All-day events

All-day recurrence should be date-based.

Rules:

- Candidate keys use local midnight in `OriginalLocalStart` for the original all-day date plus the all-day discriminator.
- Final all-day occurrences cover local dates, not UTC-midnight assumptions.
- Non-midnight time fields should not affect all-day occurrence identity because all-day keys are normalized to local midnight.
- Duration is measured in local calendar days.

## Timed events

Timed recurrence should preserve local wall-clock time.

Rules:

- A 09:00 weekly event stays at 09:00 household-local time across DST changes.
- Duration is the local template duration unless a modified exception supplies replacement end timing.
- Final instants are converted using timezone rules for each occurrence's local date/time.

## DST transitions

The engine should use local wall-clock recurrence semantics and resolve each occurrence's local date/time in the household timezone.

Recommended policy:

- Ambiguous local times during fall-back should choose a deterministic offset, preferably the earlier occurrence offset unless platform conventions require a different stable choice.
- Invalid local times during spring-forward should be shifted forward to the next valid local time for projection, while preserving the original wall-clock occurrence key.
- These resolutions should be centralized so manual and imported events behave identically.

This policy prioritizes stable household-visible times while acknowledging that some local timestamps do not map cleanly to a single instant.

## Household timezone

The household timezone is the primary generation timezone for Recurrence V2.

Rules:

- Recurrence expansion uses household-local dates and times.
- `UntilDate` is household-local.
- Occurrence keys are household-local and use a single `OriginalLocalStart` value for both all-day and timed occurrences.
- Final projected instants are converted with the household timezone.

If the household timezone changes, generated instants may change because the same local calendar schedule is being viewed under a different household timezone. This is acceptable for Recurrence V2 and should be documented in later implementation/API work.

## Imported timezone information

Imported provider timezone information should be preserved as metadata when available, but the Recurrence V2 engine should not branch by provider.

Recommended behavior:

- Map supported imported recurrence rules into the HomeOps recurrence rule value.
- Normalize imported local starts into the household-local representation used by `EventSeries`.
- Preserve raw timezone/recurrence metadata for future synchronization and diagnostics.
- Do not execute separate Google, CalDAV, Exchange, or iCal recurrence algorithms.

A future slice may add per-series timezone if product requirements demand it. Recurrence V2 should not require that to implement the settled domain model.

## Local wall-clock behavior

The engine should be described and tested as a local wall-clock generator. It creates local candidate dates/times first, then converts final occurrences to instants for API projection. It should not add fixed UTC durations between occurrences.

# Performance Strategy

## Windowed generation

Occurrence generation should be windowed by default. Calendar queries should request a bounded date interval, and the engine should emit only occurrences whose final intervals intersect that interval.

## Avoiding generation from the beginning of history

The engine should calculate a cursor near the requested window:

- Daily: compute elapsed days divided by interval.
- Weekly: compute elapsed weeks from the anchored start week divided by interval.
- Monthly: compute elapsed months divided by interval.
- Yearly: compute elapsed years divided by interval.

For count-bounded rules, the engine must preserve ordinal semantics. Arithmetic ordinal calculation is preferred for simple frequencies; bounded pre-counting is acceptable when arithmetic would be error-prone, especially with invalid monthly/yearly dates.

## Large recurring series

For unbounded daily or weekly series spanning years, the engine should generate only candidates near the requested window plus overlap/exception safety margins. It should avoid materializing all past occurrences.

For multi-day events, cursor start should include a duration lookback so an event beginning before the window and ending inside it is included.

For moved exceptions, the engine should separately inspect exceptions whose replacement intervals intersect the window and ensure their original candidates are generated or directly resolved.

## Long-running yearly events

Long-running yearly rules are cheap if the cursor jumps by year interval. February 29 and other invalid dates require checking only included years, not every day.

Count-bounded February 29 rules may need to find the Nth valid leap-year occurrence. This should be implemented with year-step iteration over included years, not daily scanning.

## Indexing considerations

This report does not design persistence, but the occurrence engine benefits from data access that can load:

- event series by source/household and broad date relevance;
- recurrence rule with the series aggregate;
- exceptions by series id and occurrence key;
- exceptions with replacement final ranges that may intersect the requested window.

The most important conceptual index is `(EventSeriesId, OccurrenceKey)` uniqueness for exceptions. A later persistence design can choose exact database indexes.

# Provider Compatibility

The recommended engine supports manual recurrence, iCal, Google Calendar, CalDAV, and Exchange by using the same internal model:

```text
provider/manual input
  → EventSeries template
  → owned EventRecurrenceRule value
  → optional RawProviderRecurrenceRule metadata
  → EventException detached/skipped/modified records
  → provider-neutral occurrence engine
```

`RawProviderRecurrenceRule` is sufficient provider recurrence metadata for Recurrence V2. A separate `ProviderRecurrenceFingerprint` is not recommended because it would duplicate the raw provider recurrence definition and the normalized HomeOps recurrence rule, and it could become stale if synchronization compares the raw recurrence text and normalized model directly.

## Manual recurrence

Manual recurrence maps directly to HomeOps-supported rule fields. Manual edits to single occurrences create exceptions keyed by `OccurrenceKey`.

## iCal

Supported iCal RRULEs map to the HomeOps rule subset:

- `FREQ=DAILY|WEEKLY|MONTHLY|YEARLY`;
- `INTERVAL`;
- `COUNT`;
- date-based `UNTIL` after normalization;
- weekly `BYDAY`;
- monthly day-of-month;
- yearly month/day;
- `EXDATE` and detached `RECURRENCE-ID` as exceptions when supported.

Unsupported iCal features should remain outside Recurrence V2 rather than forcing provider-specific branches.

## Google Calendar

Google recurrence and overridden instances fit the same shape: master recurring event maps to `EventSeries` and rule; cancelled/overridden instances map to exceptions with provider detached metadata.

## CalDAV

CalDAV iCalendar resources use the same RRULE, EXDATE, and RECURRENCE-ID concepts as iCal. Supported shapes map to the same HomeOps model.

## Exchange

Exchange recurrence patterns and modified occurrences can be normalized to the same HomeOps fields when they are within the supported subset. Exchange-specific identifiers remain metadata for synchronization, not generation branches.

# Unsupported Scope

Recurrence V2 occurrence generation intentionally excludes:

- arbitrary iCalendar RRULE execution;
- `BYSETPOS`;
- nth weekday monthly rules, such as second Tuesday;
- last weekday monthly rules;
- explicit last-day-of-month rules;
- multiple day-of-month values in a monthly rule;
- multiple month/day pairs in a yearly rule;
- yearly `BYWEEKNO`, `BYYEARDAY`, or `BYDAY` patterns;
- recurrence sets with multiple RRULEs;
- `RDATE` ad hoc additional dates;
- complex `EXRULE` semantics;
- per-series timezone execution;
- provider-specific recurrence engines;
- persisted generated occurrences;
- API contracts, UI behavior, migrations, persistence design, synchronization strategy, and parser changes.

Unsupported provider recurrence should be rejected, degraded, or preserved as metadata by later parser/sync decisions. The occurrence engine should not secretly approximate unsupported rules.

# Trade-offs

## Skip invalid monthly/yearly dates versus clamp to nearest valid date

Skipping invalid dates is recommended.

Benefits:

- deterministic original occurrence keys;
- no hidden February 28/March 1 substitutions;
- aligns monthly and yearly behavior;
- easier provider-detached matching.

Costs:

- users who expect "last day of month" need a future explicit pattern;
- monthly January 31 appears less frequently than a clamped rule.

Clamping is rejected for Recurrence V2 because it conflates day-of-month with end-of-month semantics.

## Count before exceptions versus after exceptions

Counting candidates before exceptions is recommended.

Benefits:

- exceptions do not alter rule duration;
- skipped or modified occurrences remain edits to occurrences, not edits to the rule;
- aligns with common recurrence behavior.

Costs:

- a user who skips one occurrence in a five-count series sees four final visible occurrences unless they extend the rule.

Counting after exceptions is rejected because it makes final recurrence length depend on occurrence edits.

## Household timezone versus per-series timezone

Household timezone generation is recommended for Recurrence V2.

Benefits:

- fits current HomeOps household model;
- simpler occurrence identity;
- consistent manual/imported behavior;
- avoids introducing timezone persistence and UI scope.

Costs:

- imported calendars with event-specific timezones may not be represented with full fidelity;
- household timezone changes can alter projected instants.

Per-series timezone is deferred because it crosses into persistence, API, parser, and synchronization design.

## Raw provider recurrence rule versus provider recurrence fingerprint

Keeping `RawProviderRecurrenceRule` without `ProviderRecurrenceFingerprint` is recommended.

Benefits:

- preserves the provider recurrence definition needed for synchronization traceability;
- avoids duplicating information already present in the raw provider recurrence text;
- avoids duplicating executable semantics already present in the normalized HomeOps recurrence rule;
- prevents stale fingerprint metadata when raw provider data or normalized rule fields change;
- keeps manual and imported recurrence on the same occurrence-generation model.

Costs:

- synchronization code must compare raw provider recurrence text and the normalized recurrence model directly when detecting changes.

A separate recurrence fingerprint is rejected for Recurrence V2 because it is derived metadata, not an independent occurrence-generation input.

## Single-value OccurrenceKey temporal identity

`OccurrenceKey` should use `OriginalLocalStart` rather than separate `OriginalStartDate` and `OriginalStartTime` fields.

Benefits:

- one temporal value for comparison and hashing;
- deterministic occurrence identity for all-day and timed events;
- no date/time split invariants to maintain;
- natural alignment with provider `RECURRENCE-ID` semantics after provider data is normalized to household-local time;
- the same key shape works for manual and imported recurrence.

Costs:

- all-day identity must consistently normalize `OriginalLocalStart` to local midnight, and validation should reject non-midnight all-day keys.

Separate date/time fields are rejected because they add invariants without improving occurrence identity.

## Deterministic generated id versus exception id as occurrence id

Deterministic generated ids based on series id plus `OccurrenceKey` are recommended.

Benefits:

- stable before and after adding an exception;
- stable across regeneration;
- reinforces occurrence identity as original generated occurrence.

Costs:

- consumers that need exception database ids need separate metadata.

Using exception id as the occurrence id is rejected for V2 because it changes the identity of the same logical occurrence when it becomes modified.

# Frozen Occurrence Decisions

- Occurrence generation consumes `EventSeries` + owned `EventRecurrenceRule` + `EventException` records.
- Generated occurrences are transient read models, not persisted occurrence rows.
- The engine is provider-neutral.
- Imported recurrence may preserve `RawProviderRecurrenceRule`, but does not use `ProviderRecurrenceFingerprint`.
- Candidate generation occurs before exception processing.
- Exceptions match by original `OccurrenceKey`.
- `OccurrenceKey` identifies original scheduled start, not replacement start.
- `OccurrenceKey` uses `OriginalLocalStart`, `IsAllDay`, and optional `ProviderRecurrenceId`; all-day keys use local midnight.
- `COUNT` counts valid generated candidates before exceptions.
- `UNTIL` is an inclusive household-local original-start date boundary.
- Interval applies to recurrence periods.
- Weekly multi-day candidates are ordered by local date within included weeks.
- Monthly invalid day-of-month dates are skipped.
- Yearly invalid month/day dates are skipped.
- February 29 yearly recurrence occurs only in leap years.
- Timed recurrence preserves local wall-clock time.
- All-day recurrence is date-based.
- Final window filtering uses final occurrence intervals so moved occurrences are visible in their replacement windows.
- Unsupported recurrence shapes must not be approximated by the occurrence engine.

# Risks

- Provider fidelity risk: household-timezone generation may not fully match imported per-event timezone behavior.
- DST risk: invalid and ambiguous local times need a centralized resolver and dedicated tests.
- Optimization risk: window jumping can accidentally miss moved exceptions or count-bounded edge cases if not tested thoroughly.
- Unsupported-rule risk: users may import calendars using common but unsupported patterns such as nth weekday or last weekday monthly recurrence.
- Identity migration risk: moving from date-only exceptions to single-value `OccurrenceKey.OriginalLocalStart` needs careful compatibility handling in a later migration slice.
- UI expectation risk: users may expect January 31 monthly recurrence to mean "last day of each month," which Recurrence V2 intentionally does not infer.

# Files Referenced

- `.github/copilot-instructions.md`
- `AGENTS.md`
- `docs/reports/2026-07-05-calendar-recurrence-v2-baseline/calendar-recurrence-v2-baseline.md`
- `docs/reports/2026-07-05-calendar-recurrence-v2-domain-analysis/calendar-recurrence-v2-domain-analysis.md`
- `docs/reports/2026-07-05-calendar-recurrence-v2-domain-refinement/calendar-recurrence-v2-domain-refinement.md`
- `src/HomeOps.Api/CalendarEvents/EventOccurrenceGenerator.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeries.cs`
- `src/HomeOps.Api/CalendarEvents/EventException.cs`
- `src/HomeOps.Api/CalendarEvents/RecurrenceType.cs`
