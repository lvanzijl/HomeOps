import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { familyMembers } from '../home/familyMembers';
import { TasksPage } from './TasksPage';

vi.mock('./tasksApi', () => ({
  loadTasks: vi.fn(),
  createTask: vi.fn(),
  completeTask: vi.fn(),
  reopenTask: vi.fn(),
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
  });

  it('guides households to create the first task when no tasks exist', async () => {
    render(<TasksPage members={familyMembers} />);

    expect(await screen.findByText('Create your first task')).not.toBeNull();
    expect(screen.getByText('Tasks help organize household responsibilities.')).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Start with one household task.' })).not.toBeNull();
  });
});
