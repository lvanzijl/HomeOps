# FamilyBoard Design Asset System Phase 1

## Summary

Implemented the first production migration slice for the FamilyBoard Design Asset System. The slice replaces only the highest-impact visible product-preview glyphs with semantic inline React SVG assets while preserving backend behavior, API contracts, database schema, workflows, navigation, Avatar V2, and VisualReview runtime behavior.

Explicit answers:

- **Agenda emoji removed?** Yes. Agenda event-type visuals now use `agenda.birthday`, `agenda.holiday`, `agenda.school`, `agenda.sport`, `agenda.health`, `agenda.shopping`, `agenda.home`, `agenda.work`, `agenda.media`, and `agenda.default` semantic SVG icons.
- **Shopping placeholder removed?** Yes. The Shopping hero placeholder glyph is replaced by `shopping.bag`.
- **Settings gear replaced?** Yes. The shell Settings glyph now renders `navigation.settings`.
- **Open glyph replaced?** Yes. The `HomeOpsIcon` open fallback now bridges to `core.open` instead of rendering a raw arrow glyph.
- **Weekly Reset status glyphs replaced?** Yes. The ready and pending completion badges now render `status.ready` and `status.pending`.
- **Avatar V2 untouched?** Yes. No Avatar V2 production files were modified.
- **Remaining SVG work?** Yes. Remaining debt includes lower-priority HomeOpsIcon fallback emoji for celebration/helpfulness/teamwork/sparkle-style concepts, future domain/status icons outside this preview-movie Phase 1 slice, and future illustration/empty-state/reward asset families.
- **Backend/API/schema unchanged?** Yes. No backend, API contract, migration, generated API client, or database schema files were changed.

## Preflight

Read before implementation:

- `.github/copilot-instructions.md`
- `AGENTS.md`
- `docs/reports/2026-06-28-design-asset-system-foundation/design-asset-system-foundation.md`
- `docs/reports/2026-06-28-familyboard-asset-library-architecture/familyboard-asset-library-architecture.md`
- `docs/reports/2026-06-28-familyboard-svg-asset-audit/familyboard-svg-asset-audit.md`
- `docs/reports/2026-06-28-familyboard-preview-video/familyboard-preview-video.md`

Preflight command result:

```bash
export DOTNET_CLI_HOME=/tmp/dotnet
export PATH="$PATH:$HOME/.dotnet/tools"
dotnet --version
# 10.0.301
```

## Root cause

The Design Asset System foundation existed, but the most visible preview-movie surfaces still rendered platform-dependent emoji and raw browser glyphs in icon slots. Agenda repeated emoji across Month, Week, List, and event cards; Shopping used a placeholder-like glyph; the shell Settings action exposed a raw gear; the open action could render a raw arrow; and Weekly Reset status badges used raw check/ellipsis symbols. These glyphs weakened the custom FamilyBoard visual identity despite the surrounding UI polish.

## Implementation

- Added Phase 1 semantic inline SVG icon families under the existing Design Asset System:
  - Agenda type icons: birthday, holiday, school, sport, health, shopping, home, work, media, default.
  - Shopping bag icon.
  - Core open icon.
  - Status pending icon.
- Registered the new assets in the typed FamilyBoard semantic icon registry.
- Migrated Agenda event indicators and event-card icons from emoji strings to `FamilyBoardIcon` semantic names.
- Migrated the Agenda dialog close button to the shared `core.close` icon.
- Migrated the shell Settings navigation glyph to `navigation.settings`.
- Migrated Shopping hero placeholder glyph to `shopping.bag`.
- Migrated Weekly Reset completion status glyphs to `status.ready` and `status.pending`.
- Bridged Phase 1 HomeOpsIcon utility fallbacks for `open`, `completed`, and `checkmark` to FamilyBoard semantic icons.
- Updated tests that previously asserted raw emoji/glyph text so they validate semantic/icon rendering instead.

## Browser validation

VisualReview runtime was used at 1920×1080.

Runtime commands used:

```bash
export DOTNET_CLI_HOME=/tmp/dotnet
export PATH="$PATH:$HOME/.dotnet/tools"
ASPNETCORE_ENVIRONMENT=VisualReview dotnet run --project src/HomeOps.Api/HomeOps.Api.csproj --no-launch-profile --urls 'http://127.0.0.1:5108;http://127.0.0.1:5152'
```

```bash
cd src/HomeOps.Client
VITE_HOMEOPS_API_BASE_URL=http://127.0.0.1:5108 npm run dev -- --host 127.0.0.1 --port 5173
```

Fixture commands used:

```bash
curl -sS -m 5 http://127.0.0.1:5108/health
curl -sS -X POST http://127.0.0.1:5108/api/visual-review-fixtures/visual-full/reset
curl -sS -X POST http://127.0.0.1:5108/api/visual-review-fixtures/visual-weekly-reset/reset
```

Browser validation command used:

```bash
cd /tmp/pw && npx playwright test validate.spec.js --browser=chromium --timeout=60000
```

Result: passed after installing Playwright browser system dependencies in the container with `npx playwright install-deps chromium`. The browser validation covered Home, Agenda Month, Agenda Week, Agenda List, Shopping, Settings, and Weekly Reset through VisualReview data. It verified no remaining Phase 1 Agenda emoji, no Shopping placeholder glyph, no Settings gear glyph, SVGs present in migrated slots, no detected horizontal overflow on Home, and Weekly Reset status SVG presence.

## Movie impact assessment

The current preview movie scene order was manually replayed inside the browser after the VisualReview validation setup, covering Home, Agenda, Shopping, Weekly Reset, and Settings. The new SVG assets noticeably improve the product impression because the most repeated and platform-dependent symbols now share a warm, rounded, FamilyBoard-owned line language. Agenda benefits the most: event density still reads quickly, but no longer looks like platform emoji pasted into a polished product. Shopping no longer exposes a placeholder-like symbol, Settings feels consistent with the shell, the Home open affordance is more intentional, and Weekly Reset's closure badge reads as a designed status mark rather than raw punctuation.

The marketing movie was not regenerated in this slice.

## Test results

- `npm run build` — passed. Vite emitted the existing chunk-size warning for a generated JS chunk over 500 kB.
- `npm test` — passed. 28 test files and 154 tests passed.
- Targeted icon tests — passed after updating expectations for semantic SVG rendering.
- Browser validation — passed with VisualReview `visual-full` and `visual-weekly-reset` at 1920×1080.
- `git diff --check` — passed.

## Remaining SVG debt

- Lower-priority HomeOpsIcon fallback emoji remain for non-Phase 1 motivation/celebration/helpfulness concepts where SVG-backed assets usually exist but text fallback contracts still include emoji.
- Future domain icons for inactive/future surfaces remain out of scope.
- Motivation illustrations, Celebration assets, Reward assets, Empty states, Home integrations, and decorative illustrations remain intentionally unmigrated.
- Broader imported SVG-to-inline migration for legacy HomeOpsIcon assets remains future work.

## Modified files

- `src/HomeOps.Client/src/design/icons/agendaIcons.tsx`
- `src/HomeOps.Client/src/design/icons/shoppingIcons.tsx`
- `src/HomeOps.Client/src/design/icons/coreIcons.tsx`
- `src/HomeOps.Client/src/design/icons/statusIcons.tsx`
- `src/HomeOps.Client/src/design/icons/iconTypes.ts`
- `src/HomeOps.Client/src/design/registry/iconRegistry.ts`
- `src/HomeOps.Client/src/design/FamilyBoardIcon.test.tsx`
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.tsx`
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.test.tsx`
- `src/HomeOps.Client/src/widgets/components/ShoppingListWidget.tsx`
- `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx`
- `src/HomeOps.Client/src/weeklyReset/WeeklyResetPage.tsx`
- `src/HomeOps.Client/src/icons/homeOpsIcons.tsx`
- `src/HomeOps.Client/src/icons/homeOpsIcons.test.tsx`
- `src/HomeOps.Client/src/home/FamilyMemberPage.test.tsx`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-06-28-design-asset-system-phase1/design-asset-system-phase1.md`

## Binary artifact confirmation

- No PNG files added.
- No JPG/JPEG files added.
- No GIF files added.
- No WEBP files added.
- No PDF files added.
- No videos added.
- No screenshots added.
- No binary assets added.
