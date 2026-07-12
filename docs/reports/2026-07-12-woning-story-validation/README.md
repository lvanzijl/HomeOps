# Woning Story-Only Validation

Date: 2026-07-12  
Scope: product and UX definition only  
Baseline: accepted House Brain and Household Story reports, with the correction that Household Stories are the only primary House Brain output

## 1. Executive summary

The preferred Woning mockup can be recreated with **Household Stories only** if the page is treated as a calm narrative surface rather than a domain dashboard. The page should answer **“Hoe gaat het thuis?”** by selecting one leading Story and a very small number of secondary Stories, with supporting evidence hidden until the user asks for a deep dive.

The corrected conceptual model is:

> Observations → household knowledge and context → House Brain → Household Stories → FamilyBoard experiences

No separate Household Assessment layer is needed for this slice. The main-page answer can be expressed as a leading Household Story with scope, confidence, importance, explanation, and expiry. Readiness, calm, uncertainty, and opportunities do not require a new abstraction as long as the Story model supports broad scopes such as whole house, tonight, tomorrow, energy, mobility, water, climate, appliance, and presence-informed household context.

Presence is useful current evidence because Ubiquiti phone presence for Mom and Dad can influence confidence and explanation. It must remain probabilistic. It should not become persistent Woning chrome, and it must not imply child presence or prove that nobody is home. In the final FamilyBoard experience, persistent adult presence belongs on Mom and Dad avatars on the existing Home page. Woning should mention presence only when it materially explains a Story.

The standalone Woning page is justified now by the current combination of Home Assistant, Evohome, temperature and humidity sensors, P1 electricity meter, water meter, WiFi laundry appliances, Peugeot e-208, Ubiquiti infrastructure, adult phone presence, family context, and weather capability. Planned battery and charger capabilities materially improve energy and mobility Stories, but they are not required to validate the Story-first page model.

## 2. Accepted product direction

The accepted direction is intentionally not a Home Assistant dashboard. Woning should be:

- warm, calm, and family-oriented;
- consistent with FamilyBoard's existing household tone;
- about household meaning before telemetry;
- centered on one clear overall Story;
- limited to a few additional Stories;
- deep-dive based for details;
- free of a permanent floor plan on the main page;
- compact enough to fit common desktop and laptop viewports without browser-level vertical scrolling;
- touch-friendly;
- quiet in normal states.

The page must not become:

- an entity browser;
- a grid of technical status cards;
- a device-control panel;
- an energy-monitoring dashboard;
- a permanent map of rooms;
- a presence board.

The visual inspiration from the preferred mockup is the calm hierarchy: a warm page header, a large reassuring primary message, limited supporting cards, and details available by choice. The top-right presence element in the mockup is not part of the final Woning layout.

## 3. Story-only validation against the preferred mockup

Every visible concept in the preferred mockup can be expressed as either a Household Story or supporting page context:

| Mockup element | Story-only interpretation | Needs separate Assessment? | Notes |
|---|---|---:|---|
| “Alles is goed” hero | Leading Steady Story, whole-house scope, now | No | The hero is the selected leading Story. |
| “Wat vraagt aandacht?” laundry card | Attention or Ready Story, appliance scope | No | If the washing machine finished, Ready is enough unless it blocks a household task. |
| “Alles klaar voor vanavond” | Ready Story, tonight scope | No | Broad time-window scope can summarize climate and humidity checks. |
| Bedroom/bathroom/heating readiness chips | Supporting evidence for the Ready Story | No | Evidence belongs behind the Story or in climate deep dive. |
| “Slimme momenten” | Opportunity Stories | No | Must be capped and suppressed when low value. |
| Solar/battery/charger row | Supporting context or deep-dive summaries | No | Main page should not show permanent telemetry rows unless they explain a Story. |
| Status score / 9 of 10 | Not required | No | A numeric score risks assessment-like behavior and should be avoided. |
| Today timeline | Deep-dive/history support | No | Main page can show only if it explains selected Stories. |
| Tip of the day | Usually not a Story | No | Generic tips should be suppressed unless evidence-backed and timely. |
| Weather/time chrome | Page context, preferably Home-owned | No | Woning may consume weather but does not need persistent weather chrome. |
| Presence chrome | Home avatar feature, not Woning content | No | Woning may mention presence only inside relevant Story text. |

Conclusion: the mockup's desirable experience is not the number, status column, or telemetry strip. It is the calm narrative composition. Stories are sufficient to preserve that composition while removing dashboard-like noise.

## 4. Story taxonomy and scope usage

Canonical Story types remain:

1. **Steady** — things are normal enough to ignore for the current household purpose.
2. **Attention** — something deserves attention because it may affect comfort, safety, cost, readiness, or household flow.
3. **Opportunity** — a useful optional moment exists now or soon.
4. **Ready** — a relevant future transition or household intention is prepared enough.
5. **Unknown** — FamilyBoard cannot responsibly judge something that matters.

Scope is an attribute of a Story, not a separate product layer. Useful scopes for Woning are:

- whole house;
- now;
- tonight;
- tomorrow;
- room;
- person;
- appliance;
- energy;
- mobility;
- water;
- presence-informed household context.

A single broad Story may summarize narrower supporting Stories. Example: **“Klaar voor vanavond”** can summarize comfortable bedrooms, normal bathroom humidity, and expected heating state. The supporting room-level facts remain available through the climate deep dive.

## 5. Main Woning page content model

### 5.1 Leading Story

The main page should always reserve space for one leading Story. It is the answer to **“Hoe gaat het thuis?”**. The leading Story should use calm Dutch copy such as:

- **“Alles rustig.”**
- **“Eén ding vraagt aandacht.”**
- **“Klaar voor vanavond.”**
- **“Goed moment.”**
- **“Ik kan dit nu niet betrouwbaar beoordelen.”**

The exact sentence should be generated from the selected Story type, scope, confidence, and household relevance rather than from a hardcoded status score.

### 5.2 Secondary Stories

The main page should show **zero to three secondary Stories**. Two is the preferred default; three is the upper bound for important competing items. More than three turns the page back into a dashboard.

Secondary Stories should be short, action-oriented only when a safe action exists, and grouped when possible:

- one Attention Story for the most important issue;
- one Ready Story for an upcoming transition if it is genuinely useful;
- one Opportunity Story only if timely and high value;
- one Unknown Story only if the missing evidence affects reassurance.

### 5.3 Permanent Steady Story

A permanent Steady Story should not always exist. Steady should appear when reassurance has product value, especially when the user deliberately opens Woning and no meaningful issue, opportunity, or unknown exists. If another Story leads, Steady can be implicit and should not consume a secondary slot unless it prevents anxiety.

### 5.4 Ready with Attention

Ready and Attention can coexist. Example: bedrooms are ready for tonight, but the washing machine has finished. The leading Story should be the one that best reduces household risk or cognitive load now. A Ready Story should not hide a time-sensitive Attention Story.

### 5.5 Unknown and calm

Unknown protects the product from false reassurance. If relevant evidence is stale or unavailable, the main page should not say “Alles rustig” about the affected scope. It should either lead with Unknown or qualify the leading Story:

- **“Voor zover ik kan zien is alles rustig.”** only when limitations are minor.
- **“Ik kan het waterverbruik nu niet betrouwbaar beoordelen.”** when a meaningful capability is unavailable.

### 5.6 No meaningful Story

When no meaningful Story exists, Woning should show a calm empty state rather than fill space with telemetry:

> **“Geen bijzonderheden.”**  
> “Ik zie nu niets dat aandacht nodig heeft.”

This is not a data-empty state. It is a deliberate silence state.

## 6. Story selection and suppression rules

Selection should be rule-based at product level, not a technical scoring formula.

1. **Severity first.** Safety, possible damage, severe comfort failure, and important household disruption outrank optional savings or convenience.
2. **Time sensitivity matters.** A Story requiring action before bedtime, departure, or appliance completion outranks a similar issue without a deadline.
3. **Confidence gates escalation.** Low-confidence evidence may create Unknown or a softened Attention Story, but should not create a strong claim.
4. **Actionability helps ranking but is not required.** Some Stories matter even if FamilyBoard cannot act, such as unusual water flow.
5. **Household relevance beats domain relevance.** “Child bedroom will still be cold at bedtime” outranks “heating zone is active.”
6. **Suppress duplicates.** One broad Story should summarize multiple narrow facts when the user outcome is the same.
7. **Group related Stories.** Climate-related room issues should usually group into one climate Story.
8. **Respect acknowledgement.** If the user has acknowledged a Story, it should not keep reappearing unchanged unless severity or deadline increases.
9. **Expire aggressively.** Finished laundry expires after acknowledgement, restart, or a household-defined time window. Opportunities expire when the useful window closes.
10. **Avoid repeated-story fatigue.** Repeated bathroom humidity should change from repeated alerts to a periodic pattern explanation.
11. **Avoid generic tips.** A tip is not a Story unless current evidence makes it useful now.
12. **Prevent low-value energy dominance.** Small savings opportunities should stay silent unless they align with a household task or meaningful cost/comfort consequence.
13. **Use presence to adjust confidence, not to invent certainty.** Both phones absent may lower confidence that water use is expected, but it must not prove nobody is home.
14. **Keep presence invisible unless explanatory.** If presence does not change the user-facing meaning, do not mention it.
15. **Prefer one narrative over domain slots.** The main page is Story-first, not Climate/Energy/Laundry/Water-first.

## 7. Presence capability and confidence model

Ubiquiti phone presence for Mom and Dad is a current semantic capability, but only probabilistic.

Possible semantic states:

- Mom probably home;
- Dad probably home;
- both probably home;
- one probably away;
- both phones not detected;
- unknown;
- stale presence state.

Required conceptual evidence includes adult phone identity mapping, last-seen time, current network detection, confidence, and staleness. Conceptual names may include `AdultPresenceState`, `MomPresence`, `DadPresence`, `PresenceConfidence`, and `PresenceLastUpdated`, but these are not software contracts in this report.

Presence confidence must account for:

- temporary WiFi disconnections;
- sleeping phones;
- phones left at home;
- roaming between access points;
- garden or outbuilding coverage;
- delayed last-seen updates.

Allowed conclusions:

- A connected adult phone is strong evidence that that adult is probably home.
- A disconnected adult phone is weaker evidence that that adult may be away.
- Stale data should reduce confidence or create Unknown.
- Presence can contextualize activity, laundry practicality, and water-flow concern.

Forbidden conclusions:

- Do not infer child presence.
- Do not infer nobody is home solely because both adult phones are absent.
- Do not use calendar as proof of presence or absence.
- Do not present probabilistic presence as fact.

## 8. Boundary between Home avatar presence and Woning Story context

Persistent presence belongs on the existing Home page avatars for Mom and Dad. The avatar treatment may show probably home, probably away, or unknown.

Woning should consume presence only as supporting context for Stories. It should mention presence only when it materially changes the explanation, for example:

- **“Er loopt water terwijl beide telefoons al even niet thuis lijken.”**
- **“De was is klaar; waarschijnlijk is er nu niemand van de ouders thuis om hem op te hangen.”**
- **“Ik weet niet zeker wie thuis is, want de Ubiquiti-gegevens zijn oud.”**

Woning should not duplicate the avatar presence state in a permanent header chip, sidebar, status panel, or dedicated presence section.

Presence explanation can live in:

1. Home avatar detail for persistent “where are Mom and Dad probably?” explanations;
2. Story explanation when presence affects a specific Story;
3. a future capability-health or configuration view for data freshness and setup.

It does not require a Woning deep-dive page in this slice.

## 9. Current and planned capability truth table

| Story | User-facing meaning | Required semantic capabilities | Available now | Planned | Unsupported/unknown | Main page or deep dive |
|---|---|---|---:|---:|---:|---|
| Whole house calm | Nothing currently needs attention | Valid recent climate, water, energy, laundry, relevant capability health; Story selection silence rules | Yes, partially | Improves | Confidence coverage unverified | Main page |
| One thing asks attention | One household-relevant issue matters now | Any high-importance Attention Story | Yes | Improves | Depends on semantic derivation | Main page |
| Ready for tonight | Tonight-relevant rooms and household systems are okay | Time window, room comfort, humidity, heating state, family context | Yes, partially | No | Bedtime/context unverified unless configured | Main page + climate deep dive |
| Ready for tomorrow | Tomorrow-relevant household transition is prepared | Tomorrow context, mobility/laundry/climate readiness | Partial | Improves | Calendar cannot prove presence; trip meaning unverified | Main page + relevant deep dive |
| Good opportunity | Useful optional moment exists | Weather, energy state, appliance state, household task context | Partial | Improves | Solar capability unsupported unless confirmed; generic tips suppressed | Main page only if high value |
| Cannot judge important capability | Reassurance would be unsafe | Capability freshness/health, confidence thresholds | Yes, if health known | Improves | Some integration health unverified | Main page + affected deep dive |
| Laundry running | Washer/dryer is active | WiFi appliance semantic state | Yes, if exposed and verified | Smart plug corroboration | WiFi alone does not guarantee reliable state | Deep dive; main only if relevant |
| Laundry finished | Clothes need moving | WiFi appliance finished state; optional smart plug corroboration | Yes, if exposed and verified | Stronger with plugs | Contents unknown | Main if actionable; laundry deep dive |
| Energy understandable | Current usage/import is expected | P1 current import/consumption, recent baseline, known appliance context | Partial | Improves with battery/charger | Semantic “understandable” unverified | Main if explanatory; energy deep dive |
| Battery charging | Home battery is charging | Marstek state of charge and flow | No | Yes | Integration/semantic reliability unknown | Energy deep dive; main if meaningful |
| Battery discharging | Battery is supporting house | Marstek state and flow | No | Yes | Unknown until installed | Energy deep dive |
| Battery preserved | Battery is deliberately not discharging | Marstek state, charger/vehicle state, household policy, HA execution result | No | Yes | Requires HA automation/policy | Main when relevant + energy deep dive |
| Work vehicle charging should not use battery | Preserve home battery while designated work vehicle charges | Zaptec state, vehicle identity, battery state, policy | No | Yes | Work vehicle designation and execution unverified | Main if explaining outcome; energy/mobility deep dive |
| Peugeot needs charging | Car should be charged before meaningful trip | Peugeot charge/connection state, meaningful planned trip, departure time | Partial | Improves with Zaptec | Provider/API and trip significance unverified | Main + mobility deep dive |
| Second EV needs charging | Future second EV readiness | Second EV state, charger state, trip context | No | Yes | Vehicle/integration unknown | Main + mobility deep dive when available |
| Water unusual | Continuous or unusual water use | Water meter flow, recent pattern, confidence | Yes, if meter exposes flow/recent readings | No | Leak cannot be claimed without evidence | Main + water deep dive |
| Bathroom humidity high | Bathroom remains humid longer than expected | Humidity sensor, room identity, trend, normal pattern | Yes | No | Ventilation state unsupported unless present | Main if persistent; climate deep dive |
| Room not comfortable by bedtime | A room likely misses comfort target | Temperature, room target, trend, bedtime/use window, Evohome state | Yes, partially | No | Bedtime/room-use assumptions need configuration | Main + climate deep dive |
| Home Assistant stale | Household judgement is degraded | HA freshness/availability, capability last updates | Yes, if monitored | No | Specific provider health semantics unverified | Main + capability explanation |
| Mom probably home | Mom's phone detected recently | Ubiquiti mapped phone, last seen, confidence | Yes | No | Probabilistic only | Home avatar; Woning only as context |
| Dad probably home | Dad's phone detected recently | Ubiquiti mapped phone, last seen, confidence | Yes | No | Probabilistic only | Home avatar; Woning only as context |
| Both parents probably away | Both adult phones not detected recently | Ubiquiti phone states, staleness, confidence | Yes | No | Does not prove nobody home | Woning only if relevant Story context |
| Presence unknown | Presence data stale or contradictory | Ubiquiti last update, AP state, confidence | Yes | No | No Woning presence section | Story explanation or Home avatar detail |
| Water while parents probably away | Water use is less expected now | Water flow + adult presence confidence | Yes, if both capabilities verified | No | Cannot claim nobody home or leak | Main + water deep dive |
| Laundry finished while neither parent likely home | Action is less practical right now | Laundry finished + adult presence confidence | Yes, if appliance state verified | Smart plug improves | Do not infer child presence | Main if useful; laundry deep dive |
| Door/window open | House opening state | Door/window contacts | No | No | Unsupported | Out of scope |
| Smart lock status | Lock safety state | Smart locks | No | No | Unsupported | Out of scope |
| Room occupancy | Who is in a room | Occupancy sensors | No | No | Unsupported | Out of scope |
| Camera-based security | Visual monitoring | Cameras | No | No | Unsupported as page feature | Out of scope |
| Solar production | Solar surplus | Solar inverter or verified production source | Unknown | Unknown | Do not assume solar panels | Out of scope unless confirmed |

## 10. Story catalogue using only available and planned capabilities

### Core validation moments

| Moment | One Story sufficient? | Supporting Stories? | Story type and scope | Main Woning page | Deep dive | No Story when | Inputs required | Status | Presence role | Mention presence? |
|---|---|---|---|---|---|---|---|---|---|---|
| Everything is calm | Yes | No | Steady, whole house/now | Leading calm Story or quiet empty state | Evidence hidden | User is not seeking reassurance and nothing changed | Fresh semantic capability checks | Possible now, partial confidence | Usually none | No |
| One thing needs attention | Yes | Sometimes | Attention, affected scope | Lead or top secondary | Affected deep dive | Issue is low confidence or already acknowledged | Domain evidence and relevance | Possible now depending domain | Context only | Only if explanatory |
| Ready for tonight | Yes | Yes, as evidence | Ready, tonight | Lead if no urgent Attention | Climate/laundry/mobility as needed | No tonight-relevant check exists | Time window, comfort/humidity/heating | Possible now, partial | Usually none | No |
| Ready for tomorrow | Yes | Yes | Ready, tomorrow | Lead or secondary | Mobility/laundry/climate | No meaningful tomorrow context | Tomorrow context + relevant domain states | Partial now | Maybe | Only if action practicality changes |
| Good opportunity exists | Yes | No | Opportunity, energy/laundry/weather | Secondary, capped | Relevant deep dive | Low value, repeated, generic, no action | Timely evidence and household task | Partial now | Rarely | Usually no |
| Important cannot be judged | Yes | Maybe | Unknown, affected scope | Lead if reassurance unsafe | Affected deep dive | Missing data is unimportant | Freshness/availability | Possible now if health known | Can explain uncertainty | Yes if presence data stale matters |
| Laundry running or finished | Yes | No | Ready or Attention, appliance | Main only if actionable/relevant | Laundry | Cycle is normal and no action needed | WiFi appliance state; plug planned | Possible now if verified; stronger planned | Action practicality | Sometimes |
| Energy understandable | Yes | Maybe | Steady, energy/now | Usually hidden; main if explaining | Energy | Usage is normal and uninteresting | P1 + expected contributors | Partial now | None | No |
| Battery charging/discharging/preserved | Yes | Maybe | Steady/Opportunity/Attention, energy | Main only if meaningful | Energy | Battery state is normal and expected | Marstek + policy + HA result | Planned | None | No |
| Work vehicle charging should not use battery | Yes | Maybe | Steady or Attention, energy/mobility | Explain preservation or problem | Energy/mobility | Work vehicle not charging | Battery + Zaptec + designated vehicle | Planned | None | No |
| EV needs charging before trip | Yes | Maybe | Attention, mobility/tomorrow | Main if meaningful trip known | Mobility | No meaningful planned trip known | EV charge, connection, trip context | Partial now; better planned | Not proof of travel | No unless action practical |
| Water usage unusual | Yes | Maybe | Attention, water/now | Main if persistent/significant | Water | Short normal use pattern | Water meter flow + baseline | Possible now if semantic flow exists | Raises concern cautiously | If materially relevant |
| Bathroom humidity high | Yes | No | Attention, room/climate | Secondary or lead if persistent | Climate | Normal post-shower drying window | Humidity trend + room identity | Possible now | Usually none | No |
| Room not comfortable by bedtime | Yes | Yes, room evidence | Attention, room/tonight | Main if meaningful room/time | Climate | Room not in use or forecast recovers | Temp, trend, Evohome, bedtime | Possible now, partial | None | No |
| HA/capability stale | Yes | Maybe | Unknown, capability scope | Main if affects reassurance | Capability explanation | Capability not relevant to current answer | Last updates/health | Possible now if monitored | Presence staleness may be one case | Yes if stale presence affected story |
| Mom probably home | No Woning Story by itself | No | Person presence context | Not persistent on Woning | Home avatar detail | Always as standalone Woning content | Ubiquiti Mom phone | Current | Evidence only | No, unless explaining |
| Dad probably home | No Woning Story by itself | No | Person presence context | Not persistent on Woning | Home avatar detail | Always as standalone Woning content | Ubiquiti Dad phone | Current | Evidence only | No, unless explaining |
| Both parents probably away | Not by itself | Maybe with water/laundry | Presence-informed context | Not standalone | Story explanation | No correlated household event | Both phone states + confidence | Current | Adds uncertainty/concern | Only with correlated Story |
| Presence unknown | Yes only if it blocks judgement | Maybe | Unknown, presence-informed context | Only if important | Home avatar/capability health | Presence not needed | Stale/contradictory Ubiquiti | Current | Reduces confidence | Yes if it blocks conclusion |
| Water while both parents probably away | Yes | Maybe | Attention, water + presence context | Main | Water | Water is brief/expected or confidence low | Water flow + adult presence | Possible now if semantics verified | Improves relevance but not proof | Yes, carefully |
| Laundry finished while neither parent likely home | Yes | No | Ready, appliance + presence context | Main only if useful | Laundry | Someone likely home or task not urgent | Laundry finished + adult presence | Possible now if appliance semantics verified | Explains practicality | Sometimes |

## 11. Dutch narrative examples

### 11.1 Calm normal state

- **Narrative:** “Alles rustig. Ik zie nu niets dat aandacht nodig heeft.”
- **Story type:** Steady.
- **Scope:** whole house, now.
- **Required evidence:** Fresh enough climate, laundry, water, P1, and relevant capability checks.
- **Presence contribution:** None.
- **Confidence:** Medium to high depending on freshness coverage.
- **Presence shown:** No.
- **Deep dive:** None by default; evidence hidden until requested.

### 11.2 Cold child bedroom before bedtime

- **Narrative:** “De slaapkamer wordt waarschijnlijk niet op tijd comfortabel. De temperatuur stijgt te langzaam richting bedtijd.”
- **Story type:** Attention.
- **Scope:** room, tonight.
- **Required evidence:** Room temperature, trend, intended bedtime/use window, Evohome heating state.
- **Presence contribution:** None.
- **Confidence:** Medium unless room-use schedule and target are confirmed.
- **Presence shown:** No.
- **Deep dive:** Climate.

### 11.3 Persistent bathroom humidity

- **Narrative:** “De badkamer blijft vochtig. Het droogt langer niet terug dan normaal.”
- **Story type:** Attention.
- **Scope:** room/climate, now.
- **Required evidence:** Bathroom humidity, trend, normal post-use pattern.
- **Presence contribution:** None.
- **Confidence:** Medium to high with reliable humidity history.
- **Presence shown:** No.
- **Deep dive:** Climate.

### 11.4 Washing machine finished

- **Narrative:** “De was is klaar. Handig om hem straks op te hangen.”
- **Story type:** Ready.
- **Scope:** appliance, now.
- **Required evidence:** Washing machine finished state from WiFi appliance; planned smart plug can corroborate.
- **Presence contribution:** Optional action practicality.
- **Confidence:** Medium now if appliance semantic state is verified; higher with smart plug.
- **Presence shown:** No unless no adult is likely home and timing matters.
- **Deep dive:** Laundry.

### 11.5 Dryer running while grid import is high

- **Narrative:** “De droger draait terwijl het stroomverbruik hoog is. Dat lijkt verklaarbaar door de droger.”
- **Story type:** Steady or Attention depending threshold.
- **Scope:** energy + appliance, now.
- **Required evidence:** Dryer running state, P1 import/consumption, baseline.
- **Presence contribution:** None.
- **Confidence:** Medium now; higher with power-measuring plug.
- **Presence shown:** No.
- **Deep dive:** Energy or laundry.

### 11.6 P1 shows unusual continuous consumption

- **Narrative:** “Het stroomverbruik blijft hoger dan normaal. Ik kan het nog niet verklaren met bekende apparaten.”
- **Story type:** Attention or Unknown.
- **Scope:** energy, now.
- **Required evidence:** P1 current and recent consumption, expected-use baseline, known appliance states.
- **Presence contribution:** Usually none.
- **Confidence:** Medium if appliance visibility is limited.
- **Presence shown:** No.
- **Deep dive:** Energy.

### 11.7 Water meter shows unusual continuous flow

- **Narrative:** “Er loopt al langer water dan normaal. Controleer even of dit verwacht is.”
- **Story type:** Attention.
- **Scope:** water, now.
- **Required evidence:** Water meter flow, duration, recent patterns.
- **Presence contribution:** Can raise concern if both adults are probably away.
- **Confidence:** Medium to high for flow; lower for explanation.
- **Presence shown:** Only if it materially changes concern.
- **Deep dive:** Water.

### 11.8 Battery preserving charge during work-car charging

- **Narrative:** “De thuisaccu wordt bewaard terwijl de zakelijke auto laadt.”
- **Story type:** Steady.
- **Scope:** energy + mobility, now.
- **Required evidence:** Marstek battery state, Zaptec charging state, designated work vehicle, Home Assistant policy result.
- **Presence contribution:** None.
- **Confidence:** Planned only.
- **Presence shown:** No.
- **Deep dive:** Energy.

### 11.9 Peugeot needs charging before special early appointment

- **Narrative:** “De Peugeot heeft waarschijnlijk extra lading nodig voor morgenochtend vroeg.”
- **Story type:** Attention.
- **Scope:** mobility, tomorrow.
- **Required evidence:** Peugeot charge/connection state and a meaningful planned trip or special appointment.
- **Presence contribution:** Does not prove travel; may affect whether someone can plug in now.
- **Confidence:** Medium if trip distance/intent is known; otherwise Unknown or silent.
- **Presence shown:** Usually no.
- **Deep dive:** Mobility.

### 11.10 Second EV and charger planned but not yet available

- **Narrative:** “De tweede auto en Zaptec-lader zijn nog geen onderdeel van mijn betrouwbare woningbeeld.”
- **Story type:** Unknown only in setup/design context, not daily Woning.
- **Scope:** mobility capability.
- **Required evidence:** Installed second EV and Zaptec integration.
- **Presence contribution:** None.
- **Confidence:** Not available.
- **Presence shown:** No.
- **Deep dive:** Mobility when installed.

### 11.11 One or more stale sensors

- **Narrative:** “Ik kan de badkamer nu niet betrouwbaar beoordelen, want de vochtmeting is oud.”
- **Story type:** Unknown.
- **Scope:** room/capability.
- **Required evidence:** Last update age and relevance.
- **Presence contribution:** None unless presence sensor stale.
- **Confidence:** High that judgement is unavailable.
- **Presence shown:** No.
- **Deep dive:** Climate or capability explanation.

### 11.12 No meaningful Story exists

- **Narrative:** “Geen bijzonderheden.”
- **Story type:** No active Story, or lightweight Steady when reassurance is requested.
- **Scope:** whole house.
- **Required evidence:** Story selection found nothing meaningful enough to surface.
- **Presence contribution:** None.
- **Confidence:** Depends on known capability coverage.
- **Presence shown:** No.
- **Deep dive:** None.

### 11.13 Mom probably home

- **Narrative:** Not shown as standalone Woning content. Home avatar may show Mom probably home.
- **Story type:** No Woning Story.
- **Scope:** person context.
- **Required evidence:** Mom phone detected recently via Ubiquiti.
- **Presence contribution:** Context for other Stories.
- **Confidence:** Medium to high, never guaranteed.
- **Presence shown:** Home avatar, not Woning.
- **Deep dive:** Home avatar detail.

### 11.14 Dad probably away

- **Narrative:** Not shown as standalone Woning content. Home avatar may show Dad probably away.
- **Story type:** No Woning Story.
- **Scope:** person context.
- **Required evidence:** Dad phone not detected recently, last-seen freshness.
- **Presence contribution:** Weak absence evidence.
- **Confidence:** Low to medium.
- **Presence shown:** Home avatar, not Woning.
- **Deep dive:** Home avatar detail.

### 11.15 Both parents probably away but confidence is partial

- **Narrative:** “Beide telefoons lijken niet thuis, maar dat is geen zekerheid.” Only shown when explaining another Story.
- **Story type:** Supporting context, not standalone.
- **Scope:** presence-informed household context.
- **Required evidence:** Both adult phone states, confidence, last updates.
- **Presence contribution:** Raises uncertainty or action impracticality.
- **Confidence:** Partial.
- **Presence shown:** Only in relevant Story explanation.
- **Deep dive:** Home avatar detail or capability health.

### 11.16 Presence unknown because Ubiquiti data is stale

- **Narrative:** “Ik weet niet zeker wie thuis is, want de Ubiquiti-gegevens zijn oud.”
- **Story type:** Unknown if it affects current judgement.
- **Scope:** presence-informed context.
- **Required evidence:** Presence last-updated/stale state.
- **Presence contribution:** Reduces confidence.
- **Confidence:** High that presence is unknown.
- **Presence shown:** Yes, only if it blocks or qualifies a Story.
- **Deep dive:** Home avatar detail or capability-health/configuration view.

### 11.17 Water use while both parents are probably away

- **Narrative:** “Er loopt water terwijl beide telefoons al even niet thuis lijken. Dat hoeft niets te betekenen, maar controleer of het verwacht is.”
- **Story type:** Attention.
- **Scope:** water + presence-informed household context.
- **Required evidence:** Continuous water flow, adult phone absence evidence, confidence and staleness.
- **Presence contribution:** Improves relevance but does not prove nobody is home.
- **Confidence:** Medium.
- **Presence shown:** Yes, carefully.
- **Deep dive:** Water.

### 11.18 Laundry finished while neither parent is likely home

- **Narrative:** “De was is klaar. Waarschijnlijk kan niemand van de ouders hem nu meteen ophangen.”
- **Story type:** Ready.
- **Scope:** appliance + presence-informed context.
- **Required evidence:** Washer finished state, adult presence confidence.
- **Presence contribution:** Explains action practicality.
- **Confidence:** Medium.
- **Presence shown:** Yes if timing matters.
- **Deep dive:** Laundry.

## 12. Climate floor-plan deep-dive concept

The climate deep dive may use a floor plan because it explains spatial comfort. It should show **one floor at a time** for the four-floor house. This keeps the main Woning page from becoming room-centric while still making room relationships understandable when requested.

Climate deep dive content:

- floor selector for the four floors;
- one visible floor plan at a time;
- room comfort summaries;
- temperature and humidity;
- Evohome heating state;
- temporary heating control only if Home Assistant exposes safe bounded actions;
- stale or contradictory readings;
- no raw Home Assistant entity names.

The main page should only surface climate as a Story, such as **“De slaapkamer wordt niet op tijd comfortabel”** or **“De badkamer blijft vochtig.”** The floor plan belongs behind that Story.

## 13. Energy, laundry, mobility, and water deep-dive concepts

### Energy deep dive

Owns explanations for:

- P1 import/export and current consumption;
- recent consumption patterns;
- Marstek battery state when available;
- Zaptec charging state when available;
- why the battery is being preserved while a work vehicle charges;
- household intent versus Home Assistant execution.

It must not implement or expose a real-time optimizer inside FamilyBoard.

### Laundry deep dive

Owns explanations for:

- washing machine and dryer state;
- WiFi appliance data;
- smart-plug corroboration when available;
- cycle running, finished, unknown, or error;
- relationship to current energy state;
- presence only as context for whether an action is practical.

It must not infer clothing contents.

### Mobility deep dive

Owns explanations for:

- Peugeot e-208 readiness;
- future second EV readiness;
- Zaptec Go 2 charger state when available;
- charger connection and charging state;
- trip readiness only when a meaningful planned trip is known.

It must not infer that absence of calendar events means no travel.

### Water deep dive

Owns explanations for:

- current water flow;
- recent patterns;
- unusual continuous flow;
- confidence and limitations;
- probabilistic adult presence context.

It must not claim a leak without sufficient evidence and must not claim nobody is home solely because both phones are absent.

## 14. Home Assistant versus FamilyBoard responsibility boundary

FamilyBoard:

- consumes semantic capabilities;
- creates Household Stories;
- explains household meaning;
- expresses household intent;
- may offer safe bounded actions;
- combines probabilistic presence with other evidence;
- never presents uncertain presence as fact.

Home Assistant:

- integrates devices;
- reads Ubiquiti device presence;
- derives semantic appliance states;
- executes automations and optimization;
- controls battery, charger, heating, and appliance logic;
- handles retries, failures, and rapid control loops.

Battery/work-car example:

- FamilyBoard may express the policy or explain the outcome: **“De thuisaccu wordt bewaard terwijl de zakelijke auto laadt.”**
- Home Assistant should execute: **“Do not discharge the home battery while the designated work vehicle is charging.”**

FamilyBoard should not own the real-time optimizer.

## 15. Explicit answers to the design questions

1. **Can the preferred mockup be fully explained with Stories only?** Yes. The useful parts map to one leading Story, a few secondary Stories, and deep-dive evidence.
2. **Is a separate Assessment layer needed anywhere?** No. Broad-scoped Stories can answer calm, readiness, opportunity, and unknown states without another layer.
3. **Is Ready a valid Story type?** Yes. Ready is necessary for time-window outcomes like tonight, tomorrow, laundry finished, and mobility preparedness.
4. **Should “Everything is calm” always be present or only when useful?** Only when useful. It is valuable when the user seeks reassurance, but it should not compete with meaningful Stories.
5. **How many Stories should the main page show at once?** One leading Story plus zero to three secondary Stories; two secondary Stories is the preferred normal maximum.
6. **Can Attention and Ready both exist simultaneously?** Yes. Attention should lead when more urgent; Ready can remain secondary when it still reduces cognitive load.
7. **When should an Opportunity remain silent?** When low value, generic, repeated, not actionable, not time-bound, or likely to distract from calm.
8. **How should Unknown prevent false reassurance?** It should block or qualify Steady/Ready claims for the affected scope and explain the missing evidence.
9. **What exactly does the main page show when everything is normal?** A calm leading message such as “Alles rustig” or “Geen bijzonderheden,” with no telemetry list unless requested.
10. **Which current capabilities already justify a standalone Woning page?** Home Assistant, Evohome, temperature and humidity sensors, P1 electricity meter, water meter, WiFi washer/dryer, Peugeot e-208, Ubiquiti infrastructure, adult phone presence, family context, and weather capability.
11. **Which planned capabilities materially improve it?** Power-measuring washer/dryer plugs, Marstek battery, Zaptec Go 2, and second EV.
12. **Which ideas remain out of scope?** Door/window contacts, leak sensors, smart locks, lighting controls, cameras as page features, room occupancy, child presence tracking, guaranteed personal presence, unconfirmed solar capabilities, and calendar-based presence proof.
13. **How does the climate floor-plan deep dive fit without making the main page room-centric?** The main page surfaces only climate Stories; the deep dive uses one floor plan at a time to explain room evidence.
14. **How does FamilyBoard explain battery and charger optimization without owning the optimizer?** It describes policy and outcome while Home Assistant executes real-time battery/charger control.
15. **What evidence would prove the Story model insufficient?** If a user-facing Woning need required a stable conclusion that could not be expressed as a Story with scope, confidence, importance, explanation, and expiry. This slice found no such need.
16. **Is Ubiquiti phone detection useful enough to influence current Stories?** Yes, as probabilistic adult presence evidence.
17. **Which conclusions may be supported by presence but never proven by it?** An adult is probably home, an adult may be away, water use is less expected, laundry action may be less practical, and presence data may be unknown. It never proves nobody is home.
18. **When should presence appear in Story text?** Only when it materially explains concern, uncertainty, or action practicality.
19. **When should presence remain invisible context?** When it does not change the user-facing meaning or would duplicate Home avatar presence.
20. **How should Home avatar presence and Woning Story presence avoid duplication?** Home owns persistent avatar presence; Woning references presence only inside specific Story explanations.

## 16. Risks and unresolved questions

- Current semantic capability reliability is unverified. Connected devices do not automatically mean trustworthy household states.
- Bedtime, room use, and meaningful-trip context require careful configuration or existing FamilyBoard context before strong Ready/Attention claims.
- P1 energy can explain current import but may not identify causes without appliance corroboration.
- WiFi appliance states may be stale or vendor-limited; smart plugs improve confidence but are planned.
- Water meter semantics must distinguish short normal use from unusual continuous flow without claiming leaks too early.
- Presence copy must remain humble and avoid implying surveillance or certainty.
- Solar capability is not confirmed and should not be included until household facts explicitly support it.
- A future configuration/capability-health surface may be needed, but it should not become a permanent Woning section.

## 17. Final recommendation on Story-model sufficiency

The simplest stable model should be:

> Observations → House Brain → Household Stories → Woning and deep dives

A separate Assessment layer should be rejected for the standalone Woning page. Household Stories are sufficient when the leading Story can carry broad scope, confidence, importance, explanation, supporting evidence, deep-dive destination, and expiry.

The Woning page should be Story-first, not domain-first. Domains own deep dives; Stories own the main page.

## 18. Clear next product-design step

Create a viewport-first product specification for the standalone Woning page that freezes:

1. the leading Story region;
2. the maximum secondary Story count;
3. the Dutch copy patterns for Steady, Attention, Opportunity, Ready, and Unknown;
4. the deep-dive entry behavior;
5. the exact evidence rules for the first implementable current-capability slice.

The first implementation candidate should avoid planned-only battery/charger behavior and should focus on current, verifiable semantic capabilities: climate comfort/humidity, laundry state if reliable, P1/water high-level anomalies, capability freshness, and Ubiquiti adult presence only as Story context.

## 19. Validation checklist

- No production code should be changed by this slice.
- No UI should be implemented by this slice.
- No screenshots or binary assets should be created by this slice.
- Only current and explicitly planned household capabilities are used.
- Ubiquiti presence is treated as current but probabilistic.
- Calendar is not used as presence proof.
- Child presence is not inferred.
- Unsupported sensors or integrations are not invented.
- The main page remains Story-first and not domain-first.
- The four-floor floor plan appears only in the climate deep dive.
- Presence remains on Home avatars in the final presentation model.
- Woning uses presence only as Story context.
- Battery and EV optimization remains a Home Assistant execution responsibility.
