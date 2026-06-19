# Calendar Portability Roadmap Update

## Summary
Realigned architecture, roadmap, and state documentation around the hardened local-only Calendar portability direction.

## Implemented
- Updated architecture docs for frozen V1 JSON contract shape, local-only restore, validation-before-destruction, and future automatic pre-restore export.
- Updated Phase 2 roadmap with the completed portability hardening slice.
- Updated current state with V1 JSON contract, local-only full restore, and future safety requirements.
- Updated Phase 1 follow-up note to reference V1 contract hardening.

## Verified
- Documentation was updated alongside implementation and tests.

## Risks
- Future prompts must preserve the local-only export/restore boundary unless explicitly changing architecture.
- Automatic pre-restore export remains a future requirement.

## Modified Files
- `docs/architecture.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-1.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-06-19-calendar-portability-hardening.md`
- `docs/reports/2026-06-19-calendar-restore-safety.md`
- `docs/reports/2026-06-19-calendar-json-contract-hardening.md`
- `docs/reports/2026-06-19-calendar-portability-roadmap-update.md`

## Next Prompt Context
Calendar portability is hardened. The next implementation can choose automatic pre-restore export or optional read-only Google Calendar integration, but must preserve HomeOps Calendar as source of truth and the V1 JSON contract unless a major version change is explicitly scoped.
