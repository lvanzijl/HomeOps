# Family Member Compact Layout

## Summary

- Cleaned up the Family Member detail page so it reads as a compact FamilyBoard detail surface rather than a separate profile landing page.
- Removed the large decorative non-avatar progress image from Riley's child-progress hero area.
- Replaced the longer back affordance with compact `Terug` navigation in the page header.
- Promoted Avatar V2 and the existing `Avatar bewerken` entry point in the member identity header.
- Moved child/parent mode controls earlier so parent controls are easier to find and useful content begins sooner.

## Preflight

- Read `.github/copilot-instructions.md`.
- Read `AGENTS.md`.
- Read the latest preview video report: `docs/reports/2026-06-28-familyboard-preview-video/familyboard-preview-video.md`.
- Read the latest relevant visual punch-list report: `docs/reports/2026-06-28-familyboard-visual-punch-list/familyboard-visual-punch-list.md`.
- Read the current Family Member implementation in `src/HomeOps.Client/src/home/FamilyMemberPage.tsx` and related CSS/tests.
- Preflight command result: `dotnet --version` returned `10.0.301`.

## Root cause analysis

- The Family Member page had a separate navigation row and a large hero-like member surface, causing navigation and decorative content to compete with member identity.
- The child progress hero included a large non-avatar decorative `childMyProgress` image inside the main progress panel. In video, this read as a huge picture on Riley's page rather than useful member identity.
- Parent/child mode controls were rendered after the child content, making parent settings and editing controls feel lower-priority than decorative and motivational content.

## Implementation plan

1. Keep routes, data loading, persistence, Avatar V2 rendering, and workflows unchanged.
2. Replace the longer back label with a compact page-header navigation affordance.
3. Convert the member hero into a compact identity header that prioritizes Avatar V2/fallback initials, member name, role/age context, and avatar editing.
4. Remove the decorative non-avatar image from the child progress hero.
5. Move child/parent mode controls above child content.
6. Update focused tests, docs/state, current phase roadmap, and this report.

## Implemented changes

- Changed the Family Member back action text from `Terug naar Thuis` to compact `Terug`.
- Replaced the previous `child-progress-hero` header class with a compact identity-header class.
- Added the existing `Avatar bewerken` action to the compact member header.
- Moved the child/parent mode switch before child-mode content.
- Removed the decorative `childMyProgress` `HomeOpsIcon` from the child progress hero.
- Tightened Family Member page/header spacing and made Family Member navigation left-aligned and visually secondary.
- Updated Family Member tests to assert the decorative progress image is gone and that the new parent/child control placement is intentional.

## Browser validation

Runtime:

- `ASPNETCORE_ENVIRONMENT=VisualReview dotnet run --project src/HomeOps.Api/HomeOps.Api.csproj --no-launch-profile --urls 'http://127.0.0.1:5108;http://127.0.0.1:5152'`
- `VITE_HOMEOPS_API_BASE_URL=http://127.0.0.1:5108 npm run dev -- --host 127.0.0.1 --port 5173`
- Fixture reset: `curl -sS -X POST http://127.0.0.1:5108/api/visual-review-fixtures/visual-full/reset`

Validation at 1920×1080:

- Home loaded from the official `visual-full` fixture.
- Riley Family Member page opened.
- Alex Family Member page opened.
- Avatar Editor entry point opened from Riley's compact header.
- Confirmed no decorative non-avatar progress image remains in the child progress hero.
- Confirmed compact `Terug` back action remains available.
- Confirmed Avatar V2 remains the primary identity visual.
- Confirmed parent/child mode controls are visible earlier.
- Confirmed no horizontal overflow on Riley or Alex pages.
- Confirmed Avatar Editor still opens.

## Test results

- `dotnet --version` → `10.0.301`.
- `cd src/HomeOps.Client && npm test -- --run src/home/FamilyMemberPage.test.tsx` → passed.
- `/tmp/pwvalidate && npx playwright test family-member-compact.spec.js --reporter=line` → passed after installing missing browser OS dependencies in the container.

## Remaining UX debt

- Family Member child-mode content still has several rich cards and could use a future density pass, but that is outside this focused blocker cleanup.
- Some support copy and mixed English fixture content remain in downstream child progress/task/motivation areas; this slice did not alter fixture data or broader localization.

## Modified files

- `src/HomeOps.Client/src/home/FamilyMemberPage.tsx`
- `src/HomeOps.Client/src/styles.css`
- `src/HomeOps.Client/src/home/FamilyMemberPage.test.tsx`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-06-28-family-member-compact-layout/family-member-compact-layout.md`

## Binary artifact confirmation

- No screenshots added.
- No PNG files added.
- No JPG/JPEG files added.
- No GIF files added.
- No WEBP files added.
- No PDF files added.
- No new binary assets added.

## Explicit answers

- Decorative non-avatar picture removed? **Yes.**
- Oversized Back button removed? **Yes.**
- Compact Back action still available? **Yes.**
- Avatar V2 is primary identity? **Yes.**
- Useful content appears earlier? **Yes.**
- Avatar Editor still opens? **Yes.**
- Backend/API/schema unchanged? **Yes.**
