# Woning Climate Floor Plans — Canonical Product Design

## 1. Executive summary

FamilyBoard floor plans are a spatial explanation layer for `Klimaat in huis`. They help a household understand where a Woning Story applies, which `Kamer` needs attention, and which bounded action is safe. They are not the climate model itself and they are not a Home Assistant dashboard.

The canonical product is:

- FamilyBoard owns `Verdieping`, `Kamer`, uploaded `Plattegrond` assets, room boundaries, and label placement.
- Home Assistant provides mappings, readings, capabilities, and heating-command execution only.
- Rooms exist even when no image, boundary, climate source, or Home Assistant mapping exists.
- A floor plan is optional. Climate remains usable through a full-quality room-list experience.
- A trusted plan enhances the climate deep dive by showing one floor at a time with quiet room identity, compact attention context, selected-room explanation, and bounded heating actions.
- The main `Woning` page remains Story-first. Floor plans belong only in the climate deep dive because they explain a selected Story rather than summarize the whole home.

This document consolidates the accepted product-model, editor, and runtime reports into the canonical design for later backend and frontend implementation specifications. It intentionally avoids implementation classes, API shapes, database schemas, migrations, tests, screenshots, binary assets, Home Assistant configuration, and implementation prompts.

## 2. Product purpose

Custom floor plans exist because families think about comfort in places: slaapkamer, woonkamer, werkkamer, badkamer. Home Assistant areas and entity names are technical provider concepts; they do not provide stable, household-owned room identity or a family-friendly spatial explanation.

The floor plan solves four product problems:

1. **Story explanation:** a Story such as “Slaapkamer vraagt aandacht” becomes easier to trust when the relevant room is visible in context.
2. **Room identity stability:** a family can rename, arrange, or archive rooms without being affected by provider-side entity or area renames.
3. **Safe action context:** heating controls are safer when shown inside selected-room detail with freshness, target, shared-zone, and capability explanations.
4. **Graceful incompleteness:** families can start with rooms and climate mappings before investing time in drawing boundaries.

The plan belongs in the climate deep dive, not on the main `Woning` page, because the main page is a Story surface. Showing a large floor plan there would make the page spatial-dashboard-first, consume too much viewport, and compete with other household Stories. In the deep dive, the plan has a focused job: explain the active Story or selected room.

The floor plan is a spatial explanation, not the primary climate model. Climate interpretation is based on room configuration, mapped sources, freshness, conflicts, and policy. Geometry only determines where that explanation is drawn.

## 3. Scope and exclusions

### In scope for this canonical design

- User-defined floors with no hard product maximum.
- Canonical FamilyBoard rooms.
- Uploaded SVG/PNG/JPG/JPEG floor-plan assets.
- Sanitized asset display and one shared sanitized coordinate basis for editor and runtime.
- One active asset per floor.
- Manually drawn room boundaries.
- Optional manual label anchors.
- First-run setup plus persistent Settings maintenance.
- Asset replacement review and rollback.
- Story-driven climate deep dive.
- Room-state explanation, Unknown handling, and full-quality room-list fallback.
- Bounded heating actions such as `Tijdelijk warmer` and `Schema hervatten` when validated.
- Backup/restore expectations for user-created spatial setup.

### Explicitly out of scope

- Production code, persistence models, APIs, migrations, tests, screenshots, binary assets, and Home Assistant configuration.
- PDF, animated formats, CAD/BIM, automatic room detection, vectorization, heat maps, furniture, and advanced predictive control.
- Runtime editing from the climate deep dive.
- Phone polygon drawing or replacement approval.
- Raw Home Assistant diagnostics in normal household runtime.
- A new Household Assessment layer.

## 4. Product principles

1. **FamilyBoard identity is canonical.** Provider data can suggest or feed a room; it cannot own, rename, or delete it.
2. **Spatial setup is additive.** A room without a boundary remains a valid room.
3. **Trust must be earned.** Uploaded assets and room overlays become runtime-trusted only after validation and explicit review where needed.
4. **Unknown is honest but calm.** Stale, missing, unavailable, conflicting, or review-needed states must prevent false reassurance without alarming language.
5. **The viewport is fixed.** Primary pages and editor workspaces reserve regions and handle overflow internally rather than allowing page scrolling.
6. **Normal rooms stay quiet.** The plan highlights attention and uncertainty, not every reading.
7. **Actions are bounded.** Heating controls appear only where capability, freshness, and safety context are available.
8. **Fallback is a product path.** A floor without a trusted plan still gets complete climate functionality.

## 5. Canonical concept model

- **Household:** the owning context for floors, rooms, floor-plan assets, overlays, mappings, climate configuration, and backup/restore packages.
- **Floor (`Verdieping`):** a user-defined, ordered grouping of rooms. The current household may have four floors, but the product has no maximum of four.
- **Room (`Kamer`):** a stable FamilyBoard place with household ownership, floor assignment, display name, room type, sort order, optional associated family member, and enabled/archive state.
- **Floor-plan Asset (`Plattegrond`):** a user-uploaded visual background for one floor. It is never the source of room identity.
- **Room Overlay (`Kamergrens`):** a valid room boundary linked to exactly one canonical room and one active or review asset context.
- **Label Anchor:** an automatic interior label position by default, optionally overridden by a manually placed anchor.
- **Climate Configuration:** room-level feature configuration such as climate relevance, comfort policy, bedtime relevance, humidity policy, source selection, and heating policy. It is not canonical Room identity.
- **Home Assistant Capability Mapping:** links from FamilyBoard rooms to provider areas, devices, entities, sensors, Evohome zones, and supported controls.
- **Overlay Trust/Review State:** product state that determines whether spatial data may be used in runtime without caveat.

## 6. Relationship diagram

```text
Household
├─ Floors (ordered, no hard maximum)
│  ├─ Rooms (ordered within floor)
│  │  ├─ Climate configuration
│  │  ├─ Home Assistant capability mappings
│  │  └─ Optional trusted room overlay for the floor's active asset
│  └─ Optional active floor-plan asset
│     ├─ Sanitized/rendered asset basis
│     ├─ Replacement drafts and retained previous versions
│     └─ Review state
└─ Backup/restore package
   ├─ Floors and rooms
   ├─ Climate configuration and mappings
   ├─ Asset sources and safe derivatives
   ├─ Overlays and label anchors
   └─ Trust/review/archive metadata
```

## 7. Ownership boundary with Home Assistant

FamilyBoard owns:

- floors;
- rooms;
- room names, types, ordering, archive state, and family-member association;
- uploaded floor-plan assets and sanitized derivatives;
- room boundaries and label anchors;
- setup progress, review state, and trusted runtime state;
- backup/restore of the above.

Home Assistant provides:

- areas, devices, entities, sensors, Evohome zones, and control capabilities;
- live and historical readings where available;
- command execution for validated controls;
- provider health and availability signals.

Home Assistant area or entity renames must never rename, delete, archive, merge, or split FamilyBoard rooms. Provider changes may make a mapping unresolved, stale, unavailable, or review-needed. Normal runtime copy must not show raw entity IDs or raw sensor names; technical diagnostics may expose them only in a deliberate diagnostic surface.

## 8. Floor and Room model

### Floor rules

A `Verdieping` has stable identity, household ownership, display name, sort order, enabled/archive state, and optional active floor-plan asset. Floors are user-defined and ordered. The product must support more or fewer than four floors.

Rooms are assigned to one floor at a time. Moving a room changes its floor assignment and invalidates any overlay that belonged to the previous floor asset unless an explicit replacement/relink review approves a new boundary.

### Room identity

Canonical Room identity includes only:

- stable identity;
- household ownership;
- floor assignment;
- display name;
- room type;
- sort order;
- optional associated family member;
- enabled/archive state.

Climate relevance, comfort policy, bedtime relevance, humidity policy, source mappings, and heating policy are feature-specific configuration attached to the room.

A room may exist without:

- an uploaded asset;
- a room overlay;
- a climate source;
- a Home Assistant mapping;
- a heating capability.

A room without a spatial boundary must have one explicit reason: not configured yet, intentionally excluded from the floor-plan display, or asset/overlay requires review.

## 9. Asset model and safety

Each floor may have zero or one active floor-plan asset. V1 supports SVG, PNG, JPG, and JPEG. PDF and animated formats are excluded.

The asset is visual background only. Room geometry is stored separately. Runtime and editor must use the exact same sanitized/rendered asset coordinate basis so a boundary drawn in setup appears in the same place at runtime.

Unsafe source SVG is never rendered directly. SVG uploads must be sanitized before preview or runtime display. The retained source and safe derivative are backup/restore concerns, but household runtime always renders the safe derivative.

Supported asset states:

- uploaded draft;
- sanitized/validated preview;
- active trusted asset;
- replacement draft;
- review-needed asset;
- retained previous asset;
- archived/removed asset;
- invalid/rejected asset.

## 10. Overlay and anchor model

A room overlay is a normalized polygon linked to exactly one canonical room and one asset context. V1 supports one active polygon per room per active floor-plan asset. Rectangles are stored as polygons. Concave polygons are supported.

V1 does not support holes, disconnected room regions, self-intersections, active overlaps, or durable unlinked polygon drafts. Uncovered regions are allowed. A durable save requires a room link.

Label placement uses automatic interior placement by default. A user may set a manual normalized anchor when automatic placement is not good enough. Manual anchors require review after asset replacement because the same visual point may no longer be meaningful.

Overlay states:

- **Draft:** work in progress that can be saved and resumed but is not runtime-trusted.
- **Trusted:** valid, linked, reviewed where necessary, and safe for runtime rendering.
- **Needs review:** valid enough to preview but not trusted after asset change or unresolved integrity issue.
- **Invalid:** cannot be trusted or activated until corrected.
- **Archived:** retained for rollback/audit but not active runtime display.

Out-of-range coordinates, invalid shapes, self-intersections, unsupported holes, unsupported disconnected regions, and active overlaps block trust. They should produce clear editor validation, not runtime false reassurance.

## 11. Lifecycle and integrity rules

### Create

Floors and rooms may be created before uploading images. A newly created room has stable identity immediately and starts with no overlay reason “not configured yet”.

### Rename

Renaming a floor or room preserves identity, climate configuration, mappings, overlays, anchors, and history. Provider names are not changed automatically.

### Reorder

Reordering floors or rooms changes display order only. It does not affect mappings, overlays, or climate configuration.

### Hide/exclude

Hiding a room from floor-plan display requires an explicit reason and produces `Bewust niet getekend` for completion language. The room remains available in climate lists and detail when climate-relevant.

### Archive

Archiving a room removes it from normal active setup and runtime surfaces while retaining identity, mappings, overlays, anchors, and history for restore. Restoring may require mapping and overlay review if providers or assets changed.

### Delete

Delete is destructive and requires confirmation. It removes active room identity and must warn about associated climate configuration, mappings, overlays, anchors, and history. Prefer archive when recovery matters.

### Move room

Moving a room to another floor preserves room identity and feature configuration. Any boundary tied to the old floor asset becomes unresolved/archived unless explicitly reviewed and redrawn for the new floor.

### Merge room

Merging requires the user to choose the surviving room identity. The non-surviving room is archived with references to the merge. Climate mappings and overlays require review because duplicate sources, shared zones, and geometry can conflict.

### Split room

Splitting creates one or more new stable room identities. Existing mappings, policies, and overlays do not automatically divide. The original room may remain, be archived, or be renamed, but the user must confirm how climate configuration and provider mappings are reassigned.

## 12. Editor information architecture

The canonical setup model is hybrid:

1. a lightweight first-run wizard for initial orientation and minimum viable setup;
2. a persistent Settings workspace for maintenance, repair, replacement review, and detailed drawing.

The editor workspace contains reserved regions:

- **Floor rail:** floor list, order, completion state, active/review asset status.
- **Room panel:** canonical rooms, climate/mapping hints, boundary status, explicit no-boundary reason, create/edit/archive actions.
- **Canvas:** sanitized floor-plan asset, overlays, drawing/editing tools, selected boundary, zoom/pan controls.
- **Validation/review panel:** blocking issues, warnings, replacement approvals, completion language, recovery actions.

The canvas is not the only representation of setup state. Every essential action must be reachable from lists and panels, not only through direct manipulation.

## 13. First-run flow

The first-run flow introduces `Plattegrond` setup without forcing all work to be completed. It should support:

1. create or confirm floors;
2. create rooms before uploading images;
3. optionally upload a floor-plan image per floor;
4. draw or defer room boundaries;
5. create a room during drawing when a missing room is discovered;
6. review basic validity;
7. leave with a clear completion state and resume path.

First-run completion may be `Bruikbaar` even when not every room is drawn. The flow should guide users to the Settings workspace for ongoing maintenance.

## 14. Maintenance flow

The Settings workspace is the canonical home for:

- adding, renaming, reordering, archiving, restoring, moving, merging, and splitting floors/rooms;
- uploading, replacing, removing, archiving, and rolling back floor-plan assets;
- drawing and editing boundaries;
- setting label anchors;
- resolving validation issues;
- reviewing replacements;
- marking rooms `Bewust niet getekend`;
- recovering drafts.

Maintenance must preserve viewport ownership. Lists and validation panels scroll internally if needed; the page itself must not become vertically scrollable during normal use.

## 15. Asset replacement flow

Every asset replacement requires explicit overlay review.

Canonical flow:

1. User starts `Plattegrond vervangen` for a floor.
2. The old active asset remains active and trusted in runtime.
3. The new upload is sanitized and validated before preview.
4. A replacement draft is created.
5. If technically compatible, previous polygons may be previewed over the new asset.
6. Compatibility never marks overlays trusted automatically.
7. Each room is reviewed individually: approve, redraw, leave for later, or mark intentionally not drawn.
8. Manual label anchors are reviewed because label meaning may change.
9. Partial approval is allowed; trusted rooms can activate while unresolved rooms remain absent from plan or shown as review-needed depending on chosen activation policy.
10. Activation requires clear validation that no active trusted overlay violates geometry rules.
11. Failed or cancelled replacement does not damage the current active setup.
12. `Vorige plattegrond terugzetten` remains available while the previous asset is retained.
13. Retention and purge policies must never silently remove the only recoverable trusted setup without explicit confirmation.

## 16. Draft, completion, and recovery states

Drafts are resumable editor work, not runtime trust. Incomplete work can be saved and resumed. Recovery should identify the floor, asset, rooms affected, last saved time, and blocking issues.

Completion terminology:

- **`Bruikbaar`:** the floor has enough trusted setup to help, or the room-list fallback is complete enough for climate use.
- **`Volledig voor deze verdieping`:** every active room intended for plan display has a trusted boundary and reviewed label state for this floor.
- **`Bewust niet getekend`:** one or more rooms are intentionally excluded from the plan display with explicit user choice.

A room without boundary must never be ambiguous. It is either not configured yet, intentionally excluded, or blocked by asset/overlay review.

## 17. Runtime information architecture

The `Klimaat in huis` deep dive hierarchy is:

1. navigation/context from `Woning`;
2. Story context;
3. floor selector;
4. trusted plan, hybrid plan/list, or room-list climate view;
5. selected-room detail;
6. diagnostics disclosure;
7. safe bounded actions.

The main `Woning` page remains Story-first. Floor plans appear only after entering the climate deep dive.

## 18. Story entry and context

Supported entries:

- **Room-specific Attention Story:** opens the relevant floor and selected room when trusted mapping exists.
- **Room-specific Unknown Story:** opens the relevant floor/room detail focused on why the room cannot be reliably assessed.
- **Broad Ready Story:** opens climate overview with the most relevant floor or household-ready summary.
- **Broad Steady Story:** opens calm overview; normal rooms remain visually quiet.
- **Neutral `Klimaat bekijken`:** opens the last-used or most relevant climate overview without forcing a problem state.

Expired Stories should not preserve stale reassurance. If the source Story is no longer current, the deep dive should retain navigation context but refresh the explanation and state.

Story context behavior:

- On entry, show enough Story context to explain why the user arrived.
- After room selection, floor change, or manual collapse, reduce to a compact Story strip.
- The pinned Story context must not consume excessive viewport height.
- Navigation should preserve Story context where possible until the user explicitly leaves or switches context.

## 19. Floor selection and spatial rendering

Runtime shows one floor at a time. Story entry selects the relevant floor and room when possible. The floor selector must expose plan trust/completion state without blocking climate use.

Rendering rules:

- Use only trusted asset and overlay data for normal spatial reassurance.
- Show a hybrid plan/list when some trusted spatial data exists and other rooms require list treatment.
- Use the exact same sanitized coordinate basis as the editor.
- Normal room polygons usually show room identity only.
- Attention, selected, Unknown, stale, and conflicting rooms may show additional compact state/value context.
- Raw technical identifiers are not shown in household runtime.

## 20. Room-state language and labels

Primary spatial state vocabulary is limited to:

- **`Comfortabel`**;
- **`Vraagt aandacht`**;
- **`Niet betrouwbaar te beoordelen`**.

Supporting explanation states include too cold, too warm, humid, too dry, warming, at target, stale, conflicting, and heating unavailable. These belong in labels, detail, or diagnostics as explanations, not as additional primary polygon categories.

Visual rules:

- `Comfortabel`: quiet fill/border; label mainly room identity.
- `Vraagt aandacht`: stronger border, icon, and optional compact value/reason.
- `Niet betrouwbaar te beoordelen`: distinct pattern/icon and calm wording; never green reassurance.
- Selected rooms use a visible selection treatment independent of state.
- Color is never the only signal; border, icon, pattern, text, and focus state must reinforce meaning.

## 21. Room detail and heating controls

Selected-room detail explains:

- household meaning of the room;
- current temperature when reliable enough;
- humidity only when relevant;
- comfort interpretation;
- Evohome/heating state when mapped;
- target temperature;
- freshness;
- source conflicts;
- shared-zone implications;
- setup correction links;
- safe actions.

Bounded controls appear only in selected-room detail and only when validated. V1 prioritizes `Tijdelijk warmer` and `Schema hervatten`. `Tijdelijk koeler` is not forced into V1 solely for symmetry.

Pending, success, and failure behavior must be explicit. A pending command should show that the action was sent or is in progress without pretending the room has already changed. Failure should explain the next safe step and avoid repeated blind retries.

Shared-zone explanation is required when one action affects more than the selected room.

## 22. Duplicate sources and shared zones

Runtime treatment:

- **Comfort temperature:** choose the configured comfort source for room interpretation.
- **Heating-control temperature:** may come from a different control/zone source and must be explained in room detail if it differs materially.
- **Close readings:** choose the configured primary source and avoid noisy duplicate display.
- **Conflicting readings:** mark the room `Niet betrouwbaar te beoordelen` or `Vraagt aandacht` depending on severity; explain the conflict in detail.
- **Stale source:** blocks reliable reassurance and explains freshness.
- **Missing source:** room remains present; climate state is Unknown or setup-needed.
- **Shared Evohome zones:** actions must disclose affected rooms and avoid implying room-isolated control.

## 23. Unknown, stale, conflicting, and review states

Unknown must prevent false reassurance while remaining calm.

Behavior by condition:

- **Sensor stale:** no comfortable reassurance; show freshness issue and last-known context only when safe.
- **Sensor unavailable:** room remains visible; state becomes `Niet betrouwbaar te beoordelen` with provider/setup explanation.
- **Home Assistant unavailable:** climate overview falls back to calm provider-unavailable messaging and avoids room-level false certainty.
- **Mapping missing:** room detail offers setup correction; no raw entity IDs in normal runtime.
- **Sources conflict:** compact conflict indicator plus room-detail explanation.
- **Asset missing:** use room-list climate view.
- **Overlay needs review:** trusted plan is not used for that room; use list/detail and setup callout.
- **Floor plan incomplete:** use hybrid or list fallback without treating incompleteness as an error.
- **Room intentionally not drawn:** include the room in list/detail as normal and explain only where setup status is relevant.

## 24. Fallback hierarchy

The floor plan is an optional enhancement and cannot block climate use.

Fallback order:

1. Trusted plan.
2. Hybrid plan and room list.
3. Full-quality room-list climate view.
4. Story-specific room detail.
5. Generic climate overview.
6. Setup callout.

A floor without a trusted plan must still receive a complete room-list climate experience with the same interpretation, Unknown handling, and bounded controls where validated.

## 25. Responsive and viewport behavior

Desktop uses floor selector, plan/list region, and selected-room side panel inside a fixed viewport. Tablet may use adaptive side or bottom sheet behavior. Phone uses a list-first climate overview and full-screen room detail; phone does not support polygon drawing or replacement approval. Short viewports compact Story context, reduce density, and use internal scrolling within reserved panels before allowing page overflow.

Primary product pages must not use vertical page scrolling in normal use. Cards, lists, and details must not push other regions off-screen. The deep dive and Settings editor must treat the viewport as the boundary.

## 26. Accessibility

Canonical requirements:

- synchronized room list for every plan;
- keyboard navigation across floor selector, room list, plan rooms, detail, and actions;
- screen-reader floor summaries including completion/trust status;
- visible focus on rooms, controls, list items, and dialogs;
- zoom controls that do not require precision gestures;
- large text behavior that preserves access through internal scrolling/sheets rather than page overflow;
- reduced motion support for transitions and Story collapse;
- color-independent states using icon, pattern, border, text, and accessible names;
- accessible heating actions with confirmation/context where needed;
- focus restoration after dialogs, sheets, replacement review, and command completion.

The accessible room list is not a fallback-only artifact; it is a first-class synchronized representation.

## 27. Backup and restore

Backup/restore must include:

- floors;
- rooms;
- climate configuration;
- Home Assistant mappings and capability metadata where portable;
- asset source and safe derivatives when permitted;
- overlays;
- label anchors;
- review, trust, invalid, archived, and replacement states;
- retained previous versions needed for rollback.

Missing assets during restore must not destroy room or overlay metadata. If an asset cannot be restored, affected overlays become review-needed/unusable for runtime but remain available for repair. Restore must not allow provider-side differences to rename or delete FamilyBoard rooms.

## 28. V1 scope

V1 includes:

- user-defined floors with no hard maximum;
- canonical FamilyBoard rooms;
- SVG/PNG/JPG/JPEG uploads;
- sanitized assets;
- one active asset per floor;
- normalized room polygons against the sanitized/rendered asset basis;
- one polygon per room;
- concave polygons;
- optional manual label anchor;
- hybrid setup/editor with first-run and Settings maintenance;
- incomplete draft save and recovery;
- safe asset replacement review;
- Story-driven `Klimaat in huis` deep dive;
- one floor at a time;
- selective labels and values;
- room-list fallback as full-quality product experience;
- Unknown/stale/conflicting states;
- bounded heating actions when validated, especially `Tijdelijk warmer` and `Schema hervatten`;
- desktop/tablet runtime;
- phone list-first fallback and full-screen room detail;
- backup/restore inclusion for user-created assets and geometry.

## 29. Deferred capabilities

Deferred beyond V1:

- automatic room detection;
- vectorization;
- PDF import;
- animated formats;
- CAD/BIM import;
- furniture modeling;
- wall/grid snapping;
- holes in room boundaries;
- disconnected regions for one room;
- multi-polygon rooms;
- room comparison views;
- full climate history;
- heat maps;
- multi-floor simultaneous display;
- advanced predictive control;
- weekly heating schedules;
- arbitrary Home Assistant control actions;
- raw HA diagnostics in household runtime;
- runtime editing from climate view;
- phone polygon editing;
- phone replacement approval.

## 30. Product acceptance criteria

- Room identity remains stable across provider renames, room renames, floor reordering, asset replacement, and overlay edits.
- No product path encodes a maximum of four floors.
- FamilyBoard owns floors and rooms; Home Assistant remains mapping/data/control provider.
- Unsafe source SVG is never rendered directly.
- Editor and runtime use the same sanitized coordinate basis.
- Invalid polygons, self-intersections, unsupported holes/disconnected regions, out-of-range geometry, and active overlaps cannot become trusted.
- Every active overlay links to exactly one canonical room.
- Durable unlinked polygons are excluded from V1.
- Every asset replacement requires review; compatibility allows preview/reuse but never automatic trust.
- Failed/cancelled replacement leaves the previous active setup intact.
- Incomplete setup can be saved, resumed, and explained with `Bruikbaar`, `Volledig voor deze verdieping`, or `Bewust niet getekend`.
- A room without a boundary has an explicit reason.
- Story entry selects relevant floor/room when possible and degrades gracefully when not.
- The main `Woning` page remains Story-first; floor plans remain climate deep-dive only.
- Unknown/stale/conflicting states block false reassurance.
- A floor without a trusted plan receives a full-quality room-list climate experience.
- Desktop, tablet, phone, and short-viewport experiences preserve reserved layout regions without normal page scrolling.
- Room detail explains temperature, humidity when relevant, comfort, target, freshness, conflicts, shared zones, setup corrections, and bounded actions.
- Heating controls are shown only when validated and bounded.
- Accessibility requirements are met through keyboard, screen-reader summaries, focus, zoom, large text, reduced motion, and color-independent state cues.
- Backup/restore includes user-created assets, geometry, anchors, review/trust state, floors, rooms, climate configuration, and mappings.

## 31. Risks and remaining open decisions

Only the following remain genuinely open for future implementation specification:

- Exact retention duration and storage limits for previous assets and rollback versions.
- Exact thresholds for stale, conflicting, too humid, too dry, too warm, and too cold interpretations.
- Exact minimum capability contract for enabling `Tijdelijk warmer` and `Schema hervatten` per provider/zone.
- Exact activation policy for partially approved replacements: whether to activate trusted rooms immediately or require floor-level confirmation once a subset is approved.
- Exact performance limits for image size, polygon vertex count, and number of rooms per floor.

These are implementation/product-operations details and do not change the canonical ownership, lifecycle, trust, fallback, or runtime direction.

## 32. Recommended implementation slicing direction

Future implementation should proceed in logical slices without crossing boundaries unnecessarily:

1. **Canonical floor/room foundation:** persistence and APIs for FamilyBoard-owned floors and rooms only, with backup/restore shape considered but no floor-plan rendering.
2. **Climate configuration and mapping boundary:** attach room-level climate configuration and Home Assistant mapping metadata without making HA canonical.
3. **Asset ingestion and safety:** upload, sanitize, validate, retain safe derivatives, and support restore/rollback metadata.
4. **Overlay editor foundation:** drawing, validation, linked-room overlays, anchors, draft/recovery states, and completion language.
5. **Asset replacement review:** replacement drafts, safe preview, room-by-room approval, partial approval policy, rollback.
6. **Runtime room-list climate deep dive:** full-quality fallback first, including Story entry, Unknown behavior, selected-room detail, and bounded controls.
7. **Trusted plan runtime enhancement:** one-floor spatial rendering, synchronized room list, labels, density rules, and responsive desktop/tablet behavior.
8. **Phone runtime refinement:** list-first overview and full-screen room detail, explicitly excluding polygon editing.
9. **Accessibility and viewport hardening:** keyboard, screen-reader summaries, focus restoration, reduced motion, large text, and no-page-scroll validation across primary pages.
10. **Backup/restore completion:** include assets, geometry, anchors, trust/review states, previous versions, climate configuration, and mappings.
