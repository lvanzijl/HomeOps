# Family Goal Progress

Family goal progress now derives from completed Shared Household tasks.

- Completing an eligible Shared Household task increments the active family goal.
- Reopening that task decrements the family goal.
- Progress is clamped between zero and the goal target.
- The existing family goal UI continues to read through the Motivation API.
