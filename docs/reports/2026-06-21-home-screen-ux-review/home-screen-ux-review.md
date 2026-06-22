# Home Screen UX Review

## Executive Summary

The current Home screen is closer to a dashboard than a pure form, but its first impression is diluted by secondary controls. It partially answers “what matters today?” through Agenda and due-soon Tasks, yet the top visual hierarchy gives comparable prominence to date/time, family member chips, and two persistent quick-capture forms before the user reaches the most decision-relevant household information.

Primary finding: Home contains too much always-visible secondary information above the fold. The dashboard should lead with the most time-sensitive and actionable family context for today, then provide compact capture affordances and lower-priority summaries.

Recommended direction: make the first visible Home experience a “today board” rather than a capture surface. Preserve quick capture, but collapse it into compact actions or dialogs so Agenda, Tasks, and urgent family context can dominate.

## Information Hierarchy

### What draws attention first

1. The top Home hero: date, time, weather placeholder, family chips, and quick-capture forms.
2. The Agenda card, because it is the largest summary card and appears first in the grid.
3. The Lists/Shopping card, because it is adjacent to Agenda and contains repeated item rows.
4. Motivation and Tasks, depending on scroll position and viewport height.

The visual design makes the hero feel like the main object on the page. That is only partly appropriate. Date and time are useful for an always-on family tablet, but they are not the core answer to “what matters today?” The family chips and persistent forms are useful controls, but they compete with the actual daily summary.

### Should it draw attention first?

Only the date/time portion should have some initial prominence. The full hero should not dominate the page as much as it does. The family chips and quick-capture forms are secondary utilities; they do not usually tell the family what needs attention today.

### What should draw attention first instead

The first information group should be a prioritized “Today” area combining:

- the next/most important Agenda item,
- urgent or due-today Tasks,
- any motivational state that is ready or nearly ready,
- a compact reminder count for shopping/list items.

This does not require adding new domains. It is a reordering and compression of current Home content.

### Visible sections ranked by current importance

1. Hero/date/time/family/quick capture.
2. Agenda.
3. Lists/Shopping.
4. Motivation.
5. Tasks.

### Desired importance ranking

1. Today/next Agenda and time-sensitive household commitments.
2. Tasks that are overdue, due today, or due soon.
3. Motivation only when it is ready to celebrate, close to completion, or otherwise emotionally salient.
4. Shopping/List reminders as a compact memory aid.
5. Family member navigation and add-member control.
6. Quick capture as compact actions, not persistent forms.
7. Date/time/weather as ambient context.

## Quick Capture Review

### Large central “+”

A large central plus is risky because its purpose is ambiguous without a label. A plus could mean add event, add list item, add task, add family member, or add anything. On a family tablet, ambiguity increases hesitation and accidental taps.

If used, the plus should be paired with explicit choices after activation rather than standing alone as the primary visual object. It should behave like “add something” only if the following dialog quickly disambiguates the capture target.

### Shopping quick-add

The shopping quick-add has a clear purpose once read: it is labeled Shopping, has a concrete placeholder, and has an Add button. The issue is not clarity; it is space priority. A persistent form is useful for fast capture, but it turns the Home hero into a data-entry area.

The form is justified only if adding shopping items is one of the most frequent Home interactions. Even then, it can be compacted into a single “Add shopping item” action that opens a focused dialog, sheet, or inline expansion.

### Event quick-add

The event quick-add is less immediately simple than shopping. It needs title, timing, optional picked date, and Save. That makes it more form-like and more error-prone as an always-visible surface. Event capture should be dialog-driven or expandable because it has more required meaning than a shopping item.

### Should quick capture be persistent?

Quick capture should be persistent as an affordance, not as full forms. The Home screen should always offer quick capture, but the always-visible footprint should be small: for example, “+ Event”, “+ List item”, and possibly “+ Task” as compact buttons. The actual fields should appear only after intent is chosen.

### Should quick capture be dialog-driven?

Yes for events. Probably yes or inline-expandable for shopping. Dialog-driven capture would reduce visual noise, protect the dashboard’s scanability, and let the family focus first on current state.

### Alternatives evaluated

- Keep persistent forms: fastest repeat entry, but highest visual cost and strongest data-entry feel.
- Compact buttons with inline expansion: balanced; keeps capture nearby while preserving hierarchy.
- Single plus menu/dialog: lowest clutter, but only works if labels are obvious immediately after tap.
- Separate capture area below summaries: reduces top clutter, but makes frequent capture less immediate.

Best fit: compact labeled actions above or beside the dashboard, with event capture in a dialog and shopping capture in a lightweight popover/sheet.

## Dashboard vs Form

Home currently behaves as a hybrid, but the hero pushes it toward a data-entry screen.

### Informational areas

- Date and time.
- Family presence/navigation chips, though these are more navigational than informational.
- Agenda summary.
- Lists/Shopping summary.
- Motivation summary.
- Tasks summary.

### Input-oriented areas

- Shopping quick-add form.
- Event quick-add form.
- Add family member chip.
- Card click-through actions and “Open” links.

### Are the priorities correct?

Not yet. The most important Home job is household awareness, not entry. Input is valuable, but it should support the dashboard rather than lead it. Current persistent quick-capture forms receive too much top-level space relative to Tasks and Motivation, which carry more day-planning meaning.

## Shopping Review

### Is current presentation useful?

The current Shopping/List summary is useful as a reminder that active list items exist. It is less useful as a real shopping aid because it presents list items as a flat stream and repeats list names. The family can see “remember these things,” but the layout does not strongly support “while I am at a store, what should I buy?”

### Should items be grouped by store?

For the Home screen, store grouping should be considered only if store data already exists and can be displayed compactly. Grouping by store would better match real shopping behavior than a flat mixed list, but Home should not become the full shopping workflow.

A good Home-level alternative is a compact grouped preview:

- Store or list heading.
- Top two to four active items.
- A count of remaining items.

### Does current layout support real shopping behavior?

Only partially. It supports remembering that shopping items exist. It does not strongly support trip planning, store-by-store scanning, or quick completion. Those deeper behaviors belong on the Lists page, while Home should show the most relevant reminder summary.

## Motivation Review

### Is the card large enough?

The Motivation card is large enough for a summary. It should not grow by default unless the family goal is at a meaningful state such as ready to celebrate, nearly complete, or recently celebrated.

### Too large, too small, or right-sized?

Right-sized as a normal state, but potentially too low in hierarchy when the goal is emotionally important. Motivation should be dynamic in emphasis: compact when routine, louder when it answers “what matters today?”

### Does it communicate the right thing?

It communicates progress, but progress alone may not always be immediately meaningful on Home. The strongest Home message is not “there is a motivation module”; it is “we are close,” “we did it,” or “this is the family goal right now.” The current presentation is directionally right if it can surface these states without competing with urgent daily commitments.

### Hierarchy evaluation

Motivation should sit below Agenda and urgent Tasks in the default hierarchy. It should temporarily rise above Shopping when it is ready-to-celebrate or close to completion.

## Tasks Review

### Is task information actionable?

Yes, more than many other sections. Tasks directly answer what needs doing. The summary is actionable when it shows overdue, today, and upcoming tasks with owner and due information.

### Is density appropriate?

The density is generally appropriate for a dashboard summary, but the section likely deserves more immediate visibility. If Tasks are below the fold on common tablet layouts, the density does not matter because families will miss it during quick glances.

### Is grouping appropriate?

Grouping by urgency is appropriate. It supports the “what matters today?” question better than alphabetical, owner-only, or creation-order grouping.

### Should Tasks receive more or less emphasis?

More emphasis. Tasks should appear immediately after Agenda or beside it in the first dashboard zone. If a task is overdue or due today, it should outrank general shopping reminders and routine motivation progress.

## Landscape vs Portrait

HomeOps Home should target a responsive hybrid, with tablet landscape treated as the primary dashboard canvas and portrait treated as a high-quality fallback.

### Rationale

- Family tablet usage often involves countertop, wall, or stand placement where landscape works well for glanceable dashboard layout.
- Landscape supports two-column or multi-card summaries without excessive scrolling.
- Portrait remains important for handheld use, but it naturally forces prioritization and vertical scrolling.
- Designing only for portrait would underuse family-dashboard tablet space.
- Designing only for landscape would make handheld checks less effective.

The layout strategy should therefore define a strong landscape “above the fold” and a strict portrait stacking order.

## Scrolling Strategy

Home should aim for minimal scrolling, not no scrolling and not unlimited scrolling.

### Why not no scrolling?

A strict no-scroll target would either make cards too dense or force important summaries to be oversimplified. Families need enough detail to understand the next few commitments and responsibilities.

### Why not unlimited scrolling?

Unlimited scrolling undermines a dashboard. If the answer to “what matters today?” is below a long page, Home is failing its primary job.

### What should be visible above the fold?

Above the fold should include:

1. Today/next Agenda item(s).
2. Due/overdue Tasks.
3. Compact quick-capture actions.
4. Compact family/date context.
5. A visible hint of Motivation or Shopping depending on priority/state.

### What can move below the fold?

- Full quick-capture forms.
- Secondary list items beyond the first few.
- Routine Motivation details when not urgent or celebratory.
- Family member management/add-member controls.
- Weather placeholder until it contains meaningful information.

## Wasted Space Analysis

### Largest space consumers

1. Hero area combining date/time, family chips, and full quick-capture forms.
2. Persistent Event quick-add form.
3. Persistent Shopping quick-add form.
4. Repeated labels in the list summary.
5. Empty or low-information contextual text such as placeholder weather when not connected.

### Lowest-value space consumers

- Full event capture fields before the user has expressed intent to add an event.
- Full shopping capture field when the family is only trying to glance at today.
- Add-family-member affordance on the primary Home board once setup is complete.
- Weather placeholder if it does not provide actual weather.

### Elements that could become dialogs

- Event quick-add.
- Add family member.
- Any multi-field capture flow.

### Elements that could become compact actions

- Shopping quick-add.
- Event quick-add trigger.
- Family member navigation if screen width is constrained.
- “Open” card actions, because the whole card is already clickable.

## Recommended Home Hierarchy

Recommended priority order for the Home screen:

1. Today & Next Agenda.
2. Due / Overdue Tasks.
3. Compact Quick Capture.
4. Motivation when ready, close, or celebratory.
5. Shopping / Lists reminder summary.
6. Family member navigation.
7. Date/time/weather context.
8. Secondary navigation and lower-priority counts.

If Motivation is routine and no celebration is near, it should remain below Tasks and Shopping. If Motivation is ready to celebrate, it can move above Shopping and possibly sit beside Tasks as a positive family priority.

## Recommended First Home UX Slice

If only one Home-screen UX improvement may be implemented next, make quick capture compact and move full capture fields into dialogs or expandable surfaces.

### Why this slice first

- It directly addresses the largest hierarchy problem: Home currently spends too much prime space on input.
- It improves dashboard behavior without removing useful capture capability.
- It frees above-the-fold space for Agenda and Tasks, which better answer “what matters today?”
- It is a contained UX slice that does not require adding new feature domains.
- It preserves family-tablet speed while reducing cognitive load.

Success criteria for this slice:

- The first glance shows today’s commitments and due tasks before full forms.
- Quick capture remains available through clearly labeled actions.
- Event capture is not visible until requested.
- Shopping capture is either a compact one-line expansion or a small dialog/sheet.
- The Home screen feels like a dashboard first and a data-entry screen second.

## Next Prompt Context

Use this report to drive a single implementation slice focused on Home quick-capture compaction. Do not introduce new feature domains. Keep existing capabilities, but reduce their above-the-fold footprint. Prefer labeled compact actions over an ambiguous standalone plus. Preserve access to Shopping and Event quick-add, but make the main Home board prioritize Today/Agenda and due Tasks.
