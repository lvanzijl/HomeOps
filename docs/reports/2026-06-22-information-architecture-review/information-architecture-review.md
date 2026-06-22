# Information Architecture Review

Date: 2026-06-22

Evidence reviewed:

- `AGENTS.md`
- `CLAUDE.md`
- `.github/copilot-instructions.md`
- `docs/architecture.md`
- `docs/state/current-state.md`
- `docs/reports/2026-06-22-full-visual-system-review/full-visual-system-review.md`
- `docs/reports/2026-06-22-summary-vs-detail-review/summary-vs-detail-review.md`
- `docs/reports/2026-06-22-child-workspace-summary-vs-detail-review/child-workspace-summary-vs-detail-review.md`
- `docs/reports/2026-06-22-motivation-overview-detail-separation/implementation.md`
- `docs/reports/2026-06-21-home-screen-ux-review/home-screen-ux-review.md`
- Current workspace model and shell wiring in `src/HomeOps.Client/src/workspaces/workspaceModel.ts` and `src/HomeOps.Client/src/workspaces/WorkspaceShell.tsx`

## Executive Summary

The current HomeOps page structure is too broad for how families are likely to use the product. The product has correctly moved toward **Dashboard First**, **Execution First**, **Review First**, and **Overview First**, but the navigation model still exposes too many destinations as if they were equally important daily workspaces.

The long-term information architecture should separate:

1. **Primary daily surfaces** — destinations families intentionally visit during normal household operation.
2. **Secondary workflow surfaces** — destinations that matter, but only when a specific mode or weekly cadence is active.
3. **Contextual surfaces** — pages entered from a person, card, status, or action rather than from permanent global navigation.
4. **Administration** — setup, portability, preferences, and management tasks.

Recommended top-level navigation:

- **Home**
- **Agenda**
- **Tasks**
- **Lists**
- **Motivation**

Recommended non-primary placement:

- **Weekly Reset** — secondary workflow, entered from Tasks and Home review prompts.
- **Child Workspace** — contextual, entered through family members / child profile selection.
- **Settings** — administration, not primary navigation.
- **Media** — contextual content/event subtype unless it becomes a recurring household planning domain.
- **House Status** — dashboard module/contextual alert surface until real sensor/device state exists.
- **Gamification** — should not be a top-level destination; it is a capability of Motivation and child/family progress.

The recommended next step is **D. Hybrid approach**: keep the current functional routes stable, but refactor global navigation into primary + secondary/admin/contextual entry points. This reduces shell clutter without forcing a risky domain rewrite.

## Current Architecture

The current workspace model defines these navigation destinations: Home, Agenda, Lists, Tasks, Motivation, House Status, Media, Gamification, Weekly Reset, and Settings.

| Page | Current role | Current IA concern |
| --- | --- | --- |
| Home | Today-oriented family overview and dashboard. | Correctly primary, but global nav competes with Home's dashboard job. |
| Agenda | Full calendar browsing and event management surface. | Correctly primary because schedules are a daily/near-daily family need. |
| Tasks | Urgency-first household responsibility execution page. | Correctly primary because tasks are an operational daily surface. |
| Lists | Household lists, currently centered on shopping execution and list management. | Correctly primary if framed as reusable household lists, not only shopping admin. |
| Motivation | Family goals, encouragement, progress, celebration, helpful moments, and personal goals. | Primary if treated as the emotional/progress hub; too broad if split into gamification destinations. |
| Child Workspace | Child-owned page with progress, today tasks, family participation, helpful moments, and parent mode. | Should be contextual through a family member, not a global peer of adult operational pages. |
| Weekly Reset | Parent-facing review and maintenance workflow for stale tasks, goals, shopping, and recap. | Important but cadence-based; should not occupy permanent primary nav. |
| Media | Placeholder for media reminders and future household media context. | Not currently a real product area; should not compete with operational domains. |
| House Status | Placeholder for home alerts, sensors, and device state. | Not currently a first-class workspace; best as dashboard module/alert context. |
| Settings | Workspace configuration, calendar export/restore, and household preferences placeholder. | Administration; should be available but not primary. |
| Gamification | Placeholder for points, rewards, and progress after Tasks mature. | Should not be a top-level product area; overlaps Motivation. |

## Daily Use Analysis

| Page | Likely frequency | Rationale |
| --- | --- | --- |
| Home | Daily / many times per day | The family dashboard answers what matters today and should be the default start surface. |
| Agenda | Daily to weekly | Families need schedule awareness daily; deeper event management is less frequent but the schedule itself is core. |
| Tasks | Daily | Household responsibilities need execution, completion, and quick review. |
| Lists | Daily to weekly | Shopping and household lists are frequently checked and updated, especially before errands. |
| Motivation | Daily to weekly | Progress and encouragement can be daily emotional context, but deep goal management is occasional. |
| Child Workspace | Daily for children, occasional for adults | Children may use it frequently, but adults should reach it through a selected child rather than global nav. |
| Weekly Reset | Weekly | Purpose-built review flow; daily presence would overstate its cadence. |
| Media | Occasionally / rarely | Media reminders are episodic and may already fit Agenda or Home reminders. |
| House Status | Occasionally, event-driven | Families respond to alerts or state changes; they do not browse status without meaningful live data. |
| Settings | Rarely | Setup, export/restore, and preferences are administrative tasks. |
| Gamification | Should not be separate | The relevant behaviors are daily/weekly, but the destination should be Motivation/Child progress, not a standalone page. |

## Primary Navigation Analysis

Primary navigation should contain pages that meet most of these criteria:

- A family member can name the destination without explanation.
- The destination supports daily or near-daily intent.
- The destination contains broad, durable product value rather than a single workflow.
- The destination is not merely configuration, history, or a placeholder.
- The destination is useful from many states, not only after a specific card or person selection.

### Home

Home deserves permanent top-level navigation. It is the product's default orientation surface and the place where families answer “what matters today?”

### Agenda

Agenda deserves permanent top-level navigation. Schedule awareness is a core household behavior, and dedicated agenda depth is justified beyond the Home preview.

### Tasks

Tasks deserves permanent top-level navigation. The recent Execution First work makes it a daily operational page rather than a management catch-all.

### Lists

Lists deserves permanent top-level navigation if the label remains general and the page continues evolving as durable household lists. If it collapses back into only a shopping-trip feature, it could become secondary under Home/Errands, but the current generic Lists domain justifies primary placement.

### Motivation

Motivation deserves permanent top-level navigation as the family's emotional/progress hub. It should absorb goals, helpful moments, celebration, progress, and memory rather than sending those concepts to separate global destinations.

### Other qualifiers

No other current destination qualifies for permanent top-level navigation. Weekly Reset is high-value but cadence-based. Settings is administrative. Media and House Status are placeholders/contextual modules. Child Workspace is important, but its entry point should be a child/family-member context, not a global adult nav peer.

## Secondary Page Analysis

| Page | Recommended role | Placement |
| --- | --- | --- |
| Weekly Reset | Secondary workflow | Enter from Tasks, Home review prompts, and possibly Motivation when goals need weekly review. |
| Child Workspace | Contextual child surface | Enter through family member chips/profiles and child mode selection. |
| Settings | Administration | Gear/menu, admin drawer, or household menu; not a primary nav pill. |
| Media | Contextual feature/content type | Surface as Agenda events, Home reminders, or a future secondary module if usage proves frequent. |
| House Status | Contextual dashboard module | Surface as Home status/alerts and drill into details only when real devices/sensors exist. |
| Gamification | Capability, not page | Fold into Motivation, Child Workspace, and Home summaries. |

Weekly Reset should remain reachable and named because it is a coherent workflow. The change is prominence, not deletion. Child Workspace should remain a strong product surface for children, but the navigation question is “whose page?” rather than “which module?” Settings should be easy to find but visually quiet.

## Gamification Analysis

Current and planned gamification-related concepts include goals, helpful moments, celebration, progress, memory, points/rewards placeholder language, personal goals, and child contribution. These concepts are not one homogeneous “Gamification” destination.

The strongest product framing is **Motivation**, not **Gamification**:

- Goals are shared family motivation.
- Helpful Moments are appreciation and memory.
- Celebration is a family milestone ritual.
- Progress is a status signal that belongs on Motivation, Home, and Child Workspace.
- Memory is history/detail inside Motivation.

“Gamification” as a top-level destination would likely push the product toward points, rewards, and mechanics before the family value is mature. It would also duplicate Motivation and Child Workspace. Therefore, Gamification should not exist as a top-level destination. If reward mechanics are later introduced, they should be surfaced as capabilities inside Motivation and child/family progress flows.

## Media Analysis

Media is not currently a real product area. It is a placeholder for media reminders and future household media context. Based on current architecture, media is more plausibly one of these:

- An **event subtype** in Agenda, such as a movie night, release date, show reminder, or family media plan.
- A **content type** shown in Home when relevant.
- A **feature module** if the product later supports active household media planning.

Media should not be primary navigation until there is durable evidence that families repeatedly plan, review, and act on media as a standalone household workflow. For now, it should be contextual: media reminders can appear in Agenda/Home, and media detail can be reached from those reminders.

## House Status Analysis

House Status is not currently a first-class workspace. It is a future-facing placeholder for home alerts, sensors, and device state. For real family use, house status is most valuable when it is:

- Exceptional: something needs attention.
- Ambient: a small state is useful to know.
- Contextual: tapping an alert reveals details.

That makes House Status best as a Home dashboard module and contextual detail surface, not as a permanent primary destination. It could become secondary navigation only after the product has real sensor/device data, meaningful alert states, and frequent troubleshooting or monitoring workflows.

## Settings Analysis

Settings does not belong in primary navigation. Families will visit Settings rarely: initial setup, household preference changes, export/restore, device-specific configuration, and occasional maintenance. These tasks are important, but they are not daily household operation.

Settings should be represented as administration:

- A gear icon or household menu.
- A secondary/admin section outside the primary nav row.
- Possibly grouped with setup, export/restore, family management, and future integrations.

Settings should remain stable as a route because administrative tools need reliable access, but it should not occupy the same visual tier as Home, Agenda, Tasks, Lists, and Motivation.

## Child Workspace Analysis

Child Workspace is a real product surface, but it should not be a top-level global area. Its correct mental model is **a child's page**, not **a module called Child Workspace**.

Ideal navigation role:

- Enter from Home family member chips.
- Enter from a family/member switcher.
- Allow a child-friendly mode once a child is selected.
- Keep parent controls behind Parent Mode or a clear management boundary.
- Show child-specific task/progress/motivation context.

This placement matches family behavior: adults think “open Sam's page” or “help Maya check her tasks,” not “go to Child Workspace.” It also prevents a child page from competing with adult household operations in the global nav.

## Target Information Architecture

### Primary Navigation

| Destination | Role | Rationale |
| --- | --- | --- |
| Home | Today dashboard | Default family overview and highest-frequency entry point. |
| Agenda | Schedule workspace | Durable daily/weekly schedule browsing and event management. |
| Tasks | Responsibility execution | Daily operational work and task completion. |
| Lists | Household list execution | Shopping and other durable lists; frequent capture/checkoff. |
| Motivation | Family progress and encouragement | Goals, celebration, helpful moments, memory previews, and emotional status. |

### Secondary Navigation

| Destination | Role | Entry points |
| --- | --- | --- |
| Weekly Reset | Weekly parent review workflow | Tasks, Home review prompt, Motivation review cue if needed. |
| Family members index / switcher, if introduced | Person selection and household member access | Home family strip, household menu. |
| Integrations, if introduced later | Optional connected sources | Settings/admin only until usage becomes operational. |

### Contextual Navigation

| Surface | Role | Entry points |
| --- | --- | --- |
| Child page / Child Workspace | Child-specific daily experience | Family member chip/profile, child mode selector. |
| Family goal detail | Motivation detail | Motivation overview, Home motivation card. |
| Helpful Moments detail/authoring | Appreciation workflow/history | Motivation, Child parent mode, celebration context. |
| Celebration memory history | History/detail | Motivation celebration/memory preview. |
| Media detail | Event/content detail | Agenda event, Home reminder, future media card. |
| House Status detail | Alert/status detail | Home status card or alert. |
| Task templates / recurrence / Someday | Task management detail | Tasks secondary controls. |
| List settings / completed / deleted | List management detail | Lists page disclosure/actions. |

### Administration

| Destination | Role | Entry points |
| --- | --- | --- |
| Settings | Preferences, configuration, portability | Gear/household menu/admin nav. |
| Calendar export/restore | Administrative portability | Settings. |
| Family member management | Household setup/admin | Settings or Parent Mode, while preserving child contextual entry. |
| Future source management | Event/list/integration administration | Settings, not primary nav. |

## Migration Risk

### Risks if navigation changes later

- Users may build habits around current top-level buttons if the product is used before IA cleanup.
- Automated tests may assume every workspace is in the primary nav.
- Placeholder pages can create expectations that Media, House Status, or Gamification are near-term product promises.
- Deep links or state identifiers may become harder to preserve if route identity is conflated with nav visibility.
- Moving Child Workspace incorrectly could make child access feel hidden if family member entry points are not strong enough.

### What can safely change

- Visual prominence of navigation entries.
- Grouping of destinations into primary, secondary, contextual, and admin menus.
- Hiding placeholder destinations from primary navigation while preserving internal routes.
- Renaming visible labels for clarity, as long as route IDs remain stable.
- Moving Weekly Reset from global nav to Tasks/Home entry points.
- Representing Settings as a gear/admin menu instead of a primary button.

### What should remain stable

- Home as the default start surface.
- Agenda, Tasks, Lists, and Motivation as durable top-level domains.
- Existing route/workspace identifiers until a deliberate routing migration is planned.
- Family member/child entry through Home or a recognizable person switcher.
- The distinction between overview pages and detail/management workflows.
- The modular monolith and workspace/widget architecture boundaries.

## Recommended Next Step

**D. Hybrid approach**

Do not keep the current structure exactly as-is, because the shell exposes too many destinations and gives placeholders equal weight with real family work. Do not start with a full navigation architecture rewrite either, because the underlying routes and domains are still useful and recent UX work has been focused on page-level hierarchy.

Recommended next slice:

1. Define primary navigation as Home, Agenda, Tasks, Lists, and Motivation.
2. Move Weekly Reset to secondary entry points from Tasks and Home.
3. Move Settings to an admin affordance.
4. Hide Media, House Status, and Gamification from primary navigation until they have real product workflows.
5. Preserve existing route IDs and page implementations to minimize migration risk.
6. Keep Child Workspace contextual through family member selection and make that entry path stronger before removing or hiding any fallback access.

This approach aligns the product shell with real family usage while avoiding unnecessary implementation churn.

## Next Prompt Context

Repository: HomeOps

Recommended model: GPT-5.4

Task type: UX/navigation architecture implementation slice, if implementation is requested next.

Use this review as the source of truth for navigation placement:

- Primary nav: Home, Agenda, Tasks, Lists, Motivation.
- Secondary/contextual/admin: Weekly Reset, Child Workspace, Settings, Media, House Status, Gamification.
- Preserve existing routes and behavior where practical.
- Do not add new domains, persistence, migrations, integrations, authentication, notifications, rewards, points, or visual artifacts.
- Focus only on shell information architecture and navigation grouping.
- Keep Home dashboard, Agenda, Tasks, Lists, and Motivation content behavior unchanged unless explicitly requested.
