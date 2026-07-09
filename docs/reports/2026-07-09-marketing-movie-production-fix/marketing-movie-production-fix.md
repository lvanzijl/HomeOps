# Summary

Restored the FamilyBoard marketing movie production path so the existing publish-mode production command completes and generates a timestamped MP4 again. The only source blocker found after installing the required browser system dependencies was the Family scene's Avatar Editor interaction: the current catalog-driven editor opens on the first category panel, so the storyboard needed to select the Accessoires panel before choosing an accessory.

# Implemented

- Updated the executable marketing storyboard Family scene to open the current catalog-driven Avatar Editor Accessoires panel before selecting the existing Haarband/Strik/Kroontje accessory option.
- Preserved the existing 9-scene marketing narrative, scene order, canonical preferred duration, validation metadata, product UI, app behavior, and Avatar Editor design.
- Produced the MP4 successfully in publish mode and removed the generated repository MP4 before finishing.

# Verified

- `node tools/marketing-recording/storyboards/marketing-preview-v1.mjs` passed.
- `MARKETING_PRODUCTION_MODE=publish npm --prefix src/HomeOps.Client run marketing:record` passed and generated `docs/demo/familyboard-preview-20260709-055653.mp4`.
- Confirmed `docs/demo/familyboard-preview-20260709-055653.mp4` existed after production.
- Removed `docs/demo/familyboard-preview-20260709-055653.mp4` from the repository working tree before finishing.
- `git status --short` showed only source/report/documentation changes after MP4 removal.

# Risks

- The production command depends on Playwright Chromium system libraries. In this container they were missing initially, so `npx --prefix src/HomeOps.Client playwright install-deps chromium` was required before publish mode could reach storyboard recording.
- The generated movie was validated for production completion only; no subjective creative review was performed.

# Modified Files

- `tools/marketing-recording/storyboards/marketing-preview-v1.mjs`
- `docs/reports/2026-07-09-marketing-movie-production-fix/marketing-movie-production-fix.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
