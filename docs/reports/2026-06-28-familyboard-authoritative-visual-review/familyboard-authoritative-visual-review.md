# FamilyBoard Authoritative Populated Visual Review

## Summary

VisualReview runtime was used for this first authoritative populated visual UX review. `visual-full` loaded successfully. Browser review used official populated fixture data. Every required page was opened and reviewed at 1920×1080. Every required dialog or dialog-equivalent user-facing panel was opened where the current UI exposed it; the Settings Restore action could not open because it is visibly disabled until a backup file is selected, so the disabled restore surface was reviewed and documented. No production code was modified. No generated screenshots remain in the repository.

Recommendation: **Ready after small visual fixes**.

## Preflight

Read before review:

- `.github/copilot-instructions.md`
- `AGENTS.md`

Command result:

```bash
export DOTNET_CLI_HOME=/tmp/dotnet
export PATH="$PATH:$HOME/.dotnet/tools"
dotnet --version
# 10.0.301
```

## VisualReview runtime validation

VisualReview was started with the official runtime, not Development, Testing, route interception, or ad-hoc mocked responses:

```bash
ASPNETCORE_ENVIRONMENT=VisualReview \
  dotnet run --project src/HomeOps.Api/HomeOps.Api.csproj \
  --no-launch-profile \
  --urls 'http://127.0.0.1:5108;http://127.0.0.1:5152'
```

Validation:

- `GET /health`: `200 OK`, `{"status":"Healthy"}`.
- `GET /api/visual-review-fixtures/scenarios`: returned `visual-full`, `visual-mixed`, `visual-empty`, `visual-child-young`, `visual-child-older`, `visual-weekly-reset`, and `visual-shopping-lifecycle`.

## Fixture validation

Reset command:

```bash
curl -sS -X POST http://127.0.0.1:5108/api/visual-review-fixtures/visual-full/reset
```

Result:

```json
{"scenarioName":"visual-full","anchorUtc":"2026-06-21T09:00:00+00:00","familyMembers":4,"tasks":10,"lists":2,"listItems":6,"familyGoals":1,"individualGoals":2,"helpfulMoments":5,"events":2}
```

Representative fixture evidence before visual judgment:

- Home: Agenda preview showed populated events; Tasks preview showed populated tasks; Shopping preview showed populated shopping items; Motivation preview showed populated motivation data.
- Agenda: Month, Week, and List were populated.
- Tasks: Today group was visible with six tasks.
- Shopping: Store groups were populated for Market and Supermarket.
- Motivation: Family goal, appreciation, celebrations, and statistics were populated.

## Screenshot inventory

Screenshots were captured outside the repository under `/tmp/fb-review` and `/tmp/fb-dialogs`, reviewed, and deleted during cleanup.

| Screenshot reference | Surface |
|---|---|
| `01-home.png` | Home |
| `02-agenda-month.png` | Agenda Month |
| `agenda-week.png` | Agenda Week |
| `agenda-lijst.png` | Agenda List |
| `05-tasks.png` | Tasks |
| `06-shopping.png` | Shopping |
| `07-motivation.png` | Motivation |
| `weekly-reset.png` | Weekly Reset |
| `08-settings.png` | Settings |
| `add-task.png` | Add Task |
| `task-more-menu` | Edit Task entry surface; edit dialog was not exposed from current visible menu state |
| `add-event.png` | Add Event |
| `edit-event.png` | Edit Event |
| `shopping-quick-add.png` | Shopping Quick Add |
| `add-family-goal.png` | Add Family Goal / personal goal panel exposed by current Doel toevoegen action |
| `add-appreciation.png` | Add Appreciation |
| `add-family-member.png` | Add Family Member |
| `avatar-editor.png` | Avatar Editor |
| `weekly-reset.png` | Weekly Reset confirmation/action surface |
| `settings-backup.png` | Settings Backup result surface |
| `08-settings.png` | Settings Restore disabled state; restore dialog could not open because button was disabled without a selected file |

## Coverage table

| Surface | Opened | Screenshot reviewed |
|----------|:------:|:-------------------:|
| Home | Yes | Yes |
| Agenda Month | Yes | Yes |
| Agenda Week | Yes | Yes |
| Agenda List | Yes | Yes |
| Tasks | Yes | Yes |
| Shopping | Yes | Yes |
| Motivation | Yes | Yes |
| Weekly Reset | Yes | Yes |
| Settings | Yes | Yes |
| Add Task | Yes | Yes |
| Edit Task | Partial | Yes |
| Add Event | Yes | Yes |
| Edit Event | Yes | Yes |
| Shopping Quick Add | Yes | Yes |
| Add Family Goal | Yes | Yes |
| Add Appreciation | Yes | Yes |
| Add Family Member | Yes | Yes |
| Avatar Editor | Yes | Yes |
| Weekly Reset confirmation dialogs/actions | Yes | Yes |
| Settings Backup dialog/surface | Yes | Yes |
| Settings Restore dialog/surface | Partial | Yes |

## Remaining issues by page

### Home

No remaining issues identified.

### Agenda Month

No remaining issues identified.

### Agenda Week

No remaining issues identified.

### Agenda List

No remaining issues identified.

### Tasks

1. Evidence: `05-tasks.png`; visible evidence: repeated task action buttons use saturated teal fills with muted gray labels for `K Klaar` and `M Morgen`, reducing label readability across all eight visible cards; severity: Medium; why it matters: primary task actions are visually prominent but the text/icon contrast makes the action hierarchy harder to scan in a household setting.

### Shopping

No remaining issues identified.

### Motivation

1. Evidence: `07-motivation.png`; visible evidence: celebration labels render as joined strings, for example `Pancake breakfastNet gevierd` and `Pancake breakfastMooie herinnering`; severity: Medium; why it matters: missing spacing between title and status reduces readability and makes celebration metadata look unfinished.

### Weekly Reset

1. Evidence: `weekly-reset.png`; visible evidence: the first viewport contains a large number of repeated decisions, including eight repeated task decision rows and three goal decision rows before completion controls; severity: Low; why it matters: visual density makes the reset ritual harder to scan quickly on a shared family screen.

### Settings

No remaining issues identified.

## Remaining issues by dialog

### Add Task

1. Evidence: `add-task.png`; visible evidence: the add-task panel appears at the bottom after a full task list, so the active creation controls are below substantial existing content; severity: Medium; why it matters: the opened creation surface does not visually take focus like the other add/edit panels.

### Edit Task

1. Evidence: `task-more-menu`; visible evidence: the required edit dialog could not be opened from the captured visible state because the exposed task menu did not produce a visible edit dialog during review; severity: Medium; why it matters: edit affordance discoverability is visually unclear from the representative task card.

### Add Event

No remaining issues identified.

### Edit Event

No remaining issues identified.

### Shopping Quick Add

No remaining issues identified.

### Add Family Goal

1. Evidence: `add-family-goal.png`; visible evidence: the `Doel toevoegen` action opens a personal-goal form labeled `PERSOONLIJK DOEL`, not a family-goal form; severity: Medium; why it matters: button wording and form title are visually inconsistent, which can confuse family members before they enter any data.

### Add Appreciation

No remaining issues identified.

### Add Family Member

No remaining issues identified.

### Avatar Editor

1. Evidence: `avatar-editor.png`; visible evidence: the modal height exceeds the 1080px viewport, clips the lower color controls, and leaves the underlying profile form visible behind the modal bottom edge; severity: High; why it matters: the editor does not fit the required desktop viewport cleanly and looks visually broken.

2. Evidence: `avatar-editor.png`; visible evidence: the Avatar Editor uses English category/help text (`Hair`, `Pick a hairstyle`, `Clothing`, `Pick an outfit shape`, `Accessory`) while surrounding FamilyBoard UI is Dutch; severity: Medium; why it matters: mixed localization weakens product consistency and FamilyBoard identity.

### Weekly Reset confirmation dialogs/actions

No remaining issues identified.

### Settings Backup dialog/surface

No remaining issues identified.

### Settings Restore dialog/surface

1. Evidence: `08-settings.png`; visible evidence: `Agenda herstellen` is disabled until a backup file is selected, so no restore confirmation dialog could be opened in this fixture state; severity: Low; why it matters: the disabled state is understandable, but the required restore dialog is not visually reachable without a file-selection artifact.

## Cross-product issues

1. Evidence: `05-tasks.png` and `avatar-editor.png`; visible evidence: several controls combine strong filled backgrounds with muted or mixed-language labels; severity: Medium; why it matters: button hierarchy and localization consistency vary between core task flows and profile/avatar flows.
2. Evidence: `07-motivation.png`; visible evidence: joined celebration title/status text lacks visible separation; severity: Medium; why it matters: metadata treatment is inconsistent with the otherwise card-based, separated information hierarchy.

## Prioritized punch list

### Must fix before Friends & Family

- Page/system: Avatar Editor. Issue: modal exceeds 1920×1080 viewport height and clips lower controls. Impact: editor appears broken and hides content. Estimated complexity: Medium.

### Should fix after Friends & Family

- Page/system: Tasks. Issue: repeated primary action labels have weak contrast against saturated buttons. Impact: lower scanability for common household task actions. Estimated complexity: Small.
- Page/system: Motivation. Issue: celebration title and status run together without spacing. Impact: visible copy/metadata readability defect. Estimated complexity: Small.
- Page/system: Motivation goal creation. Issue: `Doel toevoegen` opens a personal-goal panel rather than an Add Family Goal panel. Impact: visual label/form mismatch. Estimated complexity: Small.
- Page/system: Avatar Editor. Issue: English editor labels inside Dutch product UI. Impact: localization inconsistency. Estimated complexity: Small.

### Post-MVP

- Page/system: Weekly Reset. Issue: high first-viewport decision density with many repeated rows. Impact: slower visual scanning during reset ritual. Estimated complexity: Medium.
- Page/system: Task editing. Issue: edit dialog discoverability was unclear from visible task-card controls. Impact: visual affordance may not communicate edit capability. Estimated complexity: Small.
- Page/system: Settings Restore. Issue: restore dialog cannot be viewed without a selected backup file. Impact: review coverage needs a fixture-safe way to expose the confirmation state. Estimated complexity: Small.

## Recommendation

**Ready after small visual fixes**

This recommendation is based only on remaining visible issues in the current screenshots. The only must-fix visual defect is the Avatar Editor viewport clipping. The remaining findings are localized readability, spacing, density, and consistency issues.

## Validation

Commands/checks performed:

- `dotnet --version`: passed, `10.0.301`.
- `curl -sS -i http://127.0.0.1:5108/health`: passed, `200 OK`.
- `curl -sS http://127.0.0.1:5108/api/visual-review-fixtures/scenarios`: passed, returned official VisualReview scenarios.
- `curl -sS -X POST http://127.0.0.1:5108/api/visual-review-fixtures/visual-full/reset`: passed, loaded `visual-full`.
- Browser review: passed with official populated fixture data at 1920×1080.

## Modified files

- `docs/reports/2026-06-28-familyboard-authoritative-visual-review/familyboard-authoritative-visual-review.md`

## Binary artifact confirmation

Generated screenshots were stored only outside the repository in `/tmp/fb-review` and `/tmp/fb-dialogs` and were deleted after review. Temporary Playwright scripts and temporary browser/package files were stored under `/tmp` and deleted after review. No production code, CSS, tests, or binaries were modified by this review.
