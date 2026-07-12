# House Brain Research: How FamilyBoard Reasons About a House

Date: 2026-07-12  
Repository: HomeOps / FamilyBoard  
Baseline challenged: `docs/reports/2026-07-11-home-automation-page-research/README.md` and `docs/reports/2026-07-11-home-automation-page-research-v2/README.md`  
Scope: research and product definition only; no implementation, code, UI, screenshots, or Home Assistant integration design.

## 1. Executive summary

FamilyBoard should not become a prettier Home Assistant dashboard. Its durable product opportunity is to become a **household assistant**: a system that understands what the household is trying to do, reasons about whether the house supports those intentions, and speaks only when a family decision would be improved.

The core product question is not "what is the state of every device?" The core question is:

> Is the house helping or hindering the household's next meaningful moments?

A useful House Brain therefore reasons from **people, places, routines, intentions, constraints, and time**, not from sensors alone. Sensors, calendars, weather, tasks, family profiles, and Home Assistant capabilities are evidence. They are not the intelligence.

The previous reports correctly rejected raw entity browsing and moved toward semantic household interpretation. This report challenges the remaining dashboard bias. Even a decision-first `Woning` page is still only one consumer of a deeper product capability. The House Brain should exist conceptually before any page. It should be able to produce value through Home, Agenda, My Page, Weekly Reset, notifications, conversational explanations, or future surfaces without being tied to a home automation screen.

The recommended House Brain model is not a simple linear pipeline of observe → understand → predict → recommend → act. Household life is cyclical, contextual, and interruption-sensitive. A better model is a **household reasoning loop**:

1. **Sense reality**: gather observations from the home, family, calendar, weather, tasks, and history.
2. **Bind meaning**: attach observations to household concepts such as rooms, people, routines, capabilities, and goals.
3. **Recognise situations**: identify current and emerging household situations, including normal ones.
4. **Project consequences**: estimate what will matter soon, not only what is happening now.
5. **Judge usefulness**: decide whether saying or doing something would improve household outcomes.
6. **Choose posture**: stay silent, inform, suggest, recommend, warn, or act with consent.
7. **Remember the outcome**: learn from acknowledgement, dismissal, repeated anomalies, and changing routines.

The House Brain should be organised around reasoning domains, but domains must not become feature silos. The strongest intelligence comes from interactions: comfort plus bedtime, laundry plus solar surplus, water plus nobody home, EV charge plus calendar plus weather, battery plus freezer risk, and ventilation plus humidity plus outdoor conditions.

The House Brain's output should be **household decisions**, not raw states. Examples include `No action required`, `Known and expected`, `Nice opportunity`, `Worth checking`, `Recommended`, `Important`, `Urgent`, and `Unable to judge`. Each decision must carry confidence, uncertainty, assumptions, evidence, and an explanation.

The most important design principle is selective silence. A household assistant that comments on every change becomes another dashboard in disguise. FamilyBoard should often say nothing when the situation is expected, already acknowledged, too uncertain, too minor, repeated too often, outside a useful action window, or better handled by a specialist system.

## 2. What a House Brain is

The House Brain is the conceptual intelligence layer that turns household evidence into household judgement.

It is **not**:

- a dashboard;
- a widget collection;
- a Home Assistant frontend;
- an entity browser;
- an automation editor;
- a rule builder;
- a device inventory;
- a notification firehose;
- a collection of charts;
- a list of smart-home integrations.

It is:

- a household situation interpreter;
- a memory of what is normal for this family;
- a reasoning system that connects people, rooms, routines, weather, calendars, devices, and preferences;
- a prioritisation layer that decides what deserves attention;
- an explanation layer that can answer "why are you saying this?";
- a restraint layer that decides when silence is better;
- a provider-neutral product capability that still makes sense if Home Assistant is replaced.

The House Brain should understand a house as a lived environment, not as an installation of devices. The same temperature can mean different things depending on room, person, time, season, intended use, recent trend, and household preference. The same washing-machine state can be irrelevant on a quiet Sunday afternoon and important when school uniforms are needed tomorrow morning. The same water flow can be normal during shower time and urgent when nobody is home.

The Brain's primary object is a **household situation**: a meaningful interpretation of evidence in context. A situation can be normal, uncertain, useful, risky, or urgent. It can involve one domain or many.

## 3. Product philosophy

### Household reasoning first

FamilyBoard should start from household outcomes:

- children sleep comfortably;
- tomorrow morning is prepared;
- laundry does not block routines;
- energy is used at sensible moments;
- the house is safe enough to ignore;
- parents are not surprised by preventable issues;
- family members receive less cognitive load, not more information.

Device states matter only when they improve these outcomes.

### Assistance over control

The House Brain should not measure success by how many actions it can automate. The more durable product value is helping the family understand what matters and decide with confidence. Automation can be added later, but it must remain subordinate to household judgement.

A recommendation such as "run the dryer now because solar surplus is likely for the next hour and the sports clothes are needed tomorrow" is valuable even if FamilyBoard cannot start the dryer itself. The intelligence is the reasoning, not the button.

### Provider-neutral semantics

Home Assistant may be an excellent provider of home observations and safe capabilities, but FamilyBoard's intelligence must not be Home Assistant-shaped. The House Brain should consume semantic capabilities such as "bathroom humidity trend", "vehicle charge readiness", "room next-use comfort", or "unexplained water flow" regardless of whether the evidence came from Home Assistant, a direct API, a manual schedule, a weather service, or future household hardware.

### Calm by default

The House Brain should make the household calmer. It should reduce decision load, not create another surface to monitor. Silence is a positive product feature when the household is safe, normal, prepared, or already aware.

### Explainable and humble

FamilyBoard should never present guesses as facts. It should distinguish known, inferred, assumed, stale, missing, conflicting, and uncertain information. The product voice should be confident only when the evidence and context justify confidence.

## 4. Core reasoning model

The earlier observe → understand → predict → recommend → act model is directionally useful but too linear. Household reasoning is not one pass from data to action. It is a loop with restraint and memory.

### Recommended model: the household reasoning loop

#### 1. Sense reality

Collect observations from any available provider:

- indoor measurements;
- appliance status;
- energy flows;
- water flow;
- openings, locks, and safety sensors;
- weather and daylight;
- calendar events;
- tasks, shopping, and recurring household commitments;
- family member profiles and room associations;
- manual acknowledgements and preferences;
- historical patterns.

At this layer, observations are only evidence. They are not conclusions.

#### 2. Bind meaning

Attach observations to household concepts:

- this sensor belongs to the bathroom;
- this bedroom belongs to Robin;
- Robin is a child;
- this period is usually bedtime preparation;
- this calendar event likely requires travel;
- this car is normally used for school runs;
- this laundry appliance affects tomorrow's clothing readiness;
- this room is normally cooler in winter;
- this water flow is outside expected occupied periods.

Binding is where FamilyBoard begins to differ from Home Assistant. The same entity becomes meaningful because it is connected to family life.

#### 3. Recognise situations

A situation is a named household interpretation, such as:

- child's bedroom not ready for sleep;
- bathroom drying slower than normal;
- laundry waiting before a busy morning;
- good energy window for appliance use;
- vehicle not ready for calendar-linked departure;
- possible water leak while nobody home;
- normal evening heating demand;
- expected morning activity;
- unknown readiness due to missing evidence.

Situation recognition should include normal situations. "Everything is normal" is an active conclusion based on evidence, not the absence of alerts.

#### 4. Project consequences

The Brain asks: if nothing changes, what happens next?

Examples:

- Will the bedroom be comfortable by bedtime?
- Will the bathroom humidity return to normal before night?
- Will the battery cover the overnight base load?
- Will the EV be charged before the first real departure?
- Will laundry be done before it blocks tomorrow's routine?
- Will open windows waste heating during the next warm-up period?
- Will rain change drying, travel, or ventilation choices?

Prediction turns current state into household usefulness.

#### 5. Judge usefulness

Before speaking, the Brain asks whether communication changes anything:

- Is there a practical action?
- Is the action window open now?
- Is the risk material?
- Is the household likely already aware?
- Was this already acknowledged?
- Is this recurring and intentionally ignored?
- Is confidence high enough?
- Would saying this create more burden than value?

This step prevents dashboard thinking from re-entering through recommendations.

#### 6. Choose posture

The Brain chooses an attention posture:

- **Silent**: normal, expected, irrelevant, acknowledged, or too uncertain.
- **Explain if asked**: useful background, but no interruption.
- **Inform**: low-pressure awareness.
- **Opportunity**: optional timely benefit.
- **Suggest**: a reasonable household action.
- **Recommend**: a clear best action with sufficient confidence.
- **Warn**: significant risk or time-sensitive issue.
- **Act with consent**: execute a safe, bounded action only when capability and permission are appropriate.

#### 7. Remember the outcome

The Brain learns from what happened:

- Was the recommendation accepted, ignored, dismissed, or acknowledged?
- Did the predicted risk occur?
- Was the situation normal for this household after all?
- Did a routine shift permanently?
- Did a sensor become unreliable?
- Did the family prefer silence for this kind of event?

Memory improves confidence, reduces repeated noise, and adapts the assistant to the household.

## 5. Reasoning domains

Domains should be reasoning lenses, not pages or integration modules. A domain owns a family of household questions and contributes situations to the Brain. The initial domain set should be broad enough to model cross-domain intelligence but narrow enough to avoid feature sprawl.

### 5.1 Comfort and habitability

**Purpose:** Determine whether rooms are suitable for the people and activities that will use them.

**Observations:** Temperature, humidity, air quality, heating state, ventilation state, weather, room type, occupant, next-use time, historical comfort norms.

**Understanding:** A room is not simply warm or cold. It is suitable or unsuitable for sleep, work, play, bathing, guests, or absence. A child's bedroom has different meaning from an unused office.

**Predictions:** Room comfort at next use, heating time to target, humidity drying trajectory, overheating risk, ventilation usefulness, seasonal drift.

**Recommendations:** Pre-heat briefly, ventilate, close a window before heating, ignore an unused room, check a stale sensor, adjust a routine threshold.

**Confidence:** High when readings are fresh, room mapping is clear, and historical patterns are stable. Lower when sensors conflict, room use is unknown, or weather shifts quickly.

**Relationships:** Routine, weather, energy, safety, household readiness, people and care.

### 5.2 Household readiness

**Purpose:** Decide whether the house is ready for a meaningful upcoming mode: bedtime, morning, leaving, returning, guests, school day, weekend, vacation, or night.

**Observations:** Calendar, family routines, room comfort, laundry state, vehicle readiness, weather, tasks, door/window state, water flow, energy state.

**Understanding:** Readiness is a composite household condition. It is not owned by a single sensor. "Ready for bedtime" may include bedrooms, bathroom humidity, laundry, vehicle charging, and no unexplained water use.

**Predictions:** Whether the next household transition will be smooth or blocked.

**Recommendations:** Finish one blocking task, charge vehicle, move laundry, pre-heat rooms, check an anomaly, do nothing because readiness is sufficient.

**Confidence:** Depends on completeness of contributing domains and how well routines are known.

**Relationships:** All other domains; this is the main cross-domain synthesis domain.

### 5.3 Energy timing and resilience

**Purpose:** Identify when energy use is sensible, wasteful, risky, or resilient.

**Observations:** Solar production, consumption, grid import/export, tariffs if available, battery state, weather/solar forecast, appliance states, EV charging, heating demand.

**Understanding:** Energy is not just current watts. It is timing, flexibility, and household consequence. A high load can be good during surplus and bad during an expensive or low-battery window.

**Predictions:** Surplus duration, overnight battery coverage, likely grid import, best action windows for flexible loads, heating impact during cold periods.

**Recommendations:** Run appliance now, wait for surplus, charge car tonight, preserve battery, avoid simultaneous high loads, ignore because action value is too small.

**Confidence:** Lower when solar forecast, battery behavior, tariff data, or appliance flexibility are missing. High when recent flow and near-term forecast agree.

**Relationships:** Laundry, mobility, comfort, weather, readiness.

### 5.4 Laundry and clothing readiness

**Purpose:** Prevent laundry from becoming a household blocker while using timing opportunities sensibly.

**Observations:** Washer/dryer state, cycle end, door open/unloaded state if known, energy surplus, weather/drying suitability, calendar, tasks, known recurring needs such as sports or school uniforms.

**Understanding:** Laundry matters when it affects future readiness. A finished washer is more important before bedtime than during a free afternoon if wet clothes will sit overnight.

**Predictions:** Whether laundry will be ready in time, whether wet laundry may remain too long, whether a better energy window is coming.

**Recommendations:** Unload now, start dryer now, wait for solar surplus, hang laundry because dry weather is coming, create or surface a task if recurring.

**Confidence:** Often partial because appliance integrations may not know contents. Confidence grows with repeated cycle patterns and user feedback.

**Relationships:** Energy, weather, routine, tasks, household readiness, people and care.

### 5.5 Mobility and departure readiness

**Purpose:** Ensure vehicles and travel conditions support upcoming family plans.

**Observations:** Calendar, likely departure times, vehicle/charger connection, state of charge, charging rate, weather, traffic if later available, family member association, typical vehicle use.

**Understanding:** A vehicle is ready or not ready for a family intention. The same battery percentage is acceptable for errands and risky for a long appointment.

**Predictions:** Charge readiness by departure, need to plug in, weather impact on range or departure prep, conflict between charging and energy strategy.

**Recommendations:** Plug in vehicle, start charging tonight, delay charging to low-tariff/surplus if safe, leave earlier due to weather, ignore if no meaningful departure is known.

**Confidence:** Requires reliable calendar interpretation and vehicle data freshness. Lower when calendar location, vehicle assignment, or state of charge is unknown.

**Relationships:** Energy, weather, calendar/routine, household readiness.

### 5.6 Water and moisture safety

**Purpose:** Detect water conditions that are unusual, risky, or persistent enough to matter.

**Observations:** Water flow, leak sensors, humidity, appliance water use, occupancy expectation, shower/bath routine, weather, historical drying rates.

**Understanding:** Water can be normal activity, ventilation need, appliance use, or possible damage. Meaning depends heavily on occupancy, routine, and duration.

**Predictions:** Whether humidity will return to normal, whether water flow is likely explained, whether a leak suspicion is strengthening.

**Recommendations:** Ventilate bathroom, check possible leak, check appliance, stay silent during expected shower/laundry use, escalate if flow persists while nobody home.

**Confidence:** High for direct leak sensors; more cautious for meter-flow inference. Conflicting occupancy or appliance states should reduce confidence.

**Relationships:** Comfort, safety, routine, laundry, presence/occupancy, household readiness.

### 5.7 Safety and security posture

**Purpose:** Determine whether the house is in a safe-enough state for the current household mode.

**Observations:** Door/window contacts, locks, smoke/CO/leak alarms, camera attention events, occupancy expectation, bedtime/leaving mode, weather, known acknowledgements.

**Understanding:** Safety is not a permanent red/green dashboard. An open garden door can be normal during afternoon play and important at night or while away.

**Predictions:** Whether an unresolved state will become more consequential after a mode change, such as bedtime or departure.

**Recommendations:** Check a door/window, acknowledge expected state, escalate urgent alarms, remain silent for expected activity.

**Confidence:** Must be conservative. The Brain should never claim safety if critical evidence is missing; it can say what it knows and what it cannot judge.

**Relationships:** Household readiness, weather, presence/occupancy, people and care, water.

### 5.8 Weather and external conditions

**Purpose:** Explain how outside conditions affect household decisions.

**Observations:** Temperature, rain, wind, humidity, solar forecast, daylight, severe weather, pollen/air quality if later available.

**Understanding:** Weather is not a separate content feed. It modifies comfort, travel, ventilation, laundry, energy, and safety.

**Predictions:** Heating demand, ventilation suitability, drying opportunities, solar surplus, travel friction, storm preparation.

**Recommendations:** Ventilate now before rain, delay laundry drying, charge car earlier before cold morning, close windows before storm, ignore if weather has no household consequence.

**Confidence:** Forecast uncertainty grows with horizon and local variability; recommendations should reflect that.

**Relationships:** Comfort, energy, laundry, mobility, safety, routine.

### 5.9 Routine and calendar intent

**Purpose:** Convert time and plans into household expectations.

**Observations:** Calendar events, school/work patterns, recurring tasks, family member routines, holidays, weekends, previous departures/returns, manual preferences.

**Understanding:** A calendar event is not automatically a household action. The Brain must infer whether it implies travel, clothing, vehicle use, room use, meal timing, sleep timing, or no physical consequence.

**Predictions:** Next household mode, departure windows, room use, preparation deadlines, deviations from normal.

**Recommendations:** Prepare earlier, charge, heat, finish laundry, remain silent when an event has no house consequence.

**Confidence:** Grows from repeated patterns and explicit feedback. Low when event semantics are ambiguous.

**Relationships:** Every domain. Routine is the main source of "why now?".

### 5.10 People and care context

**Purpose:** Understand household needs through family relationships, ages, responsibilities, preferences, and sensitivities.

**Observations:** Family members, ages, rooms, preferences, bedtime windows, school/work roles, mobility needs, known sensitivities such as cold bedroom or humidity concerns.

**Understanding:** The Brain reasons differently for a child's bedroom, a guest room, a parent office, or a shared bathroom. It should care about the people affected, not just the location.

**Predictions:** Which household member will be affected by a situation and when.

**Recommendations:** Phrase and prioritise around the affected person: "Robin's room", "school morning", "guest room before visitors".

**Confidence:** High for explicit family profiles; lower for inferred habits until confirmed.

**Relationships:** Comfort, routine, mobility, tasks, household readiness, explanation.

### 5.11 Provider and capability health

**Purpose:** Know whether the Brain can trust its own evidence.

**Observations:** Data freshness, provider availability, sensor conflicts, missing mappings, failed capabilities, repeated unavailable states.

**Understanding:** Missing evidence is itself a household situation when it affects trust. "Everything is fine" is invalid if critical inputs are unknown.

**Predictions:** Whether missing data will impair upcoming decisions.

**Recommendations:** Say unable to judge, ask for mapping later, suppress low-value warnings from unreliable sensors, surface only trust-impacting provider issues.

**Confidence:** This domain produces confidence metadata for every other domain.

**Relationships:** All domains.

## 6. Cross-domain intelligence

The House Brain becomes unique when it combines domains. Cross-domain situations should be the primary design target.

### 6.1 Bedtime readiness

**Inputs:** Child bedrooms, heating state, humidity, bathroom drying, laundry, vehicle charging, water flow, door/window state, weather forecast, routine.

**Possible conclusions:**

- "Bedtime is on track; bedrooms are comfortable and bathroom humidity is declining."
- "Robin's bedroom is cooling faster than usual and bedtime is in one hour."
- "Bathroom humidity is still high after shower time; ventilating now avoids a damp night."
- "Washer is finished before bedtime; unload now to avoid wet laundry overnight."

**Why this is intelligent:** No single system state says "bedtime is at risk". The Brain synthesises people, time, room purpose, trends, and household consequence.

### 6.2 Morning departure readiness

**Inputs:** Calendar, family routines, EV charge, weather, laundry, school/work schedule, heating forecast, outdoor conditions.

**Possible conclusions:**

- "Tomorrow morning is ready; car charge and school clothes are on track."
- "The first departure is likely 08:10 and the car will not be ready unless charging starts tonight."
- "Rain during the school run makes indoor drying more important tonight."
- "Cold morning expected; heating may need to start earlier for children's rooms."

### 6.3 Laundry plus energy timing

**Inputs:** Washer/dryer state, solar surplus, battery state, forecast, tariff, clothing deadline, weather drying conditions.

**Possible conclusions:**

- "Run the dryer now: solar surplus is likely for another hour and sports clothes are needed tomorrow."
- "Wait with the dryer: surplus is expected after lunch and there is no deadline."
- "Use the dryer despite grid import: wet laundry will sit overnight otherwise."

**Trade-off:** The Brain should not optimise energy at the cost of household stress when readiness matters more.

### 6.4 EV charging plus household plans

**Inputs:** Vehicle state, charger connection, calendar, usual vehicle assignment, weather, battery/tariff/solar, departure horizon.

**Possible conclusions:**

- "Charge tonight; tomorrow's appointment requires more range than usual."
- "Charging can wait for the low-tariff window; departure is late enough."
- "Plug in the car before bedtime; it is not connected and tomorrow starts early."

### 6.5 Water plus occupancy expectation

**Inputs:** Water meter, appliance state, presence/occupancy, routine, leak sensors, calendar.

**Possible conclusions:**

- "Water use is expected; shower time is likely."
- "Water flow continues while nobody is expected home; check possible leak."
- "Dishwasher explains current water use; no action required."

### 6.6 Humidity plus weather plus ventilation

**Inputs:** Indoor humidity, bathroom use pattern, outdoor humidity/rain/wind, window state, heating demand.

**Possible conclusions:**

- "Ventilate bathroom now; outside air is suitable and rain starts later."
- "Do not suggest opening windows; outside humidity is high and heating is active."
- "Bathroom usually dries faster; today's slower drying may need attention."

### 6.7 Heating plus open windows plus energy

**Inputs:** Heating demand, room temperature, window contacts, energy import, weather, room occupancy.

**Possible conclusions:**

- "Close the office window before heating; the room is about to warm for work."
- "Window open is okay; heating is off and the room is airing after cleaning."
- "Heating demand is high but expected due to outdoor temperature drop."

### 6.8 Battery plus safety resilience

**Inputs:** Battery state, weather alerts, grid state if available, freezer/fridge importance, medical/device needs if later known, overnight forecast.

**Possible conclusions:**

- "Preserve battery tonight; storm risk and low solar tomorrow reduce resilience."
- "Battery can cover normal overnight load; no action required."

### 6.9 Guests plus room readiness

**Inputs:** Calendar guest events, guest room climate, cleaning tasks, weather, heating, household preferences.

**Possible conclusions:**

- "Guest room is colder than usual and visitors arrive this evening."
- "No need to heat guest room today; guest event was cancelled."

### 6.10 Shopping/tasks plus appliances

**Inputs:** Shopping list, meal plan if later available, fridge/freezer status, dishwasher state, laundry state, calendar.

**Possible conclusions:**

- "Dishwasher should run before dinner prep because guests arrive at 18:00."
- "Laundry matters today because sports kit is on tomorrow's routine."

### 6.11 Repeated anomalies across domains

**Inputs:** Historical humidity, sensor drift, repeated recommendations, acknowledgements, seasonal changes.

**Possible conclusions:**

- "Bathroom drying has been slower all week; this is no longer a one-off."
- "Office sensor often reports lower than the room feels; confidence is reduced."

### 6.12 Unknown plus risk

**Inputs:** Missing data, stale sensors, critical upcoming routine.

**Possible conclusions:**

- "Cannot confirm bedtime readiness because Robin's room has no recent temperature."
- "Energy recommendation withheld because battery state is stale."

This is a positive intelligence behavior: refusing to overstate.

## 7. Household memory

A House Brain without memory is only a live interpreter. Memory turns it into a household assistant.

### 7.1 Types of memory

#### Normal behaviour memory

Records what typically happens:

- bathroom humidity usually falls within 35 minutes after showering;
- bedroom usually cools 1.5 °C between 20:00 and 23:00 in winter;
- family usually leaves around 08:10 on school days;
- washer cycles usually finish in about 70 minutes;
- base load is usually 300-450 W overnight;
- solar surplus usually drops after 16:30 in October.

#### Seasonal memory

Captures patterns that change by season:

- winter heating lead time;
- summer overheating risk;
- spring ventilation usefulness;
- solar production windows;
- school holiday routines;
- humidity behavior in wet seasons.

#### Weekly and routine memory

Captures recurring household rhythm:

- school days versus weekends;
- sport practice days;
- office work days;
- cleaning days;
- bedtime differences;
- regular guest visits;
- common laundry days.

#### Recommendation memory

Tracks interaction outcomes:

- accepted recommendations;
- dismissed recommendations;
- repeated ignored suggestions;
- acknowledgements such as "we know";
- situations muted by preference;
- action outcomes after recommendations.

#### Anomaly memory

Tracks deviations:

- recurring slow bathroom drying;
- repeated unexpected water flow;
- sensor drift or disagreement;
- vehicle charge predictions consistently too optimistic;
- rooms that are often colder than their target.

#### Preference memory

Captures household choices:

- preferred bedroom temperature ranges;
- willingness to trade energy cost for comfort;
- preference for silence about minor energy opportunities;
- priority of child comfort over tariff savings;
- when to surface opportunities versus recommendations.

### 7.2 How memory changes reasoning

Memory changes the Brain in five ways.

First, it defines normal. Without memory, 65% bathroom humidity is just a number. With memory, it can mean "normal 10 minutes after shower" or "unusually persistent after an hour".

Second, it improves timing. The Brain learns whether a bedroom needs 30 minutes or 90 minutes to warm before bedtime.

Third, it reduces noise. If the family repeatedly dismisses a low-value solar opportunity, the Brain should stop surfacing it unless the value or consequence increases.

Fourth, it strengthens confidence. Repeatedly accurate predictions earn higher confidence; repeated misses lower confidence and require more cautious language.

Fifth, it discovers slow changes. A room gradually becoming harder to heat, a bathroom drying slower each week, or a water-use pattern changing can become visible only historically.

### 7.3 Memory must be humble

Memory should not become surveillance. The Brain should remember household patterns because they improve household outcomes, not because every activity deserves analysis. Memory should be explainable, adjustable, and forgettable. If a pattern is inferred, it should be labelled as inferred until confirmed by repeated evidence or user preference.

## 8. Household understanding model

FamilyBoard should distinguish observation, interpretation, knowledge, understanding, decision, and action.

### 8.1 Definitions

**Observation:** A factual input or reported state.  
Example: `18 °C`, `washer finished`, `solar export 1.2 kW`, `calendar event at 08:15`.

**Interpretation:** A first layer of meaning attached to context.  
Example: `18 °C in Robin's bedroom`, `washer finished before bedtime`, `exporting power now`, `event may require departure`.

**Knowledge:** Stable household facts and learned patterns.  
Example: `Robin sleeps in this room`, `Robin is a child`, `school days usually leave around 08:10`, `this washer usually finishes near the reported time`.

**Understanding:** A situation-level judgement.  
Example: `Robin's bedroom may be too cold for sleep in one hour`, `wet laundry may sit overnight`, `surplus energy is available during a useful appliance window`.

**Decision:** The chosen attention posture and household meaning.  
Example: `Recommended: pre-heat Robin's room`, `Worth checking: unload washer`, `Silent: office is cold but unused`.

**Action:** A human or system action that follows.  
Example: `turn heating up for one hour`, `open bathroom window`, `start dryer`, `acknowledge`, `do nothing`.

### 8.2 Generic reasoning chain examples

#### Child bedroom comfort

Observation: 18 °C.  
Interpretation: Robin's bedroom is 18 °C.  
Knowledge: Robin sleeps here; bedtime is usually around 20:00; preferred sleep range is warmer in winter.  
Understanding: The room may be too cold for sleep unless warming starts soon.  
Decision: Recommended.  
Action: Suggest a temporary heating boost with explanation and confidence.

#### Laundry deadline

Observation: Washer finished at 19:15.  
Interpretation: Wet laundry is likely waiting in the washer.  
Knowledge: School uniforms are usually needed tomorrow; bedtime routine begins soon.  
Understanding: Leaving laundry wet overnight may create a morning problem.  
Decision: Worth checking or recommended, depending on confidence about contents/deadline.  
Action: Suggest unloading or moving to dryer.

#### Solar opportunity

Observation: Solar export is 1.8 kW and battery is nearly full.  
Interpretation: The house has flexible surplus now.  
Knowledge: Dryer is available; laundry deadline is tomorrow; surplus usually drops after 16:00.  
Understanding: Running dryer now likely uses otherwise exported energy and supports readiness.  
Decision: Nice opportunity or recommended depending on laundry deadline.  
Action: Suggest running dryer now.

#### Possible leak

Observation: Water flow continues for 12 minutes.  
Interpretation: Water is being used while no appliance is known to be active.  
Knowledge: Family is expected away; no normal routine explains water use.  
Understanding: Possible leak or unexpected water use.  
Decision: Important or urgent depending on flow rate, duration, and sensor confidence.  
Action: Recommend checking water immediately.

#### Known normal state

Observation: Heating demand rises at 06:30.  
Interpretation: Bedrooms are warming.  
Knowledge: Cold school morning routine normally starts heating at this time.  
Understanding: Expected morning warm-up.  
Decision: Silent.  
Action: None.

## 9. Decision model

The House Brain should produce decisions rather than raw states. A decision is a structured household judgement containing severity, usefulness, confidence, explanation, and recommended posture.

### 9.1 Decision levels

#### No action required

The Brain has enough evidence to conclude the situation is acceptable. This is stronger than silence because it may be shown when the user asks.

#### Known and expected

Something is happening, but it matches a routine or acknowledged situation. Example: heating demand during normal morning warm-up.

#### Nice opportunity

There is optional benefit with low downside. Example: solar surplus makes now a good time for laundry, but no deadline exists.

#### Worth checking

The situation may matter, but confidence or urgency is moderate. Example: washer likely finished, but contents/deadline unknown.

#### Recommended

There is a clear, useful action with enough confidence. Example: charge vehicle tonight before an early long trip.

#### Important

A material household outcome is at risk. Example: bedroom unlikely to be comfortable by bedtime without action.

#### Urgent

Delay could cause safety, damage, or major disruption. Example: water leak signal while nobody home.

#### Unable to judge

Critical evidence is missing, stale, conflicting, or unmapped. This is a first-class decision, not an error state.

### 9.2 Decision properties

Each decision should include:

- household situation name;
- affected people, rooms, routines, or resources;
- current posture;
- recommended action if any;
- action window;
- consequence if ignored;
- confidence;
- uncertainty reasons;
- evidence summary;
- assumptions;
- memory influence;
- silence/notification rationale;
- expiry time.

### 9.3 Decision priority

Priority should not be severity alone. It should combine:

- consequence severity;
- time sensitivity;
- actionability;
- confidence;
- affected person vulnerability;
- household routine importance;
- novelty versus acknowledged repetition;
- whether the household is likely to see it elsewhere;
- whether communicating now reduces or increases cognitive load.

## 10. Confidence and uncertainty

Uncertainty must be a first-class product concept. The Brain should be able to say "I do not know" without sounding broken.

### 10.1 Uncertainty types

#### Unknown

The Brain has no information for a needed concept. Example: no room mapping for a sensor.

#### Missing

The Brain expected information but did not receive it. Example: vehicle state unavailable.

#### Stale

The Brain has old information that may no longer support a decision. Example: bedroom temperature from two hours ago.

#### Conflicting

Evidence disagrees. Example: presence suggests nobody home, but motion or water flow suggests activity.

#### Low confidence inference

The conclusion depends on weak assumptions. Example: a calendar event may require travel, but location is missing.

#### Historical confidence

The Brain has learned that a pattern is usually reliable or unreliable. Example: washer duration predictions are usually accurate; vehicle API is often delayed.

#### Provider uncertainty

The provider reports unavailable, partial, estimated, or delayed data.

#### Context uncertainty

The facts are known, but the household meaning is unclear. Example: laundry is finished, but the Brain does not know if it contains needed clothing.

### 10.2 Propagation rules

Uncertainty should propagate through reasoning:

- A stale observation lowers interpretation confidence.
- Unclear room mapping lowers comfort understanding confidence.
- Missing calendar location lowers mobility prediction confidence.
- Conflicting presence and water evidence changes a leak conclusion from urgent fact to important check.
- High historical accuracy can improve but not eliminate uncertainty.
- Safety-critical decisions should not be suppressed solely because confidence is imperfect; they should be phrased cautiously.
- Convenience recommendations should be suppressed when confidence is low.

### 10.3 Product language

The Brain should avoid false certainty:

- Say "likely", "may", or "cannot confirm" when appropriate.
- Say what is known and unknown separately.
- Avoid declaring "all good" when important domains are unavailable.
- Prefer "I cannot tell whether the car will be ready" over a misleading green state.

## 11. Explainability

Every recommendation should be able to answer: "Why are you recommending this?"

### 11.1 Explanation structure

A good explanation contains:

1. **Conclusion:** the household judgement.
2. **Reason:** the primary cause.
3. **Evidence:** observations that contributed.
4. **Context:** routines, people, calendar, weather, or preferences that make it matter.
5. **Prediction:** what may happen if nothing changes.
6. **Assumptions:** inferred facts used in the reasoning.
7. **Uncertainty:** missing, stale, conflicting, or low-confidence evidence.
8. **Action window:** why now or when later.
9. **Alternative:** why the Brain did not choose another suggestion.
10. **Memory:** whether this is normal, unusual, repeated, or learned.

### 11.2 Example explanations

#### Run the dryer now

Conclusion: Recommended to run the dryer now.  
Reason: Solar surplus is available and laundry is likely needed tomorrow.  
Evidence: Solar export is high, battery is nearly full, washer has finished.  
Context: Tomorrow morning has an early school routine.  
Prediction: Surplus likely drops later; delaying may use grid energy or leave laundry unfinished.  
Assumptions: Finished washer contains relevant laundry.  
Uncertainty: Contents are not confirmed.  
Action window: Best within the next hour.  
Alternative: Waiting is acceptable if laundry is not needed tomorrow.

#### Pre-heat bedroom

Conclusion: Recommended to warm Robin's room.  
Reason: Room is below the preferred sleep range and bedtime is approaching.  
Evidence: Recent room temperature, heating target, outdoor cooling trend.  
Context: Robin sleeps there and bedtime usually starts around this time.  
Prediction: Room is unlikely to reach comfort range without earlier heating.  
Assumptions: Normal bedtime applies today.  
Uncertainty: If bedtime is delayed, urgency is lower.  
Action window: Next 30-60 minutes.

#### Say nothing about office temperature

Conclusion: No communication.  
Reason: Office is cool but unused today.  
Evidence: Office temperature is below usual work comfort; no work routine or calendar use is expected.  
Context: The room does not affect a near-term household moment.  
Prediction: No household consequence expected.  
Uncertainty: If someone plans to use the office informally, the Brain may not know.  
Action window: None.

## 12. Silence and notification philosophy

Silence is not failure. Silence is one of the House Brain's most important decisions.

### 12.1 When to deliberately say nothing

FamilyBoard should usually stay silent when:

- the situation is normal and expected;
- the household already acknowledged it;
- the same recommendation was recently dismissed;
- the consequence is insignificant;
- no useful action exists;
- the action window is not open;
- confidence is too low for a convenience suggestion;
- the family is likely already handling it;
- another surface is better suited;
- the issue is technical provider noise;
- the recommendation would interrupt a more important routine;
- the situation is a recurring preference, not a problem.

### 12.2 Information overload principles

- Prefer one meaningful household judgement over many small facts.
- Do not surface all domain outputs simultaneously.
- Suppress low-value opportunities when important issues exist.
- Collapse repeated issues into a remembered pattern.
- Escalate only when consequence, confidence, and actionability justify it.
- Let users ask for more detail instead of pushing detail by default.
- Avoid rewarding the system for speaking often.

### 12.3 Acknowledgement and fatigue

Acknowledgement should change future reasoning. If a parent says "we know the bathroom is humid", the Brain should suppress repeated reminders for a sensible period unless severity increases. If a family repeatedly ignores "run dishwasher during solar surplus", the Brain should downgrade it from recommendation to optional background or stop surfacing it.

### 12.4 Notification posture

Notifications should be reserved for:

- urgent or important risk;
- time-sensitive recommendations with a clear action;
- readiness failures that affect near-term routines;
- uncertainty that prevents a safety or readiness judgement;
- explicit user-requested watch conditions.

Nice opportunities usually belong on passive surfaces, not interruptions.

## 13. What makes FamilyBoard fundamentally different from Home Assistant

The answer is not "more sensors". The difference is **household context and product judgement**.

Home Assistant is excellent at integrating devices, exposing states, running automations, and letting technical users configure logic. FamilyBoard should be excellent at understanding what those states mean for a family.

### 13.1 Context Home Assistant usually does not own

FamilyBoard can know or infer:

- family relationships;
- children's ages;
- bedrooms and room ownership;
- bedtime routines;
- school/work patterns;
- calendars and departures;
- shopping and task commitments;
- household preferences;
- previous recommendations and acknowledgements;
- which person is affected by a situation;
- which outcome matters more than device optimisation;
- long-term family-facing product language.

### 13.2 Capabilities FamilyBoard can provide

- Room comfort judged against the next person and use, not a generic threshold.
- Bedtime readiness across comfort, humidity, laundry, vehicle, and safety.
- Morning readiness across calendar, weather, mobility, laundry, and tasks.
- Energy recommendations constrained by household deadlines and preferences.
- Silence based on family routine and acknowledgement.
- Explanations written for family outcomes rather than device states.
- Memory of what recommendations helped or annoyed this household.
- Confidence that combines data freshness, context strength, and historical reliability.

### 13.3 Why this cannot be reduced to automations

A Home Assistant automation might say: if solar export > X and washer finished then notify. The House Brain asks a richer question:

- Is there a laundry deadline?
- Is dryer use appropriate now?
- Will surplus last long enough?
- Has the family ignored this suggestion before?
- Is there a more important issue to communicate?
- Is the battery being preserved for overnight needs?
- Is the recommendation still useful if action is manual?

That product judgement is FamilyBoard's differentiator.

## 14. Reject dashboard thinking

The following ideas should remain outside the House Brain or be treated as evidence only.

### Raw telemetry panels

Charts of every temperature, power flow, humidity level, or sensor value may be useful in diagnostics, but they are not household reasoning. The Brain should consume telemetry, not become a telemetry product.

### Entity browsing

Home Assistant entity names, integration details, attributes, MQTT topics, and device inventories are provider concerns. Exposing them would make FamilyBoard a frontend for a technical system rather than a household assistant.

### Device management

Pairing devices, choosing entities, configuring protocols, setting up Zigbee/MQTT/vendor integrations, and debugging provider health belong outside the House Brain. If FamilyBoard ever supports setup, it should remain in configuration surfaces, not household reasoning.

### Automation editing

Rule builders, trigger/action editors, and YAML-like configuration should not define the Brain. The Brain may produce safe action suggestions, but the product value is reasoning and judgement, not user-authored automation complexity.

### Always-on status tiles

Permanent cards for every appliance, room, vehicle, or device recreate dashboard monitoring. The Brain should decide what is currently meaningful instead of requiring the family to scan tiles.

### Feature catalogues disguised as intelligence

A list of possible domains is not a Brain. A Brain must decide, prioritise, explain, stay silent, remember, and adapt.

## 15. Conceptual product architecture

This is product architecture, not software architecture.

```text
Reality
  ↓
Observations
  ↓
Household meaning bindings
  ↓
House Brain reasoning domains
  ↓
Cross-domain situation recognition
  ↓
Household memory and confidence
  ↓
Household decisions
  ↓
Explanations and silence policy
  ↓
FamilyBoard experiences
  ↓
Pages, moments, notifications, conversations, weekly reviews
```

### Layer descriptions

**Reality:** The actual lived household: people, rooms, weather, appliances, plans, habits, and constraints.

**Observations:** Evidence from providers and FamilyBoard itself.

**Household meaning bindings:** The translation from evidence to family concepts: which room, which person, which routine, which goal.

**Reasoning domains:** Domain lenses such as comfort, readiness, energy, laundry, mobility, water, safety, weather, routine, people, and capability health.

**Cross-domain situation recognition:** The synthesis layer where interesting intelligence appears.

**Memory and confidence:** The layer that adapts, learns normal, tracks uncertainty, and prevents overclaiming.

**Household decisions:** The output layer: no action, expected, opportunity, worth checking, recommended, important, urgent, or unable to judge.

**Explanations and silence policy:** The communication governor.

**Experiences:** The places where decisions are consumed. A Home Automation page is only one possible experience.

## 16. Long-term vision

The long-term vision is a FamilyBoard that can answer household questions in family language:

- "Is the house ready for bedtime?"
- "Do we need to do anything before leaving?"
- "Why are you suggesting the dryer now?"
- "What changed from normal?"
- "Can we ignore the house tonight?"
- "What should we handle before tomorrow morning?"
- "What are you unsure about?"

Over time, the House Brain could support:

- daily readiness summaries;
- weekly household pattern reviews;
- family preference tuning;
- proactive but sparse recommendations;
- provider-neutral smart-home capabilities;
- household resilience planning;
- assistive routines for parents;
- child-friendly explanations of household responsibilities;
- safe consent-based actions for bounded scenarios.

The vision should not be to automate the home as much as possible. It should be to make the household easier to run.

## 17. Risks of building the wrong intelligence model

### Risk 1: Recreating Home Assistant with softer visuals

If FamilyBoard starts from devices, entities, and controls, it loses its differentiation and competes with a mature technical platform on the wrong axis.

### Risk 2: Mistaking features for intelligence

Adding energy, laundry, EV, water, and climate features does not automatically create a Brain. Without memory, confidence, cross-domain reasoning, and silence, the product remains a dashboard.

### Risk 3: Over-notification

A noisy assistant will be muted or ignored. Recommendation fatigue is a product failure, not a tuning issue.

### Risk 4: False certainty

Saying "all good" when sensors are stale or mappings are missing breaks trust. The Brain must be willing to say it cannot judge.

### Risk 5: Optimising devices instead of household outcomes

Energy efficiency, heating optimisation, and automation convenience can conflict with family comfort, school readiness, or stress reduction. Household outcomes must win.

### Risk 6: Overfitting to one provider

If Home Assistant shapes the concepts too early, FamilyBoard becomes dependent on entity models and integration quirks. Semantic capabilities must be provider-neutral.

### Risk 7: Privacy discomfort

Memory and routine inference can feel invasive if not explained, controlled, and clearly useful. The Brain should remember only what improves household assistance.

### Risk 8: Automation before trust

Acting automatically before the Brain has earned confidence and explainability can make mistakes feel dangerous. Recommendations should precede automation.

### Risk 9: UI-first distortion

Designing a page before designing the reasoning can force the Brain into cards and badges. The intelligence must come first; surfaces should consume decisions later.

### Risk 10: Ignoring silence as a product capability

If every detected situation becomes visible, the Brain will train users to ignore it. Silence must be designed, not treated as absence.

## 18. If FamilyBoard lost every automation capability but kept the House Brain, would it still provide value?

Yes. This is the clearest validation test for the design.

If FamilyBoard could not switch heating, start dryers, charge cars, close blinds, lock doors, or run automations, the House Brain would still provide value by answering questions the household otherwise has to assemble manually:

- whether bedrooms will be comfortable by bedtime;
- whether tomorrow morning is prepared;
- whether laundry timing matters tonight;
- whether a water condition is unusual;
- whether an energy opportunity is worth using manually;
- whether a vehicle needs attention before a real departure;
- whether a situation is normal, expected, acknowledged, or unusual;
- why a recommendation exists;
- what the system is uncertain about;
- when the family can safely ignore the house.

That value survives without automation because the product is not control. The product is household understanding.

This also exposes the right boundary: automation should be an optional execution layer beneath a trusted reasoning product. If the Brain is not useful without automation, then it is probably just a control surface. If it remains useful without automation, then FamilyBoard has a product identity fundamentally different from Home Assistant.
