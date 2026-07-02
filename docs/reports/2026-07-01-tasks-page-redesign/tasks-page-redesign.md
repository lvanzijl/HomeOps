# Tasks Page Redesign

## Summary

The Tasks page was refined into a Today-first household work surface that better matches the supplied mockup while preserving existing task behavior. The desktop dashboard now keeps `Vandaag`, `Morgen`, and `Deze week` as the primary scan path, gives `Vandaag` the widest and richest column, and moves less immediate groups such as later planning and recent completion into a secondary timeline below the three-column focus area. Task cards use progressive disclosure so actions appear only after a task is selected.

## Problems Identified

- Excessive repeated action buttons made the task list feel noisy and reduced confidence about where to click first.
- The visual hierarchy relied too much on headings and color rather than column size, card richness, and whitespace.
- Tomorrow and This Week needed to remain visible as planning columns, but they should not compete with Today for attention.
- Dense metadata and always-visible controls slowed scanning, especially in the planning columns.
- The previous dashboard could allow later planning groups to compete with the intended three-column Today/Tomorrow/This Week structure.

## Design Decisions

- `Vandaag` remains the primary focus column because it answers the parent's first question: what needs attention now.
- `Morgen` and `Deze week` are kept as lighter planning columns so near-future work remains visible without becoming the dominant surface.
- Later and completed groups remain available, but they are placed in a secondary timeline below the main three-column scan path.
- Selectable task cards were chosen over always-visible controls to reduce repeated UI while keeping completion, Morgen, edit, and recurring-series actions available.
- Planning cards hide lower-priority metadata by default so parents can scan titles and timing faster.

## Layout Changes

- The desktop dashboard uses a three-column proportion biased toward Today: a wide primary column plus two narrower planning columns.
- Today cards are slightly larger and richer than planning cards, with more internal spacing and stronger selected-state treatment.
- Tomorrow and This Week cards are more compact, preserving readability while communicating that they can wait.
- Task actions are stacked vertically on the right side of a selected card.
- Equal dashboard gaps, consistent column min-height, and pastel column backgrounds reinforce rhythm without redesigning the rest of the application.

## Interaction Changes

- Clicking or keyboard-selecting a task toggles its selected state.
- Only the selected card reveals task actions; clicking the page background clears selection.
- Progressive disclosure was chosen because primary task information should always be visible, while actions are only needed after the parent has chosen a task.
- The actions still call the existing lifecycle handlers, so functionality is preserved while the repeated visible controls are removed.

## Consistency Review

Similar repeated-action density may appear in maintenance-oriented lists such as Weekly Reset review rows, template management rows, and shopping/list management areas. Future improvements should consider shared progressive-disclosure or compact action-menu patterns for those surfaces, but this slice intentionally modifies only the Tasks page.

## Validation

- No backend changes were made.
- No API changes were made.
- No database/schema changes were made.
- No routing or validation changes were made.
- Completion, reopen, Morgen, edit, recurring-series delete, template, Weekly Reset, Someday, and archive/review functionality remain available through existing handlers.
- Desktop responsiveness is preserved with the wide three-column layout collapsing to a single-column layout on narrower screens.

## Files Modified

- `src/HomeOps.Client/src/tasks/TasksPage.tsx` — adds task selection state, Today/Tomorrow/This Week dashboard composition, secondary timeline placement, and selected-card action disclosure.
- `src/HomeOps.Client/src/styles.css` — updates Tasks-only column proportions, card density, action disclosure, selected states, spacing, and responsive behavior.
- `docs/state/current-state.md` — records the completed implementation state.
- `docs/roadmap/phase-2.md` — records the completed Phase 2 slice.
- `docs/reports/2026-07-01-tasks-page-redesign/tasks-page-redesign.md` — documents the redesign decisions, validation, and consistency review.

## Desktop Layout Evaluation

The previous stacked layout was reconsidered because it solved the primary Today focus but made the full planning horizon require a second vertical scan. That worked on medium screens, but on wide desktop and wall-tablet layouts it left useful horizontal space unused while placing Later and Completed below the first dashboard.

Evaluated layouts:

- Three-column dashboard plus secondary row: strongest for Today focus, but weaker for one-glance planning.
- Equal five-column dashboard: maximized one-glance visibility, but made Today feel too similar to lower-priority queues.
- Weighted five-column dashboard: selected as the final direction because it keeps Today dominant while keeping Tomorrow, This Week, Later, and Completed/Review visible across the same desktop row.

The final desktop composition uses one horizontal dashboard with priority communicated through width and density rather than stacking. Today remains the active workspace, Tomorrow and This Week remain planning columns, and Later/Completed behave like compact queues.

## Horizontal Space Analysis

Available desktop width is now used by five weighted columns instead of reserving later/completed work for a second dashboard below. The column proportions intentionally protect Today first, then reduce space progressively for Tomorrow, This Week, Later, and Completed.

This creates a better desktop experience because the parent can scan the whole task horizon from left to right without losing the visual priority of Today's work. Hierarchy is reinforced through:

- Wider Today column and larger Today cards.
- Medium-width Tomorrow and This Week cards.
- Compact Later and Completed queue cards.
- Reduced metadata in planning and compact queues.
- Continued selected-card-only actions so columns do not fill with repeated controls.

## UX Outcome

The refined layout improves parent usability by:

- Increasing scan speed with the full planning horizon visible in one horizontal pass.
- Keeping today's work visually dominant through width, whitespace, and card size.
- Preserving reduced visual noise through progressive disclosure.
- Making Tomorrow and This Week easy to understand without competing with Today.
- Treating Later and Completed as compact queues instead of active workspaces.
- Using desktop space more efficiently and reducing unnecessary vertical growth.
