# Tasks Hierarchy Compaction Implementation

## Summary
- Reordered Tasks so active task groups render before task setup, templates, Weekly Reset, and Someday planning content.
- Replaced the persistent task creation form with an on-demand Add Task panel that preserves title, owner, family member, due date, and recurrence fields.
- Moved Task Templates behind a secondary Templates action while preserving apply, edit, archive, and template-save access.
- Moved Weekly Household Reset behind a compact entry action while preserving review actions.
- Kept Someday visible only after active work and management entry points so future planning no longer competes with immediate execution.

## Cross-Page UX Rule Check
Yes. The Tasks page now prioritizes execution over management: after the header and any loading/error state, the first normal content is the active urgency board. Creation, templates, Weekly Reset, and Someday remain available but are intentionally secondary.

## Validation Notes
- Active task groups appear before creation and maintenance panels.
- Task creation, recurring-task input, templates, Weekly Reset review actions, and Someday actions were preserved without persistence or workflow changes.
