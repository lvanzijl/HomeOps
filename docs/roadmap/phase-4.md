# Phase 4 — Tasks and Weekly Reset completion

Phase 4 makes task actions directly operable, gives normal tasks and routines coherent lifecycle management, defines recurring occurrence scope, and turns Weekly Reset into a persisted completable workflow.

**Phase status:** In progress.

| Slice | Status | Outcome |
| --- | --- | --- |
| 4.0 Tasks viewport/interaction analysis | Completed 2026-08-08 | Approved the existing fixed dashboard composition and defined semantic task actions, portalled menu behavior, and bounded archive/routine placement. |
| 4.1 Directly operable task actions | Completed 2026-08-08 | Replaced selection-only cards with semantic direct actions and a keyboard-safe viewport-clamped portalled menu. |
| 4.2 Normal task archive/delete | Completed 2026-08-08 | Added reversible normal-task archive/restore and task-specific confirmed permanent deletion from a bounded archive surface. |
| 4.3 Routine/template lifecycle | Completed 2026-08-08 | Added a dedicated ordered-item editor and reversible archive/restore/confirmed-delete lifecycle for routines. |
| 4.4 Recurring occurrence control | Not started | Define and implement occurrence, future, and entire-series scopes. |
| 4.5 Persisted Weekly Reset | Not started | Persist candidate decisions, completion, resume, and history. |

## Slice 4.0 implementation authority

The approved report is `docs/reports/2026-08-08-tasks-interaction-analysis/viewport-analysis.md`. Slices 4.1–4.3 must preserve the existing three-row Tasks dashboard:

- a compact fixed command band;
- a `minmax(0, 1fr)` Today/Planning main grid whose lists own overflow;
- a fixed-height horizontally scrolling secondary rail.

The current page already passes no-document-scroll checks at 1440×900 and 1366×768. The known defect is inside task cards: selection-only action visibility and an overflow-hidden More popup make Complete, Tomorrow, and Edit undiscoverable or unreliable real hit targets.

Slice 4.1 must make the list item non-interactive, provide a named title/details button, keep Complete/Reopen and eligible Tomorrow visible, and render a controlled accessible More menu through a viewport-clamped portal. It must promote the existing expected browser failure to a normal regression and prove mouse and keyboard behavior at 1280×720 in addition to established viewport sizes.

Slice 4.2 may add one compact `Archief` entry to the existing secondary rail and must keep archive/restore/delete inside bounded surfaces. Slice 4.3 must retain the existing `Routines` rail entry and keep its dedicated ordered-item editor and lifecycle inside an internally scrolling bounded surface. Neither slice may add variable-height management content to the default page.

## Slice 4.1 implementation boundary

Task list items are now non-interactive containers. Title/details, Complete/Reopen, eligible Tomorrow, and More are named buttons whose availability does not depend on card selection, hover, or focus. More opens a controlled menu through a document-level portal; it flips and clamps inside the viewport, closes on outside interaction or scroll, exposes expanded/control state, focuses Edit after positioning, and returns focus to the trigger on Escape.

The approved page composition did not change. Action targets remain at least 40×40 CSS pixels, metadata compacts before actions, and all variable task volume remains inside existing list/dialog overflow owners. The former TASK-UI-01/TASK-UI-02 Playwright expected failure is a normal passing regression with mouse and keyboard coverage at 1280×720; the established 1440×900 and 1366×768 viewport checks also pass.

Validation: focused Tasks tests 12/12; full frontend 342/342; backend 622/622; frontend and solution builds; and PostgreSQL-backed Playwright 6/6. The implementation report is `docs/reports/2026-08-08-task-actions/implementation.md`.

## Slice 4.2 implementation boundary

Normal tasks now have a distinct record lifecycle. Archive preserves title, due date, ownership, completion, and completion time while removing the task from operational lists. The new archived-task API lists only non-recurring records; restore returns incomplete tasks to Active and completed tasks to Completed without reversing motivation progress. Permanent deletion is accepted only for an archived normal task and only with explicit confirmation. Archived records are excluded from operational edit, completion, no-date review, and recurring-series routes.

The Tasks page adds the approved compact `Archief` secondary-rail tile. Its internally scrolling dialog provides direct restore and a task-specific permanent-delete confirmation; failures retain the selected task and explain that the archived record remains safe. Normal task cards expose Archive in More, while recurring tasks expose only their existing routine-series action so Slice 4.4 remains the recurrence authority. The default command/main-grid/rail composition is unchanged.

Validation: focused archive API 3/3 and Tasks frontend 15/15; full frontend 345/345; backend 625/625; frontend and solution builds; pinned NSwag 14.7.1 twice with an idempotent second run; PostgreSQL migration/model-drift 3/3; and PostgreSQL-backed Playwright 7/7, including archive, restore, cancellation, confirmed deletion, and no document overflow at 1280×720 plus established 1440×900 and 1366×768 checks. The implementation report is `docs/reports/2026-08-08-task-lifecycle/implementation.md`.

## Slice 4.3 implementation boundary

Routines now use a dedicated editor rather than the single-task conversation. A routine has a name, optional description, and an ordered non-empty collection of steps. Each step independently carries title, owner, optional family member, recurrence, and optional 0–365-day start offset. The editor supports add, edit, remove, and reorder before one save; duplicate trimmed titles are rejected case-insensitively. Applying an edited routine is prospective: previously created tasks and series are unchanged, while future applications use the new definition.

The existing `Routines` secondary-rail tile still opens the bounded Tasks surface. Active and archived tabs, the editor, lists, and task-specific permanent-delete confirmation all remain inside that internally scrolling dialog. Archive preserves the routine definition; restore re-exposes it; permanent deletion is accepted only from archive with explicit confirmation and removes its managed steps. Applying or editing an archived routine is not allowed. Recurring steps may create series when a routine is applied, but occurrence-level destructive scope remains Slice 4.4.

Validation: focused routine API 8/8 and Tasks frontend 19/19; full frontend 349/349; backend 628/628; frontend and solution builds; pinned NSwag 14.7.1 twice with an idempotent second run; PostgreSQL migration/model-drift 3/3; and PostgreSQL-backed Playwright 8/8, including ordered editing, prospective-change copy, archive, restore, cancellation, confirmed deletion, and no document overflow at 1280×720 plus established 1440×900 and 1366×768 checks. The implementation report is `docs/reports/2026-08-08-routine-lifecycle/implementation.md`.

## Fixed boundaries

- Slice 4.0 changes documentation only.
- Work remains one numeric slice and one commit per run.
- Recurring destructive scope remains Slice 4.4 and must not be inferred during normal-task archive work.
- Weekly Reset persistence remains Slice 4.5.
- Primary pages may not introduce document-level vertical scrolling.
- Significant implementation pressure to change the approved information architecture requires a revised analysis before continuing.

## Phase exit criteria

- [x] Task actions are discoverable and accessible.
- [x] Edit menu is never clipped at supported viewports.
- [x] Normal tasks and routines have coherent archive/restore lifecycle.
- [ ] Recurring scope is explicit.
- [ ] Weekly Reset can be completed and reviewed after refresh.
