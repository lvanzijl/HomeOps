# Phase 5 Slice 5.3 — Room climate configuration viewport analysis

**Status:** Revised and approved implementation authority for Slice 5.3.

## Browser-discovered constraint and approved revision

The first real-browser implementation pass at 1366×768 showed that the original right-column assumption was incorrect. The selected-floor header, summary, Home Assistant diagnostics, floor-plan review, room list, and archived-room region were all flexible siblings inside one fixed-height panel. The room list therefore collapsed to effectively zero height; scrolling a room action into view placed it behind the diagnostic and archive siblings, which intercepted pointer input. This was an existing composition defect made blocking by the new required room action.

The revised composition keeps the two-column Woning grid and its fixed viewport boundary, but assigns explicit internal regions in the selected-floor panel. The selected-floor header and compact summary remain fixed. The active room list becomes the first, primary internal-scroll region. Existing Home Assistant, floor-plan/replacement, and archived-room content is grouped below it in a secondary internal-scroll region. This preserves every existing feature, makes the required room action reachable, and prevents siblings from overlapping without adding document or outer-dialog scrolling.

## Current Settings and Woning composition

Settings is a fixed FamilyBoard workspace with a bounded dashboard and a compact quick-action rail. The existing `Woning` action opens one `SettingsSurfaceDialog`; that dialog owns its header and an internally scrolling body. Inside it, `WoningManagement` is a fixed-height flex composition with a short header and status strip above a two-column grid. The left column owns the internally scrolling floor rail. The right column owns the selected-floor summary, existing Home Assistant diagnostics, floor-plan/replacement controls, and an internally scrolling room list.

Each active room card already shows identity, room type, optional family member, and a read-only climate summary derived from the generated configuration DTO. Its action row wraps within the card. Archived rooms are separated into a compact restore region and currently expose no edit controls.

The page does not need more global height. The confirmed defect is that active room climate configuration can only be read as a summary: there is no usable create/edit/disable action. Adding the whole form inline would enlarge every room card, displace room content, and make the Woning composition depend on the number and complexity of climate fields.

## Primary and secondary information

Primary information that must remain visible in the normal Woning composition:

- Settings and Woning dialog identity and close action;
- selected floor and the room list boundary;
- each room's name and truthful climate status;
- one clearly labelled climate configuration action for each active room;
- the Woning status/error strip.

Primary information inside the climate editor:

- room identity;
- climate enabled state;
- bedtime relevance;
- optional preferred temperature and humidity ranges;
- heating policy intent;
- client/server validation and unsaved/saving/saved state;
- save and close actions.

Secondary information that may be compacted or internally scrolled:

- explanatory copy for each policy;
- optional range fields when their policy is not enabled;
- the existing room management actions;
- archived-room restore entries;
- all Woning content behind the nested editor.

## Approved composition

The existing Settings dashboard, Settings `Woning` entry, outer Woning dialog, and two-column grid remain unchanged. The right column uses the revised explicit primary/secondary internal regions documented above; the left floor rail remains unchanged.

Each active room card gains one action: `Klimaat instellen` for an unconfigured room or `Klimaat bewerken` for an existing configuration. It stays in the existing wrapping action row. Archived rooms receive concise copy that they must be restored before climate settings can be changed; no enabled-looking climate action is rendered for them.

The action opens one nested bounded dialog scoped to the selected room. The dialog uses the established Settings backdrop/header/body pattern and contains:

- a compact enabled/bedtime section;
- optional temperature and humidity range sections controlled by explicit checkboxes;
- a heating-intent selector using the generated enum;
- inline validation and one status line for unchanged, unsaved, saving, saved, or backend-error state;
- a fixed footer action row while the form body owns vertical overflow.

The editor does not expose providers, source mappings, Home Assistant entities, floor plans, or runtime heating commands. Those belong to later Phase 5 slices or the existing runtime.

## Viewport fit justification

At 1440×900 and 1366×768, the FamilyBoard shell remains the viewport boundary. The Settings dashboard remains unchanged. The outer Settings dialog is already capped at `max-height: 100%`; its body scrolls internally. `WoningManagement` remains capped at `min(72vh, 760px)`. The floor collection, primary room collection, and secondary right-column content each own bounded internal overflow and cannot overlap one another.

The new room action may wrap within a room card, but the card is inside `.woning-scroll-list`, so it cannot increase document height. The nested climate dialog is capped by the same viewport-safe Settings dialog geometry. Its form body scrolls internally, and the action row is a non-growing footer. Optional range content appears only inside that bounded dialog. No new element contributes variable height to `document.body` or the primary workspace.

## Risks, trade-offs, and rejected alternatives

- Inline expansion in every room card was rejected because it makes room-list density and global composition depend on form complexity.
- A third Woning grid column was rejected because it would compress existing floor and room regions at laptop width and duplicate the selected-room detail pattern used by runtime Woning.
- A separate climate setup page or route was rejected because it would create another navigation system before Slice 7.1 and separate configuration from the canonical room list.
- Automatically enabling bedtime relevance or heating control was rejected. The form preserves explicit user intent and uses backend validation.
- Hiding backend rejection behind a generic Woning refresh was rejected. The editor retains the draft and shows the failure locally.
- Editing archived or disabled rooms is rejected by the existing backend lifecycle. The UI must explain this rather than presenting a ready control.

## Implementation contract

Implementation must add the compact per-room action and nested editor described above, construct requests from the generated `RoomClimateConfigurationDto`, `ClimateRangeDto`, `HeatingPolicyIntent`, and `UpsertRoomClimateConfigurationRequest` contracts, preserve drafts on validation/backend failure, and refresh the room summary only after a successful response. It must not implement provider/source mappings, provider lifecycle, floor-plan upload, credentials, or runtime heating authority. Browser validation must cover create/edit/disable, retained validation/error input, archived-room explanation, refresh persistence, and zero document-level vertical overflow at 1440×900 and 1366×768.
