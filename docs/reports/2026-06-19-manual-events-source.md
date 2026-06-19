# Manual Events Source

## Summary
Implemented Phase 2 Slice 2.3: Manual Events Source. Manual Events are now the first persisted writable HomeOps-owned event source, scoped to the existing single seeded household and normalized into the Agenda event model.

Preflight: `dotnet --version` returned `10.0.301`.

## Implemented
- Added EF Core persistence for household-owned event sources and manual events.
- Added deterministic Manual Events seed data: Dentist Appointment, Parent Evening, Vacation, and Put Bins Outside.
- Added minimal APIs for event source retrieval and event get/create/update/delete.
- Added normalization from persisted Manual Events into the existing normalized event contract.
- Regenerated OpenAPI/NSwag TypeScript client artifacts.
- Converted the Agenda Widget to load persisted Manual Events while preserving read-only birthday/demo sources, source filtering, week view, and months view.
- Added minimal embedded Agenda UI for manual event create, update, and delete validation.
- Added backend and frontend regression coverage for Manual Events behavior.
- Updated architecture, Phase 2 roadmap, and current state documentation.

## Verified
- `dotnet --version` — passed, returned `10.0.301`.
- `dotnet restore HomeOps.sln` — passed; restore reported the existing SQLitePCLRaw advisory warning from test dependencies.
- `dotnet build HomeOps.sln` — passed with 0 errors; build reported the existing SQLitePCLRaw advisory warning from test dependencies.
- `dotnet test HomeOps.sln` — passed, 29 tests.
- `npm test --prefix src/HomeOps.Client` — passed, 27 tests across 9 files.
- `npm run build --prefix src/HomeOps.Client` — passed.
- `npx --yes nswag run nswag.json` — passed and regenerated OpenAPI/client artifacts.
- `dotnet ef migrations script --idempotent --project src/HomeOps.Api/HomeOps.Api.csproj --startup-project src/HomeOps.Api/HomeOps.Api.csproj --output /tmp/homeops-manual-events-migration.sql` — passed; generated a 282-line idempotent migration script.

Additional verification is covered by automated tests: seed data exists, event source retrieval works, event CRUD works, Manual Events normalize into Agenda events, household scoping excludes other-household events, Agenda renders persisted Manual Events, birthdays remain visible, source filtering works, and create/update/delete UI calls the API-backed client helpers.

## Risks
- The Agenda event management UI is intentionally minimal and embedded in the widget; richer event editing UX remains a later slice.
- Recurring events are not supported; Manual Events persist single concrete occurrences only.
- Agenda layer settings remain browser-local and should move to backend-backed persistence next.
- Restore/build still report the pre-existing SQLitePCLRaw advisory warning from test dependencies.

## Modified Files
- Backend Manual Events domain, endpoints, EF Core model, migration, and tests.
- Generated OpenAPI and NSwag TypeScript client artifacts.
- Agenda API helpers, demo read-only agenda data, Agenda Widget integration, and frontend tests.
- Architecture, roadmap, state, and this report.

## Next Prompt Context
Proceed with Slice 2.4 Backend-Backed Agenda Layer Settings. Keep the next slice focused on persisting per-view source visibility preferences for the existing single-household/device-aware model. Do not add authentication, Google Calendar integration, sensors, media, notifications, recurring events, drag-and-drop layout editing, or offline-first synchronization.
