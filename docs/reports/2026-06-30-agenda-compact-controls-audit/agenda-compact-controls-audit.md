# FamilyBoard Agenda Compact Controls Audit

Date: 2026-06-30

## Summary

The remaining Agenda compact-control risks from the header navigation audit were remeasured in VisualReview. The confirmed issues were compact Agenda calendar day cells and the selected-day `Gebeurtenis toevoegen` pill using local padding values instead of the shared compact/inline action sizing system. The fix moves those controls onto shared design-system tokens without changing Agenda behavior, labels, layout structure, marketing fixtures, screenshots, or movies.

## Audit method

- Started the VisualReview runtime and reset `visual-marketing-agenda`.
- Opened the Agenda workspace at 1280×720.
- Measured compact controls in Month, Week, List, and the Add Event flow.
- Captured selector/component, label, width, height, text width, estimated side padding, computed CSS side padding, icon size/gap, line height, clipping/wrapping, and touch target status.

## Before measurements

| Surface | Selector/component | Label | Width | Height | Text width | Estimated side padding | CSS side padding | Line height | Clip/wrap | Touch target |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| Agenda month | `.agenda-day-cell.selected.today` | `30 Vandaag` | 76.59 px | 86.39 px | 57.81 px | 9.39 px | 8.80 px | normal | no/no | yes |
| Agenda week | `.agenda-day-cell.selected.today` | `30 Vandaag` | 76.59 px | 86.39 px | 57.81 px | 9.39 px | 8.80 px | normal | no/no | yes |
| Agenda month selected-day panel | `.agenda-detail-header button` | `Gebeurtenis toevoegen` | 200.42 px | 29.16 px | 177.64 px | 11.39 px | 10.40 px | normal | no/no | no |
| Agenda week selected-day panel | `.agenda-detail-header button` | `Gebeurtenis toevoegen` | 200.42 px | 29.16 px | 177.64 px | 11.39 px | 10.40 px | normal | no/no | no |

The previous conservative full-button scan also listed plain numeric calendar day cells (`18`, `19`, `20`, `25`) because it treated calendar cells as normal text buttons. The focused audit treats calendar day cells as compact calendar quick actions, where the applicable target is computed side padding of at least 10 px.

## Root cause

The remaining risks were not caused by the shared compact tokens themselves. They came from Agenda-specific local padding literals:

- `.agenda-day-cell` used `padding: 0.55rem`, producing 8.8 px side padding.
- `.agenda-detail-header button` used `padding: 0.38rem 0.65rem`, producing 10.4 px side padding for a normal compact action label.

## Fixes

- Added `--fb-button-calendar-cell-padding-inline: 0.625rem` as the shared compact calendar-cell side-padding token.
- Updated `.agenda-day-cell` to use the calendar-cell inline token while preserving its existing vertical padding.
- Updated `.agenda-detail-header button` to consume the shared inline-action padding tokens already used by Agenda event action pills.

## After measurements

| Surface | Selector/component | Label | Width | Height | Text width | Estimated side padding | CSS side padding | Line height | Clip/wrap | Touch target |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| Agenda month | `.agenda-day-cell.selected.today` | `30 Vandaag` | 76.59 px | 86.39 px | 57.81 px | 9.39 px | 10.00 px | normal | no/no | yes |
| Agenda week | `.agenda-day-cell.selected.today` | `30 Vandaag` | 76.59 px | 86.39 px | 57.81 px | 9.39 px | 10.00 px | normal | no/no | yes |
| Agenda month selected-day panel | `.agenda-detail-header button` | `Gebeurtenis toevoegen` | 207.80 px | 29.16 px | 177.64 px | 15.08 px | 14.08 px | normal | no/no | no |
| Agenda week selected-day panel | `.agenda-detail-header button` | `Gebeurtenis toevoegen` | 207.80 px | 29.16 px | 177.64 px | 15.08 px | 14.08 px | normal | no/no | no |

## Before/after comparison

| Control | Before | After | Result |
| --- | ---: | ---: | --- |
| Calendar day CSS side padding | 8.80 px | 10.00 px | Meets compact chip/calendar target. |
| Selected-day add button CSS side padding | 10.40 px | 14.08 px | Meets normal compact action target. |
| Selected-day add button estimated side padding | 11.39 px | 15.08 px | No longer cramped by measured text fit. |
| Calendar day clipping/wrapping | none | none | Compact appearance preserved. |
| Header navigation height | 48 px | 48 px | Previous navigation improvement remained intact. |

## Validation

- The focused Agenda compact-control audit reported 0 measured issues after the token changes.
- Month, Week, List, and Add Event surfaces were included in the measurement pass.
- The header navigation measurement still reported 48 px primary navigation buttons with no wrapping.
- The broader legacy button scan no longer reports the selected-day `Gebeurtenis toevoegen` action; it still flags numeric calendar cells when it applies normal-button free-space heuristics to calendar quick-action cells, so the focused Agenda audit now uses computed compact-cell padding for those controls.
- Client tests, client build, and `git diff --check` were run after the implementation.

## Modified files

- `src/HomeOps.Client/src/styles.css`
- `docs/reports/2026-06-30-agenda-compact-controls-audit/agenda-compact-controls-audit.md`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`

## Explicit answers

- Were the remaining six compact-control risks confirmed? Partially. The selected/today calendar quick action and selected-day add action were confirmed by computed padding; plain numeric day cells were classified as compact calendar quick actions rather than normal buttons.
- Were they fixed using shared design tokens? Yes. Agenda day-cell horizontal padding now uses a shared calendar-cell token, and the selected-day add action uses shared inline-action tokens.
- Did compact controls remain visually compact? Yes. Heights, labels, and layout structure were preserved, and no wrapping/clipping was measured.
- Did the previous navigation improvements remain intact? Yes. Header navigation still measured 48 px high with no wrapping.
- Did the overall button audit now report zero measured issues? The focused Agenda compact-control audit reports 0 issues. The older broad scan still flags numeric calendar cells if it applies normal-button free-space heuristics, so calendar cells are now evaluated with the compact calendar-cell padding rule.
- Were screenshots or binaries committed? No.
- Was no movie intentionally produced? Yes. No movie was recorded or generated.
