import { FormEvent, useEffect, useMemo, useState } from 'react';
import { familyMembers } from '../home/familyMembers';
import { completeTask, createTask, loadTasks, reopenTask } from './tasksApi';
import { groupTasksByUrgency } from './taskGrouping';
import type { HouseholdTask, TaskOwnershipKind } from './tasksModel';

export function TasksPage() {
  const [tasks, setTasks] = useState<readonly HouseholdTask[]>([]);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [ownership, setOwnership] = useState<TaskOwnershipKind>('Unassigned');
  const [familyMemberId, setFamilyMemberId] = useState(familyMembers[0]?.id ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const groups = useMemo(() => groupTasksByUrgency(tasks), [tasks]);

  useEffect(() => {
    let ignore = false;
    async function run() {
      try {
        setTasks(await loadTasks());
      } catch {
        if (!ignore) setError('Tasks could not be loaded.');
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    void run();
    return () => { ignore = true; };
  }, []);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const created = await createTask({ title, dueDate: dueDate || null, ownershipKind: ownership, familyMemberId: ownership === 'FamilyMember' ? familyMemberId : null });
      if (created) setTasks((current) => [...current, created]);
      setTitle(''); setDueDate(''); setOwnership('Unassigned');
    } catch {
      setError('Task could not be created.');
    }
  }

  async function updateTask(taskId: string, action: 'complete' | 'reopen') {
    try {
      const updated = action === 'complete' ? await completeTask(taskId) : await reopenTask(taskId);
      setTasks((current) => current.map((task) => task.id === updated.id ? updated : task));
    } catch {
      setError('Task could not be updated.');
    }
  }

  return (
    <article className="tasks-page" aria-label="Tasks page">
      <header className="tasks-header"><p className="widget-type">Tasks</p><h3>Household Tasks</h3><p>Urgency-first ad-hoc tasks for the household.</p></header>
      {error ? <p className="shopping-empty" role="alert">{error}</p> : null}
      <form className="task-create-form" onSubmit={onCreate}>
        <label><span>Title</span><input onChange={(event) => setTitle(event.target.value)} placeholder="Add a task" required type="text" value={title} /></label>
        <label><span>Owner</span><select onChange={(event) => setOwnership(event.target.value as TaskOwnershipKind)} value={ownership}><option value="Unassigned">Unassigned</option><option value="SharedHousehold">Shared household</option><option value="FamilyMember">Family member</option></select></label>
        {ownership === 'FamilyMember' ? <label><span>Family member</span><select onChange={(event) => setFamilyMemberId(event.target.value)} value={familyMemberId}>{familyMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label> : null}
        <label><span>Due date</span><input onChange={(event) => setDueDate(event.target.value)} type="date" value={dueDate} /></label>
        <button type="submit">Add task</button>
      </form>
      {isLoading ? <p className="shopping-empty">Loading tasks…</p> : groups.map((group) => <TaskGroup groupTitle={group.title} key={group.id} tasks={group.tasks} onUpdate={updateTask} />)}
    </article>
  );
}

function TaskGroup({ groupTitle, tasks, onUpdate }: { groupTitle: string; tasks: readonly HouseholdTask[]; onUpdate(id: string, action: 'complete' | 'reopen'): void }) {
  return <section className="task-group"><h4>{groupTitle}</h4>{tasks.length === 0 ? <p className="shopping-empty">No tasks.</p> : <ul className="task-list">{tasks.map((task) => <li className="task-item" key={task.id}><div><strong>{task.title}</strong><span>{formatOwner(task)}{task.dueDate ? ` · Due ${task.dueDate}` : ''}</span></div><button onClick={() => onUpdate(task.id, task.isCompleted ? 'reopen' : 'complete')} type="button">{task.isCompleted ? 'Reopen' : 'Complete'}</button></li>)}</ul>}</section>;
}

export function formatOwner(task: Pick<HouseholdTask, 'ownershipKind' | 'familyMemberId'>): string {
  if (task.ownershipKind === 'SharedHousehold') return 'Shared household';
  if (task.ownershipKind === 'FamilyMember') return familyMembers.find((member) => member.id === task.familyMemberId)?.name ?? 'Family member';
  return 'Unassigned';
}
