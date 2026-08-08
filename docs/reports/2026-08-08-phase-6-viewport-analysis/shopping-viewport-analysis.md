# Phase 6 Slice 6.0 — Shopping viewport analysis

**Status:** Approved on 2026-08-08 for Slices 6.1 and 6.2.

## Current page composition

Shopping is rendered by `ShoppingListWidget` inside the Lists workspace. The shell owns the 48 px navigation row, compact workspace header, and bounded page body. Inside that body, `.shopping-workspace` uses three rows:

1. a command/status region containing quick-add, decorative-avatar selection, add action, and one-line operational status;
2. a flexible active-list region grouped by preferred store, with `.shopping-section-body` as the vertical scroller;
3. a footer strip with `Afgevinkt`, `Herstellen`, `Andere lijsten`, and `Beheer` actions.

Completed items, deleted-item recovery, other lists, and current-list management already open in a bounded Shopping dialog. The current UI can create only the first default list, has no archived-list surface, performs archive/delete without confirmation, and cannot edit item label/quantity in place.

## Measurements and why the reserved region is at risk

Live inspection used an isolated PostgreSQL `visual-full` fixture at 1280×720, a stricter viewport than the required 1366×768 and 1440×900 checks.

| Region | Measured height | Overflow behavior |
| --- | ---: | --- |
| Workspace navigation | 48 px | Fixed shell row |
| Lists panel | 644 px | `overflow-y: hidden` |
| Workspace header | 45 px | Fixed context |
| Workspace page body / widget host | 564 px | Hidden; host `scrollHeight` 591 px |
| Shopping card | 591 px | Three fixed/flexible rows; card bottom extends ~26 px beyond its host |
| Command/status region | 133 px | Auto-sized; no page scroll |
| Active-list region | 349 px | Hidden outer region; item body owns vertical scrolling |
| Active item scroller | 309 px client / 315 px content | `overflow-y: auto` |
| Footer strip | 61 px | Fixed, horizontal overflow only |

Body and document vertical overflow were both 0 px, and every footer action remained visible. However, the card uses `height: 100%` with padding/border under content-box sizing, so its box is about 26 px taller than the 564 px host. The panel hides that overshoot. This is not document scrolling, but it is an avoidable clipping dependency that new lifecycle controls could expose. Slice 6.1 must make the card border-box sized and may not add another default page row.

The existing Playwright primary-page guard passes at 1440×900 and 1366×768. Current success therefore comes from bounded overflow ownership, not spare unlimited height.

## Primary and secondary information

Primary information and actions:

- quick-add input and add action;
- current list identity and operational status;
- active items grouped by store;
- complete/check-off and compact item actions;
- visible access to list creation and list lifecycle.

Secondary/contextual information:

- completed items;
- deleted-item recovery;
- other active lists and archived lists;
- rename/archive/restore/permanent-delete consequences;
- item metadata editing;
- server suggestion/history detail and the one-time legacy-local-history decision.

The primary command row, active-list region, and footer remain visible. Full secondary lists, forms, histories, and confirmations must never enter the page grid.

## Approved composition

```text
Lists workspace body (overflow hidden)
└── Shopping card (border-box; rows auto minmax(0,1fr) auto)
    ├── Command/status: quick-add + compact feedback
    ├── Active list: store groups and item rows (one internal vertical scroller)
    └── Footer: Afgevinkt · Herstellen · Lijsten · Beheer

Bounded contextual surfaces
├── Afgevinkt / Herstellen
├── Lijsten: create + active + archived lifecycle
├── Current-list management / destructive confirmation
├── Item editor
└── Legacy local-history decision
```

### Slice 6.1 placement

- Rename `Andere lijsten` to an always-enabled `Lijsten` action; its count represents non-primary active plus archived lists as clearly labelled groups.
- The `Lijsten` dialog contains a compact fixed create action/form, active-list tabs or rows, and an archived section. Long active/archived collections scroll inside the dialog body.
- Keep `Beheer` for the current list. Archive and permanent delete transition the same bounded surface into an explicit confirmation state; do not stack another modal.
- Confirmation shows the list name, active/completed/deleted item count, reversibility, and permanent-deletion consequences. Restore returns a list to active state before exposing it in normal list selection.
- Creating a list must not silently replace or archive the current primary list. After successful creation, expose an explicit open/switch action and durable confirmation.

### Slice 6.2 placement

- Add a compact `Aanpassen` item action that opens a bounded item editor for label, quantity, existing store, and existing decorative metadata. Do not expand the row into a multi-field form.
- Keep Home and Shopping suggestion/history reads server-backed. Any suggestion/history list remains inside its existing bounded consumer surface.
- If `homeops.shopping.history.v1` exists, show one bounded discard/migration decision. It must not add a banner or card to the Shopping page and must not silently upload stale browser strings.
- Loading, save success, and recoverable errors reuse the fixed command/status slot or the active dialog; they do not create a fourth page row.

## Viewport-fit justification

At 1280×720 the existing shell leaves 564 px for the widget host. After border-box correction, the observed 133 px command region and 61 px footer still leave roughly 340 px for the active-list region. The required 1366×768 and 1440×900 viewports provide more height, and the existing exact-viewport guard already passes. Item/list counts can therefore grow only the active scroller or contextual dialog scroller, never the document.

The implementation should reduce command density before increasing its height—for example by keeping optional decorative metadata compact—but does not need to redesign the page. A new persistent rail, archive card, creation card, or history panel is prohibited by this contract.

## Risks, trade-offs, and alternatives

- Combining active and archived list lifecycle in `Lijsten` adds one navigation step, but preserves the dominant in-store workflow and keeps create visible.
- A fifth footer action was rejected because it increases horizontal crowding; the existing other-list destination can become the full `Lijsten` lifecycle surface.
- Inline create/archive panels were rejected because variable validation and list counts would reduce the active-list region.
- A permanent secondary rail was rejected because it consumes active-list width and gives administration equal weight to shopping execution.
- Row-level inline item editing was rejected because it changes row height and scroll position while shopping.
- Bounded surfaces must retain input after errors, keep destructive consequences visible, and return focus to the triggering control.

Implementation must follow this composition. A material change to the three-row page grid, overflow ownership, or contextual-surface strategy requires revising this analysis before implementation.
