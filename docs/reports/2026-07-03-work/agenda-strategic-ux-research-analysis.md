# FamilyBoard Agenda Strategic UX Research Analysis

Date: 2026-07-03  
Branch: `work`  
Scope: Strategic product UX analysis only. No implementation changes.

## Executive Summary

The Agenda page should not treat Month, Week, and List as three equally important permanent workspaces. From first principles, a family most often opens Agenda to answer an operational question: **what does our household need to know next?** That question is answered fastest by a Today / Upcoming list, not by a month grid or a week grid.

The current three-view model overweights planning formats inherited from productivity calendars. Families need glanceable shared coordination more than calendar administration. Month remains valuable as a secondary planning and free-time discovery mode. List is the strongest default household agenda because it reduces scanning effort, supports children and parents, and naturally emphasizes today, tomorrow, and the next few commitments. Week is the weakest candidate: it duplicates much of List's near-term planning role while adding more cognitive load and less clarity when events are unevenly distributed.

**Recommendation:** move toward a two-mode Agenda information architecture:

- **Default:** Today / Upcoming list, evolved from the current List view.
- **Secondary:** Month planning mode with selected-day detail.
- **Remove:** Week as a permanent primary view unless a future validated use case proves a weekly schedule grid is essential.
- **Do not preserve:** the current equal Month / Week / List model.

This recommendation optimizes for long-term product quality, household comprehension, and quick daily use rather than implementation effort.

## First-Principles User Intent Analysis

Ignoring the current implementation, a family opens Agenda because household time is shared, interruptible, and often checked under time pressure. The most common intentions are not symmetrical.

| Rank | Family intention | Estimated relative importance | Why it matters |
| --- | --- | ---: | --- |
| 1 | What do we need to do today? | 28% | Morning, after-school, dinner-time, and bedtime planning depend on immediate commitments. |
| 2 | What happens next? | 22% | Families often need the next appointment, pickup, activity, birthday, or holiday without parsing a grid. |
| 3 | Is this week busy? | 16% | Parents need a workload sense for logistics, but not necessarily a full weekly grid. |
| 4 | Where is there room for a new appointment? | 12% | Scheduling new appointments needs broader planning, usually across days or weeks. |
| 5 | What holidays, birthdays, or special events are coming? | 8% | Important for family anticipation, but less frequent than day-to-day coordination. |
| 6 | What happened yesterday or recently? | 5% | Useful for memory, follow-up, and missed context, but not a primary operating mode. |
| 7 | Who is affected by upcoming commitments? | 5% | Ownership matters for coordination; it should enrich the primary view rather than define a separate view. |
| 8 | Is a specific date available? | 4% | Date lookup is important, but episodic rather than daily. |

### Key inference

The dominant cluster is **today + next + near-term load**. That cluster is better served by a chronological household feed than by equal switching among Month, Week, and List.

## Usage Frequency Assessment

| View / mode | Likely frequency | Typical session length | Best user type | Strategic role |
| --- | --- | --- | --- | --- |
| Today / Upcoming list | Daily, multiple times per day | Very short | Parents and children | Default operating surface |
| Month planning | Weekly or when scheduling | Medium | Mostly parents, sometimes shared household | Secondary planning surface |
| Week grid | Occasional, if preserved | Medium | Mostly parents | Weak / redundant planning surface |
| Historical list | Rare | Short | Parents | Filter or secondary affordance, not a primary view |

The Agenda should bias its hierarchy toward the highest-frequency use, not toward equal access to every calendar representation.

## Month View Evaluation

### Primary purpose

Month is a planning and spatial awareness tool. It answers: **where does this date sit, and how full is the broader month?**

### Strengths

- Excellent for appointment planning, vacation planning, birthdays, holidays, and school calendar context.
- Supports date selection and broad free-time discovery better than a list.
- Gives parents confidence when choosing a future date.
- The current master-detail pattern lets a selected date reveal details without leaving the month context.

### Weaknesses

- Poor default for daily operation because the user must locate today, then interpret compact event indicators.
- Compresses event meaning; titles and logistics are hidden until selection.
- Children are less likely to extract useful next-step information from a month grid.
- Sparse months feel empty; busy months become visually dense.

### Frequency of use

Medium. Important, but episodic: planning sessions, date lookup, holidays, appointments, and family discussions.

### Cognitive load

Medium to high. Users must map a grid, scan dates, infer density from indicators, and open a day for details.

### Family friendliness

Moderate. Month is familiar, but not the most conversational or child-friendly representation.

### Suitability as default landing page

Weak. Month optimizes for planning, not daily household operation.

## Week View Evaluation

### Primary purpose

Week is intended to show the next seven-day schedule and relative distribution across days.

### Strengths

- Can show whether the current week is overloaded.
- Can help parents reason about logistics such as school nights, sports, and appointments.
- Provides a bounded horizon that is less broad than Month and more spatial than List.

### Weaknesses

- Duplicates List for most near-term questions: today, tomorrow, next, and upcoming events.
- Duplicates Month for planning density: which days are busy and where there is room.
- Adds navigation and scanning cost without a distinct family-first question.
- Uneven event distribution makes it inefficient: empty days consume equal space while busy days truncate details.
- Children and hurried adults must scan seven columns/cards before reaching the answer.
- The current design must limit visible events per day, which means Week can hide the very details users need.

### Frequency of use

Low to medium. Some families like a week-at-a-glance, but it is rarely the fastest answer to the most common Agenda questions.

### Cognitive load

High relative to value. Week requires understanding the current week range, scanning across days, and comparing density while still opening or reading individual event cards.

### Family friendliness

Mixed. It is understandable to adults, but less direct for children and for quick shared household use.

### Suitability as default landing page

Poor. Week is neither the best operational view nor the best planning view.

### Does Week deserve to exist?

As a permanent primary view, no. Week does not currently own a unique, high-frequency household job. It sits between List and Month but is less decisive than either. If retained at all, it should be demoted to a future optional planning lens, not a first-class mode.

## List View Evaluation

### Primary purpose

List answers: **what comes next for the household?** It naturally supports the highest-frequency user intentions.

### Strengths

- Fastest comprehension for today, tomorrow, next appointment, and near-term schedule.
- Works well for parents, children, and shared displays because it reads in ordinary language order.
- Can group by Today, Tomorrow, This week, Later, Birthdays, Holidays, or Needs attention.
- Degrades gracefully with data volume through limits, grouping, internal scrolling, and “+N more” patterns.
- Reduces spatial-calendar literacy requirements.
- Best match for the existing product tone: household briefing rather than calendar software.

### Weaknesses

- Weaker for finding open space on a specific future date.
- Can become long if not aggressively grouped and capped.
- Needs careful hierarchy so today does not get buried under later events.
- Needs date-jump or Month access for appointment planning.

### Frequency of use

High. It should be used daily and repeatedly.

### Cognitive load

Low. Chronological grouping and plain-language headings produce direct comprehension.

### Family friendliness

High. A list is easier for children and hurried adults to understand than a dense calendar grid.

### Suitability as default landing page

Strong. List best supports the Agenda as a household operating surface.

## Alternative Information Architectures

### Option A — Preserve current equal views

- **Default:** Month, Week, or remembered previous mode.
- **Primary views:** Month, Week, List.
- **Removed:** none.

**Strategic assessment:** Weak. It preserves implementation history instead of product clarity. Equal tabs imply equal importance, but family use cases are not equal.

**Five-second answer:** “There are three calendar modes.” This answers the product structure, not the household question.

### Option B — List default, Month secondary, Week removed

- **Default:** List / Upcoming.
- **Secondary:** Month planning.
- **Removed:** Week.

**Strategic assessment:** Strong. It maps daily use to the landing surface and keeps the best planning tool. It simplifies decision-making and reduces mode-switch burden.

**Five-second answer:** “Here is what is coming up; switch to Month when planning a date.”

### Option C — Today / Upcoming default, Month secondary, Week removed

- **Default:** A sharpened Today / Upcoming household briefing.
- **Primary content:** Today, next event, tomorrow, later this week, upcoming special dates.
- **Secondary:** Month planning.
- **Removed:** Week.

**Strategic assessment:** Strongest. This is a product-specific version of Option B. It does not merely default to the existing List; it defines the Agenda around the highest-value household question.

**Five-second answer:** “Today is handled, and this is what comes next.”

### Option D — Agenda as household briefing + planning drawer

- **Default:** Briefing board with “Today”, “Next up”, and “Soon”.
- **Planning mode:** Month opens as a focused planning drawer or mode.
- **Secondary tools:** Date search / jump, birthdays and holidays as lightweight side context.
- **Removed:** permanent Week.

**Strategic assessment:** Very strong product direction, but it is a larger conceptual shift. It makes Agenda feel less like a calendar clone and more like FamilyBoard. It risks hiding calendar affordances unless Month access is obvious.

**Five-second answer:** “Here is the family’s schedule story, with planning one step away.”

### Option E — Month default with embedded Today rail

- **Default:** Month grid.
- **Persistent rail:** Today / next-up list.
- **Secondary:** List maybe removed or demoted.
- **Removed:** Week.

**Strategic assessment:** Moderate. It preserves planning power but still overweights the lower-frequency month grid. It could work for tablet-wall calendar mental models, but it is less effective for quick daily use.

**Five-second answer:** “This is the month, and today is on the side.”

### Option F — Week default with list assist

- **Default:** Week grid.
- **Embedded rail:** Today / next-up.
- **Secondary:** Month.
- **Removed:** standalone List.

**Strategic assessment:** Weak. It elevates the least differentiated view and then needs a list to solve its comprehension problem. If Week needs a list to become useful, List should be primary.

**Five-second answer:** “This week is shown, but I still need to find what matters.”

## Family-First Evaluation

| Criterion | Option A: three equal views | Option B: List + Month | Option C: Today / Upcoming + Month | Option D: Briefing + planning | Option E: Month + Today rail | Option F: Week + list assist |
| --- | --- | --- | --- | --- | --- | --- |
| Parents | Medium | High | High | High | Medium-high | Medium |
| Children | Low-medium | High | Highest | Highest | Medium | Low-medium |
| Shared household planning | Medium | High | High | High | High | Medium |
| Quick daily use | Medium | High | Highest | Highest | Medium | Medium |
| Appointment planning | High | High | High | Medium-high | High | Medium |
| Finding free time | High | High via Month | High via Month | Medium-high | High | Medium |
| Understanding what comes next | Medium | High | Highest | Highest | Medium | Medium |
| Mode simplicity | Low | High | High | Medium-high | Medium | Low-medium |

Option C best balances household operation with planning. Option D may become the strongest long-term expression after validation, but Option C is clearer and less likely to obscure familiar calendar behavior.

## Five-Second Comprehension Analysis

### Option A — Current three-view model

Within five seconds, a family understands that Agenda has multiple modes. They may not immediately know what matters today. The interface asks the family to choose a representation before answering the household question.

### Option B — List default + Month secondary

Within five seconds, a family sees upcoming commitments first. Month is understood as the place to plan or inspect dates. This is a strong simplification.

### Option C — Today / Upcoming default + Month secondary

Within five seconds, a family understands today’s commitments, the next event, and the near-term rhythm. This option best supports hurried household checks.

### Option D — Household briefing + planning drawer

Within five seconds, a family understands the schedule as a story. The risk is that appointment planning may feel hidden if the Month entry point is not obvious.

### Option E — Month default + Today rail

Within five seconds, a family sees the month and a small today summary. The page still communicates “calendar” before “what do we do next?”

### Option F — Week default + list assist

Within five seconds, a family sees a week structure but may still need to scan. The assist rail compensates for the weakness of Week rather than proving Week should be primary.

## One-Primary-Question Recommendation

The Agenda page should answer one primary household question:

> **What does our family need to know next?**

This is a better product question than “What does the calendar look like?” or “Which view do you want?” It aligns Agenda with FamilyBoard’s role as a shared household operating surface.

Secondary questions should remain available, but subordinate:

- “Where can we fit something?” → Month planning.
- “What is on a specific date?” → Month selected-day detail or date jump.
- “Are birthdays or holidays coming?” → Upcoming list grouping and Month context.
- “Was something yesterday?” → recent / past affordance, not a permanent primary mode.

## Final Recommendation

### Which view should be the default?

The default should be **Today / Upcoming**, evolved from the current List view. It should lead with today, next event, tomorrow, later this week, and upcoming special dates rather than presenting a generic chronological archive.

### Which views should remain?

- **Today / Upcoming list:** remain and become primary.
- **Month:** remain as the secondary planning mode.

### Which views should become secondary?

- **Month** should become secondary. It is a planning tool, not the daily household operating view.

### Which view should be removed?

- **Week** should be removed as a permanent primary view. It does not own a distinct, high-frequency family need and duplicates both List and Month.

### Should the current three-view model survive?

No. The current three-view model should not survive as the long-term Agenda information architecture. It creates false equality between modes and makes the family choose a calendar representation before receiving the most important answer.

### Recommended long-term IA

1. **Agenda landing:** Today / Upcoming household briefing.
2. **Primary CTA:** Add event.
3. **Secondary mode:** Month planning.
4. **Supporting affordances:** source visibility, date jump, maybe birthdays/holidays grouping.
5. **Removed from primary IA:** Week.

## Risks and Trade-offs

- **Risk: Some users expect a Week view.** Mitigation: provide Month planning and a strong This Week section in the default list before deciding whether Week needs to return as an optional advanced lens.
- **Risk: List can become too long.** Mitigation: cap visible groups, use internal scrolling, “+N later” summaries, and prioritize Today / Tomorrow / This week.
- **Risk: Month demotion may make planning feel less immediate.** Mitigation: make Month access obvious, label it as planning, and preserve selected-day detail.
- **Risk: Removing Week may reduce perceived calendar completeness.** Mitigation: position Agenda as a household briefing and planning board, not a general-purpose calendar replacement.
- **Trade-off: Less representational symmetry, more product opinion.** This is desirable for FamilyBoard because product clarity matters more than calendar feature parity.

## Validation Performed

- Reviewed repository governance instructions in `AGENTS.md` and `.github/copilot-instructions.md`.
- Inspected current Agenda implementation only to understand existing modes and terminology, not to preserve them.
- Reviewed recent Agenda-related reports and roadmap entries for product context.
- Confirmed this is a strategic UX analysis, not a viewport analysis and not an implementation slice.
- No build, test, Playwright, export, or backend validation was run because the task explicitly requested analysis only and no source implementation changes.

## Files Inspected

- `AGENTS.md`
- `.github/copilot-instructions.md`
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.tsx`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-06-27-agenda-final-polish/agenda-final-polish.md`
- `docs/reports/2026-06-30-agenda-compact-controls-audit/agenda-compact-controls-audit.md`
- `docs/reports/2026-06-26-product-review-v2/2026-06-26-product-review-v2.md`
- `docs/reports/2026-06-27-familyboard-screenshot-review/familyboard-screenshot-review.md`

## Confirmation That No Implementation Changes Were Made

No source code, styles, tests, backend files, API contracts, database files, or application behavior were changed. This report is the only intended repository change.

## Confirmation That No Binary Files Were Added

No binary files, screenshots, videos, exports, caches, build artifacts, or generated media were added by this task.
