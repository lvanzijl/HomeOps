# FamilyBoard Design Asset System Foundation

## Summary

The FamilyBoard Design Asset System foundation is established under the frontend `src/design` tree. This slice added a small public API, shared icon sizing tokens, inline React SVG primitives, and a typed semantic icon registry without migrating production pages, replacing emoji, adding illustrations, or introducing binary artifacts.

Explicit answers:

- **Is the Design Asset System established?** Yes. The foundational `design/` structure, icon component, icon tokens, semantic registry, reserved illustration and decoration folders, and authoring documentation now exist.
- **Are binary assets still prohibited?** Yes. This slice added only TypeScript/TSX and Markdown files.
- **Are inline React SVG components used?** Yes. The new FamilyBoard icon components render inline SVG and use `currentColor`.
- **Is the semantic registry implemented?** Yes. A typed registry now maps semantic names such as `core.add`, `navigation.settings`, and `status.ready` to inline components.
- **Is Avatar V2 untouched?** Yes. No files under `src/HomeOps.Client/src/avatarV2/` were modified.
- **Backend/API/schema unchanged?** Yes. No backend, API contract, database, migration, or generated client files were modified.

## Preflight

Read before implementation:

- `.github/copilot-instructions.md`
- `AGENTS.md`
- `docs/reports/2026-06-28-familyboard-asset-library-architecture/familyboard-asset-library-architecture.md`
- `docs/reports/2026-06-28-familyboard-svg-asset-audit/familyboard-svg-asset-audit.md`

Preflight command result:

```bash
export DOTNET_CLI_HOME=/tmp/dotnet
export PATH="$PATH:$HOME/.dotnet/tools"
dotnet --version
# 10.0.301
```

## Architecture

The new foundation lives in `src/HomeOps.Client/src/design/`:

- `icons/` contains inline React SVG icon components, the reusable `FamilyBoardIcon` component, type definitions, and icon size tokens.
- `registry/` contains the semantic icon registry and resolver.
- `illustrations/` is reserved for future SVG-only spot illustrations and empty states, but intentionally contains no illustration assets.
- `decorations/` is reserved for future SVG-only decorative motifs, but intentionally contains no decoration assets.
- `design-asset-system.md` documents contribution rules, naming, accessibility, `currentColor`, and prohibited practices.

The implementation is deliberately small so Phase 1 icon migration can add production icon families without page-local ad hoc SVGs or external icon packages.

## Implemented infrastructure

- Added shared logical icon sizes: `small`, `normal`, and `large`.
- Added `FamilyBoardIcon`, supporting:
  - semantic `name`
  - token or numeric `size`
  - decorative default behavior
  - accessible `title` for meaningful standalone icons
  - `className`
  - inline SVG rendering
  - `currentColor`
- Added initial registry entries only for architectural validation:
  - `core.add`
  - `core.close`
  - `navigation.home`
  - `navigation.settings`
  - `status.ready`
- Added tests proving inline SVG rendering, accessibility title behavior, sizing tokens, and current registry scope.

## Validation

Commands run:

```bash
npm run build
```

Result: Passed. Vite emitted the existing chunk-size warning for a generated JS chunk over 500 kB.

```bash
npm run test
```

Result: Passed. 28 test files and 154 tests passed.

```bash
git diff --check
```

Result: Passed.

## Remaining work

- Phase 1 icon migration can add Agenda, Shopping, Weekly Reset, shell, and status icon families.
- Production pages still need future migration to the new semantic registry.
- Existing `HomeOpsIcon` remains in place for current production SVG-file-backed assets and fallback behavior until a future migration slice replaces or bridges it.
- Illustrations and decorations remain intentionally unpopulated.
- No emoji replacement was performed in this foundation slice.

## Modified files

- `src/HomeOps.Client/src/design/FamilyBoardIcon.test.tsx`
- `src/HomeOps.Client/src/design/decorations/README.md`
- `src/HomeOps.Client/src/design/design-asset-system.md`
- `src/HomeOps.Client/src/design/icons/FamilyBoardIcon.tsx`
- `src/HomeOps.Client/src/design/icons/coreIcons.tsx`
- `src/HomeOps.Client/src/design/icons/iconTokens.ts`
- `src/HomeOps.Client/src/design/icons/iconTypes.ts`
- `src/HomeOps.Client/src/design/icons/navigationIcons.tsx`
- `src/HomeOps.Client/src/design/icons/statusIcons.tsx`
- `src/HomeOps.Client/src/design/illustrations/README.md`
- `src/HomeOps.Client/src/design/index.ts`
- `src/HomeOps.Client/src/design/registry/iconRegistry.ts`
- `docs/reports/2026-06-28-design-asset-system-foundation/design-asset-system-foundation.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

## Binary artifact confirmation

- No screenshots added.
- No videos added.
- No PNG files added.
- No JPG/JPEG files added.
- No GIF files added.
- No WEBP files added.
- No PDF files added.
- No binary assets added.
