# FamilyBoard-Guided Home Assistant Setup Model

Date: 2026-07-12
Repository: HomeOps / FamilyBoard
Baseline: previous House Brain, Household Story, and Woning research reports are accepted product direction.
Scope: research and product definition only; no production code, backend architecture, persistence, APIs, migrations, tests, screenshots, binary assets, or Home Assistant configuration.

## 1. Executive summary

FamilyBoard should guide Home Assistant setup from **desired Household Stories**, not from discovered entities. The key correction for this slice is that Home Assistant is not installed or configured yet. FamilyBoard therefore cannot inspect an existing Home Assistant setup and infer value from whatever entities happen to exist. It must define the semantic household contract first, then help the user configure Home Assistant to satisfy that contract.

The stable setup model should be:

> Desired Household Story → semantic capability requirements → Home Assistant setup route → real-world validation → Story enabled.

FamilyBoard's role is to say what the household needs in ordinary terms: "tell me when the washing machine is finished", "tell me when a room will not be comfortable by bedtime", "explain whether current power use is expected", or "explain why the home battery is preserved while the work vehicle charges." Home Assistant's role is to expose reliable states, integrate devices, run templates/helpers/automations, and execute control loops where control is needed.

The setup guide should not start with "select a Home Assistant entity." It should start with "which FamilyBoard capability or Story do you want to enable?" Technical concepts appear only when needed to complete setup. This keeps Woning Story-first and prevents FamilyBoard from becoming a generic Home Assistant administration console.

The accepted reasoning chain remains:

> Observations → household knowledge and context → House Brain → Household Stories → Woning and deep dives.

There is no separate Household Assessment layer in this model. The canonical user-facing Story types remain: **Steady**, **Attention**, **Opportunity**, **Ready**, and **Unknown**.

The minimum useful Home Assistant setup for Woning is not all planned equipment. It is a small validated foundation: Home Assistant running, rooms/floors mapped, temperature and humidity exposed with freshness, Evohome zone and target states mapped, and one or two high-confidence operational packs such as laundry and P1 electricity. Presence, water, mobility, battery, charger, and cross-capability Stories add value later but should not block the first usable Woning release.

## 2. Accepted product direction

This report accepts the prior product direction:

- FamilyBoard is not a Home Assistant dashboard, entity browser, or automation editor.
- The main Woning page remains Story-first.
- Deep dives explain Stories; they do not replace Stories with raw device pages.
- House Brain turns observations into household knowledge, context, and Stories.
- Story types are limited to Steady, Attention, Opportunity, Ready, and Unknown.
- Unknown is a first-class responsible outcome, not a failure state to hide.
- Presence is supporting context, not proof of occupancy and not a permanent Woning section.
- Home Assistant is the technical runtime; FamilyBoard defines household intent and semantic requirements.
- FamilyBoard must not introduce a Household Assessment layer.

The correction is operational: because Home Assistant is not installed yet, FamilyBoard must define the desired semantic capabilities before any integration mapping. Hardware ownership, integration availability, semantic configuration, validation, and Story enablement are separate milestones.

## 3. Why FamilyBoard-guided setup is needed

A typical Home Assistant setup begins with devices and entities. That is powerful for technical users but misaligned with FamilyBoard's value. A family does not want to decide whether `sensor.washer_power` or `binary_sensor.washer_door` is important. The family wants to know whether laundry blocks the evening, whether bedrooms will be comfortable, whether water use looks unusual, or whether the Peugeot should be charged before a meaningful trip.

FamilyBoard-guided setup is needed because:

- the household has no Home Assistant installation yet;
- raw entity discovery would bias the product toward available devices rather than desired household outcomes;
- multiple technical routes can satisfy the same Story;
- hardware ownership does not prove that a semantic capability works;
- native integrations may expose vendor-specific states that need normalization;
- derived capabilities require templates, helpers, automations, or scripts;
- many Stories require freshness, confidence, and real-world validation;
- unsupported or weak evidence should produce Unknown rather than misleading reassurance.

The setup guide should make capabilities visible as household value: "this smart plug unlocks reliable laundry finished Stories" is clearer than "add a power sensor." This also makes missing hardware explainable without turning setup into a device-shopping checklist.

## 4. Story-first setup model

The canonical setup journey should be:

1. **Choose the Story or capability pack.** The user selects a household outcome such as climate comfort, laundry finished, electricity explanation, water anomaly, adult phone presence, EV readiness, or battery/charger policy explanation.
2. **Explain what the Story means.** FamilyBoard describes the household value, the Story types it may produce, and what it will never claim.
3. **Show required semantic capabilities.** The guide lists required states in family language first and technical requirements second.
4. **Check Home Assistant readiness.** If Home Assistant is available, FamilyBoard can inspect candidate entities only within the selected capability context. If Home Assistant is not available, it shows the required configuration route.
5. **Offer supported setup routes.** Native integration, derived capability, combined capability, hardware missing, or unsupported.
6. **Guide configuration.** FamilyBoard may suggest names, state vocabulary, templates, helpers, automations, or manual integration steps, but should not silently write arbitrary configuration.
7. **Run real-world validation.** Validation must observe expected household transitions, stale/unavailable behavior, and recovery.
8. **Show confidence and limitations.** The setup result is validated, partially validated, degraded, unknown, unsupported, or blocked by missing hardware.
9. **Enable eligible Stories.** Only validated capabilities enable Stories.
10. **Resume and revalidate over time.** Setup can pause, continue later, re-run after configuration changes, and degrade if freshness or reliability drops.

This improves the suggested journey by adding two gates: a **semantic readiness gate** before configuration and a **Story enablement gate** after validation. FamilyBoard can inspect entities only after the user has chosen the household capability; this prevents the experience from becoming an entity browser.

## 5. Setup route taxonomy

| Route | Definition | FamilyBoard behavior | Example |
| --- | --- | --- | --- |
| Native integration | Home Assistant exposes a sufficiently semantic state through an existing integration. | Validate, map vocabulary, test freshness, then enable Story. | Evohome zone state and target temperature; P1 import/export if exposed clearly. |
| Derived capability | Home Assistant exposes raw states but needs helper/template/automation/script logic to create the semantic capability. | Define expected output, suggest configuration, require validation. | Washer power → template state `idle/running/finished/error/unknown`. |
| Combined capability | Multiple sources are combined for higher confidence. | Define precedence, conflict behavior, confidence, and fallback. | Washer WiFi cycle state + smart-plug power corroboration. |
| Hardware missing | The semantic capability cannot be produced with current equipment. | Explain which Story the hardware unlocks and keep Story unavailable. | Reliable appliance state before smart plug if WiFi integration is absent or weak. |
| Unsupported | The capability cannot currently be provided reliably, safely, or within allowed equipment. | Say so clearly; do not create weak Stories. | Child presence, door/window state, smart-lock security, camera-based occupancy. |

## 6. Capability-pack definitions

Each capability pack should be defined with the following product fields:

- Household Stories enabled.
- Household value.
- Required semantic capability.
- Minimum valid states.
- Optional richer states.
- Freshness requirements.
- Unknown/unavailable behavior.
- Minimum validation tests.
- Possible Home Assistant setup routes.
- Whether software-only setup may be enough.
- Whether hardware is required.
- Current readiness.
- Planned readiness.
- Setup complexity.
- Failure risks.
- Whether FamilyBoard can generate or suggest configuration.
- Whether the user must complete setup manually.

The pack is not enabled because hardware exists. It is enabled only when the semantic capability is configured and validated.

## 7. Validation philosophy

Validation must prove the household claim, not merely that an entity exists. FamilyBoard should validate:

- normal state;
- meaningful transition;
- action-relevant state;
- unavailable/stale state;
- recovery after restart or reconnect;
- conflict behavior when multiple sources disagree;
- freshness windows;
- Story output and limitations.

Unavailable must never be mapped to finished, safe, away, no-flow, or ready. Unknown should be used whenever the system cannot responsibly judge. Confidence should degrade over time when readings become stale, transitions are missed, integrations fail, device firmware changes, Home Assistant restarts, entity names change, or validation has not been repeated after configuration changes.

## 8. Climate setup pack

### Stories enabled

- Attention: room needs attention.
- Attention: bathroom remains humid.
- Attention: room will not be comfortable by bedtime.
- Ready: ready for tonight.
- Unknown: climate cannot be judged.
- Steady: climate is normal enough to ignore.

### Household value

Climate Stories help the family avoid uncomfortable bedrooms, persistent bathroom humidity, and heating surprises without checking each room or Evohome zone.

### Required semantic capabilities

| Capability | Minimum valid states | Optional richer states | Freshness |
| --- | --- | --- | --- |
| Room identity | stable room name, floor, purpose | bedtime relevance, family member association | configuration-owned, not sensor freshness |
| Room temperature | numeric °C, timestamp, source | trend, comfort band, sensor confidence | usually recent enough within 10-20 minutes; stricter for active heating decisions |
| Room humidity | numeric %, timestamp, source | trend, ventilation recommendation, bathroom decay profile | usually recent enough within 10-20 minutes |
| Evohome zone state | zone identity, heating/idle/off/unknown where available | demand %, mode, schedule mode | recent enough for control interpretation |
| Evohome target temperature | numeric target °C, timestamp | next scheduled target, temporary override expiry | recent enough for bedtime projection |
| Freshness/unknown | fresh/stale/unavailable | source-specific reason | required |

### Duplicate temperature sources

FamilyBoard should separate **comfort temperature** from **heating-control temperature**:

- Comfort temperature is the best representation of what the family feels in the room.
- Heating-control temperature is the value Evohome uses to control heat.
- If one sensor serves both roles, it can be mapped once with both meanings.
- If duplicate sources exist, setup must ask which source represents comfort and which source drives heating.
- Deep dives may show disagreements, but the Woning Story should use the configured comfort source for household comfort claims.
- If sources disagree beyond a configured tolerance, climate confidence degrades and the deep dive explains the conflict.

### Floor and room mapping

The four-floor climate deep dive is enabled by a household room model, not by entity names. Setup should ask the user to define floors and rooms, then map sensors and Evohome zones to rooms:

1. Define floor names in household language.
2. Define rooms per floor.
3. Mark room purposes, such as bedroom, bathroom, living space, utility, or other.
4. Mark rooms relevant for bedtime readiness.
5. Map temperature sources.
6. Map humidity sources.
7. Map Evohome zones and target temperatures.
8. Validate each room's fresh reading and zone mapping.

### Setup routes

- Native integration: Evohome zone state and target temperature if exposed by Home Assistant.
- Native integration: temperature and humidity sensors if already exposed by a supported sensor integration.
- Derived capability: room comfort state from temperature/humidity thresholds, weather, time, and room purpose.
- Combined capability: comfort source plus Evohome target for bedtime projection.
- Hardware missing: if a room has no temperature/humidity source and no meaningful proxy.
- Unsupported: claims about room occupancy, window state, or ventilation hardware unless explicitly available later.

### Validation

Minimum validation tests:

- every configured room has a fresh temperature source or is explicitly excluded;
- every humidity-sensitive room has a fresh humidity source or cannot produce humidity Stories;
- Evohome zone target changes are visible in Home Assistant;
- stale sensor simulation or observed unavailability produces Unknown, not Steady;
- duplicate source conflict produces degraded confidence;
- bedtime projection identifies at least one configured bedtime-relevant room and explains assumptions.

### Readiness and risks

Current hardware exists for Evohome, temperature sensors, and humidity sensors, but Home Assistant is not installed and semantic configuration is not validated. Software-only setup may be enough for the first climate pack if sensors and Evohome integrate reliably. Risks include duplicate sensors, room/zone naming mismatches, stale readings, and overclaiming comfort from heating-control data alone.

## 9. Laundry setup pack

### Stories enabled

- Attention or Steady: washing machine running.
- Attention: washing machine finished.
- Attention or Steady: dryer running.
- Attention: dryer finished.
- Unknown: appliance state unknown.
- Ready/Steady: laundry state corroborated by smart plug.

### Household value

Laundry Stories reduce forgotten wet laundry, clarify whether a cycle is actually running, and improve confidence when WiFi appliance state and power behavior agree.

### Required semantic capabilities

| Capability | Minimum valid states | Optional richer states | Freshness |
| --- | --- | --- | --- |
| Appliance identity | washer/dryer, friendly name | location, usual cycle labels | configuration-owned |
| Cycle state | idle, running, paused/interrupted, finished, error, unknown, unavailable | cycle name, phase, door state | usually fresh within minutes during a cycle |
| Remaining time | not required | minutes remaining, finish ETA | fresh during active cycle |
| Power state | idle draw, active draw, finished drop, unavailable | watts, threshold confidence, trend | fresh within 1-2 minutes when power route is used |
| Freshness | fresh/stale/unavailable | reason | required |

Unavailable must not map to finished. Finished requires an observed transition from running to finished or a native finished state that has been validated.

### Routes

**WiFi appliance integration only** may be enough if Home Assistant exposes stable cycle state, error, remaining time, and unavailable states. It requires real-world validation because vendor states vary.

**Smart plug only** is a derived capability. It requires power thresholds and transition logic. It can identify running and likely finished but may struggle with low-power pauses, anti-crease modes, standby behavior, and network/power outages.

**Combined WiFi + smart plug** is the preferred planned route for high confidence. WiFi provides semantic cycle context; smart plug corroborates whether the appliance is actually drawing power. Conflicts degrade confidence and may produce Unknown rather than finished.

### Validation sequence

1. Idle: verify idle state and normal standby power.
2. Start: verify transition from idle to starting/running.
3. Running: verify sustained running state and fresh updates.
4. Pause or interruption: verify paused/interrupted does not become finished.
5. Successful completion: verify finished only after a real running-to-complete transition.
6. Power loss or integration unavailable: verify unavailable maps to Unknown or degraded, never finished.
7. Recovery after Home Assistant restart: verify state reconstructs safely; if prior transition is lost, require Unknown until stable evidence returns.

### Readiness and risks

Current household has WiFi-connected washer and dryer. Planned hardware includes power-measuring smart plugs for both. Current readiness is partial: hardware exists for WiFi route, but HA integration support and semantic quality are unverified. Planned readiness becomes high with smart-plug corroboration. Failure risks include vendor cloud outages, low-power pauses, finished-state latching, smart plug disconnection, and appliance replacement.

FamilyBoard can suggest template logic and validation checklists. The user must install integrations, add smart plugs when available, run real cycles, and confirm observed states.

## 10. Electricity setup pack

### Stories enabled

- Steady: current power use is understandable.
- Attention: power use remains unusually high.
- Opportunity: good energy moment.
- Unknown: energy cannot be judged.

### Household value

Electricity Stories explain whether current household power use is expected and identify optional moments for flexible loads when there is enough evidence.

### Required semantic capabilities

| Capability | Minimum valid states | Optional richer states | Freshness |
| --- | --- | --- | --- |
| Current import | numeric W or kW, timestamp | phase detail | near-real-time, usually seconds to a few minutes |
| Current export | numeric W or kW, timestamp | phase detail | near-real-time |
| Total household consumption | derived or measured estimate | known load breakdown | near-real-time |
| Recent baseline | rolling recent normal for this household | day/time/weather context | learned over time |
| Known-appliance contribution | not required | washer/dryer/charger/battery power | aligned to source freshness |
| Tariff/forecast context | optional | price window, weather forecast | source-specific |

P1 alone can support grid import/export and a rough understanding of net grid behavior. P1 alone cannot prove solar production, appliance-level cause, battery behavior, or which device is consuming power. Without confirmed solar integration, FamilyBoard must not claim solar production. A "good energy moment" from P1 alone must be framed carefully, such as low import or export if export is actually measured, not "solar peak" unless solar production is confirmed.

### Setup routes

- Native integration: P1 meter import/export and cumulative readings.
- Derived capability: recent baseline, unusual sustained import, net household power interpretation.
- Combined capability: known laundry, charger, or battery contributions once those packs exist.
- Hardware missing or unconfirmed: solar production and appliance-specific electricity explanations unless corresponding integrations exist.

### Validation

Minimum validation tests:

- observe stable no-major-load baseline;
- turn on a known high-load device and observe import/consumption response;
- observe export only if the meter actually reports export;
- simulate or observe stale P1 data and confirm Unknown;
- compare story explanation against known-appliance states without inventing unobserved causes.

### Readiness and risks

Current P1 electricity meter hardware exists. HA integration availability is likely but must be confirmed after installation. Semantic capability and baseline are not configured. Setup complexity is moderate. Risks include net-meter interpretation mistakes, stale data, confusing import/export signs, and overclaiming solar or appliance causes.

## 11. Water setup pack

### Stories enabled

- Steady: water use is normal.
- Attention: continuous water use needs checking.
- Unknown: water state cannot be judged.
- Attention with context: water use while both parents are probably away.

### Household value

Water Stories warn about unusual continuous water use without falsely declaring leaks from weak evidence.

### Required semantic capabilities

| Capability | Minimum valid states | Optional richer states | Freshness |
| --- | --- | --- | --- |
| Current flow or pulse-derived flow | flow/no-flow/unknown or numeric flow | liters per minute | fresh enough to detect ongoing flow |
| Cumulative total | numeric total | daily total, rolling intervals | source-specific, must update reliably |
| Flow duration | continuous duration estimate | interruption-tolerant sessions | derived from fresh flow |
| Recent pattern | normal short use, shower-like use, appliance-fill-like use | learned household profiles | learned over time |
| Adult presence context | optional probable home/away/unknown | confidence and last seen | must remain probabilistic |

FamilyBoard should avoid declaring a leak unless there is sustained continuous flow beyond normal household patterns, fresh meter data, and no better explanation. Even then, the Story should say "continuous water use needs checking," not "leak detected," unless future hardware and validation support stronger claims.

### Setup routes

- Native integration: water meter exposes flow and cumulative total.
- Derived capability: pulse-derived flow duration and continuous-use classifier.
- Combined capability: flow anomaly plus adult presence context from Ubiquiti phones.
- Hardware missing: if current water meter cannot provide timely flow or cumulative readings to Home Assistant.

### Validation

Real household validation:

- short tap use creates a short flow event;
- shower creates longer but explainable flow;
- washing-machine fill creates intermittent appliance-like flow;
- no-flow period stays no-flow;
- low continuous flow test, if safely possible, produces Attention after threshold;
- temporarily unavailable meter data produces Unknown, not normal/no-flow.

### Readiness and risks

Current water meter exists, but HA integration, flow granularity, and freshness are unknown. Software-only setup may be enough if the meter exposes timely readings. Hardware or adapter work may be required if it only provides delayed totals. Risks include overclaiming leaks, delayed meter updates, pulse noise, and presence context being mistaken for proof.

## 12. Presence setup pack

### Stories enabled

- Context: presence contributes to water or laundry explanation.
- Unknown: presence is unknown.
- Context: adult probably home.
- Context: adult probably away.

Presentation boundary:

- persistent presence belongs on Mom and Dad avatars on Home;
- Woning uses presence only as contextual evidence;
- there is no permanent presence section on Woning;
- child presence is not inferred.

### Required semantic capabilities

| Capability | Minimum valid states | Optional richer states | Freshness |
| --- | --- | --- | --- |
| Mom phone mapping | one or more known device identifiers | device aliases | manually configured |
| Dad phone mapping | one or more known device identifiers | device aliases | manually configured |
| Detection state | connected, not detected, unknown, unavailable | access point, network | minutes-level with stale handling |
| Last seen | timestamp | roaming history | required |
| Confidence | probable home, probably away, unknown | reason and decay | derived from detection age |
| Stale state | fresh/stale/unavailable | outage reason | required |

Both phones absent is not proof nobody is home. A phone left at home is not proof the adult is home. Ubiquiti presence is probabilistic support only.

### Setup routes

- Native integration: Ubiquiti network client/device tracker states.
- Derived capability: adult probable presence with confidence and stale handling.
- Combined capability: presence context combined with water, laundry, or mobility explanations.
- Unsupported: child presence, room occupancy, camera-based occupancy, precise home occupancy.

### Validation

Minimum validation tests:

- phone connected;
- phone temporarily disconnected;
- phone roaming between access points;
- phone left at home scenario documented as limitation;
- one adult away;
- both phones absent produces probable-adult-away context, not nobody-home proof;
- Ubiquiti unavailable produces Unknown/stale.

### Readiness and risks

Ubiquiti infrastructure and Mom/Dad phones exist. HA integration is not installed. Software-only setup may be enough after HA. Complexity is moderate because confidence and limitations must be explained well. Risks include privacy concerns, MAC randomization, device sleep, guest networks, and overinterpretation.

## 13. Mobility setup pack

### Stories enabled

- Attention: Peugeot needs charging before a meaningful trip.
- Unknown: Peugeot readiness unknown.
- Unknown/Attention: charger state unavailable.
- Future: second EV readiness later.

### Required semantic capabilities

| Capability | Minimum valid states | Optional richer states | Freshness |
| --- | --- | --- | --- |
| Vehicle charge state | SoC %, timestamp | range estimate | must be recent enough for readiness |
| Plugged-in state | plugged/unplugged/unknown | location | recent |
| Charging state | charging/not charging/complete/unknown | charge rate | recent |
| Charge target | optional | target %, planned departure target | source-specific |
| Meaningful trip context | special appointment/departure where known | distance estimate | calendar-derived but incomplete |
| Charger state | optional until Zaptec exists | available/charging/error | recent |

Calendar may provide special appointments or departures. Calendar must not be treated as a complete day plan or presence proof. Peugeot integration support is unverified until technically confirmed.

### Setup routes

- Native integration: Peugeot vehicle state if supported and validated.
- Derived capability: readiness relative to meaningful trip context and configured thresholds.
- Combined capability: vehicle state plus charger state once Zaptec exists.
- Hardware/planned: second EV and Zaptec Go 2 are planned and should not block current Peugeot Stories.
- Unsupported: reliable trip readiness without fresh vehicle SoC or meaningful trip context.

### Validation

Minimum validation tests:

- observe fresh SoC;
- observe plugged and unplugged transitions;
- observe charging and not charging;
- stale vehicle data produces Unknown;
- calendar special departure can influence readiness but absence of calendar event does not mean no trip;
- charger unavailable is represented separately when charger integration exists.

### Readiness and risks

Peugeot e-208 exists. HA integration support is unverified. Zaptec and second EV are planned. Complexity is moderate to high because vehicle integrations can be cloud-dependent and stale. First release should not depend on mobility.

## 14. Battery and charger setup pack

### Planned Stories enabled

- Steady/Opportunity: battery is charging.
- Steady: battery is supporting the house.
- Ready/Steady: battery is being preserved.
- Ready/Steady: work vehicle charging should not use the home battery.
- Unknown: battery/charger state unknown.

Example Story:

> De thuisaccu wordt bewaard terwijl de zakelijke auto laadt.

Home Assistant policy:

> Do not discharge the home battery while the designated work vehicle is charging.

### Required semantic capabilities

| Capability | Minimum valid states | Optional richer states | Freshness |
| --- | --- | --- | --- |
| Marstek state of charge | SoC %, timestamp | available energy | recent |
| Marstek charge/discharge state | charging/discharging/idle/unknown | watts, mode | near-real-time |
| Zaptec charger state | idle/plugged/charging/error/unavailable | charge power, session | near-real-time |
| Designated work vehicle | configured vehicle identity | business/private tag | manually configured |
| Policy state | active/inactive/blocked/unknown | reason | fresh when controlling |
| Optimization result | preserve/discharge/charge/defer | explanation | fresh and auditable |

### Product boundary

FamilyBoard:

- defines household intent;
- explains policy and outcome;
- exposes safe bounded choices;
- tells the user what Home Assistant must provide;
- shows whether the policy is active, blocked, or unknown.

Home Assistant:

- executes optimization;
- controls battery and charger;
- handles retries;
- handles rapid control loops;
- owns vendor-specific integrations and low-level safety behavior.

### Setup routes

- Native integration: Marstek and Zaptec states if available and validated.
- Derived capability: policy state and explanation.
- Combined capability: battery state + charger state + designated work vehicle + policy outcome.
- Hardware missing: Marstek battery, Zaptec Go 2, and second EV are planned, not current.
- Unsupported: FamilyBoard directly controlling battery/charger loops or unsafe automatic writes.

### Validation

Minimum validation tests when hardware exists:

- observe battery charging, discharging, and idle states;
- observe charger plugged/charging/idle/error states;
- identify designated work vehicle session;
- activate policy in Home Assistant and verify battery does not discharge while work vehicle charges;
- verify FamilyBoard explanation matches Home Assistant policy result;
- stale battery/charger data produces Unknown;
- control failures remain Home Assistant responsibility and are surfaced as blocked/unknown.

### Readiness and risks

This pack is planned only. It must not block first Woning. Risks include unsafe control assumptions, rapid-loop responsibility leakage into FamilyBoard, vendor integration instability, and policy opacity.

## 15. FamilyBoard-generated configuration guidance

FamilyBoard should eventually be able to generate or suggest:

- Home Assistant template-sensor examples;
- helper definitions;
- automation examples;
- script examples;
- semantic naming conventions;
- validation checklists;
- capability-specific troubleshooting steps.

The product boundary is strict:

- generated configuration is visible to the user;
- FamilyBoard explains what it does and why;
- the user reviews and applies configuration in Home Assistant;
- FamilyBoard does not silently write arbitrary configuration;
- FamilyBoard does not own vendor-specific integration logic;
- FamilyBoard does not create unsafe controls without review;
- FamilyBoard does not claim success before validation.

Configuration generation is safest for read-only semantic normalization, such as template sensors and helper state conventions. It is riskier for automations and scripts. It is highest risk for control policies involving battery and charger behavior; those should remain Home Assistant-owned with FamilyBoard providing intent and explanation.

## 16. Product boundary with Home Assistant

FamilyBoard remains provider-neutral by defining product-level semantic requirements rather than Home Assistant-specific contracts. Home Assistant is one provider that can satisfy the semantic requirements.

FamilyBoard should define:

- household Stories;
- required semantic capabilities;
- accepted state meanings;
- freshness expectations;
- confidence behavior;
- validation requirements;
- user-facing limitations;
- safe household intent.

Home Assistant should provide:

- device integrations;
- entity states;
- helpers/templates/automations/scripts;
- runtime execution;
- vendor-specific behavior;
- control loops;
- retry and failure handling;
- real-time device updates.

FamilyBoard should not become:

- an HA entity browser;
- an HA integration installer;
- an HA automation editor;
- a YAML management interface;
- a vendor-specific control surface;
- a hidden configuration writer.

## 17. Semantic output conventions

FamilyBoard should define a small provider-facing semantic vocabulary at the product level, not as a software contract in this report.

Recommended vocabulary examples:

- appliance state: `idle`, `running`, `paused`, `finished`, `error`, `unknown`, `unavailable`;
- freshness: `fresh`, `stale`, `unavailable`;
- confidence: `high`, `medium`, `low`, `unknown`;
- adult presence: `probably_home`, `probably_away`, `unknown`, `unavailable`;
- energy/battery modes: `importing`, `exporting`, `charging`, `discharging`, `idle`, `preserving`, `unknown`.

Home Assistant entities should be normalized by:

- required state vocabulary;
- attributes for source, timestamp, confidence, and reason;
- areas and friendly names for household mapping;
- labels or FamilyBoard-specific metadata where useful;
- validation behavior and observed transitions;
- device class only when it correctly describes the raw measurement.

Normalization should not rely on entity names alone. Friendly names and areas help setup, but validation determines whether a capability can support a Story.

## 18. Current capability truth table

| Desired Story | Required capability | Current hardware exists | HA integration known | Derived setup needed | Hardware missing | Validation required | Expected confidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Room needs attention | room temp/humidity, room identity, thresholds | Yes: temp/humidity sensors | Unknown until HA installed | Yes, comfort interpretation | No for rooms with sensors | Yes | Medium after validation; Unknown for unmapped rooms |
| Bathroom remains humid | bathroom humidity, duration, room type | Yes: humidity sensors if bathroom covered | Unknown | Yes | Possibly if bathroom lacks sensor | Yes | Medium-high after validation |
| Room will not be comfortable by bedtime | comfort temp, Evohome target, room purpose, bedtime relevance | Yes: sensors + Evohome | Unknown | Yes | No if mapped | Yes | Medium; depends on source freshness |
| Ready for tonight | selected room climate readiness | Yes, partially | Unknown | Yes | No for climate-only readiness | Yes | Medium after room model validation |
| Climate cannot be judged | freshness/unknown behavior | Yes, via source states if exposed | Unknown | Yes | No | Yes | High when stale handling validated |
| Washer running | washer cycle state or power | Yes: WiFi washer; planned plug | Unknown | Maybe | Plug planned for corroboration | Yes | Medium WiFi-only; high combined |
| Washer finished | observed running-to-finished transition | Yes: WiFi washer; planned plug | Unknown | Maybe | Plug planned for high confidence | Yes | Medium WiFi-only; high combined |
| Dryer running | dryer cycle state or power | Yes: WiFi dryer; planned plug | Unknown | Maybe | Plug planned for corroboration | Yes | Medium WiFi-only; high combined |
| Dryer finished | observed running-to-finished transition | Yes: WiFi dryer; planned plug | Unknown | Maybe | Plug planned for high confidence | Yes | Medium WiFi-only; high combined |
| Appliance state unknown | unavailable/stale behavior | Yes if integration exposes state | Unknown | Yes | No | Yes | High after validation |
| Current power use understandable | P1 import/export, baseline | Yes: P1 meter | Unknown | Yes for baseline/explanation | No | Yes | Medium; limited without appliance attribution |
| Power use unusually high | current import/consumption + recent baseline | Yes: P1 meter | Unknown | Yes | No | Yes | Medium after baseline learning |
| Good energy moment | import/export plus optional context | Yes: P1 meter | Unknown | Yes | Solar not confirmed | Yes | Low-medium unless export/context validated |
| Energy cannot be judged | P1 freshness/unknown | Yes | Unknown | Yes | No | Yes | High after stale validation |
| Water use normal | current flow/total/pattern | Yes: water meter | Unknown | Likely | Maybe if no timely flow | Yes | Medium if timely flow exists; Unknown otherwise |
| Continuous water use needs checking | flow duration and pattern | Yes: water meter | Unknown | Yes | Maybe if no timely flow | Yes | Medium; avoid leak claim |
| Water use while both parents probably away | water flow + adult probable presence | Yes: water meter + Ubiquiti + phones | Unknown | Yes | No | Yes | Medium-low due probabilistic presence |
| Presence contributes to explanations | Mom/Dad phone mapping and confidence | Yes: Ubiquiti + phones | Unknown | Yes | No | Yes | Medium; contextual only |
| Adult probably home/away | phone detection, last seen, confidence | Yes | Unknown | Yes | No | Yes | Medium; never proof |
| Peugeot needs charging before meaningful trip | SoC, plugged, charging, trip context | Yes: Peugeot | Unverified | Yes | No for Peugeot; charger planned optional | Yes | Low until integration confirmed |
| Peugeot readiness unknown | stale/unavailable vehicle state | Yes: Peugeot | Unverified | Yes | No | Yes | High once unavailable behavior mapped |
| Charger state unavailable | charger state | Planned: Zaptec Go 2 | Not applicable yet | Later | Yes, planned | Later | Not available now |
| Second EV readiness later | vehicle state for second EV | Planned second EV | Not applicable yet | Later | Yes, planned | Later | Not available now |
| Battery is charging/supporting/preserved | Marstek SoC/state | Planned Marstek | Not applicable yet | Later | Yes, planned | Later | Not available now |
| Work vehicle charging should not use battery | Marstek + Zaptec + work vehicle + policy | Planned battery/charger/second EV | Not applicable yet | Yes later | Yes, planned | Later | Not available now |

Legend: "Current hardware exists" means equipment is owned, not that Home Assistant is configured. "HA integration known" remains Unknown or unverified until installed and confirmed. "Story enabled" requires semantic configuration and validation, not merely hardware ownership.

## 19. Recommended setup roadmap

The proposed sequence should be adjusted to maximize early visible FamilyBoard value while avoiding planned-device blockers.

| Step | Recommendation | Stories unlocked | Dependencies | Validation effort | Risk | Immediate value |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Home Assistant foundation | none directly; enables all packs | HA install, stable network | basic availability/restart | setup complexity | Required foundation |
| 2 | Household room and floor model | climate deep dives later | FamilyBoard household knowledge | manual review | naming drift | High because it structures Woning |
| 3 | Temperature and humidity | climate Steady/Attention/Unknown | sensors in HA, room mapping | moderate | stale/duplicate sensors | High |
| 4 | Evohome | bedtime comfort and heating explanation | HA Evohome integration | moderate | zone mapping mismatch | High |
| 5 | Laundry WiFi integrations | washer/dryer running/finished/unknown | HA appliance integrations | high: real cycles | vendor state ambiguity | High, very tangible |
| 6 | P1 electricity | understandable/high/unknown energy | HA P1 integration | moderate | overclaiming causes | High |
| 7 | Ubiquiti presence | adult probable context | HA Ubiquiti integration | high: real movement cases | overinterpretation | Medium; useful as context |
| 8 | Water meter | water normal/continuous/unknown | timely water data | high: household tests | false leak claims | Medium-high if flow is timely |
| 9 | Smart-plug corroboration | high-confidence laundry | planned plugs | high: real cycles | threshold tuning | High after hardware |
| 10 | Peugeot | EV readiness/unknown | verified integration | moderate-high | stale cloud data | Medium |
| 11 | Cross-capability Stories | richer Woning explanations | validated packs | scenario-based | complexity creep | High once base packs exist |
| 12 | Marstek battery | battery Stories | planned hardware | high | control boundary | Later |
| 13 | Zaptec Go 2 | charger Stories | planned hardware | high | control boundary | Later |
| 14 | Second EV | second EV readiness/policy | planned vehicle | high | identity/policy | Later |
| 15 | Battery/charger optimization policy | preserve battery while work vehicle charges | battery + charger + designated vehicle | very high | unsafe automation if misowned | Later, do not block first release |

The first usable Woning should target steps 1-6, with step 7 optional if Ubiquiti setup is straightforward. Water may move earlier if the meter exposes timely flow easily. Planned devices should not block the first release.

## 20. Explicit answers to design questions

1. **Can FamilyBoard realistically guide Home Assistant setup without becoming an HA administration console?** Yes, if setup remains Story-first, capability-scoped, validation-gated, and avoids generic entity browsing or arbitrary YAML editing.
2. **Should setup start from Stories, capability packs, or household devices?** Start from capability packs presented as Stories. Devices appear only as possible routes to satisfy a selected capability.
3. **What is the minimum Home Assistant setup that makes Woning useful?** HA foundation, room/floor model, temperature/humidity, Evohome, and at least one high-tangible pack such as laundry or P1 electricity.
4. **Which first three capabilities provide the highest FamilyBoard value?** Climate comfort, laundry cycle state, and P1 electricity explanation.
5. **Which capabilities should be configured together?** Temperature/humidity with room model and Evohome; washer/dryer WiFi with smart plugs when available; water with adult presence context only after each is independently validated; battery with charger and designated work vehicle when planned hardware exists.
6. **Which integrations require real-world validation?** All of them require some validation. Laundry, water, presence, mobility, and battery/charger require especially strong real-world validation because transitions and unavailable states matter.
7. **Which capabilities can be trusted from native integrations alone?** Basic numeric sensor readings and P1 import/export may be trusted after freshness/sign validation. Native appliance and vehicle states still require transition validation. Evohome targets can be trusted for heating-control interpretation after zone mapping validation.
8. **Where are templates or helpers likely required?** Laundry power classification, climate comfort state, bedtime projection, electricity baseline/anomaly detection, water continuous-flow detection, presence confidence, and battery/charger policy explanation.
9. **Where is extra hardware likely required?** Laundry corroboration needs planned power-measuring smart plugs. Water may need extra adapter/hardware if the meter lacks timely flow. Battery/charger Stories require planned Marstek and Zaptec. No additional unconfirmed hardware should be assumed.
10. **How should FamilyBoard represent “hardware exists but Story is not yet enabled”?** As a setup status such as hardware owned, integration not confirmed, semantic capability not configured, validation pending, Story disabled.
11. **How should capability confidence degrade after installation?** Degrade on stale readings, unavailable states, missed transitions, source disagreement, Home Assistant restart without recoverable state, entity changes, or elapsed time since validation.
12. **Can FamilyBoard safely generate configuration examples?** Yes for transparent examples and checklists, especially templates/helpers. The user must review and apply them, and validation is still required.
13. **Should FamilyBoard ever write configuration automatically?** Not initially. It should not silently write arbitrary configuration. Future limited write flows would require explicit review, preview, rollback, and safety boundaries.
14. **How does the setup model remain provider-neutral?** It defines Stories, semantic capabilities, states, freshness, confidence, and validation independent of Home Assistant. HA is a provider route, not the product model.
15. **What would prove that the setup-guide concept is too ambitious?** If most capabilities cannot be validated by normal household tests, if generated guidance becomes vendor-specific administration, if users must understand HA internals first, or if confidence cannot be explained simply.
16. **Which Stories should be available in the first usable Woning version?** Climate Steady/Attention/Ready/Unknown, laundry running/finished/unknown for at least one appliance if validated, and electricity understandable/high/unknown from P1 with strict limitations.
17. **Which planned devices should not block the first release?** Smart plugs, Marstek battery, Zaptec Go 2, second EV, and any cross-capability battery/charger optimization.
18. **How should the four-floor room model be configured?** User defines floor names, rooms, room purposes, bedtime relevance, then maps temperature, humidity, and Evohome zones to rooms. The model is household-owned, not entity-name-derived.
19. **How should duplicate temperature sources be handled?** Separate comfort temperature from heating-control temperature, choose explicit source roles, degrade confidence on conflicts, and explain differences in deep dives.
20. **How should FamilyBoard guide the user through validation rather than merely accepting an entity mapping?** Each capability has a guided checklist with real-world actions, expected state transitions, unavailable/stale tests, recovery checks, and a final confidence result before enabling Stories.

## 21. Risks and unresolved questions

- Home Assistant installation details are outside this report and must be designed separately.
- Specific integration support for Evohome, appliance WiFi, P1, water meter, Ubiquiti, Peugeot, Marstek, and Zaptec must be technically confirmed later.
- The water meter may not expose timely enough flow for continuous-use Stories.
- Peugeot integration support remains unverified.
- Appliance WiFi states may be cloud-dependent or semantically inconsistent.
- Presence confidence may be misunderstood as occupancy proof unless copy is careful.
- Battery/charger policy explanation may drift into control responsibility if boundaries are weak.
- Generated configuration could create support burden if FamilyBoard appears to own HA internals.
- The first setup UX must avoid overwhelming users with all packs at once.

## 22. Final recommendation

Adopt the guided setup model:

> Desired Household Story → semantic capability requirements → Home Assistant setup route → real-world validation → Story enabled.

FamilyBoard should act as a functional setup guide that defines household meaning, semantic state expectations, and validation. Home Assistant should remain the technical integration and execution platform. The first usable Woning setup should prioritize climate, laundry, and P1 electricity because they produce immediate visible household value from currently owned equipment while respecting strict Unknown behavior.

## 23. Clear next product-design step

Design the first setup-guide UX slice for the **Climate pack** because it establishes the reusable pattern for rooms, floors, semantic source mapping, freshness, duplicate-source resolution, validation, and Woning/deep-dive enablement. The deliverable should remain product design: no production code, no HA configuration, and no backend architecture. It should define screens, copy, setup states, validation steps, and Story enablement criteria for climate only.

## 24. Validation checklist for this report

- No production code was changed.
- No Home Assistant configuration was created or applied.
- No screenshots or binary assets were created.
- Only current and explicitly planned equipment was used.
- Hardware ownership was not confused with working integration.
- Integration availability was not confused with validated semantic capability.
- Calendar was not used as presence proof.
- Ubiquiti presence remained probabilistic.
- Child presence was not inferred.
- Battery and charger optimization remained Home Assistant responsibility.
- FamilyBoard remained Story-first.
- The setup model did not become a generic entity browser.
