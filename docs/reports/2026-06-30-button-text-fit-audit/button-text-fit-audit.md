# Button Text-Fit Audit

## Summary
Audited visible FamilyBoard button-like controls for label fit in the VisualReview runtime. The audit found systemic low horizontal padding in shared navigation, segmented controls, compact action pills, card actions, and management/dialog-adjacent buttons. The fix raises shared padding/minimum sizing rules rather than changing copy or adding per-label widths.

## Audit method
- Started the documented VisualReview API and Vite runtime.
- Reset and inspected these fixtures/surfaces at 1280×720: `visual-marketing-home`, `visual-marketing-family`, `visual-marketing-agenda`, `visual-marketing-tasks`, `visual-marketing-shopping`, `visual-marketing-motivation`, and `visual-marketing-weekly-reset`.
- Opened Thomas detail, Avatar Editor, Agenda add-event flow, Motivation add-appreciation flow, and Weekly Reset from Tasks.
- Measured visible controls matching `button`, `[role="button"]`, `[role="tab"]`, navigation pills, segmented controls, chips, compact actions, card actions, dialog actions, and quick actions.
- For each control, the audit recorded label, class/selector path, button width/height, measured text width, horizontal free space, estimated side padding, line-height, clipping/wrapping signal, and icon/text type.

## Root cause analysis
The confirmed issues were systemic rather than content-specific. Several shared rules used compact horizontal padding that was visually acceptable for short English labels but too tight for Dutch labels and icon+text actions:

- `.workspace-nav-button` used about 9.8 px side padding; `.workspace-admin-button` used about 8.7 px.
- Agenda segmented/action buttons used about 13.5 px or 9.8 px side padding where normal text buttons should have at least 14 px.
- Family Member form actions fell back to browser/default-like sizing and measured only 8 px side padding with a 25 px height.
- Motivation `familyboard-card-action` buttons combined icon+text with only about 6.6 px estimated side padding.
- Shopping list-management actions measured about 13 px side padding.
- Avatar Editor choice tiles used a dense family-editor grid that left long labels below the 10 px compact threshold.

## Confirmed text-fit issues
| Surface | Selector/component | Label example | Before width/height | Before text width | Before side padding | Issue |
| --- | --- | --- | ---: | ---: | ---: | --- |
| Home / Family / top navigation | `.workspace-nav-button` | `Thuis` | 62.45×34.39 px | 42.86 px | 9.79 px | Compact nav padding below 10 px threshold. |
| Home / Family / top navigation | `.workspace-admin-button` | `Instellingen` | 109.77×30.39 px | 72.42 px | 8.68 px | Icon+text admin pill cramped. |
| Agenda segmented control | `.agenda-workspace-toggle button` | `Maand` | 87.30×37.63 px | 60.36 px | 13.47 px | Normal segmented button below 14 px target. |
| Agenda event actions | `.agenda-event-card-actions button` | `Bewerken` | 90.80×28.19 px | 71.20 px | 9.80 px | Event action pill too tight. |
| Family Member form action | `.family-member-actions button` | `Gegevens opslaan` | 163.59×25 px | 147.59 px | 8 px | Dialog/form action had too little padding and height. |
| Shopping list management | `.shopping-list-name-form button` | `Hernoemen` | 119.52×35.38 px | 93.52 px | 13 px | Normal text action below 14 px target. |
| Motivation card actions | `.familyboard-card-action` | `Familiedoel aanpassen` | 257.22×40.80 px | 205.64 px | 6.59 px | Icon+text action had insufficient free space/gap. |
| Avatar Editor tiles | `.avatar-v2-asset-tile` | `Geen accessoire` | 96×96.27 px | 73.95 px | below compact threshold | Dense tile grid left long labels cramped. |

## Risk-only controls
| Surface/control | Measurement/result | Action |
| --- | --- | --- |
| Home icon-only card buttons | 32×32 px icon-only actions use aria-labels; no visible text to fit. | Not changed. |
| Agenda day cells | Calendar cells intentionally combine day number, today marker, and event count in a grid cell. | Not treated as text buttons; no style change. |
| Weekly Reset decision buttons | `Gaat mee`/`Afronden` already measured at 18 px side padding. | Preserved. |
| Add Event dialog actions | No post-fix cramped dialog-action measurements. | Covered by existing dialog action rules; no local hack. |
| Add Appreciation dialog actions | No post-fix cramped dialog-action measurements. | Covered by existing dialog action rules; no local hack. |

## Fixes applied
- Raised workspace navigation padding and normalized nav line-height.
- Raised admin navigation padding while keeping the compact admin treatment.
- Increased Agenda segmented and event-action pill horizontal padding.
- Added shared Family Member action button minimum height and inline padding.
- Increased Avatar Editor family-editor tile minimum column width to give long tile labels more room.
- Increased Motivation dashboard/card action padding and icon+text gap.
- Increased Shopping list-management action padding.

## Before measurements
| Control group | Worst before side padding | Representative before measurement |
| --- | ---: | --- |
| Workspace primary nav | 9.79 px | `Thuis`: 62.45 px button / 42.86 px text |
| Workspace admin nav | 8.68 px | `Instellingen`: 109.77 px button / 72.42 px text |
| Agenda segmented controls | 13.47 px | `Maand`: 87.30 px button / 60.36 px text |
| Agenda event actions | 9.80 px | `Bewerken`: 90.80 px button / 71.20 px text |
| Family Member form action | 8 px | `Gegevens opslaan`: 163.59 px button / 147.59 px text |
| Shopping management actions | 13 px | `Hernoemen`: 119.52 px button / 93.52 px text |
| Motivation card actions | 6.59 px | `Familiedoel aanpassen`: 257.22 px button / 205.64 px text |
| Avatar Editor tiles | below compact target | `Geen accessoire`: 96 px tile / 73.95 px text |

## After measurements
| Control group | After side padding | Representative after measurement |
| --- | ---: | --- |
| Workspace primary nav | 11.88 px | `Thuis`: 66.61 px button / 42.86 px text |
| Workspace admin nav | 11.88 px | `Instellingen`: 116.17 px button / 72.42 px text |
| Agenda segmented controls | 16.18 px | `Maand`: 92.73 px button / 60.36 px text |
| Agenda event actions | 15.08 px | `Bewerken`: 101.36 px button / 71.20 px text |
| Family Member form action | 17.19 px | `Gegevens opslaan`: 181.97 px button / 147.59 px text |
| Shopping management actions | 17 px | `Hernoemen`: 127.52 px button / 93.52 px text |
| Motivation card actions | 10.90 px | `Familiedoel aanpassen`: 268.25 px button / 205.64 px text |
| Avatar Editor tiles | at/above compact target | Long visible tile labels no longer flagged by the audit after the tile grid width adjustment. |

## Before/after comparison
| Surface | Before audit failures | After audit failures | Notes |
| --- | ---: | ---: | --- |
| Home | 6 | 0 | Navigation pills fixed. |
| Family overview | 6 | 0 | Navigation pills fixed. |
| Thomas detail | 7 | 0 | Navigation and Family Member form action fixed. |
| Avatar Editor | 29 | 0 | Inherited nav/form issues plus tile label fit fixed. |
| Agenda | 26 | 0 | Navigation, segmented, and event action pills fixed. |
| Add Event dialog flow | 26 | 0 | Underlying Agenda controls and dialog-adjacent action fit fixed. |
| Tasks | 6 | 0 | Navigation pills fixed; task actions were already comfortable. |
| Shopping | 9 | 0 | Navigation and list-management actions fixed. |
| Motivation | 9 | 0 | Navigation and card action buttons fixed. |
| Add Appreciation dialog flow | 9 | 0 | Underlying Motivation controls fixed; dialog controls remained comfortable. |
| Weekly Reset | 6 | 0 | Navigation fixed; reset action chips were already comfortable. |

## Validation
- Re-ran the same DOM measurement audit after the CSS changes; no measured visible text controls remained below the normal/compact padding thresholds after excluding intentional icon-only controls and calendar day cells.
- Verified no clipped visible labels were reported by the audit.
- Verified normal text buttons now have at least comfortable measured padding in the confirmed groups.
- Verified compact chips and segmented controls remain balanced and above their thresholds.
- Verified dialog action flows did not introduce cramped dialog controls.
- Verified top navigation remains stable and touch targets remain usable.
- No marketing fixtures, storyboard, recording framework, screenshots, videos, audio, WAV files, or binary artifacts were changed or produced.

## Modified files
- `src/HomeOps.Client/src/styles.css`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-06-30-button-text-fit-audit/button-text-fit-audit.md`

## Explicit answers
- Were cramped button labels found? Yes.
- Were the issues systemic? Yes; shared nav, segmented, action-pill, card-action, tile, and form-action sizing rules were involved.
- Were shared button rules fixed instead of page-specific hacks? Yes.
- Do dialog action buttons now have enough room? Yes; no post-fix dialog action text-fit failures were measured.
- Do segmented controls and chips still fit comfortably? Yes.
- Were touch targets preserved? Yes; minimum heights were preserved or improved.
- Were screenshots or binaries committed? No.
- Was no movie intentionally produced? Yes. No movie was produced.
