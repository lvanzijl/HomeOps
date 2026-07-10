# Summary

Localized the remaining shared FamilyBoard frontend copy in scope by replacing English fallback labels, placeholder copy, accessibility copy, and calendar back-up error messaging with concise Dutch wording. Functionality, validation behavior, status roles, and destructive restore safeguards were preserved.

# Implemented changes

- Replaced the remaining English `TextWidget` fallback/type copy with Dutch.
- Replaced `PlaceholderWidget` fallback/type copy with Dutch.
- Updated shared widget catalog fallback titles and descriptions to remove placeholder/product wording and use household-friendly Dutch copy.
- Localized the shared agenda event form accessibility label.
- Updated shared calendar back-up error handling to show consistent Dutch summaries while keeping validation details available in the UI.
- Added focused frontend tests for the localized shared helper and widget fallback copy.

# English strings removed

- `Family note`
- `A cozy family space for later`
- `Coming later`
- `Calendar event conversation`
- Remaining English calendar restore error summaries in `calendarPortability.ts`

# Terminology changes

- Replaced technical `exporteren / herstellen` widget wording with `back-up en herstel`.
- Removed visible `placeholder` titles from shared widget definitions.
- Removed visible `FamilyBoard` / `gezinswidgets` fallback wording from the shared welcome text.
- Standardized shared restore messaging around `agenda-back-up` and `herstellen`.

# Accessibility verification

- Preserved existing `role="status"` and `role="alert"` behavior for restore feedback.
- Kept destructive restore confirmation copy and validation details intact.
- Localized the shared agenda form `aria-label` to Dutch without changing form behavior.

# Build verification

- Environment prepared with repository-local exports for `PACKAGE_HOME`, `DOTNET_HOME`, `DOTNET_CLI_HOME`, `NUGET_PACKAGES`, `npm_config_cache`, and `PATH`.
- `dotnet restore /home/runner/work/HomeOps/HomeOps/HomeOps.sln` ✅
- `dotnet build /home/runner/work/HomeOps/HomeOps/HomeOps.sln --no-restore` ✅
- `dotnet test /home/runner/work/HomeOps/HomeOps/HomeOps.sln --no-build` ✅ (354 passed)
- `npm test` in `/home/runner/work/HomeOps/HomeOps/src/HomeOps.Client` ✅ (210 passed)
- `npm run build` in `/home/runner/work/HomeOps/HomeOps/src/HomeOps.Client` ✅
- Existing warnings remained during verification:
  - NuGet warning `NU1903` for `SQLitePCLRaw.lib.e_sqlite3` 2.1.11 in `tests/HomeOps.Api.Tests/HomeOps.Api.Tests.csproj`
  - Vite chunk-size warning for the production frontend bundle

# Risks

- Validation detail list items still reflect backend-provided field names/messages when the API returns them; this cleanup only localized the shared frontend summary copy around those details.

# Modified files

- `src/HomeOps.Client/src/calendarPortability.ts`
- `src/HomeOps.Client/src/calendarPortability.test.ts`
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.tsx`
- `src/HomeOps.Client/src/widgets/components/PlaceholderWidget.tsx`
- `src/HomeOps.Client/src/widgets/components/PlaceholderWidget.test.tsx`
- `src/HomeOps.Client/src/widgets/components/TextWidget.tsx`
- `src/HomeOps.Client/src/widgets/components/TextWidget.test.tsx`
- `src/HomeOps.Client/src/widgets/widgetCatalog.ts`
- `docs/reports/2026-07-10-localization-cleanup/localization-cleanup.md`
