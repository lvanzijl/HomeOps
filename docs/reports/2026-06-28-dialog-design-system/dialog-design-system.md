# FamilyBoard Dialog Design System

## Summary
Implemented a shared FamilyBoard dialog presentation layer for existing client dialogs. The slice makes dialogs wider, softer, more spacious, and visually tied to their originating workspace without changing workflow logic, validation, backend behavior, API contracts, or database schema.

## Preflight analysis
- Read `.github/copilot-instructions.md`; it did not reference additional instruction files.
- Executed required preflight: `export DOTNET_CLI_HOME=/tmp/dotnet && export PATH="$PATH:$HOME/.dotnet/tools" && dotnet --version`; result: `10.0.301`.
- Reviewed the FamilyBoard Product UX Review, Screenshot Review, Home Final Polish report, Tasks Add Dialog screenshot observations, existing dialog components, and existing modal implementation.
- Existing dialogs already shared CSS selectors (`.home-capture-dialog`, `.task-dialog`, `.motivation-dialog`) and the common `.avatar-editor-backdrop` overlay, but they did not have a complete shared dialog presentation language. A shared CSS presentation layer was therefore the appropriate implementation path; no workflow rewrite was needed.

## Root cause analysis
Dialogs felt like an older generation of the product because they mixed page-specific markup with only partial shared modal styling. Widths were compact, helper copy stacked above the actual question, buttons inherited inconsistent page-level styles, and workspace/domain identity was not always explicit inside the dialog itself.

## Implementation plan
1. Keep existing dialog markup and state machines intact.
2. Add shared visual language through existing dialog classes rather than introducing new workflow components.
3. Increase default dialog width and spacing.
4. Soften the backdrop while preserving blur.
5. Apply calm FamilyBoard button/input styles inside dialogs only.
6. Add subtle domain accent classes to representative Home, Agenda, and Tasks dialogs.
7. Remove repeated explanatory sentences that duplicate the active question.
8. Validate representative dialogs at `1366×768` and `1920×1080`.

## Implemented changes
- Updated shared dialog CSS for `.home-capture-dialog`, `.task-dialog`, and `.motivation-dialog`: wider max width, warmer gradient surface, subtle accent rail, softer border, larger spacing, calmer buttons, and consistent input treatment.
- Softened the shared modal overlay by reducing heavy dimming while retaining blur.
- Added workspace accent classes to Home quick-capture dialogs for Boodschappen, Taken, and Agenda, and to the Agenda event dialog.
- Removed redundant explanatory copy from the Home quick-capture dialogs, Agenda event dialog, and Tasks conversation dialog heading.
- Preserved the existing one-question dialog flows, form submission handlers, validation requirements, and state transitions.

## Browser validation
Browser inspection was performed with Playwright Chromium against the running Vite app. Temporary tooling was installed under `/tmp/pw`, not in the repository. No screenshots were retained.

Validated representative dialogs:
- Add Shopping Item: Home quick-capture `Boodschap toevoegen`.
- Add Task: Tasks page `Gezinstaak toevoegen`.
- Add Event: Agenda page `Gebeurtenis toevoegen`.

Viewport results from browser inspection:

| Viewport | Dialog | Observed width | Accent | Copy | Buttons | Result |
| --- | --- | ---: | --- | --- | --- | --- |
| 1366×768 | Add Shopping Item | 683px | Amber | Only eyebrow + title + question | Rounded calm amber primary | PASS |
| 1366×768 | Add Task | 696px | Teal | Only eyebrow + title + active question | Rounded calm teal primary | PASS |
| 1366×768 | Add Event | 696px | Lavender | Only eyebrow + title + active question | Rounded calm lavender primary | PASS |
| 1920×1080 | Add Shopping Item | 665px | Amber | Only eyebrow + title + question | Rounded calm amber primary | PASS |
| 1920×1080 | Add Task | 696px | Teal | Only eyebrow + title + active question | Rounded calm teal primary | PASS |
| 1920×1080 | Add Event | 696px | Lavender | Only eyebrow + title + active question | Rounded calm lavender primary | PASS |

## Before vs After observations
- Before: dialogs were narrower and felt closer to generic utility modals. After: dialogs use a warmer card, larger width, softer overlay, and more generous breathing room.
- Before: dialog headings often stacked title, explanation, and question. After: redundant explanatory sentences were removed so the active question carries the step.
- Before: buttons could inherit stronger or page-specific treatment. After: dialog buttons share calm rounded FamilyBoard styling with receding secondary actions.
- Before: workspace identity was mostly outside the modal. After: dialogs expose subtle workspace accents: Agenda lavender, Taken teal, Boodschappen amber, and Motivation orange through the shared dialog system.

## Acceptance criteria (PASS/FAIL)
- Dialogs now feel like FamilyBoard: PASS.
- Explanatory copy was reduced: PASS.
- Dialogs became more spacious: PASS.
- Button styling became consistent: PASS.
- Workspace identity is reflected: PASS.
- Workflows remained unchanged: PASS.
- Backend/API/schema remained unchanged: PASS.
- Browser validation completed: PASS.
- Report exists in required directory: PASS.
- `git diff --check` passes: PASS.
- No binary artifacts remain from this slice: PASS.

## Validation results
- `dotnet --version`: PASS, `10.0.301`.
- `npm run build`: PASS; Vite emitted an existing chunk-size warning for a JS chunk larger than 500 kB.
- `npm run test -- TasksPage.test.tsx HomeDashboard.test.tsx`: PASS, 18 tests.
- `npm run test -- TasksPage.test.tsx AgendaWidget.test.tsx HomeDashboard.test.tsx`: FAIL due unrelated Agenda test/date/data expectations observed outside this visual slice: missing `New Calendar Event` rendering after mocked create, expected timed event date `2026-06-27` vs received `2026-06-28`, and expected list group `Morgen` absent with current fixture grouping.
- Browser validation: PASS after installing missing browser runtime libraries in the container.
- `git diff --check`: PASS.

## Remaining UX debt
- Some dialogs still use page-local markup; a future cleanup could wrap them in a small React `FamilyDialog` component once workflow slices permit structural refactoring.
- Shopping’s dedicated workspace remains inline-add rather than dialog-based; this slice validated Shopping through the existing Home quick-capture dialog to avoid workflow changes.
- Motivation/helpful-moment dialog copy still contains some English test labels in tests, but user-facing UI remains Dutch in the validated surfaces.

## Modified files
- `src/HomeOps.Client/src/styles.css`
- `src/HomeOps.Client/src/home/HomeDashboard.tsx`
- `src/HomeOps.Client/src/tasks/TasksPage.tsx`
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.tsx`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-06-28-dialog-design-system/dialog-design-system.md`

## Binary artifact confirmation
No binary artifacts were added by this slice. No PNG, JPG, JPEG, GIF, WEBP, or PDF files were created or retained. Temporary browser validation files were kept outside the repository under `/tmp`.
