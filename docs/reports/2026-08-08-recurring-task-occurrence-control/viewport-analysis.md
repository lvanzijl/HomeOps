# Phase 4 Slice 4.4 — recurring-task scope viewport analysis

## Current composition

Tasks is a fixed FamilyBoard dashboard with three reserved rows: the compact command band, a `minmax(0, 1fr)` Today/Planning grid whose lists own overflow, and the horizontal secondary rail. Task cards expose direct Complete/Reopen, eligible Tomorrow, and a portalled More menu. Editing already uses a bounded conversation dialog. At 1440×900, 1366×768, and the task-specific 1280×720 check, the document does not scroll.

The page does not currently exceed its reserved viewport region. The recurrence defect is interaction semantics, not page density: recurring edit implicitly changes the whole series and recurring delete offers no scope or confirmation. Adding scope controls inline to every recurring card or permanently expanding the edit dialog would consume variable height and pressure the primary grid.

## Primary and secondary content

The command band, Today list, Planning summary, direct completion controls, and compact secondary rail are primary and must remain visible and unchanged. Recurrence scope is secondary, contextual management content. It is needed only after a user submits changes to a recurring task or chooses recurrence removal from More.

Within the scope interaction, the task name, three supported scopes, consequence copy, current selection, failure state, cancel action, and final action must remain visible or reachable inside the dialog. Explanatory detail may compact at laptop height and the scope list may scroll internally. No scope content may enlarge the document or the default Tasks composition.

## Approved composition

Keep the existing page and task-card composition unchanged. After recurring edit submission, replace the edit conversation with one modal scope dialog while retaining the draft in component state. The dialog presents the Agenda-aligned meanings in plain task wording:

- `Alleen deze taak` — change or remove only the selected occurrence;
- `Deze en volgende` — split or end the series at the selected occurrence while preserving earlier history;
- `Hele reeks` — change the series definition or stop all pending occurrences while preserving completed history.

The same bounded dialog handles edit scope and destructive removal. Destructive removal additionally requires a task-specific confirmation checkbox before its final button is enabled. Cancellation from an edit scope returns to the populated task editor; cancellation from removal returns to the unchanged Tasks page. Request failures retain the dialog, selected scope, confirmation state, and actionable copy.

The modal uses the existing fixed overlay boundary, a width capped below the viewport, `max-height` below the visual viewport, a fixed header/action region, and an internally scrolling body. At reduced height, padding and gaps compact before internal overflow activates. Completed occurrences expose only entire-series management because occurrence history is immutable. If an edit changes recurrence frequency, occurrence-only scope is unavailable because frequency is a series property.

## Fit justification

No element is added to the command band, grid, task card height, or secondary rail. The only new composition is overlay-owned and independent of document flow. Three compact scope choices, consequence copy, one optional confirmation row, and two actions fit within 1280×720; the body remains the sole overflow owner if validation or failure copy expands. The established 1440×900 and 1366×768 checks therefore retain more available space than the task-specific minimum.

## Risks, trade-offs, and alternatives

Returning from scope selection to the populated editor requires preserving the draft after submit; clearing form state before a successful request would lose user intent and is prohibited. A single reusable dialog reduces competing modal state, but its copy must clearly distinguish editing from removal. Completed-history protection can make two scope choices unavailable; disabled choices need concise reasons rather than silently disappearing.

Inline scope controls on cards were rejected because they would increase repeated card height and harm scanability. A permanent recurrence-management rail surface was rejected because the action is occurrence-specific and would add navigation/state without improving the decision. Native `confirm()`/`prompt()` was rejected because it cannot explain three scopes accessibly, retain failure state, or prove bounded viewport behavior.

This analysis is the implementation authority for Slice 4.4. Significant changes to the default Tasks information architecture or to the single bounded scope-dialog strategy require a revised analysis before implementation continues.
