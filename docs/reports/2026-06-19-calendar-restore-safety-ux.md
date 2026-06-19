# Calendar Restore Safety UX

## Summary
Improved the intentionally simple Settings restore experience with an explicit destructive warning and required confirmation step.

## Implemented
- Reworded restore warning to state that full restore replaces existing calendar data and is not a merge.
- Added a confirmation checkbox that must be selected before restore can run.
- Kept restore validation errors visible in the existing alert list.
- Added frontend regression coverage for the confirmation gate.

## Verified
- Restore button remains disabled until a JSON file is selected and destructive restore is confirmed.
- Restore calls the generated API client after confirmation.
- Validation errors remain rendered in the restore status alert.

## Risks
- UX remains deliberately simple and does not include preview, diff, merge, or selective restore tooling.

## Modified Files
- `src/HomeOps.Client/src/widgets/components/CalendarPortabilityWidget.tsx`
- `src/HomeOps.Client/src/widgets/components/CalendarPortabilityWidget.test.tsx`

## Next Prompt Context
Future restore UX should preserve explicit destructive confirmation unless a separately scoped replacement safety flow is introduced.
