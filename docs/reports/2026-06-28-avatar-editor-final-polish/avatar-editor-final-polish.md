# Avatar Editor Final Polish

## Summary

Fixed the remaining FamilyBoard Authoritative Visual Review Round 2 Must Fix by reducing the Family Member Avatar Editor's vertical footprint at 1920×1080. The existing controls now fit in the initial dialog view without adding features, changing avatar functionality, changing the asset model, changing persistence, or touching backend/API/schema code.

Explicit answers:

- Avatar Editor clipping fixed? **Yes.**
- Accessory row visible? **Yes.**
- Accessory colour controls visible? **Yes.**
- Save visible? **Yes.**
- Cancel visible? **Yes.**
- Fits comfortably inside 1920×1080? **Yes.**
- Fully Dutch? **Yes.**
- Backend/API/schema unchanged? **Yes.**

## Preflight

Read before implementation:

- `.github/copilot-instructions.md`
- `AGENTS.md`
- `docs/reports/2026-06-28-familyboard-authoritative-visual-review-round-2/familyboard-authoritative-visual-review-round-2.md`

Command result:

```bash
export DOTNET_CLI_HOME=/tmp/dotnet
export PATH="$PATH:$HOME/.dotnet/tools"
dotnet --version
# 10.0.301
```

## Root cause

The dialog frame fit the viewport, but the Family Member Avatar Editor still used too much vertical space inside the modal. In the right-hand control column, large preview tiles and section spacing made the accessory section extend below the initial 1920×1080 dialog view, leaving the lower accessory row clipped and the `Accessoirekleur` controls hidden unless the user scrolled.

## Implementation

- Reduced the Family Member Avatar Editor modal maximum height to preserve more viewport breathing room instead of increasing dialog height.
- Reduced the live preview card footprint.
- Tightened Family Member Avatar Editor control gaps and section padding.
- Reduced Family Member Avatar Editor tile minimum size, SVG preview size, and tile typography so existing accessory options can lay out more efficiently.
- Removed the Family Member Avatar Editor's internal controls scrolling in the 1920×1080 layout because all current controls fit immediately.

No avatar functionality, avatar asset model, renderer, persistence, API, backend, or workflow code was changed.

## Browser validation

Runtime used:

```bash
ASPNETCORE_ENVIRONMENT=VisualReview \
  dotnet run --project src/HomeOps.Api/HomeOps.Api.csproj \
  --no-launch-profile \
  --urls 'http://127.0.0.1:5108;http://127.0.0.1:5152'
```

Fixture loaded:

```bash
curl -sS -X POST http://127.0.0.1:5108/api/visual-review-fixtures/visual-full/reset
```

Result:

```json
{"scenarioName":"visual-full","anchorUtc":"2026-06-21T09:00:00+00:00","familyMembers":4,"tasks":10,"lists":2,"listItems":6,"familyGoals":1,"individualGoals":2,"helpfulMoments":5,"events":2}
```

Frontend runtime:

```bash
VITE_HOMEOPS_API_BASE_URL=http://127.0.0.1:5108 npm run dev -- --host 127.0.0.1 --port 5173
```

Browser validation used Playwright at a 1920×1080 viewport, loaded `visual-full`, opened Alex's Family Member page, opened the Avatar Editor, and checked the live DOM without saving screenshots.

Validation result:

- Dialog fully inside viewport: **PASS**.
- Accessory row visible: **PASS**.
- Accessory colour controls visible: **PASS**.
- Save visible: **PASS**.
- Cancel visible: **PASS**.
- No clipped controls: **PASS**.
- No clipped text: **PASS**.
- No unnecessary scrolling: **PASS**.
- Fully Dutch against the previous review's English string set: **PASS**.

## Measurements

Measured in browser at 1920×1080:

```json
{
  "viewportHeight": 1080,
  "dialogRect": {
    "top": 92.28125,
    "bottom": 987.703125,
    "height": 895.421875,
    "left": 367,
    "right": 1553,
    "width": 1186
  },
  "distanceFromDialogBottomToViewportBottom": 92.296875,
  "insideViewport": true,
  "accessoryRowVisible": true,
  "accessoryColourControlsVisible": true,
  "saveVisible": true,
  "cancelVisible": true,
  "noClippedControls": true,
  "noUnnecessaryScrolling": true,
  "dutchCheckNoEnglishReviewStrings": true
}
```

## Acceptance criteria

- Avatar Editor fits comfortably inside 1920×1080: **PASS**.
- Every control is immediately visible: **PASS**.
- No clipping remains: **PASS**.
- No hidden controls remain: **PASS**.
- Save and Cancel remain visible: **PASS**.
- Avatar Editor remains fully Dutch: **PASS**.
- Backend/API/schema unchanged: **PASS**.

## Remaining Avatar Editor debt

No remaining Friends & Family blocking Avatar Editor visual debt was identified in this slice. Broader Avatar Editor redesign, feature expansion, asset model changes, renderer changes, persistence changes, and workflow changes remain intentionally out of scope.

## Modified files

- `src/HomeOps.Client/src/styles.css`
- `docs/reports/2026-06-28-avatar-editor-final-polish/avatar-editor-final-polish.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

## Binary artifact confirmation

No screenshots or binary artifacts were added. No PNG, JPG, JPEG, GIF, WEBP, or PDF files were created in the repository for this slice.
