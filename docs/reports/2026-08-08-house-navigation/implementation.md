# Phase 5 Slice 5.2 — House navigation and viewport-safe runtime

## Outcome

Woning is now the sixth primary FamilyBoard destination. A single route map coordinates initial URL resolution, primary navigation, reloads, and browser back/forward behavior for every current top-level workspace. `/woning` opens the compact household climate summary and `/woning/klimaat` opens the established detailed runtime composition directly.

The summary explicitly distinguishes loading, load failure with retry, no configured floors, healthy availability, and degraded availability. The detailed view renders only after successful non-empty data loading and provides bounded loading, retryable error, and empty states. Existing room-level truth remains intact: unconfigured rooms never appear ready, unavailable providers are identified, and heating actions stay disabled unless the backend capability response permits them.

## Scope boundary

This slice changes navigation reachability, stable routing, and runtime state presentation. It does not add or edit room climate configuration, provider mappings, floor-plan upload, provider credentials, provider lifecycle, weather location, or heating authority. Those remain assigned to later Phase 5 slices.

The implementation follows the approved [viewport analysis](./viewport-analysis.md): the primary shell owns navigation and URL synchronization, while variable climate content remains inside the existing internal scroll regions.

## Regression coverage

- shared route parsing and trailing-slash normalization;
- Woning primary-navigation visibility and stable climate transitions through browser history;
- summary loading, retryable error, empty, and degraded states;
- detailed loading, retryable error, empty, unconfigured-room, and unavailable-provider behavior;
- direct `/woning` and `/woning/klimaat` loads, reload, browser back, and runtime fixture states;
- document-level no-scroll checks at 1440×900 and 1366×768.

## Validation

- Focused frontend tests: 37/37 passed.
- Full frontend suite: 360/360 passed with the established 20-second timeout budget.
- Full backend suite: 640/640 passed.
- Solution build and frontend production build: passed.
- PostgreSQL migration gate: 4/4 passed through Rancher Desktop.
- EF migration list, pending-model check, and idempotent migration script: passed.
- Pinned NSwag 14.7.1: two generations produced identical OpenAPI and TypeScript-client SHA-256 hashes.
- PostgreSQL-backed Playwright suite: 11/11 passed.
- In-app real-browser inspection: Woning summary and climate detail showed zero body/document vertical overflow at both required viewports.

The solution build still reports the repository's existing `SQLitePCLRaw.lib.e_sqlite3` advisory, and the frontend build still reports the existing large-chunk warning; neither warning was introduced by this slice.
