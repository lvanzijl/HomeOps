import type { CreateTaskInput, HouseholdTask, TaskTemplate, TaskTemplateInput } from './tasksModel';

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


async function readTemplateResponse(response: Response): Promise<TaskTemplate> {
  if (!response.ok) throw new Error('Task template request failed.');
  return response.json() as Promise<TaskTemplate>;
}

export async function loadTaskTemplates(): Promise<readonly TaskTemplate[]> {
  const response = await fetch(`${apiBaseUrl}/api/task-templates`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('Task templates could not be loaded.');
  return response.json() as Promise<TaskTemplate[]>;
}

function templateBody(input: TaskTemplateInput) {
  return JSON.stringify({
    name: input.name.trim(),
    description: input.description?.trim() || null,
    items: input.items.map((item) => ({
      title: item.title.trim(),
      ownershipKind: item.ownershipKind ?? 'Unassigned',
      familyMemberId: item.familyMemberId || null,
      recurrenceFrequency: item.recurrenceFrequency ?? 'None',
      dueOffsetDays: item.dueOffsetDays ?? null,
    })),
  });
}

export async function createTaskTemplate(input: TaskTemplateInput): Promise<TaskTemplate> {
  return readTemplateResponse(await fetch(`${apiBaseUrl}/api/task-templates`, {
    method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }, body: templateBody(input),
  }));
}

export async function updateTaskTemplate(templateId: string, input: TaskTemplateInput): Promise<TaskTemplate> {
  return readTemplateResponse(await fetch(`${apiBaseUrl}/api/task-templates/${templateId}`, {
    method: 'PUT', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }, body: templateBody(input),
  }));
}

export async function archiveTaskTemplate(templateId: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/task-templates/${templateId}/archive`, { method: 'POST', headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('Task template could not be archived.');
}

export async function applyTaskTemplate(templateId: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/task-templates/${templateId}/apply`, {
    method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ startDate: null }),
  });
  if (!response.ok) throw new Error('Task template could not be applied.');
}

export async function keepTaskActive(taskId: string): Promise<HouseholdTask> {
  return readTaskResponse(await fetch(`${apiBaseUrl}/api/tasks/${taskId}/keep-active`, { method: 'POST', headers: { Accept: 'application/json' } }));
}

export async function moveTaskToSomeday(taskId: string): Promise<HouseholdTask> {
  return readTaskResponse(await fetch(`${apiBaseUrl}/api/tasks/${taskId}/move-to-someday`, { method: 'POST', headers: { Accept: 'application/json' } }));
}

export async function archiveTask(taskId: string): Promise<HouseholdTask> {
  return readTaskResponse(await fetch(`${apiBaseUrl}/api/tasks/${taskId}/archive`, { method: 'POST', headers: { Accept: 'application/json' } }));
}
