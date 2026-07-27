# Slice 2.5 - Central family administration and restore

## Viewport-first analysis

The primary Settings page already reserves three rows: its compact status header, a bounded two-column dashboard, and the action rail. The page itself uses `height: 100%`, `min-height: 0`, and `overflow: hidden`; variable source/status content scrolls inside its existing cards.

Family administration is secondary configuration, so the status overview, health cards, and action rail remain the primary information that must always be visible. The only primary-page addition is one compact action-rail button. The rail already wraps its buttons, and responsive Settings rules reduce the dashboard to one column before content could exceed its reserved region.

The administration content opens in the existing Settings surface region rather than expanding the page. That surface reserves a fixed header plus a `minmax(0, 1fr)` body, caps itself to the available height, hides outer overflow, and scrolls its body internally. Active and removed member collections are independently bounded so larger families do not change the global composition.

The selected composition is therefore:

1. unchanged Settings status header;
2. unchanged bounded health/configuration grid;
3. existing action rail with a `Gezinsleden` entry;
4. existing in-panel Settings dialog with a fixed header and internally scrolling administration body.

A permanently expanded member-management card was rejected because it would compete with the status-first dashboard. A new primary navigation destination was rejected because family administration is infrequent configuration. Nested full-screen routes were also unnecessary because the existing bounded Settings surface already supplies the required viewport contract.

At common desktop and laptop sizes, the primary page remains non-scrolling because no variable member content enters its grid rows. The remaining risks are a wrapped action rail at narrower widths and long member/dependency labels; wrapping is contained in the reserved footer and long collections scroll inside the dialog. Browser validation must still prove that `document.body` and the Settings page do not gain vertical overflow at 1440x900 and 1366x768.

## Implemented

- Added a Settings `Gezinsleden` administration surface, including empty-roster add, active add/edit/remove, and removed-member restore flows.
- Reused one pending/error-aware family profile form for both the global Add flow and central add/edit.
- Added removed-member and dependency API queries plus restore with active-name conflict handling.
- Regenerated OpenAPI and the TypeScript client, and routed the new frontend operations through that generated client.
- Removal is strictly soft-delete: task, room, individual-goal, and private-known-person references are preserved and never reassigned or cleared.
- Kept completed onboarding completed when the active roster is empty so Settings remains reachable after refresh.

## Validation

- Passed: `dotnet restore HomeOps.sln`.
- Passed: `dotnet build HomeOps.sln --no-restore`.
- Passed: focused family/onboarding backend tests (14/14).
- Passed: focused family-administration/workspace frontend tests (19/19).
- Passed: `dotnet test HomeOps.sln --no-build --no-restore` (587/587).
- Passed: full frontend Vitest suite (323/323).
- Passed: `pnpm --dir src/HomeOps.Client build`.
- Passed: NSwag 14.7.1 generation and an idempotent second generation.
- Passed: `dotnet ef migrations has-pending-model-changes`; no model changes are pending.
- Passed: `pnpm test:e2e`; all 6 Playwright outcomes pass. The new normal-pass scenario proves empty-roster Add and remove/restore across refresh, while the viewport scenario covers Settings and its family surface at 1440x900 and 1366x768.

The existing `SQLitePCLRaw.lib.e_sqlite3` NU1903 advisory and Vite large-chunk warnings remain unchanged.

## Status

Completed.
