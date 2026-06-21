# Weekly Household Reset & Recap Implementation

## Summary
- Added a parent-facing Weekly Reset API that collects only likely maintenance candidates and a contribution recap from existing task, goal, shopping, Helpful Moment, and celebration data.
- Added an optional Weekly Reset workspace with review candidate actions, goal confirmation, shopping review, and a “what went well this week?” recap.
- Added automated backend and frontend coverage for candidate collection, goal archiving, shopping review, contribution recap, and page rendering.
- Updated Phase 2 and current-state documentation.

## Validation
- `dotnet restore HomeOps.sln`
- `dotnet build HomeOps.sln`
- `npx --yes nswag run nswag.json`

Full test commands are recorded in the final response for this implementation run.
