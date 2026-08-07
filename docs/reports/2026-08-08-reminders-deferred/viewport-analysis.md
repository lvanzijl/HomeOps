# Slice 3.7 Agenda reminder-boundary viewport analysis

## Current page composition

Agenda is a fixed-height primary dashboard with Planning and Month canvases. Creating or editing an appointment opens the existing `home-capture-dialog` overlay outside document flow. New appointments progress through title, date, all-day/time, and details questions; edits show the same fields together. The details content owns notes, location, decorative avatar, recurrence, occurrence actions, and summaries. The dialog is already bounded to the viewport with its own overflow.

Settings retains its fixed status-first grid and action rail. Its secondary status card reports the result of actions taken inside Settings; it does not deliver operating-system or background notifications.

## Overflow cause and risk

The current pages do not exceed their reserved viewport regions. Slice 3.7 adds one expectation-setting sentence. Putting that copy on the persistent Agenda canvas, adding a reminder card, or adding controls would grow the primary composition and falsely imply notification capability. In the longest edit/recurrence form, additional content can increase only the existing dialog's internal scroll extent, not document height.

## Primary and secondary content

- Primary Agenda content: household appointments, dates/times, recurrence, and event actions.
- Secondary Agenda content: a concise statement explaining that stored appointments do not generate notifications.
- Always visible: the current page canvas and dialog navigation/actions.
- Internally scrollable: the event editor's existing details content, including the new statement.
- Settings status card: remains in its existing reserved region; only its terminology changes from ambiguous notifications to in-app activity/status updates.

## Approved composition

1. Keep the Agenda and Settings page grids, cards, action rails, and reserved regions unchanged.
2. Add one compact non-interactive note to the existing Agenda details step: HomeOps stores appointments but does not send reminders or notifications.
3. Do not add reminder fields, toggles, permissions, timers, service workers, schedulers, delivery indicators, or a new surface.
4. Clarify the existing Settings status-card label and empty-state sentence as action activity/status, without changing its structure or height strategy.
5. Keep the Agenda editor viewport-bounded and internally scrollable through the existing dialog overflow owner.

## Viewport fit justification

No persistent page region changes. The one sentence appears only inside the existing modal, whose `max-height` is bounded to the viewport and whose overflow is internal. The Settings change is text replacement within an existing slot. Agenda and Settings therefore retain zero document-level vertical scrolling at 1440x900 and 1366x768, including the longest Agenda details state.

## Risks, trade-offs, and alternatives

- The statement may disappoint users who expect alerts, but hiding the limitation would damage calendar trust.
- A dedicated help dialog was rejected because one sentence does not justify another interaction or surface.
- Persistent Agenda copy was rejected because it would consume scarce dashboard height for an infrequent expectation check.
- Disabled reminder controls were rejected because they imply planned or partially available delivery.
- Browser-only timers were rejected because they cannot provide reliable background delivery.

This report is the Slice 3.7 implementation authority. A materially different layout or any notification implementation requires a revised decision and viewport analysis.
