# Shopping Viewport-Fit Implementation

## Summary

Implemented the approved Shopping viewport-fit redesign from `docs/reports/2026-07-02-work/shopping-viewport-fit-analysis.md`.

Shopping now uses an execution-first bounded dashboard with:

- one compact Quick Add command row that stays visible;
- one active shopping-list region grouped by store and owned by internal scrolling;
- one compact footer/status strip for completed, recovery, other-list, and management access;
- bounded contextual overlay surfaces instead of in-flow lifecycle and support sections.

No backend, API, schema, migration, seed, or binary artifact changes were made.

## Files changed

- `src/HomeOps.Client/src/widgets/components/ShoppingListWidget.tsx`
- `src/HomeOps.Client/src/widgets/components/ShoppingListWidget.test.tsx`
- `src/HomeOps.Client/src/styles.css`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-07-02-work/shopping-viewport-fit-implementation.md`

## How the implementation follows the approved analysis

- Removed the large Shopping hero and default secondary sections from the default viewport.
- Replaced the old stacked page flow with a fixed three-row Shopping dashboard: command row, active-list region, compact footer.
- Kept Quick Add permanently visible in a compact command surface with inline status/error handling.
- Made the active shopping list the only full default list and kept preferred-store grouping.
- Moved completed, deleted/undo, other lists, and list management into bounded contextual overlays opened from the footer/status strip.
- Stopped Shopping from structurally relying on shared `.workspace-page-body` scrolling by making the Lists workspace body/widget host overflow hidden and assigning overflow ownership to Shopping-owned regions.

## Information hierarchy changes

Default visible priority is now:

1. Quick Add
2. Active shopping list
3. Compact lifecycle/status footer

The page no longer renders lifecycle, support, or management content as permanent full-height page sections.

## How other lists are handled

- Other lists are no longer rendered as default page cards below the active shopping list.
- The footer exposes compact `Andere lijsten` access.
- When opened, other lists render inside a bounded overlay with compact list tabs and internal overflow ownership.
- Existing add/toggle/manage behavior for non-shopping lists remains supported in the contextual surface.

## How completed/deleted/undo/lifecycle are handled

- Completed items moved behind the `Afgevinkt` footer action.
- Deleted/recovery items moved behind the `Herstellen` footer action.
- List rename/archive/delete moved behind the `Beheer` footer action.
- Each detailed surface opens in a bounded overlay and uses internal scrolling instead of increasing page height.

## Overflow strategy

- `.workspace-panel-lists .workspace-page-body` and the Lists widget host now use hidden overflow for Shopping.
- The Shopping dashboard itself is fixed-height and overflow hidden.
- The active list region is the main flexible area.
- Active-list overflow is handled by the Shopping section body, not by the page.
- Overlay surfaces are bounded and keep their own internal overflow ownership.
- Long item labels are constrained with two-line clamping and `title` text preservation.

## Validation performed

### Repository validation

Commands run with the required repository-local environment exports:

```bash
export DOTNET_CLI_HOME="$PWD/.dotnet-home"
export DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1
export DOTNET_NOLOGO=1
export NUGET_PACKAGES="$PWD/.nuget/packages"
export npm_config_cache="$PWD/.npm-cache"
mkdir -p "$DOTNET_CLI_HOME" "$NUGET_PACKAGES" "$npm_config_cache"
```

```bash
dotnet restore HomeOps.sln
dotnet build HomeOps.sln
dotnet test HomeOps.sln
cd src/HomeOps.Client
npm ci
npm test
npm run build
cd /home/runner/work/HomeOps/HomeOps
npx --yes nswag run nswag.json
```

Additional post-change validation:

```bash
cd src/HomeOps.Client
npm test -- src/widgets/components/ShoppingListWidget.test.tsx src/workspaces/WorkspaceShell.test.tsx
npm run build
```

Results:

- `dotnet build` ✅
- `dotnet test` ✅ (`137` passed)
- `npm test` ✅ (`165` passed after dependency install)
- focused Shopping/Workspace tests ✅ (`16` passed)
- `npm run build` ✅
- `npx --yes nswag run nswag.json` ✅

Observed existing warnings:

- `SQLitePCLRaw.lib.e_sqlite3` `2.1.11` advisory warning during .NET restore/build/test
- existing Vite chunk-size warning during client build

### Viewport-fit verification

Validated Shopping in a live local runtime at `1366×768` using Playwright against fixture-backed data.

Verified results:

- `document.body` did not vertically scroll.
- `.workspace-panel-lists .workspace-page-body` used `overflow: hidden`.
- Shopping fit inside the reserved viewport.
- Quick Add remained visible.
- The compact footer/status strip remained visible.
- Default Shopping flow did not render `.other-lists-section` or `.shopping-lifecycle-workspace`.
- Long-list validation preserved page-level fit while the Shopping section body owned internal overflow (`sectionBodyScrollHeight > sectionBodyClientHeight`).
- Contextual overlays for completed/recovery/manage remained bounded without growing the page.

Other-list contextual access was preserved through component tests; the checked runtime fixtures in this session did not include additional lists to open from the footer.

## Remaining limitations

- Runtime viewport verification in this session did not include a fixture with non-zero `Andere lijsten`; that accessibility path was validated through the Shopping component tests instead.
- The existing repository-wide Vite chunk-size warning still appears during `npm run build`.
- The existing SQLite package advisory warning still appears during .NET validation and was not changed in this slice.

## Confirmation that no binary files or cache artifacts were added

No screenshots, videos, PNG, JPG, JPEG, GIF, WEBP, PDF, or other binary files were added.

No repository-local cache directories were added to the tracked changeset.
