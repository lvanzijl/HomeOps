# Settings Viewport-Fit Analysis

## Summary

This is the mandatory viewport-first analysis for the Settings page only. No implementation changes were made.

Recommendation: redesign Settings as a calm household maintenance dashboard whose primary question is **"Is everything in order?"** The page should permanently fit inside the reserved FamilyBoard viewport by replacing the current vertically stacked administration flow with a fixed-height dashboard composition: compact status header, primary maintenance/status card, and bounded contextual action entry points.

The recommended design intentionally reduces default visible information. Backup/restore, import/export, validation detail, and administrative controls remain available, but they should not occupy large permanent viewport regions or force the shared page-body scroll region to become the page's structural overflow strategy.

## Scope

In scope:

- Settings page only.
- Current Settings composition and its use of shared shell, page body, widgets, and calendar portability controls.
- Viewport-fit and information hierarchy analysis.
- Recommendation for a future implementation contract.
- Documentation report creation.

Out of scope:

- Source implementation changes.
- Backend, API, schema, migration, or seed changes.
- New product features.
- Redesign of Home, Agenda, Tasks, Shopping, Motivation, My Page, Weekly Reset, or internal placeholder pages.
- Screenshots, videos, binary assets, or visual exports.

## Settings information-reduction findings

Settings currently behaves like an administration page centered on calendar export/restore actions. The visible content over-explains two rare workflows and gives both workflows near-equal permanent space. For a household dashboard, this is too action-heavy for a page users should only need when checking that the family board is healthy.

Information that should stay visible by default:

- Overall household maintenance state.
- Whether family data appears safe enough for normal use.
- Last known backup/export state or a clear "not yet backed up" state.
- Any current maintenance warning or error.
- Compact entry points for deeper actions.

Information that should be reduced or made contextual:

- Restore warning copy.
- File picker.
- Restore confirmation checkbox.
- Restore validation error list.
- Full export session detail.
- Import/export mechanics.
- Administrative explanatory paragraphs.

Settings should feel calm and mostly informational when configuration is successful. Successful configuration should communicate "everything is in order" instead of presenting destructive maintenance controls as the main content.

## One-primary-question recommendation

Recommended primary question: **Is everything in order?**

Rationale:

- "Is my family data safe?" is important but too narrow because Settings also includes household configuration and administration.
- "Does anything require maintenance?" is useful, but it frames Settings around problems rather than calm confidence.
- "Is everything working normally?" is operational, but less family-facing and less inclusive of backup status and configuration readiness.
- "Is everything set up correctly?" is close, but setup is not the only long-term Settings responsibility.

The strongest Settings hierarchy is therefore:

1. **Overall order/status:** Everything is in order / needs attention.
2. **Family data safety:** Backup status and restore availability summarized.
3. **Household configuration:** Who/what is configured and whether anything needs setup.
4. **Maintenance actions:** Compact entry points for export, restore, import, configuration, and administration.

## Current layout assessment

Current page composition:

- Global app shell fixes the app to viewport height and hides document overflow.
- Workspace shell reserves a navigation row and a panel row.
- Settings is an administration workspace with the normal page header: position pill, title, and description.
- The page body uses the shared `.workspace-page-body` region.
- Settings renders a generic `.widget-host`.
- Settings injects the `calendar-portability-admin` widget before any loaded widget instances.
- The default Settings layout has no additional widgets, but API-provided widgets could be appended by the generic widget host.
- The Settings panel is constrained to a readable width instead of being a full dashboard canvas.

Current visible Settings sections:

1. Navigation / administration entry.
2. Page header: `Gezinsinstellingen`, `Instellingen`, `Gezinsvoorkeuren en onderhoud.`
3. Calendar maintenance widget:
   - Type label: `Gezinsonderhoud`.
   - Heading: `Agenda`.
   - Intro paragraph.
   - Backup save section.
   - Export button.
   - Export summary.
   - Restore section.
   - Restore warning.
   - File input.
   - Restore summary.
   - Confirmation checkbox.
   - Restore button.
   - Success/error status and validation list when present.
4. Potential additional Settings widget instances loaded from the workspace layout API.

The current composition is vertical and document-like: header, then one full-width maintenance widget, then stacked action cards inside that widget, then conditional status content.

## Root causes of viewport overflow

Settings currently exceeds or risks exceeding its reserved viewport because:

1. **Settings relies on shared page-body overflow.** `.workspace-page-body` uses `overflow: auto`, and Settings does not override it with a page-owned fixed grid.
2. **The widget host is content-sized.** `.widget-host` is a grid with `min-height: 100%`, top margin, and no fixed row budget for Settings content.
3. **Calendar portability is vertically stacked.** Export and restore are separate stacked action blocks, and restore contains file input, warning text, summary text, checkbox, and button.
4. **Conditional status content increases page height.** Success/error state and validation errors append below the main action sections instead of occupying a bounded status region.
5. **Restore workflow is permanently visible.** A destructive, rare workflow takes permanent vertical space rather than being contextual.
6. **The page header consumes vertical budget even when Settings should mostly answer status.** The current generic header repeats role, title, and description before the real maintenance content begins.
7. **Readable-width Settings prevents dashboard-style horizontal use.** The page is capped at the readable panel width, causing action content to stack rather than use wider desktop columns.
8. **Potential API-loaded Settings widgets can append below the first widget.** The default Settings layout is empty, but the generic rendering path allows additional instances to extend content height.
9. **Explanatory text is too verbose for a steady-state dashboard.** Copy that is helpful during a rare restore task is shown every time the page opens.

Conclusion: Settings currently relies on the shared page-body scroll region as a safety valve. That is incompatible with the primary-page viewport rule for Settings.

## Desktop viewport budget

Target common laptop viewport: **1366 × 768**.

Estimated fixed shell budget:

| Region | Approx. height | Notes |
| --- | ---: | --- |
| App shell vertical padding | 18-24px | Existing shell padding should remain compact. |
| Navigation row | 44-56px | Primary nav plus compact Settings affordance. Must remain a fixed reserved row. |
| Shell gap | 6-8px | Existing workspace shell gap. |
| Workspace panel padding | 20-28px total | Could remain compact. |
| Compact Settings header/status question row | 56-72px | Should combine title, primary question, and overall state. |
| Main dashboard grid gap | 12-16px | Reserved gap between status row and content grid. |
| Primary maintenance content row | 390-450px | Two-column dashboard body with bounded internal areas. |
| Secondary/contextual action strip | 52-68px | Compact persistent action entry points only. |
| Reserved safety margin | 16-24px | Prevents accidental scrollbar from borders/font changes. |
| **Total** | **614-746px** | Fits within 768px without page scroll when rows are fixed/bounded. |

Recommended page-internal grid budget inside the workspace panel body, after nav/header/padding:

| Settings dashboard region | Approx. height |
| --- | ---: |
| Overall health/status banner | 72px |
| Main maintenance grid | minmax(0, 1fr), typically 390-460px |
| Compact action rail | 56px |
| Internal gaps | 24px |
| **Settings-owned body total** | **542-612px** |

At 1440 × 900, the same composition gains breathing room in the main maintenance grid but should not add more default content. At 1280 × 720, density should reduce copy, collapse secondary labels, and keep the same fixed rows.

## Section-by-section evaluation

| Section | Always visible? | Primary/secondary | Height strategy | Information reduction decision |
| --- | --- | --- | --- | --- |
| Global navigation | Yes | Primary shell | Fixed/auto shell row | Keep as-is; do not allow Settings content to influence nav height. |
| Settings page header | Yes, but compacted | Primary orientation | Fixed compact row | Merge title, primary question, and overall status; reduce role/description copy. |
| Overall household status | Yes | Primary | Fixed 64-72px | New top status summary: `Alles is in orde` / `Aandacht nodig`. This is more important than action controls. |
| Calendar/agenda backup status | Yes | Primary maintenance proof | Bounded card | Show last backup/export state, item count if available, and calm safety state. Full export mechanics become contextual. |
| Restore availability | Summary only | Secondary unless problem/recovery need | Bounded summary row | Show whether restore is available/ready; destructive restore flow should open in a dialog/panel. |
| Export action | Compact entry point | Secondary action | Fixed button/chip | Keep accessible, but not as a large action block. |
| Restore action | Contextual entry point | Secondary/destructive | Dialog or bounded side panel | Do not reserve permanent space for file input, warning, checkbox, and restore button. |
| File input | No | Contextual action detail | Dialog body with internal bounds | Only visible during restore/import flow. |
| Restore warning | No, except in restore context | Contextual safety copy | Dialog fixed copy | Required for safety but too verbose for default Settings. |
| Restore confirmation checkbox | No | Contextual safety control | Dialog fixed row | Keep in restore flow only. |
| Export summary | Yes as status, not session log | Primary proof point | Single-line status | Convert to last backup/status line; truncate or summarize. |
| Restore summary | No by default | Contextual validation detail | Dialog status region | Show after a file is selected inside restore flow. |
| Success/error status | Yes if current | Primary if warning, secondary if success | Fixed alert/status slot | Reserve a single status slot. Validation list scrolls internally if long. |
| Validation errors | No by default | Contextual diagnostics | Internal scroll inside alert/details | Never append unbounded list to page. |
| Additional admin widgets | No by default | Secondary/contextual | Bounded action tiles or modal routes | Do not allow generic widgets to append vertically on Settings. |
| Household configuration | Yes as summary | Primary support | Bounded card/list | Show compact readiness state, not large forms. Forms open contextually. |
| Maintenance history | Summary only | Secondary | Bounded recent list with max rows | Cap to 2-3 rows plus `+N meer`; full history internal scroll/dialog. |

## Recommended dashboard composition

Recommended layout: **Status-first household maintenance dashboard**.

Grid concept:

```text
Settings panel
┌──────────────────────────────────────────────────────────────┐
│ Compact header/status: "Is everything in order?" + state      │ 72px
├──────────────────────────────────────────────────────────────┤
│ Main grid                                                     │ flex 1
│ ┌──────────────────────────────┬───────────────────────────┐ │
│ │ Primary: Household care      │ Secondary: Safe actions    │ │
│ │ - Overall health             │ - Backup now               │ │
│ │ - Data safety summary        │ - Restore from backup      │ │
│ │ - Configuration readiness    │ - Import/export details    │ │
│ │ - Current warning slot       │ - Household configuration  │ │
│ └──────────────────────────────┴───────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│ Compact contextual action rail / last maintenance summary     │ 56px
└──────────────────────────────────────────────────────────────┘
```

Recommended regions:

1. **Settings-owned dashboard root**
   - Fills `.workspace-page-body`.
   - Uses `overflow: hidden`.
   - Uses fixed/bounded grid rows.
   - Does not rely on shared page-body scrolling.

2. **Compact status header**
   - Always visible.
   - Contains `Instellingen` or a softer label such as `Gezinsonderhoud`.
   - Answers the primary question: `Alles is in orde` / `Aandacht nodig`.
   - Includes one short supporting sentence only.

3. **Primary maintenance card**
   - Always visible.
   - Larger left column on desktop.
   - Summarizes system/household readiness, data safety, backup freshness, and any warning.
   - Uses compact rows with status icons/chips.
   - Fixed internal layout; if history/warnings grow, they use a bounded internal list.

4. **Secondary action card**
   - Always visible, but compact.
   - Right column on desktop.
   - Contains entry points, not full workflows:
     - `Back-up opslaan`.
     - `Herstellen vanuit back-up`.
     - `Import/export bekijken` if still needed by the existing functionality language.
     - `Gezinsconfiguratie` / administrative settings entry.
   - Buttons open contextual panels/dialogs.

5. **Contextual workflows**
   - Backup can run inline and update the status slot.
   - Restore/import opens a modal or side panel with file input, warning, confirmation, validation, and destructive button.
   - Detailed validation lists are internally scrollable inside the dialog.

6. **Footer/action rail**
   - Always visible but compact.
   - Shows last maintenance event, next suggested check, or short reassurance.
   - Can include `Meer details` to open a bounded details panel.

Sizing strategy:

- Desktop: two-column main grid, approximately 60/40 or 2fr/1fr.
- Laptop: keep two columns if width allows; reduce copy and card padding.
- Narrow/tablet: use a single fixed-height column stack with tabs/segmented sections, not page scroll. The active section scrolls internally if needed.

Information visible by default:

- Overall state.
- Backup status summary.
- Restore availability summary.
- Household configuration readiness summary.
- Compact action entry points.
- Current warning/error if any.

Information contextual by default:

- File picker.
- Restore warning paragraph.
- Restore confirmation checkbox.
- Validation error list.
- Detailed import/export schema/version metadata.
- Long maintenance history.
- Full administrative forms.

## Alternative compositions considered

### Alternative A — Three-card grid with all actions visible

Layout:

- Header/status row.
- Three equal cards: Data safety, Household configuration, Maintenance actions.
- Export and restore controls remain visible in the Maintenance actions card.

Pros:

- Simple mental model.
- Easy to map current content into cards.
- More visible action affordances.

Cons:

- Still action-heavy.
- Restore controls risk occupying too much vertical height.
- Equal card weight makes destructive restore feel as important as calm status.
- Less aligned with "everything is in order".

Reason not recommended: it preserves too much default visible administrative information and is more likely to drift back into page-body scrolling.

### Alternative B — Minimal status page with one details button

Layout:

- One large status panel: `Alles is in orde`.
- Small row of 2-3 status chips.
- Single `Onderhoud openen` button that reveals all actions contextually.

Pros:

- Strongly reduces default visible information.
- Very calm.
- Easiest to keep inside viewport.

Cons:

- Hides too much functionality.
- Backup/restore discoverability may suffer.
- Users may not understand what Settings contains.

Reason not recommended: although it intentionally reduces visible information, it may over-correct and make important maintenance actions feel hidden.

### Alternative C — Recommended status-first dashboard

Layout:

- Compact primary question/status row.
- Left primary maintenance summary.
- Right compact action entry points.
- Footer/current maintenance strip.
- Contextual dialogs for destructive or detailed flows.

Pros:

- Answers one primary household question.
- Keeps important status visible.
- Keeps actions discoverable without giving them excessive space.
- Stable regardless of backup history, validation errors, or added configuration detail.
- Fits desktop/laptop viewports with explicit row budgets.

Cons:

- Requires deliberate component restructuring.
- Needs careful dialog/side-panel accessibility for restore/import.
- Requires converting current widget-style action blocks into summarized status plus contextual flows.

Reason recommended: it best balances calm household confidence, discoverable maintenance, and viewport stability.

## Overflow strategy for every section

| Section | Overflow strategy |
| --- | --- |
| Settings dashboard root | `overflow: hidden`; fill available page body; no page-level vertical scrolling. |
| Compact header/status row | Fixed height; truncate secondary sentence after one line if needed. |
| Overall status | Fixed card area; show one primary state and at most 2-3 compact facts. Extra detail opens details panel. |
| Backup/export status | Single-line or two-line summary; export action updates reserved status slot. No expanding session log. |
| Restore/import action | Opens contextual dialog/side panel; file picker and confirmation live there. |
| Restore/import validation | Bounded status panel inside dialog; validation list uses internal scroll with max height. |
| Maintenance history | Show latest 2-3 items and `+N meer`; full history in internally scrollable details panel. |
| Household configuration summary | Show compact readiness rows; edit flows open contextual panels. |
| Additional administration actions | Render as compact action tiles with fixed height; details open contextual panels. |
| API-loaded Settings widgets | Do not append as unbounded vertical widgets. Future Settings content must map into fixed regions or contextual details. |
| Error state | Reserved alert slot in main grid. Long messages are summarized; details internally scroll. |
| Success state | Compact reassurance line; never expands page height. |

## Responsive strategy

Desktop / wide laptop:

- Use two-column main grid.
- Keep status row, main grid, and footer/action rail visible.
- Do not increase number of default visible details just because more space is available.

Common laptop / 1366 × 768:

- Reduce card padding and text length.
- Keep only the primary question, status chips, and compact action labels visible.
- Keep destructive/rare workflows contextual.

Narrow / tablet:

- Keep page fixed to viewport.
- Use a single active panel or segmented control inside the Settings-owned area.
- Internally scroll the active panel only if absolutely necessary.
- Hide helper copy before allowing page overflow.

Small height:

- Reduce vertical gaps.
- Collapse explanatory subtitles.
- Keep only primary state, warning slot, backup status, and action rail visible.
- Dialogs should use `max-height` and internal scroll.

## Risks and trade-offs

- **Discoverability risk:** Moving restore/import into contextual flows could make rare actions less obvious. Mitigation: keep compact, clearly labeled action entry points visible.
- **Safety-copy risk:** Reducing default restore warning text must not weaken destructive-action safety. Mitigation: keep the full warning and confirmation inside the restore dialog.
- **Implementation drift risk:** Developers may be tempted to keep the existing widget stack and merely tighten CSS. Mitigation: treat this report as the implementation contract; Settings needs a page-owned dashboard grid, not CSS compression.
- **Future widget risk:** Generic Settings widgets could reintroduce overflow. Mitigation: future Settings functions must be assigned to reserved regions or contextual panels.
- **Status-data risk:** Some proposed status summaries may need data that the current UI does not persist as first-class state. Mitigation: during implementation, use existing available state only; do not add backend features unless a later slice explicitly requests them.

## Recommendation for implementation

For the next implementation slice:

1. Create a Settings-specific dashboard component instead of rendering Settings as a generic widget stack.
2. Make the Settings dashboard root fill the available `.workspace-page-body` and set its own fixed/bounded grid with `overflow: hidden`.
3. Replace the current permanent calendar portability action blocks with:
   - a compact data-safety/status summary;
   - a compact backup action;
   - a restore/import contextual dialog or bounded side panel;
   - a reserved status/validation slot.
4. Merge or compact the generic page header so Settings answers `Is everything in order?` before showing actions.
5. Keep existing functionality: export, restore, file selection, validation feedback, friendly errors, and destructive confirmation.
6. Do not change backend APIs, schema, migrations, or seed data.
7. Validate by checking body/page overflow and common desktop/laptop viewport fit.

## Validation performed

Commands executed with repository-local environment locations configured:

```bash
export DOTNET_CLI_HOME="$PWD/.dotnet-home"
export DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1
export DOTNET_NOLOGO=1
export NUGET_PACKAGES="$PWD/.nuget/packages"
export npm_config_cache="$PWD/.npm-cache"
mkdir -p "$DOTNET_CLI_HOME" "$NUGET_PACKAGES" "$npm_config_cache"
```

Validation/checks:

- Inspected repository instructions in `AGENTS.md` and `.github/copilot-instructions.md`.
- Inspected Settings rendering path, widget catalog, workspace definitions, workspace layout defaults, calendar portability component, and CSS layout/overflow rules.
- Confirmed this was an analysis-only task.
- Confirmed no source implementation files were modified.
- Confirmed no binary files were added.

Programmatic validation is intentionally limited because the requested deliverable is an analysis report, not an implementation. No .NET, npm, Playwright, screenshot, video, or export command was required to produce the analysis.

## Files inspected

- `AGENTS.md`
- `.github/copilot-instructions.md`
- `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx`
- `src/HomeOps.Client/src/workspaces/workspaceModel.ts`
- `src/HomeOps.Client/src/workspaces/workspaceLayout.ts`
- `src/HomeOps.Client/src/widgets/widgetCatalog.ts`
- `src/HomeOps.Client/src/widgets/WidgetRenderer.tsx`
- `src/HomeOps.Client/src/widgets/components/CalendarPortabilityWidget.tsx`
- `src/HomeOps.Client/src/calendarPortability.ts`
- `src/HomeOps.Client/src/styles.css`
- `docs/roadmap/phase-2.md`
- Relevant prior reports found under `docs/reports/` for Settings/product tone and viewport-fit precedent.

## Confirmation that no implementation changes were made

No implementation changes were made. The only repository change from this task is this Markdown analysis report.

## Confirmation that no binary files were added

No binary files were added. No screenshots, videos, PNG, JPG, JPEG, GIF, WEBP, or PDF files were created or committed.
