# EventSeries Contract and Migration

## Summary
Implemented the EventSeries contract and migration slice. Manual Events are now persisted as non-recurring EventSeries, and Agenda-facing events are generated through an EventOccurrence projection.

## Implemented
- Added EventSeries as the persisted calendar entity with title, description, source, all-day flag, date-only start/end dates, optional timed start/end times, household timezone `Europe/Amsterdam`, and audit timestamps.
- Added dynamic EventOccurrence projection for Agenda output; occurrences are not persisted.
- Migrated the database model from `ManualEvents` to `EventSeries` while preserving existing API routes and DTO shapes for frontend compatibility.
- Preserved CRUD behavior for create, edit, delete, and view operations.
- Preserved all-day and multi-day all-day events using date ranges with exclusive end dates.
- Added backend coverage for migration mapping, occurrence projection, timed events, all-day events, multi-day all-day events, CRUD behavior, and API contract behavior.

## Verified
- `dotnet restore HomeOps.sln`
- `dotnet build HomeOps.sln`
- `dotnet test HomeOps.sln`
- `npm test --prefix src/HomeOps.Client`
- `npm run build --prefix src/HomeOps.Client`
- `npx --yes nswag run nswag.json`
- Generated idempotent migration script at `/tmp/homeops-eventseries-idempotent.sql`.

## Risks
- API DTO names still use ManualEvent terminology to preserve frontend/API stability; a future terminology cleanup may rename contracts.
- EventSeries stores V1 household-timezone semantics only; per-series timezone configuration remains out of scope.
- Recurrence, EventException, import/export, ICS, Google Calendar, reminders, notifications, and authentication remain unimplemented.

## Modified Files
- Backend calendar persistence, projection, endpoints, and migration files.
- Backend EventSeries/API tests.
- Generated OpenAPI and TypeScript API client if NSwag detects contract changes.
- Phase 2 roadmap and current-state documentation.

## Next Prompt Context
HomeOps Calendar now persists non-recurring EventSeries as the source of truth. Agenda still consumes concrete EventOccurrence output generated dynamically from EventSeries. Recurrence and EventException are intentionally absent. All-day events use date-only fields, and multi-day all-day events use exclusive end dates. The next slice should not add Google Calendar, recurrence, import/export, ICS, reminders, notifications, authentication, or timezone UI unless explicitly requested.
