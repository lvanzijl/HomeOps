# Persisted Weekly Reset — Phase 4 Slice 4.5

## Outcome

Weekly Reset is now one durable household/local-week workflow instead of a live collection of unrelated source records. The first load for a week snapshots every eligible task, family goal, individual goal, and shopping list with a stable display/context label. Reloading or navigating away resumes the same aggregate, and candidate progress comes only from persisted decisions.

Each candidate exposes only valid actions. Tasks can go forward, move to later, or archive when their recurrence state permits it; goals and shopping lists can go forward or archive. The source mutation and decision timestamp/optional actor label are saved together. If a snapshotted source disappears, the row remains understandable and offers an explicit acknowledge decision rather than silently vanishing or blocking completion.

`Week afronden` is an explicit server-validated transition and is available only after every required candidate is resolved. `Deze week overslaan` is a separately confirmed persisted `Skipped` outcome, not a local hide state and not a synonym for deciding later. Completed/skipped weeks are read-only and available through bounded history using their snapshotted labels even when source records later change.

## Persistence and contracts

- `WeeklyResetSessions` is unique by household and household-local Monday week start and stores `Open`/`Completed`, `Reviewed`/`Skipped`, and completion timestamps.
- `WeeklyResetCandidates` snapshots type, source ID, display/context labels, decision, actor label, and decision timestamp with one row per source candidate per session.
- Database checks enforce consistent terminal state and decision metadata; candidates cascade only with their reset aggregate while the household relationship is restricted.
- Migration `20260808090440_PersistWeeklyResetAggregate` adds only the aggregate tables, relationships, checks, and indexes.
- Current, decision, completion, skip, history-list, and history-detail endpoints are represented in OpenAPI and the generated TypeScript client.
- The visual-review reset removes weekly aggregates before their source records so scenarios remain deterministic.

## Viewport implementation

The runtime follows `viewport-analysis.md`. The former document stack was replaced with a fixed command band, `minmax(0, 1fr)` two-column workspace, and always-visible completion footer. Candidate filters and rows, contribution recap, and the bounded history dialog own their overflow. The redundant inner hero, standalone metrics, large intention card, and variable-height masonry were removed. Short-height and narrow-width rules preserve the same information architecture without page scrolling.

Candidate mutations expose row-local pending state and retained retry errors. Completion and skip have distinct pending/error handling. The current week, completed outcome, and history survive full refresh because every displayed state is server-backed.

## Validation

- Focused Weekly Reset API: 5/5 passed.
- Focused Weekly Reset frontend: 5/5 passed.
- Full backend: 636/636 passed.
- Full frontend with the repository's extended timeout: 354/354 passed.
- Solution build and frontend production build passed; the existing generated chunk-size warning remains informational.
- EF reports no pending model changes.
- PostgreSQL clean/one-behind/preservation migration baseline: 3/3 passed through Rancher Desktop.
- Pinned NSwag 14.7.1 ran twice; the second output was SHA-256 identical for OpenAPI and the generated client.
- Disposable PostgreSQL-backed Chromium: 10/10 passed, including decision persistence, refresh/resume, completion, read-only history, and no document overflow at 1440×900 and 1366×768.
- The existing `SQLitePCLRaw.lib.e_sqlite3` NU1903 advisory remains a dependency warning and did not cause validation failure.

## Boundary audit

The change is limited to Weekly Reset persistence/endpoints, its migration and generated contracts, the Weekly Reset primary page/styles, deterministic fixture cleanup, direct backend/frontend/browser tests, the current Phase 4 roadmap/master/state, and this report. It does not add routing, authentication, unrelated task/shopping/goal lifecycle, reminder, widget, or Phase 5 work. No repository-local caches, build output, Playwright traces/screenshots, or disposable database artifacts belong in the changeset.
