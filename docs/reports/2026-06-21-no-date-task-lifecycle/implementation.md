# No-Date Task Lifecycle Implementation

## Summary
- Added a lightweight no-date lifecycle: Active, Needs Review, Someday, Completed, and Archived.
- Older no-date tasks are classified into parent-facing review language: “Still part of the plan?”
- Added a Someday destination for long-term ideas that should not create daily task pressure.
- Added Weekly Household Reset review participation for the oldest no-date candidates with Keep Active, Add Due Date, Move To Someday, Complete, and Archive actions.
- Updated Home and Child Workspace task filtering so review-only and Someday tasks do not dominate family-facing surfaces.

## Validation
- Added backend lifecycle coverage for review classification, Someday movement, review actions, due-date recovery, completion, and archive removal from active task lists.
- Added frontend grouping coverage to keep Someday and archived no-date tasks out of active urgency groups while keeping Needs Review parent-facing.

## Notes
- No notifications, Reward Economy, project management, task hierarchies, categories, analytics, Kanban, or dashboard redesign were added.
- An idempotent migration script was generated: `no-date-task-lifecycle-idempotent.sql`.
