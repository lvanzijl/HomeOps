# FamilyBoard Final Visual Polish

## Summary

Implemented only the five visual defects identified by the latest FamilyBoard Authoritative Visual Review. The slice adjusts Avatar Editor sizing and localization, Tasks action-button presentation, Motivation celebration spacing, and the personal-goal button wording. Backend behavior, API contracts, database schema, workflows, navigation, screenshots, and binary assets were not changed.

## Preflight analysis

Read before implementation:

- `.github/copilot-instructions.md`
- `AGENTS.md`
- `docs/reports/2026-06-28-familyboard-authoritative-visual-review/familyboard-authoritative-visual-review.md`

Preflight command result:

```bash
export DOTNET_CLI_HOME=/tmp/dotnet
export PATH="$PATH:$HOME/.dotnet/tools"
dotnet --version
# 10.0.301
```

The authoritative visual review was used as the source of truth. The implementation intentionally did not address Weekly Reset density, task edit discoverability, or Settings Restore disabled state.

## Root cause analysis

- Avatar Editor clipping: the editor content was larger than the fixed modal space at 1920×1080, with large preview/tile sizing and insufficient contained scrolling.
- Avatar Editor English copy: the Family Member Avatar Editor still rendered asset section titles, descriptions, swatch labels, and option labels from English asset metadata.
- Tasks primary buttons: the complete/tomorrow actions used visually heavy button treatment that reduced text readability against saturated fills.
- Motivation celebration spacing: the compact celebration card did not force title and status onto separated block lines.
- Goal wording: the visible action said `Doel toevoegen` while the opened form was specifically a personal-goal form.

## Implementation plan

1. Keep the existing Avatar Editor workflow and compress only the editor presentation so it fits in the desktop viewport.
2. Add Dutch display labels for Avatar Editor asset options without changing avatar asset IDs or renderer behavior.
3. Soften Tasks complete/tomorrow button fills while preserving pill shape, minimum height, icon, and label hierarchy.
4. Add a compact copy wrapper for Motivation celebration title/status separation.
5. Rename the visible personal-goal add action to match the existing personal-goal form.

## Implemented changes

- Avatar Editor now uses a bounded modal height, smaller preview/tile sizing, and contained control scrolling so the dialog fits inside 1920×1080 without exposing content behind it in the viewport.
- Family Member Avatar Editor and the standalone Avatar V2 editor use Dutch section, helper, swatch, and option labels.
- Tasks `Klaar` and `Morgen` actions now use lighter fills with darker readable text while keeping the same touch target and action placement.
- Motivation celebration cards now render title and status in a stacked copy wrapper so `Pancake breakfast` and `Net gevierd` are visibly separated.
- The personal-goal action now reads `Persoonlijk doel toevoegen`, matching the existing `Persoonlijk doel` form.
- Focused test expectations were updated only where visible Dutch labels changed.

## Validation

- Avatar Editor clipping fixed? **Yes.** Browser inspection at 1920×1080 reported the editor bounding box entirely inside the viewport (`x: 367`, `y: 3`, `width: 1186`, `height: 1074`).
- Avatar Editor fully Dutch? **Yes.** Browser inspection found no remaining known English Avatar Editor strings from the review set (`Hair`, `Clothing`, `Accessory`, `Pick a`, `No accessory`, English option names).
- Tasks buttons improved? **Yes.** Browser inspection confirmed the primary `Klaar` action rendered with a light background (`rgb(230, 255, 251)`) and dark readable text (`rgb(15, 95, 89)`).
- Motivation spacing fixed? **Yes.** Browser inspection returned the celebration item as separate lines: `Pancake breakfast` and `Net gevierd`.
- Goal wording consistent? **Yes.** Browser inspection found one visible `Persoonlijk doel toevoegen` action.
- Backend/API/schema unchanged? **Yes.** No backend, API contract, or schema files were modified.

Validation commands:

```bash
npm run build
npm run test -- FamilyAvatarEditor.test.tsx AvatarEditorPage.test.tsx MotivationPage.test.tsx TasksPage.test.tsx
ASPNETCORE_ENVIRONMENT=VisualReview dotnet run --project src/HomeOps.Api/HomeOps.Api.csproj --no-launch-profile --urls 'http://127.0.0.1:5108;http://127.0.0.1:5152'
curl -sS -X POST http://127.0.0.1:5108/api/visual-review-fixtures/visual-full/reset
VITE_HOMEOPS_API_BASE_URL=http://127.0.0.1:5108 npm run dev -- --host 127.0.0.1 --port 5173
node /tmp/pw-polish/inspect2.mjs
git diff --check
```

## Remaining known visual debt

Not addressed by this slice by instruction:

- Weekly Reset density.
- Task edit discoverability.
- Settings Restore disabled state.

## Modified files

- `docs/reports/2026-06-28-familyboard-final-visual-polish/familyboard-final-visual-polish.md`
- `docs/roadmap/phase-2.md`
- `docs/state/current-state.md`
- `src/HomeOps.Client/src/MotivationPage.test.tsx`
- `src/HomeOps.Client/src/MotivationPage.tsx`
- `src/HomeOps.Client/src/avatarV2/AvatarEditorPage.test.tsx`
- `src/HomeOps.Client/src/avatarV2/AvatarEditorPage.tsx`
- `src/HomeOps.Client/src/home/FamilyAvatarEditor.test.tsx`
- `src/HomeOps.Client/src/home/FamilyAvatarEditor.tsx`
- `src/HomeOps.Client/src/styles.css`

## Binary artifact confirmation

No screenshots, PNG, JPG, JPEG, GIF, WEBP, PDF, or other binary artifacts were created or added by this slice. Temporary browser inspection files were created under `/tmp/pw-polish` only and deleted after validation.
