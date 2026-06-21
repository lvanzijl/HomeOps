import type { HouseholdTask, TaskUrgencyGroup } from './tasksModel';

export function groupTasksByUrgency(tasks: readonly HouseholdTask[], todayIso = new Date().toISOString().slice(0, 10)): readonly TaskUrgencyGroup[] {
  const active = tasks.filter((task) => !task.isCompleted && task.noDateReviewState !== 'Someday' && task.noDateReviewState !== 'Archived');
  const completed = tasks
    .filter((task) => task.isCompleted)
    .sort((a, b) => (b.completedUtc ?? b.updatedUtc).localeCompare(a.completedUtc ?? a.updatedUtc))
    .slice(0, 5);

  const sortByDueThenCreated = (items: HouseholdTask[]) => [...items].sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? '') || a.createdUtc.localeCompare(b.createdUtc));

  return [
    { id: 'overdue', title: 'Overdue', tasks: sortByDueThenCreated(active.filter((task) => task.dueDate !== null && task.dueDate < todayIso)) },
    { id: 'today', title: 'Due Today', tasks: sortByDueThenCreated(active.filter((task) => task.dueDate === todayIso)) },
    { id: 'upcoming', title: 'Upcoming', tasks: sortByDueThenCreated(active.filter((task) => task.dueDate !== null && task.dueDate > todayIso)) },
    { id: 'noDueDate', title: 'Still part of the plan?', tasks: active.filter((task) => task.dueDate === null).sort((a, b) => (a.noDateReviewState === 'NeedsReview' ? 0 : 1) - (b.noDateReviewState === 'NeedsReview' ? 0 : 1) || a.createdUtc.localeCompare(b.createdUtc)) },
    { id: 'completedRecently', title: 'Completed Recently', tasks: completed },
  ];
}
