# Shopping Layout Density Follow-up

## Summary

This slice refined layout density only. The Shopping workspace keeps the validated shopping workflow intact, while the primary view now presents the hero, a compact Quick Add surface, and store cards before secondary content. Browser measurements confirm the Quick Add panel is compact and the default document height is reduced.

## Preflight analysis

- Instructions reviewed: `.github/copilot-instructions.md`, `AGENTS.md`, the current Shopping implementation, the previous redesign report, and the browser validation follow-up report.
- Required .NET preflight command passed with `10.0.301`:

```bash
export DOTNET_CLI_HOME=/tmp/dotnet
export PATH="$PATH:$HOME/.dotnet/tools"
dotnet --version
```

- The previous validation report confirmed behaviour but measured a density issue: document height about `2147 px`, Quick Add panel about `934 px`, and Other Lists about `683 px` when expanded.
- Current implementation review showed the primary `ListSurface` bundled Quick Add, store cards, completed items, list management, and deleted lifecycle sections in the same visual panel.

## Root cause analysis

The Quick Add panel was tall because it contained more than Quick Add. It rendered the complete primary list surface inside the Quick Add card, so active store cards and lifecycle sections were measured as part of Quick Add. Other Lists remained correct functionally, but expanded content could dominate the document. Completed and recently deleted lifecycle content also consumed persistent page space in the primary scan path.

## Implementation plan

1. Split the primary Shopping list presentation into compact Quick Add, active store workspace, and lifecycle workspace modes without changing API calls or item behaviour.
2. Keep store grouping immediately after Quick Add and reduce compact store cards to three visible rows before expansion.
3. Keep Other Lists and lifecycle content accessible but visually secondary and collapsed by default where appropriate.
4. Update focused Shopping tests only where the DOM structure changed.
5. Re-run build, focused Shopping tests, real-browser validation at `1366×768` and `1920×1080`, whitespace checks, diff review, and binary-artifact scan.

## Implemented changes

- Added primary list render modes so Quick Add now renders only the existing add form, store cards render in their own active workspace, and lifecycle controls render in a compact secondary workspace.
- Reduced store-card default rows from four to three before the existing complete-list expander, improving card density while preserving expand/collapse access.
- Added CSS for compact Quick Add, active store workspace, and compact lifecycle details.
- Updated focused Shopping tests to target the Quick Add form and lifecycle management surface by their explicit accessible names.
- Added a browser validation script for this density slice.

## Before vs After measurements

Measured in Chromium at `1366×768`; after values are the default dense state after Quick Add adds `Pasta`, before expanding Other Lists or lifecycle sections.

| Metric | Before | After |
|---------|--------|-------|
| Document height | ~2147 px | 1566 px |
| Quick Add height | ~934 px | 122.77 px |
| Other Lists height | ~683 px | 178.50 px collapsed default |
| Store card height | 413.36 px for full AH/Etos/Market cards; 116.16 px for Zonder winkel | 328.77 px for AH/Etos/Market cards; 116.16 px for Zonder winkel |

## Browser validation

Command:

```bash
PLAYWRIGHT_PACKAGE_PATH=/tmp/pwvalidate/node_modules/playwright node docs/reports/2026-06-27-shopping-layout-density/shopping-layout-density-validation.mjs
```

The validation used route-intercepted API-shaped responses against the Vite dev server at `http://127.0.0.1:5173/` and exercised the real DOM in Chromium.

### 1366×768

- Quick Add focus: PASS.
- Quick Add add flow: PASS; POST to `/api/lists/shopping-list-id/items` observed and `Pasta` appeared.
- Preferred-store grouping: PASS; store labels were `Albert Heijn`, `Etos`, `Market`, `Zonder winkel`.
- Store counts: PASS; Albert Heijn moved `5 open → 4 open → 5 open`; Etos moved `1 open → 0 open → 1 open`.
- Expand/collapse: PASS; Albert Heijn hidden items were `2`, expanded to `2`, and collapsed again.
- Check-off/undo/remove/undo: PASS; toggle, undo, delete, and restore API calls were observed.
- Other Lists: PASS; `Vakantie` expanded and accepted `Zonnebrand` through its existing add flow.
- Distraction scan: PASS; no Smart Suggestions, `Bijna op`, or gamification text was present.
- Measurements: document `1566 px`, workspace `1439.64 px`, hero `170 px`, Quick Add `122.77 px`, Other Lists collapsed `178.50 px`, lifecycle collapsed `178.50 px`, store workspace `515.70 px`.
- Scrolling: required at `1366×768`, but the first viewport presents hero, Quick Add, and the top of the store workspace.

### 1920×1080

- Quick Add focus: PASS.
- Quick Add add flow: PASS; POST to `/api/lists/shopping-list-id/items` observed and `Pasta` appeared.
- Preferred-store grouping: PASS; store labels were `Albert Heijn`, `Etos`, `Market`, `Zonder winkel`.
- Store counts: PASS; Albert Heijn moved `5 open → 4 open → 5 open`; Etos moved `1 open → 0 open → 1 open`.
- Expand/collapse: PASS; Albert Heijn hidden items were `2`, expanded to `2`, and collapsed again.
- Check-off/undo/remove/undo: PASS; toggle, undo, delete, and restore API calls were observed.
- Other Lists: PASS; `Vakantie` expanded and accepted `Zonnebrand` through its existing add flow.
- Distraction scan: PASS; no Smart Suggestions, `Bijna op`, or gamification text was present.
- Measurements: document `1566 px`, workspace `1439.64 px`, hero `170 px`, Quick Add `122.77 px`, Other Lists collapsed `178.50 px`, lifecycle collapsed `178.50 px`, store workspace `515.70 px`.
- Scrolling: required at `1920×1080` for the full page, but hero, Quick Add, and store workspace are visible within the first viewport.

## Acceptance criteria (PASS/FAIL)

- Quick Add became compact: PASS (`122.77 px`, target `100–160 px`).
- Store cards became the primary visual focus: PASS; active store workspace appears immediately after Quick Add.
- Other Shopping Lists became secondary: PASS; collapsed default height is `178.50 px`, and the expanded state remains available.
- Completed/deleted lifecycle sections do not permanently dominate vertical space: PASS; lifecycle controls are compact collapsed details.
- Shopping behaviour remained unchanged: PASS; add, store grouping, check-off, undo, remove, and other-list add flows were browser validated.
- Backend/API/schema remained unchanged: PASS; no backend, contract, schema, or persistence files were modified.
- No Smart Suggestions, `Bijna op`, rewards, or gamification were introduced: PASS.

## Validation results

- Frontend build: PASS with the existing Vite chunk-size warning.
- Focused Shopping tests: PASS (`8/8`).
- Browser validation: PASS at `1366×768` and `1920×1080`.
- Git whitespace check: PASS.
- Binary artifact scan: PASS; no PNG, JPG, JPEG, GIF, WEBP, or PDF files were added.

## Remaining UX debt

- The full page still scrolls because store cards, recent items, other lists, and lifecycle controls remain available on the same workspace. This is acceptable for this slice because the first viewport now prioritizes hero, compact Quick Add, and store cards.
- Other Lists still become tall when deliberately expanded. That is intentional for accessibility of secondary lists, but a future slice could refine expanded secondary-list density.

## Modified files

- `src/HomeOps.Client/src/widgets/components/ShoppingListWidget.tsx`
- `src/HomeOps.Client/src/widgets/components/ShoppingListWidget.test.tsx`
- `src/HomeOps.Client/src/styles.css`
- `docs/reports/2026-06-27-shopping-layout-density/shopping-layout-density-validation.mjs`
- `docs/reports/2026-06-27-shopping-layout-density/shopping-layout-density.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

## Binary artifact confirmation

No binary artifacts were added. No screenshots were committed. No temporary browser screenshots remain in the repository. The binary scan found no added `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, or `.pdf` files.

## Explicit answers

- Quick Add became compact: yes, it measured `122.77 px` in browser validation.
- Store cards became the primary visual focus: yes, store cards now appear immediately after Quick Add in a dedicated active workspace.
- Other Shopping Lists became secondary: yes, they remain accessible in a secondary collapsed-supporting section.
- Shopping behaviour remained unchanged: yes, browser validation confirmed add, grouping, check-off, undo, remove, and other-list flows.
- Backend/API/schema remained unchanged: yes, no backend/API/schema files changed.
- Recommended next slice: refine the expanded Other Lists density and secondary lifecycle presentation only if real-family usage shows those sections are still too tall when opened.
