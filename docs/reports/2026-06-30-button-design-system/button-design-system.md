# Button Design System

## Summary
Centralized the FamilyBoard button sizing values that were previously scattered across navigation, segmented controls, dialog actions, card actions, inline actions, icon buttons, Avatar Editor tiles, and shopping actions. The migration keeps the recently validated visual sizing from the Button Text-Fit Audit while moving the sizing logic into shared `--fb-button-*` tokens.

## Previous fragmentation
The previous text-fit audit fixed cramped labels but left the measured values embedded in individual selectors. Examples included direct `min-height`, `padding`, `gap`, and pill-radius values in workspace navigation, admin navigation, Agenda segmented controls, Agenda event actions, Family Member actions, Motivation card actions, Shopping management actions, dialog buttons, icon buttons, and Avatar Editor tile grids.

That fragmentation made future regressions likely because each page could drift independently even when it was expressing the same button type.

## Shared button categories
| Category | Token group | Current consumers |
| --- | --- | --- |
| Workspace navigation | `--fb-button-nav-*` | `.workspace-nav-button` |
| Admin navigation | `--fb-button-admin-*` | `.workspace-admin-button` |
| Reserved back / icon button | `--fb-button-back-size`, `--fb-button-icon-size`, `--fb-button-icon-glyph-size` | `.workspace-back-slot`, `.workspace-back-button`, `.icon-button` |
| Compact actions/chips | `--fb-button-compact-*` | `.compact-action`, `.compact-header-action`, compact status/chip-like rules |
| Standard actions | `--fb-button-standard-*` | `.family-member-actions button` |
| Segmented controls | `--fb-button-segmented-*` | `.agenda-workspace-toggle button`, `.agenda-week-navigation button` |
| Inline action pills | `--fb-button-inline-action-*` | `.agenda-event-card-actions button`, shopping item/options actions |
| Dialog actions | `--fb-button-dialog-*` | `.home-capture-dialog`, `.task-dialog`, `.motivation-dialog` action buttons |
| Card actions | `--fb-button-card-*`, `--fb-button-icon-gap` | Motivation card actions and related dashboard actions |
| Avatar tiles | `--fb-avatar-tile-min-width` | `.avatar-v2-family-editor .avatar-v2-asset-grid` |

## Design tokens
The shared tokens define the sizing values requested for the design system: minimum heights, horizontal/vertical padding, icon/back sizes, icon/text gaps, line-height, and pill radius. They live in `:root` next to the existing app-wide design tokens so page-level rules can consume them without introducing a new abstraction layer.

Key token examples:

- `--fb-button-radius-pill: 999px`
- `--fb-button-line-height: 1.15`
- `--fb-button-nav-min-height: 2.15rem`
- `--fb-button-nav-padding-inline: 0.68rem`
- `--fb-button-dialog-min-height: 2.75rem`
- `--fb-button-card-padding-inline: 1rem`
- `--fb-button-icon-size: 2.5rem`
- `--fb-button-back-size: 2.75rem`
- `--fb-avatar-tile-min-width: 8.6rem`

## Migration
- Replaced direct workspace navigation sizing with navigation tokens.
- Replaced admin navigation sizing with admin-navigation tokens.
- Replaced reserved back/icon button sizing with shared back/icon size and pill-radius tokens.
- Replaced compact action, compact header action, and chip-like padding with compact tokens.
- Replaced Family Member form-action sizing with standard action tokens.
- Replaced dialog action sizing with dialog action tokens.
- Replaced Agenda event-action and segmented-control padding with inline/segmented tokens.
- Replaced Motivation dashboard/card action sizing with card action and icon-gap tokens.
- Replaced Shopping management/item action padding with inline/card action tokens.
- Replaced Avatar Editor family tile grid width with the shared Avatar tile width token.

## Validation
- Re-ran the same DOM button text-fit audit used for the previous report after the token migration.
- The audit reported 0 measured text-fit failures for Home, Family overview, Thomas detail, Avatar Editor, Agenda, Add Event dialog flow, Tasks, Shopping, Motivation, Add Appreciation dialog flow, and Weekly Reset.
- Navigation buttons, admin buttons, segmented controls, event action pills, Family Member actions, Shopping actions, Motivation actions, and Avatar Editor tiles retained the passing measurements from the previous audit.
- Touch targets were preserved because tokenized minimum heights match the approved values.
- No screenshots, movies, audio, WAV files, generated media, or binary artifacts were produced or committed.

## Modified files
- `src/HomeOps.Client/src/styles.css`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-06-30-button-design-system/button-design-system.md`

## Explicit answers
- Was button sizing centralized? Yes. Shared `--fb-button-*` and related Avatar tile tokens now own the common sizing values.
- Do pages now reuse shared sizing rules? Yes. The audited shared selectors now consume the shared tokens instead of repeating literal sizing values.
- Were page-specific hacks removed where possible? Yes. The migration centralizes values in shared CSS tokens while leaving genuinely structural selectors in place.
- Were touch targets preserved? Yes. Minimum heights and icon/back target sizes match the validated values.
- Does the measurement audit still pass? Yes. The post-migration DOM audit reported 0 measured text-fit failures for the audited surfaces.
- Were screenshots or binaries committed? No.
- Was no movie intentionally produced? Yes. No movie was produced.
