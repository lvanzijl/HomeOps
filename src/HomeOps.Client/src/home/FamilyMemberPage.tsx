import { type CSSProperties, type FormEvent, useEffect, useState } from 'react';
import { clampProgress, goalsForMembers, loadMotivationSnapshot, type MotivationFamilyGoal, type MotivationIndividualGoal, type MotivationSnapshot } from '../motivationData';
import { FamilyAvatar } from './FamilyAvatar';
import { FamilyAvatarEditor } from './FamilyAvatarEditor';
import type { FamilyMember, FamilyMemberKind } from './familyMembers';

interface FamilyMemberPageProps {
  member: FamilyMember;
  onBack: () => void;
  onChange: (member: FamilyMember) => void;
  onRemove: (member: FamilyMember) => void;
}

export function FamilyMemberPage({ member, onBack, onChange, onRemove }: FamilyMemberPageProps) {
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [draft, setDraft] = useState(member);
  const [status, setStatus] = useState<string | null>(null);
  const [motivationStatus, setMotivationStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [motivationSnapshot, setMotivationSnapshot] = useState<MotivationSnapshot>({ individualGoals: [] });

  useEffect(() => { setDraft(member); }, [member]);

  useEffect(() => {
    let ignore = false;
    setMotivationStatus('loading');
    loadMotivationSnapshot()
      .then((snapshot) => {
        if (!ignore) {
          setMotivationSnapshot(snapshot);
          setMotivationStatus('ready');
        }
      })
      .catch(() => {
        if (!ignore) setMotivationStatus('error');
      });
    return () => { ignore = true; };
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (draft.memberKind === 'child' && !draft.dateOfBirth) {
      setStatus('Date of birth is required for children.');
      return;
    }
    onChange({ ...draft, dateOfBirth: draft.memberKind === 'adult' ? draft.dateOfBirth || null : draft.dateOfBirth });
    setStatus('Saved member details.');
  }

  function requestRemove() {
    if (window.confirm(`Remove ${member.name} from normal household lists? Existing task and motivation references are kept.`)) onRemove(member);
  }

  const age = calculateAge(member.dateOfBirth);
  const ageBand = member.memberKind === 'child' && age !== null && age <= 5 ? 'early-child' : 'school-age';
  const memberGoals = goalsForMembers(motivationSnapshot, [member]);

  return (
    <section className="family-member-page" aria-label={`${member.name} family member page`}>
      <button className="back-link" type="button" onClick={onBack}>← Back to Home</button>
      <header className="family-member-hero child-progress-hero" style={{ '--member-color': member.displayColor } as CSSProperties}>
        <div className="family-member-hero-avatar"><FamilyAvatar member={member} size="large" /></div>
        <div>
          <p className="eyebrow">{member.memberKind === 'child' ? 'Progress page' : 'Household member'}</p>
          <h2>{member.name}</h2>
          <p>{ageContext(member, age)}</p>
          <button type="button" onClick={() => setIsEditingAvatar(true)}>Edit avatar</button>
        </div>
      </header>

      {member.memberKind === 'child' ? (
        <section className={`child-progress-view ${ageBand}`} aria-label={`${member.name} progress view`}>
          <FamilyGoalParticipation familyGoal={motivationSnapshot.familyGoal} status={motivationStatus} />
          <IndividualGoalProgress goals={memberGoals} ageBand={ageBand} member={member} />
        </section>
      ) : null}

      <div className="family-member-detail-grid">
        <article className="family-member-detail-card">
          <h3>Manage member</h3>
          <form className="family-member-form" onSubmit={submit}>
            <label>Name<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value, initials: buildInitials(event.target.value) })} required /></label>
            <label>Member type<select value={draft.memberKind} onChange={(event) => setDraft({ ...draft, memberKind: event.target.value as FamilyMemberKind, avatar: draft.avatar ? { ...draft.avatar, ageGroup: event.target.value as FamilyMemberKind } : draft.avatar })}><option value="adult">Adult</option><option value="child">Child</option></select></label>
            <label>Date of birth<input type="date" value={draft.dateOfBirth ?? ''} onChange={(event) => setDraft({ ...draft, dateOfBirth: event.target.value || null })} aria-required={draft.memberKind === 'child'} /></label>
            <label>Display color<input type="color" value={draft.displayColor} onChange={(event) => setDraft({ ...draft, displayColor: event.target.value })} /></label>
            <div className="family-member-actions"><button type="submit">Save details</button><button className="danger-button" type="button" onClick={requestRemove}>Remove member</button></div>
            {status ? <p role="status">{status}</p> : null}
          </form>
        </article>

        <article className="family-member-detail-card">
          <h3>Member details</h3>
          <dl className="family-member-detail-list">
            <div><dt>Name</dt><dd>{member.name}</dd></div>
            <div><dt>Type</dt><dd>{member.memberKind}</dd></div>
            <div><dt>Date of birth</dt><dd>{member.dateOfBirth ?? 'Not set'}</dd></div>
            <div><dt>Initials</dt><dd>{member.initials}</dd></div>
            <div><dt>Color</dt><dd><span className="color-swatch" style={{ background: member.displayColor }} aria-hidden="true" />{member.displayColor}</dd></div>
          </dl>
        </article>

        <article className="family-member-detail-card">
          <h3>Current avatar configuration</h3>
          {member.avatar ? <dl className="family-member-detail-list"><div><dt>Age group</dt><dd>{member.avatar.ageGroup}</dd></div><div><dt>Presentation</dt><dd>{member.avatar.presentation}</dd></div><div><dt>Skin tone</dt><dd>{member.avatar.skinTone}</dd></div><div><dt>Hair</dt><dd>{member.avatar.hairStyle} · {member.avatar.hairColor}</dd></div><div><dt>Glasses</dt><dd>{member.avatar.glasses ? 'Yes' : 'No'}</dd></div><div><dt>Shirt color</dt><dd>{member.avatar.shirtColor}</dd></div></dl> : <p>No avatar configuration yet. Initials are used as the fallback.</p>}
        </article>
      </div>

      {isEditingAvatar ? <FamilyAvatarEditor member={member} onChange={onChange} onClose={() => setIsEditingAvatar(false)} /> : null}
    </section>
  );
}

function FamilyGoalParticipation({ familyGoal, status }: { familyGoal?: MotivationFamilyGoal; status: 'loading' | 'ready' | 'error' }) {
  if (status === 'loading') return <article className="child-progress-card"><p className="eyebrow">Family goal</p><h3>Finding today’s team goal…</h3></article>;
  if (!familyGoal) return <article className="child-progress-card"><p className="eyebrow">Family goal</p><h3>{status === 'error' ? 'Family goal is resting right now' : 'No team goal yet'}</h3><p>When your family starts a shared goal, this page will show how everyone is helping together.</p></article>;
  const percent = clampProgress(familyGoal.currentProgress, familyGoal.targetCount);
  const remaining = Math.max(0, familyGoal.targetCount - familyGoal.currentProgress);
  return (
    <article className="child-progress-card family-goal-participation" aria-label="Family goal participation">
      <p className="eyebrow">Helping the family goal</p>
      <h3>{familyGoal.title}</h3>
      <p>{remaining > 0 ? `Every kind step helps. ${remaining} more ${familyGoal.unitLabel} and the family reaches it together.` : 'You did it together — time to celebrate the teamwork!'}</p>
      <div className="progress-bar" aria-label={`${familyGoal.currentProgress} of ${familyGoal.targetCount} ${familyGoal.unitLabel}`}><span style={{ width: `${percent}%` }} /></div>
      <strong>{familyGoal.currentProgress}/{familyGoal.targetCount} {familyGoal.unitLabel}</strong>
    </article>
  );
}

function IndividualGoalProgress({ goals, ageBand, member }: { goals: readonly MotivationIndividualGoal[]; ageBand: 'early-child' | 'school-age'; member: FamilyMember }) {
  return (
    <article className="child-progress-card" aria-label="Individual goals">
      <p className="eyebrow">My goals</p>
      <h3>{ageBand === 'early-child' ? 'Stars to collect' : 'Progress I am making'}</h3>
      {goals.length === 0 ? <p>No personal goals are active right now. Check back when a grown-up adds one on the Motivation page.</p> : null}
      <div className="child-goal-list">
        {goals.map((goal) => {
          const percent = clampProgress(goal.currentProgress, goal.targetCount);
          const remaining = Math.max(0, goal.targetCount - goal.currentProgress);
          return (
            <section className="child-goal-card" key={goal.id} style={{ '--member-color': member.displayColor } as CSSProperties}>
              <h4>{goal.title}</h4>
              <div className="star-row" aria-label={`${goal.currentProgress} of ${goal.targetCount} ${goal.unitLabel}`}>
                {Array.from({ length: goal.targetCount }, (_, index) => <span className={index < goal.currentProgress ? 'filled' : ''} key={index} aria-hidden="true">{index < goal.currentProgress ? '★' : '✓'}</span>)}
              </div>
              {ageBand === 'school-age' ? <div className="progress-bar" aria-label={`Progress for ${goal.title}`}><span style={{ width: `${percent}%` }} /></div> : null}
              <p>{remaining > 0 ? `${remaining} ${goal.unitLabel} to go. Keep going — you are building a great routine!` : 'Goal reached. Big checkmark for today’s effort!'}</p>
            </section>
          );
        })}
      </div>
    </article>
  );
}

function calculateAge(dateOfBirth?: string | null) {
  if (!dateOfBirth) return null;
  const birthDate = new Date(`${dateOfBirth}T00:00:00Z`);
  if (Number.isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const birthdayPassed = today.getUTCMonth() > birthDate.getUTCMonth() || (today.getUTCMonth() === birthDate.getUTCMonth() && today.getUTCDate() >= birthDate.getUTCDate());
  if (!birthdayPassed) age -= 1;
  return age;
}

function ageContext(member: FamilyMember, age: number | null) {
  if (member.memberKind !== 'child') return 'Family Members are household entities for shared home context. They are not users, login identities, profiles, or permission holders.';
  if (age === null) return 'A warm progress view for this child, using simple goals and family encouragement.';
  if (age <= 5) return `${age} years old · a simple, visual progress view with stars and gentle encouragement.`;
  if (age <= 12) return `${age} years old · goals, progress, and family teamwork in one encouraging place.`;
  return `${age} years old · household goals and progress without accounts, points, or rankings.`;
}

function buildInitials(name: string) {
  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
  return initials || 'M';
}
