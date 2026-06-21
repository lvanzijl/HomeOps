# Recurring Task Hygiene Implementation

## Summary
- Added soft expiration for incomplete recurring task occurrences once a current or upcoming occurrence exists for the same series.
- Kept completed recurring occurrences preserved so Motivation progress and completed history remain intact.
- Filtered expired occurrences out of the active task API response to prevent recurring backlogs from accumulating in normal task views.

## Rationale
Recurring tasks represent habits and routines. A missed occurrence should remain visible long enough to be acted on, but once the next occurrence is available the task list should return attention to what should be done now. Soft expiration avoids hard deletion and keeps completed history intact while reducing household maintenance burden.

## Boundaries Preserved
- No notifications, goal changes, reward economy, shopping changes, dashboard changes, analytics, or advanced recurrence rules were introduced.
- Existing recurring task series, normal tasks, Motivation progress, family goals, individual goals, and child workspace behavior remain preserved.
