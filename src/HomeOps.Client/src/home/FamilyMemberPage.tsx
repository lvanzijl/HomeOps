import { type CSSProperties, useState } from 'react';
import { FamilyAvatar } from './FamilyAvatar';
import { FamilyAvatarEditor } from './FamilyAvatarEditor';
import type { FamilyMember } from './familyMembers';

interface FamilyMemberPageProps {
  member: FamilyMember;
  onBack: () => void;
  onChange: (member: FamilyMember) => void;
}

export function FamilyMemberPage({ member, onBack, onChange }: FamilyMemberPageProps) {
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);

  return (
    <section className="family-member-page" aria-label={`${member.name} family member page`}>
      <button className="back-link" type="button" onClick={onBack}>← Back to Home</button>
      <header className="family-member-hero" style={{ '--member-color': member.displayColor } as CSSProperties}>
        <div className="family-member-hero-avatar">
          <FamilyAvatar member={member} size="large" />
        </div>
        <div>
          <p className="eyebrow">Household member</p>
          <h2>{member.name}</h2>
          <p>Family Members are household entities for shared home context. They are not users, login identities, profiles, or permission holders.</p>
          <button type="button" onClick={() => setIsEditingAvatar(true)}>Edit avatar</button>
        </div>
      </header>

      <div className="family-member-detail-grid">
        <article className="family-member-detail-card">
          <h3>Member details</h3>
          <dl className="family-member-detail-list">
            <div><dt>Name</dt><dd>{member.name}</dd></div>
            <div><dt>Initials</dt><dd>{member.initials}</dd></div>
            <div><dt>Color</dt><dd><span className="color-swatch" style={{ background: member.displayColor }} aria-hidden="true" />{member.displayColor}</dd></div>
          </dl>
        </article>

        <article className="family-member-detail-card">
          <h3>Current avatar configuration</h3>
          {member.avatar ? (
            <dl className="family-member-detail-list">
              <div><dt>Age group</dt><dd>{member.avatar.ageGroup}</dd></div>
              <div><dt>Presentation</dt><dd>{member.avatar.presentation}</dd></div>
              <div><dt>Skin tone</dt><dd>{member.avatar.skinTone}</dd></div>
              <div><dt>Hair</dt><dd>{member.avatar.hairStyle} · {member.avatar.hairColor}</dd></div>
              <div><dt>Glasses</dt><dd>{member.avatar.glasses ? 'Yes' : 'No'}</dd></div>
              <div><dt>Shirt color</dt><dd>{member.avatar.shirtColor}</dd></div>
            </dl>
          ) : <p>No avatar configuration yet. Initials are used as the fallback.</p>}
        </article>

        <article className="family-member-detail-card muted-card">
          <h3>Tasks</h3>
          <p>Coming later. Not implemented in this slice.</p>
        </article>

        <article className="family-member-detail-card muted-card">
          <h3>Points</h3>
          <p>Coming later. Not implemented in this slice.</p>
        </article>
      </div>

      {isEditingAvatar ? <FamilyAvatarEditor member={member} onChange={onChange} onClose={() => setIsEditingAvatar(false)} /> : null}
    </section>
  );
}
