# Calendar Documentation Cleanup

## Summary
Cleaned up calendar portability documentation so local-only export/restore and configurable snapshot storage expectations are consistent.

## Implemented
- Updated architecture/current-state docs to describe configurable local snapshot storage and container writable-path assumptions.
- Updated Phase 2 roadmap wording so pre-restore snapshots are no longer described as future-only work.
- Left Phase 1 documentation functionally unchanged except for a concise historical note that later Phase 2 calendar portability hardening is tracked in Phase 2 docs.

## Verified
- Documentation consistently states JSON is canonical, restore is local-only and full restore only, and snapshots are local-only.
- Outdated “future automatic pre-restore export” wording was removed from Phase 2 roadmap text.

## Risks
- Older historical reports remain unchanged and may describe prior state at the time they were written.

## Modified Files
- `docs/architecture.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-1.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-06-19-calendar-documentation-cleanup.md`

## Next Prompt Context
Use Phase 2 docs/current state as the source for current calendar portability status; older reports are historical.
