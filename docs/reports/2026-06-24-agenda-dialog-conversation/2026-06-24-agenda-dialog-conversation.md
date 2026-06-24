# Agenda Dialog Conversation Conversion

## Summary

Converted only Agenda event create/edit from the dense modal form into a flow-specific HomeOps conversational dialog. The Agenda widget structure, source filters, week/month views, empty state, delete actions, validation, and create/update API behavior were preserved.

## Interaction Changes

- Replaced the all-fields-at-once event form with a compact sequence:
  - “What is happening?” for the required event title.
  - “When should the family remember it?” for date selection with Today, Tomorrow, and Pick date affordances.
  - “Is it all day?” for all-day versus timed event choice.
  - “Any details?” for optional description and final summary.
- Kept Back, Continue, Create event, and Save event as the only primary flow actions.
- Preserved editing prefill so existing title, date, all-day state, and timed values appear in the conversation.
- Kept the existing tinted dialog overlay and Escape-to-close behavior.

## Implemented

- Added Agenda-local conversation state and question progression without introducing shared dialog infrastructure.
- Added helper functions for moving between conversation questions, updating date/time values, summarizing the draft event, and preserving all-day/timed conversion behavior.
- Kept `toEventSeriesInput`, `validateEventForm`, `toAllDayState`, API create/update calls, and delete behavior in place.
- Updated focused Agenda tests to cover creation, edit prefill, required title gating, all-day payloads, timed payloads, timed validation, API validation errors, delete failures, source filters, empty guidance, and Escape close behavior.

## Verified

- `dotnet --version` returned `10.0.301`.
- `npm --prefix src/HomeOps.Client test -- AgendaWidget.test.tsx` passed.
- `npm --prefix src/HomeOps.Client run build` passed.
- `npm --prefix src/HomeOps.Client test -- HomeDashboard.test.tsx AgendaWidget.test.tsx` passed.

## Risks

- The dialog is still flow-specific and intentionally duplicates some conversational styling conventions from Tasks until a future generic pattern is explicitly requested.
- Date/time values still rely on the existing local input/string conversion behavior; no broader calendar semantics were changed.
- All-day multi-day events remain available through the all-day detail step, but recurring events are still outside this slice.

## Modified Files

- `src/HomeOps.Client/src/widgets/components/AgendaWidget.tsx`
- `src/HomeOps.Client/src/widgets/components/AgendaWidget.test.tsx`
- `docs/reports/2026-06-24-agenda-dialog-conversation/2026-06-24-agenda-dialog-conversation.md`

## Next Prompt Context

If continuing the migration roadmap, the next recommended slice is Motivation family goal create/edit. Keep that conversion flow-specific, preserve existing progress and celebration behavior, and avoid introducing shared dialog infrastructure until multiple converted flows have stabilized.
