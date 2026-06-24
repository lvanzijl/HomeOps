# Tasks & Weekly Reset Post-Change Visual Validation

Date: 2026-06-24  
Branch: `work`  
Review type: visual validation only; no implementation changes.  
Screenshot note: screenshots were captured for this validation, then removed from the repository per the binary artifact policy.

## Executive Summary

The Tasks and Weekly Reset family-first pass largely achieved its intended UX goals. Tasks now reads less like a workspace/task-administration surface and more like a household coordination surface. The strongest improvement is the combination of `Today’s family help`, `Tasks for the family`, `Add family task`, `Plan the week`, `Open family reset`, `Whole family`, and `Anyone`; these labels are immediately warmer than the previous administrative wording.

Weekly Reset is easier to find than it was after the navigation cleanup because the Tasks page now has two visible contextual entry points: an inline `Plan the week (1)` action and an `Open family reset` action. The reset remains contextual rather than global, which preserves the navigation cleanup goal.

`Shopping` is a better beta-facing navigation label than `Shopping / Lists` because it is shorter, scans better on desktop and mobile, and aligns with the currently dominant list workflow. However, Home still says `Shopping lists` and shows a `Vacation Packing` list, so the product continues to imply that non-shopping family lists can exist.

Mobile navigation is cleaner than in the post-navigation-cleanup review, especially because `Shopping` is shorter and Settings collapses to a gear-only affordance at narrow width. The biggest new mobile concern is that the gear-only Settings control is visually compact but may be less self-explanatory for non-technical parents.

Overall beta readiness improved for this slice. The biggest remaining UX concern is that Tasks still structurally behaves like a task-management system: it exposes multiple lifecycle groups, action-heavy rows, and review/planning controls. The copy is warmer, but the interaction density still feels adult/administrative in places.

## Tasks Review

Captured screenshots reviewed before binary cleanup:

- `02-tasks-desktop.png`
- `08-tasks-mobile.png`
- `03-weekly-reset-entry-point.png`
- `09-weekly-reset-entry-mobile.png`

Findings:

- Tasks feels less administrative than before. `Today’s family help`, `Tasks for the family`, and `Start with what needs attention` successfully remove the prior workspace-suite tone.
- Tasks feels more family-oriented. `Whole family`, `Anyone`, `Add family task`, and `Bring back this week` are readable household phrases.
- The page still feels partly like a task-management system because it retains visible lifecycle sections: Overdue, Due Today, Upcoming, Still part of the plan, Completed Recently, and Someday.
- The new labels are mostly clearer for parents. `Plan the week (1)` is clearer than `Weekly Reset (1)` because it describes the job to be done.
- Some labels are now slightly vague: `Adjust` is warmer than `Edit`, but it is less precise; `Anyone` is friendlier than `Unassigned`, but it may be ambiguous about whether the task needs an owner.
- On mobile, row actions remain large and readable, but completed/reopen style actions can create tight horizontal layouts, especially `Bring back` and `Bring back this week`.

Answer to the core Tasks questions:

- Less administrative: **yes, materially improved**.
- More family-oriented: **yes**.
- Still task-management-like: **yes, structurally**.
- New labels clearer: **mostly yes**.
- Too vague: **some risk around `Adjust` and `Anyone`**.

## Weekly Reset Review

Captured screenshots reviewed before binary cleanup:

- `03-weekly-reset-entry-point.png`
- `04-weekly-reset-page.png`
- `09-weekly-reset-entry-mobile.png`

Findings:

- A parent can naturally find Weekly Reset from Tasks because `Plan the week (1)` appears in the main task action group and `Open family reset` sits beside it.
- The entry point is obvious on desktop and mobile. On mobile, `Plan the week (1)` gets its own full-width action row, which improves discoverability.
- The entry point is understandable. `Plan the week` describes the outcome better than `Weekly Reset` alone.
- Weekly Reset still feels contextual rather than hidden. It is not in global navigation, but it is visible within the surface where parents would expect task cleanup/planning.
- The inline reset panel is clear enough, but its action row is dense. `Keep for this week`, `Pick a helpful day`, `Save for later`, `Done`, and `Archive` are understandable but visually heavy.
- The full Weekly Reset page has warmer content labels, but the card action buttons render with plain/default button styling, making the page feel less polished than Tasks.

Assessment: **Weekly Reset discoverability is good enough for beta validation, but the full reset page still needs visual polish later.**

## Shopping Review

Captured screenshots reviewed before binary cleanup:

- `05-shopping-desktop.png`
- `10-shopping-mobile.png`
- `01-home-desktop.png`
- `06-home-mobile.png`

Findings:

- `Shopping` is clearer than `Shopping / Lists` in navigation. It is shorter, avoids a slash label, and reduces mobile wrapping pressure.
- The label fits the current primary functionality because the page title and main list are shopping-oriented.
- Users could reasonably expect non-shopping lists because Home still shows `Shopping lists` and includes `Vacation Packing`, and the Shopping page internal eyebrow still says `Lists`.
- This is acceptable for beta if shopping remains the dominant behavior, but the product should later decide whether this surface is truly `Shopping` or broader `Family lists`.

Assessment: **`Shopping` was the correct beta-facing label choice for now, with a known future naming risk.**

## Mobile Navigation Review

Captured screenshots reviewed before binary cleanup:

- `07-mobile-navigation.png`
- `06-home-mobile.png`
- `08-tasks-mobile.png`
- `10-shopping-mobile.png`
- `11-settings-narrow-layout.png`

Findings:

- Navigation is cleaner than before. The primary row now fits Home, Agenda, Tasks, Shopping, and Motivation on the tested 390px width.
- Wrapping improved for primary navigation. Settings wraps to a small second-row gear, but the daily family surfaces stay together.
- The Settings affordance is still present and tappable, but gear-only discoverability is weaker than labeled Settings. This is likely acceptable because Settings is intentionally secondary.
- Touch targets look comfortable enough: pills remain large enough to tap, and the gear control has visible padding.
- The narrow header descriptions still truncate, e.g. Tasks and Shopping descriptions are ellipsized. This is not harmful but still reveals that headers are doing more than mobile width can support.

Assessment: **mobile navigation improved, with Settings discoverability as the main tradeoff.**

## Home Review

Captured screenshots reviewed before binary cleanup:

- `01-home-desktop.png`
- `06-home-mobile.png`

Findings:

- Home remains the family anchor. It still brings together family members, today, quick capture, Agenda, Tasks, Motivation, and Shopping lists.
- Nothing became meaningfully harder to find after this cleanup. Tasks and Shopping are still visible top-level destinations, and Home summary cards still route to core surfaces.
- The overall experience is calmer than the pre-cleanup app because global navigation is focused and shorter.
- Home still uses `Shopping lists` and `Open lists`, which is slightly inconsistent with the new top-level `Shopping` label.
- The test screenshot environment exposed a very large central add affordance/avatar-area rendering. That appears unrelated to this slice but remains visually dominant and should be watched separately.

Assessment: **Home remains the correct anchor, but Shopping/List terminology is not fully harmonized across Home.**

## Father Review

For a father quickly trying to help the household, Tasks now communicates the daily triage job better. `Overdue`, `Due Today`, `Plan the week`, and `Open family reset` make the page useful. The warmer labels reduce the feeling that he is administering a system.

Remaining father concern: the page still has a lot of controls, and the difference between `Plan the week` and `Open family reset` may need a short beta observation to confirm whether parents understand one as inline review and the other as the fuller reset.

## Mother Review

For a mother looking for calm coordination, the language is notably warmer and less like project management. `Tasks for the family`, `Whole family`, and `Plan the week together` help the product feel shared rather than managerial.

Remaining mother concern: the full Weekly Reset page still feels visually plain compared with the warmer Tasks styling, especially the default-looking reset action buttons.

## Child Review

For an 8-year-old, the new task labels are easier than before. `Done`, `Anyone`, and `Whole family` are more understandable than administrative terms.

Remaining child concern: the Tasks page is still mostly an adult coordination surface. The number of sections and action buttons would likely feel overwhelming for a child. This is acceptable if children primarily use Family Member pages rather than global Tasks.

## UX Expert Review

The slice improved tone and information scent without changing IA. The previous post-navigation-cleanup report called out workspace-sequence headers, administrative Tasks tone, Weekly Reset discoverability, and mobile wrapping. This pass directly improves those areas.

Remaining UX debt is mostly hierarchy and visual consistency:

- Tasks copy is warmer, but the page still exposes many operational states.
- Weekly Reset is discoverable, but its full page has less visual refinement than Tasks.
- Shopping is cleaner in nav, but Home and Shopping internals still mix `Shopping` and `Lists` terminology.
- Mobile nav is tighter, but Settings gear-only discoverability is a deliberate compromise.

## Improvements Confirmed

Compared with `homeops-post-navigation-cleanup-visual-validation.md`:

- The prior `Daily family focus 2/5` workspace-sequence language is gone from page headers.
- Tasks no longer opens with `Household Tasks` and `Urgency-first ad-hoc tasks for the household`; it now leads with family-help language.
- Weekly Reset is more discoverible from Tasks through `Plan the week (1)` and `Open family reset`.
- `Shopping / Lists` is replaced by `Shopping` in top-level navigation.
- Mobile primary navigation wraps less at the tested narrow width.
- Settings remains secondary rather than a peer daily destination.

## Remaining Issues

- Tasks still has a task-management structure despite warmer copy.
- The inline Weekly Reset action area can become visually dense.
- The full Weekly Reset page uses plain/default-looking button styling and feels less polished than the Tasks page.
- Shopping/List terminology is not fully harmonized across Home and Shopping internals.
- Mobile headers still truncate descriptive copy.
- Gear-only Settings may be less obvious to some parents.

## New Issues

- `Adjust` may be warmer but less specific than `Edit`.
- `Anyone` may be warmer but less explicit than `Unassigned`.
- The pair `Plan the week` and `Open family reset` is discoverable, but users may need to learn why there are two reset-related entry points.
- On mobile, the Settings gear-only affordance is cleaner but potentially less self-explanatory.

## Beta Readiness Impact

This slice improves beta readiness. The core beta loop now reads more like family coordination: Home, Agenda, Tasks, Shopping, and Motivation. Tasks is no longer the obviously coldest surface, and Weekly Reset is discoverable enough to validate with beta parents without promoting it to global navigation.

Current readiness: **better for controlled beta/design-partner validation, still not polished enough for broad beta**.

Primary reason: the language and navigation are improved, but Tasks and Weekly Reset still need visual and hierarchy refinement to fully escape the feeling of an adult task-management tool.

## Recommended Next Steps

1. Harmonize Shopping/List terminology across Home and Shopping internals without changing functionality.
2. Polish Weekly Reset button/card styling so the page matches the warmth of Tasks.
3. Validate `Plan the week` versus `Open family reset` with parent users; if confusing, clarify the distinction visually or with microcopy.
4. Consider whether `Adjust` and `Anyone` are sufficiently clear after beta observation.
5. Continue mobile refinement by reducing header truncation and confirming gear-only Settings discoverability.

## Next Prompt Context

Post-change visual validation confirms the Tasks and Weekly Reset family-first pass improved tone, discoverability, Shopping nav clarity, and mobile navigation wrapping. Tasks now feels more family-first but still structurally task-management-like. Weekly Reset is discoverable enough from Tasks while remaining contextual, but the full reset page needs polish. `Shopping` is the right beta-facing nav label, though Home and Shopping internals still use broader list language. The next implementation area should be Shopping/List terminology harmonization or Weekly Reset visual polish, with no new features or workflow changes.
