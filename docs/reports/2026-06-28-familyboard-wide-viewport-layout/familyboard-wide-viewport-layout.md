# FamilyBoard Wide Viewport Layout

## Summary

- Improved the global FamilyBoard shell so desktop layouts use significantly more horizontal space at `1920×1080` without introducing fullscreen mode, user settings, new pages, or page redesigns.
- Preserved laptop comfort by keeping the responsive shell near the previous width at `1366×768`.
- Protected Settings and dialogs from becoming wide document/form surfaces.
- No backend behavior, API contracts, database schema, business logic, workflows, navigation, VisualReview runtime, fixture data, screenshots, videos, or binary assets were changed.

## Preflight

Read before implementation:

- `.github/copilot-instructions.md`
- `AGENTS.md`
- Latest preview video report: `docs/reports/2026-06-28-familyboard-preview-video/familyboard-preview-video.md`
- Latest Family Member compact layout report: `docs/reports/2026-06-28-family-member-compact-layout/family-member-compact-layout.md`
- Current workspace shell implementation: `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx`
- Global layout CSS: `src/HomeOps.Client/src/styles.css`
- Home, Agenda, Tasks, Shopping, Motivation, Weekly Reset, Family Member, and Settings layout implementations/CSS.

Preflight command:

- `export DOTNET_CLI_HOME=/tmp/dotnet`
- `export PATH="$PATH:$HOME/.dotnet/tools"`
- `dotnet --version` → `10.0.301`

## Root cause analysis

- The actual global constraint was `.app-shell { max-width: 1040px; }`, which capped the whole application shell before page-level layouts had a chance to use large desktop space.
- At `1920×1080`, that fixed cap left roughly `440px` of unused margin on each side before this slice, making the product read like a centered document rather than a dashboard.
- `.workspace-panel` inherited the app-shell limit and therefore every page, including Home, Agenda, Tasks, Shopping, Motivation, Family Member, Weekly Reset, and Settings, was globally constrained.
- Page-level grids were not the primary root cause. Agenda, Motivation, Shopping, Tasks, and Weekly Reset already had internal grids or responsive structures, but they were starved by the outer shell.
- Home's summary grid stayed at two columns, so simply widening the shell would have made Home cards grow too wide instead of using additional columns.
- Dialogs already had explicit `max-width` rules, so they did not need to inherit the wider board width.
- Settings required explicit protection because administrative restore/export content should remain a readable form-like surface rather than stretch to the full dashboard width.

## Implementation plan

1. Add global board width tokens at the design-system level.
2. Replace the fixed `1040px` app-shell cap with a responsive `clamp()`-based board width.
3. Keep workspace panels safe in wider grids with `box-sizing` and `min-width: 0`.
4. Add a Settings-specific readable width constraint.
5. Let Home use more columns on wide desktops before cards become oversized.
6. Validate official VisualReview fixtures at `1366×768` and `1920×1080`.
7. Update state/roadmap documentation and write this report.

## Implemented changes

- Added `--board-max-width`, `--board-edge-padding`, and `--readable-panel-width` CSS tokens.
- Changed `.app-shell` from fixed `1040px` to `max-width: clamp(65rem, 78vw, 94rem)` with responsive horizontal padding and full-width sizing.
- Added workspace panel sizing safeguards with `box-sizing: border-box` and `min-width: 0`.
- Added `.workspace-panel-settings` with a readable `64rem` maximum width and centered alignment.
- Removed the Motivation-only app-shell widening override because the global shell now owns this behavior.
- Added a wide-desktop Home summary grid rule so Home uses four columns at `1180px+` instead of stretching two large cards.

## Browser validation

Runtime:

- API: `ASPNETCORE_ENVIRONMENT=VisualReview dotnet run --project src/HomeOps.Api/HomeOps.Api.csproj --no-launch-profile --urls 'http://127.0.0.1:5108;http://127.0.0.1:5152'`
- Frontend: `VITE_HOMEOPS_API_BASE_URL=http://127.0.0.1:5108 npm run dev -- --host 127.0.0.1 --port 5173`
- Fixture reset for normal pages: `curl -sS -X POST http://127.0.0.1:5108/api/visual-review-fixtures/visual-full/reset`
- Fixture reset for Weekly Reset: `curl -sS -X POST http://127.0.0.1:5108/api/visual-review-fixtures/visual-weekly-reset/reset`

Validated pages at `1366×768` and `1920×1080`:

- Home
- Agenda Month
- Agenda Week
- Agenda List
- Tasks
- Shopping
- Motivation
- Family Member
- Weekly Reset
- Settings

Validation result:

- No horizontal overflow was detected on any validated page at either viewport.
- The shell is noticeably wider at `1920×1080`.
- Home remains balanced because summary cards move to four columns on wide desktops.
- Agenda remains readable with the month/workspace grid using the new available width.
- Tasks remain readable; the page is still vertically long but not horizontally exhausting.
- Shopping remains comfortable; the primary shopping workspace uses the wider shell without overflowing.
- Motivation remains balanced and no longer needs a special app-shell width exception.
- Family Member compact layout is preserved; no page-specific Family Member behavior changed.
- Weekly Reset remains readable; it remains a long ritual surface by design.
- Settings stays constrained to a readable panel width at `1920×1080`.
- Dialog width rules remain constrained by existing explicit max-width CSS.

## Measurements

| Viewport | Page | Shell width | Outer margin | Panel width | Document height | Horizontal overflow |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| 1366×768 | Home | 1065px | 150px | 1022px | 768px | No |
| 1366×768 | Agenda Month | 1065px | 150px | 1022px | 880px | No |
| 1366×768 | Agenda Week | 1065px | 150px | 1022px | 768px | No |
| 1366×768 | Agenda List | 1065px | 150px | 1022px | 878px | No |
| 1366×768 | Tasks | 1065px | 150px | 1022px | 1929px | No |
| 1366×768 | Shopping | 1065px | 150px | 1022px | 1225px | No |
| 1366×768 | Motivation | 1065px | 150px | 1022px | 768px | No |
| 1366×768 | Family Member | 1065px | 150px | 1022px | 3489px | No |
| 1366×768 | Settings | 1065px | 150px | 1022px | 768px | No |
| 1366×768 | Weekly Reset | 1065px | 150px | 1022px | 1889px | No |
| 1920×1080 | Home | 1498px | 211px | 1450px | 1080px | No |
| 1920×1080 | Agenda Month | 1498px | 211px | 1450px | 1080px | No |
| 1920×1080 | Agenda Week | 1498px | 211px | 1450px | 1080px | No |
| 1920×1080 | Agenda List | 1498px | 211px | 1450px | 1080px | No |
| 1920×1080 | Tasks | 1498px | 211px | 1450px | 1929px | No |
| 1920×1080 | Shopping | 1498px | 211px | 1450px | 1225px | No |
| 1920×1080 | Motivation | 1498px | 211px | 1450px | 1080px | No |
| 1920×1080 | Family Member | 1498px | 211px | 1450px | 4005px | No |
| 1920×1080 | Settings | 1498px | 211px | 1024px | 1080px | No |
| 1920×1080 | Weekly Reset | 1498px | 211px | 1450px | 1889px | No |

## Test results

- `dotnet --version` → `10.0.301`.
- `cd src/HomeOps.Client && npm run build` → passed. Vite reported the existing large chunk warning.
- `node /tmp/pw-wide/wide-validate.mjs` → passed after installing Playwright Chromium system dependencies in the container; validated `visual-full` and `visual-weekly-reset` at both requested viewport sizes.
- `git diff --check` → passed.

## Remaining UX debt

- Tasks, Family Member, Shopping, and Weekly Reset remain vertically long at desktop sizes. This slice intentionally fixed the global shell width and did not redesign page-specific UX.
- Family Member content height increased at `1920×1080` because the wider shell lets some rich child-workspace areas use larger internal wide-layout geometry. The compact header/back/navigation changes remain preserved; a future Family Member density slice can address vertical height separately if needed.
- Settings is now protected from stretching, but the Settings content itself remains a utilitarian administrative surface.

## Modified files

- `src/HomeOps.Client/src/styles.css`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-06-28-familyboard-wide-viewport-layout/familyboard-wide-viewport-layout.md`

## Binary artifact confirmation

- No screenshots added.
- No videos added.
- No PNG files added.
- No JPG/JPEG files added.
- No GIF files added.
- No WEBP files added.
- No PDF files added.
- No new binary assets added.

## Explicit answers

- Does FamilyBoard use more width at `1920×1080`? **Yes.** The shell measured `1498px` wide instead of being capped at the previous `1040px`.
- Does `1366×768` remain usable? **Yes.** The shell measured `1065px`, close to the previous cap, and no horizontal overflow was detected.
- Is horizontal overflow absent? **Yes.** All validated pages reported no horizontal overflow at both tested viewports.
- Does Home still feel balanced? **Yes.** Home uses four summary columns on wide desktop rather than stretching two oversized cards.
- Are dense pages still readable? **Yes.** Agenda, Tasks, Shopping, Motivation, Family Member, and Weekly Reset remained readable with no horizontal overflow. Some remain vertically long, which is separate UX debt.
- Are Settings and dialogs still appropriately constrained? **Yes.** Settings measured `1024px` panel width at `1920×1080`, and existing dialog `max-width` rules remain in place.
- Backend/API/schema unchanged? **Yes.** Only frontend CSS and documentation changed.
