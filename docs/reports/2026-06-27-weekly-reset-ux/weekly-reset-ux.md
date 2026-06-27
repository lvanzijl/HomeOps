# Weekly Reset UX Ritual Report

## Summary
Weekly Reset was redesigned from a maintenance-style review panel into a deliberate Dutch family ritual centered on the question: “Zijn we klaar voor volgende week?”. The implementation is presentation-only and keeps existing Weekly Reset data loading, task actions, goal archive calls, skip/reopen behavior, undo availability, backend behavior, API contracts, database schema, and task logic unchanged.

## Preflight analysis
- Read `.github/copilot-instructions.md` and repo-level `AGENTS.md` instructions.
- Executed required preflight:
  - `export DOTNET_CLI_HOME=/tmp/dotnet`
  - `export PATH="$PATH:$HOME/.dotnet/tools"`
  - `dotnet --version`
- Result: `10.0.301`.
- Reviewed the existing Weekly Reset frontend page, API wrapper, generated API endpoints, task API actions, Tasks contextual entry point, existing tests, and prior state/roadmap documentation.
- Backend/API review confirmed the Weekly Reset endpoint shape remains `GET /api/weekly-reset` plus the existing family-goal archive endpoint. No backend edits were made.
- Existing undo behavior is outside Weekly Reset execution and remains unchanged; the redesigned UI explicitly explains that undo remains available where it already exists.

## Root cause analysis
Weekly Reset already gathered the right MVP information, but the page framed it as a compact maintenance checklist: loose tasks, goal checks, shopping cleanup, and recap. The root UX issue was framing and hierarchy, not behavior. Families needed a guided ritual that explains what is complete, what moves forward, what gets refreshed, and what stays unchanged without introducing new workflow logic.

## Implementation plan
1. Preserve all existing data calls and action handlers.
2. Reframe the hero around family readiness for next week.
3. Add summary cards for completed work, rollover decisions, and continuing agreements.
4. Add an intentional explanation card clarifying what changes, what stays, recurring behavior, completed-task behavior, and undo availability.
5. Restyle Weekly Reset cards to feel calm, optimistic, family-first, and touch-friendly.
6. Update focused Weekly Reset tests and documentation.
7. Validate in browser at 1366×768 and 1920×1080 using browser inspection.

## Implemented changes
- Replaced the technical “Weekly Reset” hero with a family-readiness question and Dutch ritual guidance.
- Added three readiness cards: afgeronde taken, keuzes voor volgende week, and gezinsafspraken.
- Added a family guidance card explaining recurring tasks, open tasks, completed tasks, and undo availability without warning-dialog language.
- Reframed task, goal, shopping, and recap sections as FamilyBoard-style ritual cards.
- Converted skip confirmation into a positive, non-destructive confirmation state.
- Kept task action handlers, goal archive handlers, data refresh, and skip/reopen state behavior unchanged.
- Updated Weekly Reset regression tests for ritual language and confirmation behavior.
- Updated current state and Phase 2 roadmap documentation.

## Browser validation
Browser validation was completed with Playwright/Chromium against the Vite dev server using intercepted API responses matching existing Weekly Reset payload shape. No screenshots were retained.

Validated:
- 1366×768
- 1920×1080

Verified by browser inspection:
- Reset workflow is understandable through the readiness cards and section headings.
- Confirmation/skip flow explains that nothing changes when skipped.
- Undo remains called out as available where it already exists.
- Existing reset behavior is preserved because the same frontend API functions and action handlers are still used.
- FamilyBoard visual language is maintained through warm cards, rounded surfaces, pill metadata, and touch-sized actions.

## Browser measurements
### 1366×768
- Page title inspected: `Zijn we klaar voor volgende week?`
- Hero size: 1020×203 px
- Weekly Reset card count: 5
- Minimum Weekly Reset button height: 44 px
- Skip confirmation visible: PASS
- Reopen after skip restored Weekly Reset: PASS

### 1920×1080
- Page title inspected: `Zijn we klaar voor volgende week?`
- Hero size: 1020×217 px
- Weekly Reset card count: 5
- Minimum Weekly Reset button height: 44 px
- Skip confirmation visible: PASS
- Reopen after skip restored Weekly Reset: PASS

## Acceptance criteria (PASS/FAIL)
- Weekly Reset became a family ritual instead of a maintenance screen: PASS.
- Reset behavior remained unchanged: PASS.
- Undo remained unchanged: PASS.
- Backend/API/schema remained unchanged: PASS.
- All user-facing Weekly Reset UI is Dutch: PASS.
- No backend changes: PASS.
- No API contract changes: PASS.
- No database schema changes: PASS.
- No reset logic changes: PASS.
- No task completion behavior changes: PASS.
- No binary assets introduced: PASS.
- No screenshots retained: PASS.
- Report created in the required directory: PASS.

## Validation results
- `npm test -- --run src/weeklyReset/WeeklyResetPage.test.tsx src/workspaces/WorkspaceShell.test.tsx`: PASS.
- `npm run build`: PASS, with existing Vite chunk-size warning.
- `git diff --check`: PASS.
- `npm run | grep -q '^  lint'`: PASS for check execution; no lint script is configured.
- `node /tmp/homeops-browser/validate-weekly-reset.js`: PASS after installing Playwright browser dependencies in `/tmp`; no repo files were created by that validation.
- Attempted API-backed browser validation via `dotnet run --project src/HomeOps.Api/HomeOps.Api.csproj --urls http://127.0.0.1:5186`: BLOCKED because Docker is unavailable and PostgreSQL on `localhost:5432` was not running.

## Remaining UX debt
- Weekly Reset still relies on existing review candidate data; richer “what will reset” details are limited by current backend semantics.
- Goal “Gaat mee” remains a no-op confirmation, matching existing behavior; a future slice could add explicit acknowledgement state if product logic is allowed.
- Shopping review still only presents candidates; actual shopping cleanup actions remain outside this slice.

## Future compatibility assessment
The redesign remains compatible with future Weekly Reset expansion because it groups existing data into ritual concepts rather than widget-specific or backend-specific models. Future slices can add explicit reset execution, richer recurring-task summaries, or shopping decisions into the existing card structure without changing the current API contract.

## Recommended next slice
Add an explicit Weekly Reset completion/ritual-close moment only if backend/product logic changes are allowed. If presentation-only work continues, the next slice should refine shopping review decisions inside the existing Shopping domain rather than adding new Weekly Reset logic.

## Modified files
- `src/HomeOps.Client/src/weeklyReset/WeeklyResetPage.tsx`
- `src/HomeOps.Client/src/styles.css`
- `src/HomeOps.Client/src/weeklyReset/WeeklyResetPage.test.tsx`
- `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx`
- `src/HomeOps.Client/src/workspaces/WorkspaceShell.test.tsx`
- `src/HomeOps.Client/src/workspaces/workspaceModel.ts`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-06-27-weekly-reset-ux/weekly-reset-ux.md`

## Binary artifact confirmation
No PNG, JPG, JPEG, GIF, WEBP, or PDF files were added or modified in this slice. Existing historical binary artifacts under `docs/reports/` were observed but not changed. Temporary browser validation files were created under `/tmp/homeops-browser`, outside the repository.
