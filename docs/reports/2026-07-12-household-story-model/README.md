# Household Story Model: Canonical House Brain Output

Date: 2026-07-12  
Repository: HomeOps / FamilyBoard  
Baseline: all previous House Brain and Woning research reports  
Scope: product model only; no code, software architecture, UI design, mockups, or implementation plan.

## 1. Executive summary

The House Brain should not communicate observations, capabilities, recommendations, widgets, or domain states. It should communicate **Household Stories**: concise household-level judgements that answer whether the house is helping, hindering, offering a useful moment, or unable to judge a meaningful household intention.

The canonical Household Story model should be aggressively small. Almost every apparent story can be reduced to one of five story types:

1. **Steady**: nothing meaningful needs attention.
2. **Attention**: something may harm comfort, safety, readiness, cost, or flow if ignored.
3. **Opportunity**: a timely optional benefit exists.
4. **Ready**: a meaningful upcoming transition is sufficiently prepared.
5. **Unknown**: the House Brain cannot responsibly judge something that matters.

These are not feature categories. They are answer categories. They correspond to the only five household questions that deserve first-class expression:

- Can I ignore the house?
- Do I need to notice something?
- Is there a good moment to do something?
- Are we ready for what comes next?
- Do we know enough to trust the answer?

Everything else is evidence, subject matter, explanation, or a nested interpretation. Climate, laundry, energy, water, mobility, rooms, appliances, calendars, and routines are not story types. They are sources of meaning.

The model deliberately removes many tempting concepts. There should not be separate story categories for alerts, recommendations, predictions, status, anomalies, insights, tips, device health, routines, or widgets. Those concepts still exist, but only as attributes of one of the five canonical stories. For example, “run the dryer now” is not a `Recommendation` story. It is an `Opportunity` story if optional, an `Attention` story if delay creates risk, or part of a `Ready` story if it completes tomorrow’s preparation.

A Household Story should exist only when it changes household understanding. It should be explainable, bounded in time, confidence-aware, and disposable. Its lifecycle is:

> Evidence → Interpretation → Candidate Story → Usefulness Gate → Published Story → Response → Settled Story → Memory

The most important lifecycle step is the **Usefulness Gate**. Many true interpretations should never become stories because they are normal, expected, unactionable, already known, too uncertain, too trivial, or outside a useful time window.

Stories can relate to one another, but they should not become arbitrary trees. Composition is allowed only when a parent story answers a broader household question that genuinely cannot be answered without child interpretations. “Ready for tonight” may contain bedroom comfort, laundry, vehicle, water, and energy interpretations, but the parent story remains one `Ready` story. The child interpretations should explain the parent; they should not compete as equal page-level stories unless they independently need attention.

The final product rule is simple:

> A Household Story is the smallest household-level statement that a family member can trust, ignore, act on, or ask to explain.

## 2. Why Household Stories exist

The House Brain reasons about a complicated world: measurements, routines, calendars, weather, family members, predictions, assumptions, confidence, and history. Users should not consume that complexity directly.

Raw observations ask the user to infer meaning:

- “Bathroom humidity is 72%.”
- “The washer finished 34 minutes ago.”
- “The car battery is 42%.”
- “Grid import is 2.8 kW.”
- “The bedroom is 18.1 °C.”

Capabilities ask the user to understand systems:

- “Ventilation is available.”
- “Charging can start.”
- “The dryer can run.”
- “A battery can discharge.”

Recommendations ask the user to trust a conclusion without necessarily understanding the household question:

- “Ventilate the bathroom.”
- “Start charging.”
- “Run the washer now.”

Household Stories sit above all of these. They answer what the family actually cares about:

- “The bathroom still needs attention before bedtime.”
- “Tomorrow morning is ready enough.”
- “There is a good energy window for flexible chores.”
- “The house is calm; nothing important needs you.”
- “I cannot tell whether bedrooms are ready because the readings are stale.”

Stories exist because FamilyBoard’s value is not knowledge of devices. Its value is reduced cognitive load: fewer things to check, fewer surprises, and more confidence in ordinary household transitions.

## 3. Canonical story taxonomy

### 3.1 Reduction principle

A concept deserves to be a canonical story type only if it answers a different household question. If it merely describes domain, urgency, tone, recommended action, prediction horizon, or evidence source, it is not a story type.

Rejected first-class categories:

- **Observation**: evidence, not a story.
- **Status**: either `Steady`, `Ready`, or evidence for another story.
- **Recommendation**: actionability attribute, not a story type.
- **Prediction**: time horizon or explanation, not a story type.
- **Alert**: severity posture of `Attention`, not a story type.
- **Warning**: severe `Attention`, not a story type.
- **Anomaly**: evidence pattern that may create `Attention` or `Unknown`.
- **Tip**: usually should not exist; if timely, it is `Opportunity`.
- **Capability**: possible action, not a story.
- **Routine**: context for `Ready`, `Steady`, `Attention`, or `Unknown`.
- **Domain story**: climate, laundry, energy, water, and mobility are evidence families, not canonical story families.

### 3.2 The five canonical types

#### Steady

**Purpose**  
Tell the household that the meaningful parts of the house can be ignored for now.

**Question it answers**  
“Can I stop thinking about the house?”

**When it exists**  
When the House Brain has checked the currently relevant household intentions and found no material issue, no useful opportunity that deserves attention, and no important unknown.

**When it disappears**  
When an `Attention`, `Opportunity`, `Ready`, or `Unknown` story becomes more useful; when evidence becomes stale; when the relevant time window ends; or when the household enters a new mode that requires a fresh judgement.

**Required confidence**  
High enough to avoid false reassurance for the covered scope. `Steady` may be scoped when confidence is incomplete: “Everything known is calm, but bedroom readiness is unknown” should become `Unknown`, not full `Steady`.

**Typical confidence**  
Medium-high to high.

**Severity**  
None.

**Importance**  
High as a trust-building summary, but low as an interruption.

**Actionability**  
No direct action. Its action is permission to ignore.

**Whether it can interrupt**  
No. `Steady` never interrupts.

**Whether it belongs only on passive pages**  
Yes. It belongs on passive surfaces and explanations, not alerts.

**Lifetime**  
Short and mode-bound: now, this evening, overnight, morning, nobody-home, or another meaningful household interval.

**Deep dive destination**  
A calm explanation of what was checked and what was intentionally ignored.

**Typical examples**  
“Everything important is calm until bedtime.” “The house is behaving normally while everyone is out.” “No household action is useful right now.”

**Counterexamples**  
“Washer finished” is not `Steady`; it is either silent, `Attention`, or part of `Ready`. “Solar is producing” is not `Steady`; it is evidence or possibly `Opportunity`. “All sensors are online” is not `Steady`; device health alone is not household wellbeing.

#### Attention

**Purpose**  
Tell the household that something deserves notice because ignoring it may create discomfort, risk, delay, waste, cost, or avoidable work.

**Question it answers**  
“What needs my attention?”

**When it exists**  
When a meaningful household outcome is at risk, a current state is abnormal in context, a completed process is waiting on a person, or an upcoming transition is likely to fail without awareness or action.

**When it disappears**  
When resolved, acknowledged for the current window, superseded by a broader story, downgraded because the risk passed, or transformed into memory after the event.

**Required confidence**  
Proportional to severity. Low-severity attention may be medium confidence if phrased cautiously. Interruptive attention requires high confidence or high potential consequence with explicit uncertainty.

**Typical confidence**  
Medium to high.

**Severity**  
Ranges from low to urgent. Severity measures consequence if ignored, not how noisy the evidence is.

**Importance**  
Usually medium to critical.

**Actionability**  
Preferably actionable, but not always. “Possible water flow while nobody is home” may be actionable as “check,” not “fix.”

**Whether it can interrupt**  
Yes, if consequence, time pressure, and confidence justify interruption.

**Whether it belongs only on passive pages**  
No. It can appear passively or interruptively.

**Lifetime**  
Until the risk is resolved, acknowledged for a bounded period, invalidated, or no longer relevant.

**Deep dive destination**  
The affected household intention: bedtime, morning, leaving home, laundry flow, energy plan, safety check, or the evidence trail.

**Typical examples**  
“Bathroom humidity is staying high before bedtime.” “Laundry is finished and needed for tomorrow.” “The car will not be ready for the morning departure unless charging starts.” “Water is flowing while the house should be empty.”

**Counterexamples**  
“A room is cooler than yesterday” is not `Attention` unless it matters for a person or routine. “Battery is 35%” is not `Attention` unless it threatens resilience, cost, or readiness. “Dryer is running” is not `Attention` if expected.

#### Opportunity

**Purpose**  
Tell the household that a timely optional action would create benefit, but ignoring it is acceptable.

**Question it answers**  
“Is now a good moment?”

**When it exists**  
When timing, context, and available action combine to create a bounded advantage: lower cost, less waste, smoother routine, better comfort later, or easier preparation.

**When it disappears**  
When the action window closes, benefit drops below threshold, an attention story supersedes it, the household acts, or the opportunity repeats often enough that surfacing it no longer helps.

**Required confidence**  
Medium-high. Opportunities should not be speculative because optional suggestions become noise quickly.

**Typical confidence**  
Medium-high.

**Severity**  
None to low. If ignoring it creates material downside, it becomes `Attention`.

**Importance**  
Low to medium, occasionally high when the benefit is unusually large but still optional.

**Actionability**  
High. An opportunity without a clear action should usually be silent.

**Whether it can interrupt**  
Rarely. It may gently surface when the window is short and the benefit is meaningful, but it should not behave like an alert.

**Whether it belongs only on passive pages**  
Usually yes. Exceptions require strong household preference or an unusually valuable short window.

**Lifetime**  
The action window: minutes to hours, sometimes until the next routine boundary.

**Deep dive destination**  
The reason the moment is beneficial and what happens if the household waits.

**Typical examples**  
“Now is a good energy moment for flexible laundry.” “Ventilating now will be more effective before rain arrives.” “Charging tonight is cheaper and still leaves enough time.”

**Counterexamples**  
“Save energy by using appliances efficiently” is generic advice and should not exist. “Solar is high” is evidence, not an opportunity unless a useful household action is available. “Dryer can run” is capability, not story.

#### Ready

**Purpose**  
Confirm that a meaningful upcoming household transition is sufficiently prepared.

**Question it answers**  
“Are we ready for what comes next?”

**When it exists**  
When the household is approaching a known mode or event and the relevant blockers have been checked enough to provide reassurance.

**When it disappears**  
When the transition begins or ends, when a blocker appears, when confidence becomes insufficient, or when reassurance is no longer useful.

**Required confidence**  
High for full readiness. Medium confidence may produce scoped readiness: “Mostly ready; vehicle readiness is unknown.” If a missing item is important, the story should become `Unknown` or `Attention` instead.

**Typical confidence**  
Medium-high to high.

**Severity**  
None. If not ready, it becomes `Attention` or `Unknown`.

**Importance**  
Medium to high depending on the transition.

**Actionability**  
Usually no action; may include optional final checks. Its main value is reassurance and closure.

**Whether it can interrupt**  
No, except as a requested confirmation after an action or ritual. Readiness should not generate unsolicited celebration noise.

**Whether it belongs only on passive pages**  
Mostly yes. It may appear in ritual surfaces or requested summaries.

**Lifetime**  
Bounded to the transition: bedtime, tomorrow morning, leaving home, returning, guests, vacation, school day, laundry completion, or night.

**Deep dive destination**  
The readiness checklist as interpretations, not raw categories.

**Typical examples**  
“Tonight is ready enough.” “Tomorrow morning is prepared.” “The house is ready to be empty.” “Laundry flow is ready for school tomorrow.”

**Counterexamples**  
“Bedroom temperature is OK” is evidence or child interpretation, not necessarily `Ready`. “Car is charged” is not `Ready` unless tied to a departure or household intention. “All devices online” is not readiness.

#### Unknown

**Purpose**  
Prevent false confidence when the House Brain lacks enough trustworthy evidence to answer an important household question.

**Question it answers**  
“What can’t the house responsibly judge?”

**When it exists**  
When a meaningful judgement is expected or useful, but evidence is missing, stale, conflicting, unmapped, or below confidence threshold.

**When it disappears**  
When evidence becomes sufficient, the household accepts the uncertainty for the current window, the relevant decision expires, or the missing information stops mattering.

**Required confidence**  
High confidence that the unknown matters. The Brain should not create unknown stories for every missing sensor or unsupported capability.

**Typical confidence**  
High about uncertainty; low about the underlying household outcome.

**Severity**  
Depends on consequence. Unknown bedroom comfort before bedtime is moderate; unknown water flow during vacation may be high.

**Importance**  
Low to critical depending on what cannot be judged.

**Actionability**  
May be actionable by checking, reconnecting, opening a specialist app, or accepting uncertainty.

**Whether it can interrupt**  
Yes, but only when the unknown blocks a high-importance judgement or may hide material risk.

**Whether it belongs only on passive pages**  
No. Most unknowns are passive; important unknowns may interrupt.

**Lifetime**  
Until evidence recovers, the decision window expires, or the household chooses to ignore this uncertainty for the current mode.

**Deep dive destination**  
What is missing, why it matters, when it was last known, and what would restore confidence.

**Typical examples**  
“I cannot tell whether bedrooms are ready because readings are stale.” “Vehicle readiness is unknown because the charger state is unavailable before a planned departure.” “The house cannot confirm nobody-home safety because water data is missing.”

**Counterexamples**  
“Smart plug unavailable” is not `Unknown` unless it blocks a household judgement. “No EV integration configured” is not `Unknown` if the household has no EV readiness expectation. “Weather unavailable” is not `Unknown` unless a current story depends on it.

## 4. Story lifecycle

The correct lifecycle is not Observation → Situation → Story → Acknowledged → Resolved → Archived → Memory. That sequence is useful but incomplete because it lets too many true situations become user-facing stories.

The recommended lifecycle is:

1. **Evidence**  
   A measurement, event, calendar fact, routine, forecast, manual input, or historical pattern exists.

2. **Interpretation**  
   The House Brain binds evidence to household meaning: who, what intention, which time window, what consequence, what confidence.

3. **Candidate Story**  
   The interpretation can be expressed as one of the five canonical story types.

4. **Usefulness Gate**  
   The Brain decides whether this candidate should exist as a story at all. This is the main noise-control boundary.

5. **Published Story**  
   The story becomes available to FamilyBoard experiences: Woning, Home, notifications, voice, rituals, or future surfaces. Publication does not imply interruption.

6. **Response**  
   The household may act, ignore, acknowledge, dismiss, ask why, request silence, or do nothing.

7. **Settled Story**  
   The story resolves, expires, is acknowledged for a window, is superseded, is proven wrong, or becomes irrelevant.

8. **Memory**  
   The outcome becomes learning material: normal pattern, preference, confidence adjustment, future explanation, or historical note.

### Lifecycle states

A published story may be:

- **Active**: currently useful.
- **Scheduled**: known to matter later, but not useful to surface yet.
- **Deferred**: true but intentionally waiting for a better action or attention window.
- **Acknowledged**: seen and muted for a bounded context.
- **Snoozed**: intentionally delayed until a time, mode, or evidence change.
- **Superseded**: absorbed by a broader or more severe story.
- **Resolved**: the issue, opportunity, unknown, or readiness window ended successfully.
- **Expired**: no longer relevant, regardless of whether anything happened.
- **Archived**: stored only if it has future learning or accountability value.

Acknowledgement is not resolution. Acknowledging “laundry is waiting” means “do not remind me for this window”; it does not mean the laundry is done. Resolution requires the household outcome to change or the decision window to close.

## 5. Story composition

Stories may contain other interpretations, but composition must be constrained.

### Composition rule

A parent story may exist only when it answers a household question that is more useful than listing its parts.

Good parent stories:

- “Tonight is ready enough.”
- “Tomorrow morning is at risk.”
- “The house is calm while everyone is away.”
- “A good chore window is open now.”

Bad parent stories:

- “Climate summary.”
- “Energy summary.”
- “Laundry status.”
- “Device health summary.”

The first group is household-intention based. The second group is domain based.

### Child interpretations

A parent `Ready` story may contain child interpretations such as:

- bedrooms suitable for sleep;
- bathroom humidity acceptable;
- laundry not blocking morning;
- vehicle sufficiently charged for first trip;
- no unexplained water flow;
- energy plan acceptable overnight.

These child interpretations are not automatically separate stories. They become separate stories only if they independently pass the Usefulness Gate.

### Avoiding story trees

The product should avoid recursive story trees where every story contains more stories indefinitely. A story may have supporting interpretations, blockers, and related stories, but the user-facing model should remain shallow:

- one parent household question;
- a short set of supporting answers;
- explicit blockers or unknowns;
- evidence available on request.

### Readiness as interpretation, not a container by default

“Ready for tonight” should not always be a container. Often it is a single `Ready` story whose explanation references contributing interpretations. It becomes composition only when at least one child interpretation is important enough to show as a blocker, uncertainty, or decisive reason.

## 6. Story priority

Priority is product judgement about attention, not a technical sort order.

When ten stories exist simultaneously, the House Brain should surface the story that best reduces household risk or cognitive load now. Priority should be determined by these questions, in order:

1. **Consequence**: What bad or beneficial outcome is at stake?
2. **Time pressure**: How soon does the household need to know?
3. **Reversibility**: Can the household recover later if ignored?
4. **Confidence**: Is the story reliable enough for its posture?
5. **Actionability**: Can someone do anything useful?
6. **Household relevance**: Does this matter to current people, routines, or commitments?
7. **Novelty**: Is this new, changed, or already known?
8. **Burden**: Would surfacing it create more work than value?
9. **Suppression history**: Has the household repeatedly ignored or silenced this story type?
10. **Narrative fit**: Does it belong inside a broader story instead of competing separately?

### Priority by type

Default priority is:

1. `Attention` with safety, damage, or imminent routine failure.
2. `Unknown` that blocks an important judgement.
3. `Attention` with moderate consequence.
4. `Ready` for an imminent transition, especially if requested or ritual-related.
5. `Opportunity` with a short window and meaningful benefit.
6. `Steady` as ambient reassurance.
7. Low-value `Opportunity` or background `Unknown`, often not surfaced.

This order is not absolute. A high-value short opportunity may outrank low-severity attention. A critical unknown may outrank attention because false confidence would be worse than silence.

### One-story principle

The primary experience should prefer one leading story over a list. If multiple stories compete, the House Brain should synthesize when possible:

- “Tomorrow morning is at risk because laundry and charging are both unfinished.”

This is better than two separate equal stories if the household question is really morning readiness. Separate stories remain appropriate when they require different people, different time windows, or different consequences.

## 7. Story confidence

Confidence is not decoration. It determines whether a story exists, how it is phrased, whether it can interrupt, and whether it should become `Unknown` instead.

### Confidence dimensions

Every story should be able to distinguish:

- **Evidence confidence**: are the underlying facts fresh and reliable?
- **Context confidence**: does the Brain understand the household intention?
- **Prediction confidence**: is the future projection stable enough?
- **Action confidence**: is the suggested action likely to help?
- **Coverage confidence**: has the Brain checked enough relevant contributors?

### Confidence vocabulary

The product vocabulary should be small:

- **Confident**: enough evidence and context to speak plainly.
- **Likely**: useful judgement with some uncertainty.
- **Partial**: some relevant contributors missing or weak.
- **Unknown**: cannot judge responsibly.
- **Conflicting**: sources disagree in a way that matters.
- **Stale**: evidence was once known but is too old for the decision.

### Type-specific confidence rules

- `Steady` requires strong coverage confidence for the claimed scope.
- `Attention` requires confidence proportional to consequence.
- `Opportunity` requires enough action confidence to avoid noisy suggestions.
- `Ready` requires high coverage confidence or explicit scoped caveats.
- `Unknown` requires confidence that uncertainty itself matters.

## 8. Story explanation

A story should explain itself without exposing raw system complexity first. Explanation should be layered.

### Canonical explanation model

Every story must be able to answer:

1. **Why?**  
   The household meaning: what outcome is affected.

2. **Why now?**  
   The timing reason: action window, routine boundary, trend, upcoming event, or freshness change.

3. **What evidence?**  
   The human-readable facts supporting the judgement.

4. **What assumptions?**  
   The inferred context: expected occupancy, bedtime, departure, laundry need, weather impact, normal routine.

5. **What confidence?**  
   The confidence label and the reason for it.

6. **What happens if ignored?**  
   The likely consequence, including “nothing serious” for opportunities.

7. **What would change the story?**  
   The resolution condition: action, time passing, new evidence, acknowledgement, or changed context.

### Explanation discipline

Explanations should not become dashboards. They should start with household meaning, then evidence. A good explanation says:

- “This matters because Robin sleeps there tonight, and the room is cooling faster than usual.”

A poor explanation says:

- “Sensor bedroom_temperature_2 reports 18.1 °C and humidity is 58%.”

Raw evidence can exist in deep detail, but the canonical explanation remains household-first.

## 9. Story memory

Users should not routinely browse old stories as if they were a feed. A feed of past household observations would reintroduce dashboard noise.

Story history should exist for four reasons only:

1. **Trust**: show why the Brain learned a normal pattern or changed confidence.
2. **Accountability**: explain why an interruptive story was created.
3. **Recovery**: help understand repeated unresolved issues.
4. **Reflection**: support rituals such as weekly review when the family intentionally looks back.

Most stories should not become visible history. They should become compact memory:

- “Bathroom humidity often clears within 40 minutes after showers.”
- “Laundry-finished reminders are usually acknowledged after dinner.”
- “Vehicle readiness matters most on weekday mornings.”
- “The household ignores low-value solar opportunities unless laundry is waiting.”

Memory is not an archive of every sentence the House Brain ever said. It is the learning residue of stories.

## 10. Story expiration

Stories must expire because household meaning is temporal.

### Expiration modes

- **Resolved**: the condition changed successfully.
- **Window closed**: the opportunity or decision time passed.
- **Superseded**: a broader or more severe story replaced it.
- **Acknowledged until boundary**: muted until bedtime, morning, return home, or another contextual boundary.
- **Stale**: evidence aged out and may become `Unknown`.
- **Invalidated**: assumptions changed; for example, a trip was cancelled.
- **Absorbed into memory**: no longer active but useful for learning.

### Example expiration decisions

**Laundry finished**  
Expires when unloaded, acknowledged until a routine boundary, no longer relevant to the next plan, or transformed into `Attention` if it starts blocking tomorrow.

**Bedroom comfortable**  
Usually never exists as a separate story. If part of `Ready`, it expires when bedtime passes, room use changes, evidence becomes stale, or comfort leaves the acceptable range.

**Good charging opportunity**  
Expires when the cheap/surplus/available charging window closes, the car becomes ready, the departure changes, or ignoring it creates a readiness risk and transforms into `Attention`.

**Ready for tomorrow**  
Expires when tomorrow begins, when a blocker appears, when a critical unknown appears, or when the relevant morning departure/routine ends.

## 11. Silence philosophy

Silence is not hiding. Silence means no story exists.

The House Brain should never create a story when:

- the fact is normal and expected;
- no household intention is affected;
- no one can usefully act or be reassured;
- the same story was acknowledged for the current context;
- confidence is too low and uncertainty itself is not important;
- the story would be generic advice;
- the story is only about a device, provider, or capability;
- the action window is not open yet;
- the household has trained the Brain that this is unwanted noise;
- a broader story already explains the same meaning;
- the story would shame, nag, or create emotional burden without material benefit.

Silence should be active and explainable. If asked, the Brain may say, “I did not create a story because this is normal for Sunday afternoons and nothing depends on it.”

## 12. Story relationships

Stories can create, suppress, transform, and explain other stories, but relationships should remain household-intention based.

### Relationship types

- **Causes**: one story or interpretation materially creates another.
- **Contributes to**: a child interpretation affects a broader story.
- **Blocks**: one issue prevents readiness or steadiness.
- **Supersedes**: a broader story replaces narrower ones.
- **Downgrades**: new evidence lowers severity or removes urgency.
- **Contradicts**: evidence or stories disagree and may create `Unknown`.
- **Explains**: one interpretation makes another expected rather than concerning.
- **Transforms**: a story changes type as the time window changes.

### Recursive example

Vehicle not ready plus a real morning departure may create:

- child interpretation: “Vehicle charge is insufficient for likely trip.”
- `Attention`: “The car needs charging before the morning departure.”
- parent `Attention` or `Ready` failure: “Tomorrow morning is at risk.”

If laundry is also blocking morning, the House Brain should usually surface the parent:

- “Tomorrow morning is at risk because laundry and charging are unfinished.”

The vehicle and laundry interpretations remain explainers. They become separate active stories only if they need different attention patterns.

### Transformation examples

- `Opportunity` → `Attention`: “Good charging window tonight” becomes “Car will not be ready unless charging starts.”
- `Ready` → `Unknown`: “Tonight is ready” becomes “Bedroom readiness is unknown” when readings go stale.
- `Attention` → `Steady`: “Bathroom humidity high” resolves and no longer matters.
- `Unknown` → `Ready`: missing charger data returns and confirms morning readiness.

## 13. Validation against previous examples

### Climate and room comfort

Canonical reduction: room measurements are evidence. The household story is one of:

- `Steady`: rooms that matter are fine enough.
- `Attention`: a room will not be suitable for its next meaningful use.
- `Opportunity`: ventilating or pre-warming now is a good moment.
- `Ready`: bedtime, guests, work, or return-home comfort is prepared.
- `Unknown`: the Brain cannot judge comfort because readings, mappings, or routines are missing.

This removes the need for a climate story type.

### Laundry

Canonical reduction: laundry state is evidence about routine flow.

- Finished laundry is silent if expected and unimportant.
- Finished laundry becomes `Attention` if it blocks bedtime, school, sports, smell, wrinkles, or appliance availability.
- Starting laundry becomes `Opportunity` when timing is beneficial.
- Laundry contributes to `Ready` when it supports tomorrow, bedtime, vacation, guests, or school.
- Laundry becomes `Unknown` when appliance state is needed but unreliable.

This removes the need for laundry status stories.

### Energy

Canonical reduction: energy is timing and resilience evidence.

- Normal energy flow is usually silent or part of `Steady`.
- A useful surplus or low-cost window is `Opportunity`.
- A battery or grid issue that threatens a household outcome is `Attention`.
- Overnight or away-mode energy confidence may contribute to `Ready`.
- Missing or conflicting energy data becomes `Unknown` only when it blocks a judgement.

This removes energy charts, energy tips, and raw production stories from the canonical model.

### Water

Canonical reduction: water is safety, routine, and explanation evidence.

- Expected shower, cooking, or laundry water use is silent.
- Unexplained flow while away is `Attention`.
- Missing water data during vacation or nobody-home mode may be `Unknown`.
- Normal water behavior may support `Steady` or `Ready`.

This removes the need for a water story type.

### Mobility

Canonical reduction: vehicles are readiness evidence.

- A charged car is silent unless tied to a transition.
- Insufficient charge before a real departure is `Attention`.
- A cheap or solar-aligned charging window is `Opportunity`.
- A vehicle ready for morning contributes to `Ready`.
- Missing charger or vehicle state becomes `Unknown` only when a journey matters.

This removes the need for a mobility story type.

### Readiness

Readiness survives as a canonical type because it answers a unique household question: “Are we ready for what comes next?” It is not reducible to `Steady`, because it is future-transition specific. It is not reducible to `Attention`, because readiness can be positive reassurance. It is not reducible to `Opportunity`, because it may require no action. It is not reducible to `Unknown`, because it asserts sufficient confidence.

## 14. Final recommended Household Story model

### Definition

A **Household Story** is a household-level judgement, valid for a bounded time window, that explains whether the house can be ignored, needs attention, offers a useful moment, is ready for an upcoming transition, or cannot be responsibly judged.

### Canonical taxonomy

The final taxonomy is:

| Type | Core question | Interrupts? | Primary value |
| --- | --- | --- | --- |
| `Steady` | Can I ignore the house? | Never | Calm and trust |
| `Attention` | What needs notice? | Sometimes | Prevent avoidable downside |
| `Opportunity` | Is now a good moment? | Rarely | Capture timely upside |
| `Ready` | Are we prepared? | No, unless requested | Reassurance and closure |
| `Unknown` | What cannot be judged? | Sometimes | Prevent false confidence |

### Canonical story attributes

Every story should have:

- type;
- household question;
- time window;
- affected intention;
- confidence;
- severity;
- importance;
- actionability;
- interruption posture;
- explanation;
- evidence summary;
- assumptions;
- ignored consequence;
- resolution condition;
- expiration rule;
- memory rule;
- relationships to broader or narrower stories.

### Product invariants

- Stories are not domains.
- Stories are not widgets.
- Stories are not raw observations.
- Stories are not generic recommendations.
- Stories are not permanent records.
- Stories must be explainable.
- Stories must be bounded in time.
- Stories should be silent unless useful.
- Stories should collapse toward the smallest number of household-level answers.
- Parent stories should answer a broader household question, not summarize a domain.
- Unknown is a first-class story only when uncertainty matters.
- Steady and Ready are active conclusions, not empty states.
- Attention is consequence-based, not sensor-based.
- Opportunity is optional; if ignoring it creates material downside, it becomes Attention.

### The elegant core

The model can be reduced to one sentence:

> The House Brain tells the family only whether the house is steady, needs attention, offers an opportunity, is ready, or cannot be known.

That set is minimal because each type answers a distinct household question and every other candidate concept can be expressed as evidence, explanation, urgency, confidence, actionability, or relationship inside one of these five stories.
