import { type CSSProperties, type FormEvent, useEffect, useState } from 'react';
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

  useEffect(() => { setDraft(member); }, [member]);

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

  return (
    <section className="family-member-page" aria-label={`${member.name} family member page`}>
      <button className="back-link" type="button" onClick={onBack}>← Back to Home</button>
      <header className="family-member-hero" style={{ '--member-color': member.displayColor } as CSSProperties}>
        <div className="family-member-hero-avatar"><FamilyAvatar member={member} size="large" /></div>
        <div>
          <p className="eyebrow">Household member</p>
          <h2>{member.name}</h2>
          <p>Family Members are household entities for shared home context. They are not users, login identities, profiles, or permission holders.</p>
          <button type="button" onClick={() => setIsEditingAvatar(true)}>Edit avatar</button>
        </div>
      </header>

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

function buildInitials(name: string) {
  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
  return initials || 'M';
}
