# Tasks viewport and interaction analysis

## Decision

The current Tasks dashboard composition remains the approved layout for Phase 4 Slices 4.1–4.3. The page already fits its reserved viewport by using a compact command band, a bounded Today/Planning main grid, and a fixed-height secondary rail. Phase 4 must repair the interaction model inside that composition; it must not turn Tasks back into a document-style page or add management panels to the default page flow.

This report is the implementation authority for Slices 4.1–4.3. A significant technical limitation or UX issue that requires a different information architecture, layout strategy, viewport strategy, or interaction hierarchy must stop implementation and revise this report before work continues.

## Scope

In scope:

- the current Tasks page composition and viewport ownership;
- the task-card action hierarchy and semantic control contract for Slice 4.1;
- the placement and overflow strategy for normal-task archive/restore/delete in Slice 4.2;
- the placement and overflow strategy for routine/template lifecycle in Slice 4.3;
- mouse, touch, keyboard, focus, popup, and supported-laptop behavior.

Out of scope:

- implementation changes;
- API, database, generated-client, or task-domain changes;
- recurring occurrence scope, which remains Slice 4.4;
- the persisted Weekly Reset aggregate, which remains Slice 4.5;
- changes to other primary pages.

## Evidence inspected

- `src/HomeOps.Client/src/tasks/TasksPage.tsx`
- `src/HomeOps.Client/src/tasks/TasksPage.test.tsx`
- `src/HomeOps.Client/src/styles.css`
- `tests/HomeOps.E2E/specs/product-integrity.smoke.spec.ts`
- `tests/HomeOps.E2E/playwright.config.ts`
- `docs/reports/2026-07-02-work/tasks-viewport-fit-analysis.md`
- `docs/reports/2026-07-02-work/tasks-viewport-fit-implementation.md`
- the consolidated TASK-UI-01 and TASK-UI-02 audit findings

The existing browser suite proves zero document-level vertical scrolling for Tasks at 1440×900 and 1366×768. Its real-hit-target task scenario remains an expected failure: Complete, Tomorrow, and Edit exist in the DOM but the present interaction and clipping rules prevent dependable pointer use. Slice 4.1 must promote that scenario to a normal passing regression and add the required 1280×720 and keyboard coverage.

## Current page composition

Tasks renders inside the workspace shell's fixed page body. The current implementation follows the earlier approved viewport-fit redesign and contains three stable rows:

1. **Command band — fixed.** Page title, status counts, and `Gezinstaak toevoegen`.
2. **Main dashboard — flexible within the reserved remainder.** A wide Today panel and a narrower Planning summary. The Today list owns its overflow; Planning details open in a bounded surface rather than expanding the page.
3. **Secondary rail — fixed.** Later, Someday, Completed, Routines, Week Planning, and Weekly Reset entry points use a horizontally scrollable compact rail.

Task creation/editing and secondary lists use bounded dialogs with internal overflow. The page root, workspace body, main panels, and dialog bodies all establish `min-height: 0` or fixed bounds so variable record counts do not grow the document.

## What exceeds its reserved region

The Tasks page itself does not currently exceed the browser viewport at the two established regression sizes. The defect is an interaction-layer overflow inside each task card:

- the entire `<li>` is a focusable, click-to-select target even though it is not a semantic button or listbox option;
- the action rail begins at `max-width: 0`, `opacity: 0`, `pointer-events: none`, and `overflow: hidden`;
- only card selection or focus-within reveals the rail, creating an undiscoverable two-step path to Complete and Tomorrow;
- the `Meer` popup is positioned to the left while remaining a descendant of that overflow-hidden rail, so its visible content can be clipped or covered and Edit is not a dependable hit target;
- DOM-only tests can invoke those hidden buttons and therefore do not prove actual pointer geometry.

The correction is containment-aware interaction design, not additional page height.

## Primary and secondary content

| Content or action | Priority | Always visible | Phase 4 placement |
| --- | --- | --- | --- |
| Page identity and Add task | Primary | Yes | Existing command band. |
| Today task title and essential details | Primary | Yes | Existing Today list. Title/details becomes a named semantic control. |
| Complete or Reopen | Primary | Yes per card | Direct task-card action; never conditional on selection, hover, or focus. |
| Tomorrow | Primary when valid | Yes per eligible card | Direct task-card action; never hidden in the overflow menu. |
| More | Secondary | Yes per card | Named menu button opening a portalled popup. |
| Edit | Secondary | No | First item in the More menu. |
| Archive normal task | Secondary/reversible | No | More menu, then bounded confirmation where confirmation is warranted. |
| Permanent delete normal task | Destructive/tertiary | No | Archived-task surface only, with explicit confirmation. |
| Planning details | Secondary | Summary only | Existing Planning summary and bounded detail surface. |
| Archived normal tasks | Secondary management | No | A compact `Archief` entry in the existing horizontal secondary rail opens a bounded surface. |
| Routines/templates | Secondary management | No | Existing `Routines` rail entry opens a dedicated bounded routine surface. |
| Weekly Reset | Secondary/periodic | Entry only | Existing rail entry; aggregate work remains Slice 4.5. |

The visual avatar, status label, owner, due information, and recurrence indicator remain supporting content. At constrained height or width, low-priority metadata chips may be compacted or omitted before any primary action is hidden.

## Approved dashboard composition

```text
Tasks workspace viewport
┌──────────────────────────────────────────────────────────────┐
│ Fixed command band: identity/status             Add task     │
├──────────────────────────────────┬───────────────────────────┤
│ Today                            │ Planning summary          │
│ internally scrolling task list   │ bounded detail on demand  │
│                                  │                           │
│ [title/details] [Klaar] [Morgen] [Meer]                     │
├──────────────────────────────────┴───────────────────────────┤
│ Fixed horizontal secondary rail, including bounded Archief  │
└──────────────────────────────────────────────────────────────┘

More menu: rendered in a document-level portal, positioned from its
button, clamped/flipped within the viewport, and absent from page flow.
```

The proportions remain approximately 60% Today and 40% Planning on supported desktop/laptop widths. The page retains `grid-template-rows: auto minmax(0, 1fr) auto`; task volume is absorbed only by task-list and bounded-surface overflow.

## Slice 4.1 task-card interaction contract

### Semantic structure

- Keep `<li>` as a non-interactive list-item container. Remove `tabIndex`, `aria-selected`, whole-card click/keyboard selection, and selection-dependent action visibility.
- Render the title/details region as a real `<button type="button">` with an accessible name that includes the task title. Activating it opens the existing task detail/edit dialog.
- Render Complete/Reopen, Tomorrow where valid, and More as sibling `<button>` elements with task-specific accessible names. Their visible labels remain present.
- A card must not contain a button wrapper around other buttons. Each focusable control owns one action.
- Completing, reopening, or moving a task must not depend on hover, focus-within, or a preceding selection action.

### Card density

- The information region uses `min-width: 0`; long titles wrap to at most two lines or truncate with an accessible full name.
- The action region uses `flex: 0 0 auto` and must never collapse to zero width.
- Complete/Reopen and More remain visible at every supported desktop/laptop width. Tomorrow remains visible whenever the domain rule allows it.
- At reduced height, remove low-priority metadata chips and tighten gaps before reducing control size. Pointer targets must be at least 40×40 CSS pixels even if their visible chrome is quieter.
- A narrow-card responsive variant may place the actions on a second card row, but the list continues to own vertical overflow and the page composition cannot grow.

### More menu

- Use a controlled menu, not native `<details>`.
- The trigger exposes an accessible name, `aria-haspopup="menu"`, `aria-expanded`, and `aria-controls` while open.
- Render the popup through a portal outside `.task-card-actions`, the task-list scroller, and `.tasks-page` overflow boundaries.
- Position the popup from the trigger's viewport rectangle. Clamp it within the viewport, flip left/right and above/below when necessary, and give it a bounded internal scroll area if its contents ever exceed the available height.
- Opening by keyboard moves focus to the first enabled menu item. Escape closes it and returns focus to the trigger. Outside pointer interaction closes it. Selecting an item closes it before starting that action.
- Reposition or close on relevant ancestor scroll, window resize, or loss of the anchor. The popup must not create document-level horizontal or vertical overflow.
- If an action removes the originating card, focus moves to the next logical card control or the Today section heading instead of attempting to restore focus to a removed element.

### Interaction isolation

- Button activation must not also trigger title/details.
- Pending mutations disable only conflicting controls and retain visible progress/error feedback.
- The More trigger remains usable by mouse, touch, Enter, and Space. Menu items are reachable in a predictable DOM order; Escape and focus return are covered by component and browser tests.

## Slice 4.2 normal-task lifecycle placement

Normal task archive is reversible and remains distinct from completion. It is exposed from the card's More menu, not as another always-visible primary button. Recurring instances or series must not inherit normal-task archive behavior implicitly; their destructive scope remains governed by Slice 4.4.

Archived tasks disappear from Today, Planning, Later, Someday, and Completed operational lists. Add one compact `Archief` entry to the existing horizontally scrollable secondary rail; this changes neither rail height nor main-grid allocation. It opens a bounded, internally scrolling archive surface.

Restore is available directly in that surface. Permanent delete is available only for an archived normal task, requires explicit task-specific confirmation, and explains that the operation cannot be undone. Archive, restore, and delete feedback remains inside the bounded surface or a bounded confirmation dialog; none of these states render below the dashboard.

## Slice 4.3 routine/template lifecycle placement

Keep the existing `Routines` secondary-rail entry. It opens a dedicated routine-management surface rather than the single-task editor. The surface contains the routine list, archived view, and a routine editor with name, description, and ordered non-empty items.

- The outer routine surface remains bounded by the existing task dialog dimensions.
- Its header and primary save/close actions remain fixed; its list/editor body owns vertical overflow.
- Adding, editing, removing, and reordering items occurs inside that surface and cannot increase the Tasks page height.
- Archive is reversible. Restore is available from the archived view. Permanent delete is available only after explicit confirmation.
- Editing a routine affects future applications only; already-created tasks are not silently rewritten.
- Do not add routine forms, archived lists, or expanded item collections to the default Tasks dashboard.

## Viewport and overflow strategy

### Reserved regions

- Command band: intrinsic but compact, one row at normal desktop width.
- Main dashboard: all remaining height through `minmax(0, 1fr)`.
- Secondary rail: one fixed-height horizontal access row.
- Today list, planning details, archive list, and routine body: explicit internal overflow owners.
- Task editor, confirmations, and management surfaces: bounded overlays with internal scrolling.
- Portalled menu: fixed-position interaction layer outside normal layout.

### Supported laptop fit

At 1440×900 and 1366×768, the existing composition already passes the no-document-scroll browser regression. Slice 4.1 adds 1280×720 as an explicit supported task-interaction viewport. At that size:

- the shell and command/rail rows retain their compact allocations;
- the main grid consumes only the remaining height;
- reduced gaps and optional metadata keep direct controls readable;
- extra tasks scroll inside Today rather than adding rows to the page;
- the popup is fixed and viewport-clamped, so it consumes no grid space;
- archive and routine content opens in bounded surfaces rather than the page flow.

This design therefore has no variable-height content path into `document.body`. Implementation validation, rather than this analysis, must prove the 1280×720 geometry with real browser hit testing.

## Required Slice 4.1 validation

- Promote the existing TASK-UI-01/TASK-UI-02 expected-failure Playwright scenario to a normal passing regression.
- Prove actual hit targets and successful activation for title/details, Complete/Reopen, Tomorrow, More, and Edit with a mouse at 1280×720.
- Prove keyboard order, Enter/Space activation, menu focus entry, Escape close, outside-click close, and focus return.
- Exercise a More trigger near list and viewport edges to prove popup clamping and absence of clipping.
- Assert no document-level vertical or horizontal scrolling at 1280×720, 1366×768, and 1440×900 with representative full data.
- Retain component tests for conditional Tomorrow, completed/reopen state, mutation failure, and semantic attributes, but do not treat DOM invocation as hit-target proof.

Slices 4.2 and 4.3 must add equivalent browser coverage for their bounded archive and routine surfaces, plus domain/API tests required by their implementation plans.

## Risks and trade-offs

- Always-visible actions add visual density. Quiet button styling and metadata reduction are acceptable; hiding primary actions is not.
- A portal requires explicit positioning, scroll/resize handling, and focus restoration. That complexity is justified because every in-card ancestor is intentionally bounded for viewport correctness.
- Adding `Archief` lengthens the horizontal secondary rail. The rail already owns horizontal overflow, so this is preferable to adding another page row or overloading Completed semantics.
- Two-line titles can make individual cards taller. The list, not the page, owns that variability; implementation should keep a bounded title treatment.
- Destructive recurrence behavior is easy to blur into normal-task lifecycle. Slice 4.2 must explicitly exclude recurring scope rather than anticipate Slice 4.4.

## Alternatives considered

### Whole card remains clickable with visible actions

Rejected. A clickable generic container still has ambiguous semantics, makes nested controls difficult to reason about, and preserves the accidental-action risk. A button wrapping the card would also illegally contain other buttons.

### Put every action directly on the card

Rejected. Complete/Reopen and Tomorrow deserve direct access, but Edit, archive, and later lifecycle actions would crowd compact cards and reduce title readability.

### Open a dialog for every task action

Rejected. It would make high-frequency completion and tomorrow actions slower and would fail the audit requirement that primary actions be directly operable.

### Keep the popup inside the card and remove all overflow clipping

Rejected. Task-list and page overflow boundaries are necessary to preserve viewport fit, and relaxing them would allow menus to be clipped by another ancestor or escape the reserved dashboard region unpredictably.

### Add archive and routine management below the dashboard

Rejected. Variable lists and editors in normal flow would reintroduce document-style vertical growth and violate the approved Tasks composition.

## Completion of this analysis slice

This is a documentation-only slice. No source, API, schema, generated client, CSS, test, screenshot, video, or binary artifact changed. Runtime validation is intentionally deferred to each implementation slice; this report defines what those validations must prove.
