# Floor and Room Settings Management

## Summary
Implemented the Settings-side Woning management workspace for canonical FamilyBoard floors and rooms.

## Implemented
- Added a `Woning` entry point in Settings.
- Added floor and room administration using generated API client contracts.
- Added Dutch room type labels and optional family member selection.
- Added archive, restore, delete, move, and deterministic reorder actions.

## UX decisions
- The workspace uses a floor rail and selected-floor room panel so families can stay oriented without a canvas.
- Internal scrolling is bounded to keep Settings viewport-safe.
- Archive remains the preferred lifecycle action; delete copy states backend rules and does not imply silent room removal.

## Floor management
Floors can be created, renamed, selected, reordered with accessible buttons, archived, restored, and deleted where backend rules permit.

## Room management
Rooms can be created, renamed, typed, associated with or cleared from a family member, reordered, moved between floors, archived, restored, and deleted where backend rules permit.

## Status summaries
Rooms show compact climate status from existing climate configuration contracts. Floors show compact setup and floor-plan status copy without upload or preview actions.

## Accessibility
Dialogs use `role="dialog"`, controls are keyboard buttons/selects, status and error messages use status/alert roles, and archived sections are labelled.

## Responsive behavior
Desktop uses a two-column bounded workspace. Tablet and phone widths collapse the panels into one column while retaining the selected-floor context and list-first management.

## Tests
Added focused Vitest coverage for floor/room loading, creation, room type labels, family member association clearing, reorder controls, move, archive blocking, restore, and status summaries.

## Risks/limitations
Floor-plan asset status is read-only and currently conservative because this frontend slice does not expose asset metadata actions. API failures are translated into household-friendly fallback copy rather than raw backend details.

## Deferred scope
No canvas, asset upload, climate runtime, Home Assistant UI, provider mapping UI, image preview, polygon editor, Stories, or heating controls were added.

## Modified files
- `src/HomeOps.Client/src/settings/SettingsDashboard.tsx`
- `src/HomeOps.Client/src/settings/WoningManagement.tsx`
- `src/HomeOps.Client/src/settings/WoningManagement.test.tsx`
- `src/HomeOps.Client/src/settings/woningApi.ts`
- `src/HomeOps.Client/src/styles.css`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
