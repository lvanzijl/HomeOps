# Motivation Viewport-Fit Implementation

## Summary

Implemented the approved Motivation viewport-fit redesign from `docs/reports/2026-07-03-work/motivation-viewport-fit-analysis.md`.

Motivation now uses the approved three-region family story composition:

- one dominant **Shared Family Purpose** region for the active goal, meaning, progress, remaining effort, and compact celebration context;
- one bounded **Encouragement & Appreciation** preview region with the latest appreciation moments, add action, and contextual history access;
- one compact **Celebration Story** region for the next celebration, latest memory signal, personal-goal summary, and contextual detail access.

No backend, API, schema, migration, seed, or binary artifact changes were made.

## Files changed

- `src/HomeOps.Client/src/MotivationPage.tsx`
- `src/HomeOps.Client/src/MotivationPage.test.tsx`
- `src/HomeOps.Client/src/HelpfulMoments.tsx`
- `src/HomeOps.Client/src/HelpfulMoments.test.tsx`
- `src/HomeOps.Client/src/styles.css`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-07-03-work/motivation-viewport-fit-implementation.md`

## How the implementation follows the approved analysis

- Replaced the previous four-card Motivation dashboard with exactly three permanent viewport regions.
- Kept the shared family goal as the dominant visual anchor and added supporting proof points inside that region instead of keeping a separate statistics card.
- Kept appreciation permanently visible, but reduced the default view to a curated preview with contextual history access.
- Kept celebration permanently visible as a compact story/payoff region instead of a secondary standalone history surface.
- Moved memories, personal-goal management, appreciation history, and detailed statistics into bounded overlay dialogs so they no longer increase page height.
- Stopped Motivation from structurally relying on shared `.workspace-page-body` scrolling by making the Motivation workspace body overflow hidden and assigning overflow ownership to Motivation-owned regions and dialogs.

## Information hierarchy changes

Default visible priority is now:

1. Shared family purpose
2. Encouragement and appreciation
3. Celebration story

Statistics, personal-goal management, and history no longer appear as permanent default dashboard surfaces.

## Three-region implementation details

### Shared Family Purpose

- Keeps the family goal title, encouragement copy, progress bar, remaining effort, and compact celebration status visible at all times.
- Adds two embedded proof tiles for remaining effort and family-wide participation so statistics support the story instead of competing with it.
- Keeps family-goal editing and detailed progress access available through compact actions.

### Encouragement & Appreciation

- Keeps only the latest preview moments in the default viewport.
- Preserves appreciation creation in place.
- Opens full appreciation history in a bounded dialog with internal scrolling instead of expanding the default card.
- Uses `+N meer` only when more appreciation exists beyond the preview.

### Celebration Story

- Summarises the ready/next celebration state in a dedicated compact region.
- Shows the latest meaningful memory or empty-state memory signal.
- Shows personal goals only as a family-level summary with aggregate progress language.
- Provides contextual entry points for history, personal-goal management, and supporting details.

## Statistics integration changes

- Removed the standalone default statistics card.
- Embedded only small supporting proof points in the Shared Family Purpose region.
- Moved the fuller household statistics summary into a bounded `Voortgangsdetails` dialog.

## Personal-goal and history handling

- Personal goals no longer render as permanent page content.
- The default page shows only aggregate personal-goal summary inside Celebration Story.
- Full personal-goal management now opens in a bounded dialog with internal scrolling and preserved create/edit/archive workflows.
- Celebration memories no longer append below the page; full history opens in a bounded dialog.
- Appreciation history now also opens contextually instead of expanding the page.

## Overflow strategy

- `.workspace-panel-motivation .workspace-page-body` now uses hidden overflow.
- `.motivation-dashboard-page` fills the reserved workspace body height and owns its own overflow rules.
- The three permanent regions use reserved grid areas with `min-height: 0` and bounded internal layouts.
- Contextual surfaces use dialogs with bounded height and internal scrolling when content exceeds the available space.
- No contextual action increases Motivation page height.

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
npm test -- src/MotivationPage.test.tsx src/HelpfulMoments.test.tsx
npm run build
```

### Viewport-fit verification

Validated the Motivation page in a live local runtime at `1366×768` against fixture-backed data.

Verified results:

- Motivation fit inside the reserved viewport.
- `document.body` did not vertically scroll.
- `.workspace-panel-motivation .workspace-page-body` used `overflow: hidden`.
- Shared Family Purpose remained the dominant region.
- Encouragement & Appreciation remained visible in the default viewport.
- Celebration Story remained visible in the default viewport.
- Statistics no longer appeared as a standalone default dashboard card.
- Personal-goal management remained accessible through a bounded dialog instead of permanent page content.
- Memories/history remained accessible through bounded contextual dialogs instead of appended sections.
- No unrelated pages were redesigned during this slice.

Observed existing warnings:

- `SQLitePCLRaw.lib.e_sqlite3` `2.1.11` advisory warning during .NET restore/build/test
- existing Vite chunk-size warning during client build

## Remaining limitations

- The default Motivation viewport was manually verified at `1366×768`; this slice did not add automated viewport assertions.
- The existing repository-wide Vite chunk-size warning still appears during `npm run build`.
- The existing SQLite package advisory warning still appears during .NET validation and was not changed in this slice.

## Confirmation that no binary files or cache artifacts were added

No screenshots, videos, PNG, JPG, JPEG, GIF, WEBP, PDF, or other binary files were added.

No repository-local cache directories were added to the tracked changeset.
