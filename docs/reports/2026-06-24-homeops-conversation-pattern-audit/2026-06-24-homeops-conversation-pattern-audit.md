# HomeOps Conversation Pattern Audit

## Summary

Static inspection found that the new conversational interaction language is present in the Tasks create/edit dialog, partly present in Home quick-capture dialogs, and not yet present across most other create/edit flows. The largest opportunities are Agenda event creation, Motivation goal creation, Helpful Moments appreciation capture, and family member add/edit because these flows are frequent, family-facing, and currently expose several fields at once.

The audit recommends migrating high-frequency family planning and encouragement creation flows first, while keeping execution-heavy list entry, child-mode exploration, weekly reset review cards, avatar editing, and destructive/admin settings as inline or dedicated management experiences.

## Interaction Pattern Definition

Use the conversational dialog pattern when a family-facing create/edit action benefits from guidance, smart defaults, and a calm single decision at a time.

Reference traits:

- One primary question per step.
- Smart defaults for dates, ownership, units, and optional values.
- Optional details are deferred to the end.
- Compact transitions such as Back, Continue, Save, and summary confirmation.
- Friendly family-first language instead of admin labels.
- No generic dialog framework is assumed yet; each conversion can remain flow-specific.

Keep a workflow inline when it is rapid execution, repeated item entry, review/triage, live visual editing, or page navigation. Keep a dedicated management page when the work is clearly administrative, destructive, import/export oriented, or requires dense controls.

## Workflow Audit

### Home dialogs

- **Current interaction style:** Compact quick-capture dialogs for shopping, task, and agenda event capture. Each is a small modal with one or two fields and friendly quick-capture copy.
- **Old form/admin feel:** Low. They are already lightweight, but still use field labels and Save-first form language.
- **Conversational fit:** Partial. Home task and shopping capture should stay ultra-fast; Home agenda can become a tiny two-step conversational capture only if it does not slow down quick entry.
- **Expected value:** Medium for Agenda; low for shopping/task because speed matters more than ceremony.
- **Complexity:** Low to medium.
- **Risks:** Over-converting Home quick capture could make frequent capture feel slower.
- **Classification:** Already aligned for task/shopping quick capture; Consider later for Home agenda capture.

### Agenda create/edit

- **Current interaction style:** Modal form with title, description, start, end, all-day toggle, and submit button.
- **Old form/admin feel:** High. It exposes event mechanics immediately.
- **Conversational fit:** Strong. Start with “What is happening?”, then “When is it?”, with all-day and description as optional final details.
- **Expected value:** High due to frequency and visible consistency with Tasks.
- **Complexity:** Medium. Date/time validation and all-day conversion need careful handling.
- **Risks:** Calendar users may need precise timed events; conversion must preserve full control without hiding required end-time validation.
- **Classification:** Adopt conversational dialog now.

### Tasks create/edit

- **Current interaction style:** Newly conversational dialog with title, owner, date, and extras steps.
- **Old form/admin feel:** Low in the primary create/edit path. Template management remains a compact form, which is acceptable as a secondary management flow.
- **Conversational fit:** Already implemented for task create/edit.
- **Expected value:** Already realized.
- **Complexity:** None for primary flow; low if polishing prompt copy.
- **Risks:** The separate quick due-date prompt is an older browser-native interaction and should be removed or absorbed later.
- **Classification:** Already aligned for create/edit; Consider later for quick due-date prompt; Keep as management page for routine starter/template management.

### Motivation family goals

- **Current interaction style:** Dialog form with title, target count, progress label, optional celebration title, and optional celebration description.
- **Old form/admin feel:** Medium to high. The surrounding page is warm, but goal creation still feels like filling a record.
- **Conversational fit:** Strong. A family goal naturally maps to: “What are we working toward?”, “How will we measure it?”, “What should we look forward to?”
- **Expected value:** High because this is central to HomeOps’ family-first identity.
- **Complexity:** Medium. Needs defaults for count/unit and optional celebration summary.
- **Risks:** Must preserve existing progress when editing and avoid making numeric targets feel vague.
- **Classification:** Adopt conversational dialog now.

### Motivation personal goals

- **Current interaction style:** Dialog form with family member, goal title, target count, and unit label.
- **Old form/admin feel:** Medium. The purpose is encouraging, but the form reads as data entry.
- **Conversational fit:** Strong for creation; editing can use a shorter review-adjust flow.
- **Expected value:** High for child/family identity consistency.
- **Complexity:** Medium. Requires member-first or goal-first ordering and sensible defaults.
- **Risks:** Personal goals can be managed in batches; too much ceremony could slow parent setup.
- **Classification:** Adopt conversational dialog now for create/edit, while preserving management overview inline.

### Helpful moments

- **Current interaction style:** Inline compact form with member, what happened, recognition tag, and warm note.
- **Old form/admin feel:** Medium. The copy is warm, but the inline form exposes all fields at once.
- **Conversational fit:** Strong for “Add appreciation.” A conversational pattern reinforces emotional tone: who, what happened, what kind of help, optional warm note.
- **Expected value:** High because appreciation is emotionally central and family-facing.
- **Complexity:** Low to medium.
- **Risks:** Inline compact creation is convenient; conversion should remain quick and not bury the recognition tag.
- **Classification:** Adopt conversational dialog now.

### Shopping/list workflows

- **Current interaction style:** Inline add item form, checkbox completion, grouped item list, per-item store details, and collapsible list settings.
- **Old form/admin feel:** Low for adding/checking items; medium for list settings.
- **Conversational fit:** Weak for item execution; possible later for first-list creation or list setup.
- **Expected value:** Low for add/toggle; medium for list settings if list management grows.
- **Complexity:** Low for first-list setup; medium for broader list management.
- **Risks:** Shopping is a rapid repeated-entry flow. Conversational dialogs would add friction.
- **Classification:** Keep inline for item add/toggle/store; Keep as management page/section for list settings; Consider later for first-list setup.

### Family member management

- **Current interaction style:** Add family member modal and Parent Mode edit form with name, type, date of birth, display color, avatar, and removal.
- **Old form/admin feel:** High by design, especially Parent Mode.
- **Conversational fit:** Strong for adding a family member; weak for Parent Mode admin editing/removal.
- **Expected value:** Medium to high for add flow because onboarding and Home family identity depend on it.
- **Complexity:** Medium. Child date-of-birth requirement and color defaults need step logic.
- **Risks:** Family member management has durable identity data; conversion must not obscure required child fields or destructive removal.
- **Classification:** Adopt conversational dialog now for add family member; Keep as management page for Parent Mode edit/removal.

### Avatar editing

- **Current interaction style:** Dedicated visual editor with live preview, asset tiles, swatches, Save/Cancel/Reset.
- **Old form/admin feel:** Low. It is a creative tool rather than an admin form.
- **Conversational fit:** Weak. Users need simultaneous preview and choice grids.
- **Expected value:** Low.
- **Complexity:** High if converted, with likely UX regression.
- **Risks:** Step-by-step avatar choices would hide comparison and weaken visual editing.
- **Classification:** Keep as management page/dedicated editor.

### Onboarding

- **Current interaction style:** Multi-step wizard: welcome, adults, children, review, finish. Member entry within adult/child steps is inline.
- **Old form/admin feel:** Medium. Wizard structure is friendly but member entry is still form-like.
- **Conversational fit:** Moderate. Onboarding already asks one broad topic at a time; member add inside each step could be more conversational.
- **Expected value:** Medium because first-run tone matters, but onboarding is infrequent.
- **Complexity:** Medium.
- **Risks:** Must not block setup for childless households or make multiple-member entry tedious.
- **Classification:** Consider later.

### Settings/profile pages

- **Current interaction style:** Settings currently surface calendar export/restore administration. Profile-like family member details live under Family Member Parent Mode.
- **Old form/admin feel:** Appropriate. Export/restore is a destructive administrative workflow and uses explicit confirmation.
- **Conversational fit:** Weak.
- **Expected value:** Low.
- **Complexity:** Low to medium, but not worth it.
- **Risks:** Conversational language could soften destructive restore warnings and reduce clarity.
- **Classification:** Keep as management page.

### Weekly reset

- **Current interaction style:** Dedicated review page with cards and direct Keep/Later/Archive actions.
- **Old form/admin feel:** Low to medium. It is a review board, not a creation form.
- **Conversational fit:** Moderate for a future guided reset, but current card triage should remain visible.
- **Expected value:** Medium later.
- **Complexity:** Medium to high because reset spans tasks, goals, shopping, and wins.
- **Risks:** A wizard could hide cross-domain context needed for family planning.
- **Classification:** Consider later.

### Calendar portability

- **Current interaction style:** Dedicated admin widget for export, JSON import, destructive confirmation, and restore status.
- **Old form/admin feel:** High, intentionally.
- **Conversational fit:** Weak.
- **Expected value:** Low.
- **Complexity:** Medium.
- **Risks:** Friendly conversational flow could under-emphasize destructive restore semantics.
- **Classification:** Keep as management page.

### Domain placeholder pages

- **Current interaction style:** Static placeholder pages for future surfaces.
- **Old form/admin feel:** Not applicable.
- **Conversational fit:** Not applicable until real flows exist.
- **Expected value:** None now.
- **Complexity:** None.
- **Risks:** None.
- **Classification:** Keep inline.

## Classification Table

| Workflow | Current style | Classification | Expected value | Complexity | Primary risk |
|---|---|---:|---:|---:|---|
| Tasks create/edit | Conversational modal | Already aligned | High realized | None | Browser prompt remains elsewhere |
| Home shopping quick capture | One-field quick modal | Already aligned | Low | Low | Slowing repeated capture |
| Home task quick capture | One-field quick modal | Already aligned | Low | Low | Duplicating full Tasks dialog |
| Home agenda quick capture | Compact modal with date choice | Consider later | Medium | Low-Med | Overcomplicating Home |
| Agenda create/edit | Dense modal form | Adopt conversational dialog now | High | Medium | Preserving precise time controls |
| Motivation family goal | Dense dialog form | Adopt conversational dialog now | High | Medium | Numeric target clarity |
| Motivation personal goals | Dense dialog form | Adopt conversational dialog now | High | Medium | Batch management friction |
| Helpful moments | Inline form | Adopt conversational dialog now | High | Low-Med | Losing quick appreciation entry |
| Add family member | Dense modal form | Adopt conversational dialog now | Med-High | Medium | Required child DOB and identity accuracy |
| Family member Parent Mode | Admin form | Keep as management page | Low | Low | Hiding durable profile fields |
| Avatar editing | Visual editor | Keep as management page | Low | High | Hiding visual comparison |
| Shopping item add/toggle | Inline execution | Keep inline | Low | Low | Dialog friction |
| Shopping store details | Inline details | Keep inline | Low | Low | Store edits become too slow |
| Shopping list settings | Details management | Keep as management page | Low-Med | Low | Destructive archive/delete clarity |
| Onboarding | Wizard plus inline member add | Consider later | Medium | Medium | Multiple-member entry friction |
| Weekly reset | Review dashboard | Consider later | Medium | Med-High | Losing cross-domain overview |
| Calendar export/restore | Admin widget | Keep as management page | Low | Medium | Softening destructive warnings |
| Domain placeholders | Static pages | Keep inline | None | None | None |

## Ranked Migration Roadmap

1. **Agenda create/edit** — Highest consistency win after Tasks; frequent family planning flow; reduces visible form mechanics while preserving optional details.
2. **Motivation family goal create/edit** — Strong family-first value; converts a central encouragement flow from record entry into shared intention setting.
3. **Helpful moments appreciation capture** — High emotional payoff; aligns “we noticed you” language with a guided appreciation moment.
4. **Motivation personal goal create/edit** — Strong child/family identity fit; migrate after family goal so shared language is established.
5. **Add family member dialog** — Improves first Home identity setup; keep durable profile editing in Parent Mode.
6. **Home agenda quick capture** — Consider a very small conversational variant only after Agenda conversion proves the pattern for dates.
7. **Onboarding member add steps** — Later, because onboarding is infrequent and already step-based.
8. **Weekly reset guided mode** — Later exploration; keep card overview as the default until a guided reset can preserve cross-domain context.
9. **Shopping first-list setup** — Optional later polish; do not convert normal item entry.

## Keep Inline / Do Not Convert

- **Shopping item add, checkbox completion, undo, and store edits:** These are high-frequency execution actions where speed and list visibility matter more than guided questions.
- **Avatar editing:** Keep the dedicated visual editor because simultaneous comparison and live preview are core to the task.
- **Family member Parent Mode edit/removal:** Keep as management because it edits durable identity data and contains destructive removal.
- **Calendar export/restore:** Keep as administration with explicit warning and confirmation.
- **Weekly reset card overview:** Keep visible as the default review surface; revisit a guided mode only as an optional layer.
- **Task routine starters/templates:** Keep as secondary management until templates become a family-facing creation flow.

## Risks

- **Pattern overuse:** Converting rapid execution flows could make HomeOps feel slower and more ceremonial.
- **Hidden complexity:** Date/time, recurrence, destructive actions, and identity records still need explicit controls and validation.
- **Accessibility consistency:** New bespoke dialogs must preserve focus management, Escape behavior, headings, labels, and summary text.
- **Copy drift:** Each bespoke conversion can diverge unless shared language rules are documented before a generic framework exists.
- **Regression risk around editing:** Edit flows must prefill answers, preserve existing progress, and avoid accidental resets.

## Next Prompt Context

Recommended next implementation slice: convert **Agenda create/edit** to the HomeOps conversational dialog pattern without introducing a generic dialog framework.

Scope for the next prompt:

- Keep Agenda widget/page structure intact.
- Replace only the event create/edit modal body with a flow-specific conversational dialog.
- Suggested steps:
  1. “What is happening?” — title.
  2. “When is it?” — Today/Tomorrow/Pick date/time, all-day default where appropriate.
  3. “Any details?” — optional description, all-day/timed precision, summary.
- Preserve existing validation, create/update/delete API calls, Escape close behavior, and existing tests.
- Do not convert source filters, week/month views, or calendar portability.
