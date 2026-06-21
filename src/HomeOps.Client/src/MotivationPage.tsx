import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { FamilyAvatar } from './home/FamilyAvatar';
import { HelpfulMomentsSection } from './HelpfulMoments';
import { HomeOpsIcon } from './icons/homeOpsIcons';
import type { FamilyMember } from './home/familyMembers';
import { FamilyCelebrationStatus } from './api/homeOpsApiClient';
import { archiveIndividualGoal, clampProgress, createFamilyGoal, createIndividualGoal, goalsForMembers, loadMotivationSnapshot, markFamilyGoalCelebrated, updateFamilyGoal, updateIndividualGoal, type MotivationCelebrationMemory, type MotivationFamilyGoal, type MotivationIndividualGoal, type MotivationSnapshot } from './motivationData';

interface MotivationPageProps {
  members: readonly FamilyMember[];
}

export function MotivationPage({ members }: MotivationPageProps) {
  const [snapshot, setSnapshot] = useState<MotivationSnapshot>({ individualGoals: [] });
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [formMode, setFormMode] = useState<'closed' | 'create' | 'edit'>('closed');
  const [individualFormGoal, setIndividualFormGoal] = useState<MotivationIndividualGoal | undefined>();
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
    setSnapshot((current) => {
      const celebratedMemory = memoryFromFamilyGoal(goal);
      const memories = celebratedMemory
        ? [celebratedMemory, ...(current.celebrationMemories ?? []).filter((memory) => memory.familyGoalId !== celebratedMemory.familyGoalId)].slice(0, 6)
        : current.celebrationMemories;
      return { ...current, familyGoal: goal, celebrationMemories: memories };
    });
    setFormMode('closed');
    setFormError(null);
  }

  function handleIndividualGoalSaved(goal: MotivationIndividualGoal) {
    setSnapshot((current) => ({
      ...current,
      individualGoals: current.individualGoals.some((item) => item.id === goal.id)
        ? current.individualGoals.map((item) => item.id === goal.id ? goal : item)
        : [...current.individualGoals, goal],
    }));
    setIndividualFormGoal(undefined);
    setFormError(null);
  }

  return (
    <section className="motivation-page" aria-label="Motivation page">
      <header className="motivation-header">
        <p className="widget-type">Motivation</p>
        <h3>Family goals</h3>
        <p>Progress, appreciation, and celebrations.</p>
      </header>

      <article className="family-goal-card" aria-label="Active family goal">
        {!familyGoal ? (
          <div className="empty-state-card page-empty-state">
            <p className="eyebrow">{status === 'error' ? 'Motivation is unavailable' : 'Family goal'}</p>
            <h3>No family goal yet.</h3>
            <p>Create one shared goal.</p>
            <button type="button" onClick={() => setFormMode('create')}>Create family goal</button>
          </div>
        ) : (
        <>
        <div>
          <p className="eyebrow">Family goal</p>
          <h3>{familyGoal.title}</h3>
          <p className="motivation-copy">{familyGoalAnticipationMessage(familyGoal)}</p>
          <FamilyCelebrationDisplay familyGoal={familyGoal} onCelebrated={handleFormSaved} />
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

      <CelebrationMemorySection memories={snapshot.celebrationMemories ?? []} />

      <HelpfulMomentsSection members={members} showCreate title="Things My Family Appreciates" />

      <section className="individual-goals" aria-label="Individual encouragement goals">
        <div className="section-heading-row"><h3>Personal goals this week</h3><button type="button" className="secondary-action" onClick={() => setIndividualFormGoal({ id: "", familyMemberId: members[0]?.id ?? "", familyMemberName: members[0]?.name ?? "", title: "", targetCount: 4, currentProgress: 0, unitLabel: "times", visualKind: "stars" })}>Add personal goal</button></div>
        {individualFormGoal ? (
          <IndividualGoalForm
            goal={individualFormGoal.id ? individualFormGoal : undefined}
            members={members}
            error={formError}
            onCancel={() => { setIndividualFormGoal(undefined); setFormError(null); }}
            onArchive={individualFormGoal.id ? async () => {
              try {
                await archiveIndividualGoal(individualFormGoal.id);
                setSnapshot((current) => ({ ...current, individualGoals: current.individualGoals.filter((goal) => goal.id !== individualFormGoal.id) }));
                setIndividualFormGoal(undefined);
              } catch { setFormError("We could not retire this goal. Please try again."); }
            } : undefined}
            onSubmit={async (values) => {
              try {
                const saved = individualFormGoal.id ? await updateIndividualGoal(individualFormGoal.id, values) : await createIndividualGoal(values);
                handleIndividualGoalSaved(saved);
              } catch { setFormError("We could not save this personal goal. Please try again."); }
            }}
          />
        ) : null}
        <div className="individual-goal-grid">
          {individualGoals.length === 0 ? <p className="motivation-copy">No personal goals yet.</p> : null}
          {individualGoals.map((goal) => {
            const member = members.find((item) => item.id === goal.familyMemberId);
            if (!member) return null;
            return (
              <article className="individual-goal-card" key={goal.id} style={{ '--member-color': member.displayColor } as CSSProperties}>
                <div className="individual-goal-heading">
                  <FamilyAvatar member={member} />
                  <div><strong>{member.name}</strong><span>{goal.title}</span></div>
                  <button type="button" className="secondary-action compact-action" onClick={() => setIndividualFormGoal(goal)}>Edit</button>
                </div>
                <div className="star-row" aria-label={`${goal.currentProgress} of ${goal.targetCount} ${goal.unitLabel}`}>
                  {Array.from({ length: goal.targetCount }, (_, index) => (
                    <HomeOpsIcon className={index < goal.currentProgress ? 'filled' : ''} key={index} name={index < goal.currentProgress ? 'progress' : 'completed'} />
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

function familyGoalAnticipationMessage(familyGoal: MotivationFamilyGoal) {
  const remaining = Math.max(0, familyGoal.targetCount - familyGoal.currentProgress);
  const celebrationTitle = familyGoal.celebration?.title;
  if (familyGoal.celebration?.status === FamilyCelebrationStatus.ReadyToCelebrate || remaining === 0) {
    return celebrationTitle
      ? `${celebrationTitle} is ready.`
      : 'Family goal complete.';
  }
  if (celebrationTitle) {
    return remaining === 1
      ? `Only 1 more ${familyGoal.unitLabel} until ${celebrationTitle}.`
      : `Only ${remaining} more ${familyGoal.unitLabel} until ${celebrationTitle}.`;
  }
  return `${remaining} more ${familyGoal.unitLabel} to reach this family goal.`;
}

interface IndividualGoalFormProps {
  goal?: MotivationIndividualGoal;
  members: readonly FamilyMember[];
  error: string | null;
  onCancel: () => void;
  onSubmit: (values: { familyMemberId: string; title: string; targetCount: number; unitLabel: string }) => Promise<void>;
  onArchive?: () => Promise<void>;
}

function IndividualGoalForm({ goal, members, error, onCancel, onSubmit, onArchive }: IndividualGoalFormProps) {
  const [familyMemberId, setFamilyMemberId] = useState(goal?.familyMemberId ?? members[0]?.id ?? "");
  const [title, setTitle] = useState(goal?.title ?? "");
  const [targetCount, setTargetCount] = useState(String(goal?.targetCount ?? 4));
  const [unitLabel, setUnitLabel] = useState(goal?.unitLabel ?? "times");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsedTarget = Number.parseInt(targetCount, 10);
    if (!familyMemberId || !title.trim() || !unitLabel.trim() || !Number.isFinite(parsedTarget) || parsedTarget < 1) return;
    setSaving(true);
    await onSubmit({ familyMemberId, title: title.trim(), targetCount: parsedTarget, unitLabel: unitLabel.trim() });
    setSaving(false);
  }

  return (
    <form className="family-goal-form" aria-label={goal ? "Edit individual goal form" : "Create individual goal form"} onSubmit={handleSubmit}>
      <div><p className="eyebrow">Personal goal</p><h3>{goal ? "Edit personal goal" : "Add personal goal"}</h3><p className="motivation-copy">Choose one family member and one simple target.</p></div>
      <label>Family member<select value={familyMemberId} onChange={(event) => setFamilyMemberId(event.target.value)} required>{members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
      <label>Goal title<input value={title} maxLength={240} onChange={(event) => setTitle(event.target.value)} placeholder="Read books" required /></label>
      <label>Target count<input type="number" min="1" max="99" value={targetCount} onChange={(event) => setTargetCount(event.target.value)} required /></label>
      <label>Unit label<input value={unitLabel} maxLength={80} onChange={(event) => setUnitLabel(event.target.value)} placeholder="books" required /></label>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="form-actions"><button type="submit" disabled={saving}>{saving ? "Saving…" : "Save personal goal"}</button>{onArchive ? <button type="button" className="secondary-action" onClick={onArchive}>Retire goal</button> : null}<button type="button" onClick={onCancel}>Cancel</button></div>
    </form>
  );
}

function FamilyCelebrationDisplay({ familyGoal, onCelebrated }: { familyGoal: MotivationFamilyGoal; onCelebrated: (goal: MotivationFamilyGoal) => void }) {
  const [saving, setSaving] = useState(false);
  const celebration = familyGoal.celebration;
  if (!celebration) return null;

  const remaining = Math.max(0, familyGoal.targetCount - familyGoal.currentProgress);
  const label = celebration.status === FamilyCelebrationStatus.ReadyToCelebrate
    ? 'We did it — ready to celebrate'
    : celebration.status === FamilyCelebrationStatus.Celebrated
      ? 'Celebrated together'
      : 'Coming up when we finish';
  const message = celebration.status === FamilyCelebrationStatus.ReadyToCelebrate
    ? `${celebration.title} is ready now.`
    : celebration.status === FamilyCelebrationStatus.Celebrated
      ? 'Celebrated together.'
      : remaining === 1
        ? `Only 1 more ${familyGoal.unitLabel} until ${celebration.title}.`
        : `Only ${remaining} more ${familyGoal.unitLabel} until ${celebration.title}.`;
  const statusClass = celebration.status === FamilyCelebrationStatus.ReadyToCelebrate
    ? 'ready'
    : celebration.status === FamilyCelebrationStatus.Celebrated
      ? 'celebrated'
      : 'planned';

  return (
    <div className={`celebration-surface ${statusClass}`} aria-label="Celebration surface">
      <HomeOpsIcon className="celebration-surface-icon" name={statusClass === 'ready' ? 'celebrationReady' : statusClass === 'celebrated' ? 'celebrationCelebrated' : 'celebrationUpcoming'} variant={statusClass === 'ready' ? 'hero' : 'spot'} />
      <div>
        <p className="eyebrow">{label}</p>
        <h4>{celebration.title}</h4>
        <p>{message}</p>
        {celebration.description ? <span>{celebration.description}</span> : null}
      </div>
      {celebration.status === FamilyCelebrationStatus.ReadyToCelebrate ? (
        <button
          type="button"
          className="secondary-action compact-action"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            try {
              onCelebrated(await markFamilyGoalCelebrated(familyGoal.id));
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? 'Saving…' : 'Mark celebrated'}
        </button>
      ) : null}
    </div>
  );
}

interface FamilyGoalFormProps {
  familyGoal?: MotivationFamilyGoal;
  error: string | null;
  onCancel: () => void;
  onSubmit: (values: { title: string; targetCount: number; unitLabel: string; celebrationTitle?: string; celebrationDescription?: string }) => Promise<void>;
}

function FamilyGoalForm({ familyGoal, error, onCancel, onSubmit }: FamilyGoalFormProps) {
  const [title, setTitle] = useState(familyGoal?.title ?? '');
  const [targetCount, setTargetCount] = useState(String(familyGoal?.targetCount ?? 10));
  const [unitLabel, setUnitLabel] = useState(familyGoal?.unitLabel ?? 'helpful tasks');
  const [celebrationTitle, setCelebrationTitle] = useState(familyGoal?.celebration?.title ?? '');
  const [celebrationDescription, setCelebrationDescription] = useState(familyGoal?.celebration?.description ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsedTarget = Number.parseInt(targetCount, 10);
    if (!title.trim() || !unitLabel.trim() || !Number.isFinite(parsedTarget) || parsedTarget < 1) return;
    setSaving(true);
    await onSubmit({ title: title.trim(), targetCount: parsedTarget, unitLabel: unitLabel.trim(), celebrationTitle: celebrationTitle.trim() || undefined, celebrationDescription: celebrationDescription.trim() || undefined });
    setSaving(false);
  }

  return (
    <form className="family-goal-form" aria-label={familyGoal ? 'Edit family goal form' : 'Create family goal form'} onSubmit={handleSubmit}>
      <div>
        <p className="eyebrow">{familyGoal ? 'Update the shared target' : 'Start a shared target'}</p>
        <h3>{familyGoal ? 'Edit family goal' : 'Create a family goal'}</h3>
        <p className="motivation-copy">Use one clear target. Existing progress is kept when you edit.</p>
      </div>
      <label>Goal title<input value={title} maxLength={240} onChange={(event) => setTitle(event.target.value)} placeholder="Complete 20 helpful household tasks" required /></label>
      <label>Target count<input type="number" min="1" max="999" value={targetCount} onChange={(event) => setTargetCount(event.target.value)} required /></label>
      <label>Progress label<input value={unitLabel} maxLength={80} onChange={(event) => setUnitLabel(event.target.value)} placeholder="helpful tasks" required /></label>
      <label>Family celebration title, optional<input value={celebrationTitle} maxLength={240} onChange={(event) => setCelebrationTitle(event.target.value)} placeholder="Movie night together" /></label>
      <label>Celebration description, optional<input value={celebrationDescription} maxLength={500} onChange={(event) => setCelebrationDescription(event.target.value)} placeholder="Choose a movie and make popcorn together" /></label>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="form-actions"><button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save family goal'}</button><button type="button" onClick={onCancel}>Cancel</button></div>
    </form>
  );
}


function memoryFromFamilyGoal(goal: MotivationFamilyGoal): MotivationCelebrationMemory | undefined {
  if (goal.celebration?.status !== FamilyCelebrationStatus.Celebrated || !goal.celebration.title) return undefined;
  return {
    familyGoalId: goal.id,
    title: goal.celebration.title,
    description: goal.celebration.description,
    celebratedUtc: goal.celebration.celebratedUtc ?? new Date().toISOString(),
  };
}

function CelebrationMemorySection({ memories }: { memories: readonly MotivationCelebrationMemory[] }) {
  if (memories.length === 0) return null;
  return (
    <section className="celebration-memory-section" aria-label="Celebration memories">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Family memories</p>
          <h3>Celebrations we remember</h3>
        </div>
        <span>Recent celebrations</span>
      </div>
      <div className="celebration-memory-grid">
        {memories.map((memory) => (
          <article className="celebration-memory-card" key={`${memory.familyGoalId}-${memory.celebratedUtc}`}>
            <HomeOpsIcon name="memory" variant="keepsake" />
            <div>
              <h4>{memory.title}</h4>
              <p>We made this happen together.</p>
              {memory.description ? <small>{memory.description}</small> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
