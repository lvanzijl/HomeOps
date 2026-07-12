# Woning Climate Deep Dive — Floor-Plan Product Model

Date: 2026-07-12  
Scope: analysis slice 1 of 3; conceptual product model only  
Status: research report for later consolidation  
Exclusions: no editor UX, no runtime climate deep-dive UI, no production implementation

## 1. Executive summary

FamilyBoard should own the canonical floor and room model. Home Assistant may help suggest mappings to areas, devices, sensors, climate zones, and controls, but it must not own FamilyBoard room identity. The durable product model should therefore be:

```text
FamilyBoard Household
→ Floors
  → Rooms assigned to the floor
  → one active Floor-plan Asset, optional
  → Room Overlays on the active asset
    → one canonical Room per overlay
    → optional label anchor, centroid fallback
→ Home Assistant capability mappings
  → HA areas, devices, entities, sensors, climate zones, and Evohome zones as external mappings only
```

The stable conclusion is an independent overlay model. A floor-plan asset is a visual background. Room identity, household meaning, ordering, and geometry live in FamilyBoard-owned records outside the uploaded graphic. Asset replacement must never silently destroy room identity. Existing overlays may remain valid when the replacement preserves the same coordinate basis, dimensions, aspect ratio, and orientation; otherwise FamilyBoard should retain room identity, mark geometry as needing review, and require explicit confirmation before using it as trusted interaction geometry.

V1 should support four household floors, user-defined floor and room names, suggested floor types, one active graphic per floor, SVG/PNG/JPG/JPEG upload support, normalized polygon overlays, one polygon per room per floor-plan in V1, optional explicit label anchor, centroid fallback, no holes, no disconnected room regions, no automatic room detection, no HA ownership of identity, soft degradation for broken HA mappings, and backup/restore inclusion for both metadata and user-uploaded assets.

## 2. Accepted design decisions

This report treats the provided product direction as settled:

- FamilyBoard owns floors and rooms.
- Home Assistant areas are suggestions and mappings only.
- Home Assistant entity names are never FamilyBoard room identity.
- FamilyBoard supports four household floors.
- The main Woning page remains Story-first.
- Floor plans exist only inside the climate deep dive.
- One floor is shown at a time.
- Each floor may use a custom uploaded floor-plan graphic.
- SVG is the preferred source format; PNG and JPG/JPEG should also be supported.
- The uploaded graphic is visual background only.
- Interactive room logic is stored separately as FamilyBoard-owned overlays.
- Room boundaries are manually drawn polygons.
- Polygon coordinates are normalized to the source asset coordinate basis.
- Each room boundary links to one canonical FamilyBoard room.
- V1 excludes automatic room detection, CAD/BIM behavior, furniture layers, wall snapping, automatic vectorization, Home Assistant identity ownership, and permanent floor-plan display on Woning.

## 3. Repository findings

### Existing household ownership pattern

The backend has a first-class `Household` with stable `Id`, `Name`, `TimeZoneId`, onboarding state, and created/updated timestamps. The current seeded household is a single canonical household named `Home`. This supports adding floors and rooms as household-owned concepts rather than Home Assistant-owned concepts.

### Existing family member and soft-delete pattern

Family members are household-owned, named concepts with stable IDs, display metadata, timestamps, and soft-delete fields (`IsDeleted`, `DeletedUtc`). The data model indexes by household/name and household/is-deleted/name. This is a relevant pattern for rooms: room identity should be stable, household-owned, and preferably soft-archived instead of destructively deleted when referenced by overlays, mappings, or Stories.

### No existing floor/room/location/area model suitable for reuse

Repository inspection found no current production domain object for house floors, rooms, Home Assistant areas, household spaces, polygons, floor-plan canvases, or room geometry. Calendar event `Location` is just event text and is not a household room model. Weather `WeatherLocationOptions` is a household geographic weather location, not an indoor floor/room location. The design asset system contains semantic inline React SVG icons, not user-uploaded floor-plan assets.

### Existing asset and upload patterns are not enough for floor plans

The repository contains an event-source configuration for uploaded iCalendar files (`ICalFileSourceConfiguration`) with a file reference, original filename, content hash, and upload timestamp. Event-source management accepts these values as provider configuration metadata. This is evidence of lightweight file-reference metadata, not a general binary upload, asset storage, SVG sanitization, image normalization, or restoreable user-asset system.

### Existing SVG usage is code-owned, not user-uploaded

The frontend design asset guidance says FamilyBoard's current generic asset system implements semantic inline React SVG icons only. It prohibits binary artwork, external icon libraries, ad hoc reusable page-local SVGs, and imported SVG files for the generic icon registry. Historical report SVG files exist under docs, but they are not production runtime floor-plan assets. Therefore floor-plan SVG handling must be designed as a separate user-uploaded content path with sanitization and backup implications.

### Existing backup/restore is calendar-specific

Calendar portability exports event sources, event series, recurrence, exceptions, household timezone, and provider configuration metadata. Restore writes a pre-restore snapshot before replacing calendar data. It also exports iCal file metadata (`FileReference`, `OriginalFilename`, `ContentHash`, `UploadedUtc`) but does not demonstrate a general archive containing binary files. Floor-plan backup/restore therefore needs a new expectation: both the metadata graph and uploaded floor-plan files/previews must be included or restorable with clear missing-asset degradation.

### Existing provider-health pattern is useful

Weather snapshots carry freshness and provider status. Event sources carry health status and sync timestamps. The floor-plan model should borrow that separation: HA mapping health affects available room capabilities, not the existence or identity of floors, rooms, assets, or overlays.

### Relevant constraints

- The architecture is a modular monolith with ASP.NET Core, React/TypeScript/Vite, PostgreSQL, and OpenAPI contracts.
- Primary FamilyBoard pages must be viewport-first and must not gain browser-level vertical scrolling.
- Woning main page remains Story-first; floor plans are restricted to climate deep dive.
- User-uploaded assets are meaningfully different from the existing code-owned icon registry.

## 4. Canonical Floor model

### Definition

A FamilyBoard Floor is a first-class household-owned level of the home used to organize rooms, floor-plan assets, overlays, climate interpretation, and navigation within the climate deep dive. It is not a Home Assistant area and not a visual layer inside an uploaded SVG.

### Attributes

A Floor conceptually needs:

- stable `floorId`;
- `householdId`;
- display name;
- optional suggested floor type;
- order index;
- active/hidden state for climate deep dive;
- archived state and archive timestamp;
- optional active floor-plan asset reference;
- created/updated timestamps.

### Product rules

1. A floor is first-class because rooms, overlays, asset assignment, ordering, and HA mapping suggestions all need a stable FamilyBoard parent.
2. Floor names should be fully user-defined.
3. FamilyBoard should offer Dutch suggested floor types as helpers, not identity: `kelder`, `begane grond`, `eerste verdieping`, `tweede verdieping`, `zolder`, plus custom.
4. Floor order is a user-controlled integer/order rank. Suggested type can initialize order, but must not own it.
5. Floors can exist without an asset. This allows setup before upload and climate mapping without a floor-plan graphic.
6. Floors can be hidden from the climate deep dive without deleting rooms or mappings.
7. Floors should support archive; hard delete should be restricted when rooms, overlays, Stories, or mappings reference the floor.
8. Removing a floor must never silently delete rooms. The product should require the user to move rooms, archive rooms with the floor, or explicitly delete the floor and dependent overlays/mappings according to reference checks.

## 5. Canonical Room model

### Definition

A canonical FamilyBoard Room is the durable household meaning of a physical or household-relevant space. It is the identity used by Stories, climate interpretation, floor-plan overlays, labels, ordering, and Home Assistant mapping. It exists independently of a floor-plan image and independently of HA areas or entity names.

### First-class room attributes

V1 should make these first-class:

- stable `roomId`;
- `householdId`;
- `floorId`;
- display name;
- room type/suggested type, for example bedroom, bathroom, living room, kitchen, hall, landing, office, storage, other;
- sort order within floor;
- enabled/disabled or visible/inactive state;
- archived/deleted state;
- created/updated timestamps.

The following should also be first-class product flags because they affect climate interpretation without being widget-specific:

- bedtime relevance;
- comfort relevance;
- humidity relevance;
- heating relevance.

The following should be supported carefully as optional relationship/context, not core identity:

- primary family member, if the room is strongly associated with one person;
- shared/private usage, as household semantics.

### Future configuration rather than core identity

These should remain future configuration or policy rather than identity:

- exact comfort temperature targets;
- per-time-window heating schedules;
- ventilation thresholds;
- notification preferences;
- room occupancy assumptions;
- detailed privacy rules;
- child-specific bedtime schedules;
- control automation policy.

### Product rules

1. A room can exist without a drawn boundary.
2. A room can exist without Home Assistant data.
3. Multiple overlays may link to one room only when the product later supports disconnected regions or versioned/historical assets. V1 should allow at most one active overlay per room per floor-plan asset.
4. One overlay must not link to multiple rooms. A boundary represents one canonical room. Multi-room areas require separate rooms, grouped display, or deferred room-group semantics.
5. A room can move between floors. Its identity remains stable, but its active overlay becomes invalid/unlinked because coordinates belong to the old floor asset coordinate basis. HA mappings remain attached to the room, but mapping health should be re-evaluated because room/floor context changed.
6. Room merge and split should preserve auditability and require confirmation because Stories, overlays, and HA mappings may reference old rooms.

## 6. Floor-plan Asset model

### Definition

A Floor-plan Asset is a FamilyBoard-owned, user-uploaded visual background for exactly one floor at a time. It is not the source of room identity. It provides a coordinate basis for overlays.

### Attributes

A conceptual floor-plan asset needs:

- stable `assetId`;
- `householdId`;
- `floorId`;
- original filename;
- media type and extension;
- content hash;
- uploaded timestamp;
- active/replaced/archived state;
- original width/height or SVG viewBox dimensions;
- sanitized/rendered width/height used as coordinate basis;
- aspect ratio;
- orientation metadata if available;
- original-file retention flag/path/reference;
- sanitized asset reference;
- normalized preview reference;
- validation/sanitization status;
- safety diagnostics for rejected content.

### Product rules

1. V1 should have exactly one active graphic per floor. Previous versions should be retained at least as recoverable asset history until the user intentionally purges them or a backup retention policy expires.
2. Asset replacement should try to preserve room boundaries only when the coordinate basis is unchanged or explicitly compatible: same sanitized dimensions/viewBox, same aspect ratio, same orientation, no crop, no meaningful transform, and the user confirms preservation.
3. If dimensions, aspect ratio, orientation, crop, or coordinate basis changes, overlays should be marked `needsReview` rather than silently reused as trusted geometry.
4. V1 supported formats: SVG, PNG, JPG, JPEG.
5. PDF should be excluded in V1 because it introduces document pages, rendering variability, embedded content, and ambiguous coordinate mapping.
6. Animated formats such as GIF, animated WebP, and animated SVG behavior should be excluded.
7. Conceptual limits should protect appliance-class hardware and backup size. V1 should target a practical source limit such as 10 MB per uploaded file and a maximum raster dimension around 4096 px on the longest side, with lower normalized preview dimensions for runtime. These are product limits, not code constants in this report.
8. FamilyBoard should retain the original uploaded file for backup and future reprocessing, but runtime should use sanitized/normalized derivatives only.
9. FamilyBoard should create a normalized preview for consistent rendering, thumbnailing, and integrity checks.
10. Aspect ratio should be preserved. The floor-plan canvas may letterbox within available UI space, but coordinate math stays in normalized asset coordinates.
11. Orientation changes are breaking unless FamilyBoard can prove and record a deterministic transform.
12. Transparent SVG/PNG backgrounds should render over a neutral FamilyBoard floor-plan canvas background; transparency is allowed but must not affect coordinate geometry.
13. Uploaded SVG must be sanitized. Scripts, event handlers, external references, remote images, unsafe links, embedded fonts with external fetches, foreignObject content, and active/animated behavior should be rejected or stripped. If stripping changes geometry or rendering materially, require user confirmation.
14. Backup/restore must include the floor/room/overlay metadata and the asset files needed to recreate active and recoverable floor plans. Missing assets after restore should not delete floors, rooms, or overlays; the floor should show a missing-asset state and retain overlay geometry as unresolved until the asset is restored or replaced.

## 7. Room Overlay model

### Definition

A Room Overlay is FamilyBoard-owned geometry that links one canonical Room to one floor-plan asset coordinate basis. It defines the interactive room boundary for climate deep-dive interaction.

### Shape model

1. Polygon is the correct canonical V1 boundary shape.
2. Rectangles should be stored as polygons with four points to keep V1 simple.
3. Minimum valid polygon: at least three distinct points, non-zero area, no duplicate adjacent points after normalization, closed implicitly by the model.
4. Concave polygons should be supported because real rooms often have L-shapes.
5. Holes inside polygons should be deferred.
6. Self-intersecting polygons are invalid.
7. Overlapping polygons should be invalid by default for active room overlays on the same floor-plan asset because they create ambiguous interaction. A future explicit overlap layer can be designed separately.
8. Uncovered areas can exist. Corridors, staircases, closets, utility shafts, voids, and unmapped areas may remain unmapped.
9. One room with multiple disconnected polygon regions should be deferred from V1. V1 should permit one active polygon per room per active floor-plan asset.

### Coordinate model

Coordinates should be normalized point pairs relative to the sanitized/rendered asset coordinate basis used for overlay display. Each point is `{x, y}` where `0.0 <= x <= 1.0` and `0.0 <= y <= 1.0`. This keeps overlays resilient to responsive scaling while still tied to a specific source geometry.

The coordinate basis should be the sanitized/rendered asset dimensions, not the raw untrusted source file and not an arbitrary fixed logical canvas. For SVG this means the sanitized viewBox/rendered coordinate basis; for rasters this means decoded pixel dimensions after orientation normalization. The asset record must persist this basis so replacement compatibility can be evaluated.

Precision should support detailed hand-drawn room outlines without false drift. Conceptually, six decimal places is sufficient for normalized coordinates; products should compare with tolerance rather than exact floating equality.

### Versioning and integrity

Overlay versioning should exist at least as updated timestamp plus geometry revision. Full history can be deferred, but asset replacement should be able to mark the current overlay as valid, needs review, or invalid against a specific asset version. Required integrity constraints:

- overlay references an existing household room;
- overlay references the same floor as the room;
- overlay references an existing active or recoverable floor-plan asset;
- active overlay points are in range;
- polygon has non-zero area and no self-intersection;
- one active overlay per room per active asset in V1;
- no active overlap with another room overlay unless a future explicit exception model exists;
- overlay cannot outlive hard-deleted room or hard-deleted asset as active trusted geometry.

## 8. Label and anchor model

### Required V1 anchors

V1 should support:

- optional label anchor;
- automatic centroid fallback.

Icon anchor, status anchor, and preferred room-detail opening point should be deferred. They are runtime presentation details and should not expand the core model before the editor and runtime deep-dive analyses define needs.

### Rules

1. Label position should default to a polygon centroid/visual interior point.
2. Difficult concave rooms should use a computed interior point rather than a naïve mathematical centroid when possible. If the fallback lands outside the polygon, FamilyBoard should use a safer interior point or require explicit label anchor placement.
3. Labels may be placed outside boundaries only if explicitly allowed later for readability with a leader line. V1 should prefer anchors inside the polygon.
4. Anchors use the same normalized coordinate basis as polygon points.
5. When a polygon changes, automatic anchors recalculate. Explicit anchors remain but should be checked for whether they are still inside the polygon; if not, mark them for review or fall back to automatic placement.
6. Anchor placement should be automatic by default and explicit only when the user adjusts it.

## 9. Home Assistant mapping boundary

### Ownership rule

FamilyBoard owns:

- floor identity;
- room identity;
- room name;
- room meaning;
- floor-plan asset;
- room polygon;
- room display and ordering.

Home Assistant may provide:

- areas;
- devices;
- entities;
- sensors;
- climate zones;
- technical controls;
- suggested room matches;
- mapping health evidence.

### Relationship rules

1. HA areas should not be imported as canonical rooms and should not be continuously synchronized into room identity. They should be offered as suggestions and mapping candidates.
2. One FamilyBoard room may map to multiple HA areas when the HA setup is more fragmented than household meaning.
3. Multiple FamilyBoard rooms may map to one HA area only as a degraded or explicit advanced mapping when HA is coarser than the house model; sensor attribution must then be explicit to avoid false room conclusions.
4. Direct entity mappings should be allowed when HA areas are insufficient, especially for standalone temperature/humidity sensors, water meters, appliance state, climate entities, and room-specific helpers.
5. Evohome zones should map as climate capability mappings to one or more FamilyBoard rooms. The preferred V1 relationship is one Evohome zone to one room, but shared-zone cases must be representable as a capability mapping with reduced precision.
6. Duplicate temperature/humidity sources should map as room capability sources with priority, role, freshness, and health. FamilyBoard should not average blindly unless a later climate model defines that behavior.
7. HA area name changes must not rename FamilyBoard rooms. They should mark mapping suggestions as changed and possibly degrade mapping health until reviewed.
8. Disappearing entities should not delete rooms or overlays. They should degrade room capability health.
9. The FamilyBoard room remains stable when HA mappings break.
10. Mapping health affects whether room climate data, controls, and Story evidence are available. It does not affect floor-plan structure.

This report intentionally does not design the HA setup workflow.

## 10. Lifecycle rules

### Floor lifecycle

- **Create:** creates stable floor identity with name, order, suggested type, and no required asset.
- **Name:** user-defined; duplicate handling described below.
- **Reorder:** changes display/deep-dive order only; room identity unaffected.
- **Add rooms:** rooms reference the floor; floor can contain zero rooms.
- **Add asset:** floor gains active visual background; no rooms are created automatically.
- **Replace asset:** active asset version changes; overlays are preserved only when compatible and confirmed, otherwise marked needs-review.
- **Hide:** floor remains in model but omitted from normal climate deep-dive floor switcher.
- **Archive:** floor is inactive but recoverable; rooms can be archived with it or moved after confirmation.
- **Delete:** allowed only when no active references remain, or after explicit confirmation that dependent overlays/mappings are deleted/archived and rooms moved/archived. Never silently cascade user meaning.

Stable: `floorId`, room references unless moved, asset history unless purged.  
Breaks: active floor-plan display if asset missing/corrupt.  
Requires confirmation: archive/delete with rooms, asset replacement that invalidates overlays.  
Recoverable: archive, previous asset version, hidden state.  
Never silent: room deletion, overlay invalidation, mapping loss.

### Room lifecycle

- **Create:** creates stable canonical room with floor, name, type, ordering, and optional relevance flags.
- **Assign floor:** required for active room; no room should be active without a floor in V1.
- **Map data:** HA areas/entities/zones attach as mappings, not identity.
- **Draw boundary:** creates overlay for active floor asset.
- **Rename:** changes FamilyBoard display name only; HA mapping labels unchanged.
- **Move floor:** room ID remains; existing overlay becomes invalid/unlinked because it belongs to old floor asset; mappings remain but health is re-evaluated.
- **Merge:** requires choosing surviving room identity, moving mappings, resolving overlays, and preserving references or aliases for history.
- **Split:** creates new room identity, requires explicit mapping and overlay reassignment.
- **Archive:** hides room from active climate use while retaining history/mappings for recovery.
- **Delete:** should be hard-restricted if Stories, mappings, overlays, task/history references, or other content still reference it; prefer archive.

Stable: room ID through rename and non-destructive edits.  
Breaks: overlay when moving floor or replacing incompatible asset.  
Requires confirmation: merge, split, move floor with overlay, archive/delete with mappings.  
Recoverable: archive, previous overlay until purged.  
Never silent: mapping deletion, Story reference loss, geometry destruction.

### Asset lifecycle

- **Upload:** accepts SVG/PNG/JPG/JPEG candidate and records original metadata.
- **Sanitize:** validates type, decodes dimensions/viewBox, strips/rejects unsafe SVG content, normalizes orientation.
- **Validate:** confirms dimensions, file size, aspect ratio, content hash, renderability, and safety.
- **Activate:** marks as the floor's active graphic; does not create rooms.
- **Replace:** creates new asset version; compatibility evaluation decides overlay status.
- **Rollback:** restores previous active asset and its matching overlay validity where possible.
- **Remove:** removes active display only after warning that overlays depend on this coordinate basis; rooms remain.
- **Restore from backup:** restores asset files plus metadata; missing files produce unresolved asset state, not room deletion.

Stable: asset ID/version and content hash.  
Breaks: overlays if coordinate basis incompatible.  
Requires confirmation: unsafe SVG rejection/stripping if visual changes, replacement, removal.  
Recoverable: original upload, sanitized derivative, previous version.  
Never silent: script/external content acceptance, image replacement invalidating geometry.

### Overlay lifecycle

- **Create:** polygon drawn against active asset and linked to one room.
- **Validate:** point range, area, self-intersection, overlap, same floor, one active polygon per room.
- **Link room:** exactly one canonical room.
- **Edit:** updates geometry revision and revalidates label anchor.
- **Invalidate after asset replacement:** mark needs-review or invalid rather than deleting.
- **Unlink:** allowed as explicit action; room remains without boundary.
- **Archive:** preserve old geometry for recovery/history.
- **Delete:** remove only after explicit confirmation.

Stable: room identity; overlay revision history where retained.  
Breaks: trusted interaction if invalid polygon or missing asset.  
Requires confirmation: unlink/delete, accepting preserved geometry after asset replacement.  
Recoverable: archived overlay.  
Never silent: geometry loss or cross-room reassignment.

## 11. Integrity and validation rules

- **Duplicate floor names:** warn; allow only if user confirms or disambiguates with type/order. Prefer unique active names per household.
- **Duplicate room names on same floor:** disallow for active rooms unless a differentiator is added.
- **Duplicate room names across floors:** allow; floor context disambiguates.
- **Rooms without floors:** not active in V1. Allow only as migration/recovery draft state, not normal product state.
- **Floors without rooms:** allowed.
- **Floors without assets:** allowed.
- **Rooms without overlays:** allowed.
- **Overlays without rooms:** invalid as active geometry; drafts may exist only during editor workflow later.
- **Overlapping polygons:** invalid for active V1 overlays.
- **Out-of-range points:** invalid.
- **Degenerate polygons:** invalid.
- **Missing assets:** floor remains; overlays become unresolved; rooms remain.
- **Corrupted assets:** quarantine asset, retain metadata, show recovery/replace path; do not delete rooms/overlays.
- **Unsafe SVG:** reject or sanitize before activation; never render unsafe source directly.
- **Deleted rooms referenced by Stories or mappings:** prefer archive; hard delete requires reference cleanup and explicit confirmation.
- **Deleted floors referenced by rooms:** disallow until rooms are moved, archived, or deleted by explicit confirmation.
- **Backup/restore with missing asset files:** restore metadata and mark asset missing; keep rooms/overlays unresolved.
- **HA mappings that no longer resolve:** mark unhealthy/stale; keep FamilyBoard room stable.

## 12. Backup/restore implications

Floor-plan support introduces user-defined content that is broader than current calendar export metadata. Backup/restore must include:

- household floor records;
- room records and room relevance flags;
- asset metadata and content hashes;
- original uploaded asset files where retained;
- sanitized runtime asset derivatives;
- normalized previews;
- active/replaced/archive asset state;
- overlay geometry and anchor data;
- HA mapping records and mapping health metadata, without treating HA names as identity.

Restore should be integrity-preserving:

1. Restore metadata even if asset files are missing.
2. Validate asset hashes when files are present.
3. Recompute or validate sanitized derivatives when possible.
4. Mark unsafe, corrupt, missing, or unrenderable assets as unresolved.
5. Keep rooms, floors, and mappings stable despite unresolved assets.
6. Require user review before reactivating overlays on assets whose coordinate basis cannot be verified.
7. Preserve pre-restore snapshot behavior conceptually so destructive restore can be undone.

## 13. Model alternatives and rejection rationale

### Alternative A — FamilyBoard rooms are canonical and HA areas are suggestions

Select this alternative. It matches the accepted direction and protects household meaning from technical integration drift. It allows rooms to exist before HA setup, after HA failures, and across HA renames/reorganizations. It keeps Woning Stories and climate deep dive grounded in FamilyBoard semantics.

### Alternative B — HA areas are canonical and FamilyBoard enriches them

Reject. HA areas often reflect technical setup, device grouping, historical naming, integrations, or convenience rather than family meaning. HA area rename/delete operations would destabilize FamilyBoard rooms, labels, overlays, and Stories. It would also make rooms unavailable for households without complete HA area setup.

### Alternative C — FamilyBoard rooms and HA areas are synchronized peers

Reject for V1. Peer synchronization creates conflict resolution, rename semantics, delete propagation, partial sync, and data ownership ambiguity. It is more complex than the product goal and risks Home Assistant becoming de facto identity owner.

### Asset-bound model — room identity lives inside the floor-plan asset

Reject. Embedding room identity in SVG layers, filenames, or image metadata ties household semantics to a replaceable visual file. It makes PNG/JPG support weak, complicates backup/restore, invites unsafe SVG dependence, and risks losing room identity when an image is replaced.

### Independent overlay model — asset is visual only, room identity/geometry stored separately

Select. It supports SVG/PNG/JPG uniformly, preserves room identity through asset replacement, allows rooms without boundaries, supports HA mapping independent of graphics, and cleanly separates sanitization from product semantics.

## 14. V1 scope

The smallest viable product model should include:

- four household floors;
- user-defined floors;
- suggested floor types;
- user-defined rooms;
- room type and sort order;
- room floor assignment;
- room relevance flags for bedtime, comfort, humidity, and heating;
- one active asset per floor;
- asset history sufficient for replacement/rollback/recovery;
- SVG, PNG, JPG, and JPEG support;
- PDF excluded;
- animated formats excluded;
- sanitized SVG only;
- normalized polygon overlays;
- coordinates normalized to sanitized/rendered asset basis;
- one active polygon per room per floor-plan asset;
- rectangles stored as polygons;
- concave polygons supported;
- no disconnected regions;
- no holes;
- invalid self-intersections;
- invalid active polygon overlap;
- optional explicit label anchor;
- centroid/interior-point fallback;
- no automatic detection;
- no HA ownership of room identity;
- optional HA area/entity/zone mappings;
- soft handling of missing HA mappings;
- backup/restore inclusion for metadata and asset files.

## 15. Deferred capabilities

Defer the following beyond V1:

- editor UX design;
- runtime climate deep-dive UI design;
- automatic room detection;
- automatic vectorization;
- CAD/BIM import;
- PDF floor-plan import;
- furniture layers;
- wall snapping;
- grid snapping beyond simple editor convenience;
- room holes;
- disconnected multi-region rooms;
- multi-floor rooms/voids as first-class concepts;
- live floor-plan display on main Woning;
- icon/status/detail-opening anchors;
- overlay overlap exceptions;
- full geometry revision history UI;
- HA setup workflow;
- bidirectional HA area synchronization;
- automation/control policy;
- occupancy model;
- per-room comfort target policy;
- entity-source aggregation logic.

## 16. Risks and unresolved questions

- Exact asset storage location and archive format are not yet defined.
- Exact SVG sanitizer and renderer constraints are not yet selected.
- The product needs a future decision on whether four floors are fixed slots or a maximum of four user-created floor records.
- Duplicate floor-name handling should be tested with Dutch households that commonly use similar labels.
- Multi-region rooms are excluded from V1 but may be needed for open spaces, split landings, or rooms drawn around voids.
- Shared Evohome zones may make room-level heating conclusions less precise.
- Backup size and retention policy require later engineering analysis.
- How Stories reference rooms historically after room merge/split needs a later canonical reference/alias policy.
- Editor UX must decide draft behavior for incomplete polygons and unlinked geometry without changing this core model.
- Runtime deep-dive analysis must decide how much missing mapping health is visible without becoming a technical HA dashboard.

## 17. Final recommended conceptual model

The recommended model is:

```text
FamilyBoard Household
├─ Floor[1..4]
│  ├─ Floor identity: name, suggested type, order, hidden/archive state
│  ├─ Room[0..n]
│  │  ├─ Room identity: display name, type, order, relevance flags, archive state
│  │  ├─ Room-to-HA mappings[0..n]
│  │  │  └─ HA area/device/entity/sensor/climate/Evohome-zone references and health
│  │  └─ Room Overlay[0..1 active in V1]
│  │     ├─ normalized polygon points
│  │     ├─ optional normalized label anchor
│  │     └─ validity state against asset version
│  └─ Floor-plan Asset[0..1 active]
│     ├─ original upload metadata and retained source
│     ├─ sanitized runtime asset
│     ├─ normalized preview
│     └─ coordinate basis dimensions/viewBox
└─ Backup/restore package
   ├─ floor/room/overlay/mapping metadata
   └─ active and recoverable asset files/derivatives
```

This model preserves the expected direction: FamilyBoard owns Floors and Rooms; a Floor may own one active visual asset; a Room exists independently from the asset; a Room Overlay links normalized polygon geometry to one Room; Home Assistant areas and entities are mappings, not identity; asset replacement never silently destroys room identity or geometry; and missing HA mappings degrade capability availability rather than floor-plan structure.

## 18. Inputs required by the next editor UX analysis

The editor UX analysis can rely on these model contracts and should answer:

1. How users create exactly up to four floors and choose suggested floor types.
2. How users upload, preview, sanitize feedback, replace, rollback, and remove floor-plan assets.
3. How users draw valid polygons, recover from invalid polygons, and handle overlap warnings.
4. How users create rooms before drawing boundaries and draw boundaries before final linking, if drafts are allowed.
5. How users place or reset label anchors.
6. How users review overlays after asset replacement.
7. How users hide/archive/delete floors and rooms with confirmation.
8. How HA area/entity suggestions are presented without implying HA ownership.
9. How missing/corrupt/unsafe assets are communicated.
10. How the editor remains viewport-safe without designing the runtime climate deep-dive UI.

## 19. Validation checklist

- No production code changed.
- No editor UX designed.
- No runtime climate deep-dive UI designed.
- No screenshots or binary assets created.
- FamilyBoard remains canonical owner of floors and rooms.
- Home Assistant areas remain suggestions/mappings.
- Room geometry is stored separately from uploaded graphics.
- Coordinates are normalized.
- V1 exclusions are explicit.
- Backup/restore implications are covered.
