# Motivation Overview / Detail Separation

## Summary
- Applied Summary vs Detail separation to Motivation without adding functionality, persistence, workflows, or domains.
- Kept the Family Goal, current progress, and Celebration state as the primary page story.
- Compacted Helpful Moments into an overview preview with count/recent example and explicit access to appreciation creation/full browsing.
- Compacted Celebration Memory into a recent-memory overview with deliberate access to history.
- Compacted Personal Goals into count/key-progress preview with deliberate management access.

## Validation Notes
- A user can answer “What is our family working toward?” from the Family Goal card at the top of Motivation.
- A user can answer “How are we doing?” from the top progress and celebration state, plus compact supporting previews.
- Deeper workflows remain reachable through explicit actions: Edit family goal, Add appreciation, View all appreciation, View memory history, Manage personal goals, Add personal goal, and per-goal Edit after management expansion.

## Cross-Page Rule Check
Motivation now prioritizes Overview over Detail. Detail workflows remain present but no longer occupy the default overview simultaneously with the family-goal story.

## Scope Guardrails
- No new domains.
- No persistence changes.
- No reward systems, gamification, or notifications.
- No Child Workspace or shell redesign.

## Validation Performed
- `dotnet restore HomeOps.sln`
- `dotnet build HomeOps.sln`
- `dotnet test HomeOps.sln`
- `npm test --prefix src/HomeOps.Client`
- `npm run build --prefix src/HomeOps.Client`
- `npx --yes nswag run nswag.json`

## Screenshot Note
Playwright CLI is available, but Docker is not installed in this environment, so the visual-full database fixture could not be loaded for a representative Motivation screenshot.
