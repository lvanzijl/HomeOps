# Summary

Fixed the Agenda edit dialog regression where editing an existing appointment could leave the dialog shell without usable body content.

# Cause

The appointment dialog reused the create-flow conversation stepper for edit mode. Existing appointments opened on the first step and hid the remaining form sections behind `Verder` navigation. That made the edit surface fragile and allowed the shell to appear without the expected edit fields/actions in the reported flow.

# Fix

Edit mode now renders the existing appointment fields in one edit form: title, date, all-day/time controls, details, location, recurrence controls, summary, and edit actions. Create mode keeps the existing conversation flow.

# Validation

Validated the focused Agenda widget test file, full frontend test suite, and frontend build after the follow-up test fixes. The `--runInBand` compatibility wrapper now allows the previously requested npm test command to run successfully under Vitest.

# Screenshot

No screenshot artifact is committed in this follow-up because binary files were removed from the changeset.

# Tests

- `cd src/HomeOps.Client && npx vitest run src/widgets/components/AgendaWidget.test.tsx` — passed.
- `cd src/HomeOps.Client && npm test -- --runInBand` — passed.
- `cd src/HomeOps.Client && npm test` — passed.
- `cd src/HomeOps.Client && npm run build` — passed with the existing Vite large-chunk warning.

# Risks

- The edit dialog now shows all editable fields at once while create keeps the stepper. This is intentionally scoped to existing appointment editing and recurrence edit flows.

# Modified Files

- `src/HomeOps.Client/src/widgets/components/AgendaWidget.tsx`
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.test.tsx`
- `src/HomeOps.Client/package.json`
- `src/HomeOps.Client/scripts/vitest-run.mjs`
- `docs/reports/2026-07-07-calendar-recurrence-v2-empty-edit-dialog-fix/calendar-recurrence-v2-empty-edit-dialog-fix.md`
- `docs/state/current-state.md`
