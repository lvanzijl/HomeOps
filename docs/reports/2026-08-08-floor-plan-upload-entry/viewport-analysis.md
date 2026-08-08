# Phase 5 Slice 5.5 — Floor-plan upload and replacement entry viewport analysis

**Status:** Approved before implementation on 2026-08-08.

## Current composition

Settings → Woning is a bounded workspace inside the existing Settings dialog. It contains a fixed Woning header and status strip above a two-column grid. The left column owns the floor rail. The selected-floor column keeps its heading and summary fixed, then divides remaining height between the active-room list and an internally scrolling secondary region.

After Slice 5.4, the secondary region contains the bounded Home Assistant card, a small floor-plan placeholder, the existing replacement-review surface, and archived-room controls. The Home Assistant card has a real minimum block size so later content remains sequential rather than overlapping it. The page and Settings dialog do not use document-level vertical scrolling.

## Why the requested workflow does not fit inline

Uploading needs file guidance, selected-file state, progress, validation feedback, a sanitized derivative preview, metadata, and a deliberate first-activation or replacement-review next step. Rendering those states directly inside the secondary region would make its floor-plan card highly variable in height. It would also compete with Home Assistant, replacement review, and archive content, and on a laptop viewport could obscure the relationship between the selected floor and the upload action.

The existing page does not currently overflow. The risk is introducing a growing inline upload/preview flow into a region whose height is deliberately bounded.

## Primary and secondary information

Primary information that must remain visible:

- selected floor name and setup summary;
- active room list and room management actions;
- global Woning load/error status;
- an honest compact indication of whether the selected floor has an active usable plan.

Secondary information that may live in the existing internal scroll owner:

- Home Assistant setup and mappings;
- floor-plan upload entry;
- replacement-review progress;
- archived rooms.

Upload-only detail that may be confined to a dialog:

- accepted media and 10 MiB limit;
- selected filename and client-side blockers;
- upload pending/progress state;
- safe derivative preview and server validation summary;
- first activation or replacement-review transition;
- the larger-screen recommendation for boundary review and drawing.

## Approved composition

Keep the current Woning grid and room-region split unchanged. Replace the placeholder in the secondary region with one compact `Plattegrond` card. The card shows the selected floor's active-plan state and one named upload/replace action. It may be reached by internally scrolling the secondary region; it does not displace the primary room list.

Open upload in a bounded modal dialog:

1. Fixed header: selected floor and close action.
2. Internally scrolling body: media guidance, file input, validation/error state, and, after success, the safe derivative preview plus server metadata.
3. Fixed footer: cancel/retry and the single authoritative next action.

For a floor without an active plan, the next action activates the validated upload and then offers the existing room-boundary editor. For a floor with an active plan, the next action starts the existing replacement-review lifecycle and returns the user to that established bounded surface. Upload never silently replaces an active plan.

Phone copy remains explicit: choosing and uploading a file is permitted, but checking and drawing room boundaries is recommended on a larger screen. The preview may compact vertically at narrow widths; the action footer remains visible.

## Fit justification

At 1440×900 and 1366×768, the Woning page retains the already validated fixed header/status/grid allocation. The only inline change is a compact card inside an existing `overflow-y: auto` region. The modal is capped by the Settings viewport, with only its body scrolling. Its preview uses `object-fit: contain` and a bounded height, so image dimensions and validation text cannot expand the document. Responsive rules reduce preview height and keep the dialog within the viewport before any page overflow can occur.

## Risks, trade-offs, and alternatives

- A fully inline drop zone was rejected because preview and error states would make the secondary card variable-height and harder to understand alongside replacement review.
- A separate primary page was rejected because upload is a bounded setup action and Phase 5 already owns a Settings → Woning management surface.
- Automatically activating every upload was rejected: replacements must enter explicit review, and first activation must remain a named user action.
- Automatically opening the boundary editor on phones was rejected because the existing editor intentionally limits drawing at narrow widths.
- Client checks improve immediacy but remain advisory. The server remains authoritative for media detection, truncation, sanitization, dimensions, and upload limits.

Implementation must preserve this information architecture. A technical limitation that requires changing the page regions or document-scroll strategy requires revising this analysis before continuing.

## Approved revision after browser validation

The first PostgreSQL-backed browser run passed upload, safe preview, first activation, and replacement-review creation, but exposed an existing technical limitation in the assumed composition. Once a replacement review became active, the full three-column review workspace rendered inside the small secondary scroll region. Its controls remained in the accessibility tree and could be reported as visible while the clipped Settings root intercepted pointer input. A taller inline card cannot make this workflow operable without taking the primary room region away or relying on nested clipping.

The approved composition is therefore revised before the layout implementation continues:

- the secondary region keeps only a compact replacement summary/entry card;
- an active review opens as a dedicated bounded Woning sub-workspace, using the same replacement-of-the-management-composition pattern already used by the room-boundary editor;
- the dedicated workspace owns its existing internal list, comparison, detail, and readiness regions and adds a named `Terug naar Woning` action;
- upload completion opens that dedicated workspace directly, while later Settings visits show a compact resume action;
- cancellation and retry remain inside the dedicated workspace, so neither operation depends on controls clipped within the secondary region.

This revision does not change the global Settings dialog, the primary Woning information hierarchy, or the no-document-scroll strategy. It corrects the placement of the already established replacement-review workspace so its intended internal containment can operate.
