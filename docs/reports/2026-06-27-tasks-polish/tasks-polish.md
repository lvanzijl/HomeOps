# Summary

Tasks polish reduced visible card action noise while preserving the MVP workflow. Task cards now keep the high-frequency actions visible (`Klaar` and eligible `Morgen`) and move lower-frequency actions (`Aanpassen`, `Routine verwijderen`) behind `Meer`. A compact Vandaag summary now provides immediate orientation beneath the hero, and Afgerond is now collapsed by default as a low-weight history/recovery section.

# Preflight analysis

- `.github/copilot-instructions.md` and `AGENTS.md` were read before implementation.
- Required .NET preflight succeeded with `10.0.301`:

```bash
export DOTNET_CLI_HOME=/tmp/dotnet
export PATH="$PATH:$HOME/.dotnet/tools"
dotnet --version
```

- Reviewed `docs/reports/2026-06-27-tasks-ux-review/tasks-ux-review.md`.
- Reviewed the current `TasksPage` implementation, task grouping, task card action layout, and related task CSS.
- The UX review identified three polish candidates in scope for this slice: excessive visible action density, lack of a Today workload summary, and excessive visual weight for Afgerond.
- Existing task behavior was already implemented through frontend handlers and API helpers; this slice intentionally kept those handlers unchanged.

# Root cause analysis

Task cards exposed every action at the same visual level. `Klaar`, `Morgen`, `Aanpassen`, and recurring-series removal all competed in the card action row, so the two most common operational decisions were not as dominant as they should be. The page also required users to infer Today's workload from the Vandaag section itself, and Afgerond rendered like another full time group even though it is secondary recovery/history content.

# Implementation plan

1. Keep task grouping, completion, Morgen, recurrence, Weekly Reset, backend, API contracts, and database behavior unchanged.
2. Derive compact Vandaag summary counts from already-loaded frontend task/group data.
3. Add a small Dutch summary strip beneath the Tasks hero for today, overdue, and routine counts.
4. Keep `Klaar` and eligible `Morgen` as visible card buttons.
5. Move `Aanpassen` and `Routine verwijderen` into a `Meer` disclosure on each card.
6. Render Afgerond as a collapsed-by-default history section while preserving the existing task card and Terugzetten behavior inside it.
7. Apply minor CSS polish for summary chips, More disclosure rhythm, and compact completed-history presentation.
8. Validate with build, focused Tasks tests, browser inspection at `1366×768` and `1920×1080`, `git diff --check`, and binary scans.

# Implemented changes

- Added a `todaySummary` derivation in `TasksPage` that reuses current grouped tasks to count today's tasks, overdue tasks, and recurring tasks.
- Added a compact `Vandaag in beeld` summary strip directly below the Tasks hero.
- Extracted task card rendering into `TaskCard` to centralize the new action hierarchy.
- Kept `Klaar` and eligible `Morgen` visible as primary actions.
- Moved `Aanpassen` and recurring `Routine verwijderen` behind `Meer` while preserving their existing handlers.
- Converted Afgerond into a collapsed `details` history section with the existing completed cards inside.
- Added CSS for the Today summary, More disclosure, and compact completed-history state.
- Updated current state and Phase 2 roadmap documentation.

# Before vs After measurements

Measurements were taken with the same route-intercepted browser validation dataset used in the Tasks UX review: 8 cards across Vandaag, Morgen, Deze week, Volgende week, Later, and Afgerond.

| Metric | Before | After |
|---------|--------|-------|
| Visible action buttons | 29 card action buttons | 13 visible primary card buttons plus 8 `Meer` disclosures |
| Vandaag height | 599.81 px | 599.81 px |
| Afgerond default state | Expanded full group, 252.53 px | Collapsed history, 80.59 px |

Additional after measurements:

| Viewport | Document height | Today summary | Visible primary buttons | More disclosures | Afgerond state |
| --- | ---: | --- | ---: | ---: | --- |
| 1366×768 | 2103 px | `Vandaag in beeld3 taken1 te laat1 routine`, 40.41 px tall | 13 | 8 | Collapsed, 80.59 px |
| 1920×1080 | 2103 px | `Vandaag in beeld3 taken1 te laat1 routine`, 40.41 px tall | 13 | 8 | Collapsed, 80.59 px |

After interaction checks at both viewports:
- Completion request count: `1`.
- Morgen update request count: `1`.
- Today summary updated to `Vandaag in beeld1 taak0 te laat1 routine` after completing one overdue task and moving one due-today task to Morgen.
- Afgerond remained collapsed by default after interactions.

# Browser validation

Browser validation was performed against the Vite app at `http://127.0.0.1:5173/` using Playwright/Chromium and route-intercepted API-shaped responses.

Validated at `1366×768` and `1920×1080`:
- Tasks navigation opened the Tasks workspace.
- Today summary was visible directly beneath the hero.
- Vandaag, Morgen, Deze week, Volgende week, Later, and Afgerond rendered.
- Visible primary card button count was reduced to 13 with 8 `Meer` disclosures for secondary card actions.
- Afgerond was collapsed by default.
- Completion still worked and issued the existing complete request.
- Morgen still worked and issued the existing update request.
- Recurring behavior stayed presentation-only: the recurring task still displayed recurrence metadata and did not expose Morgen.
- First viewport composition contained the Tasks hero, Today summary, and Vandaag section at 1366×768; at 1920×1080 it also included the start of Morgen.

# Acceptance criteria (PASS/FAIL)

- Action density reduced: **PASS** — visible card action buttons dropped from 29 to 13, with lower-frequency actions moved behind `Meer`.
- Vandaag summary improved orientation: **PASS** — compact today/overdue/routine counts appear beneath the hero.
- Afgerond became visually secondary: **PASS** — default Afgerond height dropped from 252.53 px to 80.59 px and is collapsed.
- Completion behavior remained unchanged: **PASS** — completion still calls the existing complete flow.
- Morgen behavior remained unchanged: **PASS** — eligible normal tasks still move to tomorrow through the existing update flow.
- Recurring behavior remained unchanged: **PASS** — no recurring single-occurrence postponement was introduced.
- Weekly Reset behavior remained unchanged: **PASS** — no Weekly Reset logic was changed.
- Backend/API/schema remained unchanged: **PASS** — no backend, generated API contract, or database schema files were modified.
- User-facing UI remains Dutch: **PASS**.
- No binary assets or screenshots introduced: **PASS**.

# Validation results

- PASS: `export DOTNET_CLI_HOME=/tmp/dotnet; export PATH="$PATH:$HOME/.dotnet/tools"; dotnet --version` returned `10.0.301`.
- PASS: `npm run build` completed successfully; Vite emitted the existing chunk-size warning.
- PASS: `npm test -- --run src/tasks/taskGrouping.test.ts src/tasks/TasksPage.test.tsx` completed with 2 files and 10 tests passing.
- PASS: `node /tmp/tasks-polish-validation.mjs` completed browser validation at `1366×768` and `1920×1080`.
- PASS: `git diff --check` completed without whitespace errors.
- PASS: binary artifact scans found no added PNG, JPG, JPEG, GIF, WEBP, or PDF files.

# Remaining UX debt

- Recurring single-occurrence postponement remains the largest Tasks workflow gap and still needs product/API design in a future slice.
- `Meer` is a presentation disclosure, not a production-grade menu component; a later design-system slice should normalize menu behavior across workspaces.
- The Today section height did not shrink with this slice because card layout and grouping were intentionally preserved.
- Placeholder letter icons should still be replaced by the future FamilyBoard SVG asset library.

# Modified files

- `src/HomeOps.Client/src/tasks/TasksPage.tsx`
- `src/HomeOps.Client/src/styles.css`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-06-27-tasks-polish/tasks-polish.md`

# Binary artifact confirmation

No binary files were added. No screenshots were created or committed. No PNG, JPG, JPEG, GIF, WEBP, or PDF artifacts were added by this slice.

# Explicit answers

- Action density was reduced: **yes**.
- Vandaag summary improved orientation: **yes**.
- Afgerond became visually secondary: **yes**.
- All task behavior remained unchanged: **yes** for completion, Morgen, recurrence, editing, recurring-series deletion, and Weekly Reset behavior.
- Backend/API/schema remained unchanged: **yes**.
- Recommended next slice: design recurring single-occurrence postponement with an explicit backend/API contract, or normalize `Meer`/menu behavior through the design system before adding more card actions.
