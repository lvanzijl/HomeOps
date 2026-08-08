# Phase 5 Slice 5.4 — Climate mapping management viewport analysis

**Status:** Approved for implementation on 2026-08-08.

## Approved revision after browser validation

The first isolated Chromium run revealed that the existing Home Assistant card could shrink below the minimum height of its own two-column content inside the secondary Woning scroll region. The later archived-room section then occupied the card's visual overflow area and intercepted `Koppelingen beheren`, even though the document itself did not scroll. This was not visible from document-overflow metrics alone.

The approved composition is revised to make the Home Assistant card a non-collapsing, bounded-height item within the existing secondary internal-scroll region. The region remains the only owner of overflow and the mapping workspace remains the single room-scoped dialog. This does not change the information architecture, region allocation, or primary-page scrolling strategy; it restores the intended separation between sequential secondary cards.

## Current composition

Settings → Woning is a fixed-height dashboard surface. Its selected-floor panel keeps the floor header and summary fixed, then divides the remaining height between a primary internally scrolling room list and a secondary internally scrolling integration/archive region. Home Assistant already lives in that secondary region with a provider summary and mappings grouped by room. The current `Koppelingen beheren` action only focuses the corresponding room row and does not provide mapping management.

## Why an inline workflow would exceed the reserved region

Mapping management needs role grouping, active and archived records, health and timestamps, source metadata, priority and enablement controls, validation messages, and lifecycle actions. Expanding those fields in every Home Assistant room card would make the secondary Woning region highly variable and would compete with the provider summary, resume strategy, floor-plan actions, replacement review, and archived-room content. At 1366×768 the region cannot reserve stable space for both the overview and an inline editor without either hiding actions or causing the primary page to grow.

## Primary and secondary information

The primary information is the selected room, required semantic roles, active mappings in priority order, mapping health, and the create/edit/archive/restore actions. The selected mapping's source identifier, enabled state, priority, last check, last success, and safe diagnostic summary must remain available during review.

Secondary information is optional display, source-kind, area, and device metadata; archived mappings; shared-zone room references; and explanatory provider guidance. These may be compacted into short metadata rows, disclosed only while editing, or internally scrolled.

## Approved composition

The existing Home Assistant overview remains grouped by room and keeps its compact health cards. `Koppelingen beheren` opens a single room-scoped modal workspace rather than focusing the room list.

The workspace uses the existing viewport-bounded backdrop and dialog pattern:

1. A fixed header identifies the room and explains that mappings only bind approved semantic roles to provider entity references.
2. A compact capability strip shows whether room climate is configured/enabled and summarizes required role status.
3. One internally scrolling body groups mappings by semantic role. Active mappings are ordered by priority; archived mappings remain visibly separate. Each compact row shows source, enabled/archive state, health, last check, last success, safe diagnostic text, and shared-room count.
4. Create and edit use an editor inside the same bounded dialog. The editor replaces the list body temporarily rather than stacking another modal. Its source metadata section is compact and internally scrollable. The fixed footer keeps cancel/save visible.
5. Archive and restore are explicit row actions. Errors remain inside the dialog and preserve the current editor values.

There is no provider discovery contract in the current backend. The form therefore accepts only the existing typed external source reference fields and a semantic role; it offers no Home Assistant service, method, payload, or arbitrary JSON controls. If discovery is added later, the source field can become a selector without changing this information architecture.

## Viewport-fit justification

The Woning page retains its existing fixed regions and never expands for the management workflow. Secondary cards keep a real minimum block size and scroll as sequential items inside their reserved region rather than shrinking until their children overlap. The backdrop is constrained to the Woning settings surface, and the mapping dialog has `max-height: 100%`, a fixed header/footer, and a `minmax(0, 1fr)` body that owns vertical overflow. The dialog is at most 52rem wide, uses a two-column metadata grid only where width permits, and collapses to one column on narrow viewports. At 1440×900 and 1366×768, list volume and editor content therefore scroll inside the dialog; the document and primary page remain fixed.

## Risks, trade-offs, and alternatives

- A room-scoped dialog requires returning to the overview to switch rooms, but it prevents accidental cross-room edits and keeps the room/provider dependencies explicit.
- Manual typed entity references are less convenient than discovery, but inventing a discovery API or exposing service calls would exceed this slice and weaken the safety boundary.
- A side-by-side list/editor would expose more context, but it becomes too dense at laptop width. Replacing the dialog body keeps form labels and lifecycle feedback readable.
- Drag-and-drop priority ordering was considered. Numeric priority editing matches the current API, remains keyboard accessible, and exposes duplicate conflicts directly; visual reordering can remain a future enhancement.

Implementation must follow this composition. A material change to the information architecture or overflow strategy requires revising this analysis before continuing.
