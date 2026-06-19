# HomeOps Product Surface Analysis

## Summary
HomeOps should prioritize the household glassboard replacement experience before expanding into lower-value integrations. The strongest near-term product surface is a calm, glanceable Home dashboard that keeps Agenda and Lists always visible, with deeper Agenda and Lists experiences reachable for focused management.

The major product risk is not technical readiness; it is committing implementation effort before the product vocabulary and surface boundaries are clear. In particular, a sensor-centric House page risks solving the wrong problem if users are really trying to answer household state questions such as "Is anything wrong?", "What needs attention?", and "What is happening at home?"

Recommended direction:

1. Define Home as the primary glassboard surface.
2. Treat Agenda and Lists as first-class domains with dashboard summaries plus focused management surfaces.
3. Defer Chores until ownership, cadence, completion, and family workflow decisions are made.
4. Defer Gamification until chore behavior and reward philosophy are settled.
5. Reframe House/Sensors as House Status or Household Status, not as a sensor inventory page.
6. Keep Media low priority unless it becomes part of the daily household board.

## Home Analysis

### What belongs on Home
Home should answer the daily household questions without requiring navigation:

- What is happening today and soon?
- What do we need to remember?
- What needs to be bought, packed, prepared, or done?
- Is there anything important requiring attention?

Home should include:

- A prominent agenda summary for today, tomorrow, and the near future.
- A compact upcoming list of important calendar events.
- The highest-priority household lists, especially shopping and glassboard-style reminder lists.
- A small attention area for urgent or exceptional items.
- Optional lightweight household status only when it is actionable or abnormal.

Home should not become a full management workspace. It should provide overview and quick capture, then route deeper editing to Agenda or Lists when necessary.

### What should not belong on Home
Home should avoid:

- Full sensor dashboards.
- Detailed media/TV browsing.
- Deep settings and source configuration.
- Long historical data.
- Complete chore administration.
- Dense multi-month calendar management.
- All available widgets simply because the framework supports them.

The risk is that a widget-driven layout could encourage Home to become a dumping ground. Home needs product rules that decide what earns always-visible space.

### What information should always be visible
Always-visible Home information should be limited to household coordination essentials:

- Today agenda.
- Next few upcoming events.
- Active shopping/list reminders.
- High-priority notes or tasks that replace the physical glassboard.
- Exceptional status alerts if present.

The key constraint is glanceability. The glassboard replacement target implies the user should not need to interpret a complex dashboard to know what matters today.

### What information should be secondary
Secondary Home information can appear lower on the page, behind expansion, or in dedicated pages:

- Full week/month calendar browsing.
- Completed list items.
- List management and list creation.
- Chore history.
- Gamification progress detail.
- Sensor details, trends, and individual device readings.
- Media information.

### Main Home risk
Home is currently at risk of being defined by available widgets rather than user intent. Before additional implementation, Home needs a product definition such as: "the shared household glassboard for today, soon, and needs attention."

## House Status Analysis

### Naming direction
"House Status" or "Household Status" is a better conceptual direction than "Sensors".

"Sensors" describes implementation input. Users are more likely trying to understand state:

- Is the house okay?
- Is anything open, low, too hot, too cold, offline, or needing attention?
- What changed recently?
- Is there anything I should act on?

"House" is acceptable as a top-level navigation label, but the page content should probably be framed as status, not devices. "Home Status" is potentially confusing because Home already means the main dashboard.

Recommended vocabulary:

- Top-level page: House.
- Page concept: House Status.
- Widget/section examples: Attention, Climate, Open/Closed, Devices, Recent Changes.

### What users are actually trying to see
Likely user goals are:

- Current exceptions: open door/window, leak, low battery, unavailable device, temperature problem.
- Comfort summary: temperature, humidity, maybe air quality.
- Presence or occupancy only if intentionally supported and privacy expectations are clear.
- Device health only when it explains why the status may be incomplete.
- Recent changes only when useful for trust and troubleshooting.

Users are unlikely to want a raw sensor list as the primary view unless they are configuring or debugging the system.

### Sensor-centric abstraction risk
A sensor-centric page is probably the wrong first abstraction. It creates several risks:

- It exposes source mechanics instead of household meaning.
- It encourages implementation around device types instead of user questions.
- It may over-prioritize low-value telemetry because data exists.
- It can become noisy quickly.
- It can conflict with Home if alerts are split between two places.

The first House Status slice should probably define status categories and attention rules before implementing sensor ingestion.

## Agenda Analysis

### Completeness assessment
Agenda appears directionally strong enough as a core surface. It already has a HomeOps-owned calendar source, normalized event output, source/layer concepts, editing workflows, portability direction, recurrence runtime foundations, and read-only source patterns.

However, product completeness is not the same as implementation completeness. The remaining Agenda gaps are mostly UX and policy decisions.

### Major UX gaps
Key gaps before continued Agenda expansion:

- The difference between dashboard agenda, focused Agenda page, and event editing needs to be explicit.
- Recurrence runtime exists, but recurrence editing UX and occurrence-level decisions remain product-sensitive.
- The product needs a clear rule for what appears on Home versus only in Agenda.
- Source visibility may be too technical if presented as "layers" without household-friendly labels.
- The Agenda needs empty, overloaded, conflict, and error states designed around a wall-display context.
- If Google Calendar read-only integration proceeds, the UI must communicate what is editable and what is display-only.
- Notification/reminder expectations need to be explicitly deferred or defined.

### Premature areas
Implementation would be premature for:

- Two-way Google Calendar sync.
- Advanced recurrence editing.
- Notification/reminder systems.
- Complex source management UI.
- Dedicated calendar administration beyond the household's immediate needs.

## Lists Analysis

### Completeness assessment
Lists are directionally strong and high-value. The generic persisted Lists domain fits the product better than a widget-specific shopping list. Shopping as one seeded example list is the right abstraction.

Still, the Lists product surface is not complete enough to keep implementing blindly. The current domain supports basic persistence and item interactions, but the product needs decisions about list types and household workflows.

### Major UX gaps
Major gaps include:

- Whether Lists is a single page containing all lists or multiple specialized list experiences.
- Which list types are first-class: shopping, packing, reminders, errands, recurring household checks, gift ideas, meal planning, or general notes.
- Whether Home shows one selected list, multiple pinned lists, or only urgent list items.
- How quick capture should work from the Home dashboard.
- Whether completed items are hidden, archived, grouped, or recoverable.
- Whether list item ordering, categories, quantities, notes, due dates, or assignment are needed.
- Whether "glassboard lists" are different from durable long-lived lists.

### Premature areas
Implementation would be premature for:

- Complex shopping-specific features before deciding if generic lists remain enough.
- Sharing/account semantics.
- Offline-first list synchronization.
- Advanced list item metadata without concrete household use cases.

## Chores Analysis

### Likely chore concepts
Chores likely need concepts beyond generic lists:

- Chore definition: the reusable thing that needs doing.
- Assignment: person, rotating owner, shared ownership, or unassigned household task.
- Schedule/cadence: daily, weekly, monthly, specific weekdays, ad hoc, seasonal.
- Due window: when it should be done and when it becomes overdue.
- Completion record: who did it, when, and whether it counts for streaks/rewards.
- Skips/excuses: vacation, illness, not needed today.
- Rotation rules: fair distribution and next assignee logic.
- Visibility: what appears on Home versus a Chores page.
- Parent approval: whether completion is trusted or needs confirmation.
- Relationship to Agenda: whether chores generate calendar-like occurrences.
- Relationship to Lists: whether chore checklists are reusable task steps.

### What should be solved before implementation
Before implementation, decide:

- Are chores for adults, children, or both?
- Is the primary goal remembering, fairness, motivation, accountability, or rewards?
- Are chores date-based, person-based, room-based, or routine-based?
- Should chores appear in Agenda, Home, a dedicated Chores page, or all three?
- Is completion a simple checkbox or an auditable event?
- Are skipped chores allowed?
- Are recurring chores generated like calendar occurrences or stored as separate task instances?
- How much gamification coupling is allowed?

### Main Chores risk
The largest risk is implementing chores as either generic lists or calendar events too early. Chores overlap both, but they likely need their own domain because recurrence, assignment, completion, and rewards have different semantics from lists and agenda events.

## Gamification Analysis

### Decisions required before implementation
Gamification should not begin until these decisions are made:

- Who participates: children, adults, household, guests, or profiles not yet implemented.
- What behavior is rewarded: chore completion, streaks, helping, consistency, initiative, list completion, agenda preparation.
- Reward units: points, stars, coins, badges, levels, privileges, allowance, or non-material recognition.
- Time horizon: daily, weekly, monthly, seasonal.
- Fairness model: equal points, age-adjusted points, difficulty-adjusted points, rotating opportunities.
- Anti-gaming rules: duplicate completions, trivial tasks, parent approval, missed tasks.
- Reset/archive behavior.
- Whether gamification is visible on Home.
- Whether it is motivational or merely reporting.

### Architectural risks
Architectural risks include:

- Coupling points directly into chores, lists, or events instead of recording rewardable actions through a stable abstraction.
- Adding profiles/authentication implicitly before the product has decided identity scope.
- Making gamification depend on widget-specific state.
- Failing to distinguish current score projections from immutable earning history.
- Designing around children only when household adults may also use chores.

### Product risks
Product risks include:

- Gamification may create pressure or conflict if fairness rules are unclear.
- Points can become meaningless if not tied to household expectations.
- Rewards may undermine intrinsic motivation for chores.
- Competitive leaderboards may be inappropriate for family dynamics.
- The feature may require parent controls, approval, and correction workflows that are larger than expected.

### Premature areas
Implementation would be premature for:

- Points tables.
- Badges.
- Leaderboards.
- Reward stores.
- Streaks.
- Child profiles.

Gamification should follow a Chores product decision slice, not precede it.

## Product Priority Ranking

1. **Home** — Highest value because it is the primary glassboard replacement and the place where household coordination must be immediately visible.
2. **Agenda** — Highest practical value after Home because agenda is explicitly part of the replacement target and is already a mature direction.
3. **Lists** — Highest practical value alongside Agenda because lists are part of the glassboard replacement and currently map to everyday household needs.
4. **Chores** — Important future value, but requires more product decisions before implementation.
5. **Gamification** — Potentially valuable, especially if chores target children or motivation, but premature until chores and identity/approval rules exist.
6. **House Status** — Useful but lower priority because sensors/status are explicitly less important and should not distract from glassboard replacement.
7. **Media** — Lowest priority unless a concrete household daily-use scenario emerges.

## Risks

- Home may become a generic widget container instead of a curated glassboard surface.
- House may be implemented as Sensors, exposing raw telemetry instead of user-meaningful status.
- Agenda work may drift into advanced calendar product complexity before dashboard and basic household workflows are polished.
- Lists may become shopping-specific again without a decision about list types and Home pinning.
- Chores may be prematurely modeled as lists or events despite needing assignment, recurrence, and completion semantics.
- Gamification may force identity, profiles, approval, and fairness decisions before the product is ready.
- Google Calendar integration may consume effort while the current user priorities are local Home, Agenda, and Lists.
- Media may use architecture capacity without contributing much glassboard value.

## Open Questions

### Home
- What exact information should be visible when the app first opens?
- Is Home optimized for a wall/tablet display, phone, desktop, or all of them?
- Should Home support quick capture for events and list items?
- How many widgets can appear before Home stops being glanceable?
- Which lists are pinned to Home, and who decides?

### House Status
- Is the page called House, House Status, or Household Status in the UI?
- What statuses are actionable enough to show on Home?
- Are sensors only data inputs, or does the product need manual status too?
- Should device health be visible to normal household users?

### Agenda
- What is the intended default view for the dedicated Agenda surface?
- How should read-only sources be explained?
- What recurrence editing interactions are required for V1?
- Are reminders/notifications intentionally out of scope?

### Lists
- Are lists generic forever, or are shopping/packing/reminders specializations expected?
- Do list items need quantity, owner, due date, category, note, or ordering?
- How should completed items behave?
- Should Home show full lists or only selected active items?

### Chores
- Who are chores for?
- Are chores assigned, rotated, or communal?
- Are chores calendar-like occurrences or task-like obligations?
- Is completion trusted or approved?

### Gamification
- What behavior should be rewarded?
- Does gamification require profiles?
- Should rewards be competitive, cooperative, or individual?
- Who can correct points or undo completions?

## Recommended Next Slice
Recommended next slice: **Home Product Definition and Glassboard UX Spec**.

This should be an analysis/design slice, not implementation. It should define:

- Home's purpose statement.
- Required always-visible sections.
- Secondary sections.
- Rules for what can appear on Home.
- Home versus Agenda versus Lists boundaries.
- Quick-capture expectations.
- Wall-display responsiveness/accessibility expectations.
- Initial empty/loading/error states for the glassboard experience.

Only after that should implementation continue, likely by tightening Home around existing Agenda and Lists capabilities rather than adding new domains.

## Next Prompt Context
Use this context for the next prompt:

> HomeOps product analysis concluded that the next slice should not implement new integrations or domains. The highest-value direction is to define Home as the primary household glassboard surface, with Agenda and Lists as always-visible core content and deeper management available in dedicated surfaces. House should be framed as House Status rather than Sensors, and Chores/Gamification should wait for explicit product decisions around assignment, recurrence, completion, identity, fairness, and rewards. Proceed with a Home Product Definition and Glassboard UX Spec analysis/design slice only; do not implement code, migrations, tests, sensors, media, chores, gamification, or Google Calendar changes.
