# Slice 3.3 viewport-first analysis

Date: 2026-08-07
Status: approved implementation contract for Slice 3.3

## Shared constraint

Home, Agenda, and Settings are fixed-height FamilyBoard pages inside `workspace-panel`. Document-level vertical scrolling is forbidden. Slice 3.3 changes calendar write behavior and adds bounded workflows; it does not redesign any primary page. Dialog content may scroll inside its reserved body while the page beneath remains fixed.

## Home

### Current composition and pressure

Home is a three-row grid: the compact day/weather hero, quick-action rail, and a `minmax(0, 1fr)` summary grid. Agenda, tasks, and shopping summaries have fixed visible-item limits and remain inside the final reserved row. The calendar quick-add is an overlay dialog with a two-step title/date conversation. Page overflow would occur only if new controls were added to the dashboard rows or the quick workflow were expanded inline.

### Information priority

- Primary and always visible: day/weather context, quick actions, and the three bounded daily summaries.
- Secondary: the calendar draft's exact date and the route to advanced fields.
- Compactable/scrollable: advanced event fields do not belong on Home and remain in Agenda's internally bounded editor.

### Approved composition

Keep the existing dashboard grid and quick-add dialog. Add `Meer opties` beside the final quick-add actions. It transfers only the current title and chosen local date to the existing Agenda editor, then navigates to Agenda. No recurrence, location, participant, duration, or other semantics are synthesized. The submit-time household-local date calculation changes behavior but consumes no layout space beyond a short zone label if needed in the dialog.

At 1440x900 and 1366x768 the page keeps the same reserved rows and visible-item limits. The overlay remains bounded by the existing dialog viewport rules, so neither data volume nor the new action can increase document height.

### Risks and alternatives

Long IANA identifiers could widen the dialog; render them as wrapping secondary text. Adding the full form to Home was rejected because it would duplicate Agenda and turn a quick action into a variable-height surface. Adding a new dashboard card was rejected because it would consume the summary grid's reserved height.

## Agenda

### Current composition and pressure

Agenda has a compact workspace header and a single full-height widget. The widget reserves an optional command/header row and a `minmax(0, 1fr)` planning/month region. Event creation and editing already use a modal conversation form; recurrence fields are the largest variable-height content. Page overflow would result if transferred drafts or zone guidance were inserted into the planning/month grid.

### Information priority

- Primary and always visible: current planning/month surface, navigation, and event actions.
- Secondary: event details, recurrence, local-zone explanation, and save-scope decisions.
- Compactable/scrollable: all form questions, recurrence controls, and validation messages remain inside the event dialog's internal scroll region.

### Approved composition

Keep the existing Agenda grid and event dialog. A transferred Home draft opens that same editor with only title, start date, matching end date, and all-day intent populated. The form continues to store date/time input values as calendar strings. A concise household-zone label sits with the timing question, inside the dialog. Create, series edit, occurrence edit, and split share one request mapper; this is behavioral consolidation and does not alter the page grid.

At both target viewports the header/widget height allocation is unchanged. Variable recurrence and validation content remains internally scrollable in the modal rather than affecting the document.

### Risks and alternatives

Projected UTC read values must be converted to household-local calendar fields when editing; using the browser zone would silently shift the form. A new standalone Agenda route for drafts was rejected because the app uses workspace state rather than URL routing and because it would duplicate the bounded editor. Inline expansion under an agenda row was rejected because it would destabilize the planning grid.

## Settings — Kalendercontrole

### Current composition and pressure

Settings is a fixed three-row dashboard with a two-column middle grid and an action rail. Existing details, backup/restore, source, people, family, and home-management workflows open in `settings-surface-dialog`, whose body owns `overflow: auto`. Adding repair candidates directly to a card would make card height depend on historical data and compete with source health/status content.

### Information priority

- Primary and always visible: Settings health summary, source status, backup/restore readiness, and action rail.
- Secondary: whether legacy manual events need review and the entry action for that review.
- Compactable/scrollable: candidate list, correction fields, occurrence preview, conflicts, and per-event errors.

### Approved composition

Add one compact `Kalendercontrole` action to the existing action rail. It opens a bounded Settings dialog. The dialog uses a candidate selector/list followed by a single-event correction form and server preview. Only one candidate is applied at a time. Inputs and preview remain visible after validation or concurrency errors. The dialog body scrolls internally; the primary Settings grid does not gain a row and candidate count cannot change page height.

At 1440x900 and 1366x768 the existing dashboard columns and rows remain unchanged. The modal uses `max-height: 100%`, `minmax(0, 1fr)`, and its existing internal scrolling body.

### Risks and alternatives

A large preview can crowd the form, so occurrence rows are summarized and limited to the server-provided preview while the dialog body scrolls. An inline repair table was rejected because candidate volume is unbounded. A multi-event bulk apply was rejected because the backend contract requires explicit, reviewed correction and concurrency confirmation per event.

## Validation contract

Implementation must preserve this composition. Playwright must check Home, Agenda, Settings, the Agenda editor opened from Home, and Kalendercontrole at 1440x900 and 1366x768 for zero document-level vertical overflow. Any necessary overflow must remain inside the existing dialog body.
