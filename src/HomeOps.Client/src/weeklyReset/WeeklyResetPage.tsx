import { useEffect, useState } from 'react';
import { getHelpfulMomentIconName, HomeOpsIcon } from '../icons/homeOpsIcons';
import { archiveIndividualGoal, type MotivationFamilyGoal, type MotivationIndividualGoal } from '../motivationData';
import { archiveTask, keepTaskActive, moveTaskToSomeday } from '../tasks/tasksApi';
import { archiveFamilyGoalForReset, loadWeeklyReset, type WeeklyReset } from './weeklyResetApi';

export function WeeklyResetPage() {
  const [reset, setReset] = useState<WeeklyReset | null>(null);
  const [status, setStatus] = useState('Loading weekly reset…');
  const [skipped, setSkipped] = useState(false);
  useEffect(() => { let ignore = false; loadWeeklyReset().then((data) => { if (!ignore) { setReset(data); setStatus('Ready'); } }).catch(() => { if (!ignore) setStatus('Weekly reset could not be loaded.'); }); return () => { ignore = true; }; }, []);
  async function refresh(message: string) { setStatus(message); setReset(await loadWeeklyReset()); }
  if (skipped) return <section className="weekly-reset-page"><p className="eyebrow">Optional reset</p><h2>Skipped for now</h2><p>No problem. HomeOps will keep working without a weekly review.</p><button type="button" onClick={() => setSkipped(false)}>Open reset again</button></section>;
  if (!reset) return <section className="weekly-reset-page"><p>{status}</p></section>;
  return <section className="weekly-reset-page" aria-labelledby="weekly-reset-title">
    <header className="weekly-reset-hero"><p className="eyebrow">2–5 minute optional review</p><h2 id="weekly-reset-title">Weekly Household Reset</h2><p>A short parent-facing pass over only the things most likely to need attention. Skip anything that does not help.</p><button type="button" onClick={() => setSkipped(true)}>Skip this week</button></header>
    <section className="reset-grid">
      <article className="reset-card"><h3>Review candidates</h3><p>Not every task—just stale no-date and someday items.</p>{reset.reviewCandidates.length === 0 ? <p>Nothing needs review right now.</p> : reset.reviewCandidates.map((task) => <div className="reset-row" key={task.id}><strong>{task.title}</strong><span>{task.noDateReviewState ?? 'Active'}</span><div><button onClick={() => keepTaskActive(task.id).then(() => refresh('Kept active.'))}>Keep active</button><button onClick={() => moveTaskToSomeday(task.id).then(() => refresh('Moved to someday.'))}>Someday</button><button onClick={() => archiveTask(task.id).then(() => refresh('Archived.'))}>Archive</button></div></div>)}</article>
      <GoalCard title="Family goal confirmation" goal={reset.familyGoal} onArchive={(id) => archiveFamilyGoalForReset(id).then(() => refresh('Family goal archived.'))} />
      <article className="reset-card"><h3>Children’s goals</h3><p>Confirm each child still has the right focus.</p>{reset.individualGoals.length === 0 ? <p>No active child goals to confirm.</p> : reset.individualGoals.map((goal) => <IndividualGoalRow goal={goal} key={goal.id} onArchive={(id) => archiveIndividualGoal(id).then(() => refresh('Child goal archived.'))} />)}</article>
      <article className="reset-card"><h3>Shopping review</h3><p>Only older, archived, or duplicate-looking lists show up.</p>{reset.shoppingReviewCandidates.length === 0 ? <p>No shopping cleanup suggested this week.</p> : reset.shoppingReviewCandidates.map((list) => <div className="reset-row" key={list.id}><strong>{list.name}</strong><span>{list.reason} · {list.itemCount} items</span></div>)}</article>
      <article className="reset-card recap-card"><h3>What went well this week?</h3><p>{reset.contributionRecap.completedTaskCount} completed tasks and {reset.contributionRecap.helpfulMomentCount} Helpful Moments.</p>{reset.contributionRecap.helpfulMoments.map((moment) => <div className="reset-row helpful-reset-row" key={moment.id}><strong><HomeOpsIcon name={getHelpfulMomentIconName(moment.recognitionTag)} />{moment.familyMemberName}: {moment.title}</strong>{moment.description ? <span>{moment.description}</span> : null}</div>)}{reset.contributionRecap.celebrationMemories.map((memory) => <div className="reset-row" key={memory.familyGoalId}><strong>Celebrated: {memory.title}</strong>{memory.description ? <span>{memory.description}</span> : null}</div>)}</article>
    </section><p role="status">{status}</p>
  </section>;
}

function GoalCard({ title, goal, onArchive }: { title: string; goal?: MotivationFamilyGoal; onArchive: (id: string) => void }) { return <article className="reset-card"><h3>{title}</h3>{!goal ? <p>No active family goal to confirm.</p> : <div className="reset-row"><strong>{goal.title}</strong><span>{goal.currentProgress} / {goal.targetCount} {goal.unitLabel}</span><div><button type="button">Keep active</button><button type="button" onClick={() => onArchive(goal.id)}>Archive</button></div></div>}<p>Use Motivation to replace goals when the family is ready.</p></article>; }
function IndividualGoalRow({ goal, onArchive }: { goal: MotivationIndividualGoal; onArchive: (id: string) => void }) { return <div className="reset-row"><strong>{goal.familyMemberName}: {goal.title}</strong><span>{goal.currentProgress} / {goal.targetCount} {goal.unitLabel}</span><div><button type="button">Keep active</button><button type="button" onClick={() => onArchive(goal.id)}>Archive</button></div></div>; }
