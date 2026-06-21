# Visual Review Fixture Analysis

Date: 2026-06-21

## Executive Summary

HomeOps is **Partially Ready** for reliable visual UX review, but it cannot currently generate consistent, representative screenshots across the full Home, Child Workspace, Motivation, Weekly Reset, Shopping, and Tasks surface area without manual setup.

The repository has useful deterministic development seed data for the household shell, family members, lists, goals, task templates, calendar events, and workspace layouts. It also has targeted integration-test setup that proves transient states such as Weekly Reset review candidates, completed tasks, helpful moments, completed/deleted shopping items, and shopping store suggestions can be constructed. However, those states are not part of one reusable visual dataset, and several important UX review states depend on current time, API mutations, or test-only inserts.

A dedicated **Visual Review Fixture Pack** is necessary. The best strategy is a hybrid: keep current seed data as the baseline and add an explicit visual-review fixture pack that can be loaded/reset deterministically for screenshots.

## Existing Seeded Data

### What exists

- **Household:** one seeded household with onboarding completed and a configured timezone.
- **Family Members:** four seeded family members: two adults (`alex`, `sam`) and two children (`riley`, `jordan`) with avatar presentation attributes.
- **Lists / Shopping:** two seeded lists, `Shopping` and `Vacation Packing`, with six active list items total.
- **Family Goal:** one active family motivation goal, `Fill the family helper path`, at 13 of 20 helpful actions, with a planned celebration.
- **Individual Goals:** four active personal goals, one for each seeded family member.
- **Task Templates:** five seeded templates with eleven template items.
- **Agenda / Calendar:** one writable HomeOps Calendar source and four seeded event series: Dentist Appointment, Parent Evening, Vacation, and Put Bins Outside.
- **Workspace Layouts:** persisted default layouts and widget placements for Home, House, Media, and Settings.

### What does not appear to be production-seeded

- **Household Tasks:** no durable seeded task instances are created in the main EF seed block.
- **Recurring Tasks:** recurring task series are modeled and tested, but no recurring series appears in the main EF seed block.
- **Helpful Moments:** the table is modeled and tested, but no main seed records are created.
- **Celebration-ready state:** the main family goal is planned and not complete; no seeded ready-to-celebrate goal state exists.
- **Celebration Memories:** memories are derived from celebrated family goals; no celebrated seeded goal appears in the main seed data.
- **Shopping item lifecycle states:** seeded list items are active only; completed/deleted items and store history are not seeded.
- **Weekly Reset candidates:** the Weekly Reset endpoint computes candidates from task/list/helpful-moment state, but the main seed data does not populate enough review-specific records.

## Existing Test Fixtures

### Integration-test fixtures

The API test suite uses `HomeOpsWebApplicationFactory`, which replaces the application database with an isolated EF InMemory database and calls `EnsureCreated`; this means tests get the model seed data, but the fixture is a test harness rather than a reusable demo dataset.

### Test-only data construction

Existing tests add targeted transient records for specific scenarios:

- Weekly Reset tests insert a no-date review task, a fresh task, a completed task, an archived list, and a helpful moment before calling `/api/weekly-reset`.
- Shopping API tests create completed/deleted item states through API calls and create store suggestion history by repeatedly updating preferred stores.
- Motivation tests mutate the seeded family goal to ready/celebrated states and verify memory behavior.
- Frontend component tests mock rich UI payloads for Home, Weekly Reset, Shopping, Motivation, and Family Member pages.

### Reuse potential

Existing fixtures are useful as a design reference but are not sufficient as-is for visual reviews:

- They are scattered across test methods.
- Some use random GUIDs or `DateTimeOffset.UtcNow`.
- They are optimized for behavior assertions, not screenshot composition.
- They do not provide one named, resettable, product-wide fixture mode.
- Frontend mocks are not connected to the running application and cannot support end-to-end screenshots without additional harnessing.

## Visual Coverage

### Home

- **Full state:** partial. Family members, agenda, active lists, and motivation baseline exist, but tasks and richer contribution/celebration states are weak without manual data.
- **Empty state:** not covered by main seed data; tests can simulate empty responses, but no seeded empty household mode exists.
- **Mixed state:** partial. Current data gives active lists and agenda events but lacks mixed task, shopping lifecycle, helpful moments, and celebration variants.

### Child Workspace

- **Young child:** partial. A younger child (`jordan`, 2020 birth date) exists, but no seeded child-specific tasks/helpful moments are present.
- **Older child:** partial. An older child (`riley`, 2018 birth date) exists, but again without seeded child-specific task/helpful-moment context.
- **Goals:** yes, basic personal goals exist.
- **Helpful Moments:** not seeded.
- **Celebration:** planned only; ready/celebrated states require mutation.
- **Memory:** not seeded.

### Motivation

- **Active goal:** yes.
- **Near-complete goal:** partial. The family goal is 13/20; individual goals are mid-progress rather than near-complete.
- **Ready celebration:** not seeded.
- **Memory:** not seeded.

### Weekly Reset

- **Review candidates:** not seeded in production data; covered only by test inserts.
- **Shopping review:** not seeded reliably; test inserts can create an archived list candidate.
- **Goal review:** partial because an active family goal and individual goals exist.
- **Recap:** partial to not ready. Completed task counts, helpful moments, and celebration memories require generated or manually inserted records.

### Shopping

- **Active items:** yes.
- **Completed items:** not seeded.
- **Deleted items:** not seeded.
- **Store suggestions:** not seeded; store suggestions are derived from shopping purchase history or API mutations.

## Fixture Quality

### Determinism

Main EF seed records are mostly deterministic because identifiers and timestamps are fixed. Visual review readiness is weakened by surfaces that compute state from `DateTimeOffset.UtcNow`, especially Weekly Reset windows and mutation-created memories.

### Stability

The baseline is stable enough for development smoke views, but not stable enough for screenshot comparison across the full UX surface. Calendar events are anchored to June/July 2026, while Weekly Reset uses rolling windows; screenshot output will drift unless visual fixtures freeze dates or seed relative records at reset time.

### Representativeness

The current seed data is representative for bootstrap validation, not rich UX review. It covers household identity, list basics, agenda basics, and goal basics, but not the richer emotional and operational states that recent UX reviews focus on: child ownership, helpful moments, celebration readiness, memories, shopping intelligence, task lifecycle, and weekly reset hygiene.

### Screenshot richness

Current screenshots would be too sparse or one-sided for review:

- Shopping would show active items only.
- Motivation would show planned progress only.
- Child Workspace would lack personal recognition unless the reviewer manually creates Helpful Moments.
- Weekly Reset would likely look mostly empty.
- Tasks would not have seeded urgency/lifecycle groups.

## Visual Review Readiness

| Surface | Classification | Rationale |
| --- | --- | --- |
| Home | Partially Ready | Has household, family, agenda, list, and motivation basics, but lacks seeded task, helpful moment, celebration, and shopping-lifecycle richness. |
| Child Workspace | Partially Ready | Has children and personal goals, but no seeded Helpful Moments, task ownership examples, ready celebration, or memory. |
| Motivation | Partially Ready | Has one active family goal and personal goals, but no ready celebration or seeded memories. |
| Weekly Reset | Not Ready | Core candidate and recap data must be created manually or in tests. |
| Shopping | Partially Ready | Active items exist; completed/deleted states and store suggestions are missing from main seed data. |
| Tasks | Not Ready | Task templates exist, but representative household task instances and recurrence examples are not seeded. |

## Recommended Fixture Strategy

Recommendation: **E. Hybrid approach** — preserve current seed data as the lightweight development baseline and create a dedicated **Visual Review Fixture Pack** for screenshot-oriented review.

Why not only reuse current seed data:

- It is too sparse for UX review.
- It lacks scenario variants.
- It does not cover empty/full/mixed states.
- It cannot reliably produce Weekly Reset or lifecycle screenshots.

Why not only reuse integration-test fixtures:

- They are fragmented and behavior-focused.
- They rely on per-test setup and sometimes current time.
- They do not provide a product-wide, resettable, named visual state.

The hybrid approach avoids bloating normal development seed data while making visual reviews deterministic and maintainable.

## Visual Review Fixture Design

If implemented later, the minimum Visual Review Fixture Pack should include:

### Household and family

- One family household with two adults and two children.
- Child profiles that intentionally represent a younger child and an older child.
- Stable avatar/display-color data for screenshot consistency.

### Tasks and recurring tasks

- Overdue task.
- Due-today task.
- Upcoming task.
- No-date active task.
- No-date needs-review task.
- Completed-recently task.
- Recurring daily or weekly routine instance.
- Mixed ownership: unassigned, shared household, and child-owned examples.

### Motivation and child ownership

- One active family goal with rich contribution language.
- One near-complete or ready-to-celebrate family goal scenario.
- Personal goals for both children, one mid-progress and one near-complete.
- Helpful Moments for both children with different recognition tags.

### Celebration and memory

- Planned celebration state.
- Ready celebration state.
- At least one celebrated goal that appears as a memory.
- Memory copy that includes specific contribution evidence.

### Shopping

- Active shopping items with enough rows for layout review.
- Completed item still visible for undo/recent lifecycle review.
- Deleted item still visible for undo/recent lifecycle review.
- Preferred-store examples.
- Store suggestion examples from purchase history.
- One stale/archived/duplicate-looking list for Weekly Reset shopping review.

### Weekly Reset

- Review-candidate no-date tasks.
- Active but fresh no-date task that should not be reviewed.
- Shopping review candidate.
- Active family goal and personal goals.
- Completed task recap.
- Helpful Moments recap.
- Celebration memory recap.

### State variants

The pack should define named scenario modes rather than one overloaded state:

- `visual-full`
- `visual-mixed`
- `visual-empty`
- `visual-child-young`
- `visual-child-older`
- `visual-weekly-reset`
- `visual-shopping-lifecycle`

## Implementation Effort

Estimated effort: **Medium**.

Reasons:

- The required domains and APIs already exist for most fixture records.
- The data volume is modest.
- The main work is not domain modeling; it is designing deterministic, resettable, scenario-specific fixture loading.
- Extra care is needed to keep visual fixtures separate from normal development seed data, avoid migration churn, handle `DateTimeOffset.UtcNow` windows, and prevent screenshot data from becoming stale as UX surfaces evolve.

This would become Large only if the fixture pack also introduced browser automation, screenshot baselines, image comparison infrastructure, or a new admin UI. Those are outside this analysis.

## Prioritization

Yes, a Visual Review Fixture Pack should be created before:

- Asset integration review.
- Card-system review.
- Layout review.
- Screenshot-based UX reviews.

Rationale:

- Asset and card reviews need full, mixed, and emotionally rich content to expose spacing, hierarchy, icon, color, copy, overflow, and empty-state issues.
- Layout review without representative data risks validating sparse screens rather than real household usage.
- Screenshot comparison is only valuable when the input state is deterministic and resettable.
- Current manual setup would make review slow, inconsistent, and difficult to compare over time.

## Next Prompt Context

HomeOps currently has a useful deterministic baseline seed, but it is not enough for reliable visual UX reviews. A future implementation prompt should create a dedicated Visual Review Fixture Pack without replacing the normal seed data. The fixture pack should be resettable, named by scenario, deterministic across dates, and rich enough to cover Home, Child Workspace, Motivation, Weekly Reset, Shopping, and Tasks. It should not introduce new product features; it should only populate existing domains for visual review.
