# Woning Climate Deep Dive — Floor-Plan Editor UX and Validation Flow

Date: 2026-07-12
Status: research slice 2 of 3
Scope: editor product and interaction model only
Exclusions: no production implementation, no persistence model, no APIs, no migrations, no tests, no screenshots, no Home Assistant configuration, no runtime climate deep-dive UI design

## 1. Executive summary

The recommended editor model is **Option C: a hybrid initial wizard plus persistent floor workspace**.

First use should guide the household through a short setup path: create floors, create or import room names, upload a floor-plan asset for one floor, draw/link room boundaries, review, and finish. After the first pass, all maintenance should happen in a persistent Settings workspace with a left floor list, a room/status panel, a central drawing canvas, and a compact validation/review panel.

The editor should feel like guided household setup, not CAD. Floors and rooms are household facts. Assets and polygons are drawings that explain those facts. Users may create rooms before any image exists, may upload first and create rooms while drawing, and may safely save incomplete work. Completion is status-based rather than percentage-based: **Niet gestart**, **In uitvoering**, **Bruikbaar**, **Compleet**, **Controle nodig**, or **Geblokkeerd**.

Every uploaded asset is rendered and edited against FamilyBoard's sanitized coordinate basis. Every asset replacement creates a review draft: the old active asset remains active until the user explicitly approves or redraws room overlays for the replacement. Technical compatibility can make old overlays previewable, but never trusted automatically.

Desktop is the preferred editing mode. Tablet editing is supported with larger handles, explicit modes, zoom, and pan. Phone editing should be limited to viewing status, managing names, and resuming later; boundary drawing and replacement review should be unavailable on phone-sized viewports.

## 2. Accepted product-model corrections

This slice accepts the previous product-model report with these corrections frozen for editor design:

1. Floors are a user-defined ordered list.
2. Four floors describe the current household configuration, not a hard domain maximum.
3. Canonical Room identity contains stable room identity, household ownership, floor assignment, display name, room type, sort order, optional associated family member, and enabled/archive state.
4. Bedtime relevance, comfort relevance, humidity relevance, heating relevance, source mappings, and policy belong to feature-specific climate configuration, not canonical Room identity.
5. Every floor-plan asset replacement requires overlay review.
6. Technical compatibility determines whether previous overlays may be previewed and reused, not whether they remain automatically trusted.
7. Editor and runtime must render against exactly the same sanitized asset coordinate basis.
8. FamilyBoard owns floors, rooms, assets, and overlays.
9. Home Assistant areas and entities remain suggestions and technical mappings only.
10. The main Woning page remains Story-first.
11. Floor plans exist only in the climate deep dive.
12. One floor is shown at a time at runtime.
13. The floor-plan asset is visual background only.
14. Room geometry is stored separately as normalized polygons.
15. V1 excludes automatic room detection, CAD/BIM behavior, furniture layers, wall snapping, automatic vectorization, PDF import, holes in polygons, disconnected room regions, automatic Home Assistant room ownership, and runtime UI design.

## 3. Repository findings

### Settings and setup-dialog patterns

- The current first-run setup uses a linear wizard with visible step chips: `Welkom`, `Volwassenen`, `Kinderen`, `Controleren`, `Afronden`. It supports back/next navigation, inline errors, required adult validation, and Dutch household copy.
- Settings is a viewport-fit dashboard with a header, main content grid, secondary cards, a bottom action rail, and bounded modal-style surfaces for details, restore, people management, source creation/editing, and deletion.
- Settings surfaces use `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, explicit close buttons, and internally scrollable dialog bodies.
- Calendar restore demonstrates a safety pattern: choose a file, parse/validate it, show a summary, require a checkbox confirmation, then enable the destructive restore action.

### Existing wizard, modal, drawer, stepper, or editor patterns

- Linear wizard exists only for first-run household setup.
- Dialog/surface patterns exist for Settings, Agenda, Shopping, Motivation, and avatar flows. There is no true drawer or stepper component library.
- Existing editing patterns are form/list/dialog-oriented, not canvas-oriented.

### Touch-target and viewport-fit rules

- Global CSS sets the application viewport height, hides browser overflow, and expects primary pages to fit inside the available viewport.
- Settings is explicitly implemented as a viewport-fit dashboard: fixed outer grid, internal scrolling in source lists and dialog bodies, responsive two-column-to-one-column behavior, and compact adjustments for shorter viewports.
- Existing button minimum heights in dialog contexts are roughly 2.4-2.75rem, which is usable for mouse and many touch targets but floor-plan vertices will need larger dedicated handles on touch.

### Confirmation, undo, archive, restore, and validation patterns

- Calendar restore requires explicit checkbox confirmation before replacing current agenda data.
- Calendar source deletion uses a confirmation dialog explaining the impact before a definitive delete.
- Shopping and agenda flows include restore/undo concepts for skipped occurrences and list items, but no general multi-step undo stack exists.
- Settings validation appears as status cards and validation lists with `role="alert"` for errors and `role="status"` for non-error updates.
- Archive patterns exist in shopping, motivation, and people/task domains, but floor/room archive semantics need a dedicated product contract.

### Drag/drop, canvas, image upload, file previews, polygon, coordinate editing

- File selection exists for JSON calendar restore. It is not a floor-plan asset upload pattern and does not include drag/drop, image preview, sanitization comparison, or binary asset storage.
- Calendar source forms model file metadata manually for iCal file sources; they are not a user upload flow.
- No production floor/room/polygon/canvas editor, drawing library, normalized coordinate editor, or image-preview workflow was found.
- No evidence was found of existing drag/drop reordering in production UI. Reordering should therefore offer buttons as the reliable baseline, with drag/drop optional later.

### Accessibility conventions

- Current components use semantic sections/articles, named regions, `role="dialog"`, `role="tablist"`, `role="status"`, `role="alert"`, `aria-label`, `aria-pressed`, `aria-selected`, and labels on inputs.
- Icons in the design system are decorative by default where appropriate.
- Existing flows provide list-based representations of state; the floor-plan editor must preserve that convention so the canvas is not the only state surface.

### Responsive desktop/tablet behavior

- Primary pages use bounded regions, internal scroll panels, and responsive breakpoint compaction.
- Settings collapses from a two-column layout to a stacked layout at narrower widths while preserving viewport fit.
- Phone-sized screens are supported for many form/list flows, but the repository has no precedent for precision canvas editing on phone.

### Dutch terminology

- Existing product language favors friendly household terms: `Instellingen`, `Gezin instellen`, `Bekenden`, `Bron toevoegen`, `Back-up maken`, `Herstellen`, `Aandacht nodig`, `Klaar voor gebruik`, `Afronden`.
- The editor should reuse this tone and avoid developer terms such as normalized coordinates, SVG DOM, vectorization, or sanitization internals.

### Visual review and fixture conventions

- `VisualReview` is the supported browser-facing runtime for screenshots and Playwright inspection, backed by official fixture endpoints and ephemeral storage.
- Later implementation should add floor-plan fixtures only if/when production editor UI exists; this research slice created no fixtures.

### Reusable upload concepts

- Conceptually reusable: file chooser label, parse/validate-before-action, summary before destructive restore, explicit confirmation, status role, validation lists, and rollback-minded restore copy.
- Not reusable as-is: iCal JSON restore parsing, calendar file metadata fields, and source management forms.

## 4. Recommended editor information architecture

### Option A — linear wizard

A pure wizard is good for first-run confidence but poor for maintenance. Floor plans are per-floor, iterative, and often interrupted. A six-step wizard would force users to complete floors in an artificial order and make later repairs feel like restarting setup.

Reject as the only model.

### Option B — floor workspace

A persistent floor workspace matches the actual work: select a floor, inspect status, upload/replace asset, manage rooms, draw overlays, validate, and save. It is better for ongoing maintenance but too open-ended for a household's first exposure to the feature.

Reject as the only first-run model.

### Option C — hybrid

Select this option.

Use a lightweight first-run wizard for orientation and minimum setup, then place users in the persistent floor workspace. The wizard is not a separate data model; it is a guided entry into the same editor states.

```text
First run
Welkom → Verdiepingen → Kamers → Eerste plattegrond → Grenzen tekenen → Controleren
                                      ↓
                              Floor workspace

Maintenance
Settings → Woning & klimaat → Plattegronden beheren → Floor workspace
```

The workspace has four persistent regions:

1. **Floor rail:** ordered floors with status pills and move buttons.
2. **Room panel:** canonical room list for the selected floor plus unlinked/archived filters.
3. **Canvas workspace:** sanitized asset, polygon tools, zoom/pan, and labels.
4. **Validation/review panel:** current blockers, warnings, replacement review tasks, save state.

## 5. First-run setup flow

1. **Welcome:** explain that rooms and drawings are separate: `We maken eerst de verdiepingen en kamers. Daarna teken je per kamer een eenvoudige grens op de plattegrond.`
2. **Floors:** create the ordered floor list. Suggested names/types are available, but no hard maximum exists.
3. **Rooms:** create canonical rooms, assign each to a floor, choose type, optionally associate a family member.
4. **Choose first floor to draw:** select any floor. Floors can be completed independently.
5. **Upload asset:** choose or drop SVG/PNG/JPG/JPEG, preview, sanitize, validate, then activate for this floor if accepted.
6. **Draw/link boundaries:** select an existing room or create one inline, draw a boundary, validate, save.
7. **Review:** show floor statuses and minimum usability. Finish is allowed when at least one visible climate-relevant room on at least one included floor has an active asset and valid linked overlay; the stronger recommended state is all visible climate-relevant rooms on included floors mapped.
8. **Resume later:** every step can be saved as draft. The setup can stop after floors, after rooms, after assets, or after partial overlays.

Required steps for a trustworthy runtime floor-plan view: at least one included floor, active sanitized asset for that floor, at least one enabled canonical room on that floor, and at least one valid linked overlay. Optional steps: manual label anchor, hidden floors, archived rooms, full-house completion, and non-climate room overlays.

## 6. Maintenance flow

Maintenance opens directly into the floor workspace, not the wizard.

Common maintenance tasks:

- add/reorder/archive floors;
- rename rooms or move rooms between floors;
- upload an asset for a previously unmapped floor;
- replace a floor asset and review overlays;
- redraw a room boundary;
- reset labels to automatic;
- inspect incomplete/invalid/stale states;
- rollback the most recent asset replacement where retained.

The workspace always shows whether the selected floor is **Bruikbaar**, **Compleet**, **Controle nodig**, **In uitvoering**, or **Geblokkeerd**.

## 7. Floor-management UX

### Add, name, and type

- Primary action: `Verdieping toevoegen`.
- Fields: display name, suggested type, include in climate deep dive, optional hidden state.
- Suggested types: `Kelder`, `Begane grond`, `Eerste verdieping`, `Tweede verdieping`, `Zolder`, `Bijgebouw`, `Anders`.
- Duplicate names are allowed only after warning and disambiguation copy: `Deze naam bestaat al. Voeg bijvoorbeeld “voor” of “achter” toe zodat iedereen de verdieping herkent.` Save can be allowed with a suffix recommendation, but exact duplicates should be blocking because review lists become confusing.

### Ordering

- V1 should support move buttons: `Omhoog`, `Omlaag`, `Bovenaan`, `Onderaan`.
- Drag-and-drop can be added if implementation already introduces a robust accessible pattern, but it must not be the only ordering method.
- The order controls runtime floor ordering later; no runtime layout details are designed here.

### Hidden, excluded, archived, deleted

- **Hidden**: temporarily omitted from normal climate deep-dive floor selection, but remains active in setup and can be shown again. Use for a floor that exists but should not distract daily use.
- **Excluded from climate deep dive**: clearer than hidden when the floor is intentionally outside climate use. In V1, use one user-facing toggle: `Meenemen in klimaatweergave`. Off means excluded/hidden from runtime but still editable.
- **Archived**: the floor is no longer part of the home but retained for history/recovery. It is not shown in runtime and its rooms become archived or must be moved.
- **Delete**: only for mistaken empty floors or explicitly confirmed permanent removal. Prefer archive when rooms/assets/overlays exist.

### Validity

- A floor without an asset is valid as household setup but not usable for floor-plan runtime.
- A floor without rooms is valid as draft but incomplete.
- Floors can be completed independently.
- More floors than fit in the viewport appear in a bounded scrollable floor rail with compact status pills.

### Deleting a floor

Before delete or archive, the editor must show affected rooms and require one of:

1. move rooms to another floor;
2. archive rooms with the floor;
3. cancel.

Permanent delete requires typed or checkbox confirmation when any asset, room, overlay, or climate configuration reference exists.

## 8. Room-management UX

### Canonical room creation

Room creation belongs both outside and inside drawing:

- Outside drawing: `Kamer toevoegen` in the room panel is the primary canonical room flow.
- Inside drawing: while drawing, `Nieuwe kamer maken` is allowed to avoid interrupting the user, but it still creates a canonical room first and then links the polygon.

Room fields: display name, floor, room type, sort order, optional associated family member, enabled/archive state.

Room types: `Slaapkamer`, `Badkamer`, `Woonkamer`, `Keuken`, `Hal`, `Werkkamer`, `Wasruimte`, `Berging`, `Overloop`, `Toilet`, `Technische ruimte`, `Anders`.

### Room list state

Each room shows:

- floor assignment;
- overlay status: `Geen grens`, `Concept`, `Ongeldig`, `Gekoppeld`, `Controle nodig`;
- later health indicators as read-only summaries: `Klimaat ingesteld` or `Sensoren later koppelen`; no climate/HA setup screen is designed here.

### Unlinked rooms and unlinked polygons

- Unlinked rooms appear in the room panel under `Nog geen grens` with a clear action: `Grens tekenen`.
- Draft polygons may exist temporarily without room links during the drawing session and may be saved as draft only if named as `Niet gekoppelde grens` with a warning. They are never runtime-active.
- Unlinked polygons appear in validation as `Deze grens hoort nog niet bij een kamer`.

### Move, archive, delete, merge, split

- Moving a room to another floor keeps room identity stable. Its old overlay cannot remain active on the old floor. The editor should offer: move room and mark old overlay unresolved, move room and discard overlay, or cancel. If the target floor has the same active asset only in impossible future cases, still require review.
- Archive disables the room in runtime and retains its identity and history.
- Delete is permanent and should be reserved for mistakes. If overlays, climate configuration, or mappings exist, prefer archive and require confirmation for delete.
- Merge and split are advanced maintenance actions. V1 may include conceptual support but should not implement complex automated geometry behavior. Merge should pick the surviving canonical room and archive the other. Split should create a new canonical room and require a new boundary for it.

## 9. Asset-upload UX

### Supported formats and entry point

Upload happens before or inside the boundary editor. The workspace should offer `Plattegrond uploaden` when no asset exists and `Plattegrond vervangen` when one is active.

Supported copy:

`Upload een SVG, PNG, JPG of JPEG. Gebruik een duidelijke plattegrond zonder meubels als dat kan. PDF wordt nog niet ondersteund; maak eerst een afbeelding van één verdieping.`

File selection and drag/drop are both useful. Drag/drop is a convenience, not required. The drop zone copy should say: `Sleep je plattegrond hierheen of kies een bestand.`

### Preview, sanitization, and validation

Flow:

```text
Choose/drop file
  → local file summary
  → original preview where safe
  → sanitize/normalize
  → sanitized preview
  → validation result
  → user accepts as active asset or keeps as draft
```

- SVG original preview should be isolated or withheld until sanitized if unsafe rendering cannot be guaranteed. User copy: `We controleren SVG-bestanden eerst voordat we ze tonen.`
- PNG/JPG/JPEG can show a local preview while validation runs, but the editor still uses the sanitized/normalized output for drawing.
- If sanitization changes appearance materially, show side-by-side previews: `Origineel` and `Veilige versie`. Warn: `De veilige versie ziet er anders uit. Controleer of de kamers nog herkenbaar zijn.`
- If differences are minor or not user-visible, a single sanitized preview with `Gecontroleerd` is enough.
- Transparent backgrounds are allowed and shown on a neutral checker-free FamilyBoard canvas background.
- Orientation normalization should be automatic for raster images with EXIF orientation and reported only if it affects preview: `De afbeelding is rechtgezet op basis van de fotogegevens.`

### Rejection and edge cases

- Unsupported file: `Dit bestandstype wordt niet ondersteund. Gebruik SVG, PNG, JPG of JPEG.`
- PDF: `PDF werkt nog niet omdat een PDF meerdere pagina's en tekenlagen kan bevatten. Exporteer één verdieping als SVG, PNG of JPG.`
- Unsafe SVG: `Deze SVG bevat onderdelen die FamilyBoard niet veilig kan tonen. Exporteer de plattegrond opnieuw zonder scripts, externe afbeeldingen of interactieve onderdelen.`
- Corrupted image: `Deze afbeelding kan niet worden gelezen. Kies een nieuwe export van de plattegrond.`
- Animated assets: reject GIF/APNG/animated SVG behavior: `Bewegende afbeeldingen worden niet gebruikt voor plattegronden. Upload één stilstaande afbeelding.`
- Too large: warn with practical guidance and offer automatic resizing for raster images.

### Size and resizing

FamilyBoard should automatically resize very large raster images to an editor/runtime-safe maximum while preserving aspect ratio and the sanitized coordinate basis. The user should see: `We maken een veilige werkversie zodat de plattegrond snel opent. De vorm van de verdieping blijft gelijk.` SVG should be sanitized but not rasterized by default unless required for safe display; if rasterized, that is a material change requiring preview.

An upload becomes active only after validation succeeds and the user accepts it. For replacement, it becomes active only after review is completed or explicitly saved as a draft replacement; the previous active asset remains runtime-active.

Users may save an unreviewed upload as draft. Draft assets are not runtime-active.

## 10. Asset-replacement review flow

Every replacement requires review before activation.

```text
Replace requested
  → upload and validate new asset
  → old active asset remains active
  → replacement draft created
  → compare old/new previews
  → preview previous overlays on new asset when technically compatible
  → room-by-room review
  → approve reusable candidates or redraw invalid/changed rooms
  → activate replacement
  → retain old version for rollback window
```

### Review surface

Show:

- old asset preview;
- new sanitized asset preview;
- previous overlays rendered over the new asset when dimensions/aspect/orientation are compatible enough;
- a room review list with statuses:
  - `Kan waarschijnlijk worden hergebruikt`;
  - `Controleer positie`;
  - `Opnieuw tekenen`;
  - `Ongeldig`.

No overlay becomes trusted automatically. `Alles goedkeuren` is available only when every visible room is a reusable candidate and no validation warning exists. Even then the user must explicitly approve.

### Partial approval

Some overlays can be approved while others are redrawn. The floor remains `Controle nodig` until all active visible rooms required for completion are approved or intentionally left unmapped.

### Labels

Automatic labels recalculate against approved/redrawn polygons. Manual label anchors are previewed on the new asset and marked `Controleer label` if the anchor is outside the polygon, too close to the edge, or collides with another label. Users can approve, move, or reset to automatic.

### Missing or new rooms in a replacement

- If a room no longer appears in the drawing, keep the canonical room and mark its overlay `Opnieuw tekenen of kamer uitsluiten`. The editor should offer `Kamer zonder grens bewaren`, `Kamer archiveren`, or `Nieuwe grens tekenen`.
- If new rooms appear in the asset, the user creates canonical rooms and draws boundaries. FamilyBoard must not infer room identity from the image.

### Rollback and purge

Rollback is presented as `Vorige plattegrond terugzetten` during review and after activation while the previous asset is retained. Rollback restores the old active asset and its previously trusted overlays. A failed replacement never damages current active setup.

The old asset may be purged after a retention policy or explicit cleanup only after the new asset is active, all required overlays are reviewed, and a backup/export includes the new active setup. If storage pressure exists, ask before purge.

## 11. Polygon drawing and editing flow

### Primary creation flow

1. Select floor.
2. Ensure an active sanitized asset exists.
3. Select an unlinked room or choose `Nieuwe kamer maken`.
4. Click `Grens tekenen`.
5. Place points around the room.
6. Close the boundary by clicking the first point or `Grens sluiten`.
7. Validate.
8. Save linked boundary or keep draft.

### Editing after closure

V1 should support:

- click-to-place points on desktop;
- tap-to-place points on tablet in explicit drawing mode;
- undo last point;
- cancel drawing;
- pan and zoom;
- drag existing vertices;
- insert vertex on edge;
- delete vertex;
- move entire polygon;
- reset polygon by redrawing;
- zoom-to-room;
- keyboard shortcuts for safe actions: Escape cancel/exit mode, Backspace/Delete remove selected vertex, Ctrl/Cmd+Z undo last edit, Enter close where valid.

### Minimal V1 set

Minimum useful V1 toolset:

- select room;
- draw points;
- close polygon;
- undo last point;
- cancel drawing;
- edit vertices;
- insert/delete vertex;
- move polygon;
- pan/zoom;
- reset/redraw;
- validation list;
- save draft/save active.

Rectangle shortcut is worthwhile because many household rooms are rectangular and it reduces precision burden. It should be a helper (`Rechthoek tekenen`) that creates an editable polygon, not a separate room type.

Grid snapping should not exist in V1. Soft visual guides are acceptable, but grid snap and wall snapping risk making the editor feel like CAD and can produce false precision.

Do not support duplicate polygon in V1 because it encourages copy/paste errors across rooms. Do not support holes or disconnected regions.

## 12. Polygon validation behavior

| Case | Blocking? | Guidance | Visual cue | Auto-fix/recovery |
| --- | --- | --- | --- | --- |
| Fewer than three points | Blocking | `Plaats minimaal drie punten om een kamergrens te maken.` | Incomplete outline | Continue drawing or cancel |
| Zero-area/flat polygon | Blocking | `Deze grens heeft geen bruikbare vorm. Zet de punten rondom de kamer.` | Highlight collapsed edge | Redraw or move points |
| Self-intersection | Blocking | `De grens kruist zichzelf. Verplaats een punt zodat de lijn rond de kamer loopt.` | Mark crossing lines | User edits points; no hidden auto-fix |
| Active overlap with another room | Blocking for active save; draft allowed | `Deze grens overlapt met {kamer}. Kies welke kamer dit stuk hoort.` | Highlight overlap area | Edit either polygon; conflict list links both rooms |
| Outside image bounds | Blocking | `Een deel van de grens ligt buiten de plattegrond.` | Mark outside segment | Clamp preview not automatic; user moves points |
| Tiny accidental polygon | Warning or blocking if below hard minimum | `Deze grens is erg klein. Controleer of dit echt een kamer is.` | Small-area warning badge | Confirm as small space or redraw |
| Room already has active overlay | Blocking unless replacing | `{kamer} heeft al een grens. Kies vervangen of bewerk de bestaande grens.` | Link existing overlay | Replace with confirmation or edit existing |
| Polygon linked to room on another floor | Blocking | `Deze kamer staat op {verdieping}. Verplaats de kamer eerst of kies een kamer op deze verdieping.` | Room/floor mismatch pill | Move room through room panel or select another room |
| Manual label anchor outside polygon | Warning blocking active label save, not boundary save | `Het label staat buiten de kamer. Verplaats het label of kies automatisch.` | Label handle red | Reset automatic or drag inside |
| Asset missing/changed | Blocking active overlay edit | `De plattegrond ontbreekt of is vervangen. Controleer eerst de plattegrond.` | Canvas missing state | Restore asset or replacement review |
| Needs review after replacement | Blocking runtime trust | `Deze kamergrens moet nog gecontroleerd worden voor de nieuwe plattegrond.` | Review badge | Approve or redraw |

Overlap resolution should be explicit and room-based, not mathematical. The editor should identify the conflicting room and offer `Naar conflict gaan`, `Deze grens aanpassen`, or `Andere grens aanpassen`.

## 13. Label-placement UX

- Labels appear after a polygon is linked to a room.
- Default placement uses automatic interior placement against the valid polygon.
- Manual label editing is separate from boundary editing: `Label verplaatsen` mode.
- Dragging a label stores only the anchor, not runtime typography.
- `Automatisch plaatsen` resets the manual anchor.
- If a room is narrow or concave, automatic placement may choose the clearest interior point and the review list may say: `Label staat automatisch op de best leesbare plek.`
- Long room names are previewed in the editor with runtime-like truncation/wrapping behavior, but typography remains a runtime concern.
- Label collisions are warnings, not boundary blockers: `Labels staan dicht op elkaar. Verplaats een label of gebruik kortere namen.`
- Icon/status anchors are deferred from V1.

## 14. Touch and desktop interaction model

Desktop is the preferred mode for boundary editing and replacement review.

Tablet is supported with:

- explicit modes: `Verplaatsen`, `Punt toevoegen`, `Punt bewerken`, `Label verplaatsen`;
- larger vertex handles;
- pinch zoom and two-finger pan;
- single tap only places a point while drawing mode is active;
- toolbar undo/cancel always visible;
- no mandatory long-press-only action;
- edge magnification or zoom-to-room as a helper if implementation allows.

Phone editing is unsupported for polygon drawing and replacement approval. Phone can show setup status, rename floors/rooms where form layout permits, and resume prompts: `Grenzen tekenen werkt beter op een groter scherm. Open FamilyBoard op een laptop, desktop of tablet om verder te gaan.`

Keyboard behavior:

- Tab navigates floor list, room list, toolbar, canvas controls, validation list.
- Arrow keys can nudge selected vertex or label when focused.
- Escape exits drawing mode with a confirmation if unsaved points exist.
- Enter closes a polygon only when valid enough to attempt closure.
- Undo is available through both keyboard and visible button.

## 15. Draft, save, and recovery model

### States

- `Niet gestart`: no floors.
- `Verdieping aangemaakt`: floor exists, no rooms/asset required yet.
- `Plattegrond ontbreekt`: selected floor has no active asset.
- `Uploadconcept`: upload validated or pending, not active.
- `Plattegrond actief`: active sanitized asset exists.
- `Kamers aangemaakt`: canonical rooms exist.
- `Grensconcept`: in-progress polygon points.
- `Grens ongeldig`: polygon exists but cannot become active.
- `Geldig maar niet gekoppeld`: polygon is valid draft but no room link.
- `Gekoppeld en geldig`: active trusted room overlay.
- `Controle nodig`: overlay or label requires review after asset replacement.
- `Verdieping onvolledig`: floor lacks required active asset, rooms, or reviewed overlays.
- `Verdieping compleet`: all included active rooms intended for the floor are valid/reviewed.
- `Gearchiveerd`: floor/room retained but excluded from runtime.
- `Plattegrond ontbreekt of beschadigd`: active asset reference cannot render.

### Save model

Use conceptual server-backed drafts, not only local browser drafts. Incomplete setup should survive device changes and browser restarts. Local unsent changes can exist briefly and should be recovered with a banner after interruption.

Save should be per floor for asset/overlay work and global for floor/room ordering. The editor should autosave safe metadata changes after brief debounce and require explicit `Opslaan` for boundary changes and asset activation/replacement approval.

Invalid drafts may persist as drafts with clear status but cannot be runtime-active. Backups before setup completion include floors, rooms, draft/active assets, overlays, review states, and old recoverable asset versions when retained.

Undo depth:

- drawing session: multi-step undo for point and vertex edits;
- after save: one-click restore for recently replaced/deleted overlays where recoverable;
- destructive global changes: confirmation plus archive/rollback where possible.

Cancel behavior:

- cancel drawing discards unsaved points after confirmation;
- cancel replacement keeps old active asset and deletes or keeps replacement draft by choice;
- closing editor with unsaved changes shows an unsaved-change warning.

## 16. Completion states

Avoid gamified percentages. Use status labels with clear next actions.

- **Niet gestart:** no floors.
- **In uitvoering:** floors/rooms/assets exist but the selected floor is not runtime-usable.
- **Bruikbaar:** at least one included floor has an active asset and at least one enabled room with a valid trusted overlay. Runtime could show limited floor-plan context later.
- **Compleet:** every enabled visible room intended for the included floor has a valid trusted overlay or is explicitly marked `Geen grens nodig` for V1.
- **Controle nodig:** replacement review, label review, or stale overlay exists.
- **Geblokkeerd:** missing/corrupt asset, unsafe upload, invalid geometry, or save failure prevents trust.

Minimum usable state: one included floor, one active sanitized asset, one enabled room, one valid linked trusted overlay. Complete is stronger and floor-scoped.

## 17. Empty/error states

Recommended Dutch copy:

- No floors: `Nog geen verdiepingen. Voeg de verdiepingen toe zoals jullie ze thuis noemen.`
- No rooms: `Nog geen kamers op deze verdieping. Voeg kamers toe voordat je grenzen tekent, of maak een kamer tijdens het tekenen.`
- No asset: `Nog geen plattegrond voor deze verdieping. Upload een afbeelding om kamergrenzen te tekenen.`
- Unsupported file: `Dit bestandstype wordt niet ondersteund. Gebruik SVG, PNG, JPG of JPEG.`
- Unsafe SVG: `Deze SVG kan niet veilig worden getoond. Exporteer de plattegrond opnieuw zonder scripts of externe inhoud.`
- Corrupted asset: `Deze plattegrond kan niet worden gelezen. Kies een nieuw bestand.`
- Image too large: `Deze afbeelding is erg groot. FamilyBoard kan een veilige werkversie maken zodat de editor soepel blijft.`
- Failed sanitization: `We konden geen veilige versie van deze plattegrond maken. Probeer een andere export.`
- Failed preview: `Voorbeeld laden lukt niet. Je huidige plattegrond is niet aangepast.`
- Missing asset after restore: `De kamerindeling is hersteld, maar de plattegrondafbeelding ontbreekt. Upload de afbeelding opnieuw om de grenzen te controleren.`
- No room linked: `Deze grens hoort nog niet bij een kamer.`
- Polygon overlap: `Deze kamergrens overlapt met {kamer}. Pas één van de grenzen aan.`
- No valid overlays: `Er zijn nog geen kamers met een geldige grens.`
- Replacement pending review: `Nieuwe plattegrond wacht op controle. De vorige plattegrond blijft actief totdat je klaar bent.`
- Failed save: `Opslaan lukte niet. Je wijzigingen blijven hier staan; probeer het opnieuw.`
- Network interruption: `Verbinding onderbroken. We proberen je concept te bewaren zodra FamilyBoard weer verbinding heeft.`
- Restored old version: `Vorige plattegrond is teruggezet. Controleer de kamergrenzen voordat je verdergaat.`

## 18. Accessibility

The canvas must not be the only way to understand editor state.

Requirements:

- Floor rail and room panel expose all floors, rooms, overlay states, and review tasks as keyboard-accessible lists.
- Validation panel lists every blocking and warning item with a button to focus the related room or conflict.
- Dialogs use existing accessible Settings conventions: named dialog, visible close, no hidden destructive action.
- Status changes use `role="status"`; errors and failed saves use `role="alert"`.
- Validation never relies on color alone; use text, icon, line style, and list items.
- Visible focus must exist for floor items, room items, toolbar buttons, vertex handles, label anchors, and validation links.
- Zoom controls are buttons as well as pointer gestures.
- Reduced-motion mode disables animated canvas transitions and nonessential preview morphs.
- Keyboard alternatives exist for room/floor management and coarse polygon editing, but full precise polygon editing without pointer input is an acceptable V1 limitation if users can request `Markeer deze kamer als later tekenen` and complete names/status through lists.
- Screen-reader canvas description should summarize selected floor, asset status, selected room, polygon status, and available non-canvas controls.

## 19. Viewport/layout model

The editor belongs in a full-page Settings workspace under Woning/climate setup, not in the runtime Woning page.

Browser-level vertical scrolling should remain unacceptable for the Settings primary page. The specialized editor should use bounded independent panels:

```text
┌────────────────────────────────────────────────────────────────────┐
│ Header: Plattegronden beheren · setup status · save state          │
├─────────────┬─────────────────────┬───────────────────────────────┤
│ Floor rail  │ Room/status panel   │ Canvas workspace              │
│ scrollable  │ scrollable          │ zoom/pan bounded              │
├─────────────┴─────────────────────┴───────────────────────────────┤
│ Validation/review bar: blockers, warnings, primary action          │
└────────────────────────────────────────────────────────────────────┘
```

At narrower tablet widths, the room/status panel can collapse into tabs or a side sheet, but floor selection, canvas, and validation summary must remain visible. Phone-sized widths show a status/maintenance view and block drawing/review tasks.

Minimum implementation target should be common laptop/desktop viewports. Exact pixels are deferred, but the composition must reserve fixed regions and put overflow inside floor/room/review panels, not the document body.

Avoid excessive modal nesting. Use a single surface for upload/replacement review; avoid opening a confirmation dialog on top of another dialog when an inline confirmation panel can work.

## 20. Confirmation and destructive-action rules

| Action | Confirmation rule |
| --- | --- |
| Replace asset | Required before replacement draft; activation also requires review approval. |
| Remove active asset | Required; explain overlays become unresolved and runtime floor plan becomes unavailable. |
| Delete floor | Required; blocked until rooms are moved/archived/deleted. Strong confirmation if asset/overlays exist. |
| Archive floor | Required lightweight confirmation; reversible. |
| Delete room | Required; prefer archive when overlays/config/mappings exist. |
| Move room to another floor | Confirmation if active overlay exists or climate config/mappings later exist; explain overlay review outcome. |
| Merge rooms | Required; choose surviving room; archive other; no automatic geometry merge in V1. |
| Split room | Required; create new room and mark boundaries needing work. |
| Unlink polygon | Required if active; draft unlink can be undoable without modal. |
| Delete polygon | Required for active overlays; undo acceptable for unsaved drafts. |
| Accept overlay reuse | Explicit room-by-room approval; accept-all only when all are reusable candidates. |
| Discard drafts | Required if unsaved work exists. |
| Restore previous asset version | Required; show what current draft/active work will be replaced. |

Prefer undo for safe local edits, confirmation for irreversible or trust-changing actions.

## 21. Dutch terminology

| Concept | Recommended term |
| --- | --- |
| Floor plan | `Plattegrond` |
| Floor | `Verdieping` |
| Room | `Kamer` |
| Room boundary | `Kamergrens` or `Grens` in context |
| Drawing mode | `Tekenmodus` |
| Label | `Label` or `Kamernaam` when user-facing |
| Upload | `Uploaden` / `Plattegrond uploaden` |
| Replace | `Vervangen` / `Plattegrond vervangen` |
| Review required | `Controle nodig` |
| Invalid boundary | `Grens klopt nog niet` |
| Incomplete setup | `Nog niet compleet` |
| Ready for use | `Klaar voor gebruik` or `Bruikbaar` |
| Archived | `Gearchiveerd` |
| Hidden/excluded | `Niet meenemen in klimaatweergave` |
| Restore | `Terugzetten` or `Herstellen` for backup contexts |
| Remove | `Verwijderen` |
| Rollback asset | `Vorige plattegrond terugzetten` |

## 22. Explicit answers to all design questions

1. **Wizard, workspace, or hybrid?** Hybrid.
2. **Best first-run flow?** Guided wizard for floors, rooms, first upload, first boundary, and review, then handoff to workspace.
3. **Best maintenance flow?** Direct Settings entry into persistent floor workspace.
4. **Should rooms be created before polygons?** Prefer yes; also allow room creation during drawing.
5. **May draft polygons exist without room links?** Yes as drafts only; never runtime-active.
6. **Should desktop be required for editing?** Desktop should be preferred, not strictly the only supported mode.
7. **Should phone editing be unsupported?** Phone boundary drawing and replacement approval should be unsupported; status and simple name maintenance may remain available.
8. **Minimal polygon toolset for V1?** Draw points, close, undo, cancel, pan/zoom, edit/insert/delete vertices, move polygon, reset/redraw, validate, save draft/active.
9. **Are rectangle shortcuts worthwhile?** Yes as an editable helper.
10. **Should grid snapping exist in V1?** No.
11. **How should overlap conflicts be resolved?** Block active save, name the conflicting room, highlight overlap, and let the user edit one boundary.
12. **How should automatic and manual label placement interact?** Automatic by default; manual anchor optional; reset to automatic always available; invalid manual anchors require correction or reset.
13. **Right autosave model?** Server-backed drafts for setup state, explicit save/activate for boundaries and asset review, local recovery for unsent changes.
14. **Can incomplete floor plans be saved?** Yes.
15. **What defines usable versus complete?** Usable: at least one included floor with active asset and one valid trusted linked overlay. Complete: all intended visible rooms on included floors have valid trusted overlays or explicit no-boundary decision.
16. **How should asset replacement review work?** Old active remains active; new asset is a draft; previews compare old/new; previous overlays are previewed when compatible; user approves/redraws room-by-room; activate only after required review.
17. **Can overlays be partially approved?** Yes.
18. **How should rollback work?** `Vorige plattegrond terugzetten` restores retained old active asset and trusted overlays; failed replacement never damages active setup.
19. **Which destructive actions need confirmation?** Asset replace/remove, floor delete/archive, room delete, moving a room with overlay/config implications, merge/split, unlink/delete active polygon, accept overlay reuse, discard drafts, restore previous asset.
20. **How remain understandable without coordinates/SVG details?** Use household terms, previews, room lists, status pills, and plain-language validation; hide normalized coordinates and SVG internals behind `veilige versie` copy.
21. **How should room creation and drawing stay separate but connected?** Rooms are canonical list items; drawing links a boundary to a selected room; inline room creation is allowed but still creates the room before linking.
22. **What must the third runtime-analysis slice assume as settled?** FamilyBoard owns floors/rooms/assets/overlays; floors are user-ordered with no hard max; one floor active at runtime; assets are visual backgrounds; runtime uses sanitized coordinate basis; overlays are normalized polygons; replacement requires review; labels have automatic/manual anchors; incomplete states exist and must be respected; phone editing is limited; runtime design is not yet defined.

## 23. V1 editor scope

V1 includes:

- Settings entry point and guided first-run setup;
- user-defined ordered floors;
- canonical room management;
- one active visual asset per floor;
- SVG/PNG/JPG/JPEG upload, safe preview, validation, and replacement drafts;
- sanitized asset coordinate basis shared by editor and runtime;
- one active polygon per room per active floor asset;
- polygon drawing/editing with validation;
- room linking;
- automatic label placement and optional manual anchor;
- replacement review with partial approvals;
- incomplete/draft states;
- accessible list-based state and validation panels;
- desktop and tablet editing, phone status-only limitation.

## 24. Deferred editor capabilities

Deferred:

- automatic room detection;
- CAD/BIM import or behavior;
- PDF import;
- furniture layers;
- wall snapping;
- grid snapping;
- automatic vectorization;
- holes in polygons;
- disconnected room regions;
- duplicate polygon;
- automatic Home Assistant room ownership;
- runtime climate floor-plan UI;
- climate color/state rules;
- HA entity setup details;
- advanced accessible non-pointer polygon editing beyond coarse keyboard adjustments;
- exact drawing library selection.

## 25. Risks and unresolved questions

- **Sanitization preview fidelity:** SVG sanitization may materially alter drawings. The product needs robust difference detection or conservative side-by-side review.
- **Asset retention cost:** rollback requires retaining previous assets. Storage policy and backup inclusion need later technical design.
- **Touch precision:** tablet support may still frustrate users with dense floor plans. Desktop-preferred copy should be explicit.
- **Accessible polygon editing:** full geometry creation without pointer input may be unrealistic in V1. The fallback must still allow users to understand and manage setup state.
- **Completion semantics:** runtime slice must decide how to treat optional rooms and `Geen grens nodig` without making climate deep dive misleading.
- **Implementation complexity:** introducing canvas editing, upload sanitization, and review workflows is a large feature and should be split carefully.

## 26. Inputs guaranteed for the third runtime-analysis slice

The runtime slice can assume:

1. Floors are FamilyBoard-owned, user-defined, ordered, and have no hard maximum.
2. Rooms are FamilyBoard-owned canonical household identities independent of assets and Home Assistant.
3. Climate-specific relevance, policy, and source mappings are outside canonical Room identity.
4. A floor may have zero or one active visual floor-plan asset.
5. Active assets are sanitized and define the shared editor/runtime coordinate basis.
6. Room geometry is stored separately as normalized polygons.
7. V1 has at most one active polygon per room per active floor asset.
8. Labels use automatic placement by default with optional stored manual anchor.
9. Every replacement asset requires explicit overlay review before becoming trusted.
10. Technical compatibility may allow previewing previous overlays but never automatic trust.
11. Incomplete floors and rooms can exist and must degrade gracefully.
12. Missing/corrupt assets retain floors, rooms, and unresolved overlays.
13. Home Assistant areas/entities are suggestions or mappings only.
14. The main Woning page remains Story-first and does not show a permanent floor plan.
15. Runtime climate deep-dive design remains open, except that it should consume the trusted editor outputs above.

## Validation checklist

- No production code was changed.
- No runtime climate deep-dive UI was designed.
- No screenshots or binary assets were created.
- The previous product model was not reopened except for accepted corrections.
- Floors remain user-defined with no hard maximum.
- Climate-specific relevance remains outside canonical Room identity.
- Every asset replacement requires review.
- Editor and runtime share the sanitized asset coordinate basis.
- FamilyBoard remains canonical owner of floors, rooms, assets, and overlays.
- Home Assistant areas remain suggestions/mappings only.
- Phone editing limitations are explicit.
- Accessibility does not depend on canvas-only interaction.
