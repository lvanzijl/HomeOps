# Marketing Agenda IA Storyboard Update

## Summary
Updated the canonical marketing storyboard and executable recording storyboard so the Agenda scene reflects the implemented Planning-first Agenda information architecture. The scene now presents Agenda as a household briefing, uses Month only through the contextual `Maand bekijken` action for the Filmavond planning beat, adds Filmavond from the implemented header control, and returns to Planning.

## Files changed
- `docs/design/marketing-storyboard-v1.md`
- `tools/marketing-recording/storyboards/marketing-preview-v1.mjs`
- `docs/state/current-state.md`
- `docs/reports/2026-07-03-work/marketing-agenda-ia-storyboard-update.md`

## Agenda storyboard changes
- Changed the Agenda scene purpose from a broad week/calendar view into a Planning-first household briefing.
- Updated the Agenda chapter subtitle to `What the family needs to know next`.
- Reframed the visual focus around today/next/upcoming information, contextual Month access, the header add-event control, the saved Filmavond event, and the returned Planning overview.
- Preserved the same marketing narrative purpose: family planning is clear, Filmavond fits into the household rhythm, and Agenda reads as a FamilyBoard planning briefing rather than generic calendar software.

## Recording selector/flow changes
- Added executable validation that Agenda opens on `Planningoverzicht` by default.
- Added executable validation that `Week` and `Lijst` primary mode buttons are not visible in the Agenda scene.
- Kept `Maand bekijken` as the only Month entry point and validated `Maandplanning` after it is opened.
- Kept Filmavond creation on the implemented `.agenda-command-main` header `Gebeurtenis toevoegen` button.
- Kept save validation tied to the real `/api/events` POST response and the saved `Filmavond` event becoming visible.
- Updated the return action metadata to explicitly return to the Planning overview through `Terug naar planning`.

## Obsolete Week/Month/List assumptions removed
- Removed storyboard language that treated Agenda as Today / This Week / Next Week scene movement.
- Removed the remaining Month/Week/List feature-tour framing from the canonical storyboard checklist language.
- Confirmed the executable Agenda scene no longer taps Week, validates Week, opens List, or depends on the old selected-day add-event ownership.

## Validation performed
- `node tools/marketing-recording/storyboards/marketing-preview-v1.mjs` — passed storyboard metadata and recording-plan validation with 9 scenes, 84,000 ms preferred total duration, and no warnings.
- `rg -n "Month / Week / List|Month, Week|Week, List|tap.*Week|Week view|List view|Gekozen dag|selected-day|selected day|Agenda weergave|\\bWeek\\b|\\bLijst\\b|This Week|Next Week|Maand / Week / Lijst" docs/design/marketing-storyboard-v1.md tools/marketing-recording/storyboards/marketing-preview-v1.mjs docs/reports/2026-07-03-work/agenda-strategic-ux-research-analysis.md` — checked target storyboard/recording files for obsolete Agenda scene assumptions. Remaining Week/List references in changed files are intentional negative assertions or explicit “not shown” direction; the approved strategic analysis remains unchanged as source material.

## Any next mismatch found
No next storyboard mismatch was exposed by the lightweight executable storyboard validation. A full publish/recording run was not performed because the task requested storyboard/recording-flow updates only and prohibited producing the marketing video.

## Application functionality confirmation
No React application code, backend code, API contracts, database schema, migrations, or seeds were modified.

## Binary/generated media confirmation
No screenshots, audio files, video files, or other binary/generated media were produced or committed.
