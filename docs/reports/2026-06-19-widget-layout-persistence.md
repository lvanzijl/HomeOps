# Widget/Layout Persistence Report

## Summary
Phase 2 Slice 2.2 Widget/Layout Persistence completed. Dashboard configuration is now household-owned persisted workspace layout data, while the widget catalog remains application-owned. Preflight `dotnet --version` returned `10.0.301`.

## Implemented
- Added WorkspaceLayout and WidgetPlacement entities with EF Core mapping, seed data, and a migration for persisted workspace layouts.
- Seeded default Home, House, Media, and Settings layouts to match the existing validated workspace experience.
- Added minimal workspace layout APIs to get a layout by workspace and save/replace a workspace layout.
- Generated OpenAPI and the NSwag TypeScript client for the new layout APIs.
- Reworked frontend workspace rendering so navigation remains static, widget catalog stays application-owned, and widget placements load from API-backed layouts with default fallback.
- Added backend tests for seeded layouts, layout retrieval, layout save/update, and the single-household ownership boundary.
- Added frontend tests for layout DTO mapping, default fallback, API-backed workspace rendering, and navigation-driven layout loading.
- Updated architecture, Phase 2 roadmap, and current state documentation.

## Verified
- `dotnet --version`: passed, `10.0.301`.
- `dotnet restore HomeOps.sln`: passed.
- `dotnet build HomeOps.sln`: passed.
- `dotnet test HomeOps.sln`: passed, 22 backend tests.
- `npm test --prefix src/HomeOps.Client`: passed, 7 test files and 21 frontend tests.
- `npm run build --prefix src/HomeOps.Client`: passed.
- `npx --yes nswag run nswag.json`: passed and regenerated OpenAPI/TypeScript client artifacts.
- `dotnet ef migrations script --idempotent --project src/HomeOps.Api/HomeOps.Api.csproj --startup-project src/HomeOps.Api/HomeOps.Api.csproj --output /tmp/homeops-layout-migration.sql`: passed; generated a 199-line idempotent migration script.
- Existing Home workspace, Agenda widget, and Shopping widget rendering are covered by workspace/widget tests and the frontend production build.
- Layout loading through API, default layout fallback, and generated client build compatibility are covered by frontend tests and build validation.

## Risks
- Layout persistence stores placement metadata only; there is no drag-and-drop editor or advanced layout engine yet.
- The frontend ignores unknown widget placement types because the widget catalog is application-owned.
- Default fallback is offline-tolerant only; no offline-first synchronization, mutation queue, or conflict handling was added.
- Layout save APIs are intentionally minimal and are not yet wired to a user-facing editor.

## Modified Files
- `docs/architecture.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-06-19-widget-layout-persistence.md`
- `docs/state/current-state.md`
- `src/HomeOps.Api/Data/HomeOpsDbContext.cs`
- `src/HomeOps.Api/Migrations/*`
- `src/HomeOps.Api/Program.cs`
- `src/HomeOps.Api/WidgetLayouts/*`
- `src/HomeOps.Client/src/api/homeOpsApiClient.ts`
- `src/HomeOps.Client/src/workspaces/*`
- `src/HomeOps.Contracts/openapi.json`
- `tests/HomeOps.Api.Tests/HomeOps.Api.Tests.csproj`
- `tests/HomeOps.Api.Tests/Lists/HomeOpsWebApplicationFactory.cs`
- `tests/HomeOps.Api.Tests/WidgetLayouts/*`

## Next Prompt Context
Proceed with Phase 2 Slice 2.3 Manual Events Source only. Preserve durable Lists and widget layout persistence. Do not implement event editing UI, Google Calendar integration, OAuth, authentication, multi-household support, sensors, media integrations, drag-and-drop editing, widget marketplace behavior, notifications, or offline-first synchronization in the next slice.
