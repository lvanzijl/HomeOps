import { describe, expect, it } from 'vitest';
import { groupTasksByTime } from './taskGrouping';
import { formatOwner } from './TasksPage';
import type { HouseholdTask } from './tasksModel';

function task(overrides: Partial<HouseholdTask>): HouseholdTask {
  return {
    id: overrides.id ?? crypto.randomUUID(), title: overrides.title ?? 'Task', dueDate: overrides.dueDate ?? null,
    ownershipKind: overrides.ownershipKind ?? 'Unassigned', familyMemberId: overrides.familyMemberId ?? null,
    isCompleted: overrides.isCompleted ?? false, completedUtc: overrides.completedUtc ?? null,
    createdUtc: overrides.createdUtc ?? '2026-06-19T00:00:00Z', updatedUtc: overrides.updatedUtc ?? '2026-06-19T00:00:00Z',
    noDateReviewState: overrides.noDateReviewState ?? 'Active',
  };
}

describe('groupTasksByTime', () => {
  it('groups active tasks into Dutch time-first sections and omits empty groups', () => {
    const groups = groupTasksByTime([
      task({ id: 'overdue', dueDate: '2026-06-19' }), task({ id: 'today', dueDate: '2026-06-20' }),
      task({ id: 'tomorrow', dueDate: '2026-06-21' }), task({ id: 'this-week', dueDate: '2026-06-24' }),
      task({ id: 'next-week', dueDate: '2026-06-28' }), task({ id: 'later-date', dueDate: '2026-07-10' }),
      task({ id: 'none', dueDate: null }), task({ id: 'done', isCompleted: true, dueDate: '2026-06-19', completedUtc: '2026-06-20T12:00:00Z' }),
    ], '2026-06-20');
    expect(groups.map((group) => [group.id, group.title, group.tasks.map((item) => item.id)])).toEqual([
      ['today', 'Vandaag', ['overdue', 'today']], ['tomorrow', 'Morgen', ['tomorrow']], ['thisWeek', 'Deze week', ['this-week']],
      ['nextWeek', 'Volgende week', ['next-week']], ['later', 'Later', ['later-date', 'none']], ['completedRecently', 'Afgerond', ['done']],
    ]);
  });

  it('keeps Someday and archived tasks out of operational time groups', () => {
    const groups = groupTasksByTime([
      task({ id: 'active', dueDate: null }), task({ id: 'review', dueDate: null, noDateReviewState: 'NeedsReview' }),
      task({ id: 'someday', dueDate: null, noDateReviewState: 'Someday' }), task({ id: 'archived', dueDate: null, noDateReviewState: 'Archived' }),
    ], '2026-06-20');
    const later = groups.find((group) => group.id === 'later')!;
    expect(later.title).toBe('Later');
    expect(later.tasks.map((item) => item.id)).toEqual(['active', 'review']);
  });
});

describe('formatOwner', () => {
  it('renders ownership states in Dutch', () => {
    expect(formatOwner(task({ ownershipKind: 'Unassigned' }))).toBe('Iedereen');
    expect(formatOwner(task({ ownershipKind: 'SharedHousehold' }))).toBe('Hele gezin');
    expect(formatOwner(task({ ownershipKind: 'FamilyMember', familyMemberId: 'alex' }))).toBe('Alex');
  });
});
