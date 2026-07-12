# Woning Climate Deep Dive — Runtime Experience

Date: 2026-07-12  
Scope: analysis slice 3 of 3; runtime climate deep-dive product and interaction model only  
Status: research report for later consolidation  
Exclusions: no production code, no editor UX redesign, no persistence models, no APIs, no migrations, no tests, no screenshots, no binary assets, no Home Assistant configuration

## 1. Executive summary

The runtime climate deep dive should be a spatial explanation of a Household Story, not a live Home Assistant dashboard. The stable V1 shape is:

```text
Pinned Story context / generic climate context
→ floor selector with confidence markers
→ one selected floor
→ quiet floor-plan canvas when trusted enough
→ synchronized accessible room list / selected-room summary
→ desktop selected-room side panel, tablet sheet, phone list-first detail
→ safe bounded heating actions only inside room detail
→ diagnostics behind disclosure
```

The plan communicates where the climate situation is happening and why FamilyBoard is or is not confident. It should avoid default telemetry density. Room polygons always show room identity and state; temperature is selective, humidity is contextual, target temperature stays in room detail, and raw sensor names or entity IDs are absent from the default household view.

Unknown, stale, missing, and contradictory readings must visibly block false reassurance. If FamilyBoard cannot reliably judge a room, the polygon, floor selector, Story context, and room detail should all say that calmly. The fallback hierarchy keeps the deep dive useful when floor plans are incomplete: use the plan where trusted, otherwise show room cards and Story-specific room detail rather than forcing families to finish every overlay.

## 2. Accepted model and editor inputs

This report freezes the corrected product model supplied for this slice:

- FamilyBoard owns floors, rooms, floor-plan assets, and room overlays.
- Home Assistant areas, devices, entities, sensors, climate zones, and Evohome zones are mappings, suggestions, and data/control providers only.
- Floors are user-defined, ordered, and have no hard product maximum.
- Rooms are canonical FamilyBoard household identities with stable identity, household ownership, floor assignment, display name, room type, sort order, optional associated family member, and enabled/archive state.
- Climate relevance, mappings, thresholds, policies, bedtime relevance, and source choice are feature-specific configuration, not canonical Room identity.
- A floor has zero or one active visual floor-plan asset. Sanitized active assets define the exact shared editor/runtime coordinate basis.
- Room geometry is stored separately as normalized polygons. V1 supports at most one active polygon per room per active floor-plan asset.
- Labels use automatic interior placement by default with optional manual anchors.
- Asset replacement requires explicit overlay review before runtime trust. Compatibility may permit preview reuse, never automatic trust.
- The main Woning page remains Story-first. Floor plans exist only in the climate deep dive. One floor is shown at a time.
- Desktop is primary, tablet remains usable, phone may simplify.
- The editor is separate from runtime. Runtime must not expose drawing controls.
- Durable unlinked polygon drafts are avoided in V1.
- Completion language distinguishes `Bruikbaar`, `Volledig voor deze verdieping`, and `Bewust niet getekend`.
- Explicit room exclusion from floor-plan display is allowed, but unexplained missing boundaries are not.

Editor outputs consumed by runtime are therefore: ordered floors, enabled rooms, active sanitized asset metadata, asset trust/review state, normalized room polygons, label anchors, explicit room display exclusions, overlay completeness classification, room-to-member association, and climate capability mappings.

## 3. Repository findings

Repository inspection found these patterns that should shape later implementation:

- The `house` workspace exists today only as a placeholder labelled `Huisstatus`, so this report defines future runtime behavior rather than revising an implemented Woning page.
- Primary navigation already uses stable bounded workspace chrome. The app shell, workspace shell, and root prevent browser-level overflow, while page bodies own internal overflow. Future deep-dive implementation must preserve this rule.
- Existing primary pages moved toward bounded dashboards with internal overlays. Shopping and Tasks use in-page bounded surface dialogs with fixed headers and internally scrolling bodies, which is a better model for deep-dive detail/fallback panels than document scrolling.
- The current Weather detail is a modal dialog opened from the Home weather pill. It is advice-first, Dutch, non-technical, closable with Escape, focuses the close button, and limits hourly rows. This supports a calm climate detail tone but should not be copied as the desktop room-detail pattern because the climate deep dive needs persistent plan/detail co-presence.
- Existing dialogs use `role="dialog"`, `aria-modal`, close buttons, backdrop click, Escape handling in several flows, and status/error messages with `role="status"` or `role="alert"`.
- Tab/segmented patterns exist for bounded secondary views, such as shopping other-list tabs. A floor selector can reuse this restrained segmented-control language without implying route-level navigation.
- Family-member association patterns exist through `FamilyMember` selection, avatars, and decorative avatar references. For climate runtime, associated room/member copy should use the member as household meaning only, not ownership or responsibility.
- Current Dutch weather copy uses household language such as `Weer voor vandaag`, `Samenvatting vandaag`, `Komende dagen`, `Weer wordt bijgewerkt`, and non-technical fallback text. Climate copy should follow this style: explain meaning, avoid provider jargon, and avoid raw entity names.
- Design-system status conventions are semantic and restrained: active/current states use border/accent/weight; disabled actions lower opacity and remove urgency; warning/attention badges are compact; errors are surfaced as calm explanatory status blocks.
- Touch behavior is currently button/list based, not canvas-heavy. The runtime floor plan therefore needs explicit touch targets, zoom controls, and a synchronized list rather than relying only on pinch precision.
- VisualReview conventions are documented as a browser-facing runtime with ephemeral fixtures. Later implementation should add climate scenarios through VisualReview fixtures and validate viewport fit there, not by committing screenshots.
- No existing production floor, room, polygon, or indoor climate model was found in the inspected client source; therefore the runtime report must not pretend there is an implementation to extend.

## 4. Runtime product philosophy

The deep dive answers `Waar speelt dit, en waarom?` It should preserve the Story-first Woning hierarchy:

- The Story is the reason to enter.
- The floor plan is the spatial explanation.
- The selected room detail is the household explanation and safe action surface.
- Diagnostics are supporting evidence, not the product center.

It must not be a permanent sensor dashboard, live HA floor dashboard, HVAC console, room telemetry grid, or floor-plan novelty. It should help a parent quickly understand: which room needs attention, which nearby rooms are fine, whether FamilyBoard trusts the reading, whether heating is active or useful, and whether a bounded action is safe.

## 5. Entry points and Story context

### Entry points

1. **From a climate-related Story**: opens the deep dive with Story context preserved. A room-specific Story selects the affected floor and room. A broad Story selects the most relevant floor if one floor dominates; otherwise it opens the overview state on the first floor with attention/unknown, then household order.
2. **From `Klimaat bekijken`**: opens a generic climate overview without Story lock-in. Default floor is the first ordered floor with attention, unknown, or recent climate data; otherwise household order.
3. **From a room-specific Story or room chip**: opens selected floor and selected room directly, with the room detail visible.

### Story behavior

- Story context remains pinned at the top of the deep dive as long as the user is exploring that Story.
- The affected room is highlighted and selected automatically for room-specific Stories.
- Broad Ready/Steady Stories do not auto-select a room unless they have one clear supporting room.
- Unknown Stories focus the missing/stale room or floor because the absence of trust is the reason for the Story.
- Users can switch floors without losing the Story; the banner changes from `Hier speelt dit` to `Andere verdieping bekijken` when the selected floor is outside the Story scope.
- Users may collapse, not fully dismiss, the Story banner during a Story-entered session. The collapsed chip still states the Story and provides `Terug naar verhaal`.
- If the Story expires after opening, keep the spatial context but show `Dit verhaal is bijgewerkt` with actions `Nieuwste woningstatus bekijken` and `Hier blijven kijken`.
- Multiple related Stories should be grouped in a compact Story stack only when they share climate/floor/room context. V1 should show the primary Story plus `+N verwante signalen` rather than a feed.

## 6. Runtime information architecture

Recommended desktop hierarchy:

```text
[Back to Woning]  Klimaat in huis                         [Story chip/status]
┌────────────────────────────────────────────────────────────────────────────┐
│ Story banner: Robin zijn slaapkamer wordt niet op tijd comfortabel.         │
│ Waarom: het is daar nog koel; verwarming helpt mogelijk.                    │
└────────────────────────────────────────────────────────────────────────────┘
[Beneden ✓] [Boven !] [Zolder ?] [Tuin —]
┌────────────────────────────── floor-plan region ─────────────────────────┐┌─ selected room ─────┐
│ quiet plan, one floor, room polygons, zoom controls, list toggle           ││ Robin slaapkamer    │
│ selected room emphasized; unknown/stale hatches; attention border/icon     ││ Nu: Koel · 18,1 °C  │
│                                                                            ││ Waarom / vertrouwen │
│                                                                            ││ Veilige acties      │
└────────────────────────────────────────────────────────────────────────────┘└──────────────────────┘
[Accessible synchronized room list / compact fallback strip when needed]
```

Always visible on desktop: navigation back to Woning, page title, Story/generic context, floor selector, plan or fallback, selected-room summary/detail region, confidence state. Only after selection: room-specific detail, controls, source explanation. Dialogs are reserved for confirmations, failures requiring acknowledgment, and setup correction journeys; normal room inspection is not modal. Avoid modal nesting by making diagnostics a disclosure inside the side panel and setup actions navigate out or open one bounded overlay only after closing transient confirmation.

## 7. Floor selection

- Floors appear in FamilyBoard sort order, excluding archived floors by default.
- A Story-targeted room selects its floor. A broad Story chooses the first floor with attention/unknown, then the first floor with climate data, then household order.
- Manual floor switching preserves Story context and clears selected room unless the same Story has a room target on the new floor.
- Floors with attention get a small `!` marker; Unknown/stale/conflicting get `?` or a broken-line marker. Markers must include text for screen readers.
- Floors with no climate data can appear if they are enabled household floors, but are quiet and labelled `Geen klimaatmeting` rather than hidden.
- Hidden/excluded floors do not appear in the primary selector; if they contain relevant climate Stories, show a fallback card `Niet op plattegrond`.
- Floors without active assets remain selectable when they contain climate data, opening the room-list fallback.
- Floors with incomplete/partial overlays remain selectable with a `Deels getekend` note.
- Floors marked `Controle nodig` are selectable only in preview/fallback mode: show the asset dimmed or no interactive polygons, and prioritize a setup callout.
- Large floor counts: show the first six chips in a wrapping or horizontally scrollable rail, then `Meer verdiepingen`. The selector owns its overflow; the page must not grow.
- `Bruikbaar` means runtime may use trusted drawn rooms and fallback for missing/excluded ones. `Volledig voor deze verdieping` allows a quieter completeness indicator. `Bewust niet getekend` appears in fallback lists as an explicit state, not as an error.
- If only one floor has a floor plan, still show the floor name as context, but the selector can become a compact label plus `Andere kamers` if non-plan floors have data.
- If a Story references a room on a floor without a valid asset, open selected room detail with list fallback and a calm `Geen bruikbare plattegrond voor deze verdieping` explanation.

## 8. Floor-plan rendering

- Render the sanitized active asset in its trusted coordinate basis and scale polygons from normalized coordinates onto the same basis.
- Preserve aspect ratio. Letterbox rather than stretching. The canvas region owns empty space with a neutral background.
- Default view is fit-to-floor. Story room entry may animate or jump to `zoom-to-room` only if it does not disorient; reduced motion jumps without animation.
- Provide explicit `Passend`, `+`, `−`, and `Kamer centreren` controls. Do not rely on hidden gestures.
- Desktop supports mouse wheel/trackpad zoom only when the plan is focused or hovered and with bounded limits. Tablet supports pinch/pan but also visible controls. Keyboard supports Tab to controls/rooms, arrow-key pan when the canvas has focus, plus/minus zoom, Home/fit-to-floor, and Enter/Space select focused room.
- Room hit targets include polygon plus label; very small polygons get an enlarged invisible hit area that does not alter visual geometry.
- Focus order: Story banner, floor selector, plan controls, selected/attention rooms in priority order, remaining rooms by room sort order, room list, detail panel.
- Selection emphasizes the polygon with a distinct focus ring/outline and raises label priority. Selected state must remain distinct from attention.
- Labels use automatic interior placement or stored manual anchor. Long names truncate to a household-safe short label, with full name in accessible label and detail.
- Background contrast: asset is slightly dimmed/washed behind overlays; room fills are translucent so walls remain visible.
- Missing/corrupt asset: do not render a broken image. Show fallback list plus setup callout.
- Overlay review state: show `Plattegrond moet gecontroleerd worden` and disable polygon-derived reassurance until reviewed.
- Explicitly excluded rooms appear in fallback list under `Bewust niet getekend`, not as missing geometry.

## 9. Room-state visual language

Use a restrained combination, never color alone:

| State | Fill | Border | Icon/badge | Pattern/opacity |
| --- | --- | --- | --- | --- |
| Comfortable/normal | very light neutral or green-tinted wash | thin neutral | optional `✓` only in legend/list, not every polygon | quiet opacity |
| Attention | warm amber tint | stronger amber border | small `!` label badge | no full-page alarm red |
| Unknown | pale gray/blue tint | dashed border | `?` badge | subtle diagonal hatch |
| Stale | muted gray tint | dotted border | clock badge | reduced confidence opacity |
| Contradictory | split/striped border or double outline | amber+gray border | `≠` or `meetverschil` badge | light hatch |
| Selected | transparent or existing state fill | high-contrast focus ring outside polygon | selected label emphasis | raised label/card |
| No recent data | same family as stale | dotted border | clock/question badge | no comfortable green |
| Excluded from climate interpretation | low-opacity neutral | thin muted border | `Niet meegenomen` badge in detail/list | visually subdued |
| Not drawn | no polygon | fallback list item | `Bewust niet getekend` | not represented spatially |

Normal rooms should remain quiet. Attention is clear but not alarming. Unknown and stale must be visibly not-normal. Selected outline must be readable even on attention polygons.

## 10. Room labels and displayed values

V1 labels should be restrained:

- Always show room name when it fits, or an icon/initial with accessible full name when it does not.
- Always show state marker for attention, unknown, stale, contradictory, and selected rooms.
- Do not show temperature in every room by default. It turns the plan into telemetry.
- Show temperature on the plan for selected room, attention room, and at most a few Story-supporting rooms where the value explains the Story.
- Show humidity only when humidity is relevant to the Story/state, such as bathroom moisture, too dry, or stale humidity source.
- Do not show target temperature on the plan; it belongs in detail because it is control context.
- Heating active may be a small selected/attention-room badge only when it explains whether heating is helping.
- Narrow/small rooms collapse to marker-only labels with full detail in side panel/list.
- Collision handling priority: selected room, attention/unknown rooms, Story-supporting rooms, then others. Lower-priority labels collapse, not overlap.
- At low zoom, labels collapse to state badges/initials. The synchronized list remains the text alternative.
- V1 should not expose a user density toggle beyond `Toon lijst` / `Verberg lijst`; automatic density is calmer.

## 11. Room selection and detail

Desktop should use a persistent right-side side panel. Tablet should use a bottom sheet or side sheet depending on orientation. Phone should use a list-first climate overview and a full-screen room detail; the plan can be a secondary preview if usable.

Room detail includes:

- household meaning: room name, floor, room type, associated family member when helpful;
- current comfort reading, humidity when relevant, heating/control reading if applicable;
- Evohome heating state, target temperature, and schedule state when available;
- freshness/confidence in plain Dutch;
- conflict explanation when sources disagree;
- why FamilyBoard classified the room this way;
- cautious near-term direction only when supported (`lijkt op te warmen`, not prediction certainty);
- safe bounded actions;
- data limitations and setup link if needed.

Selection persists within the same floor and Story context. Switching floors clears room selection unless the selected room's Story has another explicit room on the new floor. Multiple-room comparison is deferred; V1 may show supporting rooms in the explanation, but not side-by-side comparison. Close detail with `Sluit kamer`, Escape when focus is inside detail, selecting an empty plan area, or selecting another room. Keyboard focus moves to the detail panel heading after selection and returns to the selected room on close. The Story banner remains visible above both plan and detail.

## 12. Climate interpretation

User-facing V1 room states:

- `Comfortabel`
- `Iets koel`
- `Te koud`
- `Iets warm`
- `Te warm`
- `Vochtig`
- `Te droog` only if supported by sensors and thresholds
- `Warmt op`
- `Op doeltemperatuur`
- `Onbekend`
- `Meting verouderd`
- `Metingen spreken elkaar tegen`
- `Verwarming niet beschikbaar`

Supporting explanation only: improving, worsening, heating likely to help, heating active, shared zone, source confidence. Deep diagnostics: raw provider health, source-specific timestamps, control command details. Deferred: predictive comfort forecasts, learned preheat optimization, demand-percentage tuning, room-by-room history analytics.

Avoid overclaiming. Use `lijkt`, `waarschijnlijk`, and `op basis van de laatste meting` when direction is inferred.

## 13. Duplicate-source behavior

- The floor plan shows the configured comfort temperature when fresh and trusted.
- Room detail shows comfort temperature and heating-control temperature when both matter.
- If both are present and close, detail can say `De kamer- en verwarmingsmeting liggen dicht bij elkaar`; do not show both on the plan.
- If meaningfully different, the room state becomes contradictory or Unknown depending on severity, and the Story may say `Ik kan deze kamer niet betrouwbaar beoordelen`.
- If only comfort source exists, show comfort and say heating control is unavailable if action would need it.
- If only Evohome/control source exists, show it as `verwarmingsmeting` in detail; on plan show value only with a confidence marker, not as fully comfortable unless configured as acceptable.
- If one source is stale, prefer the fresh configured comfort source but surface stale limitation in detail if it affects confidence.
- If both are stale, polygon is stale/unknown and no reassurance language is allowed.
- If configured comfort source disappears, show Unknown with setup action.
- If a shared Evohome zone serves multiple rooms, detail says `Deze verwarming stuurt ook ... aan`; actions require shared-zone warning.

Dutch conflict phrasing:

- `De kamermeting en verwarmingsmeting verschillen te veel.`
- `FamilyBoard gebruikt de kamermeting voor comfort, maar laat de verwarmingsmeting zien omdat die de radiator aanstuurt.`
- `Deze zone verwarmt meerdere kamers. Een aanpassing kan ook de overloop beïnvloeden.`

## 14. Freshness, Unknown, and contradiction

Unknown prevents false reassurance by replacing comfortable copy with uncertainty copy everywhere it matters.

- Fresh data: normal state allowed; raw timestamp hidden by default, `Net bijgewerkt` or `Bijgewerkt rond 19:10` only in detail.
- Stale data: polygon dotted/clock, floor selector marker, Story may become Unknown, detail explains `Laatste betrouwbare meting is te oud`.
- Unavailable data/Home Assistant unavailable: affected floors and rooms show Unknown; Story says FamilyBoard cannot judge climate now; fallback may still show last-known but clearly stale.
- Missing mapping: no climate interpretation for that room; setup action appears.
- Conflicting sources: contradictory visual state; plan avoids single reassuring value unless detail clarifies.
- Partially known room: show known part and clearly name the missing dimension (`Temperatuur bekend, vocht onbekend`).
- Mixed confidence floor: floor selector gets `?`, plan shows per-room confidence, banner summarizes number of affected rooms.
- Asset available but climate unavailable: plan renders geometry but not comfort reassurance.
- Climate data available but no floor-plan asset: list fallback with room detail.
- Raw timestamps appear only in detail diagnostics unless stale/unknown needs plain recency explanation.
- Setup/configuration actions appear for missing mapping, lost source, unreviewed overlay, no asset, or unsupported control. Use household language (`Kamer koppelen`, `Plattegrond controleren`) rather than HA entity names.

## 15. Heating controls

Heating controls appear only in selected-room detail, never directly on polygons. V1 supports safe bounded actions when a validated semantic control exists:

- `Tijdelijk warmer` with fixed short duration and bounded step.
- `Tijdelijk koeler` with fixed short duration and bounded step.
- `Schema hervatten`.

V1 does not support weekly schedule editing, arbitrary target ranges, raw service calls, vendor modes, low-level retries, or direct plan controls.

Actions may be immediate after pressing a clearly labelled button if bounded and reversible; shared-zone or child-room bedtime-sensitive actions require a lightweight confirmation inline in the panel. Pending state replaces controls with `Aanpassing wordt verstuurd…` and disables duplicate action. Success says `Aangepast tot 20:30` or `Schema hervat`. Failure says `Aanpassing niet gelukt. De huidige planning blijft actief.` with `Opnieuw proberen` only if safe. Unavailable controls explain why and offer setup only when appropriate.

## 16. Completeness and fallback behavior

Fallback hierarchy:

1. **Trusted floor plan + polygons** for drawn, trusted rooms.
2. **Hybrid plan + room list** when some rooms are excluded, undrawn, or climate-only.
3. **Room list / compact floor cards** when no valid asset or overlays are untrusted.
4. **Story-specific room detail** when a Story references a known room without usable spatial geometry.
5. **Generic climate overview** when no floor plan is configured at all.
6. **Setup callout** only after preserving any useful climate/status explanation.

Cases:

1. Full valid asset and all rooms drawn: plan primary, quiet completeness note optional.
2. Usable asset with explicit exclusions: plan primary plus `Bewust niet getekend` list group.
3. Active asset with some rooms drawn: plan primary for drawn rooms; undrawn rooms in `Nog niet op plattegrond` unless explicitly excluded.
4. Rooms but no asset: list-first floor view with setup callout.
5. Missing/corrupt asset: same as no asset, plus `Plattegrond kan niet worden getoond`.
6. Overlays need review: no trusted polygon reassurance; show review callout and fallback room statuses if data exists.
7. Climate data without spatial overlay: list row with detail available.
8. Story references room without overlay: open that room detail and show fallback notice.
9. `Bewust niet getekend`: include in list and Story routing, not as missing work.
10. No floor plan configured: generic climate overview with floors/rooms as cards; `Plattegrond toevoegen` as secondary setup.

## 17. Density and disclosure rules

| Information | Plan | Selected summary | Room detail | Diagnostics disclosure | Nowhere by default |
| --- | --- | --- | --- | --- | --- |
| Current comfort value | selective | yes | yes | source split | — |
| Temperature history graph | no | no | optional sparkline deferred | yes in later phase | V1 default |
| Humidity history graph | no | no | deferred unless moisture Story | yes later | V1 default |
| Heating demand percentage | no | no | no | maybe later | V1 |
| Raw sensor names | no | no | no | setup/debug only | household runtime |
| Entity IDs | no | no | no | setup/debug only | household runtime |
| Last update timestamp | no unless stale marker | relative | relative/plain time | exact timestamp | plan default |
| Target temperature | no | selected room maybe | yes | — | plan default |
| Source confidence | marker | short | yes | details | — |
| Source conflict | marker | short | yes | source details | — |
| Provider health | no | no | plain limitation | technical detail | plan default |
| Completeness warning | floor marker | short | if room affected | setup detail | — |
| Home Assistant setup links | no | no | when actionable | yes | plan surface |

## 18. Navigation

- `Terug naar Woning` returns to the main Woning Story surface and preserves the originating Story if still active.
- Deep-link state may include Story id, floor id, and room id. Unknown/expired IDs fall back gracefully to overview.
- Browser Back from a selected room first clears detail when represented in URL; otherwise returns to Woning.
- Preserve selected floor and room within the same deep-dive session. Returning after setup correction should restore the prior Story/floor/room if still valid.
- Returning after a heating action stays in room detail and shows result state.
- If Story state changes live, show a non-disruptive `Woningstatus bijgewerkt` banner; do not yank focus or switch floors automatically.

## 19. Accessibility

- The spatial plan is never the only consumption path. A synchronized room list exposes floor, state, current value if appropriate, confidence, and action availability.
- Room polygons are keyboard focusable with accessible names such as `Robin slaapkamer, boven, te koud, meting actueel`.
- Screen readers get a floor summary: `Boven: 2 kamers comfortabel, 1 vraagt aandacht, 1 onbekend`.
- Visible focus must be strong and independent of color.
- State is encoded by label text, border style, icon, and pattern, not only color.
- Zoom controls are buttons with labels. Keyboard pan/zoom has instructions when canvas receives focus.
- Detail focus moves predictably and close returns focus.
- Heating actions include clear button text, pending status announced with `role=status`, failures with `role=alert`, and confirmations with accessible headings.
- Large text should collapse plan labels and prioritize the list/detail rather than causing page scroll.
- Reduced motion disables zoom animations and state transitions.
- State changes while inside the deep dive are announced politely when they affect selected room or Story context; background room changes should not spam announcements.

## 20. Viewport/responsive behavior

- Desktop/laptop: fixed viewport composition with top context, floor selector, plan area, and side panel. Internal scroll only inside side panel/list/diagnostic areas.
- Short viewport: reduce banner copy, collapse Story explanation to one line, use compact floor selector, prioritize plan and selected summary, allow detail body internal scroll.
- Tablet landscape: plan plus narrower side sheet; tablet portrait: plan above bottom sheet or split with collapsible list.
- Phone: list-first overview with optional mini-plan preview; selecting a room opens full-screen detail. Phone may use page-level route transitions, but primary desktop deep dive must not browser-scroll.
- Many floors: selector rail scrolls or groups; selected floor remains visible.
- Many rooms: plan labels auto-collapse and synchronized list scrolls internally.
- Large text: density reduces, plan remains spatial cue, list/detail carry textual explanation.

No exact pixels are frozen here; final consolidation should freeze regions and overflow ownership, not brittle dimensions.

## 21. Dutch terminology and copy

Recommended terms:

- Deep dive title: `Klimaat in huis`
- Generic no Story: `Zo voelt het huis nu`
- Floor selector label: `Verdieping`
- Attention: `Vraagt aandacht`
- Comfortable: `Comfortabel`
- Unknown: `Niet betrouwbaar te beoordelen`
- Stale: `Meting verouderd`
- Contradictory: `Metingen spreken elkaar tegen`
- No floor plan: `Geen plattegrond voor deze verdieping`
- Incomplete floor plan: `Plattegrond deels ingericht`
- Conscious exclusion: `Bewust niet getekend`
- Room detail heading: `Wat betekent dit voor deze kamer?`
- Temporary warmer: `Tijdelijk warmer`
- Temporary cooler: `Tijdelijk koeler`
- Resume schedule: `Schema hervatten`
- Shared zone: `Deze verwarming stuurt meerdere kamers aan`
- Setup needed: `Koppeling controleren`
- Last updated: `Bijgewerkt rond {time}` / `Laatste betrouwbare meting: {relative}`
- Story expired: `Dit verhaal is bijgewerkt`
- No active Story: `Er is geen actief klimaatsignaal. Je kunt per kamer bekijken hoe betrouwbaar de meting is.`

Copy patterns should explain household meaning first, source limitation second, setup last.

## 22. Explicit answers to all design questions

1. Primary hierarchy: Story/generic context, selected floor, quiet plan or fallback, selected-room detail, diagnostics/actions.
2. Story entry selects affected floor/room for room Stories; broad Stories open overview unless one floor/room dominates.
3. Yes, a Story banner remains visible, collapsible but not disappearing during Story context.
4. Polygons always show room identity when possible and state marker when non-normal/selected.
5. No. Temperatures are selective, not universal.
6. Humidity appears only when relevant to humidity comfort, moisture Stories, too-dry state, or selected detail.
7. Attention uses warm tint/strong border/`!`; Unknown uses dashed/hatch/`?`; stale uses dotted/clock/muted opacity; selected uses high-contrast focus ring independent of those states.
8. Desktop room detail: persistent right side panel.
9. Tablet: adaptive side sheet in landscape, bottom sheet in portrait.
10. Phone: list-first overview plus full-screen room detail; plan optional/secondary.
11. Multiple-room comparison is deferred from V1.
12. Duplicate temperature sources: plan shows configured comfort value if trusted; detail may show both and explain disagreement.
13. Shared Evohome zones appear as limitations/warnings in detail and before controls, not as canonical room identity.
14. Heating controls may appear only in selected-room detail.
15. V1 controls: temporary warmer, temporary cooler, resume schedule, fixed bounded durations/steps.
16. Pending disables controls with status; success gives bounded result; failure explains current planning remains active and offers safe retry if appropriate.
17. Incomplete floor plan uses hybrid plan/list with explicit missing/excluded groups.
18. No floor plan uses non-spatial climate overview with room cards and setup callout.
19. Story for undrawn room opens room detail via fallback and says the room is not on the trusted plan.
20. Fallback hierarchy: trusted plan, hybrid plan/list, room list/floor cards, Story-specific detail, generic overview, setup callout.
21. Unknown blocks false reassurance by replacing comfortable state/value confidence with visible uncertainty in banner, selector, polygon/list, and detail.
22. See density table in section 17.
23. Restraint: Story first, selective values, no raw sensors, diagnostics behind disclosure, actions in detail only, accessible list as explanation not telemetry grid.
24. Final consolidation must freeze runtime IA, state language, label/value rules, fallback hierarchy, viewport ownership, action boundaries, and HA/FamilyBoard ownership boundary.
25. Evidence concept is too complex/low value: users use list only and ignore plan, cannot explain state markers, plan setup blocks adoption, support burden around overlays exceeds climate insight, room actions are rarely used, or Unknown/fallback states dominate normal households.

## 23. V1 runtime scope

V1 includes Story-context entry, one selected floor, trusted asset rendering, room polygon selection, restrained labels, per-room states, synchronized room list, desktop side panel, adaptive tablet/phone fallback, freshness/Unknown/conflict treatment, safe bounded heating controls in detail when validated, and robust fallback for incomplete/no plans.

## 24. Deferred runtime capabilities

Deferred: room comparison, timeline/history graphs, heat maps, sensor dashboard density toggles, multi-floor simultaneous view, predictive preheating, schedule editing, arbitrary climate controls, provider debugging UI, raw entity display, automatic overlay trust, live construction/editor tools inside runtime, and advanced tablet drawing-like gestures.

## 25. Risks and unresolved questions

- State taxonomy may still be too large; consolidation should freeze the smallest set that explains Stories.
- Shared-zone control warnings need careful copy so users understand scope without technical HVAC language.
- Unknown/stale frequency may determine whether the experience feels helpful or broken.
- Floor-plan setup effort may outweigh value for households with few climate sensors.
- The final implementation needs VisualReview climate fixtures before screenshots or viewport validation can be meaningful.
- Exact thresholds for stale/conflict/comfortable are intentionally not defined here and belong to later climate interpretation design.

## 26. Inputs guaranteed for the final consolidation prompt

The final consolidation can rely on these runtime decisions:

- Story context first.
- One floor at a time.
- Quiet spatial floor plan where trusted.
- Floor selector with attention/Unknown/completeness markers.
- Room labels are restrained; room name and state marker beat telemetry.
- Temperature is selective; humidity is contextual; target temperature is detail-only.
- Unknown, stale, contradictory, and review-needed states visibly prevent false reassurance.
- Desktop uses selected-room side panel; tablet uses adaptive sheet; phone uses list-first/full-screen detail fallback.
- Heating actions are safe, bounded, and detail-only.
- Fallback hierarchy keeps climate useful without complete floor plans.
- Runtime uses sanitized shared editor/runtime coordinates and never trusts replacement overlays automatically.
- FamilyBoard remains canonical owner of floors/rooms/assets/overlays; Home Assistant remains mapping/data/control provider.
