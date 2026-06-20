import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { FamilyAvatar } from './home/FamilyAvatar';
import type { FamilyMember } from './home/familyMembers';
import { clampProgress, createFamilyGoal, goalsForMembers, loadMotivationSnapshot, updateFamilyGoal, type MotivationFamilyGoal, type MotivationSnapshot } from './motivationData';

interface MotivationPageProps {
  members: readonly FamilyMember[];
}

export function MotivationPage({ members }: MotivationPageProps) {
  const [snapshot, setSnapshot] = useState<MotivationSnapshot>({ individualGoals: [] });
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [formMode, setFormMode] = useState<'closed' | 'create' | 'edit'>('closed');
  const [formError, setFormError] = useState<string | null>(null);

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

  function handleFormSaved(goal: MotivationFamilyGoal) {
    setSnapshot((current) => ({ ...current, familyGoal: goal }));
    setFormMode('closed');
    setFormError(null);
  }

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
            <p>Family goals help everyone work toward something together. Pick one shared target, then let completed household tasks move the progress forward.</p>
            <button type="button" onClick={() => setFormMode('create')}>Create family goal</button>
          </div>
        ) : (
        <>
        <div>
          <p className="eyebrow">Together we are working on</p>
          <h3>{familyGoal.title}</h3>
          <p className="motivation-copy">{Math.max(0, familyGoal.targetCount - familyGoal.currentProgress)} more {familyGoal.unitLabel} to reach this family goal.</p>
          {familyGoal.rewardLabel ? <p className="reward-label">When we finish: {familyGoal.rewardLabel}</p> : null}
          <button type="button" className="secondary-action" onClick={() => setFormMode('edit')}>Edit family goal</button>
        </div>
        <div className="family-progress" aria-label={`${familyGoal.currentProgress} of ${familyGoal.targetCount} ${familyGoal.unitLabel}`}>
          <strong>{familyGoal.currentProgress}/{familyGoal.targetCount}</strong>
          <span>{familyGoal.unitLabel}</span>
          <div className="progress-bar"><span style={{ width: `${percent}%` }} /></div>
        </div>
        </>
        )}
      </article>

      {formMode !== 'closed' ? (
        <FamilyGoalForm
          familyGoal={formMode === 'edit' ? familyGoal : undefined}
          error={formError}
          onCancel={() => { setFormMode('closed'); setFormError(null); }}
          onSubmit={async (values) => {
            try {
              const saved = formMode === 'edit' && familyGoal
                ? await updateFamilyGoal(familyGoal.id, values)
                : await createFamilyGoal(values);
              handleFormSaved(saved);
            } catch {
              setFormError('We could not save this family goal. Please try again.');
            }
          }}
        />
      ) : null}

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

interface FamilyGoalFormProps {
  familyGoal?: MotivationFamilyGoal;
  error: string | null;
  onCancel: () => void;
  onSubmit: (values: { title: string; targetCount: number; unitLabel: string; rewardLabel?: string }) => Promise<void>;
}

function FamilyGoalForm({ familyGoal, error, onCancel, onSubmit }: FamilyGoalFormProps) {
  const [title, setTitle] = useState(familyGoal?.title ?? '');
  const [targetCount, setTargetCount] = useState(String(familyGoal?.targetCount ?? 10));
  const [unitLabel, setUnitLabel] = useState(familyGoal?.unitLabel ?? 'helpful tasks');
  const [rewardLabel, setRewardLabel] = useState(familyGoal?.rewardLabel ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsedTarget = Number.parseInt(targetCount, 10);
    if (!title.trim() || !unitLabel.trim() || !Number.isFinite(parsedTarget) || parsedTarget < 1) return;
    setSaving(true);
    await onSubmit({ title: title.trim(), targetCount: parsedTarget, unitLabel: unitLabel.trim(), rewardLabel: rewardLabel.trim() || undefined });
    setSaving(false);
  }

  return (
    <form className="family-goal-form" aria-label={familyGoal ? 'Edit family goal form' : 'Create family goal form'} onSubmit={handleSubmit}>
      <div>
        <p className="eyebrow">{familyGoal ? 'Update the shared target' : 'Start a shared target'}</p>
        <h3>{familyGoal ? 'Edit family goal' : 'Create a family goal'}</h3>
        <p className="motivation-copy">Keep it simple and encouraging. Progress from completed shared household tasks is preserved when you edit.</p>
      </div>
      <label>Goal title<input value={title} maxLength={240} onChange={(event) => setTitle(event.target.value)} placeholder="Complete 20 helpful household tasks" required /></label>
      <label>Target count<input type="number" min="1" max="999" value={targetCount} onChange={(event) => setTargetCount(event.target.value)} required /></label>
      <label>Progress words<input value={unitLabel} maxLength={80} onChange={(event) => setUnitLabel(event.target.value)} placeholder="helpful tasks" required /></label>
      <label>Family celebration, optional<input value={rewardLabel} maxLength={240} onChange={(event) => setRewardLabel(event.target.value)} placeholder="Movie night together" /></label>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="form-actions"><button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save family goal'}</button><button type="button" onClick={onCancel}>Cancel</button></div>
    </form>
  );
}
