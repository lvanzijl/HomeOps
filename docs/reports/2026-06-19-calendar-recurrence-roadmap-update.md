# Calendar Recurrence Roadmap Update

## Summary
Updated architecture, roadmap, and state documentation for recurrence, EventException, occurrence generation, and household timezone behavior.

## Implemented
- Documented supported recurrence frequencies and unsupported advanced rules.
- Documented EventException support for skipped and modified occurrences.
- Documented EventOccurrence runtime generation as Agenda-facing projection output.
- Documented household timezone local wall-clock behavior.

## Verified
- Documentation updated alongside implementation and automated coverage.

## Risks
- Future prompts must preserve HomeOps Calendar source-of-truth, local-only JSON portability, and EventOccurrence projection-only boundaries.

## Modified Files
- `docs/architecture.md`
- `docs/roadmap/phase-1.md`
- `docs/roadmap/phase-2.md`
- `docs/state/current-state.md`

## Next Prompt Context
The calendar recurrence runtime foundation is complete. UI for recurrence editing, occurrence editing, Google Calendar, ICS, notifications, reminders, authentication, per-event timezones, and timezone UI remain out of scope unless explicitly requested.
