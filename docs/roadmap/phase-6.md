# Phase 6 — Shopping and Motivation lifecycle completion

Phase 6 completes the normal user lifecycle for Shopping lists/items and Motivation goals/helpful moments without weakening the fixed-height FamilyBoard dashboard model.

**Phase status:** Completed 2026-08-08.

| Slice | Status | Outcome |
| --- | --- | --- |
| 6.0 Mandatory primary-page analyses | Completed 2026-08-08 | Approved separate Shopping and Motivation viewport contracts, including the required Motivation overflow repair. |
| 6.1 Shopping list lifecycle | Completed 2026-08-08 | Added bounded multi-list creation plus explicit archive, restore, and permanent-delete lifecycle. |
| 6.2 Shopping item editing and unified history | Completed 2026-08-08 | Correct items atomically and make Home/Shopping use one server-backed history/suggestion source. |
| 6.3 Goal progress definition and audit ledger | Completed 2026-08-08 | Task-derived progress now uses an immutable ledger with labelled backfill and explicit compensating corrections. |
| 6.4 Helpful-moment and family-goal lifecycle | Completed 2026-08-08 | Helpful moments can be corrected or softly removed with retained attribution; family goals can be stopped, reviewed, and conditionally restored without losing ledger history. |

## Slice 6.0 implementation boundary

This slice is analysis and documentation only. It does not change React, CSS, APIs, persistence, migrations, fixtures, generated contracts, or existing behavior.

The Shopping contract keeps the current execution-first page: one fixed command row, one flexible internally scrolling active-list region, and one fixed footer strip. New list creation and active/archived list management open from an always-enabled `Lijsten` footer action. Item editing, destructive confirmation, and the legacy-local-history decision use bounded contextual surfaces and never add page rows. The implementation must also add border-box sizing so the card no longer exceeds its host.

The Motivation contract keeps the current two-column/top plus full-width/bottom story grid, but the primary goal card must be compacted before new lifecycle UI is added. The default card retains goal identity, current/target progress, one truthful progress-source line, and compact actions; duplicate celebration/proof/story content moves to the existing story/detail surfaces. Ledger history/correction, helpful-moment edit/delete, and family-goal lifecycle use bounded fixed-header/action dialogs with internally scrolling bodies.

Validation: repository/audit/code/test inspection; live isolated-data browser inspection at 1280×720; measured document/body overflow and internal regions; current Shopping management, Motivation progress, appreciation-history, and personal-goal dialogs; and the existing Playwright primary-page viewport guard at 1440×900 and 1366×768. The guard passes 1/1. The approved analyses and completion report are under `docs/reports/2026-08-08-phase-6-viewport-analysis/`.

## Slice 6.1 outcome

Shopping now exposes an always-available `Lijsten` action. Its bounded directory creates additional named lists, opens active lists, and shows archived lists without changing the page's command/list/footer composition. Active names are trimmed, required, limited to 160 characters, and compared case-insensitively; an archived name may be reused, while restore is blocked if that would collide with an active list.

Archive is explicitly reversible. Restore reopens the list with its items. Permanent delete is explicitly confirmed and removes the list plus its item rows while retaining only household-level suggestion and purchase history. Confirmation states show open, completed, deleted, and total item counts. Expected-update checks protect every lifecycle mutation and compare at the millisecond precision carried by the generated TypeScript client.

Migration `20260808160556_AddShoppingListLifecycleCompletion` removes rows previously marked as permanently deleted and replaces the old name index with a filtered unique index for active lists. OpenAPI and the TypeScript client were regenerated twice with pinned NSwag 14.7.1 and identical hashes.

The implementation follows the approved Shopping analysis. The workspace now uses border-box sizing; list-directory growth is owned by its internal scroller. PostgreSQL-backed Chromium passes all 17 scenarios, including create/archive/restore/permanent delete and the no-document-scroll checks at 1440×900 and 1366×768. Independent in-app inspection at 1366×768 measured zero document overflow, a 585.1 px dialog ending at 730.8 px, and a border-box Shopping workspace ending at 743.0 px. See `docs/reports/2026-08-08-shopping-list-lifecycle/implementation.md`.

## Slice 6.2 outcome

Shopping items now have one atomic, concurrency-checked edit contract for label, optional free-form quantity, store, and decorative avatar. The bounded `Aanpassen` editor keeps failed drafts visible and lets households preserve purchase/store attribution when correcting a name. Migration `20260808172019_AddShoppingItemEditingAndHistory` adds quantity and a household-level item-history table, backfills existing items, and keeps imported browser strings out of the server unless a user explicitly chooses `Overnemen` from the bounded management surface.

Home no longer reads or writes `homeops.shopping.history.v1` as a suggestion source. Home and Shopping both consume the same server history endpoint; item additions, corrections, refreshes, and another client therefore see one household history with attached store suggestions. The old local key can be explicitly imported or discarded and is never uploaded on page load.

Validation passes with focused backend 22/22, focused frontend 41/41, full backend 655/655, full frontend 387/387, both builds, PostgreSQL migration baseline 4/4, EF list/drift/idempotent-script checks, twice-identical pinned NSwag 14.7.1 output, and Playwright 18/18. Automated viewport checks cover 1440×900 and 1366×768; independent in-app inspection at 1366×768 measured zero document overflow, no console errors, and the 585.125 px item editor ending at 730.75 px. See `docs/reports/2026-08-08-shopping-item-editing-history/implementation.md`.

## Slice 6.3 outcome

Goal progress is now task-derived and explicitly auditable. A completed shared-household task appends `+1` to the active family goal; a completed member-assigned task appends `+1` to that member's active individual goal. Reopening appends a linked `-1`. Repeated complete/reopen calls do not duplicate transitions. Manual progress editing is not supported; the only manual path is a reasoned signed correction, optionally linked to and exactly compensating an existing row.

Migration `20260808181329_AddMotivationProgressLedger` backfills every existing goal with one labelled baseline. Displayed progress is the ledger sum bounded to the goal target, while raw history is preserved across target changes. Motivation and Weekly Reset reads derive progress from the ledger; the legacy current-progress field remains only as a refreshed compatibility projection.

The approved Motivation composition is now realized. The primary goal card contains identity/anticipation, one compact progress block, one source sentence, and fixed actions; duplicate proof, celebration, and next-step content no longer clips inside the card. Ledger and correction states share one fixed-header dialog with internal body scrolling. Backend 658/658, frontend 388/388, PostgreSQL 5/5, builds, EF checks, twice-identical pinned NSwag, and Playwright 19/19 pass. Independent 1280×720 inspection measured equal 331 px card client/scroll heights and zero document overflow. See `docs/reports/2026-08-08-motivation-progress-ledger/implementation.md`.

## Slice 6.4 outcome

Helpful moments now support concurrency-checked correction and soft removal. Removed family members remain visible as historical attribution, while new reattribution is limited to active members. Weekly Reset uses the same retained-attribution and soft-delete rules. Browser-safe millisecond update timestamps keep optimistic concurrency stable through the generated TypeScript client.

Family goals now have an explicit stop/archive contract. Stopping freezes new task contributions while retaining the immutable ledger, projected progress, and celebration history. The existing story-history destination lists archived goals; restoration is intentionally available only when no other family goal is active, preventing silent replacement.

All lifecycle controls remain inside the approved Motivation dialogs. Appreciation edit/delete replaces the history body, family-goal stop replaces the edit body with named confirmation, and archived history owns its internal scroller. Backend 661/661, frontend 390/390, PostgreSQL 5/5, builds, twice-identical pinned NSwag 14.7.1, and Playwright 20/20 pass. Independent 1280×720 inspection measured zero document overflow, equal 331 px goal-card client/scroll heights, a bounded 706 px appreciation-history dialog, a 570 px non-overflowing editor, and a fully visible 211 px stop confirmation. See `docs/reports/2026-08-08-motivation-lifecycle/implementation.md`.

## Fixed boundaries

- Work remains one numeric slice and one commit per run.
- Slice 6.1 changes list lifecycle only; item editing/history and all Motivation work remain deferred.
- Slice 6.2 changes Shopping item correction and shared history/suggestions only.
- Slice 6.3 defines and implements progress accounting/correction only; helpful-moment and family-goal lifecycle remain Slice 6.4.
- Slice 6.4 completes helpful-moment and family-goal lifecycle without redesigning the approved primary composition.
- Shopping and Motivation remain fixed-height primary pages with no document-level vertical scrolling.
- Phase 1 history is not modified.

## Phase exit criteria

- [x] Multiple shopping lists can be created, archived, restored, and intentionally deleted.
- [x] Shopping items can be corrected in place.
- [x] Home/Shopping suggestions use one server source.
- [x] Goal progress is explainable and correctable.
- [x] Helpful moments and family goals have complete user lifecycles.
