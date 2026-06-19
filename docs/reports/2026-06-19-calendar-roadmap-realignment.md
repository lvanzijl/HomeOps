# Calendar Roadmap Realignment

## Summary
Updated roadmap/state/architecture documentation to reflect accepted calendar decisions and the completed terminology, projection, and household-timezone foundation work.

## Implemented
- Documented HomeOps Calendar as the source of truth for HomeOps-owned events.
- Documented Google Calendar as optional integration only.
- Documented EventSeries as the persisted calendar entity and EventOccurrence as projection-only output.
- Documented JSON as the future canonical export direction while keeping import/export and ICS out of scope for this slice.
- Added the completed combined slice to Phase 2 state and roadmap.

## Verified
- Documentation now points next work toward Calendar Export/Import Design or optional Google Calendar integration without reversing HomeOps source-of-truth decisions.
- No implementation scope was added for recurrence, EventException, Google Calendar, ICS, import/export, reminders, notifications, authentication, or timezone UI.

## Risks
- Historical reports and older completed slice names still mention Manual Events for chronological accuracy.
- Real Google Calendar work still needs careful scoping so it remains optional integration rather than a source-of-truth reversal.

## Modified Files
- `docs/architecture.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- Calendar implementation reports.

## Next Prompt Context
Phase 2 now reflects HomeOps Calendar source of truth, EventSeries persistence, projection-only EventOccurrence, household timezone foundation, JSON future portability, and optional Google Calendar integration. Next work should preserve those boundaries.
