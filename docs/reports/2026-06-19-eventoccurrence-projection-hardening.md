# EventOccurrence Projection Hardening

## Summary
Reinforced EventOccurrence as generated Agenda-facing projection data and kept EventSeries as the only persisted calendar source-of-truth entity.

## Implemented
- Kept `EventOccurrence` as a record without EF `DbSet` or table mapping.
- Continued projecting EventSeries through `EventOccurrenceProjector` before producing normalized Agenda events.
- Removed per-event timezone storage from EventSeries so timing semantics depend on the household timezone foundation rather than per-occurrence or per-event state.
- Added/kept tests covering legacy mapping, timed projection, all-day projection, and multi-day all-day exclusive end projection.

## Verified
- EventOccurrence projection tests pass.
- EventSeries CRUD/API tests still pass.
- Agenda frontend tests still pass with generated occurrence output.

## Risks
- Future recurrence work must keep recurrence expansion outside Agenda rendering and avoid persisting generated occurrences as authoritative data.
- Occurrence caching may still be useful later, but it must remain explicitly derived and invalidatable.

## Modified Files
- `EventOccurrence` and `EventOccurrenceProjector`.
- EventSeries normalizer/endpoints.
- Backend projection tests.
- Agenda API mapping tests.

## Next Prompt Context
EventOccurrence remains projection-only. Future recurrence or caching work must not make EventOccurrence the source of truth and must keep Agenda consuming resolved concrete event output only.
