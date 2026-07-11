# Home Automation Page Research

Date: 2026-07-11  
Repository: HomeOps / FamilyBoard  
Working names considered: `Woning`, `Huis`, `Thuisbeheer`

## 1. Executive summary

FamilyBoard can justify a future standalone home automation page if the page is treated as a calm household status and action surface, not as a Home Assistant entity browser. The strongest V1 is a climate-and-heating page centered on:

- overall indoor climate status;
- per-room comfort;
- humidity attention;
- Evohome heating status;
- simple temporary heating adjustments where Home Assistant exposes a safe semantic control;
- clear page-local attention states for rooms needing action.

This V1 is valuable with the known initial capabilities because temperature sensors, humidity sensors, and Evohome together answer frequent household questions: which room is uncomfortable, whether a child's bedroom needs attention, whether heating is active, and whether a simple heating adjustment is useful. Energy, laundry, safety, cameras, EV charging, and presence should not be included in V1 until Home Assistant provides semantic states for them.

The recommended page organization is attention-first with domain sections underneath. Permanent space should go to the overall house state, current attention items, and a compact room comfort grid. Heating controls should be visible only for rooms where control is available. Appliance, energy, safety, and vehicle cards should appear only when capabilities exist and the state is active, abnormal, or genuinely decision-supporting.

FamilyBoard must consume semantic Home Assistant-prepared capabilities such as `RoomComfortState`, `HeatingZoneState`, and `HeatingControl`. FamilyBoard should not infer laundry activity from power thresholds, map solar inverter entities, reason from raw MQTT topics, or expose Home Assistant entity names.

## 2. Scope and exclusions

### In scope

- One future standalone home automation page.
- Functional page purpose and user value.
- Capability inventory and capability contracts.
- Household questions the page should answer.
- Candidate features and graceful degradation.
- Suggested household additions that unlock specific user-facing features.
- Conceptual page hierarchy and text wireframes.
- V1, V2, and later recommendations.

### Explicitly out of scope

- Production code, UI, persistence, APIs, Home Assistant integration, migrations, tests, screenshots, or binary assets.
- Integration into the existing Home page.
- Agenda integration.
- Automatic task creation.
- Notifications outside this page.
- Weekly Reset, Shopping, Motivation, or Mijn Pagina integration.
- Changes to navigation.
- Raw Home Assistant entity selection as the starting point.
- Home Assistant vendor-specific inference inside FamilyBoard.

Future cross-page possibilities are listed only in [Out-of-scope future possibilities](#out-of-scope-future-possibilities).

## 3. Repository findings

### Product structure

FamilyBoard is currently a household dashboard and workspace application with Home as a summary-first glassboard, dedicated Agenda, Tasks, Shopping/Lists, Motivation, member, Settings, and Weekly Reset surfaces. The current state document describes Home as the primary summary-first household dashboard with date/time, family strip, Agenda summary, quick capture, and list summary; dedicated Agenda and Lists pages remain the full-management areas.

The backend is an ASP.NET Core modular monolith with PostgreSQL and OpenAPI/NSwag contract generation. Current domains include calendar events and sources, family members, known people, lists/shopping, motivation, tasks, weather, weekly reset, widget layouts, households, and visual review fixtures.

### Existing page patterns

- Home is summary-first and bounded; full management belongs on dedicated domain pages.
- Agenda, Tasks, Shopping, and Motivation are durable top-level workspaces.
- Settings hosts administration and configuration-like features.
- Family/member concepts are household presentation entities, not login identities or permission subjects.
- Recent UI copy is largely Dutch for product-facing labels, for example `Boodschappen`, `Taken`, and `Bekenden` in relevant surfaces.

### Terminology

`Home` is already the main dashboard concept. Because a new home-automation page using the English label `Home` would collide with the existing product meaning, the neutral Dutch working names are preferable. This report uses `Woning` as the clearest working label because it describes the physical house rather than the FamilyBoard start page. `Huis` is friendlier but more likely to read as the existing Home dashboard. `Thuisbeheer` sounds too administrative for a daily household status page.

### Existing home, energy, climate, weather, appliance, device, integration, and Home Assistant concepts

- Weather exists as a backend and frontend domain. Its product direction is decision-oriented rather than meteorological; the Home header answers practical clothing/rain decisions and the detail dialog explains the recommendation.
- The repository contains no confirmed Home Assistant domain, no home automation API, no indoor climate domain, no energy domain, no appliance domain, no camera/security domain, and no EV/charger domain.
- Existing calendar source management demonstrates a normalized-source pattern, but the Home Automation page should not copy source-management UX into the daily page.
- Widget layout concepts exist, but data models are not supposed to become widget-specific.

### Design-system and page-density constraints

FamilyBoard is dashboard-like and touch-friendly. Existing research says Home should avoid dense telemetry, use summaries, cap visible rows, and navigate to dedicated pages for full management. The repository instructions require primary product pages to fit within the viewport and avoid browser-level vertical page scrolling. Therefore the future `Woning` page must reserve fixed regions, cap visible cards, use compact summaries, and place secondary details inside dialogs or bounded internal panels.

### Authorization, adult, and admin patterns

No production authentication or role system is currently confirmed. Family members are not users or permission subjects. Settings is the natural administrative surface, but this report does not design Settings integration. For V1, heating controls should be inherently safe, constrained, reversible, and understandable rather than dependent on unimplemented adult/admin authorization.

## 4. Known household capability inventory

Confidence definitions:

- **confirmed**: explicitly known or currently present in repository/product state.
- **likely**: strongly expected from the prompt or current setup, but not verified as an implemented FamilyBoard capability.
- **possible**: previously discussed or plausible, but not confirmed.
- **absent**: repository inspection found no current FamilyBoard domain/capability.
- **unknown**: not enough evidence.

| Capability | Household level | Read/control | Likely source | Confidence | Semantic data type | Freshness/reliability concerns | Required relationships |
|---|---:|---|---|---|---|---|---|
| `RoomTemperature` | room | read | Temperature sensors, Evohome zones | likely | number with unit | Must distinguish stale values and source timestamp; duplicate sensors may disagree | Room identity, source priority |
| `RoomHumidity` | room | read | Humidity sensors | likely | number with unit | Humidity sensors can drift; stale data should not trigger warnings | Room identity |
| `RoomComfortState` | room | read | Home Assistant semantic aggregate | absent | composite state / enum | Requires thresholds per room type and season; avoid false urgency | Room identity, comfort policy |
| `IndoorClimateSummary` | whole home | read | Home Assistant aggregate | absent | composite state | Depends on completeness of room mappings | Included room set |
| `HeatingZoneState` | room/zone | read | Evohome through Home Assistant | likely | state enum | Evohome zones may not match FamilyBoard rooms exactly | Zone-room mapping |
| `HeatingTargetTemperature` | room/zone | read | Evohome | likely | number with unit | Target may be schedule-driven or temporary override | Zone-room mapping, schedule mode |
| `HeatingControl` | room/zone | control | Evohome via Home Assistant | possible | command | Must expose safe temporary changes only; command success can be delayed | Controllable zone, allowed range/duration |
| `HeatingDemandState` | room/zone | read | Evohome or HA template | possible | boolean/number | Demand percentage may be technical; user-facing state should be simple | Zone-room mapping |
| `OutdoorWeatherSummary` | whole home | read | Existing weather domain or HA weather | confirmed for FamilyBoard weather domain; unknown for this page | composite state | Do not duplicate weather app; use only if it improves indoor interpretation | Household location/time |
| `ApplianceIsRunning` | appliance | read | HA integration, smart plug, template sensor | possible | boolean | Power-threshold inference belongs in HA; debounce required | Appliance identity, room/area |
| `LaundryCycleState` | appliance | read | HA integration/template | possible | state enum | Finished state needs retention until acknowledged/unloaded if supported | Appliance identity |
| `LaundryRemainingTime` | appliance | read | Appliance API/template | possible | duration/timestamp | Often unavailable or unreliable | Appliance identity |
| `ApplianceProblemState` | appliance | read | Appliance API/template | possible | state enum | Must avoid raw error codes unless translated by HA | Appliance identity |
| `CurrentSolarProduction` | whole home | read | Solar inverter integration | possible | number with unit | Cloud integrations can be delayed; instant production fluctuates | Energy system identity |
| `CurrentHomeConsumption` | whole home | read | P1/smart meter/energy monitor | possible | number with unit | Needs clear import/export semantics | Meter identity |
| `GridFlowState` | whole home | read | P1/smart meter + HA aggregate | possible | composite state | Import/export direction must be reliable and fresh | Meter identity |
| `EnergySurplusState` | whole home | read | HA aggregate from solar/consumption/battery | absent | state enum/number | Avoid noisy changes; hysteresis needed | Solar + consumption sources |
| `BatteryState` | whole home | read | Home battery integration | possible | composite state | Battery systems expose many technical metrics; reduce to state of charge and flow | Battery identity |
| `VehicleChargingState` | vehicle/appliance | read/control | EV charger or vehicle integration | possible | composite state/command | Vehicle APIs can be stale; readiness estimates are uncertain | Vehicle/charger identity |
| `WindowOpenState` | room/opening | read | Door/window contacts | possible | boolean/composite | Battery/contact reliability; room mapping required | Opening-to-room mapping |
| `DoorLockState` | whole home/door | read/control | Smart lock | unknown | state enum/command | High safety risk; controls should likely remain out of FamilyBoard initially | Door identity, authorization |
| `HomePresenceState` | whole home/person-related | read | HA presence, phones, network | possible | composite state | Privacy and reliability concerns; not a substitute for authorization | Person-to-presence mapping |
| `CameraAttentionState` | room/area | read | Hikvision/HA camera analytics | possible | enum/composite | Raw streams are too heavy; event relevance must be filtered | Camera/area mapping |
| `WaterLeakState` | room/area | read | Leak sensors | possible | boolean/enum | High urgency; false positives possible but acceptable if clear | Sensor-to-area mapping |
| `AirQualityState` | room | read | CO2/air quality sensors | possible | number with unit/composite | Thresholds differ by sensor and room | Room identity, thresholds |
| `DeviceHealthState` | device/capability | read | HA diagnostics | possible | enum | Technical by default; only show if it affects page trust | Capability/device mapping |

## 5. Assumptions and unknowns

### Confirmed or strongly expected starting point

- Home Assistant is intended as the future technical integration layer.
- Temperature sensors exist.
- Humidity sensors exist.
- Evohome exists.
- Evohome exposes room or zone temperature.
- Evohome may allow heating control per zone.
- FamilyBoard already has family members and household context.
- FamilyBoard has weather functionality, but whether weather should appear inside `Woning` is a product decision, not an assumption.

### Possible but not confirmed

- Solar-panel production.
- Home electricity consumption.
- Home battery state.
- EV or charger state.
- Washing-machine or dryer activity.
- Door/window contacts.
- Presence.
- Lighting.
- Hikvision/security cameras.
- Other household appliances.

### Unknowns that affect V1 implementation later

- Exact room list and whether it already exists outside family-member contexts.
- Whether Evohome zones map one-to-one to FamilyBoard rooms.
- Whether temperature and humidity sensors are in the same rooms as Evohome zones.
- Whether Evohome control is safe and reliable enough through Home Assistant.
- Whether the household wants Celsius-only display and which comfort thresholds are preferred per room type.
- Whether Dutch page naming should be `Woning`, `Huis`, or another term after navigation naming is revisited.

## 6. Functional household questions

The page should answer household questions, not display every measurement.

### V1 climate/heating questions

- Is the house generally comfortable right now?
- Which room needs attention?
- Is a child's bedroom too cold, too warm, or too humid?
- Are any rooms becoming uncomfortable because humidity is high?
- Where is heating currently active or trying to heat?
- Is a room cold because the target is low, because heating is off, or because it has not warmed yet?
- Can I safely adjust a room for a short period?
- Is a reading unavailable or too old to trust?

### V2/later household operations questions

- Which appliances are currently active?
- Has the washing machine or dryer finished?
- Is there a useful low-effort action now, such as unloading laundry?
- Is the house importing or exporting electricity?
- Is there current solar surplus?
- Is the home battery low, charging, or discharging?
- Is the EV charging and likely to be ready?
- Is a window open while heating is active?
- Is there a safety condition that needs attention, such as water leak or unusual door/window state?
- Is anything unusual enough to deserve page-level attention?

### Questions that should not drive this page

- What is every Home Assistant entity doing?
- What are all raw sensor values and diagnostic attributes?
- What are historical charts for every measurement?
- Which MQTT topic, Zigbee device, vendor API, or integration produced this state?
- Which device battery is low if it does not affect a user-facing capability?

## 7. Candidate features by domain

### Household summary

**Feature: Overall house state**  
User problem: a family member wants to know whether the house is broadly okay without reading cards.  
Question answered: “Is anything in the house requiring attention?”  
Value: high.  
Frequency: many times daily.  
Placement: top-left or full-width header summary.  
Visibility: always visible.  
Required capabilities: at least one domain summary such as `IndoorClimateSummary`.  
Optional capabilities: energy, appliance, safety, EV summaries.  
Relationships: included rooms and enabled domains.  
Reliability: summary must mark partial data.  
Controls: none directly; actions live in feature cards.  
Degraded behavior: “Klimaat deels bekend” with visible known room count.  
Unavailable behavior: “Woningstatus niet beschikbaar” and no false warnings.  
HA responsibility: provide semantic summaries and freshness.  
FamilyBoard responsibility: prioritize and phrase the household meaning.  
Additional additions: none for climate V1; later additions per domain.  
Phase: V1.

**Feature: Attention rail**  
User problem: important states can be missed in a grid of normal cards.  
Question answered: “What should I look at first?”  
Value: high.  
Frequency: daily, but should often be quiet.  
Placement: near top, below summary.  
Visibility: conditionally visible; reserve a compact normal state.  
Required capabilities: domain-specific attention states such as `RoomComfortState`.  
Optional capabilities: leak, window-while-heating, laundry finished.  
Relationships: capability-to-room/appliance labels.  
Reliability: stale/unknown warnings separate from environmental warnings.  
Controls: direct safe action where available, e.g. “Verwarm 1 uur”.  
Degraded behavior: show fewer attention types as capabilities are missing.  
Unavailable behavior: show data-health attention only if the page would otherwise mislead.  
HA responsibility: normalize raw state into attention-ready capability states.  
FamilyBoard responsibility: rank attention by household importance.  
Additional additions: semantic attention templates in HA.  
Phase: V1.

### Climate

**Feature: Indoor climate overview**  
User problem: room readings are hard to interpret one by one.  
Question answered: “Is the indoor climate comfortable overall?”  
Value: high.  
Frequency: daily.  
Placement: primary domain card.  
Visibility: always visible in V1.  
Required capabilities: `RoomTemperature`, `RoomHumidity`, room mappings.  
Optional capabilities: `RoomComfortState`, outdoor weather context, air quality.  
Relationships: room identity, room type, comfort thresholds.  
Reliability: values should be recent enough for household decisions, ideally less than 15 minutes old for climate.  
Controls: none.  
Degraded behavior: show temperature-only or humidity-only per room with clear gaps.  
Unavailable behavior: show unavailable room chips rather than removing rooms silently.  
HA responsibility: expose clean room readings and optional comfort classification.  
FamilyBoard responsibility: display room comfort, not sensor implementation.  
Additional additions: room mapping and comfort thresholds; no new hardware if sensors already cover rooms.  
Phase: V1.

**Feature: Per-room comfort grid**  
User problem: family members need to know which rooms are okay and which need attention.  
Question answered: “Which room is too cold, too warm, too humid, or unknown?”  
Value: high.  
Frequency: daily.  
Placement: main middle grid.  
Visibility: always visible but bounded to primary rooms; overflow into detail.  
Required capabilities: `RoomComfortState` or fallback `RoomTemperature`/`RoomHumidity`.  
Optional capabilities: air quality, window open, heating demand.  
Relationships: room identity and display order.  
Reliability: stale data should downgrade confidence.  
Controls: optional “adjust heat” if zone control exists.  
Degraded behavior: show measured values without comfort label when thresholds are missing.  
Unavailable behavior: show “geen recente meting” for configured rooms.  
HA responsibility: provide semantic state or readings with freshness.  
FamilyBoard responsibility: bound display and explain abnormal states.  
Additional additions: add sensors to important rooms lacking coverage.  
Phase: V1.

**Feature: Humidity attention**  
User problem: high humidity can signal ventilation needs but raw percentages are easy to ignore.  
Question answered: “Which room should be aired or watched?”  
Value: high in bathrooms/bedrooms; medium elsewhere.  
Frequency: daily/seasonal.  
Placement: attention rail plus room chips.  
Visibility: conditionally visible when abnormal; humidity remains secondary in room cards.  
Required capabilities: `RoomHumidity` and thresholds.  
Optional capabilities: window state, ventilation state, outdoor humidity/weather.  
Relationships: room type and threshold policy.  
Reliability: avoid warning on stale humidity; hysteresis to avoid flapping.  
Controls: none in V1.  
Degraded behavior: show humidity value without advice if thresholds are missing.  
Unavailable behavior: no humidity attention for rooms without sensor.  
HA responsibility: derive humidity attention state if possible.  
FamilyBoard responsibility: phrase practical advice, e.g. “Badkamer vochtig”.  
Additional additions: humidity sensors in bedrooms/bathroom if missing.  
Phase: V1.

### Heating

**Feature: Evohome heating status**  
User problem: families want to know why a room is cold and whether heating is active.  
Question answered: “Which rooms are heating, set back, or at target?”  
Value: high.  
Frequency: daily in heating season.  
Placement: adjacent to climate grid or integrated into room cards.  
Visibility: always visible in V1 during heating season; compact otherwise.  
Required capabilities: `HeatingZoneState`, `HeatingTargetTemperature`.  
Optional capabilities: `HeatingDemandState`, schedule mode.  
Relationships: Evohome zone to FamilyBoard room mapping.  
Reliability: command and state delays should be visible.  
Controls: none for read-only version.  
Degraded behavior: show target temperature only where state unavailable.  
Unavailable behavior: show read-only climate without heating controls.  
HA responsibility: normalize Evohome zones and modes.  
FamilyBoard responsibility: avoid exposing Evohome technical mode names if confusing.  
Additional additions: HA Evohome mapping and semantic zone templates.  
Phase: V1.

**Feature: Simple temporary heating control**  
User problem: someone wants to warm a room briefly without opening a technical thermostat app.  
Question answered: “Can I make this room warmer for a short time?”  
Value: high if reliable; medium if controls are rarely used.  
Frequency: weekly/daily in winter.  
Placement: room detail or selected room action, not global dense controls.  
Visibility: conditionally visible for controllable zones.  
Required capabilities: `HeatingControl`.  
Optional capabilities: allowed presets, boost duration, schedule resume time.  
Relationships: controllable zone, min/max, allowed command policy.  
Reliability: command acknowledgement required; stale control state disables actions.  
Controls: safe temporary boost/lower/resume schedule only.  
Degraded behavior: read-only target and instruction to use thermostat app.  
Unavailable behavior: hide controls, not the room.  
HA responsibility: enforce command ranges, duration, and actual integration mechanics.  
FamilyBoard responsibility: present safe, reversible commands and pending state.  
Additional additions: HA scripts/services wrapping Evohome commands into semantic controls.  
Phase: V1 if reliable; otherwise V2.

### Appliances

**Feature: Active appliances**  
User problem: family wants to know whether laundry/dryer/dishwasher is running.  
Question answered: “Which household appliances are currently active?”  
Value: medium-high once data exists.  
Frequency: daily/weekly.  
Placement: secondary domain card.  
Visibility: conditionally visible when active, finished, or in error; detail-only when idle.  
Required capabilities: `ApplianceIsRunning`.  
Optional capabilities: `LaundryCycleState`, remaining time, door state.  
Relationships: appliance identity and friendly label.  
Reliability: avoid false finish/running transitions with debounce.  
Controls: usually none.  
Degraded behavior: show “Wasmachine draait” only.  
Unavailable behavior: omit appliance domain.  
HA responsibility: infer running/finished from device API, power, MQTT, or template.  
FamilyBoard responsibility: show only meaningful states.  
Additional additions: HA template binary sensor or power-measuring smart plug.  
Phase: V2.

### Energy

**Feature: Energy now**  
User problem: households want to know whether now is a good time to run energy-heavy appliances.  
Question answered: “Is there solar surplus or are we importing electricity?”  
Value: medium-high with solar/usage data; low without controllable habits.  
Frequency: daily if solar/EV/laundry decisions matter.  
Placement: secondary card.  
Visibility: conditionally visible when surplus, high import, battery low, or EV charging; compact normal state.  
Required capabilities: `CurrentSolarProduction`, `CurrentHomeConsumption`, `GridFlowState`.  
Optional capabilities: `BatteryState`, tariff, forecast.  
Relationships: energy system identity.  
Reliability: near-real-time preferred, but smooth/hysteresis required.  
Controls: none in early versions.  
Degraded behavior: show solar-only production as context, not action advice.  
Unavailable behavior: omit energy domain.  
HA responsibility: aggregate meters and derive import/export/surplus.  
FamilyBoard responsibility: translate into household action timing.  
Additional additions: P1 meter integration, solar inverter integration.  
Phase: V2 if capabilities exist; otherwise later.

### Vehicle charging

**Feature: EV charging readiness**  
User problem: know whether the car is charging and likely ready.  
Question answered: “Is the EV charging and is there a problem?”  
Value: medium if household has EV; high on commute days.  
Frequency: daily/weekly.  
Placement: secondary card, visible only when plugged in, charging, below target, or in error.  
Visibility: conditionally visible.  
Required capabilities: `VehicleChargingState`.  
Optional capabilities: target state of charge, departure time, charger power, range estimate.  
Relationships: vehicle/charger identity.  
Reliability: stale cloud vehicle data must be prominent.  
Controls: likely not in FamilyBoard initially except safe start/stop if explicitly configured.  
Degraded behavior: “Auto aangesloten / laadt” without readiness estimate.  
Unavailable behavior: omit.  
HA responsibility: normalize vehicle/charger state.  
FamilyBoard responsibility: show readiness and problems, not charger telemetry.  
Additional additions: charger or vehicle HA integration.  
Phase: later.

### Safety/security

**Feature: Open window while heating**  
User problem: heating can be wasted when a window is open.  
Question answered: “Is heating active while a window is open?”  
Value: high if contacts exist.  
Frequency: seasonal.  
Placement: attention rail.  
Visibility: abnormal only.  
Required capabilities: `WindowOpenState`, `HeatingZoneState`.  
Optional capabilities: room temperature drop.  
Relationships: window-to-room and heating-zone-to-room mapping.  
Reliability: contacts must be fresh enough to trust.  
Controls: no direct control.  
Degraded behavior: open-window status only.  
Unavailable behavior: no warning.  
HA responsibility: combine window and heating states into semantic attention.  
FamilyBoard responsibility: show the action-oriented message.  
Additional additions: contact sensors.  
Phase: V2/later.

**Feature: Leak attention**  
User problem: leaks require immediate local attention.  
Question answered: “Is there a water leak?”  
Value: high.  
Frequency: rare.  
Placement: top attention rail.  
Visibility: abnormal only.  
Required capabilities: `WaterLeakState`.  
Optional capabilities: last seen, sensor health.  
Relationships: sensor-to-area mapping.  
Reliability: high; show stale sensor health separately if it affects trust.  
Controls: none.  
Degraded behavior: area-level leak state.  
Unavailable behavior: omit safety domain.  
HA responsibility: expose semantic leak state.  
FamilyBoard responsibility: make it impossible to miss inside the page.  
Additional additions: leak sensors in high-risk places.  
Phase: later, but high value if hardware exists.

**Feature: Security camera status**  
User problem: raw camera feeds are not a family dashboard workflow.  
Question answered: only “is there a relevant security attention state?”  
Value: low for V1; potential later.  
Frequency: low.  
Placement: detail or abnormal-only attention.  
Visibility: abnormal only, no always-on feeds.  
Required capabilities: `CameraAttentionState`.  
Optional capabilities: snapshot/event time.  
Relationships: camera-to-area mapping.  
Reliability: event filtering must be strong.  
Controls: none.  
Degraded behavior: do not show camera domain.  
Unavailable behavior: omit.  
HA responsibility: convert camera events into semantic attention.  
FamilyBoard responsibility: avoid surveillance dashboard behavior.  
Additional additions: camera integration and event filtering.  
Phase: reject for V1; later only if clear household workflow emerges.

## 8. Detailed feature requirement matrix

| Feature | User value | Required capabilities | Current readiness | Missing additions | Page behavior | Recommended phase |
|---|---|---|---|---|---|---|
| Overall house state | High | `IndoorClimateSummary`; later other domain summaries | Likely for climate after semantic HA work | HA aggregate summary | Always visible calm status | V1 |
| Attention rail | High | `RoomComfortState`, stale/unavailable semantics | Requires semantic HA state | Attention mapping/templates | Visible when attention exists, compact normal state | V1 |
| Indoor climate overview | High | `RoomTemperature`, `RoomHumidity`, room mappings | Likely sensors exist; FamilyBoard domain absent | Room mapping, freshness | Always visible | V1 |
| Per-room comfort grid | High | `RoomComfortState` or temperature/humidity fallback | Likely data, missing semantic comfort | Threshold policy | Always visible, bounded | V1 |
| Humidity attention | High/medium | `RoomHumidity`, humidity thresholds | Likely data, missing thresholds | Threshold config; sensors in key rooms if absent | Abnormal emphasized; value secondary | V1 |
| Evohome heating status | High | `HeatingZoneState`, `HeatingTargetTemperature` | Likely source, missing semantic contract | Zone-room mapping | Integrated into room cards | V1 |
| Temporary heating control | High/medium | `HeatingControl` | Possible | HA safe control wrapper | Detail/room action only | V1 if reliable, else V2 |
| Active appliances | Medium-high | `ApplianceIsRunning` | Possible, not confirmed | HA template/integration/smart plug | Active/finished/error only | V2 |
| Laundry enhanced | Medium-high | `LaundryCycleState` | Possible, not confirmed | Appliance integration/template | Active/finished/error only | V2 |
| Energy now | Medium-high | `CurrentSolarProduction`, `CurrentHomeConsumption`, `GridFlowState` | Possible, not confirmed | P1/solar integrations | Compact action-timing card | V2/later |
| Battery state | Medium | `BatteryState` | Possible, not confirmed | Battery integration | Only if charging/low/backup relevant | later |
| EV charging readiness | Medium | `VehicleChargingState` | Possible, not confirmed | EV/charger integration | Conditional card | later |
| Window open while heating | High if hardware exists | `WindowOpenState`, `HeatingZoneState` | Possible, not confirmed | Contact sensors + room mapping | Attention only | V2/later |
| Leak attention | High | `WaterLeakState` | Possible, not confirmed | Leak sensors | Attention only | later |
| Camera attention | Low/conditional | `CameraAttentionState` | Possible, not confirmed | Camera event filtering | Abnormal only; no raw feed | later/reject V1 |
| Lighting control | Low for this page | Semantic room scene controls | Possible | Scene definitions | Not a default card | reject V1 |
| Technical device health | Low | `DeviceHealthState` | Possible | HA diagnostics | Only if capability is untrustworthy | reject as normal feature |

## 9. Semantic capability contracts

Contracts are product-facing. They must not include Home Assistant entity IDs, MQTT topics, vendor names, or raw integration implementation details.

### `RoomReading`

- Meaning: current measured environmental value for a named room.
- Shape: `{ roomId, roomName, kind: temperature|humidity|co2|airQuality, value, unit, measuredAt, freshness: fresh|stale|unknown, confidence: normal|low }`.
- Minimum freshness: climate values should usually be fresh within 15 minutes; stale after 30-60 minutes depending on source.
- Unknown/unavailable: `value` nullable with `freshness` and reason.
- Context: room identity, display order, optional room type.
- Read/control: read-only.
- Enables: climate overview, comfort grid, humidity attention fallback.
- Fallback acceptable: yes; temperature-only V1 can exist but should mark missing humidity.

### `RoomComfortState`

- Meaning: Home Assistant-prepared interpretation of whether a room is comfortable.
- Shape: `{ roomId, state: comfortable|tooCold|tooWarm|tooHumid|tooDry|poorAir|mixed|unknown|unavailable, severity: normal|notice|attention|urgent, primaryReason, readings[], updatedAt }`.
- Minimum freshness: derived from included readings; stale readings must downgrade to unknown/stale rather than warning.
- Unknown/unavailable: explicit `unknown` or `unavailable` state.
- Context: thresholds and room type must be configured outside the page.
- Read/control: read-only.
- Enables: overall summary, attention rail, room grid.
- Fallback acceptable: yes, use `RoomReading` and simple display without semantic advice.

### `IndoorClimateSummary`

- Meaning: aggregate status for enabled rooms.
- Shape: `{ state: good|mixed|attention|unknown|unavailable, roomCounts, attentionRooms[], updatedAt, completeness }`.
- Minimum freshness: all included room states should be fresh or explicitly excluded.
- Unknown/unavailable: show partial completeness.
- Context: included rooms and priority rooms.
- Read/control: read-only.
- Enables: overall house state.
- Fallback acceptable: yes, FamilyBoard can summarize `RoomComfortState` values if HA provides them.

### `HeatingZoneState`

- Meaning: user-understandable heating status for a room or zone.
- Shape: `{ zoneId, roomId, state: off|scheduled|heating|atTarget|setback|manualOverride|unknown|unavailable, currentTemperature, targetTemperature, modeLabel, updatedAt }`.
- Minimum freshness: 5-15 minutes preferred; stale command state should be explicit.
- Unknown/unavailable: show read-only climate without heating state.
- Context: zone-to-room mapping.
- Read/control: read-only.
- Enables: heating status, room explanation.
- Fallback acceptable: target temperature only.

### `HeatingControl`

- Meaning: safe temporary adjustment of a mapped heating zone.
- Shape: `{ zoneId, roomId, supportedCommands: boost|setTemporaryTarget|resumeSchedule, minTemperature, maxTemperature, allowedDurations, pendingCommand? }` plus command results.
- Minimum freshness: controls disabled if current zone state is stale or command channel unavailable.
- Unknown/unavailable: hide or disable commands with plain explanation.
- Context: controllable zone and safe policy.
- Read/control: controllable.
- Enables: temporary heating adjustment.
- Fallback acceptable: yes, read-only heating V1 remains useful.

### `ApplianceActivityState`

- Meaning: semantic activity of a household appliance.
- Shape: `{ applianceId, label, kind: washingMachine|dryer|dishwasher|other, state: idle|running|paused|finished|error|unknown|unavailable, startedAt?, finishedAt?, updatedAt }`.
- Minimum freshness: 1-5 minutes for running/finished; transitions need debounce.
- Unknown/unavailable: omit from default page or show in detail if configured.
- Context: appliance identity and display label.
- Read/control: read-only.
- Enables: active appliances, laundry basic/enhanced.
- Fallback acceptable: basic boolean `ApplianceIsRunning`.

### `LaundryCycleState`

- Meaning: richer laundry appliance lifecycle.
- Shape: `{ applianceId, state: idle|running|paused|finished|doorOpen|unloaded|error|unknown, cycleName?, remainingDuration?, expectedCompletionAt?, doorState?, updatedAt }`.
- Minimum freshness: 1-5 minutes; remaining time may be lower confidence.
- Unknown/unavailable: degrade to activity state.
- Context: laundry appliance identity.
- Read/control: read-only initially.
- Enables: laundry enhanced/advanced.
- Fallback acceptable: yes.

### `EnergyFlowState`

- Meaning: current household energy direction and magnitude.
- Shape: `{ state: importing|exporting|selfPowered|unknown|unavailable, homeConsumptionWatts?, solarProductionWatts?, gridWatts?, updatedAt, confidence }`.
- Minimum freshness: ideally under 1 minute for “now” decisions; stale after 5-15 minutes.
- Unknown/unavailable: hide action advice; show unavailable only if energy section configured.
- Context: energy source completeness.
- Read/control: read-only.
- Enables: energy now, surplus advice.
- Fallback acceptable: solar-only display is context, not full feature.

### `BatteryState`

- Meaning: household battery level and flow in user terms.
- Shape: `{ state: charging|discharging|full|low|reserve|unknown|unavailable, stateOfChargePercent, powerWatts?, updatedAt }`.
- Minimum freshness: 1-5 minutes.
- Unknown/unavailable: omit or mark in energy detail.
- Context: battery identity.
- Read/control: read-only initially.
- Enables: energy enhanced.
- Fallback acceptable: yes, energy page can omit battery.

### `VehicleChargingState`

- Meaning: vehicle or charger readiness state.
- Shape: `{ vehicleId, label, state: unplugged|pluggedIn|charging|paused|complete|error|unknown|unavailable, batteryPercent?, targetPercent?, estimatedReadyAt?, updatedAt }`.
- Minimum freshness: 1-15 minutes depending on source; stale cloud data must be marked.
- Unknown/unavailable: omit or show “status onbekend” only in detail.
- Context: vehicle/charger identity and optional target.
- Read/control: read-only initially; controls are optional later.
- Enables: EV charging readiness.
- Fallback acceptable: plugged-in/charging basic.

### `OpeningState`

- Meaning: whether a door/window relevant to household state is open.
- Shape: `{ openingId, label, roomId?, kind: window|door, state: open|closed|unknown|unavailable, updatedAt }`.
- Minimum freshness: event-driven; last seen should be reliable.
- Unknown/unavailable: no heating-waste warning from unknown contacts.
- Context: opening-to-room mapping.
- Read/control: read-only.
- Enables: open window while heating, leaving-home future possibilities.
- Fallback acceptable: no.

### `PageAttentionState`

- Meaning: page-level prioritized household attention item derived from semantic states.
- Shape: `{ attentionId, domain, severity: notice|attention|urgent, title, explanation, affectedContext, recommendedAction?, updatedAt }`.
- Minimum freshness: inherits source state freshness.
- Unknown/unavailable: data-quality attentions must be separate from household danger/comfort attentions.
- Context: domain enabled and display label.
- Read/control: read-only with optional action link/control.
- Enables: attention rail and overall summary.
- Fallback acceptable: yes, each domain can generate local attention if contracts are already semantic.

## 10. Feature tiers and graceful degradation

### Climate tiers

- **Climate basic** requires `RoomTemperature` and room mapping. Shows current temperature per configured room and unknown/stale states. No comfort advice.
- **Climate useful V1** adds `RoomHumidity` and thresholds. Shows comfort state, too-humid/too-dry attention, and room summary.
- **Climate enhanced** adds air quality/CO2 and outdoor context. Shows “ventilate” or “watch bedroom air” style advice if HA provides semantic state.

### Heating tiers

- **Heating read-only** requires `HeatingZoneState` and `HeatingTargetTemperature`. Shows target and status per zone.
- **Heating V1 control** adds `HeatingControl` safe temporary commands. Shows boost/resume actions in room detail.
- **Heating enhanced** adds open-window and schedule context. Shows “window open while heating” and better explanation of cold rooms.

### Laundry tiers

- **Laundry basic** requires `ApplianceIsRunning`. Shows “washing machine running”.
- **Laundry enhanced** requires `LaundryCycleState`. Shows idle/running/paused/finished/error/unknown.
- **Laundry advanced** adds remaining time, cycle name, and door/unloaded state. Shows expected completion and “ready but not unloaded” if HA can derive it.

### Energy tiers

- **Energy basic** requires `CurrentSolarProduction` or `CurrentHomeConsumption`. Shows context only, not advice.
- **Energy useful** requires `EnergyFlowState` with solar and consumption. Shows importing/exporting/surplus.
- **Energy enhanced** adds `BatteryState`, tariffs, or forecast. Shows “good time to run appliance” only if reliable and not noisy.

### EV tiers

- **EV basic** requires charging/unplugged state. Shows charging status when active.
- **EV useful** adds battery percent and target. Shows readiness.
- **EV advanced** adds departure time and charger controls. FamilyBoard should only expose safe configured controls.

### Safety/security tiers

- **Safety basic** requires semantic abnormal states, such as leak detected. Shows urgent page attention.
- **Safety contextual** combines opening and heating states. Shows heating-waste/open-window attention.
- **Security later** may show filtered camera/security attention, not raw camera feeds.

## 11. New-page information hierarchy

Recommended hierarchy:

1. **Overall house state**: one calm sentence with completeness, e.g. “Binnenklimaat is rustig” or “2 kamers vragen aandacht”.
2. **Attention states**: top ranked actionable issues, not raw device warnings.
3. **Climate and heating**: primary V1 domain with room comfort grid and simple heating state.
4. **Active/finished appliances**: later, only when active/finished/error.
5. **Energy**: later, compact decision-supporting status, not charts by default.
6. **Safety attention**: abnormal-only, visually strong but rare.
7. **Detail panels/dialogs**: room details, data freshness, optional secondary values, raw-ish explanation filtered into household language.

The page should be organized primarily by attention state and domain, not by room alone. A room-only organization makes inactive normal rooms consume too much permanent space and becomes a floor plan/entity browser. A pure domain-only organization can bury urgent states. Attention-first plus domain cards gives a useful default.

Permanent space should be limited to the summary, attention area, and climate/heating grid in V1. Inactive appliances, normal EV state, detailed energy charts, camera feeds, and technical diagnostics should not receive permanent space.

## 12. Text wireframes

### V1 desktop/laptop concept

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ Woning                                      Laatst bijgewerkt 10:42        │
│ Binnenklimaat grotendeels rustig · 1 kamer vraagt aandacht                 │
├────────────────────────────────────────────────────────────────────────────┤
│ Aandacht                                                                  │
│ [Slaapkamer Noor te vochtig · 68% · Ventileer als dat kan] [Bekijk kamer] │
├──────────────────────────────────────────────┬─────────────────────────────┤
│ Klimaat per kamer                            │ Verwarming                  │
│ ┌──────────────┐ ┌──────────────┐            │ Woonkamer 20.5° → 20°       │
│ │ Woonkamer    │ │ Keuken       │            │ op temperatuur              │
│ │ 20.8° 48% OK │ │ 19.6° 51% OK │            │                             │
│ └──────────────┘ └──────────────┘            │ Slaapkamer Noor 17.4° → 18° │
│ ┌──────────────┐ ┌──────────────┐            │ verwarmt                    │
│ │ Slaapkamer N │ │ Badkamer     │            │ [1 uur warmer] [Schema]     │
│ │ 17.4° 68% !  │ │ 21.1° --     │            │                             │
│ └──────────────┘ └──────────────┘            │ Niet overal regelbaar       │
├──────────────────────────────────────────────┴─────────────────────────────┤
│ Later enabled domains                                                       │
│ [Wasmachine klaar] [Zonne-overschot nu] [Raam open terwijl verwarming aan] │
│ Hidden entirely when unavailable or normal unless configured as important.  │
└────────────────────────────────────────────────────────────────────────────┘
```

### V1 room detail dialog

```text
┌──────────────────────── Slaapkamer Noor ────────────────────────┐
│ Status: te vochtig                                               │
│ Temperatuur 17.4°C · luchtvochtigheid 68% · meting 3 min geleden │
│ Verwarming: verwarmt naar 18°C                                   │
│ Acties: [1 uur naar 19°C] [Schema hervatten]                     │
│ Waarom: vochtigheid is hoger dan de ingestelde slaapkamerrichtlijn│
│ Niet getoond: technische sensornaam, Evohome entity id, MQTT data │
└──────────────────────────────────────────────────────────────────┘
```

### Later richer concept

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ Woning · Alles rustig behalve wasmachine klaar en badkamer vochtig         │
├───────────────────────┬─────────────────────┬──────────────────────────────┤
│ Aandacht              │ Klimaat              │ Actief in huis               │
│ - Wasmachine klaar    │ 6 kamers · 1 vochtig │ Wasmachine klaar             │
│ - Badkamer vochtig    │ Verwarming actief 2  │ Droger draait nog 24 min     │
├───────────────────────┴─────────────────────┴──────────────────────────────┤
│ Energie: exporteert 1.2 kW · goed moment voor verbruik                     │
│ Veiligheid: geen meldingen                                                  │
└────────────────────────────────────────────────────────────────────────────┘
```

Viewport behavior: the V1 page should fit a common desktop/laptop viewport by reserving a compact header, a bounded attention row, and a two-column content area. Room cards should have a maximum visible count with `+N kamers` leading to detail if the configured room count exceeds the available grid. Later domains must be compact, conditional rows rather than unbounded cards. Browser-level vertical page scrolling should be treated as a regression.

## 13. Configuration implications derived from the features

The selected features imply these future configuration concepts, without designing the settings UI:

- Room catalog or room mapping: FamilyBoard room labels and display order.
- Sensor-to-room assignment: provided semantically by Home Assistant or a FamilyBoard capability registry, not by raw entity names in the daily page.
- Evohome zone-to-room mapping.
- Comfort policy per room or room type: temperature range, humidity range, optional quiet hours/night thresholds.
- Enabled domains: climate/heating first; appliance/energy/safety/EV later.
- Attention policy: which states become page-level attention, severity, and display priority.
- Control policy: allowed heating commands, target range, duration, and whether a command is visible.
- Capability health: freshness thresholds and how stale/unavailable data is represented.
- Friendly appliance/vehicle labels and whether idle devices should be hidden.

Configuration should live outside the normal daily `Woning` experience. The daily page should show meaningful household states, not setup mechanics.

## 14. Suggested household additions and features they unlock

| Addition | Missing functional question enabled | Required semantic capability | Possible implementation categories | Software-only HA config possible? | Hardware required? | Value | Dependencies | Initial roadmap? |
|---|---|---|---|---|---|---|---|---|
| HA room/zone semantic templates | Which room needs attention? | `RoomComfortState`, `IndoorClimateSummary` | HA helpers/templates, labels/areas, thresholds | Yes if sensors already exist | No | High | Room mapping | Yes, V1 prerequisite |
| Evohome semantic control wrapper | Can I warm this room briefly? | `HeatingControl` | HA script/service wrapper, allowed range/duration | Yes if Evohome control works | No | High/medium | Zone mapping | Yes if reliable |
| Humidity thresholds by room type | Is this humidity actually a problem? | `RoomComfortState` | HA template or future FamilyBoard config | Yes | No | High | Humidity sensors | Yes |
| Extra humidity/temperature sensors in priority rooms | Is a child's bedroom comfortable? | `RoomReading` | Zigbee/Z-Wave/Wi-Fi/MQTT sensors through HA | No | Yes if room lacks sensor | High | HA integration | Yes only if coverage gaps exist |
| Power-measuring smart plug for washing machine/dryer | Is laundry running or finished? | `ApplianceActivityState` | Smart plug + HA template with debounce | Partial; hardware needed unless appliance API exists | Yes if no appliance API | High/medium | Appliance identity | V2 |
| Appliance vendor integration | What cycle state/remaining time? | `LaundryCycleState` | HA appliance integration/cloud/local API | Yes if device supports it | No new hardware | Medium | Device support | V2 if available |
| P1/smart meter integration | Are we importing/exporting? | `EnergyFlowState` | HA P1 integration, smart meter dongle | No if no meter bridge | Usually yes | High/medium | Meter access | V2 |
| Solar inverter integration | Is there solar production/surplus? | `CurrentSolarProduction`, `EnergyFlowState` | HA inverter integration | Yes if network/cloud accessible | Maybe no | Medium/high | Solar system | V2 if present |
| Door/window contacts | Is a window open while heating? | `OpeningState` | Contact sensors through HA | No | Yes | Medium/high | Heating zone mapping | V2/later |
| CO2/air-quality sensors | Should a room be ventilated? | `RoomComfortState` enhanced | Air-quality sensors through HA | No | Yes | Medium | Room mapping | Later |
| Water-leak sensors | Is there an urgent leak? | `WaterLeakState` | Leak sensors through HA | No | Yes | High but rare | Area mapping | Later |
| EV charger integration | Is car charging/ready? | `VehicleChargingState` | Charger or vehicle HA integration | Yes if existing integration supports it | Maybe no | Medium | Vehicle/charger identity | Later |
| Presence integration | Is anyone home? | `HomePresenceState` | HA presence, phone/network integration | Maybe | Maybe no | Low/conditional | Privacy policy | Not initial |
| Camera event filtering | Is there a relevant security event? | `CameraAttentionState` | Hikvision/HA events + filtering | Yes if cameras integrated | No if existing | Low/conditional | Strong filtering | Not initial |

## 15. V1 recommendation

V1 should be a standalone `Woning` page centered on indoor climate and Evohome heating. It should include:

1. Overall indoor climate status.
2. Per-room comfort grid using temperature and humidity.
3. Humidity attention for rooms outside configured thresholds.
4. Evohome heating status per mapped room/zone.
5. Optional simple temporary heating control only where Home Assistant exposes a safe semantic `HeatingControl`.
6. Explicit unknown/stale/unavailable states.
7. No energy, appliance, safety, vehicle, camera, lighting, or presence features until their semantic capabilities exist.

This is sufficient to justify a standalone page if at least several meaningful rooms have temperature/humidity and Evohome zone mapping. It is not sufficient if the available data covers only one room or if readings cannot be mapped to recognizable household rooms. The standalone value comes from answering “which room needs attention?” and “can I adjust heating?” in one calm place.

Minimum V1 capability set:

- `RoomReading` for temperature in priority rooms.
- `RoomReading` for humidity in priority rooms, or explicit missing humidity fallback.
- `RoomComfortState` or a clear plan for HA to derive it.
- `HeatingZoneState` and `HeatingTargetTemperature` for Evohome zones.
- Room/zone mapping and display order.
- Freshness/unavailable semantics.

Optional V1 enhancement:

- `HeatingControl` safe temporary boost/resume commands.

## 16. V2 and later roadmap

### V2 candidates

- Laundry/appliance activity if HA provides `ApplianceActivityState` or `LaundryCycleState`.
- Energy “now” if solar + consumption + grid flow are semantically available.
- Window-open-while-heating attention if contacts exist.
- Climate enhanced with CO2/air quality if sensors exist.

### Later candidates

- EV charging readiness.
- Home battery state.
- Leak attention.
- Security/camera filtered attention.
- Presence-based summaries only after privacy and reliability decisions.
- Safe scene-like household actions only if they answer clear household questions.

## 17. Rejected or low-value ideas

- Generic Home Assistant entity browser.
- Raw sensor tables.
- Raw MQTT/Zigbee/vendor API diagnostics.
- Permanent camera feeds.
- Always-visible idle appliance cards.
- Lighting toggle dashboard by default.
- Historical charts as primary content.
- Device battery/health list as normal daily content.
- Showing heating demand percentage as a primary user feature.
- Exposing both every independent sensor value and every Evohome value without resolving meaning.
- Energy telemetry without action-oriented import/export/surplus interpretation.

## 18. Risks and open questions

### Risks

- Duplicate temperature sources may confuse users if FamilyBoard shows both without explanation.
- Evohome zone names may not match household room names.
- Heating controls can create trust problems if command acknowledgement is slow.
- Comfort thresholds can be too generic; bedrooms, bathrooms, and living spaces need different interpretation.
- Too many later domains can crowd the page and violate viewport-fit rules.
- Home Assistant semantic templates can drift from FamilyBoard expectations if contracts are not explicit.

### Open questions

1. Which rooms are priority rooms for V1?
2. Which temperature source should be the comfort source when Evohome and an independent room sensor disagree?
3. Does the household want humidity warnings for all rooms or only bathrooms/bedrooms?
4. Are temporary Evohome overrides reliable enough for FamilyBoard touch controls?
5. What Dutch page name best fits the eventual navigation model: `Woning`, `Huis`, or another term?
6. Should room comfort thresholds be managed in Home Assistant, FamilyBoard settings, or a shared capability configuration layer?
7. What is the minimum freshness threshold acceptable for climate and heating readings?

## 19. Decisions investigated

1. **Should the page be organized primarily by domain, room, or attention state?**  
   Attention-first with domain sections is recommended. Room context is essential, but a room-first page risks becoming a floor-plan/entity dashboard. Domain-only risks hiding urgent items.

2. **Which information deserves permanent space?**  
   Overall status, attention area, and V1 climate/heating room grid. Later domains get permanent space only if they have frequent actionable value.

3. **Which information should appear only while active or abnormal?**  
   Laundry, appliances, EV charging, safety warnings, window-open-heating conflicts, camera/security events, and most energy advice.

4. **Which controls are safe and understandable enough for FamilyBoard?**  
   Temporary heating boost/lower/resume schedule with constrained duration/range. Possibly later appliance acknowledgement or charger start/stop only if explicitly safe.

5. **Which controls belong in Home Assistant instead?**  
   Integration setup, entity selection, automations, thermostat schedules, detailed charger settings, security/camera configuration, power-threshold tuning, and device diagnostics.

6. **How should duplicate temperature sources be handled?**  
   Home Assistant should nominate one semantic comfort temperature per room and optionally expose source confidence. FamilyBoard may show a small “measured by room sensor” style explanation in detail, but not two competing primary temperatures.

7. **Should FamilyBoard show both comfort temperature and heating-control temperature?**  
   Yes only when they answer different questions: current comfort temperature and heating target. The room card can show “20.1° · doel 20°”. It should not expose multiple raw current temperatures.

8. **What is the minimum viable climate feature set with current known capabilities?**  
   Room temperature, room humidity, room mapping, freshness, and simple comfort status. Evohome read-only heating status makes it substantially stronger.

9. **Can an initial V1 be valuable with only temperature, humidity, and Evohome?**  
   Yes, if several meaningful rooms are covered and mapped. It answers daily comfort/heating questions well enough for a standalone page.

10. **Which candidate features should be rejected because they are merely technical telemetry?**  
    Entity lists, raw sensor tables, demand percentages, device battery lists, raw inverter metrics, MQTT topics, and camera feeds.

11. **How should unavailable, stale, or contradictory data be represented?**  
    As explicit trust states: “geen recente meting”, “deels bekend”, “meting spreekt verwarming tegen”. Unknown data must not produce comfort warnings.

12. **Which feature additions provide greatest user value for smallest household modification?**  
    HA semantic room/comfort templates, Evohome zone mapping, humidity thresholds, and possibly a washing-machine activity template if power data or smart plug is easy to add.

13. **How should page-level attention states differ from raw device warnings?**  
    Page-level attention describes a household condition and action, e.g. “Slaapkamer te vochtig”. Raw warnings describe devices, e.g. “sensor battery low”. Device warnings appear only if they make a household state untrustworthy.

14. **Which semantic states must Home Assistant prepare before FamilyBoard can use them?**  
    At minimum `RoomComfortState`, `HeatingZoneState`, freshness/unavailable states, and optional `HeatingControl`. Later: `ApplianceActivityState`, `EnergyFlowState`, `OpeningState`, `WaterLeakState`, `VehicleChargingState`.

15. **What configuration model follows naturally from the selected features?**  
    Room catalog/mapping, capability enablement, comfort thresholds, zone mapping, attention policy, safe control policy, freshness thresholds, and friendly labels.

## 20. Home Assistant vs FamilyBoard responsibility split

| Area | Home Assistant responsibility | FamilyBoard responsibility |
|---|---|---|
| Raw integration | Vendor APIs, MQTT, Zigbee, Evohome, inverter, charger, camera, smart plugs | None |
| Inference | Power thresholds, debounce, room comfort templates, heating/window correlation | Consume semantic result only |
| Capability freshness | Source timestamps, stale/unavailable flags | Display trust state clearly |
| Naming/mapping | Provide stable semantic room/appliance/zone identifiers | Use friendly labels and ordering |
| Controls | Safe scripts/services, allowed ranges, command acknowledgement | Present constrained user actions |
| Attention | Prepare semantic states where possible | Rank and phrase household attention |
| Diagnostics | Technical entity/device health | Show only when user-facing capability is affected |

## 21. Out-of-scope future possibilities

These are intentionally not designed here:

- Home summary banner for urgent house attention.
- Agenda weather or climate context.
- Automatic Tasks from laundry, ventilation, leaks, or maintenance.
- Shopping suggestions based on appliance consumables.
- Motivation rewards for household actions.
- Mijn Pagina personalization.
- Push notifications or external alerts.
- Settings UI for capability mapping.

## 22. Clear recommended next step

Create a V1 product specification for the standalone `Woning` page that freezes the climate/heating scope, defines the exact room card states, selects the semantic contracts needed from Home Assistant, and performs a viewport-first layout analysis before any implementation. In parallel, prepare Home Assistant semantic prototypes for `RoomComfortState`, `HeatingZoneState`, and optional `HeatingControl` using the existing temperature, humidity, and Evohome setup.

## 23. Validation checklist

- No production code was changed.
- No existing page integration was designed or implemented.
- All feature proposals include capability requirements.
- Raw technical data is not treated as the user-facing feature.
- Home Assistant and FamilyBoard responsibilities are separated.
- Assumptions and unknowns are visibly marked.
- V1 is concrete enough to become a later implementation specification.
- Final git diff should contain only this report file.
