# Calendar Export Restore UI

## Summary
Added a minimal Settings workspace UI for local calendar export and full restore.

## Implemented
- Added a Calendar Export / Restore administration widget.
- Export downloads the canonical JSON calendar export.
- Restore accepts a local JSON file and calls the restore API.
- The UI warns that restore replaces calendar data.
- Restore success and failure states are displayed inline.

## Verified
- Frontend build/test validation is pending full dependency availability in the final validation run.

## Risks
- The UI is intentionally simple and does not provide diff, preview, merge, or selective import tooling.

## Modified Files
- `src/HomeOps.Client/src/calendarPortability.ts`
- `src/HomeOps.Client/src/widgets/components/CalendarPortabilityWidget.tsx`
- `src/HomeOps.Client/src/widgets/WidgetRenderer.tsx`
- `src/HomeOps.Client/src/widgets/widgetCatalog.ts`
- `src/HomeOps.Client/src/widgets/widgetModel.ts`
- `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx`
- `src/HomeOps.Client/src/styles.css`

## Next Prompt Context
Settings now exposes local calendar export and full restore controls using the existing API contract.
