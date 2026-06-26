# Home Quick Capture Conversation

## Summary
Converted the Home Add Task, Add Event, and Add Shopping Item quick-capture dialogs from compact forms into short micro-conversations while preserving existing Home dashboard placement, existing API calls, validation, and quick completion behavior.

## Preflight Findings
- Repository instructions require focused implementation slices and concise reporting; this slice intentionally avoided roadmap/current-state updates per the prompt.
- Home quick-capture lives in `src/HomeOps.Client/src/home/HomeDashboard.tsx` and uses `createTask`, `createCalendarAgendaEvent`, `loadShoppingList`, and `addShoppingListItem`.
- Existing conversational dialog patterns are represented by task conversation classes, Motivation/Family Goal dialog classes, and Helpful Moments question/choice styles in `src/HomeOps.Client/src/styles.css`.
- Reusable visual primitives already existed: `avatar-editor-backdrop`, `home-capture-dialog`, `task-choice-group`, `dialog-card-in`, and `task-question-in`.
- No code was modified during preflight inspection.

## Interaction Changes
- Home Add Shopping Item now asks “What do we need?” and submits directly with a compact one-step interaction.
- Home Add Task now asks “What needs to be done?” then “Who should do it?” before submitting; due date remains Today.
- Home Add Event now asks “What is happening?” then “When?” with Today, Tomorrow, and Pick date choices.
- Dialog copy points users toward dedicated pages for detailed editing without adding extra questions.

## Implemented
- Added Home-only conversation step state for task and event quick capture.
- Preserved shopping list, task, and agenda API paths and refresh behavior after creation.
- Added Home-specific conversation styles that reuse existing dialog animation and choice-group patterns.
- Updated focused HomeDashboard tests for quick-capture API preservation, interaction flow, and Escape dismissal.

## Verified
- `npm --prefix src/HomeOps.Client test -- HomeDashboard.test.tsx --run`
- `npm --prefix src/HomeOps.Client run build`

## Risks
- Home task owner selection now includes quick ownership in the create payload when selected; the default remains Unassigned.
- Event Today/Tomorrow selections submit immediately by design, so users who need richer scheduling should continue using Agenda.

## Modified Files
- `src/HomeOps.Client/src/home/HomeDashboard.tsx`
- `src/HomeOps.Client/src/home/HomeDashboard.test.tsx`
- `src/HomeOps.Client/src/styles.css`
- `docs/reports/2026-06-24-home-quick-capture-conversation/2026-06-24-home-quick-capture-conversation.md`

## Next Prompt Context
Continue with dedicated page work only if a future slice explicitly requests it. This slice intentionally did not alter Tasks, Agenda, Shopping, Motivation, Helpful Moments, roadmap, or current-state documentation.
