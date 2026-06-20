# Motivation Read API

## Implemented
- Added `GET /api/motivation` for the seeded household.
- The snapshot returns the active family goal plus active individual goals with Family Member id/name linkage for rendering.
- If no Motivation records exist, the endpoint returns `familyGoal: null` and an empty individual goal collection.

## Boundaries
- No Motivation mutation endpoints were added.
- The API remains scoped to the existing single seeded household boundary.
