# Household Assessment Layer: The Product Layer Above Household Stories

Date: 2026-07-12  
Repository: HomeOps / FamilyBoard  
Baseline: accepted House Brain and Household Story reports  
Scope: product model only; no software architecture, UI design, mockups, or implementation plan.

## 1. Executive summary

FamilyBoard should not primarily present Household Stories directly.

The previous Household Story model is correct, but it stops one layer too low for the product experience. A story says what the House Brain has noticed: something is steady, needs attention, offers an opportunity, is ready, or cannot be known. That is useful, but it is still not the family’s natural question.

A family usually does not ask:

- “Which story exists?”
- “Which domain is producing attention?”
- “Which opportunity did the house find?”

A family asks:

- “Are we ready for tonight?”
- “Will tomorrow morning be okay?”
- “Can I stop thinking about the house?”
- “Is leaving home safe enough?”
- “Is there anything that needs us before it becomes annoying?”

Those are **Household Assessments**.

The recommended model is:

> Observations → House Brain → Household Stories → Household Assessments → Experiences

But the important correction is that **Assessments, not Stories, should become the primary product abstraction**.

Stories remain essential. They are the evidence-bearing narrative units produced by the House Brain. They explain what changed, what matters, what is optional, what is unknown, and why the assessment says what it says. But the family-facing product should usually organize around assessments because assessments answer the family’s real readiness, calm, and transition questions.

A Household Assessment is a time-bounded answer to a household question.

It is not a page, widget, domain, recommendation, alert, or automation. It is the product’s judgement of a meaningful household interval or mode: now, tonight, tomorrow morning, leaving home, returning home, guests, vacation, storm, winter, weekend, or another real household situation when enough evidence exists.

The canonical assessment model should be smaller than the examples suggest. FamilyBoard should not create a large catalog of named assessments. It should recognize only four assessment families:

1. **Now** — “Can the family stop thinking about the house right now?”
2. **Next** — “Is the next meaningful household transition ready enough?”
3. **Away** — “Is the house okay while the family is not using it normally?”
4. **Special mode** — “Is the house prepared for an unusual condition?”

Examples such as Tonight, Tomorrow morning, Leaving home, Guests, Vacation, Winter, Storm, and Weekend are not all equal canonical types. They are assessment instances or templates inside these four families. This keeps the model elegant and prevents the product from becoming a menu of scenarios.

The cleanest final model is:

- **Observations** are evidence.
- **Stories** are meaningful findings.
- **Assessments** are answers.
- **Experiences** decide where and how answers appear.

The product sentence becomes:

> FamilyBoard tells the family whether the household is okay for what matters now or next, and explains only the few stories that affect that answer.

## 2. Why Assessments may exist

Assessments exist because the family’s mental model is not story-first. It is question-first.

A story can be true and still force the user to perform the final synthesis. For example:

- “The bedroom is colder than preferred before bedtime.”
- “The washer has finished and school clothes may still be wet.”
- “The car has enough charge for tomorrow’s known trips.”
- “Bathroom humidity is still elevated but trending down.”

Each story is understandable. But none directly answers the higher-order question:

> “Are we ready for tonight?”

If FamilyBoard presents several stories directly, the family still has to assemble a conclusion. That recreates the cognitive load the House Brain exists to reduce.

Assessments solve that by turning a set of relevant stories into one judgement about a household intention. They are useful when three conditions are true:

1. **The family has a natural question.**  
   The question exists before the product: bedtime, morning, leaving, returning, guests, weather, seasonal preparation, or quiet daily confidence.

2. **Multiple stories can affect the answer.**  
   A readiness judgement may depend on comfort, laundry, mobility, safety, energy, water, doors, calendar, weather, or stale evidence.

3. **The desired output is permission or focus.**  
   The family wants to know whether to relax, prepare, check one thing, or accept uncertainty.

Stories are still enough for narrow, isolated findings. “Water is flowing while nobody is home” does not need to wait for a broad assessment. But when the product is answering “are we okay?”, stories should feed an assessment.

## 3. Stories versus Assessments

### Stories

A Household Story is the smallest household-level statement that can be trusted, ignored, acted on, or explained.

Stories answer:

- “What is happening that matters?”
- “What changed?”
- “What needs attention?”
- “What opportunity exists?”
- “What cannot be known?”

Stories are finding-shaped. They are produced when the House Brain detects a meaningful interpretation.

### Assessments

A Household Assessment is a time-bounded answer to a household question.

Assessments answer:

- “Are we okay for this situation?”
- “Can the family stop thinking about the house?”
- “Is the next transition ready enough?”
- “What is the one thing, if any, that prevents calm?”

Assessments are question-shaped. They consume relevant stories and produce a conclusion.

### The distinction

The distinction is not severity, domain, or wording. It is **what kind of cognitive work the unit performs**.

| Unit | Product role | User question | Example |
| --- | --- | --- | --- |
| Observation | Evidence | “What was measured?” | “Bedroom is 18.1 °C.” |
| Story | Meaningful finding | “What matters?” | “Bedroom may be too cool for bedtime.” |
| Assessment | Household answer | “Are we ready?” | “Tonight is mostly ready; check bedroom comfort.” |

A story may say “there is a good opportunity.”  
An assessment says “that opportunity does or does not affect readiness, calm, or flow.”

A story may say “something needs attention.”  
An assessment says “because of that, tonight is blocked, mostly ready, unknown, or still ready enough.”

## 4. Canonical Assessment model

### Definition

A Household Assessment is a scoped judgement about whether the household is okay for a meaningful situation.

### Purpose

Reduce the family’s need to monitor, combine, and prioritize household signals.

### Question answered

Every assessment must answer one plain-language question:

> “Is the household okay for this situation?”

The exact situation changes, but the form should stay stable:

- “Is the house okay now?”
- “Are we ready for the next transition?”
- “Is the house okay while we are away?”
- “Is the house prepared for this special condition?”

### Lifetime

Assessments are temporary. They live only while their question is meaningful.

- A **Now** assessment may last minutes to hours.
- A **Next** assessment lasts until the transition starts, is completed, or is superseded.
- An **Away** assessment lasts from preparation through return or until normal occupancy resumes.
- A **Special mode** assessment lasts for the event, condition, or season it covers.

No assessment should become a permanent dashboard object just because it once existed.

### Inputs

Assessments can consider:

- active stories;
- settled recent stories when they still affect readiness;
- household routine and calendar context;
- household mode, presence, weather, season, and time;
- family preferences and known tolerances;
- stale or missing evidence;
- ignored, dismissed, or acknowledged stories when that response changes the answer.

### Story dependencies

An assessment should depend only on stories that can change the answer.

A bedtime assessment should not absorb every climate, energy, and appliance story merely because they exist. It should include only stories that affect whether bedtime is ready enough, calm enough, blocked, or unknown.

### Confidence

Every assessment has confidence in the answer, not just confidence in individual stories. Assessment confidence asks:

> “Can FamilyBoard responsibly say this situation is okay, not okay, or unknown?”

Confidence is lowered by stale readings, missing coverage, contradictory stories, weak routine assumptions, unusual schedules, and lack of relevant history.

### When recalculated

An assessment should recalculate when one of these changes:

- a dependent story appears, changes, settles, expires, or becomes unknown;
- the relevant time window changes;
- a household mode changes;
- a user acknowledges, dismisses, or resolves a blocking item;
- confidence changes materially;
- a stronger or more specific assessment supersedes it.

### When shown

An assessment should be shown when it answers an active or imminent household question better than a list of stories would.

It should be visible when:

- the household is likely to ask the question now;
- the answer meaningfully reduces cognitive load;
- one or more stories change the answer;
- uncertainty matters;
- silence would create false calm.

### When hidden

An assessment should be hidden when:

- its situation is not applicable;
- the time window has passed;
- it has no meaningful answer yet and uncertainty is not useful;
- it duplicates a broader assessment without adding clarity;
- it would encourage the family to monitor something that does not need monitoring.

### Deep dives

An assessment deep dive explains the answer. It should show the few stories that affected the judgement, the assumptions made, and any important unknowns. It should not become a full sensor browser.

### Relationship with Stories

Stories are the assessment’s reasons. Assessments are the story set’s conclusion.

The assessment should usually be the headline. Stories should usually be the explanation.

## 5. Assessment lifecycle

The proposed assessment lifecycle is:

> Not applicable → Watching → Assessing → Answered → Settled → Expired

### Not applicable

The question does not currently make sense.

Examples:

- “Leaving home” when nobody is about to leave.
- “Guests” when no guest context exists.
- “Storm” when there is no storm condition.

This should usually be invisible.

### Watching

The situation may become relevant, but there is not yet enough reason to produce an answer.

Example:

- Tomorrow morning exists on the calendar, but it is too early and no story affects it yet.

This should usually be quiet.

### Assessing

The question is relevant and FamilyBoard is gathering or reconciling stories.

Example:

- It is evening, bedtime is approaching, laundry and room comfort are being evaluated, and readings are still fresh enough to judge.

This may be visible if the family expects an answer soon, but should not create anxious progress tracking.

### Answered

FamilyBoard has a current judgement.

The answer may be ready, mostly ready, blocked, calm, needs attention, or unknown depending on the assessment family. This is the primary useful state.

### Settled

The family acted, acknowledged the issue, the transition passed successfully, or the assessment no longer needs active attention but remains useful as recent context.

Example:

- “Tonight was handled; bedroom comfort was adjusted.”

Settled should be short-lived and quiet.

### Expired

The answer is no longer meaningful because the time window or situation ended.

Expired assessments should disappear from primary product surfaces, though their learning residue may inform future memory.

### Rejected lifecycle labels

- **Pending** is too vague. It can mean Not applicable, Watching, or Assessing.
- **In progress** sounds like a task. Assessments are judgements, not work items.
- **Complete** sounds final and project-like. Household life is cyclical; Settled is more accurate.
- **Unknown** should not be a lifecycle state. It is an answer when FamilyBoard cannot responsibly judge.

## 6. Story-to-Assessment relationships

Stories contribute to assessments in four ways:

1. **Blocking stories**  
   A story prevents the assessment from saying the household is ready or calm.

2. **Degrading stories**  
   A story does not block the situation, but reduces confidence or readiness.

3. **Supporting stories**  
   A story increases confidence that the situation is okay.

4. **Explanatory stories**  
   A story does not change the answer but helps explain why FamilyBoard judged as it did.

The model should resist creating assessment-specific story categories. A `Laundry Attention` story can block “Tomorrow morning,” degrade “Tonight,” or be irrelevant to “Away,” depending on context.

Example:

> Tonight receives bedroom comfort, laundry, humidity, and vehicle stories only if those stories affect tonight’s readiness.

The earlier example is therefore directionally right but too mechanical. Assessments should not subscribe to domains. They should subscribe to consequences.

A better phrasing is:

> “Tonight” considers any story that can change whether the household is ready for the evening and overnight interval.

This may include bedroom comfort, laundry, humidity, doors, water, energy, vehicle, or nothing at all.

## 7. Assessment confidence

Confidence is not the same as readiness.

Readiness is the answer. Confidence is trust in the answer.

A clean model separates them:

### Assessment answer

The answer should be intentionally small:

- **Okay** — nothing meaningful prevents calm or readiness.
- **Mostly okay** — the situation is usable, but one minor or optional issue exists.
- **Needs attention** — one or more stories should be noticed before the situation can be considered okay.
- **Blocked** — a material issue prevents the intended situation.
- **Unknown** — FamilyBoard cannot responsibly judge.

These are assessment answers, not stories.

### Assessment confidence

Confidence should be separate:

- **High** — the answer is well supported.
- **Medium** — the answer is useful but has assumptions.
- **Low** — the answer should be treated cautiously.

The product should avoid exposing confidence as a technical score. Confidence matters because it changes language, interruption, and whether an assessment may reassure.

### Why Unknown is an answer

Unknown belongs as an assessment answer when the question matters but cannot be judged.

It is not a lifecycle state because the assessment is still active and answered. The answer is simply “I cannot responsibly say.”

### Why Ready is not enough

“Ready” is too narrow for the assessment layer. Some assessments are about calm, safety, or weather preparation rather than readiness. The more general answer is **Okay**. “Ready” can remain product language for transition assessments, but the underlying conceptual answer should be okay / mostly okay / needs attention / blocked / unknown.

## 8. Assessment hierarchy

Assessments may relate to other assessments, but they should not become deep trees.

The recommended rule is:

> Assessments can roll up one level when a larger household question naturally contains smaller time windows, but product reasoning should remain shallow.

Examples:

- “Tomorrow” may roll up “Morning,” “Afternoon,” and “Evening” if each interval has a materially different answer.
- “Vacation” may include “Leaving,” “Away,” and “Returning” if those phases are meaningful.
- “Storm” may influence “Tonight” and “Away,” but should not swallow them unless the storm is the dominant household question.

The hierarchy should exist only when it helps answer a family question faster. It should not exist for organizational neatness.

### Recommended hierarchy rule

- Default: flat assessments.
- Allow one-level rollups for time or mode phases.
- Do not allow arbitrary nested assessment trees.
- Stories remain the preferred explanation units beneath assessments.
- A parent assessment must have its own question, not merely summarize child cards.

## 9. Deep dive ownership

A deep dive belongs to the question the family is asking.

That means deep dives can belong to both assessments and stories, but for different purposes.

### Assessment deep dive

An assessment deep dive explains:

- the answer;
- the relevant stories;
- which stories were blocking, degrading, supporting, or explanatory;
- what was assumed;
- what is unknown;
- what would change the answer.

Example:

- “Why is tonight mostly okay?”

### Story deep dive

A story deep dive explains:

- the finding;
- its evidence;
- trend, history, and confidence;
- consequence;
- optional action or acknowledgement.

Example:

- “Why does the bedroom need attention?”

### Domain deep dive

A domain page such as Climate should not be the owner of the primary product meaning. It can explain either:

- a story, when the user asks why a climate-related finding exists; or
- an assessment, when climate is one contributor to a broader answer.

Therefore the Climate page does not fundamentally explain “climate.” It explains the climate-related reasons behind the current household answer.

## 10. How Woning would consume Assessments

If Woning is built around Assessments instead of Stories, it becomes more natural.

Woning would stop being “the place where house stories are listed” and become “the place where the household answer is checked.” That better matches the calm product promise.

Conceptually, Woning would consume assessments by asking:

- What is the current household answer?
- What upcoming answer matters next?
- Which story, if any, changes that answer?
- What can be safely ignored?
- What remains unknown?

This improves clarity because a family member can understand the state of the house without reading multiple findings and synthesizing them.

It improves calm because the default experience can be an assessment such as “The house is okay now” rather than a stream of small stories. Stories appear only as reasons when they matter.

It improves speed because the user sees the conclusion first. The product no longer asks the family to inspect bedroom, laundry, humidity, vehicle, energy, water, and routine fragments to decide whether life is okay.

The trade-off is that assessments create a stronger promise. If FamilyBoard says “Tonight is okay,” it must be careful about scope, confidence, and unknowns. The answer must never imply coverage the House Brain does not have.

## 11. How Home would consume Assessments

Home should consume Assessments more than Stories.

Home is the family’s ambient command center. It should not become a notification feed or story inbox. Its most valuable household-intelligence role is to answer:

> “Is there anything I need to know before continuing with family life?”

That is assessment-shaped.

Home should therefore prefer:

- the current assessment when something affects immediate calm;
- the next transition assessment when preparation matters;
- a special-mode assessment when unusual conditions dominate;
- only the most important story when it independently requires attention.

Stories may still appear on Home when they are urgent, singular, or not part of a broader assessment. But the normal case should be assessment-first because Home should reduce mental tabs, not open new ones.

## 12. Notification strategy

Notifications should originate from the unit that best represents why interruption is justified.

### Assessment-originated notifications

Use an assessment notification when the interruption is about readiness, calm, or a transition answer.

Examples:

- “Tomorrow morning needs attention.”
- “Leaving home is blocked by an unresolved water-flow story.”
- “Tonight is mostly okay, but bedroom comfort is uncertain.”

Assessment notifications are best when multiple stories contribute or when the family needs a conclusion.

### Story-originated notifications

Use a story notification when a single finding is urgent, safety-relevant, time-sensitive, or independent of a broader assessment.

Examples:

- “Water is flowing while nobody is home.”
- “Freezer power appears at risk.”
- “The washer finished and delay now affects school clothes.”

Story notifications are best when waiting for a broader assessment would obscure urgency.

### Both

Both may participate, but only one should interrupt. The other should explain.

Rule:

> Notify from Assessments when the family question is the reason to interrupt. Notify from Stories when the finding itself is the reason to interrupt.

This prevents duplicate alerts such as “Tonight needs attention” and “Bedroom needs attention” firing separately for the same issue.

## 13. Vocabulary reduction

The product vocabulary should be aggressively reduced.

### Keep

- **Observation** — raw evidence, mostly internal or explanatory.
- **Story** — meaningful finding.
- **Assessment** — answer to a household question.
- **Confidence** — trust in the answer or story.

### Use only as attributes, not concepts

- **Recommendation** — action attached to a story or assessment.
- **Opportunity** — story type, not a separate layer.
- **Attention** — story type and assessment answer language, not a separate object.
- **Decision** — internal posture, not product vocabulary.
- **Interpretation** — internal step from observation to story.
- **Knowledge** — memory or preferences, not user-facing vocabulary.

### Remove as first-class product concepts

- **Situation** — too broad; use Assessment when it answers a question, Story when it explains a finding.
- **Insight** — vague and dashboard-like.
- **Status** — too passive; use Assessment answer.
- **Alert** — delivery posture, not a product concept.
- **Tip** — usually noise; if useful, it is an Opportunity story.

### Minimal conceptual vocabulary

The elegant product model needs only four nouns:

1. **Observation**
2. **Story**
3. **Assessment**
4. **Experience**

And one quality:

5. **Confidence**

Everything else should be phrasing, not model.

## 14. Final conceptual model

The final model is:

> Observations become Stories. Stories support Assessments. Assessments feed Experiences.

### Observations

Observations are what FamilyBoard knows or receives.

They are not the product.

### Stories

Stories are what the House Brain finds meaningful.

They answer:

> “What matters?”

They should remain the canonical House Brain output.

### Assessments

Assessments are what FamilyBoard tells the family.

They answer:

> “Are we okay for what matters now or next?”

They should become the primary product abstraction.

### Experiences

Experiences are where answers are consumed: Home, Woning, notifications, voice, rituals, and future surfaces.

They should not define the meaning. They should consume the meaning.

### The simplified pipeline

The best model is therefore:

```text
Observations
  ↓
House Brain
  ↓
Stories: meaningful findings
  ↓
Assessments: household answers
  ↓
Experiences: places where answers appear
```

The important product contract is that the family should rarely need to inspect stories first. The family should receive the answer first, with stories available as reasons.

## 15. Recommendation whether Assessments should become the primary product abstraction

Yes. Assessments should become the primary product abstraction above the House Brain.

The House Brain should still expose both Stories and Assessments, but not with equal product priority.

### Recommended exposure

- Expose **Stories** as the canonical reasoning findings.
- Expose **Assessments** as the canonical family-facing answers.
- Let experiences prefer Assessments by default.
- Let Stories surface directly only when they are urgent, singular, or better than any broader assessment.

### Why both are needed

Assessments without Stories become unexplained verdicts. They may feel magical, overconfident, or untrustworthy.

Stories without Assessments become a feed of interpreted household fragments. They may be better than raw sensors, but they still ask the family to assemble the answer.

Together, they create the right relationship:

> Assessment: “Tonight is mostly okay.”  
> Stories: “Bedroom comfort is slightly uncertain; laundry is handled; humidity is improving.”

### Final product philosophy

FamilyBoard does not tell the family everything the house knows.

FamilyBoard does not tell the family every story the House Brain can produce.

FamilyBoard tells the family:

> “You are okay, almost okay, need to notice one thing, are blocked, or I cannot responsibly tell — for the household moment that matters now.”

That is the layer above stories. That is the calmer product.
