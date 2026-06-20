# Rewards Domain Analysis

## Summary
HomeOps Rewards should answer: **what is this family goal working toward, and how will the household celebrate success?**

A Reward should be a goal-attached outcome, promise, ritual, privilege, or celebration that makes Motivation feel purposeful without turning contribution into a currency market. It is not Reward Economy, not Gems, not a Shop, and not an inventory of purchasable items.

Recommended direction:
- Emphasize **family rewards** as the default for the first implementation.
- Treat rewards as **celebrations connected to goals**, not payment for individual tasks.
- Keep reward representation lightweight: title, optional description, scope, visibility, and completion state.
- Allow individual rewards later, primarily as small privileges or one-on-one connection moments.
- Keep Rewards inside Motivation UX at first, not as a standalone page.
- Preserve Helpful Moments as recognition, not automatic reward triggers.
- Keep future Reward Economy separate and optional.

The first implementation should add a structured **Family Goal Reward / Celebration** concept to active family goals, replacing the current loose reward label with clearer product semantics while avoiding economy mechanics.

## Reward Domain Purpose
Rewards exist to give a Motivation goal a positive destination.

They solve three family-facing problems:
1. **Purpose:** Children and caregivers can understand why a goal matters now.
2. **Anticipation:** The household can look forward to a shared moment instead of focusing only on chores.
3. **Closure:** When the goal completes, the family has an agreed way to celebrate and move on.

The best framing is not “what do I get for doing this task?” The best framing is:

> “When we work together and reach this goal, how will we celebrate?”

Rewards should answer:
- What are we working toward?
- What happens when this goal succeeds?
- What celebration or privilege is connected to this goal?
- Why does this goal feel worth noticing as a family?

Rewards should not answer:
- How many gems did I earn?
- What can I buy?
- Which child earned the most?
- What is every task worth?

A HomeOps Reward should therefore be modeled conceptually as a **goal outcome** rather than an economy asset.

## Reward Types
### Family rewards
Family rewards are shared outcomes earned by the household through a family goal.

Good examples:
- Movie night.
- Board game night.
- Choose dessert together.
- Family outing.
- Bake together.
- Special breakfast.
- Park visit.
- Family picnic.
- Everyone chooses one song for cleanup dance time.

Family rewards fit the first implementation because they reinforce cooperation, reduce sibling comparison, and align with Motivation's current family-goal-first direction.

### Individual rewards
Individual rewards are personal outcomes connected to an individual goal.

Good examples:
- Extra story.
- Choose dinner.
- Pick the family game.
- Special one-on-one parent time.
- Stay up 10 minutes later for reading.
- Small privilege.
- Choose weekend breakfast.

Individual rewards can be healthy when they recognize personal growth, but they carry more fairness and comparison risk. They should wait until family rewards are stable, individual goal editing exists, and visibility rules are clearer.

### Rewards that should wait
These should not be in the first implementation:
- Spendable rewards.
- Shops.
- Gems, tokens, coins, or balances.
- Avatar cosmetics as purchasable items.
- Screen-time markets.
- Allowance or money conversion.
- Complex catalogs.
- Per-task bounty rewards.
- Reward requests and redemption workflows.

These belong to future Reward Economy or Gamification work, not the Rewards domain foundation.

## Family vs Individual Rewards
Family rewards should be emphasized and should be the default.

Reasons:
- HomeOps is a household hub, not a personal productivity game.
- Family goals are already the dominant Motivation unit.
- Shared rewards encourage cooperation rather than competition.
- Younger children can participate without needing to understand individual accounting.
- Parents can frame the reward as a family ritual, not payment.
- It reduces “that was my reward” sibling conflict.

Individual rewards should be supported later, but as a secondary path:
- Use for personal routines, growth, and age-appropriate privileges.
- Avoid public ranking or sibling comparison.
- Keep rewards small, relational, and parent-confirmed.
- Prefer privileges and connection over objects.

Healthiest default dynamic:
1. Family goal has a shared celebration.
2. Individual goals have recognition and progress.
3. Individual rewards are optional and parent-configured later.

The first implementation should therefore focus on **Family Goal → Family Celebration**.

## Age Group Analysis
### Ages 3-5
Meaningful rewards:
- Immediate praise and celebration.
- Stickers/stars as progress visuals.
- Extra story.
- Bake together.
- Dance party.
- Movie night with family.
- Choosing dessert or pajamas.
- Parent-child play time.

Inappropriate rewards:
- Currency balances.
- Saving goals.
- Shops.
- Complex choices with tradeoffs.
- Rewards delayed more than a few days without strong visual support.
- Competitive rewards.

Too abstract:
- Monthly goals.
- “Save up for later.”
- Exchange rates.
- Multi-step unlock rules.

Recommended framing:
- “When our stars are full, we celebrate together.”
- Reward should be visible, concrete, visual, and narrated by an adult.

### Ages 6-8
Meaningful rewards:
- Weekly family rituals.
- Choosing a meal or dessert.
- Board game night.
- Small privilege.
- Extra reading time.
- Choose the family activity.
- Short outing.
- Parent-child special time.

Inappropriate rewards:
- Large catalogs.
- Unlimited screen time.
- Complex economies.
- Long-delayed rewards without milestones.
- Rewards that depend on outperforming siblings.

Too abstract:
- Vague “achievement” language with no visible outcome.
- Multi-week saving unless broken into clear milestones.
- Reward conditions hidden from children.

Recommended framing:
- “This week we are working toward board game night.”
- Reward can be visible throughout the goal and paired with progress.

### Ages 9-12
Meaningful rewards:
- Autonomy privileges.
- Choosing dinner or family activity.
- Later reading time.
- One-on-one parent outing.
- Larger multi-week family experiences.
- Personal project time.
- Meaningful responsibility or trust-based privilege.

Inappropriate rewards:
- Babyish-only sticker framing.
- Public reward comparisons.
- Manipulative rewards for basic compliance.
- Rewards that undermine sleep, safety, family rules, or health.
- Opaque parent-controlled payouts.

Too abstract:
- Rewards with unclear criteria.
- “Be good and maybe something happens.”
- Hidden approval rules.

Recommended framing:
- “This goal unlocks a planned family activity or agreed privilege.”
- Older children need transparent expectations, autonomy, and respect.

## Reward Visibility
Rewards should be visible **before the goal starts and while the goal is active**.

Best UX:
- During goal creation/editing, the caregiver can attach a reward or celebration.
- On the active Motivation page, the reward appears near the family goal as “When we finish...” or “Celebration...”
- On Home, a short reward label may appear only if it fits the compact tile and clarifies the family goal.
- On completion, the reward changes from anticipated to unlocked/ready to celebrate.

Why not hide until completion:
- It removes the “what are we working toward?” answer.
- It makes rewards feel like a surprise prize rather than a shared family agreement.
- It works poorly for younger children who need concrete anticipation.

Why not over-emphasize before completion:
- The reward can dominate the goal and make contribution transactional.
- The UI should keep progress and encouragement primary.

Recommended visibility hierarchy:
1. Goal title and purpose.
2. Progress.
3. Reward/celebration as warm context.
4. Helpful Moments and recognition.

## Reward Completion
When a goal completes, HomeOps should mark the reward as **unlocked / ready to celebrate**, then require parent confirmation when the reward has actually happened.

Recommended behavior:
1. Goal reaches target.
2. Motivation shows a celebration state.
3. Connected reward becomes “Ready to celebrate.”
4. Parent can mark the reward as celebrated/done.
5. Completed goal and reward move to a short history/celebration area later.

This balances child clarity with household reality. A family may finish a goal on Wednesday but do movie night on Friday. The system should not automatically claim the reward happened.

Avoid:
- Automatic reward fulfillment.
- Economy-style redemption.
- Children spending reward value.
- Failure or punishment if the reward is delayed.
- Treating goal completion as a purchase event.

Parent confirmation should be lightweight, not a heavy approval workflow. Suggested states:
- Planned.
- Ready to celebrate.
- Celebrated.
- Skipped/changed by parent only as a later optional administrative state, not child-facing default.

## Relationship to Motivation
Rewards belong inside Motivation as goal outcomes.

### Family Goals
Family goals should be the primary connection:
- One active family goal may have zero or one family reward/celebration in the first implementation.
- Reward is visible on the Motivation page under the family goal.
- Completion unlocks the celebration.

### Individual Goals
Individual goals can connect later:
- Individual reward support should wait until individual goal creation/editing is mature.
- Rewards should be optional and small.
- Visibility should avoid making the Motivation page a sibling comparison board.

### Helpful Moments
Helpful Moments should remain recognition-first:
- They may contribute to a goal when explicitly configured in Motivation.
- They should not directly unlock rewards by themselves in the first implementation.
- They should not produce currency.
- A Helpful Moment can be celebrated in feed language without becoming a Reward.

The key boundary: Rewards are attached to goals, not raw events.

## Relationship to Reward Economy
Rewards and Reward Economy may eventually interact, but they should remain separate domains.

### Rewards outside the economy
These should remain outside Reward Economy by default:
- Family movie night.
- Board game night.
- Bake together.
- Family outing.
- Choose dessert.
- Special breakfast.
- Celebration at dinner.
- Parent-child special time attached to a goal.
- Goal completion rituals.

These are not purchased. They are planned outcomes of family goals.

### Rewards that could eventually be purchased
These belong to future Reward Economy if the family enables it:
- Small privileges.
- Avatar cosmetics.
- Extra screen time, if allowed and carefully bounded.
- Choose a small treat.
- Save toward a special item.
- Redeem a token for a parent-approved activity.

### Gems, shop, and avatar cosmetics
Gems/coins/tokens/shops should not appear in the Rewards domain foundation.

Future relationship:
- Motivation Reward: “When this goal is complete, we celebrate with board game night.”
- Reward Economy item: “Spend 5 tokens to pick a weekend breakfast.”
- Gamification unlock: “Completing a milestone unlocks an avatar background.”

A single family may use all three later, but HomeOps should not collapse them into one concept.

## Reward UX Placement
Rewards should not have a dedicated page in the first implementation.

Recommended UX placement:
- **Motivation page:** primary home for rewards, attached to active goals.
- **Home Motivation tile:** optional compact mention for the active family reward if short.
- **Family Member page:** future place for individual goal rewards, but only after individual rewards exist.
- **No separate Rewards page:** avoid making rewards feel like a shop or catalog.

A dedicated Rewards page should wait until there is a true Reward Economy, redemption history, or parent-curated catalog. Creating it now would send the wrong product signal.

## Reward Language
Preferred wording: **Celebration** for family-facing UX; **Reward** as an internal/domain umbrella if needed.

Recommended terms:
- Child/family-facing: “Celebration.”
- Family goal label: “When we finish.”
- Completion state: “Ready to celebrate.”
- Historical state: “Celebrated.”
- Parent setup label: “Family celebration.”

Use carefully:
- “Reward” is understandable but can sound transactional.
- “Goal reward” is clear for parent configuration but less warm.
- “Achievement” sounds abstract and gamified.
- “Surprise” should not be the default because goals benefit from visible anticipation.

Best first implementation wording:
- Create/edit field: “Family celebration.”
- Display: “When we finish: Movie night.”
- Complete state: “Goal complete — movie night is ready to celebrate.”

## Long-Term Risks
### Bribery
Risk: rewards become “do this or you do not get the prize.”

Mitigations:
- Attach rewards to goals, not every task.
- Use family rituals and privileges rather than large material prizes.
- Keep encouragement language primary.

### Transactional behavior
Risk: children ask what every helpful act is worth.

Mitigations:
- Keep Tasks valid without rewards.
- Keep Helpful Moments recognition-only by default.
- Avoid per-task bounty rewards.
- Keep Reward Economy separate.

### Reward inflation
Risk: rewards need to become bigger to maintain engagement.

Mitigations:
- Default to low-cost shared experiences.
- Provide suggested celebration templates.
- Avoid catalogs in the first implementation.
- Normalize goals without rewards.

### Family conflict
Risk: siblings dispute who earned the reward or whether someone contributed enough.

Mitigations:
- Default to family rewards.
- Avoid leaderboards.
- Use participation goals carefully.
- Let parents confirm completion and celebration timing.
- Never punish the whole family because one child struggled.

### Entitlement
Risk: children treat normal household contribution as optional unless rewarded.

Mitigations:
- Preserve non-rewarded tasks.
- Use rewards for goal rhythms, not all responsibilities.
- Use language of celebration and contribution.

### Loss of intrinsic motivation
Risk: external rewards crowd out helpful identity.

Mitigations:
- Lead with recognition, Helpful Moments, and family purpose.
- Keep rewards small and relational.
- Celebrate effort, kindness, routines, and cooperation.
- Avoid currency for young children.

## Domain Boundaries
### Tasks
Tasks are the execution surface for household responsibilities.
- Own: task title, due date, assignment, completion, reopen.
- Do not own: rewards, currency, celebrations, goal meaning.

### Motivation
Motivation is the encouragement layer.
- Own: family goals, individual goals, progress, warm encouragement, goal-attached celebration display.
- Does not own: task execution, shop purchases, currency balances.

### Helpful Moments
Helpful Moments are parent-entered recognition.
- Own: positive recognition of kindness, initiative, teamwork, responsibility, and routines.
- May optionally contribute to goals later.
- Do not directly pay currency or unlock rewards by default.

### Rewards
Rewards are goal outcomes and celebrations.
- Own: what the family or child is working toward when a goal succeeds.
- Connect to goals.
- Do not own earning rules, spendable balances, or shops.

### Reward Economy
Reward Economy is optional exchange.
- Own: tokens/coins/gems, balances, earning events, spending, shop, redemption.
- Should remain disabled/hidden until explicitly implemented and enabled.

### Gamification
Gamification is playful presentation.
- Own: badges, avatar delight, animations, unlock visuals, optional game-like feedback.
- Should not own household responsibility or reward accounting.

### Family Members
Family Members are household participants.
- Own: name, avatar, age context, child/adult presentation identity.
- Can be linked to individual goals and future individual rewards.
- Are not users, accounts, permission principals, or wallets by default.

## Open Questions
- Should the first structured reward field replace the current family goal reward label directly, or coexist as a new concept while preserving backward compatibility?
- Should a family goal be allowed to have no celebration, or should setup always suggest one?
- Should “celebrated” history be visible to children immediately, or deferred until a broader goal history slice?
- Should individual rewards require caregiver-only visibility controls before launch?
- Should Home show the celebration label, or should it stay only on Motivation to avoid reward overemphasis?
- Should completion allow parent rescheduling, or is “ready to celebrate” enough for the first slice?

## Recommended Direction
HomeOps should define Reward as a **goal-attached celebration/outcome**.

Product principles:
1. Family rewards first.
2. Celebration language first, reward language second.
3. Visible before and during the goal.
4. Unlocked at completion, parent-marked when celebrated.
5. Attached to goals, not tasks or Helpful Moments directly.
6. Separate from Reward Economy, Gems, Shop, and Gamification.
7. Low-cost, relational, age-appropriate, and sustainable.

Recommended default UX copy:
- “Family celebration.”
- “When we finish...”
- “Ready to celebrate.”
- “Celebrated.”

## Recommended First Implementation Slice
Recommended slice: **Family Goal Celebration Foundation**.

Scope:
- Add structured support for one optional celebration attached to the active family goal.
- Keep it inside Motivation.
- Preserve current progress behavior.
- Show the celebration on the active family goal card.
- When the goal completes, show “Ready to celebrate.”
- Allow a caregiver to mark the celebration as celebrated only if a lightweight completion action already fits the goal editing surface.

Keep out of scope:
- Individual rewards.
- Reward Economy.
- Gems, tokens, coins, balances.
- Shop/catalog.
- Purchases/redemptions.
- Avatar unlocks.
- Per-task reward values.
- Helpful Moment automatic reward triggers.
- Dedicated Rewards page.
- Complex reward templates.

If the slice must be smaller, start by renaming and clarifying the existing reward label as “Family celebration” in the Motivation goal UX and documenting the intended states for a later completion slice.

## Next Prompt Context
HomeOps has Tasks feeding Motivation Progress, Helpful Moments for recognition, active Family Goals, Individual Goals, a Motivation page, a Home Motivation tile, and child progress views. The current missing Motivation link is Goals → Reward.

Next implementation prompt should ask for one narrow slice:
- Implement Family Goal Celebration Foundation.
- Treat celebration as the first Rewards domain representation.
- Attach it only to family goals in the first slice.
- Use family-facing language: “Family celebration,” “When we finish,” and “Ready to celebrate.”
- Do not implement Reward Economy, Gems, Shop, balances, purchases, avatar unlocks, individual rewards, leaderboards, negative points, task approval, authentication, roles, permissions, or migrations unless explicitly scoped.
- Keep Motivation encouragement-first and keep rewards as goal outcomes rather than payment for tasks.
