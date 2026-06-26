# Summary

The Home Agenda purple accent is a hardcoded visual left border on Agenda summary rows. It does not represent event category, source, selection, focus, active state, today's event status, or explicit next-event semantics.

It is best understood as legacy Home summary styling: a presentation-only emphasis applied by CSS to the first item in each Home Agenda summary list.

# Preflight Findings

Relevant implementation findings from the completed investigation:

- Home renders the Agenda summary through `HomeDashboard` using a shared `SummaryCard` with the `agenda-summary` class.
- Home Agenda items are grouped into `Today`, `Tomorrow`, and `Later / Next` sections.
- Each group renders its own `ul.home-summary-list` containing plain `li` rows with event title and formatted time.
- The full Agenda page uses `AgendaWidget` and `agenda-widget` styles, but the purple Home summary accent is not owned by `AgendaWidget`.
- Prior visual-system notes identified Home summary accents as hardcoded styling rather than tokenized domain styling.

# Implementation Investigation

The purple accent is rendered by CSS:

```css
.agenda-summary .home-summary-list li:first-child {
  border-left: 0.35rem solid #7c3aed;
  padding-left: 0.9rem;
}
```

What it is:

- CSS `border-left`.
- Hardcoded purple color `#7c3aed`.
- Applied by selector, not by component logic.

What it is not:

- Not an icon.
- Not a pseudo element.
- Not a badge.
- Not a background image.
- Not inherited from shared card styling.
- Not event-source color.
- Not event-category color.
- Not a selected, focused, active, or next-event state.

Component ownership:

- Markup owner: `HomeDashboard`, because it renders the Home Agenda summary card and rows.
- Styling owner: global stylesheet rule targeting `.agenda-summary .home-summary-list li:first-child`.
- Not owned by `AgendaWidget`; the Agenda page widget uses different wrapper classes and does not render this specific Home summary accent.

# Rendering Conditions

The accent appears when a Home Agenda summary group contains at least one visible item.

The selector targets the first `li` inside each `.home-summary-list` under `.agenda-summary`. Because Home Agenda groups items by bucket, the accent applies to the first row of each rendered group, not necessarily only the first Agenda event overall.

It can therefore appear on:

- the first visible `Today` event;
- the first visible `Tomorrow` event;
- the first visible `Later / Next` event.

It is not conditional on:

- today's event specifically;
- the next event overall;
- selected state;
- focused state;
- currently active event;
- event category;
- source color;
- all-day status;
- event priority;
- Agenda page rendering.

The only meaningful condition is structural: first list item within each Home Agenda summary list.

# Reuse Analysis

The exact purple accent rule is Home Agenda-specific. It is not implemented as a reusable component, token, utility class, or semantic state class.

Reused pieces involved in the rendering are:

- `SummaryCard`: shared card wrapper used by Home summary cards.
- `CardHeader`: shared card header used by the Home Agenda card.
- `home-summary-list`: shared Home summary list class used by Agenda and other Home summary cards.
- `agenda-summary`: Home Agenda-specific card class that scopes the purple first-item selector.

Related styling exists elsewhere but is not the same semantic treatment:

- Base `.home-summary-list li` styling gives rows their shared background, radius, spacing, and padding.
- Task summary rows use a teal left border on task rows, but that is a separate selector under `.tasks-summary` and applies differently.
- Home summary accents are generally hardcoded rather than derived from the domain color token system.

# Information Value Assessment

Removing the purple accent would not remove explicit information.

No information would be lost because the accent is not connected to any event data or state. The event title, formatted time, grouping label, and visible ordering would remain unchanged.

The accent may create a weak visual emphasis on the first item in each group, and because events are sorted by time that can accidentally read as "first upcoming item in this bucket." However, that meaning is not explicit, not accessible, not labeled, and not consistently equivalent to "next event" across the whole Agenda card.

If the product wants to communicate next-event importance, it should be represented with clearer visual language such as an explicit `Next` label, `Up next` copy, or a real semantic state attached to exactly one event.

# Classification

Legacy styling

The accent is legacy styling because it is hardcoded CSS applied by structural selector rather than by event semantics. It is not data-driven, not tokenized, not part of the Agenda domain model, and not owned by a reusable row component. It appears to be leftover visual emphasis from earlier Home summary styling rather than intentional information architecture.

# Recommendation

Remove completely

The current accent should be removed completely because it does not communicate reliable information and can imply meaning that the application does not actually encode. Users may interpret it as selected, current, urgent, categorized, or next, but none of those states are true in implementation.

If a next-event cue is desired, it should be added in a separate product/design slice with explicit semantics and clearer visual language rather than preserving this ambiguous border.

# Risks

Risks of changing or removing it:

- The Home Agenda card may lose a small amount of visual hierarchy.
- Users who have informally interpreted the bar as "next" may notice its absence.
- Removing it without replacing it could make Agenda rows look more uniform with other Home summary rows.
- If future source/category colors are introduced, removal now is low risk; retaining the hardcoded bar may create greater confusion later.

# Next Prompt Context

Next implementation slice: remove the Home-only Agenda first-item purple border from `styles.css` and update focused Home dashboard tests only if snapshots or style assertions require it.

Do not change Agenda data behavior, AgendaWidget, event grouping, event sorting, event source colors, roadmap documentation, or state documentation in that slice.
