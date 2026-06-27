# Executive Summary

- Overall FamilyBoard quality: **8 / 10**
- Family identity: **8 / 10**
- Product cohesion: **7.5 / 10**
- Ready for Friends & Family beta: **Yes, with minor polish**

FamilyBoard now reads as one coherent family product more often than it reads as a collection of separate pages. The strongest unifying traits are the shared top navigation, warm card language, soft colour system, family-first copy, rounded touch targets, and the consistent separation between dashboard, work, and ritual modes. Home, Motivation, Tasks, and Weekly Reset now clearly express the product promise: calm household awareness, encouragement, practical action, and a weekly family reset.

The remaining product-level gaps are not page failures so much as system maturity issues. Shopping and Weekly Reset are taller than the other major surfaces, Agenda still exposes a technical source-control strip, action placement varies between pages, and empty states do not always carry the same emotional quality as populated states. FamilyBoard is beta-ready for a small Friends & Family audience because the core story is understandable and warm, but it should be positioned as **ready with minor polish**, not visually final.

# Review Plan

1. Read repository instructions and existing implementation/UX reports for Home, Motivation, Agenda, Tasks, Shopping, Weekly Reset, and prior cross-product reviews.
2. Start the Vite application and inspect the six MVP workspaces as one end-to-end product journey.
3. Validate the product in Chromium at `1366×768` and `1920×1080`, recording measured page height, panel height, card counts, button counts, navigation state, and visible copy.
4. Focus findings on product cohesion, family identity, workflow continuity, and cross-product pattern consistency rather than page-specific implementation changes.
5. Add only this required report, then inspect the full diff and binary artifact state.

# Archetype Assessment

## Dashboard pages: Home and Motivation

Home fulfils the dashboard archetype well. It immediately answers what the family should know now: today, time, weather readiness, family members, near agenda items, task state, motivation state, and list state. At both validated viewports it stayed within the visible document height (`770 px` at `1366×768`, `1080 px` at `1920×1080`), so the dashboard promise is credible. The hierarchy is understandable: family status first, then four domain summaries. The warmth comes from family member chips, soft cards, and low-pressure empty-state language.

Motivation also fulfils the dashboard archetype, but with a different emotional job. It communicates encouragement, appreciation, celebrations, and progress rather than operational urgency. The current empty validation state is still coherent: `Nog geen familiedoel`, `Recente waardering`, `Aankomende momenten`, and `In één oogopslag` make the page feel like a family morale surface, not a reporting page. It measured compactly (`427 px` panel height at both viewports), which supports glanceability, though richer populated-state review remains important.

Verdict: **Dashboard archetype succeeds.** Home is the stronger practical overview; Motivation is the stronger emotional overview. Both feel family-first and visually related.

## Workspace pages: Agenda, Tasks, and Shopping

Agenda fulfils the workspace archetype. It supports month, week, and list planning; the visible Month surface provides a clear family planning grid, event indicators, quiet-day language, and a selected-day workflow. It is not a corporate calendar clone. The main cross-product weakness is that the `Bronnen` / source selector remains visibly technical compared with the rest of FamilyBoard. Agenda measured `894 px` document height at `1366×768` and `1080 px` at `1920×1080`, which is acceptable for an operational planning surface.

Tasks fulfils the workspace archetype very well in the empty validation state. It is fast, clear, touch-friendly, and action-oriented: `Taken voor het gezin`, `Gezinstaak toevoegen`, `Routinestarters`, `Week plannen`, and `Gezinsreset openen` create a practical route from execution to planning. It measured compactly (`366 px` panel height), showing that the page can be calm when there is no active load. Prior populated reports indicate density risk, but the page’s time-first structure is coherent.

Shopping fulfils the workspace archetype directionally, but it remains the least cohesive of the workspaces. The quick-add area is strong and practical, and the page explains the family job well: write it down, group by store, and check off while shopping. However, it measured much taller than the viewport at both sizes (`1362 px` document height, `1300 px` panel height), even in an empty/intercepted validation state. Scrolling is acceptable for a shopping workspace, but the page rhythm feels heavier than Agenda and Tasks.

Verdict: **Workspace archetype mostly succeeds.** Agenda and Tasks feel ready; Shopping is useful and family-oriented but still needs density/rhythm polish to feel as effortless as the rest of the product.

## Ritual pages: Weekly Reset

Weekly Reset now fulfils the ritual archetype. The page leads with `Zijn we klaar voor volgende week?`, frames the activity as a calm family check, and explains what changes and what stays stable. It feels like a family ritual rather than system maintenance because it uses optimistic language, recap cards, and conscious-choice framing.

The main issue is completion energy. The page explains the ritual well, but the reviewed state still feels more like a guided review than a satisfying closing ceremony. It is also tall (`1393 px` at `1366×768`, `1407 px` at `1920×1080`), so the ritual can feel long before it feels complete. This is acceptable for beta, but the completion moment should become more emotionally memorable.

Verdict: **Ritual archetype succeeds with polish needed.** It is warm, clear, and family-first; the ending can become more celebratory.

# Cross-Product Consistency

- Navigation: The primary navigation is coherent and short: Home, Agenda, Tasks, Shopping, Motivation, and Settings. The same nav shell anchors every reviewed page. Weekly Reset is contextual rather than primary, which is conceptually right, but once opened its nav has no active primary state, creating a slight sense of being outside the main map.
- Cards: Cards are the strongest consistency pattern. Rounded panels, tinted sections, summary cards, task cards, and ritual cards all support the FamilyBoard identity. Some pages use richer cards while others use denser utility rows, so card rhythm is not fully unified.
- Buttons: Buttons are consistently rounded and touch-sized, but action placement varies. Home uses compact header icon actions, Tasks uses row/card actions plus support actions, Shopping uses quick-add and list actions, and Weekly Reset uses ritual actions. This is understandable but not fully systematized.
- Typography: Typography is readable, calm, and mostly consistent. Eyebrows and human headings work well. Cross-language mixing between English shell descriptions and Dutch page content remains visible and weakens polish.
- Colours: Soft domain colours and pastel accents make the product warm rather than enterprise-like. Colour meaning is friendly, though contrast and semantic consistency still need a dedicated accessibility pass.
- Spacing: Home, Motivation, and Tasks feel compact and composed. Shopping and Weekly Reset are much taller and have a more vertical rhythm. This is not inherently wrong, but the product’s page rhythm shifts noticeably.
- Illustrations: The illustration/emotional asset layer is present in spirit through icons, emoji, and warm empty states, but it is not uniformly mature across all pages. Some surfaces still rely on placeholder-like icon treatments or simple text blocks.
- Iconography: Icons and emoji are approachable and family-friendly. However, icon-only actions on Home and dense Agenda indicators still require learning, especially for first-time users.
- Interaction patterns: The product is moving toward a warm conversation/action model, but not all flows match. Create/edit dialogs and quick actions still vary in rhythm and emotional tone.

# Product Journey

The complete family journey is coherent:

1. Open Home: The family sees today, who is in the household, agenda highlights, task status, motivation, and list status.
2. Check Motivation: The emotional surface shifts naturally from status to encouragement and appreciation.
3. Review Agenda: The family moves from “what should we know?” into planning by month/week/list.
4. Complete Tasks: The product shifts from planning into action with today-first household work.
5. Add Shopping items: Shopping supports quick capture and store-oriented execution.
6. Perform Weekly Reset: Tasks provides the contextual bridge into a weekly family ritual.

Friction remains in three places. First, the order of navigation places Motivation after Shopping even though the conceptual journey often checks motivation earlier. Second, Weekly Reset is reachable contextually from Tasks, but it does not show as active in the main nav, so its place in the product map is slightly ambiguous. Third, Shopping’s page length and lower polish can make the journey feel less calm just before the weekly ritual.

# Remaining UX Issues

1. **High** — Weekly Reset has no active primary navigation state, making it feel slightly outside the main product map.
2. **High** — Shopping remains significantly taller and more vertically heavy than the other major workspaces, even before real shopping data is present.
3. **High** — Cross-language mixing remains visible between English shell descriptions and Dutch page/workflow copy.
4. **High** — Action placement is not fully standardized across Home, Agenda, Tasks, Shopping, Motivation, and Weekly Reset.
5. **High** — Weekly Reset lacks a strong completion/closure moment that would make the ritual feel emotionally finished.
6. **Medium** — Agenda still exposes `Bronnen` and source toggles as a technical configuration pattern inside a family planning page.
7. **Medium** — Home icon-only header actions are compact but may not be immediately understandable to first-time family users.
8. **Medium** — Empty states vary in emotional depth; some feel warm, others still read as instructional placeholders.
9. **Medium** — Shopping support-list language makes the page feel partly like list administration rather than only a family shopping flow.
10. **Medium** — Button hierarchy differs between compact icon buttons, primary text buttons, row actions, and ritual actions without an obvious system rule.
11. **Medium** — Card density varies enough that moving from Motivation to Shopping feels like changing product modes more than changing tasks.
12. **Medium** — Agenda Month uses many day buttons and indicators, which is operationally valid but visually busier than other warm surfaces.
13. **Medium** — Product-level illustration style is not yet uniformly mature; some pages rely mainly on text, emoji, or placeholder-like symbols.
14. **Medium** — The journey from Motivation back into action is not explicitly reinforced; encouragement and execution remain adjacent but not deeply connected.
15. **Medium** — Settings remains visible in the core nav and carries a gear/admin tone that contrasts with the family-first shell.
16. **Low** — The product still uses some generic terms such as `Lists` in Home copy while the primary nav says `Shopping`.
17. **Low** — Weather-ready copy on Home is useful but feels like a disconnected future integration hint.
18. **Low** — Navigation ordering does not perfectly match the requested family journey sequence.
19. **Low** — Emoji rendering may vary by device, which can affect Agenda and family warmth consistency.
20. **Low** — Touch-friendly controls are generally present, but dense pages may require more vertical travel than a wall-mounted family board ideally should.

# Top 20 Improvements

| Priority | Improvement | Expected impact | Estimated complexity | Scope |
| --- | --- | --- | --- | --- |
| 1 | Give Weekly Reset a clear active/contextual navigation state | Reduces product-map confusion | Low | Design System |
| 2 | Tighten Shopping vertical rhythm and empty-state layout | Makes Shopping feel as polished as Tasks/Agenda | Medium | Product specific |
| 3 | Complete Dutch/English copy harmonization across shell and pages | Improves consumer polish and coherence | Medium | Design System |
| 4 | Define a product-wide action-placement rule | Makes actions predictable across pages | Medium | Design System |
| 5 | Add a Weekly Reset completion/closing moment | Makes the ritual emotionally memorable | Medium | Product specific |
| 6 | Reframe Agenda sources as family calendars/layers | Removes technical configuration tone | Low | Product specific |
| 7 | Add labels/tooltips or first-use affordances for icon-only Home actions | Improves discoverability | Low | Design System |
| 8 | Standardize empty-state emotional structure | Makes quiet states feel intentional | Medium | Design System |
| 9 | Clarify Shopping’s primary list versus supporting lists | Reduces admin/list-management feeling | Medium | Product specific |
| 10 | Standardize primary/secondary/tertiary button hierarchy | Reduces visual noise | Medium | Design System |
| 11 | Establish card-density tiers for dashboard, workspace, and ritual pages | Improves page rhythm | Medium | Design System |
| 12 | Add a prep-oriented layer to Agenda Week/List | Connects planning to family action | Medium | Product specific |
| 13 | Mature the illustration/icon asset system across all surfaces | Improves warmth and brand identity | Medium | Design System |
| 14 | Connect Motivation progress to Tasks/Weekly Reset outcomes | Makes encouragement and action feel integrated | High | Product specific |
| 15 | Soften Settings entry and naming | Avoids admin-software tone | Low | Design System |
| 16 | Normalize `Shopping` versus `Lists` terminology | Removes naming friction | Low | Product specific |
| 17 | Replace disconnected future-integration hints with calmer unavailable states | Improves finished-product feel | Low | Product specific |
| 18 | Reconsider nav order against real family journey testing | Improves natural flow | Low | Product specific |
| 19 | Provide accessible labels/legends for emoji-heavy indicators | Improves comprehension and accessibility | Medium | Design System |
| 20 | Add viewport-fit/density visual regression checks for major pages | Prevents coherence regressions | Medium | Design System |

# Recommendation

**Ready with Minor Polish**

FamilyBoard is ready for a small Friends & Family beta because it now has a coherent product story: Home orients the household, Motivation encourages the family, Agenda plans time, Tasks helps people act, Shopping captures shared needs, and Weekly Reset turns cleanup into a family ritual. The experience is warm, calm, touch-friendly, optimistic, and approachable far more often than it resembles admin software or enterprise productivity tools.

The recommendation is not “fully ready” because cross-product polish still matters. Shopping density, Weekly Reset completion, mixed language, action-placement consistency, technical Agenda source controls, and uneven empty-state richness are all visible at product level. These are polish and system-cohesion issues rather than blockers for a controlled family beta.

# Validation

## Preflight result

- `.github/copilot-instructions.md` and repository `AGENTS.md` were read before review work.
- Required command completed successfully:

```bash
export DOTNET_CLI_HOME=/tmp/dotnet
export PATH="$PATH:$HOME/.dotnet/tools"
dotnet --version
```

- Result: `10.0.301`.

## Application startup

- Vite application startup succeeded with:

```bash
npm install
npm run dev -- --host 127.0.0.1
```

- Served: `http://127.0.0.1:5173/`.
- Browser validation used Chromium with route-intercepted API-shaped responses for onboarding, family members, motivation, tasks, shopping/list data, workspace layout, and Weekly Reset.

## Browser validation summary

Validated major pages:

- Home
- Motivation
- Agenda
- Tasks
- Shopping
- Weekly Reset

Validated journey:

- Home → Motivation → Agenda → Tasks → Shopping → Weekly Reset.

Key browser measurements:

| Page | 1366×768 document / panel | 1920×1080 document / panel | Notes |
| --- | ---: | ---: | --- |
| Home | `770 px` / `708 px` | `1080 px` / `708 px` | Dashboard stayed effectively visible and cohesive. |
| Motivation | `768 px` / `427 px` | `1080 px` / `427 px` | Compact emotional dashboard. |
| Agenda | `894 px` / `832 px` | `1080 px` / `832 px` | Operational planning surface; acceptable scroll/density. |
| Tasks | `768 px` / `366 px` | `1080 px` / `366 px` | Compact empty-state execution workspace. |
| Shopping | `1362 px` / `1300 px` | `1362 px` / `1300 px` | Tallest workspace; density/rhythm polish needed. |
| Weekly Reset | `1393 px` / `1331 px` | `1407 px` / `1345 px` | Warm ritual, but long and needs stronger closure. |

## Viewports tested

- `1366×768`
- `1920×1080`

## git diff --check

- `git diff --check` passed with no whitespace errors.

## Binary artifact confirmation

- No binary files committed.
- No screenshots committed.
- Temporary screenshots removed: no screenshots were created or retained during this review pass.

# Modified Files

- `docs/reports/2026-06-27-familyboard-product-ux-review/familyboard-product-ux-review.md`

# Binary Artifact Check

- No binary files committed.
- No screenshots committed.
- Temporary screenshots removed.
- No PNG, JPG, JPEG, GIF, WEBP, or PDF files were added by this review.
