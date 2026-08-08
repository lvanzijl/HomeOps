# HomeOps product-integrity remediation plan

**Created:** 2026-07-26  
**Overall implementation status:** [ ] **In progress**

**Source audit:** [x] **Completed** — see [`product-integrity-working-list.md`](../2026-07-26-consolidated-product-integrity-audit/product-integrity-working-list.md)  
**Target product phase:** Phase 2 — Durable Household Core  
**Plan purpose:** provide an ordered, implementation-ready backlog for every confirmed audit finding.

This is a remediation plan, not a statement that the defects are fixed. Existing APIs or UI foundations are called out as **existing foundation**. A phase or slice becomes implemented only when its checkbox is checked, its status says **Completed**, and every listed validation and acceptance criterion has passed.

## Status convention

Use these exact states when maintaining this document:

| Checkbox | Status | Meaning |
| --- | --- | --- |
| `[ ]` | **Not started** | No implementation work has begun. |
| `[ ]` | **In progress** | Work has begun but acceptance criteria are not all satisfied. |
| `[ ]` | **Blocked** | Work cannot continue; document the blocker and required decision. |
| `[x]` | **Completed** | Implementation, validation, documentation, and scope review all passed. |

Do not check a phase merely because one of its slices is complete. A phase is complete only when all required slices in that phase are complete.

## Phase tracker

| Done | Phase | Status | Existing implementation | Completion condition |
| --- | --- | --- | --- | --- |
| [x] | **Phase 0 — Safety baseline and regression harness** | **Completed** | Guarded PostgreSQL fixtures, real API contracts, and an isolated Playwright browser suite now exist | Repeatable clean/upgrade DB, API-contract, and browser regression gates exist |
| [ ] | **Phase 1 — LAN and destructive-development safety** | **Not started** | LAN binding and visual-review fixtures exist, but are unsafe | Database is private, fixture resets are isolated, and household API access is protected |
| [x] | **Phase 2 — Truthful first run and family persistence** | **Completed** | Slices 2.1–2.6 are complete, including family administration/restore and the persisted setup checklist | Fresh install onboards correctly; family changes survive refresh with honest error handling |
| [x] | **Phase 3 — Calendar and local-time correctness** | **Completed** | Calendar-field writes, household time zone, source lifecycle, device preferences, and truthful reminder scope are complete | Home and Agenda preserve household-local calendar intent and accurately state that notifications are not delivered |
| [ ] | **Phase 4 — Tasks and Weekly Reset completion** | **In progress** | Task APIs, routines, and Weekly Reset foundation exist; Slice 4.0 interaction authority is approved | Core task controls are operable and every reset candidate can be resolved and completed |
| [ ] | **Phase 5 — House, climate, and household settings** | **Not started** | Substantial backend and partial Settings foundation exist | Woning setup-to-runtime chain is reachable, healthy, configurable, and viewport-safe |
| [ ] | **Phase 6 — Shopping and Motivation lifecycle completion** | **Not started** | Both domains are PostgreSQL-backed | Common create/edit/archive/restore/correction workflows are complete and cross-device |
| [ ] | **Phase 7 — Navigation, backup, errors, and consistency** | **Not started** | Individual foundations exist | Cross-cutting behavior is routable, recoverable, consistently worded, and accurately backed up |
| [ ] | **Phase 8 — Optional product breadth** | **Not started** | Placeholders only | Each optional feature is either deliberately implemented or deliberately removed from product expectations |

## Rules that apply to every implementation slice

### Required workflow

1. Change the slice status to **In progress**, leaving its checkbox unchecked.
2. Re-read the source audit finding and the files listed in the slice.
3. Write or update a focused analysis before implementation when the slice affects a primary page layout. The repository's Viewport-First Workflow is mandatory.
4. Add a failing regression test that demonstrates the defect when practical.
5. Implement only the named slice. Do not opportunistically fix later slices.
6. If an API contract changes, regenerate both:
   - `src/HomeOps.Contracts/openapi.json`
   - `src/HomeOps.Client/src/api/homeOpsApiClient.ts`
7. If persistence changes:
   - add a normal EF migration;
   - include the migration `.Designer.cs`;
   - update `HomeOpsDbContextModelSnapshot.cs`;
   - verify both clean-database and existing-database upgrade paths;
   - never edit or delete household data without a narrowly proven safe predicate.
8. Run the slice-specific tests, then the common release gates below.
9. Inspect the whole changeset for unrelated edits, caches, binaries, screenshots, and generated artifacts.
10. Update `docs/state/current-state.md`, `docs/roadmap/phase-2.md`, and the slice's implementation report.
11. Change the slice to `[x] Completed` only after all acceptance criteria pass.

### Common release gates

Run from the repository root unless a slice explicitly documents why a command does not apply:

```powershell
dotnet restore HomeOps.sln
dotnet build HomeOps.sln --no-restore
dotnet test HomeOps.sln --no-build
pnpm --dir src/HomeOps.Client test
pnpm --dir src/HomeOps.Client build
npx --yes nswag run nswag.json
```

After NSwag generation, confirm there is no unexplained generated-client drift. For UI slices, also perform browser validation at common desktop and laptop sizes and verify:

- no `document.body` vertical overflow on a primary page;
- no controls are clipped or covered;
- keyboard focus reaches every action;
- create/edit/remove state survives refresh where persistence is promised;
- API failures are visible and recoverable.

### Required test environments

Maintain five explicit runtime modes:

| Environment | Database | Demo fixtures | Destructive fixture routes | Intended use |
| --- | --- | --- | --- | --- |
| `Development` | PostgreSQL | Off by default | Disabled | Normal household development |
| `Testing` | isolated per test | Test-owned only | Test-host only | Backend/integration tests |
| `E2E` | generated disposable PostgreSQL DB | Explicit scenario or clean migrated state | Enabled only here | Browser smoke tests |
| `VisualReview` | isolated disposable DB | Explicit scenario | Enabled only here | Screenshot/marketing review |
| `Production` | PostgreSQL | Never | Never | Deployed household |

## Phase 0 — Safety baseline and regression harness

- [x] **Phase status: Completed**

**Priority:** prerequisite for all P0 fixes.  
**Audit coverage:** TEST-01 and validation support for every other finding.  
**Existing foundation:** xUnit backend tests are concentrated in `tests/HomeOps.Api.Tests/UnitTest1.cs`; 48 frontend Vitest files exist; NSwag generation exists. There is no checked-in real-browser end-to-end test project.

### Slice 0.1 — Database baseline and upgrade fixtures

- [x] **Status: Completed**

**Implementation state:** the guarded PostgreSQL fixture, clean/upgrade baselines, one-command runner, and safety documentation are implemented. Focused migration validation passes 2/2, generated databases are cleaned up, and the full backend gate passes 575/575 after Slice 0.1A removed the Windows-only test blocker.

**Goal:** make clean-install and existing-install behavior repeatable before changing seed data or migrations.

**Implementation steps**

1. Add test helpers that create:
   - an empty PostgreSQL database migrated from zero;
   - a representative pre-remediation database containing untouched demo rows;
   - a representative active household containing demo IDs plus user-created rows;
   - a database one migration behind current.
2. Keep test databases isolated by generated database name. Drop only the generated test database in teardown.
3. Add assertions for applied migration names and expected schema columns, especially Home Assistant resume-strategy columns.
4. Add a documented, read-only backup step before a developer tests an upgrade against their local household.
5. Prefer PostgreSQL integration coverage for date/time, unique constraints, and migrations; EF InMemory is insufficient for these.

**Likely files**

- `tests/HomeOps.Api.Tests/HomeOps.Api.Tests.csproj`
- split new helpers/tests out of `tests/HomeOps.Api.Tests/UnitTest1.cs`
- `src/HomeOps.Api/Migrations/`
- new `docs/development/database-testing.md`

**Validation**

- A clean DB reaches the latest migration.
- An old DB upgrades without data loss.
- Tests cannot point at the normal `homeops` development database.

**Done when**

- A junior can run one documented test command and reproduce clean/upgrade paths without touching household data.

### Slice 0.1A — Cross-platform Home Assistant test isolation

- [x] **Status: Completed**

**Implementation state:** the test fixture now treats differently-cased token names as aliases on Windows, preserves and restores any existing value, and uses the compatibility key to retain fallback coverage on case-sensitive operating systems. Focused Home Assistant validation passes 28/28 and the full backend suite passes 575/575.

**Goal:** remove the Windows-only backend-suite blocker without changing Home Assistant product behavior.

**Implementation steps**

1. Make the Home Assistant credential test fixture treat differently-cased environment-variable names as aliases on Windows.
2. Preserve and restore any pre-existing developer credential value.
3. Keep the fallback configuration-key path covered on case-sensitive operating systems.
4. Re-run the focused Home Assistant provider tests, PostgreSQL migration tests, and full backend suite.

**Done when**

- All `HomeAssistantClimateProviderTests` pass on Windows.
- The full backend suite passes.
- Slice 0.1 can be moved from blocked to completed.

### Slice 0.2 — Real API contract tests

- [x] **Status: Completed**

**Implementation state:** four isolated real-endpoint contract tests now characterize frontend-shaped family-member create/update requests. They prove that the current dual-avatar payload receives HTTP 400 without persistence, while the canonical `avatarSelection`-only payload persists and round-trips through POST/PUT, the database, and GET. Slice 0.2A removed the unrelated frontend date-gate blocker. Focused contract tests pass 4/4, focused frontend adapter tests pass 2/2, the frontend suite passes 310/310, the backend suite passes 579/579, and both builds pass.

**Goal:** catch frontend/backend request contradictions such as the family avatar payload.

**Implementation steps**

1. Introduce a small contract-test layer that sends serialized request bodies matching the frontend adapters to a real `WebApplicationFactory<Program>`.
2. Cover create and update for family members first.
3. Assert status code, validation body, persisted record, and round-trip DTO.
4. Add contract tests whenever a handwritten API adapter remains.
5. Prefer generated NSwag clients for new or corrected API consumption; do not manually edit the generated client.

**Likely files**

- `tests/HomeOps.Api.Tests/`
- `src/HomeOps.Client/src/home/familyMembersApi.test.ts`
- `src/HomeOps.Contracts/openapi.json`
- `src/HomeOps.Client/src/api/homeOpsApiClient.ts`

**Done when**

- The current dual-avatar payload fails a regression test before Phase 2, and the corrected payload later passes against the actual endpoint.

### Slice 0.2A — Frontend local-calendar test stability

- [x] **Status: Completed**

**Implementation state:** date-only Agenda arithmetic now uses UTC calendar fields instead of mixing local-midnight mutation with UTC serialization, so day addition is independent of the machine offset. The Home weather assertion now verifies the intended browser-local rendering contract without hard-coding a UTC display time. The two affected files pass 44/44, the frontend suite passes 310/310, the backend suite passes 579/579, and the frontend production build passes.

**Goal:** remove the seven date-sensitive frontend gate failures blocking Slice 0.2 without expanding into the Phase 3 calendar remediation.

**Implementation steps**

1. Make date-only Agenda day addition independent of the machine's UTC offset.
2. Keep weather-hour rendering in browser-local time and make its assertion timezone-independent.
3. Re-run the two affected test files, full frontend suite/build, and backend gate.

**Done when**

- All affected Agenda and Home weather tests pass in Europe/Amsterdam.
- The full frontend and backend gates pass.
- Slice 0.2 can be moved from blocked to completed.

### Slice 0.3 — Browser E2E smoke suite

- [x] **Status: Completed**

**Implementation state:** a pinned Playwright 1.62.0 project now runs six Chromium smoke scenarios through one root command. The runner creates a guarded `homeops_e2e_<guid>` PostgreSQL database, migrates it through the real API, starts API and Vite on test-only loopback ports, waits for health, and drops only the generated database in cleanup. The former `TIME-01` expected failure was promoted to a normal passing regression in Slice 3.3, and the former `TASK-UI-01`/`TASK-UI-02` expected failure was promoted in Slice 4.1 with mouse/keyboard and 1280×720 hit-target coverage. All six scenarios are normal passing regressions. Failure-only screenshots/traces and browser output are ignored and absent from the changeset.

**Goal:** detect hit-target, clipping, refresh-persistence, route, and viewport failures that jsdom cannot see.

**Implementation steps**

1. Add a repository-owned Playwright test project, preferably `tests/HomeOps.E2E/`.
2. Pin `@playwright/test`; do not use an unpinned `latest` dependency.
3. Provide a test-only start command that launches isolated PostgreSQL, API, and Vite and waits for health.
4. Seed only explicit E2E fixtures.
5. Add initial smoke tests:
   - fresh install shows onboarding;
   - member save survives refresh;
   - Home “today” event stays today;
   - task Complete/Tomorrow/Edit controls are real hit targets;
   - every primary page has no document-level vertical scrollbar.
6. Capture screenshots only on failure; keep generated test artifacts ignored.

**Likely files**

- new `tests/HomeOps.E2E/package.json`
- new `tests/HomeOps.E2E/playwright.config.ts`
- new `tests/HomeOps.E2E/specs/`
- root `package.json`
- `.gitignore`
- `tools/dev/` or a new `tools/test/` helper

**Pitfall**

- A Playwright locator can still click an obscured element with force. Do not use forced clicks. Assert `elementFromPoint`/visibility and perform normal pointer interaction.

**Done when**

- The four initial smoke tests fail for the known defects and can run locally and in CI without the developer's household database.

### Phase 0 exit criteria

- [x] Clean and upgrade database fixtures pass.
- [x] Real API contract test infrastructure passes.
- [x] Browser smoke suite runs against isolated data.
- [x] Test artifacts and caches are ignored and absent from the changeset.

## Phase 1 — LAN and destructive-development safety

- [ ] **Phase status: In progress**

**Priority:** P0 / Critical. Complete before encouraging LAN use.  
**Audit coverage:** SEC-01, SEC-02, FIXTURE-01.  
**Existing foundation:** `pnpm dev` binds API/Vite to the LAN; PostgreSQL is published on all interfaces; fixtures are mapped in normal Development.

### Slice 1.1 — Isolate visual-review fixtures

- [ ] **Status: Not started**

**Audit ID:** FIXTURE-01

**Implementation steps**

1. Change `Program.cs` so `MapVisualReviewFixtureEndpoints()` is called only in the explicit `VisualReview` environment. Testing should invoke fixture services directly or use a test-only host opt-in.
2. Do not register `VisualReviewMarketingTimeProvider` as a normal UI dependency if it is unnecessary outside VisualReview.
3. Make `visualReviewTime.ts` call the fixture clock only in an explicit Vite visual-review build mode.
4. Add endpoint-availability tests:
   - Development: reset route returns 404;
   - Production: 404;
   - VisualReview: available;
   - Testing: available only in the dedicated fixture-host test.
5. Update `docs/development/visual-review-runtime.md`.

**Likely files**

- `src/HomeOps.Api/Program.cs`
- `src/HomeOps.Api/VisualReviewFixtures/`
- `src/HomeOps.Client/src/visualReviewTime.ts`
- Vite environment typings/config
- backend and frontend tests

**Done when**

- Normal `pnpm dev` cannot list or reset visual scenarios, and ordinary Home/Agenda never receives a fixture anchor.

### Slice 1.2 — Keep PostgreSQL off the LAN

- [ ] **Status: Not started**

**Audit ID:** SEC-02

**Implementation steps**

1. Change Compose from `5432:5432` to `127.0.0.1:5432:5432`, or remove host publishing and run API inside the Compose network.
2. Keep the API usable from another LAN device; only PostgreSQL must be private.
3. Move the development password into `.env`/environment configuration. Commit `.env.example`, never `.env`.
4. Make the startup script wait on the correct local endpoint.
5. Document how Rancher Desktop/Docker Desktop users rotate the local password without deleting the volume.

**Likely files**

- `docker-compose.yml`
- `.env.example`
- `.gitignore`
- `tools/dev/start-dev.ps1`
- deployment documentation

**Validation**

- Host machine can reach PostgreSQL on `127.0.0.1:5432`.
- Another LAN machine cannot connect to `<host-ip>:5432`.
- UI remains reachable at `<host-ip>:5173`.

### Slice 1.3 — Add a household access boundary

- [ ] **Status: Not started**

**Audit ID:** SEC-01

**Recommended MVP design**

Use one household-wide access passphrase and server session. Do **not** turn Family Members into authentication identities in this slice.

**Implementation steps**

1. Add an architecture decision record describing the LAN threat model and the chosen single-household access model.
2. Store only a strong password hash in server configuration or a protected secret store.
3. Add ASP.NET Core cookie authentication:
   - `HttpOnly`;
   - `SameSite=Strict` where compatible;
   - `Secure` in HTTPS deployments;
   - short idle timeout with renewable session.
4. Add `/api/access/status`, `/api/access/unlock`, and `/api/access/lock`.
5. Require authorization for every household-data and command endpoint.
6. Leave `/health` anonymous but return no sensitive details.
7. Add rate limiting and constant-time password verification behavior.
8. Add CSRF protection for cookie-authenticated mutations. The Vite proxy makes same-origin browser requests practical in development.
9. Add a compact unlock page and explicit locked/error states.
10. Update deployment docs for HTTPS/reverse-proxy use. Never claim a shared password provides individual accountability.

**Likely files**

- new `src/HomeOps.Api/Access/`
- `src/HomeOps.Api/Program.cs`
- `src/HomeOps.Api/appsettings*.json`
- new frontend access API/page
- `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx`
- API and E2E tests
- new architecture decision under `docs/decisions/`

**Acceptance tests**

- Anonymous API reads and writes return 401.
- Valid unlock creates a session; invalid attempts are rate-limited.
- Mutations without the CSRF mechanism fail.
- A second LAN device can unlock and use the app.
- Secrets never appear in logs, OpenAPI examples, backup files, or diagnostics.

### Phase 1 exit criteria

- [ ] Visual-review reset endpoints are absent from normal development and production.
- [ ] PostgreSQL is not reachable from the LAN.
- [ ] Household API/UI requires the selected access boundary.
- [ ] Deployment and local-development instructions are updated.

## Phase 2 — Truthful first run and family persistence

- [x] **Phase status: Completed**

**Priority:** P0/P1.  
**Audit coverage:** BOOT-01, MEMBER-01, MEMBER-02, ONB-01, ONB-02, ONB-03, FAMILY-01, FAMILY-02, UX-01.  
**Implementation state:** Slices 2.1–2.6 are complete. Production bootstrap is separated from demo data; family-member avatar writes use the canonical contract; mutations expose failures; onboarding is atomic and fail-safe; central family administration supports removal and restore; and the optional post-onboarding setup checklist is household-persisted.

### Slice 2.1 — Canonical family-member avatar contract

- [x] **Status: Completed**

**Implementation state:** current frontend create/update adapters now derive and send only canonical `avatarSelection`. The backend continues accepting a single legacy `avatarV2Config` for compatibility, rejects ambiguous mixed payloads, and continues maintaining its legacy storage projection; public DTOs and persistence are unchanged. Focused frontend serialization tests pass 2/2, real-endpoint contract tests pass 5/5, the avatar refresh E2E scenario is a normal pass, the full frontend suite passes 310/310, the full backend suite passes 580/580, and both builds pass.

**Audit IDs:** MEMBER-01, TEST-01

**Implementation steps**

1. Make `avatarSelection` the only avatar field sent by current frontend create/update requests.
2. Keep backend acceptance of `avatarV2Config` temporarily only for old external clients if compatibility is required.
3. Remove frontend conversion that always adds both payloads.
4. Update the generated OpenAPI/client if public request DTOs change.
5. Update tests so they assert exactly one avatar representation.
6. Test both member create and update against the real endpoint.
7. Do not remove legacy database columns in this slice unless a separately reviewed migration proves they are unused and safely backfilled.

**Likely files**

- `src/HomeOps.Client/src/home/familyMembersApi.ts`
- `src/HomeOps.Client/src/home/familyMembersApi.test.ts`
- `src/HomeOps.Api/FamilyMembers/FamilyMemberEndpoints.cs`
- Family Member DTOs
- contract/integration tests

**Done when**

- Create/update returns 200/201, database contains the normalized selection, and refresh returns the same avatar.

### Slice 2.2 — Honest asynchronous member mutations

- [x] **Status: Completed**

**Implementation state:** family-member add, profile update, avatar update, and removal now await their API calls. Pending mutations disable duplicate submission and prevent their dialog from closing. Rejected requests retain the draft, expose an alert and retry action, and never update shell state or show success; onboarding member creation likewise retains its fields after failure. Successful profile and avatar updates are covered through the real browser/API/database path and survive refresh. Focused mutation tests pass 39/39, the frontend suite passes 317/317, the backend suite passes 580/580, both builds pass, and all five isolated browser outcomes pass with three unrelated known defects remaining as expected failures.

**Audit IDs:** MEMBER-02, DATA-01

**Implementation steps**

1. Change shell callbacks for add/update/delete to return `Promise`.
2. Remove `.catch(() => undefined)` from member mutations.
3. Give forms explicit `idle`, `saving`, `saved`, and `error` state.
4. Keep dialogs open while saving.
5. Show “Gegevens opgeslagen” only after the server response.
6. On failure, retain the draft and show a retry action.
7. If optimistic rendering remains, store the previous value and roll back on failure.
8. Disable duplicate submits while pending.

**Likely files**

- `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx`
- `src/HomeOps.Client/src/home/FamilyMemberPage.tsx`
- `src/HomeOps.Client/src/home/FamilyAvatarEditor.tsx`
- add-member dialog/wizard tests

**Acceptance tests**

- Simulated 400 and 500 responses never display success.
- Closing/reopening after a failed save retains or clearly discards the draft.
- Successful update survives browser refresh.

### Slice 2.3 — Separate production bootstrap from demo data

- [x] **Status: Completed**

**Implementation state:** production model bootstrap now creates only an incomplete household plus application-owned structural defaults. Family members, lists/items, motivation goals, and calendar events are no longer model-seeded, and the frontend no longer renders a static family fallback while the API is loading. The explicit `Demo` environment applies the localized `visual-full` fixture; legacy tests that require the historical English graph opt into a test-only fixture. Migration `20260727121951_SeparateProductionBootstrapFromDemoData` removes only the exact untouched legacy graph. Any legacy graph mixed with user data or changed avatar/profile state is preserved and marked with `LegacyDemoDataReviewRequired` for later administrator review. Fresh-install, exact-cleanup, mixed-data, and avatar-only upgrade regressions pass against PostgreSQL; VisualReview fixture regressions remain green.

**Audit IDs:** BOOT-01, UX-01

**Implementation steps**

1. Classify current EF seed entries:
   - structural/application-owned defaults;
   - household demo content;
   - visual-review-only content.
2. Move household demo content to `VisualReviewFixtureService` or an explicit `Demo` environment.
3. Remove the static frontend family fallback. Use loading skeleton/empty/error states instead.
4. Ensure a fresh database has a household bootstrap record with `OnboardingCompleted = false` and no active members, or create the household through a first-run endpoint.
5. **Do not blindly generate a migration that deletes fixed seed IDs.** Existing users may have edited or referenced those rows.
6. Add a safe transition:
   - detect an exact untouched demo graph using known IDs and values;
   - clean it automatically only when no non-demo household content exists;
   - otherwise mark it for an administrator-reviewed cleanup preview;
   - never delete mixed user/demo data automatically.
7. Localize any opt-in demo scenario.

**Likely files**

- `src/HomeOps.Api/Data/HomeOpsDbContext.cs`
- `src/HomeOps.Api/Lists/SeedLists.cs`
- `src/HomeOps.Api/Motivation/SeedMotivation.cs`
- task/calendar/workspace seed files
- `src/HomeOps.Api/VisualReviewFixtures/`
- `src/HomeOps.Client/src/home/familyMembers.ts`
- `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx`
- EF migration and migration tests

**Acceptance tests**

- Fresh DB: no Alex/Sam/Riley/Jordan, `requiresOnboarding: true`.
- VisualReview: explicit scenario still has stable demo content.
- Existing active household: migration changes no user-created records.
- Mixed demo/user database: no automatic destructive cleanup.

### Slice 2.4 — Fail-safe, atomic onboarding

- [x] **Status: Completed**

**Implementation state:** onboarding now stages household/member edits locally and submits one typed completion request. The backend validates household, IANA time zone, adult, member, child birth-date, and canonical avatar fields before writing members and completion state in one relational transaction; a completed retry returns the existing result without duplicating members. Review can remove drafts or return to the relevant member step for corrections. Unknown onboarding status fails closed behind a visible retry state. OpenAPI and the TypeScript client were regenerated with NSwag 14.7.1. Focused backend tests pass 3/3, focused frontend tests pass 18/18, the backend suite passes 584/584, the frontend suite passes 319/319, both builds pass, generation is idempotent, and the isolated browser/PostgreSQL path completes onboarding and remains completed after refresh.
**Audit IDs:** ONB-01, ONB-02

**Recommended design**

Submit household setup and the reviewed member collection in one transactional completion request instead of creating permanent members one wizard step at a time.

**Implementation steps**

1. Add a typed onboarding completion request containing household basics and reviewed members.
2. Validate at least one adult and all avatar/member fields before writing.
3. Write members and set `OnboardingCompleted` in one transaction.
4. Make Review editable: back/edit/remove without leaving partial database records.
5. If status loading fails, show retry/error and do not enter the main app.
6. Make completion idempotent so retry after a lost response does not duplicate members.
7. Regenerate OpenAPI/NSwag.

**Likely files**

- `src/HomeOps.Api/Households/OnboardingEndpoints.cs`
- onboarding DTOs
- `src/HomeOps.Client/src/FirstRunWizard.tsx`
- `src/HomeOps.Client/src/onboardingApi.ts`
- `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx`

**Acceptance tests**

- Validation failure writes nothing.
- Network retry produces one household/member set.
- Refresh during an incomplete wizard returns to onboarding.
- Successful finish enters Home and survives refresh.

### Slice 2.5 — Central family administration and restore

- [x] **Status: Completed**

**Audit IDs:** FAMILY-01, FAMILY-02, SETTINGS-04

**Implementation state:** Settings now exposes bounded central family administration even when the active roster is empty. Add and edit reuse one pending/error-aware profile form; removal shows preserved task, room, individual-goal, and private-known-person dependencies; removed members remain excluded from normal reads but appear in administration and can be restored unless an active-name conflict is returned. Completed households with no active members remain in the application instead of restarting onboarding. OpenAPI and the generated TypeScript client include the new reads/restore operation and are idempotent under NSwag 14.7.1. Focused backend tests pass 14/14, focused frontend tests pass 19/19, backend passes 587/587, frontend passes 323/323, restore/build/model-drift gates pass, and all 6 browser outcomes pass, including empty-roster add/remove/restore across refresh and Settings viewport fit.

**Implementation steps**

1. Add a visible `Gezinsleden` Settings entry that works with zero active members.
2. Reuse the corrected family form for add/edit.
3. Add an API query for removed members and a restore endpoint.
4. Show dependency information before removal: tasks, rooms, goals, and private known people.
5. Preserve soft-delete semantics; do not silently reassign references.
6. Add restore conflict handling if a name or relationship changed.
7. Follow the Viewport-First Workflow before changing the primary Settings composition.

**Acceptance tests**

- Remove and restore both survive refresh.
- Empty roster still exposes Add.
- Removed member is excluded from normal pickers but visible in administration.

### Slice 2.6 — First-run setup checklist

- [x] **Status: Completed**
**Audit ID:** ONB-03

**Implementation state:** onboarding completion now reveals a bounded, dismissible optional setup checklist whose dismissal is persisted per household. Its status is derived from durable list, non-system calendar-source, and active Home Assistant provider state; weather remains honestly unconfigured until `WEATHER-01`. Existing completed households are backfilled as dismissed so an upgrade cannot unexpectedly replay first-run UI. NSwag 14.7.1 output is generated and idempotent; backend passes 588/588, frontend passes 325/325, builds and EF model-drift validation pass, PostgreSQL migration tests pass 3/3, and all 6 browser outcomes pass, including dismissal persistence and zero document overflow at 1366×768.

**Implementation steps**

1. Keep mandatory onboarding small: household name, time zone, and at least one adult.
2. After completion, show a dismissible server-persisted checklist for optional weather location, first list, calendar source, and Woning/Home Assistant setup.
3. Do not block normal use on optional integrations.
4. Persist dismissal/completion per household, not in browser storage.

**Done when**

- Users understand what is configured and what remains optional without turning onboarding into a long wizard.

### Phase 2 exit criteria

- [x] Clean install enters onboarding with no demo people.
- [x] Add/edit/avatar/remove/restore survive refresh.
- [x] Failed family mutations are visible and recoverable.
- [x] Onboarding is atomic and fail-safe.
- [x] Existing household upgrade is non-destructive.

## Phase 3 — Calendar and local-time correctness

- [x] **Phase status: Completed**

**Priority:** P0 first, then calendar lifecycle.  
**Audit coverage:** TIME-01, TIME-02, SETTINGS-02, CAL-02, CAL-03, DEVICE-01, CAL-01.  
**Existing foundation:** manual events, recurring series/occurrences, sources, imports, and layer settings exist.

### Slice 3.1 — Define the calendar-field contract

- [x] **Status: Completed**
**Audit ID:** TIME-01

**Implementation state:** the approved calendar-field contract is recorded in [`2026-07-27-calendar-field-contract/implementation.md`](../2026-07-27-calendar-field-contract/implementation.md). Manual writes will carry `DateOnly`/optional `TimeOnly` fields under the authoritative household zone; imported instants use a separate explicit normalization path. The contract defines all-day, timed, multi-day, recurrence, exception, split, nonexistent-DST, and ambiguous-fall-back behavior, plus the required pre-implementation regression matrix for Slice 3.2. The build and full backend/frontend test gates passed (588 backend and 325 frontend tests). Parent-owned pinned NSwag generation ran twice successfully, and the second run left `src/HomeOps.Contracts/openapi.json` and `src/HomeOps.Client/src/api/homeOpsApiClient.ts` unchanged. No endpoint, persistence, client, OpenAPI, or generated-client behavior changed in this design-only slice.

**Required design decision**

HomeOps stores household calendar intent as `DateOnly` plus optional `TimeOnly`. Requests should therefore carry calendar fields, not a JavaScript instant that the backend later reinterprets.

**Recommended request shape**

```text
startDate: YYYY-MM-DD
startTime: HH:mm | null
endDate: YYYY-MM-DD
endTime: HH:mm | null
isAllDay: boolean
timeZoneId: omitted when the household setting is authoritative
```

**Implementation steps**

1. Document invariants for all-day, timed, multi-day, recurring, exception, and imported events.
2. Treat imported UTC instants separately from user-entered local calendar fields.
3. Reject nonexistent local DST times with a clear message.
4. Define deterministic handling for ambiguous fall-back times.
5. Write tests before changing endpoints.

**Output**

- A short technical design report approved as the contract for the following slices.

### Slice 3.2 — Correct backend event writes and recurrence

- [x] **Status: Completed**

**Audit ID:** TIME-01

**Implementation state:** manual create/update endpoints now accept authoritative `DateOnly`/optional `TimeOnly` calendar fields, while occurrence modification and splitting accept one optional atomic `timing` object. One household-zone resolver validates all-day/timed ranges, rejects nonexistent DST times, and selects the first ambiguous fall-back occurrence. Recurrence anchoring and single-series read projections use household-local dates and the household IANA zone. UTC and `TZID` iCalendar values normalize into household-local fields, while floating and all-day values remain calendar fields; the normalization zone participates in imported-event fingerprints. Migration `20260807185444_AddCalendarWriteContractVersion` marks existing writable manual events as version 1, new writes as version 2, and leaves imports unversioned. Review candidates, preview, and confirmed concurrency-checked repair endpoints provide an explicit no-auto-shift repair path. A deprecated UTC-input compatibility shim remains only so the existing Slice 3.3 frontend stays deployable; Slice 3.3 must migrate all callers and remove those fields. OpenAPI and the generated client are idempotent under pinned NSwag 14.7.1. Backend passes 598/598, frontend passes 325/325 with the documented timeout-sensitive tests given a 20-second budget, both builds pass, and EF reports no pending model changes.

**Implementation steps**

1. Replace `DateOnly.FromDateTime(startUtc.UtcDateTime)` and matching `TimeOnly` extraction on manual write paths.
2. Accept the calendar-field request defined in Slice 3.1.
3. Update:
   - series create/update;
   - one-occurrence modification;
   - this-and-future split;
   - skip/restore projection;
   - recurrence anchor calculation.
4. Keep source-import normalization explicit: convert provider instants into household-local fields using the household time zone.
5. Regenerate OpenAPI/NSwag.
6. Add PostgreSQL integration tests for Europe/Amsterdam January/July, DST start/end, all-day, timed, and multi-day events.

**Likely files**

- `src/HomeOps.Api/CalendarEvents/EventOccurrenceProjector.cs`
- `src/HomeOps.Api/CalendarEvents/EventSeriesEndpoints.cs`
- event request/DTO files
- occurrence/recurrence tests

**Data repair**

- Do not automatically shift existing manual events. Original intent cannot always be inferred.
- Build a read-only diagnostic report listing suspicious events and a separate confirmed repair action with preview.

### Slice 3.3 — Correct frontend event forms and quick actions

- [x] **Status: Completed 2026-08-07**

**Audit IDs:** TIME-01, TIME-02, HOME-01

**Implementation steps**

1. Stop using `Date.toISOString()` for user-entered calendar fields.
2. Keep date input strings as `YYYY-MM-DD` and time strings as `HH:mm`.
3. Resolve “today” and “tomorrow” from `new Date()` at submit time, then interpret through the household time zone.
4. Share one mapper between Home quick-add and Agenda full forms.
5. Add “Meer opties” when quick-add omits recurrence/location/participants rather than silently changing semantics.
6. Add frontend and browser tests with a fixed system clock and multiple time zones.

**Implementation state:** all manual frontend write paths now use one literal calendar-field mapper, including create, series edit, occurrence edit, split, and Home quick-add. Server-authoritative household-zone state drives form projection and action-time today/tomorrow resolution. Home provides `Meer opties` with explicit draft transfer to the bounded Agenda editor. Settings provides a bounded one-event-at-a-time `Kalendercontrole` workflow with retained inputs, server preview, confirmation, and conflict recovery. The temporary UTC request shim is removed from backend DTOs, OpenAPI, and generated TypeScript contracts. The viewport analysis is recorded in [`2026-08-07-calendar-fields-frontend/viewport-analysis.md`](../2026-08-07-calendar-fields-frontend/viewport-analysis.md). Backend passes 598/598, frontend passes 332/332 with the documented extended timeout, builds pass, the six-scenario Playwright suite passes, and pinned NSwag 14.7.1 is twice idempotent.

**Likely files**

- `src/HomeOps.Client/src/home/HomeDashboard.tsx`
- `src/HomeOps.Client/src/agenda/calendarEventsApi.ts`
- Agenda form components/tests

### Slice 3.4 — Household time-zone setting

- [x] **Status: Completed**

**Audit ID:** SETTINGS-02

**Implementation steps**

1. Add validated time-zone read/update API using IANA identifiers.
2. Show current zone and a searchable supported list in Settings.
3. Define whether changing the zone preserves local wall-clock intent or absolute instants for each source type.
4. Invalidate/reproject affected caches.
5. Require explicit confirmation describing the effect on imported and manual events.

**Implementation state:** the API exposes the current household zone, searchable supported IANA identifiers, an impact preview, and a confirmed concurrency-aware update. Enabled iCal sources are force-loaded without conditional cache shortcuts before any write. A failed source returns source-specific feedback and leaves the zone/events untouched; successful prepared snapshots and the zone change commit in one transaction. Manual calendar fields remain unchanged and reproject on reads. Disabled sources are marked stale, remain hidden, and must refresh successfully under the current zone before re-enabling. Settings uses the approved bounded-dialog composition with searchable selection, effect counts, confirmation, pending state, and retained source failures. Migration `20260807202026_AddEventSourceNormalizationTimeZone` records the last normalization zone. The viewport report is [`2026-08-07-household-time-zone/viewport-analysis.md`](../2026-08-07-household-time-zone/viewport-analysis.md). Backend 606/606, frontend 334/334, PostgreSQL 6/6, both builds, six Playwright scenarios, EF drift/script checks, and twice-identical pinned NSwag 14.7.1 generation pass.

### Slice 3.5 — Calendar source lifecycle completion

- [x] **Status: Completed**

**Audit IDs:** CAL-02, CAL-03

**Implementation steps**

1. Replace the pseudo-file form with a real file picker and multipart upload to the existing file-content store.
2. Display filename, last import, source health, refresh, and replace-file actions.
3. Expose only genuinely supported source types.
4. Provide archive/remove and reconnect behavior with clear imported-event consequences.
5. Test invalid type, oversize file, malformed iCalendar, duplicate import, refresh, and removal.

**Implementation state:** multipart `.ics` create/replace, 5 MiB enforcement, pre-persistence parsing and duplicate detection, opaque managed storage, safe source DTOs, HTTPS feed reconnect preflight, archive/restore/permanent removal, and bounded Settings lifecycle dialogs are implemented. The legacy public file-reference request shape is removed. Backend 615/615, frontend 336/336, builds, focused lifecycle regressions, PostgreSQL migration tests 3/3, Playwright 6/6 with both target viewport sizes, EF drift/script checks, and twice-idempotent pinned NSwag generation pass.

### Slice 3.6 — Stable per-device settings identity

- [x] **Status: Completed**

**Audit ID:** DEVICE-01

**Implementation steps**

1. Give the local device key a version and last-seen timestamp.
2. Reuse it across normal app upgrades.
3. Add server cleanup for stale device-setting rows.
4. Provide “Reset settings for this device” and explain that layer visibility is device-specific.
5. Never use device identity as authentication.

**Implementation state:** the client persists versioned identity JSON, migrates the legacy string key in place, sends ID/version headers, and creates a fresh identity only after a confirmed successful reset. The server records schema version plus created/last-seen timestamps, backfills existing device owners, cascades preference cleanup, touches activity on reads/writes, and removes identities inactive for more than 180 days through a daily service. Agenda explains device/browser scope and non-authentication semantics inside the approved bounded dialog. Backend 622/622, frontend 339/339, PostgreSQL migration tests 3/3, both builds, Playwright 6/6 at both target viewports, EF drift/script checks, and twice-identical pinned NSwag 14.7.1 generation pass.

### Slice 3.7 — Reminder decision and implementation

- [x] **Status: Completed**

**Audit ID:** CAL-01

**Decision gate**

Choose one:

- implement local browser notifications with documented device limitations; or
- defer reminders and remove any product implication that HomeOps will notify users.

If implemented, add permission UX, per-event/default settings, a server scheduler or service-worker design, delivery state, time-zone tests, and failure visibility. Do not treat an in-page timer as a reliable reminder.

**Decision and implementation state:** reliable reminders are explicitly deferred. Agenda truthfully states that HomeOps stores appointments but sends no reminders or notifications, and it exposes no reminder controls. Settings operation feedback is labeled as in-app activity/status rather than notifications. [`0007-reliable-reminders-deferred.md`](../../decisions/0007-reliable-reminders-deferred.md) requires persisted rules, background scheduling, acknowledgements, per-device permission/subscription lifecycle, household-zone behavior, and failure visibility before any future implementation. No reminder or notification infrastructure was added. Backend 622/622, frontend 340/340, both builds, and Playwright 6/6 at both target viewports pass.

### Phase 3 exit criteria

- [x] Home and Agenda preserve date/time intent in all supported flows.
- [x] Existing suspicious events have a safe review/repair path.
- [x] Household time zone is configurable.
- [x] File imports are real uploads.
- [x] Device settings have documented lifecycle.
- [x] Reminder scope is explicitly implemented or explicitly deferred.

## Phase 4 — Tasks and Weekly Reset completion

- [ ] **Phase status: In progress**

**Priority:** P0/P1.  
**Audit coverage:** TASK-UI-01, TASK-UI-02, TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, RESET-01, RESET-02, RESET-03.  
**Existing foundation:** task CRUD, completion/reopen, tomorrow, recurrence, templates, and reset APIs exist.

### Slice 4.0 — Mandatory Tasks viewport/interaction analysis

- [x] **Status: Completed 2026-08-08**

Before changing Tasks layout or action placement, write the repository-required analysis covering current page composition, reserved viewport regions, primary/secondary actions, density/overflow strategy, laptop fit, and alternatives. The approved analysis is the implementation contract for Slices 4.1–4.3.

**Approved authority:** `docs/reports/2026-08-08-tasks-interaction-analysis/viewport-analysis.md`. The existing fixed command/main-grid/secondary-rail composition remains authoritative. Task cards must use a semantic title/details control plus directly visible Complete/Reopen, eligible Tomorrow, and More controls; the controlled More menu must be portalled outside clipping ancestors and provide named state, Escape/outside-click close, and focus return. Normal-task archive and routine management remain in bounded internally scrolling surfaces. No product code changed in this analysis-only slice.

### Slice 4.1 — Make task actions directly operable

- [x] **Status: Completed 2026-08-08**

**Audit IDs:** TASK-UI-01, TASK-UI-02

**Implementation steps**

1. Replace the generic clickable `<li>` interaction with semantic controls.
2. Make the title/details action and primary Complete/Reopen action visible without selection mode.
3. Keep Tomorrow available where valid.
4. Render overflow actions in a popup that is not inside a clipping container; use a portal or remove the conflicting overflow boundary.
5. Add `aria-expanded`, accessible names, Escape handling, outside-click close, and predictable focus return.
6. Preserve the approved viewport composition; use component-internal overflow, not page scroll.
7. Add real-browser mouse, keyboard, and 1280×720 hit-target tests.

**Likely files**

- `src/HomeOps.Client/src/tasks/TasksPage.tsx`
- `src/HomeOps.Client/src/styles.css`
- `src/HomeOps.Client/src/tasks/TasksPage.test.tsx`
- E2E task specs

**Implementation state:** task list items are now non-interactive containers with named title/details, Complete/Reopen, eligible Tomorrow, and More buttons that are visible without selection. More uses a controlled, viewport-clamped document portal with expanded/control state, first-item focus, Escape focus return, outside-click and scroll closure, and no clipping ancestor. Real-browser checks prove at least 40×40 hit geometry, pointer activation, keyboard behavior, popup bounds, and zero document overflow at 1280×720; established 1440×900 and 1366×768 viewport checks remain passing. Focused frontend 12/12, full frontend 342/342, backend 622/622, both builds, and PostgreSQL-backed Playwright 6/6 pass. See `docs/reports/2026-08-08-task-actions/implementation.md`.

### Slice 4.2 — Normal task archive/delete

- [x] **Status: Completed 2026-08-08**

**Audit ID:** TASK-01

**Implementation steps**

1. Define archive versus permanent delete and recurrence scope.
2. Prefer reversible archive for normal tasks.
3. Add list/archive/restore endpoints if missing.
4. Add visible confirmation for permanent deletion.
5. Keep completion distinct from archive.
6. Add dependency and restore tests.

**Implementation state:** normal non-recurring tasks can be archived without changing completion, due date, or ownership; archived tasks are absent from operational routes and available through a dedicated list/restore contract. Permanent deletion requires an archived normal task plus explicit confirmation. Recurring tasks are rejected and remain governed by Slice 4.4. The approved `Archief` rail tile opens an internally bounded restore/delete surface with task-specific confirmation and recoverable failure state. Pinned NSwag is idempotent, PostgreSQL migration/model-drift tests pass, and browser coverage proves archive, restore, cancellation, confirmed deletion, and no document overflow. See `docs/reports/2026-08-08-task-lifecycle/implementation.md`.

### Slice 4.3 — Routine/template lifecycle

- [x] **Status: Completed 2026-08-08**

**Audit IDs:** TASK-02, TASK-03, TASK-04

**Implementation steps**

1. Create a dedicated routine editor with template name, description, and an ordered non-empty item collection.
2. Do not reuse the single-task dialog for template editing.
3. Support add/edit/remove/reorder item before saving.
4. Add archived-template view, restore, and confirmed permanent delete.
5. Define how applying an edited template affects already-created tasks: default to future applications only.
6. Test zero items, duplicate titles, invalid assignee, recurring item, archive/restore, and apply.

**Implementation state:** the bounded `Routines` surface now owns a dedicated ordered non-empty step editor with add, edit, remove, and reorder controls; it no longer reuses the single-task conversation. Step validation covers empty collections, duplicate trimmed titles, invalid assignees, recurrence, and due offsets. Active and archived routine views support reversible archive/restore and task-specific confirmed permanent deletion; archived routines cannot be edited or applied. Editing affects future applications only, leaving already-created tasks unchanged. See `docs/reports/2026-08-08-routine-lifecycle/implementation.md`.

### Slice 4.4 — Recurring task occurrence control

- [x] **Status: Completed 2026-08-08**

**Audit ID:** TASK-05

**Implementation steps**

1. Define supported scopes: this occurrence, this and future, entire series.
2. Model exceptions rather than mutating generated history unpredictably.
3. Reuse Agenda wording/patterns where semantics match.
4. Require scope confirmation for destructive changes.
5. Add backend recurrence and browser workflow tests.

**Implementation state:** recurring task updates and removals require explicit `Occurrence`, `ThisAndFuture`, or `EntireSeries` scope. Modified/skipped original due dates are exception records, future changes use an inclusive boundary and series split, and entire-series operations preserve completed history while replacing or removing only incomplete projections. The bounded scope dialog uses Agenda-aligned meanings, retains failed/cancelled edit state, and requires task-specific confirmation for every destructive scope. Focused recurring API 15/15, focused Tasks 21/21, backend 633/633, frontend 351/351, both builds, PostgreSQL migration baseline 3/3, EF drift, twice-idempotent pinned NSwag, and Playwright 9/9 pass. See `docs/reports/2026-08-08-recurring-task-occurrence-control/implementation.md`.

### Slice 4.5 — Persisted Weekly Reset aggregate

- [ ] **Status: Not started**

**Audit IDs:** RESET-01, RESET-02, RESET-03

**Implementation steps**

1. Introduce a household/week reset record with status `Open` or `Completed`.
2. Store one decision per candidate with candidate type/id, decision, actor label if available, and timestamp.
3. Give every counted task, goal, and shopping candidate valid actions.
4. Derive progress from persisted decisions, not component-local state.
5. Add an explicit Complete action enabled only when every required candidate is resolved.
6. Add history/read-only recap and idempotent resume.
7. Decide how changed/deleted source records appear in historical resets; snapshot their display label.
8. Add migration, OpenAPI/NSwag, unit/integration/browser tests.

**Pitfall**

- Do not let “skip” mean both “decide later” and “resolved for this week.” Use distinct terms and states.

### Phase 4 exit criteria

- [x] Task actions are discoverable and accessible.
- [x] Edit menu is never clipped at supported viewports.
- [x] Normal tasks and routines have coherent archive/restore lifecycle.
- [x] Recurring scope is explicit.
- [ ] Weekly Reset can be completed and reviewed after refresh.

## Phase 5 — House, climate, and household settings

- [ ] **Phase status: Not started**

**Priority:** P0/P1.  
**Audit coverage:** HOUSE-01, CLIMATE-01, CLIMATE-02, HOUSE-02, HOUSE-04, HOUSE-05, HOUSE-06, WEATHER-01.  
**Existing foundation:** floors, rooms, overlays, climate models, heating controls, provider adapter, and partial Settings UI exist.

### Slice 5.1 — Repair and prove the Home Assistant migration

- [ ] **Status: Not started**

**Audit ID:** HOUSE-04

**Implementation steps**

1. Inspect `20260717124500_AddHomeAssistantResumeStrategyConfiguration.cs` against the model snapshot.
2. Generate/restore the matching designer metadata instead of hand-authoring a second competing migration.
3. Verify `dotnet ef migrations list`.
4. Test:
   - clean PostgreSQL migration;
   - upgrade from the immediately preceding migration;
   - upgrade of a representative active DB.
5. Add a startup health detail for pending/failed migrations without exposing secrets.
6. Confirm `/api/climate-providers/` returns 200 after upgrade.

**Done when**

- The live provider endpoint loads and migration tests prevent recurrence.

### Slice 5.2 — House navigation and viewport analysis

- [ ] **Status: Not started**

**Audit ID:** HOUSE-01

**Implementation steps**

1. Complete the mandatory Viewport-First analysis before changing primary navigation/layout.
2. Decide whether House is a primary nav item or a clearly labelled Settings/Home entry with a stable route.
3. Make runtime climate/heating reachable without exposing unconfigured controls as ready.
4. Add loading, empty, unconfigured, degraded-provider, and error states.
5. Add URL/deep-link support in coordination with Slice 7.1; do not create a second navigation system.
6. Validate no document scrolling at common laptop/desktop viewports.

### Slice 5.3 — Room climate configuration UI

- [ ] **Status: Not started**

**Audit ID:** CLIMATE-01

**Implementation steps**

1. Build the form directly from generated Room climate contracts.
2. Expose enabled/bedtime relevance, preferred temperature/humidity bounds, and heating policy intent.
3. Validate min ≤ max and acceptable ranges client- and server-side.
4. Show unsaved, saving, saved, and backend error states.
5. Disable or explain controls when a room is archived.
6. Add component, API, persistence, and browser tests.

### Slice 5.4 — Provider/source mapping management

- [ ] **Status: Not started**

**Audit ID:** CLIMATE-02

**Implementation steps**

1. Replace “focus room row” placeholder actions with an actual mapping workspace.
2. List mappings grouped by room and semantic role.
3. Support create/edit priority/enable/archive/restore.
4. Use provider discovery results where available; never allow arbitrary Home Assistant service calls.
5. Show health, last check, last success, and safe diagnostic summary.
6. Block duplicate active priority conflicts.
7. Test shared heating-zone behavior and provider/archive dependencies.

### Slice 5.5 — Floor-plan upload and replacement entry

- [ ] **Status: Not started**

**Audit ID:** HOUSE-02

**Implementation steps**

1. Add an upload action to Settings → Woning for a selected floor.
2. Use the existing asset ingestion endpoint and accepted media constraints.
3. Display upload progress, validation blockers, derivative preview, and activation/replacement next step.
4. Connect replacement uploads to the existing replacement-review UI.
5. Keep phone limitations explicit.
6. Test invalid media, oversize/truncated data, sanitized SVG, first activation, replacement, cancellation, and retry.

### Slice 5.6 — Provider lifecycle and credential guidance

- [ ] **Status: Not started**

**Audit IDs:** HOUSE-05, HOUSE-06

**Implementation steps**

1. Add provider archive/restore with mapping dependency warnings.
2. Keep raw Home Assistant tokens outside database, browser storage, logs, backup, and diagnostics.
3. Recommended initial UX: administrator-managed secret reference plus guided connection test, not raw token persistence.
4. Show the exact environment/secret key expected and whether it is configured, never its value.
5. If future token entry is required, design encrypted-at-rest secret storage as a separate security-reviewed slice.
6. Add connection-test timeouts and normalized errors.

### Slice 5.7 — Household weather location

- [ ] **Status: Not started**

**Audit ID:** WEATHER-01

**Implementation steps**

1. Persist household latitude/longitude, display name, and units preference.
2. Add geocoding only if an explicit provider/privacy decision is approved; otherwise accept coordinates plus label.
3. Invalidate weather cache after update.
4. Show last refresh/provider status and retry.
5. Test invalid coordinates, provider failure, and Agenda/Home refresh.

### Phase 5 exit criteria

- [ ] Provider endpoint and DB upgrades are healthy.
- [ ] House runtime is reachable through an approved viewport-safe composition.
- [ ] Climate configuration and mapping lifecycle work end to end.
- [ ] A normal user can upload the first floor plan.
- [ ] Provider credentials remain secret and lifecycle is manageable.
- [ ] Weather location is household-configurable.

## Phase 6 — Shopping and Motivation lifecycle completion

- [ ] **Phase status: Not started**

**Priority:** P1/P2.  
**Audit coverage:** SHOP-01, SHOP-02, SHOP-03, SHOP-04, SHOP-DATA-01, MOT-01, MOT-02, MOT-03, MOT-04.  
**Existing foundation:** server-backed lists/items/history and motivation data exist.

### Slice 6.0 — Mandatory primary-page analyses

- [ ] **Status: Not started**

Before modifying Shopping or Motivation layouts, produce separate Viewport-First analyses. Preserve fixed page height; long lists and history must scroll inside reserved components.

### Slice 6.1 — Shopping list lifecycle

- [ ] **Status: Not started**

**Audit IDs:** SHOP-01, SHOP-03, SHOP-04

**Implementation steps**

1. Add a visible create-list action.
2. Enforce non-empty unique-enough display names without overconstraining legitimate duplicates.
3. Add archived-list view and restore.
4. Distinguish archive (reversible) from permanent delete.
5. Show item count and consequences in confirmation.
6. Keep list overflow inside the page's reserved region.

### Slice 6.2 — Shopping item editing and unified history

- [ ] **Status: Not started**

**Audit IDs:** SHOP-02, SHOP-DATA-01

**Implementation steps**

1. Add item edit for label/quantity and existing metadata.
2. Preserve purchase history attribution when correcting text where reasonable.
3. Remove `homeops.shopping.history.v1` as the Home source.
4. Use the server purchase-history/suggestion API for both Home and Shopping.
5. Provide a one-time local-history discard/migration decision; do not silently upload arbitrary stale browser strings.
6. Test cross-device suggestions and refresh persistence.

### Slice 6.3 — Define goal progress and add an audit ledger

- [ ] **Status: Not started**

**Audit IDs:** MOT-01, MOT-04

**Implementation steps**

1. Document whether progress comes only from completed attributed tasks or can be manually adjusted.
2. Introduce immutable progress ledger entries with source type/id, delta, timestamp, and optional correction-of reference.
3. Derive displayed progress from the ledger.
4. Add a correction action that appends a compensating entry; do not rewrite history.
5. Backfill existing goal totals with one labelled migration entry.
6. Test task completion/reopen idempotency and correction.

### Slice 6.4 — Helpful-moment and family-goal lifecycle

- [ ] **Status: Not started**

**Audit IDs:** MOT-02, MOT-03

**Implementation steps**

1. Add helpful-moment update and soft-delete endpoints plus UI.
2. Preserve author/member references when a member is removed.
3. Add family-goal stop/archive from Motivation.
4. Provide archived history and optional restore only if goal semantics allow it.
5. Use explicit confirmation and honest success/error states.

### Phase 6 exit criteria

- [ ] Multiple shopping lists can be created, archived, restored, and intentionally deleted.
- [ ] Shopping items can be corrected in place.
- [ ] Home/Shopping suggestions use one server source.
- [ ] Goal progress is explainable and correctable.
- [ ] Helpful moments and family goals have complete user lifecycles.

## Phase 7 — Navigation, backup, errors, and consistency

- [ ] **Phase status: Not started**

**Priority:** P1/P2.  
**Audit coverage:** SETTINGS-01, NAV-02, HOME-02, SETTINGS-03, WIDGET-01, DATA-01, SEC-03, UX-02.  
**Existing foundation:** component-state navigation, partial backup, seeded layouts, and domain-specific error handling exist.

### Slice 7.0 — Cross-page viewport analysis

- [ ] **Status: Not started**

Routing, Settings composition, and widget customization can affect every primary page. Produce the mandatory viewport analysis and define stable header/main/internal-overflow regions before implementation.

### Slice 7.1 — URL routing, Back, refresh, and deep links

- [ ] **Status: Not started**

**Audit ID:** NAV-02

**Implementation steps**

1. Choose and document either React Router or a small History API router. React Router is recommended if contextual pages/dialog routes are included.
2. Define stable routes:
   - `/`
   - `/agenda`
   - `/tasks`
   - `/shopping`
   - `/motivation`
   - `/settings`
   - `/family/:id`
   - `/weekly-reset`
   - `/house`
3. Preserve valid modal/editor context in URL only where reload can restore it safely.
4. Add not-found and deleted-entity handling.
5. Make browser Back/Forward predictable.
6. Add E2E route, refresh, deep-link, and unauthorized redirect tests.

### Slice 7.2 — Shared mutation/error pattern

- [ ] **Status: Not started**

**Audit ID:** DATA-01

**Implementation steps**

1. Create a small typed mutation-state utility; avoid a large state-management rewrite.
2. Standardize pending, success, validation, conflict, offline/unreachable, and unexpected-error display.
3. Preserve server field errors and focus the first invalid field.
4. Add retry where idempotent.
5. Remove remaining silent mutation catches.
6. Do not show raw stack traces or secret-bearing diagnostics.

### Slice 7.3 — Destructive-action and lifecycle vocabulary

- [ ] **Status: Not started**

**Audit IDs:** SEC-03, UX-02

**Implementation steps**

1. Define:
   - `Verwijderen` = permanent;
   - `Archiveren` = reversible;
   - `Stoppen` = end an active goal/series;
   - `Overslaan` = one occurrence/week decision;
   - `Herstellen` = reverse archive/remove where supported.
2. Define which actions require confirmation, typed confirmation, or undo.
3. Apply wording and interaction consistently across family, tasks, lists, calendar, goals, providers, floors, and rooms.
4. Add copy/behavior tests for destructive dialogs.

### Slice 7.4 — Complete and accurately label backup

- [ ] **Status: Not started**

**Audit ID:** SETTINGS-01

**Implementation steps**

1. Inventory every persisted household-owned table.
2. Either include all promised domains or rename the feature to the exact included scope.
3. Recommended complete backup scope:
   - household/settings;
   - members and known people;
   - lists/items/history;
   - tasks/series/templates/reset history;
   - motivation/moments/progress ledger;
   - calendar/sources/settings;
   - floors/rooms/assets/overlays/config/mappings/provider metadata;
   - workspace layouts.
4. Exclude operational telemetry, commands, raw secrets, and disposable device/session data explicitly.
5. Version the document, validate the whole graph before mutation, create a pre-restore snapshot, and restore transactionally.
6. Add round-trip tests for populated and empty domains.

### Slice 7.5 — Replace Settings placeholder

- [ ] **Status: Not started**

**Audit ID:** SETTINGS-03

**Implementation steps**

1. Point `Gezinsinstellingen` to real household name/time-zone/family administration, or remove it if those settings have separate clear entries.
2. Do not leave clickable “coming later” controls in normal navigation.
3. Validate Settings viewport composition after adding real content.

### Slice 7.6 — Widget customization

- [ ] **Status: Not started**

**Audit ID:** WIDGET-01

**Implementation steps**

1. Keep widget definitions application-owned.
2. Allow users to enable/disable/reorder only registered definitions.
3. Validate placements server-side and ignore unknown definitions safely.
4. Provide reset-to-default.
5. Constrain layout changes to approved grid slots so primary pages remain viewport-safe.
6. Test another device receiving the saved layout.

### Slice 7.7 — Home interaction semantics

- [ ] **Status: Not started**

**Audit ID:** HOME-02

**Implementation steps**

1. Remove nested interactive elements.
2. Use a non-interactive card container with separate labelled links/buttons, or make only one element the card link.
3. Verify click, keyboard, screen-reader naming, and focus order.
4. Preserve the existing Home viewport composition.

### Phase 7 exit criteria

- [ ] Every primary/contextual surface has a stable route.
- [ ] Mutation errors follow one recoverable pattern.
- [ ] Destructive actions use consistent semantics.
- [ ] Backup scope is complete or precisely labelled and round-trip tested.
- [ ] Settings contains no false action.
- [ ] Widget customization is safe and viewport-bounded.
- [ ] Home cards use valid interaction semantics.

## Phase 8 — Optional product breadth

- [ ] **Phase status: Not started**

**Priority:** P3. Begin only after Phases 0–7 are complete.  
**Audit coverage:** NAV-03, MEDIA-01, REWARD-01.

### Slice 8.1 — Remove dormant workspace expectations

- [ ] **Status: Not started**

**Audit ID:** NAV-03

Keep Media and Rewards internal/unregistered in user navigation until their product designs and persistence lifecycles are approved. Remove misleading placeholder buttons or copy from production surfaces.

### Slice 8.2 — Media product decision

- [ ] **Status: Not started**

**Audit ID:** MEDIA-01

Write a product/technical design before implementation. It must define the household use case, supported providers, playback/control boundary, permissions, failure behavior, and why it belongs in HomeOps. If no compelling use case is approved, remove the placeholder and mark the finding resolved by explicit non-scope.

### Slice 8.3 — Rewards product decision

- [ ] **Status: Not started**

**Audit ID:** REWARD-01

Decide whether HomeOps remains cooperative motivation or adds points/rewards. If approved, design earning, correction, balances, reward catalog, redemption approval, auditability, child safety, and anti-punitive rules before data modeling. If not approved, remove reward placeholders and retain goals/helpful moments as the product boundary.

### Phase 8 exit criteria

- [ ] No placeholder implies unavailable functionality.
- [ ] Media is implemented from an approved design or explicitly removed from scope.
- [ ] Rewards are implemented from an approved design or explicitly removed from scope.

## Audit-to-slice coverage matrix

Every audit finding must appear exactly once as the primary responsibility of a slice. Supporting slices may reference it again.

| Audit ID | Primary slice | Planned state |
| --- | --- | --- |
| SEC-01 | 1.3 Household access boundary | [ ] Not started |
| SEC-02 | 1.2 PostgreSQL LAN isolation | [ ] Not started |
| FIXTURE-01 | 1.1 Visual-review isolation | [ ] Not started |
| BOOT-01 | 2.3 Production/demo bootstrap split | [x] Completed |
| MEMBER-01 | 2.1 Canonical avatar contract | [x] Completed |
| MEMBER-02 | 2.2 Honest member mutations | [x] Completed |
| TIME-01 | 3.1–3.3 Calendar-field correction | [x] Completed |
| HOUSE-01 | 5.2 House navigation | [ ] Not started |
| CLIMATE-01 | 5.3 Climate configuration UI | [ ] Not started |
| CLIMATE-02 | 5.4 Mapping management | [ ] Not started |
| RESET-01 | 4.5 Persisted Weekly Reset | [ ] Not started |
| TASK-UI-01 | 4.1 Task actions | [x] Completed |
| TASK-UI-02 | 4.1 Task popup/hit targets | [x] Completed |
| TASK-01 | 4.2 Normal task lifecycle | [x] Completed |
| TASK-02 | 4.3 Routine creation | [x] Completed |
| TASK-03 | 4.3 Routine editing | [x] Completed |
| TASK-04 | 4.3 Routine archive/restore | [x] Completed |
| TASK-05 | 4.4 Recurring occurrence control | [x] Completed |
| TEST-01 | Phase 0 | [x] Completed |
| ONB-01 | 2.4 Atomic onboarding/review | [x] Completed |
| ONB-02 | 2.4 Onboarding fail-safe | [x] Completed |
| FAMILY-01 | 2.5 Family administration | [x] Completed |
| FAMILY-02 | 2.5 Family restore | [x] Completed |
| CAL-02 | 3.5 Calendar file upload | [x] Completed |
| SHOP-01 | 6.1 Create lists | [ ] Not started |
| SHOP-03 | 6.1 Archive/restore lists | [ ] Not started |
| MOT-01 | 6.3 Goal progress semantics | [ ] Not started |
| MOT-02 | 6.4 Helpful-moment lifecycle | [ ] Not started |
| MOT-03 | 6.4 Family-goal lifecycle | [ ] Not started |
| HOUSE-02 | 5.5 Floor-plan upload | [ ] Not started |
| HOUSE-04 | 5.1 Migration/provider repair | [ ] Not started |
| HOUSE-05 | 5.6 Provider lifecycle | [ ] Not started |
| SETTINGS-01 | 7.4 Backup | [ ] Not started |
| TIME-02 | 3.3 Action-time clock | [x] Completed |
| ONB-03 | 2.6 Setup checklist | [x] Completed |
| SHOP-DATA-01 | 6.2 Unified shopping history | [ ] Not started |
| SHOP-02 | 6.2 Item editing | [ ] Not started |
| SHOP-04 | 6.1 Destructive shopping actions | [ ] Not started |
| CAL-01 | 3.7 Reminder decision | [x] Completed |
| CAL-03 | 3.5 Source lifecycle | [x] Completed |
| NAV-02 | 7.1 Routing | [ ] Not started |
| HOME-01 | 3.3 Quick-add semantics | [x] Completed |
| WEATHER-01 | 5.7 Weather location | [ ] Not started |
| SETTINGS-02 | 3.4 Time-zone setting | [x] Completed |
| SETTINGS-03 | 7.5 Settings placeholder | [ ] Not started |
| SETTINGS-04 | 2.5 Family administration | [x] Completed |
| HOUSE-06 | 5.6 Credential guidance | [ ] Not started |
| RESET-02 | 4.5 Persisted reset decisions | [ ] Not started |
| RESET-03 | 4.5 Reset completion/history | [ ] Not started |
| MOT-04 | 6.3 Progress ledger | [ ] Not started |
| WIDGET-01 | 7.6 Widget customization | [ ] Not started |
| DATA-01 | 7.2 Shared error handling | [ ] Not started |
| SEC-03 | 7.3 Destructive policy | [ ] Not started |
| DEVICE-01 | 3.6 Device settings identity | [x] Completed |
| UX-01 | 2.3 Demo localization/boundary | [x] Completed |
| UX-02 | 7.3 Lifecycle vocabulary | [ ] Not started |
| HOME-02 | 7.7 Home interaction semantics | [ ] Not started |
| NAV-03 | 8.1 Dormant workspaces | [ ] Not started |
| MEDIA-01 | 8.2 Media decision | [ ] Not started |
| REWARD-01 | 8.3 Rewards decision | [ ] Not started |

## Suggested issue template for each slice

Copy this into the implementation issue or implementation report:

```markdown
## Slice <number> — <name>

- [ ] Status: Not started
- Audit IDs:
- Depends on:
- Existing foundation:
- Explicitly out of scope:

### Reproduction / starting evidence

### Implementation checklist

- [ ] Add failing regression test
- [ ] Implement backend/domain change
- [ ] Add migration and upgrade coverage, if applicable
- [ ] Regenerate OpenAPI/NSwag, if applicable
- [ ] Implement frontend states
- [ ] Validate accessibility and viewport behavior
- [ ] Run focused tests
- [ ] Run common release gates
- [ ] Inspect complete git diff and remove artifacts
- [ ] Update current state, Phase 2 roadmap, and implementation report

### Acceptance criteria

### Validation results

### Remaining risks
```

## Final program completion criteria

The overall checkbox at the top may be changed to `[x] Completed` only when:

- [ ] all required Phases 0–7 are checked and completed;
- [ ] Phase 8 decisions are recorded and no misleading placeholders remain;
- [ ] all 60 audit IDs in the coverage matrix are completed or explicitly resolved by an approved non-scope decision;
- [ ] a fresh install, an existing-database upgrade, and a LAN-client workflow pass;
- [ ] no normal household path depends on demo seed or visual-review time;
- [ ] family, calendar, task, shopping, motivation, and Woning changes survive refresh;
- [ ] every primary page passes the no-document-scroll viewport rule;
- [ ] security, migration, backend, frontend, NSwag, and browser gates pass;
- [ ] the final changesets contain no repository-local caches, test artifacts, or unrelated feature work.
