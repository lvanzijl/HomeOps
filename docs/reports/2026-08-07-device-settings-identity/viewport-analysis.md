# Slice 3.6 Agenda and Settings viewport analysis

## Current composition

Agenda is a fixed dashboard widget with a mode canvas. Planning mode reserves a tools card containing three planning actions, selected-day context, and the internally bounded `Kalenderbronnen` selector. Month mode exposes the same selector in the compact command rail. Event create/edit and recurrence decisions already use overlays that do not participate in document flow.

Settings retains the approved status-first grid: fixed header, calendar-source management card with its own scrolling list, secondary summary/status cards, and a fixed action rail. Its detailed administration flows use `SettingsSurfaceDialog`; there is no Agenda layer-visibility control in Settings today.

Neither primary page currently requires document-level vertical scrolling at the supported desktop and laptop viewports.

## Overflow risk

Slice 3.6 needs an explanation and destructive reset for browser/device-specific Agenda visibility. Adding a new dashboard card, a Settings summary row, or persistent explanatory paragraphs beneath the source checkboxes would increase a reserved region and make Agenda height depend on copy and source count. Duplicating reset controls in Settings would also imply household/account scope that the feature does not have.

## Primary and secondary content

- Primary Agenda content: planning/month canvas, appointment actions, selected date, and source visibility toggles.
- Secondary Agenda content: device ownership explanation, identity lifecycle, and reset action.
- Primary Settings content: household/calendar-source health, backup/restore, and existing household administration actions.
- Secondary Settings content: no new device-layer content; the page should remain unchanged.

The canvas, appointment actions, selected day, and source toggles must remain visible. The device explanation, confirmation consequences, pending state, and recovery feedback may live in a bounded modal with internal overflow.

## Approved composition

1. Keep the Agenda and Settings page grids, reserved regions, card sizes, and overflow ownership unchanged.
2. Add one compact `Dit apparaat` text action in the existing `Kalenderbronnen` selector header. It shares the existing header row and must not add a new persistent row.
3. Open a bounded Agenda device-settings dialog outside document flow. The dialog explains that visibility belongs to this browser/device, is not an account or credential, and that reset creates a fresh local identity and reloads defaults.
4. Keep confirmation, pending, success/error recovery, and the destructive reset button inside that dialog.
5. Do not add a duplicate control or new card to Settings. Settings viewport validation remains required because the shared primary-page contract must stay intact.

## Viewport fit justification

The selector-header action reuses existing vertical space, so neither Planning tools nor the Month command rail grows. The modal is viewport-bounded and internally scrollable under the existing overlay strategy. Settings receives no structural change. Therefore normal content remains within the fixed app viewport at 1440×900 and 1366×768, independent of source count and explanatory-copy length.

## Risks, trade-offs, and alternatives

- The compact action is less prominent than a dedicated card, which is appropriate for an infrequent destructive preference reset.
- A Settings action was rejected because it would visually suggest household-wide/account ownership and duplicate the Agenda source-visibility context.
- Inline explanatory copy was rejected because it consumes permanent height and can push source rows or planning actions out of their reserved card.
- A browser-native confirmation was rejected because it cannot carry the required identity, non-authentication, pending, and recovery explanation consistently.

This report is the Slice 3.6 implementation authority. A materially different page composition requires a revised analysis before implementation continues.
