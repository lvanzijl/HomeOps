# Task Templates Foundation Implementation

## Summary
- Added household-owned Task Template persistence with ordered template task items.
- Added APIs for listing active templates, creating templates, editing templates, archiving templates, and applying templates.
- Added seeded starter templates: Morning Routine, Bedtime Routine, Homework Routine, Pet Care, and Kitchen Reset.
- Updated the Tasks page with a lightweight template panel for saving, editing, applying, and archiving templates.
- Preserved existing Tasks, Recurring Tasks, Motivation Progress, Family Goals, Individual Goals, Family Members, and Household boundaries.

## Behavior
- Archived templates are soft-archived and excluded from normal template selection.
- Applying a template creates new tasks every time; multiple applications are allowed.
- Non-recurring template items create normal household tasks.
- Recurring template items create recurring task series and generated task occurrences compatible with the existing Recurring Tasks foundation.

## Out of Scope Kept Out
- Goal Templates, Reward Economy, gems, shop, notifications, sharing, marketplace, import/export, and AI-generated templates.
