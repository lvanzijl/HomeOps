# Executive Summary

- Overall Tasks quality: **8/10**.
- Overall FamilyBoard quality: **8/10**.
- Ready for beta: **Yes**.

Tasks now works as an operational FamilyBoard workspace for the core question: **"What does our family need to do next?"** The page leads with Vandaag, organizes the rest of the work by natural time horizons, and presents task cards as family action objects rather than bare checklist rows.

The MVP is beta-ready, but not finished. The strongest remaining issues are vertical weight, crowded card actions, weak completion closure, and a still-incomplete recurring-task postponement story. Scrolling is acceptable for this workspace, but the first viewport should remain fast and decisive because Tasks is an execution surface, not a dashboard.

# Workflow Assessment

## Today-first organisation

Vandaag is clearly the operational starting point. It appears first, uses the strongest visual treatment, and includes overdue plus due-today items. Browser inspection showed Vandaag at the top of the task groups, with the section beginning at `180.14 px` and containing three cards in the validation dataset.

Strengths:
- The first meaningful section is Vandaag, not templates, administration, or Weekly Reset.
- The copy explains that today is for what needs attention now.
- Overdue tasks stay in Vandaag, which keeps the family focused on what is blocking the day.

Weaknesses:
- With three Today cards, Vandaag measured `599.81 px` high, so the first viewport can become Today-heavy quickly.
- The page header is compact, but it does not explicitly summarize the count of tasks needing attention today.
- The visual priority is clear, but there is no stronger distinction between overdue and simply due today beyond the metadata chip text.

## Time grouping

The time-based organisation is a strong match for family mental models: Vandaag, Morgen, Deze week, Volgende week, Later, and Afgerond. Browser validation confirmed all six sections rendered at both tested viewports.

Strengths:
- The grouping answers "now, next, later" more naturally than project-manager buckets.
- Morgen and Deze week are easy to understand without training.
- Later keeps future or no-date work outside the pressure of today.
- Afgerond preserves recovery/reopen without acting like the main destination.

Weaknesses:
- The page still renders all populated groups in a long vertical sequence; with realistic family data, Later and Afgerond may be far below the fold.
- Volgende week and Later are useful, but they may overlap conceptually for less date-driven families.
- Afgerond on the main operational page is helpful for undo, but can still feel like history in an execution workspace.

## Task completion

Task completion remains direct and operational. The primary card action is Klaar, completed tasks move into Afgerond, and Terugzetten remains available for recovery.

Strengths:
- Klaar is clear, family-friendly Dutch copy.
- The completion action is a large pill-style touch target.
- Completed tasks retain context in Afgerond, supporting accidental-completion recovery.

Weaknesses:
- Completing a task does not produce a strong family-positive moment or clear "what changed" confirmation.
- Afgerond is useful but can add page length if completed history grows.
- Recovery is present, but it is not surfaced as a short-lived undo message near the action.

## Morgen workflow

Morgen now feels like a real, natural postponement action for eligible normal tasks. It is present on overdue/today/future normal cards where useful, hidden for recurring tasks, and absent on tasks already due tomorrow.

Strengths:
- The action matches a common family decision: not today, but tomorrow.
- It is placed beside completion and edit actions on the card, where the decision happens.
- It avoids unsafe recurrence behavior by hiding for recurring tasks.

Weaknesses:
- The validation dataset showed five Morgen buttons across eight cards, which risks making the action visually repetitive.
- The action does not explain why recurring tasks cannot be moved to tomorrow.
- There is no visible confirmation after a task moves into Morgen beyond its section movement.

## Recurring tasks

Recurring tasks are recognisable through recurring card styling and `Herhaalt ...` metadata. The recurring item in browser validation rendered as a recurring card and did not expose Morgen.

Strengths:
- Recurrence is visible at card level, not buried in edit state.
- Recurring tasks avoid unsupported Morgen behavior.
- Routine removal remains available for recurring series.

Weaknesses:
- The recurrence visual still depends on placeholder letter/icon treatments rather than mature FamilyBoard artwork.
- Users may not understand whether completing a recurring task completes one occurrence or affects the routine.
- There is no single-occurrence postpone workflow for recurring chores.

## Weekly Reset relationship

Tasks and Weekly Reset are now appropriately separated. Tasks is the execution workspace; Weekly Reset remains a planning/ritual surface reached through secondary actions and contextual navigation.

Strengths:
- Weekly Reset does not compete with Vandaag.
- The Week plannen and Gezinsreset actions are secondary, which preserves operational focus.
- The Weekly Reset ritual is conceptually complementary: Tasks handles doing; Weekly Reset handles family planning and cleanup.

Weaknesses:
- The task support actions sit after all populated task groups, so Weekly Reset access can be far below the fold.
- Week plannen and Gezinsreset openen may feel like overlapping planning routes.
- Families may not know when to use inline Week plannen versus the full Weekly Reset ritual.

# UX Scorecard

| Area | Score | Strengths | Weaknesses |
| --- | ---: | --- | --- |
| Time organisation | 9/10 | Today-first, natural family time horizons, all requested groups validated | Long vertical sequence; Volgende week/Later distinction may blur |
| Task cards | 8/10 | Warm cards, metadata chips, clear owners, recurrence visible, touch-friendly actions | Cards are tall; action area can feel crowded; placeholder icons remain immature |
| Workflow | 8/10 | Completion, edit, Morgen, recurrence, reopening, and Weekly Reset relationship are coherent | No celebratory or inline undo feedback; recurring postponement remains unresolved |
| Quick actions | 7/10 | Klaar and Morgen are direct, discoverable, and card-local | Too many repeated buttons; disabled/hidden logic needs clearer explanation |
| FamilyBoard identity | 8/10 | Calm Dutch copy, family ownership chips, warm card style, non-enterprise grouping | Still carries some admin/task-manager weight through edit/more/routine controls |

# Remaining UX Issues

1. **High**: Recurring tasks cannot be postponed as a single occurrence, leaving a real family workflow gap.
2. **High**: Task cards are vertically substantial; the validation page reached `2223 px` document height with only eight cards.
3. **High**: Card action density is high, with 29 task action buttons across eight validation cards.
4. **Medium**: Vandaag can become tall quickly; three Today cards measured `599.81 px`.
5. **Medium**: Overdue tasks rely mainly on chip text, not a stronger visual urgency treatment.
6. **Medium**: Completing or postponing a task lacks a visible local confirmation or undo snackbar.
7. **Medium**: Week plannen and Gezinsreset openen may be confusing as two related planning affordances.
8. **Medium**: Afgerond is useful for recovery but may clutter the operational workspace as history grows.
9. **Medium**: The Morgen action can appear on many cards, making it visually repetitive.
10. **Medium**: Placeholder letter icons (`V`, `T`, `R`, `K`) feel less polished than Home, Motivation, Agenda, and Shopping should ultimately feel.
11. **Low**: The header does not summarize today's workload count.
12. **Low**: Volgende week and Later may need clearer copy for families that do not distinguish far-future timing precisely.
13. **Low**: Editing remains modal/dialog based and may feel heavier than a quick operational tweak.
14. **Low**: Routine removal is visible on recurring cards and may feel too destructive near daily completion actions.

# Top 10 Improvements

| Priority | Improvement | Expected impact | Estimated complexity | Scope |
| --- | --- | --- | --- | --- |
| 1 | Design and implement recurring single-occurrence postponement | Closes the largest real-family workflow gap | High | Tasks specific |
| 2 | Reduce task-card action density with a clearer primary/secondary split | Improves speed and reduces visual noise | Medium | Design System |
| 3 | Add local confirmation/undo feedback for complete and Morgen | Builds confidence during fast family use | Medium | Design System |
| 4 | Strengthen overdue treatment inside Vandaag | Makes urgent work impossible to miss | Low | Tasks specific |
| 5 | Add a compact Today workload summary in the header | Improves immediate orientation | Low | Tasks specific |
| 6 | Refine Afgerond into a compact recovery/history affordance | Keeps execution page lighter | Medium | Tasks specific |
| 7 | Clarify Week plannen versus Gezinsreset openen | Reduces planning-route confusion | Low | Tasks specific |
| 8 | Replace placeholder letter icons with production FamilyBoard task icons | Improves warmth and visual consistency | Medium | Design System |
| 9 | Tune card heights and metadata wrapping for dense family days | Preserves speed with larger task sets | Medium | Design System |
| 10 | Add explanatory microcopy for hidden recurring Morgen behavior | Reduces confusion without unsafe recurrence changes | Low | Tasks specific |

# Recommendation

**Ready with Minor Polish**

Tasks is ready for beta as an operational workspace. It answers **"What does our family need to do next?"** by putting Vandaag first, arranging remaining work by human time horizons, and keeping core actions on each card. The MVP preserves completion, recurrence, editing, Weekly Reset relationship, and Morgen behavior for normal tasks.

It should not be considered final UX. The next polish pass should prioritize recurring-task postponement, action-density reduction, stronger overdue treatment, and clearer planning separation. None of those block beta, but they are important before wider household usage.

# Validation

## Preflight result

- `.github/copilot-instructions.md` and `AGENTS.md` were read before review work.
- Required command completed successfully:

```bash
export DOTNET_CLI_HOME=/tmp/dotnet
export PATH="$PATH:$HOME/.dotnet/tools"
dotnet --version
```

- Result: `10.0.301`.

## Browser validation summary

Browser validation was performed against the Vite app at `http://127.0.0.1:5173/` using Playwright/Chromium and route-intercepted API-shaped responses for family members, tasks, templates, and task update actions.

Validated behaviours and surfaces:
- Tasks navigation opened the Tasks workspace.
- Vandaag, Morgen, Deze week, Volgende week, Later, and Afgerond rendered at both target viewports.
- Vandaag rendered first and contained overdue, due-today, and recurring tasks in the validation dataset.
- Rich task cards rendered with metadata chips, action buttons, recurring presentation, and completed presentation.
- Morgen actions were present for eligible normal tasks and hidden for the recurring task and already-tomorrow task.
- Afgerond rendered a completed task with recovery affordance.
- Support actions for Routinestarters, Week plannen, and Gezinsreset openen remained secondary after task groups.

## Viewports tested

| Viewport | Result | Key measurements |
| --- | --- | --- |
| `1366×768` | Pass | Document `2223 px`; Tasks page `2112.19 px`; header `59 px`; Vandaag `599.81 px`; first card `151.56 px`; total cards `8`; task action buttons `29`; Morgen buttons `5`; recurring cards `1`; completed cards `1` |
| `1920×1080` | Pass | Document `2223 px`; Tasks page `2112.19 px`; header `59 px`; Vandaag `599.81 px`; first card `151.56 px`; total cards `8`; task action buttons `29`; Morgen buttons `5`; recurring cards `1`; completed cards `1` |

Section measurements at both viewports:
- Vandaag: `599.81 px`, 3 cards, 10 metadata chips, 11 buttons, 1 recurring card.
- Morgen: `252.53 px`, 1 card, 3 metadata chips, 3 buttons.
- Deze week: `252.53 px`, 1 card, 3 metadata chips, 4 buttons.
- Volgende week: `252.53 px`, 1 card, 3 metadata chips, 4 buttons.
- Later: `252.53 px`, 1 card, 3 metadata chips, 4 buttons.
- Afgerond: `252.53 px`, 1 card, 3 metadata chips, 3 buttons.

## Application startup

- Vite application startup succeeded with `npm run dev -- --host 127.0.0.1` and served `http://127.0.0.1:5173/`.

## git diff --check

- `git diff --check` passed with no whitespace errors.

## Binary artifact confirmation

- No binary files committed.
- No screenshots committed.
- Temporary screenshots removed: no temporary screenshots were created during this review pass.

# Modified Files

- `docs/reports/2026-06-27-tasks-ux-review/tasks-ux-review.md`

# Binary Artifact Check

- No binary files committed.
- No screenshots committed.
- Temporary screenshots removed.
- No PNG, JPG, JPEG, GIF, WEBP, or PDF files were added by this review.
