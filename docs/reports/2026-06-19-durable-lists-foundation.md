# Durable Lists Foundation Report

## Summary
Phase 2 Slice 2.1 Durable Lists Foundation completed. The in-memory Shopping List MVP now consumes a generic persisted Lists domain through backend APIs and the generated NSwag TypeScript client. Preflight `dotnet --version` returned `10.0.301`.

## Implemented
- Added EF Core persistence foundation with PostgreSQL/Npgsql configuration, application `HomeOpsDbContext`, design-time DbContext factory, and initial migration infrastructure.
- Added a minimal single seeded household ownership boundary without household management, authentication, users, roles, invites, or multi-household support.
- Added generic household-owned Lists and ListItems entities with deterministic development seed data for Shopping and Vacation Packing.
- Added minimal Lists APIs: get lists, get list by id, create list, add item, toggle item completion, and remove item.
- Generated OpenAPI and NSwag TypeScript client artifacts and updated the frontend to use the generated client instead of in-memory demo shopping data.
- Converted the Shopping List Widget to load, add, toggle, and remove items through API-backed Lists persistence while preserving the existing widget-framework integration and user-visible interactions.
- Added backend tests for DbContext seed data, CRUD behavior, and API endpoints.
- Added frontend tests for generated DTO mapping, API-backed widget behavior, and list interaction helpers.
- Updated architecture, current state, and Phase 2 roadmap documentation.

## Verified
- `dotnet --version`: passed, `10.0.301`.
- `dotnet restore HomeOps.sln`: passed.
- `dotnet build HomeOps.sln`: passed, 0 warnings and 0 errors.
- `dotnet test HomeOps.sln`: passed, 17 backend tests.
- `npm test --prefix src/HomeOps.Client`: passed, 5 test files and 16 frontend tests.
- `npm run build --prefix src/HomeOps.Client`: passed.
- `npx --yes nswag run nswag.json`: passed and regenerated OpenAPI/TypeScript client artifacts.
- `dotnet ef migrations script --idempotent --project src/HomeOps.Api/HomeOps.Api.csproj --startup-project src/HomeOps.Api/HomeOps.Api.csproj --output /tmp/homeops-migration.sql`: passed; generated a 111-line idempotent migration script.
- Lists seed data exists for Shopping, Vacation Packing, Bread, Milk, Coffee, Passport, Chargers, and Swimwear through EF seed data and backend tests.
- Shopping List Widget API-backed load, add, toggle, and remove behavior is covered by frontend tests.
- Generated client builds successfully through the frontend production build.

## Risks
- The single household is seeded as a fixed ownership boundary only; household management remains intentionally unimplemented.
- The app is offline-tolerant only through loading/error UI states; no offline-first mutation queue, synchronization, or conflict handling was added.
- Local development and Supabase-hosted deployments must provide a valid PostgreSQL connection string before applying migrations or running the API against a real database.
- The Shopping List Widget still carries its presentation name for compatibility, while the underlying domain is now generic Lists.

## Modified Files
- `docs/architecture.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-06-19-durable-lists-foundation.md`
- `docs/state/current-state.md`
- `src/HomeOps.Api/Data/*`
- `src/HomeOps.Api/Households/*`
- `src/HomeOps.Api/Lists/*`
- `src/HomeOps.Api/Migrations/*`
- `src/HomeOps.Api/HomeOps.Api.csproj`
- `src/HomeOps.Api/Program.cs`
- `src/HomeOps.Api/appsettings*.json`
- `src/HomeOps.Client/package*.json`
- `src/HomeOps.Client/src/api/homeOpsApiClient.ts`
- `src/HomeOps.Client/src/shopping/*`
- `src/HomeOps.Client/src/widgets/components/ShoppingListWidget.tsx`
- `src/HomeOps.Client/src/widgets/components/ShoppingListWidget.test.tsx`
- `src/HomeOps.Client/vite.config.ts`
- `src/HomeOps.Contracts/openapi.json`
- `tests/HomeOps.Api.Tests/HomeOps.Api.Tests.csproj`
- `tests/HomeOps.Api.Tests/Lists/*`

## Next Prompt Context
Proceed with Phase 2 Slice 2.2 Widget/Layout Persistence only. Preserve the generic Lists domain and existing API-backed Shopping List behavior. Do not implement manual events, Google Calendar integration, OAuth, authentication, multi-household support, sensors, media integrations, or offline-first synchronization in the next slice.
