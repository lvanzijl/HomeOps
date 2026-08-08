# Phase 6 — Shopping and Motivation lifecycle completion

Phase 6 completes the normal user lifecycle for Shopping lists/items and Motivation goals/helpful moments without weakening the fixed-height FamilyBoard dashboard model.

**Phase status:** In progress.

| Slice | Status | Outcome |
| --- | --- | --- |
| 6.0 Mandatory primary-page analyses | Completed 2026-08-08 | Approved separate Shopping and Motivation viewport contracts, including the required Motivation overflow repair. |
| 6.1 Shopping list lifecycle | Not started | Add visible multi-list creation plus explicit archive, restore, and permanent-delete lifecycle. |
| 6.2 Shopping item editing and unified history | Not started | Correct items in place and make Home/Shopping use one server-backed history/suggestion source. |
| 6.3 Goal progress definition and audit ledger | Not started | Define progress semantics, derive totals from immutable ledger entries, and add compensating corrections. |
| 6.4 Helpful-moment and family-goal lifecycle | Not started | Add helpful-moment correction/removal and family-goal stop/archive/history behavior. |

## Slice 6.0 implementation boundary

This slice is analysis and documentation only. It does not change React, CSS, APIs, persistence, migrations, fixtures, generated contracts, or existing behavior.

The Shopping contract keeps the current execution-first page: one fixed command row, one flexible internally scrolling active-list region, and one fixed footer strip. New list creation and active/archived list management open from an always-enabled `Lijsten` footer action. Item editing, destructive confirmation, and the legacy-local-history decision use bounded contextual surfaces and never add page rows. The implementation must also add border-box sizing so the card no longer exceeds its host.

The Motivation contract keeps the current two-column/top plus full-width/bottom story grid, but the primary goal card must be compacted before new lifecycle UI is added. The default card retains goal identity, current/target progress, one truthful progress-source line, and compact actions; duplicate celebration/proof/story content moves to the existing story/detail surfaces. Ledger history/correction, helpful-moment edit/delete, and family-goal lifecycle use bounded fixed-header/action dialogs with internally scrolling bodies.

Validation: repository/audit/code/test inspection; live isolated-data browser inspection at 1280×720; measured document/body overflow and internal regions; current Shopping management, Motivation progress, appreciation-history, and personal-goal dialogs; and the existing Playwright primary-page viewport guard at 1440×900 and 1366×768. The guard passes 1/1. The approved analyses and completion report are under `docs/reports/2026-08-08-phase-6-viewport-analysis/`.

## Fixed boundaries

- Work remains one numeric slice and one commit per run.
- Slice 6.1 changes list lifecycle only; item editing/history and all Motivation work remain deferred.
- Slice 6.2 changes Shopping item correction and shared history/suggestions only.
- Slice 6.3 defines and implements progress accounting/correction only; helpful-moment and family-goal lifecycle remain Slice 6.4.
- Slice 6.4 completes helpful-moment and family-goal lifecycle without redesigning the approved primary composition.
- Shopping and Motivation remain fixed-height primary pages with no document-level vertical scrolling.
- Phase 1 history is not modified.

## Phase exit criteria

- [ ] Multiple shopping lists can be created, archived, restored, and intentionally deleted.
- [ ] Shopping items can be corrected in place.
- [ ] Home/Shopping suggestions use one server source.
- [ ] Goal progress is explainable and correctable.
- [ ] Helpful moments and family goals have complete user lifecycles.
