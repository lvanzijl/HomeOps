# FamilyBoard Agenda Strategic UX Research Analysis

Date: 2026-07-03  
Branch: `work`  
Scope: Strategic product UX analysis only. No implementation changes.

## Executive Summary

The ideal long-term Agenda information architecture should be **one permanent default operating mode with one contextual planning mode**, not three equal permanent calendar modes and not a permanent side-by-side planning console.

The core first-principles answer is that a family most often opens Agenda to answer: **"What does our family need to know next?"** That question is operational, shared, time-sensitive, and often answered under distraction. It is best served by a Planning experience organized around Today, Next, Tomorrow, This week, and Soon.

Month remains strategically important, but it should be understood as a **contextual planning workspace**, not as an always-equal peer to the daily operating surface. Month answers a different, episodic question: **"Where can something new fit?"** That question deserves strong access and a dedicated bounded workflow, but not default dominance and not permanent simultaneous display.

Week should disappear permanently as a first-class Agenda mode. It does not own a unique, high-frequency family workflow. It partially answers near-term load, but Planning can answer that faster. It partially answers date availability, but Month can answer that better. In a viewport-first dashboard product, a mode that is neither the fastest daily answer nor the strongest planning answer is architectural clutter.

Final recommendation:

- **Permanent default:** Planning / Today / Upcoming.
- **Contextual planning mode:** Month, launched when planning, date-picking, browsing days, or finding availability.
- **Removed permanent mode:** Week.
- **Avoid:** permanent Planning + Month split view.
- **Product principle:** Agenda should primarily answer **"What does our family need to know next?"** and secondarily expose planning as a contextual workflow for **"Where can this fit?"**

## First-Principles Workflow Analysis

### Why does a family open Agenda?

Ignoring the current implementation, a family opens Agenda because time creates coordination risk. The Agenda is not primarily a calendar database viewer; it is a household coordination surface. The most common intentions rank as follows.

| Rank | Intention | Primary household question | Frequency | Urgency | Best architectural treatment |
| ---: | --- | --- | --- | --- | --- |
| 1 | Checking today's schedule | What do we need to handle today? | Very high | High | Default Planning surface |
| 2 | Checking what comes next | What is the next commitment or transition? | Very high | High | Default Planning surface |
| 3 | Checking near-term upcoming events | What is coming soon that we should prepare for? | High | Medium-high | Default Planning surface |
| 4 | Checking this week's load | Is this week heavy, calm, or risky? | Medium-high | Medium | Planning summary, not necessarily Week grid |
| 5 | Planning a new appointment | Where should we put this? | Medium | Medium | Contextual Month planning workflow |
| 6 | Finding free time | Which days look open enough? | Medium | Medium | Contextual Month planning workflow, possibly aided by summaries |
| 7 | Checking birthdays and holidays | What special dates are coming? | Medium-low | Medium | Planning highlights and Month context |
| 8 | Looking up a specific date | What is happening on that date? | Low-medium | Low-medium | Date jump / contextual Month |
| 9 | Reviewing past events | What happened recently? | Low | Low | Secondary search/history affordance, not primary mode |

The highest-frequency cluster is **today + next + soon**. The planning cluster is **fit + free time + date context**. A weekly grid is not a separate first-principles cluster; it is a representation that tries to mediate between the two clusters.

### How many fundamentally different workflows exist?

There are **two durable workflows**, but only **one should be permanent on the primary page at rest**.

1. **Operational awareness workflow**
   - Used daily and repeatedly.
   - Shared by parents and children.
   - Usually short-session and interruption-prone.
   - Needs low cognitive load and strong hierarchy.
   - Answers today, next, soon, and this week's load at a summary level.

2. **Scheduling/planning workflow**
   - Used episodically, mostly by parents or during shared planning moments.
   - Needs spatial date context and day-density comparison.
   - Answers where a new appointment can fit, which days are busy, and what is on a chosen date.
   - Benefits from Month, date jump, selected-day detail, and maybe availability cues.

These workflows are different enough that Month should not be deleted as a capability. They are not equal enough that Month should be permanently co-primary with the operational surface.

## User Intent Analysis

### Checking what comes next

This is the canonical Agenda intent. It requires ordered, prioritized, plain-language information. A chronological Planning view is ideal because it can foreground the next event, reveal preparation context, and hide distant noise. Month and Week both force spatial scanning before answering the question.

### Planning a new appointment

This is a real but episodic workflow. It requires seeing candidate dates, day density, and selected-day detail. Month is valuable here because human planning often starts with date position: next Thursday, the first weekend, school break, or the week after a busy run. This supports Month as a contextual planning mode.

### Finding free time

Finding free time is not identical to planning a new appointment, but it uses the same spatial planning substrate. Families usually need to compare days, avoid obviously busy clusters, and inspect selected days. Month remains the best broad date-density map. Week can help if the search horizon is exactly seven days, but that is too narrow to justify a permanent mode.

### Checking birthdays and holidays

Birthdays and holidays are special-date awareness, not a full mode. They should appear as highlighted upcoming moments in Planning and as highlighted day metadata in Month. A separate Week view does not materially improve this workflow.

### Checking today's schedule

Today is operational, not spatial. Families need to know when to leave, what to prepare, who is affected, and what is next. Planning should handle this as the top priority. Month should not be the first thing a family parses to understand today.

### Checking this week's load

This is the strongest argument for Week, but the underlying need is **load awareness**, not necessarily a seven-column weekly workspace. A Planning surface can summarize the week with "busy days", "quiet days", and upcoming clusters. Month can show broader density if a parent wants spatial confirmation. Week therefore lacks a unique job.

## Workflow Architecture Evaluation

### Workflow grouping

| Workflow | Same as operational awareness? | Same as scheduling/planning? | Requires separate permanent interface? | Recommendation |
| --- | --- | --- | --- | --- |
| Checking what comes next | Yes | No | No | Core Planning content |
| Checking today's schedule | Yes | No | No | Core Planning content |
| Checking this week's load | Mostly | Partly | No | Planning summary with optional Month context |
| Checking birthdays/holidays | Mostly | Partly | No | Highlight in Planning and Month |
| Planning a new appointment | No | Yes | Not permanent; contextual | Month planning workflow |
| Finding free time | No | Yes | Not permanent; contextual | Month planning workflow |

### Architectural conclusion

Agenda should not be organized around visual calendar formats. It should be organized around household jobs:

- **Operating the household day:** permanent default.
- **Choosing or inspecting dates:** contextual planning workflow.

This leads to a **Planning-first Agenda with contextual Month planning**, not equal Month / Week / List tabs.

## Single vs Two Mode Analysis

### Two-mode investigation: Planning + Month

The proposed two-mode architecture is directionally correct if "mode" means two durable product jobs:

- **Planning / Today / Upcoming** for daily operation.
- **Month** for scheduling and availability planning.

They are fundamentally different in cognitive model:

- Planning is **temporal narrative**: now, next, soon.
- Month is **spatial date mapping**: this date, nearby days, busy/free patterns.

They are fundamentally different in session shape:

- Planning sessions are quick and repeated.
- Month sessions are intentional and episodic.

They are fundamentally different in audience:

- Planning is for parents, children, and shared household display.
- Month is mostly for adults, with occasional shared planning use.

Therefore, Month should remain a durable capability. The key distinction is that it should be **contextual and task-invoked**, not necessarily visible as an equal permanent tab at all times.

### Single-mode investigation: Planning only, Month contextual

A single permanent Planning experience can still satisfy long-term product quality if Month is reclassified from a permanent mode to a contextual planning tool. Examples of contextual architecture include:

- Planning surface with a clear "Plan a date" entry.
- Temporary calendar overlay for choosing or inspecting a date.
- Date picker that expands into a month-density calendar when availability matters.
- Planning workflow where Month appears only after the user expresses scheduling intent.
- Embedded month interaction inside a create/edit flow rather than as a standing top-level mode.

This approach is strongest philosophically because the primary page answers one household question at rest. It also protects viewport-first design: the default surface can reserve space for the information families need most often instead of permanently reserving pixels for a lower-frequency calendar grid.

The risk is discoverability. If Month becomes too hidden, parents may perceive that Agenda cannot plan ahead. The solution is not permanent Month visibility; it is making the planning entry obvious, named around the household job, and reachable from the moments where it is needed.

### Should Agenda have one permanent mode?

Yes, if "permanent mode" means the page's standing default architecture. The permanent mode should be **Planning / Today / Upcoming**.

### Should Agenda have two permanent modes?

No, not as equal always-present top-level modes. Agenda should have **one permanent operating mode** plus a **durable contextual Month workflow**. If product language requires calling Month a mode, then it should be a secondary mode, not a co-equal permanent default option.

## Side-by-Side Analysis

### Permanent split view

A permanent split between Planning and Month is tempting because it promises both now-awareness and date context. It is strategically weaker than it appears.

- **Cognitive load:** High. Users must decide whether to read the list, scan the grid, reconcile the selected day, or compare both.
- **Information density:** High, often too high for a family display.
- **Viewport efficiency:** Poor. Month needs meaningful cell area; Planning needs readable event rows. Splitting the viewport makes both worse on common laptops.
- **Usefulness:** Good for adult planning sessions, weak for routine household checking.
- **Family friendliness:** Mixed to poor. Children and hurried adults benefit from one obvious answer, not two synchronized panes.
- **Planning efficiency:** Good only when actively scheduling; wasteful otherwise.

### Permanent side-by-side layout

A permanent side-by-side layout should not be the default Agenda architecture. It makes a lower-frequency planning map compete with the high-frequency operational answer. It also increases the likelihood that implementation will rely on tiny month indicators, truncated event rows, internal scrolling, or visual compression that undermines comprehension.

### Linked synchronized views

Linked views can be useful during contextual planning: selecting a date in Month updates a day detail panel, or selecting an event in Planning reveals its date in Month. But synchronization should be scoped to planning sessions. Persistent linked views make everyday Agenda feel like calendar software instead of a household briefing.

### Dashboard plus planning panel

A dashboard plus planning panel is the best side-by-side variant if it is **temporary**: Planning remains the default dashboard, and a planning panel opens when scheduling. This preserves the one-question default while supporting efficient date selection when needed.

### Side-by-side conclusion

Planning and Month should **not** be permanently visible simultaneously. They may be temporarily visible together inside a focused planning workflow, but the default Agenda should not assume more information is better.

## Alternative Product Architectures

### Option A — Planning + Month as two permanent modes

**Architecture:** Default Planning with a permanent Month mode switch.

**Strengths:**

- Clear separation between daily operation and planning.
- Easy for parents to find Month.
- Removes Week while preserving a familiar calendar planning tool.

**Weaknesses:**

- Still frames Agenda as mode-switching software.
- Risks making Month feel equally important even though it is lower-frequency.
- May encourage preserving top-level tabs for format reasons rather than workflow reasons.

**Family-first fit:** Strong for parents, acceptable for children if Planning remains default.

**Verdict:** Good transitional architecture; not the most refined long-term architecture.

### Option B — Planning only; Month becomes contextual

**Architecture:** One permanent Planning surface. Month appears through scheduling, date jump, planning overlay, or selected planning workflow.

**Strengths:**

- Best alignment with one primary household question.
- Lowest default cognitive load.
- Strong viewport efficiency.
- Prevents calendar-format sprawl.
- Treats Month as a tool used when the family is actually planning.

**Weaknesses:**

- Requires excellent discoverability for planning ahead.
- Parents who expect a calendar tab may initially look for Month.
- Needs careful product language so "Planning" does not sound less capable than "Calendar".

**Family-first fit:** Strongest overall.

**Verdict:** Best long-term product architecture.

### Option C — Planning + Month simultaneously

**Architecture:** Default page shows a Planning feed and Month grid at the same time.

**Strengths:**

- Powerful for adult scheduling sessions.
- Reduces mode switching.
- Gives broad and near-term context together.

**Weaknesses:**

- High cognitive load.
- Poor viewport efficiency.
- Weak child friendliness.
- Risks making both Planning and Month too compressed.
- Violates the spirit of "one primary household question" at rest.

**Family-first fit:** Useful for some parent planning moments, weak for routine daily use.

**Verdict:** Do not use as permanent architecture. Consider only as temporary planning-workflow layout.

### Option D — Household briefing with planning workflow

**Architecture:** Agenda is a briefing surface centered on Today, Next, and Soon. Planning is an explicit workflow launched from the briefing, using Month/date tools as needed.

**Strengths:**

- Derived directly from household intent.
- Most differentiated from generic calendar apps.
- Scales from children to parents.
- Preserves Month value without letting it dominate the default surface.
- Best fit for FamilyBoard's dashboard philosophy.

**Weaknesses:**

- Requires strong content strategy and naming.
- If over-simplified, could under-serve power planning.
- Must avoid burying date lookup.

**Family-first fit:** Strongest.

**Verdict:** Ideal long-term architecture; effectively a mature version of Option B.

### Option E — Month-first wall calendar with Today rail

**Architecture:** Month grid remains primary, with a Today/Next rail alongside or below.

**Strengths:**

- Familiar to families who think in wall calendars.
- Good for seeing school breaks, birthdays, holidays, and broad month shape.
- Keeps planning visible.

**Weaknesses:**

- Worse for quick daily questions.
- Makes children parse a grid.
- Consumes significant viewport area.
- Treats an episodic planning representation as the daily default.

**Family-first fit:** Good for parent planning, weaker for household operation.

**Verdict:** Plausible for a dedicated wall-calendar product, but not ideal for FamilyBoard Agenda.

### Option F — Task-based calendar assistant

**Architecture:** Agenda has no explicit Month mode; users express intents such as "add appointment", "find a quiet day", or "what is next week like?" and the interface reveals the required planning aid.

**Strengths:**

- Very family-friendly if executed well.
- Avoids format-first modes entirely.
- Could optimize every workflow around intent.

**Weaknesses:**

- Risk of opacity: users may not know what is possible.
- Harder to build trust for date-sensitive planning.
- May feel too magical or constrained for parents who want direct control.

**Family-first fit:** Potentially high, but risky.

**Verdict:** Interesting long-term direction, but Agenda should first stabilize around Planning plus contextual Month.

## Family-First Evaluation

| Option | Parents | Children | Shared household planning | Daily use | Planning appointments | Scheduling around busy days | Finding free time | Cognitive load |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A: Planning + Month permanent | Strong | Good if Planning default | Strong | Strong | Strong | Strong | Strong | Medium |
| B: Planning only, Month contextual | Strong | Strongest | Strong if planning entry is obvious | Strongest | Strong | Strong | Strong | Lowest |
| C: Planning + Month simultaneous | Mixed; powerful but dense | Weak | Mixed | Medium | Strong | Strong | Strong | High |
| D: Household briefing + planning workflow | Strongest | Strongest | Strongest | Strongest | Strong | Strong | Strong | Low |
| E: Month-first + Today rail | Good | Medium-low | Medium | Medium | Strong | Strong | Strong | Medium-high |
| F: Intent assistant | Medium-high if clear | High | Medium-high | High | Medium-high | Medium-high | Medium-high | Low to uncertain |

### Parents

Parents need both operational confidence and planning power. They benefit from Planning by default because it lowers daily load, but they must retain quick access to a trustworthy Month workflow when scheduling. Parents do not need Week as a permanent representation if weekly load is summarized well.

### Children

Children benefit from direct, concrete information: today, next, later, and special events. Month can be engaging but is less reliable for comprehension. Week is especially weak for children because it asks them to scan multiple days and infer relevance.

### Shared household planning

Shared planning works best when the household first sees the operational story, then intentionally opens date planning if needed. Permanent side-by-side designs make shared planning feel more complex than necessary.

### Daily use

Daily use strongly favors Planning. The default should not ask families to choose a view before answering the daily question.

### Planning appointments and finding free time

These workflows justify Month, but only as a planning tool. Month should be optimized for date availability, busy/free density, selected-day inspection, and date selection. It does not need to be visible during routine daily checks.

### Reducing cognitive load

The most effective cognitive-load reduction is architectural: one standing question, one default reading path, and contextual tools only when the family enters a different job.

## One-Primary-Question Evaluation

FamilyBoard's design philosophy says each primary page should answer one primary household question. Agenda should answer:

> **What does our family need to know next?**

This is broader and more useful than "What is on the calendar?" It includes today, next, preparation, special dates, and near-term awareness. It is also accessible to children and adults.

Planning is a second household question:

> **Where can this fit?**

That second question is real, but it is not the default state of the Agenda page. It should receive a strong contextual workflow rather than becoming a second permanent visual center. A product can honor a secondary question without making the primary page answer two questions at once.

Therefore:

- Agenda's primary page question should be **"What does our family need to know next?"**
- Month planning should be treated as the secondary contextual question **"Where can this fit?"**
- Week does not define a separate household question; it is a representation of a time range.

## Final Recommendation

### Should Agenda have one permanent mode?

**Yes.** The long-term Agenda should have one permanent default operating mode: **Planning / Today / Upcoming**.

### Should Agenda have two permanent modes?

**Not as equal permanent modes.** It should have one permanent mode plus one durable contextual planning workflow. If implementation or navigation language calls Month a mode, it should be clearly secondary and task-invoked.

### Should Month remain permanently visible?

**No.** Month should not be permanently visible in the default Agenda state. It consumes too much attention and viewport area for a lower-frequency workflow.

### Should Month become contextual?

**Yes.** Month should become contextual: available when planning, choosing a date, finding availability, browsing a specific date, or inspecting busy/free distribution.

### Should Planning and Month ever be visible simultaneously?

**Yes, but only temporarily inside a focused planning workflow.** They should not be permanently visible simultaneously. Temporary combination can be useful when selecting a date while preserving the Planning context.

### Should Week disappear permanently?

**Yes.** Week should disappear permanently as a first-class Agenda mode. Its valuable jobs should be absorbed by Planning summaries and contextual Month planning.

### What is the ideal long-term information architecture?

The ideal long-term Agenda architecture is:

1. **Agenda home = Planning briefing**
   - Today.
   - Next up.
   - Tomorrow.
   - Soon / later this week.
   - Special upcoming dates.
   - Lightweight weekly-load cues.

2. **Contextual planning workflow = Month/date planning**
   - Launched from scheduling, date lookup, or planning actions.
   - Month-density overview.
   - Selected-day details.
   - Date selection and busy/free comparison.
   - Temporary relationship to Planning when helpful.

3. **No permanent Week mode**
   - Weekly load appears as a summary, not a separate workspace.
   - If future validation reveals a unique weekly ritual, it should be designed as a workflow, not restored as a generic Week tab.

4. **No permanent split view**
   - The default page remains one-question, low-density, viewport-first.
   - Side-by-side Planning + Month is reserved for active planning moments only.

## Risks and Trade-offs

- **Discoverability risk:** If Month is contextual, parents must still immediately understand how to plan ahead. Mitigation: use job-based entry labels such as planning a date, choosing a day, or finding room.
- **Expectation risk:** Calendar users may expect a Month tab. Mitigation: preserve a clear Month/date planning entry without making it default.
- **Power-user risk:** Some parents may like a Week view. Mitigation: satisfy the underlying weekly-load need in Planning summaries; only revisit Week if real household validation shows an unmet unique workflow.
- **Over-simplification risk:** Planning-only can become too shallow if it hides dates, special events, or future commitments. Mitigation: Planning must include strong upcoming and special-date treatment.
- **Viewport risk:** Contextual Month still needs viewport-first constraints when opened. Mitigation: treat Month as a bounded planning canvas, not an unbounded document calendar.
- **Terminology risk:** "Planning" could mean scheduling to adults but daily briefing to children. Mitigation: use household language around today, next, and plan-a-date actions.

## Validation Performed

This was an analysis-only task. No implementation, build, test, Playwright, export, .NET, or npm validation was required or run.

Performed validation:

- Read repository instructions in `AGENTS.md` and `.github/copilot-instructions.md`.
- Inspected current Agenda strategic, viewport, and workspace reports.
- Inspected current Agenda component references at a static level to confirm the existing mode vocabulary and architecture context.
- Ran `git status --porcelain=v1` before and after the report work to verify the changeset remained documentation-only.
- Ran `git diff --check` to verify the markdown report introduced no whitespace errors.
- Ran file-type and status checks to confirm no binary files were added.

## Files Inspected

- `AGENTS.md`
- `.github/copilot-instructions.md`
- `docs/reports/2026-07-03-work/agenda-strategic-ux-research-analysis.md`
- `docs/reports/2026-07-02-work/agenda-viewport-fit-analysis.md`
- `docs/reports/2026-06-27-agenda-ux-review/agenda-ux-review.md`
- `docs/reports/2026-06-27-agenda-month-master-detail/agenda-month-master-detail.md`
- `docs/reports/2026-06-27-agenda-week-workspace/agenda-week-workspace.md`
- `docs/reports/2026-06-27-agenda-list-workspace/agenda-list-workspace.md`
- `docs/roadmap/phase-2.md`
- `docs/state/current-state.md`
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.tsx`
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.test.tsx`

## Confirmation That No Implementation Changes Were Made

Confirmed. This task changed only this strategic UX research report under `docs/reports/2026-07-03-work/`. No frontend source, backend source, tests, styles, API contracts, database migrations, roadmap files, or state files were modified.

## Confirmation That No Binary Files Were Added

Confirmed. No screenshots, videos, exported artifacts, generated browser artifacts, or other binary files were added by this task.
