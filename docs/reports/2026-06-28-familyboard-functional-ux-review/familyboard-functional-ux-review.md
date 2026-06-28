# FamilyBoard Functional UX Review

## Summary

This first Functional UX Review used the official `VisualReview` runtime and fixture endpoints. The review was interaction-based: navigation, form entry, submit/cancel attempts, list actions, dialog opening, fixture resets, and settings export/restore boundary checks were exercised through the browser UI without Playwright route interception or mocked responses.

Overall recommendation: **Needs another functional iteration**.

FamilyBoard is visually ready, but functional readiness is uneven. Core navigation, populated home state, page discovery, and many primary entry points are understandable. However, several family-critical flows are not yet dependable enough for Friends & Family: task creation uses a multi-step dialog whose final outcome is hard to confirm, Agenda event editing is not discoverable from populated events, some interaction affordances are ambiguous because they expose generic labels such as `Meer`/`Weg`, and Weekly Reset reads more like a review surface than a clearly executable ritual.

The review did **not** modify production code, CSS, or tests. The only permanent repository artifact created by this task is this markdown report.

## Preflight

Read before runtime work:

- `.github/copilot-instructions.md`
- `AGENTS.md`
- `docs/reports/2026-06-28-familyboard-authoritative-visual-review-round-2/familyboard-authoritative-visual-review-round-2.md`
- `docs/reports/2026-06-28-avatar-editor-ux-architecture-review/avatar-editor-ux-architecture-review.md`
- `docs/development/visual-review-runtime.md`
- `docs/reports/2026-06-28-visual-review-runtime/visual-review-runtime.md`

Preflight command result:

```bash
export DOTNET_CLI_HOME=/tmp/dotnet
export PATH="$PATH:$HOME/.dotnet/tools"
dotnet --version
# 10.0.301
```

## Runtime validation

VisualReview API was started with the official runtime command:

```bash
export DOTNET_CLI_HOME=/tmp/dotnet
export PATH="$PATH:$HOME/.dotnet/tools"
ASPNETCORE_ENVIRONMENT=VisualReview \
  dotnet run --project src/HomeOps.Api/HomeOps.Api.csproj \
  --no-launch-profile \
  --urls 'http://127.0.0.1:5108;http://127.0.0.1:5152'
```

Vite was started against VisualReview:

```bash
cd src/HomeOps.Client
VITE_HOMEOPS_API_BASE_URL=http://127.0.0.1:5108 npm run dev -- --host 127.0.0.1 --port 5173
```

Endpoint validation:

- `GET /health`: **PASS**, returned `{"status":"Healthy"}`.
- `GET /api/visual-review-fixtures/scenarios`: **PASS**, returned `visual-full`, `visual-mixed`, `visual-empty`, `visual-child-young`, `visual-child-older`, `visual-weekly-reset`, and `visual-shopping-lifecycle`.

Runtime warnings:

- `npm run dev` emitted the existing warning `Unknown env config "http-proxy"`.
- Browser dependency installation through `npx playwright install-deps chromium` completed, but `apt-get update` warned that the external `mise.jdx.dev` source returned `403 Forbidden`. Ubuntu package indexes and browser dependencies installed sufficiently for browser execution.

## Fixture validation

Initial reset:

```bash
curl -sS -m 10 -X POST http://127.0.0.1:5108/api/visual-review-fixtures/visual-full/reset
```

Result:

```json
{"scenarioName":"visual-full","anchorUtc":"2026-06-21T09:00:00+00:00","familyMembers":4,"tasks":10,"lists":2,"listItems":6,"familyGoals":1,"individualGoals":2,"helpfulMoments":5,"events":2}
```

Populated state verified before scenario testing:

- Home showed populated Agenda, Tasks, Motivation, and Shopping cards.
- Agenda showed populated Month/Week/List views and visible calendar categories.
- Tasks showed overdue/open task cards and the contextual `Gezinsreset openen` entry point.
- Shopping showed populated store groups and recent items.
- Motivation showed the family goal, appreciation entries, celebration/history affordances, and personal-goal entry point.
- Settings showed agenda backup/export and restore controls.

Weekly Reset reset:

```bash
curl -sS -m 10 -X POST http://127.0.0.1:5108/api/visual-review-fixtures/visual-weekly-reset/reset
```

Used only for Weekly Reset testing.

## Scenario coverage table

| Scenario | Attempted | Completed | Result |
|---|:---:|:---:|---|
| 1. Navigation | Yes | Yes | Pass with minor clarity friction. |
| 2. Tasks | Yes | Partial | Fail: core actions exist, but add/edit/delete/recovery feedback and sequencing are not clear enough. |
| 3. Agenda | Yes | Partial | Fail: add and view switching are reachable; existing-event editing is not discoverable/functionally reachable. |
| 4. Shopping | Yes | Partial | Pass with medium friction: add/check/remove patterns exist, but store assignment and undo discoverability are weak. |
| 5. Motivation | Yes | Partial | Pass with medium friction: add flows are reachable, but outcome feedback and goal/progress control meaning are not always clear. |
| 6. Family Member / Avatar | Yes | Partial | Pass with medium friction: avatar editing is reachable and cancellable/savable; family-member field editing is less discoverable. |
| 7. Weekly Reset | Yes | Partial | Fail: reachable from context, but behaves mostly like a review/ritual surface, not a clearly executable workflow. |
| 8. Settings | Yes | Partial | Pass: export/restore surfaces are understandable up to safe file-selection boundary. |

## Scenario results

### 1. Navigation

- Starting page: Home.
- User goal: reach Home, Agenda, Tasks, Shopping, Motivation, Settings, and Weekly Reset from its contextual entry point.
- Steps performed:
  1. Opened Home after `visual-full` reset.
  2. Clicked Agenda, Tasks, Shopping, Motivation, and Settings navigation entries.
  3. Opened Tasks and used `Gezinsreset openen` as the contextual Weekly Reset entry point.
- Expected outcome: each major surface is reachable and the user can understand where they are.
- Observed outcome: all major surfaces were reachable. The primary pages use consistent headings and product language. Weekly Reset is reachable from Tasks, which is contextually sensible. Settings is represented by both a gear and `Instellingen`, which is understandable once noticed but less direct than the other page labels.
- Pass/fail: **Pass**.
- Friction: Low.
- Severity if failed: n/a.

### 2. Tasks

- Starting page: Tasks after `visual-full` reset.
- User goal: add a task, edit a task, complete a task, reopen a completed task, move an eligible task to tomorrow, open `Meer`, and remove/delete a recurring routine if safely possible.
- Steps performed:
  1. Clicked `Gezinstaak toevoegen`.
  2. Typed a new task title.
  3. Continued through the task add dialog flow.
  4. Opened `Meer` on existing task cards.
  5. Attempted edit via the exposed secondary menu action.
  6. Clicked `Klaar`, attempted reopening from the completed area, clicked `Morgen`, and attempted removal from `Meer`.
- Expected outcome: task creation should end with a visible new task or a clear success message; edit should be discoverable from `Meer`; complete/reopen/tomorrow should produce obvious state changes; destructive removal should be clear and recoverable.
- Observed outcome: the task page exposes the required concepts, but the flow is not yet confidently usable. `Gezinstaak toevoegen` opens a conversational/multi-step task surface, but the user has to infer the next step and success is not strongly confirmed. `Meer` is discoverable as a secondary action but does not explain consequences before opening. `Klaar` and `Morgen` are visible on each task, but repeated overdue cards make it difficult to know which instance changed after clicking. Reopen is present conceptually via the completed section, but not obvious enough as a recovery path. Removing a recurring routine was not safely completed because the fixture state needed to remain usable and the consequence of deletion/removal was not sufficiently clear from the interaction surface.
- Pass/fail: **Fail** for Friends & Family readiness.
- Friction: High.
- Severity if failed: **High** — tasks are a core family workflow.

### 3. Agenda

- Starting page: Agenda after `visual-full` reset.
- User goal: add an event, edit/delete an event if supported, switch Month/Week/List, filter calendar categories, and verify whether existing-event editing is discoverable and functional.
- Steps performed:
  1. Switched `Maand`, `Week`, and `Lijst`.
  2. Clicked `Gebeurtenis toevoegen` and attempted event creation.
  3. Clicked populated and newly-created event text where available.
  4. Toggled visible category labels such as `Gezin`, `School`, `TV-series`, and `Verjaardagen`.
- Expected outcome: view switching should be clear; add should confirm success; existing events should open a detail or edit flow; delete/cancel should be reachable if supported; filters should visibly affect the event set or provide state feedback.
- Observed outcome: Month/Week/List switching is understandable and populated. Add Event is reachable. Existing-event editing remains the major functional gap: populated event entries do not expose an obvious edit affordance in the reviewed views. This matches the prior visual review's inability to open Edit Event, but this review classifies it functionally as a **hidden/discoverability problem or unsupported workflow**. Because users can see events but cannot clearly edit them, the current Agenda feels read-mostly after creation. Category filtering is discoverable, but the result state is subtle; users may not understand whether a category is enabled or disabled without comparing the event list.
- Pass/fail: **Fail**.
- Friction: High.
- Severity if failed: **High** — calendar correction/editing is a core family planning need.

### 4. Shopping

- Starting page: Shopping after `visual-full` reset.
- User goal: add an item, verify it appears, assign/change store if supported, check off, undo check-off, remove, undo remove if supported, expand/collapse store groups, and use another section if exposed.
- Steps performed:
  1. Typed a new item in `Nieuw item voor Boodschappen`.
  2. Clicked `Toevoegen`.
  3. Used item-level `Meer`, `Weg`, and completed/recently removed sections.
  4. Inspected store groups and `Andere lijsten` / `Lijst beheren` areas.
- Expected outcome: new item should appear immediately; check-off and undo should be visible; remove and restore should be recoverable; store assignment should be obvious if supported; other list sections should be understandable.
- Observed outcome: Shopping is closer to usable than Tasks/Agenda. Quick add is discoverable and item grouping by store is understandable. The main issues are terminology and recovery clarity. `Weg` is short but ambiguous for a destructive/remove action, and undo/restore is not as visible as the action that removes the item. Store assignment/change was not clearly exposed from the primary quick-add path. `Andere lijsten` is visible, but in the populated fixture it reports no other lists, so that part could only be inspected, not meaningfully exercised.
- Pass/fail: **Pass with medium friction**.
- Friction: Medium.
- Severity if failed: n/a.

### 5. Motivation

- Starting page: Motivation after `visual-full` reset.
- User goal: add appreciation, add personal goal, interact with goal/progress controls if supported, and inspect celebration/memory interaction if supported.
- Steps performed:
  1. Opened `Waardering toevoegen`.
  2. Entered appreciation text and attempted save.
  3. Opened `Persoonlijk doel toevoegen`.
  4. Entered personal-goal content and attempted save.
  5. Opened/inspected `Familiedoel aanpassen`, `Historie bekijken`, and `Doelen beheren` where reachable.
- Expected outcome: additions should produce visible confirmation or visible new content; goal/progress controls should explain what changed; celebration/history should make it clear whether the user is viewing, editing, or confirming a memory.
- Observed outcome: the page is understandable at the top level: family goal, appreciations, celebrations, and statistics are findable. Add flows are exposed with plain labels. Feedback after changes is weaker than ideal; the user has to scan the page to understand what changed. Goal/progress controls read partly as management surfaces rather than concrete family actions, and celebration/history interactions are more inspectable than actionable.
- Pass/fail: **Pass with medium friction**.
- Friction: Medium.
- Severity if failed: n/a.

### 6. Family Member / Avatar

- Starting page: Home, then Family Member details for Alex.
- User goal: open family-member details, edit fields if supported, open Avatar Editor, change hair/clothing/accessory/colors, cancel and verify changes do not persist, reopen and save a change, and verify saved avatar change is visible.
- Steps performed:
  1. Clicked a family member from Home.
  2. Inspected details/parent-mode/edit affordances.
  3. Opened `Avatar bewerken`.
  4. Selected representative hair, clothing, accessory, and color options.
  5. Clicked `Annuleren` and reopened the editor.
  6. Reapplied a clothing/avatar change and clicked save.
- Expected outcome: details page should expose safe editing; avatar changes should preview immediately; cancel should discard; save should persist visibly on the member page.
- Observed outcome: opening the member detail and avatar editor is discoverable. Avatar editing supports direct manipulation and clear cancel/save controls. Cancel behavior is understandable because the editor closes without committing. Saving a change is functionally understandable, but final verification relies on visually recognizing the avatar, not on explicit success feedback. Family-member field editing is less obvious than avatar editing; it is not the primary blocker, but the path is not as direct as the avatar path.
- Pass/fail: **Pass with medium friction**.
- Friction: Medium.
- Severity if failed: n/a.

### 7. Weekly Reset

- Starting page: Tasks after `visual-weekly-reset` reset.
- User goal: open Weekly Reset, understand first action, process at least one task decision, process at least one goal decision, skip/cancel if supported, complete/close if supported, and verify final state/confirmation.
- Steps performed:
  1. Reset to `visual-weekly-reset`.
  2. Opened Tasks.
  3. Clicked `Gezinsreset openen`.
  4. Inspected task/goal decision areas and attempted available decision labels such as tomorrow/next-week/skip/done/close where exposed.
- Expected outcome: Weekly Reset should guide the family through an executable sequence with a clear first action, visible decisions, skip/cancel options, completion, and final confirmation/state change.
- Observed outcome: Weekly Reset is reachable and populated, but it does not yet read like a dependable executable ritual. It is strongest as a review/planning surface: users can inspect what needs attention, but the first required action and completion model are not clear enough. Decision controls do not consistently communicate whether a task/goal has been processed, skipped, postponed, or completed. Final confirmation is not strong enough to make the family feel the ritual is finished.
- Classification: **Mostly a review/ritual surface rather than a fully executable workflow**.
- Pass/fail: **Fail**.
- Friction: High.
- Severity if failed: **High** — Weekly Reset is a named family workflow and currently lacks strong sequencing/closure.

### 8. Settings

- Starting page: Settings after `visual-full` reset.
- User goal: create backup/export if supported, verify feedback, inspect restore to file-selection boundary, avoid arbitrary imports, and verify restore confirmation if safely reachable.
- Steps performed:
  1. Opened Settings.
  2. Clicked `Agenda exporteren`.
  3. Inspected backup status text.
  4. Opened/inspected `Back-upbestand kiezen` up to the file-selection boundary.
  5. Verified restore remains gated by file selection and explicit acknowledgement copy.
- Expected outcome: export should provide feedback; restore should clearly explain replacement behavior and prevent accidental import.
- Observed outcome: Settings is one of the clearer flows. Backup/export copy is understandable. Restore correctly communicates that it replaces the current family agenda and is gated by choosing a backup file. No arbitrary file was imported.
- Pass/fail: **Pass**.
- Friction: Low.
- Severity if failed: n/a.

## Functional issues

| Severity | Page/system | Issue | Observed evidence | Impact |
|---|---|---|---|---|
| High | Agenda | Existing-event editing is not discoverable/functionally reachable from populated Agenda views. | Month/Week/List and populated events were exercised; clicking visible event text did not reveal an obvious edit/delete workflow. | Families cannot confidently correct calendar mistakes after events exist. |
| High | Weekly Reset | Ritual lacks clear executable sequencing and final completion feedback. | Opened from `Gezinsreset openen` after `visual-weekly-reset`; the surface communicates review/planning better than step-by-step decisions and closure. | A family may not know what to do first or when the weekly ritual is done. |
| High | Tasks | Task add/edit/action feedback is too subtle for repeated task cards. | `Gezinstaak toevoegen`, `Meer`, `Klaar`, `Morgen`, and completed/recovery areas were exercised; repeated overdue task names made changed state hard to identify. | Core chore management can feel unreliable even when actions exist. |
| Medium | Shopping | Remove/recovery wording is terse and store changes are not obvious. | `Weg`, `Meer`, active store groups, completed/recently removed sections, and quick-add were inspected. | Users may remove items without understanding recovery or may fail to assign the desired store. |
| Medium | Motivation | Add flows lack strong success feedback. | Appreciation and personal-goal entry points were opened and submitted/attempted; the page requires scanning to see what changed. | Users may duplicate entries or doubt whether encouragement/goals were saved. |
| Medium | Family Member / Avatar | Avatar save confirmation is implicit. | Avatar options were changed, cancelled, reopened, changed again, and saved; success relies on recognizing visual avatar state. | Mostly acceptable, but parents may be unsure whether a child's avatar change persisted. |
| Low | Navigation | Settings is less direct than other top-level nav entries. | Other pages use clear domain buttons; Settings uses a gear plus label. | Minor discoverability friction, especially for non-technical family members. |

## Cross-product interaction issues

1. **Success feedback is inconsistent.** Settings communicates restore risk clearly, while Tasks, Motivation, and Avatar rely more on visual state changes.
2. **Recovery is uneven.** Tasks and Shopping both expose recovery concepts, but the path is not as prominent as the destructive or completion actions.
3. **Generic secondary labels hide consequence.** `Meer` is useful for compactness, but users must open it before knowing whether it contains edit, delete, defer, or management actions.
4. **Repeated fixture items make state changes hard to perceive.** Multiple `Reset backpack station`, `Fold laundry basket`, and similar repeated task cards make it difficult to confirm which item changed after an action.
5. **Review surfaces and executable workflows are blurred.** Weekly Reset and Motivation history/goal areas sometimes read as informational panels rather than guided workflows.

## Prioritized punch list

### Must fix before Friends & Family

1. Page/system: Agenda.
   - Issue: Existing-event edit/delete is not discoverable or confidently functional.
   - Observed evidence: Populated Agenda Month/Week/List views and event text were interacted with, but no obvious edit/delete path appeared.
   - Impact: Families cannot correct event details, which seriously damages calendar trust.
   - Estimated complexity: Medium.

2. Page/system: Weekly Reset.
   - Issue: No clear first action, processed state, skip/cancel model, or final completion confirmation.
   - Observed evidence: `visual-weekly-reset` opened from Tasks, but the surface behaved mostly as a review/planning page.
   - Impact: A named weekly ritual may fail in real family use because users do not know how to finish it.
   - Estimated complexity: Medium to Large.

3. Page/system: Tasks.
   - Issue: Task action feedback and recovery are not clear enough for repeated task instances.
   - Observed evidence: Add, `Meer`, `Klaar`, `Morgen`, completed/reopen, and remove paths were attempted; visible state changes were hard to attribute.
   - Impact: Core chore workflow may feel unreliable.
   - Estimated complexity: Medium.

### Should fix after Friends & Family

1. Page/system: Shopping.
   - Issue: `Weg` and recovery are too terse; store assignment/change is not clearly exposed from quick add.
   - Observed evidence: Shopping quick add, item actions, completed, and recently removed sections were inspected.
   - Impact: Families may remove items accidentally or fail to organize by store.
   - Estimated complexity: Small to Medium.

2. Page/system: Motivation.
   - Issue: Appreciation/personal-goal saves need clearer success feedback.
   - Observed evidence: Add flows are reachable, but users must scan after submission to infer success.
   - Impact: Families may doubt whether positive feedback or goals were recorded.
   - Estimated complexity: Small.

3. Page/system: Avatar Editor.
   - Issue: Save confirmation is implicit.
   - Observed evidence: Cancel/save flows are understandable, but persistence is confirmed only by recognizing the avatar changed.
   - Impact: Minor confidence issue for parent-led editing.
   - Estimated complexity: Small.

### Post-MVP

1. Page/system: Cross-product action language.
   - Issue: Generic labels such as `Meer` and terse labels such as `Weg` require interpretation.
   - Observed evidence: Secondary actions across Tasks and Shopping require opening menus or trying actions to learn consequences.
   - Impact: Increased learning cost for new households.
   - Estimated complexity: Medium.

2. Page/system: Settings/navigation.
   - Issue: Settings is slightly less direct than domain pages.
   - Observed evidence: Gear plus label works, but is visually/semantically different from the other main navigation items.
   - Impact: Minor discoverability friction.
   - Estimated complexity: Small.

## Recommendation

**Needs another functional iteration**.

The product is visually ready, and many page-level entry points are understandable. However, observed functional gaps in Agenda editing, Weekly Reset execution, and Tasks state feedback are too central to family beta use to classify the product as ready after only small fixes.

## Validation

Commands/checks run:

```bash
export DOTNET_CLI_HOME=/tmp/dotnet
export PATH="$PATH:$HOME/.dotnet/tools"
dotnet --version
```

```bash
ASPNETCORE_ENVIRONMENT=VisualReview \
  dotnet run --project src/HomeOps.Api/HomeOps.Api.csproj \
  --no-launch-profile \
  --urls 'http://127.0.0.1:5108;http://127.0.0.1:5152'
```

```bash
curl -sS -m 5 http://127.0.0.1:5108/health
```

```bash
curl -sS -m 5 http://127.0.0.1:5108/api/visual-review-fixtures/scenarios
```

```bash
curl -sS -m 10 -X POST http://127.0.0.1:5108/api/visual-review-fixtures/visual-full/reset
```

```bash
curl -sS -m 10 -X POST http://127.0.0.1:5108/api/visual-review-fixtures/visual-weekly-reset/reset
```

```bash
cd src/HomeOps.Client
VITE_HOMEOPS_API_BASE_URL=http://127.0.0.1:5108 npm run dev -- --host 127.0.0.1 --port 5173
```

```bash
node /tmp/fb-func/review.js
node /tmp/fb-func/review2.js
node /tmp/fb-func/review3.js
```

```bash
git diff --check
```

## Modified files

- `docs/reports/2026-06-28-familyboard-functional-ux-review/familyboard-functional-ux-review.md`

## Binary artifact confirmation

No screenshots, videos, traces, browser profiles, or binary artifacts were added to the repository. Temporary Playwright scripts/logs were created under `/tmp/fb-func` and removed during cleanup. Existing historical report images already present in the repository were not modified.
