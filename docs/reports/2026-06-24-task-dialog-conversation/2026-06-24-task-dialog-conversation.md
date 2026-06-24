# 2026-06-24 Task Dialog Conversation

## Summary
Redesigned only the Task create/edit dialog into a lightweight conversational flow that asks one primary question at a time while preserving existing task persistence and validation behavior.

## Interaction Changes
- Starts with “What needs to be done?” and keeps the title as the only required typed field.
- Moves ownership, timing, and recurrence into separate focused questions.
- Uses Today as the default due date for new tasks and keeps simple date shortcuts for Today, Tomorrow, and Someday.
- Keeps recurrence optional under “Anything else?” so it does not interrupt the primary flow.
- Uses compact Back/Continue/Create or Save actions instead of a full form button bar.

## Implemented
- Added local Task dialog question state without introducing a shared dialog framework.
- Reused the existing Task create/update submit path and payload construction.
- Added conversation-specific Task dialog styling for compact question panels, choice buttons, summary copy, and gentle transitions.
- Added focused tests covering guided creation, editing, validation gating, and Escape close behavior.

## Verified
- Ran focused Task page tests.
- Ran the frontend production build.
- Confirmed no new binary artifacts were added.

## Risks
- The Task dialog is now the reference interaction pattern, but Agenda and Motivation still use the previous form-in-dialog presentation until future slices.
- The local implementation intentionally duplicates some interaction structure to avoid a premature generic dialog framework.

## Modified Files
- `src/HomeOps.Client/src/tasks/TasksPage.tsx`
- `src/HomeOps.Client/src/tasks/TasksPage.test.tsx`
- `src/HomeOps.Client/src/styles.css`
- `docs/state/current-state.md`
- `docs/roadmap/phase-2.md`
- `docs/reports/2026-06-24-task-dialog-conversation/2026-06-24-task-dialog-conversation.md`

## Next Prompt Context
The Task dialog now serves as the HomeOps reference for conversational creation: one question at a time, smart defaults, optional details at the end, and compact transitions. Future slices can apply this pattern to Agenda, Motivation, and appropriate future Home dialogs without introducing a generic dialog framework until more surfaces converge.
