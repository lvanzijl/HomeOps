# Calendar Portability UX Hardening

## Summary
Improved user-facing portability safety without changing the canonical export contract.

## Implemented
- Export and restore summaries display schema version, payload version, export timestamp, and EventSeries count.
- Validation errors returned by the restore API are shown to the user.
- Friendly messages are shown for invalid JSON, validation failures, server failures, and generic failures.

## Verified
- Added backend coverage for pre-restore safety behavior.

## Risks
- Browser download behavior depends on the user's browser and local filesystem choices.

## Modified Files
- `src/HomeOps.Client/src/calendarPortability.ts`
- `src/HomeOps.Client/src/widgets/components/CalendarPortabilityWidget.tsx`
- `src/HomeOps.Client/src/styles.css`

## Next Prompt Context
Calendar portability UX now surfaces version/timestamp metadata and restore validation feedback while preserving V1 JSON.
