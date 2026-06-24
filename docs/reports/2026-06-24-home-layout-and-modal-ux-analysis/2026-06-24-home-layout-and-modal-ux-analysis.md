# 2026-06-24 Home Layout and Modal UX Analysis

## Summary

Home is now closer to a true dashboard: quick-create actions are compact card-header controls and the creation UI opens in dialogs instead of occupying permanent dashboard space. The remaining layout issue is the summary grid: four cards are rendered in a three-column grid, which leaves the fourth card on a second row and makes the dashboard height depend on one full-width row plus a partial row.

A balanced 2x2 Home grid is likely the strongest next Home layout for the current card content. It better matches the four summary surfaces, uses horizontal space more evenly, and should reduce perceived vertical imbalance while keeping cards summary-only.

Repository-wide, the strongest modal candidates are Agenda event creation, Motivation family goal creation/editing, personal goal creation/editing, and Tasks task/routine forms. Shopping item entry should generally stay inline on the dedicated shopping/list page because adding multiple items is the primary page workflow. Family member add already uses a dialog from the shell; family member edit should remain inline on the management detail page.

## Home Layout Analysis

### Current layout: 4 cards in a 3-column grid

The current Home summary grid defines three columns: a wide first column and two narrower columns. The rendered card order is Agenda, Tasks, Motivation, then Lists/Shopping. With four cards, the fourth card naturally wraps to its own row.

**Expected behavior:**

- **Height:** The dashboard pays for two card rows even though the second row has only one card. This increases total dashboard height and makes the page more likely to scroll on a normal laptop viewport.
- **Width usage:** The first row uses the full grid, but the second row wastes two column slots. Shopping/Lists appears visually demoted despite being one of the four primary Home summaries.
- **Content fit:** Agenda can use width well because it has grouped event summaries. Tasks and Motivation can tolerate medium-width cards. Shopping does not need a row by itself because it shows only a short active-item summary.

### Alternative layout: 2x2 grid

Recommended order:

| Left | Right |
| --- | --- |
| Agenda | Tasks |
| Shopping | Motivation |

**Expected behavior:**

- **Height reduction:** The number of rows remains two, but the second row becomes fully utilized. The practical height benefit is from reducing wasted visual space and allowing all cards to share comparable widths/heights. If paired with fixed summary limits and compact card padding, it is more likely to fit below the compact hero without scrolling.
- **Width usage:** Two equal columns use the available dashboard width more predictably than the current 1.55fr/0.72fr/0.72fr split. Shopping receives enough width for item names and store hints without monopolizing a row.
- **Information hierarchy:** Agenda and Tasks remain first-row operational priorities. Shopping and Motivation become second-row summaries instead of Motivation appearing before Shopping while Shopping is stranded below.

### Potential disadvantages

- Agenda loses the extra-wide first column currently available in the 3-column layout.
- If Agenda has several day buckets visible, a 2-column card may need tighter summary limits or typography to avoid height growth.
- Motivation celebration copy may compete vertically with Shopping if both are content-heavy.
- Responsive behavior must be explicit: the layout should collapse to one column on small screens and may need a tablet breakpoint distinct from desktop.

### Recommendation

The 2x2 layout is likely the strongest Home layout based on the current content because all four cards are summary cards with explicit item limits. It better satisfies the invariants that Home should be a dashboard, should not scroll on a normal laptop viewport, cards should not scroll, and cards should show summaries only.

## Inline Creation Audit

| Area | Current creation pattern | Estimated screen-space usage | Always visible? | Existing dialog reuse? | Classification |
| --- | --- | ---: | --- | --- | --- |
| Home agenda event | Header icon opens a Home quick-capture dialog. | None until opened; compact dialog when needed. | No. | Uses local Home dialog pattern/backdrop. | Keep modal. |
| Home task | Header icon opens a Home quick-capture dialog. | None until opened; compact dialog when needed. | No. | Uses local Home dialog pattern/backdrop. | Keep modal. |
| Home shopping item | Header icon opens a Home quick-capture dialog with suggestions. | None until opened; compact dialog when needed. | No. | Uses local Home dialog pattern/backdrop. | Keep modal. |
| Agenda page/widget | Full event form is rendered before source filters and event content. | High: six controls plus submit/cancel row. | Yes. | Home event dialog is simpler; no shared generic dialog component yet. | Strong modal candidate. |
| Tasks page - task create/edit | Action button toggles an inline task management section containing a multi-field form. | Medium/high when open. | No, but appears in page flow when opened. | Could reuse Home/dialog shell concepts, but needs full task fields. | Strong modal candidate. |
| Tasks page - routine starter/template | Button toggles a secondary inline panel with template form and list. | Medium/high when open. | No. | No dedicated dialog; could become a management dialog or remain expandable. | Consider modal. |
| Shopping/list page - add item | Inline one-row add-item form immediately under the list header. | Low. | Yes. | Home shopping dialog exists but would be worse for rapid repeated entry. | Keep inline. |
| Shopping/list page - create first list | Empty-state button creates the first list. | Low. | Only in empty state. | Not needed. | Keep inline. |
| Shopping/list page - rename list | Inline rename form in page content. | Low/medium and tied to list management. | Conditional. | No. | Consider modal only if clutter appears. |
| Motivation - family goal | Empty-state button opens inline family goal form below active goal card; edit uses same inline form. | High when open. | No. | Dialog shell exists in Home/family add patterns. | Strong modal candidate. |
| Motivation - personal goal | Header action opens inline personal goal form inside the overview section. | High when open. | No. | No dedicated reusable dialog yet. | Strong modal candidate. |
| Motivation - helpful moments/appreciation | Compact action toggles inline helpful moment form. | Medium/high when open. | No. | Could become dialog, but note capture may benefit from staying close to feed. | Consider modal. |
| Family add from shell/Home | Add family member opens a dialog. | None until opened. | No. | Already dialog-based. | Keep modal. |
| Family member detail edit | Parent administration page has inline edit form. | Medium/high. | Yes on management page. | Avatar editor already uses dialog; edit details are management content. | Keep inline. |
| First-run wizard member add | Wizard step includes inline member form. | Medium. | Yes within onboarding step. | Not appropriate; task-focused setup flow. | Keep inline. |
| Avatar editor | Opens as a modal dialog. | None until opened. | No. | Already dialog-based. | Keep modal. |

## Consistency Review

Home's new modal-based creation pattern should become a broader HomeOps convention for non-primary creation workflows:

**Preferred convention:**

```text
Page title / section title [+]
Content and summaries
Dialog opens only when creation or edit is requested
```

### Benefits

- Reduces permanent page clutter and keeps dashboard/overview pages focused on status and next actions.
- Makes creation discoverable through consistent header or section actions without dedicating large layout regions to forms.
- Helps Home, Agenda, Tasks, and Motivation preserve summary-first presentation.
- Supports dedicated pages remaining responsible for deeper management after the modal captures a focused action.

### Risks

- Dialog proliferation could create inconsistent keyboard, focus, and escape-key behavior unless a shared dialog primitive is introduced.
- Forms with frequent repeated entry can become slower if every item requires opening a modal.
- Complex edit flows may feel cramped in a modal unless content and validation are carefully scoped.
- Mobile layouts need extra care because full-screen or bottom-sheet patterns may be better than centered dialogs.

### Where modal usage is inappropriate

- Primary execution flows, such as repeatedly adding shopping items to a shopping list.
- Onboarding wizard steps where the user is explicitly in setup mode.
- Dedicated management/detail pages where editing is the purpose of the page, such as family member administration.
- Dense review/planning workflows where users need to compare form inputs with surrounding content continuously.

## Recommended Roadmap

1. **Home 2x2 layout**
   - Change Home summary grid to a balanced 2-column desktop layout with Agenda | Tasks and Shopping | Motivation.
   - Keep one-column behavior for narrow screens.
   - Preserve summary limits and avoid card-internal scrolling.

2. **Shared dialog primitive**
   - Introduce a reusable dialog/backdrop component before converting more pages.
   - Standardize `role="dialog"`, `aria-modal`, labels, close action, focus behavior, and visual sizing.

3. **Agenda event form modal conversion**
   - Replace always-visible Agenda event form with a header `Add event` action and modal creation/editing.
   - Keep Agenda page content focused on view controls, source filters, and event lists.

4. **Motivation forms modal conversion**
   - Move family goal create/edit and personal goal create/edit into dialogs.
   - Keep active goal, personal goal summaries, celebration memories, and appreciation feed visible by default.

5. **Tasks task form modal conversion**
   - Convert task create/edit to a dialog from the existing `Add family task` action.
   - Consider leaving routine starters as an expandable management panel until routine workflows are clearer.

6. **Helpful moments follow-up**
   - Evaluate after Motivation forms are converted. Convert to modal only if the inline appreciation form still creates clutter.

## Changes Explicitly Not Recommended

- Do not move shopping item entry on the dedicated shopping/list page into a modal; rapid repeated entry is core to that page.
- Do not hide family member edit details behind a modal on the family member management page.
- Do not convert first-run wizard member add forms to modals.
- Do not add scrollable Home cards to compensate for layout height.
- Do not expand Home cards into management/detail surfaces; Home should remain summary-only.
- Do not introduce a one-off modal implementation per page before extracting a shared dialog primitive.

## Next Prompt Context

This was analysis-only plus a markdown report. No application was started, no browser was used, no screenshots were generated, and no code files were modified.

Recommended next implementation slice:

1. Add a shared dialog component/pattern if none exists.
2. Change Home to a 2x2 desktop summary grid.
3. Validate Home does not scroll on a normal laptop viewport through static CSS review and existing tests; use visual/browser validation only if a later prompt allows starting the app.

After that, the highest-value modal conversion is Agenda event creation/editing, followed by Motivation family/personal goal forms, then Tasks task create/edit.
