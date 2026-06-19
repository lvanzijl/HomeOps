# EventSeries Readiness Analysis

## Summary
This is an analysis-only report. No implementation, code changes, tests, migrations, or database changes were performed. Preflight `dotnet --version` returned `10.0.301`.

Enough high-level architectural decisions have been made to safely implement a narrow migration from concrete Manual Events to non-recurring EventSeries, provided the slice does not add recurrence behavior. The stable decisions are: HomeOps Calendar is the source of truth, Google Calendar is optional integration only, JSON is the canonical export format, Agenda renders concrete occurrences, event management operates on logical entities, Manual Events are transitional, EventSeries is the preferred conceptual direction, HomeOps uses a single household timezone in V1, and recurring events must preserve local wall-clock behavior.

The remaining risk is not whether EventSeries is the correct direction. The remaining risk is scope control: implementing EventSeries as a persistence/API migration is reasonable, but implementing recurrence, exceptions, import/export restore, ICS, Google synchronization, or rich calendar editing in the same slice would still create redesign risk.

Overall classification: **Mostly Ready** for a non-recurring EventSeries migration slice; **Not Ready** for full recurrence and exception behavior.

## Open Risks
- EventSeries could accidentally be implemented as a renamed ManualEvent table rather than a logical calendar entity, preserving concrete-occurrence assumptions under a new name.
- Existing frontend and API workflows currently treat editable events as concrete items; the migration must avoid hardening occurrence-level CRUD as the long-term event-management contract.
- If generated EventOccurrence rows are persisted too early, they may become mistaken for authoritative calendar data instead of derived Agenda output.
- Recurrence could leak into Agenda rendering if the EventSeries migration exposes recurrence internals directly to widgets.
- JSON portability could be weakened if the first EventSeries schema mirrors database tables instead of defining logical calendar export semantics.
- Manual Events may continue accumulating data while migration is delayed, increasing eventual ID mapping, export compatibility, and duplicate-consolidation risk.
- The current Phase 2 roadmap still lists real Google Calendar read-only integration as the recommended next slice, which conflicts with the newly accepted direction that HomeOps Calendar semantics should be settled before provider integration expands.
- Birthdays are accepted as not a special architectural source-of-truth concept, but the existing sample/generated birthday source still has calendar-like recurrence semantics that could pressure the implementation to overgeneralize too early.
- Dutch-first and i18n-ready behavior is accepted, but calendar labels, validation messages, weekday/month naming, recurrence phrasing, and export metadata language boundaries are not yet specified for the migration slice.

## Unresolved Decisions
- Whether the next implementation slice is explicitly limited to migrating existing Manual Events into non-recurring EventSeries, or whether it is expected to introduce any recurrence fields.
- The minimum first-schema shape for EventSeries identity, source ownership, title/description/location fields, local timing fields, all-day fields, and generated occurrence projection fields.
- Whether the user-facing terminology changes from “Manual Events” to “Calendar Events” during the migration, or only the internal model changes.
- Whether EventSource remains the calendar ownership boundary, or whether a distinct Calendar grouping concept is introduced later.
- Whether EventOccurrence is purely computed in V1 or has any stored/cache representation for range queries.
- Whether EventException is omitted entirely until recurrence is implemented, or introduced as an empty/future concept in the domain contract.
- Whether RecurrenceRule is omitted entirely until recurrence is implemented, or represented as an explicit nullable/absent concept on EventSeries.
- Whether all-day multi-day end dates are formally exclusive in the persistence/API/export contract. Prior analysis recommends exclusive end dates, and the accepted decisions say multi-day all-day events use date ranges, but the exact contract still needs to be frozen before schema work.
- Whether one-time timed events should store local start/end values plus household timezone, or store local start plus duration. Either can work, but the first migration should not leave this ambiguous.
- Whether existing Manual Event IDs are preserved as EventSeries IDs, mapped to new IDs, or stored as legacy IDs for compatibility.
- Whether JSON export/import is part of the EventSeries migration slice or only a constraint the schema must be designed to support later.
- What validation rules apply to date-only ranges, timed ranges, zero-duration events, and cross-day timed events in the first EventSeries migration.

## Missing Analyses
- **Implementation contract analysis:** define the minimal non-recurring EventSeries API and persistence contract before coding, including what remains intentionally absent.
- **Migration mapping analysis:** specify how existing ManualEvent records, IDs, event source references, all-day values, timed values, seed data, and API responses map into EventSeries and generated EventOccurrence output.
- **Occurrence projection analysis:** decide whether occurrences are generated dynamically only, cached, or persisted as derived rows for the initial slice.
- **JSON schema preflight:** define enough of the future logical JSON shape to ensure EventSeries persistence does not become database-shaped or lossy.
- **Validation semantics analysis:** specify date-only, timed, multi-day, cross-midnight, and household-timezone validation before schema/API work.
- **Terminology and UX analysis:** decide whether the user sees “Manual Event,” “Calendar Event,” or another term after migration.
- **Roadmap realignment analysis/update:** reconcile the current Phase 2 “Real Google Calendar Read-Only Integration” next-slice recommendation with the accepted HomeOps-source-of-truth and EventSeries-first direction. This report does not update roadmap/state because it is analysis-only.
- **DST edge-case policy analysis:** still needed before recurrence implementation, but not necessarily before a non-recurring EventSeries migration if the slice uses the household timezone and does not expand recurrence.
- **Exception and series-splitting analysis:** still needed before implementing modified/skipped/detached occurrences or “this and future” edits.

## EventSeries Readiness Assessment

| Area | Readiness | Remaining blocker or redesign concern |
| --- | --- | --- |
| EventSeries | **Mostly Ready** | The concept is stable enough for a non-recurring migration, but the first persistence/API contract must not accidentally preserve occurrence-shaped Manual Event semantics. |
| EventOccurrence | **Mostly Ready** | Stable as Agenda-facing concrete output; unresolved whether occurrences are dynamic only, cached, or stored as derived data in the first implementation. |
| EventException | **Not Ready** | Conceptually required for mature recurrence, but skipped, modified, detached, and series-split semantics are not settled enough for implementation. |
| RecurrenceRule | **Mostly Ready** | Stable as a future optional property of EventSeries, but the supported rule subset, DST edge policies, unsupported import behavior, and UI/editing semantics are not ready. It should not be implemented in the first migration slice. |
| All-day events | **Mostly Ready** | Date-only semantics are settled, but the exact API/persistence representation and validation rules must be frozen before implementation. |
| Multi-day events | **Mostly Ready** | Date-range semantics are accepted; exclusive end date should be explicitly adopted before schema/API work to avoid later migration. |
| Household timezone | **Mostly Ready** | V1 single household timezone and default Europe/Amsterdam are settled; unresolved where it is configured/stored and whether per-series timezone is intentionally deferred. |
| JSON portability | **Mostly Ready** | JSON as canonical export is settled; the remaining risk is failing to define a logical versioned schema before EventSeries tables/API contracts harden. |

## Recommendation
Proceed only with a narrow EventSeries migration design/implementation slice if implementation is explicitly authorized next.

Recommended gate for the next implementation prompt:
- Migrate Manual Events into non-recurring EventSeries.
- Preserve Agenda output by generating concrete EventOccurrence values for existing views.
- Use household timezone `Europe/Amsterdam` for V1 timed event semantics unless a household settings contract is explicitly included.
- Preserve all-day events as date-only values and multi-day all-day events as date ranges with exclusive end dates.
- Keep RecurrenceRule and EventException out of runtime behavior unless the prompt explicitly authorizes recurrence.
- Do not implement Google Calendar sync/import/export, ICS, reminders, notifications, attendees, authentication, or database backup/export automation in the same slice.
- Before coding, freeze the minimal EventSeries API/persistence contract and ManualEvent migration mapping.

If the next slice intends to implement recurrence, exceptions, or import/export restore behavior, do not proceed yet. Complete the missing analyses first.

## Next Prompt Context
HomeOps Calendar is the source of truth. Google Calendar is optional integration only. JSON is the canonical export format, while ICS remains out of scope for now. HomeOps uses a single household timezone in V1, defaulting to `Europe/Amsterdam`. Recurring timed events must preserve local wall-clock behavior, but recurrence should not be implemented until DST ambiguity/nonexistent-time policy, supported rule subset, exception semantics, and series-splitting behavior are settled. Manual Events are transitional. EventSeries is stable enough for a narrow migration where existing Manual Events become non-recurring EventSeries and Agenda continues rendering generated concrete EventOccurrence values. All-day events must use date-only semantics; multi-day all-day events should use date ranges with exclusive end dates. JSON portability must remain logical and versioned rather than database-shaped. Before implementation, define the minimal non-recurring EventSeries contract, occurrence projection strategy, migration mapping, validation rules, and whether user-facing terminology changes from Manual Events to Calendar Events.
