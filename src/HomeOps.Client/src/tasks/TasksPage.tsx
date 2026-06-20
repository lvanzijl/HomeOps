import { FormEvent, useEffect, useMemo, useState } from 'react';
import { familyMembers as fallbackFamilyMembers, type FamilyMember } from '../home/familyMembers';
import { completeTask, createTask, deleteRecurringTaskSeries, loadTasks, reopenTask, updateTask as saveTask } from './tasksApi';
import { groupTasksByUrgency } from './taskGrouping';
import type { HouseholdTask, TaskOwnershipKind, TaskRecurrenceFrequency } from './tasksModel';

export function TasksPage({ members = fallbackFamilyMembers }: { members?: readonly FamilyMember[] }) {
  const [tasks, setTasks] = useState<readonly HouseholdTask[]>([]);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [ownership, setOwnership] = useState<TaskOwnershipKind>('Unassigned');
  const [familyMemberId, setFamilyMemberId] = useState(members[0]?.id ?? '');
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<TaskRecurrenceFrequency>('None');
  const [editingTask, setEditingTask] = useState<HouseholdTask | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const groups = useMemo(() => groupTasksByUrgency(tasks), [tasks]);

  useEffect(() => {
    if (ownership === 'FamilyMember' && !members.some((member) => member.id === familyMemberId)) {
      setFamilyMemberId(members[0]?.id ?? '');
    }
  }, [familyMemberId, members, ownership]);

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
      const payload = { title, dueDate: dueDate || null, ownershipKind: ownership, familyMemberId: ownership === 'FamilyMember' ? familyMemberId : null, recurrenceFrequency };
      const saved = editingTask ? await saveTask(editingTask.id, payload) : await createTask(payload);
      if (saved) setTasks(await loadTasks());
      setTitle(''); setDueDate(''); setOwnership('Unassigned'); setRecurrenceFrequency('None'); setEditingTask(null);
    } catch {
      setError('Task could not be saved.');
    }
  }

  function startEditing(task: HouseholdTask) {
    setEditingTask(task); setTitle(task.title); setDueDate(task.dueDate ?? ''); setOwnership(task.ownershipKind); setFamilyMemberId(task.familyMemberId ?? members[0]?.id ?? ''); setRecurrenceFrequency(task.recurrenceFrequency ?? 'None');
  }

  async function deleteSeries(taskId: string) {
    try { await deleteRecurringTaskSeries(taskId); setTasks(await loadTasks()); } catch { setError('Recurring task series could not be deleted.'); }
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
        <label><span>Title</span><input id="task-title" onChange={(event) => setTitle(event.target.value)} placeholder="Add a task" required type="text" value={title} /></label>
        <label><span>Owner</span><select onChange={(event) => setOwnership(event.target.value as TaskOwnershipKind)} value={ownership}><option value="Unassigned">Unassigned</option><option value="SharedHousehold">Shared household</option><option value="FamilyMember">Family member</option></select></label>
        {ownership === 'FamilyMember' ? <label><span>Family member</span><select onChange={(event) => setFamilyMemberId(event.target.value)} value={familyMemberId}>{members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label> : null}
        <label><span>Due date</span><input onChange={(event) => setDueDate(event.target.value)} type="date" value={dueDate} /></label>
        <label><span>Repeats</span><select onChange={(event) => setRecurrenceFrequency(event.target.value as TaskRecurrenceFrequency)} value={recurrenceFrequency}><option value="None">Does not repeat</option><option value="Daily">Daily</option><option value="Weekly">Weekly</option><option value="Monthly">Monthly</option></select></label>
        <button type="submit">{editingTask ? 'Save task series' : 'Add task'}</button>
      </form>
      {isLoading ? <p className="shopping-empty">Loading tasks…</p> : tasks.length === 0 ? (
        <div className="empty-state-card page-empty-state">
          <strong>Create your first task</strong>
          <p>Tasks help organize household responsibilities.</p>
          <a href="#task-title">Start with one household task.</a>
        </div>
      ) : groups.map((group) => <TaskGroup groupTitle={group.title} key={group.id} members={members} tasks={group.tasks} onDeleteSeries={deleteSeries} onEdit={startEditing} onUpdate={updateTask} />)}
    </article>
  );
}

function TaskGroup({ groupTitle, members, tasks, onDeleteSeries, onEdit, onUpdate }: { groupTitle: string; members: readonly FamilyMember[]; tasks: readonly HouseholdTask[]; onDeleteSeries(id: string): void; onEdit(task: HouseholdTask): void; onUpdate(id: string, action: 'complete' | 'reopen'): void }) {
  return <section className="task-group"><h4>{groupTitle}</h4>{tasks.length === 0 ? <p className="shopping-empty">No tasks.</p> : <ul className="task-list">{tasks.map((task) => <li className="task-item" key={task.id}><div><strong>{task.title}</strong><span>{formatOwner(task, members)}{task.dueDate ? ` · Due ${task.dueDate}` : ''}{(task.recurrenceFrequency ?? 'None') !== 'None' ? ` · Repeats ${(task.recurrenceFrequency ?? 'None').toLowerCase()}` : ''}</span></div><button onClick={() => onEdit(task)} type="button">Edit</button>{task.recurringTaskSeriesId ? <button onClick={() => onDeleteSeries(task.id)} type="button">Delete series</button> : null}<button onClick={() => onUpdate(task.id, task.isCompleted ? 'reopen' : 'complete')} type="button">{task.isCompleted ? 'Reopen' : 'Complete'}</button></li>)}</ul>}</section>;
}

export function formatOwner(task: Pick<HouseholdTask, 'ownershipKind' | 'familyMemberId'>, members: readonly FamilyMember[] = fallbackFamilyMembers): string {
  if (task.ownershipKind === 'SharedHousehold') return 'Shared household';
  if (task.ownershipKind === 'FamilyMember') return members.find((member) => member.id === task.familyMemberId)?.name ?? 'Family member';
  return 'Unassigned';
}
