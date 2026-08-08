# Phase 6 Slice 6.2 — Shopping item editing and unified history

## Outcome

Shopping items can be corrected in place through one atomic, concurrency-checked write covering label, optional free-form quantity, store, and decorative avatar. The approved compact row now exposes only `Aanpassen`; the editor stays inside the existing bounded Shopping dialog and retains user input when saving fails.

Corrections default to preserving household purchase attribution. When a normalized label changes, matching item and per-store history is moved or merged under the corrected label. Users can explicitly opt out, which keeps the prior attribution and records the new label separately.

## Shared history and legacy decision

Migration `20260808172019_AddShoppingItemEditingAndHistory` adds `ListItems.Quantity` and `ShoppingItemHistories`, then backfills household history from existing items. New items and explicit legacy imports update that server history. The read endpoint combines history with active-item fallback and returns ranked item suggestions plus store observations.

Home no longer reads or writes `homeops.shopping.history.v1`. Home and Shopping both call the shared server history endpoint, so suggestions survive refresh and are visible to another client. If the legacy key exists, the bounded Shopping management surface explains it and requires an explicit choice:

- `Overnemen` sends at most 50 validated names with explicit confirmation, then removes the key only after success.
- `Verwijderen` removes the local data without uploading it.
- Closing the dialog defers the decision and leaves the key untouched.

## Validation

- Focused List API: 22/22 passed, including edit validation, concurrency, history reattribution, explicit import, and second-client reads.
- Focused Home/Shopping frontend: 41/41 passed.
- Full backend: 655/655 passed.
- Full frontend: 387/387 passed with one worker; the initial parallel run exposed unrelated five-second avatar/people timeouts, whose exact 23 tests passed in isolation.
- Backend and frontend production builds passed. Vite retains its existing large-chunk warning.
- PostgreSQL migration baseline/upgrade/preservation: 4/4 passed through Rancher Desktop.
- EF migration list, no-pending-model-change check, and idempotent script generation passed. The existing EF tool/runtime version warning remains.
- Pinned NSwag 14.7.1 ran twice; OpenAPI and TypeScript-client SHA-256 hashes were identical on the second run.
- PostgreSQL-backed Playwright: 18/18 passed, including edit/refresh/Home suggestion persistence and no-document-scroll checks at 1440×900 and 1366×768.
- Independent in-app inspection at 1366×768 found no console errors or document overflow; the 585.125 px editor ended at 730.75 px inside the 768 px viewport.

## Scope

Changes are limited to Shopping item editing, item history/suggestions, Home's Shopping suggestion consumer, the migration/generated contracts, directly related tests, fixtures, styles, and Phase 6 documentation. Motivation progress/ledger and helpful-moment/family-goal lifecycle remain Slices 6.3 and 6.4. No authentication, routing, reminders, unrelated page redesign, generated caches, screenshots, videos, or browser traces belong in the changeset.
