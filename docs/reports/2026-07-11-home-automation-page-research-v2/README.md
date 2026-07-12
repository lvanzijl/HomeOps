# Home Automation Page Research V2: How Is My House Doing?

Date: 2026-07-11  
Repository: HomeOps / FamilyBoard  
Baseline reviewed: `docs/reports/2026-07-11-home-automation-page-research/README.md`  
Working page name: `Woning`

## 1. Revised product philosophy

The Home Automation page should not be a dashboard of devices. It should be a household interpretation surface that answers one question:

> How is my house doing?

That question is deliberately broader than temperature, power, devices, or Home Assistant state. A house can be "doing well" when rooms are comfortable for the people who will use them, laundry is not blocking the evening routine, energy decisions are easy, tomorrow morning is prepared, and nothing needs attention. A house can also be "not doing well" even when every individual sensor value looks normal, because the meaning depends on time, family context, weather, calendars, and routines.

The long-term product direction should therefore be **household reasoning first, telemetry second, control last**.

### What the page should feel like

A family member should be able to glance at `Woning` and understand one of a small number of human outcomes:

- "Everything is normal."
- "One thing needs attention before bedtime."
- "Now is a good moment to use surplus energy."
- "Tomorrow morning is at risk unless the car charges tonight."
- "The bathroom still needs ventilation."
- "The house is ready for the night."
- "Something important is unknown, so the house cannot confidently say it is okay."

The page should avoid making the user assemble meaning from raw facts. "Bedroom: 18.0 °C" is not the product. "Robin's bedroom is comfortable for sleeping" is the product.

### Ranking page communication modes

1. **Exceptions**  
   Exceptions deserve the highest rank because a calm home page earns trust by being quiet until something matters. Exceptions include comfort risks, appliance-finished states, water-meter anomalies, humidity persistence, charging risks, and stale critical data.

2. **Predictions**  
   Predictions create the largest new value beyond Home Assistant. They turn "now" into "what will matter later": bedroom comfort by bedtime, battery coverage until sunrise, car readiness before departure, heating demand during a cold evening, or laundry timing before school uniforms are needed.

3. **Recommendations**  
   Recommendations are valuable when they are bounded, explainable, and optional: run laundry now, ventilate the bathroom, charge the EV tonight, postpone dryer use until solar surplus, pre-warm a child's bedroom. Recommendations should never become noisy generic tips.

4. **Opportunities**  
   Opportunities are positive, non-urgent moments: solar surplus, low tariff window, battery charging from excess production, enough time to dry laundry, or mild weather that reduces heating demand. They should be visible when actionable and otherwise stay quiet.

5. **Status**  
   Status is still necessary, but it should mostly explain the conclusion rather than dominate the page. The page may show supporting facts, but the primary unit is meaning: comfortable, ready, needs attention, good moment, likely issue, unknown.

This ranking means the page is not primarily a status dashboard. Status is the evidence layer underneath a household judgement.

## 2. Critical review of the previous report

The first report correctly rejected raw Home Assistant entity browsing and identified semantic contracts as necessary. Its strongest idea remains valid: FamilyBoard should consume normalized household capabilities instead of vendor-specific integrations.

However, the report still remained too technical and too dashboard-shaped in several ways.

### Unnecessary dashboard thinking

- It organized the page around domains such as climate, heating, appliances, energy, vehicles, and safety. Those domains are useful implementation boundaries, but they are not how the household thinks.
- It described grids, cards, sections, and visibility rules before fully defining the situations the page should communicate.
- It treated many features as independent cards instead of asking how they contribute to a single house-level story.
- It assumed V1 should be primarily climate/heating because those sensors are available. Availability is not the same as product importance.
- It separated energy, laundry, and vehicles into later domains, even though the newly confirmed and planned capabilities make these central to the question "how is my house doing?".

### Features that exposed data instead of insight

The previous report often used better-than-raw terminology, but many feature titles still implied telemetry surfaces:

- `Indoor climate overview` should become "Are the rooms ready for their next use?"
- `Per-room comfort grid` should become "Which important room is not ready for the person/time that matters?"
- `Energy now` should become "Is this a good moment to consume, store, export, or avoid power?"
- `EV charging readiness` should become "Will each car be ready before the next real departure?"
- `Active appliances` should become "Is laundry waiting on a person, blocking a plan, or using the right energy moment?"
- `BatteryState` should become "How long can the house run on stored energy, and should we save it for later?"

### Opportunities for richer household intelligence

The previous report underused FamilyBoard-specific context. FamilyBoard can know family members, children's ages, room ownership, calendars, weather, recurring routines, tasks, and shopping rhythms. That context changes the interpretation of automation data:

- The same room temperature can mean "fine" in a hallway, "too cold" in a toddler bedroom before bedtime, or "acceptable" in a spare room with no scheduled use.
- A car at 45% battery may be fine on a quiet Saturday but risky before a 08:00 appointment 35 km away.
- A finished washing machine matters more when school clothes are needed tomorrow.
- Humidity after a shower is normal for a short time, but persistent humidity before bedtime may need ventilation.
- Heating demand is more meaningful when combined with outdoor temperature forecast and occupancy plans.
- Energy surplus is more valuable when there is laundry waiting, an EV plugged in, or a home battery with capacity.

### Features that should be removed entirely from the product vision

These concepts should not be first-class page goals:

- A generic room comfort grid that is always equally prominent.
- Always-on energy telemetry charts.
- Raw solar production, import/export, or battery percentage as primary content.
- Camera/security feed presentation.
- Device health lists, unless a failed device makes the house unable to answer an important question.
- Vendor/integration diagnostics on the daily page.
- Detailed thermostat schedule editing.
- Entity selection, source setup, and threshold tuning.
- Historical charts for every measurement.

Those may exist in Settings or Home Assistant, but they do not answer "how is my house doing?" for daily family use.

### New concepts missing from the previous report

- **Readiness:** whether the house is ready for bedtime, morning departure, nobody-home mode, laundry completion, or a cold evening.
- **Next-use comfort:** whether rooms will be acceptable at the next time they matter.
- **Energy timing:** whether now/later/tomorrow is the better moment for appliances, vehicles, or battery behavior.
- **Confidence:** whether the page knows enough to make a judgement.
- **House narrative:** a single top-level sentence that synthesizes the most important current and near-future state.
- **Action windows:** bounded time periods where an action is unusually sensible.
- **Routine-aware silence:** hiding normal states when the household does not need them.
- **Cross-capability causality:** explaining relationships such as "dryer is using grid power because the battery is preserving charge for tonight" or "bedroom is cooling faster because outside temperature drops after sunset".

## 3. Household intelligence model

The page needs an intelligence model that turns measurements into household knowledge. This is a product model, not an implementation architecture.

### Layer 1: Signals

Signals are raw or normalized facts:

- room temperature and humidity;
- Evohome zone state and target;
- P1 smart meter import/export and consumption;
- water-meter flow;
- appliance running/finished states from WiFi integrations and/or smart plugs;
- EV/charger connected, charging, state of charge, and charge rate;
- home battery state of charge and charge/discharge flow;
- weather forecast, outdoor temperature, rain, wind, solar expectations;
- calendar events and likely departure windows;
- known family members, ages, rooms, routines, and task/list context.

Signals are not enough. They answer "what is measured?" not "what matters?".

### Layer 2: Context

Context gives meaning to signals:

- who uses a room;
- whether the person is a child, adult, guest, or nobody;
- when the room will next be used;
- whether that use is sleep, work, play, showering, cooking, leaving home, returning home, or laundry;
- what tomorrow morning requires;
- whether the household is in a normal weekday, weekend, vacation, nobody-home, or evening routine;
- whether weather will change heating demand, ventilation suitability, solar production, or travel timing;
- whether a calendar event implies a real departure;
- whether a task/list item implies a household dependency, such as sports clothes or school supplies.

### Layer 3: Interpretation

Interpretation transforms signals plus context into household statements:

- "Robin's bedroom is comfortable for sleeping."
- "The bathroom is still humid longer than usual after showering."
- "The washer has finished and should be emptied before bedtime."
- "The house is importing power because the dryer is running and solar has dropped."
- "The battery can probably cover base load until sunrise."
- "The Peugeot will not be ready before the first appointment unless charging starts tonight."
- "Water use is unusual while nobody is expected to be home."
- "Heating demand will rise this evening because temperature drops quickly after sunset."

### Layer 4: Decision

A decision is what the household can do now or plan for later:

- do nothing because everything is normal;
- ventilate a room;
- unload laundry;
- run the washing machine now;
- delay the dryer until surplus returns;
- plug in or start charging a car;
- let the battery discharge, preserve it, or watch it;
- pre-warm a child's room;
- check possible water flow;
- accept an unknown state because the risk is low.

### Layer 5: Confidence and explanation

Every judgement should carry a confidence level, even if only visible in detail:

- **confident:** recent signals and clear context;
- **partial:** enough to offer a cautious statement, but missing a relevant signal;
- **unknown:** cannot answer without misleading;
- **stale:** previously known but too old for current decisions;
- **conflicting:** sources disagree or the inference is unstable.

Confidence matters because a calm "everything is normal" is only trustworthy if the page knows what it has checked.

## 4. Decision-first feature catalogue

This catalogue is organized by household decisions and stories, not by cards or integrations.

### 4.1 Is everything normal?

**House story:** "Everything important is normal" or "One thing needs attention."  
**Decision supported:** whether the family can ignore the page.  
**Useful actions:** none when normal; jump to the single most important exception when not.  
**Required capabilities:** at least one trusted domain; stronger with climate, energy, laundry, water, vehicles, and calendar context.  
**FamilyBoard advantage:** can decide what is important to this household instead of listing every HA entity.

Normal should be an active conclusion, not absence of red badges. A possible top-level sentence:

- "Alles rustig. Slaapkamers zijn op schema voor vanavond; de wasmachine is klaar."
- "Bijna alles rustig. Badkamer blijft vochtig; even ventileren."
- "Niet alles bekend. Energiestatus is actueel, maar slaapkamers missen recente metingen."

### 4.2 Are rooms ready for the people who will use them?

**House story:** rooms are evaluated against their next meaningful use.  
**Decision supported:** ventilate, heat, ignore, or check sensor.  
**Useful actions:** pre-warm briefly, open/close ventilation, acknowledge normal, inspect room.  
**Required capabilities:** temperature sensors, humidity sensors, Evohome zone state, room-person/routine mapping.  
**FamilyBoard advantage:** knows children's ages, family members, bedtime routines, and room meaning.

Examples:

- "Robin's bedroom will be comfortable at bedtime if heating continues."
- "Mila's room is cooling faster than usual; check again before bedtime."
- "The office is cool, but nobody is scheduled to use it today."
- "The bathroom humidity is still high 45 minutes after shower time."
- "The playroom is warm, but acceptable because no sleep routine depends on it."

### 4.3 Is bedtime on track?

**House story:** the house is or is not ready for night.  
**Decision supported:** whether parents need to act before putting children to bed.  
**Useful actions:** warm bedroom for one hour, ventilate bathroom, unload washer/dryer, plug in car, check doors/windows if sensors later exist.  
**Required capabilities:** room climate, Evohome, humidity, appliance state; stronger with calendar and EV/charger.  
**FamilyBoard advantage:** knows children's rooms and likely bedtime windows.

Possible bedtime readiness components:

- children's bedrooms comfortable or warming in time;
- bathroom humidity declining;
- washer/dryer not waiting with wet clothes;
- energy plan for overnight charging is clear;
- battery has enough expected charge for overnight base load if that is a household goal;
- no unexplained water use.

### 4.4 Is tomorrow morning prepared?

**House story:** tomorrow's departures and routines are feasible.  
**Decision supported:** charge vehicle, dry clothes, pre-heat rooms, avoid morning surprises.  
**Useful actions:** start EV charging, move laundry to dryer, schedule/prefer a charge window, run dishwasher/laundry if energy is cheap or abundant, set heating boost.  
**Required capabilities:** calendars, weather forecast, EV/charger state, appliance state, energy state, heating demand forecast.  
**FamilyBoard advantage:** can infer the first meaningful calendar appointment and which family member/vehicle/room it affects.

Examples:

- "Tomorrow's first appointment is at 08:15; the Peugeot needs charging before then."
- "Rain is likely during the school run; indoor drying matters more tonight."
- "Cold morning expected; bedrooms may need earlier heating."
- "Laundry is still wet and school starts early tomorrow."

### 4.5 Is now a good moment to use energy?

**House story:** current and near-future energy state creates an opportunity or a reason to wait.  
**Decision supported:** run washing machine/dryer, charge car, store energy, or do nothing.  
**Useful actions:** start washer, start dryer, start/stop car charging where safe, postpone high-consumption appliance.  
**Required capabilities:** P1 smart meter, solar/current generation if available, home consumption, appliance states, battery state; stronger with forecast and charger state.  
**FamilyBoard advantage:** connects opportunity to waiting household tasks and calendar needs.

Examples:

- "Good time for laundry: the house is exporting enough power and the washer is idle."
- "Wait with the dryer: solar is dropping and the battery is saving charge for tonight."
- "Charge the car now if you need range tomorrow; surplus is available for the next hour."
- "No energy action needed; battery is charging and no appliances are waiting."

### 4.6 Is laundry moving through the household?

**House story:** laundry is not just an appliance state; it is a small workflow.  
**Decision supported:** start, wait, transfer, unload, or ignore.  
**Useful actions:** unload washer, move to dryer, unload dryer, run during surplus, check error.  
**Required capabilities:** washing machine WiFi, dryer WiFi, planned smart plugs for higher-confidence power state, energy state.  
**FamilyBoard advantage:** can connect laundry to tasks/routines without integrating those pages: school day, sports day, weekend, bedtime, or vacation packing can change priority.

Examples:

- "The washing machine has finished; move it before bedtime to avoid damp laundry."
- "Dryer is running on grid power; solar surplus has ended."
- "Laundry can finish before dinner if started now."
- "Washer appears idle, but the smart plug is planned; confidence is partial until power state exists."

### 4.7 Will the vehicles be ready?

**House story:** the household's mobility is ready for the next known trip.  
**Decision supported:** plug in, start charging, delay charging, prioritize one EV, or ignore.  
**Useful actions:** charge Peugeot, charge new EV, choose charger priority, confirm charger schedule, act on charger error.  
**Required capabilities:** Peugeot e-208 state if available, planned Zaptec Go 2 charger, planned second EV, calendar departure inference, energy state.  
**FamilyBoard advantage:** calendar-aware readiness instead of raw state of charge.

Examples:

- "The Peugeot is ready for tomorrow's first appointment."
- "The new EV should charge first tonight because it has the early trip."
- "Both cars cannot reach target before morning at the current charge plan."
- "The charger is available; starting now uses today's surplus."

### 4.8 Is the battery helping the house?

**House story:** the battery is either supporting the house, storing surplus, preserving energy for later, or not relevant.  
**Decision supported:** run appliances now, save energy for evening, understand grid import/export, detect unexpected behavior.  
**Useful actions:** usually no direct action in FamilyBoard initially; use the state to time appliances/charging.  
**Required capabilities:** planned Marstek plug-in home battery, P1 meter, current consumption, solar/forecast if available.  
**FamilyBoard advantage:** translates battery percentage into household coverage and timing.

Examples:

- "Battery is powering the house; expected to last until around midnight at current use."
- "Battery can likely cover base load until sunrise."
- "Battery is charging from surplus; good moment to wait before starting the dryer."
- "Battery is low before a high-use evening; avoid optional loads if possible."

### 4.9 Is water use normal?

**House story:** water flow should match household presence and routines.  
**Decision supported:** ignore expected use, check possible leak/running tap, investigate unusual flow.  
**Useful actions:** check bathroom/kitchen, inspect garden tap, ignore if someone is showering.  
**Required capabilities:** water meter; stronger with presence/routine/calendar context.  
**FamilyBoard advantage:** distinguishes expected morning shower use from unexpected nobody-home use.

Examples:

- "Water use is normal for the morning routine."
- "Water is still running while nobody is expected to be home."
- "Higher water use after laundry is expected."
- "Possible running tap: small continuous flow for 45 minutes."

## 5. Time-aware household scenarios

### Morning

**What the page should communicate**

- Whether the house is ready for departures.
- Whether bedrooms/bathroom conditions need action before leaving.
- Whether vehicles are sufficiently charged for the day's first trips.
- Whether any appliance has finished and should not be forgotten.
- Whether unusual water or energy use is happening while the house transitions to empty.

**Useful actions**

- Start or stop a short heating adjustment.
- Move/unload laundry.
- Start charging if a vehicle is not ready.
- Check water flow before leaving.

**Required capabilities**

- Calendars, room climate, humidity, Evohome, appliance states, P1 meter, water meter, EV/charger state.

### Parents leaving for work

**What the page should communicate**

- Whether the house can be left alone calmly.
- Whether any running appliance will finish unattended.
- Whether energy use is expected or suspicious.
- Whether the car needed for work is ready.

**Useful actions**

- Plug in/start EV charging if needed.
- Delay dryer if nobody will be home to unload.
- Check continuous water flow.
- Let the house go quiet if all is normal.

**Required capabilities**

- Calendar/departure inference, appliance state, water meter, P1 meter, EV/charger state.

### Children going to bed

**What the page should communicate**

- Whether each child's bedroom is comfortable for sleeping.
- Whether a room is likely to become too cold before bedtime.
- Whether humidity from bathroom/shower has returned to normal.
- Whether noise/energy actions such as dryer use should wait.

**Useful actions**

- Pre-warm a bedroom temporarily.
- Ventilate bathroom or bedroom.
- Move laundry from washer to dryer before bedtime.
- Defer noisy or high-consumption appliance actions.

**Required capabilities**

- Family member ages/rooms, bedtime routines, temperature/humidity, Evohome, appliance states, energy context.

### Laundry day

**What the page should communicate**

- Whether washer/dryer are idle, running, finished, or blocked.
- Whether now/later is a better energy moment.
- Whether laundry can finish before a relevant deadline.
- Whether wet laundry is waiting too long.

**Useful actions**

- Start washing machine during surplus.
- Move washer load to dryer.
- Start dryer when surplus/battery timing is favorable.
- Unload dryer before bedtime or departure.

**Required capabilities**

- Washing machine WiFi, dryer WiFi, planned smart plugs, P1 meter, battery, weather/solar prediction if available, routine/calendar context.

### Sunny afternoon

**What the page should communicate**

- Whether surplus energy is available or expected soon.
- Whether the battery is charging or full.
- Whether laundry or EV charging can use the opportunity.
- Whether overheating/humidity risks exist in sun-exposed rooms if sensors support that later.

**Useful actions**

- Start washer/dryer.
- Charge EV if needed.
- Let battery fill before optional loads if that is better.
- Ventilate if outdoor conditions are favorable.

**Required capabilities**

- P1 meter, battery, EV/charger, appliance state, weather/solar forecast, room climate.

### Heavy rain

**What the page should communicate**

- Whether indoor drying becomes important.
- Whether humidity is likely to persist.
- Whether tomorrow's departure/weather increases vehicle readiness importance.
- Whether water use or leak-like patterns are abnormal if water/leak sensing expands later.

**Useful actions**

- Use dryer rather than waiting for outdoor drying.
- Ventilate when practical if humidity is high.
- Charge vehicle earlier if poor weather affects travel plans.

**Required capabilities**

- Weather forecast, humidity sensors, dryer state, EV/charger, calendar.

### Vacation

**What the page should communicate**

- Whether the house is stable while routines are suspended.
- Whether water flow, energy use, or heating behavior looks unexpected.
- Whether appliances are off/idle.
- Whether stale data prevents confidence.

**Useful actions**

- Check unexpected water use.
- Check persistent high energy draw.
- Avoid daily routine prompts that no longer apply.

**Required capabilities**

- Calendar/vacation context, P1 meter, water meter, appliance states, heating/climate state, data freshness.

### Nobody home

**What the page should communicate**

- Whether the house is quiet in the expected way.
- Whether water or energy use is unexplained.
- Whether heating is running unnecessarily in rooms not scheduled for use.
- Whether appliance cycles are expected.

**Useful actions**

- Investigate continuous water flow.
- Decide whether a running appliance is acceptable.
- Lower heating if safe and available.

**Required capabilities**

- Calendar/routine-based absence inference, P1 meter, water meter, Evohome, appliance states.

### Weekend

**What the page should communicate**

- Later starts and different routines change what matters.
- Comfort thresholds/timing may shift.
- Energy opportunities may be more actionable because people are home.
- Laundry windows are easier to use.

**Useful actions**

- Run appliances during sunny periods.
- Warm play/living areas rather than work/school departure zones.
- Ignore early-morning alerts that only apply to weekdays.

**Required capabilities**

- Calendar/routine context, climate, energy, appliances, EV/charger.

### Cold winter evening

**What the page should communicate**

- Whether important rooms will remain comfortable.
- Whether heating demand is rising and why.
- Whether battery/energy behavior affects appliance timing.
- Whether overnight readiness is on track.

**Useful actions**

- Pre-warm child bedrooms.
- Avoid running dryer at the most expensive/high-load moment if not urgent.
- Charge vehicle if morning departure requires it.

**Required capabilities**

- Evohome, room temperature, weather forecast, P1 meter, battery, EV/charger, calendar.

## 6. Opportunities instead of telemetry

The page should reframe positive states as opportunities only when they help a decision.

| Telemetry-style fact | Household opportunity | Useful only if |
|---|---|---|
| Exporting 1800 W | Run a high-consumption appliance now | Washer/dryer/EV is idle or waiting |
| Battery 78% | Battery can support the evening or overnight | Consumption forecast and sunrise/solar context exist |
| Washer idle | Laundry can be started in a favorable window | There is enough time and energy timing is good |
| Dryer finished | Clothes can be put away before bedtime | Someone is likely home/available |
| EV plugged in | Charging can be scheduled for cheapest/best window | Departure need and charge state are known |
| Bedroom 18 °C | Room is comfortable or at risk for the next sleep period | Room owner/use and bedtime are known |
| Bathroom 72% humidity | Ventilation may still be needed | Recent shower/routine timing and trend are known |
| Low grid import | House is running efficiently now | It differs meaningfully from expected baseline |
| Continuous small water flow | Possible tap/leak to check | Flow persists outside expected routines |

Telemetry should become visible only as explanation: "why does the page say this?".

## 7. Predictive features

Predictions are valuable when they support a near-term household decision and can be explained simply.

### High-value predictions

1. **Bedroom comfort by bedtime**  
   Uses current temperature, heating state, target, room history, outdoor forecast, and bedtime routine. This helps parents decide whether to pre-warm or ventilate.

2. **Bathroom humidity recovery**  
   Uses humidity trend and expected shower timing. This prevents both over-warning immediately after a shower and under-warning when humidity remains high too long.

3. **EV readiness before first departure**  
   Uses vehicle/charger state, charge rate, target, and calendar. This is much more useful than state of charge alone.

4. **Battery coverage until sunrise or next solar window**  
   Uses state of charge, current household base load, expected overnight load, and solar/weather forecast. This turns battery percentage into household meaning.

5. **Good appliance window**  
   Uses current surplus/import, battery state, predicted solar, and appliance duration. This helps decide whether to start washer/dryer now or later.

6. **Heating demand later today**  
   Uses weather forecast and indoor temperature trends. This helps prepare for cold evenings and avoid surprise discomfort.

7. **Nobody-home anomaly risk**  
   Uses calendar/routine absence plus water/energy flow. This turns meters into "should someone check?" instead of charts.

### Lower-value or risky predictions

- Precise room temperature hours ahead without calibration.
- Exact appliance finish time if the appliance integration is unreliable.
- Exact battery-to-sunrise guarantees without stable load modelling.
- Exact range sufficiency for EVs unless route/distance assumptions are robust.
- Broad "energy saving tips" that are not tied to a current household decision.

### Prediction time horizons

- **Now:** exceptions, opportunities, currently finished/running states, comfort status.
- **Later today:** appliance windows, humidity recovery, solar surplus, heating demand.
- **Tonight:** bedtime readiness, battery overnight coverage, vehicle charging plan.
- **Tomorrow morning:** first departure readiness, room warmth, laundry dependencies.
- **Upcoming weather:** heating demand, solar production, ventilation suitability, rain-related laundry/travel choices.
- **Upcoming calendar events:** departures, room use, vehicle readiness, absence/vacation mode.

## 8. Capabilities enabled by the newly available environment

The newly confirmed household environment materially changes the product vision.

### Home Assistant

Semantic capability unlocked: a normalization layer for devices and automations.  
Product meaning: FamilyBoard can ask for household states instead of implementing vendor logic.  
Unlocked stories:

- house-level confidence;
- capability freshness;
- derived appliance states;
- safe heating abstractions;
- cross-device rules such as window/heating or appliance/energy timing later.

### Evohome

Semantic capability unlocked: zone heating state, target temperature, possibly temporary control.  
Product meaning: room comfort can include whether a cold room is already being corrected.  
Unlocked stories:

- "bedroom is cold but heating is active";
- "room is cold because target is set low";
- "pre-warm before bedtime";
- "heating demand will rise tonight".

### Temperature sensors

Semantic capability unlocked: current and trending room comfort.  
Product meaning: room state can be evaluated for the person and next use.  
Unlocked stories:

- sleeping comfort;
- room readiness;
- cold-room exceptions;
- heating effectiveness;
- nobody-home heating sanity.

### Humidity sensors

Semantic capability unlocked: ventilation and dampness interpretation.  
Product meaning: humidity becomes a time-aware recovery question, not a percentage.  
Unlocked stories:

- bathroom still humid after showering;
- bedroom humidity may affect sleep comfort;
- heavy-rain day indoor drying caution;
- ventilation opportunity when outdoor conditions are favorable.

### P1 smart meter

Semantic capability unlocked: whole-home electricity import/export and consumption.  
Product meaning: energy can be tied to decisions about appliances, vehicles, and battery.  
Unlocked stories:

- good moment to consume surplus;
- unexpected high consumption;
- battery supplying the house;
- dryer/washer energy timing;
- nobody-home consumption anomaly.

### Water meter

Semantic capability unlocked: whole-home water flow and usage pattern.  
Product meaning: water becomes a safety/routine signal.  
Unlocked stories:

- possible running tap;
- unexpected flow while nobody home;
- normal morning/shower/laundry water pattern;
- vacation-mode water anomaly.

### Peugeot e-208

Semantic capability unlocked: one known EV with possible charge/readiness state.  
Product meaning: vehicle readiness can be connected to calendar and charging opportunities.  
Unlocked stories:

- ready for tomorrow's first appointment;
- needs charging tonight;
- charging during surplus;
- vehicle-specific exception if data is stale.

### Washing machine connected to WiFi

Semantic capability unlocked: appliance cycle state without relying only on power inference.  
Product meaning: laundry can become a household workflow.  
Unlocked stories:

- washer finished;
- wet laundry waiting;
- start washer during surplus;
- washer error or unavailable state.

### Dryer connected to WiFi

Semantic capability unlocked: dryer cycle state and possibly completion/remaining time.  
Product meaning: drying can be coordinated with energy, bedtime, and routines.  
Unlocked stories:

- dryer finished before bedtime;
- dryer running during expensive/grid-heavy moment;
- start dryer while surplus/battery makes sense;
- avoid starting dryer too late/noisy.

## 9. Features unlocked by planned hardware

### Smart plug for washing machine

Semantic capability unlocked: higher-confidence power/activity inference and cross-check against WiFi state.  
Product meaning: the page can better distinguish idle, running, finished, and possibly forgotten wet laundry.  
New stories:

- "Washer appears finished even though the appliance app did not update."
- "Washer is drawing standby only; cycle is done."
- "Laundry state confidence is high because appliance and plug agree."

### Smart plug for dryer

Semantic capability unlocked: dryer power draw and activity confidence.  
Product meaning: dryer energy impact can be tied to solar/battery/grid state.  
New stories:

- "Dryer is using most of current house consumption."
- "Dryer can run mostly on surplus now."
- "Dryer finished but door/unload state is unknown."

### Marstek plug-in home battery

Semantic capability unlocked: storage state and charge/discharge flow.  
Product meaning: energy decisions can account for stored power, not just current import/export.  
New stories:

- "Battery is supplying the house."
- "Battery is charging from surplus."
- "Battery can probably carry the house until sunrise."
- "Save battery for evening instead of starting optional load now."

### Zaptec Go 2 charger

Semantic capability unlocked: charger connection, charging state, power, possibly control/scheduling.  
Product meaning: charging readiness can be based on charger reality rather than vehicle cloud state alone.  
New stories:

- "Car is plugged in but not charging."
- "Charging will finish before the morning appointment."
- "Charger is available; use solar/battery window now."
- "Charging paused because house is prioritizing battery or grid use."

### New electric vehicle in addition to the Peugeot e-208

Semantic capability unlocked: multi-vehicle readiness and prioritization.  
Product meaning: the page can answer which car needs attention, not merely whether an EV exists.  
New stories:

- "The early-trip car should charge first."
- "Both cars cannot be fully ready by morning; choose priority."
- "Peugeot is fine; new EV needs the charger tonight."
- "Weekend plans require a different charging priority than weekday commuting."

## 10. Features unique to FamilyBoard context

Home Assistant can automate devices, but FamilyBoard can understand the household.

### Family members and ages

- Child bedrooms can have stricter comfort thresholds than adult or spare rooms.
- Bedtime readiness can focus on children first.
- A room used by a toddler can be prioritized above a hallway or storage room.
- Advice can avoid technical wording and speak in family terms.

### Calendars

- Vehicle readiness can be checked against the first appointment or departure window.
- Heating can prepare relevant rooms before planned use.
- Nobody-home and vacation states can reduce routine noise and highlight anomalies.
- Dryer/washer recommendations can account for whether someone will be home to unload.

### Weather

- Outdoor temperature predicts heating demand and room cooling.
- Rain changes laundry/drying recommendations and travel readiness.
- Solar forecast changes appliance/EV/battery timing.
- Outdoor humidity/temperature can influence ventilation advice.

### Recurring household behaviour

- Morning showers explain water/humidity patterns.
- Weekday vs weekend schedules change what "normal" means.
- Bedtime routines determine when bedroom comfort matters.
- Laundry day patterns can make washer/dryer recommendations timely rather than random.

### Tasks and shopping context, without integrating pages

The page should not become Tasks or Shopping. Still, contextual knowledge can inform house interpretation:

- school sports day may make laundry urgency higher;
- vacation packing may increase laundry/charging readiness importance;
- grocery pickup or appointment timing may imply vehicle readiness;
- recurring chores can affect whether an appliance-finished state is expected.

This context should modify prioritization and wording, not create cross-page workflows in this research slice.

## 11. Long-term page vision

`Woning` should become the house's daily interpreter. It should be calm when the house is fine, precise when something matters, and humble when it does not know enough.

### Long-term interaction model

The top of the page should present one house narrative:

- "Alles rustig. De slaapkamers zijn klaar voor vanavond en de batterij helpt het huis tot morgenochtend."
- "Eén ding om te doen: de wasmachine is klaar en blijft anders nat tot bedtijd."
- "Let op morgen: de Peugeot moet vanavond laden voor de afspraak om 08:15."
- "Goede kans nu: er is genoeg overschot voor de droger of de auto."
- "Niet zeker: water- en energiestatus zijn actueel, maar slaapkamerdata is te oud."

Below the narrative, the page should show a small number of situation groups, not permanent domain dashboards:

1. **Needs attention**: exceptions requiring action.
2. **Coming up**: tonight/tomorrow risks or preparations.
3. **Good moment**: opportunities that are currently actionable.
4. **Ready/normal**: quiet reassurance for the most important household systems.
5. **Unknown**: missing/stale states that limit confidence.

The exact visual layout should be designed later through the viewport-first workflow. This report intentionally does not approve a layout.

### Maturity path

**Research-to-spec next step**  
Define the semantic household stories, confidence model, and first product scope. Avoid starting with components.

**V1 candidate**  
A story-first `Woning` page that combines room comfort, humidity, Evohome heating, laundry state, P1 energy flow, water meter state, and calendar/weather context where available. It should not implement controls unless safe semantic commands already exist.

**V2 candidate**  
Add energy opportunities, battery interpretation, EV readiness, and appliance timing once planned hardware is present and semantic states are reliable.

**Later**  
Add multi-vehicle prioritization, richer prediction, stronger nobody-home/vacation reasoning, and optional safe actions. Keep setup, vendor diagnostics, and raw automation in Settings or Home Assistant.

### Product principles to preserve

- The page answers a household question, not a device question.
- A normal state is a trustworthy conclusion.
- Every alert should imply a decision.
- Every recommendation should be explainable in one sentence.
- Predictions should be cautious and time-bounded.
- Unknown/stale data should reduce confidence instead of creating false calm.
- Home Assistant is an interchangeable capability provider, not the product concept.
- The page should become more useful as FamilyBoard knows more about the household, not merely as more devices are added.

## 12. Final platform-independence test

If Home Assistant disappeared tomorrow and another home automation platform replaced it, would this page still make sense?

Yes, if the vision is followed.

The page should still make sense because its core concepts are not Home Assistant entities, integrations, devices, or dashboards. The durable concepts are household meanings:

- rooms being ready for the people who use them;
- bedtime and morning being prepared;
- laundry moving through the household;
- energy opportunities being understandable;
- vehicles being ready for real departures;
- battery and grid behavior being translated into household impact;
- water use being normal or suspicious;
- the house being confidently calm, uncertain, or in need of attention.

A different automation platform could provide the same semantic capabilities. If replacing Home Assistant would break the product vision, then the page has drifted back into integration/dashboard thinking. If replacing it only changes the adapter layer while the household stories remain intact, the product vision is sound.
