import { useEffect, useState, type CSSProperties } from 'react';
import { FamilyAvatar } from './home/FamilyAvatar';
import type { FamilyMember } from './home/familyMembers';
import { clampProgress, goalsForMembers, loadMotivationSnapshot, type MotivationSnapshot } from './motivationData';

interface MotivationPageProps {
  members: readonly FamilyMember[];
}

export function MotivationPage({ members }: MotivationPageProps) {
  const [snapshot, setSnapshot] = useState<MotivationSnapshot>({ individualGoals: [] });
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let ignore = false;
    setStatus('loading');
    loadMotivationSnapshot()
      .then((loaded) => {
        if (!ignore) {
          setSnapshot(loaded);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (!ignore) setStatus('error');
      });
    return () => { ignore = true; };
  }, []);

  const { familyGoal } = snapshot;
  const percent = familyGoal ? clampProgress(familyGoal.currentProgress, familyGoal.targetCount) : 0;
  const individualGoals = goalsForMembers(snapshot, members);

  return (
    <section className="motivation-page" aria-label="Motivation page">
      <header className="motivation-header">
        <p className="widget-type">Motivation</p>
        <h3>Family encouragement</h3>
        <p>Celebrate cooperation, routines, and progress without comparison or competition.</p>
      </header>

      <article className="family-goal-card" aria-label="Active family goal">
        {!familyGoal ? (
          <div className="empty-state-card page-empty-state">
            <p className="eyebrow">{status === 'error' ? 'Motivation is unavailable' : 'Family goal'}</p>
            <h3>Create your first family goal</h3>
            <p>Family goals help everyone work toward something together.</p>
          </div>
        ) : (
        <>
        <div>
          <p className="eyebrow">Together we are working on</p>
          <h3>{familyGoal.title}</h3>
          <p className="motivation-copy">{Math.max(0, familyGoal.targetCount - familyGoal.currentProgress)} more {familyGoal.unitLabel} to reach this family goal.</p>
          {familyGoal.rewardLabel ? <p className="reward-label">When we finish: {familyGoal.rewardLabel}</p> : null}
        </div>
        <div className="family-progress" aria-label={`${familyGoal.currentProgress} of ${familyGoal.targetCount} ${familyGoal.unitLabel}`}>
          <strong>{familyGoal.currentProgress}/{familyGoal.targetCount}</strong>
          <span>{familyGoal.unitLabel}</span>
          <div className="progress-bar"><span style={{ width: `${percent}%` }} /></div>
        </div>
        </>
        )}
      </article>

      <section className="individual-goals" aria-label="Individual encouragement goals">
        <h3>Personal goals this week</h3>
        <div className="individual-goal-grid">
          {individualGoals.length === 0 ? <p className="motivation-copy">No active personal encouragement goals yet.</p> : null}
          {individualGoals.map((goal) => {
            const member = members.find((item) => item.id === goal.familyMemberId);
            if (!member) return null;
            return (
              <article className="individual-goal-card" key={goal.familyMemberId} style={{ '--member-color': member.displayColor } as CSSProperties}>
                <div className="individual-goal-heading">
                  <FamilyAvatar member={member} />
                  <div><strong>{member.name}</strong><span>{goal.title}</span></div>
                </div>
                <div className="star-row" aria-label={`${goal.currentProgress} of ${goal.targetCount} ${goal.unitLabel}`}>
                  {Array.from({ length: goal.targetCount }, (_, index) => (
                    <span className={index < goal.currentProgress ? 'filled' : ''} key={index} aria-hidden="true">{index < goal.currentProgress ? '★' : '✓'}</span>
                  ))}
                </div>
                <p>{goal.targetCount - goal.currentProgress > 0 ? `${goal.targetCount - goal.currentProgress} to go — keep cheering each other on.` : 'Goal reached — celebrate the routine!'}</p>
              </article>
            );
          })}
        </div>
      </section>
    </section>
  );
}
