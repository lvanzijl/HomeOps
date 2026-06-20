# Motivation Domain Persistence

## Implemented
- Added persisted `MotivationFamilyGoals` and `MotivationIndividualGoals` entities owned by the seeded household.
- Seeded one active family goal and one active individual goal for each existing seeded Family Member.
- Preserved the visible Motivation foundation values where practical: `Fill the family helper path`, `13/20 helpful actions`, and the existing personal goal titles/progress.

## Boundaries
- Progress is stored as read-model data and is not derived from Tasks yet.
- No goal editing, goal creation, Helpful Moments, gems, shop, reward economy, or punitive mechanics were added.

## Artifact
- `motivation-domain-foundation-idempotent.sql`
