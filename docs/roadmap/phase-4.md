# Phase 4 — Tasks and Weekly Reset completion

Phase 4 makes task actions directly operable, gives normal tasks and routines coherent lifecycle management, defines recurring occurrence scope, and turns Weekly Reset into a persisted completable workflow.

**Phase status:** In progress.

| Slice | Status | Outcome |
| --- | --- | --- |
| 4.0 Tasks viewport/interaction analysis | Completed 2026-08-08 | Approved the existing fixed dashboard composition and defined semantic task actions, portalled menu behavior, and bounded archive/routine placement. |
| 4.1 Directly operable task actions | Not started | Replace selection-only card actions and clipped Edit with semantic, visible, real-hit-target controls. |
| 4.2 Normal task archive/delete | Not started | Add reversible archive, restore, and explicitly confirmed permanent deletion for normal tasks. |
| 4.3 Routine/template lifecycle | Not started | Add a dedicated ordered-item routine editor and archive/restore/delete lifecycle. |
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

## Fixed boundaries

- Slice 4.0 changes documentation only.
- Work remains one numeric slice and one commit per run.
- Recurring destructive scope remains Slice 4.4 and must not be inferred during normal-task archive work.
- Weekly Reset persistence remains Slice 4.5.
- Primary pages may not introduce document-level vertical scrolling.
- Significant implementation pressure to change the approved information architecture requires a revised analysis before continuing.

## Phase exit criteria

- [ ] Task actions are discoverable and accessible.
- [ ] Edit menu is never clipped at supported viewports.
- [ ] Normal tasks and routines have coherent archive/restore lifecycle.
- [ ] Recurring scope is explicit.
- [ ] Weekly Reset can be completed and reviewed after refresh.
