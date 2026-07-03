# Marketing Agenda Briefing Storyboard Update

## Executive Summary
Reviewed the Agenda marketing scene against the completed Agenda Planning Briefing redesign and found the previous scene was directionally correct but still gave Month too much screen-time. The updated storyboard now treats Agenda as a household briefing first: Today is dominant, This Week is quieter reassurance, Vooruitkijken shows preparedness, and Planning tools are present without turning the scene into a calendar-mode demo.

## Current Agenda Scene Assessment
The existing scene already removed Week/List mode touring and made Planning the default entry. However, the executable recording still opened Month before adding Filmavond and returned from Month afterward. That made the viewer spend valuable seconds inside calendar navigation instead of remembering the core FamilyBoard question: what does our family need to know next?

## Marketing Effectiveness Analysis
The strongest Agenda marketing scene is not a Month lookup followed by event creation. It is a calm briefing that shows the family immediately understands today, feels reassured about the rest of the week, sees that later items remain under control, and only uses planning tools when a new appointment needs to be added.

The revised scene spends less time in Agenda overall, reduces preferred Agenda duration from 14 seconds to 12 seconds, removes the Month detour from the executable recording, and keeps Month visible only as a contextual tool in the Planning tools region.

## Five-Second Viewer Takeaway
Five minutes later, the viewer should remember: “FamilyBoard tells the family what matters today and what is coming next, without making them manage a calendar.”

The scene should demonstrate: **What does our family need to know next?**

It should not demonstrate: **Look at our calendar.**

## Story Improvements
- Today now explicitly carries the dominant briefing role.
- This Week is framed as quieter day-grouped reassurance.
- Vooruitkijken is named as preparedness rather than a generic Later bucket.
- Planning tools are shown as available only when needed.
- Month remains a contextual option but no longer receives recording time.
- Filmavond is added through `Afspraak plannen`, matching the final implemented Planning tools IA.

## Storyboard Changes
Updated the canonical storyboard to reflect the final Planning Briefing composition, including `Vandaag briefing`, `Deze week`, `Vooruitkijken`, `Planning tools`, `Afspraak plannen`, `Datum kiezen`, `Maand bekijken`, and source filters. The Agenda duration and interaction sequence were tightened to avoid calendar-demo pacing.

## Recording Changes
Updated the executable storyboard so the Agenda scene validates the final briefing structure and records only the briefing-to-planning-tool flow. The recording now validates Today, This Week, Vooruitkijken, Planning tools, Week/List absence, and Month availability without opening Month.

## Obsolete Agenda Story Removed
Removed the executable Month-opening action and the pause inside Month from the Agenda recording sequence. Removed storyboard direction that instructed the camera to open Month, stay there, and return from it. Removed the header-add-event framing from the Agenda story and replaced it with Planning tools / `Afspraak plannen`.

## Validation Performed
- `node tools/marketing-recording/storyboards/marketing-preview-v1.mjs` — passed with 9 scenes, 82,000 ms preferred total duration, 90,000 ms maximum duration, and no warnings.
- `rg -n "show-month|pause-month|Gebeurtenis toevoegen|header add|This Week|Next Week|Week view|List view|\bWeek\b|\bLijst\b|Maand bekijken" docs/design/marketing-storyboard-v1.md tools/marketing-recording/storyboards/marketing-preview-v1.mjs` — reviewed Agenda storyboard and executable recording terms for obsolete calendar-demo assumptions. Remaining references are intentional: the dialog is still named `Gebeurtenis toevoegen`, Week/List are negative assertions, and `Maand bekijken` remains visible as contextual Planning tools copy.
- `git diff --stat` — verified the changeset is limited to storyboard, recording flow, report, and repository state documentation.

## Files Modified
- `docs/design/marketing-storyboard-v1.md`
- `tools/marketing-recording/storyboards/marketing-preview-v1.mjs`
- `docs/reports/2026-07-03-work/marketing-agenda-briefing-storyboard-update.md`
- `docs/state/current-state.md`

## Recommendation
Use the revised Agenda scene. It is stronger than the previous version because it makes the unique FamilyBoard philosophy visible faster and avoids spending scarce marketing time on generic calendar navigation.

## Application Functionality Confirmation
No React application code, backend code, API contracts, database schema, migrations, or runtime functionality changed.

## Binary/Generated Media Confirmation
No marketing video, screenshots, audio files, or binary files were produced or committed.
