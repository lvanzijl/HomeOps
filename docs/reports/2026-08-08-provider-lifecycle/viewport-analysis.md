# Phase 5 Slice 5.6 — Provider lifecycle and credential guidance viewport analysis

**Status:** Approved for implementation on 2026-08-08.

## Approved revision after browser validation

The PostgreSQL-backed Chromium lifecycle scenario revealed that the archived-provider row was semantically present but its `Herstellen` action could not be clicked: the Home Assistant card's direct flex children were allowed to shrink below their content inside the secondary Woning scroll region, so the following floor-plan card painted over the restore action and intercepted pointer events. Document-level overflow remained zero, which is why the defect was not visible from the page-scroll guard alone.

The first revision made every direct Home Assistant overview/lifecycle block non-shrinking, but the region's implicit grid track still constrained the card itself and allowed content to paint into the following track. The approved composition is therefore revised at the overflow-owner level: the secondary Woning region is a sequential flex column whose direct cards cannot shrink. The Home Assistant card grows to the combined bounded content of its header, status, active/empty overview, and archived rows; the existing secondary Woning region remains the sole overflow owner. This preserves the approved information architecture and placement, while requiring browser validation to prove that the restore action's hit area does not intersect the following floor-plan card.

## Current composition

Settings → Woning is a fixed-height dashboard workspace. The selected-floor panel keeps its header and summary fixed, then reserves one internally scrolling region for active rooms and one internally scrolling secondary region for Home Assistant, floor-plan actions, replacement review, and archived rooms. The Home Assistant card currently expands into a two-column provider/mapping overview and opens separate bounded dialogs for provider fields and room mappings.

The current provider form edits only display name, address, and enabled state. Existing backend archive/restore routes are not reachable from the UI, archive impact is not explained, archived providers are filtered from the overview, and the browser has no authoritative indication whether the administrator-managed token is configured. The existing “connection check” refreshes mappings and therefore cannot prove a newly configured provider with no mappings.

## Why inline lifecycle management would exceed the reserved region

Safe provider management needs credential-key guidance and configured/missing status, connection-test progress and normalized outcomes, mapping dependency counts, explicit archive consequences, restore state, editable fields, and retained errors. Rendering all of this inside the existing summary column would increase the Home Assistant card’s minimum height and compete with its mapping list, resume strategy, floor-plan actions, and archived-room content. At common laptop height, the secondary region could still scroll internally, but the provider card would become a long document-like surface whose primary actions and consequences are separated.

## Primary and secondary information

Primary information is the active provider name/address/state, whether the required administrator secret is configured, the last safe connection-test result, mapping dependency counts, and the manage/test/archive/restore actions. Archive confirmation must keep the number of affected mappings and rooms visible. Restore must state that preserved mappings remain unavailable until the provider is active and successfully checked.

Secondary information is the exact environment-key spelling, why the secret cannot be entered or viewed in FamilyBoard, archived timestamp, safe normalized error explanation, and the existing resume-strategy controls. These may be placed in the bounded management body or compacted into short status rows.

## Approved composition

1. Keep the existing Home Assistant overview in the secondary Woning region. Its fixed header gains a compact credential-status label and retains a single `Home Assistant beheren` action. The overview keeps provider/mapping runtime information; it does not become the lifecycle editor.
2. `Home Assistant beheren` opens one viewport-bounded provider-management dialog. The fixed header identifies Home Assistant and exposes only a close action.
3. The internally scrolling body contains, in order: safe credential guidance with the exact administrator key and configured/missing status; display-name/address/enabled fields; a connection-test panel with one action and normalized result; mapping/room dependency impact; and provider lifecycle guidance.
4. The fixed footer keeps cancel/save visible. Archive is a separately styled action that opens an explicit confirmation state inside the same dialog rather than stacking a second modal. The confirmation repeats the provider name and affected active/archived mapping and room counts. A failed operation preserves the dialog and its input.
5. Archived Home Assistant providers are shown as compact rows after the active overview inside the existing secondary internal-scroll region. Each row shows name, archived state, preserved dependency count, and `Herstellen`. Restore errors stay visible in that row. Restoring does not expose or request a credential and returns the provider to an enabled but not-yet-proven state; the user is directed to run the connection test.
6. Empty setup uses the same management dialog for safe provider creation. Credential status is server-authoritative; no secret input, browser storage, diagnostics value, or raw connection exception is rendered.

## Viewport-fit justification

The Woning page retains its existing fixed grid, room region, and secondary overflow owner. That secondary owner is a flex-column stack of non-shrinking cards rather than an implicit grid, matching its sequential reading order and preventing sibling tracks from overlapping. The active overview remains a bounded non-collapsing card; each direct overview/lifecycle child is also non-shrinking, and archived providers are compact rows in the already scrolling secondary region. Provider management uses the established settings backdrop with `max-height: 100%`, a fixed header/footer, and a `minmax(0, 1fr)` internally scrolling body. Archive confirmation replaces lifecycle content within that same dialog and does not add height or a second overlay. At 1440×900 and 1366×768, variable guidance, errors, and dependency detail therefore remain inside the dialog or secondary region while the document and primary page stay fixed.

## Risks, trade-offs, and alternatives

- Keeping lifecycle management in one dialog adds a navigation step, but it keeps credential guidance, connection proof, and destructive consequences together without lengthening the overview.
- Restore does not automatically contact Home Assistant. This avoids an unexpected external call during a reversible lifecycle action; the immediately available guided connection test provides explicit proof.
- A raw token input would be more convenient, but it would violate the approved secret boundary and require encrypted-at-rest storage, rotation, redaction, backup, and security review. That remains a separate future slice.
- A dedicated top-level integration page could provide more room, but it would add navigation and duplicate the Woning provider context. The bounded dialog fits the current scope and composition.
- Automatically archiving mappings was rejected. Provider archive disables their runtime effect while preserving mapping lifecycle and priorities; the impact preview makes that dependency explicit.

Implementation must follow this composition. A material change to the information architecture or overflow strategy requires revising this analysis before continuing.
