# 2026-06-24 Home Dashboard Static Analysis

## Summary

Static review only. The application was not started, no browser was used, and no screenshots were generated.

The current Home implementation is much closer to a dashboard than a management page: it has a compact date/family hero and four bounded summary cards for Agenda, Tasks, Motivation, and Lists. The largest remaining static height risks are not unbounded data counts; those are capped. The risks are structural density: four full card shells in one row at desktop width, fairly tall list rows, empty-state cards with explanatory text, the Motivation celebration block, and responsive collapse to a single-column card stack below 900px.

Scroll risk by static inspection is low at 1920x1080, medium at 1440x900, and high at 1366x768. The 1366x768 risk is mostly because the app max-width keeps the three-column layout, while vertical chrome, hero, card padding, grouped rows, and four summary cards can exceed the available viewport height without any internal card scroll constraints.

## Home Layout Structure

### Sections and cards

Home renders these top-level regions:

1. Workspace shell/navigation chrome.
2. Workspace panel.
3. Home dashboard.
4. Home hero.
5. Optional quick-status line.
6. Summary-card grid.
7. Optional modal quick-capture dialogs when icon actions are opened.

The visible Home dashboard contains:

- Date/time card inside the hero.
- Family member strip inside the hero.
- Agenda summary card.
- Tasks summary card.
- Motivation summary card.
- Lists summary card.

Quick-capture dialogs exist for shopping, task, and event creation, but they are modal overlays and not part of the default page height.

### Layout/grid structure

The app shell is capped at 1040px and uses small vertical gaps and padding. The workspace shell is a grid with navigation and a workspace panel. The Home dashboard is a grid with a hero followed by the summary grid.

The Home hero is a two-column grid: date/time on the left and family strip on the right. The summary grid is a three-column grid on desktop: a wider first column and two narrower columns. Because four summary cards are rendered into three columns, the static placement is effectively two vertical card rows: Agenda, Tasks, and Motivation on the first grid row, then Lists on the next grid row.

At max-width 900px, the hero changes proportions and the summary grid collapses to one column. At max-width 680px, the app shell padding decreases and the hero becomes one column.

### Vertical regions

Default Home has four vertical regions:

1. Navigation row.
2. Workspace panel padding/chrome.
3. Hero row.
4. Summary grid content, which itself can become two grid rows on desktop because there are four cards in a three-column grid.

If a quick-status message is present after quick capture, it adds a fifth vertical region between hero and cards.

### Elements consuming the most vertical space

The biggest vertical consumers are:

- Summary-card content, especially Agenda and Tasks because each can show up to four or five two-line rows plus group headings.
- Motivation when a celebration surface is present because it includes a title, progress bar, icon/message surface, and card padding.
- Lists when it shows four rows plus the persistent household context note.
- Empty-state cards, because they include a strong heading, explanatory paragraph, and action guidance paragraph.
- Workspace navigation when wrapping, especially with many workspace buttons.
- Family strip when many members wrap to multiple lines.

## Height Risk Analysis

### Largest card contributors

1. **Agenda**: up to five visible events grouped under Today, Tomorrow, and Later / Next. Each group can add a heading, and each event row can include title plus time.
2. **Tasks**: up to four visible tasks grouped by urgency. Each urgency group adds a heading, and each task row includes title plus owner/due metadata.
3. **Motivation**: can be compact when only a note is shown, but the celebration surface adds a visually substantial block.
4. **Lists**: capped at four item rows, with an additional context note and possible +N more button.

### Static height drivers

Relevant height drivers visible in code:

- App shell padding plus grid gap.
- Workspace shell gap.
- Workspace panel minimum height and padding.
- Home dashboard gap.
- Hero padding and two-column/family wrapping behavior.
- Summary grid gap and multi-row placement from four cards in a three-column grid.
- Summary cards with 1rem padding.
- List row padding and grid gap.
- Agenda/task group headings and group/list margins.
- Empty-state card padding/gap inherited from global empty-state styling.
- More-link button minimum height of 2.75rem.
- Quick-status line if present.

There are no explicit card max-heights or overflow rules that would create internal scrolling. That aligns with the invariant that cards should not internally scroll, but it means the page must absorb all card height.

### Responsive breakpoint risks

- **Above 900px**: the summary grid remains three columns. Four cards create two summary-grid rows; the second row currently contains Lists only, leaving unused horizontal space but adding a full extra row of vertical height.
- **At or below 900px**: summary cards become a single-column stack. This is expected for smaller devices but significantly increases total page height.
- **At or below 680px**: the hero becomes one column, which can further increase vertical height. This matters less for normal laptop targets, but it confirms the mobile/tablet layout is scroll-first.

## Summary Density Review

### Hero/date and family strip

- **Information shown**: Today label, localized weekday/month/day, current time, weather placeholder, family member chips, add-member chip.
- **Rows**: date card is roughly four text rows; family strip can be one row or multiple rows depending on member count.
- **Summary vs management**: Mostly summary/dashboard. The add-family-member chip is a management entry point in the hero, but it is compact.

### Agenda card

- **Information shown**: title, compact add/open actions, count showing, optional error, grouped event summaries, optional empty state, optional +N more.
- **Rows**: up to five event rows plus up to three group heading rows; worst visible density is roughly eight content rows before empty/error/more controls.
- **Summary vs management**: Mostly summary. Quick add is a workflow entry point, but hidden behind an icon/modal. The grouped headings improve scannability but cost height.

### Tasks card

- **Information shown**: title, add/open actions, due-soon count, optional error, urgency groups, task titles, owner/due metadata, optional empty state, optional +N more.
- **Rows**: up to four task rows plus up to three group headings; roughly seven content rows in the worst grouped case.
- **Summary vs management**: Summary-first, but owner/due metadata on every row creates a management-page feel if the card is crowded.

### Motivation card

- **Information shown**: title, open action, progress meta, goal title, progress bar, celebration status/message or explanatory context note, or empty-state guidance.
- **Rows**: usually goal title + bar + one celebration block. The celebration block can visually equal several rows.
- **Summary vs management**: Summary/emotional overview. The empty-state text and celebration explanation are the main density concerns.

### Lists card

- **Information shown**: primary-list-derived title, add/open actions, active count, optional error, up to four shopping/list items, optional empty state, optional +N more, household context note.
- **Rows**: up to four item rows plus more button and context note.
- **Summary vs management**: Mostly summary. However, the title can repeat container naming as “Shopping lists”, and the persistent “Shared for N household members” note is explanatory rather than dashboard-critical.

## Dashboard Philosophy Findings

Remaining elements that are somewhat inconsistent with “Home = overview, workspace pages = management”:

1. Empty-state cards are instructional and explanatory, which is appropriate for onboarding but tall and management-like on a dashboard.
2. Lists card title can repeat list/container naming through “{primaryListName} lists” even though the invariant says Shopping should show shopping items, not repeated list/container names.
3. Lists card always includes “Shared for N household members,” which does not help a quick dashboard scan.
4. Weather placeholder says “Weather ready when connected,” which is future/integration explanatory text rather than current dashboard signal.
5. Agenda and Tasks grouping headings improve understanding but can make cards read like mini management lists when several groups are visible.
6. The add-family-member chip is a setup/management action in the Home hero, though it is compact.
7. Quick-capture modals still embed simple workflows in Home. They are compact and action-triggered, but they remain workflows rather than pure overview.

## Scroll Risk Assessment

### 1920x1080: Low

At this viewport, the app still caps at 1040px width, but vertical space is generous. Static limits on Agenda, Tasks, and Lists prevent unbounded growth. The biggest possible contributors are grouped Agenda/Tasks rows, Motivation celebration, Lists second grid row, and nav/family wrapping. Those are unlikely to exceed 1080px unless the family strip or navigation wraps unusually.

### 1440x900: Medium

This viewport also keeps the desktop three-column grid. The page should often fit, but it has less margin for the second summary-grid row, hero, nav, and panel chrome. If Agenda uses multiple groups, Tasks uses multiple groups, Motivation has a celebration, Lists has four items plus +N more, and quick-status is visible, scrolling becomes plausible.

### 1366x768: High

Static risk is high for a no-scroll laptop goal. The 900px breakpoint does not activate at 1366px, so Home keeps the three-column grid and still needs a second row for the fourth card. The available vertical space after browser chrome, app padding, navigation, workspace panel padding, hero, and summary-grid gap is tight. The bounded list counts prevent runaway height, but they do not guarantee the two-row card layout fits.

## Top Improvement Candidates

1. **Make the desktop summary grid place all four cards in one vertical row or a denser 2x2 with balanced heights**
   - Impact: High
   - Complexity: Medium
   - Reasoning: The current three-column/four-card layout creates a second row with Lists alone, which is a major static height cost.

2. **Reduce Agenda visible limit from 5 to 3 or 4 on Home**
   - Impact: High
   - Complexity: Low
   - Reasoning: Agenda is likely the tallest card because five rows plus group headings can consume substantial height.

3. **Reduce Tasks visible limit from 4 to 3 on Home**
   - Impact: Medium
   - Complexity: Low
   - Reasoning: Tasks has two-line rows and urgency headings, so one fewer visible row can materially reduce height.

4. **Condense grouped headings in Agenda and Tasks**
   - Impact: Medium
   - Complexity: Medium
   - Reasoning: Group headings add vertical rows. Inline bucket/urgency labels could preserve meaning with less height.

5. **Replace empty-state cards with one-line compact empty states on Home**
   - Impact: High when data is empty
   - Complexity: Low
   - Reasoning: Empty-state cards have multiple explanatory lines and are taller than summary content.

6. **Remove or shorten the Lists household context note**
   - Impact: Low
   - Complexity: Low
   - Reasoning: “Shared for N household members” is not essential dashboard information and always adds height.

7. **Change Lists title from “{primaryListName} lists” to a stable compact title such as “Shopping” or “Lists”**
   - Impact: Low
   - Complexity: Low
   - Reasoning: This addresses repeated container naming and improves dashboard clarity, though height impact is small.

8. **Shorten or remove the weather placeholder until real weather data exists**
   - Impact: Low
   - Complexity: Low
   - Reasoning: It consumes a text row in the hero and is explanatory/future-facing.

9. **Use more compact list-row styling inside Home summary cards**
   - Impact: Medium
   - Complexity: Medium
   - Reasoning: Row padding and gaps are substantial for a no-scroll dashboard; a Home-specific compact row variant would reduce all list-heavy cards.

10. **Constrain or simplify the Motivation celebration surface on Home**
    - Impact: Medium
    - Complexity: Medium
    - Reasoning: Celebration status is valuable, but the icon/message surface can become a large block. A single-line status could preserve signal with less height.

## Open Questions Requiring Visual Validation

- Does the four-card desktop grid actually fit without scrolling at 1366x768 with seeded/demo data?
- How many family members cause the hero family strip to wrap on common laptop widths?
- Do long event, task, item, or celebration titles wrap to multiple lines and materially increase card height?
- Does the workspace navigation wrap at 1366px or with browser zoom/default font differences?
- Does the Lists card sitting alone in the second grid row visually feel like wasted space or acceptable breathing room?
- Are the compact icon buttons visually discoverable enough without text labels?
- Are empty states common enough in first-run usage that their height should be optimized immediately?

## Next Prompt Context

Static analysis found that Home is summary-first and bounded, but no-scroll confidence is not yet high for 1366x768. The highest-value next implementation slice would be to reduce summary-grid height and list-row density without reintroducing management-page behavior. Prioritize either changing the desktop grid strategy so all four summary cards use vertical space more efficiently, or reducing visible Agenda/Tasks rows and compacting group headings. Follow-up visual validation should test 1920x1080, 1440x900, and 1366x768 with populated seeded/demo data, several family members, and long item titles.
