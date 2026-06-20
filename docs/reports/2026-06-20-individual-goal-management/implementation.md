# Individual Goal Management Implementation

## Summary
- Added API support to create, edit, and archive active individual Motivation goals assigned to active Family Members.
- Editing preserves existing progress and caps progress when the target is lowered.
- Archiving uses the existing active/inactive lifecycle so retired goals disappear from active Motivation and Child Progress displays while persisted history remains intact.
- Added Motivation page controls for parents to add, edit, reassign, and retire personal goals with family-friendly wording.
- Child Progress integration continues through the Motivation snapshot: newly created active goals appear on member progress pages and archived goals are omitted.

## Boundaries Preserved
- No Reward Economy, gems, tokens, shop, purchases, avatar unlocks, badges, leaderboards, negative points, notifications, recurrence, or goal templates were added.
- Family Goals, Family Celebrations, Helpful Moments, Tasks, Home, and existing Motivation progress behavior remain separate.

## Validation Notes
- Added backend coverage for individual goal creation, editing with progress preservation/capping, and archiving without hard delete.
- Added frontend coverage for Motivation page individual goal creation, editing, returned progress display, and retiring goals from the active display.
- No migrations were added because individual goals already had persisted active/inactive state and assignment fields.
