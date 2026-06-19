# Phase 1 Roadmap Protection Rule

## Summary
Added a repository-governance rule that treats the Phase 1 roadmap as historical documentation and directs future phase work to update the current phase roadmap instead.

## Implemented
- Updated repository agent guidance to remove the unconditional Phase 1 roadmap update instruction.
- Added an explicit rule protecting `docs/roadmap/phase-1.md` from Phase 2, Phase 3, and later-phase feature work except for factual corrections, incorrect history fixes, or broken reference repairs.
- Mirrored the rule across repository guidance files used by agents and assistants.

## Verified
- Confirmed the rule is present in repository guidance.
- Confirmed the revised guidance no longer conflicts with the historical Phase 1 rule.
- Confirmed no application code, tests, or migrations were changed.

## Risks
- Future contributors must still follow the guidance; this change documents the rule but does not add an automated enforcement check.

## Modified Files
- `AGENTS.md`
- `CLAUDE.md`
- `.github/copilot-instructions.md`
- `docs/state/current-state.md`
- `docs/reports/2026-06-19-phase1-roadmap-protection-rule.md`

## Next Prompt Context
Phase 1 is now documented as historical. Future Phase 2+ implementation work should update `docs/state/current-state.md` and the current phase roadmap, not `docs/roadmap/phase-1.md`, unless correcting factual mistakes, incorrect history, or broken references.
