# Calendar Portability Roadmap Update

## Summary
Updated roadmap and architecture documentation for Calendar JSON export and full restore foundations.

## Implemented
- Documented JSON as the canonical HomeOps Calendar export format.
- Documented full restore as the only implemented restore mode.
- Documented EventOccurrence as non-canonical projection data.
- Documented Google Drive as a future export destination only.
- Documented ICS, recurrence behavior, and EventException runtime behavior as out of scope.

## Verified
- Documentation was updated alongside implementation and tests.

## Risks
- Phase 2 still needs a future slice decision between portability hardening and optional integration work.
- Import/export UI and destination automation are not implemented.

## Modified Files
- `docs/architecture.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-06-19-calendar-json-export-foundation.md`
- `docs/reports/2026-06-19-calendar-full-restore-foundation.md`
- `docs/reports/2026-06-19-calendar-portability-roadmap-update.md`

## Next Prompt Context
Calendar portability now has backend JSON export and full restore foundations. JSON is canonical. Restore is full restore only. EventOccurrence is projection-only. Google Drive remains a future export destination only. ICS and recurrence remain out of scope.
