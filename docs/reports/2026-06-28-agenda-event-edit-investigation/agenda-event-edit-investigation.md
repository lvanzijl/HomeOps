# Agenda Event Edit Investigation

## Summary

Classification: **B — Discoverability issue**.

FamilyBoard currently supports editing existing events **partially**: writable HomeOps/manual calendar events can be edited and deleted, while read-only events such as demo birthdays, holidays, TV-series items, and Google Calendar adapter events are intentionally non-editable. The review could not edit an existing event because the edit workflow is only exposed as a small `Bewerken` button inside editable event cards. Clicking, double-clicking, right-clicking, keyboard-entering, or selecting event text does not open a detail or edit workflow. Several events visible in the reviewed List view were intentionally read-only and therefore expose no edit action at all.

Existing events can be edited **only** when the event has `editable: true`: navigate to Agenda, use a view/date range where a writable event card appears, and click the card's `Bewerken` button. The edit dialog opens with the accessible name `Gebeurtenis bewerken`.

Friends & Family should **not be blocked as a functional-defect stop-ship** because editing exists for writable visual-full events and the fixture does not prevent editing. However, this should be treated as a high-priority UX readiness issue before relying on Agenda as a family planning workflow: normal direct interactions with events do not reveal editing, and many visible events are read-only with no explanatory detail affordance.

## Preflight

Read before investigation:

- `.github/copilot-instructions.md`
- `AGENTS.md`
- `docs/reports/2026-06-28-familyboard-functional-ux-review/familyboard-functional-ux-review.md`
- `docs/development/visual-review-runtime.md`

Preflight command:

```bash
export DOTNET_CLI_HOME=/tmp/dotnet
export PATH="$PATH:$HOME/.dotnet/tools"
dotnet --version
```

Result:

```text
10.0.301
```

## Runtime validation

Used the official VisualReview browser runtime, not Development, Testing, mocked Playwright routes, or route interception.

API command:

```bash
export DOTNET_CLI_HOME=/tmp/dotnet
export PATH="$PATH:$HOME/.dotnet/tools"
ASPNETCORE_ENVIRONMENT=VisualReview \
  dotnet run --project src/HomeOps.Api/HomeOps.Api.csproj \
  --no-launch-profile \
  --urls 'http://127.0.0.1:5108;http://127.0.0.1:5152'
```

Frontend command:

```bash
cd src/HomeOps.Client
VITE_HOMEOPS_API_BASE_URL=http://127.0.0.1:5108 npm run dev -- --host 127.0.0.1 --port 5173
```

Endpoint validation:

```bash
curl -sS -m 5 http://127.0.0.1:5108/health
```

Result: `{"status":"Healthy"}`.

```bash
curl -sS -m 5 http://127.0.0.1:5108/api/visual-review-fixtures/scenarios
```

Result: returned the expected scenario list including `visual-full`, `visual-mixed`, `visual-empty`, `visual-child-young`, `visual-child-older`, `visual-weekly-reset`, and `visual-shopping-lifecycle`.

```bash
curl -sS -m 10 -X POST http://127.0.0.1:5108/api/visual-review-fixtures/visual-full/reset
```

Result:

```json
{"scenarioName":"visual-full","anchorUtc":"2026-06-21T09:00:00+00:00","familyMembers":4,"tasks":10,"lists":2,"listItems":6,"familyGoals":1,"individualGoals":2,"helpfulMoments":5,"events":2}
```

Populated state was verified through API and browser: `/api/events` returned two writable Visual Review Calendar events, and the Agenda browser UI showed populated Month/Week/List surfaces plus read-only demo/reference events.

## Investigation

### 1. Product capability

Answer: **Partially**.

Evidence:

- Backend update support exists. `PUT /api/events/{eventId}` validates the update payload, finds an event only when its source belongs to the household and `EventSource.IsWritable` is true, applies the request, saves changes, and returns the updated event DTO.
- Frontend edit support exists. `AgendaWidget` stores `editingEventId`, calls `updateCalendarAgendaEvent` when editing, and opens an edit form seeded from the selected event.
- The edit dialog exists. When `editingEventId` is present, the dialog accessible label and heading change from `Gebeurtenis toevoegen` to `Gebeurtenis bewerken`.
- The event list renders `Bewerken` and `Verwijderen` buttons only when `event.editable` is true.
- Read-only demo/reference events and Google Calendar adapter events are intentionally marked non-editable.

Runtime evidence:

- `/api/events` after `visual-full` returned `Family reset` and `School picnic` with `editable: true`.
- Browser interaction in Week view found `School picnic` with visible `Bewerken` and `Verwijderen` buttons.
- Clicking `Bewerken` opened a dialog containing `Agenda`, `Gebeurtenis bewerken`, close control `×`, and the first question `Wat gebeurt er?`.

### 2. UI discoverability

Answer: editing is **discoverable only if the user notices the inline `Bewerken` button on an editable card**.

Investigated views:

- **Month:** Month grid cells are clickable for date selection. Event glyphs appear in day cells, and the selected-day panel can show event cards, but selecting dates and interacting with event text/glyphs did not reveal a detail/edit workflow during this run. The primary reliable edit affordance is still the event card action when an editable event is visible.
- **Week:** Editable event cards expose `Bewerken` and `Verwijderen`. Clicking event body, double-clicking the event card, and right-clicking the event card did not open a dialog. Clicking `Bewerken` did open `Gebeurtenis bewerken`.
- **List:** The visible List events in this run were future demo/reference events (`Inschrijving zomerkamp bevestigen`, `Seizoensfinale-marathon`, `Verjaardag Riley`, `Verjaardag Casey`). These are read-only, so no `Bewerken` button appeared. Clicking/double-clicking/right-clicking equivalent event card content does not expose editing.

Affordance checks:

- Click event body: no edit dialog.
- Double-click event body: no edit dialog.
- Context/right-click event body: no edit dialog.
- More menu: no Agenda event More menu found.
- Edit icon: no icon-only edit affordance found.
- Inline affordance: `Bewerken` text button exists only on editable event cards.
- Detail dialog: no read-only detail dialog or click-to-detail route found.
- Keyboard shortcut: focusing/attempting keyboard entry on event card did not reveal an edit dialog.

### 3. Event types

Events do **not** all behave the same.

Editable:

- VisualReview/manual HomeOps calendar events from the writable `Visual Review Calendar` source.
- Backend update/delete endpoints require writable event sources.

Non-editable:

- Demo school-holiday events.
- Demo TV-series events.
- Demo birthday events.
- Google Calendar adapter events, which are mapped with read-only source capability and `Editable: false`.

The result is intentional product behavior by source capability: HomeOps/manual writable events can be edited; reference/imported/read-only events cannot.

### 4. Fixture investigation

`visual-full` creates:

- One writable manual event source named `Visual Review Calendar`.
- Two persisted event series: `Family reset` and `School picnic`.
- Both fixture events originate from the writable manual event source.

The fixture itself did **not** prevent editing. It intentionally seeded editable events, and `/api/events` returned them with `editable: true`.

However, the client also combines these backend events with read-only demo events. In List view during this investigation, the visible items were read-only future demo/reference events rather than the two editable fixture events, so List view was easy to misread as fully non-editable.

### 5. Code investigation

The edit workflow exists and is reached as follows:

1. `AgendaEventList` renders every event card.
2. If `event.editable` is true, the card renders `Bewerken` and `Verwijderen` buttons.
3. Clicking `Bewerken` invokes `onEdit(event)`.
4. `AgendaWidget.startEditing` sets `editingEventId`, opens the event form, resets the dialog to the title question, and seeds the form from the event title, description, start/end, and all-day state.
5. The modal renders with accessible label/heading `Gebeurtenis bewerken`.
6. Submitting the form calls `updateCalendarAgendaEvent(editingEventId, input)`.
7. The backend `PUT /api/events/{eventId}` updates the event only if the source is writable.

No route-level edit page, separate detail panel, context menu, double-click handler, event-body click handler, or keyboard shortcut edit path was found.

## Browser interaction log

Runtime: official VisualReview API + Vite browser UI with `visual-full` reset.

Interactions attempted:

1. Opened `http://127.0.0.1:5173/`.
2. Clicked the Agenda navigation entry.
3. Switched to `Maand`.
4. Inspected visible buttons and event glyphs.
5. Attempted to find and interact with `School picnic` in Month; it was not surfaced as a normal `.agenda-event` card in the attempted selected state during this run.
6. Switched to `Week`.
7. Found `School picnic` as an event card with `Bewerken` and `Verwijderen`.
8. Clicked the `School picnic` event card body: no dialog opened.
9. Double-clicked the event card body: no dialog opened.
10. Right-clicked the event card body: no dialog opened.
11. Clicked `Bewerken`: edit dialog opened with `Gebeurtenis bewerken`.
12. Pressed Escape to close the dialog without saving.
13. Switched to `Lijst`.
14. Observed visible List events were read-only demo/reference events: `Inschrijving zomerkamp bevestigen`, `Seizoensfinale-marathon`, `Verjaardag Riley`, and `Verjaardag Casey`.
15. Confirmed these List cards did not expose `Bewerken` buttons.

Browser result excerpt:

```text
MODE Week
events ["🎒SchoolSchool picnicHele dag · SchoolBewerkenVerwijderen","🎂VerjaardagVerjaardag MorganHele dag · Verjaardag"]
click dialog 0
dblclick dialog 0
rightclick dialog 0
edit 1 delete 1
edit dialog ["AgendaGebeurtenis bewerken×Wat gebeurt er?Verder"]

MODE Lijst
events ["🎒SchoolInschrijving zomerkamp bevestigenHele dag · School","🎬KijkenSeizoensfinale-marathon19:30–22:00 · Kijken","🎂VerjaardagVerjaardag RileyHele dag · Verjaardag","🎂VerjaardagVerjaardag CaseyHele dag · Verjaardag"]
picnic count 0
```

## Code investigation

Key code evidence:

- `handleSubmit` chooses `updateCalendarAgendaEvent` when `editingEventId` is set, otherwise it creates a new event.
- `startEditing` opens the form and hydrates the draft from the selected event.
- The modal exposes `Gebeurtenis bewerken` when editing.
- Event card actions are gated by `event.editable`.
- The backend update endpoint requires `EventSource.IsWritable`.
- Read-only demo sources and events are marked non-editable; Google Calendar adapter output is also non-editable.

## Fixture investigation

Key fixture evidence:

- `visual-full` is one of the official scenarios and `AddFull` calls `AddEvents`.
- The fixture always adds a manual writable `Visual Review Calendar` source.
- `AddEvents` creates two persisted events: `Family reset` and `School picnic`.
- Fixture reset returned `events: 2`.
- API event output showed both persisted events with `editable: true`.

The fixture did not block editing. The confusion comes from mixed editable persisted events plus read-only client demo events in the same Agenda UI.

## Classification

**B — Discoverability issue.**

Reasoning:

- Not A/no issue: the reviewer missed a real interaction, but the workflow is not reasonably discoverable because normal direct interactions on event cards do nothing and several visible events cannot be edited.
- B/discoverability issue fits: editing exists and works for writable events, but users are unlikely to infer that only the small inline `Bewerken` button opens editing and only on editable event cards.
- Not C/fixture limitation: `visual-full` seeds writable editable events and the API marks them editable.
- Not D/functional defect: clicking the actual `Bewerken` affordance opens the edit dialog, and backend update support exists for writable events.
- Not E/incomplete feature: create/update/delete paths and an edit dialog are implemented for writable event series.

## Recommendation

Do **not** implement changes as part of this investigation.

Recommended future work:

1. **UX improvement:** make event cards open a detail/edit surface on click or provide a consistent detail dialog with explicit `Bewerken` for editable events and a clear read-only explanation for non-editable events.
2. **UX improvement:** add an icon or stronger action treatment for editable cards, and avoid hiding edit behind small text in dense cards.
3. **Documentation/review guidance:** document that only writable HomeOps/manual events are editable and imported/reference events are read-only.
4. **Fixture/review improvement:** if future functional reviews need to exercise edit in List view, include a future writable fixture event that appears in the List view window, not only past/current-week events.

Should Friends & Family be blocked by this?

- **Do not block as a functional defect**, because existing writable events can be edited.
- **Do treat as a high-priority UX issue** before broad Friends & Family use if Agenda editing is expected to be a core family planning flow.

## Modified files

- `docs/reports/2026-06-28-agenda-event-edit-investigation/agenda-event-edit-investigation.md`

## Binary artifact confirmation

No screenshots were created. No binaries were intentionally created in the repository. Temporary Playwright investigation files and dependency installs were kept under `/tmp/pw`, outside the repository.

## Validation

Commands/checks performed:

```bash
export DOTNET_CLI_HOME=/tmp/dotnet
export PATH="$PATH:$HOME/.dotnet/tools"
dotnet --version
```

Result: pass, `10.0.301`.

```bash
ASPNETCORE_ENVIRONMENT=VisualReview dotnet run --project src/HomeOps.Api/HomeOps.Api.csproj --no-launch-profile --urls 'http://127.0.0.1:5108;http://127.0.0.1:5152'
```

Result: pass, API listened on `http://127.0.0.1:5108` and `http://127.0.0.1:5152` in `VisualReview`.

```bash
cd src/HomeOps.Client
VITE_HOMEOPS_API_BASE_URL=http://127.0.0.1:5108 npm run dev -- --host 127.0.0.1 --port 5173
```

Result: pass with existing npm warning `Unknown env config "http-proxy"`.

```bash
curl -sS -m 5 http://127.0.0.1:5108/health
curl -sS -m 5 http://127.0.0.1:5108/api/visual-review-fixtures/scenarios
curl -sS -m 10 -X POST http://127.0.0.1:5108/api/visual-review-fixtures/visual-full/reset
```

Result: pass; health was healthy, scenarios included `visual-full`, and fixture reset returned populated counts with `events: 2`.

```bash
curl -sS http://127.0.0.1:5108/api/events
curl -sS http://127.0.0.1:5108/api/event-sources
```

Result: pass; events showed `Family reset` and `School picnic` as editable, and event source showed `Visual Review Calendar` as writable.

```bash
cd /tmp/pw && node run2.mjs
```

Result: pass after installing missing Playwright browser dependencies in the container; browser interaction confirmed direct event-card click/double-click/right-click do not open editing, while `Bewerken` opens `Gebeurtenis bewerken`.

```bash
git diff --check
```

Result: pass.
