import type { HouseholdTask, TaskTimeGroup } from './tasksModel';

const dayInMilliseconds = 24 * 60 * 60 * 1000;

export function groupTasksByTime(tasks: readonly HouseholdTask[], todayIso = new Date().toISOString().slice(0, 10)): readonly TaskTimeGroup[] {
  const active = tasks.filter((task) => !task.isCompleted && task.noDateReviewState !== 'Someday' && task.noDateReviewState !== 'Archived');
  const completed = tasks
    .filter((task) => task.isCompleted)
    .sort((a, b) => (b.completedUtc ?? b.updatedUtc).localeCompare(a.completedUtc ?? a.updatedUtc))
    .slice(0, 5);

  const sortByDueThenCreated = (items: HouseholdTask[]) => [...items].sort((a, b) => (a.dueDate ?? '9999-12-31').localeCompare(b.dueDate ?? '9999-12-31') || a.createdUtc.localeCompare(b.createdUtc));
  const today = parseDateOnly(todayIso);

  const groups: TaskTimeGroup[] = [
    {
      id: 'today',
      title: 'Vandaag',
      description: 'Nu eerst: alles wat vandaag aandacht nodig heeft.',
      emptyMessage: 'Vandaag is alles gedaan.',
      emphasis: 'primary',
      tasks: sortByDueThenCreated(active.filter((task) => task.dueDate !== null && daysFromToday(task.dueDate, today) <= 0)),
    },
    {
      id: 'tomorrow',
      title: 'Morgen',
      description: 'Klaarzetten zonder de dag drukker te maken.',
      emptyMessage: 'Geen taken gepland voor morgen.',
      emphasis: 'normal',
      tasks: sortByDueThenCreated(active.filter((task) => task.dueDate !== null && daysFromToday(task.dueDate, today) === 1)),
    },
    {
      id: 'thisWeek',
      title: 'Deze week',
      description: 'Binnenkort, maar niet meteen nu.',
      emptyMessage: 'Deze week staat er verder niets open.',
      emphasis: 'normal',
      tasks: sortByDueThenCreated(active.filter((task) => {
        if (task.dueDate === null) return false;
        const difference = daysFromToday(task.dueDate, today);
        return difference >= 2 && difference <= 6;
      })),
    },
    {
      id: 'nextWeek',
      title: 'Volgende week',
      description: 'Rustig vooruit kijken.',
      emptyMessage: 'Geen taken gepland voor volgende week.',
      emphasis: 'quiet',
      tasks: sortByDueThenCreated(active.filter((task) => {
        if (task.dueDate === null) return false;
        const difference = daysFromToday(task.dueDate, today);
        return difference >= 7 && difference <= 13;
      })),
    },
    {
      id: 'later',
      title: 'Later',
      description: 'Nog niet voor vandaag of deze week.',
      emptyMessage: 'Niets voor later op dit moment.',
      emphasis: 'quiet',
      tasks: sortByDueThenCreated(active.filter((task) => {
        if (task.dueDate === null) return true;
        return daysFromToday(task.dueDate, today) >= 14;
      })),
    },
    {
      id: 'completedRecently',
      title: 'Afgerond',
      description: 'Net klaar, zodat terugzetten mogelijk blijft.',
      emptyMessage: 'Nog niets afgerond.',
      emphasis: 'quiet',
      tasks: completed,
    },
  ];

  return groups.filter((group) => group.tasks.length > 0);
}

export const groupTasksByUrgency = groupTasksByTime;

function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

function daysFromToday(dueDate: string, today: Date): number {
  return Math.round((parseDateOnly(dueDate).getTime() - today.getTime()) / dayInMilliseconds);
}
