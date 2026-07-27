# HomeOps consolidated product-integrity audit and working list

**Audit date:** 2026-07-26  
**Application tested:** HomeOps running at `http://192.168.1.2:5173/` with the API at `http://192.168.1.2:5152/`  
**Purpose:** combine the complete user-facing functionality audit with a deeper persistence, demo-data, date/time, and interaction-integrity investigation.

This report supersedes the working list in
[`2026-07-25-user-facing-functionality-audit/user-facing-functionality-audit.md`](../2026-07-25-user-facing-functionality-audit/user-facing-functionality-audit.md).
The earlier evidence remains useful, but all of its findings are incorporated here so that this document can be used as the single product backlog.

## Executive verdict

HomeOps is not simply a mock frontend. Most steady-state pages read and write through the API to PostgreSQL. However, four design and implementation problems make the current application behave like a partially mocked or unreliable prototype:

1. A fresh database is unconditionally seeded as an already-onboarded demo household, including four family members, sample lists, tasks, goals, agenda events, and layouts.
2. The frontend also starts with a static copy of the same four family members before replacing them with the API response.
3. Critical family-member writes are rejected by the API because the client sends two mutually exclusive avatar contracts at once, while the UI optimistically shows success and suppresses the failure.
4. Development-only visual-review reset endpoints are enabled in the normal `Development` environment. On the LAN-exposed service, an unauthenticated request can delete and reseed core household data or activate a fixed demonstration date.

The user's four observations are confirmed:

- **The onboarding wizard is skipped:** confirmed. The seeded household has `OnboardingCompleted = true` and active seeded members.
- **Avatar changes disappear after refresh:** confirmed. The client sends both `avatarSelection` and `avatarV2Config`; the API explicitly rejects that payload with HTTP 400, and the UI hides the error.
- **A Home “today” event lands on the wrong day:** confirmed. A live event created on 2026-07-26 was stored with `startUtc` corresponding to 2026-07-25 local midnight. The root cause is UTC/local calendar-field conversion, not only a stale app-start clock.
- **Tasks cannot effectively be opened, completed, postponed, or edited:** confirmed as an interaction failure. Complete/tomorrow actions are hidden until the user selects an unlabeled card; the edit menu is clipped and cannot be hit. The underlying complete/postpone API handlers appear wired, but the user-facing controls are not reliably operable.

These are product-integrity defects, not cosmetic polish. The first implementation slice should stabilize first-run state, writes, dates, and destructive development tooling before adding more features.

## Impact scale

The rating describes **user/product impact**, not estimated implementation effort.

| Rating | Meaning |
| --- | --- |
| **5 — Critical** | Blocks or corrupts a core workflow, can destroy/expose household data, or makes a substantial implemented feature unreachable. |
| **4 — High** | A frequent workflow is broken or missing, or the behavior creates significant confusion or data risk. |
| **3 — Medium** | A meaningful capability is incomplete, inconsistent, or device-local, but a tolerable workaround exists. |
| **2 — Low** | Discoverability, consistency, or quality-of-life gap with limited operational impact. |
| **1 — Minor** | Cosmetic, future-facing, or edge-case gap. |
| **0 — Complete** | No material user-facing lifecycle gap found in the audited scope. |

## Audit method and evidence standard

The audit combined:

- live browser inspection of the running LAN application;
- hit testing of task controls, including `pointer-events`, bounding boxes, and the element actually receiving a click;
- read-only live API calls;
- comparison of frontend request construction with backend request validation;
- tracing UI state through API adapters, endpoints, Entity Framework configuration, migrations, and PostgreSQL persistence models;
- inventory of static data, EF seed data, browser storage, visual-review fixtures, and error suppression;
- incorporation and re-evaluation of every area from the 2026-07-25 functionality audit.

No destructive fixture endpoint was called. No task was completed/postponed and no household data was deliberately changed during this audit.

Evidence labels used below:

- **Live:** observed in the currently running application or API.
- **Source:** directly demonstrated by the implementation.
- **Contract:** demonstrated by comparing the exact client request with API validation.
- **Gap:** functionality exists in one layer but is unavailable, incomplete, or misleading in the user experience.

## What data is actually live, seeded, mocked, or local

| Data/path | Current source | Persists across refresh? | Shared with another device? | Assessment |
| --- | --- | ---: | ---: | --- |
| Household/onboarding flag | PostgreSQL, but inserted by unconditional EF seed | Yes | Yes | **Demo seed masquerading as first-run state** |
| Initial family shown during client boot | Static `familyMembers.ts` array | Only until API load | No | **Client fallback/flash** |
| Steady-state family list | PostgreSQL API | Yes | Yes | Live, but member writes are broken |
| Family member create/profile/avatar update | Intended PostgreSQL API | **No in normal client flow** | No | Client/API contract mismatch returns HTTP 400 |
| Family member delete | PostgreSQL soft delete | Yes if request succeeds | Yes | Implemented; errors are hidden and no restore UI exists |
| Known people | PostgreSQL API | Yes | Yes | Live |
| Agenda events and sources | PostgreSQL API | Yes | Yes | Live, but manual event calendar fields are timezone-corrupted |
| Visual-review clock | In-memory API fixture provider | While API process lives | Yes for clients using that API | Normally null, but normal Development exposes a reset that can freeze it |
| Tasks/routines | PostgreSQL API | Yes | Yes | Live; several controls/workflows are unusable or incomplete |
| Shopping lists/items | PostgreSQL API | Yes | Yes | Live |
| Home quick-add shopping suggestions | Browser `localStorage` | Yes on that browser | **No** | Separate local history from server shopping history |
| Shopping store purchase history | PostgreSQL API | Yes | Yes | Live |
| Motivation goals/helpful moments | PostgreSQL API | Yes | Yes | Live, with lifecycle gaps |
| Weekly reset | Mix of server task/goal changes and component-local skip state | Partly | Partly | Not a coherent persisted weekly workflow |
| Floors/rooms/overlays/climate | PostgreSQL API | Yes | Yes | Live backend; large parts unreachable or absent in UI |
| Weather | Server-side configured provider/cache | Yes according to server config | Yes | Live; household cannot configure location |
| Workspace layout | PostgreSQL API | Yes | Yes | Live layout records; no user customization |
| Current navigation/page | React component state | No | No | Refresh returns to default page; no deep links |
| Agenda per-device visibility preferences | Server rows keyed by a browser-local device identifier | Usually | Per device | Losing browser storage creates a new identity and can orphan old preferences |
| Media/rewards | Placeholder components | No meaningful data | No | Not implemented |

Some filenames look more mock-like than their runtime behavior:

- `demo/demoAgendaData.ts` contains static agenda examples, but no production import was found during this audit.
- `motivationData.ts` and `helpfulMomentsData.ts` are API adapters despite their names; their steady-state records come from the backend.
- visual-review scenario builders are active API fixtures, not ordinary page data, but they are currently reachable in normal Development and can replace real data.

### Why the application starts as a family instead of showing onboarding

`HomeOpsDbContext` always calls `Seed(modelBuilder)`. The seeded household has `OnboardingCompleted = true`, and the same seed inserts Alex, Sam, Riley, and Jordan. The onboarding endpoint calculates:

```text
requiresOnboarding = !household.OnboardingCompleted || !hasActiveMembers
```

The live API returned:

```json
{
  "onboardingCompleted": true,
  "hasActiveFamilyMembers": true,
  "requiresOnboarding": false
}
```

This is deterministic behavior on a fresh migrated database. It is not evidence that a previous real user completed onboarding.

There is also a second boot-time illusion: `WorkspaceShell` initializes its family state from the static four-person frontend array before asynchronously loading the API. The steady-state data is API-backed, but the first render can still look populated when the API has not answered.

### Why avatar and profile changes disappear

The frontend constructs every family-member create/update request with both:

```text
avatarSelection
avatarV2Config
```

The backend rejects exactly that combination:

```text
Provide either avatarSelection or avatarV2Config, not both.
```

The shell updates React state first, starts the API request, and ends the promise chain with `.catch(() => undefined)`. The profile form independently displays “Gegevens opgeslagen.” immediately. The avatar editor closes immediately after invoking the optimistic change.

The result is a deceptive-success sequence:

```text
User saves
  → local UI changes
  → API returns 400
  → error is swallowed
  → UI still looks saved
  → refresh reloads unchanged PostgreSQL row
```

This contract mismatch affects more than avatars:

- editing name, role, date of birth, color, or avatar;
- creating an additional family member;
- creating the first adult/child in onboarding.

Frontend unit tests currently assert that both avatar objects are sent and mock a successful response. Backend tests exercise either the legacy or the catalog payload separately. There is no contract test using the real frontend payload against the real endpoint.

### Why “today” can become yesterday

The Home quick-add creates a JavaScript `Date` at local midnight and calls `.toISOString()`. In Europe/Amsterdam during summer:

```text
2026-07-26 00:00 +02:00
  → 2026-07-25 22:00Z
```

The backend then uses `startUtc.UtcDateTime` to populate `DateOnly` and `TimeOnly`. It therefore stores the UTC calendar date/time as if it were the intended household-local calendar fields.

Live evidence from the user's event:

| Field | Observed value |
| --- | --- |
| Current local date during audit | 2026-07-26 |
| Event creation time | `2026-07-26T10:51:53.295389+00:00` |
| Persisted event start | `2026-07-25T00:00:00+02:00` |
| Result | An event created “today” on July 26 appears on July 25 |

The same conversion path is used by the full Agenda form and recurring event paths. Timed events can also shift by the UTC offset; for example, a local 10:00 input can become 08:00 when UTC fields are extracted.

There is a secondary risk: Home uses a periodically refreshed React `now` value when submitting quick-add actions. A suspended tab can briefly use stale state. That should be fixed, but it does not explain the live one-day shift—the UTC/local conversion does.

### Why Tasks appears to have buttons that do not work

The task card is a focusable `<li>` with a click handler, but it has no button/link role and no accessible “open actions” label. Its action rail starts with:

```css
max-width: 0;
opacity: 0;
overflow: hidden;
pointer-events: none;
```

Only `.is-selected` or `:focus-within` enables it. Before card selection, live hit testing showed the visible action area did not receive pointer events. Selecting the otherwise unlabeled card made “Klaar” and “Morgen” clickable, creating an undiscoverable two-step interaction.

The “Meer” menu has a separate hard failure. Its popup is positioned to the left (`right: 100%`) inside the action rail, while the rail has `overflow: hidden`. Live hit testing showed that the visible “Aanpassen” button's center was actually covered/hit by task metadata, and clicking it did not open the editor.

Therefore:

- complete/reopen and tomorrow are wired, but effectively hidden behind a non-obvious selection mode;
- edit is rendered but physically clipped/unhittable;
- opening the task itself has no clear or accessible affordance;
- component tests can click hidden DOM buttons in jsdom and therefore miss the real layout/hit-testing defect.

## Complete user-facing lifecycle matrix

Legend: ✅ available, ⚠️ partial/broken, ❌ unavailable, — not applicable.

| Entry or capability | View | Add/create | Edit/update/action | Remove/archive | Restore/reopen | Current integrity assessment | Highest impact |
| --- | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| First-run household | ⚠️ | ⚠️ | — | — | — | Fresh DB is already marked onboarded; member creation contract is broken | **5** |
| Family member | ✅ | ⚠️ | ⚠️ | ✅ | ❌ | Normal create/update requests return 400; delete has hidden errors | **5** |
| Family-member avatar | ✅ | default | ⚠️ | — | — | Optimistic preview only; normal save is rejected | **5** |
| Known person | ✅ + search | ✅ | ✅ | ✅ | ❌ | Strong live CRUD; no restore | **1** |
| Manual agenda event | ✅ | ⚠️ | ⚠️ | ✅ | ✅ skipped occurrence | CRUD exists, but date/time fields can be corrupted | **5** |
| Imported agenda event | ✅ | via source | ❌ intentional | via source | via source | Correct read-only behavior | **0** |
| Calendar source | ✅ | ✅ | ✅ | ✅ | ❌ | iCal URL works conceptually; “file” is not a file upload | **4** |
| Normal task | ✅ | ✅ | ⚠️ | ❌ normal delete | ✅ complete/reopen | Actions are undiscoverable; edit popup is clipped | **4** |
| Recurring task series | ✅ | ✅ | ⚠️ | ✅ whole series | ❌ | Coarse occurrence/series control | **3** |
| Task routine/template | ✅ | ⚠️ | ⚠️ | ✅ archive | ❌ | Create form omits routine items; edit opens normal task dialog | **4** |
| Shopping list | ✅ | ⚠️ first only | ✅ rename | ✅ archive/delete | ❌ archived list | Cannot create another list or restore an archive | **4** |
| Shopping item | ✅ | ✅ | ⚠️ metadata only | ✅ soft remove | ✅ undo | Item label/quantity correction requires remove and re-add | **3** |
| Family goal | ✅ | ✅ | ⚠️ definition only | ⚠️ reset only | ❌ | No direct progress correction or normal stop action | **4** |
| Individual goal | ✅ | ✅ | ⚠️ definition only | ✅ stop/archive | ❌ | No direct progress correction | **4** |
| Helpful moment | ✅ | ✅ | ❌ | ❌ | ❌ | User-created appreciation cannot be corrected or removed | **4** |
| Weekly-reset decision | ✅ | — | ⚠️ | ⚠️ | — | Goal buttons do nothing; shopping candidates lack resolution actions | **5** |
| Floor | ✅ | ✅ | ✅ | ✅ archive/delete | ✅ | Full lifecycle and ordering | **0** |
| Room | ✅ | ✅ | ✅ + move | ✅ archive/delete | ✅ | Full lifecycle and ordering | **0** |
| Floor-plan asset | ⚠️ status | ❌ UI | — | — | — | Backend ingestion exists, normal user cannot upload first asset | **4** |
| Room overlay | ✅ when asset exists | ✅ draw | ✅ | ✅ archive/delete | ✅ | Strong editor, blocked by missing upload entry point | **4** |
| Home Assistant provider | ⚠️ HTTP 500 | ✅ form | ✅ form | ❌ UI | ❌ UI | Live provider list is broken; lifecycle incomplete | **4** |
| Room climate configuration | ⚠️ summary | ❌ UI | ❌ UI | ❌ UI | — | Backend contract exists without a usable editor | **5** |
| Climate source mapping | ⚠️ summary | ❌ UI | ❌ UI | ❌ UI | ❌ UI | Labelled buttons merely focus a room row | **5** |
| Runtime climate/heating | implemented | — | command actions | — | resume schedule | Entire runtime surface is unreachable from navigation | **5** |
| Weather | ✅ | — | ❌ location | — | reload | Live forecast; location is server config, not household config | **3** |
| Workspace/widget layout | ✅ rendered | ❌ UI | ❌ UI | ❌ UI | — | Persistence exists, customization does not | **3** |
| Calendar/house backup | ✅ download | ✅ | — | replace on restore | pre-restore snapshot | Substantial but excludes multiple core domains | **4** |
| Navigation state | ✅ | — | transient only | — | — | No URL routes, back behavior, refresh persistence, or deep links | **3** |
| Media | placeholder | ❌ | ❌ | ❌ | — | No user-facing functionality | **1** |
| Rewards/gamification | placeholder | ❌ | ❌ | ❌ | — | Motivation exists; rewards/redemption do not | **2** |

## Consolidated prioritized working list

The order below is recommended. P0 addresses data loss/corruption, false success, blocked core workflows, and LAN safety. New feature work should wait until P0 is stable.

### P0 — Product integrity, data safety, and blocked core workflows

| ID | Rating | Area | Confirmed problem | Required outcome / acceptance check |
| --- | ---: | --- | --- | --- |
| **SEC-01** | **5** | LAN access | UI/API has no authentication or authorization while bound for network access | Unauthenticated devices cannot read or mutate household data; household access has an explicit trust/auth boundary |
| **SEC-02** | **5** | PostgreSQL | Compose publishes `5432:5432` with a documented development password | Database binds to loopback or an internal-only Docker network; another LAN machine cannot connect to port 5432 |
| **FIXTURE-01** | **5** | Development fixtures | Normal Development exposes unauthenticated reset endpoints that delete and reseed events, goals, tasks, lists, and family members | Destructive fixtures are available only in an explicit isolated visual-review/test environment and cannot be reached in normal LAN development |
| **BOOT-01** | **5** | First run | Fresh migrations insert a completed demo household and active demo members | A genuinely fresh DB returns `requiresOnboarding: true`; demo data is opt-in and isolated from user data |
| **MEMBER-01** | **5** | Family writes | Client sends both mutually exclusive avatar payloads, causing family create/update HTTP 400 | Real client create/update payload succeeds against real endpoint; refresh preserves name/profile/avatar |
| **MEMBER-02** | **5** | Save integrity | Member UI reports success and closes while failures are swallowed | Forms wait for API success; errors remain visible/actionable; optimistic state rolls back or reconciles |
| **TIME-01** | **5** | Agenda | Local calendar fields are converted to UTC and reinterpreted as local fields, shifting all-day and timed events | Create/edit from Home and Agenda preserve intended household date/time in winter/summer and across recurrence actions |
| **HOUSE-01** | **5** | Navigation | Implemented Huisstatus, live climate, and heating controls have no navigation path | A visible, authorized navigation action reaches House; routes/back/deep links work |
| **CLIMATE-01** | **5** | Climate setup | Room climate configuration has no usable UI | Users can create/edit/disable room thresholds and policies, with validation and saved-state confirmation |
| **CLIMATE-02** | **5** | Climate mappings | Source mappings cannot be created/edited/removed/restored in UI | Settings provides a complete mapping workflow and displays health/diagnostics |
| **RESET-01** | **5** | Weekly reset | Counted goal/shopping candidates cannot all be resolved; completion state is normally unreachable | Every candidate has a persisted decision and the workflow can reach a truthful completed state |

### P1 — Broken frequent workflows and lifecycle completeness

| ID | Rating | Area | Confirmed problem | Required outcome / acceptance check |
| --- | ---: | --- | --- | --- |
| **TASK-UI-01** | **4** | Tasks | Complete/tomorrow controls require selecting an unlabeled generic card first | Primary task actions are immediately discoverable and keyboard/screen-reader operable |
| **TASK-UI-02** | **4** | Tasks | “Aanpassen” popup is clipped inside `overflow: hidden` and cannot be hit | Edit opens reliably with mouse, touch, and keyboard at supported viewports |
| **TASK-01** | **4** | Tasks | Normal tasks lack delete/archive lifecycle | User can archive/delete a task with confirmation and understand recurrence scope |
| **TASK-02** | **4** | Routines | Routine creation form does not expose the routine items required by the backend concept | User can create a named reusable routine with one or more editable items |
| **TASK-03** | **4** | Routines | Editing a routine task opens the normal single-task form | Edit preserves routine/template semantics and does not silently detach or misrepresent it |
| **TASK-04** | **4** | Routines | Archived templates have no restore/permanent-delete UI | Archived routines can be inspected and restored or intentionally deleted |
| **TEST-01** | **4** | Regression coverage | Unit tests mock the broken member payload as successful and jsdom cannot detect clipped task controls | Add real API contract tests plus browser-level create/refresh/date/task-action tests |
| **ONB-01** | **4** | Onboarding | Review step is read-only after records have already been created | Review allows correcting/removing staged members, or creation is committed only at finish |
| **ONB-02** | **4** | Onboarding | API status failure sets `requiresOnboarding(false)` and fail-opens into the app | Unknown first-run state produces a recoverable error/retry, never a false completed state |
| **FAMILY-01** | **4** | Family management | Add member is hidden inside an existing member page and an empty roster has no obvious recovery path | Home/Settings has central family administration that works with zero active members |
| **FAMILY-02** | **4** | Family lifecycle | Deleted family members cannot be restored | Admin can inspect removed members and restore them safely |
| **CAL-02** | **4** | Calendar sources | “iCal file” asks for metadata/path-like fields but has no actual upload workflow | User can select/upload a supported file with clear import/update semantics |
| **SHOP-01** | **4** | Shopping lists | User cannot create an additional list after the initial-list path | Add-list action is visible and creates multiple named lists |
| **SHOP-03** | **4** | Shopping lists | Archived lists cannot be viewed/restored | Archive view supports restore and intentional permanent delete |
| **MOT-01** | **4** | Motivation | UI presents generic goal progress while backend progress is task-driven | Product defines progress semantics; user can understand and correct attribution |
| **MOT-02** | **4** | Helpful moments | User-authored moments have no edit/delete | Author/admin can correct or remove a moment with suitable confirmation |
| **MOT-03** | **4** | Family goal | Family goal cannot be stopped from Motivation | Goal can be stopped/archived from its normal management surface |
| **HOUSE-02** | **4** | Floor plans | No floor-plan upload UI exists although downstream overlay tools depend on it | User can upload/replace first plan, inspect validation, and recover from invalid files |
| **HOUSE-04** | **4** | Home Assistant | Live `GET /api/climate-providers/` returns HTTP 500 due to unapplied/incomplete schema migration state | Current DB migrates cleanly; provider endpoint returns 200; clean and existing DB upgrade paths are tested |
| **HOUSE-05** | **4** | Providers | Provider archive/restore/remove lifecycle is not exposed | Settings exposes safe provider lifecycle and dependency warnings |
| **SETTINGS-01** | **4** | Backup | “Back-up” excludes core domains and browser-local state | UI accurately labels scope or backup includes all promised household data and restore is verified |

### P2 — Incomplete workflows, persistence consistency, and product clarity

| ID | Rating | Area | Confirmed problem | Required outcome / acceptance check |
| --- | ---: | --- | --- | --- |
| **TIME-02** | **3** | Home quick actions | Submission uses periodically refreshed component `now`, which can be stale after tab suspension | Resolve “now/today/tomorrow” at action time and test suspended/resumed use |
| **ONB-03** | **3** | Onboarding scope | Setup only establishes people and does not help configure time zone, weather, lists, calendars, or home integrations | Define the minimum first-run scope and provide an explicit post-setup checklist for deferred areas |
| **SHOP-DATA-01** | **3** | Shopping suggestions | Home uses browser-local history while Shopping uses server purchase history | One clearly defined server-backed suggestion/history model is shared across devices |
| **SHOP-02** | **3** | Shopping items | Item label/quantity cannot be corrected in place | Edit item content without remove/re-add and preserve metadata/history |
| **SHOP-04** | **3** | Destructive safety | List destructive actions are not consistently confirmed in the component | Destructive scope and reversibility are explicit and consistent |
| **TASK-05** | **3** | Recurrence | Occurrence-versus-series controls are coarser than Agenda recurrence | Edit/skip/delete clearly distinguishes one occurrence, this-and-future, and series where supported |
| **CAL-01** | **3** | Agenda | No reminders/notifications | If in product scope, user can configure reliable reminders; otherwise UI/docs set expectation |
| **CAL-03** | **3** | Calendar sources | UI coverage is narrower than backend source concepts | Expose only supported source types and accurately describe each lifecycle |
| **NAV-02** | **3** | Navigation | Page state is transient React state with no URLs/back/deep links | Each primary page and contextual editor has stable routing and refresh behavior |
| **HOME-01** | **3** | Quick add | Home quick forms silently expose fewer fields/semantics than full forms | Clearly label quick defaults and offer “More options” without changing meaning |
| **WEATHER-01** | **3** | Weather | Location cannot be configured by household | Settings allows location and units with visible refresh/error state |
| **SETTINGS-02** | **3** | Time zone | Household time zone exists in data but cannot be changed | Time-zone setting is editable and all date/time workflows use it consistently |
| **SETTINGS-03** | **3** | Settings | “Gezinsinstellingen” opens a placeholder | Implement the promised settings or hide the action |
| **SETTINGS-04** | **3** | Family admin | No central family-member administration | Settings exposes add/edit/remove/restore with role and dependency context |
| **HOUSE-06** | **3** | Home Assistant setup | Token/connection setup depends on operational configuration conventions rather than a complete user-facing credential workflow | Provide a secure guided connection/test flow, or clearly document and label the feature as administrator-managed |
| **RESET-02** | **3** | Weekly reset | Skip is local component state rather than a persisted weekly decision | Skip/keep decisions survive refresh and are attributed to a reset instance |
| **RESET-03** | **3** | Weekly reset | No final completion action/history | User intentionally completes a reset and can inspect prior weeks |
| **MOT-04** | **3** | Goals | No audit/correction trail for progress changes | Changes show source, time, reason, and correction path |
| **WIDGET-01** | **3** | Dashboard | Persisted widget layout has no user customization | Add/remove/reorder/configure widgets, or remove customization language/abstractions from UI expectations |
| **DATA-01** | **3** | Error handling | Domains use inconsistent visible errors, silent catches, and optimistic success | All mutations have pending/success/error behavior and retain recovery context |
| **SEC-03** | **3** | Destructive UX | Similar destructive actions use inconsistent wording, confirmation, soft delete, and undo | Define and apply a lifecycle/confirmation policy across domains |
| **DEVICE-01** | **2** | Agenda settings | Browser-local device ID can be lost, creating orphaned server preference rows | Reuse/rotate device identity safely or provide cleanup and clear device semantics |
| **UX-01** | **2** | Localization | Seeded production content mixes English and Dutch | Demo/sample content is opt-in and localized; real empty states use one locale |
| **UX-02** | **2** | Lifecycle wording | “Remove”, “archive”, “stop”, “delete”, and “skip” vary without consistent semantics | Use a domain-wide vocabulary tied to reversibility and retention |
| **HOME-02** | **2** | Interaction semantics | Summary cards contain nested interactive actions | Use valid non-nested interaction structure and test keyboard behavior |

### P3 — Deliberate future breadth or minor completeness

| ID | Rating | Area | Confirmed problem | Required outcome / acceptance check |
| --- | ---: | --- | --- | --- |
| **NAV-03** | **1** | Media/rewards navigation | Internal workspaces are defined but not navigable | Keep hidden until implemented; do not imply availability |
| **MEDIA-01** | **1** | Media | Placeholder only | Define a household use case before implementation |
| **REWARD-01** | **2** | Rewards | No points/reward/redemption lifecycle | Implement only if cooperative motivation explicitly expands into rewards |

## Detailed findings by user area

### 1. Shell, navigation, and page state

Visible primary navigation contains Home, Agenda, Tasks, Shopping, Motivation, and Settings. Family pages, Weekly Reset, Known People, and Woning management are reachable contextually.

Problems:

- House runtime is implemented but classified as internal and has no navigation action.
- Navigation is component state rather than URL state; refresh, browser Back, sharing, and deep links do not behave like application navigation.
- Media and rewards are internal placeholders and should remain hidden until they represent real capabilities.
- Widget layout records exist but users cannot configure widgets.

### 2. First-run and demo-data boundary

The current first-run contract is not trustworthy:

- fresh databases are seeded as complete;
- demo content is indistinguishable from household content;
- the client starts with the same static family;
- onboarding creation uses the broken family-member request;
- status-load failure suppresses onboarding instead of showing an error;
- visual-review resets can force the household back to seeded demo state.

Acceptance must cover both a clean database and an upgrade of an existing database. “Delete the demo people manually” is not a valid substitute for a clean first-run state.

### 3. Family members, avatars, and known people

Family members nominally support view/add/edit/remove. In practice:

- all normal create/update operations are blocked by the dual-avatar contract;
- optimistic state and false success conceal the failure;
- add is poorly discoverable;
- an empty roster has no strong administration entry;
- delete is soft, but there is no restore UI;
- member mutation errors are swallowed.

Family-member removal does exist at:

```text
Home → select family member → Instellingen/Ouderinstellingen → Gezinslid verwijderen
```

The record is soft-deleted and references are retained. This needs central administration, error handling, and restoration.

Known People is comparatively complete: list/search/create/edit/delete and shared/private scope are available. It should be used as a reference for a clearer member-management lifecycle, while adding restore if soft deletion is retained.

### 4. Home dashboard and weather

Home provides useful summaries and quick-add actions for agenda, tasks, and shopping. Current issues:

- quick agenda create corrupts local dates/times;
- action-time “today” derives from periodically refreshed component state;
- quick forms silently omit full-form options;
- shopping suggestions are local to one browser and differ from the server-backed Shopping history;
- weather location is server-controlled rather than household-configurable;
- some interactive summary-card composition is semantically fragile.

### 5. Agenda and calendar sources

Agenda has the strongest intended CRUD design: manual event add/edit/delete, recurrence scopes, occurrence exceptions, source layers, and read-only imported events.

Its severity is nevertheless Critical because the create/update boundary mishandles calendar fields. All agenda recurrence behavior must be retested after fixing the date model; fixing only the Home shortcut is insufficient.

Other gaps:

- no reminders;
- iCal “file” is not an upload;
- source concepts exceed the completed UI;
- device preference identity depends on browser storage.

### 6. Tasks and routines

The running task page visually contains actions, but its default interaction hides them. The card itself does not clearly open a details/actions mode. The edit menu is physically clipped.

Lifecycle gaps remain after interaction repair:

- normal tasks have no standard archive/delete;
- recurring scope control is coarse;
- routine creation omits items;
- routine editing uses the wrong form;
- archived routine templates cannot be restored.

Browser-level tests must validate actual hit targets and supported viewport sizes. DOM-only click tests are not sufficient.

### 7. Shopping and lists

Existing server-backed lists and items are usable, including add, check/uncheck, soft removal/undo, rename, archive, and delete. Missing:

- creating additional lists through the normal UI;
- restoring archived lists;
- editing item label/quantity;
- consistent destructive confirmations;
- one shared cross-device suggestion/history model.

### 8. Motivation, goals, and appreciation

Family and individual goals plus helpful moments are live API data. The main issues are lifecycle semantics:

- progress looks generic but is driven by task attribution;
- users cannot directly correct progress;
- there is no progress audit trail;
- helpful moments cannot be edited/deleted;
- family goals cannot be normally stopped from Motivation.

### 9. Weekly reset

Weekly Reset assembles tasks, goals, and shopping candidates but is not a complete transaction:

- some goal buttons have no effective action;
- shopping candidates have no resolution action;
- local skip state does not represent a durable weekly decision;
- there is no explicit completed reset record or history.

The displayed completion count can therefore imply progress without every candidate being resolvable.

### 10. Woning, climate, floor plans, and Home Assistant

Floors and rooms have strong lifecycle support. Overlay editing is also substantial once an asset exists.

The user-facing chain is broken at multiple points:

```text
No House navigation
  → no runtime climate/heating access

No floor-plan upload UI
  → no first asset
  → overlay workflow blocked for normal users

No climate configuration/mapping editor
  → runtime cannot be configured

Provider endpoint HTTP 500
  → Home Assistant setup cannot load reliably
```

The live health endpoint returned 200 while `/api/climate-providers/` returned 500. This indicates a feature/schema failure rather than the entire API being down. Source and the previous audit indicate the existing database lacks newer Home Assistant resume-strategy columns.

### 11. Settings and backup

Settings exposes calendar sources, backup/restore, Known People, Woning, and Home Assistant forms, but:

- backup name/scope overpromises what is included;
- household time zone is not editable;
- family settings is a placeholder;
- family members lack central administration;
- provider lifecycle/configuration is incomplete;
- weather location is not editable.

### 12. Security, destructive tooling, and error integrity

The LAN use case increases the severity of existing development assumptions:

- no access control on UI/API;
- PostgreSQL published to the LAN;
- destructive visual-review fixture endpoints enabled in normal Development;
- fixed seeded household IDs used throughout a single-household API;
- mutation errors are sometimes suppressed;
- destructive semantics and confirmations vary by domain.

The fixture endpoint is especially urgent. Its reset service calls `RemoveRange` for event sources/series/exceptions, helpful moments, goals, tasks, recurring series, task templates/items, list items, purchase history, lists, and family members, then inserts scenario data. It must not coexist with a normal household runtime.

## Recommended implementation slices

The repository rule calls for one implementation slice per run. A safe sequence is:

1. **Family write-contract integrity:** send one avatar contract, surface errors, wait for save, and add real client-to-endpoint tests.
2. **Clean first-run boundary:** remove production demo seeding, provide opt-in demo fixtures, and verify onboarding on a clean database.
3. **Development safety:** isolate visual-review endpoints and bind PostgreSQL to loopback/internal networking.
4. **Agenda calendar-field correctness:** define household-local request semantics, fix all create/update/recurrence paths, and add DST/time-zone browser/API tests.
5. **Task interaction repair:** make card actions directly operable, repair popup clipping, add accessibility semantics, and add browser hit-target tests.
6. **Weekly Reset completion:** make every candidate resolvable and persist an explicit completed reset.
7. **House access and climate setup:** add navigation only together with functional config/mapping and a healthy provider endpoint.
8. Continue P1 lifecycle gaps, then P2 consistency work.

Do not combine all P0 work into one large change. Each slice should include its contract-level and browser-level acceptance tests.

## Minimum regression suite before calling the app reliable

1. Start from an empty database and assert that onboarding appears with no demo family.
2. Create an adult in onboarding through the real frontend and refresh.
3. Edit a member's name, color, date of birth, and avatar; assert API success and refresh persistence.
4. Simulate API failure and assert the form does not report success or discard the draft.
5. Create all-day and timed events from both Home and Agenda in Europe/Amsterdam in January and July.
6. Edit one occurrence, this-and-future, and the entire recurring series without date/time drift.
7. On Tasks, complete, reopen, move to tomorrow, and edit by mouse, keyboard, and touch-sized viewport.
8. Assert the actual click target is the intended button and no menu is clipped.
9. Start normal Development and assert visual-review reset routes are unavailable.
10. From another LAN device, assert the UI/API follows the chosen access policy and PostgreSQL is not reachable.
11. Apply migrations to both a clean and representative existing database and assert all enabled settings endpoints return non-500 responses.
12. Refresh every primary page after create/edit/remove and verify the resulting data state.

## Validation record

Performed on 2026-07-26:

- live browser inspection at `192.168.1.2:5173`;
- live task action selection, pointer-event, clipping, and hit-target checks;
- read-only `GET /health`: **200**;
- read-only `GET /api/onboarding/status`: **200**, onboarding complete with active members;
- read-only `GET /api/climate-providers/`: **500**;
- read-only `GET /api/visual-review-fixtures/marketing-time`: **200**, no active anchor at the time of the audit;
- read-only family and agenda API inspection;
- direct contract comparison for family-member requests;
- source tracing for event conversion, EF seed data, visual-review deletion scope, local storage, navigation, task CSS, and error handling;
- incorporation of the previous full CRUD/navigation audit.

Not performed:

- destructive fixture reset;
- live family mutation solely for proof, because the request/validation contradiction is conclusive and the user's data should not be changed;
- task complete/postpone mutation, because the audit needed to verify reachability without altering the user's task;
- authentication penetration testing;
- exhaustive mobile-device testing;
- restore of a backup into the active household.

## Primary implementation evidence

Key evidence locations:

- `src/HomeOps.Api/Data/HomeOpsDbContext.cs:832-843` — unconditional seed call and completed household.
- `src/HomeOps.Client/src/home/familyMembers.ts:27-31` — static Alex/Sam/Riley/Jordan fallback.
- `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx:38,73,107-136` — static initialization, async replacement, optimistic member state, silent mutation errors, onboarding fail-open.
- `src/HomeOps.Client/src/home/familyMembersApi.ts:34-65` — client sends both avatar contracts.
- `src/HomeOps.Api/FamilyMembers/FamilyMemberEndpoints.cs:135-137` — backend rejects both contracts together.
- `src/HomeOps.Client/src/home/FamilyMemberPage.tsx:125-132` — immediate optimistic success message.
- `src/HomeOps.Client/src/home/FamilyAvatarEditor.tsx:24-29` — optimistic avatar change.
- `src/HomeOps.Client/src/home/HomeDashboard.tsx:327-330,1258+` — Home quick-event date and ISO serialization.
- `src/HomeOps.Api/CalendarEvents/EventOccurrenceProjector.cs:17-33` — UTC date/time extracted into local calendar fields.
- `src/HomeOps.Api/CalendarEvents/EventSeriesEndpoints.cs:599` — recurring anchor uses UTC date.
- `src/HomeOps.Api/Program.cs:161-163` — visual fixtures mapped in normal Development.
- `src/HomeOps.Api/VisualReviewFixtures/VisualReviewFixtureEndpoints.cs:18` — destructive reset route.
- `src/HomeOps.Api/VisualReviewFixtures/VisualReviewFixtureService.cs:82-105` — deletion and demo reseeding.
- `src/HomeOps.Client/src/tasks/TasksPage.tsx:1454-1561` — generic task card and action/menu markup.
- `src/HomeOps.Client/src/styles.css:9750-9782` — hidden action rail and clipped popup positioning.
- `src/HomeOps.Client/src/home/HomeDashboard.tsx:1217` — browser-local shopping history.
- `docker-compose.yml:9` — PostgreSQL published on all host interfaces.
- `tools/dev/start-dev.ps1:237` — normal developer runtime uses `Development`.

## Bottom line

HomeOps has substantial real functionality and a genuine PostgreSQL-backed domain model, but it currently lacks a reliable boundary between demo/test state and household state. The highest-priority work is not expanding CRUD breadth. It is making first run truthful, writes honest and persistent, dates stable, task controls operable, development tooling safe, and already-built House functionality reachable only when its configuration chain works.
