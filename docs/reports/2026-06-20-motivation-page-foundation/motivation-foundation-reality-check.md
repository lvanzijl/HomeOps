# Motivation Foundation Reality Check

## Summary
The Motivation Page Foundation is a client-side seeded foundation, not a persisted domain. A dedicated Motivation page exists, a navigation entry exists, and Home renders a compact Motivation tile. The data behind the page and tile comes from a hardcoded `motivationSnapshot` TypeScript constant. There are no Motivation backend entities, migrations, DbSets, endpoints, OpenAPI contracts, generated API client methods, or database persistence.

The existing slice reports are directionally correct that a dedicated surface and lightweight seeded frontend data were added, but they are too generic to make the implementation maturity clear. The reality is: the UI exists, the routing exists, and the visual structure exists; the Motivation domain itself does not yet exist outside static client data.

## What Actually Exists
- `MotivationPage` exists as a React component in `src/HomeOps.Client/src/MotivationPage.tsx`.
- The page is registered as a workspace id named `motivation` in `workspaceModel.ts`, which makes it appear in top-level workspace navigation.
- `WorkspaceShell` routes `activeWorkspace.id === 'motivation'` to `<MotivationPage members={members} />`.
- The page UI structure is:
  - Header: `Motivation`, `Family encouragement`, and non-competitive explanatory copy.
  - Top family goal card labelled `Active family goal`.
  - Family progress display with `current/target`, unit label, and a progress bar.
  - Optional reward copy rendered as `When we finish: ...` if `rewardLabel` exists.
  - Individual goals section labelled `Individual encouragement goals`.
  - One rendered card per seeded goal whose `familyMemberId` matches a loaded Family Member.
- Styling exists for `.domain-motivation`, `.motivation-page`, `.family-goal-card`, `.individual-goal-card`, `.progress-bar`, and `.star-row`.

## Family Goal Reality
- The family goal is not a backend domain model.
- The family goal is not loaded through an API.
- The family goal is not persisted in PostgreSQL.
- The family goal is hardcoded in `src/HomeOps.Client/src/motivationData.ts` as `motivationSnapshot.familyGoal`.
- The hardcoded values are:
  - Title: `Fill the family helper path`.
  - Target: `20`.
  - Current progress: `13`.
  - Unit label: `helpful actions`.
  - Reward label: `Board game night together`.
- The page uses `clampProgress` only to compute a bounded progress bar percentage. There is no data source, mutation, refresh, completion tracking, or derivation from Tasks.

## Individual Goal Reality
- Individual goal cards are not persisted.
- Individual goal cards are not loaded through an API.
- Individual goal cards are seeded/hardcoded in the same frontend `motivationSnapshot` constant.
- Each seeded individual goal references a Family Member by string id (`alex`, `sam`, `riley`, `jordan`).
- The only dynamic part is filtering: `goalsForMembers` keeps seeded goals whose `familyMemberId` appears in the currently loaded Family Member collection.
- Family Member names, colors, and avatars can come from persisted Family Member APIs, but the goals themselves do not.
- If a household changes Family Members or uses different ids, hardcoded Motivation goals disappear rather than adapting.

## Home Tile Reality
- The Home Motivation tile exists in `HomeDashboard.tsx` as an additional `home-summary-card` with `aria-label="Motivation summary"`.
- It is visible on Home with the other summary cards.
- It navigates to the Motivation workspace on click and Enter key via `onNavigate("motivation")`.
- It shows only family-goal-level information:
  - Card title `Motivation`.
  - Action text `View Motivation`.
  - Metadata from `motivationSnapshot.familyGoal.currentProgress`, `targetCount`, and `unitLabel`.
  - Goal title from `motivationSnapshot.familyGoal.title`.
  - Progress bar using the same hardcoded snapshot.
- It does not show individual goal progress, balances, a shop, gems, rankings, or a leaderboard.
- Its data source is the static `motivationSnapshot`, not the API, not persisted state, and not Tasks.

## Persistence Status
Persisted:
- Family Members are persisted in the backend `FamilyMembers` table and surfaced through Family Member APIs.
- Existing workspace layout persistence remains present, but the Motivation page itself is not driven by a widget placement; the default layout for `motivation` is an empty array.

Not persisted:
- Motivation family goal.
- Motivation family goal progress.
- Motivation reward label.
- Individual Motivation goals.
- Individual Motivation progress.
- Any relationship between Tasks and Motivation progress.
- Any Motivation history, completion, edits, or household configuration.

## API Status
Existing Motivation APIs:
- None found.

Missing Motivation APIs:
- Get active family goal.
- Get individual goals for a household.
- Update/advance family goal progress.
- Update/advance individual goal progress.
- Goal create/edit/archive/complete APIs.
- Any API contract in OpenAPI/NSwag for Motivation.

Evidence from code review:
- Backend search found Family Member APIs and persistence, but no Motivation endpoints, entities, DbSets, migrations, or generated client methods.
- `HomeOpsDbContext` includes DbSets for existing domains including `FamilyMembers`, `HouseholdTasks`, widget layouts, calendar events, lists, and settings; it has no Motivation DbSet.
- The generated client includes `/api/family-members` methods but no Motivation client methods.

## Domain Maturity Assessment
| Area | Classification | Reason |
| --- | --- | --- |
| Motivation page | Seeded foundation | Real routed UI exists, but it renders only static seeded data. |
| Family goals | Demo/mock | Goal data is a hardcoded frontend constant and has no persistence or API backing. |
| Individual goals | Demo/mock | Cards render from hardcoded frontend goals joined to persisted Family Member identities by id. |
| Home tile | Seeded foundation | Real Home UI and navigation exist, but tile data is hardcoded from the frontend snapshot. |

## Technical Debt
- Motivation data is hardcoded in a top-level frontend module and is shared by both the page and Home tile.
- Family Member linkage depends on fixed seeded ids (`alex`, `sam`, `riley`, `jordan`).
- There is no domain model for goals, progress, time windows, active/completed state, or household ownership.
- There is no API abstraction or hook around Motivation data, so replacing seeded data later will require touching page and Home data flow.
- `rewardLabel` exists as display copy even though Reward Economy is deferred. It is currently a family ritual label, not an economy mechanism, but the naming could be confused with the future Reward Economy.
- Motivation is implemented as a routed page, not as a widget-driven workspace layout participant; the `motivation` default workspace layout is empty.
- Progress does not derive from Tasks, routines, manual recognition, or persisted completion events.
- Reports created in the original slice are generic and do not explicitly state that there is no backend, no persistence, and no API.

## Risks
- Users may interpret the Motivation UI as functional progress tracking even though progress never changes.
- Hardcoded Family Member ids will not generalize if household members are renamed, replaced, deleted, or user-created in a future slice.
- The Home tile can become stale or misleading because it is not tied to real household activity.
- Future persistence work may need to rework the current data module, tests, and Home tile assumptions.
- The word `rewardLabel` can blur the boundary between encouragement and the future Reward Economy unless future work renames or scopes it carefully.

## Recommended Next Step
The next implementation slice should add a real Motivation domain read model before adding editing or reward mechanics. The smallest useful next step is a backend-backed read-only Motivation API with seeded database records for one active family goal and individual Family Member goals, plus generated NSwag client consumption by the Motivation page and Home tile. Keep goal editing, gems, shops, points, leaderboards, task approval, and task recurrence out of scope.

## Next Prompt Context
Current implementation reality:
- Motivation page and navigation exist.
- Home Motivation tile exists and routes correctly.
- All Motivation goal data is hardcoded in `src/HomeOps.Client/src/motivationData.ts`.
- Family Members are persisted and loaded, but Motivation goals are not.
- There are no Motivation API endpoints, no Motivation EF entities, no migrations, and no generated Motivation client.
- Existing reports under this directory are high-level summaries and should not be treated as evidence of persisted domain maturity.

Recommended next prompt should ask for one implementation slice only:
- Add backend-backed seeded Motivation read model.
- Persist active family goal and individual goals against the seeded household and Family Member ids.
- Add read-only Motivation API and generated NSwag client usage.
- Keep mutations/editing/rewards/gems/shop/leaderboards out of scope.
