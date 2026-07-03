# Strategic FamilyBoard Planning Briefing UX Analysis

## Executive Summary
Planning should become a **household briefing surface**, not a calendar surface and not an event-list surface. The strongest long-term direction is a bounded, viewport-first briefing board with:

- **Today** as the dominant briefing card.
- **This Week** below Today as a quieter day-grouped scan area.
- **Vooruitkijken** as the right-column future reassurance area, replacing the weaker label `Later`.
- **Planning tools** as a separate quiet utility region for planning an appointment, choosing a date, viewing the month, filters, and source selection.

This recommendation accepts the proposed main-column / secondary-column hierarchy, but only with one strategic correction: the right column should not feel like another event horizon. It should feel like reassurance plus tools. Today should carry roughly **60–70% of initial user attention**, This Week around **20–25%**, Vooruitkijken around **8–12%**, and Planning tools around **5–8%**.

No implementation was performed. No source code, behavior, backend/API, schema, or unrelated page was changed.

## Whiteboard Benchmark
The benchmark is not whether Planning looks like a calendar. The benchmark is:

> If a family replaced their kitchen whiteboard with FamilyBoard, what should they immediately understand?

A kitchen whiteboard succeeds because it is brutally selective. It usually answers:

1. What is happening today?
2. What should we remember soon?
3. Is there anything unusual coming up?

The current digital surface can outperform the whiteboard only if it adds digital judgement without adding digital clutter. FamilyBoard should beat the whiteboard on:

- **Glanceability:** the parent should identify the day’s next meaningful thing immediately.
- **Relevance:** the page should suppress administrative calendar details until needed.
- **Calmness:** the page should not imply that every horizon is equally urgent.
- **Shared understanding:** children and parents should see the same family story.
- **Distance readability:** the wall display should be understandable from several metres away.

The recommended briefing composition outperforms a whiteboard because it can reserve space, cap lists, summarize overflow, and expose planning tools contextually while preserving whiteboard-like simplicity.

## Two-Second Comprehension Analysis
Assume a parent walks past a wall-mounted display and looks for exactly two seconds.

They should notice, in order:

1. **First: Today's family briefing.** The eye should land on the Today card and understand the current or next important event.
2. **Second: The shape of the rest of the week.** The parent should recognize whether the week is light, normal, or busy, and which days matter.
3. **Third: Future reassurance and tools.** The parent should see that future items are not forgotten and know where to plan/check a date if needed.

Nothing else should compete in those two seconds. Not source chips. Not edit/delete controls. Not repeated icons. Not calendar-mode controls. Not analytics cards. If an element does not support those three comprehension steps, it should be demoted or contextual.

## Current Planning Noise Analysis
The current Planning implementation still behaves too much like calendar software and too much like an event list.

Current observed composition:

- A header presents Agenda title, a Month toggle, add-event action, loading/error status, and source selector.
- Planning renders a header, a summary grid, then timeline groups.
- The summary grid renders five equal cards: Today, next event, Tomorrow, This Week, and special events.
- The timeline group grid renders four equal horizon groups: Today, Tomorrow, Later This Week, and Upcoming.
- Each populated group renders full event cards with icon, category label, title, time/category metadata, and edit/delete actions.

Noise drivers:

1. **Equal horizon weight:** Today, Tomorrow, Later This Week, and Upcoming are structurally equal, even though household relevance is not equal.
2. **Duplicate summaries:** the page summarizes horizons and then lists horizons, causing repetition rather than briefing.
3. **Event-card uniformity:** the same rich card language is applied to immediate and distant events.
4. **Repeated visual elements:** group indicators repeat event icons before the event cards repeat icons again.
5. **Administrative controls in the reading path:** source selection and edit/delete controls are visible while the family is trying to read.
6. **Calendar vocabulary leakage:** Month and source controls remain visually prominent enough to keep the surface feeling like calendar software.

The current page is directionally useful, but it asks the family to scan too much before answering: **What does our family need to know next?**

## Today Briefing Investigation
Today should become a true briefing card instead of an event list.

Recommended Today behavior:

- Dominant visual weight.
- Richer spacing than other regions.
- One clear primary message: current event, next event, or calm empty state.
- Support details only when they help immediate household action.
- Preparation cues when useful: bring bag, leave soon, birthday/gift, school item, appointment location.
- Household relevance: who needs to act, who is affected, what needs to be ready.

Today should not simply list all events equally. It should answer:

- What is happening now or next?
- What should we prepare for?
- Who in the household needs to know?
- Is today calm, normal, or busy?

Recommended Today attention share: **60–70% of initial attention**.

Today may include:

- a large heading and calm status line;
- current/next event as the lead item;
- up to 2–3 visible supporting events;
- an internal overflow region or `+N more today` indicator;
- an add-today affordance that is present but not louder than the briefing itself.

## This Week Investigation
This Week should become quieter, grouped by day, and easier to scan.

Tomorrow should disappear as a separate top-level section. It should become the first relevant day inside This Week. This preserves tomorrow’s usefulness without making it compete with Today.

Recommended This Week behavior:

- Secondary visual weight below Today.
- Grouped by day.
- Moderate density.
- Less detail than Today.
- Clear enough to understand busy days and unusual days.
- Capped visible rows with `+N more` when needed.

This Week should not show every event with full card treatment. It should show the week’s shape:

- which days contain events;
- which events are family-relevant;
- whether any day is unusually busy;
- whether tomorrow needs preparation.

Recommended attention share: **20–25% of initial attention**.

## Later Investigation
The name `Later` is accurate but not family-first enough. It can feel vague or dismissive. The section’s job is not to create urgency; it is to reassure the family that future items are remembered.

Name options evaluated:

- **Later:** short, but vague and low-emotion.
- **Binnenkort:** familiar Dutch, but can imply near-term urgency.
- **Komt later:** conversational, but sounds slightly unfinished or dismissive.
- **Upcoming:** not recommended because it is English in a Dutch UI.
- **Vooruitkijken:** recommended. It describes the family behavior: looking ahead calmly.

Recommended name: **Vooruitkijken**.

Recommended behavior:

- Informational, not urgent.
- Right-column future reassurance area.
- Only 3–5 visible items.
- Compact rows, not rich cards.
- `+N later` / `+N meer vooruit` indicator for hidden future items.
- Low color intensity and minimal icon use.

Recommended attention share: **8–12% of initial attention**.

## Planning Tools Investigation
The right column should naturally become partly a tool region, not another equal content column.

Planning tools should include:

- **Plan afspraak** or `Afspraak plannen`.
- **Datum kiezen**.
- **Maand bekijken**.
- Filters and source selection.

These should feel like tools, not default reading content. They should be available when a parent intends to manage the agenda, but they should not compete with the two-second briefing.

Recommended behavior:

- Quiet card/rail below Vooruitkijken.
- Small, clear action buttons.
- Source/filter controls collapsed, tucked into tools, or visually secondary.
- Month access framed as lookup/planning rather than a competing Agenda mode.

Recommended attention share: **5–8% of initial attention**.

## Metadata Visibility Matrix
| Event element | Recommendation | Rationale |
| --- | --- | --- |
| Event title | Always visible | Core whiteboard information. |
| Time | Always visible for timed events | Essential for household planning. |
| Day/date | Always visible outside Today; contextual inside Today | This Week and Vooruitkijken need day/date anchors; Today already supplies context. |
| Current/next marker | Always visible in Today when applicable | Helps the two-second benchmark. |
| Preparation cue | Only when useful | Valuable if it changes behavior; noise if generic. |
| Household member / participant | Only when useful | Show if responsibility or relevance differs by person; hide if obvious or unavailable. |
| Avatar | Contextual only | Too visually heavy for persistent Planning rows; useful in detail or responsibility-specific contexts. |
| Event icon | Only when useful | Use sparingly for special categories or scannable cues; avoid repeating icon in every region. |
| Category label | Contextual only | Usually software metadata, not whiteboard information. |
| Location | Only when useful | Show for appointments where travel/preparation matters; hide for obvious home events. |
| Source | Contextual only | Administrative calendar detail; belongs in tools/detail, not default briefing. |
| Edit button | Contextual only | Management action; should not compete with reading. |
| Delete button | Contextual only | Destructive management action; should be hidden until edit/manage context. |
| Labels/chips | Only when useful | Chips often add visual noise; reserve for meaningful state. |
| Overflow count | Always visible when content is hidden | Necessary to preserve trust in bounded lists. |

Metadata reduction recommendation:

- Remove persistent source labels from event rows.
- Remove persistent edit/delete buttons from default briefing rows.
- Remove duplicated group indicators from Planning.
- Avoid always-visible category labels except where they materially improve recognition.
- Avoid avatars unless responsibility/person-specific relevance is central.

## Visual Weight Rules
The page should guide the eye without conscious scanning.

Recommended visual weight distribution:

```text
Today          ██████████████████  60–70%
This Week      ███████             20–25%
Vooruitkijken  ███                 8–12%
Planning tools ██                  5–8%
```

Rules:

- Today receives the largest region, strongest typography, most whitespace, and richest useful detail.
- This Week receives stable secondary space and day grouping, but not full event-card intensity.
- Vooruitkijken receives compact future rows and low visual intensity.
- Planning tools receive button/utility styling, not event-region styling.
- Color should indicate meaningful status or category only when it aids comprehension.
- Controls should not be visually louder than family information.

## Alternative Briefing Layouts
### Alternative 1: Recommended bounded briefing board
```text
┌──────────────────────────────┬────────────────────────┐
│ Today briefing               │ Vooruitkijken          │
│ current / next / prep cues   │ 3–5 compact items      │
├──────────────────────────────┤                        │
│ This Week                    │ Planning tools         │
│ grouped by day               │ plan/date/month/filter │
└──────────────────────────────┴────────────────────────┘
```

Strengths:

- Best match for two-second comprehension.
- Makes Today dominant without hiding the week.
- Keeps future items and tools quiet.
- Fits viewport-first reserved-region rules.

Weaknesses:

- Requires discipline to keep the right column from becoming another event list.
- Needs careful empty-state design for quiet days.

### Alternative 2: Metadata-minimal whiteboard strip
```text
┌────────────────────────────────────────────┐
│ Today: next thing + prep cue               │
├────────────────────────────────────────────┤
│ Week: Mon / Tue / Wed / Thu / Fri snippets │
├────────────────────────────────────────────┤
│ Ahead: 3 future reminders                  │
└────────────────────────────────────────────┘
```

Strengths:

- Deliberately reduces metadata.
- Extremely readable from a distance.
- Strong whiteboard feel.

Weaknesses:

- Less flexible for real household planning.
- Planning tools become harder to place without adding a separate command area.
- Could underuse available desktop/laptop space.

### Alternative 3: Maximum-glance hero board
```text
┌────────────────────────────────────────────┐
│ HUGE Today / Next event                    │
│ one preparation cue                        │
├──────────────────────┬─────────────────────┤
│ This Week summary    │ Vooruitkijken/tools │
└──────────────────────┴─────────────────────┘
```

Strengths:

- Strongest two-second result.
- Best for wall-mounted display at distance.
- Very calm.

Weaknesses:

- May hide too much week detail for active planning.
- Could feel sparse on large desktop if Today is empty.
- Requires excellent summary logic.

### Alternative 4: Equal dashboard grid
```text
┌─────────┬─────────┬─────────┬─────────┐
│ Today   │ Tomorrow│ Week    │ Later   │
└─────────┴─────────┴─────────┴─────────┘
```

Strengths:

- Simple to understand as categories.
- Easy to implement from the current structure.

Weaknesses:

- Not recommended.
- Repeats the current strategic problem: equal horizon weight.
- Feels like calendar software and event buckets rather than a family briefing.

## Final Recommended Composition
The recommended long-term Planning UI is the **bounded briefing board**:

```text
Agenda / Planning

┌─────────────────────────────────────┬──────────────────────────────┐
│ Vandaag                             │ Vooruitkijken                │
│ true briefing card                  │ compact reassurance list     │
│ current / next / prep cues          │ 3–5 future items             │
│ 60–70% initial attention            │ low urgency                  │
├─────────────────────────────────────┤                              │
│ Deze week                           │ Planning tools               │
│ grouped by day                      │ Plan afspraak                │
│ moderate detail                     │ Datum kiezen                 │
│ tomorrow as first day, not section  │ Maand bekijken / filters     │
└─────────────────────────────────────┴──────────────────────────────┘
```

Explicit recommendations:

- **Should Today become a briefing card instead of a list?** Yes.
- **Should Tomorrow disappear?** Yes, as a top-level section. It should remain only as a day inside This Week.
- **Should This Week become quieter?** Yes. It should be grouped by day with moderate detail.
- **Should Later be renamed?** Yes. Rename it to **Vooruitkijken**.
- **Should Planning tools become their own quiet region?** Yes.
- **Which metadata should disappear?** Persistent source labels, persistent edit/delete buttons, duplicated group indicators, default category labels, and default avatars.
- **Which metadata should remain?** Event title, time, day/date where needed, current/next marker, useful preparation cues, overflow counts, and participant/location only when they change household action.
- **Does this outperform the current Planning UI?** Yes. It removes equal horizon weight and reduces default metadata noise.
- **Does this outperform a family kitchen whiteboard?** Yes. It preserves whiteboard clarity while adding prioritization, bounded overflow, and contextual planning tools.

## Risks and Trade-offs
- **Risk: Hidden controls reduce management discoverability.** Mitigate with clear detail/edit affordances and a quiet Planning tools region.
- **Risk: Renaming Later to Vooruitkijken may need copy validation.** Mitigate by testing with Dutch household language in the implementation slice.
- **Risk: Today can feel empty on calm days.** Mitigate with a strong calm-day briefing state and useful week preview.
- **Risk: Less metadata may hide relevant responsibility.** Mitigate by showing participants/avatars only when responsibility is genuinely useful.
- **Risk: Compact future list may hide important distant events.** Mitigate with `+N` overflow and contextual Month/date lookup.
- **Risk: Implementation may drift back toward calendar behavior.** Mitigate by treating this report as the Analysis Authority implementation contract.

## Recommended Implementation Slice
Recommended next slice: **Agenda Planning Briefing Board implementation**.

Scope:

1. Replace the current Planning summary + equal timeline grid with the bounded briefing board.
2. Build reserved regions for Today, This Week, Vooruitkijken, and Planning tools.
3. Convert Today into a briefing card with current/next/preparation hierarchy.
4. Merge Tomorrow into This Week grouping.
5. Rename Later/future region to Vooruitkijken.
6. Reduce default event metadata according to the metadata matrix.
7. Move Month/date/source/filter controls into the quiet Planning tools region.
8. Validate desktop/laptop viewport fit and confirm no document-level vertical scrolling.

Out of scope:

- Backend/API/schema changes.
- Week IA restoration.
- New calendar integrations.
- Unrelated page redesigns.
- New product features beyond presentation and interaction hierarchy.

## Validation Performed
Validation was limited to strategic documentation and source inspection. No application build, automated test suite, Playwright run, export, browser validation, screenshot, or viewport validation was performed because the task explicitly requested analysis only and prohibited implementation.

Performed checks:

- Configured repository-local environment locations before running repository inspection commands.
- Read `AGENTS.md` and `.github/copilot-instructions.md`.
- Inspected Agenda Planning component structure and styles.
- Confirmed report placement under `docs/reports/2026-07-03-work/`.
- Reviewed the final changeset for documentation-only scope.
- Confirmed no binary files were added.

## Files Inspected
- `AGENTS.md`
- `.github/copilot-instructions.md`
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.tsx`
- `src/HomeOps.Client/src/styles.css`
- `docs/reports/2026-07-03-work/agenda-planning-whiteboard-analysis.md`

## Confirmation that No Implementation Changes Were Made
Confirmed. This work only updates the strategic markdown report. It does not modify source code, application behavior, backend/API contracts, database schema, tests, screenshots, videos, or unrelated pages.

## Confirmation that No Binary Files Were Added
Confirmed. No binary files, screenshots, videos, browser artifacts, build outputs, package caches, or repository-local cache artifacts were added to the changeset.
