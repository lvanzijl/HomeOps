# Settings Polish

## Summary
- Softened Settings from an administrative surface into a small household maintenance area while preserving export, restore, confirmation, validation, routing, and API behavior.

## Preflight Findings
- The latest screenshot review identified Settings as reachable but noticeably administrative, with the page shifting tone away from the family-facing HomeOps experience.
- The most visible placeholder/developer language was the Settings placeholder widget: “Settings widgets will appear here in future slices.”
- Calendar restore copy used implementation-oriented terms such as “local calendar event sources,” “EventSeries data,” “JSON export,” and “full restore, not a merge.”
- Export status copy exposed schema and payload versions and record names instead of a household-readable backup summary.
- Export and restore are genuinely administrative actions, so they should remain direct and explicit, especially where restore replaces calendar data.

## Copy Improvements
- Reframed the page as household maintenance instead of setup/configuration.
- Changed export/restore summaries to use backup, calendar items, and saved-at language.
- Kept restore warnings direct but removed internal data-model terms.
- Renamed file selection from import wording to backup-file wording.

## Information Architecture Changes
- Grouped calendar backup and restore under a single Calendar card with two clear action areas: Save a backup and Restore from a backup.
- Removed the Settings placeholder widget from the default Settings layout so the page no longer advertises future implementation slices.

## Visual Cleanup
- Added lightweight section grouping inside the existing card system.
- Reduced headline density and made explanatory text shorter.
- Kept the existing controls and destructive confirmation visible.

## Verified
- Focused Settings test was run.
- Focused WorkspaceShell test was run.
- Frontend build was run.
- Backend tests were not run because backend code was not touched.

## Risks
- Restore still uses a native file picker, which remains more technical than other family-facing controls but is appropriate for backup maintenance.
- Existing API validation messages may still include backend terminology when a restore fails validation.

## Modified Files
- `src/HomeOps.Client/src/widgets/components/CalendarPortabilityWidget.tsx`
- `src/HomeOps.Client/src/widgets/components/CalendarPortabilityWidget.test.tsx`
- `src/HomeOps.Client/src/workspaces/workspaceLayout.ts`
- `src/HomeOps.Client/src/styles.css`
- `docs/reports/2026-06-26-settings-polish/2026-06-26-settings-polish.md`

## Next Prompt Context
Settings polish is complete for this slice. The remaining Settings surface is intentionally limited to calendar backup and restore. Future work should only add real household settings when a roadmap slice explicitly calls for them, and should continue avoiding placeholder or developer-facing copy.
