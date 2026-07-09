# Summary

Implemented the Shared Avatar Catalog Source consolidation infrastructure slice. The avatar catalog now has one source-controlled JSON definition consumed by both the ASP.NET Core backend and the React/Vite frontend without changing AvatarSelection persistence, API contracts, renderer behavior, editor layout, catalog IDs, localization labels, or accessibility labels.

# Implemented

- Added `src/shared/avatar-catalog.json` as the canonical Avatar Catalog definition containing schema metadata, categories, palettes, editor panels, option groups, catalog items, localization metadata, accessibility metadata, presentation metadata, renderer bindings, stable IDs, defaults, and SchemaVersion.
- Replaced the frontend in-code catalog definitions with consumption of the shared JSON source while keeping existing TypeScript catalog models, lookup helpers, selection normalization, editor panel helpers, and Avatar V2 adapter behavior intact.
- Replaced the backend local code-defined catalog source with a shared JSON catalog source that deserializes the bundled catalog at startup and continues to run existing backend catalog validation.
- Updated backend project content configuration so the shared JSON catalog is copied into API build/publish output.
- Updated focused backend catalog tests to validate against the shared expanded catalog source.

# Verified

- `dotnet test tests/HomeOps.Api.Tests/HomeOps.Api.Tests.csproj --filter AvatarCatalogTests`
- `cd src/HomeOps.Client && npm test -- src/avatarCatalog/avatarCatalog.test.ts src/avatarCatalog/avatarCatalogAdapter.test.ts src/home/FamilyAvatarEditor.test.tsx src/avatarV2/avatarConfig.test.ts src/avatarV2/avatarV2.test.ts`
- `cd src/HomeOps.Client && npm run build`

# Risks

- The shared JSON file is intentionally data-heavy because it now contains the complete catalog surface. Future catalog edits should modify this file directly and rely on backend/frontend validation to catch accidental ID, localization, accessibility, renderer-binding, or default-selection regressions.
- Backend validation consumes the same catalog definition but does not expose a catalog API; this preserves the approved infrastructure-only scope while keeping frontend catalog consumption build-time/local.

# Modified Files

- `src/shared/avatar-catalog.json`
- `src/HomeOps.Api/AvatarCatalog/AvatarCatalogModels.cs`
- `src/HomeOps.Api/AvatarCatalog/SharedAvatarCatalogSource.cs`
- `src/HomeOps.Api/HomeOps.Api.csproj`
- `src/HomeOps.Api/Program.cs`
- `src/HomeOps.Client/src/avatarCatalog/avatarCatalog.ts`
- `tests/HomeOps.Api.Tests/Lists/AvatarCatalogTests.cs`
- `docs/reports/2026-07-08-avatar-shared-catalog-source/avatar-shared-catalog-source.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
