# Woning Climate Floor Plans — Canonical Product Design

## 1. Executive summary

FamilyBoard floor plans are an optional spatial explanation layer for `Klimaat in huis`. They help a household understand where a Woning Story applies, which `Kamer` needs attention, why a room cannot be assessed, and which bounded action is safe. They are not the climate model itself and they are not a Home Assistant dashboard.

The canonical product is:

- FamilyBoard owns `Verdieping`, `Kamer`, uploaded `Plattegrond` assets, room overlays, label anchors, setup lifecycle, and backup/restore of those concepts.
- Home Assistant supplies mappings, readings, capabilities, provider health, and heating-command execution only.
- Rooms exist even when no image, overlay, climate source, or Home Assistant mapping exists.
- A floor plan is optional. Climate remains usable through a full-quality room-list experience.
- A trusted plan enhances the climate deep dive by showing one floor at a time with quiet room identity, compact attention context, selected-room explanation, and bounded heating actions.
- The main `Woning` page remains Story-first. Floor plans belong only in the climate deep dive because they explain a selected Story or selected room rather than summarize the whole home.

This document is the single canonical product-design reference for later backend and frontend implementation specifications. It intentionally avoids implementation classes, API shapes, database schemas, migrations, tests, screenshots, binary assets, Home Assistant configuration, and implementation prompts.

## 2. Product purpose

Custom floor plans exist because families think about comfort in places: slaapkamer, woonkamer, werkkamer, badkamer. Home Assistant areas and entity names are technical provider concepts; they do not provide stable, household-owned room identity or a family-friendly spatial explanation.

The floor plan solves four product problems:

1. **Story explanation:** a Story such as “Slaapkamer vraagt aandacht” becomes easier to trust when the relevant room is visible in context.
2. **Room identity stability:** a family can rename, arrange, or archive rooms without being affected by provider-side entity or area renames.
3. **Safe action context:** heating controls are safer when shown inside selected-room detail with freshness, target, shared-zone, and capability explanations.
4. **Graceful incompleteness:** families can start with rooms and climate mappings before investing time in drawing overlays.

The plan belongs in the climate deep dive, not on the main `Woning` page, because the main page is a Story surface. Showing a large floor plan there would make the page spatial-dashboard-first, consume too much viewport, and compete with other household Stories. In the deep dive, the plan has a focused job: explain the active Story or selected room.

The floor plan is a spatial explanation, not the primary climate model. Climate interpretation is based on room configuration, mapped sources, freshness, conflicts, and policy. Geometry only determines where that explanation is drawn.

## 3. Scope and exclusions

### In scope for this canonical design

- User-defined floors with no hard product maximum.
- Canonical FamilyBoard rooms.
- Uploaded SVG/PNG/JPG/JPEG floor-plan assets.
- Sanitized asset display and one shared sanitized coordinate basis for editor and runtime.
- One active asset per floor.
- Manually drawn room overlays.
- Optional manual label anchors.
- First-run setup plus persistent Settings maintenance.
- Asset replacement review, floor-level activation, and rollback.
- Story-driven climate deep dive.
- Room-state explanation, Unknown handling, and full-quality room-list fallback.
- Bounded heating actions in selected-room detail when validated.
- Incremental backup/restore coverage for every implementation slice that introduces user-created data or lifecycle state.

### Explicitly out of scope

- Production code, persistence models, APIs, migrations, tests, screenshots, binary assets, and Home Assistant configuration.
- PDF, animated formats, CAD/BIM, automatic room detection, vectorization, heat maps, furniture, and advanced predictive control.
- Runtime editing from the climate deep dive.
- Phone polygon drawing or replacement approval.
- Durable unlinked polygon drafts.
- Raw Home Assistant diagnostics in normal household runtime.
- A new Household Assessment layer.

## 4. Product principles

1. **FamilyBoard identity is canonical.** Provider data can suggest or feed a room; it cannot own, rename, or delete it.
2. **Spatial setup is additive.** A room without an overlay remains a valid room.
3. **Trust must be earned.** Uploaded assets and room overlays become runtime-trusted only after validation and explicit review where required.
4. **Unknown is honest but calm.** Stale, missing, unavailable, conflicting, or review-needed states must prevent false reassurance without alarming language.
5. **The viewport is fixed.** Primary pages and editor workspaces reserve regions and handle overflow internally rather than allowing page scrolling.
6. **Normal rooms stay quiet.** The plan highlights attention and uncertainty, not every reading.
7. **Actions are bounded.** Heating controls appear only where capability, freshness, and safety context are available.
8. **Fallback is a product path.** A floor without a trusted plan still gets complete climate functionality.
9. **Portability is continuous.** Backup/restore responsibility is added with each slice that introduces user-created concepts, not deferred until the end.

## 5. Canonical concept model

- **Household:** the owning context for floors, rooms, floor-plan assets, overlays, label anchors, mappings, climate configuration, lifecycle state, and backup/restore packages.
- **Floor (`Verdieping`):** a user-defined, ordered grouping of rooms. The product has no hard maximum number of floors.
- **Room (`Kamer`):** a stable FamilyBoard place with household ownership, floor assignment, display name, room type, sort order, optional associated family member, and enabled/archive state.
- **Floor-plan Asset (`Plattegrond`):** a user-uploaded visual background for one floor. It is never the source of room identity.
- **Room Overlay (`Kamergrens`):** a structurally valid polygon linked to exactly one canonical room and one asset context.
- **Label Anchor:** an automatic interior label position by default, optionally overridden by a manually placed anchor.
- **Climate Configuration:** feature-specific room configuration such as source roles, thresholds, policies, Story relevance, and plan-display inclusion. It is not canonical Room identity.
- **Home Assistant Mapping:** feature configuration linking FamilyBoard rooms to provider areas, devices, entities, sensors, Evohome zones, capabilities, and diagnostics.
- **Trust State:** canonical product state that determines whether an asset or overlay may be used for runtime spatial rendering.

## 6. Relationship diagram

```text
Household
├─ Floors (ordered, no hard maximum)
│  ├─ Rooms (ordered within floor)
│  │  ├─ Climate configuration
│  │  ├─ Home Assistant mappings and capability confidence
│  │  └─ Optional trusted room overlay for the floor's active asset
│  └─ Optional active floor-plan asset
│     ├─ Protected source asset, when retained
│     ├─ Sanitized derivative and coordinate basis
│     ├─ Replacement drafts and retained rollback versions
│     └─ Asset trust state
└─ Backup/restore package
   ├─ Floors and rooms
   ├─ Climate configuration and mappings
   ├─ Asset sources, safe derivatives, hashes, and missing-asset recovery metadata
   ├─ Overlays, label anchors, drafts, and trust states
   └─ Replacement, rollback, archived, and invalid metadata
```

## 7. Ownership boundary with Home Assistant

FamilyBoard owns:

- floors;
- rooms;
- room names, types, ordering, archive state, and family-member association;
- uploaded floor-plan assets and sanitized derivatives;
- room overlays and label anchors;
- setup progress, review state, and trusted runtime state;
- backup/restore of the above.

Home Assistant provides:

- areas, devices, entities, sensors, Evohome zones, and control capabilities;
- live and historical readings where available;
- command execution for validated controls;
- provider health and availability signals.

Home Assistant area or entity renames must never rename, delete, archive, merge, or split FamilyBoard rooms. Provider changes may make a mapping unresolved, stale, unavailable, or `Controle nodig`. Normal runtime copy must not show raw entity IDs or raw sensor names; technical diagnostics may expose them only in a deliberate diagnostic surface.

Mapping invariants:

- A mapping may become unavailable without changing Room identity.
- HA area/entity renames never update FamilyBoard names automatically.
- Direct entity mappings are allowed when HA areas are too coarse.
- One FamilyBoard room may consume multiple technical sources.
- Multiple FamilyBoard rooms may share one Evohome zone only with reduced precision and explicit runtime explanation.
- Mapping health affects capability confidence, not room existence.
- Mapping removal never deletes a floor, room, asset, overlay, or label anchor.
- Provider-specific identifiers belong only in configuration and diagnostics.

## 8. Floor and Room model

### Floor rules

A `Verdieping` has stable identity, household ownership, display name, sort order, enabled/archive state, and optional active floor-plan asset. Floors are user-defined and ordered. The product must support more or fewer than four floors.

Rooms are assigned to one floor at a time. Moving a room changes its floor assignment and archives or invalidates any overlay tied to the previous floor asset unless an explicit review creates a trusted overlay for the new floor asset.

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

The following are not canonical Room identity and belong in climate configuration, floor-plan configuration, or another feature-specific configuration:

- comfort source;
- heating-control source;
- humidity source;
- comfort thresholds;
- bedtime relevance;
- target ranges;
- heating policy;
- plan-display inclusion;
- Story relevance.

`Bewust niet getekend` is floor-plan configuration for a room on a floor. It is not canonical Room identity.

A room may exist without:

- an uploaded asset;
- a room overlay;
- a climate source;
- a Home Assistant mapping;
- a heating capability.

A room without a trusted overlay has one explicit floor-plan status: not configured yet, `Bewust niet getekend`, blocked and represented through fallback, or `Controle nodig`.

## 9. Canonical trust and completion vocabulary

### Asset state

- **Draft:** uploaded or edited asset work that is not yet validated for use.
- **Validated:** the safe derivative exists, the coordinate basis is known, and structural asset checks pass.
- **Active:** the floor's current runtime asset. Runtime may render it only with trusted overlays.
- **Replaced:** a previous active asset retained for rollback after a replacement is activated.
- **Archived:** retained for audit, recovery, or history but not active runtime display.
- **Invalid:** rejected or blocked because required asset checks fail.
- **Missing:** metadata remains but source or safe derivative is unavailable, commonly after restore or storage failure.

### Overlay state

- **Draft:** saved work in progress that can be resumed but is not runtime-trusted.
- **Valid:** geometry passes structural validation, but the overlay is not yet permitted for runtime spatial rendering.
- **Needs review:** structurally valid enough to inspect, but cannot be trusted until a user resolves a review requirement.
- **Trusted:** valid, linked to exactly one canonical room, reviewed where required, compatible with the active asset, and permitted for runtime spatial rendering.
- **Invalid:** blocked because geometry, linkage, asset compatibility, or validation requirements fail.
- **Archived:** retained for rollback, audit, or history but not active runtime display.

### Term distinctions

- **Valid** means geometry or asset structure passes validation. It does not imply runtime trust.
- **Trusted** means valid, linked, reviewed where required, and allowed for runtime spatial rendering.
- **Active** applies to an asset, not to arbitrary overlay validity.
- **`Bruikbaar`** and **`Volledig voor deze verdieping`** are floor setup states, not asset or overlay states.
- Runtime spatial rendering must use only the active asset and trusted overlays.

### Completion terminology

- **`Bruikbaar`:** the floor can provide a useful climate experience, spatially or through fallback. A room-list-only floor can be `Bruikbaar`; a plan is not required.
- **`Volledig voor deze verdieping`:** every enabled room intended for spatial display has a trusted overlay, and every non-spatial room is explicitly classified.
- **`Bewust niet getekend`:** a deliberate room-level spatial exclusion in floor-plan configuration.
- **`Controle nodig`:** one or more assets, overlays, anchors, or mappings require review before trust or confidence can be granted.
- **`Geblokkeerd`:** a required setup dependency prevents a reliable climate experience.

A room without a trusted overlay must never be ambiguous. It is not configured yet, `Bewust niet getekend`, blocked and represented through fallback, or `Controle nodig`.

## 10. Independent readiness dimensions

Spatial completeness and climate readiness are independent. Later specifications must not collapse them into one status.

| Dimension | What it measures | Can be complete while | Does not imply |
| --- | --- | --- | --- |
| Room model completeness | Floors and canonical rooms have stable household meaning and ordering. | No asset, overlay, mapping, or climate source exists. | Spatial completeness, climate data, or heating control. |
| Floor-plan spatial completeness | Intended spatial rooms have trusted overlays or explicit non-spatial classification. | A room has no climate source or mapping. | Trusted sensor data or climate readiness. |
| Climate capability readiness | Room readings, freshness, mappings, and confidence are sufficient for interpretation. | No floor-plan asset or overlay exists. | Spatial trust or heating-control readiness. |
| Heating-control readiness | Validated semantic controls, bounded range/duration, fresh enough state, and provider capability exist. | The room has no overlay or the floor is list-only. | A control should appear on the floor plan. |
| Runtime trust | Runtime may present spatial reassurance from the active asset and trusted overlays only. | Sensor data is stale, missing, or conflicting. | Trusted climate readings or provider health. |

Examples:

- A room can be spatially complete but have no climate source.
- A room can have complete climate data but no floor-plan overlay.
- A floor can be climate-usable without any uploaded plan.
- A trusted overlay does not imply trusted sensor data.
- A working sensor mapping does not imply the overlay is trusted.

## 11. Asset model and safety

Each floor may have zero or one active floor-plan asset. V1 supports SVG, PNG, JPG, and JPEG. PDF and animated formats are excluded.

The asset is visual background only. Room geometry is stored separately. Runtime and editor must use the exact same sanitized asset coordinate basis so a boundary drawn in setup appears in the same place at runtime.

Safe SVG handling is mandatory:

- Raw uploaded SVG must never be mounted into the runtime DOM before sanitization.
- External references, scripts, event handlers, foreign content, unsafe links, and active behavior are removed or rejected.
- The editor renders the same safe derivative that runtime will render.
- If sanitization materially changes the drawing, user review is required before activation.
- The original upload may be retained as protected source data but is never used directly in household runtime.

Asset retention and purge safety:

- The currently active asset cannot be purged while it is the background for the trusted spatial setup.
- A retained rollback asset cannot be silently purged while a replacement remains within its rollback window.
- Purge requires explicit confirmation when it removes the last recoverable trusted spatial setup.
- Backup status should be considered before destructive purge.
- Removing an asset must never silently delete floors, rooms, climate mappings, overlays, label anchors, or overlay metadata.
- Missing assets after restore degrade to fallback, not data loss.

## 12. Overlay and anchor model

A room overlay is a normalized polygon linked to exactly one canonical room and one asset context. V1 supports one trusted polygon per room for the active floor-plan asset. Rectangles are ordinary polygons. Concave polygons are valid.

Geometry invariants:

- Polygons are implicitly closed.
- At least three unique vertices are required.
- Polygon area must be non-zero.
- Self-intersection is invalid.
- Active overlap between trusted overlays is invalid.
- All points must be within normalized bounds.
- One trusted overlay per room is allowed for the active asset.
- One overlay links to one room.
- One room cannot have multiple trusted polygons in V1.
- Uncovered areas are valid.
- Holes and disconnected regions are deferred beyond V1.
- Durable unlinked polygons are excluded from V1.

Validation blockers prevent an overlay from becoming trusted. Blockers include out-of-range coordinates, fewer than three unique vertices, zero area, self-intersection, unsupported holes, unsupported disconnected regions, missing room link, active overlap, and incompatible asset context.

Validation warnings do not grant trust and do not necessarily block trust. Warnings identify review concerns such as unusual shape, very small area, label placement risk, potential source disagreement, or replacement ambiguity. A warning can require `Controle nodig` when product safety depends on user review.

Label placement uses automatic interior placement by default. A user may set a manual normalized anchor when automatic placement is not good enough. Manual anchors require review after asset replacement because the same visual point may no longer be meaningful.

## 13. Lifecycle and integrity rules

### Create

Floors and rooms may be created before uploading images. A newly created room has stable identity immediately and starts with floor-plan status “not configured yet”.

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

Moving a room to another floor preserves room identity and feature configuration. Any overlay tied to the old floor asset becomes archived or invalid for runtime unless explicitly redrawn and trusted for the new floor asset.

### Merge room

Merging requires the user to choose the surviving room identity. The non-surviving room is archived with references to the merge. Climate mappings and overlays require review because duplicate sources, shared zones, and geometry can conflict.

### Split room

Splitting creates one or more new stable room identities. Existing mappings, policies, and overlays do not automatically divide. The original room may remain, be archived, or be renamed, but the user must confirm how climate configuration and provider mappings are reassigned.

## 14. Editor information architecture

The canonical setup model is hybrid:

1. a lightweight first-run wizard for initial orientation and minimum viable setup;
2. a persistent Settings workspace for maintenance, repair, replacement review, and detailed drawing.

The editor workspace contains reserved regions:

- **Floor rail:** floor list, order, completion state, active asset state, and review status.
- **Room panel:** canonical rooms, climate/mapping hints, overlay state, explicit no-overlay reason, create/edit/archive actions.
- **Canvas:** sanitized floor-plan asset, overlays, drawing/editing tools, selected boundary, zoom/pan controls.
- **Validation/review panel:** blocking issues, warnings, replacement approvals, completion language, recovery actions.

The canvas is not the only representation of setup state. Every essential action must be reachable from lists and panels, not only through direct manipulation.

## 15. First-run flow

The first-run flow introduces `Plattegrond` setup without forcing all work to be completed. It should support:

1. create or confirm floors;
2. create rooms before uploading images;
3. optionally upload a floor-plan image per floor;
4. draw or defer room overlays;
5. create a room during drawing when a missing room is discovered;
6. review basic validity;
7. leave with a clear completion state and resume path.

First-run completion may be `Bruikbaar` even when no room is drawn if the room-list climate experience is useful. The flow should guide users to the Settings workspace for ongoing maintenance.

## 16. Maintenance flow

The Settings workspace is the canonical home for:

- adding, renaming, reordering, archiving, restoring, moving, merging, and splitting floors/rooms;
- uploading, replacing, removing, archiving, and rolling back floor-plan assets;
- drawing and editing overlays;
- setting label anchors;
- resolving validation issues;
- reviewing replacements;
- marking rooms `Bewust niet getekend`;
- recovering drafts.

Maintenance must preserve viewport ownership. Lists and validation panels scroll internally if needed; the page itself must not become vertically scrollable during normal use.

## 17. Asset replacement flow

Every asset replacement requires explicit floor-level activation after overlay review.

Canonical flow:

1. User starts `Plattegrond vervangen` for a floor.
2. The old active asset and its trusted overlays remain active and recoverable for runtime and rollback.
3. The new upload is sanitized and validated before preview.
4. A replacement draft is created.
5. If technically compatible, previous polygons may be previewed over the new asset.
6. Compatibility never creates automatic trust.
7. Each room is reviewed individually: approve, redraw, leave not configured yet, mark `Bewust niet getekend`, or mark blocked and represented through fallback.
8. Manual label anchors are reviewed because label meaning may change.
9. Partial room approval is allowed before final activation, but approved overlays remain part of the replacement draft until floor-level activation.
10. Final activation requires a clear summary of which rooms will appear spatially and which will use fallback.
11. Final activation may proceed with a subset of rooms approved only when every unresolved room is explicitly classified as not configured yet, `Bewust niet getekend`, or blocked and represented through fallback.
12. Only reviewed and approved overlays may become trusted on the replacement asset.
13. Unapproved, invalid, or unresolved room overlays must not render spatially as normal.
14. No room may visually appear mapped to the new floor plan using old unreviewed geometry.
15. Activation requires clear validation that no trusted overlay violates geometry rules.
16. Failed or cancelled replacement does not damage the current active setup.
17. `Vorige plattegrond terugzetten` remains available while the previous asset is retained.
18. Rollback restores the previous active asset and its previous trusted overlays as the trusted spatial setup.

Rooms without an approved overlay remain fully available through the room-list fallback. The replacement asset may become active only after explicit floor-level confirmation.

## 18. Draft, completion, and recovery states

Drafts are resumable editor work, not runtime trust. Incomplete work can be saved and resumed. Recovery should identify the floor, asset, rooms affected, last saved time, trust states, and blocking issues.

Completion examples:

- A floor with no uploaded asset but configured room-list climate data can be `Bruikbaar`.
- A floor with an active asset and some trusted overlays can be `Bruikbaar` through a hybrid plan/list experience.
- A floor is `Volledig voor deze verdieping` only when every enabled room intended for spatial display has a trusted overlay and every non-spatial room is explicitly classified.
- A floor is `Controle nodig` when replacement review, label review, asset review, overlay review, or mapping review is required before trust or capability confidence.
- A floor is `Geblokkeerd` when a required setup dependency prevents reliable climate use, not merely because a floor plan is absent.

## 19. Runtime information architecture

The `Klimaat in huis` deep dive hierarchy is:

1. navigation/context from `Woning`;
2. Story context;
3. floor selector;
4. trusted plan, hybrid plan/list, or room-list climate view;
5. selected-room detail;
6. diagnostics disclosure;
7. safe bounded actions.

The main `Woning` page remains Story-first. Floor plans appear only after entering the climate deep dive.

## 20. Story entry and context

Supported entries:

- **Room-specific Attention Story:** opens the relevant floor and selected room when trusted mapping exists.
- **Room-specific Unknown Story:** opens the relevant floor/room detail focused on why the room cannot be reliably assessed.
- **Broad Ready Story:** opens climate overview with the most relevant floor or household-ready summary.
- **Broad Steady Story:** opens calm overview; normal rooms remain visually quiet.
- **Neutral `Klimaat bekijken`:** opens the last-used or most relevant climate overview without forcing a problem state.

Story context behavior is fixed:

- Story context is full on entry.
- It collapses to a compact strip after room interaction, floor switching, or explicit collapse.
- It remains recoverable throughout the session.
- Expired Stories update without automatically changing selected floor or room.
- Live Story changes must not steal focus.
- Neutral `Klimaat bekijken` entry works without an active Story.
- Floor-plan runtime remains useful without Story context.

## 21. Floor selection and spatial rendering

Runtime shows one floor at a time. Story entry selects the relevant floor and room when possible. The floor selector must expose plan trust/completion state without blocking climate use.

Rendering rules:

- Runtime renders only the active asset and trusted overlays.
- Unapproved, invalid, archived, missing, draft, valid-only, or needs-review overlays are never rendered as normal spatial reassurance.
- Use a hybrid plan/list when some trusted spatial data exists and other rooms require list treatment.
- Use the exact same sanitized coordinate basis as the editor.
- Normal room polygons show room identity only.
- Attention, selected, Unknown, stale, and conflicting rooms may show additional compact state/value context under the density rules.
- Raw technical identifiers are not shown in household runtime.

## 22. Runtime density rules

### Normal room

- Show room name only.
- Use a quiet visual state.
- Do not show a permanent temperature value.

### Attention or Unknown room

- Show room name.
- Show a compact reason or value only when it explains the Story.
- Use state icon, border, or pattern; color alone is insufficient.

### Selected room

- Show room name.
- Show current trusted temperature when available.
- Show concise state.
- Put full details in the side panel.

### Room detail

May show:

- comfort temperature;
- humidity when relevant;
- heating-control temperature;
- target;
- freshness;
- source disagreement;
- shared-zone limitation;
- bounded actions.

### Diagnostics only

- exact timestamps;
- source identity;
- entity IDs;
- provider health;
- control failure details.

Raw provider information must not leak into normal runtime.

## 23. Room-state language and labels

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

## 24. Room detail and heating controls

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

Required V1 controls:

- `Tijdelijk warmer`;
- `Schema hervatten`.

Optional only when provider capability is validated:

- `Tijdelijk koeler`.

Controls require:

- fresh enough current state;
- validated semantic control;
- bounded temperature range;
- bounded duration;
- clear pending state;
- success confirmation;
- safe failure behavior;
- shared-zone warning when relevant.

No control appears directly on the floor plan. Pending, success, and failure behavior must be explicit. A pending command should show that the action was sent or is in progress without pretending the room has already changed. Failure should explain the next safe step and avoid repeated blind retries.

Shared-zone explanation is required when one action affects more than the selected room.

## 25. Duplicate sources and shared zones

Runtime treatment:

- **Comfort temperature:** choose the configured comfort source for room interpretation.
- **Heating-control temperature:** may come from a different control/zone source and must be explained in room detail if it differs materially.
- **Close readings:** choose the configured primary source and avoid noisy duplicate display.
- **Conflicting readings:** mark the room `Niet betrouwbaar te beoordelen` or `Vraagt aandacht` depending on severity; explain the conflict in detail.
- **Stale source:** blocks reliable reassurance and explains freshness.
- **Missing source:** room remains present; climate state is Unknown or setup-needed.
- **Shared Evohome zones:** actions must disclose affected rooms and avoid implying room-isolated control.

## 26. Unknown, stale, conflicting, and review states

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

## 27. Fallback hierarchy and quality

The floor plan is an optional enhancement and cannot block climate use.

Fallback order:

1. Trusted plan.
2. Hybrid plan and room list.
3. Full-quality room-list climate view.
4. Story-specific room detail.
5. Generic climate overview.
6. Setup callout.

The room-list climate view must support the same core capabilities as the spatial view:

- primary room state;
- confidence;
- relevant temperature/humidity;
- Story routing;
- room detail;
- bounded controls;
- Unknown handling;
- setup correction links.

The floor plan may improve spatial comprehension but must not unlock exclusive climate functionality. A floor without a trusted plan must still receive a complete room-list climate experience with the same interpretation, Unknown handling, and bounded controls where validated.

## 28. Responsive and viewport behavior

Desktop uses floor selector, plan/list region, and selected-room side panel inside a fixed viewport. Tablet may use adaptive side or bottom sheet behavior. Phone uses a list-first climate overview and full-screen room detail; phone does not support polygon drawing or replacement approval. Short viewports compact Story context, reduce density, and use internal scrolling within reserved panels before allowing page overflow.

Primary product pages must not use vertical page scrolling in normal use. Cards, lists, and details must not push other regions off-screen. The deep dive and Settings editor must treat the viewport as the boundary.

## 29. Accessibility

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

## 30. Backup and restore

Backup/restore coverage is incremental. Each implementation slice must export, restore, validate, and recover the concepts it introduces.

Slice responsibilities:

- Floor/Room foundation includes floor and room export/restore.
- Climate configuration includes mappings, source-role configuration, capability metadata where portable, and mapping-health recovery.
- Asset ingestion includes source asset when retained, sanitized derivative, hashes, coordinate basis, asset state, and missing-asset recovery.
- Overlay editor includes polygons, anchors, trust states, validation state, and drafts.
- Replacement review includes replacement drafts, retained rollback versions, activation state, and rollback metadata.
- Runtime controls include portable control configuration and provider capability diagnostics where appropriate.

End-to-end final backup work is an audit, not the first portability implementation. It verifies portability compatibility, corruption recovery, missing-file recovery, pre-restore snapshot creation, restore rollback, and cross-slice consistency.

Backup/restore must include:

- floors;
- rooms;
- climate configuration;
- Home Assistant mappings and capability metadata where portable;
- asset source and safe derivatives when permitted;
- hashes and sanitized coordinate basis;
- overlays;
- label anchors;
- review, trust, invalid, archived, missing, and replacement states;
- retained previous versions needed for rollback.

Missing assets during restore must not destroy room or overlay metadata. If an asset cannot be restored, affected overlays become unavailable for runtime spatial rendering and the floor degrades to fallback. Restore must not allow provider-side differences to rename or delete FamilyBoard rooms.

## 31. V1 scope

V1 includes:

- user-defined floors with no hard maximum;
- canonical FamilyBoard rooms;
- SVG/PNG/JPG/JPEG uploads;
- sanitized assets with protected source handling;
- one active asset per floor;
- normalized room polygons against the sanitized asset coordinate basis;
- one trusted polygon per room on the active asset;
- concave polygons and rectangles as ordinary polygons;
- optional manual label anchor;
- hybrid setup/editor with first-run and Settings maintenance;
- incomplete draft save and recovery;
- safe asset replacement review, floor-level activation, and rollback;
- Story-driven `Klimaat in huis` deep dive;
- one floor at a time;
- selective labels and values under density rules;
- room-list fallback as full-quality product experience;
- Unknown/stale/conflicting/review-needed states;
- required bounded heating actions `Tijdelijk warmer` and `Schema hervatten` when validated;
- optional `Tijdelijk koeler` only when provider capability is validated;
- desktop/tablet runtime;
- phone list-first fallback and full-screen room detail;
- backup/restore coverage introduced with each slice.

## 32. Deferred capabilities

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
- durable unlinked polygon drafts;
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

## 33. Product acceptance criteria

### Ownership

- FamilyBoard owns floors, rooms, assets, overlays, label anchors, setup lifecycle, and backup/restore metadata.
- Home Assistant remains a mapping, data, capability, health, and command-execution provider only.
- Room identity remains stable across provider renames, room renames, floor reordering, asset replacement, overlay edits, and mapping removal.
- No product path encodes a maximum number of floors.
- Provider-specific identifiers appear only in configuration or diagnostics.

### Safety

- Unsafe source SVG is never mounted into editor or runtime DOM before sanitization.
- Editor and runtime render the same safe derivative and use the same sanitized coordinate basis.
- Sanitization changes that materially affect the drawing require user review before activation.
- The currently active asset cannot be purged while it is the background for the trusted spatial setup.
- Destructive purge warns when it removes the last recoverable trusted spatial setup.

### Geometry

- Runtime renders only trusted overlays on the active asset.
- Every trusted overlay links to exactly one canonical room.
- One room has at most one trusted polygon on the active asset in V1.
- Invalid polygons, self-intersections, unsupported holes, unsupported disconnected regions, out-of-range geometry, zero-area geometry, missing room links, and active overlaps cannot become trusted.
- Uncovered areas are valid and do not block trust.
- Durable unlinked polygons are excluded from V1.

### Editor

- Incomplete setup can be saved, resumed, and explained without runtime trust.
- A room without a trusted overlay has an explicit status: not configured yet, `Bewust niet getekend`, blocked and represented through fallback, or `Controle nodig`.
- `Bruikbaar` can be achieved through room-list-only climate use.
- `Volledig voor deze verdieping` requires trusted overlays for spatial rooms and explicit classification for non-spatial rooms.
- Settings maintenance supports repair, review, rollback, and draft recovery without requiring canvas-only interaction.

### Replacement

- Every replacement requires explicit review and floor-level activation.
- Compatibility allows preview/reuse but never automatic trust.
- Partial room approval remains draft-only until floor-level activation.
- Activation shows which rooms will appear spatially and which will use fallback.
- Activation with a subset of approved rooms requires every unresolved room to be explicitly classified.
- Failed or cancelled replacement leaves the previous active setup intact.
- Rollback preserves and restores the previous trusted setup while retained.

### Runtime

- The main `Woning` page remains Story-first.
- Floor plans appear only in `Klimaat in huis`.
- Runtime shows one floor at a time.
- Normal room polygons show room name only and remain visually quiet.
- Attention or Unknown rooms show compact context only when it explains the Story.
- Selected-room detail carries full explanation and actions.
- Story context is full on entry, collapses after interaction or explicit collapse, remains recoverable, and does not steal focus on live updates.

### Trust and Unknown

- Valid asset or overlay structure does not imply trusted runtime rendering.
- Trusted overlay geometry does not imply trusted climate data.
- Working sensor mapping does not imply trusted spatial rendering.
- Unknown, stale, conflicting, unavailable, missing, and review-needed states block false reassurance.
- Mapping health changes capability confidence without changing room existence.

### Fallback

- A floor without a trusted plan receives a full-quality room-list climate experience.
- A room-list-only floor can be `Bruikbaar`.
- Room-list fallback supports primary room state, confidence, relevant temperature/humidity, Story routing, room detail, bounded controls, Unknown handling, and setup correction links.
- Missing assets after restore degrade to fallback without deleting floor, room, climate mapping, overlay, or anchor metadata.

### Controls

- V1 requires `Tijdelijk warmer` and `Schema hervatten` only when validated.
- `Tijdelijk koeler` appears only when provider capability is validated.
- Heating controls require fresh enough state, semantic capability, bounded temperature range, bounded duration, pending state, success confirmation, safe failure behavior, and shared-zone warning when relevant.
- No heating control appears directly on the floor plan.
- Shared-zone controls disclose affected rooms and reduced precision.

### Accessibility

- Every plan has a synchronized room list.
- Keyboard navigation reaches floor selector, room list, plan rooms, detail, diagnostics, dialogs, and actions.
- Screen readers receive floor summaries with completion and trust status.
- Focus is visible and restored after dialogs, sheets, replacement review, and command completion.
- Color is never the only state signal.
- Large text, reduced motion, zoom, and short viewports preserve access through internal scrolling or sheets rather than normal page scrolling.

### Backup/restore

- Each implementation slice adds backup/restore coverage for the concepts it introduces.
- Final backup/restore work is an end-to-end portability, compatibility, corruption, missing-file, pre-restore snapshot, and rollback audit.
- Backup/restore includes floors, rooms, climate configuration, mappings, asset sources when retained, safe derivatives, hashes, overlays, anchors, trust states, replacement drafts, and rollback versions.
- Restore never lets provider-side differences rename or delete FamilyBoard rooms.

## 34. Risks and remaining open decisions

Only the following remain genuinely open for future implementation specification:

- Exact asset size limits and storage quotas.
- Exact polygon vertex limits and performance thresholds.
- Exact stale, conflict, humidity, dryness, warmth, and cold thresholds.
- Exact rollback retention duration.
- Exact provider capability contract for enabling heating controls per provider/zone.

These are implementation-bound details and do not change the canonical ownership, lifecycle, trust, fallback, replacement activation, or runtime direction.

## 35. Recommended implementation slicing direction

Future implementation should proceed in dependency-aware slices without crossing boundaries unnecessarily. Backend architecture and implementation slices go to Codex. Frontend implementation slices go to Copilot. Cross-cutting hardening may involve both, but ownership must remain explicit.

1. **Backend — canonical Floor and Room foundation:** FamilyBoard-owned floors and rooms, including backup/restore.
2. **Backend — climate configuration and provider mapping contracts:** source roles, mappings, capability confidence, diagnostics boundary, including backup/restore.
3. **Backend — asset ingestion and lifecycle:** upload, sanitization contract, asset states, hashes, safe derivative, missing-asset restore support, and rollback metadata.
4. **Frontend — floor/room setup and maintenance without canvas:** floor rail, room panel, statuses, explicit no-overlay reasons, and maintenance flows.
5. **Backend — overlay geometry and trust:** polygons, anchors, validation contract, trust states, drafts, and backup/restore.
6. **Frontend — polygon editor and validation UX:** drawing/editing, validation blockers/warnings, anchors, and draft recovery.
7. **Backend — replacement lifecycle and rollback:** replacement drafts, review state, floor-level activation, retained rollback versions, and backup/restore.
8. **Frontend — replacement review workflow:** room-by-room approval, activation summary, fallback classification, and rollback UX.
9. **Backend — room-list climate runtime contracts and bounded actions:** Story routing data, Unknown handling, room detail contract, validated heating actions, and backup/restore for introduced configuration.
10. **Frontend — full-quality room-list climate deep dive:** fallback-first runtime, selected-room detail, Story context behavior, Unknown handling, and bounded controls.
11. **Frontend — trusted spatial plan enhancement:** one-floor rendering, trusted overlays only, density rules, synchronized list, and responsive desktop/tablet behavior.
12. **Frontend/backend — phone, accessibility, viewport, VisualReview, and end-to-end hardening:** list-first phone runtime, no phone polygon editing or replacement approval, accessibility, no-page-scroll validation, and visual review.
13. **Backend/frontend — final portability and recovery audit:** compatibility validation, corruption and missing-file recovery, pre-restore snapshot, restore rollback verification, and cross-slice backup/restore audit.
