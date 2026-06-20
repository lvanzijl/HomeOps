import type { CreateTaskInput, HouseholdTask } from './tasksModel';

const apiBaseUrl = import.meta.env.VITE_HOMEOPS_API_BASE_URL ?? '';

async function readTaskResponse(response: Response): Promise<HouseholdTask> {
  if (!response.ok) {
    throw new Error('Task request failed.');
  }
  return response.json() as Promise<HouseholdTask>;
}

export async function loadTasks(): Promise<readonly HouseholdTask[]> {
  const response = await fetch(`${apiBaseUrl}/api/tasks`, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error('Tasks could not be loaded.');
  }
  return response.json() as Promise<HouseholdTask[]>;
}

export async function createTask(input: CreateTaskInput): Promise<HouseholdTask | null> {
  const title = input.title.trim();
  if (!title) {
    return null;
  }

  return readTaskResponse(await fetch(`${apiBaseUrl}/api/tasks`, {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      dueDate: input.dueDate || null,
      ownershipKind: input.ownershipKind ?? 'Unassigned',
      familyMemberId: input.familyMemberId || null,
      recurrenceFrequency: input.recurrenceFrequency ?? 'None',
    }),
  }));
}

export async function completeTask(taskId: string): Promise<HouseholdTask> {
  return readTaskResponse(await fetch(`${apiBaseUrl}/api/tasks/${taskId}/complete`, { method: 'POST', headers: { Accept: 'application/json' } }));
}

export async function reopenTask(taskId: string): Promise<HouseholdTask> {
  return readTaskResponse(await fetch(`${apiBaseUrl}/api/tasks/${taskId}/reopen`, { method: 'POST', headers: { Accept: 'application/json' } }));
}


export async function updateTask(taskId: string, input: CreateTaskInput): Promise<HouseholdTask> {
  const title = input.title.trim();
  return readTaskResponse(await fetch(`${apiBaseUrl}/api/tasks/${taskId}`, {
    method: 'PUT',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      dueDate: input.dueDate || null,
      ownershipKind: input.ownershipKind ?? 'Unassigned',
      familyMemberId: input.familyMemberId || null,
      recurrenceFrequency: input.recurrenceFrequency ?? 'None',
    }),
  }));
}

export async function deleteRecurringTaskSeries(taskId: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/tasks/${taskId}/series`, { method: 'DELETE', headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('Recurring task series could not be deleted.');
}
