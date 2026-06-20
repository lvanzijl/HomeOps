import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { familyMembers } from '../home/familyMembers';
import { TasksPage } from './TasksPage';

vi.mock('./tasksApi', () => ({
  loadTasks: vi.fn(),
  createTask: vi.fn(),
  completeTask: vi.fn(),
  reopenTask: vi.fn(),
  updateTask: vi.fn(),
  deleteRecurringTaskSeries: vi.fn(),
  loadTaskTemplates: vi.fn(),
  createTaskTemplate: vi.fn(),
  updateTaskTemplate: vi.fn(),
  archiveTaskTemplate: vi.fn(),
  applyTaskTemplate: vi.fn(),
}));

async function tasksApi() {
  return await import('./tasksApi');
}

afterEach(() => cleanup());

describe('TasksPage empty state', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const api = await tasksApi();
    vi.mocked(api.loadTasks).mockResolvedValue([]);
    vi.mocked(api.loadTaskTemplates).mockResolvedValue([]);
  });

  it('guides households to create the first task when no tasks exist', async () => {
    render(<TasksPage members={familyMembers} />);

    expect(await screen.findByText('Create your first task')).not.toBeNull();
    expect(screen.getByText('Tasks help organize household responsibilities.')).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Start with one household task.' })).not.toBeNull();
  });
});


describe('TasksPage templates', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const api = await tasksApi();
    vi.mocked(api.loadTasks).mockResolvedValue([]);
    vi.mocked(api.loadTaskTemplates).mockResolvedValue([{ id: 'template-1', name: 'Morning Routine', description: 'Start the day', active: true, createdUtc: '2026-06-20T00:00:00Z', updatedUtc: '2026-06-20T00:00:00Z', items: [{ id: 'item-1', title: 'Brush teeth', ownershipKind: 'Unassigned', familyMemberId: null, recurrenceFrequency: 'None', dueOffsetDays: null, position: 0 }] }]);
  });

  it('shows starter templates and applies a template', async () => {
    const user = userEvent.setup();
    const api = await tasksApi();
    render(<TasksPage members={familyMembers} />);

    expect(await screen.findByText('Morning Routine')).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    expect(vi.mocked(api.applyTaskTemplate)).toHaveBeenCalledWith('template-1');
  });
});
