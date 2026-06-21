# Goal Hygiene Implementation

## Summary
- Enforced one active Family Goal per household by retiring other active family goals whenever a family goal is created or edited.
- Enforced one active Individual Goal per Family Member by retiring that member's other active individual goals whenever an individual goal is created or reassigned through editing.
- Added partial unique database indexes to protect against duplicate active family goals and duplicate active individual goals per member, with migration cleanup for existing duplicate active records before constraints are created.
- Preserved existing lifecycle behavior by using the current `IsActive = false` archive/deactivation model rather than deleting goals.

## Validation Added
- Family Goal activation replacement.
- Individual Goal activation replacement for the same child while leaving other members unaffected.
- Individual Goal reassignment cleanup when editing moves a goal to a member who already has an active goal.
- Progress preservation on retired goals.
- Existing celebration fields remain attached to family goals and continue through the existing DTO behavior.

## Scope Notes
- No reward economy, notifications, shopping changes, analytics, goal templates, new goal types, or dashboard changes were added.
- The purpose is maintenance reduction and focus: families see one family goal, and each child sees one personal goal.
