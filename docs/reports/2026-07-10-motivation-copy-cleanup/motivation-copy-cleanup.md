# Motivation copy cleanup

## Summary
Cleaned up Product Owner/developer-facing and abstract storytelling copy in the Motivation experience while keeping the existing layout, behavior, progress tracking, celebrations, appreciation flows, accessibility, and feedback states intact.

## Implemented changes
- Renamed the family-goal eyebrow to use direct household language.
- Shortened the family-goal supporting progress copy.
- Replaced the stats dialog description with concrete progress wording.
- Renamed celebration-story wording to concrete celebration wording.
- Simplified celebration memory summary copy to remove story-framework wording.
- Simplified the appreciation dialog close-button accessibility label by removing the implementation term `dialog`.
- Added Motivation/HelpfulMoments test assertions for the updated copy.

## Exact text removed
- `Gedeeld familiekompas`
- `Elke kleine stap laat zien waar jullie als gezin samen naartoe groeien.`
- `Ondersteunend bewijs bij jullie gedeelde verhaal.`
- `Vieringsverhaal`
- `herinneringen voor jullie verhaal`
- `Waardering sluiten dialog`

## Exact text renamed
- `Gedeeld familiekompas` → `Familiedoel`
- `Waarom dit ertoe doet` → `Volgende stap`
- `Elke kleine stap laat zien waar jullie als gezin samen naartoe groeien.` → `Elke stap brengt jullie dichter bij samen vieren.`
- `Ondersteunend bewijs bij jullie gedeelde verhaal.` → `Voortgang per onderdeel.`
- `Vieringsverhaal` → `Gezinsviering`
- `{n} herinneringen voor jullie verhaal` → `{n} herinneringen om te bewaren`
- `Waardering sluiten dialog` → `Waardering sluiten`

## Accessibility verification
- Preserved Motivation and Helpful Moments dialog roles, accessible names, and close controls.
- Kept existing loading, validation, error, and feedback copy intact.
- Verified the simplified appreciation close-button label remains discoverable through the updated HelpfulMoments test.
- Verified the updated Motivation copy through rendered UI assertions without changing page structure or interaction flow.

## Build verification
Environment prepared with repository-local exports for `PACKAGE_HOME`, `DOTNET_HOME`, `DOTNET_CLI_HOME`, `NUGET_PACKAGES`, `npm_config_cache`, and `PATH`.

Commands run:
- `dotnet restore HomeOps.sln`
- `dotnet build HomeOps.sln --no-restore`
- `cd src/HomeOps.Client && npm ci`
- `cd src/HomeOps.Client && npm test`
- `cd src/HomeOps.Client && npm run build`

Results:
- `dotnet restore HomeOps.sln` passed.
- `dotnet build HomeOps.sln --no-restore` passed with the existing `NU1903` warning for `SQLitePCLRaw.lib.e_sqlite3` 2.1.11 in `tests/HomeOps.Api.Tests/HomeOps.Api.Tests.csproj`.
- `npm test` passed: 32 test files, 205 tests.
- `npm run build` passed with the existing Vite chunk-size warning for the main frontend bundle.

## Risks
- Motivation copy assertions are intentionally more specific now, so future wording changes in this surface will require test updates.
- The existing .NET dependency vulnerability warning remains outside this copy-only scope.
- The existing Vite chunk-size warning remains outside this copy-only scope.

## Modified files
- `src/HomeOps.Client/src/MotivationPage.tsx`
- `src/HomeOps.Client/src/HelpfulMoments.tsx`
- `src/HomeOps.Client/src/MotivationPage.test.tsx`
- `src/HomeOps.Client/src/HelpfulMoments.test.tsx`
- `docs/reports/2026-07-10-motivation-copy-cleanup/motivation-copy-cleanup.md`
