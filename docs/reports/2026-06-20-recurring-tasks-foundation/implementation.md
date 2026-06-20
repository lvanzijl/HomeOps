# Recurring Tasks Foundation

## Summary
- Added a simple recurring task series model for Daily, Weekly, and Monthly household chores.
- Added automatic occurrence generation with a short predictable horizon so future routine tasks appear without manual recreation.
- Added recurring task editing for title, owner, due/start date, and recurrence frequency.
- Added explicit recurring series deletion that removes pending occurrences while keeping completed task history.
- Preserved Motivation compatibility by keeping generated occurrences as normal Tasks that advance family and individual goals on completion.

## Boundaries Preserved
- No Task Templates, Goal Templates, Reward Economy, Gems, Shop, notifications, calendar reminders, Google Calendar, task approval, custom recurrence rules, cron-like scheduling, occurrence-only deletion, recurrence exceptions, or series splitting were introduced.
- Existing Tasks, Motivation Progress, Family Goals, Individual Goals, Family Members, Home, and Child Progress remain intact.

## Validation Notes
- Added backend coverage for Daily, Weekly, and Monthly recurrence, generation, completion, editing, deletion, and Motivation integration.
- Generated an idempotent EF migration script: `recurring-tasks-foundation-idempotent.sql`.
