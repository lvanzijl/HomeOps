# Slice 3.4 Settings viewport analysis

Date: 2026-08-07

## Current composition

Settings is a fixed-height dashboard inside the shared FamilyBoard workspace. Its composition is a status header, a reserved main grid containing calendar-source and maintenance information, and a compact action rail. Secondary tasks such as source editing, restore, family administration, housing settings, and calendar repair already open in `SettingsSurfaceDialog`; that dialog is bounded by the viewport and gives its body an internal scroll region.

The current page does not exceed its reserved viewport region. The risk introduced by household time-zone management is not the action itself, but the variable-height IANA search results, impact explanation, enabled-source preflight failures, and confirmation content. Placing any of those inline in the dashboard would expand a primary page whose height must remain stable.

## Information priority

The dashboard status, calendar-source health, backup/restore readiness, and existing action rail remain primary and must stay visible without document scrolling. Household time-zone management is important but episodic, so it is secondary configuration. Search results, preview counts, detailed effect descriptions, and source-specific errors may be limited and internally scrolled.

## Approved composition

Add one compact `Tijdzone` action to the existing action rail. It opens the existing bounded Settings dialog pattern without adding a dashboard row or changing the main grid.

Inside the dialog:

- show the server-authoritative current IANA zone and a searchable IANA input at the top;
- bound the matching-zone list and allow it to scroll internally;
- show the server preview as compact impact rows for manual timed events, manual all-day events, enabled imported sources, and disabled imported sources;
- keep explicit confirmation and the apply action adjacent to the preview;
- show source-specific preflight failures in a bounded error list while retaining the selected zone and preview;
- disable competing actions while previewing or applying.

The dashboard retains its existing reserved regions. The dialog remains within its established viewport maximum and delegates overflow to its body, so both 1440x900 and 1366x768 keep `document.body` free of vertical overflow. At the smaller viewport, control spacing may compress under the existing media rules, but the information architecture and page height do not change.

## Risks and trade-offs

Long IANA identifiers and source error messages can wrap; the dialog uses normal wrapping and internal scrolling rather than widening or growing the page. A native select was rejected because it is difficult to search and can become unwieldy. An inline settings card was rejected because preview and failure states have variable height. A separate primary page was rejected because this is an infrequent household-level operation and would add navigation without improving containment.

This analysis is the implementation authority for Slice 3.4. A materially different page composition requires a revised analysis before implementation continues.
