# Executive Summary

- Overall Shopping quality: **8/10**.
- Overall FamilyBoard quality: **8/10**.
- Ready for beta: **Yes**.

Shopping now succeeds as an operational FamilyBoard workspace for the core question: **"What do we need to buy, and where?"** The page strongly prioritizes immediate capture, store-first execution, and practical item lifecycle handling. It should not be judged as a dashboard; as a working shopping surface, it is clear, calm, and usable.

The remaining issues are polish and workflow-friction issues rather than core-purpose failures. The biggest risks are hidden store editing behind per-item details, tall expanded secondary-list states, and lifecycle controls that are discoverable but not particularly expressive for a family in a shop.

# Workflow Assessment

## Quick Add

Quick Add is appropriately prominent and appears directly after the hero. Browser validation measured the Quick Add panel at **122.77 px** high at both `1366×768` and `1920×1080`, which is compact enough to preserve the store-shopping path below it. The input accepted focus, submitted a new item, observed the expected add request, and rendered the newly added item in browser validation.

Strengths:
- The prompt answers the correct household question: "Wat moeten we kopen?"
- The compact panel supports fast capture without acting like a generic form-heavy list manager.
- Placement near the top matches the "think of something, add it immediately" habit.

Weaknesses:
- Store assignment is not part of the primary add moment, so users may add first and classify later.
- The primary action is clear, but the page does not visibly explain whether suggestions or learned stores exist.
- The input depends on a single blank text field; repeated rapid entry is possible, but not visibly optimized as a batch capture pattern.

## Shopping by store

Shopping by store is now the dominant organization model. Store labels validated in browser were **Albert Heijn**, **Etos**, **Market**, and **Zonder winkel** at both target viewports. Store counts updated during toggle/remove/undo flows, which supports trust while shopping.

Strengths:
- Store cards answer "where?" immediately.
- Counts are visible and update after lifecycle actions.
- Store cards appear immediately after Quick Add in the first viewport path.
- Overflow expansion prevents dense stores from overwhelming the page by default.

Weaknesses:
- The "Zonder winkel" group remains operationally weaker because uncategorized items require per-item editing.
- Editing a store is hidden behind each row's "Winkel" details control, which can slow reclassification.
- Store counts use the word "open" even in contexts where completed/deleted lifecycle sections can make the meaning less obvious.

## Completing shopping

Completion behaviour is functionally strong. Browser validation confirmed toggle, undo, remove, and remove-undo requests and visible movement between active, completed, and removed states.

Strengths:
- Checkbox-first item rows are familiar and fast.
- Undo and restore paths exist, reducing fear of accidental taps.
- Completed and deleted sections are available without dominating the main path.

Weaknesses:
- Lifecycle sections are collapsed, which is good for density but can hide recovery affordances from less technical family members.
- The remove label "Weg" is concise but potentially too casual/ambiguous for a destructive action.
- Completion does not provide a clear "done shopping" end-state or lightweight sense that the trip is complete.

## Other shopping lists

Other lists are correctly secondary. They remain accessible for packing/projects/temporary lists without competing with the main Shopping list. Browser validation expanded an other list and added an item successfully.

Strengths:
- Other lists are available but do not distract from the primary grocery flow.
- Collapsed secondary cards reduce page noise.
- The section copy explains that the main shopping list remains leading.

Weaknesses:
- Expanded other lists can become tall and compete with the main workspace.
- Other-list actions repeat much of the primary list machinery, which can feel heavier than a support-list area should.
- The visual distinction between a grocery operational list and a temporary support list could be stronger.

# UX Scorecard

| Area | Score | Strengths | Weaknesses |
| --- | ---: | --- | --- |
| Quick Add | 8/10 | Prominent, compact, validated focus/add/render flow, top placement | No visible store-at-add affordance; no batch-entry hint |
| Store organisation | 8/10 | Store-first cards, counts, overflow expansion, clear grouping | Uncategorized items remain weaker; store editing is tucked away |
| Card design | 8/10 | Calm hierarchy, readable headers, count badges, touch-friendly rows | Expanded states can get tall; row action labels could be clearer |
| Workflow | 8/10 | Supports think-add-shop-tick-undo-remove-restoration | No explicit trip completion moment; lifecycle affordances are secondary |
| FamilyBoard identity | 8/10 | Warm Dutch copy, family illustration, calm layout, consistent card language | Illustration is CSS-only and less refined than a mature asset system; some labels feel utilitarian |

# Remaining UX Issues

1. **High**: Store assignment is not prominent during Quick Add, so "where?" may be delayed until after capture.
2. **High**: Uncategorized "Zonder winkel" items can accumulate and reduce the store-first value.
3. **High**: Expanded Other Lists can dominate vertical space and distract from grocery execution.
4. **Medium**: Store editing is hidden inside per-item details, adding taps during real shopping.
5. **Medium**: The destructive remove button label "Weg" may be too terse for family confidence.
6. **Medium**: Completion has no clear "shopping finished" summary or all-done state.
7. **Medium**: Lifecycle sections are discoverable but not emotionally reassuring; accidental removal recovery may be missed.
8. **Medium**: The page still scrolls at both target viewports with the validation dataset, so not all operational content is simultaneously visible.
9. **Medium**: Store-card overflow requires expansion to see all items at busy stores, which can be a tradeoff during an aisle-by-aisle shop.
10. **Low**: Recently Added is useful but may become redundant once store cards are trusted.
11. **Low**: Counts say "open" consistently, but the term may be less natural than a grocery-specific label like "nog te kopen".
12. **Low**: CSS-only illustration supports warmth but is not as polished as the broader FamilyBoard visual language should eventually be.
13. **Low**: Other-list section copy is helpful, but repeated management controls can make support lists feel heavier than necessary.
14. **Low**: The Quick Add placeholder uses one example only; broader examples could better teach flexible entry.

# Top 10 Improvements

| Priority | Improvement | Expected impact | Estimated complexity | Scope |
| --- | --- | --- | --- | --- |
| 1 | Add an optional inline store selector or suggested store confirmation in Quick Add | Reduces uncategorized items and strengthens "what and where" | Medium | Shopping specific |
| 2 | Add a lightweight "needs store" treatment for `Zonder winkel` | Keeps store-first organization trustworthy | Low | Shopping specific |
| 3 | Rename destructive/removal action from "Weg" to clearer family-safe copy | Reduces accidental or uncertain destructive actions | Low | Design System |
| 4 | Add an all-done/empty active-list completion state after all items are checked | Makes finishing shopping feel complete | Low | Shopping specific |
| 5 | Improve expanded Other Lists density | Prevents support content from overtaking the workspace | Medium | Shopping specific |
| 6 | Surface restore/undo affordance more clearly after remove/check actions | Builds confidence for shared family use | Medium | Shopping specific |
| 7 | Refine store-card overflow behaviour for busy stores | Reduces expansion friction during real trips | Medium | Shopping specific |
| 8 | Align action buttons and detail summaries with Home/Motivation/Tasks/Agenda button language | Improves cross-workspace consistency | Medium | Design System |
| 9 | Replace CSS-only Shopping illustration with production FamilyBoard asset | Improves warmth and brand consistency | Medium | Design System |
| 10 | Tune Recently Added visual weight based on real use | Prevents reassurance content from becoming noise | Low | Shopping specific |

# Recommendation

**Ready with Minor Polish**

Shopping is operationally ready for beta because the main workflow is validated: users can add items quickly, shop by store, check items off, undo mistakes, remove items, restore removed items, and use other lists without losing the grocery-first focus. The page answers **"What do we need to buy, and where?"** clearly enough for MVP beta use.

It is not a perfect final UX. The next polish pass should focus on store assignment at capture time, clearer destructive-action language, and secondary-content density. These are not blockers for beta, but they are the right next improvements before broader family usage.

# Validation

## Preflight result

- `.github/copilot-instructions.md` and `AGENTS.md` were read before review work.
- Required command completed successfully:

```bash
export DOTNET_CLI_HOME=/tmp/dotnet
export PATH="$PATH:$HOME/.dotnet/tools"
dotnet --version
```

- Result: `10.0.301`.

## Browser validation summary

Browser validation was performed against the Vite app at `http://127.0.0.1:5173/` using Playwright/Chromium and route-intercepted API-shaped list responses, consistent with the existing Shopping browser validation approach in this repository.

Validated behaviours:
- Quick Add focus, add request, and new item visibility passed at both target viewports.
- Store cards rendered with `Albert Heijn`, `Etos`, `Market`, and `Zonder winkel` at both target viewports.
- Store counts updated during completion, undo, remove, and restore flows.
- Store-card overflow expansion/collapse was inspected.
- Other Lists expanded and accepted a new item.
- Lifecycle sections supported completed and deleted item recovery flows.
- Recently Added was present and measured.
- No Smart Suggestions, `Bijna op`, rewards, points, or gamification concepts were detected in the validation pass.

## Viewports tested

| Viewport | Result | Key measurements |
| --- | --- | --- |
| `1366×768` | Pass | Document `1566 px`; Quick Add `122.77 px`; store workspace `515.70 px`; Recently Added `140.17 px`; Other Lists collapsed `178.50 px`; lifecycle collapsed `178.50 px`; scrolling required |
| `1920×1080` | Pass | Document `1566 px`; Quick Add `122.77 px`; store workspace `515.70 px`; Recently Added `140.17 px`; Other Lists collapsed `178.50 px`; lifecycle collapsed `178.50 px`; scrolling required |

## Application startup

- Vite application startup succeeded with `npm run dev -- --host 127.0.0.1` and served `http://127.0.0.1:5173/`.

## git diff --check

- `git diff --check` passed with no whitespace errors.

## Binary artifact confirmation

- No binary files committed.
- No screenshots committed.
- Temporary screenshots removed: no temporary screenshots were created during this review pass.

# Modified Files

- `docs/reports/2026-06-27-shopping-ux-review/shopping-ux-review.md`

# Binary Artifact Check

- No binary files committed.
- No screenshots committed.
- Temporary screenshots removed.
- No PNG, JPG, JPEG, GIF, WEBP, or PDF files were added by this review.
