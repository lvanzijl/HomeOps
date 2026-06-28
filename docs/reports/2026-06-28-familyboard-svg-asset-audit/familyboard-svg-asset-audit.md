# FamilyBoard SVG Asset Audit

## Summary

FamilyBoard has started moving toward owned SVG visuals, but Unicode emoji and text symbols are still visible in a few high-impact places. The largest remaining visual debt is Agenda event-type iconography, which still uses platform emoji for birthdays, holidays, school, sports, health, shopping, home, work, media, and generic events. The second visible debt is shell/settings and utility symbols that still render as text glyphs (`⚙`, `↗`, `✓`, `…`, `×`, `↟`) instead of FamilyBoard-owned SVG components.

The recommendation is to complete a small SVG-first asset pass before the next public marketing video. This should be limited to a compact set of domain/navigation, Agenda type, Shopping, Settings, status, and utility icons, while keeping Avatar V2 separate from generic UI iconography.

Explicit answers:

- Are Unicode emoji still visible? **Yes.** Agenda event types use emoji, Settings navigation uses `⚙`, Home/domain open actions can show `↗`, Weekly Reset uses `✓` / `…`, Shopping uses `↟`, and several HomeOpsIcon fallbacks still define emoji/symbol text.
- Where are they most harmful? **Agenda Month/Week/List**, because event emoji are repeated, platform-dependent, and visible in calendar cells/cards during a marketing movie.
- Is Avatar V2 already acceptable? **Yes.** Avatar V2 is already SVG-only, deterministic, warm, and product-specific. It should remain separate from the generic UI icon library unless a deliberate shared primitive is introduced.
- Should SVG work happen before the next public marketing video? **Yes.** At minimum, replace Agenda emoji event types and shell/utility text symbols visible in the movie.
- What is the smallest useful SVG asset set? **About 18-24 icons:** core actions/status, navigation/domain icons, the 10 Agenda type icons, Shopping bag/list/store, Settings gear, Weekly Reset/check status, and one neutral placeholder.
- Which implementation approach is recommended? **Inline React SVG components registered through a small semantic icon registry**, using `currentColor`, size props, accessible labels only when meaningful, and no binary assets.
- Were any binary artifacts created? **No.** This audit created one Markdown report only.

## Preflight

Read before auditing:

- `.github/copilot-instructions.md`
- `AGENTS.md`
- Latest preview video report: `docs/reports/2026-06-28-familyboard-preview-video/familyboard-preview-video.md`
- Latest Family Member Compact Layout report: `docs/reports/2026-06-28-family-member-compact-layout/family-member-compact-layout.md`
- Latest Wide Viewport Layout report: `docs/reports/2026-06-28-familyboard-wide-viewport-layout/familyboard-wide-viewport-layout.md`
- Latest Authoritative Visual Review reports:
  - `docs/reports/2026-06-28-familyboard-authoritative-visual-review/familyboard-authoritative-visual-review.md`
  - `docs/reports/2026-06-28-familyboard-authoritative-visual-review-round-2/familyboard-authoritative-visual-review-round-2.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

Preflight command result:

```bash
export DOTNET_CLI_HOME=/tmp/dotnet
export PATH="$PATH:$HOME/.dotnet/tools"
dotnet --version
# 10.0.301
```

## Runtime validation

VisualReview runtime was used for this audit.

Runtime commands:

```bash
ASPNETCORE_ENVIRONMENT=VisualReview DOTNET_CLI_HOME=/tmp/dotnet \
  dotnet run --project src/HomeOps.Api/HomeOps.Api.csproj --no-launch-profile \
  --urls 'http://127.0.0.1:5108;http://127.0.0.1:5152'
```

```bash
VITE_HOMEOPS_API_BASE_URL=http://127.0.0.1:5108 npm run dev -- --host 127.0.0.1 --port 5173
```

Fixtures loaded:

```bash
curl -sS -X POST http://127.0.0.1:5108/api/visual-review-fixtures/visual-full/reset
curl -sS -X POST http://127.0.0.1:5108/api/visual-review-fixtures/visual-weekly-reset/reset
```

Viewport: **1920×1080**.

Pages/surfaces reviewed:

- Home
- Agenda Month
- Agenda Week
- Agenda List
- Tasks
- Shopping
- Motivation
- Family Member
- Avatar Editor
- Weekly Reset
- Settings
- Home dialogs and Family Member/Add/Avatar dialogs by source inspection
- Floating/placeholder/admin surfaces by source inspection
- VisualReview fixture/demo strings by source inspection

Temporary browser dependency installation was needed for Playwright runtime inspection in this container. No screenshots were captured or retained.

## Current icon sources

### Unicode emoji

- Agenda event visual mapping defines emoji literals for event types: birthday `🎂`, holiday `🏖️`, school `🎒`, sport `⚽`, health `🩺`, shopping `🛒`, home `🏡`, work `💼`, media `🎬`, and default `📌`.
- HomeOpsIcon still defines emoji fallbacks for celebration, memory/helpfulness, teamwork, sparkle, and several child/motivation concepts. Most of these have SVG assets now, but the fallback contract still allows emoji to surface if an asset import fails or a variant has no asset.

### Custom SVG

- `src/HomeOps.Client/src/assets/homeops/` already contains SVG assets for celebration, child ownership, helpful moments, and core UI actions.
- Avatar V2 generates inline SVG strings and is already separate from the generic icon layer.
- HomeOpsIcon currently imports SVG files as URL assets and renders them through `<img>` inside a span.

### HomeOpsIcon

- HomeOpsIcon is the current semantic layer for owned visuals. It covers add/back/close, celebration, child ownership, helpful moments, progress, routine, sparkle, teamwork, memory, and related variants.
- Gaps: `open`, `checkmark`, `completed`, and some fallback-only symbols still render as text when no asset exists.

### CSS shapes

- Several visual flourishes are CSS-only pseudo-elements or shapes, such as home summary card top accents, dialog backdrops, progress rings/bars, swatches, and card decoration. These are acceptable when decorative and not functioning as icons.

### Text-only fallback / browser-native symbols

- Settings navigation uses a raw `⚙` character.
- Home/domain open buttons can render raw `↗` through HomeOpsIcon fallback.
- Weekly Reset readiness badge uses raw `✓` or `…`.
- Agenda close button uses raw `×`.
- Shopping illustration uses raw `↟`.
- Text separators such as `·`, dashes, and Dutch copy punctuation are not iconography debt unless styled as a visual symbol.

### Third-party icons

- No third-party icon package is present in `package.json`, and no `lucide`, `react-icons`, or similar imports were found in the client source.

## Visible emoji/symbol debt by page

| Page/component | Visible symbol | Current purpose | Severity | Replacement priority | Suggested SVG concept |
| --- | --- | --- | --- | --- | --- |
| Shell / Settings nav | `⚙` | Settings/admin navigation | High | Must before marketing video | Warm rounded gear with soft center dot |
| Home summary card actions | `↗` | Open domain/page action | Medium | Must if visible in video | Rounded arrow leaving soft tile, or `openPanel` icon |
| Home dialogs | `×` through close icon asset normally; fallback exists | Dialog close | Low/Medium | Should if cheap | Ensure close always SVG and remove visible fallback risk |
| Agenda Month cells | `🎂`, `🏖️`, `🎒`, `⚽`, `🩺`, `🛒`, `🏡`, `💼`, `🎬`, `📌` | Event type indicators | Critical | Must before marketing video | Agenda type icon set with consistent stroke/fill |
| Agenda selected-day cards | Same Agenda emoji set | Event type labels and card identity | Critical | Must before marketing video | Same Agenda type icon set |
| Agenda Week timeline | Same Agenda emoji set | Event type indicators in dense timeline | Critical | Must before marketing video | Same Agenda type icon set, 16-20px form |
| Agenda List | Same Agenda emoji set | Event type grouping/card identity | High | Must before marketing video | Same Agenda type icon set |
| Agenda event dialog | `×` | Close event dialog | Medium | Should before Friends & Family if cheap | Core close SVG via shared icon |
| Tasks | `↗` in shell/card open fallback if present | Navigation/action utility | Low/Medium | Should if cheap | Shared open icon |
| Tasks | `✓` in completion/check fallback/tests | Done/completed state | Medium | Should if cheap | Soft check-in-circle or leaf-check |
| Shopping header illustration | `↟` | Decorative shopping bag/tree-like placeholder | High | Must before marketing video | Rounded shopping bag with handle and small heart/check |
| Shopping | `↗` via shell/open fallback if visible | Navigation/action utility | Low/Medium | Should if cheap | Shared open icon |
| Motivation | HomeOpsIcon SVGs; emoji fallbacks defined | Celebration/progress/helpfulness | Low visible risk, Medium fallback risk | Can wait after event/status core pass | Keep existing SVGs; audit fallback-only names |
| Family Member | HomeOpsIcon SVGs and Avatar V2 | Back/progress/today/helpfulness/celebration | Low | Can wait after Friends & Family | Keep Avatar V2 and child ownership SVGs; normalize status icons later |
| Avatar Editor | Inline SVG avatar previews | Avatar identity/editor | Acceptable | No generic replacement needed | Keep Avatar V2 separate |
| Weekly Reset | `✓`, `…` | Ready/not-ready badge | Medium | Must/Should before marketing video depending scene prominence | Reset status icon: check-circle and in-progress dots |
| Settings backup/restore | `⚙` from nav, browser-native file input | Admin/settings surface | Medium | Should if cheap | Gear, export/import, file, restore icons |
| Placeholder/future domains | Text-only placeholders | Future house/media/rewards pages | Low | Can wait after Friends & Family | Neutral placeholder/domain icons when those pages become real |
| Fixture/demo labels | Agenda fixture event titles trigger emoji type mapping | Visible demo meaning | High because movie uses fixture | Must before marketing video | Replace rendered type glyphs only; keep Dutch/fixture text semantic |

## Product impact analysis

Highest product-impact issues:

1. **Agenda emoji are the primary public-video blocker.** They repeat across Month, Week, List, and selected-day cards. Emoji rendering varies by platform, can look glossy or childish, and clashes with the carefully polished pastel FamilyBoard UI.
2. **Shopping `↟` reads like a placeholder/developer symbol.** It does not communicate shopping clearly and has no FamilyBoard visual personality.
3. **Settings `⚙` and open `↗` expose raw browser/Unicode glyphs in the shell.** These are small but repeated in every scene, which makes the shell feel less custom.
4. **Weekly Reset `✓` / `…` is less damaging but still style-inconsistent.** The closure moment should feel intentional, not like a raw text badge.
5. **HomeOpsIcon fallback emoji are a latent consistency risk.** Even when SVG assets are currently available, the registry still encodes emoji as fallback product language.

Lower impact or already acceptable:

- Avatar V2 is already aligned with the product direction because it is SVG-only, warm, deterministic, and personal.
- Celebration/child ownership/helpful moments visuals are mostly already SVG-backed and should not be replaced in the first generic UI icon pass.
- CSS decorative shapes are acceptable if they remain non-semantic and consistent with the card system.

## Proposed SVG asset library

Keep the first FamilyBoard asset set intentionally small.

### Navigation/domain icons

1. `domainHome` — small house/board
2. `domainAgenda` — calendar page
3. `domainTasks` — checklist
4. `domainShopping` — shopping bag/list
5. `domainMotivation` — heart/star progress
6. `domainSettings` — rounded gear
7. `domainWeeklyReset` — circular refresh/check

### Home/dashboard

8. `openPanel` — replace raw `↗`
9. `add` — keep/normalize existing add SVG
10. `close` — keep/normalize existing close SVG

### Agenda

11. `agendaBirthday` — cake/candle
12. `agendaHoliday` — sun/umbrella or small suitcase
13. `agendaSchool` — backpack/book
14. `agendaSport` — ball/motion
15. `agendaHealth` — soft medical cross/heart
16. `agendaShopping` — bag/basket
17. `agendaHome` — house
18. `agendaWork` — briefcase
19. `agendaMedia` — play card
20. `agendaDefault` — pin/dot/calendar marker

### Tasks

21. `taskDone` — check-circle
22. `taskTomorrow` — small sunrise/arrow-forward calendar

### Shopping

23. `shoppingBag` — replace `↟`
24. `store` — small storefront/shelf marker

### Motivation / Celebration / Reward

25. Keep current celebration/helpful/child ownership SVGs for now.
26. Add only if needed: `rewardSparkle` as a warm sparkle, replacing fallback-only sparkle later.

### Weekly Reset / Status / Feedback

27. `statusReady` — check-circle
28. `statusPending` — three soft dots or small clock
29. `resetLoop` — circular arrow with check

This is the upper bound. The smallest marketing-video set is: `domainSettings`, `openPanel`, all 10 Agenda type icons, `shoppingBag`, `statusReady`, `statusPending`, `taskDone`, `close` if not fully covered, and `domainWeeklyReset` if the Weekly Reset scene uses a domain marker.

## Technical architecture recommendation

Recommended approach: **inline React SVG components with a central semantic registry**.

Do not use imported SVG files for the next generic icon pass, sprites, CSS masks, PNG/JPG/WebP/GIF/PDF, or external icon libraries.

Rationale:

- Inline React SVG components are text-based, reviewable, tree-shakable, and do not add binary assets.
- `currentColor` allows icons to inherit FamilyBoard domain colors and pastel accents without duplicating assets.
- A typed registry prevents icon sprawl and keeps component usage semantic (`name="agendaHealth"`, not arbitrary file paths).
- React components make accessibility explicit: decorative icons should be `aria-hidden`, meaningful icons can receive `role="img"` and a Dutch label.
- Inline components avoid `<img src>` indirection and make stroke/fill consistency easier to enforce.

Suggested structure:

```text
src/HomeOps.Client/src/icons/
  FamilyBoardIcon.tsx
  familyBoardIconRegistry.ts
  icons/
    AgendaIcons.tsx
    CoreUiIcons.tsx
    DomainIcons.tsx
    StatusIcons.tsx
```

Design rules:

- Use `viewBox="0 0 24 24"` for utility/domain icons.
- Use `viewBox="0 0 32 32"` only for richer spot icons if needed.
- Default to rounded strokes, `strokeLinecap="round"`, `strokeLinejoin="round"`.
- Prefer `stroke="currentColor"` plus optional low-opacity fills using `currentColor` or CSS variables.
- Keep icons readable at 16, 20, 24, and 32 px.
- Do not encode Dutch text inside SVG. Dutch remains in labels/copy/aria-labels.
- Keep Avatar V2 in `avatarV2/` and avoid coupling it to `FamilyBoardIcon`.

## Migration strategy

### Phase 1 — Marketing-video cleanup

- Replace Agenda event emoji with semantic SVG icons in Month, Week, List, and selected-day cards.
- Replace shell Settings `⚙` with `domainSettings`.
- Replace Home/domain `↗` open fallback with `openPanel`.
- Replace Shopping `↟` with `shoppingBag`.
- Replace Weekly Reset `✓` / `…` badge with `statusReady` / `statusPending`.
- Ensure dialog close buttons consistently render SVG and not raw `×` where visible.

### Phase 2 — Friends & Family consistency

- Replace remaining HomeOpsIcon fallback-only names (`checkmark`, `completed`, `open`) with SVG assets/components.
- Add domain icons where navigation benefits from visual reinforcement, without making the nav cluttered.
- Normalize Tasks completed/tomorrow/status marks.
- Add Settings export/import/restore icons only if the Settings page receives more visual polish.

### Phase 3 — Extended visual language

- Expand reward/celebration/Home integration icons after real feature needs appear.
- Add house/media/gamification domain icons only when those surfaces are implemented.
- Evaluate whether existing SVG-file-backed HomeOpsIcon assets should migrate into inline React components, but do not do this as part of the first movie-focused pass.

## Prioritized punch list

### Must replace before public marketing video

| Page/component | Current symbol/icon | Proposed SVG concept | Reason | Estimated complexity |
| --- | --- | --- | --- | --- |
| Agenda Month/Week/List/Selected Day | `🎂`, `🏖️`, `🎒`, `⚽`, `🩺`, `🛒`, `🏡`, `💼`, `🎬`, `📌` | 10 consistent Agenda type icons | Most repeated platform-dependent emoji; biggest mismatch with polished UI | Medium |
| Shopping | `↟` | `shoppingBag` | Reads like placeholder/developer artifact | Low |
| Shell Settings nav | `⚙` | `domainSettings` gear | Visible across every scene; raw glyph weakens branded shell | Low |
| Home/domain card open actions | `↗` | `openPanel` | Repeated raw utility symbol in movie scenes | Low |
| Weekly Reset completion badge | `✓` / `…` | `statusReady` / `statusPending` | Closure scene should feel intentional and warm | Low |

### Should replace before Friends & Family if cheap

| Page/component | Current symbol/icon | Proposed SVG concept | Reason | Estimated complexity |
| --- | --- | --- | --- | --- |
| Agenda dialog close | `×` | Shared `close` SVG | Dialog polish and consistency | Low |
| Tasks completed/check states | `✓` fallback | `taskDone` / `statusReady` | Avoid raw check glyph in action-heavy task UI | Low |
| HomeOpsIcon `open`, `completed`, `checkmark` | `↗`, `✓` | SVG-backed registry entries | Removes fallback-only utility symbols | Low |
| Settings backup/restore actions | Mostly text/browser-native | `export`, `import`, `restore`, `file` icons | Makes admin surface feel less utilitarian | Medium |
| Domain nav optional icons | Text-only labels plus settings glyph | Small domain icons | Could improve scanability if kept subtle | Medium |

### Can wait until after Friends & Family

| Page/component | Current symbol/icon | Proposed SVG concept | Reason | Estimated complexity |
| --- | --- | --- | --- | --- |
| House/media/gamification placeholders | Text-only | Future domain icons | Not part of current MVP surface depth | Low/Medium |
| Motivation extended rewards | Existing SVGs + fallback emoji | Reward/celebration expansion | Existing SVGs are acceptable; wait for real feature need | Medium |
| Avatar V2 shared primitives | Avatar-specific inline SVG | None now | Already acceptable and intentionally separate | High if overdone |
| CSS decorative shapes | CSS pseudo-elements | Keep CSS | Not semantic iconography; no urgent replacement | None |

## Risks

- **Over-design:** building a huge icon system before the product needs it would slow delivery and introduce inconsistent usage.
- **Inconsistent stroke/fill:** mixing outline-only, filled, and illustrative icons without strict rules would recreate the current mismatch.
- **Too many icons:** generic one-off icons for every small label would create sprawl.
- **Accessibility mistakes:** decorative icons must stay hidden; meaningful icons need Dutch labels when text is absent.
- **Loss of warmth:** replacing emoji with sterile enterprise icons would undermine FamilyBoard's family-friendly identity.
- **Accidental binary artifacts:** icon work must remain SVG/text/TSX only and avoid screenshots, PNGs, PDFs, generated bitmaps, or design exports.
- **Tests asserting text symbols:** existing tests assert emoji/symbols in Agenda/HomeOpsIcon areas, so migration will require intentional test updates.
- **Replacing meaningful fixture text incorrectly:** fixture/demo titles and Dutch copy should remain; only rendered iconography should change.
- **Avatar coupling:** Avatar V2 should not be forced into the generic UI icon registry.

## Recommendation

Proceed with a focused **SVG Iconography Phase 1** before the next public marketing video. Limit it to high-impact visible debt: Agenda event types, Shopping placeholder symbol, Settings gear, open action, Weekly Reset status, and fallback-only utility symbols. Use inline React SVG components with `currentColor` and a typed semantic registry. Keep Dutch UI language in surrounding text and accessibility labels. Preserve Avatar V2 as its own SVG identity system.

## Modified files

- `docs/reports/2026-06-28-familyboard-svg-asset-audit/familyboard-svg-asset-audit.md`

## Binary artifact confirmation

- No screenshots added.
- No videos added.
- No PNG files added.
- No JPG/JPEG files added.
- No GIF files added.
- No WEBP files added.
- No PDF files added.
- No SVG files added.
- No new binary assets added.
