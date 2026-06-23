# HomeOps Beta Surface Audit

Date: 2026-06-23  
Branch: `work`  
Review type: product-scope analysis only; no code, navigation, feature, or removal implementation.  
Pre-flight .NET version: `10.0.301`

## Executive Summary

HomeOps beta should be anchored around the family daily loop: Home, Agenda, Tasks, Lists/Shopping, Motivation, Family Members/Avatar identity, Onboarding, and a parent-facing Weekly Reset. Repository evidence shows these are implemented as real interactive surfaces, while House Status, Media, and Gamification are placeholders or future-context surfaces.

The previous full-application visual validation correctly identified several UX issues, but it treated future concepts as if they were current beta surfaces. For beta planning, the product should not optimize navigation around placeholder or explicitly future domains.

Recommended beta surface list:

1. Home.
2. Agenda.
3. Tasks.
4. Lists / Shopping.
5. Motivation.
6. Family Members / Avatar V2.
7. First Run Wizard / household onboarding.
8. Weekly Reset as optional or contextual beta workflow.
9. Settings / Calendar Export-Restore as administration-only beta support, not a family surface.

Screens that should not be part of beta as standalone destinations:

- House Status.
- Media.
- Gamification.

Media should not survive as a separate screen for beta. It may survive as an Agenda event type or event metadata later, but not as a navigation destination.

Gamification should not survive as a separate screen for beta. The accepted direction makes it a supporting mechanism inside other areas, especially Motivation, Tasks, Child/Family Member progress, and celebrations.

Biggest navigation simplification opportunity: remove the secondary future-domain navigation group from the beta mental model. Weekly Reset can become contextual from Tasks/Home, Settings can remain administration-only, and House Status/Media/Gamification should disappear from beta-only navigation.

## Current Surface Inventory

| Surface | Current repository evidence | Classification | Beta action | Rationale |
| --- | --- | --- | --- | --- |
| Home | Primary workspace with “Today’s family overview”; HomeDashboard aggregates agenda, lists, tasks, motivation, quick event capture, quick shopping capture, and family members. | Core Beta Surface | Keep | This is the product anchor and the clearest family-first dashboard. |
| Agenda | Primary workspace with full calendar browsing and event management; backed by Agenda MVP widget and calendar/event APIs. | Core Beta Surface | Keep | Daily family planning requires a calendar. It is mature enough to be a beta pillar. |
| Tasks | Primary workspace with urgency-first household tasks, ownership, templates, lifecycle states, and Weekly Reset entry. | Core Beta Surface | Keep | Practical parent utility and daily household work. Needs tone/hierarchy care, but belongs in beta. |
| Lists / Shopping | Primary workspace using Shopping List MVP widget; Home has quick shopping capture and list summaries. | Core Beta Surface | Keep | Shopping is one of the strongest everyday family utilities. Naming may need future clarification, but the surface belongs. |
| Motivation | Primary workspace for family encouragement goals and warm progress. | Core Beta Surface | Keep | Strongest emotional family-first destination after Home/Family identity. |
| Family Member page / Child Workspace | Contextual page reached from Home family member selection; uses FamilyMember as the primary person entity. | Core Beta Surface | Keep contextual | Essential to family identity; should not become a top-level profile picker. |
| Avatar V2 / Family Avatar | FamilyMember-owned identity renderer/editor path accepted by product decisions. | Core Beta Surface | Keep contextual | Distinctive identity layer; supports family-first product feel. |
| First Run Wizard | Startup path when onboarding is incomplete; gathers household members before Home. | Core Beta Surface | Keep | Required setup path and aligns with family-first/no-profile-picker direction. |
| Weekly Reset | Secondary workspace and contextual workflow from Tasks; parent-facing review of tasks, goals, lists, and recap. | Optional Beta Surface | Keep contextual or optional | Useful for beta testing, but should not drive primary navigation decisions. |
| Settings / Calendar Export-Restore | Administration workspace containing Calendar Export / Restore. | Optional Beta Surface | Keep admin-only | Useful for beta safety and data portability; not a family surface. |
| House Status | Secondary workspace; placeholder page says Coming later / Not implemented yet; roadmap lists Sensor Dashboard Foundation as planned. | Future Surface | Hide / remove from beta | Accepted decision says not beta; current app has no real House Status function. |
| Media | Secondary workspace; placeholder page says Coming later / Not implemented yet; roadmap lists Media/TV Source Foundation as planned. | Future Surface | Remove from beta as screen | Accepted decision says Media is an Agenda event type, not standalone product surface. |
| Gamification | Secondary workspace; placeholder page says Coming later / Not implemented yet; roadmap and validation warn against reward-economy drift. | Future Surface | Remove from beta as screen | Accepted decision says mechanism, not destination. |

## House Status Analysis

### Decision

House Status is not part of beta.

### Is it safe to remove from beta navigation entirely?

Yes. It is safe to remove from beta navigation entirely. The current product evidence shows House Status is a secondary workspace whose description is “For home alerts, sensors, and device state,” and its rendered page is a placeholder. The default layout only contains a house placeholder widget. Phase 2 still lists Sensor Dashboard Foundation as planned, not completed.

### Does anything depend on it?

Only the workspace registry, default layout, placeholder widget, shell conditional rendering, and tests for secondary navigation reachability depend on House Status as a reachable workspace. No beta user workflow appears to depend on House Status content. Removing it from beta navigation would affect reachability and tests, but not an implemented daily family workflow.

### Recommendation

Hide/remove from beta navigation and exclude it from beta UX planning. Keep any underlying route/type only if needed for internal future development, but do not expose it as beta product inventory.

## Media Analysis

### Decision

Media is an Agenda event type.

### Should Media exist as a separate screen?

No. Current repository evidence shows Media is only a secondary workspace with a placeholder widget and placeholder page. It has no implemented household workflow distinct from Agenda.

If Media is an Agenda event type, it belongs inside event creation, event display, filtering, or event metadata. A separate Media screen would incorrectly imply a standalone domain and would compete with Agenda for the same mental model.

### Should Media exist in navigation?

No. It should not exist in beta navigation. It should disappear from beta-only navigation and not influence navigation architecture.

### Recommendation

Remove Media as a beta screen concept. Treat future media support as calendar/agenda semantics unless a later product decision explicitly creates a standalone media job.

## Gamification Analysis

### Decision

Gamification is a mechanism, not a destination.

### Should Gamification exist as a standalone screen?

No. Current repository evidence shows Gamification is a secondary workspace with no default widgets and a placeholder page. The existing family-first motivation system already carries goals, progress, helpful moments, celebration memories, and family encouragement. A top-level “Gamification” destination would pull the product toward points/rewards as a domain, which conflicts with the accepted direction.

### Should Gamification exist in navigation?

No. It should not exist in beta navigation. Any gamified mechanics should be embedded where they reinforce family behavior: Motivation, Tasks, Family Member progress, Weekly Reset, and celebrations.

### Recommendation

Remove Gamification as a beta screen concept. Preserve only embedded mechanisms that support encouragement, progress, and celebration without becoming a reward-economy destination.

## Beta Surface Recommendation

| Surface | Recommendation | Why |
| --- | --- | --- |
| Home | Keep | The primary family overview and daily habit loop. |
| Agenda | Keep | Core shared family time surface. |
| Tasks | Keep | Core operational surface for household work, but should be framed warmly. |
| Lists / Shopping | Keep | Core repeated parent/family utility; shopping is concrete and useful. |
| Motivation | Keep | Essential family-first emotional layer. |
| Family Members / Avatar V2 | Keep contextual | Core identity system; should remain person-first and contextual, not profile-picker-like. |
| First Run Wizard | Keep | Required setup, especially after Profile Picker removal. |
| Weekly Reset | Keep contextual / optional beta | Useful ritual and test surface; should not be equal to daily nav unless beta data proves frequent use. |
| Settings / Calendar Export-Restore | Hide from family navigation; keep admin-only | Important beta safety tool but not part of the family product story. |
| House Status | Remove from beta / hide | Future sensor/device surface; no current beta value. |
| Media | Merge into Agenda as event type; remove as screen | Accepted decision explicitly makes it an event type. |
| Gamification | Merge into Motivation/Tasks/Family progress as mechanism; remove as screen | Accepted decision explicitly makes it supporting mechanism. |

## Navigation Impact

This section intentionally does not redesign navigation. It only identifies what the existing navigation inventory implies for beta-only planning.

### Definitely justified navigation items

- Home.
- Agenda.
- Tasks.
- Lists.
- Motivation.

These are currently primary navigation items and correspond to implemented beta-relevant surfaces.

### Questionable navigation items

- Weekly Reset: useful, but likely contextual from Tasks/Home rather than persistent navigation.
- Settings: useful administration, but not family-facing and should not be visually equal to product surfaces.

### Should disappear in beta-only mode

- House Status.
- Media.
- Gamification.

These are future or mechanism concepts. Keeping them visible would distort beta UX decisions by making the navigation optimize around screens that should not exist in beta.

## Family-First Ranking

| Rank | Surface | Reinforces family identity? | Administrative? | Technical? | Supports daily family use? | Assessment |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Family Members / Avatar V2 | Very high | Low if contextual | Low | High | Strongest identity layer; makes HomeOps about people, not modules. |
| 2 | Home | Very high | Low-medium | Low | Very high | Best beta anchor and daily habit surface. |
| 3 | Motivation | Very high | Medium if forms dominate | Low | Medium-high | Strong family emotion, appreciation, progress, and celebration. |
| 4 | Agenda | Medium-high | Medium | Low-medium | Very high | Daily family coordination; can feel family-first if events are person-aware. |
| 5 | Lists / Shopping | Medium | Medium | Low | Very high | Practical and frequently useful; needs household language to avoid generic utility feel. |
| 6 | Tasks | Medium | High risk | Low-medium | High | Useful but can feel like task administration unless framed around helping the family. |
| 7 | Weekly Reset | Medium | Medium-high | Low | Medium | Good parent ritual; not necessarily daily. |
| 8 | First Run Wizard | Medium-high | Medium | Low | One-time | Important first impression, but setup is inherently administrative. |
| 9 | Settings / Calendar Export-Restore | Low | Very high | Very high | Low | Beta safety/admin support, not a family product surface. |
| 10 | House Status | Low currently | Medium | High | Low until sensors exist | Future technical surface; not beta. |
| 11 | Media | Low currently | Low | Low-medium | Unclear | Belongs in Agenda as event type, not as a surface. |
| 12 | Gamification | Risky | Medium | Medium | Unclear | Should be embedded as encouragement mechanics, not visible destination. |

## MVP vs Beta vs Future Matrix

### MVP

Must exist for a coherent family-first beta candidate:

- Home.
- First Run Wizard / household setup.
- Family Members / Avatar identity.
- Agenda.
- Lists / Shopping.
- Tasks.
- Motivation baseline.

### Beta

Useful for beta testing but should not distort the core IA:

- Weekly Reset.
- Settings / Calendar Export-Restore administration.
- Calendar portability safeguards.
- Helpful Moments and Celebration Memories as part of Motivation.
- Child/Family Member progress as contextual family-member experience.

### Future

Should not influence beta UX decisions:

- House Status / Sensor Dashboard.
- Media as standalone workspace.
- Gamification as standalone workspace.
- Home Assistant / sensors.
- Standalone media/TV source foundation.
- Reward economy, unlockables, or points-centered product loops.

## Risks

1. Visible future screens create expectation debt and make beta look unfinished.
2. A standalone Gamification screen can pull the product away from family encouragement into reward-system design.
3. A standalone Media screen can fracture Agenda semantics before Media has a distinct beta job.
4. House Status can make HomeOps feel like a technical smart-home dashboard instead of a family product.
5. Settings and export/restore are necessary for beta safety but can overemphasize technical administration if too prominent.
6. Tasks and Weekly Reset can become too administrative unless the family-benefit framing remains visible.

## Open Questions

1. Should Weekly Reset be accessible only contextually during beta, or remain in a secondary navigation group for testers?
2. Should Settings be visible to all beta users or tucked behind an explicit admin affordance?
3. Should Lists be labeled “Lists” or “Shopping” for beta clarity, given that the implemented widget is still Shopping List MVP?
4. How should Media event type be represented in Agenda without implying a standalone Media domain?
5. Which gamification mechanisms are acceptable inside Motivation/Tasks without creating a reward economy?

## Next Prompt Context

Use this audit before any navigation or UX cleanup. Treat Home, Agenda, Tasks, Lists/Shopping, Motivation, Family Members/Avatar V2, Onboarding, and optional/contextual Weekly Reset as the beta product inventory. Do not design beta navigation around House Status, standalone Media, or standalone Gamification. If a beta-only navigation cleanup is requested next, the likely slice is to remove future surfaces from user-facing beta navigation while preserving any internal route/type scaffolding only if needed for later development.
