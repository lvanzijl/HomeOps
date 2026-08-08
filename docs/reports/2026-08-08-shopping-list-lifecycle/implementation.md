# Phase 6 Slice 6.1 — Shopping list lifecycle

**Status:** Completed on 2026-08-08.

## Outcome

- The Shopping footer now has an always-enabled `Lijsten` action. Its bounded directory creates additional named lists, opens active lists, and exposes archived lists.
- Active list names are trimmed, required, limited to 160 characters, and compared case-insensitively. Archived names may be reused; restore returns a conflict when an active list already owns that name.
- Archive is reversible and restore preserves all list items. Permanent delete requires explicit confirmation and physically removes the list and its item rows. Household-level suggestion and purchase history intentionally remains shared history.
- Lifecycle confirmation replaces the management content in the same bounded dialog rather than stacking dialogs. It shows active, completed, deleted, and total item counts plus the action's consequences.
- Archive, restore, and permanent delete use `ExpectedUpdatedUtc`. The API compares at millisecond precision because that is the precision represented by JavaScript `Date`; genuine stale timestamps still return 409.
- List summaries expose lifecycle state and counts. Normal list queries remain active-only unless `includeArchived=true` is requested.
- Migration `20260808160556_AddShoppingListLifecycleCompletion` removes legacy rows that had been marked as permanently deleted and replaces the old household/name index with active-only filtered uniqueness.

## Viewport implementation

The implementation follows the approved Shopping contract in `docs/reports/2026-08-08-phase-6-viewport-analysis/shopping-viewport-analysis.md`. The fixed command row, internally scrolling active-list region, and fixed footer remain unchanged. `Lijsten` owns create/active/archive/restore/delete variability inside one bounded surface. The Shopping workspace now uses `box-sizing: border-box`.

PostgreSQL-backed Playwright confirms zero body/document overflow at 1440×900 and 1366×768. Independent in-app inspection at 1366×768 measured a 585.1 px directory dialog ending at 730.8 px, a border-box Shopping workspace ending at 743.0 px, body/root heights exactly equal to the 768 px viewport, and no console warnings or errors.

## Validation

| Gate | Result |
| --- | --- |
| Focused list backend tests | 19/19 passed, including validation, conflicts, counts, browser timestamp precision, archive/restore, confirmation, and physical row cleanup |
| Focused Shopping frontend tests | 22/22 passed, including create, archive confirmation, restore, and permanent delete |
| Full backend tests | 652/652 passed |
| Full frontend tests | 384/384 passed with one worker; parallel execution on this machine repeatedly timed out three unrelated pre-existing avatar/people tests at their 5-second limit |
| Solution build | Passed; existing SQLitePCL `NU1903` warning remains |
| Frontend production build | Passed; existing large-chunk warning remains |
| PostgreSQL migration baseline | 4/4 passed through Rancher Desktop |
| EF migration list/model drift/idempotent script | Passed; generated temporary script was removed |
| Pinned NSwag 14.7.1, repeated generation | Hash-identical OpenAPI and TypeScript client output |
| PostgreSQL-backed Playwright | 17/17 passed, including lifecycle and both required viewports |
| Independent in-app browser | Bounded directory, internal overflow, border-box workspace, zero document overflow, and clean console verified at 1366×768 |

Pinned generation hashes:

- OpenAPI: `6ABAAE1DE360E1D68ED97120AF3C9B07D93203C7375F73FF5EA6E8691ED822F9`
- TypeScript client: `447F14AF6AD961A9843304C3DB1AEBBF6F26C4794F4D6FFA722A97D31CB2CAAC`

## Boundary

This slice does not add Shopping item editing, quantity changes, unified Home/Shopping suggestion history, Motivation behavior, new page rows, authentication, routing, or unrelated lifecycle work. Generated test traces/screenshots, disposable databases, temporary migration SQL, build outputs, and local logs are not part of the changeset. Slice 6.2 remains next.
