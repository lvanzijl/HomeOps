# FamilyBoard Visual Defect Review

## Summary

- Preflight result: `.github/copilot-instructions.md` was read before review work; `DOTNET_CLI_HOME=/tmp/dotnet`, `PATH="$PATH:$HOME/.dotnet/tools"`, and `dotnet --version` returned `10.0.301`.
- Baseline discovery result: the latest committed report under `docs/reports/` containing a `screenshots/` directory is `docs/reports/2026-06-27-familyboard-screenshot-review/`.
- Baseline screenshot set: 10 PNG files found and mapped.
- Fresh screenshot set: 10 screenshots were generated at 1920×1080 into `/tmp/familyboard-visual-defect-screenshots/` and compared against the baseline set.
- Review constraint caveat: Docker is not installed in this environment, so the PostgreSQL-backed visual fixture reset could not be executed. The API startup attempted to connect to PostgreSQL on `localhost:5432` and failed. The fresh screenshots therefore represent the current frontend running with unavailable backend data rather than the exact committed `visual-full` / `visual-weekly-reset` fixture state.
- Cleanup result: the generated screenshot directory and temporary capture scripts were removed before completion; no newly generated image artifacts are retained in the repository.

## Baseline screenshot directory

`docs/reports/2026-06-27-familyboard-screenshot-review/screenshots/`

## New screenshot directory

Temporary capture directory used during review: `/tmp/familyboard-visual-defect-screenshots/`

The temporary directory was deleted after comparison and is not retained in the repository.

## Screenshot mapping

| Page | Baseline screenshot | Baseline visible content | Current screenshot | Current visible content | Page archetype | Mapping |
|---|---|---|---|---|---|---|
| Home | `docs/reports/2026-06-27-familyboard-screenshot-review/screenshots/01-home.png` | Dashboard cards for Agenda, Tasks, Shopping, and Motivation with populated household data. | `/tmp/familyboard-visual-defect-screenshots/01-home.png` | Dashboard cards for Agenda, Taken, Boodschappen, and Motivatie with unavailable-data messages. | Daily family dashboard | Verified |
| Agenda — Month | `docs/reports/2026-06-27-familyboard-screenshot-review/screenshots/02-agenda-month.png` | Agenda month grid with event markers and a selected-day detail panel. | `/tmp/familyboard-visual-defect-screenshots/02-agenda-month.png` | Agenda month grid with sparse markers and selected-day detail panel. | Calendar month overview | Verified |
| Agenda — Week | `docs/reports/2026-06-27-familyboard-screenshot-review/screenshots/03-agenda-week.png` | Seven-day week planning grid with multiple event cards. | `/tmp/familyboard-visual-defect-screenshots/03-agenda-week.png` | Seven-day week planning grid with one visible event cluster. | Weekly planning strip | Verified |
| Agenda — List | `docs/reports/2026-06-27-familyboard-screenshot-review/screenshots/04-agenda-list.png` | Upcoming event list with multiple rows. | `/tmp/familyboard-visual-defect-screenshots/04-agenda-list.png` | Upcoming event list with Dutch rows. | Upcoming agenda list | Verified |
| Tasks | `docs/reports/2026-06-27-familyboard-screenshot-review/screenshots/05-tasks.png` | Full task execution board with multiple task cards and row actions. | `/tmp/familyboard-visual-defect-screenshots/05-tasks.png` | Compact task page with backend-unavailable copy and three visible secondary actions. | Task execution board | Verified |
| Add Task dialog | `docs/reports/2026-06-27-familyboard-screenshot-review/screenshots/06-tasks-add-dialog.png` | Add-task dialog over blurred task board. | `/tmp/familyboard-visual-defect-screenshots/06-tasks-add-dialog.png` | Add-task dialog over blurred compact task page. | Representative creation dialog | Verified |
| Shopping | `docs/reports/2026-06-27-familyboard-screenshot-review/screenshots/07-shopping.png` | Shopping workflow with active list, suggestions, and list management. | `/tmp/familyboard-visual-defect-screenshots/07-shopping.png` | Shopping workflow with unavailable active list and no active list rows. | Shopping list workflow | Verified |
| Motivation | `docs/reports/2026-06-27-familyboard-screenshot-review/screenshots/08-motivation.png` | Motivation dashboard with family goal, recognition, personal goals, and stats. | `/tmp/familyboard-visual-defect-screenshots/08-motivation.png` | Motivation dashboard with unavailable goal/recognition areas and zeroed stats. | Family encouragement dashboard | Verified |
| Settings | `docs/reports/2026-06-27-familyboard-screenshot-review/screenshots/09-settings.png` | Settings page with calendar backup/restore and placeholder block. | `/tmp/familyboard-visual-defect-screenshots/09-settings.png` | Settings page with Agenda backup/restore flow and warning panel. | Administration settings | Verified |
| Weekly Reset | `docs/reports/2026-06-27-familyboard-screenshot-review/screenshots/10-weekly-reset.png` | Weekly reset ritual with hero, stats, and planning columns. | `/tmp/familyboard-visual-defect-screenshots/10-weekly-reset.png` | Weekly reset panel with only unavailable-data copy visible. | Weekly planning ritual | Verified |

## Remaining issues by page

### Home

#### Remaining Issues

**Issue**

The current Home first viewport shows four cards, and all four cards expose unavailable-data messaging instead of the populated household overview visible in the baseline.

**Evidence**

- Baseline screenshot: `docs/reports/2026-06-27-familyboard-screenshot-review/screenshots/01-home.png`.
- Current screenshot: `/tmp/familyboard-visual-defect-screenshots/01-home.png`.
- Visible difference: the baseline first viewport contains populated Agenda, Tasks, Shopping, and Motivation cards; the current first viewport contains the same four card positions but replaces the visible household content with unavailable-data text in every card.

**Severity**

High — if this state appears in a normal review environment, the primary landing page stops communicating the household's day.

**Why it matters**

Home is the product's first impression. Four unavailable cards in the first viewport make the board look empty or disconnected before users reach any specific surface.

### Agenda — Month

#### Remaining Issues

**Issue**

The current month view appears materially less populated than the baseline month view.

**Evidence**

- Baseline screenshot: `docs/reports/2026-06-27-familyboard-screenshot-review/screenshots/02-agenda-month.png`.
- Current screenshot: `/tmp/familyboard-visual-defect-screenshots/02-agenda-month.png`.
- Visible difference: the baseline month grid shows multiple visible event markers across the month and a selected-day detail panel; the current month grid preserves the same page structure but shows fewer visible event markers and a quieter selected-day panel.

**Severity**

Medium — the page remains recognizable, but the first viewport communicates less calendar activity than the baseline.

**Why it matters**

Agenda depends on immediate schedule legibility. A sparse month view can make the product feel less useful during a quick family scan.

### Agenda — Week

#### Remaining Issues

**Issue**

The current week view has substantially fewer visible event cards than the baseline week view.

**Evidence**

- Baseline screenshot: `docs/reports/2026-06-27-familyboard-screenshot-review/screenshots/03-agenda-week.png`.
- Current screenshot: `/tmp/familyboard-visual-defect-screenshots/03-agenda-week.png`.
- Visible difference: the baseline week grid shows seven day columns with several populated cards; the current week grid keeps the same seven-column structure but most columns are visually empty, with one clustered event area.

**Severity**

Medium — the layout is intact, but the visible week composition looks underfilled compared with the baseline.

**Why it matters**

The week page is a planning surface. Large empty columns reduce at-a-glance confidence that the family week has been fully loaded.

### Agenda — List

#### Remaining Issues

**No remaining issues identified.**

### Tasks

#### Remaining Issues

**Issue**

The current Tasks page loses the baseline task-card list and shows backend-unavailable messaging in the primary content area.

**Evidence**

- Baseline screenshot: `docs/reports/2026-06-27-familyboard-screenshot-review/screenshots/05-tasks.png`.
- Current screenshot: `/tmp/familyboard-visual-defect-screenshots/05-tasks.png`.
- Visible difference: the baseline first viewport shows five large task cards with repeated row-level action buttons; the current first viewport shows one status panel, unavailable-data text, and three visible secondary actions.

**Severity**

High — if seen by users, the task execution surface no longer presents actionable household tasks.

**Why it matters**

Tasks is an operational surface. The first viewport must show what can be done now; an unavailable primary state blocks that purpose visually.

### Add Task dialog

#### Remaining Issues

**No remaining issues identified.**

### Shopping

#### Remaining Issues

**Issue**

The current Shopping page shows the primary shopping workflow without the active list rows visible in the baseline.

**Evidence**

- Baseline screenshot: `docs/reports/2026-06-27-familyboard-screenshot-review/screenshots/07-shopping.png`.
- Current screenshot: `/tmp/familyboard-visual-defect-screenshots/07-shopping.png`.
- Visible difference: the baseline first viewport includes active shopping rows and suggestion content; the current first viewport keeps the add-item area and list sections but shows unavailable/no-active-list messaging where rows previously appeared.

**Severity**

High — the page remains visually polished, but the core shopping list content is missing from the reviewed current state.

**Why it matters**

Shopping is useful only if the visible list is immediately available. A missing active list makes the surface look non-operational.

### Motivation

#### Remaining Issues

**Issue**

The current Motivation page presents unavailable and zero-state content across the main dashboard modules.

**Evidence**

- Baseline screenshot: `docs/reports/2026-06-27-familyboard-screenshot-review/screenshots/08-motivation.png`.
- Current screenshot: `/tmp/familyboard-visual-defect-screenshots/08-motivation.png`.
- Visible difference: the baseline shows a visible family goal, recognition content, personal goals, and progress stats; the current screenshot keeps the same dashboard card layout but replaces goal and recognition content with unavailable messaging and shows zeroed stats.

**Severity**

High — the emotional dashboard loses its visible progress and encouragement content in the current capture.

**Why it matters**

Motivation relies on visible progress and recognition. Unavailable or zeroed modules make the surface feel inert rather than encouraging.

### Settings

#### Remaining Issues

**No remaining issues identified.**

### Weekly Reset

#### Remaining Issues

**Issue**

The current Weekly Reset screenshot does not show the baseline ritual content in the first viewport.

**Evidence**

- Baseline screenshot: `docs/reports/2026-06-27-familyboard-screenshot-review/screenshots/10-weekly-reset.png`.
- Current screenshot: `/tmp/familyboard-visual-defect-screenshots/10-weekly-reset.png`.
- Visible difference: the baseline first viewport shows the weekly-reset hero, three stat cards, a start section, and the top of planning columns; the current first viewport shows a mostly empty panel with unavailable-data copy and none of the baseline ritual modules.

**Severity**

Critical — if this state appears outside the constrained capture environment, the weekly ritual surface is effectively unavailable.

**Why it matters**

Weekly Reset is a product-defining flow. The first viewport must communicate readiness and next actions; the current capture does not show those elements.

## Cross-product remaining issues

### Issue

Several current screenshots show backend-unavailable, empty, or zeroed states where the baseline shows populated family data.

### Evidence

- Baseline screenshots: `01-home.png`, `05-tasks.png`, `07-shopping.png`, `08-motivation.png`, and `10-weekly-reset.png` under `docs/reports/2026-06-27-familyboard-screenshot-review/screenshots/`.
- Current screenshots: matching filenames under `/tmp/familyboard-visual-defect-screenshots/` during review.
- Visible difference: Home has 4 unavailable cards; Tasks drops from 5 visible task cards to an unavailable panel; Shopping loses active rows; Motivation shows unavailable/zero modules; Weekly Reset loses the ritual modules entirely.

### Severity

Critical — this is cross-surface and affects the main product workflows if reproducible in a normal runtime.

### Why it matters

The product can look visually finished only when its core pages reliably load representative household content or polished, intentional empty states. Backend-unavailable panels across multiple surfaces create a disconnected product impression.

## Prioritized punch list

## Must fix before Friends & Family

| Page/system | Issue | Evidence reference | Impact | Estimated complexity |
|---|---|---|---|---|
| Runtime / fixture-backed product state | Confirm that the Friends & Family runtime cannot show the backend-unavailable state captured in Home, Tasks, Shopping, Motivation, and Weekly Reset. | `01-home.png`, `05-tasks.png`, `07-shopping.png`, `08-motivation.png`, `10-weekly-reset.png` old/new comparisons. | Prevents the product from opening into unavailable core surfaces. | Medium |
| Weekly Reset | Ensure Weekly Reset loads ritual content or an intentional recovery state instead of the sparse unavailable panel seen in the current capture. | `10-weekly-reset.png` old/new comparison. | Restores a product-defining flow. | Medium |

## Should fix after Friends & Family

| Page/system | Issue | Evidence reference | Impact | Estimated complexity |
|---|---|---|---|---|
| Agenda Week | Quiet week columns appear underfilled compared with the baseline. | `03-agenda-week.png` old/new comparison. | Improves perceived completeness during sparse weeks. | Small |
| Agenda Month | Month view has fewer visible activity markers than the baseline. | `02-agenda-month.png` old/new comparison. | Improves at-a-glance calendar usefulness. | Small |

## Post-MVP

| Page/system | Issue | Evidence reference | Impact | Estimated complexity |
|---|---|---|---|---|
| Cross-product recovery states | Standardize visually intentional unavailable/offline states across dashboard cards and full-page workflows. | Cross-product old/new comparisons listed above. | Makes degraded runtime states feel deliberate rather than broken. | Medium |

## Recommendation

**Needs another polish iteration**

This recommendation is based only on the remaining issues visible in the old/new comparisons. The strongest blocker is not ordinary cosmetic polish; it is that the current capture shows multiple core surfaces in unavailable or empty states compared with the populated baseline. Because the environment could not run the PostgreSQL fixture reset, this should be treated as a visual-defect review finding that requires runtime verification before Friends & Family rather than as proof of a code regression.

## Validation

- Preflight command passed: `dotnet --version` returned `10.0.301` after setting `DOTNET_CLI_HOME=/tmp/dotnet` and appending `$HOME/.dotnet/tools` to `PATH`.
- `.github/copilot-instructions.md` was read before implementation work.
- Baseline directory verified: `docs/reports/2026-06-27-familyboard-screenshot-review/screenshots/`.
- Baseline screenshot count verified: 10 PNG files.
- Fresh screenshot count verified: 10 PNG files generated at 1920×1080.
- Screenshot mapping verified by filename, visible content, and page archetype.
- API/database limitation observed: `docker` was not available, and API startup failed while connecting to PostgreSQL at `localhost:5432`.
- Temporary screenshots were deleted after comparison.
- Temporary capture scripts were deleted after comparison.
- `git diff --check` passed.
- Binary artifact scan confirmed no newly generated image or PDF files remain in the repository.

## Modified files

- `docs/reports/2026-06-28-familyboard-visual-defect-review/familyboard-visual-defect-review.md`
