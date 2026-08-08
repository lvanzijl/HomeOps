# Phase 5 Slice 5.2 — Woning navigation and viewport analysis

**Status:** Approved implementation authority for Slice 5.2.

## Current composition and reachability defect

The global FamilyBoard shell reserves two rows: a wrapping navigation band and one `minmax(0, 1fr)` workspace panel. Five daily workspaces are visible in the primary navigation; Settings is isolated in the administration group. `house` already has a complete summary and climate runtime, domain colour, API adapter, component tests, and fixed-height CSS, but its navigation role is `internal`. There is no visible user action or stable URL that can open it.

Inside the hidden Woning workspace, the summary is a short story-first introduction plus one climate status card. That card opens a detailed runtime composed of a fixed climate header, horizontally scrolling floor tabs, a compact floor-summary strip, and a remaining-height three-column grid: floor plan, internally scrolling room list, and internally scrolling selected-room detail. Story context, when present, occupies the detail column. Heating commands already remain inside the selected-room region and a bounded modal.

The page itself does not currently exceed its reserved viewport. The product defect is that the composition is unreachable and its async states are incomplete. Promoting it without a deliberate contract risks widening/wrapping the nav band, allowing summary copy to grow, or replacing the existing internal overflow owners with document scrolling.

## Primary and secondary information

Primary information that must remain visible:

- the global primary navigation, including a clearly labelled `Woning` destination;
- on the summary: page identity, climate load/health state, and the one relevant next action;
- on climate detail: back, refresh, floor selection, compact floor status, and stable boundaries for plan/list/detail;
- truthful distinction between no house data, unconfigured rooms, degraded/unavailable providers, and a request failure.

Secondary information that may be compacted or internally scrolled:

- individual floor statistics beyond the compact status pills;
- floor-plan content;
- room volume and room facts;
- heating capability explanations and command history;
- story context details.

Those secondary regions must keep their existing component-level overflow. They must never increase the document or workspace height.

## Approved navigation decision

`Woning` becomes a sixth primary navigation destination. Climate status and temporary heating actions are normal household runtime, not administration. Hiding them under Settings would conflate daily observation/control with setup and would keep the feature undiscoverable. Adding a Home card would consume scarce Home dashboard space and make reachability dependent on a second page.

Top-level workspace navigation receives one shared path mapping rather than a Woning-only router:

- `/` — Thuis;
- `/agenda` — Agenda;
- `/taken` — Taken;
- `/boodschappen` — Boodschappen;
- `/motivatie` — Motivatie;
- `/woning` — Woning summary;
- `/woning/klimaat` — detailed climate runtime;
- `/instellingen` — Settings;
- `/weekritueel` — contextual Weekly Reset.

The shell owns initial path resolution, push-state navigation, and `popstate`. Unknown paths safely replace to `/`. This is a deliberately small top-level foundation for Slice 7.1, not a second navigation system. Member/editor/dialog deep links remain outside this slice.

## Approved viewport composition

The shell remains a fixed two-row grid. The sixth nav button uses the existing compact primary-button style; at 1366 pixels the six labels plus back-slot and Settings control fit on one line with substantial reserve. Existing responsive wrapping remains a narrow-screen fallback and is not used by the required desktop/laptop viewports.

The Woning summary remains one fixed-height, overflow-hidden article. Its climate card owns the async presentation:

- loading: explicit busy/status text, no ready action;
- empty: no floors, concise setup explanation, Settings action only;
- available: compact counts and `Klimaat bekijken`;
- degraded: attention wording plus unavailable/stale counts, still allowing read-only inspection;
- error: alert, retry, and no false ready state.

The detailed climate runtime retains the existing fixed header/tabs/summary/three-column grid. If no floors exist, the remaining grid region becomes one bounded empty panel with a Settings action. Unconfigured rooms continue to show their existing explicit explanation, and heating controls remain unavailable until backend capability says they are safe. Degraded providers retain factual room data and blockers without exposing controls as ready. Request failures remain a bounded retry state.

At 1440×900 and 1366×768, global height is bounded by the app shell, Woning height is `100%`, and every variable collection remains in `.climate-plan-panel`, `.climate-room-list`, `.room-detail`, or a bounded dialog. No proposed region uses content height to resize the page.

## Risks, trade-offs, and rejected alternatives

- Six primary destinations increase nav density. The labels are short and fit the required viewports; adding icons or a second nav row is unnecessary.
- A full routing library would be disproportionate and could conflict with Slice 7.1. A typed central mapping covers only current top-level workspaces.
- Settings-only reachability was rejected because runtime climate and safe heating actions are not configuration tasks.
- A Home-only entry was rejected because it weakens stable reachability and would require a separate Home viewport redesign.
- Automatically exposing heating controls for an unavailable or unconfigured room is explicitly prohibited; backend capability remains authoritative.
- The existing three-column climate layout is retained. Redesigning its information architecture is outside this slice and would invalidate established climate tests.

## Implementation contract

Implementation must promote `house` to primary navigation as `Woning`, add the shared top-level path mapping and browser-history behavior, preserve the existing climate grid and overflow owners, and add the five truthful async/configuration states without implementing climate configuration, mapping management, floor-plan upload, or provider lifecycle. Browser validation must cover both `/woning` and `/woning/klimaat`, refresh/deep-link/back behavior, and zero document vertical overflow at 1440×900 and 1366×768.
