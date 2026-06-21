# Content and Copy Audit

## Executive Summary

HomeOps has accumulated copy that explains the product model more than it helps users act. The largest reading burden is not in basic labels or buttons; it is in permanent explanatory surfaces around Motivation, Child Workspace, Weekly Reset, empty states, and setup/administration areas.

The most valuable copy reduction opportunity is to simplify the Motivation / Child Workspace copy system. These surfaces repeat the same ideas across several cards: contribution matters, the family got closer, celebration is coming, there are no rankings, and grown-ups can add goals. Those ideas were useful while the model was being introduced, but they now create scanning fatigue and crowd out the concrete state users need: what is the goal, what is left, what can I do next, and what happened recently.

Key findings:

- **Highest-copy areas:** Child Workspace, Motivation, Weekly Reset, Tasks templates/reset panels, onboarding, and empty states.
- **Largest over-explaining source:** Motivation and child-facing family goal / celebration copy repeatedly explains contribution, progress, celebration, memory, and no-ranking philosophy.
- **Most developer-sounding terms:** Motivation, Family Goal, Individual Goal, Helpful Moments, Weekly Household Reset, no-date tasks, review candidates, Child Mode, Parent Mode, widget labels, and EventSeries/export terminology.
- **Largest repetition source:** Home, Motivation, and Child Workspace each repeat the same family goal and celebration narrative.
- **Highest-value first cleanup:** Replace the repeated Motivation / Child Workspace explanatory narrative with short, state-first copy and reserve philosophy text for empty/help surfaces only.

This audit is based only on static code and existing reports. The application was not run.

## Copy Inventory

### Main visible copy sources

- **App shell and workspaces:** Workspace labels, navigation actions, page headers, and workspace-specific summaries.
- **Home dashboard:** Summary cards for family members, Motivation, Tasks, Agenda, Lists, and empty-state explanations.
- **Motivation page:** Page header, family goal card, contribution story, celebration surface, celebration memories, Helpful Moments, personal goals, and forms.
- **Child Workspace / Family Member page:** Child Mode, Parent Mode, hero area, Today, This Week, Family Goal, celebration, memories, Helpful Moments, parent administration, member details, and avatar configuration.
- **Tasks:** Main task form, task templates panel, Weekly Household Reset panel, Someday panel, grouped task rows, empty state, and prompt-based due-date copy.
- **Lists / Shopping:** Widget type label, list management controls, add-item form, empty states, active/completed/deleted section labels, and store metadata.
- **Agenda:** Widget type label, view toggle, source selector, event form, empty state, loading/error messages, and edit/delete controls.
- **Weekly Reset:** Hero explanation, reset cards, review candidate action labels, goal confirmations, shopping cleanup, contribution recap, and skip state.
- **First-run wizard:** Setup step labels, welcome explanation, member form labels, review copy, finish copy, and empty household member lists.
- **Settings/calendar portability:** Calendar administration labels, destructive restore warning, export/restore summaries, validation feedback, and restore confirmation.

### Areas with the most copy

1. **Child Workspace / Family Member page** — multiple child-facing sections each include eyebrow labels, headings, paragraphs, progress text, fallback text, and celebration/memory explanations.
2. **Motivation page** — header copy, family goal narrative, contribution-story chain, celebration copy, memory copy, personal goal copy, and form guidance.
3. **Weekly Reset** — dense parent workflow copy compressed into cards and action rows.
4. **Tasks** — task creation is compact, but templates, weekly reset, no-date review, and Someday explanations add density.
5. **Settings/calendar portability** — necessary safety copy, but highly technical and administrator-oriented.

## Over-Explaining Audit

### Major candidates

#### Motivation / family goal narrative

The Motivation header explains the purpose as celebrating cooperation, routines, and progress without comparison or competition. The active family goal then adds a “Family contribution story,” a separate “Contribution → Progress → Celebration → Memory” chain, anticipation copy, celebration copy, memory copy, and personal-goal encouragement. This repeats the same model rather than letting the goal title, progress, and celebration speak for themselves.

Recommendation: Keep one short page description or remove it entirely once the family has an active goal. Convert the contribution-story chain into a visual or remove it from the default state.

#### Child Workspace contribution philosophy

The child hero explains that the child’s help mattered, the family noticed, the contribution helped the family get closer, and there are no teams/ranks/comparisons. Nearby sections repeat similar ideas: “Your help moves the family closer,” “My help mattered,” “every contribution and helpful moment,” “we helped, got closer,” and “made the celebration happen together.”

Recommendation: For active states, show short state-first messages such as “3 more helpful tasks to movie night” or “You helped today.” Keep anti-ranking/product-philosophy copy out of child-facing permanent UI.

#### Weekly Reset explanation

Weekly Reset explains that it is optional, short, parent-facing, limited to things likely to need attention, and skippable. Its cards also explain “not every task,” “stale no-date and someday items,” “confirm each child still has the right focus,” and “older, archived, or duplicate-looking lists.” This is useful the first time but heavy as a recurring weekly ritual.

Recommendation: Keep the hero short and make cards action-first. Example: “Review stale tasks,” “Check goals,” “Shopping cleanup,” “Weekly recap.” Use details only where the list is empty or ambiguous.

#### Empty states that define basic features

Several empty states explain common concepts: tasks organize household responsibilities, lists remember shopping/packing/household items, events remember dates/activities, and family goals help everyone work together. These are reasonable for first-run, but repetitive after users understand the product.

Recommendation: Use concise empty states with one action. Example: “No tasks yet. Add one task.”

#### Administrative and architecture language exposed to users

Calendar export/restore references local calendar event sources and EventSeries records. Family member adult-page copy explains that Family Members are household entities, not users, login identities, profiles, or permission holders. This protects scope boundaries but reads like product-development copy.

Recommendation: Keep technical safety copy only where it prevents destructive mistakes. Move architecture disclaimers out of normal user surfaces.

## Developer Language Audit

### Terms users likely understand

- **Tasks** — clear.
- **Lists** — clear.
- **Agenda** — likely clear in European/household context; “Calendar” may be clearer for some users.
- **Shopping** — clear.
- **Adults / Children / Family members** — clear.
- **Today / This Week / Someday** — clear.
- **Celebration / Memories** — understandable, especially with context.

### Terms that may sound internal or product-design oriented

- **Motivation** — understandable as a section title, but abstract. Users may not know whether it means goals, rewards, praise, or progress.
- **Family Goal / Individual Goal / Personal goal** — understandable, but inconsistent terminology creates mental translation. “Individual goal” sounds product/internal; “Personal goal” sounds more user-facing.
- **Helpful Moments** — warm but branded. It may be understandable after use, but first-time users may not know whether these are notes, praise, memories, or achievements.
- **Weekly Household Reset** — conceptually useful but process-heavy. “Weekly Review” or “Weekly Check-in” may be lower effort.
- **Review candidates** — internal triage language. Parents do not need to know items are candidates; they need to know these are tasks to review.
- **No-date tasks** — implementation-shaped. “Tasks without dates” or “Unscheduled tasks” is clearer.
- **Child Mode / Parent Mode** — understandable, but “Mode” is UI terminology. “Child view” and “Parent controls” may be clearer.
- **Family contribution story** — product-design language. It explains a model instead of labeling a user task.
- **Progress words / unit label** — configuration language. Users may need examples, not a data-model label.
- **Widget / Widget type / Placeholder Widget / Agenda Widget / Shopping List Widget** — development-era language when visible to users.
- **EventSeries / event sources / local source / schema/payload version** — administrator/developer language; acceptable only in Settings portability surfaces.

## Repetition Audit

### Largest repetition sources

1. **Family goal and celebration copy across Home, Motivation, and Child Workspace.** Home says the family is getting closer or ready to celebrate. Motivation says the family helped, got closer, and celebration/memory follows. Child Workspace repeats that the child’s help matters and moves the family closer.
2. **Motivation page internal repetition.** Header, family goal card, contribution chain, celebration surface, memory section, and individual goal cards all reinforce encouragement and progress.
3. **Child Workspace section repetition.** Hero, Family Goal, celebration card, and memories all explain contribution-to-celebration in similar language.
4. **Empty-state title + paragraph + action repetition.** Several surfaces say “Create your first X,” explain what X does, then say “Start with one X.”
5. **Mode and administration copy.** Family member pages repeat child/parent framing plus architecture disclaimers in age-context text and administration sections.

### What can be removed or merged

- Remove permanent “Contribution → Progress → Celebration → Memory” text from active Motivation states, or keep it only when no memory/celebration exists yet.
- Merge celebration status and detail into one line where possible.
- Remove anti-ranking/no-comparison explanations from child active states; the UI design itself can avoid rankings.
- Replace empty-state paragraphs with direct action lines.
- Remove widget-type labels from production user cards unless needed for diagnostics.
- Use one canonical term for personal goals across Motivation, Child Workspace, and Weekly Reset.

## Empty State Audit

### Home

Home empty states are concise but still explanatory. “Create your first family goal” plus “Family goals help everyone work toward something together” and “Create your first task” plus “Tasks help organize household responsibilities” define basic concepts. These can be shortened once the product has first-run setup and dedicated pages.

Recommended simplification: “No family goal yet. Add one.” and “No tasks yet. Add a task.”

### Tasks

The Tasks empty state explains what tasks do and provides a start link. The larger issue is the surrounding template/reset/Someday copy, which means the page can contain several instructional panels even before task groups are considered.

Recommended simplification: Keep the primary task empty state action-first. Consider making templates and reset guidance collapsible or less explanatory in normal use.

### Lists

Lists empty state explains that lists remember shopping, packing, and household items. This is helpful on first use but unnecessary for a household app once the list name and add-item field are present.

Recommended simplification: “No items yet. Add one item.”

### Motivation

Motivation has the most verbose empty state because it explains family goals, shared targets, and task-driven progress. It is helpful for setup but too dense for repeat exposure.

Recommended simplification: “No family goal yet. Create one shared goal.” Put examples in the form placeholder or a help affordance.

### Child Workspace

Child empty states are friendly, but some wording may confuse younger children: “No child-owned tasks are active right now,” “No personal goals are active,” and “A grown-up can add a goal on the Motivation page” expose ownership/product concepts.

Recommended simplification: “Nothing for you right now.” and “A grown-up can add a goal.”

### Weekly Reset

Weekly Reset empty states are mostly useful because the page is a review workflow. However, “review candidates,” “no-date,” “duplicate-looking,” and “active child goals to confirm” make the workflow feel like system maintenance.

Recommended simplification: Use human categories: “No tasks need a decision,” “No goals need checking,” “No shopping cleanup this week.”

## Child Readability Audit

### Likely understandable for a 6-year-old

- “This is me.”
- “What should I do today?”
- “For today.”
- “Ready now!”
- “Getting closer.”
- “We did it together.”
- Task titles, if parents write them simply.

### Child comprehension risks

- **Abstract labels:** “My contribution,” “Contribution,” “Progress I am making,” “Family contribution story,” and “Helpful Moments” may require adult explanation.
- **Long sentences:** “My help mattered. My family noticed. My contribution helped the family get closer — no teams, ranks, or comparisons.” contains multiple ideas and a negative-product-policy clause.
- **Product concepts:** “child-owned tasks,” “active,” “Motivation page,” “personal goals,” “family goal participation,” and “celebration memories” are not naturally child vocabulary.
- **Metaphorical status copy:** “Your tasks are resting right now” and “Family goal is resting right now” are gentle but may obscure whether something is broken, missing, or unavailable.
- **Repeated encouragement:** Many sections say the same positive idea. For young children, repetition can become noise rather than clarity.

Recommendation: Child-facing copy should be concrete, short, and action/state oriented. Favor “You have 2 things today,” “No jobs right now,” “3 more to movie night,” and “You helped!” over abstract contribution language.

## Parent Cognitive Load Audit

### Home

Home is relatively action-oriented, but it still contains card-level metadata, contextual notes, empty-state explanations, owner/due-date details, progress details, and celebration copy. The reading burden increases when several cards simultaneously show explanatory empty states.

Largest Home burden: repeated family goal explanation in the Motivation card plus task/list contextual notes.

### Motivation

Parents must parse page purpose, family goal state, contribution story, celebration status, memories, Helpful Moments, personal goals, and forms. The core action — decide whether the goal still matters or add/edit one — is surrounded by motivational framing.

Largest Motivation burden: philosophy and state are mixed together. Parents need quick status and controls; children need simple progress. The current copy tries to serve both at once.

### Tasks

The primary form is straightforward. Cognitive load comes from stacking task templates, Weekly Household Reset, Someday, task groups, ownership, recurrence, and review actions on one page. Copy such as “Reusable task templates,” “Still part of the plan?”, “Parent review,” and “Long-term ideas and aspirations” adds interpretation work.

Largest Tasks burden: maintenance concepts compete with immediate task execution.

### Weekly Reset

Weekly Reset is intended to reduce maintenance cost, but its current copy still requires parents to interpret system categories. “Review candidates,” “stale no-date,” “someday items,” and “duplicate-looking lists” are maintenance terms rather than household terms.

Largest Weekly Reset burden: system-generated review language instead of plain decisions.

## UI Noise Audit

Highest-value removable or reducible text:

1. **Visible widget type labels** such as “Agenda Widget,” “Shopping List Widget,” and “Placeholder Widget.” These are development-era labels and do not help household users.
2. **Motivation contribution-chain text** in active states. It explains the product model rather than supporting immediate action.
3. **Repeated no-ranking clauses** in child-facing copy. The UI should simply avoid ranking; children do not need to read that rankings are absent.
4. **Feature-definition paragraphs in empty states** after first-run. They occupy space but provide little repeat value.
5. **Family member architecture disclaimers** in normal profile/member views. The distinction between household entities and login identities is internal unless the user is making an account/security decision.
6. **Weekly Reset explanatory subtitles** in every card. Once users know the ritual, headings and actions are enough.
7. **Celebration memory explanatory paragraphs** that restate why celebration happened. The memory title/date/description can carry the meaning.

## Information Density Audit

### Home

Home is better than earlier dashboard versions because it is summary-first, but it still relies on reading for Motivation, task ownership/due dates, list context, and empty states. Recognition could improve if cards used shorter state labels and more consistent visual hierarchy.

### Motivation

Motivation is text-heavy. It relies heavily on narrative copy to communicate encouragement, contribution, celebration, and memory. The page would benefit from fewer permanent paragraphs and stronger state/action hierarchy: active goal, remaining progress, celebration status, recent appreciation, personal goals.

### Child Workspace

Child Workspace is structurally strong but text-dense. For younger children, each card should communicate one idea. Current sections often combine identity, progress, family contribution, celebration, memories, and meta-explanation. Visual progress exists, but text still does too much of the work.

### Weekly Reset

Weekly Reset is dense because it is a maintenance workflow with several domains on one page. The page would benefit from concise card labels, counts, and decisions rather than explanatory descriptions. It should feel like a checklist, not a product walkthrough.

## Design System Copy Risks

### Critical

- **Child-facing abstraction risk:** Child Workspace uses terms and sentence structures that may be too abstract for younger children, especially around contribution, ownership, active state, and Motivation-page references.
- **Motivation narrative overload:** The Motivation system repeats the same explanatory model across multiple surfaces, increasing cognitive load and making the page harder to scan.

### Major

- **Inconsistent terminology:** Individual goal, personal goal, child goal, family goal, Helpful Moments, contribution story, and memories overlap without a clear copy hierarchy.
- **Development-era labels exposed:** Widget labels, mode labels, review candidates, no-date tasks, EventSeries, and architecture disclaimers make parts of the product feel unfinished or internal.
- **Empty-state repetition:** Many empty states define obvious features rather than minimizing effort and leading directly to action.
- **Maintenance workflow vocabulary:** Weekly Reset and Tasks review language may make the product feel like a system to administer rather than household help.

### Minor

- **Warm tone overuse:** Friendly phrasing such as “resting,” “grown-up,” “helpful,” and “encouraging” is appropriate in moderation but can become vague when overused.
- **Button/title redundancy:** Several cards use a title, paragraph, and action that all communicate the same thing.
- **Long status messages:** Some success/error/status text could be shorter without losing meaning.

## Recommended First Copy Cleanup Slice

**Slice: Simplify Motivation and Child Workspace family-goal/celebration copy.**

Scope:

- No visual redesign.
- No new features.
- Keep existing data and workflows.
- Replace repeated explanatory paragraphs with short state-first messages.
- Standardize terminology: use “Family goal” and “Personal goal” consistently; avoid “individual goal” in visible copy.
- Remove or hide product-philosophy copy such as “no teams, ranks, or comparisons” from permanent child-facing UI.
- Shorten child empty states and avoid “child-owned,” “active,” and “Motivation page” where possible.
- Reduce celebration/memory explanations to title + concise status + optional user-provided description.

Why this is the best first slice:

- It targets the highest-copy, highest-emotion surfaces.
- It reduces reading effort for both parents and children.
- It does not require layout changes or new behavior.
- It improves consistency across Home, Motivation, and Child Workspace.
- It preserves the product intent while removing development-era explanation.

Success criteria for the slice:

- A child can understand the main Child Workspace state from headings and one-line messages.
- A parent can scan Motivation in under a few seconds and identify the active goal, remaining progress, celebration status, and personal goals.
- The same contribution/celebration idea is not explained more than once per page.
- Empty states lead to one clear action without defining the whole feature.

## Next Prompt Context

HomeOps needs a copy cleanup implementation slice, not a redesign. The recommended next prompt should ask for a targeted static copy simplification of Motivation and Child Workspace only. It should preserve existing components, data contracts, tests, styling, and workflows while reducing repeated explanatory copy.

Suggested prompt:

> Implement the first copy cleanup slice for HomeOps. Focus only on Motivation and Child Workspace / Family Member child-facing copy. Do not redesign visuals or change behavior. Shorten repeated family-goal, contribution, celebration, memory, and empty-state copy. Standardize visible terminology to “Family goal” and “Personal goal.” Remove permanent no-ranking/product-philosophy explanations from child-facing UI. Keep copy concrete, state-first, and readable for a 6-year-old. Update tests only if existing assertions depend on changed text. Update current-state and the current phase roadmap if this is treated as implementation work.
