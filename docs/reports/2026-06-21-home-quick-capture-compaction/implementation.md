# Home Quick Capture Compaction Implementation

## Summary
- Compacted Home quick capture so the hero leads with date/time and family awareness instead of two persistent input forms.
- Kept Shopping quick capture fast by using a compact expand-on-demand inline form.
- Moved Event quick capture into a dialog that opens only after the user chooses `+ Event`.
- Reordered Home summary content so Tasks appears immediately after Agenda before Motivation and Shopping/Lists.
- Preserved existing event creation, shopping item creation, Agenda, Tasks, Motivation, and Lists behavior.

## Validation Notes
- Added/updated HomeDashboard test coverage for compact Shopping capture and Event dialog capture.
- Full required validation was run after implementation.
- Playwright screenshot capture was not performed because no Playwright setup was invoked in this slice.
