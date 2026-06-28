# FamilyBoard Visual Regression Review

# Summary

- Baseline screenshot directory: `docs/reports/2026-06-27-familyboard-screenshot-review/screenshots/`
- New screenshots: captured for review, then removed from the repository changeset as temporary binary artifacts.
- Screenshots compared: 10 old screenshots against 10 freshly captured screenshots.
- Overall visual improvement score: **8.5 / 10**
- Ready for Friends & Family: **Yes**

This review used the latest discovered committed screenshot set under `docs/reports/`, reset the current app with the `visual-full` visual review fixture, captured a new 1920×1080 screenshot set, mapped both sets, and compared each old screenshot directly against its new counterpart.

# Screenshot Mapping

## Old mapping

| Expected page | Baseline filename | Visible page content | Archetype | Confidence |
|---|---|---|---|---|
| Home | `01-home.png` | Household overview with Agenda, Tasks, Shopping, and Motivation cards. | Daily family dashboard | High |
| Agenda Month | `02-agenda-month.png` | Agenda page with month grid and right-side event detail. | Calendar month overview | High |
| Agenda Week | `03-agenda-week.png` | Agenda page with seven day cards and weekly planning controls. | Weekly planning strip | High |
| Agenda List | `04-agenda-list.png` | Agenda page with dated event list grouped under upcoming section. | Upcoming agenda list | High |
| Tasks | `05-tasks.png` | Tasks page with today action list and repeated task rows. | Task execution board | High |
| Representative Task Dialog | `06-tasks-add-dialog.png` | Task page with blurred backdrop and add-task modal. | Creation dialog | High |
| Shopping | `07-shopping.png` | Shopping page with add item panel, active list, suggestions, and list management. | Shopping list workflow | High |
| Motivation | `08-motivation.png` | Motivation page with family goal, recognition, personal goals, and activity. | Family encouragement dashboard | High |
| Weekly Reset | `10-weekly-reset.png` | Weekly reset page with readiness hero, stats, and columns. | Weekly planning ritual | High |
| Settings | `09-settings.png` | Settings page with calendar backup/restore and household maintenance sections. | Administration settings | High |

## New mapping

| Expected page | New filename | Visible page content | Archetype | Confidence |
|---|---|---|---|---|
| Home | `01-home.png` | Household overview with Dutch labels, Agenda, Taken, Boodschappen, and Motivatie cards. | Daily family dashboard | High |
| Agenda Month | `02-agenda-month.png` | Agenda page with June 2026 month grid and event detail card. | Calendar month overview | High |
| Agenda Week | `03-agenda-week.png` | Agenda page with week strip and day cards for 22–28 Jun. | Weekly planning strip | High |
| Agenda List | `04-agenda-list.png` | Agenda page with upcoming list titled `Wat komt eraan?`. | Upcoming agenda list | High |
| Tasks | `05-tasks.png` | Tasks page with today list and compact action buttons. | Task execution board | High |
| Representative Task Dialog | `06-tasks-add-dialog.png` | Task add dialog titled `Voeg één helpend ding toe`. | Creation dialog | High |
| Shopping | `07-shopping.png` | Dutch shopping workflow with add item form, store grouping, suggestions, and management. | Shopping list workflow | High |
| Motivation | `08-motivation.png` | Motivation page with family path, recognitions, personal goals, and recent activity. | Family encouragement dashboard | High |
| Weekly Reset | `10-weekly-reset.png` | Weekly ritual page titled `Zijn we klaar voor volgende week?`. | Weekly planning ritual | High |
| Settings | `09-settings.png` | Settings page with Agenda backup/restore and household maintenance. | Administration settings | High |

# Page Comparisons

## Home

### Improved

- The new Home screenshot is substantially more Dutch-localized: `Today` becomes `Vandaag`, `Shopping lists` becomes `Boodschappen`, and `Tasks` becomes `Taken`.
- The content feels calmer because card titles, labels, and item metadata are shorter and more consistent.
- The Home dashboard now reads more like a finished FamilyBoard surface than a mixed-language prototype.

### Regressions

- No clear visual regression observed.

### Unchanged

- The four-card dashboard structure stayed the same and was already a good high-level household overview.
- The pastel domain bands and compact card layout remain strong.

### Overall verdict

Improved. Home now feels more coherent, local, and family-ready without changing its successful dashboard structure.

## Agenda Month

### Improved

- The legend and calendar metadata are cleaner and more consistently localized.
- The month grid appears slightly calmer, with less visual noise around event labels.
- The right detail card keeps a clear selected-day focus.

### Regressions

- The new month grid has fewer visible event chips than the baseline, so the page is calmer but slightly less information-rich at first glance.

### Unchanged

- The month/detail split remains the same and was already a strong calendar pattern.
- The rounded page frame and purple active mode treatment remain consistent.

### Overall verdict

Improved overall, with a minor tradeoff toward calmness over visible density.

## Agenda Week

### Improved

- The week view now includes a clearer action affordance near the week header.
- The weekly strip feels cleaner and less crowded.
- Event cards remain recognizable but are less visually noisy.

### Regressions

- Some day cards look sparse compared with the baseline, making the week feel a little emptier.

### Unchanged

- The seven-column weekly planning structure remains consistent and understandable.
- The highlighted selected day remains effective.

### Overall verdict

Improved. The page is calmer and easier to scan, though the sparse fixture makes it feel less full.

## Agenda List

### Improved

- The new title `Wat komt eraan?` gives the page a warmer, family-oriented purpose.
- List items are still grouped clearly and the softer cards preserve scanability.
- Dutch localization is stronger and more natural.

### Regressions

- No clear visual regression observed.

### Unchanged

- The list-card structure and source filter row remain stable and useful.
- Event rows continue to use the same pastel event language as Month and Week.

### Overall verdict

Improved. The page now feels more intentional and less generic.

## Tasks

### Improved

- The page benefits from Dutch localization and a more refined task-action vocabulary.
- The primary weekly reset action remains discoverable while the task list stays dominant.
- Row rhythm, colored assignment strips, and compact actions remain visually mature.

### Regressions

- The task list remains dense, and the repeated pill actions still create visual weight on the right side.

### Unchanged

- The task execution board structure is effectively unchanged and was already one of the more operationally clear pages.

### Overall verdict

Slightly improved. It is production-usable, though it remains one of the densest surfaces.

## Representative Task Dialog

### Improved

- This is one of the strongest improvements: the dialog moved from a small, generic modal to a more polished dialog-system treatment.
- The new title `Voeg één helpend ding toe` is warmer and more FamilyBoard-specific.
- The spacing, border radius, shadow, and backdrop treatment feel more deliberate and less prototype-like.
- Button hierarchy is softer and calmer.

### Regressions

- No clear visual regression observed.

### Unchanged

- The dialog still correctly focuses on adding a single task and keeps the background subdued.

### Overall verdict

Strongly improved. The dialog now feels like part of a coherent design system.

## Shopping

### Improved

- The page is more fully localized, with `Boodschappen`, `Voor winkel`, `Recent gekocht`, and management copy replacing mixed-language language.
- The shopping lifecycle layout remains calmer than early versions: add item, active list, suggestions, then management.
- Warm orange accents fit the shopping domain well.

### Regressions

- The page still feels vertically long and management content is visible below the primary shopping workflow, which can add some visual weight.

### Unchanged

- The main shopping workflow and suggestion patterns remain stable and were already strong.

### Overall verdict

Improved. The page is ready for household use, with only minor density concerns.

## Motivation

### Improved

- Dutch localization is more complete and makes the page feel less prototype-like.
- The family goal, recognition, personal goals, and activity areas retain a consistent encouragement language.
- The warm yellow/orange domain styling continues to support the emotional tone.

### Regressions

- The page still has many simultaneous modules, so it remains visually dense.

### Unchanged

- The dashboard structure and family-progress metaphor remain the same and were already emotionally aligned with FamilyBoard.

### Overall verdict

Improved in polish and localization, but still the page most likely to need post-MVP simplification.

## Weekly Reset

### Improved

- The new stats changed but the overall weekly ritual composition remains strong.
- Dutch copy is clearer and the page feels more like a family ritual than a task-management utility.
- The hero, stats, and review columns continue to provide a clear planning flow.

### Regressions

- No clear visual regression observed.

### Unchanged

- The page structure is largely unchanged and was already one of the more product-defining experiences.

### Overall verdict

Improved. Weekly Reset remains a strong Friends & Family differentiator.

## Settings

### Improved

- The page is more consistently localized, including `Instellingen`, `Agenda`, and maintenance copy.
- The administration surface remains appropriately plain and secondary compared with daily family pages.

### Regressions

- Settings still feels less visually warm than the main product, although that is acceptable for an admin page.

### Unchanged

- Calendar backup/restore and household maintenance sections remain clearly separated.

### Overall verdict

Slightly improved. It is functional, clear, and appropriately subdued.

# Cross-Product Improvements

- Dutch localization is the biggest objective improvement across the product.
- The dialog design system is visibly more mature, especially in the task add dialog.
- The product feels calmer because copy is shorter, labels are softer, and high-density areas are more controlled.
- Domain color consistency remains strong across Agenda, Tasks, Shopping, Motivation, Weekly Reset, and Settings.
- The product now feels more like one coherent FamilyBoard experience instead of separate MVP surfaces.

# Cross-Product Regressions

- Some pages show less visible data than the baseline, especially Agenda Month and Week, which can make the product feel slightly emptier.
- Tasks and Motivation remain dense compared with the calmer Home and Agenda surfaces.
- Settings remains visually plain, though this is acceptable for an administration area.

# Final Punch List

## Must fix before Friends & Family

None.

## Should fix after Friends & Family

| Page/system | Issue | Expected impact | Estimated complexity |
|---|---|---|---|
| Tasks | Repeated row-level action pills create right-side visual weight. | Faster scanning and calmer task execution. | Medium |
| Motivation | Many modules compete on a single dashboard. | Better emotional focus and less overwhelm. | Medium |
| Agenda Week | Sparse fixture/day cards can make the week feel slightly empty. | Stronger perceived usefulness during quiet weeks. | Small |

## Post-MVP / Design System

| Page/system | Issue | Expected impact | Estimated complexity |
|---|---|---|---|
| Admin/settings surfaces | Settings is functional but visually plainer than the product surfaces. | More cohesive end-to-end product feel. | Small |
| Cross-product empty/quiet states | Some calmer pages need richer quiet-state guidance. | Better first-week and low-data household experience. | Medium |
| Dialog system | Continue applying the improved dialog treatment to every management modal. | Stronger consistency and polish. | Medium |

# Recommendation

**Ready for Friends & Family**

The current screenshots objectively improve on the baseline. The biggest visible advances are complete Dutch localization, calmer copy, a more mature dialog treatment, and stronger cross-page cohesion. Remaining issues are polish-level density concerns, not blockers.

# Validation

- Preflight result: `.github/copilot-instructions.md` was read; `DOTNET_CLI_HOME=/tmp/dotnet`, `PATH="$PATH:$HOME/.dotnet/tools"`, and `dotnet --version` returned `10.0.301`.
- Baseline screenshot directory: `docs/reports/2026-06-27-familyboard-screenshot-review/screenshots/`.
- Baseline completeness: 10 expected screenshots found and mapped.
- New screenshots: captured for review, then removed from the repository changeset as temporary binary artifacts.
- New screenshot completeness: 10 expected screenshots captured and mapped.
- Screenshot mapping: all baseline and new screenshots mapped with high confidence.
- Application startup: API started on `http://localhost:5152`; Vite started on `http://127.0.0.1:5173/`.
- Browser validation summary: Playwright opened the running app at 1920×1080, reset `visual-full`, navigated the app, and captured the fresh screenshot set without reusing old screenshots.
- `git diff --check`: passed.
- Binary artifact confirmation: generated screenshot binaries were removed from the repository changeset after the review; the report is the retained artifact.

# Modified Files

- `docs/reports/2026-06-28-familyboard-visual-regression/familyboard-visual-regression.md`
- No screenshot binaries are retained in the repository changeset.
