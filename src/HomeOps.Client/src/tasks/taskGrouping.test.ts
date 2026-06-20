import { describe, expect, it } from 'vitest';
import { groupTasksByUrgency } from './taskGrouping';
import { formatOwner } from './TasksPage';
import type { HouseholdTask } from './tasksModel';

function task(overrides: Partial<HouseholdTask>): HouseholdTask {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    title: overrides.title ?? 'Task',
    dueDate: overrides.dueDate ?? null,
    ownershipKind: overrides.ownershipKind ?? 'Unassigned',
    familyMemberId: overrides.familyMemberId ?? null,
    isCompleted: overrides.isCompleted ?? false,
    completedUtc: overrides.completedUtc ?? null,
    createdUtc: overrides.createdUtc ?? '2026-06-19T00:00:00Z',
    updatedUtc: overrides.updatedUtc ?? '2026-06-19T00:00:00Z',
  };
}

describe('groupTasksByUrgency', () => {
  it('groups active tasks by urgency before completed tasks', () => {
    const groups = groupTasksByUrgency([
      task({ id: 'overdue', dueDate: '2026-06-19' }),
      task({ id: 'today', dueDate: '2026-06-20' }),
      task({ id: 'upcoming', dueDate: '2026-06-21' }),
      task({ id: 'none', dueDate: null }),
      task({ id: 'done', isCompleted: true, dueDate: '2026-06-19', completedUtc: '2026-06-20T12:00:00Z' }),
    ], '2026-06-20');

    expect(groups.map((group) => [group.id, group.tasks.map((item) => item.id)])).toEqual([
      ['overdue', ['overdue']],
      ['today', ['today']],
      ['upcoming', ['upcoming']],
      ['noDueDate', ['none']],
      ['completedRecently', ['done']],
    ]);
  });
});

describe('formatOwner', () => {
  it('renders ownership states', () => {
    expect(formatOwner(task({ ownershipKind: 'Unassigned' }))).toBe('Unassigned');
    expect(formatOwner(task({ ownershipKind: 'SharedHousehold' }))).toBe('Shared household');
    expect(formatOwner(task({ ownershipKind: 'FamilyMember', familyMemberId: 'alex' }))).toBe('Alex');
  });
});
