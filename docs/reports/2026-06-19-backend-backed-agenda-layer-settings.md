# Backend-Backed Agenda Layer Settings

## Summary
Implemented Phase 2 Slice 2.4: Backend-Backed Agenda Layer Settings. Agenda source visibility is now persisted through backend APIs per generated local device key, with independent Week and Months view settings.

Preflight: `dotnet --version` returned `10.0.301`.

## Implemented
- Added device-scoped AgendaLayerSettings persistence with EF Core mapping and migration infrastructure.
- Added minimal get/save Agenda Layer Settings APIs using the `X-HomeOps-Device-Key` header.
- Kept settings device-scoped only; no household ownership, users, authentication, profiles, device registration, or device management were added.
- Regenerated OpenAPI/NSwag TypeScript client artifacts.
- Replaced browser-only layer settings persistence with API-backed load/save helpers and a generated local device key persisted in browser storage.
- Preserved Week/Months independence and default-enabled behavior for new/unknown event sources.
- Added backend and frontend regression coverage for settings creation, retrieval, update, device isolation, view isolation, unknown source handling, API-backed loading, source filtering support, and device key persistence.
- Updated architecture, Phase 2 roadmap, and current state documentation.

## Verified
- `dotnet --version` — passed, returned `10.0.301`.
- `dotnet restore HomeOps.sln` — passed; restore reported the existing SQLitePCLRaw advisory warning from test dependencies.
- `dotnet build HomeOps.sln` — passed with 0 errors; build reported the existing SQLitePCLRaw advisory warning from test dependencies.
- `dotnet test HomeOps.sln` — passed, 35 tests.
- `npm test --prefix src/HomeOps.Client` — passed, 27 tests across 9 files.
- `npm run build --prefix src/HomeOps.Client` — passed before and after NSwag regeneration.
- `npx --yes nswag run nswag.json` — passed and regenerated OpenAPI/client artifacts.
- `dotnet ef migrations script --idempotent --project src/HomeOps.Api/HomeOps.Api.csproj --startup-project src/HomeOps.Api/HomeOps.Api.csproj --output /tmp/homeops-agenda-layer-settings-migration.sql` — passed; generated a 316-line idempotent migration script.

## Risks
- The device key is a lightweight local identifier; clearing browser storage creates a new device-scoped settings identity.
- Settings are device-specific by design and do not synchronize household-wide.
- API save replaces the current device's stored settings with the submitted source map.
- Restore/build may still report the pre-existing SQLitePCLRaw advisory warning from test dependencies.

## Modified Files
- Backend Agenda Layer Settings domain, endpoints, EF Core model, migration, and tests.
- Generated OpenAPI and NSwag TypeScript client artifacts.
- Agenda layer settings API helpers, hook integration, and frontend tests.
- Architecture, roadmap, state, and this report.

## Next Prompt Context
Proceed with Slice 2.5 Event Editing UX Hardening. Keep the next slice focused on improving the existing Manual Events editing experience only. Do not add authentication, users, profiles, Google Calendar integration, OAuth, sensors, media, notifications, recurring events, drag-and-drop editing, device management, or offline-first synchronization.
