# Slice 3.5 Settings viewport analysis

Date: 2026-08-07

## Current composition

After Slice 3.4, Settings remains a fixed-height dashboard with a status header, a reserved two-column main region, an internally scrolling calendar-source list, and a compact action rail. Calendar repair, household time-zone management, source editing, and destructive confirmations already use `SettingsSurfaceDialog`, whose body owns overflow within a viewport-bounded shell.

The page itself does not currently overflow. Slice 3.5 introduces variable-height file metadata, health details, archive state, reconnect guidance, upload validation, and destructive consequences. Rendering these details as new dashboard sections or expanding every source card would make the primary composition data-dependent and risk pushing the action rail outside the reserved viewport.

## Information priority

The Settings status header, calendar-source health summary, source toolbar, backup/restore summary, notification status, and action rail remain primary and always visible. Individual source metadata and lifecycle operations are secondary. Active versus archived state must remain discoverable in the existing source list, but upload fields, full metadata, replace/reconnect flows, restore progress, and removal consequences may live in bounded dialogs with internal scrolling.

## Approved composition

- Keep the existing dashboard grid, source-list region, and action rail dimensions unchanged.
- Keep each source card compact: name, supported source type, lifecycle/health tone, a small metadata summary, and contextual lifecycle actions.
- Create and edit remain bounded dialogs. iCal-file creation and replacement use a real file input in those dialogs; no filesystem path or hash input is shown.
- Archive uses a short confirmation dialog. Archived cards remain in the internally scrolling source list with clear archived state and only restore/reconnect and permanent-removal actions.
- Restore/reconnect opens a bounded dialog that explains refresh-before-exposure. Feed reconnect edits the HTTPS URL; missing file content requests a replacement upload.
- Permanent removal uses an explicit confirmation dialog describing deletion of imported events, configuration, and managed file.
- Long filenames, health details, validation messages, and lifecycle consequences wrap inside the dialog or source-list scroll region and never increase document height.

This composition fits 1440x900 and 1366x768 because no outer grid track or action-rail row is added. The source list continues to absorb collection growth, and every variable lifecycle flow uses the existing dialog maximum height with an internally scrolling body.

## Risks and alternatives

Long filenames and source errors may make an individual card taller; the list, not the document, owns that overflow. A full lifecycle table was rejected because it would be difficult to read at laptop width and would duplicate dialog detail. Separate active/archive pages were rejected because they add navigation for a small bounded collection. Inline upload and destructive controls were rejected because they would crowd the primary dashboard and weaken confirmation safety.

This report is the implementation authority for Slice 3.5. A materially different page composition requires a revised analysis before implementation continues.
